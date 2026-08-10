import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { ZodError } from 'zod'
import { reviewService } from './review.service'
import { AppError } from '../../middleware/error.middleware'
import { createReviewSchema } from './review.validation'

const handleZodError = (error: ZodError, res: Response) => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Błąd walidacji',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
  })
}

const parseObjectId = (id: string, message: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400, 'INVALID_ID')
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

export const reviewController = {
  /**
   * Создание отзыва (только покупатель с подтверждённой покупкой)
   * POST /api/reviews
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const data = createReviewSchema.parse(req.body)
      const breederId = parseObjectId(data.breederId, 'Nieprawidłowy identyfikator hodowcy')

      const review = await reviewService.create({
        buyerId: req.user._id,
        breederId,
        rating: data.rating,
        text: data.text,
      })

      res.status(201).json({
        success: true,
        message: 'Dziękujemy za wystawienie opinii!',
        data: {
          id: review._id,
          rating: review.rating,
        },
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Право на отзыв для текущего пользователя
   * GET /api/reviews/eligibility/:breederId
   */
  async getEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const breederId = parseObjectId(
        req.params.breederId,
        'Nieprawidłowy identyfikator hodowcy'
      )

      const eligibility = await reviewService.getEligibility(req.user._id, breederId)

      res.json({
        success: true,
        data: {
          canReview: eligibility.canReview,
          reason: eligibility.reason,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Публичный список отзывов заводчика
   * GET /api/reviews/breeder/:breederId
   */
  async getForBreeder(req: Request, res: Response, next: NextFunction) {
    try {
      const breederId = parseObjectId(
        req.params.breederId,
        'Nieprawidłowy identyfikator hodowcy'
      )

      const { page, limit } = parsePagination(req)
      const result = await reviewService.getForBreeder(breederId, { page, limit })

      res.json({
        success: true,
        data: result.reviews,
        pagination: { page, limit, total: result.total, pages: result.pages },
      })
    } catch (error) {
      next(error)
    }
  },
}
