import { Types } from 'mongoose'
import { Listing, IListing } from './listing.model'
import { Breeder } from '../breeders/breeder.model'
import { cloudinaryService } from '../../services/cloudinary.service'
import { AppError } from '../../middleware/error.middleware'
import { validateListingData } from './listing.validation'
import { zkwpService, parseZkwpDate } from '../../services/zkwp.service'
import { env } from '../../config/env'

type ZkwpChipCheck = NonNullable<NonNullable<IListing['autoChecks']>['zkwpChip']>

interface CreateListingParams {
  breederId: Types.ObjectId
  breed: Types.ObjectId
  title: string
  description?: string // необязательно для черновика
  price: number
  currency: 'PLN' | 'EUR'
  puppyName?: string
  birthDate: Date
  gender: 'male' | 'female'
  color: string
  microchipNumber?: string // необязательно для черновика
  hasPedigree: boolean
  pedigreeDocument?: Types.ObjectId
  hasVetPassport: boolean
  vetPassportDocument?: Types.ObjectId
  hasMetric: boolean
  metricDocument?: Types.ObjectId
  father: {
    name: string
    pedigreeNumber?: string
    titles?: string[]
    photo?: string
  }
  mother: {
    name: string
    pedigreeNumber?: string
    titles?: string[]
    photo?: string
  }
  photos: string[]
  videos?: string[]
  status: 'draft' | 'pending'
}

interface UpdateListingParams extends Partial<CreateListingParams> {
  listingId: Types.ObjectId
  breederId: Types.ObjectId
  /** URL уже загруженных фото, которые нужно оставить (подмножество listing.photos) */
  keepPhotos?: string[]
  /** URL только что загруженных фото (из контроллера, не из body) */
  newPhotoUrls?: string[]
}

/**
 * Поля, которые заводчик может менять через PATCH /listings/:id.
 * Всё остальное (status, verificationStatus, photos, документы, счётчики,
 * location, breederId) выставляется только сервером.
 */
export const EDITABLE_LISTING_FIELDS = [
  'title',
  'description',
  'price',
  'currency',
  'puppyName',
  'birthDate',
  'gender',
  'color',
  'microchipNumber',
  'breed',
  'hasPedigree',
  'hasVetPassport',
  'hasMetric',
  'father',
  'mother',
  'videos',
] as const

type EditableListingField = (typeof EDITABLE_LISTING_FIELDS)[number]

/**
 * Допустимые переходы статусов для владельца объявления.
 * Модерация (pending → active/rejected) — только через админские эндпоинты.
 */
const OWNER_STATUS_TRANSITIONS: Record<string, IListing['status'][]> = {
  draft: ['pending'],
  pending: ['draft'],
  rejected: ['pending'],
  active: ['reserved', 'sold', 'archived'],
  reserved: ['active', 'sold', 'archived'],
  sold: ['active', 'archived'],
  archived: ['active'],
}

