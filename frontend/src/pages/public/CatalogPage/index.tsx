import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Drawer,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { LuSearchX, LuSlidersHorizontal, LuX } from 'react-icons/lu'
import { POLISH_REGIONS } from '@/shared/constants'
import { BreedCombobox } from '@/shared/ui'
import { usePublicListings } from '@/modules/listings/hooks'
import { ListingCard } from '@/modules/listings/components'
import type { PublicListingsParams } from '@/modules/listings/types'

const PAGE_SIZE = 12

const sortOptions = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'price_asc', label: 'Cena: od najniższej' },
  { value: 'price_desc', label: 'Cena: od najwyższej' },
]

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Фильтры живут в URL — ссылкой легко поделиться
  const breed = searchParams.get('breed') || ''
  const region = searchParams.get('region') || ''
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const gender = searchParams.get('gender') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1', 10) || 1

  // Локальное состояние цен — в URL попадают после подтверждения (blur/Enter)
  const [priceMinInput, setPriceMinInput] = useState(priceMin)
  const [priceMaxInput, setPriceMaxInput] = useState(priceMax)

  // Мобильный Drawer с фильтрами
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Синхронизация инпутов с URL при back/forward
  useEffect(() => {
    setPriceMinInput(priceMin)
    setPriceMaxInput(priceMax)
  }, [priceMin, priceMax])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key !== 'page') {
      next.delete('page')
    }
    setSearchParams(next, { replace: true })
  }

  const applyPrices = () => {
    const next = new URLSearchParams(searchParams)
    if (priceMinInput) next.set('priceMin', priceMinInput)
    else next.delete('priceMin')
    if (priceMaxInput) next.set('priceMax', priceMaxInput)
    else next.delete('priceMax')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const hasFilters = !!(breed || region || priceMin || priceMax || gender)

  const clearFilters = () => {
    setPriceMinInput('')
    setPriceMaxInput('')
    const next = new URLSearchParams()
    if (sort !== 'newest') next.set('sort', sort)
    setSearchParams(next, { replace: true })
  }

  const params: PublicListingsParams = {
    breed: breed || undefined,
    region: region || undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    gender: (gender as 'male' | 'female') || undefined,
    sort: sort as PublicListingsParams['sort'],
    page,
    limit: PAGE_SIZE,
  }

  const { data, isLoading, isError } = usePublicListings(params)
  const listings = data?.data || []
  const pagination = data?.pagination

  // Общий блок фильтров — в сайдбаре (md+) и в мобильном Drawer
  const filtersContent = (
    <Flex direction="column" gap="16">
      <Box>
        <Text textStyle="labelMSemibold" color="contentBlack01" mb="8">
          Rasa
        </Text>
        <BreedCombobox
          size="sm"
          value={breed ? [breed] : []}
          onValueChange={(ids) => setParam('breed', ids[0] ?? '')}
          placeholder="Wszystkie rasy"
        />
      </Box>

      <Box>
        <Text textStyle="labelMSemibold" color="contentBlack01" mb="8">
          Województwo
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={region}
            onChange={(e) => setParam('region', e.target.value)}
            aria-label="Województwo"
          >
            <option value="">Cała Polska</option>
            {POLISH_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>

      <Box>
        <Text textStyle="labelMSemibold" color="contentBlack01" mb="8">
          Cena (PLN)
        </Text>
        <Flex gap="8">
          <Input
            size="sm"
            type="number"
            placeholder="od"
            min={0}
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(e.target.value)}
            onBlur={applyPrices}
            onKeyDown={(e) => e.key === 'Enter' && applyPrices()}
          />
          <Input
            size="sm"
            type="number"
            placeholder="do"
            min={0}
            value={priceMaxInput}
            onChange={(e) => setPriceMaxInput(e.target.value)}
            onBlur={applyPrices}
            onKeyDown={(e) => e.key === 'Enter' && applyPrices()}
          />
        </Flex>
      </Box>

      <Box>
        <Text textStyle="labelMSemibold" color="contentBlack01" mb="8">
          Płeć
        </Text>
        <Flex gap="8">
          {[
            { value: 'male', label: 'Samiec' },
            { value: 'female', label: 'Samica' },
          ].map((option) => {
            const isActive = gender === option.value
            return (
              <Button
                key={option.value}
                flex="1"
                size="sm"
                variant={isActive ? 'solid' : 'outline'}
                onClick={() => setParam('gender', isActive ? '' : option.value)}
              >
                {option.label}
              </Button>
            )
          })}
        </Flex>
      </Box>
    </Flex>
  )

  return (
    <Box bg="backgroundPrimary" minH="100vh">
      <Container maxW="container.xl" py="32">
        <Flex justify="space-between" align="center" mb="32" gap="16" wrap="wrap">
          <Text textStyle="titleXLBold" color="contentBlack01">
            Katalog szczeniąt
          </Text>
          {pagination && (
            <Text textStyle="labelM" color="contentGrey">
              Znaleziono: {pagination.total}
            </Text>
          )}
        </Flex>

        <Flex gap="32" align="flex-start">
          {/* Фильтры */}
          <Box w="280px" flexShrink={0} display={{ base: 'none', md: 'block' }}>
            <Box
              p="20"
              bg="backgroundPrimary"
              borderRadius="12px"
              border="1px solid"
              borderColor="linePrimary"
              position="sticky"
              top="24"
            >
              <Flex justify="space-between" align="center" mb="20">
                <Text textStyle="titleSBold" color="contentBlack01">
                  Filtry
                </Text>
                {hasFilters && (
                  <Button variant="ghost" size="xs" onClick={clearFilters}>
                    Wyczyść
                  </Button>
                )}
              </Flex>

              {filtersContent}
            </Box>
          </Box>

          {/* Список объявлений */}
          <Box flex="1" minW="0">
            <Flex justify={{ base: 'space-between', md: 'flex-end' }} gap="12" mb="16">
              {/* Мобильная кнопка фильтров */}
              <Button
                variant="outline"
                size="sm"
                display={{ base: 'inline-flex', md: 'none' }}
                onClick={() => setFiltersOpen(true)}
              >
                <LuSlidersHorizontal /> Filtry
              </Button>
              <NativeSelect.Root size="sm" w="220px">
                <NativeSelect.Field
                  value={sort}
                  onChange={(e) => setParam('sort', e.target.value)}
                  aria-label="Sortowanie"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Flex>

            {isLoading ? (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h="280px" borderRadius="12px" />
                ))}
              </SimpleGrid>
            ) : isError ? (
              <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
                <Text textStyle="titleSBold" color="contentBlack01" mb="8">
                  Coś poszło nie tak
                </Text>
                <Text textStyle="labelM" color="contentGrey">
                  Nie udało się załadować ogłoszeń. Spróbuj odświeżyć stronę.
                </Text>
              </Box>
            ) : listings.length === 0 ? (
              <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
                <Flex justify="center" mb="16">
                  <Box as="span" color="contentGrey" display="inline-flex"><LuSearchX size={32} /></Box>
                </Flex>
                <Text textStyle="titleSBold" color="contentBlack01" mb="8">
                  Brak ogłoszeń
                </Text>
                <Text textStyle="labelM" color="contentGrey" mb="16">
                  {hasFilters
                    ? 'Nie znaleziono ogłoszeń dla wybranych filtrów.'
                    : 'Aktualnie nie ma żadnych aktywnych ogłoszeń.'}
                </Text>
                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Wyczyść filtry
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="20">
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </SimpleGrid>

                {/* Пагинация */}
                {pagination && pagination.pages > 1 && (
                  <Flex justify="center" align="center" gap="16" mt="32">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setParam('page', String(page - 1))}
                    >
                      Poprzednia
                    </Button>
                    <Text textStyle="labelM" color="contentGrey">
                      Strona {page} z {pagination.pages}
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.pages}
                      onClick={() => setParam('page', String(page + 1))}
                    >
                      Następna
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </Box>
        </Flex>
      </Container>

      {/* Мобильный Drawer с фильтрами */}
      <Drawer.Root
        open={filtersOpen}
        onOpenChange={(e) => setFiltersOpen(e.open)}
        placement="bottom"
      >
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content
            bg="backgroundPrimary"
            borderTopRadius="16px"
            maxH="85dvh"
            p="20"
          >
            <Drawer.Header p="0" mb="16">
              <Flex justify="space-between" align="center" w="full">
                <Drawer.Title>
                  <Text textStyle="titleSBold" color="contentBlack01">
                    Filtry
                  </Text>
                </Drawer.Title>
                <Flex gap="8" align="center">
                  {hasFilters && (
                    <Button variant="ghost" size="xs" onClick={clearFilters}>
                      Wyczyść
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-label="Zamknij filtry"
                    onClick={() => setFiltersOpen(false)}
                  >
                    <LuX />
                  </Button>
                </Flex>
              </Flex>
            </Drawer.Header>
            <Drawer.Body p="0" overflowY="auto">
              {filtersContent}
              <Button w="full" mt="20" onClick={() => setFiltersOpen(false)}>
                Pokaż wyniki{pagination ? ` (${pagination.total})` : ''}
              </Button>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  )
}

export default CatalogPage
