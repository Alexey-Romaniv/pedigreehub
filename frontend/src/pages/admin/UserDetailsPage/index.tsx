import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Image,
  Portal,
  SimpleGrid,
  Skeleton,
  Text,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  LuArrowLeft,
  LuExternalLink,
  LuLockKeyhole,
  LuLockKeyholeOpen,
} from 'react-icons/lu'
import { adminApi } from '@/modules/admin/api'
import { BreederDetails } from '@/modules/admin/components'
import type { AdminUserDetails } from '@/modules/admin/types'
import { InquiryStatusBadge } from '@/modules/inquiries'
import type { InquiryStatus } from '@/modules/inquiries'
import { UserAvatar } from '@/shared/ui'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

const roleLabels: Record<string, { label: string; color: string }> = {
  user: { label: 'Kupujący', color: 'gray' },
  breeder: { label: 'Hodowca', color: 'blue' },
  admin: { label: 'Admin', color: 'purple' },
}

const listingStatusLabels: Record<string, string> = {
  draft: 'Szkic',
  pending: 'Oczekujące',
  active: 'Aktywne',
  rejected: 'Odrzucone',
  sold: 'Sprzedane',
  reserved: 'Zarezerwowane',
  archived: 'Zarchiwizowane',
}

const listingStatusColors: Record<string, string> = {
  draft: 'gray',
  pending: 'blue',
  active: 'green',
  rejected: 'red',
  sold: 'gray',
  reserved: 'gray',
  archived: 'gray',
}

const verificationLabels: Record<string, string> = {
  pending: 'Oczekuje',
  verified: 'Zweryfikowany',
  rejected: 'Odrzucony',
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pl-PL') : '—')

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

const formatPrice = (value: number) => `${value.toLocaleString('pl-PL')} PLN`

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box bg="backgroundGrey" borderRadius="12px" p="16" mb="16">
    <Text textStyle="labelSSemibold" color="contentGrey" mb="12" textTransform="uppercase">
      {title}
    </Text>
    {children}
  </Box>
)

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Flex gap="8" align="baseline" wrap="wrap" mb="8">
    <Text textStyle="labelS" color="contentGrey" minW="150px">
      {label}
    </Text>
    <Box flex="1" minW="0">
      {children}
    </Box>
  </Flex>
)

const StatCard = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <Box bg="backgroundPrimary" border="1px solid" borderColor="linePrimary" borderRadius="12px" p="16">
    <Text textStyle="titleMBold" color="contentBlack01">
      {value}
    </Text>
    <Text textStyle="labelS" color="contentGrey">
      {label}
    </Text>
    {hint && (
      <Text textStyle="labelS" color="contentGrey" mt="4">
        {hint}
      </Text>
    )}
  </Box>
)

