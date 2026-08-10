import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../api'
import type { CreateReviewData } from '../types'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage, type ApiError } from '@/shared/api'

export const useBreederReviews = (breederId: string | undefined, page = 1) => {
  return useQuery({
    queryKey: ['breederReviews', breederId, page],
    queryFn: () => reviewsApi.getForBreeder(breederId!, page),
    enabled: !!breederId,
  })
}

// Право на отзыв — только для залогиненного (enabled управляется снаружи)
export const useReviewEligibility = (breederId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['reviewEligibility', breederId],
    queryFn: () => reviewsApi.getEligibility(breederId!),
    enabled: !!breederId && enabled,
  })
}

export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReviewData) => reviewsApi.create(data),
    onSuccess: (_data, variables) => {
      toaster.success({ title: 'Dziękujemy za wystawienie opinii!' })
      queryClient.invalidateQueries({ queryKey: ['breederReviews', variables.breederId] })
      queryClient.invalidateQueries({ queryKey: ['reviewEligibility', variables.breederId] })
      // Рейтинг заводчика на профиле пересчитался на бэке
      queryClient.invalidateQueries({ queryKey: ['breederProfile', variables.breederId] })
    },
    onError: (error: ApiError) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się wystawić opinii'),
      })
    },
  })
}
