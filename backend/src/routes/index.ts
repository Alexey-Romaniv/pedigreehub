import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { breederRoutes, adminBreederRoutes } from '../modules/breeders/breeder.routes'
import { documentRoutes, adminDocumentRoutes } from '../modules/documents/document.routes'
import { listingRoutes, adminListingRoutes } from '../modules/listings/listing.routes'
import { breedRoutes } from '../modules/breeds/breed.routes'

export const routes = Router()

// Auth
routes.use('/auth', authRoutes)

// Breeders
routes.use('/breeders', breederRoutes)

// Documents
routes.use('/documents', documentRoutes)

// Listings
routes.use('/listings', listingRoutes)

// Breeds
routes.use('/breeds', breedRoutes)

// Admin routes
routes.use('/admin/breeders', adminBreederRoutes)
routes.use('/admin/documents', adminDocumentRoutes)
routes.use('/admin/listings', adminListingRoutes)
