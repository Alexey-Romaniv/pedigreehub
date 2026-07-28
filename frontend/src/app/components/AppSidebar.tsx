import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Drawer, Flex, Text } from '@chakra-ui/react'
import {
  LuPawPrint,
  LuHouse,
  LuList,
  LuUser,
  LuHeart,
  LuMessageSquare,
  LuSettings,
  LuLogOut,
  LuLogIn,
  LuUserPlus,
  LuShieldCheck,
  LuLayoutDashboard,
  LuFileText,
  LuFileCheck,
  LuUsers,
  LuMenu,
  LuX,
} from 'react-icons/lu'
import { useAuthStore } from '@/store'
import { UserAvatar } from '@/shared/ui'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  exact?: boolean
}

interface NavSection {
  label?: string
  items: NavItem[]
}

// Секции навигации по роли (в кабинетах пользователь всегда авторизован,
// публичный вариант — фолбэк на случай прямого рендера сайдбара без auth)
const getNavSections = (isAuthenticated: boolean, role?: string): NavSection[] => {
  if (!isAuthenticated) {
    return [
      {
        items: [
          { path: '/', label: 'Strona główna', icon: LuHouse, exact: true },
          { path: '/catalog', label: 'Katalog', icon: LuList },
          { path: '/login', label: 'Zaloguj się', icon: LuLogIn },
          { path: '/register', label: 'Rejestracja', icon: LuUserPlus },
        ],
      },
    ]
  }

  const sections: NavSection[] = [
    {
      items: [
        { path: '/', label: 'Strona główna', icon: LuHouse, exact: true },
        { path: '/catalog', label: 'Katalog', icon: LuList },
      ],
    },
  ]

  if (role === 'admin') {
    sections.push({
      label: 'Panel admina',
      items: [
        { path: '/admin/dashboard', label: 'Statystyki', icon: LuLayoutDashboard },
        { path: '/admin/verification', label: 'Weryfikacja', icon: LuShieldCheck },
        { path: '/admin/moderation', label: 'Moderacja', icon: LuFileCheck },
        { path: '/admin/users', label: 'Użytkownicy', icon: LuUsers },
      ],
    })
  } else if (role === 'breeder') {
    sections.push({
      label: 'Panel hodowcy',
      items: [
        { path: '/breeder/dashboard', label: 'Panel główny', icon: LuLayoutDashboard },
        { path: '/breeder/listings', label: 'Ogłoszenia', icon: LuList },
        { path: '/breeder/inquiries', label: 'Zapytania', icon: LuMessageSquare },
        { path: '/breeder/documents', label: 'Dokumenty', icon: LuFileText },
      ],
    })
  }

  sections.push({
    label: 'Moje konto',
    items: [
      { path: '/profile', label: 'Profil', icon: LuUser, exact: true },
      { path: '/profile/favorites', label: 'Ulubione', icon: LuHeart },
      { path: '/profile/inquiries', label: 'Moje zapytania', icon: LuMessageSquare },
      { path: '/profile/settings', label: 'Ustawienia', icon: LuSettings },
    ],
  })

  return sections
}

// Лого в стиле PublicHeader (serif)
const SidebarLogo = ({ onNavigate }: { onNavigate?: () => void }) => (
  <Link to="/" onClick={onNavigate}>
    <Flex align="center" gap="10px">
      <Box
        w="34px"
        h="34px"
        bg="contentBlack01"
        borderRadius="8px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <LuPawPrint size={17} color="white" />
      </Box>
      <Text textStyle="titleSerifL" color="contentBlack01">
        PedigreeHub
      </Text>
    </Flex>
  </Link>
)

