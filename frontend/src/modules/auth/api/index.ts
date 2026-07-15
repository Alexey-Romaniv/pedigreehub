import { axiosInstance } from '@/shared/api/axiosInstance'
import type {
  RegisterData,
  RegisterResponse,
  LoginData,
  LoginResponse,
  CheckEmailResponse,
  RegisterBreederData,
  RegisterBreederResponse,
  ForgotPasswordData,
  ResetPasswordData,
  AuthMessageResponse,
  VerifyEmailResponse,
} from '../types'

export const authApi = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await axiosInstance.post<RegisterResponse>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    const response = await axiosInstance.post<CheckEmailResponse>('/auth/check-email', { email })
    return response.data
  },

  registerBreeder: async (data: RegisterBreederData): Promise<RegisterBreederResponse> => {
    const response = await axiosInstance.post<RegisterBreederResponse>('/auth/register/breeder', data)
    return response.data
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<AuthMessageResponse> => {
    const response = await axiosInstance.post<AuthMessageResponse>('/auth/forgot-password', data)
    return response.data
  },

  resetPassword: async (data: ResetPasswordData): Promise<AuthMessageResponse> => {
    const response = await axiosInstance.post<AuthMessageResponse>('/auth/reset-password', data)
    return response.data
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const response = await axiosInstance.get<VerifyEmailResponse>(`/auth/verify-email/${token}`)
    return response.data
  },
}

