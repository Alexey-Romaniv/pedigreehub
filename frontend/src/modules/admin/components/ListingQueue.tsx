import { Box, Text, Flex, Badge, Stack, Spinner } from '@chakra-ui/react'
import type { AdminListing } from '../types'

interface ListingQueueProps {
  listings: AdminListing[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (listing: AdminListing) => void
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusLabel = (status: AdminListing['status']) => {
  const labels: Record<string, string> = {
    pending: 'Oczekujące',
    active: 'Aktywne',
    rejected: 'Odrzucone',
    draft: 'Szkic',
    sold: 'Sprzedane',
    reserved: 'Zarezerwowane',
    archived: 'Zarchiwizowane',
  }
  return labels[status] || status
}

const getStatusColor = (status: AdminListing['status']) => {
  const colors: Record<string, 'blue' | 'green' | 'red' | 'gray'> = {
    pending: 'blue',
    active: 'green',
    rejected: 'red',
    draft: 'gray',
    sold: 'gray',
    reserved: 'gray',
    archived: 'gray',
  }
  return colors[status] || 'gray'
}

export const ListingQueue = ({
  listings,
  isLoading,
  selectedId,
  onSelect,
}: ListingQueueProps) => {
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="lg" color="contentGrey" />
      </Flex>
    )
  }

  if (listings.length === 0) {
    return (
      <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
        <Text textStyle="labelL" color="contentGrey">
          Brak ogłoszeń do moderacji
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap="12">
      {listings.map((listing) => {
        const isSelected = listing._id === selectedId
        const breedName = typeof listing.breed === 'object' ? listing.breed.name : 'Nieznana rasa'
        // Данные заводчика приходят в populate-нутом breederId (breeder остаётся фолбэком)
        const breederInfo =
          typeof listing.breederId === 'object'
            ? listing.breederId
            : typeof listing.breeder === 'object'
              ? listing.breeder
              : null
        const breederName = breederInfo
          ? breederInfo.kennelName ||
            `${breederInfo.userId?.firstName ?? ''} ${breederInfo.userId?.lastName ?? ''}`.trim()
          : 'Nieznany hodowca'
        const firstPhoto = listing.photos?.[0]

        return (
          <Box
            key={listing._id}
            bg="backgroundPrimary"
            border="2px solid"
            borderColor={isSelected ? 'contentBlack01' : 'linePrimary'}
            borderRadius="12px"
            p="16"
            cursor="pointer"
            onClick={() => onSelect(listing)}
            transition="border-color 0.2s"
            _hover={{ borderColor: 'lineSecondary' }}
          >
            <Flex gap="12" align="flex-start">
              {firstPhoto && (
                <Box
                  w="80px"
                  h="80px"
                  borderRadius="8px"
                  overflow="hidden"
                  bg="backgroundGrey"
                  flexShrink={0}
                >
                  <img
                    src={firstPhoto}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              )}
              <Box flex="1" minW="0">
                <Flex align="center" gap="8" mb="4" flexWrap="wrap">
                  <Text textStyle="labelMSemibold" color="contentBlack01" truncate>
                    {listing.title}
                  </Text>
                  <Badge colorPalette={getStatusColor(listing.status)} size="sm">
                    {getStatusLabel(listing.status)}
                  </Badge>
                </Flex>
                <Text textStyle="labelM" color="contentBlack01" mb="4">
                  {breedName}
                </Text>
                <Flex gap="16" flexWrap="wrap" mb="4">
                  <Text textStyle="labelS" color="contentGrey">
                    {listing.price} {listing.currency}
                  </Text>
                  <Text textStyle="labelS" color="contentGrey">
                    {formatDate(listing.createdAt)}
                  </Text>
                </Flex>
                <Text textStyle="labelS" color="contentGrey" truncate>
                  {breederName}
                </Text>
              </Box>
            </Flex>
          </Box>
        )
      })}
    </Stack>
  )
}

