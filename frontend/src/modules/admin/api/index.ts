import { api } from '@/shared/api'
import type {
  PendingDocument,
  PaginatedResponse,
  DocumentType,
  AdminListing,
  ListingModerationFilters,
  AdminUser,
  AdminUsersFilters,
  AdminStats,
  AdminBreederDetails,
} from '../types'

export const adminApi = {
  getPendingDocuments: (params?: { page?: number; limit?: number; type?: DocumentType }) => 
    api.get<PaginatedResponse<PendingDocument>['data']>('/admin/documents/pending', { params }),

  approveDocument: (id: string) => 
    api.post(`/admin/documents/${id}/approve`),

  rejectDocument: (id: string, reason?: string) => 
    api.post(`/admin/documents/${id}/reject`, { reason }),

  // Listing moderation
  getPendingListings: (params?: ListingModerationFilters) => 
    api.get<PaginatedResponse<AdminListing>['data']>('/admin/listings/pending', { params }),

  getListingById: (id: string) => 
    api.get<{ success: boolean; data: AdminListing }>(`/admin/listings/${id}`),

  approveListing: (id: string) => 
    api.post<{ success: boolean; data: AdminListing }>(`/admin/listings/${id}/approve`),

  rejectListing: (id: string, reason?: string) =>
    api.post<{ success: boolean; data: AdminListing }>(`/admin/listings/${id}/reject`, { reason }),

  // Users
  getUsers: async (params?: AdminUsersFilters): Promise<PaginatedResponse<AdminUser>> => {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params })
    return response.data
  },

  blockUser: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/users/${id}/block`),

  unblockUser: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/admin/users/${id}/unblock`),

  // Breeders
  getBreederById: async (id: string): Promise<AdminBreederDetails> => {
    const response = await api.get<{ success: boolean; data: AdminBreederDetails }>(
      `/admin/breeders/${id}`
    )
    return response.data.data
  },

  // Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats')
    return response.data.data
  },
}
