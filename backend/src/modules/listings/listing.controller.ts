import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { listingService } from './listing.service'
import { Listing, IListing } from './listing.model'
import { AppError } from '../../middleware/error.middleware'
import { documentService } from '../documents/document.service'
import { Breeder } from '../breeders/breeder.model'
import { Breed } from '../breeds/breed.model'

/**
 * Проверка, что breed из body — валидный ObjectId существующей породы.
 * Без неё можно создать объявление с «битой» ссылкой (populate вернёт null).
 */
const resolveBreedId = async (raw: unknown): Promise<Types.ObjectId> => {
  if (!Types.ObjectId.isValid(String(raw))) {
    throw new AppError('Nieprawidłowy format ID rasy', 400)
  }
  const breedId = new Types.ObjectId(String(raw))
  const breedExists = await Breed.exists({ _id: breedId })
  if (!breedExists) {
    throw new AppError('Wybrana rasa nie istnieje w bazie', 400)
  }
  return breedId
}

type ZkwpChipCheck = NonNullable<NonNullable<IListing['autoChecks']>['zkwpChip']>

/**
 * Публичный бейдж «Zweryfikowano w bazie ZKwP» — только когда база вернула
 * распознанные данные собаки. Ответ, разобранный лишь в rawText-фолбэк
 * (разметка zkwp.pl не распознана), админ в очереди видит, но наружу как
 * верификацию не отдаём: иначе любое изменение вёрстки или текста ошибки на
 * zkwp.pl превратилось бы в ложные публичные «верификации».
 */
const isZkwpPubliclyVerified = (zkwpChip?: ZkwpChipCheck): boolean =>
  zkwpChip?.status === 'found' &&
  Boolean(
    zkwpChip.dogName ||
      zkwpChip.kennelName ||
      zkwpChip.sex ||
      zkwpChip.birthDate ||
      zkwpChip.branch
  )

/**
 * Публичная форма объявления: внутренние autoChecks (в т.ч. данные собаки
 * из базы ZKwP) наружу не отдаются — вместо них производный флаг
 * zkwpVerified («mikroczip znaleziony w bazie ZKwP»).
 */
const toPublicListing = (listing: IListing): Record<string, unknown> => {
  const obj = listing.toObject() as Record<string, unknown> & {
    autoChecks?: { zkwpChip?: ZkwpChipCheck }
  }
  const zkwpVerified = isZkwpPubliclyVerified(obj.autoChecks?.zkwpChip)
  delete obj.autoChecks
  return { ...obj, zkwpVerified }
}

const LISTING_STATUSES = [
  'draft',
  'pending',
  'active',
  'rejected',
  'sold',
  'reserved',
  'archived',
] as const

/**
 * Безопасный разбор массива строк: из multipart приходит JSON-строкой,
 * из JSON-body — готовым массивом
 */
const parseStringArray = (
  raw: unknown,
  fieldName: string
): string[] | undefined => {
  if (raw === undefined || raw === null || raw === '') return undefined
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      throw new Error('not a string array')
    }
    return parsed as string[]
  } catch {
    throw new AppError(`Nieprawidłowy format pola ${fieldName}`, 400)
  }
}

// Тип для авторизованного запроса
interface AuthRequest extends Omit<Request, 'user'> {
  user?: {
    _id: Types.ObjectId
    role: string
  }
  files?: {
    photos?: Express.Multer.File[]
    fatherPhoto?: Express.Multer.File[]
    motherPhoto?: Express.Multer.File[]
    pedigreeDocument?: Express.Multer.File[]
    vetPassportDocument?: Express.Multer.File[]
    metricDocument?: Express.Multer.File[]
  }
}

