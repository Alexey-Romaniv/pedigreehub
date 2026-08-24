import { FilterQuery, Types } from 'mongoose'
import { User, IUser } from './user.model'
import { Breeder } from '../breeders/breeder.model'
import { Listing } from '../listings/listing.model'
import { Inquiry } from '../inquiries/inquiry.model'
import { Review } from '../reviews/review.model'
import { Favorite } from '../favorites/favorite.model'
import { DocumentModel } from '../documents/document.model'
import { AppError } from '../../middleware/error.middleware'
import { cloudinaryService } from '../../services/cloudinary.service'
import { UpdateProfileInput } from './user.validation'

export interface GetUsersParams {
  page: number
  limit: number
  role?: 'user' | 'breeder' | 'admin'
  search?: string
  isBlocked?: boolean
}

// Поля с токенами наружу не отдаём
const SAFE_PROJECTION =
  '-refreshToken -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Публичное представление профиля — тот же набор полей, что отдаёт GET /auth/me
const toProfile = (user: IUser) => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  role: user.role,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified,
  avatar: user.avatar,
})

class UserService {
  /**
   * Список пользователей для админ-панели (поиск, фильтры, пагинация)
   */
  async getUsers(params: GetUsersParams) {
    const { page, limit, role, search, isBlocked } = params
    const skip = (page - 1) * limit

    const query: FilterQuery<IUser> = {}
    if (role) {
      query.role = role
    }
    if (typeof isBlocked === 'boolean') {
      query.isBlocked = isBlocked
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i')
      query.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }]
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(SAFE_PROJECTION)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    // Подтягиваем название питомника для заводчиков
    const breederUserIds = users.filter((u) => u.role === 'breeder').map((u) => u._id)
    const breeders = breederUserIds.length
      ? await Breeder.find({ userId: { $in: breederUserIds } })
          .select('userId kennelName verification.status')
          .lean()
      : []
    const breederByUserId = new Map(breeders.map((b) => [b.userId.toString(), b]))

    const items = users.map((u) => {
      const breeder = breederByUserId.get(u._id.toString())
      return {
        ...u,
        breeder: breeder
          ? {
              // id нужен админке, чтобы догрузить полный профиль (NIP, документы)
              id: breeder._id.toString(),
              kennelName: breeder.kennelName,
              verificationStatus: breeder.verification?.status,
            }
          : undefined,
      }
    })

