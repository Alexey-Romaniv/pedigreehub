import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { Types } from 'mongoose'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { app } from '../src/app.js'
import { env } from '../src/config/env.js'
import { Breeder } from '../src/modules/breeders/breeder.model'
import { Breed } from '../src/modules/breeds/breed.model'
import { Listing } from '../src/modules/listings/listing.model'
import {
  connectTestDb,
  disconnectTestDb,
  registerBreeder,
  registerAndLoginUser,
  login,
} from './helpers.js'

let breederToken: string
let breederId: Types.ObjectId
let breedId: Types.ObjectId
let publicListingId: string
let pendingListingId: string

// Валидный микрочип: код Польши 616 + 12 цифр
function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    breederId,
    breed: breedId,
    title: 'Szczeniak labradora z rodowodem',
    description: 'Zdrowy szczeniak po utytułowanych rodzicach, gotowy do odbioru.',
    price: 5000,
    currency: 'PLN',
    birthDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    gender: 'male',
    color: 'biszkoptowy',
    microchipNumber: `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`,
    hasPedigree: false,
    hasVetPassport: false,
    hasMetric: false,
    father: { name: 'Rex' },
    mother: { name: 'Luna' },
    photos: ['https://example.com/p1.jpg', 'https://example.com/p2.jpg', 'https://example.com/p3.jpg'],
    status: 'active',
    verificationStatus: 'verified',
    location: { region: 'mazowieckie', city: 'Warszawa' },
    ...overrides,
  }
}

