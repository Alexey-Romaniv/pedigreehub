import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Image,
  Menu,
  Portal,
  Skeleton,
  Spinner,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import {
  LuBadgeCheck,
  LuChevronDown,
  LuClock,
  LuEye,
  LuImage,
  LuMessageCircle,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuTriangleAlert,
} from 'react-icons/lu'
import { StatusPill, type StatusPillTone } from '@/shared/ui'
import {
  useMyListings,
  useUpdateListingStatus,
  useDeleteListing,
} from '@/modules/listings/hooks'
import type { Listing, ListingStatus } from '@/modules/listings/types'
import { formatPrice, getBreedName } from '@/modules/listings/lib/format'

const statusConfig: Record<ListingStatus, { label: string; tone: StatusPillTone }> = {
  draft: { label: 'Szkic', tone: 'muted' },
  pending: { label: 'W moderacji', tone: 'muted' },
  active: { label: 'Aktywne', tone: 'positive' },
  rejected: { label: 'Odrzucone', tone: 'negative' },
  reserved: { label: 'Zarezerwowane', tone: 'default' },
  sold: { label: 'Sprzedane', tone: 'default' },
  archived: { label: 'W archiwum', tone: 'muted' },
}

const verificationConfig: Record<
  'pending' | 'verified' | 'rejected',
  { label: string; tone: StatusPillTone; icon: React.ComponentType<{ size?: number }> }
> = {
  pending: { label: 'Weryfikacja: oczekuje', tone: 'muted', icon: LuClock },
  verified: { label: 'Zweryfikowane', tone: 'default', icon: LuBadgeCheck },
  rejected: { label: 'Weryfikacja: odrzucona', tone: 'negative', icon: LuTriangleAlert },
}

// Разрешённые переходы статусов (для верифицированных объявлений)
const statusTransitions: Partial<Record<ListingStatus, ListingStatus[]>> = {
  active: ['reserved', 'sold', 'archived'],
  reserved: ['active', 'sold', 'archived'],
  sold: ['active', 'archived'],
  archived: ['active'],
}

// Подписи действий в меню — понятнее, чем название целевого статуса
const transitionLabels: Partial<Record<ListingStatus, string>> = {
  pending: 'Wyślij do moderacji',
}

const tabs: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'active', label: 'Aktywne' },
  { value: 'pending', label: 'W moderacji' },
  { value: 'draft', label: 'Szkice' },
  { value: 'reserved', label: 'Zarezerwowane' },
  { value: 'sold', label: 'Sprzedane' },
  { value: 'archived', label: 'Archiwum' },
  { value: 'rejected', label: 'Odrzucone' },
]

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

interface ListingRowProps {
  listing: Listing
  onDelete: (listing: Listing) => void
}

