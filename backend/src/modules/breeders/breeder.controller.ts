import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { breederService } from './breeder.service'
import { documentService } from '../documents/document.service'
import { cloudinaryService } from '../../services/cloudinary.service'
import { AppError } from '../../middleware/error.middleware'

export const breederController = {
  /**
   * Получение моего профиля заводчика
   * GET /api/breeders/me
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Статистика заводчика (дашборд)
   * GET /api/breeders/me/stats
   */
  async getMyStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const stats = await breederService.getMyStats(breeder)

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Обновление профиля заводчика
   * PATCH /api/breeders/me
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const { kennelName, region, city, address, description, website, socialLinks, breeds } = req.body

      const updated = await breederService.update(breeder._id as Types.ObjectId, {
        kennelName,
        region,
        city,
        address,
        description,
        website,
        socialLinks,
        breeds: breeds?.map((id: string) => new Types.ObjectId(id)),
      })

      res.json({
        success: true,
        data: updated,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Загрузка документа ZKwP
   * POST /api/breeders/me/documents/zkwp
   */
  async uploadZkwpDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.file) {
        throw new AppError('Brak pliku', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      // Загрузка документа
      const document = await documentService.upload({
        userId: req.user._id,
        type: 'zkwp_certificate',
        file: req.file,
      })

      // Привязка к заводчику
      await breederService.uploadZkwpDocument(breeder._id as Types.ObjectId, document._id as Types.ObjectId)

      res.status(201).json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Загрузка документа, подтверждающего личность
   * POST /api/breeders/me/documents/identity
   */
  async uploadIdentityDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.file) {
        throw new AppError('Brak pliku', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const document = await documentService.upload({
        userId: req.user._id,
        type: 'identity',
        file: req.file,
      })

      await breederService.uploadIdentityDocument(breeder._id as Types.ObjectId, document._id as Types.ObjectId)

      res.status(201).json({
        success: true,
        data: document,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Проверка NIP
   * POST /api/breeders/me/verify-nip
   */
  async verifyNIP(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { nip } = req.body
      if (!nip) {
        throw new AppError('Podaj NIP', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const result = await breederService.verifyNIP(breeder._id as Types.ObjectId, nip)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Загрузка фото питомника
   * POST /api/breeders/me/photos
   */
  async uploadKennelPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.file) {
        throw new AppError('Brak pliku', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      // Лимит 10 фото
      if (breeder.kennelPhotos.length >= 10) {
        throw new AppError('Maksymalnie 10 zdjęć hodowli', 400)
      }

      const result = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: 'kennels',
        transformation: { quality: 'auto', fetch_format: 'auto' },
      })

      await breederService.addKennelPhoto(breeder._id as Types.ObjectId, result.secureUrl)

      res.status(201).json({
        success: true,
        data: { url: result.secureUrl },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Удаление фото питомника
   * DELETE /api/breeders/me/photos
   */
  async removeKennelPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { url } = req.body
      if (!url) {
        throw new AppError('Podaj URL zdjęcia', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      await breederService.removeKennelPhoto(breeder._id as Types.ObjectId, url)

      res.json({
        success: true,
        message: 'Zdjęcie usunięte',
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Добавление производителя
   * POST /api/breeders/me/breeding-dogs
   */
  async addBreedingDog(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { name, pedigreeNumber, pedigreeDocumentId } = req.body
      if (!name) {
        throw new AppError('Podaj imię psa', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const updated = await breederService.addBreedingDog(
        breeder._id as Types.ObjectId,
        name,
        pedigreeNumber,
        pedigreeDocumentId ? new Types.ObjectId(pedigreeDocumentId) : undefined
      )

      res.status(201).json({
        success: true,
        data: updated.verification.breedingDogs,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Добавление награды
   * POST /api/breeders/me/awards
   */
  async addAward(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { title, year, documentId } = req.body
      if (!title) {
        throw new AppError('Podaj tytuł nagrody', 400)
      }

      const breeder = await breederService.getByUserId(req.user._id)
      if (!breeder) {
        throw new AppError('Nie masz profilu hodowcy', 404)
      }

      const updated = await breederService.addAward(
        breeder._id as Types.ObjectId,
        title,
        year,
        documentId ? new Types.ObjectId(documentId) : undefined
      )

      res.status(201).json({
        success: true,
        data: updated.verification.awards,
      })
    } catch (error) {
      next(error)
    }
  },

  // PUBLIC-методы

  /**
   * Публичный список заводчиков
   * GET /api/breeders
   */
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, region, breed, search } = req.query

      const result = await breederService.getPublicList({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        region: region as string,
        breed: breed ? new Types.ObjectId(breed as string) : undefined,
        search: search as string,
      })

      res.json({
        success: true,
        data: result.breeders,
        pagination: {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
          total: result.total,
          pages: result.pages,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Публичный профиль заводчика
   * GET /api/breeders/:id
   */
  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const breeder = await breederService.getById(new Types.ObjectId(req.params.id))

      if (!breeder) {
        throw new AppError('Hodowca nie znaleziony', 404)
      }

      // Скрываем приватные данные
      const publicBreeder = breeder.toObject()
      delete publicBreeder.verification.identityDocument
      delete publicBreeder.verification.nip

      res.json({
        success: true,
        data: publicBreeder,
      })
    } catch (error) {
      next(error)
    }
  },

  // ADMIN-методы

  /**
   * Полный профиль заводчика для админа (включая NIP и документ личности)
   * GET /api/admin/breeders/:id
   */
  async getBreederForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Nieprawidłowy identyfikator hodowcy', 400)
      }

      const breeder = await breederService.getByIdForAdmin(new Types.ObjectId(id))
      if (!breeder) {
        throw new AppError('Hodowca nie znaleziony', 404)
      }

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Очередь верификации
   * GET /api/admin/breeders/pending
   */
  async getPendingVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const result = await breederService.getPendingVerification(page, limit)

      res.json({
        success: true,
        data: result.breeders,
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
   * Одобрение заводчика
   * POST /api/admin/breeders/:id/approve
   */
  async approveBreeder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const breeder = await breederService.verifyBreeder({
        breederId: new Types.ObjectId(req.params.id),
        status: 'verified',
        adminId: req.user._id,
      })

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Отклонение заводчика
   * POST /api/admin/breeders/:id/reject
   */
  async rejectBreeder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const { reason } = req.body
      if (!reason) {
        throw new AppError('Podaj powód odrzucenia', 400)
      }

      const breeder = await breederService.verifyBreeder({
        breederId: new Types.ObjectId(req.params.id),
        status: 'rejected',
        adminId: req.user._id,
        note: reason,
      })

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Верификация личности
   * POST /api/admin/breeders/:id/verify-identity
   */
  async verifyIdentity(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Nie jesteś zalogowany', 401)
      }

      const breeder = await breederService.verifyIdentity(
        new Types.ObjectId(req.params.id),
        req.user._id
      )

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Верификация производителя
   * POST /api/admin/breeders/:id/verify-breeding-dog/:dogIndex
   */
  async verifyBreedingDog(req: Request, res: Response, next: NextFunction) {
    try {
      const breeder = await breederService.verifyBreedingDog(
        new Types.ObjectId(req.params.id),
        parseInt(req.params.dogIndex)
      )

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Верификация награды
   * POST /api/admin/breeders/:id/verify-award/:awardIndex
   */
  async verifyAward(req: Request, res: Response, next: NextFunction) {
    try {
      const breeder = await breederService.verifyAward(
        new Types.ObjectId(req.params.id),
        parseInt(req.params.awardIndex)
      )

      res.json({
        success: true,
        data: breeder,
      })
    } catch (error) {
      next(error)
    }
  },
}
