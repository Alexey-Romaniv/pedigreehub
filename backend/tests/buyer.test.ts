import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { Types } from 'mongoose'
import { app } from '../src/app.js'
import { Breeder } from '../src/modules/breeders/breeder.model'
import { Breed } from '../src/modules/breeds/breed.model'
import { Listing } from '../src/modules/listings/listing.model'
import { User } from '../src/modules/users/user.model'
import {
  connectTestDb,
  disconnectTestDb,
  registerBreeder,
  registerUser,
  registerAndLoginUser,
  login,
} from './helpers.js'

let breederToken: string
let breederId: Types.ObjectId
let listingId: string
let buyerToken: string
let inquiryId: string

const MESSAGE = 'Dzień dobry, czy szczeniak jest jeszcze dostępny?'

beforeAll(async () => {
  await connectTestDb()

  const breed = await Breed.create({
    name: 'Beagle',
    nameEn: 'Beagle',
    fciGroup: 6,
    sizeCategory: 'medium',
  })

  const { res, email } = await registerBreeder({ breeds: [String(breed._id)] })
  breederToken = (await login(email)).body.data.accessToken
  const breeder = await Breeder.findOne({ userId: res.body.data.user.id })
  if (!breeder) throw new Error('Breeder profile not created')
  breederId = breeder._id
  await Breeder.updateOne({ _id: breederId }, { 'verification.status': 'verified' })

  const listing = await Listing.create({
    breederId,
    breed: breed._id,
    title: 'Szczeniak beagle z metryką',
    description: 'Zdrowy szczeniak po rodzicach z rodowodami, gotowy do odbioru.',
    price: 4000,
    currency: 'PLN',
    birthDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    gender: 'female',
    color: 'trójkolorowy',
    microchipNumber: `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`,
    father: { name: 'Max' },
    mother: { name: 'Bella' },
    photos: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg', 'https://example.com/p3.jpg'],
    status: 'active',
    verificationStatus: 'verified',
    location: { region: 'pomorskie', city: 'Słupsk' },
  })
  listingId = listing._id.toString()

  buyerToken = (await registerAndLoginUser()).token
})

afterAll(async () => {
  await disconnectTestDb()
})

// Тесты идут последовательно и разделяют состояние: запрос → ответ → покупка → отзыв
describe('Zapytanie, potwierdzenie zakupu i opinia', () => {
  it('kupujący tworzy zapytanie o szczeniaka (status new)', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingId, message: MESSAGE })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('new')
    inquiryId = res.body.data.id
  })

  it('powtórne zapytanie o to samo ogłoszenie: 409 INQUIRY_EXISTS', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingId, message: MESSAGE })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('INQUIRY_EXISTS')
  })

  it('potwierdzenie zakupu przed odpowiedzią hodowcy: 400 NO_BREEDER_REPLY', async () => {
    const res = await request(app)
      .post(`/api/inquiries/${inquiryId}/confirm-purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('NO_BREEDER_REPLY')
  })

  it('opinia bez potwierdzonego zakupu: 403 NO_CONFIRMED_PURCHASE', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ breederId: String(breederId), rating: 5, text: 'Wszystko w porządku, polecam.' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('NO_CONFIRMED_PURCHASE')
  })

  it('odpowiedź hodowcy przenosi zapytanie do in_progress', async () => {
    const res = await request(app)
      .post(`/api/inquiries/${inquiryId}/messages`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ message: 'Tak, zapraszam na spotkanie.' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('in_progress')
  })

  it('kupujący potwierdza zakup po odpowiedzi hodowcy', async () => {
    const res = await request(app)
      .post(`/api/inquiries/${inquiryId}/confirm-purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('purchase_confirmed')
  })

  it('opinia po zakupie zapisuje się i przelicza ocenę hodowli', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ breederId: String(breederId), rating: 4, text: 'Kontakt bez zarzutu, szczeniak zdrowy.' })

    expect(res.status).toBe(201)
    const breeder = await Breeder.findById(breederId)
    expect(breeder?.rating).toBe(4)
    expect(breeder?.reviewsCount).toBe(1)
  })

  it('druga opinia dla tej samej hodowli: 409 ALREADY_REVIEWED', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ breederId: String(breederId), rating: 1, text: 'Próba wystawienia drugiej opinii.' })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ALREADY_REVIEWED')
  })
})

describe('Lista ulubionych', () => {
  it('dodaje ogłoszenie do ulubionych, pokazuje je na liście i usuwa', async () => {
    const add = await request(app)
      .post(`/api/favorites/${listingId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(add.status).toBe(201)

    // Повторное добавление идемпотентно: 200 вместо дубля
    const again = await request(app)
      .post(`/api/favorites/${listingId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(again.status).toBe(200)

    const ids = await request(app).get('/api/favorites/ids').set('Authorization', `Bearer ${buyerToken}`)
    expect(ids.body.data).toEqual([listingId])

    const remove = await request(app)
      .delete(`/api/favorites/${listingId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(remove.status).toBe(200)

    const after = await request(app).get('/api/favorites/ids').set('Authorization', `Bearer ${buyerToken}`)
    expect(after.body.data).toEqual([])
  })
})

describe('Blokada konta przez administratora', () => {
  it('zablokowany użytkownik traci dostęp od razu i nie może się zalogować', async () => {
    // Админ: обычная регистрация + смена роли в базе (create-admin — CLI-скрипт)
    const { email: adminEmail } = await registerUser()
    await User.updateOne({ email: adminEmail }, { role: 'admin' })
    const adminToken = (await login(adminEmail)).body.data.accessToken

    const { res: userRes, email } = await registerUser()
    const userToken = (await login(email)).body.data.accessToken

    const block = await request(app)
      .post(`/api/admin/users/${userRes.body.data.id}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(block.status).toBe(200)

    // Токен ещё не истёк, но middleware проверяет isBlocked на каждом запросе
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`)
    expect(me.status).toBe(403)
    expect(me.body.error.code).toBe('ACCOUNT_BLOCKED')

    const relogin = await login(email)
    expect(relogin.status).toBe(403)
    expect(relogin.body.error.code).toBe('ACCOUNT_BLOCKED')
  })
})
