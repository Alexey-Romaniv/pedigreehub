import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { userService } from './user.service'
import { updateProfileSchema } from './user.validation'
import { AppError } from '../../middleware/error.middleware'

const ROLES = ['user', 'breeder', 'admin'] as const
type Role = (typeof ROLES)[number]

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

export const userController = {
  /**
   * Обновление своего профиля
   * PATCH /api/users/me
   */
  updateMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateProfileSchema.parse(req.body)
      const user = await userService.updateProfile(req.user!._id, data)

      res.json({
        success: true,
        message: 'Dane zostały zapisane',
        data: user,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Загрузка аватара
   * POST /api/users/me/avatar
   */
  uploadAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('Brak pliku', 400, 'NO_FILE')
      }

      const user = await userService.setAvatar(req.user!._id, req.file)

      res.json({
        success: true,
        message: 'Zdjęcie profilowe zostało zaktualizowane',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Удаление аватара
   * DELETE /api/users/me/avatar
   */
  removeAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.removeAvatar(req.user!._id)

      res.json({
        success: true,
        message: 'Zdjęcie profilowe zostało usunięte',
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Список пользователей
   * GET /api/admin/users
   */
  getUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pageRaw = parseInt(req.query.page as string, 10)
      const limitRaw = parseInt(req.query.limit as string, 10)
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20

      const roleParam = req.query.role as string | undefined
      const role = ROLES.includes(roleParam as Role) ? (roleParam as Role) : undefined

      const isBlockedParam = req.query.isBlocked as string | undefined
      const isBlocked =
        isBlockedParam === 'true' ? true : isBlockedParam === 'false' ? false : undefined

      const search = (req.query.search as string | undefined)?.trim() || undefined

      const result = await userService.getUsers({ page, limit, role, search, isBlocked })

      res.json({
        success: true,
        data: result.users,
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
   * Карточка пользователя со статистикой
   * GET /api/admin/users/:id
   */
  getUserDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await userService.getUserDetails(req.params.id)

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Блокировка пользователя
   * POST /api/admin/users/:id/block
   */
  blockUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.setBlocked(req.params.id, true, req.user!._id)

      res.json({
        success: true,
        message: 'Użytkownik został zablokowany',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Разблокировка пользователя
   * POST /api/admin/users/:id/unblock
   */
  unblockUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.setBlocked(req.params.id, false, req.user!._id)

      res.json({
        success: true,
        message: 'Użytkownik został odblokowany',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },
}