    return {
      users: items,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  /**
   * Карточка пользователя для админ-панели: аккаунт, питомник (если заводчик)
   * и вся его активность на площадке.
   *
   * Счётчики зависят от роли: у покупателя это отправленные запросы, избранное
   * и написанные отзывы, у заводчика — ещё и объявления, входящие запросы,
   * полученные отзывы и загруженные документы.
   */
  async getUserDetails(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Nieprawidłowy identyfikator użytkownika', 400, 'INVALID_ID')
    }

    const user = await User.findById(userId).select(SAFE_PROJECTION).lean()
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    const breeder = await Breeder.findOne({ userId: user._id })
      .select('kennelName verification.status verification.level listingsCount rating createdAt')
      .lean()

    const [inquiriesAsBuyer, reviewsWritten, favorites, documentsTotal, documentsPending] =
      await Promise.all([
        Inquiry.countDocuments({ buyerId: user._id }),
        Review.countDocuments({ buyerId: user._id }),
        Favorite.countDocuments({ userId: user._id }),
        DocumentModel.countDocuments({ userId: user._id }),
        DocumentModel.countDocuments({ userId: user._id, status: 'pending' }),
      ])

    // Объявления и входящие запросы привязаны к питомнику, а не к пользователю
    const [listingsByStatus, inquiriesAsBreeder, reviewsReceived, recentListings] = breeder
      ? await Promise.all([
          Listing.aggregate<{ _id: string; count: number }>([
            { $match: { breederId: breeder._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          Inquiry.countDocuments({ breederId: breeder._id }),
          Review.countDocuments({ breederId: breeder._id }),
          Listing.find({ breederId: breeder._id })
            .select('title status verificationStatus price photos createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        ])
      : [[], 0, 0, []]

    const listings = listingsByStatus.reduce<Record<string, number>>(
      (acc, row) => ({ ...acc, [row._id]: row.count }),
      {}
    )

    const recentInquiries = await Inquiry.find({
      $or: [{ buyerId: user._id }, ...(breeder ? [{ breederId: breeder._id }] : [])],
    })
      .select('listingId status lastMessageAt createdAt buyerId')
      .populate('listingId', 'title')
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .lean()

    return {
      user,
      breeder: breeder
        ? {
            id: breeder._id.toString(),
            kennelName: breeder.kennelName,
            verificationStatus: breeder.verification?.status,
            verificationLevel: breeder.verification?.level,
            listingsCount: breeder.listingsCount,
            rating: breeder.rating,
            createdAt: breeder.createdAt,
          }
        : null,
      stats: {
        listings: {
          total: Object.values(listings).reduce((sum, count) => sum + count, 0),
          byStatus: listings,
        },
        inquiriesAsBuyer,
        inquiriesAsBreeder,
        reviewsWritten,
        reviewsReceived,
        favorites,
        documents: { total: documentsTotal, pending: documentsPending },
      },
      recentListings,
      recentInquiries: recentInquiries.map((inquiry) => ({
        id: inquiry._id.toString(),
        // Заголовок объявления приходит из populate, но объявление могли удалить
        listingTitle: (inquiry.listingId as unknown as { title?: string })?.title,
        status: inquiry.status,
        // Одну и ту же переписку админ видит с разных сторон в зависимости от роли
        role: inquiry.buyerId.toString() === user._id.toString() ? 'buyer' : 'breeder',
        lastMessageAt: inquiry.lastMessageAt,
        createdAt: inquiry.createdAt,
      })),
    }
  }

  /**
   * Обновление своего профиля (имя, фамилия, телефон)
   */
  async updateProfile(userId: Types.ObjectId | string, data: UpdateProfileInput) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    if (data.firstName !== undefined) user.firstName = data.firstName
    if (data.lastName !== undefined) user.lastName = data.lastName
    if (data.phone !== undefined) user.phone = data.phone
    await user.save()

    return toProfile(user)
  }

  /**
   * Сохраняем новый аватар; предыдущий файл удаляем из Cloudinary
   */
  async setAvatar(userId: Types.ObjectId | string, file: Express.Multer.File) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    const result = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'avatars',
      transformation: { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
    })

    const previousPublicId = user.avatarPublicId

    user.avatar = result.secureUrl
    user.avatarPublicId = result.publicId
    await user.save()

    if (previousPublicId) {
      // Ошибка удаления старого файла не должна ломать ответ
      await cloudinaryService.delete(previousPublicId).catch(() => undefined)
    }

    return toProfile(user)
  }

  /**
   * Удаление аватара (возвращаемся к инициалам)
   */
  async removeAvatar(userId: Types.ObjectId | string) {
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    const publicId = user.avatarPublicId

    user.avatar = undefined
    user.avatarPublicId = undefined
    await user.save()

    if (publicId) {
      await cloudinaryService.delete(publicId).catch(() => undefined)
    }

    return toProfile(user)
  }

  /**
   * Блокировка / разблокировка пользователя
   */
  async setBlocked(userId: string, blocked: boolean, adminId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('Nieprawidłowy identyfikator użytkownika', 400, 'INVALID_ID')
    }

    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('Użytkownik nie znaleziony', 404, 'USER_NOT_FOUND')
    }

    if (user._id.toString() === adminId.toString()) {
      throw new AppError('Nie możesz zablokować własnego konta', 400, 'CANNOT_BLOCK_SELF')
    }

    if (user.role === 'admin') {
      throw new AppError('Nie można zablokować administratora', 403, 'CANNOT_BLOCK_ADMIN')
    }

    user.isBlocked = blocked
    if (blocked) {
      // Инвалидируем сессии заблокированного пользователя
      user.refreshToken = undefined
    }
    await user.save()

    return {
      id: user._id.toString(),
      email: user.email,
      isBlocked: user.isBlocked,
    }
  }
}

export const userService = new UserService()
