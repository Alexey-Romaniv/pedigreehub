import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listingsApi } from '../api'
import type { CreateListingFormData } from '../types'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useCreateListing = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, status }: { data: CreateListingFormData; status: 'draft' | 'pending' }) =>
      listingsApi.create(data, status),
    onSuccess: (_data, variables) => {
      // Без инвалидации новое объявление не появлялось в списках до 5 минут (staleTime)
      queryClient.invalidateQueries({ queryKey: ['myListings'] })
      queryClient.invalidateQueries({ queryKey: ['breederStats'] })
      const message = variables.status === 'draft'
        ? 'Ogłoszenie zapisano jako szkic'
        : 'Ogłoszenie wysłano do moderacji'
      toaster.success({ title: message })
      navigate('/breeder/listings')
    },
    onError: (error: unknown) => {
      toaster.error({ title: getApiErrorMessage(error, 'Błąd podczas tworzenia ogłoszenia') })
    },
  })
}
