import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Flex, Spinner } from '@chakra-ui/react'

// Lazy load pages
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'))
const PuppyPage = lazy(() => import('@/pages/public/PuppyPage'))
const BreederProfilePage = lazy(() => import('@/pages/public/BreederProfilePage'))

// Layouts
import { MainLayout } from '@/app/layouts/MainLayout'

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
      </Routes>
    </Suspense>
  )
}
