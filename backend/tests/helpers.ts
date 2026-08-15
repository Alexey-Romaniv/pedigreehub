import mongoose from 'mongoose'
import request from 'supertest'
import { app } from '../src/app.js'

export async function connectTestDb() {
  await mongoose.connect(process.env.MONGODB_URI as string)
  // Чистая база на каждый тест-файл (fileParallelism выключен)
  await mongoose.connection.dropDatabase()
}

export async function disconnectTestDb() {
  await mongoose.disconnect()
}

let emailCounter = 0

export function uniqueEmail(prefix: string) {
  emailCounter += 1
  return `${prefix}.${Date.now()}.${emailCounter}@test.local`
}

export const VALID_PASSWORD = 'Haslo1234'

export async function registerUser(overrides: Record<string, unknown> = {}) {
  const email = uniqueEmail('user')
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: VALID_PASSWORD,
      firstName: 'Jan',
      lastName: 'Testowy',
      phone: '+48123456789',
      ...overrides,
    })
  return { res, email }
}

export async function login(email: string, password: string = VALID_PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, password })
}

// register не возвращает токены — логин отдельным шагом (как на фронте)
export async function registerAndLoginUser() {
  const { email } = await registerUser()
  const res = await login(email)
  return { email, token: res.body.data.accessToken as string, res }
}

export async function registerBreeder(overrides: Record<string, unknown> = {}) {
  const email = uniqueEmail('breeder')
  const res = await request(app)
    .post('/api/auth/register/breeder')
    .send({
      email,
      password: VALID_PASSWORD,
      firstName: 'Anna',
      lastName: 'Hodowlana',
      phone: '+48987654321',
      kennelName: 'Hodowla Testowa E2E',
      kennelRegistration: 'ZKwP-TEST-1',
      region: 'mazowieckie',
      city: 'Warszawa',
      description:
        'Testowa hodowla do testów automatycznych — długi opis spełniający minimum pięćdziesięciu znaków.',
      breeds: ['Labrador retriever'],
      ...overrides,
    })
  return { res, email }
}
