import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { authApi } from '../api'
import { useBreederRegistrationStore } from '../store'
import { useAuthStore } from '@/store'
import { toaster } from '@/shared/theme/toaster'
import type { RegisterBreederData, Step1Data, Step2Data, LoginResponse } from '../types'
import type { IApiError } from '@/types'

export const useRegisterBreeder = () => {
  const navigate = useNavigate()
  const reset = useBreederRegistrationStore((s) => s.reset)
  const login = useAuthStore((s) => s.login)

  const mutation = useMutation<LoginResponse, AxiosError<IApiError>, RegisterBreederData & { password: string }>({
    mutationFn: async (data) => {
      await authApi.registerBreeder(data)
      // После регистрации сразу логиним
      const loginResponse = await authApi.login({ email: data.email, password: data.password })
      return loginResponse
    },
    onSuccess: (response) => {
      login(response.data.user, response.data.accessToken, response.data.refreshToken)
      toaster.success({
        title: 'Rejestracja zakończona!',
        description: 'Prześlij dokumenty do weryfikacji w panelu.',
      })
      reset()
      navigate('/breeder/dashboard')
    },
    onError: (err) => {
      toaster.error({
        title: 'Błąd rejestracji',
        description: err.response?.data?.error?.message || 'Coś poszło nie tak',
      })
    },
  })

  const submit = (step1Data: Step1Data, step2Data: Step2Data) => {
    mutation.mutate({
      email: step1Data.email,
      password: step1Data.password,
      firstName: step1Data.firstName,
      lastName: step1Data.lastName,
      phone: step1Data.phone,
      kennelName: step2Data.kennelName,
      kennelRegistration: step2Data.kennelRegistration,
      region: step2Data.region,
      city: step2Data.city,
      address: step2Data.address || undefined,
      description: step2Data.description,
      website: step2Data.website || undefined,
      socialLinks: {
        facebook: step2Data.facebook || undefined,
        instagram: step2Data.instagram || undefined,
      },
      breeds: step2Data.breeds,
    })
  }

  return { ...mutation, submit }
}
