import { useState } from 'react'
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
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  LuCalendar,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuMapPin,
  LuMessageCircle,
  LuMicrochip,
  LuShieldCheck,
  LuStar,
  LuTag,
} from 'react-icons/lu'
import { useListing } from '@/modules/listings/hooks'
import { InquiryFormDialog } from '@/modules/inquiries'
import { FavoriteButton, ImageLightbox, useImageLightbox } from '@/shared/ui'
import { opinionsLabel } from '@/modules/reviews'
import { useAuthStore } from '@/store'
import type { Listing, ListingDocumentInfo } from '@/modules/listings/types'
import {
  formatAge,
  formatDate,
  formatPrice,
  genderLabel,
  getBreedName,
  getListingBreeder,
  maskMicrochip,
} from '@/modules/listings/lib/format'

// Populate-нутый документ или null (если в поле только ID)
const getDocumentInfo = (
  doc: string | ListingDocumentInfo | undefined
): ListingDocumentInfo | null => {
  if (!doc || typeof doc === 'string') return null
  return doc
}

const documentStatusConfig = {
  approved: { label: 'Zatwierdzony', color: 'green', icon: LuCircleCheck },
  pending: { label: 'W weryfikacji', color: 'yellow', icon: LuClock },
  rejected: { label: 'Odrzucony', color: 'red', icon: LuCircleX },
} as const

interface DocumentRowProps {
  label: string
  has: boolean
  doc: ListingDocumentInfo | null
}

const DocumentRow = ({ label, has, doc }: DocumentRowProps) => {
  const status = doc ? documentStatusConfig[doc.status] : null

  return (
    <Flex
      justify="space-between"
      align="center"
      p="12"
      bg="backgroundGrey"
      borderRadius="8px"
    >
      <Flex align="center" gap="8">
        {has ? (
          <Box as="span" color="iconGreen" display="inline-flex"><LuCircleCheck size={18} /></Box>
        ) : (
          <Box as="span" color="contentGrey" display="inline-flex"><LuCircleX size={18} /></Box>
        )}
        <Text
          textStyle="labelM"
          color={has ? 'contentBlack01' : 'contentGrey'}
        >
          {label}
        </Text>
      </Flex>
      {has ? (
        status ? (
          <Badge colorPalette={status.color} size="sm">
            {status.label}
          </Badge>
        ) : (
          <Badge colorPalette="green" size="sm">
            Dołączony
          </Badge>
        )
      ) : (
        <Text textStyle="labelS" color="contentGrey">
          Brak
        </Text>
      )}
    </Flex>
  )
}

interface ParentCardProps {
  title: string
  parent?: Listing['father']
}

