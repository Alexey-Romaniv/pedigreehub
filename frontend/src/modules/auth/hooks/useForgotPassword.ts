import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import type { ForgotPasswordData, AuthMessageResponse } from '../types'
import type { IApiError } from '@/types'

export const useForgotPassword = () => {
  return useMutation<AuthMessageResponse, AxiosError<IApiError>, ForgotPasswordData>({
    mutationFn: authApi.forgotPassword,
  })
}
