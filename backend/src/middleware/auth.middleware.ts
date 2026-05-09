import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import { AppError } from './error.middleware'
import { User } from '../modules/users/user.model'

interface ITokenPayload {
  userId: string
  role: string
}

// Расширяем Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: string
      user?: {
        _id: Types.ObjectId
        email: string
        firstName: string
        lastName: string
        role: 'user' | 'breeder' | 'admin'
      }
    }
  }
}

/**
 * Middleware для проверки JWT токена
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token nie został podany', 401, 'NO_TOKEN')
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'secret'

    const decoded = jwt.verify(token, secret) as ITokenPayload

    // Загружаем пользователя из БД
    const user = await User.findById(decoded.userId).select('_id email firstName lastName role isBlocked')

    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 401, 'USER_NOT_FOUND')
    }

    if (user.isBlocked) {
      throw new AppError('Konto zablokowane', 403, 'ACCOUNT_BLOCKED')
    }

    req.userId = decoded.userId
    req.userRole = decoded.role
    req.user = {
      _id: user._id as Types.ObjectId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token wygasł', 401, 'TOKEN_EXPIRED'))
    } else {
      next(new AppError('Nieprawidłowy token', 401, 'INVALID_TOKEN'))
    }
  }
}

/**
 * Middleware для проверки ролей
 */
export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Brak dostępu', 403, 'FORBIDDEN'))
    }
    next()
  }
}

/**
 * Middleware для администраторов
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Wymagane uprawnienia administratora', 403, 'ADMIN_REQUIRED'))
  }
  next()
}

/**
 * Middleware для заводчиков
 */
export const breederMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'breeder' && req.user?.role !== 'admin') {
    return next(new AppError('Wymagane uprawnienia hodowcy', 403, 'BREEDER_REQUIRED'))
  }
  next()
}

/**
 * Опциональный auth middleware (не выбрасывает ошибку если нет токена)
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'secret'

    const decoded = jwt.verify(token, secret) as ITokenPayload
    const user = await User.findById(decoded.userId).select('_id email firstName lastName role isBlocked')

    if (user && !user.isBlocked) {
      req.userId = decoded.userId
      req.userRole = decoded.role
      req.user = {
        _id: user._id as Types.ObjectId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }
    }

    next()
  } catch {
    // Игнорируем ошибки токена
    next()
  }
}
