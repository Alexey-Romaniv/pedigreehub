import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Flex, Spinner } from '@chakra-ui/react'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'))
const PuppyPage = lazy(() => import('@/pages/public/PuppyPage'))
const BreederProfilePage = lazy(() => import('@/pages/public/BreederProfilePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const BreederRegisterPage = lazy(() => import('@/pages/auth/BreederRegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))

// Layouts
import { MainLayout } from '@/app/layouts/MainLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { BreederAuthLayout } from '@/app/layouts/BreederAuthLayout'

// Route guards
import { GuestRoute } from './GuestRoute'

// Loading fallback
const PageLoader = () => (
  <Flex justify="center" align="center" minH="100vh" bg="backgroundPrimary">
    <Spinner size="lg" color="contentGrey" />
  </Flex>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Публичные страницы — доступны всем (гостям и авторизованным) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/puppy/:id" element={<PuppyPage />} />
          <Route path="/breeder/:id" element={<BreederProfilePage />} />
        </Route>

        {/* Только для неавторизованных — авторизованных редиректим в их панель */}
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route element={<BreederAuthLayout />}>
            <Route path="/register/breeder" element={<BreederRegisterPage />} />
          </Route>
        </Route>

        {/* Сброс пароля и верификация email — доступны и авторизованным */}
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
