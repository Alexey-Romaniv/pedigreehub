import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from './axiosInstance'

export interface Breed {
  _id: string
  name: string
  nameEn: string
  fciGroup?: number
}

export interface BreedsResponse {
  success: boolean
  data: Breed[]
}

export const breedsApi = {
  getAll: async (): Promise<BreedsResponse> => {
    const response = await axiosInstance.get<BreedsResponse>('/breeds')
    return response.data
  },
}

export const useBreeds = () => {
  return useQuery({
    queryKey: ['breeds'],
    queryFn: async () => {
      const response = await breedsApi.getAll()
      if (!response.success) {
        throw new Error('Nie udało się załadować listy ras')
      }
      return response.data || []
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })
}