beforeAll(async () => {
  await connectTestDb()

  // Порода — до регистрации: API принимает breeds как ObjectId из каталога
  const breed = await Breed.create({
    name: 'Labrador retriever',
    nameEn: 'Labrador Retriever',
    fciGroup: 8,
    sizeCategory: 'large',
  })
  breedId = breed._id as Types.ObjectId

  // Заводчик через API + ручная верификация (одобрение админа вне скоупа теста)
  const { res, email } = await registerBreeder({ breeds: [String(breedId)] })
  expect(res.status).toBe(201)
  const loginRes = await login(email)
  breederToken = loginRes.body.data.accessToken

  const userId = res.body.data.user.id
  const breeder = await Breeder.findOne({ userId })
  if (!breeder) throw new Error('Breeder profile not created')
  breederId = breeder._id
  await Breeder.updateOne({ _id: breederId }, { 'verification.status': 'verified' })

  const publicListing = await Listing.create(makeListing())
  publicListingId = publicListing._id.toString()

  const pendingListing = await Listing.create(
    makeListing({ status: 'pending', verificationStatus: 'pending' })
  )
  pendingListingId = pendingListing._id.toString()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe('GET /api/listings (katalog publiczny)', () => {
  it('zwraca tylko ogłoszenia active + verified', async () => {
    const res = await request(app).get('/api/listings')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const ids = res.body.data.map((l: { _id: string }) => l._id)
    expect(ids).toContain(publicListingId)
    expect(ids).not.toContain(pendingListingId)
  })

  it('filtruje po rasie', async () => {
    const res = await request(app).get(`/api/listings?breed=${breedId}`)
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)

    const other = await request(app).get(`/api/listings?breed=${new Types.ObjectId()}`)
    expect(other.status).toBe(200)
    expect(other.body.data.length).toBe(0)
  })

  it('ma paginację z limitem', async () => {
    const res = await request(app).get('/api/listings?page=1&limit=1')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(1)
    expect(res.body.pagination).toBeDefined()
  })
})

describe('GET /api/listings/:id', () => {
  it('publiczne ogłoszenie dostępne anonimowo', async () => {
    const res = await request(app).get(`/api/listings/${publicListingId}`)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(publicListingId)
  })

  it('niepubliczne ogłoszenie: 403 dla anonima', async () => {
    const res = await request(app).get(`/api/listings/${pendingListingId}`)
    expect(res.status).toBe(403)
  })

  it('niepubliczne ogłoszenie: 200 dla właściciela', async () => {
    const res = await request(app)
      .get(`/api/listings/${pendingListingId}`)
      .set('Authorization', `Bearer ${breederToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data._id).toBe(pendingListingId)
  })

  it('zwraca 400 dla nieprawidłowego ObjectId', async () => {
    const res = await request(app).get('/api/listings/nie-objectid')
    expect(res.status).toBe(400)
  })

  it('zwraca 404 dla nieistniejącego ogłoszenia', async () => {
    const res = await request(app).get(`/api/listings/${new Types.ObjectId()}`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/listings/my', () => {
  it('zwraca ogłoszenia zalogowanego hodowcy', async () => {
    const res = await request(app)
      .get('/api/listings/my')
      .set('Authorization', `Bearer ${breederToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(2)
  })

  it('zwraca 401 bez tokena', async () => {
    const res = await request(app).get('/api/listings/my')
    expect(res.status).toBe(401)
  })
})

describe('Szkice (draft flow)', () => {
  let draftId: string
  const draftChip = `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`

  it('POST /listings tworzy szkic bez zdjęć, opisu i mikroczipa', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${breederToken}`)
      .field('status', 'draft')
      .field('breed', String(breedId))
      .field('title', 'Szkic — szczeniak labradora')
      .field('price', '4000')
      // новорождённый помёт — для черновика допустимо (правило 6 недель только при отправке)
      .field('birthDate', new Date().toISOString())
      .field('gender', 'female')
      .field('color', 'czarny')

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.photos).toEqual([])
    draftId = res.body.data._id
  })

  it('POST /listings ze statusem active jest odrzucany', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${breederToken}`)
      .field('status', 'active')
      .field('breed', String(breedId))
      .field('title', 'Próba obejścia moderacji')
      .field('price', '4000')
      .field('birthDate', new Date().toISOString())
      .field('gender', 'male')
      .field('color', 'czarny')

    expect(res.status).toBe(400)
  })

  it('szkic → pending: 400 gdy ogłoszenie niekompletne', async () => {
    const res = await request(app)
      .patch(`/api/listings/${draftId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INCOMPLETE_LISTING')
  })

  it('PATCH /listings/:id uzupełnia szkic', async () => {
    const res = await request(app)
      .patch(`/api/listings/${draftId}`)
      .set('Authorization', `Bearer ${breederToken}`)
      .field('description', 'Uzupełniony opis szczeniaka z hodowli — zdrowy i zadbany.')
      .field('microchipNumber', draftChip)
      .field('birthDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    expect(res.status).toBe(200)
    expect(res.body.data.microchipNumber).toBe(draftChip)
  })

  it('PATCH ignoruje wstrzyknięte breederId/status/verificationStatus', async () => {
    const res = await request(app)
      .patch(`/api/listings/${draftId}`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({
        breederId: new Types.ObjectId().toString(),
        status: 'active',
        verificationStatus: 'verified',
        title: 'Tytuł po próbie wstrzyknięcia',
      })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.verificationStatus).toBe('pending')
    expect(res.body.data.breederId).toBe(breederId.toString())
    expect(res.body.data.title).toBe('Tytuł po próbie wstrzyknięcia')
  })

  it('szkic → pending przechodzi po uzupełnieniu (autoChecks przeliczone)', async () => {
    // Фото добавляем напрямую в базу, чтобы не ходить в Cloudinary из тестов
    await Listing.updateOne(
      { _id: draftId },
      { photos: ['https://example.com/d1.jpg', 'https://example.com/d2.jpg', 'https://example.com/d3.jpg'] }
    )

    const res = await request(app)
      .patch(`/api/listings/${draftId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    if (res.status !== 200) console.error('SUBMIT FAIL', JSON.stringify(res.body))
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.verificationStatus).toBe('pending')
    expect(res.body.data.autoChecks.microchipFormatValid).toBe(true)
  })
})

describe('Weryfikacja chipa w bazie ZKwP przy wysyłce do moderacji', () => {
  let listingId: string
  const chip = `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`
  const fetchMock = vi.fn()
  const zkwpFixture = (name: string) =>
    readFileSync(
      fileURLToPath(new URL(`../src/services/__fixtures__/zkwp/${name}`, import.meta.url)),
      'utf-8'
    )

  beforeAll(async () => {
    env.ZKWP_CHECK_ENABLED = 'true'
    vi.stubGlobal('fetch', fetchMock)

    // Дата рождения совпадает с found-фикстурой (12.03.2026) — проверяем birthDateMatches
    const listing = await Listing.create(
      makeListing({
        status: 'draft',
        verificationStatus: 'pending',
        microchipNumber: chip,
        birthDate: new Date('2026-03-12T00:00:00.000Z'),
        photos: ['https://example.com/z1.jpg', 'https://example.com/z2.jpg', 'https://example.com/z3.jpg'],
      })
    )
    listingId = String(listing._id)
  })

  afterAll(() => {
    env.ZKWP_CHECK_ENABLED = 'false'
    vi.unstubAllGlobals()
  })

  it('draft → pending: wynik ZKwP (found + zgodność daty) trafia do autoChecks', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => zkwpFixture('found-structured.html'),
    })

    const res = await request(app)
      .patch(`/api/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const zkwpChip = res.body.data.autoChecks.zkwpChip
    expect(zkwpChip.status).toBe('found')
    expect(zkwpChip.dogName).toBe('AJRA')
    expect(zkwpChip.checkedChip).toBe(chip)
    expect(zkwpChip.birthDateMatches).toBe(true)
  })

  it('ponowna wysyłka z tym samym chipem nie odpytuje ZKwP (cache found)', async () => {
    await Listing.updateOne(
      { _id: listingId },
      { status: 'rejected', verificationStatus: 'rejected', verificationNote: 'test' }
    )

    const res = await request(app)
      .patch(`/api/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1) // без нового запроса
    expect(res.body.data.autoChecks.zkwpChip.status).toBe('found')
  })

  it('awaria ZKwP nie blokuje wysyłki (status unavailable)', async () => {
    // Меняем чип, чтобы кэш found не сработал; сеть «лежит» (оба запроса, с ретраем)
    const otherChip = `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`
    await Listing.updateOne(
      { _id: listingId },
      {
        status: 'rejected',
        verificationStatus: 'rejected',
        microchipNumber: otherChip,
      }
    )
    fetchMock.mockRejectedValue(new Error('network down'))

    const res = await request(app)
      .patch(`/api/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.autoChecks.zkwpChip.status).toBe('unavailable')
    expect(res.body.data.autoChecks.zkwpChip.checkedChip).toBe(otherChip)
  })

  it('publiczny GET ukrywa autoChecks i wystawia flagę zkwpVerified', async () => {
    const found = await Listing.create(
      makeListing({
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: new Date(),
          zkwpChip: {
            status: 'found',
            dogName: 'AJRA',
            checkedAt: new Date(),
            checkedChip: `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`,
          },
        },
      })
    )

    const res = await request(app).get(`/api/listings/${found._id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.zkwpVerified).toBe(true)
    expect(res.body.data.autoChecks).toBeUndefined()

    const catalog = await request(app).get('/api/listings')
    expect(catalog.status).toBe(200)
    const inCatalog = catalog.body.data.find(
      (l: { _id: string }) => l._id === String(found._id)
    )
    expect(inCatalog.zkwpVerified).toBe(true)
    expect(inCatalog.autoChecks).toBeUndefined()
  })

  it('found tylko z rawText nie daje publicznej flagi zkwpVerified', async () => {
    // Нераспознанная структура ответа: админ видит rawText, но публично
    // не объявляем верификацию (смена шаблона zkwp.pl ≠ подтверждение собаки)
    const rawOnly = await Listing.create(
      makeListing({
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: new Date(),
          zkwpChip: {
            status: 'found',
            rawText: 'Serwis chwilowo niedostępny',
            checkedAt: new Date(),
            checkedChip: `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`,
          },
        },
      })
    )

    const anon = await request(app).get(`/api/listings/${rawOnly._id}`)
    expect(anon.status).toBe(200)
    expect(anon.body.data.zkwpVerified).toBe(false)
    expect(anon.body.data.autoChecks).toBeUndefined()

    // Тот же результат на объявлении в модерации: владелец (и админ) видит
    // сырые данные для ручной верификации, но публичный флаг остаётся false
    const inModeration = await Listing.create(
      makeListing({
        status: 'pending',
        verificationStatus: 'pending',
        autoChecks: {
          microchipFormatValid: true,
          pedigreeFormatValid: true,
          documentsUploaded: true,
          dataConsistency: true,
          passedAt: new Date(),
          zkwpChip: {
            status: 'found',
            rawText: 'Serwis chwilowo niedostępny',
            checkedAt: new Date(),
            checkedChip: `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`,
          },
        },
      })
    )

    const owner = await request(app)
      .get(`/api/listings/${inModeration._id}`)
      .set('Authorization', `Bearer ${breederToken}`)
    expect(owner.status).toBe(200)
    expect(owner.body.data.autoChecks.zkwpChip.rawText).toBe('Serwis chwilowo niedostępny')
    expect(owner.body.data.zkwpVerified).toBe(false)
  })

  it('rozbieżna data urodzenia w bazie ZKwP → birthDateMatches false', async () => {
    const mismatchChip = `616${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`
    await Listing.updateOne(
      { _id: listingId },
      { status: 'rejected', verificationStatus: 'rejected', microchipNumber: mismatchChip }
    )
    fetchMock.mockReset()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      // В объявлении 12.03.2026, база возвращает другую дату
      text: async () =>
        zkwpFixture('found-structured.html').replace('12.03.2026', '01.02.2026'),
    })

    const res = await request(app)
      .patch(`/api/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(res.body.data.autoChecks.zkwpChip.status).toBe('found')
    expect(res.body.data.autoChecks.zkwpChip.birthDateMatches).toBe(false)
  })
})

describe('Odrzucone ogłoszenie (edycja + ponowna wysyłka)', () => {
  let rejectedId: string

  beforeAll(async () => {
    const rejected = await Listing.create(
      makeListing({
        status: 'rejected',
        verificationStatus: 'rejected',
        verificationNote: 'Nieczytelne zdjęcia',
        publishedAt: new Date(),
      })
    )
    rejectedId = rejected._id.toString()
  })

  it('odrzucone ogłoszenie można edytować', async () => {
    const res = await request(app)
      .patch(`/api/listings/${rejectedId}`)
      .set('Authorization', `Bearer ${breederToken}`)
      .field('title', 'Poprawiony tytuł po odrzuceniu')

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Poprawiony tytuł po odrzuceniu')
  })

  it('rejected → pending resetuje werdykt moderacji', async () => {
    const res = await request(app)
      .patch(`/api/listings/${rejectedId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'pending' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.verificationStatus).toBe('pending')
    expect(res.body.data.verificationNote).toBeFalsy()
  })

  it('aktywnego ogłoszenia nie można edytować', async () => {
    const res = await request(app)
      .patch(`/api/listings/${publicListingId}`)
      .set('Authorization', `Bearer ${breederToken}`)
      .field('title', 'Próba edycji aktywnego')

    expect(res.status).toBe(403)
  })
})

describe('Maszyna stanów statusów', () => {
  it('zabrania przejścia active → draft', async () => {
    const res = await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'draft' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION')
  })

  it('zabrania nieznanego statusu', async () => {
    const res = await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'hacked' })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/listings/:id/status', () => {
  it('właściciel zmienia active → reserved i ogłoszenie znika z katalogu', async () => {
    const res = await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'reserved' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('reserved')

    const catalog = await request(app).get('/api/listings')
    const ids = catalog.body.data.map((l: { _id: string }) => l._id)
    expect(ids).not.toContain(publicListingId)

    // Возврат в active, чтобы не влиять на другие проверки
    await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .set('Authorization', `Bearer ${breederToken}`)
      .send({ status: 'active' })
  })

  it('obcy użytkownik nie może zmienić statusu', async () => {
    const { token: userToken } = await registerAndLoginUser()

    const res = await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'sold' })

    // Обычный юзер без breeder-профиля получает 404 (profil hodowcy nie znaleziony)
    expect(res.status).toBe(404)
  })

  it('zwraca 401 bez tokena', async () => {
    const res = await request(app)
      .patch(`/api/listings/${publicListingId}/status`)
      .send({ status: 'sold' })

    expect(res.status).toBe(401)
  })
})
