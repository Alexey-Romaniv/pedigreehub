import { Box, Text } from '@chakra-ui/react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

// Карточка-секция для страницы настроек аккаунта
export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <Box
    bg="backgroundSecondary01"
    borderRadius="12px"
    p="24"
    border="1px solid"
    borderColor="linePrimary"
  >
    <Text textStyle="titleMBold" color="contentBlack01" mb={description ? '6' : '20'}>
      {title}
    </Text>
    {description && (
      <Text textStyle="labelM" color="contentGrey" mb="20">
        {description}
      </Text>
    )}
    {children}
  </Box>
)
