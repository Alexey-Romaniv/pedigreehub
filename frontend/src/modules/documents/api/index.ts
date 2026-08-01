import { axiosInstance } from '@/shared/api/axiosInstance'
import type { UploadDocumentResponse } from '../types'

export const documentsApi = {
  upload: async (file: File, type: string): Promise<UploadDocumentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await axiosInstance.post<UploadDocumentResponse>(
      '/documents/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/documents/${id}`)
  },
}

