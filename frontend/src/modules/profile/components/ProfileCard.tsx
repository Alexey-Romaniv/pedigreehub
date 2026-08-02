import { Box, Text, VStack, HStack, Avatar, Badge, Button, Flex } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuPencil } from 'react-icons/lu'
import { useAuthStore } from '@/store'
import { useMyAccount } from '../hooks'

export const ProfileCard = () => {
  const { user } = useAuthStore()
  // Телефон и аватар не приходят при логине — берём их из свежего профиля
  const { data: profile } = useMyAccount()

  if (!user) return null

  const roleLabels: Record<string, string> = {
    user: 'Użytkownik',
    breeder: 'Hodowca',
    admin: 'Administrator',
  }

  const avatar = profile?.avatar ?? user.avatar
  const phone = profile?.phone ?? user.phone

  return (
    <Box bg="backgroundSecondary01" borderRadius="12" p="24" border="1px solid" borderColor="linePrimary">
      <Flex gap="16" justify="space-between" align="start" wrap="wrap">
        <HStack gap="16" align="start">
          <Avatar.Root size="xl">
            {avatar && <Avatar.Image src={avatar} alt="Zdjęcie profilowe" />}
            <Avatar.Fallback>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </Avatar.Fallback>
          </Avatar.Root>
          <VStack align="start" gap="8">
            <Text textStyle="titleLBold" color="contentBlack01">
              {user.firstName} {user.lastName}
            </Text>
            <Text textStyle="labelM" color="contentGrey">
              {user.email}
            </Text>
            {phone && (
              <Text textStyle="labelM" color="contentGrey">
                {phone}
              </Text>
            )}
            <HStack gap="8">
              <Badge colorPalette="gray">{roleLabels[user.role]}</Badge>
              {user.isEmailVerified && (
                <Badge colorPalette="green">Email potwierdzony</Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        <Button variant="outline" size="sm" asChild>
          <Link to="/profile/settings">
            <LuPencil size={14} />
            Edytuj dane
          </Link>
        </Button>
      </Flex>
    </Box>
  )
}
