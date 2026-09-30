import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import request from 'supertest'
import { createHash } from 'node:crypto'
import { app } from '../src/app.js'
import { User } from '../src/modules/users/user.model'
import { emailService } from '../src/services/email.service'
import {
  connectTestDb,
  disconnectTestDb,
  registerUser,
  registerAndLoginUser,
  login,
  uniqueEmail,
  VALID_PASSWORD,
} from './helpers.js'

beforeAll(async () => {
  await connectTestDb()
})

afterAll(async () => {
  await disconnectTestDb()
})

describe('POST /api/auth/register', () => {
  it('rejestruje użytkownika', async () => {
    const { res, email } = await registerUser()

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe(email)
    expect(res.body.data).toHaveProperty('id')
    // Пароль не должен утекать в ответ
    expect(res.body.data).not.toHaveProperty('password')
  })

  it('zwraca 409 dla już zajętego emaila', async () => {
    const { email } = await registerUser()
    const { res } = await registerUser({ email })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('EMAIL_EXISTS')
  })

  it('zwraca 400 dla słabego hasła', async () => {
    const { res } = await registerUser({ password: 'slabe' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('normalizuje numer telefonu do +48XXXXXXXXX', async () => {
    const { res, email } = await registerUser({ phone: '123 456 789' })

    expect(res.status).toBe(201)
    const user = await User.findOne({ email })
    expect(user?.phone).toBe('+48123456789')
  })
})

describe('POST /api/auth/login', () => {
  it('loguje przy poprawnych danych i zwraca tokeny', async () => {
    const { email } = await registerUser()
    const res = await login(email)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('accessToken')
    expect(res.body.data).toHaveProperty('refreshToken')
    expect(res.body.data.user.email).toBe(email)
  })

  it('zwraca 401 przy złym haśle', async () => {
    const { email } = await registerUser()
    const res = await login(email, 'ZleHaslo123')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('zwraca 401 dla nieistniejącego konta', async () => {
    const res = await login(uniqueEmail('ghost'), VALID_PASSWORD)
    expect(res.status).toBe(401)
  })

  it('blokuje logowanie (429) po 10 nieudanych próbach', async () => {
    const { email } = await registerUser()

    for (let i = 0; i < 10; i++) {
      const res = await login(email, 'ZleHaslo123')
      expect(res.status).toBe(401)
    }

    // 11-я попытка отсекается лимитом даже с верным паролем
    const blocked = await login(email)
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')

    // Лимит привязан к паре IP + email — другой аккаунт входит спокойно
    const { email: other } = await registerUser()
    const ok = await login(other)
    expect(ok.status).toBe(200)
  })
})

describe('GET /api/auth/me', () => {
  it('zwraca profil zalogowanego użytkownika', async () => {
    const { email, token } = await registerAndLoginUser()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(email)
  })

  it('zwraca 401 bez tokena', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('zwraca 401 dla uszkodzonego tokena', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer nie-jwt-wcale')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  it('wydaje nową parę tokenów', async () => {
    const { email } = await registerUser()
    const loginRes = await login(email)
    const refreshToken = loginRes.body.data.refreshToken

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('accessToken')
    expect(res.body.data).toHaveProperty('refreshToken')
  })

  it('przechowuje w bazie wyłącznie skrót SHA-256 refresh tokena', async () => {
    const { email } = await registerUser()
    const loginRes = await login(email)
    const refreshToken = loginRes.body.data.refreshToken as string

    const user = await User.findOne({ email }).select('+password')
    expect(user?.refreshToken).not.toBe(refreshToken)
    expect(user?.refreshToken).toBe(createHash('sha256').update(refreshToken).digest('hex'))
    // Пароль — bcrypt с cost 12
    expect(user?.password).toMatch(/^\$2[aby]\$12\$/)
  })

  it('zwraca 401 dla nieprawidłowego refresh tokena', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'zepsuty-token' })

    expect(res.status).toBe(401)
  })
})

describe('Odzyskiwanie hasła', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('odpowiada tak samo dla istniejącego i nieistniejącego adresu', async () => {
    const { email } = await registerUser()

    const existing = await request(app).post('/api/auth/forgot-password').send({ email })
    const ghost = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail('ghost') })

    expect(existing.status).toBe(200)
    expect(ghost.status).toBe(200)
    expect(ghost.body).toEqual(existing.body)
  })

  it('link z e-maila ustawia nowe hasło, jest jednorazowy i kończy stare sesje', async () => {
    // Сырой токен уходит только в письмо — перехватываем его на уровне сервиса
    const sendSpy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue()
    const { email } = await registerUser()
    const oldRefresh = (await login(email)).body.data.refreshToken

    await request(app).post('/api/auth/forgot-password').send({ email })
    const token = sendSpy.mock.calls[0][1]

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NoweHaslo123' })
    expect(reset.status).toBe(200)

    expect((await login(email)).status).toBe(401)
    expect((await login(email, 'NoweHaslo123')).status).toBe(200)

    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh })
    expect(refresh.status).toBe(401)

    const reuse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'InneHaslo123' })
    expect(reuse.status).toBe(400)
    expect(reuse.body.error.code).toBe('INVALID_RESET_TOKEN')
  })
})
