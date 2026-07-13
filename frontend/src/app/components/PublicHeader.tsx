import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Container, Drawer, Flex, Menu, Portal, Text } from '@chakra-ui/react'
import {
  LuPawPrint,
  LuMenu,
  LuX,
  LuUser,
  LuHeart,
  LuMessageSquare,
  LuLayoutDashboard,
  LuLogOut,
} from 'react-icons/lu'
import { useAuthStore } from '@/store'
import { UserAvatar } from '@/shared/ui'

const NAV_LINKS = [
  { path: '/', label: 'Strona główna', exact: true },
  { path: '/catalog', label: 'Katalog' },
]

// Пункты меню авторизованного пользователя (общие + по роли)
const getPanelLink = (role?: string) => {
  if (role === 'admin') return { path: '/admin/dashboard', label: 'Panel admina' }
  if (role === 'breeder') return { path: '/breeder/dashboard', label: 'Panel hodowcy' }
  return null
}

export const PublicHeader = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const panelLink = getPanelLink(user?.role)

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex={100}
      bg="backgroundPrimary"
      borderBottom="1px solid"
      borderColor="linePrimary"
    >
      <Container maxW="container.xl">
        <Flex align="center" justify="space-between" h="64px" gap="16">
          {/* Logo */}
          <Link to="/">
            <Flex align="center" gap="10px">
              <Box
                w="34px"
                h="34px"
                bg="contentBlack01"
                borderRadius="8px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuPawPrint size={17} color="white" />
              </Box>
              <Text textStyle="titleSerifL" color="contentBlack01">
                PedigreeHub
              </Text>
            </Flex>
          </Link>

          {/* Desktop nav */}
          <Flex align="center" gap="4" display={{ base: 'none', md: 'flex' }} flex="1" ml="24">
            {NAV_LINKS.map((link) => (
              <Link key={link.path} to={link.path}>
                <Box
                  px="12"
                  py="8"
                  borderRadius="8px"
                  transition="background 0.15s"
                  _hover={{ bg: 'backgroundGrey' }}
                >
                  <Text
                    textStyle="labelMSemibold"
                    color={isActive(link.path, link.exact) ? 'contentBlack01' : 'contentGrey'}
                  >
                    {link.label}
                  </Text>
                </Box>
              </Link>
            ))}
          </Flex>

          {/* Desktop auth */}
          <Flex align="center" gap="8" display={{ base: 'none', md: 'flex' }}>
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Zaloguj się</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Rejestracja</Link>
                </Button>
              </>
            ) : (
              <>
                {panelLink && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={panelLink.path}>
                      <LuLayoutDashboard size={15} />
                      {panelLink.label}
                    </Link>
                  </Button>
                )}
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      borderRadius="full"
                      w="36px"
                      h="36px"
                      p="0"
                      bg="transparent"
                      _hover={{ bg: 'transparent', opacity: 0.85 }}
                      aria-label="Menu użytkownika"
                    >
                      <UserAvatar
                        firstName={user?.firstName}
                        lastName={user?.lastName}
                        avatar={user?.avatar}
                        size={36}
                        initialsStyle="labelSBold"
                      />
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content bg="backgroundPrimary" borderRadius="8px" minW="220px">
                        <Box px="12" py="8" borderBottom="1px solid" borderColor="linePrimary">
                          <Text textStyle="labelMSemibold" color="contentBlack01">
                            {user?.firstName} {user?.lastName}
                          </Text>
                          <Text textStyle="labelS" color="contentGrey" truncate>
                            {user?.email}
                          </Text>
                        </Box>
                        <Menu.Item value="profile" cursor="pointer" onClick={() => navigate('/profile')}>
                          <LuUser size={15} />
                          Mój profil
                        </Menu.Item>
                        <Menu.Item value="favorites" cursor="pointer" onClick={() => navigate('/profile/favorites')}>
                          <LuHeart size={15} />
                          Ulubione
                        </Menu.Item>
                        <Menu.Item value="inquiries" cursor="pointer" onClick={() => navigate('/profile/inquiries')}>
                          <LuMessageSquare size={15} />
                          Moje zapytania
                        </Menu.Item>
                        <Menu.Item value="logout" cursor="pointer" onClick={handleLogout}>
                          <LuLogOut size={15} />
                          Wyloguj się
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </>
            )}
          </Flex>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="sm"
            display={{ base: 'inline-flex', md: 'none' }}
            aria-label="Otwórz menu"
            onClick={() => setMobileOpen(true)}
          >
            <LuMenu size={20} />
          </Button>
        </Flex>
      </Container>

      {/* Mobile drawer */}
      <Drawer.Root open={mobileOpen} onOpenChange={(e) => setMobileOpen(e.open)} placement="end">
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content bg="backgroundPrimary" maxW="300px" p="20">
            <Drawer.Header p="0" mb="24">
              <Flex justify="space-between" align="center" w="full">
                <Drawer.Title>
                  <Text textStyle="titleSerifL" color="contentBlack01">
                    PedigreeHub
                  </Text>
                </Drawer.Title>
                <Button variant="ghost" size="xs" aria-label="Zamknij menu" onClick={closeMobile}>
                  <LuX size={18} />
                </Button>
              </Flex>
            </Drawer.Header>

            <Flex direction="column" gap="4">
              {NAV_LINKS.map((link) => (
                <Link key={link.path} to={link.path} onClick={closeMobile}>
                  <Box px="12" py="12" borderRadius="8px" _hover={{ bg: 'backgroundGrey' }}>
                    <Text
                      textStyle="labelMSemibold"
                      color={isActive(link.path, link.exact) ? 'contentBlack01' : 'contentGrey'}
                    >
                      {link.label}
                    </Text>
                  </Box>
                </Link>
              ))}

              <Box h="1px" bg="linePrimary" my="12" />

              {!isAuthenticated ? (
                <Flex direction="column" gap="8">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login" onClick={closeMobile}>
                      Zaloguj się
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/register" onClick={closeMobile}>
                      Rejestracja
                    </Link>
                  </Button>
                </Flex>
              ) : (
                <Flex direction="column" gap="4">
                  {panelLink && (
                    <Link to={panelLink.path} onClick={closeMobile}>
                      <Box px="12" py="12" borderRadius="8px" _hover={{ bg: 'backgroundGrey' }}>
                        <Text textStyle="labelMSemibold" color="contentBlack01">
                          {panelLink.label}
                        </Text>
                      </Box>
                    </Link>
                  )}
                  {[
                    { path: '/profile', label: 'Mój profil' },
                    { path: '/profile/favorites', label: 'Ulubione' },
                    { path: '/profile/inquiries', label: 'Moje zapytania' },
                  ].map((item) => (
                    <Link key={item.path} to={item.path} onClick={closeMobile}>
                      <Box px="12" py="12" borderRadius="8px" _hover={{ bg: 'backgroundGrey' }}>
                        <Text textStyle="labelMSemibold" color="contentGrey">
                          {item.label}
                        </Text>
                      </Box>
                    </Link>
                  ))}
                  <Button variant="ghost" size="sm" justifyContent="flex-start" onClick={handleLogout}>
                    <LuLogOut size={15} />
                    Wyloguj się
                  </Button>
                </Flex>
              )}
            </Flex>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  )
}
