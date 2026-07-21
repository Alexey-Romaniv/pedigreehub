import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listingsApi } from '../api'
import type { CreateListingFormData, ListingStatus, PublicListingsParams } from '../types'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useMyListings = (status?: ListingStatus) => {
  return useQuery({
    queryKey: ['myListings', status ?? 'all'],
    queryFn: () => listingsApi.getMy(status),
  })
}

export const usePublicListings = (params: PublicListingsParams) => {
  return useQuery({
    queryKey: ['publicListings', params],
    queryFn: () => listingsApi.getPublic(params),
    placeholderData: (prev) => prev,
  })
}

export const useListing = (id: string | undefined) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id!),
    enabled: !!id,
    retry: (failureCount, error) => {
      // 404/403 повторять нет смысла
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 403 || status === 400) return false
      return failureCount < 2
    },
  })
}

const invalidateListingQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['myListings'] })
  queryClient.invalidateQueries({ queryKey: ['publicListings'] })
  queryClient.invalidateQueries({ queryKey: ['breederStats'] })
}

export const useUpdateListingStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      listingsApi.updateStatus(id, status),
    onSuccess: () => {
      toaster.success({ title: 'Status ogłoszenia zaktualizowany' })
      invalidateListingQueries(queryClient)
    },
    onError: (error: unknown) => {
      toaster.error({ title: getApiErrorMessage(error, 'Nie udało się zmienić statusu') })
    },
  })
}

export const useUpdateListing = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
      existingPhotos,
      submit,
    }: {
      id: string
      data: CreateListingFormData
      existingPhotos: string[]
      /** true — после сохранения отправить на модерацию (draft/rejected → pending) */
      submit: boolean
    }) => {
      const listing = await listingsApi.update(id, data, existingPhotos)
      if (submit) {
        return listingsApi.updateStatus(id, 'pending')
      }
      return listing
    },
    onSuccess: (_data, variables) => {
      invalidateListingQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['listing', variables.id] })
      toaster.success({
        title: variables.submit
          ? 'Ogłoszenie wysłano do moderacji'
          : 'Zmiany zostały zapisane',
      })
      navigate('/breeder/listings')
    },
    onError: (error: unknown) => {
      toaster.error({ title: getApiErrorMessage(error, 'Nie udało się zapisać zmian') })
    },
  })
}

export const useDeleteListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => listingsApi.remove(id),
    onSuccess: () => {
      toaster.success({ title: 'Ogłoszenie usunięte' })
      invalidateListingQueries(queryClient)
    },
    onError: (error: unknown) => {
      toaster.error({ title: getApiErrorMessage(error, 'Nie udało się usunąć ogłoszenia') })
    },
  })
}
