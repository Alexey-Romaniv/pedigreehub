import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import { useAuthStore } from '@/store'
import type { RegisterData } from '../types'
import type { IApiError } from '@/types'

export const useRegister = () => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      await authApi.register(data)
      // После регистрации сразу логиним
      const loginResponse = await authApi.login({ email: data.email, password: data.password })
      return loginResponse
    },
    onSuccess: (response) => {
      login(response.data.user, response.data.accessToken, response.data.refreshToken)
      navigate('/profile')
    },
    onError: (error: AxiosError<IApiError>) => {
      console.error('Registration error:', error.response?.data)
    },
  })
}
