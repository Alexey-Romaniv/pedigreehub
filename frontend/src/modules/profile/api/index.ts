import { axiosInstance } from '@/shared/api/axiosInstance'

export interface UploadDocumentResponse {
  success: boolean
  data: {
    _id: string
    type: string
    fileName: string
    fileUrl: string
    status: 'pending' | 'approved' | 'rejected'
  }
}

export interface DocumentInfo {
  _id: string
  type: string
  fileName: string
  originalName: string
  fileUrl: string
  mimeType: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  createdAt: string
}

export interface MyDocumentsResponse {
  success: boolean
  data: DocumentInfo[]
}

export interface VerifyNipResponse {
  success: boolean
  data: {
    verified: boolean
    companyName?: string
    error?: string
  }
}

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

  uploadMultiple: async (files: File[], type: string): Promise<UploadDocumentResponse[]> => {
    const uploads = files.map(file => documentsApi.upload(file, type))
    return Promise.all(uploads)
  },

  getMyDocuments: async (type?: string): Promise<MyDocumentsResponse> => {
    const params = type ? { type } : {}
    const response = await axiosInstance.get<MyDocumentsResponse>('/documents/my', { params })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/documents/${id}`)
  },
}

export interface BreederVerification {
  status: 'pending' | 'verified' | 'rejected'
  level: 'new' | 'verified' | 'trusted' | 'professional'
  emailVerified: boolean
  zkwpVerified: boolean
  identityVerified: boolean
  nipVerified: boolean
  nipVerifiedAt?: string
  nipCompanyName?: string
  nip?: string
}

export interface BreederProfile {
  _id: string
  kennelName: string
  verification: BreederVerification
}

export interface BreederProfileResponse {
  success: boolean
  data: BreederProfile
}

export const breederApi = {
  getMe: async (): Promise<BreederProfileResponse> => {
    const response = await axiosInstance.get<BreederProfileResponse>('/breeders/me')
    return response.data
  },

  verifyNip: async (nip: string): Promise<VerifyNipResponse> => {
    const response = await axiosInstance.post<VerifyNipResponse>('/breeders/me/verify-nip', { nip })
    return response.data
  },
}

// === Настройки аккаунта ===

export interface AccountProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'user' | 'breeder' | 'admin'
  isVerified: boolean
  isEmailVerified: boolean
  avatar?: string
}

export interface UpdateProfileData {
  firstName: string
  lastName: string
  phone: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export const accountApi = {
  getMe: async (): Promise<AccountProfile> => {
    const response = await axiosInstance.get<{ success: boolean; data: AccountProfile }>('/auth/me')
    return response.data.data
  },

  updateProfile: async (data: UpdateProfileData): Promise<AccountProfile> => {
    const response = await axiosInstance.patch<{ success: boolean; data: AccountProfile }>(
      '/users/me',
      data
    )
    return response.data.data
  },

  uploadAvatar: async (file: File): Promise<AccountProfile> => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axiosInstance.post<{ success: boolean; data: AccountProfile }>(
      '/users/me/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  removeAvatar: async (): Promise<AccountProfile> => {
    const response = await axiosInstance.delete<{ success: boolean; data: AccountProfile }>(
      '/users/me/avatar'
    )
    return response.data.data
  },

  changePassword: async (data: ChangePasswordData): Promise<AuthTokens> => {
    const response = await axiosInstance.post<{ success: boolean; data: AuthTokens }>(
      '/auth/change-password',
      data
    )
    return response.data.data
  },
}

