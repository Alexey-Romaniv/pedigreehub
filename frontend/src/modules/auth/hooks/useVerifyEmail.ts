import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import type { VerifyEmailResponse } from '../types'
import type { IApiError } from '@/types'

export const useVerifyEmail = (token: string | null) => {
  return useQuery<VerifyEmailResponse, AxiosError<IApiError>>({
    queryKey: ['verifyEmail', token],
    queryFn: () => authApi.verifyEmail(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })
}
