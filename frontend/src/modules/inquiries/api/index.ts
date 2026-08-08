import { axiosInstance } from '@/shared/api/axiosInstance'
import type { CreateInquiryData, Inquiry } from '../types'

export const inquiriesApi = {
  create: async (data: CreateInquiryData): Promise<{ id: string; status: string }> => {
    const response = await axiosInstance.post<{
      success: boolean
      data: { id: string; status: string }
    }>('/inquiries', data)
    return response.data.data
  },

  getMy: async (): Promise<Inquiry[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: Inquiry[] }>(
      '/inquiries/my',
      { params: { limit: 50 } }
    )
    return response.data.data
  },

  getReceived: async (): Promise<Inquiry[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: Inquiry[] }>(
      '/inquiries/received',
      { params: { limit: 50 } }
    )
    return response.data.data
  },

  getById: async (id: string): Promise<Inquiry> => {
    const response = await axiosInstance.get<{ success: boolean; data: Inquiry }>(
      `/inquiries/${id}`
    )
    return response.data.data
  },

  sendMessage: async (id: string, message: string): Promise<Inquiry> => {
    const response = await axiosInstance.post<{ success: boolean; data: Inquiry }>(
      `/inquiries/${id}/messages`,
      { message }
    )
    return response.data.data
  },

  close: async (id: string): Promise<void> => {
    await axiosInstance.patch(`/inquiries/${id}/status`, { status: 'closed' })
  },

  confirmPurchase: async (id: string): Promise<void> => {
    await axiosInstance.post(`/inquiries/${id}/confirm-purchase`)
  },
}
