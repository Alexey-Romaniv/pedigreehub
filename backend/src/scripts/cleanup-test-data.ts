import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { User } from '../modules/users/user.model'
import { Breeder } from '../modules/breeders/breeder.model'
import { Listing } from '../modules/listings/listing.model'
import { Inquiry } from '../modules/inquiries/inquiry.model'
import { Review } from '../modules/reviews/review.model'

/**
 * Чистит базу от старых тестовых аккаунтов приёмки (@example.com и т. п.)
 * и связанных с ними заводчиков, объявлений, переписок и отзывов.
 * Демо-данные (`yarn seed-demo`), админ и ZKwP-кейсы не трогаются.
 *
 * Запуск: yarn cleanup-test-data           — показать, что будет удалено
 *         yarn cleanup-test-data --apply   — удалить
 */

// Что считаем «своим» и не удаляем ни при каких условиях
const KEEP_EMAIL_PATTERNS = [/@demo\.pedigreehub\.pl$/i, /^kupujacy\.demo@pedigreehub\.pl$/i, /^admin@pedigreehub\.pl$/i]

// Что считаем мусором приёмки
const TEST_EMAIL_PATTERNS = [/@example\.com$/i, /^confirm\.test\./i, /^test/i]

const apply = process.argv.includes('--apply')

async function cleanup() {
  await mongoose.connect(env.MONGODB_URI)

  const users = await User.find({}, { email: 1, role: 1 }).lean()
  const victims = users.filter(
    (u) =>
      !KEEP_EMAIL_PATTERNS.some((re) => re.test(u.email)) && TEST_EMAIL_PATTERNS.some((re) => re.test(u.email))
  )
  const victimIds = victims.map((u) => u._id)
  const breeders = await Breeder.find({ userId: { $in: victimIds } }, { kennelName: 1 }).lean()
  const breederIds = breeders.map((b) => b._id)

  // Заводчики-сироты: профиль есть, а пользователя уже нет (следы старых багов)
  const userIdSet = new Set(users.map((u) => String(u._id)))
  const orphanBreeders = await Breeder.find({}, { kennelName: 1, userId: 1 }).lean()
  const orphanIds = orphanBreeders.filter((b) => !userIdSet.has(String(b.userId))).map((b) => b._id)
  const allBreederIds = [...breederIds, ...orphanIds]

  const listings = await Listing.find({ breederId: { $in: allBreederIds } }, { title: 1 }).lean()
  const inquiries = await Inquiry.countDocuments({
    $or: [{ buyerId: { $in: victimIds } }, { breederId: { $in: allBreederIds } }],
  })
  const reviews = await Review.countDocuments({
    $or: [{ buyerId: { $in: victimIds } }, { breederId: { $in: allBreederIds } }],
  })

  console.log(`\n${apply ? 'Usuwanie' : 'Podgląd (bez zmian)'}:`)
  console.log(`  użytkownicy (${victims.length}):`)
  for (const u of victims) console.log(`    - ${u.email} [${u.role}]`)
  console.log(`  hodowcy (${allBreederIds.length}):`)
  for (const b of [...breeders, ...orphanBreeders.filter((o) => orphanIds.some((id) => id.equals(o._id)))]) {
    console.log(`    - ${b.kennelName}`)
  }
  console.log(`  ogłoszenia (${listings.length}):`)
  for (const l of listings) console.log(`    - ${l.title}`)
  console.log(`  zapytania: ${inquiries}, opinie: ${reviews}`)

  if (!apply) {
    console.log('\nUruchom z --apply, aby faktycznie usunąć.')
    await mongoose.disconnect()
    return
  }

  await Review.deleteMany({ $or: [{ buyerId: { $in: victimIds } }, { breederId: { $in: allBreederIds } }] })
  await Inquiry.deleteMany({ $or: [{ buyerId: { $in: victimIds } }, { breederId: { $in: allBreederIds } }] })
  await Listing.deleteMany({ breederId: { $in: allBreederIds } })
  await Breeder.deleteMany({ _id: { $in: allBreederIds } })
  await User.deleteMany({ _id: { $in: victimIds } })

  console.log('\nWyczyszczono.')
  await mongoose.disconnect()
}

cleanup().catch((error) => {
  console.error('Błąd czyszczenia danych testowych:', error)
  process.exit(1)
})
