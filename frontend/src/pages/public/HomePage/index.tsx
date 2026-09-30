import { Box, Container, Text, SimpleGrid, Skeleton, Flex, Button, Grid } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import {
  LuShieldCheck,
  LuFileCheck,
  LuCpu,
  LuStar,
  LuArrowRight,
  LuPawPrint,
  LuBadgeCheck,
} from 'react-icons/lu'
import { usePublicListings } from '@/modules/listings/hooks'
import { ListingCard } from '@/modules/listings/components'
import { getBreedName } from '@/modules/listings/lib/format'
import { useBreeds } from '@/shared/api'

const VERIFICATION_STEPS = [
  {
    icon: LuShieldCheck,
    title: 'Weryfikacja hodowcy',
    description:
      'Sprawdzamy NIP hodowcy w Białej Liście VAT Ministerstwa Finansów.',
  },
  {
    icon: LuFileCheck,
    title: 'Kontrola dokumentów',
    description:
      'Rodowody ZKwP i książeczki zdrowia sprawdza moderator przed publikacją ogłoszenia.',
  },
  {
    icon: LuCpu,
    title: 'Mikroczip',
    description:
      'Sprawdzamy format ISO 11784/85, unikalność numeru oraz jego obecność w publicznej bazie ZKwP.',
  },
  {
    icon: LuStar,
    title: 'Opinie po zakupie',
    description:
      'Opinię o hodowcy można wystawić wyłącznie po potwierdzonym zakupie szczeniaka.',
  },
]

const TRUST_ITEMS = ['Baza mikroczipów ZKwP', 'Biała Lista VAT', 'Mikroczip ISO 11784/85']

const POPULAR_BREEDS = [
  'Golden Retriever',
  'Labrador Retriever',
  'Owczarek Niemiecki',
  'Buldog Francuski',
]

// Разброс «бумажных» фото в hero-стопке
const HERO_PHOTO_LAYOUT = [
  { top: '0', right: '8%', w: '290px', rotate: 'rotate(-4deg)', z: 1 },
  { top: '130px', right: '0', w: '250px', rotate: 'rotate(3deg)', z: 2 },
  { top: '215px', left: '2%', w: '235px', rotate: 'rotate(-2deg)', z: 3 },
] as const

