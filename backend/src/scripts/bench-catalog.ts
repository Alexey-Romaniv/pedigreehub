import mongoose, { Types } from 'mongoose'
import { performance } from 'node:perf_hooks'

/**
 * Замер времени ответа публичного каталога (NFR-02 в тексте работы).
 * Создаёт отдельную базу pedigreehub-bench с N объявлениями, делает серии
 * запросов по 100 элементов и печатает медиану и 95-й перцентиль.
 * Запуск: yarn bench-catalog [число объявлений, по умолчанию 1000]
 * Рабочую и тестовую базы не трогает.
 */

const LISTINGS = Number(process.argv[2]) || 1000
const RUNS = 50
const WARMUP = 5

process.env.MONGODB_URI = process.env.BENCH_MONGODB_URI || 'mongodb://localhost:27017/pedigreehub-bench'
process.env.JWT_SECRET ||= 'bench-secret'
process.env.NODE_ENV = 'test'
process.env.ZKWP_CHECK_ENABLED = 'false'

const REGIONS = ['mazowieckie', 'pomorskie', 'malopolskie', 'slaskie', 'wielkopolskie', 'dolnoslaskie']

function percentile(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

async function main() {
  // Импорты после подстановки env: config/env.ts парсит process.env при загрузке
  const { app } = await import('../app.js')
  const request = (await import('supertest')).default
  const { Breed } = await import('../modules/breeds/breed.model.js')
  const { Breeder } = await import('../modules/breeders/breeder.model.js')
  const { Listing } = await import('../modules/listings/listing.model.js')
  const { User } = await import('../modules/users/user.model.js')
  const { seedBreeds } = await import('../modules/breeds/breed.seed.js')

  await mongoose.connect(process.env.MONGODB_URI as string)
  await mongoose.connection.dropDatabase()
  // Дождаться построения индексов (в т.ч. составного status + verificationStatus)
  await Listing.init()
  await seedBreeds()

  const breeds = await Breed.find().limit(20).select('_id')
  const breeders: Types.ObjectId[] = []
  for (let i = 0; i < 10; i++) {
    const user = await User.create({
      email: `bench${i}@bench.local`,
      password: 'Bench1234',
      firstName: 'Bench',
      lastName: `Hodowca${i}`,
      phone: '+48500000000',
      role: 'breeder',
      emailVerified: true,
    })
    const breeder = await Breeder.create({
      userId: user._id,
      kennelName: `Hodowla Bench ${i}`,
      kennelRegistration: `BENCH-${i}`,
      description: 'Hodowla utworzona wyłącznie na potrzeby pomiaru czasu odpowiedzi katalogu.',
      region: REGIONS[i % REGIONS.length],
      city: 'Miasto',
      breeds: [breeds[i % breeds.length]._id],
      verification: { status: 'verified' },
    })
    breeders.push(breeder._id as Types.ObjectId)
  }

  // ~80% объявлений публичные, остальные в модерации: фильтр каталога должен их отсеять
  const docs = Array.from({ length: LISTINGS }, (_, i) => {
    const isPublic = i % 5 !== 0
    return {
      breederId: breeders[i % breeders.length],
      breed: breeds[i % breeds.length]._id,
      title: `Szczeniak nr ${i}`,
      description: 'Zdrowy szczeniak po rodzicach z rodowodami, gotowy do odbioru.',
      price: 1500 + ((i * 37) % 8500),
      currency: 'PLN',
      birthDate: new Date(Date.now() - (60 + (i % 60)) * 24 * 60 * 60 * 1000),
      gender: i % 2 ? 'male' : 'female',
      color: 'czarny',
      microchipNumber: `616${String(900000000000 + i).padStart(12, '0')}`,
      father: { name: 'Ojciec' },
      mother: { name: 'Matka' },
      photos: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
      status: isPublic ? 'active' : 'pending',
      verificationStatus: isPublic ? 'verified' : 'pending',
      publishedAt: new Date(Date.now() - i * 60 * 1000),
      location: { region: REGIONS[i % REGIONS.length], city: 'Miasto' },
    }
  })
  await Listing.insertMany(docs)

  const scenarios: Array<[string, string]> = [
    ['strona 1, 100 elementów, najnowsze', '/api/listings?limit=100'],
    ['strona 5, 100 elementów', '/api/listings?limit=100&page=5'],
    [
      'rasa + województwo + cena + płeć, sortowanie po cenie',
      `/api/listings?limit=100&breed=${breeds[1]._id}&region=pomorskie&priceMin=2000&priceMax=9000&gender=male&sort=price_asc`,
    ],
  ]

  console.log(`Ogłoszeń: ${LISTINGS}, publicznych: ${docs.filter((d) => d.status === 'active').length}, prób: ${RUNS}`)
  for (const [name, url] of scenarios) {
    for (let i = 0; i < WARMUP; i++) await request(app).get(url)
    const times: number[] = []
    let items = 0
    for (let i = 0; i < RUNS; i++) {
      const t0 = performance.now()
      const res = await request(app).get(url)
      times.push(performance.now() - t0)
      if (res.status !== 200) throw new Error(`${url} → ${res.status}`)
      items = res.body.data.length
    }
    times.sort((a, b) => a - b)
    console.log(
      `${name}: elementów ${items}, mediana ${percentile(times, 50).toFixed(1)} ms, p95 ${percentile(times, 95).toFixed(1)} ms`
    )
  }

  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