const ListingRow = ({ listing, onDelete }: ListingRowProps) => {
  const updateStatus = useUpdateListingStatus()
  const status = statusConfig[listing.status]
  const verification = verificationConfig[listing.verificationStatus]
  const isEditable = listing.status === 'draft' || listing.status === 'rejected'
  // Szkice i odrzucone можно отправить на модерацию; остальные переходы — только verified
  const transitions: ListingStatus[] = isEditable
    ? ['pending']
    : listing.verificationStatus === 'verified'
      ? statusTransitions[listing.status] || []
      : []

  return (
    <Flex
      p="16"
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      gap="16"
      align={{ base: 'flex-start', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
    >
      {/* Zdjęcie (szkic может быть без фото) */}
      {listing.photos[0] ? (
        <Image
          src={listing.photos[0]}
          alt={listing.title}
          w={{ base: 'full', md: '96px' }}
          h={{ base: '160px', md: '72px' }}
          objectFit="cover"
          borderRadius="8px"
          bg="backgroundGrey"
          flexShrink={0}
        />
      ) : (
        <Flex
          w={{ base: 'full', md: '96px' }}
          h={{ base: '160px', md: '72px' }}
          bg="backgroundGrey"
          borderRadius="8px"
          flexShrink={0}
          align="center"
          justify="center"
          color="contentGrey"
        >
          <LuImage size={24} />
        </Flex>
      )}

      {/* Информация */}
      <Box flex="1" minW="0">
        <Text textStyle="labelMSemibold" color="contentBlack01" mb="4" lineClamp={1}>
          {listing.title}
        </Text>
        <Text textStyle="labelS" color="contentGrey" mb="8">
          {getBreedName(listing.breed)} • {formatPrice(listing.price, listing.currency)} •{' '}
          {formatShortDate(listing.createdAt)}
        </Text>
        <Flex gap="8" wrap="wrap" align="center">
          <StatusPill label={status.label} tone={status.tone} dot />
          <StatusPill
            label={verification.label}
            tone={verification.tone}
            icon={verification.icon}
          />
          <Flex align="center" gap="4">
            <Box as="span" color="contentGrey" display="inline-flex"><LuEye size={14} /></Box>
            <Text textStyle="labelS" color="contentGrey">
              {listing.viewsCount}
            </Text>
          </Flex>
          <Flex align="center" gap="4">
            <Box as="span" color="contentGrey" display="inline-flex"><LuMessageCircle size={14} /></Box>
            <Text textStyle="labelS" color="contentGrey">
              {listing.inquiriesCount}
            </Text>
          </Flex>
        </Flex>
        {listing.verificationStatus === 'rejected' && listing.verificationNote && (
          <Text textStyle="labelS" color="statusTextRed" mt="8">
            Powód odrzucenia: {listing.verificationNote}
          </Text>
        )}
      </Box>

      {/* Действия */}
      <Flex gap="8" flexShrink={0} align="center">
        {isEditable && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/breeder/listings/${listing._id}/edit`}>
              <LuPencil size={14} />
              Edytuj
            </Link>
          </Button>
        )}
        {transitions.length > 0 && (
          <Menu.Root
            onSelect={(details) =>
              updateStatus.mutate({
                id: listing._id,
                status: details.value as ListingStatus,
              })
            }
          >
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm" disabled={updateStatus.isPending}>
                {updateStatus.isPending ? <Spinner size="xs" /> : 'Zmień status'}
                <LuChevronDown size={14} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content bg="backgroundPrimary" borderRadius="8px" minW="180px">
                  {transitions.map((target) => (
                    <Menu.Item key={target} value={target} cursor="pointer">
                      {transitionLabels[target] ?? statusConfig[target].label}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        )}
        <Button
          variant="ghost"
          size="sm"
          colorPalette="red"
          onClick={() => onDelete(listing)}
          aria-label="Usuń ogłoszenie"
        >
          <LuTrash2 size={16} />
        </Button>
      </Flex>
    </Flex>
  )
}

const MyListingsPage = () => {
  const [activeTab, setActiveTab] = useState<ListingStatus | 'all'>('all')
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null)
  const { data: listings, isLoading, error } = useMyListings()
  const deleteListing = useDeleteListing()

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const listing of listings || []) {
      counts[listing.status] = (counts[listing.status] || 0) + 1
    }
    return counts
  }, [listings])

  const visibleListings = useMemo(() => {
    if (!listings) return []
    if (activeTab === 'all') return listings
    return listings.filter((listing) => listing.status === activeTab)
  }, [listings, activeTab])

  const handleConfirmDelete = () => {
    if (!listingToDelete) return
    deleteListing.mutate(listingToDelete._id, {
      onSettled: () => setListingToDelete(null),
    })
  }

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.xl">
        {/* Заголовок */}
        <Flex justify="space-between" align="center" mb="24" gap="16" wrap="wrap">
          <Box>
            <Text textStyle="labelMono" color="contentGrey" mb="6">
              Panel hodowcy
            </Text>
            <Text textStyle="titleSerifXL" color="contentBlack01">
              Moje ogłoszenia
            </Text>
          </Box>
          <Button variant="solid" asChild>
            <Link to="/breeder/listings/new">
              <LuPlus size={18} />
              Dodaj ogłoszenie
            </Link>
          </Button>
        </Flex>

        {/* Табы статусов */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(details) => setActiveTab(details.value as ListingStatus | 'all')}
          mb="24"
        >
          <Tabs.List overflowX="auto">
            {tabs.map((tab) => {
              const count =
                tab.value === 'all'
                  ? listings?.length || 0
                  : countByStatus[tab.value] || 0
              // Пустые табы показываем только для «Wszystkie» и активного
              if (count === 0 && tab.value !== 'all' && tab.value !== activeTab) {
                return null
              }
              return (
                <Tabs.Trigger key={tab.value} value={tab.value} flexShrink={0}>
                  {tab.label} ({count})
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>
        </Tabs.Root>

        {/* Список */}
        {isLoading ? (
          <Flex direction="column" gap="12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} h="104px" borderRadius="12px" />
            ))}
          </Flex>
        ) : error ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="labelL" color="contentGrey">
              Nie udało się załadować ogłoszeń. Spróbuj odświeżyć stronę.
            </Text>
          </Box>
        ) : visibleListings.length === 0 ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="titleSBold" color="contentBlack01" mb="8">
              {activeTab === 'all'
                ? 'Nie masz jeszcze żadnych ogłoszeń'
                : 'Brak ogłoszeń w tym statusie'}
            </Text>
            <Text textStyle="labelM" color="contentGrey" mb="20">
              Dodaj pierwsze ogłoszenie, aby dotrzeć do kupujących
            </Text>
            <Button variant="solid" asChild>
              <Link to="/breeder/listings/new">
                <LuPlus size={18} />
                Dodaj ogłoszenie
              </Link>
            </Button>
          </Box>
        ) : (
          <Flex direction="column" gap="12">
            {visibleListings.map((listing) => (
              <ListingRow
                key={listing._id}
                listing={listing}
                onDelete={setListingToDelete}
              />
            ))}
          </Flex>
        )}

        {/* Подтверждение удаления */}
        <Dialog.Root
          open={!!listingToDelete}
          onOpenChange={(e) => !e.open && setListingToDelete(null)}
        >
          <Portal>
            <Dialog.Backdrop bg="blackAlpha.600" />
            <Dialog.Positioner>
              <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="400px" mx="16">
                <Dialog.Header p="0" mb="16">
                  <Dialog.Title>
                    <Text textStyle="titleSBold" color="contentBlack01">
                      Usunąć ogłoszenie?
                    </Text>
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body p="0" mb="24">
                  <Text textStyle="labelM" color="contentGrey">
                    Ogłoszenie „{listingToDelete?.title}” zostanie trwale usunięte. Tej
                    operacji nie można cofnąć.
                  </Text>
                </Dialog.Body>
                <Dialog.Footer p="0" display="flex" gap="12" justifyContent="flex-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setListingToDelete(null)}
                    disabled={deleteListing.isPending}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    onClick={handleConfirmDelete}
                    disabled={deleteListing.isPending}
                  >
                    {deleteListing.isPending ? <Spinner size="xs" /> : 'Usuń'}
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Container>
    </Box>
  )
}

export default MyListingsPage
