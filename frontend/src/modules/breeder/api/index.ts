import { axiosInstance } from '@/shared/api/axiosInstance'
import type { BreederStatsResponse, PublicBreederProfile } from '../types'

export const breederApi = {
  // Статистика для дашборда заводчика
  getMyStats: async (): Promise<BreederStatsResponse> => {
    const response = await axiosInstance.get<{ success: boolean; data: BreederStatsResponse }>(
      '/breeders/me/stats'
    )
    return response.data.data
  },

  // Публичный профиль заводчика
  getPublicProfile: async (id: string): Promise<PublicBreederProfile> => {
    const response = await axiosInstance.get<{ success: boolean; data: PublicBreederProfile }>(
      `/breeders/${id}`
    )
    return response.data.data
  },
}