const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmBlock, setConfirmBlock] = useState(false)

  const { data, isLoading, isError } = useQuery<AdminUserDetails>({
    queryKey: ['adminUser', id],
    queryFn: () => adminApi.getUserById(id!),
    enabled: !!id,
  })

  const toggleBlockMutation = useMutation({
    mutationFn: () =>
      data?.user.isBlocked ? adminApi.unblockUser(id!) : adminApi.blockUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUser', id] })
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      toaster.success({
        title: data?.user.isBlocked ? 'Użytkownik odblokowany' : 'Użytkownik zablokowany',
      })
      setConfirmBlock(false)
    },
    onError: (error) => {
      toaster.error({
        title: getApiErrorMessage(error, 'Nie udało się zmienić statusu użytkownika'),
      })
      setConfirmBlock(false)
    },
  })

  if (isLoading) {
    return (
      <Box bg="backgroundPrimary" minH="100vh" py="32">
        <Container maxW="container.lg">
          <Skeleton h="120px" borderRadius="12px" mb="16" />
          <Skeleton h="200px" borderRadius="12px" mb="16" />
          <Skeleton h="200px" borderRadius="12px" />
        </Container>
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box bg="backgroundPrimary" minH="100vh" py="32">
        <Container maxW="container.lg">
          <Button variant="ghost" size="sm" mb="16" onClick={() => navigate('/admin/users')}>
            <LuArrowLeft size={16} />
            Wróć do listy
          </Button>
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="titleSBold" color="contentBlack01" mb="8">
              Nie znaleziono użytkownika
            </Text>
            <Text textStyle="labelM" color="contentGrey">
              Konto mogło zostać usunięte lub link jest nieprawidłowy.
            </Text>
          </Box>
        </Container>
      </Box>
    )
  }

  const { user, breeder, stats, recentListings, recentInquiries } = data
  const role = roleLabels[user.role] ?? { label: user.role, color: 'gray' }
  const statusEntries = Object.entries(stats.listings.byStatus)

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.lg">
        <Button variant="ghost" size="sm" mb="16" px="0" onClick={() => navigate('/admin/users')}>
          <LuArrowLeft size={16} />
          Wróć do listy
        </Button>

        {/* Шапка: кто это и что с ним можно сделать */}
        <Flex
          gap="16"
          align={{ base: 'flex-start', md: 'center' }}
          direction={{ base: 'column', md: 'row' }}
          mb="24"
        >
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatar={user.avatar}
            size={64}
            initialsStyle="titleSBold"
          />
          <Box flex="1" minW="0">
            <Flex gap="8" align="center" wrap="wrap" mb="4">
              <Text textStyle="titleLBold" color="contentBlack01">
                {user.firstName} {user.lastName}
              </Text>
              <Badge colorPalette={role.color} size="sm">
                {role.label}
              </Badge>
              {user.isBlocked && (
                <Badge colorPalette="red" size="sm">
                  Zablokowany
                </Badge>
              )}
            </Flex>
            <Text textStyle="labelM" color="contentGrey">
              {user.email} • {user.phone}
            </Text>
          </Box>
          {user.role !== 'admin' && (
            <Button
              variant="outline"
              colorPalette={user.isBlocked ? 'green' : 'red'}
              onClick={() =>
                user.isBlocked ? toggleBlockMutation.mutate() : setConfirmBlock(true)
              }
              loading={toggleBlockMutation.isPending}
              flexShrink={0}
            >
              {user.isBlocked ? (
                <>
                  <LuLockKeyholeOpen size={16} /> Odblokuj
                </>
              ) : (
                <>
                  <LuLockKeyhole size={16} /> Zablokuj
                </>
              )}
            </Button>
          )}
        </Flex>

        <Section title="Konto">
          <Row label="E-mail">
            <Flex gap="8" align="center" wrap="wrap">
              <Text textStyle="labelM" color="contentBlack01">
                {user.email}
              </Text>
              <Badge colorPalette={user.isEmailVerified ? 'green' : 'orange'} size="sm">
                {user.isEmailVerified ? 'Potwierdzony' : 'Niepotwierdzony'}
              </Badge>
            </Flex>
          </Row>
          <Row label="Telefon">
            <Text textStyle="labelM" color="contentBlack01">
              {user.phone}
            </Text>
          </Row>
          <Row label="Rejestracja">
            <Text textStyle="labelM" color="contentBlack01">
              {formatDateTime(user.createdAt)}
            </Text>
          </Row>
          <Row label="Ostatnie logowanie">
            <Text textStyle="labelM" color="contentBlack01">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nigdy się nie logował'}
            </Text>
          </Row>
          <Row label="Identyfikator">
            <Text textStyle="labelMonoS" color="contentGrey">
              {user._id}
            </Text>
          </Row>
        </Section>

        <Section title="Aktywność">
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="12">
            {breeder && (
              <StatCard
                label="Ogłoszenia"
                value={stats.listings.total}
                hint={
                  statusEntries.length
                    ? statusEntries
                        .map(([status, count]) => `${listingStatusLabels[status] ?? status}: ${count}`)
                        .join(', ')
                    : undefined
                }
              />
            )}
            <StatCard label="Zapytania wysłane" value={stats.inquiriesAsBuyer} />
            {breeder && <StatCard label="Zapytania odebrane" value={stats.inquiriesAsBreeder} />}
            <StatCard label="Opinie napisane" value={stats.reviewsWritten} />
            {breeder && <StatCard label="Opinie otrzymane" value={stats.reviewsReceived} />}
            <StatCard label="Ulubione" value={stats.favorites} />
            {(breeder || stats.documents.total > 0) && (
              <StatCard
                label="Dokumenty"
                value={stats.documents.total}
                hint={stats.documents.pending ? `${stats.documents.pending} oczekuje` : undefined}
              />
            )}
          </SimpleGrid>
        </Section>

        {breeder && (
          <Section title="Powiązana hodowla">
            <Flex gap="8" align="center" wrap="wrap" mb="12">
              {breeder.verificationStatus && (
                <Badge
                  colorPalette={
                    breeder.verificationStatus === 'verified'
                      ? 'green'
                      : breeder.verificationStatus === 'rejected'
                        ? 'red'
                        : 'orange'
                  }
                  size="sm"
                >
                  {verificationLabels[breeder.verificationStatus] ?? breeder.verificationStatus}
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/breeder/${breeder.id}`} target="_blank" rel="noopener noreferrer">
                  <LuExternalLink size={14} />
                  Profil publiczny
                </Link>
              </Button>
            </Flex>
            {/* Полные данные питомника — NIP, документы, weryfikacja */}
            <BreederDetails breederId={breeder.id} />
          </Section>
        )}

        {recentListings.length > 0 && (
          <Section title="Ostatnie ogłoszenia">
            <Flex direction="column" gap="12">
              {recentListings.map((listing) => (
                <Flex
                  key={listing._id}
                  gap="12"
                  align="center"
                  bg="backgroundPrimary"
                  border="1px solid"
                  borderColor="linePrimary"
                  borderRadius="12px"
                  p="12"
                >
                  {listing.photos?.[0] && (
                    <Image
                      src={listing.photos[0]}
                      alt={listing.title}
                      w="56px"
                      h="56px"
                      objectFit="cover"
                      borderRadius="8px"
                      flexShrink={0}
                    />
                  )}
                  <Box flex="1" minW="0">
                    <Text textStyle="labelMSemibold" color="contentBlack01" lineClamp={1}>
                      {listing.title}
                    </Text>
                    <Flex gap="8" align="center" wrap="wrap" mt="4">
                      <Badge colorPalette={listingStatusColors[listing.status] ?? 'gray'} size="sm">
                        {listingStatusLabels[listing.status] ?? listing.status}
                      </Badge>
                      <Text textStyle="labelS" color="contentGrey">
                        {formatPrice(listing.price)} • {formatDate(listing.createdAt)}
                      </Text>
                    </Flex>
                  </Box>
                  <Button variant="ghost" size="sm" asChild flexShrink={0}>
                    <Link to={`/puppy/${listing._id}`} target="_blank" rel="noopener noreferrer">
                      <LuExternalLink size={14} />
                    </Link>
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Section>
        )}

        {recentInquiries.length > 0 && (
          <Section title="Ostatnie zapytania">
            <Flex direction="column" gap="12">
              {recentInquiries.map((inquiry) => (
                <Flex
                  key={inquiry.id}
                  gap="12"
                  align={{ base: 'flex-start', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  bg="backgroundPrimary"
                  border="1px solid"
                  borderColor="linePrimary"
                  borderRadius="12px"
                  p="12"
                >
                  <Box flex="1" minW="0">
                    <Text textStyle="labelMSemibold" color="contentBlack01" lineClamp={1}>
                      {inquiry.listingTitle || 'Ogłoszenie usunięte'}
                    </Text>
                    <Text textStyle="labelS" color="contentGrey" mt="4">
                      {inquiry.role === 'buyer' ? 'Jako kupujący' : 'Jako hodowca'} • ostatnia
                      wiadomość {formatDateTime(inquiry.lastMessageAt)}
                    </Text>
                  </Box>
                  <InquiryStatusBadge status={inquiry.status as InquiryStatus} />
                </Flex>
              ))}
            </Flex>
          </Section>
        )}

        {/* Блокировка необратимо разлогинивает пользователя — спрашиваем подтверждение */}
        <Dialog.Root open={confirmBlock} onOpenChange={(e) => setConfirmBlock(e.open)}>
          <Portal>
            <Dialog.Backdrop bg="#00000080" />
            <Dialog.Positioner>
              <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="420px" mx="16">
                <Dialog.Title>
                  <Text textStyle="titleSBold" color="contentBlack01" mb="8">
                    Zablokować użytkownika?
                  </Text>
                </Dialog.Title>
                <Text textStyle="labelM" color="contentGrey" mb="24">
                  {user.firstName} {user.lastName} straci dostęp do konta, a aktywne sesje zostaną
                  zakończone. Blokadę można później cofnąć.
                </Text>
                <Flex gap="8" justify="flex-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmBlock(false)}
                    disabled={toggleBlockMutation.isPending}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    colorPalette="red"
                    onClick={() => toggleBlockMutation.mutate()}
                    loading={toggleBlockMutation.isPending}
                  >
                    Zablokuj
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Container>
    </Box>
  )
}

export default UserDetailsPage
