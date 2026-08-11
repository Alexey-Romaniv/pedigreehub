import { Types } from 'mongoose'
import { Favorite, IFavorite } from './favorite.model'
import { Listing } from '../listings/listing.model'
import { AppError } from '../../middleware/error.middleware'

// Карточка в избранном = та же публичная карточка каталога
const LISTING_FIELDS =
  'title photos price currency status verificationStatus breed birthDate gender location breederId'

class FavoriteService {
  /**
   * Добавление в избранное (идемпотентно: повторный вызов не дублирует)
   */
  async add(userId: Types.ObjectId, listingId: Types.ObjectId): Promise<{ added: boolean }> {
    const listing = await Listing.findById(listingId).select('status verificationStatus')
    if (!listing) {
      throw new AppError('Ogłoszenie nie zostało znalezione', 404, 'LISTING_NOT_FOUND')
    }
    if (listing.status !== 'active' || listing.verificationStatus !== 'verified') {
      throw new AppError('Ogłoszenie nie jest dostępne', 400, 'LISTING_NOT_AVAILABLE')
    }

    try {
      await Favorite.create({ userId, listingId })
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        // Уже в избранном — не дублируем и не инкрементим счётчик повторно
        return { added: false }
      }
      throw error
    }

    await Listing.updateOne({ _id: listingId }, { $inc: { favoritesCount: 1 } })
    return { added: true }
  }

  /**
   * Удаление из избранного (идемпотентно)
   */
  async remove(userId: Types.ObjectId, listingId: Types.ObjectId): Promise<{ removed: boolean }> {
    const result = await Favorite.deleteOne({ userId, listingId })
    if (result.deletedCount === 0) {
      return { removed: false }
    }

    // Не даём счётчику уйти в минус при рассинхроне
    await Listing.updateOne(
      { _id: listingId, favoritesCount: { $gt: 0 } },
      { $inc: { favoritesCount: -1 } }
    )
    return { removed: true }
  }

  /**
   * Избранное пользователя с populated-объявлениями
   */
  async getForUser(
    userId: Types.ObjectId,
    pagination: { page: number; limit: number }
  ): Promise<{ favorites: IFavorite[]; total: number; pages: number }> {
    const { page, limit } = pagination
    const [favorites, total] = await Promise.all([
      Favorite.find({ userId })
        .populate({
          path: 'listingId',
          select: LISTING_FIELDS,
          populate: [
            { path: 'breed', select: 'name' },
            { path: 'breederId', select: 'kennelName verification.status verification.level' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Favorite.countDocuments({ userId }),
    ])
    return { favorites, total, pages: Math.ceil(total / limit) }
  }

  /**
   * ID всех избранных объявлений пользователя (для сердечек на карточках)
   */
  async getIdsForUser(userId: Types.ObjectId): Promise<string[]> {
    const favorites = await Favorite.find({ userId }).select('listingId')
    return favorites.map((f) => f.listingId.toString())
  }
}

export const favoriteService = new FavoriteService()
