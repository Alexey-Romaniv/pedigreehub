import { Box, Container, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  LuUsers,
  LuFileCheck,
  LuShieldCheck,
  LuMessageCircle,
  LuStar,
  LuDog,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { adminApi } from '@/modules/admin/api'

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  to,
}: {
  icon: IconType
  label: string
  value: string | number
  hint?: string
  to?: string
}) => {
  const card = (
    <Box
      bg="backgroundGrey"
      borderRadius="12px"
      p="20"
      h="full"
      transition="opacity 0.15s"
      _hover={to ? { opacity: 0.8 } : undefined}
    >
      <Flex align="center" gap="8" mb="12" color="contentGrey">
        <Icon size={18} />
        <Text textStyle="labelM" color="contentGrey">{label}</Text>
      </Flex>
      <Text textStyle="displayXLBold" color="contentBlack01">{value}</Text>
      {hint && (
        <Text textStyle="labelS" color="contentGrey" mt="4">{hint}</Text>
      )}
    </Box>
  )

  return to ? <Link to={to}>{card}</Link> : card
}

const listingStatusLabels: Record<string, string> = {
  draft: 'Szkice',
  pending: 'Oczekujące',
  active: 'Aktywne',
  rejected: 'Odrzucone',
  reserved: 'Zarezerwowane',
  sold: 'Sprzedane',
  archived: 'Zarchiwizowane',
}

const DashboardPage = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  })

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.xl">
        <Box mb="24">
          <Text textStyle="displayXLBold" color="contentBlack01" mb="4">
            Statystyki
          </Text>
          <Text textStyle="labelL" color="contentGrey">
            Przegląd platformy PedigreeHub
          </Text>
        </Box>

        {isLoading ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} h="120px" borderRadius="12px" />
            ))}
          </SimpleGrid>
        ) : error || !stats ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="labelL" color="contentGrey">
              Nie udało się załadować statystyk. Spróbuj odświeżyć stronę.
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="32">
            {/* Очередь модерации */}
            <Box>
              <Text textStyle="titleSBold" color="contentBlack01" mb="12">
                Do moderacji
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 3 }} gap="16">
                <StatCard
                  icon={LuFileCheck}
                  label="Ogłoszenia"
                  value={stats.moderationQueue.listings}
                  hint="oczekują na weryfikację"
                  to="/admin/moderation"
                />
                <StatCard
                  icon={LuShieldCheck}
                  label="Hodowcy"
                  value={stats.moderationQueue.breeders}
                  hint="oczekują na weryfikację"
                />
                <StatCard
                  icon={LuFileCheck}
                  label="Dokumenty"
                  value={stats.moderationQueue.documents}
                  hint="oczekują na sprawdzenie"
                  to="/admin/verification"
                />
              </SimpleGrid>
            </Box>

            {/* Пользователи */}
            <Box>
              <Text textStyle="titleSBold" color="contentBlack01" mb="12">
                Użytkownicy
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16">
                <StatCard
                  icon={LuUsers}
                  label="Wszystkie konta"
                  value={stats.users.total}
                  hint={`+${stats.users.newLast7Days} w ostatnich 7 dniach`}
                  to="/admin/users"
                />
                <StatCard
                  icon={LuUsers}
                  label="Kupujący"
                  value={stats.users.byRole.user}
                />
                <StatCard
                  icon={LuDog}
                  label="Hodowcy"
                  value={stats.users.byRole.breeder}
                  hint={`zweryfikowani: ${stats.breeders.verified}`}
                />
                <StatCard
                  icon={LuUsers}
                  label="Zablokowani"
                  value={stats.users.blocked}
                />
              </SimpleGrid>
            </Box>

            {/* Объявления */}
            <Box>
              <Text textStyle="titleSBold" color="contentBlack01" mb="12">
                Ogłoszenia
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="16">
                <StatCard
                  icon={LuDog}
                  label="Łącznie"
                  value={stats.listings.total}
                />
                <StatCard
                  icon={LuDog}
                  label="Widoczne w katalogu"
                  value={stats.listings.publiclyVisible}
                  hint="aktywne i zweryfikowane"
                />
                <StatCard
                  icon={LuMessageCircle}
                  label="Zapytania"
                  value={stats.inquiries.total}
                  hint={`potwierdzone zakupy: ${stats.inquiries.purchasesConfirmed}`}
                />
                <StatCard
                  icon={LuStar}
                  label="Opinie"
                  value={stats.reviews.total}
                  hint={
                    stats.reviews.avgRating !== null
                      ? `średnia ocena ${stats.reviews.avgRating}`
                      : undefined
                  }
                />
              </SimpleGrid>
            </Box>

            {/* Объявления по статусу */}
            <Box>
              <Text textStyle="titleSBold" color="contentBlack01" mb="12">
                Ogłoszenia wg statusu
              </Text>
              <Flex gap="12" wrap="wrap">
                {Object.entries(listingStatusLabels).map(([status, label]) => {
                  const count = stats.listings.byStatus[status]
                  if (!count) return null
                  return (
                    <Box key={status} bg="backgroundGrey" borderRadius="8px" px="16" py="10">
                      <Text textStyle="labelS" color="contentGrey">{label}</Text>
                      <Text textStyle="labelMSemibold" color="contentBlack01">{count}</Text>
                    </Box>
                  )
                })}
              </Flex>
            </Box>
          </Flex>
        )}
      </Container>
    </Box>
  )
}

export default DashboardPage
