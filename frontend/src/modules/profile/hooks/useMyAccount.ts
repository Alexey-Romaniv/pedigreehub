import { useQuery } from '@tanstack/react-query'
import { accountApi } from '../api'

export const ACCOUNT_QUERY_KEY = ['account', 'me'] as const

// Аватар и телефон в store не попадают (их нет в ответе логина) — тянем свежий профиль
export const useMyAccount = () =>
  useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: accountApi.getMe,
    staleTime: 60_000,
  })
