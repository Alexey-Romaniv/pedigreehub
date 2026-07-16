import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import type { ResetPasswordData, AuthMessageResponse } from '../types'
import type { IApiError } from '@/types'

export const useResetPassword = () => {
  return useMutation<AuthMessageResponse, AxiosError<IApiError>, ResetPasswordData>({
    mutationFn: authApi.resetPassword,
  })
}
