import multer from 'multer'
import { Request } from 'express'
import { AppError } from './error.middleware'

// Допустимые MIME типы
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES]

// Лимиты размеров
const MAX_IMAGE_SIZE = 5 * 1024 * 1024    // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

// Конфигурация хранения в памяти (для Cloudinary)
const storage = multer.memoryStorage()

// Фильтр файлов для изображений
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Dozwolone tylko pliki: JPG, PNG, WebP', 400))
  }
}

// Фильтр файлов для документов
const documentFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Dozwolone tylko pliki: PDF, JPG, PNG, WebP', 400))
  }
}

// Загрузка одного изображения
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('file')

// Загрузка нескольких изображений
export const uploadImages = (maxCount = 10) => multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).array('files', maxCount)

// Загрузка одного документа
export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
}).single('file')

// Загрузка аватара
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB для аватаров
}).single('avatar')

// Загрузка файлов для объявления
export const uploadListingFiles = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Фото щенка и родителей - только изображения
    if (file.fieldname === 'photos' || file.fieldname === 'fatherPhoto' || file.fieldname === 'motherPhoto') {
      imageFileFilter(req, file, cb)
    } else {
      // Документы - PDF или изображения
      documentFileFilter(req, file, cb)
    }
  },
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // 10MB для всех файлов
    files: 20, // Максимум 20 файлов за раз
  },
}).fields([
  { name: 'photos', maxCount: 10 }, // До 10 фото щенка
  { name: 'fatherPhoto', maxCount: 1 },
  { name: 'motherPhoto', maxCount: 1 },
  { name: 'pedigreeDocument', maxCount: 1 },
  { name: 'vetPassportDocument', maxCount: 1 },
  { name: 'metricDocument', maxCount: 1 },
])

