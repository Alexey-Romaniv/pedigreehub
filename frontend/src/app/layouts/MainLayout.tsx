import { Outlet } from 'react-router-dom'
import { Flex, Box } from '@chakra-ui/react'
import { PublicHeader } from '@/app/components/PublicHeader'
import { PublicFooter } from '@/app/components/PublicFooter'

export const MainLayout = () => {
  return (
    <Flex direction="column" minH="100vh" bg="backgroundPrimary">
      <PublicHeader />
      <Box as="main" flex="1">
        <Outlet />
      </Box>
      <PublicFooter />
    </Flex>
  )
}