// Контент сайдбара: инфо о пользователе + навигация + выход.
// Переиспользуется в десктопном сайдбаре и мобильном Drawer.
const SidebarContent = ({
  onNavigate,
  activeBg = 'backgroundPrimary',
}: {
  onNavigate?: () => void
  activeBg?: string
}) => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const isActiveLink = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate('/login')
  }

  const sections = getNavSections(isAuthenticated, user?.role)

  return (
    <>
      {/* User info */}
      {isAuthenticated && user && (
        <Box p="20" borderBottom="1px solid" borderColor="linePrimary" flexShrink={0}>
          <Flex align="center" gap="12">
            <UserAvatar
              firstName={user.firstName}
              lastName={user.lastName}
              avatar={user.avatar}
              size={40}
            />
            <Box minW="0">
              <Text textStyle="labelMSemibold" color="contentBlack01">
                {user.firstName} {user.lastName}
              </Text>
              <Text textStyle="labelS" color="contentGrey" truncate>
                {user.email}
              </Text>
            </Box>
          </Flex>
        </Box>
      )}

      {/* Navigation - скроллируемая область */}
      <Box flex="1" py="16" overflowY="auto" minH="0">
        <Flex direction="column" px="12">
          {sections.map((section, sectionIndex) => (
            <Box key={section.label ?? sectionIndex}>
              {section.label && (
                <Text textStyle="labelMono" color="contentGrey" px="12" pt="20" pb="8">
                  {section.label}
                </Text>
              )}
              <Flex direction="column" gap="2">
                {section.items.map((item) => {
                  const isActive = isActiveLink(item.path, item.exact)
                  const Icon = item.icon
                  return (
                    <Link key={item.path} to={item.path} onClick={onNavigate}>
                      <Flex
                        align="center"
                        gap="12"
                        px="12"
                        py="12"
                        borderRadius="8px"
                        bg={isActive ? activeBg : 'transparent'}
                        _hover={{ bg: activeBg }}
                        transition="background 0.15s"
                      >
                        <Box color={isActive ? 'contentBlack01' : 'contentGrey'}>
                          <Icon size={17} />
                        </Box>
                        <Text
                          textStyle="labelMSemibold"
                          color={isActive ? 'contentBlack01' : 'contentGrey'}
                        >
                          {item.label}
                        </Text>
                      </Flex>
                    </Link>
                  )
                })}
              </Flex>
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Logout - всегда внизу */}
      {isAuthenticated && (
        <Box p="16" borderTop="1px solid" borderColor="linePrimary" flexShrink={0}>
          <Button
            variant="ghost"
            size="sm"
            w="full"
            justifyContent="flex-start"
            onClick={handleLogout}
          >
            <LuLogOut size={16} />
            Wyloguj się
          </Button>
        </Box>
      )}
    </>
  )
}

// Десктопный фиксированный сайдбар (md+)
export const AppSidebar = () => {
  return (
    <Box
      w="240px"
      bg="backgroundGrey"
      borderRight="1px solid"
      borderColor="linePrimary"
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      flexShrink={0}
      position="fixed"
      top={0}
      left={0}
      h="100vh"
      zIndex={10}
    >
      <Box p="20" borderBottom="1px solid" borderColor="linePrimary" flexShrink={0}>
        <SidebarLogo />
      </Box>
      <SidebarContent activeBg="backgroundPrimary" />
    </Box>
  )
}

// Мобильный верхний бар кабинета (base..md): лого + бургер, Drawer с той же навигацией
export const CabinetMobileBar = () => {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Box
      display={{ base: 'block', md: 'none' }}
      position="sticky"
      top="0"
      zIndex={100}
      bg="backgroundPrimary"
      borderBottom="1px solid"
      borderColor="linePrimary"
    >
      <Flex align="center" justify="space-between" h="56px" px="16">
        <SidebarLogo />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Otwórz menu"
          onClick={() => setOpen(true)}
        >
          <LuMenu size={20} />
        </Button>
      </Flex>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="start">
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content bg="backgroundPrimary" maxW="300px" display="flex" flexDirection="column">
            <Flex
              justify="space-between"
              align="center"
              p="20"
              borderBottom="1px solid"
              borderColor="linePrimary"
              flexShrink={0}
            >
              <SidebarLogo onNavigate={close} />
              <Button variant="ghost" size="xs" aria-label="Zamknij menu" onClick={close}>
                <LuX size={18} />
              </Button>
            </Flex>
            <SidebarContent onNavigate={close} activeBg="backgroundGrey" />
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  )
}
