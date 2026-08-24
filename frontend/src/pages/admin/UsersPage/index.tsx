import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Input,
  Portal,
  Skeleton,
  Spinner,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LuChevronDown, LuChevronUp, LuLockKeyhole, LuLockKeyholeOpen, LuSearch } from 'react-icons/lu'
import { adminApi } from '@/modules/admin/api'
import { BreederDetails } from '@/modules/admin/components'
import type { AdminUser, AdminUsersFilters } from '@/modules/admin/types'
import { toaster } from '@/shared/theme/toaster'
import { getApiErrorMessage } from '@/shared/api'

const roleTabs = [
  { value: 'all', label: 'Wszyscy' },
  { value: 'user', label: 'Kupujący' },
  { value: 'breeder', label: 'Hodowcy' },
  { value: 'admin', label: 'Administratorzy' },
] as const

const roleLabels: Record<AdminUser['role'], { label: string; color: string }> = {
  user: { label: 'Kupujący', color: 'gray' },
  breeder: { label: 'Hodowca', color: 'blue' },
  admin: { label: 'Admin', color: 'purple' },
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('pl-PL') : '—'

// Польская плюрализация: 1 konto / 2 konta / 5 kont
const accountsLabel = (count: number) => {
  if (count === 1) return '1 konto'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} konta`
  return `${count} kont`
}

const UserRow = ({
  user,
  onToggleBlock,
}: {
  user: AdminUser
  onToggleBlock: (user: AdminUser) => void
}) => {
  const role = roleLabels[user.role]
  const [showBreeder, setShowBreeder] = useState(false)

  return (
    <Box bg="backgroundGrey" borderRadius="12px" p="16">
      <Flex
        gap="16"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
      >
        <Box flex="1" minW="0">
          <Flex gap="8" align="center" wrap="wrap" mb="4">
            <Text textStyle="labelMSemibold" color="contentBlack01">
              {user.firstName} {user.lastName}
            </Text>
            <Badge colorPalette={role.color} size="sm">{role.label}</Badge>
            {user.breeder && (
              <Text textStyle="labelS" color="contentGrey" lineClamp={1}>
                {user.breeder.kennelName}
              </Text>
            )}
          </Flex>
          <Text textStyle="labelS" color="contentGrey" mb="8">
            {user.email} • {user.phone}
          </Text>
          <Flex gap="8" wrap="wrap">
            <Badge colorPalette={user.isEmailVerified ? 'green' : 'orange'} size="sm">
              {user.isEmailVerified ? 'Email potwierdzony' : 'Email niepotwierdzony'}
            </Badge>
            {user.isBlocked && (
              <Badge colorPalette="red" size="sm">Zablokowany</Badge>
            )}
          </Flex>
        </Box>

        <Box flexShrink={0} textAlign={{ base: 'left', md: 'right' }}>
          <Text textStyle="labelS" color="contentGrey" mb="8">
            Rejestracja: {formatDate(user.createdAt)}
          </Text>
          {user.role !== 'admin' && (
            <Button
              variant="outline"
              size="sm"
              colorPalette={user.isBlocked ? 'green' : 'red'}
              onClick={() => onToggleBlock(user)}
            >
              {user.isBlocked ? (
                <>
                  <LuLockKeyholeOpen size={14} /> Odblokuj
                </>
              ) : (
                <>
                  <LuLockKeyhole size={14} /> Zablokuj
                </>
              )}
            </Button>
          )}
        </Box>
      </Flex>

      {/* Данные питомника подгружаются по требованию — там же NIP и документы */}
      {user.breeder?.id && (
        <>
          <Button
            variant="ghost"
            size="sm"
            mt="12"
            px="0"
            onClick={() => setShowBreeder((prev) => !prev)}
          >
            {showBreeder ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
            Dane hodowcy
          </Button>
          {showBreeder && <BreederDetails breederId={user.breeder.id} />}
        </>
      )}
    </Box>
  )
}

const UsersPage = () => {
  const queryClient = useQueryClient()
  const [roleTab, setRoleTab] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [userToBlock, setUserToBlock] = useState<AdminUser | null>(null)

  const filters: AdminUsersFilters = {
    page,
    limit: 20,
    role: roleTab === 'all' ? undefined : (roleTab as AdminUsersFilters['role']),
    search: search || undefined,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => adminApi.getUsers(filters),
  })

  const toggleBlockMutation = useMutation({
    mutationFn: (user: AdminUser) =>
      user.isBlocked ? adminApi.unblockUser(user._id) : adminApi.blockUser(user._id),
    onSuccess: (_data, user) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
      toaster.success({
        title: user.isBlocked ? 'Użytkownik odblokowany' : 'Użytkownik zablokowany',
      })
      setUserToBlock(null)
    },
    onError: (err) => {
      toaster.error({ title: getApiErrorMessage(err, 'Nie udało się zmienić statusu użytkownika') })
      setUserToBlock(null)
    },
  })

  const users = data?.data || []
  const pagination = data?.pagination

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleToggleBlock = (user: AdminUser) => {
    if (user.isBlocked) {
      // Разблокировка без подтверждения
      toggleBlockMutation.mutate(user)
    } else {
      setUserToBlock(user)
    }
  }

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" mb="24" gap="16" wrap="wrap">
          <Box>
            <Text textStyle="displayXLBold" color="contentBlack01" mb="4">
              Użytkownicy
            </Text>
            <Text textStyle="labelL" color="contentGrey">
              {pagination ? accountsLabel(pagination.total) : 'Zarządzanie kontami użytkowników'}
            </Text>
          </Box>
        </Flex>

        {/* Поиск */}
        <Box position="relative" maxW="360px" mb="16">
          <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
            <LuSearch size={16} />
          </Box>
          <Input
            placeholder="Szukaj po emailu lub nazwisku"
            pl="36px"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={applySearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch()
            }}
          />
        </Box>

        {/* Табы ролей */}
        <Tabs.Root
          value={roleTab}
          onValueChange={(details) => {
            setRoleTab(details.value)
            setPage(1)
          }}
          mb="24"
        >
          <Tabs.List overflowX="auto">
            {roleTabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value} flexShrink={0}>
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        {/* Список */}
        {isLoading ? (
          <Flex direction="column" gap="12">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h="96px" borderRadius="12px" />
            ))}
          </Flex>
        ) : error ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="labelL" color="contentGrey">
              Nie udało się załadować użytkowników. Spróbuj odświeżyć stronę.
            </Text>
          </Box>
        ) : users.length === 0 ? (
          <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
            <Text textStyle="titleSBold" color="contentBlack01" mb="8">
              Brak użytkowników
            </Text>
            <Text textStyle="labelM" color="contentGrey">
              Nie znaleziono kont spełniających kryteria wyszukiwania
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="12">
            {users.map((user) => (
              <UserRow key={user._id} user={user} onToggleBlock={handleToggleBlock} />
            ))}
          </Flex>
        )}

        {/* Пагинация */}
        {pagination && pagination.pages > 1 && (
          <Flex justify="center" align="center" gap="16" mt="24">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
            >
              Następna
            </Button>
          </Flex>
        )}

        {/* Подтверждение блокировки */}
        <Dialog.Root open={!!userToBlock} onOpenChange={(e) => !e.open && setUserToBlock(null)}>
          <Portal>
            <Dialog.Backdrop bg="blackAlpha.600" />
            <Dialog.Positioner>
              <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="400px" mx="16">
                <Dialog.Header p="0" mb="16">
                  <Dialog.Title>
                    <Text textStyle="titleSBold" color="contentBlack01">
                      Zablokować użytkownika?
                    </Text>
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body p="0" mb="24">
                  <Text textStyle="labelM" color="contentGrey">
                    Konto {userToBlock?.email} zostanie zablokowane — użytkownik straci dostęp do
                    platformy do czasu odblokowania.
                  </Text>
                </Dialog.Body>
                <Dialog.Footer p="0" display="flex" gap="12" justifyContent="flex-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserToBlock(null)}
                    disabled={toggleBlockMutation.isPending}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="red"
                    size="sm"
                    onClick={() => userToBlock && toggleBlockMutation.mutate(userToBlock)}
                    disabled={toggleBlockMutation.isPending}
                  >
                    {toggleBlockMutation.isPending ? <Spinner size="xs" /> : 'Zablokuj'}
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

export default UsersPage