const ParentCard = ({ title, parent }: ParentCardProps) => {
  const photo = parent?.photo
  const lightbox = useImageLightbox(
    photo ? [{ src: photo, alt: parent?.name, caption: `${title}: ${parent?.name}` }] : []
  )

  if (!parent?.name) return null

  return (
    <Box
      p="16"
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
    >
      <Text textStyle="labelS" color="contentGrey" mb="8">
        {title}
      </Text>
      <Flex gap="12" align="flex-start">
        {parent.photo && (
          <>
            <Image
              src={parent.photo}
              alt={parent.name}
              w="72px"
              h="72px"
              objectFit="cover"
              borderRadius="8px"
              bg="backgroundGrey"
              flexShrink={0}
              cursor="zoom-in"
              onClick={() => lightbox.openAt(0)}
            />
            <ImageLightbox {...lightbox.lightboxProps} />
          </>
        )}
        <Box minW="0">
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="4">
            {parent.name}
          </Text>
          {parent.pedigreeNumber && (
            <Text textStyle="labelS" color="contentGrey" mb="4">
              Nr rodowodu: {parent.pedigreeNumber}
            </Text>
          )}
          {parent.titles && parent.titles.length > 0 && (
            <Flex gap="4" wrap="wrap">
              {parent.titles.map((title) => (
                <Badge key={title} colorPalette="gray" size="sm">
                  {title}
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  )
}

const PuppyPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: listing, isLoading, isError } = useListing(id)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  // Неавторизованного отправляем на логин с возвратом на эту страницу
  const handleInquiryClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setInquiryOpen(true)
  }

  if (isLoading) {
    return (
      <Box bg="backgroundPrimary" minH="100vh">
        <Container maxW="container.xl" py="32">
          <Flex gap="32" direction={{ base: 'column', lg: 'row' }}>
            <Skeleton flex="1" h="420px" borderRadius="12px" />
            <Skeleton w={{ base: 'full', lg: '380px' }} h="420px" borderRadius="12px" />
          </Flex>
        </Container>
      </Box>
    )
  }

  // 404 — не существует либо не публично
  if (isError || !listing) {
    return (
      <Box bg="backgroundPrimary" minH="60vh">
        <Container maxW="container.xl" py="64">
          <Flex direction="column" align="center" gap="16" textAlign="center">
            <Text textStyle="displayXXLBold" color="contentBlack01">
              404
            </Text>
            <Text textStyle="titleLBold" color="contentBlack01">
              Ogłoszenie nie zostało znalezione
            </Text>
            <Text textStyle="labelM" color="contentGrey" maxW="400px">
              Ogłoszenie nie istnieje, zostało usunięte lub nie jest jeszcze dostępne
              publicznie.
            </Text>
            <Button variant="solid" asChild mt="8">
              <Link to="/catalog">Wróć do katalogu</Link>
            </Button>
          </Flex>
        </Container>
      </Box>
    )
  }

  const breeder = getListingBreeder(listing.breederId)
  const breedName = getBreedName(listing.breed)
  const photos = listing.photos || []

  return (
    <Box bg="backgroundPrimary" minH="100vh">
      <Container maxW="container.xl" py="32">
        <Flex gap="32" direction={{ base: 'column', lg: 'row' }} align="flex-start">
          {/* Левая колонка: галерея + описание + родители + документы */}
          <Box flex="1" minW="0">
            {/* Галерея */}
            <Box position="relative" mb="12">
              <Image
                src={photos[photoIndex]}
                alt={listing.title}
                w="full"
                h={{ base: '280px', md: '420px' }}
                objectFit="cover"
                borderRadius="12px"
                bg="backgroundGrey"
                cursor="zoom-in"
                onClick={() => photos.length > 0 && setGalleryOpen(true)}
              />
              {listing.verificationStatus === 'verified' && (
                <Badge
                  colorPalette="green"
                  size="lg"
                  position="absolute"
                  top="12px"
                  left="12px"
                >
                  <LuShieldCheck size={14} />
                  Zweryfikowany
                </Badge>
              )}
            </Box>
            <ImageLightbox
              images={photos.map((photo) => ({ src: photo, alt: listing.title }))}
              index={photoIndex}
              open={galleryOpen}
              onOpenChange={setGalleryOpen}
              onIndexChange={setPhotoIndex}
            />

            {photos.length > 1 && (
              <Flex gap="8" mb="32" wrap="wrap">
                {photos.map((photo, index) => (
                  <Box
                    key={photo}
                    as="button"
                    onClick={() => setPhotoIndex(index)}
                    borderRadius="8px"
                    overflow="hidden"
                    border="2px solid"
                    borderColor={index === photoIndex ? 'contentBlack01' : 'transparent'}
                    cursor="pointer"
                    flexShrink={0}
                  >
                    <Image
                      src={photo}
                      alt={`${listing.title} — zdjęcie ${index + 1}`}
                      w="72px"
                      h="72px"
                      objectFit="cover"
                      bg="backgroundGrey"
                    />
                  </Box>
                ))}
              </Flex>
            )}

            {/* Описание */}
            <Box mb="32">
              <Text textStyle="titleMBold" color="contentBlack01" mb="12">
                Opis
              </Text>
              <Text textStyle="labelM" color="contentBlack01" whiteSpace="pre-wrap">
                {listing.description}
              </Text>
            </Box>

            {/* Родители */}
            {(listing.father?.name || listing.mother?.name) && (
              <Box mb="32">
                <Text textStyle="titleMBold" color="contentBlack01" mb="12">
                  Rodzice
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="16">
                  <ParentCard title="Ojciec" parent={listing.father} />
                  <ParentCard title="Matka" parent={listing.mother} />
                </SimpleGrid>
              </Box>
            )}

            {/* Документы */}
            <Box mb="32">
              <Text textStyle="titleMBold" color="contentBlack01" mb="12">
                Dokumenty
              </Text>
              <Flex direction="column" gap="8">
                <DocumentRow
                  label="Rodowód"
                  has={listing.hasPedigree}
                  doc={getDocumentInfo(listing.pedigreeDocument)}
                />
                <DocumentRow
                  label="Książeczka zdrowia"
                  has={listing.hasVetPassport}
                  doc={getDocumentInfo(listing.vetPassportDocument)}
                />
                <DocumentRow
                  label="Metryka"
                  has={listing.hasMetric}
                  doc={getDocumentInfo(listing.metricDocument)}
                />
              </Flex>
            </Box>
          </Box>

          {/* Правая колонка: цена, параметры, заводчик */}
          <Box
            w={{ base: 'full', lg: '380px' }}
            flexShrink={0}
            position={{ lg: 'sticky' }}
            top="24"
          >
            <Box
              p="24"
              bg="backgroundPrimary"
              border="1px solid"
              borderColor="linePrimary"
              borderRadius="12px"
              mb="16"
            >
              <Text textStyle="titleLBold" color="contentBlack01" mb="8">
                {listing.title}
              </Text>
              <Text textStyle="labelM" color="contentGrey" mb="16">
                {breedName}
                {listing.puppyName ? ` • ${listing.puppyName}` : ''}
              </Text>
              <Text textStyle="displayXLBold" color="contentBlack01" mb="20">
                {formatPrice(listing.price, listing.currency)}
              </Text>

              <Flex direction="column" gap="12" mb="20">
                <Flex align="center" gap="8">
                  <Box as="span" color="contentGrey" display="inline-flex"><LuTag size={16} /></Box>
                  <Text textStyle="labelM" color="contentBlack01">
                    {genderLabel(listing.gender)} • {listing.color}
                  </Text>
                </Flex>
                <Flex align="center" gap="8">
                  <Box as="span" color="contentGrey" display="inline-flex"><LuCalendar size={16} /></Box>
                  <Text textStyle="labelM" color="contentBlack01">
                    {formatDate(listing.birthDate)} ({formatAge(listing.birthDate)})
                  </Text>
                </Flex>
                {listing.microchipNumber && (
                  <Flex align="center" gap="8">
                    <Box as="span" color="contentGrey" display="inline-flex"><LuMicrochip size={16} /></Box>
                    <Text textStyle="labelM" color="contentBlack01">
                      Mikroczip: {maskMicrochip(listing.microchipNumber)}
                    </Text>
                  </Flex>
                )}
                {listing.zkwpVerified && (
                  <Flex
                    align="center"
                    gap="8"
                    alignSelf="flex-start"
                    border="1px solid"
                    borderColor="contentBlack01"
                    borderRadius="full"
                    px="12"
                    py="4"
                    title="Numer mikroczipa potwierdzony w publicznej bazie Związku Kynologicznego w Polsce"
                  >
                    <LuShieldCheck size={14} />
                    <Text textStyle="labelMonoS" color="contentBlack01">
                      ZWERYFIKOWANO W BAZIE ZKwP
                    </Text>
                  </Flex>
                )}
                {listing.location?.city && (
                  <Flex align="center" gap="8">
                    <Box as="span" color="contentGrey" display="inline-flex"><LuMapPin size={16} /></Box>
                    <Text textStyle="labelM" color="contentBlack01">
                      {listing.location.city}, {listing.location.region}
                    </Text>
                  </Flex>
                )}
              </Flex>

              <Flex gap="8" align="center">
                <Button variant="solid" size="lg" flex="1" onClick={handleInquiryClick}>
                  <LuMessageCircle size={18} />
                  Zapytaj o szczeniaka
                </Button>
                <FavoriteButton listingId={listing._id} size="md" />
              </Flex>
            </Box>

            {/* Заводчик */}
            {breeder && (
              <Box
                p="24"
                bg="backgroundPrimary"
                border="1px solid"
                borderColor="linePrimary"
                borderRadius="12px"
              >
                <Text textStyle="labelS" color="contentGrey" mb="8">
                  Hodowca
                </Text>
                <Flex align="center" gap="8" mb="8" wrap="wrap">
                  <Text textStyle="titleSBold" color="contentBlack01">
                    {breeder.kennelName}
                  </Text>
                  {breeder.verification?.status === 'verified' && (
                    <Badge colorPalette="green" size="sm">
                      <LuShieldCheck size={12} />
                      Zweryfikowany
                    </Badge>
                  )}
                </Flex>
                {listing.location?.city && (
                  <Flex align="center" gap="4" mb="8">
                    <Box as="span" color="contentGrey" display="inline-flex"><LuMapPin size={14} /></Box>
                    <Text textStyle="labelS" color="contentGrey">
                      {listing.location.city}, {listing.location.region}
                    </Text>
                  </Flex>
                )}
                {typeof breeder.rating === 'number' && breeder.rating > 0 && (
                  <Flex align="center" gap="4" mb="8">
                    <Box as="span" color="contentGrey" display="inline-flex"><LuStar size={14} /></Box>
                    <Text textStyle="labelS" color="contentGrey">
                      {breeder.rating.toFixed(1)} ({opinionsLabel(breeder.reviewsCount || 0)})
                    </Text>
                  </Flex>
                )}
                <Button variant="outline" size="sm" w="full" mt="8" asChild>
                  <Link to={`/breeder/${breeder._id}`}>Zobacz profil hodowcy</Link>
                </Button>
              </Box>
            )}
          </Box>
        </Flex>

        {/* Форма запроса заводчику */}
        <InquiryFormDialog
          listingId={listing._id}
          listingTitle={listing.title}
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
        />
      </Container>
    </Box>
  )
}

export default PuppyPage
