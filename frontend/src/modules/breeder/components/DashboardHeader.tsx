import { Box, Flex, Text, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuPlus, LuFileText, LuBadgeCheck, LuClock, LuTriangleAlert } from 'react-icons/lu'
import type { VerificationLevel } from '../types'

type VerificationStatus = 'pending' | 'verified' | 'rejected'

interface DashboardHeaderProps {
  kennelName: string
  level: VerificationLevel
  status: VerificationStatus
  note?: string
}

// Документальный стиль: mono-пилюли вместо цветных Chakra-бейджей
const statusConfig: Record<
  VerificationStatus,
  { label: string; color: string; borderColor: string; icon: React.ComponentType<{ size?: number }> }
> = {
  verified: { label: 'Zweryfikowany', color: 'contentBlack01', borderColor: 'contentBlack01', icon: LuBadgeCheck },
  pending: { label: 'Oczekuje na weryfikację', color: 'contentGrey', borderColor: 'linePrimary', icon: LuClock },
  rejected: { label: 'Weryfikacja odrzucona', color: 'negative', borderColor: 'negative', icon: LuTriangleAlert },
}

// Level показываем отдельно только когда он несёт информацию сверх статуса
const levelLabels: Partial<Record<VerificationLevel, string>> = {
  trusted: 'Zaufany',
  professional: 'Profesjonalista',
}

const MonoPill = ({
  label,
  color,
  borderColor,
  icon: Icon,
}: {
  label: string
  color: string
  borderColor: string
  icon?: React.ComponentType<{ size?: number }>
}) => (
  <Flex
    align="center"
    gap="6"
    px="12"
    py="4"
    border="1px solid"
    borderColor={borderColor}
    borderRadius="full"
    color={color}
    flexShrink={0}
  >
    {Icon && <Icon size={13} />}
    <Text textStyle="labelMono" color={color}>
      {label}
    </Text>
  </Flex>
)

export const DashboardHeader = ({ kennelName, level, status, note }: DashboardHeaderProps) => {
  const config = statusConfig[status]
  const levelLabel = levelLabels[level]

  return (
    <Box w="full">
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap="16"
      >
        <Box>
          <Text textStyle="labelMono" color="contentGrey" mb="6">
            Panel hodowcy
          </Text>
          <Flex align="center" gap="12" mb="6" wrap="wrap">
            <Text textStyle="titleSerifXL" color="contentBlack01">
              {kennelName}
            </Text>
            <MonoPill
              label={config.label}
              color={config.color}
              borderColor={config.borderColor}
              icon={config.icon}
            />
            {levelLabel && (
              <MonoPill label={levelLabel} color="contentBlack01" borderColor="linePrimary" />
            )}
          </Flex>
        </Box>

        <Flex gap="12">
          <Button variant="outline" size="md" asChild>
            <Link to="/breeder/documents">
              <LuFileText size={18} />
              Dokumenty
            </Link>
          </Button>
          <Button variant="solid" size="md" asChild>
            <Link to="/breeder/listings/new">
              <LuPlus size={18} />
              Dodaj ogłoszenie
            </Link>
          </Button>
        </Flex>
      </Flex>

      {/* Баннер для pending/rejected — заводчик должен видеть свой статус и причину */}
      {status === 'pending' && (
        <Flex
          mt="20"
          p="16"
          bg="backgroundGrey"
          border="1px solid"
          borderColor="linePrimary"
          borderRadius="12px"
          gap="12"
          align="flex-start"
        >
          <Box color="contentGrey" mt="2px">
            <LuClock size={18} />
          </Box>
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="2">
              Profil oczekuje na weryfikację
            </Text>
            <Text textStyle="labelM" color="contentGrey">
              Twoje ogłoszenia będą widoczne publicznie po zatwierdzeniu profilu przez moderatora.
              Upewnij się, że przesłałeś certyfikat ZKwP w sekcji Dokumenty.
            </Text>
          </Box>
        </Flex>
      )}

      {status === 'rejected' && (
        <Flex
          mt="20"
          p="16"
          bg="backgroundPrimary"
          border="1px solid"
          borderColor="negative"
          borderRadius="12px"
          gap="12"
          align="flex-start"
        >
          <Box color="negative" mt="2px">
            <LuTriangleAlert size={18} />
          </Box>
          <Box flex="1">
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="2">
              Weryfikacja została odrzucona
            </Text>
            {note && (
              <Text textStyle="labelM" color="contentGrey" mb="8">
                Powód: {note}
              </Text>
            )}
            <Box>
              <Button variant="outline" size="sm" asChild>
                <Link to="/breeder/documents">
                  <LuFileText size={15} />
                  Popraw dokumenty
                </Link>
              </Button>
            </Box>
          </Box>
        </Flex>
      )}
    </Box>
  )
}
