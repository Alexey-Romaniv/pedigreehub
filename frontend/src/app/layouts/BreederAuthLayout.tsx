import { Outlet, Link } from 'react-router-dom'
import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { LuPawPrint, LuShield, LuFileCheck, LuUsers } from 'react-icons/lu'

export const BreederAuthLayout = () => {
  return (
    <Flex minH="100vh">
      {/* Левая панель — декоративная */}
      <Box 
        display={{ base: 'none', lg: 'flex' }}
        w="420px"
        flexShrink={0}
        bg="backgroundGrey"
      position="relative"
      overflow="hidden"
        flexDirection="column"
      >
      {/* Header */}
        <Box p="24" borderBottom="1px solid" borderColor="linePrimary">
          <Link to="/">
            <Flex align="center" gap="8">
              <Box 
                w="36px" 
                h="36px" 
                bg="contentBlack01" 
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuPawPrint size={18} color="white" />
              </Box>
              <Text textStyle="titleLBold" color="contentBlack01">PedigreeHub</Text>
            </Flex>
          </Link>
        </Box>

        {/* Content */}
        <Box p="32" flex="1">
          <Text textStyle="titleXLBold" color="contentBlack01" mb="8">
            Dołącz do <br />społeczności hodowców
          </Text>
          <Text textStyle="labelL" color="contentGrey" mb="40">
            Platforma ze zweryfikowanymi hodowcami i pełną dokumentacją
          </Text>

          {/* Преимущества */}
          <Flex direction="column" gap="20">
            <Flex align="flex-start" gap="12">
              <Box p="8" bg="backgroundPrimary" borderRadius="8px">
                <LuShield size={20} color="#888888" />
              </Box>
              <Box>
                <Text textStyle="labelMSemibold" color="contentBlack01">Weryfikacja</Text>
                <Text textStyle="labelS" color="contentGrey">Potwierdzenie statusu hodowcy</Text>
              </Box>
            </Flex>

            <Flex align="flex-start" gap="12">
              <Box p="8" bg="backgroundPrimary" borderRadius="8px">
                <LuFileCheck size={20} color="#888888" />
              </Box>
              <Box>
                <Text textStyle="labelMSemibold" color="contentBlack01">Dokumentacja</Text>
                <Text textStyle="labelS" color="contentGrey">Rodowody i certyfikaty</Text>
              </Box>
            </Flex>

            <Flex align="flex-start" gap="12">
              <Box p="8" bg="backgroundPrimary" borderRadius="8px">
                <LuUsers size={20} color="#888888" />
              </Box>
              <Box>
                <Text textStyle="labelMSemibold" color="contentBlack01">Kupujący</Text>
                <Text textStyle="labelS" color="contentGrey">Dostęp do zweryfikowanych odbiorców</Text>
              </Box>
            </Flex>
          </Flex>
        </Box>

        {/* Footer */}
        <Box p="24" borderTop="1px solid" borderColor="linePrimary">
          <Text textStyle="labelS" color="contentGrey">
            © 2024 PedigreeHub. Wszelkie prawa zastrzeżone.
          </Text>
        </Box>
      </Box>

      {/* Правая панель — форма */}
      <Flex 
        flex="1" 
        align="center" 
        justify="center" 
        bg="backgroundPrimary"
        p={{ base: '16', md: '32' }}
        overflowY="auto"
      >
        <Container maxW="540px" w="full">
          {/* Мобильное лого */}
          <Flex justify="center" mb="24" display={{ base: 'flex', lg: 'none' }}>
            <Link to="/">
              <Flex align="center" gap="8">
                <Box 
                  w="36px" 
                  h="36px" 
                  bg="contentBlack01" 
                  borderRadius="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <LuPawPrint size={18} color="white" />
                </Box>
                <Text textStyle="titleLBold" color="contentBlack01">PedigreeHub</Text>
              </Flex>
            </Link>
          </Flex>

            <Outlet />
        </Container>
      </Flex>
    </Flex>
  )
}
