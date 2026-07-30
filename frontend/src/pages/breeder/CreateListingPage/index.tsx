import { Box, Text, Button, Stack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CreateListingWizard } from '@/modules/listings'
import { breederApi } from '@/modules/profile/api'
import { LuFileText } from 'react-icons/lu'

const CreateListingPage = () => {
  const { data: breederData, isLoading } = useQuery({
    queryKey: ['breederProfile'],
    queryFn: () => breederApi.getMe(),
  })

  if (isLoading) {
    return (
      <Box p="32" textAlign="center">
        <Text textStyle="labelM" color="contentGrey">Ładowanie...</Text>
      </Box>
    )
  }

  const verificationStatus = breederData?.data?.verification?.status

  if (verificationStatus !== 'verified') {
    return (
      <Box p="32">
        <Stack gap="24" align="center" maxW="600px" mx="auto">
          <Box
            w="64px"
            h="64px"
            bg="backgroundGrey"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="contentGrey"
          >
            <LuFileText size={32} />
          </Box>
          <Box textAlign="center">
            <Text textStyle="titleXLBold" color="contentBlack01" mb="12">
              Weryfikacja wymagana
            </Text>
            <Text textStyle="labelL" color="contentGrey" mb="24">
              Aby utworzyć ogłoszenie, musisz najpierw zweryfikować swoje konto jako hodowca.
              Prześlij wymagane dokumenty, aby kontynuować.
            </Text>
            <Button variant="solid" size="lg" asChild>
              <Link to="/breeder/documents">Przejdź do weryfikacji</Link>
            </Button>
          </Box>
        </Stack>
      </Box>
    )
  }

  return <CreateListingWizard />
}

export default CreateListingPage

