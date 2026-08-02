import { Outlet } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import { AppSidebar, CabinetMobileBar } from '@/app/components/AppSidebar'

export const UserLayout = () => {
  return (
    <Flex direction="column" minH="100vh">
      <CabinetMobileBar />
      <Flex flex="1" position="relative">
        <AppSidebar />
        <Box
          flex="1"
          bg="backgroundPrimary"
          overflow="auto"
          ml={{ base: 0, md: '240px' }}
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  )
}
