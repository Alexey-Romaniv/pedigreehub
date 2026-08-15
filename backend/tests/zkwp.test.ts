/**
 * Юнит-тесты zkwp.service — парсер ответов baza_chip.php и сетевое поведение.
 * Живой сайт не дёргается: HTML — из фикстур, fetch мокается.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  zkwpService,
  parseZkwpChipResponse,
  parseZkwpDate,
} from '../src/services/zkwp.service'

const fixture = (name: string): string =>
  readFileSync(
    fileURLToPath(new URL(`../src/services/__fixtures__/zkwp/${name}`, import.meta.url)),
    'utf-8'
  )

describe('parseZkwpChipResponse', () => {
  it('распознаёт «не найден» по маркеру (живая фикстура)', () => {
    const result = parseZkwpChipResponse(fixture('not-found.html'))
    expect(result.status).toBe('not_found')
    expect(result.dog).toBeUndefined()
  })

  it('парсит поля собаки из структурированного ответа', () => {
    const result = parseZkwpChipResponse(fixture('found-structured.html'))
    expect(result.status).toBe('found')
    expect(result.dog).toMatchObject({
      name: 'AJRA',
      kennelName: 'Złota Dolina',
      sex: 'suka',
      birthDate: '12.03.2026',
      branch: 'Warszawa',
    })
    expect(result.dog?.rawText).toBeUndefined()
  })

  it('отдаёт rawText, когда структура не распознана', () => {
    const result = parseZkwpChipResponse(fixture('found-unstructured.html'))
    expect(result.status).toBe('found')
    expect(result.dog?.name).toBeUndefined()
    expect(result.dog?.rawText).toContain('AJRA Złota Dolina')
    expect(result.dog?.rawText!.length).toBeLessThanOrEqual(500)
  })

  it('пустая зона результата (страница как при GET) → unavailable', () => {
    const result = parseZkwpChipResponse(fixture('form-page.html'))
    expect(result.status).toBe('unavailable')
  })

  it('HTML без формы → unavailable', () => {
    const result = parseZkwpChipResponse('<html><body>Maintenance</body></html>')
    expect(result.status).toBe('unavailable')
  })

  it('переформулированный отказ ZKwP остаётся not_found (не ложный found)', () => {
    // Если zkwp.pl изменит текст ошибки, сообщение не должно попасть в
    // rawText-фолбэк и быть принято за найденную собаку
    const variants = [
      'Podany numer jest błędny lub nie widnieje w rejestrze ZKwP.',
      'Nie znaleziono psa o podanym numerze mikroczipa.',
      'Podanego numeru brak w bazie ZKwP.',
    ]

    for (const message of variants) {
      const html = fixture('not-found.html').replace(
        'Podany numer jest błędny lub nie jest zarejestrowany w bazie ZKwP.',
        message
      )
      expect(parseZkwpChipResponse(html).status, message).toBe('not_found')
    }
  })

  it('шаблон страницы (без результата) не содержит маркеров отказа', () => {
    // Страховка: маркеры ищутся по всему HTML — если бы фраза встречалась
    // в вёрстке страницы, найденная собака ошибочно стала бы not_found
    expect(parseZkwpChipResponse(fixture('form-page.html')).status).not.toBe('not_found')
  })
})

describe('parseZkwpDate', () => {
  it('парсит dd.mm.yyyy', () => {
    expect(parseZkwpDate('12.03.2026')?.toISOString()).toBe('2026-03-12T00:00:00.000Z')
  })

  it('парсит yyyy-mm-dd и dd-mm-yyyy', () => {
    expect(parseZkwpDate('2026-03-12')?.toISOString()).toBe('2026-03-12T00:00:00.000Z')
    expect(parseZkwpDate('12-03-2026')?.toISOString()).toBe('2026-03-12T00:00:00.000Z')
  })

  it('нераспознанный формат → null', () => {
    expect(parseZkwpDate('marzec 2026')).toBeNull()
    expect(parseZkwpDate('')).toBeNull()
  })
})

describe('zkwpService.checkMicrochip', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const okResponse = (html: string) => ({ ok: true, text: async () => html })

  it('не-15-значный номер → not_found без запроса', async () => {
    const result = await zkwpService.checkMicrochip('12345')
    expect(result.status).toBe('not_found')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('нормализует пробелы/дефисы и шлёт POST c chip=', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(fixture('found-structured.html')))
    const result = await zkwpService.checkMicrochip('616-093 901234567')
    expect(result.status).toBe('found')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://zkwp.pl/baza_chip.php')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('chip=616093901234567')
  })

  it('ретраит один раз после сетевой ошибки', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(okResponse(fixture('not-found.html')))
    const result = await zkwpService.checkMicrochip('616093901234567')
    expect(result.status).toBe('not_found')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('две сетевые ошибки подряд → unavailable, не бросает', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const result = await zkwpService.checkMicrochip('616093901234567')
    expect(result.status).toBe('unavailable')
    expect(result.error).toContain('network down')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('HTTP-ошибка → ретрай → unavailable', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, text: async () => '' })
    const result = await zkwpService.checkMicrochip('616093901234567')
    expect(result.status).toBe('unavailable')
    expect(result.error).toContain('HTTP 503')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
