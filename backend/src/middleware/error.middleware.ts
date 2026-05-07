import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number, code: string = 'ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', error)

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    })
  }

  // Multer errors (размер/количество файлов) — 400, а не 500
  if (error.name === 'MulterError') {
    const multerError = error as Error & { code?: string }
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Plik jest za duży',
      LIMIT_FILE_COUNT: 'Za dużo plików',
      LIMIT_UNEXPECTED_FILE: 'Za dużo plików lub nieoczekiwane pole pliku',
    }
    return res.status(400).json({
      success: false,
      error: {
        code: multerError.code || 'UPLOAD_ERROR',
        message: messages[multerError.code || ''] || 'Błąd przesyłania pliku',
      },
    })
  }

  // Mongo duplicate key (E11000) — конфликт уникальности, а не 500
  if ((error as Error & { code?: number }).code === 11000) {
    const keyPattern = (error as Error & { keyPattern?: Record<string, unknown> }).keyPattern || {}
    const message = 'microchipNumber' in keyPattern
      ? 'Ten numer mikroczipa jest już używany w innym ogłoszeniu'
      : 'Wartość musi być unikalna'
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_VALUE',
        message,
      },
    })
  }

  // Mongoose cast error (кривой ObjectId/дата в запросе)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FORMAT',
        message: 'Nieprawidłowy format danych',
      },
    })
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    })
  }

  // JWT error
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Nieprawidłowy token',
      },
    })
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Wewnętrzny błąd serwera',
    },
  })
}
