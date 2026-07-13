import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store'

/**
 * GuestRoute - только для неавторизованных пользователей
 * Авторизованные редиректятся на свою панель в зависимости от роли
 */
export const GuestRoute = () => {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    // Редирект в зависимости от роли
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/verification" replace />
      case 'breeder':
        return <Navigate to="/breeder/dashboard" replace />
      default:
        return <Navigate to="/profile" replace />
    }
  }

  return <Outlet />
}
