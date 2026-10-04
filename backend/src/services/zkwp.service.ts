/**
 * ZKwP Chip Verification Service
 * Проверка микрочипа по публичной базе Związku Kynologicznego w Polsce
 * (собаки, которым oddziały ZKwP выдали metryki, + импорты после ностряфикации).
 *
 * Официального API нет — используется публичная поисковая форма
 * https://zkwp.pl/baza_chip.php (POST chip=<15 цифр>). Best-effort:
 * сервис никогда не бросает, любые сбои → status 'unavailable'.
 */

export type ZkwpChipStatus = 'found' | 'not_found' | 'unavailable'

export interface ZkwpDogInfo {
  name?: string
  kennelName?: string
  sex?: string
  birthDate?: string
  branch?: string
  rawText?: string
}

export interface ZkwpChipResult {
  status: ZkwpChipStatus
  dog?: ZkwpDogInfo
  error?: string
}

/** Маркеры «нет в базе». Основной — текущая формулировка zkwp.pl; остальные —
 * страховка от переформулировки: без них сообщение об ошибке попало бы в
 * rawText-фолбэк и было бы принято за найденную собаку. */
const NOT_FOUND_MARKERS = [
  /nie jest zarejestrowan/i,
  /numer jest b[łl][ęe]dny/i,
  /nie widnieje/i,
  /nie znaleziono/i,
  /brak w bazie/i,
]
const RESULT_ZONE_START = '</form>'
const RESULT_ZONE_END = 'ZAGINIONE'
const REQUEST_TIMEOUT_MS = 5000
const RAW_TEXT_LIMIT = 500

/** Пары «метка → поле результата»; разметка found-ответа не задокументирована,
 * поэтому метки подобраны по описанию на странице базы (nazwa, przydomek
 * hodowlany, płeć, data urodzenia, oddział) и парсятся без жёсткой привязки. */
const FIELD_PATTERNS: Array<{ key: keyof ZkwpDogInfo; pattern: RegExp }> = [
  { key: 'name', pattern: /nazwa(?:\s+psa)?\s*[:-]\s*(.+)/i },
  { key: 'kennelName', pattern: /przydomek(?:\s+hodowlany)?\s*[:-]\s*(.+)/i },
  { key: 'sex', pattern: /p[łl]e[ćc]\s*[:-]\s*(.+)/i },
  { key: 'birthDate', pattern: /data\s+urodzenia\s*[:-]\s*(.+)/i },
  { key: 'branch', pattern: /oddzia[łl](?:\s+zkwp)?\s*[:-]\s*(.+)/i },
]

/** Дата из ответа ZKwP → Date (dd.mm.yyyy / dd-mm-yyyy / yyyy-mm-dd).
 * null, если формат не распознан — тогда сверку с объявлением не делаем. */
export function parseZkwpDate(value: string): Date | null {
  const trimmed = value.trim()

  let match = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
  if (match) {
    const [, day, month, year] = match
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    return isNaN(date.getTime()) ? null : date
  }

  match = trimmed.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (match) {
    const [, year, month, day] = match
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

function stripHtml(fragment: string): string {
  return fragment
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(?:br|\/tr|\/td|\/p|\/h\d|\/li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&oacute;/gi, 'ó')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/**
 * Разбор HTML-ответа baza_chip.php. Экспортирован для юнит-тестов.
 * Три ступени: маркер «не найден» → поля по меткам → rawText-фолбэк.
 */
export function parseZkwpChipResponse(html: string): ZkwpChipResult {
  if (NOT_FOUND_MARKERS.some((marker) => marker.test(html))) {
    return { status: 'not_found' }
  }

  const startIdx = html.indexOf(RESULT_ZONE_START)
  if (startIdx === -1) {
    return { status: 'unavailable', error: 'Nierozpoznana struktura odpowiedzi ZKwP' }
  }

  const zoneStart = startIdx + RESULT_ZONE_START.length
  const endIdx = html.indexOf(RESULT_ZONE_END, zoneStart)
  const zone = html.slice(zoneStart, endIdx === -1 ? undefined : endIdx)
  // Зона заканчивается заголовком секции «ZAGINIONE — ZNALEZIONE»;
  // отрезаем его открывающий <h4>, попавший в срез
  const text = stripHtml(zone.replace(/<h4[\s\S]*$/i, ''))

  if (!text) {
    // Пустая зона = страница отдана без результата (как при GET) —
    // считаем ответ нераспознанным, а не «собака не найдена»
    return { status: 'unavailable', error: 'Pusta odpowiedź ZKwP (brak wyniku)' }
  }

  const dog: ZkwpDogInfo = {}
  for (const line of text.split('\n')) {
    for (const { key, pattern } of FIELD_PATTERNS) {
      if (dog[key]) continue
      const match = line.match(pattern)
      if (match) {
        dog[key] = match[1].trim()
      }
    }
  }

  if (Object.keys(dog).length === 0) {
    // Структуру не распознали — отдаём сырой текст блока, админ увидит данные
    dog.rawText = text.slice(0, RAW_TEXT_LIMIT)
  }

  return { status: 'found', dog }
}

class ZkwpService {
  private readonly baseUrl = 'https://zkwp.pl/baza_chip.php'

  private normalizeChip(chip: string): string {
    return chip.replace(/[\s-]/g, '')
  }

  private async fetchOnce(chip: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PedigreeHub/1.0 (weryfikacja mikroczipow ogloszen; kontakt: kontakt@pedigreehub.pl)',
        },
        body: new URLSearchParams({ chip }).toString(),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.text()
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Проверка чипа в базе ZKwP. Никогда не бросает.
   * Формат чипа здесь не валидируется (это делает validateMicrochipFormat) —
   * не-15-значный номер просто не отправляем.
   */
  async checkMicrochip(chip: string): Promise<ZkwpChipResult> {
    const normalized = this.normalizeChip(chip)

    if (!/^\d{15}$/.test(normalized)) {
      return { status: 'not_found' }
    }

    try {
      let html: string
      try {
        html = await this.fetchOnce(normalized)
      } catch {
        // Один повтор при сетевой ошибке/таймауте/HTTP-ошибке
        html = await this.fetchOnce(normalized)
      }
      return parseZkwpChipResponse(html)
    } catch (error) {
      console.error('ZKwP chip check error:', error)
      return {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Błąd połączenia z bazą ZKwP',
      }
    }
  }
}

export const zkwpService = new ZkwpService()
