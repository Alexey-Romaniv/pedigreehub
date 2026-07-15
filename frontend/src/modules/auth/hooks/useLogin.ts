import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import { useAuthStore } from '@/store'
import type { LoginData, LoginResponse } from '../types'
import type { IApiError } from '@/types'

export const useLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  return useMutation<LoginResponse, AxiosError<IApiError>, LoginData>({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const user = response.data.user
      login(user, response.data.accessToken, response.data.refreshToken)

      // Редирект на предыдущую страницу или панель по роли
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      if (from) {
        navigate(from)
      } else {
        switch (user.role) {
          case 'admin':
            navigate('/admin/verification')
            break
          case 'breeder':
            navigate('/breeder/dashboard')
            break
          default:
            navigate('/profile')
        }
      }
    },
  })
}