export const listingController = {
  /**
   * Создание объявления
   * POST /api/listings
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Brak autoryzacji', 401)
      }

      if (req.user.role !== 'breeder') {
        throw new AppError('Tylko hodowcy mogą tworzyć ogłoszenia', 403)
      }

      // --- Дешёвые проверки ДО загрузки файлов в Cloudinary, ---
      // --- чтобы невалидный запрос не оставлял осиротевших файлов ---

      // Статус задаёт клиент, но только draft | pending — публикация лишь через модерацию
      const status = (req.body.status || 'draft') as 'draft' | 'pending'
      if (status !== 'draft' && status !== 'pending') {
        throw new AppError('Nieprawidłowy status — dozwolone: draft, pending', 400)
      }

      // Получение breederId из профиля заводчика
      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404)
      }

      // Валидация breed ID (формат + существование в базе)
      if (!req.body.breed) {
        throw new AppError('ID rasy jest wymagane', 400)
      }

      const breedId = await resolveBreedId(req.body.breed)

      const price = parseFloat(req.body.price)
      if (!Number.isFinite(price) || price < 0) {
        throw new AppError('Nieprawidłowa cena', 400)
      }

      const birthDate = new Date(req.body.birthDate)
      if (Number.isNaN(birthDate.getTime())) {
        throw new AppError('Nieprawidłowa data urodzenia', 400)
      }

      const fatherTitles = parseStringArray(req.body.fatherTitles, 'fatherTitles')
      const motherTitles = parseStringArray(req.body.motherTitles, 'motherTitles')
      const videos = parseStringArray(req.body.videos, 'videos')

      // Получение загруженных файлов
      const photos = req.files?.photos || []
      const fatherPhotoFile = req.files?.fatherPhoto?.[0]
      const motherPhotoFile = req.files?.motherPhoto?.[0]

      // Минимум 3 фото — только при отправке на модерацию; черновик можно без фото
      if (status === 'pending' && photos.length < 3) {
        throw new AppError('Wymagane są minimum 3 zdjęcia szczeniaka', 400)
      }

      // Загрузка фото щенка
      const photoUrls = await listingService.uploadPhotos(photos)

      // Загрузка фото родителей (если есть)
      let fatherPhotoUrl: string | undefined
      let motherPhotoUrl: string | undefined

      if (fatherPhotoFile) {
        fatherPhotoUrl = await listingService.uploadParentPhoto(fatherPhotoFile)
      }

      if (motherPhotoFile) {
        motherPhotoUrl = await listingService.uploadParentPhoto(motherPhotoFile)
      }

      // Загрузка документов (если есть)
      let pedigreeDocumentId: Types.ObjectId | undefined
      let vetPassportDocumentId: Types.ObjectId | undefined
      let metricDocumentId: Types.ObjectId | undefined

      if (req.body.hasPedigree === 'true' && req.files?.pedigreeDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'pedigree',
          file: req.files.pedigreeDocument[0],
        })
        pedigreeDocumentId = doc._id
      }

      if (req.body.hasVetPassport === 'true' && req.files?.vetPassportDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'vet_passport',
          file: req.files.vetPassportDocument[0],
        })
        vetPassportDocumentId = doc._id
      }

      if (req.body.hasMetric === 'true' && req.files?.metricDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'metric',
          file: req.files.metricDocument[0],
        })
        metricDocumentId = doc._id
      }

      // Парсинг данных из body
      const listingData = {
        breederId: breeder._id,
        breed: breedId,
        title: req.body.title,
        description: req.body.description || undefined,
        price,
        currency: req.body.currency || 'PLN',
        puppyName: req.body.puppyName || undefined,
        birthDate,
        gender: req.body.gender,
        color: req.body.color,
        microchipNumber: req.body.microchipNumber || undefined,
        hasPedigree: req.body.hasPedigree === 'true',
        pedigreeDocument: pedigreeDocumentId,
        hasVetPassport: req.body.hasVetPassport === 'true',
        vetPassportDocument: vetPassportDocumentId,
        hasMetric: req.body.hasMetric === 'true',
        metricDocument: metricDocumentId,
        father: {
          name: req.body.fatherName,
          pedigreeNumber: req.body.fatherPedigreeNumber || undefined,
          titles: fatherTitles,
          photo: fatherPhotoUrl,
        },
        mother: {
          name: req.body.motherName,
          pedigreeNumber: req.body.motherPedigreeNumber || undefined,
          titles: motherTitles,
          photo: motherPhotoUrl,
        },
        photos: photoUrls,
        videos,
        status,
      }

      const listing = await listingService.create(listingData)

      res.status(201).json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение объявления по ID
   * GET /api/listings/:id
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400)
      }

      const listing = await listingService.getById(
        new Types.ObjectId(req.params.id)
      )

      if (!listing) {
        throw new AppError('Ogłoszenie nie zostało znalezione', 404)
      }

      // Проверка доступа: публичное, владелец или админ.
      // breederId популируется, поэтому сравниваем по _id профиля заводчика (не userId)
      const isPublic = listing.status === 'active' && listing.verificationStatus === 'verified'
      const isAdmin = req.user?.role === 'admin'
      let isOwner = false

      if (!isPublic && !isAdmin && req.user) {
        const breeder = await Breeder.findOne({ userId: req.user._id })
        const listingBreederId =
          (listing.breederId as unknown as { _id?: Types.ObjectId })?._id ?? listing.breederId
        isOwner = !!breeder && listingBreederId.toString() === breeder._id.toString()
      }

      if (!isPublic && !isOwner && !isAdmin) {
        throw new AppError('Brak dostępu', 403)
      }

      // Счётчик просмотров: только публичные просмотры (аноним/покупатель),
      // не владелец и не админ — им лишние инкременты не нужны
      if (isPublic && !isAdmin && req.user?.role !== 'breeder') {
        await Listing.updateOne(
          { _id: listing._id },
          { $inc: { viewsCount: 1 } }
        )
      }

      // Владелец и админ видят полные autoChecks, публика — только zkwpVerified
      const data =
        isOwner || isAdmin
          ? {
              ...(listing.toObject() as Record<string, unknown>),
              zkwpVerified: isZkwpPubliclyVerified(listing.autoChecks?.zkwpChip),
            }
          : toPublicListing(listing)

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение моих объявлений
   * GET /api/listings/my
   */
  async getMyListings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Brak autoryzacji', 401)
      }

      if (req.user.role !== 'breeder') {
        throw new AppError('Tylko hodowcy mogą przeglądać swoje ogłoszenia', 403)
      }

      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404)
      }

      const status = req.query.status as string | undefined
      const listings = await listingService.getByBreederId(breeder._id, status)

      res.json({
        success: true,
        data: listings,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Обновление объявления
   * PATCH /api/listings/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Brak autoryzacji', 401)
      }

      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400)
      }

      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404)
      }

      // Только явно разобранные поля из body: клиент не может подменить
      // breederId (IDOR), status, verificationStatus, photos и т.д.
      // Multipart → все скаляры приходят строками
      const updates: Record<string, unknown> = {}

      if (req.body.title !== undefined) updates.title = req.body.title
      if (req.body.description !== undefined) {
        updates.description = req.body.description || undefined
      }
      if (req.body.puppyName !== undefined) {
        updates.puppyName = req.body.puppyName || undefined
      }
      if (req.body.gender !== undefined) updates.gender = req.body.gender
      if (req.body.color !== undefined) updates.color = req.body.color
      if (req.body.currency !== undefined) updates.currency = req.body.currency
      if (req.body.microchipNumber !== undefined) {
        updates.microchipNumber = req.body.microchipNumber || undefined
      }

      if (req.body.price !== undefined) {
        const price = parseFloat(req.body.price)
        if (!Number.isFinite(price) || price < 0) {
          throw new AppError('Nieprawidłowa cena', 400)
        }
        updates.price = price
      }

      if (req.body.birthDate !== undefined) {
        const birthDate = new Date(req.body.birthDate)
        if (Number.isNaN(birthDate.getTime())) {
          throw new AppError('Nieprawidłowa data urodzenia', 400)
        }
        updates.birthDate = birthDate
      }

      if (req.body.breed !== undefined) {
        updates.breed = await resolveBreedId(req.body.breed)
      }

      for (const flag of ['hasPedigree', 'hasVetPassport', 'hasMetric'] as const) {
        if (req.body[flag] !== undefined) {
          updates[flag] = req.body[flag] === 'true' || req.body[flag] === true
        }
      }

      if (req.body.videos !== undefined) {
        updates.videos = parseStringArray(req.body.videos, 'videos') ?? []
      }

      // Родители: блок присылается целиком; фото — новый файл заменяет,
      // отсутствие файла сохраняет старое (мерж в сервисе)
      if (req.body.fatherName !== undefined) {
        updates.father = {
          name: req.body.fatherName,
          pedigreeNumber: req.body.fatherPedigreeNumber || undefined,
          titles: parseStringArray(req.body.fatherTitles, 'fatherTitles'),
          photo: req.files?.fatherPhoto?.[0]
            ? await listingService.uploadParentPhoto(req.files.fatherPhoto[0])
            : undefined,
        }
      }
      if (req.body.motherName !== undefined) {
        updates.mother = {
          name: req.body.motherName,
          pedigreeNumber: req.body.motherPedigreeNumber || undefined,
          titles: parseStringArray(req.body.motherTitles, 'motherTitles'),
          photo: req.files?.motherPhoto?.[0]
            ? await listingService.uploadParentPhoto(req.files.motherPhoto[0])
            : undefined,
        }
      }

      // Фото объявления: existingPhotos — список URL, которые оставить
      // (сервис сверит с текущими), новые файлы дозагружаются
      const keepPhotos = parseStringArray(req.body.existingPhotos, 'existingPhotos')
      const newPhotoFiles = req.files?.photos || []
      const newPhotoUrls =
        newPhotoFiles.length > 0
          ? await listingService.uploadPhotos(newPhotoFiles)
          : undefined

      // Документы: новый файл заменяет предыдущий
      if (req.files?.pedigreeDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'pedigree',
          file: req.files.pedigreeDocument[0],
        })
        updates.pedigreeDocument = doc._id
      }
      if (req.files?.vetPassportDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'vet_passport',
          file: req.files.vetPassportDocument[0],
        })
        updates.vetPassportDocument = doc._id
      }
      if (req.files?.metricDocument?.[0]) {
        const doc = await documentService.upload({
          userId: req.user._id,
          type: 'metric',
          file: req.files.metricDocument[0],
        })
        updates.metricDocument = doc._id
      }

      const listing = await listingService.update({
        listingId: new Types.ObjectId(req.params.id),
        breederId: breeder._id,
        ...updates,
        keepPhotos,
        newPhotoUrls,
      })

      res.json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Удаление объявления
   * DELETE /api/listings/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Brak autoryzacji', 401)
      }

      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400)
      }

      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404)
      }

      await listingService.delete(
        new Types.ObjectId(req.params.id),
        breeder._id
      )

      res.json({
        success: true,
        message: 'Ogłoszenie zostało usunięte',
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Изменение статуса объявления
   * PATCH /api/listings/:id/status
   */
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Brak autoryzacji', 401)
      }

      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new AppError('Nieprawidłowy identyfikator ogłoszenia', 400)
      }

      const breeder = await Breeder.findOne({ userId: req.user._id })
      if (!breeder) {
        throw new AppError('Profil hodowcy nie został znaleziony', 404)
      }

      const { status } = req.body
      if (
        typeof status !== 'string' ||
        !(LISTING_STATUSES as readonly string[]).includes(status)
      ) {
        throw new AppError('Nieprawidłowy status ogłoszenia', 400)
      }

      const listing = await listingService.updateStatus(
        new Types.ObjectId(req.params.id),
        breeder._id,
        status as (typeof LISTING_STATUSES)[number]
      )

      res.json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение публичных объявлений (каталог)
   * GET /api/listings
   */
  async getPublicListings(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.query.breed && !Types.ObjectId.isValid(req.query.breed as string)) {
        throw new AppError('Nieprawidłowy identyfikator rasy', 400)
      }
      if (req.query.breederId && !Types.ObjectId.isValid(req.query.breederId as string)) {
        throw new AppError('Nieprawidłowy identyfikator hodowcy', 400)
      }

      const params = {
        breed: req.query.breed
          ? new Types.ObjectId(req.query.breed as string)
          : undefined,
        breederId: req.query.breederId
          ? new Types.ObjectId(req.query.breederId as string)
          : undefined,
        region: req.query.region as string | undefined,
        priceMin: req.query.priceMin
          ? parseFloat(req.query.priceMin as string)
          : undefined,
        priceMax: req.query.priceMax
          ? parseFloat(req.query.priceMax as string)
          : undefined,
        gender: req.query.gender as 'male' | 'female' | undefined,
        verified: req.query.verified === 'true',
        sort: req.query.sort as 'newest' | 'price_asc' | 'price_desc' | undefined,
        page: 1,
        limit: 20,
      }

      // NaN/отрицательные → дефолты; limit с капом, чтобы ?limit=100000 не выгружал базу
      const rawPage = parseInt(req.query.page as string, 10)
      const rawLimit = parseInt(req.query.limit as string, 10)
      if (Number.isFinite(rawPage) && rawPage >= 1) params.page = rawPage
      if (Number.isFinite(rawLimit) && rawLimit >= 1) params.limit = Math.min(rawLimit, 100)

      const result = await listingService.getPublicListings(params)

      res.json({
        success: true,
        data: result.listings.map(toPublicListing),
        pagination: {
          page: params.page,
          limit: params.limit,
          total: result.total,
          pages: result.pages,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  // Методы ADMIN
  /**
   * Получение списка объявлений для модерации
   * GET /api/admin/listings/pending
   */
  async getModerationListings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Wymagane są uprawnienia administratora', 403)
      }

      const params = {
        status: req.query.status as 'pending' | 'active' | 'rejected' | 'all' | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      }

      const result = await listingService.getModerationListings(params)

      res.json({
        success: true,
        data: result.listings,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: result.total,
          pages: result.pages,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Получение объявления по ID для админа
   * GET /api/admin/listings/:id
   */
  async getByIdForAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Wymagane są uprawnienia administratora', 403)
      }

      const listing = await listingService.getByIdForAdmin(
        new Types.ObjectId(req.params.id)
      )

      if (!listing) {
        throw new AppError('Ogłoszenie nie zostało znalezione', 404)
      }

      res.json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Одобрение объявления
   * POST /api/admin/listings/:id/approve
   */
  async approveListing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Wymagane są uprawnienia administratora', 403)
      }

      const listing = await listingService.approveListing(
        new Types.ObjectId(req.params.id),
        req.user._id
      )

      res.json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },

  /**
   * Отклонение объявления
   * POST /api/admin/listings/:id/reject
   */
  async rejectListing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Wymagane są uprawnienia administratora', 403)
      }

      const { reason } = req.body
      if (typeof reason !== 'string' || !reason.trim()) {
        throw new AppError('Powód odrzucenia jest wymagany', 400)
      }

      const listing = await listingService.rejectListing(
        new Types.ObjectId(req.params.id),
        req.user._id,
        reason
      )

      res.json({
        success: true,
        data: listing,
      })
    } catch (error) {
      next(error)
    }
  },
}

