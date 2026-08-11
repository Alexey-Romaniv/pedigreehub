import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { favoriteService } from './favorite.service'
import { AppError } from '../../middleware/error.middleware'

const parseListingId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400, 'INVALID_ID')
  }
  return new Types.ObjectId(id)
}

// Безопасный разбор page/limit из query
const parsePagination = (req: Request, defaultLimit = 20, maxLimit = 100) => {
  const rawPage = parseInt(req.query.page as string, 10)
  const rawLimit = parseInt(req.query.limit as string, 10)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, maxLimit) : defaultLimit
  return { page, limit }
}

export const favoriteController = {
  /**
   * Добавление в избранное
   * POST /api/favorites/:listingId
   */
  async add(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const listingId = parseListingId(req.params.listingId)
      const result = await favoriteService.add(req.user._id, listingId)

      res.status(result.added ? 201 : 200).json({
        success: true,
        data: { listingId: listingId.toString(), favorite: true },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Удаление из избранного
   * DELETE /api/favorites/:listingId
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const listingId = parseListingId(req.params.listingId)
      await favoriteService.remove(req.user._id, listingId)

      res.json({
        success: true,
        data: { listingId: listingId.toString(), favorite: false },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Список избранного текущего пользователя
   * GET /api/favorites
   */
  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const { page, limit } = parsePagination(req)
      const result = await favoriteService.getForUser(req.user._id, { page, limit })

      res.json({
        success: true,
        data: result.favorites,
        pagination: { page, limit, total: result.total, pages: result.pages },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * ID избранных объявлений (для сердечек на карточках)
   * GET /api/favorites/ids
   */
  async getIds(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const ids = await favoriteService.getIdsForUser(req.user._id)

      res.json({
        success: true,
        data: ids,
      })
    } catch (error) {
      next(error)
    }
  },
}
