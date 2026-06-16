import { Types } from 'mongoose'
import { Listing } from './listing.model'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Коды стран ISO 3166-1 numeric, встречающиеся в микрочипах ISO 11784.
 * Польша + страны, откуда реально импортируют щенков/производителей.
 * Диапазон 900–998 — коды производителей чипов (тоже валидны по ISO 11784).
 */
const MICROCHIP_COUNTRY_CODES = new Set([
  '616', // Polska
  '040', // Austria
  '056', // Belgia
  '100', // Bułgaria
  '112', // Białoruś
  '124', // Kanada
  '191', // Chorwacja
  '203', // Czechy
  '208', // Dania
  '233', // Estonia
  '246', // Finlandia
  '250', // Francja
  '276', // Niemcy
  '300', // Grecja
  '348', // Węgry
  '352', // Islandia
  '372', // Irlandia
  '380', // Włochy
  '428', // Łotwa
  '440', // Litwa
  '442', // Luksemburg
  '498', // Mołdawia
  '528', // Holandia
  '578', // Norwegia
  '620', // Portugalia
  '642', // Rumunia
  '643', // Rosja
  '688', // Serbia
  '703', // Słowacja
  '705', // Słowenia
  '724', // Hiszpania
  '752', // Szwecja
  '756', // Szwajcaria
  '804', // Ukraina
  '826', // Wielka Brytania
  '840', // USA
])

/**
 * Валидация формата микрочипа ISO 11784/11785
 */
export function validateMicrochipFormat(chip: string): ValidationResult {
  // Проверка формата (15 цифр)
  if (!/^\d{15}$/.test(chip)) {
    return { valid: false, error: 'Mikroczip musi zawierać dokładnie 15 cyfr' }
  }

  // Первые 3 цифры — код страны (ISO 3166) или код производителя (900–998)
  const prefix = chip.substring(0, 3)
  const prefixNum = parseInt(prefix, 10)
  const isManufacturerCode = prefixNum >= 900 && prefixNum <= 998

  if (!MICROCHIP_COUNTRY_CODES.has(prefix) && !isManufacturerCode) {
    return {
      valid: false,
      error: 'Nieprawidłowy prefiks mikroczipa — pierwsze 3 cyfry muszą być kodem kraju ISO (np. 616 dla Polski) lub kodem producenta (900–998)',
    }
  }

  return { valid: true }
}

/**
 * Проверка уникальности микрочипа в базе данных
 */
export async function checkMicrochipUniqueness(
  microchipNumber: string,
  excludeListingId?: Types.ObjectId
): Promise<ValidationResult> {
  const query: { microchipNumber: string; _id?: { $ne: Types.ObjectId } } = {
    microchipNumber,
  }

  if (excludeListingId) {
    query._id = { $ne: excludeListingId }
  }

  const existing = await Listing.findOne(query)

  if (existing) {
    return {
      valid: false,
      error: 'Ten mikroczip jest już używany w innym ogłoszeniu',
    }
  }

  return { valid: true }
}

/**
 * Валидация номера родословной.
 * Родители могут иметь родословные не только ZKwP (VDH, ÖKV, KC и другие
 * организации FCI), поэтому жёсткого формата нет — принимаем любой
 * буквенно-цифровой номер с типичными разделителями. Соответствие документу
 * проверяет админ при модерации.
 */
export function validatePedigreeNumber(number?: string): ValidationResult {
  if (!number) {
    return { valid: true } // Опциональное поле
  }

  const genericPattern = /^[\p{L}\d][\p{L}\d .\-/]{1,29}$/u

  if (!genericPattern.test(number)) {
    return {
      valid: false,
      error: 'Nieprawidłowy numer rodowodu — dozwolone litery, cyfry i znaki . - / (od 2 do 30 znaków), np. PKR.VIII-12345',
    }
  }

  return { valid: true }
}

/**
 * Проверка соответствия данных объявления
 */
export interface DataConsistencyCheck {
  breedMatchesBreeder: boolean
  datesAreValid: boolean
  documentsConsistent: boolean
}

export function checkDataConsistency(data: {
  breed: Types.ObjectId
  breederBreeds: Types.ObjectId[]
  birthDate: Date
  hasPedigree: boolean
  pedigreeDocument?: Types.ObjectId
  hasVetPassport: boolean
  vetPassportDocument?: Types.ObjectId
  hasMetric: boolean
  metricDocument?: Types.ObjectId
}): DataConsistencyCheck {
  const result: DataConsistencyCheck = {
    breedMatchesBreeder: true,
    datesAreValid: true,
    documentsConsistent: true,
  }

  // Проверка соответствия породы породам заводчика
  // Если у заводчика нет пород, разрешаем любую породу
  // Если породы есть, проверяем соответствие
  if (data.breederBreeds.length > 0) {
    if (!data.breederBreeds.some((id) => id.toString() === data.breed.toString())) {
      result.breedMatchesBreeder = false
    }
  }
  // Если список пород пустой, считаем что проверка пройдена (заводчик может работать с любой породой)

  // Проверка дат
  const now = new Date()
  const sixWeeksAgo = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000)

  if (data.birthDate > now) {
    result.datesAreValid = false // Дата рождения не может быть в будущем
  }

  if (data.birthDate > sixWeeksAgo) {
    result.datesAreValid = false // Минимум 6 недель от рождения
  }

  // Проверка соответствия документов
  if (data.hasPedigree && !data.pedigreeDocument) {
    result.documentsConsistent = false
  }

  if (data.hasVetPassport && !data.vetPassportDocument) {
    result.documentsConsistent = false
  }

  if (data.hasMetric && !data.metricDocument) {
    result.documentsConsistent = false
  }

  return result
}

