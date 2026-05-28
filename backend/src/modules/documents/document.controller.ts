import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { documentService } from './document.service'
import { DocumentType } from './document.model'
import { AppError } from '../../middleware/error.middleware'

// Тип для авторизованного запроса
interface AuthRequest extends Omit<Request, 'user'> {
  user?: {
    _id: Types.ObjectId
    role: string
  }
}

export const documentController = {
  /**
   * Загрузка документа
   * POST /api/documents/upload
   */
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      if (!req.file) {
        throw new AppError('Nie przesłano pliku', 400)
      }

      const type = req.body.type as DocumentType
      if (!type) {
        throw new AppError('Nie określono typu dokumentu', 400)
      }

      const document = await documentService.upload({
        userId: req.user._id,
        type,
        file: req.file,
      })

      res.status(201).json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение документа
   * GET /api/documents/:id
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const document = await documentService.getById(
        new Types.ObjectId(req.params.id)
      )

      if (!document) {
        throw new AppError('Dokument nie znaleziony', 404)
      }

      // Проверка доступа: владелец или админ
      const isOwner = document.userId.toString() === req.user._id.toString()
      const isAdmin = req.user.role === 'admin'
      
      if (!isOwner && !isAdmin) {
        throw new AppError('Brak dostępu', 403)
      }

      res.json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение моих документов
   * GET /api/documents/my
   */
  async getMyDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const type = req.query.type as DocumentType | undefined
      const documents = await documentService.getByUserId(req.user._id, type)

      res.json({
        success: true,
        data: documents,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Удаление документа
   * DELETE /api/documents/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      await documentService.delete(
        new Types.ObjectId(req.params.id),
        req.user._id
      )

      res.json({
        success: true,
        message: 'Dokument usunięty',
      })
    } catch (error) {
      next(error)
    }
  },

  // ADMIN-методы

  /**
   * Получение документов на модерацию
   * GET /api/admin/documents/pending
   */
  async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const type = req.query.type as DocumentType | undefined

      const result = await documentService.getPendingDocuments(page, limit, type)

      res.json({
        success: true,
        data: result.documents,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Одобрение документа
   * POST /api/admin/documents/:id/approve
   */
  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const document = await documentService.updateStatus({
        documentId: new Types.ObjectId(req.params.id),
        status: 'approved',
        verifiedBy: req.user._id,
      })

      res.json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Отклонение документа
   * POST /api/admin/documents/:id/reject
   */
  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { reason } = req.body

      const document = await documentService.updateStatus({
        documentId: new Types.ObjectId(req.params.id),
        status: 'rejected',
        verifiedBy: req.user._id,
        rejectionReason: reason || undefined,
      })

      res.json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },
}
