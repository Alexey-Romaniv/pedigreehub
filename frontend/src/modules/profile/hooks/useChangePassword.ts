import { useMutation } from '@tanstack/react-query'
import { accountApi, type AuthTokens, type ChangePasswordData } from '../api'
import { useAuthStore } from '@/store'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useChangePassword = () => {
  const setTokens = useAuthStore((state) => state.setTokens)

  return useMutation<AuthTokens, unknown, ChangePasswordData>({
    mutationFn: accountApi.changePassword,
    onSuccess: (tokens) => {
      // Backend инвалидирует прежний refresh token — подменяем пару, чтобы сессия не оборвалась
      setTokens(tokens.accessToken, tokens.refreshToken)
      toaster.success({
        title: 'Hasło zostało zmienione',
        description: 'Pozostałe sesje zostały wylogowane',
      })
    },
    onError: (error) => {
      toaster.error({
        title: 'Nie udało się zmienić hasła',
        description: getApiErrorMessage(error, 'Sprawdź aktualne hasło i spróbuj ponownie'),
      })
    },
  })
}
