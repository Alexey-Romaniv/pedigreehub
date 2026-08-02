import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi, type AccountProfile, type UpdateProfileData } from '../api'
import { ACCOUNT_QUERY_KEY } from './useMyAccount'
import { useAuthStore } from '@/store'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)

  return useMutation<AccountProfile, unknown, UpdateProfileData>({
    mutationFn: accountApi.updateProfile,
    onSuccess: (profile) => {
      // Имя видно в сайдбаре и хедере — синхронизируем store
      updateUser({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      })
      queryClient.setQueryData(ACCOUNT_QUERY_KEY, profile)
      toaster.success({ title: 'Dane zostały zapisane' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Nie udało się zapisać danych',
        description: getApiErrorMessage(error, 'Spróbuj ponownie za chwilę'),
      })
    },
  })
}
