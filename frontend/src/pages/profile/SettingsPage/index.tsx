import { Box, Container, Skeleton, Stack, Text } from '@chakra-ui/react'
import {
  AccountDataForm,
  AvatarUpload,
  ChangePasswordForm,
  SettingsSection,
  useMyAccount,
} from '@/modules/profile'

const SettingsPage = () => {
  const { data: profile, isLoading, isError } = useMyAccount()

  return (
    <Container maxW="container.md" py="32">
      <Text textStyle="titleXLBold" color="contentBlack01" mb="8">
        Ustawienia
      </Text>
      <Text textStyle="labelM" color="contentGrey" mb="24">
        Dane konta, zdjęcie profilowe i hasło
      </Text>

      {isLoading && (
        <Stack gap="20">
          <Skeleton h="140px" borderRadius="12px" />
          <Skeleton h="320px" borderRadius="12px" />
          <Skeleton h="280px" borderRadius="12px" />
        </Stack>
      )}

      {isError && (
        <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
          <Text textStyle="titleSBold" color="contentBlack01" mb="8">
            Coś poszło nie tak
          </Text>
          <Text textStyle="labelM" color="contentGrey">
            Nie udało się załadować danych konta. Spróbuj odświeżyć stronę.
          </Text>
        </Box>
      )}

      {profile && (
        <Stack gap="20">
          <SettingsSection
            title="Zdjęcie profilowe"
            description="Widoczne w Twoim panelu i w rozmowach z hodowcami"
          >
            <AvatarUpload
              firstName={profile.firstName}
              lastName={profile.lastName}
              avatar={profile.avatar}
            />
          </SettingsSection>

          <SettingsSection title="Dane konta">
            <AccountDataForm profile={profile} />
          </SettingsSection>

          <SettingsSection
            title="Zmiana hasła"
            description="Po zmianie hasła pozostałe urządzenia zostaną wylogowane"
          >
            <ChangePasswordForm />
          </SettingsSection>
        </Stack>
      )}
    </Container>
  )
}

export default SettingsPage
