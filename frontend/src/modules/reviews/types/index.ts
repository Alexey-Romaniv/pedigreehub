// Покупатель после populate в списке отзывов
export interface ReviewBuyerPreview {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
}

export interface Review {
  _id: string
  breederId: string
  buyerId: ReviewBuyerPreview | string | null
  rating: number
  text: string
  createdAt: string
}

export interface CreateReviewData {
  breederId: string
  rating: number
  text: string
}

export type ReviewIneligibilityReason = 'NO_CONFIRMED_PURCHASE' | 'ALREADY_REVIEWED'

export interface ReviewEligibility {
  canReview: boolean
  reason?: ReviewIneligibilityReason
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}
