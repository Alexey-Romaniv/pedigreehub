import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { User } from '../src/modules/users/user.model'
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

  it('zwraca 401 dla nieprawidłowego refresh tokena', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'zepsuty-token' })

    expect(res.status).toBe(401)
  })
})
