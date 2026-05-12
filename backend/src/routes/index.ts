import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { breedRoutes } from '../modules/breeds/breed.routes'

export const routes = Router()

// Auth
routes.use('/auth', authRoutes)

// Breeds
routes.use('/breeds', breedRoutes)
