import { Box, Text, Flex, Button, Image, SimpleGrid } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuEye, LuMessageCircle, LuArrowRight } from 'react-icons/lu'
import { StatusPill, type StatusPillTone } from '@/shared/ui'
import type { ListingPreview, ListingStatus } from '../types'

interface RecentListingsProps {
  listings: ListingPreview[]
}

const statusConfig: Record<ListingStatus, { label: string; tone: StatusPillTone }> = {
  draft: { label: 'Szkic', tone: 'muted' },
  pending: { label: 'W moderacji', tone: 'muted' },
  active: { label: 'Aktywne', tone: 'positive' },
  rejected: { label: 'Odrzucone', tone: 'negative' },
  sold: { label: 'Sprzedane', tone: 'default' },
  reserved: { label: 'Zarezerwowane', tone: 'default' },
  archived: { label: 'W archiwum', tone: 'muted' },
}

const ListingCard = ({ listing }: { listing: ListingPreview }) => {
  const status = statusConfig[listing.status]

  return (
    <Box
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      overflow="hidden"
    >
      <Image
        src={listing.photo}
        alt={listing.title}
        h="120px"
        w="full"
        objectFit="cover"
        bg="backgroundGrey"
      />

      <Box p="16">
        <Flex justify="space-between" align="flex-start" mb="8">
          <Box flex="1">
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="4">
              {listing.title}
            </Text>
            <Text textStyle="labelS" color="contentGrey">
              {listing.breedName}
            </Text>
          </Box>
          <StatusPill label={status.label} tone={status.tone} dot />
        </Flex>

        <Text textStyle="titleSBold" color="contentBlack01" mb="12">
          {listing.price.toLocaleString('pl-PL')} {listing.currency}
        </Text>

        <Flex gap="16" color="contentGrey">
          <Flex align="center" gap="4">
            <LuEye size={14} />
            <Text textStyle="labelS" color="contentGrey">{listing.viewsCount}</Text>
          </Flex>
          <Flex align="center" gap="4">
            <LuMessageCircle size={14} />
            <Text textStyle="labelS" color="contentGrey">{listing.inquiriesCount}</Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

export const RecentListings = ({ listings }: RecentListingsProps) => {
  return (
    <Box w="full">
      <Flex justify="space-between" align="center" mb="20">
        <Text textStyle="titleSerifL" color="contentBlack01">
          Ostatnie ogłoszenia
        </Text>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/breeder/listings">
            Wszystkie ogłoszenia
            <LuArrowRight size={16} />
          </Link>
        </Button>
      </Flex>

      {listings.length === 0 ? (
        <Box 
          bg="backgroundGrey" 
          borderRadius="12px" 
          p="40" 
          textAlign="center"
        >
          <Text textStyle="labelL" color="contentGrey" mb="16">
            Nie masz jeszcze żadnych ogłoszeń
          </Text>
          <Button variant="solid" asChild>
            <Link to="/breeder/listings/new">Dodaj pierwsze ogłoszenie</Link>
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="16">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}
