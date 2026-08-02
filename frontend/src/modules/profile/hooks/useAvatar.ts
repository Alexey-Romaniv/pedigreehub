import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi, type AccountProfile } from '../api'
import { ACCOUNT_QUERY_KEY } from './useMyAccount'
import { useAuthStore } from '@/store'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useAvatar = () => {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)

  const applyProfile = (profile: AccountProfile) => {
    updateUser({ avatar: profile.avatar })
    queryClient.setQueryData(ACCOUNT_QUERY_KEY, profile)
  }

  const upload = useMutation<AccountProfile, unknown, File>({
    mutationFn: accountApi.uploadAvatar,
    onSuccess: (profile) => {
      applyProfile(profile)
      toaster.success({ title: 'Zdjęcie profilowe zaktualizowane' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Nie udało się przesłać zdjęcia',
        description: getApiErrorMessage(error, 'Spróbuj ponownie za chwilę'),
      })
    },
  })

  const remove = useMutation<AccountProfile, unknown, void>({
    mutationFn: accountApi.removeAvatar,
    onSuccess: (profile) => {
      applyProfile(profile)
      toaster.success({ title: 'Zdjęcie profilowe usunięte' })
    },
    onError: (error) => {
      toaster.error({
        title: 'Nie udało się usunąć zdjęcia',
        description: getApiErrorMessage(error, 'Spróbuj ponownie za chwilę'),
      })
    },
  })

  return { upload, remove }
}
