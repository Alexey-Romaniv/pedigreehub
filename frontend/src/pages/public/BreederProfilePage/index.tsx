import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Image,
  SimpleGrid,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  LuCalendar,
  LuExternalLink,
  LuFacebook,
  LuInstagram,
  LuMapPin,
  LuShieldCheck,
  LuStar,
} from 'react-icons/lu'
import { breederApi } from '@/modules/breeder/api'
import type { VerificationLevel } from '@/modules/breeder/types'
import { BREEDER_BADGES } from '@/shared/constants'
import { ImageLightbox, useImageLightbox } from '@/shared/ui'
import { usePublicListings } from '@/modules/listings/hooks'
import { ListingCard } from '@/modules/listings/components'
import { ReviewsList, StarRating, opinionsLabel, useBreederReviews } from '@/modules/reviews'

const levelConfig: Record<VerificationLevel, { label: string; color: string }> = {
  new: { label: 'Nowy', color: 'gray' },
  verified: { label: 'Zweryfikowany', color: 'green' },
  trusted: { label: 'Zaufany', color: 'blue' },
  professional: { label: 'Profesjonalista', color: 'purple' },
}

const BreederProfilePage = () => {
  const { id } = useParams<{ id: string }>()

  const {
    data: breeder,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['breederProfile', id],
    queryFn: () => breederApi.getPublicProfile(id!),
    enabled: !!id,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 400) return false
      return failureCount < 2
    },
  })

  const { data: listingsData, isLoading: listingsLoading } = usePublicListings({
    breederId: id,
    limit: 12,
  })
  const listings = listingsData?.data || []

  const { data: reviewsData, isLoading: reviewsLoading } = useBreederReviews(id)
  const reviews = reviewsData?.reviews || []

  const kennelPhotos = useImageLightbox(
    (breeder?.kennelPhotos || []).map((photo) => ({
      src: photo,
      alt: `Hodowla ${breeder?.kennelName}`,
    }))
  )

  if (isLoading) {
    return (
      <Box bg="backgroundPrimary" minH="100vh">
        <Container maxW="container.xl" py="32">
          <Skeleton h="180px" borderRadius="12px" mb="32" />
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} h="280px" borderRadius="12px" />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    )
  }

  if (isError || !breeder) {
    return (
      <Box bg="backgroundPrimary" minH="60vh">
        <Container maxW="container.xl" py="64">
          <Flex direction="column" align="center" gap="16" textAlign="center">
            <Text textStyle="displayXXLBold" color="contentBlack01">
              404
            </Text>
            <Text textStyle="titleLBold" color="contentBlack01">
              Hodowca nie został znaleziony
            </Text>
            <Text textStyle="labelM" color="contentGrey" maxW="400px">
              Profil nie istnieje lub został usunięty.
            </Text>
            <Button variant="solid" asChild mt="8">
              <Link to="/catalog">Wróć do katalogu</Link>
            </Button>
          </Flex>
        </Container>
      </Box>
    )
  }

  const level = levelConfig[breeder.verification.level] || levelConfig.new
  const visibleBadges = BREEDER_BADGES.filter((badge) =>
    (breeder.badges as string[]).includes(badge.id)
  )
  // «od września 2026»: месяц в родительном падеже Intl даёт только вместе с днём
  const memberSince = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .formatToParts(new Date(breeder.createdAt))
    .filter((part) => part.type === 'month' || part.type === 'year')
    .map((part) => part.value)
    .join(' ')

  return (
    <Box bg="backgroundPrimary" minH="100vh">
      <Container maxW="container.xl" py="32">
        {/* Шапка профиля */}
        <Box
          p="24"
          bg="backgroundPrimary"
          border="1px solid"
          borderColor="linePrimary"
          borderRadius="12px"
          mb="32"
        >
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap="16"
            mb="16"
          >
            <Box>
              <Flex align="center" gap="12" mb="8" wrap="wrap">
                <Text textStyle="displayXLBold" color="contentBlack01">
                  {breeder.kennelName}
                </Text>
                {breeder.verification.status === 'verified' && (
                  <Badge colorPalette="green" size="lg">
                    <LuShieldCheck size={14} />
                    Zweryfikowany
                  </Badge>
                )}
                <Badge colorPalette={level.color} size="lg">
                  {level.label}
                </Badge>
              </Flex>
              <Flex gap="16" wrap="wrap">
                <Flex align="center" gap="4">
                  <Box as="span" color="contentGrey" display="inline-flex"><LuMapPin size={14} /></Box>
                  <Text textStyle="labelM" color="contentGrey">
                    {breeder.city}, {breeder.region}
                  </Text>
                </Flex>
                <Flex align="center" gap="4">
                  <Box as="span" color="contentGrey" display="inline-flex"><LuCalendar size={14} /></Box>
                  <Text textStyle="labelM" color="contentGrey">
                    W serwisie od {memberSince}
                  </Text>
                </Flex>
                {breeder.rating > 0 && (
                  <Flex align="center" gap="4">
                    <Box as="span" color="contentGrey" display="inline-flex"><LuStar size={14} /></Box>
                    <Text textStyle="labelM" color="contentGrey">
                      {breeder.rating.toFixed(1)} ({opinionsLabel(breeder.reviewsCount)})
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Box>

            {/* Ссылки */}
            <Flex gap="8" wrap="wrap">
              {breeder.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={breeder.website} target="_blank" rel="noopener noreferrer">
                    <LuExternalLink size={14} />
                    Strona www
                  </a>
                </Button>
              )}
              {breeder.socialLinks?.facebook && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={breeder.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <LuFacebook size={14} />
                  </a>
                </Button>
              )}
              {breeder.socialLinks?.instagram && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={breeder.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <LuInstagram size={14} />
                  </a>
                </Button>
              )}
            </Flex>
          </Flex>

          {breeder.description && (
            <Text textStyle="labelM" color="contentBlack01" mb="16" whiteSpace="pre-wrap">
              {breeder.description}
            </Text>
          )}

          {/* Породы */}
          {breeder.breedNames?.length > 0 && (
            <Flex gap="8" wrap="wrap" mb={visibleBadges.length > 0 ? '16' : '0'}>
              {breeder.breedNames.map((name) => (
                <Badge key={name} colorPalette="gray" size="md">
                  {name}
                </Badge>
              ))}
            </Flex>
          )}

          {/* Бейджи верификации */}
          {visibleBadges.length > 0 && (
            <Flex gap="8" wrap="wrap">
              {visibleBadges.map((badge) => (
                <Badge key={badge.id} colorPalette={badge.color} size="md">
                  {badge.icon} {badge.label}
                </Badge>
              ))}
            </Flex>
          )}
        </Box>

        {/* Фото питомника */}
        {breeder.kennelPhotos?.length > 0 && (
          <Box mb="32">
            <Text textStyle="titleMBold" color="contentBlack01" mb="16">
              Zdjęcia hodowli
            </Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap="12">
              {breeder.kennelPhotos.map((photo, index) => (
                <Image
                  key={photo}
                  src={photo}
                  alt={`Hodowla ${breeder.kennelName}`}
                  h="140px"
                  w="full"
                  objectFit="cover"
                  borderRadius="8px"
                  bg="backgroundGrey"
                  cursor="zoom-in"
                  onClick={() => kennelPhotos.openAt(index)}
                />
              ))}
            </SimpleGrid>
            <ImageLightbox {...kennelPhotos.lightboxProps} />
          </Box>
        )}

        {/* Активные объявления */}
        <Box mb="32">
          <Text textStyle="titleMBold" color="contentBlack01" mb="16">
            Aktywne ogłoszenia
          </Text>
          {listingsLoading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} h="280px" borderRadius="12px" />
              ))}
            </SimpleGrid>
          ) : listings.length === 0 ? (
            <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
              <Text textStyle="labelL" color="contentGrey">
                Ten hodowca nie ma aktualnie aktywnych ogłoszeń
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Отзывы */}
        <Box>
          <Flex align="center" gap="12" mb="16" wrap="wrap">
            <Text textStyle="titleMBold" color="contentBlack01">
              Opinie{reviewsData ? ` (${reviewsData.pagination.total})` : ''}
            </Text>
            {breeder.rating > 0 && (
              <Flex align="center" gap="6">
                <StarRating value={Math.round(breeder.rating)} size={16} />
                <Text textStyle="labelM" color="contentGrey">
                  {breeder.rating.toFixed(1)}
                </Text>
              </Flex>
            )}
          </Flex>
          <ReviewsList reviews={reviews} isLoading={reviewsLoading} />
        </Box>
      </Container>
    </Box>
  )
}

export default BreederProfilePage