class ListingService {
  /**
   * Загрузка фото на Cloudinary
   */
  async uploadPhoto(file: Express.Multer.File): Promise<string> {
    const result = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'listings/photos',
      resourceType: 'image',
      transformation: { quality: 'auto', fetch_format: 'auto' },
      originalName: file.originalname,
    })

    return result.secureUrl
  }

  /**
   * Загрузка нескольких фото
   */
  async uploadPhotos(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadPhoto(file))
    return Promise.all(uploadPromises)
  }

  /**
   * Загрузка фото родителя
   */
  async uploadParentPhoto(file: Express.Multer.File): Promise<string> {
    const result = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'listings/parents',
      resourceType: 'image',
      transformation: { quality: 'auto', fetch_format: 'auto' },
      originalName: file.originalname,
    })

    return result.secureUrl
  }

  /**
   * Best-effort проверка чипа в базе ZKwP при отправке на модерацию.
   * Никогда не блокирует сабмит: сбой → status 'unavailable'.
   * Положительный результат кэшируется по checkedChip (повторная отправка
   * с тем же чипом не дёргает zkwp.pl); not_found/unavailable перепроверяются —
   * собака могла появиться в базе позже.
   */
  private async buildZkwpChipCheck(
    microchipNumber: string | undefined,
    birthDate: Date,
    previous?: ZkwpChipCheck
  ): Promise<ZkwpChipCheck | undefined> {
    // Копия в плоский объект: Mongoose инициализирует вложенный путь пустым {}
    // и отдаёт «живую» ссылку, которая обнуляется при переприсвоении autoChecks
    const prev = previous?.status ? { ...previous } : undefined

    if (env.ZKWP_CHECK_ENABLED !== 'true' || !microchipNumber) {
      return prev
    }

    if (prev && prev.checkedChip === microchipNumber && prev.status === 'found') {
      return prev
    }

    const result = await zkwpService.checkMicrochip(microchipNumber)

    const check: ZkwpChipCheck = {
      status: result.status,
      dogName: result.dog?.name,
      kennelName: result.dog?.kennelName,
      sex: result.dog?.sex,
      birthDate: result.dog?.birthDate,
      branch: result.dog?.branch,
      rawText: result.dog?.rawText,
      checkedAt: new Date(),
      checkedChip: microchipNumber,
    }

    // Сверка даты рождения с объявлением — только если дату удалось распарсить
    if (result.status === 'found' && result.dog?.birthDate) {
      const zkwpDate = parseZkwpDate(result.dog.birthDate)
      if (zkwpDate) {
        check.birthDateMatches =
          zkwpDate.getUTCFullYear() === birthDate.getUTCFullYear() &&
          zkwpDate.getUTCMonth() === birthDate.getUTCMonth() &&
          zkwpDate.getUTCDate() === birthDate.getUTCDate()
      }
    }

    return check
  }

  /**
   * Создание объявления
   */
  async create(params: CreateListingParams): Promise<IListing> {
    // Проверка существования заводчика
    const breeder = await Breeder.findById(params.breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie został znaleziony', 404)
    }

    // Проверка верификации заводчика
    if (breeder.verification.status !== 'verified') {
      throw new AppError(
        'Hodowca nie jest zweryfikowany. Zakończ weryfikację przed tworzeniem ogłoszeń',
        403
      )
    }

    // Получение пород заводчика
    const breederBreeds = breeder.breeds || []

    // Валидация данных; для черновика — только заполненные поля
    const validation = await validateListingData({
      microchipNumber: params.microchipNumber,
      fatherPedigreeNumber: params.father.pedigreeNumber,
      motherPedigreeNumber: params.mother.pedigreeNumber,
      breed: params.breed,
      breederBreeds,
      birthDate: params.birthDate,
      hasPedigree: params.hasPedigree,
      pedigreeDocument: params.pedigreeDocument,
      hasVetPassport: params.hasVetPassport,
      vetPassportDocument: params.vetPassportDocument,
      hasMetric: params.hasMetric,
      metricDocument: params.metricDocument,
      partial: params.status === 'draft',
    })

    if (!validation.valid) {
      throw new AppError(`Błąd walidacji: ${validation.errors.join(', ')}`, 400)
    }

    // Получение локации из профиля заводчика
    const location = {
      region: breeder.region,
      city: breeder.city,
    }

    // Проверка чипа в базе ZKwP — только при отправке на модерацию
    const zkwpChip =
      params.status === 'pending'
        ? await this.buildZkwpChipCheck(params.microchipNumber, params.birthDate)
        : undefined

    // Создание объявления
    const listing = await Listing.create({
      ...params,
      location,
      autoChecks: {
        ...validation.autoChecks,
        // Mongoose не кастит явный undefined во вложенном пути — ключ только при наличии
        ...(zkwpChip ? { zkwpChip } : {}),
        passedAt: new Date(),
      },
      viewsCount: 0,
      inquiriesCount: 0,
      favoritesCount: 0,
      verificationStatus: 'pending',
      publishedAt: params.status === 'pending' ? new Date() : undefined,
    })

    return listing
  }

  /**
   * Получение объявления по ID
   */
  async getById(listingId: Types.ObjectId): Promise<IListing | null> {
    return Listing.findById(listingId)
      .populate('breederId', 'kennelName city region verification.status verification.level rating reviewsCount')
      .populate('breed', 'name nameEn')
      .populate('pedigreeDocument')
      .populate('vetPassportDocument')
      .populate('metricDocument')
  }

  /**
   * Получение объявлений заводчика
   */
  async getByBreederId(
    breederId: Types.ObjectId,
    status?: string
  ): Promise<IListing[]> {
    const query: { breederId: Types.ObjectId; status?: string } = { breederId }
    if (status) {
      query.status = status
    }

    return Listing.find(query)
      .populate('breed', 'name')
      .sort({ createdAt: -1 })
  }

  /**
   * Обновление объявления
   */
  async update(params: UpdateListingParams): Promise<IListing> {
    const listing = await Listing.findOne({
      _id: params.listingId,
      breederId: params.breederId,
    })

    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404)
    }

    // Если статус не draft и не отклонено, нельзя редактировать некоторые поля
    if (listing.status !== 'draft' && listing.verificationStatus !== 'rejected') {
      throw new AppError(
        'Można edytować tylko szkice i odrzucone ogłoszenia',
        403
      )
    }

    // Валидация заполненных полей (partial: полная комплектность проверяется
    // при отправке на модерацию в updateStatus)
    const breeder = await Breeder.findById(params.breederId)
    if (!breeder) {
      throw new AppError('Hodowca nie został znaleziony', 404)
    }

    const validation = await validateListingData({
      microchipNumber: params.microchipNumber ?? listing.microchipNumber,
      fatherPedigreeNumber:
        params.father?.pedigreeNumber ?? listing.father?.pedigreeNumber,
      motherPedigreeNumber:
        params.mother?.pedigreeNumber ?? listing.mother?.pedigreeNumber,
      breed: params.breed || listing.breed,
      breederBreeds: breeder.breeds || [],
      birthDate: params.birthDate || listing.birthDate,
      hasPedigree: params.hasPedigree ?? listing.hasPedigree,
      pedigreeDocument: params.pedigreeDocument ?? listing.pedigreeDocument,
      hasVetPassport: params.hasVetPassport ?? listing.hasVetPassport,
      vetPassportDocument:
        params.vetPassportDocument ?? listing.vetPassportDocument,
      hasMetric: params.hasMetric ?? listing.hasMetric,
      metricDocument: params.metricDocument ?? listing.metricDocument,
      excludeListingId: listing._id,
      partial: true,
    })

    if (!validation.valid) {
      throw new AppError(`Błąd walidacji: ${validation.errors.join(', ')}`, 400)
    }

    // Результат проверки ZKwP переносим как есть (плоской копией — живая
    // ссылка Mongoose обнуляется при переприсвоении autoChecks); актуальность
    // по чипу решает buildZkwpChipCheck при отправке на модерацию
    const previousZkwpChip = listing.autoChecks?.zkwpChip?.status
      ? { ...listing.autoChecks.zkwpChip }
      : undefined
    listing.autoChecks = {
      ...validation.autoChecks,
      ...(previousZkwpChip ? { zkwpChip: previousZkwpChip } : {}),
      passedAt: new Date(),
    }

    // Фото родителей: новый файл заменяет, отсутствие — сохраняет старое
    if (params.father) {
      params.father = {
        ...params.father,
        photo: params.father.photo ?? listing.father?.photo,
      }
    }
    if (params.mother) {
      params.mother = {
        ...params.mother,
        photo: params.mother.photo ?? listing.mother?.photo,
      }
    }

    // Обновление только разрешённых полей — защита от mass assignment
    // (status/verificationStatus/photos/документы клиент менять не может)
    for (const field of EDITABLE_LISTING_FIELDS) {
      if (params[field as EditableListingField] !== undefined) {
        listing.set(field, params[field as EditableListingField])
      }
    }

    // Фото объявления: keepPhotos — какие из существующих оставить,
    // newPhotoUrls — что дозагрузили (оба формируются контроллером)
    if (params.keepPhotos !== undefined || params.newPhotoUrls !== undefined) {
      const keep = params.keepPhotos ?? listing.photos
      if (keep.some((url) => !listing.photos.includes(url))) {
        throw new AppError('Nieprawidłowa lista zdjęć do zachowania', 400)
      }
      const merged = [...keep, ...(params.newPhotoUrls ?? [])]
      if (merged.length > 10) {
        throw new AppError('Maksymalnie 10 zdjęć', 400)
      }
      listing.photos = merged
    }

    // Документы: новый файл заменяет ссылку; снятая галочка очищает её
    if (params.pedigreeDocument !== undefined) {
      listing.pedigreeDocument = params.pedigreeDocument
    } else if (params.hasPedigree === false) {
      listing.pedigreeDocument = undefined
    }
    if (params.vetPassportDocument !== undefined) {
      listing.vetPassportDocument = params.vetPassportDocument
    } else if (params.hasVetPassport === false) {
      listing.vetPassportDocument = undefined
    }
    if (params.metricDocument !== undefined) {
      listing.metricDocument = params.metricDocument
    } else if (params.hasMetric === false) {
      listing.metricDocument = undefined
    }

    await listing.save()
    return listing
  }

  /**
   * Удаление объявления
   */
  async delete(listingId: Types.ObjectId, breederId: Types.ObjectId): Promise<void> {
    const listing = await Listing.findOne({
      _id: listingId,
      breederId,
    })

    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404)
    }

    // Удаление фото из Cloudinary (опционально, можно оставить)
    // TODO: Реализовать удаление фото при необходимости

    await listing.deleteOne()
  }

  /**
   * Изменение статуса объявления
   */
  async updateStatus(
    listingId: Types.ObjectId,
    breederId: Types.ObjectId,
    status: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'reserved' | 'archived'
  ): Promise<IListing> {
    const listing = await Listing.findOne({
      _id: listingId,
      breederId,
    })

    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404)
    }

    const allowedTargets = OWNER_STATUS_TRANSITIONS[listing.status] || []
    if (!allowedTargets.includes(status)) {
      throw new AppError(
        `Nie można zmienić statusu z "${listing.status}" na "${status}"`,
        400,
        'INVALID_STATUS_TRANSITION'
      )
    }

    // Активация (в т.ч. из archived/reserved) только для проверенных объявлений
    if (status === 'active' && listing.verificationStatus !== 'verified') {
      throw new AppError(
        'Ogłoszenie musi przejść weryfikację, aby zostać aktywowane',
        400,
        'NOT_VERIFIED'
      )
    }

    if (status === 'pending') {
      // Отправка на модерацию: черновик мог быть сохранён частично,
      // поэтому здесь полная проверка комплектности + бизнес-валидация
      const missing: string[] = []
      if (!listing.description) missing.push('opis')
      if (!listing.microchipNumber) missing.push('numer mikroczipa')
      if ((listing.photos?.length ?? 0) < 3) missing.push('minimum 3 zdjęcia')
      if (missing.length > 0) {
        throw new AppError(
          `Ogłoszenie jest niekompletne: ${missing.join(', ')}`,
          400,
          'INCOMPLETE_LISTING'
        )
      }

      const breeder = await Breeder.findById(breederId)
      const validation = await validateListingData({
        microchipNumber: listing.microchipNumber,
        fatherPedigreeNumber: listing.father?.pedigreeNumber,
        motherPedigreeNumber: listing.mother?.pedigreeNumber,
        breed: listing.breed,
        breederBreeds: breeder?.breeds || [],
        birthDate: listing.birthDate,
        hasPedigree: listing.hasPedigree,
        pedigreeDocument: listing.pedigreeDocument,
        hasVetPassport: listing.hasVetPassport,
        vetPassportDocument: listing.vetPassportDocument,
        hasMetric: listing.hasMetric,
        metricDocument: listing.metricDocument,
        excludeListingId: listing._id,
      })

      if (!validation.valid) {
        throw new AppError(`Błąd walidacji: ${validation.errors.join(', ')}`, 400)
      }

      // Свежие autoChecks для модератора
      const zkwpChip = await this.buildZkwpChipCheck(
        listing.microchipNumber,
        listing.birthDate,
        listing.autoChecks?.zkwpChip
      )
      listing.autoChecks = {
        ...validation.autoChecks,
        // Mongoose не кастит явный undefined во вложенном пути — ключ только при наличии
        ...(zkwpChip ? { zkwpChip } : {}),
        passedAt: new Date(),
      }
    }

    listing.status = status

    if (status === 'pending') {
      // Отправка на модерацию (в т.ч. повторная после отклонения)
      listing.verificationStatus = 'pending'
      listing.verificationNote = undefined
      if (!listing.publishedAt) {
        listing.publishedAt = new Date()
      }
    }

    if (status === 'sold') {
      listing.soldAt = new Date()
    }

    await listing.save()
    return listing
  }

  /**
   * Получение объявлений для каталога (публичные)
   */
  async getPublicListings(params: {
    breed?: Types.ObjectId
    breederId?: Types.ObjectId
    region?: string
    priceMin?: number
    priceMax?: number
    gender?: 'male' | 'female'
    verified?: boolean
    sort?: 'newest' | 'price_asc' | 'price_desc'
    page?: number
    limit?: number
  }): Promise<{
    listings: IListing[]
    total: number
    pages: number
  }> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const query: any = {
      status: 'active',
      verificationStatus: 'verified',
    }

    if (params.breed) {
      query.breed = params.breed
    }

    if (params.breederId) {
      query.breederId = params.breederId
    }

    if (params.region) {
      query['location.region'] = params.region
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      query.price = {}
      if (params.priceMin !== undefined) {
        query.price.$gte = params.priceMin
      }
      if (params.priceMax !== undefined) {
        query.price.$lte = params.priceMax
      }
    }

    if (params.gender) {
      query.gender = params.gender
    }

    if (params.verified) {
      query.verificationStatus = 'verified'
    }

    // Сортировка каталога
    // _id вторым ключом — стабильный порядок при равных значениях (пагинация без дублей)
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { publishedAt: -1, _id: -1 },
      price_asc: { price: 1, _id: 1 },
      price_desc: { price: -1, _id: 1 },
    }
    const sort = sortMap[params.sort || 'newest'] || sortMap.newest

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('breederId', 'kennelName verification.status verification.level rating')
        .populate('breed', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ])

    return {
      listings,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  /**
   * Получение объявлений для модерации (для админа)
   */
  async getModerationListings(params: {
    status?: 'pending' | 'active' | 'rejected' | 'all'
    search?: string
    page?: number
    limit?: number
  }): Promise<{
    listings: IListing[]
    total: number
    pages: number
  }> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const query: any = {}

    if (params.status && params.status !== 'all') {
      query.status = params.status
    }

    if (params.search) {
      query.$or = [
        { title: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
      ]
    }

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate({
          path: 'breederId',
          select: 'kennelName region city userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName email',
          },
        })
        .populate('breed', 'name nameEn')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ])

    return {
      listings,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  /**
   * Получение объявления по ID для админа (с полной информацией)
   */
  async getByIdForAdmin(listingId: Types.ObjectId): Promise<IListing | null> {
    return Listing.findById(listingId)
      .populate({
        path: 'breederId',
        select: 'kennelName region city userId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email',
        },
      })
      .populate('breed', 'name nameEn')
      .populate('pedigreeDocument')
      .populate('vetPassportDocument')
      .populate('metricDocument')
  }

  /**
   * Одобрение объявления (для админа)
   */
  async approveListing(
    listingId: Types.ObjectId,
    adminId: Types.ObjectId
  ): Promise<IListing> {
    const listing = await Listing.findById(listingId)

    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404)
    }

    if (listing.status !== 'pending') {
      throw new AppError('Można zatwierdzać tylko ogłoszenia o statusie pending', 400)
    }

    listing.status = 'active'
    listing.verificationStatus = 'verified'
    listing.verifiedAt = new Date()
    listing.verifiedBy = adminId

    await listing.save()
    return listing
  }

  /**
   * Отклонение объявления (для админа)
   */
  async rejectListing(
    listingId: Types.ObjectId,
    adminId: Types.ObjectId,
    reason: string
  ): Promise<IListing> {
    const listing = await Listing.findById(listingId)

    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404)
    }

    if (listing.status !== 'pending') {
      throw new AppError('Można odrzucać tylko ogłoszenia o statusie pending', 400)
    }

    listing.status = 'rejected'
    listing.verificationStatus = 'rejected'
    listing.verificationNote = reason
    listing.verifiedAt = new Date()
    listing.verifiedBy = adminId

    await listing.save()
    return listing
  }
}

export const listingService = new ListingService()

