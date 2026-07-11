import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { IUser } from '@/types'

interface IAuthState {
  user: IUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  login: (user: IUser, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (data: Partial<IUser>) => void
  setTokens: (accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<IAuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'pedigreehub-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
