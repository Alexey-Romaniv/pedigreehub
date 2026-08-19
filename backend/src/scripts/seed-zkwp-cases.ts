import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { User } from '../modules/users/user.model'
import { Breeder } from '../modules/breeders/breeder.model'
import { Listing } from '../modules/listings/listing.model'

/**
 * Сид объявлений со всеми состояниями проверки ZKwP — для ручной/визуальной
 * проверки админ-очереди и публичного бейджа.
 * Запуск: yarn seed-zkwp-cases           (пересоздаёт 5 объявлений)
 *         yarn seed-zkwp-cases --clean    (удаляет их)
 * Все объявления помечены префиксом микрочипа 616000091 — по нему и чистятся.
 */
const VIS_PREFIX = '616000091'

async function main() {
  await mongoose.connect(env.MONGODB_URI)

  if (process.argv.includes('--clean')) {
    const { deletedCount } = await Listing.deleteMany({
      microchipNumber: new RegExp(`^${VIS_PREFIX}`),
    })
    console.log(`Usunięto ogłoszeń: ${deletedCount}`)
    await mongoose.disconnect()
    return
  }

  const user = await User.findOne({ email: 'hodowla.zlotalapa@demo.pedigreehub.pl' })
  if (!user) throw new Error('Нет demo-заводчика — запусти yarn seed-demo')
  const breeder = await Breeder.findOne({ userId: user._id })
  if (!breeder) throw new Error('Нет профиля заводчика')

  // Шаблон берём только из demo-объявлений (chip 616000090…), иначе на повторном
  // запуске за образец пойдёт ранее созданный ZKwP-кейс со старыми данными.
  const template = await Listing.findOne({ breederId: breeder._id, microchipNumber: /^616000090/ }).lean()
  if (!template) throw new Error('У demo-заводчика нет объявлений — запусти yarn seed-demo')

  await Listing.deleteMany({ microchipNumber: new RegExp(`^${VIS_PREFIX}`) })

  const baseChecks = {
    microchipFormatValid: true,
    pedigreeFormatValid: true,
    documentsUploaded: true,
    dataConsistency: true,
    passedAt: new Date(),
  }
  const birthDate = new Date('2026-05-01T00:00:00.000Z')

  const cases = [
    {
      suffix: '000001',
      title: 'ZKwP-A: found (aktywne, publiczna pieczęć)',
      status: 'active',
      verificationStatus: 'verified',
      zkwpChip: {
        status: 'found',
        dogName: 'AJRA',
        kennelName: 'Złota Dolina',
        sex: 'suka',
        birthDate: '01.05.2026',
        branch: 'Warszawa',
        birthDateMatches: true,
        checkedAt: new Date(),
      },
    },
    {
      suffix: '000002',
      title: 'ZKwP-B: found + rozbieżna data urodzenia',
      status: 'pending',
      verificationStatus: 'pending',
      zkwpChip: {
        status: 'found',
        dogName: 'BORYS',
        kennelName: 'Srebrny Wiatr',
        sex: 'pies',
        birthDate: '14.02.2026',
        branch: 'Kraków',
        birthDateMatches: false,
        checkedAt: new Date(),
      },
    },
    {
      suffix: '000003',
      title: 'ZKwP-C: not_found',
      status: 'pending',
      verificationStatus: 'pending',
      zkwpChip: { status: 'not_found', checkedAt: new Date() },
    },
    {
      suffix: '000004',
      title: 'ZKwP-D: unavailable',
      status: 'pending',
      verificationStatus: 'pending',
      zkwpChip: { status: 'unavailable', checkedAt: new Date() },
    },
    {
      suffix: '000005',
      title: 'ZKwP-E: found tylko rawText (nierozpoznana struktura)',
      status: 'pending',
      verificationStatus: 'pending',
      zkwpChip: {
        status: 'found',
        rawText:
          'Wyszukiwanie w bazie ZKwP AJRA Złota Dolina suka ur. 01.05.2026 Oddział Warszawa metryka nr W/2026/1234 — dane w nierozpoznanym układzie',
        checkedAt: new Date(),
      },
    },
  ] as const

  for (const c of cases) {
    const chip = `${VIS_PREFIX}${c.suffix}`
    const {
      _id: _ignoredId,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = template as Record<string, unknown>

    await Listing.create({
      ...rest,
      title: c.title,
      microchipNumber: chip,
      birthDate,
      status: c.status,
      verificationStatus: c.verificationStatus,
      verificationNote: undefined,
      publishedAt: new Date(),
      autoChecks: { ...baseChecks, zkwpChip: { ...c.zkwpChip, checkedChip: chip } },
    })
    console.log(`${c.title} → chip ${chip}`)
  }

  const created = await Listing.find({ microchipNumber: new RegExp(`^${VIS_PREFIX}`) })
    .select('_id title status')
    .lean()
  console.log(JSON.stringify(created, null, 2))

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
