import { Outlet, Link } from 'react-router-dom'
import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { LuPawPrint } from 'react-icons/lu'

export const AuthLayout = () => {
  return (
    <Flex minH="100vh">
      {/* Левая панель — форма */}
      <Flex 
        flex="1" 
        align="center" 
        justify="center" 
        bg="backgroundPrimary"
        p={{ base: '16', md: '32' }}
      >
        <Container maxW="420px" w="full">
          {/* Logo */}
          <Flex justify="center" mb="32">
            <Link to="/">
              <Flex align="center" gap="8">
                <Box 
                  w="40px" 
                  h="40px" 
                  bg="contentBlack01" 
                  borderRadius="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <LuPawPrint size={20} color="white" />
                </Box>
                <Text textStyle="titleXLBold" color="contentBlack01">PedigreeHub</Text>
              </Flex>
            </Link>
          </Flex>

          {/* Содержимое формы */}
          <Box bg="backgroundPrimary" p={{ base: '0', md: '24' }} borderRadius="12px">
            <Outlet />
          </Box>
        </Container>
      </Flex>

      {/* Правая панель — декоративная */}
      <Box 
        display={{ base: 'none', lg: 'flex' }}
        flex="1"
        bg="backgroundGrey"
        position="relative"
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
      >
        <Box textAlign="center" p="64" position="relative" zIndex="1">
          <Text textStyle="displayXXLBold" color="contentBlack01" mb="16">
            Znajdź swojego <br />idealnego szczeniaka
          </Text>
          <Text textStyle="labelL" color="contentGrey" maxW="360px" mx="auto">
            Platforma ze zweryfikowanymi hodowcami i pełną dokumentacją zwierząt
          </Text>
          
          {/* Статистика */}
          <Flex justify="center" gap="32" mt="48">
            <Box textAlign="center">
              <Text textStyle="titleXLBold" color="contentBlack01">500+</Text>
              <Text textStyle="labelM" color="contentGrey">Hodowców</Text>
            </Box>
            <Box textAlign="center">
              <Text textStyle="titleXLBold" color="contentBlack01">50+</Text>
              <Text textStyle="labelM" color="contentGrey">Ras</Text>
            </Box>
            <Box textAlign="center">
              <Text textStyle="titleXLBold" color="contentBlack01">100%</Text>
              <Text textStyle="labelM" color="contentGrey">Weryfikacja</Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Flex>
  )
}
