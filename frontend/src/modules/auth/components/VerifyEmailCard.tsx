import { Box, Text, Button, Spinner, Flex } from '@chakra-ui/react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuCircleCheck, LuCircleX } from 'react-icons/lu'
import { useVerifyEmail } from '../hooks'
import { useAuthStore } from '@/store'

export const VerifyEmailCard = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { data, isLoading, error } = useVerifyEmail(token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!token) {
    return (
      <Box textAlign="center">
        <Flex justify="center" mb="16" color="statusTextRed"><LuCircleX size={48} /></Flex>
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Nieprawidłowy link</Text>
        <Text textStyle="labelL" color="contentGrey">
          Link weryfikacyjny jest niekompletny. Sprawdź, czy skopiowałeś cały adres z wiadomości email.
        </Text>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Flex direction="column" align="center" gap="16">
        <Spinner size="lg" color="contentGrey" />
        <Text textStyle="labelL" color="contentGrey">Weryfikujemy Twój email…</Text>
      </Flex>
    )
  }

  if (error) {
    const apiError = error.response?.data?.error
    return (
      <Box textAlign="center">
        <Flex justify="center" mb="16" color="statusTextRed"><LuCircleX size={48} /></Flex>
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Weryfikacja nie powiodła się</Text>
        <Text textStyle="labelL" color="contentGrey" mb="24">
          {apiError?.message || 'Nieprawidłowy lub wygasły link weryfikacyjny'}
        </Text>
        <Link to="/">
          <Button variant="outline" size="lg" w="full">Wróć na stronę główną</Button>
        </Link>
      </Box>
    )
  }

  return (
    <Box textAlign="center">
      <Flex justify="center" mb="16" color="statusTextGreen"><LuCircleCheck size={48} /></Flex>
      <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Email potwierdzony!</Text>
      <Text textStyle="labelL" color="contentGrey" mb="24">
        Adres <Text as="span" color="contentBlack01" fontWeight="semibold">{data?.data.email}</Text> został pomyślnie zweryfikowany.
      </Text>
      <Link to={isAuthenticated ? '/profile' : '/login'}>
        <Button variant="solid" size="lg" w="full">
          {isAuthenticated ? 'Przejdź do profilu' : 'Zaloguj się'}
        </Button>
      </Link>
    </Box>
  )
}
