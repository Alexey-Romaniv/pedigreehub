import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { ZodError } from 'zod'
import { inquiryService } from './inquiry.service'
import { Breeder } from '../breeders/breeder.model'
import { AppError } from '../../middleware/error.middleware'
import {
  createInquirySchema,
  addMessageSchema,
  updateInquiryStatusSchema,
} from './inquiry.validation'

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

const parseInquiryId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError('Nieprawidłowy identyfikator zapytania', 400, 'INVALID_ID')
  }
  return new Types.ObjectId(id)
}

// Безопасный разбор page/limit из query (NaN/отрицательные → дефолты, limit с капом)
const parsePagination = (req: Request, defaultLimit = 20, maxLimit = 100) => {
  const rawPage = parseInt(req.query.page as string, 10)
  const rawLimit = parseInt(req.query.limit as string, 10)
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, maxLimit) : defaultLimit
  return { page, limit }
}

export const inquiryController = {
  /**
   * Отправка запроса покупателем
   * POST /api/inquiries
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const data = createInquirySchema.parse(req.body)

      if (!Types.ObjectId.isValid(data.listingId)) {
        throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400, 'INVALID_ID')
      }

      const inquiry = await inquiryService.create({
        buyerId: req.user._id,
        listingId: new Types.ObjectId(data.listingId),
        message: data.message,
        contactPhone: data.contactPhone,
      })

      res.status(201).json({
        success: true,
        data: {
          id: inquiry._id,
          status: inquiry.status,
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
   * Запросы покупателя
   * GET /api/inquiries/my
   */
  async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const { page, limit } = parsePagination(req)
      const result = await inquiryService.getForBuyer(req.user._id, { page, limit })

      res.json({
        success: true,
        data: result.inquiries,
        pagination: { page, limit, total: result.total, pages: result.pages },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Входящие запросы заводчика
   * GET /api/inquiries/received
   */
  async getReceived(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404, 'BREEDER_NOT_FOUND')
      }

      const { page, limit } = parsePagination(req)
      const result = await inquiryService.getForBreeder(breeder._id, { page, limit })

      res.json({
        success: true,
        data: result.inquiries,
        pagination: { page, limit, total: result.total, pages: result.pages },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Тред запроса
   * GET /api/inquiries/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const inquiryId = parseInquiryId(req.params.id)
      const inquiry = await inquiryService.getById(inquiryId, req.user)

      res.json({
        success: true,
        data: inquiry,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Новое сообщение в треде
   * POST /api/inquiries/:id/messages
   */
  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const inquiryId = parseInquiryId(req.params.id)
      const data = addMessageSchema.parse(req.body)

      const inquiry = await inquiryService.addMessage(inquiryId, req.user, data.message)

      res.json({
        success: true,
        data: inquiry,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Закрытие запроса
   * PATCH /api/inquiries/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const inquiryId = parseInquiryId(req.params.id)
      updateInquiryStatusSchema.parse(req.body)

      const inquiry = await inquiryService.close(inquiryId, req.user)

      res.json({
        success: true,
        data: {
          id: inquiry._id,
          status: inquiry.status,
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
   * Подтверждение покупки (только покупатель)
   * POST /api/inquiries/:id/confirm-purchase
   */
  async confirmPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Wymagane logowanie', 401, 'UNAUTHORIZED')
      }

      const inquiryId = parseInquiryId(req.params.id)
      const inquiry = await inquiryService.confirmPurchase(inquiryId, req.user)

      res.json({
        success: true,
        message: 'Zakup został potwierdzony. Możesz teraz wystawić opinię hodowcy.',
        data: {
          id: inquiry._id,
          status: inquiry.status,
        },
      })
    } catch (error) {
      next(error)
    }
  },
}