const HomePage = () => {
  const { data, isLoading } = usePublicListings({ limit: 3, sort: 'newest' })
  const latestListings = data?.data || []
  const { data: breeds } = useBreeds()

  const heroListings = latestListings.filter((l) => l.photos?.[0]).slice(0, 3)

  const findBreedLink = (label: string) => {
    const breed = breeds?.find((b) => b.name.toLowerCase() === label.toLowerCase())
    return breed ? `/catalog?breed=${breed._id}` : '/catalog'
  }

  return (
    <Box>
      {/* Hero */}
      <Box bg="backgroundGrey" borderBottom="1px solid" borderColor="linePrimary" overflow="hidden">
        <Container maxW="container.xl" py={{ base: '40', lg: '64' }}>
          <Grid templateColumns={{ base: '1fr', lg: '7fr 5fr' }} gap="40" alignItems="center">
            <Box>
              <Flex align="center" gap="12" mb="20">
                <Box w="28px" h="1px" bg="contentBlack01" />
                <Text textStyle="labelMono" color="contentGrey">
                  Platforma z weryfikacją hodowców
                </Text>
              </Flex>
              <Text as="h1" textStyle="displaySerifXL" color="contentBlack01" mb="20" maxW="640px">
                Rodowodowe szczenięta od zweryfikowanych hodowców
              </Text>
              <Text textStyle="titleL" color="contentGrey" mb="32" maxW="480px">
                Sprawdzamy hodowców w rejestrach państwowych, a dokumenty każdego szczeniaka —
                ręcznie, zanim ogłoszenie trafi do katalogu.
              </Text>
              <Flex gap="12" mb="40" wrap="wrap">
                <Button size="lg" asChild>
                  <Link to="/catalog">Znajdź szczeniaka</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register/breeder">Zostań hodowcą</Link>
                </Button>
              </Flex>
              <Flex gap="20" wrap="wrap">
                {TRUST_ITEMS.map((item) => (
                  <Flex key={item} align="center" gap="6px">
                    <Box color="contentGrey">
                      <LuBadgeCheck size={14} />
                    </Box>
                    <Text textStyle="labelMonoS" color="contentGrey">
                      {item}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>

            {/* Стопка «бумажных» фото из свежих объявлений */}
            <Box display={{ base: 'none', lg: 'block' }} position="relative" h="440px">
              {heroListings.length > 0 ? (
                <>
                  {heroListings.map((listing, i) => {
                    const layout = HERO_PHOTO_LAYOUT[i]
                    return (
                      <Box
                        key={listing._id}
                        position="absolute"
                        {...('left' in layout ? { left: layout.left } : { right: layout.right })}
                        top={layout.top}
                        w={layout.w}
                        transform={layout.rotate}
                        zIndex={layout.z}
                        bg="backgroundPrimary"
                        border="1px solid"
                        borderColor="linePrimary"
                        borderRadius="4px"
                        p="10px"
                        pb="12px"
                        boxShadow="0 12px 32px rgba(35, 31, 32, 0.12)"
                        transition="transform 0.25s"
                        _hover={{ transform: 'rotate(0deg) scale(1.02)', zIndex: 5 }}
                      >
                        <Link to={`/puppy/${listing._id}`}>
                          <Box
                            as="img"
                            // @ts-expect-error img-атрибуты через Box
                            src={listing.photos[0]}
                            alt={listing.title}
                            w="full"
                            h="170px"
                            objectFit="cover"
                            borderRadius="2px"
                            display="block"
                          />
                          <Text textStyle="labelMonoS" color="contentGrey" mt="8" truncate>
                            {getBreedName(listing.breed)} · {listing.location?.city || 'Polska'}
                          </Text>
                        </Link>
                      </Box>
                    )
                  })}
                  {/* Печать «Zweryfikowano» */}
                  <Flex
                    position="absolute"
                    bottom="12px"
                    right="6%"
                    zIndex={4}
                    w="112px"
                    h="112px"
                    borderRadius="full"
                    border="1.5px solid"
                    borderColor="contentBlack01"
                    align="center"
                    justify="center"
                    transform="rotate(9deg)"
                    opacity={0.9}
                  >
                    <Flex
                      w="94px"
                      h="94px"
                      borderRadius="full"
                      border="1px solid"
                      borderColor="contentBlack01"
                      direction="column"
                      align="center"
                      justify="center"
                      gap="4"
                      textAlign="center"
                    >
                      <LuPawPrint size={18} />
                      <Text textStyle="labelMonoS" color="contentBlack01" lineHeight="1.2">
                        ZWERYFIKO-
                        <br />
                        WANO
                      </Text>
                    </Flex>
                  </Flex>
                </>
              ) : (
                /* Fallback: декоративный «certyfikat», когда объявлений ещё нет */
                <Flex
                  h="full"
                  border="1px solid"
                  borderColor="lineSecondary"
                  borderRadius="4px"
                  bg="backgroundPrimary"
                  align="center"
                  justify="center"
                  direction="column"
                  gap="16"
                  p="24"
                >
                  <Box color="contentGrey">
                    <LuPawPrint size={40} />
                  </Box>
                  <Text textStyle="labelMono" color="contentGrey" textAlign="center">
                    PedigreeHub · Certyfikat
                  </Text>
                </Flex>
              )}
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* Как мы верифицируем */}
      <Container maxW="container.xl" py="64">
        <Box textAlign="center" mb="40">
          <Text textStyle="titleSerifXL" color="contentBlack01" mb="12">
            Jak weryfikujemy
          </Text>
          <Text textStyle="labelL" color="contentGrey" maxW="560px" mx="auto">
            Każde ogłoszenie przechodzi kilka etapów kontroli, zanim trafi do katalogu
          </Text>
        </Box>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16">
          {VERIFICATION_STEPS.map((step, index) => (
            <Box
              key={step.title}
              p="24"
              borderRadius="12px"
              border="1px solid"
              borderColor="linePrimary"
              bg="backgroundPrimary"
              transition="border-color 0.2s, transform 0.2s"
              _hover={{ borderColor: 'lineSecondary', transform: 'translateY(-2px)' }}
            >
              <Flex justify="space-between" align="flex-start" mb="16">
                <Box p="12" bg="backgroundGrey" borderRadius="12px" color="contentGrey">
                  <step.icon size={24} />
                </Box>
                <Text textStyle="labelMono" color="contentGrey">
                  0{index + 1}
                </Text>
              </Flex>
              <Text textStyle="titleSBold" color="contentBlack01" mb="8">
                {step.title}
              </Text>
              <Text textStyle="labelM" color="contentGrey">
                {step.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>

      {/* Популярные породы */}
      <Box bg="backgroundGrey" borderTop="1px solid" borderBottom="1px solid" borderColor="linePrimary" py="64">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" mb="32">
            <Text textStyle="titleSerifXL" color="contentBlack01">
              Popularne rasy
            </Text>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/catalog">
                Wszystkie rasy
                <LuArrowRight size={16} />
              </Link>
            </Button>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap="16">
            {POPULAR_BREEDS.map((breed) => (
              <Link key={breed} to={findBreedLink(breed)}>
                <Flex
                  p="20"
                  borderRadius="12px"
                  bg="backgroundPrimary"
                  border="1px solid"
                  borderColor="linePrimary"
                  align="center"
                  justify="space-between"
                  gap="8"
                  transition="border-color 0.2s, transform 0.2s"
                  _hover={{ borderColor: 'lineSecondary', transform: 'translateY(-2px)' }}
                >
                  <Text textStyle="titleSerifL" color="contentBlack01">
                    {breed}
                  </Text>
                  <Box color="contentGrey">
                    <LuArrowRight size={16} />
                  </Box>
                </Flex>
              </Link>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Последние объявления */}
      <Container maxW="container.xl" py="64">
        <Flex justify="space-between" align="center" mb="32">
          <Text textStyle="titleSerifXL" color="contentBlack01">
            Nowe ogłoszenia
          </Text>
          {latestListings.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/catalog">
                Zobacz wszystkie
                <LuArrowRight size={16} />
              </Link>
            </Button>
          )}
        </Flex>
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="24">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} h="280px" borderRadius="12px" />
            ))}
          </SimpleGrid>
        ) : latestListings.length === 0 ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="labelL" color="contentGrey">
              Wkrótce pojawią się tutaj nowe ogłoszenia
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="24">
            {latestListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  )
}

export default HomePage
