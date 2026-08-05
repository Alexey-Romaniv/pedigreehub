import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Flex, Spinner, Text } from '@chakra-ui/react'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'))
const PuppyPage = lazy(() => import('@/pages/public/PuppyPage'))
const BreederProfilePage = lazy(() => import('@/pages/public/BreederProfilePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const BreederRegisterPage = lazy(() => import('@/pages/auth/BreederRegisterPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const SettingsPage = lazy(() => import('@/pages/profile/SettingsPage'))
const BreederDocumentsPage = lazy(() => import('@/pages/breeder/DocumentsPage'))
const BreederDashboardPage = lazy(() => import('@/pages/breeder/DashboardPage'))
const CreateListingPage = lazy(() => import('@/pages/breeder/CreateListingPage'))
const MyListingsPage = lazy(() => import('@/pages/breeder/MyListingsPage'))
const EditListingPage = lazy(() => import('@/pages/breeder/EditListingPage'))
const InquiriesPage = lazy(() => import('@/pages/profile/InquiriesPage'))
const FavoritesPage = lazy(() => import('@/pages/profile/FavoritesPage'))
const InquiryThreadPage = lazy(() => import('@/pages/profile/InquiryThreadPage'))
const BreederInquiriesPage = lazy(() => import('@/pages/breeder/InquiriesPage'))
const BreederInquiryThreadPage = lazy(() => import('@/pages/breeder/InquiryThreadPage'))
const AdminVerificationPage = lazy(() => import('@/pages/admin/VerificationPage'))
const AdminListingModerationPage = lazy(() => import('@/pages/admin/ListingModerationPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))

// Layouts
import { MainLayout } from '@/app/layouts/MainLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { BreederAuthLayout } from '@/app/layouts/BreederAuthLayout'
import { BreederLayout } from '@/app/layouts/BreederLayout'
import { AdminLayout } from '@/app/layouts/AdminLayout'
import { UserLayout } from '@/app/layouts/UserLayout'

// Route guards
import { ProtectedRoute } from './ProtectedRoute'
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

        {/* Панель покупателя (user, breeder, admin) — аккаунт в UserLayout */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'breeder', 'admin']} />}>
          <Route element={<UserLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/favorites" element={<FavoritesPage />} />
            <Route path="/profile/inquiries" element={<InquiriesPage />} />
            <Route path="/profile/inquiries/:id" element={<InquiryThreadPage />} />
            <Route path="/profile/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Панель заводчика (breeder) — BreederLayout с сайдбаром */}
        <Route element={<ProtectedRoute allowedRoles={['breeder']} />}>
          <Route element={<BreederLayout />}>
            <Route path="/breeder" element={<Navigate to="/breeder/dashboard" replace />} />
            <Route path="/breeder/dashboard" element={<BreederDashboardPage />} />
            <Route path="/breeder/documents" element={<BreederDocumentsPage />} />
            <Route path="/breeder/listings" element={<MyListingsPage />} />
            <Route path="/breeder/listings/new" element={<CreateListingPage />} />
            <Route path="/breeder/listings/:id/edit" element={<EditListingPage />} />
            <Route path="/breeder/inquiries" element={<BreederInquiriesPage />} />
            <Route path="/breeder/inquiries/:id" element={<BreederInquiryThreadPage />} />
          </Route>
        </Route>

        {/* Панель админа (admin) — AdminLayout с тёмным сайдбаром */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/verification" replace />} />
            <Route path="/admin/verification" element={<AdminVerificationPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/moderation" element={<AdminListingModerationPage />} />
          </Route>
        </Route>

        {/* 404 — страница не найдена */}
        <Route path="*" element={
          <Flex minH="100vh" align="center" justify="center" bg="backgroundPrimary" direction="column" gap="8">
            <Text textStyle="displayXXLBold" color="contentBlack01">404</Text>
            <Text textStyle="titleLBold" color="contentBlack01">Strona nie znaleziona</Text>
          </Flex>
        } />
      </Routes>
    </Suspense>
  )
}
