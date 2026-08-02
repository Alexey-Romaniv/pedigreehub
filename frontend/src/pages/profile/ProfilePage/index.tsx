import { Box, Container, Text, VStack, Button, Flex, Badge, Separator } from '@chakra-ui/react'
import { ProfileCard, VerificationDocuments } from '@/modules/profile'
import { useAuthStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { LuShield, LuClock, LuCheck, LuX } from 'react-icons/lu'

const VerificationStatusBanner = ({ status }: { status: string }) => {
  const statusConfigs = {
    pending: { 
      bg: 'statusBackgroundGreyLight', 
      border: 'linePrimary', 
      icon: LuClock, 
      color: '#888888',
      title: 'Weryfikacja w trakcie',
      text: 'Twoje dokumenty są sprawdzane. Proces zajmuje 1-2 dni robocze.',
      badge: { color: 'gray', text: 'Oczekiwanie' }
    },
    verified: { 
      bg: 'statusBackgroundGreen', 
      border: 'positive', 
      icon: LuCheck, 
      color: '#35aa1b',
      title: 'Konto zweryfikowane',
      text: 'Twój profil hodowcy został potwierdzony. Możesz dodawać ogłoszenia.',
      badge: { color: 'green', text: 'Zweryfikowany' }
    },
    rejected: { 
      bg: 'statusBackgroundRed', 
      border: 'statusTextRed', 
      icon: LuX, 
      color: '#e91925',
      title: 'Weryfikacja odrzucona',
      text: 'Twoja weryfikacja została odrzucona. Sprawdź dokumenty i prześlij ponownie.',
      badge: { color: 'red', text: 'Odrzucony' }
    },
  }
  const config = statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.pending

  const Icon = config.icon

  return (
    <Box bg={config.bg} p="20" borderRadius="12px" border="1px solid" borderColor={config.border}>
      <Flex align="center" gap="12" mb="8">
        <Icon size={24} color={config.color} />
        <Text textStyle="titleSBold" color="contentBlack01">{config.title}</Text>
        <Badge colorPalette={config.badge.color}>{config.badge.text}</Badge>
      </Flex>
      <Text textStyle="labelM" color="contentBlack01">{config.text}</Text>
    </Box>
  )
}

const ProfilePage = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isBreeder = user?.role === 'breeder'
  const verificationStatus = user?.breeder?.verificationStatus || 'pending'

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="40">
      <Container maxW="container.md">
        <VStack gap="24" align="stretch">
          <Text textStyle="titleXLBold" color="contentBlack01">Moje konto</Text>
          
          <ProfileCard />

          {/* Статус верификации для заводчиков */}
          {isBreeder && (
            <>
              <Separator />
              
              <Box>
                <Flex align="center" gap="8" mb="16">
                  <LuShield size={20} color="#888888" />
                  <Text textStyle="titleMBold" color="contentBlack01">Status weryfikacji</Text>
                </Flex>
                <VerificationStatusBanner status={verificationStatus} />
              </Box>

              <Separator />

              <Box>
                <Text textStyle="titleMBold" color="contentBlack01" mb="16">
                  Dokumenty do weryfikacji
                </Text>
                <VerificationDocuments />
              </Box>
            </>
          )}

          <Separator />

          <Button variant="outline" onClick={handleLogout} alignSelf="start">
            Wyloguj się
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}

export default ProfilePage
