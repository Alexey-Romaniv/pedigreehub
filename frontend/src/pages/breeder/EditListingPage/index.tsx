import { Box, Button, Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import { Link, useParams } from 'react-router-dom'
import { LuArrowLeft, LuLock } from 'react-icons/lu'
import { CreateListingWizard } from '@/modules/listings'
import { useListing } from '@/modules/listings/hooks'

const EDITABLE_STATUSES = ['draft', 'rejected']

const EditListingPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: listing, isLoading, error } = useListing(id)

  if (isLoading) {
    return (
      <Container maxW="container.xl" py="32">
        <Stack gap="16">
          <Skeleton h="48px" maxW="400px" borderRadius="8px" />
          <Skeleton h="56px" borderRadius="12px" />
          <Skeleton h="400px" borderRadius="16px" />
        </Stack>
      </Container>
    )
  }

  if (error || !listing) {
    return (
      <Container maxW="container.xl" py="32">
        <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
          <Text textStyle="titleSBold" color="contentBlack01" mb="8">
            Nie udało się załadować ogłoszenia
          </Text>
          <Text textStyle="labelM" color="contentGrey" mb="20">
            Ogłoszenie nie istnieje lub nie masz do niego dostępu
          </Text>
          <Button variant="outline" asChild>
            <Link to="/breeder/listings">
              <LuArrowLeft size={16} />
              Wróć do moich ogłoszeń
            </Link>
          </Button>
        </Box>
      </Container>
    )
  }

  if (!EDITABLE_STATUSES.includes(listing.status)) {
    return (
      <Container maxW="container.xl" py="32">
        <Stack gap="24" align="center" maxW="600px" mx="auto" py="32">
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
            <LuLock size={28} />
          </Box>
          <Box textAlign="center">
            <Text textStyle="titleXLBold" color="contentBlack01" mb="12">
              Tego ogłoszenia nie można edytować
            </Text>
            <Text textStyle="labelL" color="contentGrey" mb="24">
              Edytować można tylko szkice i ogłoszenia odrzucone przez moderatora.
              {listing.status === 'pending' && ' To ogłoszenie jest obecnie w moderacji.'}
            </Text>
            <Button variant="outline" size="lg" asChild>
              <Link to="/breeder/listings">
                <LuArrowLeft size={16} />
                Wróć do moich ogłoszeń
              </Link>
            </Button>
          </Box>
        </Stack>
      </Container>
    )
  }

  return <CreateListingWizard listing={listing} />
}

export default EditListingPage
