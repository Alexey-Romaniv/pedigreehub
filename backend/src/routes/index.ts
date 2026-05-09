import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'

export const routes = Router()

// Auth
routes.use('/auth', authRoutes)
