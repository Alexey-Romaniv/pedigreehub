import { Box, Button, Container, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuHeart } from 'react-icons/lu'
import { useFavoritesList } from '@/shared/api'
import { ListingCard } from '@/modules/listings/components'
import type { Listing } from '@/modules/listings/types'

const FavoritesPage = () => {
  const { data, isLoading, isError } = useFavoritesList<Listing>()

  // Populate удалённого объявления возвращает null — такие записи скрываем
  const listings = (data?.favorites || [])
    .map((favorite) => favorite.listingId)
    .filter((listing): listing is Listing => !!listing)

  return (
    <Container maxW="container.xl" py="32">
      <Text textStyle="titleXLBold" color="contentBlack01" mb="8">
        Ulubione
      </Text>
      <Text textStyle="labelM" color="contentGrey" mb="24">
        Zapisane ogłoszenia{data ? ` (${data.pagination.total})` : ''}
      </Text>

      {isLoading && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} h="280px" borderRadius="12px" />
          ))}
        </SimpleGrid>
      )}

      {isError && (
        <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
          <Text textStyle="titleSBold" color="contentBlack01" mb="8">
            Coś poszło nie tak
          </Text>
          <Text textStyle="labelM" color="contentGrey">
            Nie udało się załadować ulubionych. Spróbuj odświeżyć stronę.
          </Text>
        </Box>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <Flex direction="column" align="center" gap="12" py="48" textAlign="center">
          <Box color="contentGrey" display="inline-flex">
            <LuHeart size={40} />
          </Box>
          <Text textStyle="titleSBold" color="contentBlack01">
            Brak ulubionych ogłoszeń
          </Text>
          <Text textStyle="labelM" color="contentGrey" maxW="360px">
            Dodawaj ogłoszenia do ulubionych klikając serduszko na karcie szczeniaka.
          </Text>
          <Button variant="solid" size="sm" asChild mt="8">
            <Link to="/catalog">Przeglądaj katalog</Link>
          </Button>
        </Flex>
      )}

      {!isLoading && !isError && listings.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
}

export default FavoritesPage
