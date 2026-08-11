import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { breederRoutes, adminBreederRoutes } from '../modules/breeders/breeder.routes'
import { documentRoutes, adminDocumentRoutes } from '../modules/documents/document.routes'
import { listingRoutes, adminListingRoutes } from '../modules/listings/listing.routes'
import { breedRoutes } from '../modules/breeds/breed.routes'
import { inquiryRoutes } from '../modules/inquiries/inquiry.routes'
import { reviewRoutes } from '../modules/reviews/review.routes'
import { favoriteRoutes } from '../modules/favorites/favorite.routes'
import { userRoutes, adminUserRoutes } from '../modules/users/user.routes'
import { adminStatsRoutes } from '../modules/admin/admin.routes'

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

// Inquiries
routes.use('/inquiries', inquiryRoutes)

// Reviews
routes.use('/reviews', reviewRoutes)

// Favorites
routes.use('/favorites', favoriteRoutes)

// Users (настройки аккаунта)
routes.use('/users', userRoutes)

// Admin routes
routes.use('/admin/breeders', adminBreederRoutes)
routes.use('/admin/documents', adminDocumentRoutes)
routes.use('/admin/listings', adminListingRoutes)
routes.use('/admin/users', adminUserRoutes)
routes.use('/admin/stats', adminStatsRoutes)
