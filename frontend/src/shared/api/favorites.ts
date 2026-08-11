import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from './axiosInstance'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from './apiError'
import { useAuthStore } from '@/store'

// Избранное живёт в shared (как breeds): сердечко нужно карточкам из modules/listings,
// а модули друг из друга не импортируют

export interface FavoriteEntry<TListing = unknown> {
  _id: string
  listingId: TListing | null
  createdAt: string
}

export interface FavoritesPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export const favoritesApi = {
  add: async (listingId: string): Promise<void> => {
    await axiosInstance.post(`/favorites/${listingId}`)
  },

  remove: async (listingId: string): Promise<void> => {
    await axiosInstance.delete(`/favorites/${listingId}`)
  },

  getIds: async (): Promise<string[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: string[] }>(
      '/favorites/ids'
    )
    return response.data.data
  },

  getList: async <TListing>(
    page = 1
  ): Promise<{ favorites: FavoriteEntry<TListing>[]; pagination: FavoritesPagination }> => {
    const response = await axiosInstance.get<{
      success: boolean
      data: FavoriteEntry<TListing>[]
      pagination: FavoritesPagination
    }>('/favorites', { params: { page, limit: 24 } })
    return { favorites: response.data.data, pagination: response.data.pagination }
  },
}

// ID избранного текущего пользователя (для сердечек); для анонима не запрашивается
export const useFavoriteIds = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return useQuery({
    queryKey: ['favoriteIds'],
    queryFn: favoritesApi.getIds,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
}

export const useFavoritesList = <TListing>(page = 1) => {
  return useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoritesApi.getList<TListing>(page),
  })
}

export const useToggleFavorite = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listingId, favorite }: { listingId: string; favorite: boolean }) =>
      favorite ? favoritesApi.add(listingId) : favoritesApi.remove(listingId),
    // Оптимистичное сердечко: мгновенный отклик, откат при ошибке
    onMutate: async ({ listingId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favoriteIds'] })
      const previous = queryClient.getQueryData<string[]>(['favoriteIds'])
      queryClient.setQueryData<string[]>(['favoriteIds'], (old = []) =>
        favorite ? [...old, listingId] : old.filter((id) => id !== listingId)
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favoriteIds'], context.previous)
      }
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się zaktualizować ulubionych'),
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteIds'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
