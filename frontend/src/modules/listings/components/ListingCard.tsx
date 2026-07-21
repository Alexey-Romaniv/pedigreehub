import { Box, Badge, Flex, Image, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuMapPin, LuShieldCheck } from 'react-icons/lu'
import type { Listing } from '../types'
import { formatAge, formatPrice, getBreedName } from '../lib/format'
import { FavoriteButton } from '@/shared/ui'

interface ListingCardProps {
  listing: Listing
}

// Публичная карточка объявления — каталог, главная, профиль заводчика
export const ListingCard = ({ listing }: ListingCardProps) => {
  const breedName = getBreedName(listing.breed)
  const age = formatAge(listing.birthDate)

  return (
    <Box
      asChild
      p="16"
      bg="backgroundPrimary"
      borderRadius="12px"
      border="1px solid"
      borderColor="linePrimary"
      cursor="pointer"
      transition="border-color 0.2s"
      _hover={{ borderColor: 'lineSecondary' }}
      display="block"
    >
      <Link to={`/puppy/${listing._id}`}>
        <Box position="relative" mb="12">
          <Image
            src={listing.photos[0]}
            alt={listing.title}
            h="160px"
            w="full"
            objectFit="cover"
            borderRadius="8px"
            bg="backgroundGrey"
          />
          {listing.verificationStatus === 'verified' && (
            <Badge
              colorPalette="green"
              size="sm"
              position="absolute"
              top="8px"
              left="8px"
            >
              <LuShieldCheck size={12} />
              Zweryfikowany
            </Badge>
          )}
          <Box position="absolute" top="8px" right="8px">
            <FavoriteButton listingId={listing._id} size="xs" />
          </Box>
        </Box>

        <Text textStyle="labelMSemibold" color="contentBlack01" mb="4" lineClamp={1}>
          {listing.title}
        </Text>
        <Text textStyle="labelS" color="contentGrey" mb="8">
          {breedName}
          {age ? ` • ${age}` : ''}
        </Text>

        <Flex justify="space-between" align="center">
          <Text textStyle="labelMBold" color="contentBlack01">
            {formatPrice(listing.price, listing.currency)}
          </Text>
          {listing.location?.city && (
            <Flex align="center" gap="4">
              <Box as="span" color="contentGrey" display="inline-flex"><LuMapPin size={12} /></Box>
              <Text textStyle="labelS" color="contentGrey">
                {listing.location.city}
              </Text>
            </Flex>
          )}
        </Flex>
      </Link>
    </Box>
  )
}
