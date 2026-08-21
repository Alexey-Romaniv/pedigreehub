import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { cloudinaryService, type UploadFolder } from '../services/cloudinary.service'

/**
 * Заливает демо-фото (реальные снимки нужных пород с Wikimedia Commons)
 * в Cloudinary и генерирует demo-photos.generated.ts со стабильными URL.
 * Запуск: yarn upload-demo-photos. Идемпотентен — public_id фиксированные,
 * повторный запуск перезаписывает те же файлы.
 *
 * Источники и лицензии: docs/DEMO-PHOTO-CREDITS.md.
 */

interface SourcePhoto {
  key: string
  group: UploadFolder
  publicId: string
  sourceUrl: string
  sourcePage: string
  title: string
  license: string
  author: string
}

// Скрипт запускается через tsx из каталога backend (yarn upload-demo-photos)
const HERE = path.resolve(process.cwd(), 'src/scripts')
const SOURCE_FILE = path.join(HERE, 'demo-photos.source.json')
const GENERATED_FILE = path.join(HERE, 'demo-photos.generated.ts')
const UA = 'PedigreeHubDemoSeed/1.0 (https://pedigreehub-2of.pages.dev)'

// Wikimedia отдаёт оригиналы только с внятным User-Agent, поэтому скачиваем сами,
// а в Cloudinary отправляем буфер.
async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

/**
 * Спрашивает у Commons готовую уменьшенную копию: собирать thumb-URL вручную
 * ненадёжно (имена файлов со спецсимволами дают 400).
 */
async function thumbUrl(title: string, width: number): Promise<string | null> {
  const api = new URL('https://commons.wikimedia.org/w/api.php')
  api.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(width),
  }).toString()
  const response = await fetch(api, { headers: { 'User-Agent': UA } })
  if (!response.ok) return null
  const data = (await response.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { thumburl?: string }[] }> }
  }
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0]?.thumburl ?? null
}

/** Тянет копию не больше maxBytes: сначала 1600px, при неудаче — 1200px, затем оригинал. */
async function downloadWithinLimit(photo: SourcePhoto, maxBytes: number): Promise<Buffer> {
  const candidates = [
    await thumbUrl(photo.title, 1600),
    await thumbUrl(photo.title, 1200),
    photo.sourceUrl,
  ].filter((url): url is string => Boolean(url))

  for (const url of candidates) {
    try {
      const buffer = await download(url)
      if (buffer.byteLength <= maxBytes) return buffer
    } catch {
      // пробуем следующий вариант
    }
  }
  throw new Error(`Nie udało się pobrać zdjęcia w limicie rozmiaru: ${photo.sourceUrl}`)
}

async function uploadAll() {
  const sources: SourcePhoto[] = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
  console.log(`Wysyłanie ${sources.length} zdjęć do Cloudinary...`)

  const urls: Record<string, string[]> = {}

  for (const photo of sources) {
    const buffer = await downloadWithinLimit(photo, 9.5 * 1024 * 1024)
    const result = await cloudinaryService.uploadBuffer(buffer, {
      folder: photo.group,
      publicId: photo.publicId,
      resourceType: 'image',
      // Ограничиваем длинную сторону и отдаём оптимизированный формат
      transformation: { width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' },
    })
    urls[photo.key] ??= []
    urls[photo.key].push(result.secureUrl)
    console.log(`  ${photo.publicId} (${Math.round(result.bytes / 1024)} kB)`)
  }

  const body = Object.entries(urls)
    .map(([key, list]) => `  '${key}': [\n${list.map((u) => `    '${u}',`).join('\n')}\n  ],`)
    .join('\n')

  const generated = `// СГЕНЕРИРОВАНО скриптом upload-demo-photos.ts — не редактировать вручную.
// Реальные фото пород (Wikimedia Commons) залитые в Cloudinary.
// Источники, авторы и лицензии: docs/DEMO-PHOTO-CREDITS.md

export const demoPhotos: Record<string, string[]> = {
${body}
}
`
  fs.writeFileSync(GENERATED_FILE, generated)
  console.log(`\nZapisano ${GENERATED_FILE}`)
}

uploadAll().catch((error) => {
  console.error('Błąd wysyłania zdjęć demo:', error)
  process.exit(1)
})
