import { Types } from 'mongoose'
import { Review, IReview } from './review.model'
import { Inquiry } from '../inquiries/inquiry.model'
import { Breeder } from '../breeders/breeder.model'
import { AppError } from '../../middleware/error.middleware'

// В отзыве показываем только имя и аватар покупателя
const BUYER_FIELDS = 'firstName lastName avatar'

class ReviewService {
  /**
   * Проверка права на отзыв: есть purchase_confirmed inquiry с этим заводчиком
   * и отзыв ещё не оставлен
   */
  async getEligibility(
    buyerId: Types.ObjectId,
    breederId: Types.ObjectId
  ): Promise<{ canReview: boolean; reason?: string; inquiryId?: Types.ObjectId }> {
    const confirmedInquiry = await Inquiry.findOne({
      buyerId,
      breederId,
      status: 'purchase_confirmed',
    }).select('_id')

    if (!confirmedInquiry) {
      return { canReview: false, reason: 'NO_CONFIRMED_PURCHASE' }
    }

    const existing = await Review.findOne({ buyerId, breederId }).select('_id')
    if (existing) {
      return { canReview: false, reason: 'ALREADY_REVIEWED' }
    }

    return { canReview: true, inquiryId: confirmedInquiry._id as Types.ObjectId }
  }

  /**
   * Создание отзыва (только после подтверждённой покупки, 1 на пару buyer↔breeder)
   */
  async create(params: {
    buyerId: Types.ObjectId
    breederId: Types.ObjectId
    rating: number
    text: string
  }): Promise<IReview> {
    const breeder = await Breeder.findById(params.breederId).select('_id')
    if (!breeder) {
      throw new AppError('Hodowca nie został znaleziony', 404, 'BREEDER_NOT_FOUND')
    }

    const eligibility = await this.getEligibility(params.buyerId, params.breederId)
    if (!eligibility.canReview) {
      if (eligibility.reason === 'ALREADY_REVIEWED') {
        throw new AppError(
          'Opinia dla tego hodowcy została już wystawiona',
          409,
          'ALREADY_REVIEWED'
        )
      }
      throw new AppError(
        'Opinię można wystawić dopiero po potwierdzonym zakupie',
        403,
        'NO_CONFIRMED_PURCHASE'
      )
    }

    let review: IReview
    try {
      review = await Review.create({
        breederId: params.breederId,
        buyerId: params.buyerId,
        inquiryId: eligibility.inquiryId,
        rating: params.rating,
        text: params.text,
      })
    } catch (error) {
      // Гонка параллельных POST — ловит уникальный индекс
      if ((error as { code?: number }).code === 11000) {
        throw new AppError(
          'Opinia dla tego hodowcy została już wystawiona',
          409,
          'ALREADY_REVIEWED'
        )
      }
      throw error
    }

    await this.recalculateBreederRating(params.breederId)

    return review
  }

  /**
   * Публичный список отзывов заводчика
   */
  async getForBreeder(
    breederId: Types.ObjectId,
    pagination: { page: number; limit: number }
  ): Promise<{ reviews: IReview[]; total: number; pages: number }> {
    const { page, limit } = pagination
    const [reviews, total] = await Promise.all([
      Review.find({ breederId })
        .populate('buyerId', BUYER_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({ breederId }),
    ])
    return { reviews, total, pages: Math.ceil(total / limit) }
  }

  /**
   * Пересчёт рейтинга заводчика агрегацией по отзывам
   */
  private async recalculateBreederRating(breederId: Types.ObjectId): Promise<void> {
    const [stats] = await Review.aggregate<{ avg: number; count: number }>([
      { $match: { breederId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])

    await Breeder.updateOne(
      { _id: breederId },
      {
        $set: {
          rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
          reviewsCount: stats ? stats.count : 0,
        },
      }
    )
  }
}

export const reviewService = new ReviewService()
