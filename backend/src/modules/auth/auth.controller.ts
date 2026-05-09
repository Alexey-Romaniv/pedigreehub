import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import {
  registerSchema,
  loginSchema,
  registerBreederSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation'
import { AppError } from '../../middleware/error.middleware'
import { ZodError } from 'zod'

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

export const authController = {
  /**
   * Проверка доступности email
   * POST /api/auth/check-email
   */
  checkEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body
      if (!email) {
        throw new AppError('Email nie został podany', 400, 'NO_EMAIL')
      }

      const available = await authService.checkEmailAvailable(email)

      res.json({
        success: true,
        data: { available },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Регистрация пользователя
   * POST /api/auth/register
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body)
      const result = await authService.register(data)
      
      res.status(201).json({
        success: true,
        message: 'Rejestracja zakończona pomyślnie',
        data: result,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Регистрация заводчика
   * POST /api/auth/register/breeder
   */
  registerBreeder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerBreederSchema.parse(req.body)
      const result = await authService.registerBreeder(data)
      
      res.status(201).json({
        success: true,
        message: 'Rejestracja hodowcy zakończona pomyślnie. Teraz prześlij dokumenty do weryfikacji.',
        data: result,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Вход в систему
   * POST /api/auth/login
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body)
      const result = await authService.login(data)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Обновление токенов
   * POST /api/auth/refresh
   */
  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) {
        throw new AppError('Refresh token nie został podany', 400, 'NO_TOKEN')
      }

      const tokens = await authService.refreshTokens(refreshToken)

      res.json({
        success: true,
        data: tokens,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Запрос сброса пароля
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = forgotPasswordSchema.parse(req.body)
      await authService.forgotPassword(data.email)

      // Всегда success — не раскрываем, существует ли аккаунт
      res.json({
        success: true,
        message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany na email.',
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Сброс пароля
   * POST /api/auth/reset-password
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = resetPasswordSchema.parse(req.body)
      await authService.resetPassword(data.token, data.password)

      res.json({
        success: true,
        message: 'Hasło zostało zmienione. Możesz się teraz zalogować.',
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },

  /**
   * Подтверждение email
   * GET /api/auth/verify-email/:token
   */
  verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params
      if (!token) {
        throw new AppError('Brak tokenu weryfikacyjnego', 400, 'NO_TOKEN')
      }

      const result = await authService.verifyEmail(token)

      res.json({
        success: true,
        message: 'Email został potwierdzony.',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Текущий пользователь
   * GET /api/auth/me
   */
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getUserById(req.userId!)

      res.json({
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Выход из системы
   * POST /api/auth/logout
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.userId!)

      res.json({
        success: true,
        message: 'Wylogowano pomyślnie.',
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Смена пароля из личного кабинета
   * POST /api/auth/change-password
   */
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = changePasswordSchema.parse(req.body)
      const tokens = await authService.changePassword(req.userId!, data)

      res.json({
        success: true,
        message: 'Hasło zostało zmienione. Pozostałe sesje zostały wylogowane.',
        data: tokens,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res)
      }
      next(error)
    }
  },
}
