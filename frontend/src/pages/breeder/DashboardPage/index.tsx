import { Box, Container, Flex, Spinner, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { breederApi } from '@/modules/breeder/api'
import type { ListingPreview } from '@/modules/breeder/types'
import {
  DashboardHeader,
  StatsCards,
  VerificationProgress,
  RecentListings,
} from '@/modules/breeder/components'
import { useMyListings } from '@/modules/listings/hooks'
import { getBreedName } from '@/modules/listings/lib/format'

const DashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['breederStats'],
    queryFn: () => breederApi.getMyStats(),
  })
  const { data: myListings } = useMyListings()

  if (isLoading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <Spinner size="lg" color="contentGrey" />
      </Flex>
    )
  }

  if (error || !data) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <Text textStyle="labelL" color="contentGrey">
          Błąd ładowania danych
        </Text>
      </Flex>
    )
  }

  const { kennel, stats, badges } = data

  // Последние 3 объявления в формате карточек дашборда
  const recentListings: ListingPreview[] = (myListings || [])
    .slice(0, 3)
    .map((listing) => ({
      _id: listing._id,
      title: listing.title,
      breedName: getBreedName(listing.breed),
      photo: listing.photos[0],
      status: listing.status,
      price: listing.price,
      currency: listing.currency,
      viewsCount: listing.viewsCount,
      inquiriesCount: listing.inquiriesCount,
      createdAt: listing.createdAt,
    }))

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.xl">
        <Flex direction="column" gap="32">
          {/* Header */}
          <DashboardHeader
            kennelName={kennel.name}
            level={kennel.level}
            status={kennel.status}
            note={kennel.note}
          />

          {/* Stats Cards */}
          <StatsCards
            stats={{
              views: stats.views,
              inquiries: stats.inquiries,
              favorites: stats.favorites,
              activeListings: stats.activeListings,
            }}
          />

          {/* Verification progress */}
          <VerificationProgress badges={badges} />

          {/* Recent Listings */}
          <RecentListings listings={recentListings} />
        </Flex>
      </Container>
    </Box>
  )
}

export default DashboardPage
