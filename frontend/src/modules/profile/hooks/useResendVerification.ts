import { useMutation } from '@tanstack/react-query'
import { accountApi } from '../api'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

export const useResendVerification = () => {
  return useMutation<void, unknown, void>({
    mutationFn: accountApi.resendVerification,
    onSuccess: () => {
      toaster.success({
        title: 'Link weryfikacyjny wysłany',
        description: 'Sprawdź skrzynkę — link jest ważny 24 godziny',
      })
    },
    onError: (error) => {
      toaster.error({
        title: 'Nie udało się wysłać linku',
        description: getApiErrorMessage(error, 'Spróbuj ponownie za kilka minut'),
      })
    },
  })
}
