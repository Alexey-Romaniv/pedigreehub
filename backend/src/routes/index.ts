import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { breederRoutes, adminBreederRoutes } from '../modules/breeders/breeder.routes'
import { breedRoutes } from '../modules/breeds/breed.routes'

export const routes = Router()

// Auth
routes.use('/auth', authRoutes)

// Breeders
routes.use('/breeders', breederRoutes)

// Breeds
routes.use('/breeds', breedRoutes)

// Admin routes
routes.use('/admin/breeders', adminBreederRoutes)
