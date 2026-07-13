import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'

interface ProtectedRouteProps {
  allowedRoles?: ('user' | 'breeder' | 'admin')[]
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