/**
 * Полная валидация данных объявления.
 *
 * `partial: true` — режим черновика: проверяются только заполненные поля
 * (формат/уникальность чипа, формат родословных), без правила 6 недель,
 * соответствия породы и комплектности документов. Полная проверка выполняется
 * при отправке на модерацию (draft/rejected → pending).
 */
export async function validateListingData(params: {
  microchipNumber?: string
  fatherPedigreeNumber?: string
  motherPedigreeNumber?: string
  breed: Types.ObjectId
  breederBreeds: Types.ObjectId[]
  birthDate: Date
  hasPedigree: boolean
  pedigreeDocument?: Types.ObjectId
  hasVetPassport: boolean
  vetPassportDocument?: Types.ObjectId
  hasMetric: boolean
  metricDocument?: Types.ObjectId
  excludeListingId?: Types.ObjectId
  partial?: boolean
}): Promise<{
  valid: boolean
  errors: string[]
  autoChecks: {
    microchipFormatValid: boolean
    pedigreeFormatValid: boolean
    documentsUploaded: boolean
    dataConsistency: boolean
  }
}> {
  const errors: string[] = []
  const autoChecks = {
    microchipFormatValid: false,
    pedigreeFormatValid: false,
    documentsUploaded: false,
    dataConsistency: false,
  }

  // 1-2. Валидация микрочипа (формат + уникальность).
  // В partial-режиме чип может отсутствовать; если заполнен — проверяем всегда
  if (params.microchipNumber) {
    const microchipCheck = validateMicrochipFormat(params.microchipNumber)
    autoChecks.microchipFormatValid = microchipCheck.valid
    if (!microchipCheck.valid && microchipCheck.error) {
      errors.push(microchipCheck.error)
    }

    const uniquenessCheck = await checkMicrochipUniqueness(
      params.microchipNumber,
      params.excludeListingId
    )
    if (!uniquenessCheck.valid && uniquenessCheck.error) {
      errors.push(uniquenessCheck.error)
    }
  } else if (!params.partial) {
    errors.push('Numer mikroczipa jest wymagany')
  }

  // 3. Валидация родословных родителей
  const fatherPedigreeCheck = validatePedigreeNumber(params.fatherPedigreeNumber)
  const motherPedigreeCheck = validatePedigreeNumber(params.motherPedigreeNumber)
  autoChecks.pedigreeFormatValid = fatherPedigreeCheck.valid && motherPedigreeCheck.valid
  if (!fatherPedigreeCheck.valid && fatherPedigreeCheck.error) {
    errors.push(`Rodowód ojca: ${fatherPedigreeCheck.error}`)
  }
  if (!motherPedigreeCheck.valid && motherPedigreeCheck.error) {
    errors.push(`Rodowód matki: ${motherPedigreeCheck.error}`)
  }

  // 4. Проверка загрузки документов (для черновика не обязательна)
  const documentsUploaded =
    (!params.hasPedigree || !!params.pedigreeDocument) &&
    (!params.hasVetPassport || !!params.vetPassportDocument) &&
    (!params.hasMetric || !!params.metricDocument)
  autoChecks.documentsUploaded = documentsUploaded
  if (!documentsUploaded && !params.partial) {
    errors.push('Nie wszystkie zaznaczone dokumenty zostały przesłane')
  }

  // 5. Проверка соответствия данных
  const consistencyCheck = checkDataConsistency({
    breed: params.breed,
    breederBreeds: params.breederBreeds,
    birthDate: params.birthDate,
    hasPedigree: params.hasPedigree,
    pedigreeDocument: params.pedigreeDocument,
    hasVetPassport: params.hasVetPassport,
    vetPassportDocument: params.vetPassportDocument,
    hasMetric: params.hasMetric,
    metricDocument: params.metricDocument,
  })
  autoChecks.dataConsistency =
    consistencyCheck.breedMatchesBreeder &&
    consistencyCheck.datesAreValid &&
    consistencyCheck.documentsConsistent

  // Для черновика возраст щенка и комплектность документов не блокируют
  // сохранение — заводчик может завести объявление для новорождённого помёта.
  // Несовпадение породы с породами заводчика НЕ блокирует отправку:
  // заводчик может начать работать с новой породой, а UI редактирования
  // своих пород в профиле пока нет. Флаг breedMatchesBreeder остаётся
  // в autoChecks — админ видит расхождение при модерации.
  if (!params.partial) {
    if (!consistencyCheck.datesAreValid) {
      errors.push('Nieprawidłowa data urodzenia (szczeniak musi mieć co najmniej 6 tygodni)')
    }
    if (!consistencyCheck.documentsConsistent) {
      errors.push('Niezgodność między zaznaczonymi a przesłanymi dokumentami')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    autoChecks,
  }
}

