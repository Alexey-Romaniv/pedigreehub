import { axiosInstance } from '@/shared/api/axiosInstance'
import type { CreateReviewData, Pagination, Review, ReviewEligibility } from '../types'

export const reviewsApi = {
  create: async (data: CreateReviewData): Promise<{ id: string; rating: number }> => {
    const response = await axiosInstance.post<{
      success: boolean
      data: { id: string; rating: number }
    }>('/reviews', data)
    return response.data.data
  },

  getForBreeder: async (
    breederId: string,
    page = 1
  ): Promise<{ reviews: Review[]; pagination: Pagination }> => {
    const response = await axiosInstance.get<{
      success: boolean
      data: Review[]
      pagination: Pagination
    }>(`/reviews/breeder/${breederId}`, { params: { page, limit: 10 } })
    return { reviews: response.data.data, pagination: response.data.pagination }
  },

  getEligibility: async (breederId: string): Promise<ReviewEligibility> => {
    const response = await axiosInstance.get<{ success: boolean; data: ReviewEligibility }>(
      `/reviews/eligibility/${breederId}`
    )
    return response.data.data
  },
}
