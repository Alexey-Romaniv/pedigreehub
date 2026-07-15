import { useMutation } from '@tanstack/react-query'
import { authApi } from '../api'

export const useCheckEmail = () => {
  return useMutation({
    mutationFn: authApi.checkEmail,
  })
}

