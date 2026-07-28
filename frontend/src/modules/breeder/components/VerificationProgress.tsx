import { Box, Text, Flex, Stack, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuCheck, LuArrowRight } from 'react-icons/lu'
import type { BadgeType } from '../types'

interface VerificationProgressProps {
  badges: BadgeType[]
}

// Только пункты, которые заводчик реально может выполнить через UI
// (zdjęcia hodowli i rodowody reproduktorów не имеют UI загрузки — не показываем)
const allBadges: { type: BadgeType; label: string }[] = [
  { type: 'email_verified', label: 'Email potwierdzony' },
  { type: 'zkwp_verified', label: 'Certyfikat ZKwP' },
  { type: 'identity_verified', label: 'Tożsamość potwierdzona' },
  { type: 'nip_verified', label: 'NIP zweryfikowany' },
  { type: 'awards_verified', label: 'Nagrody potwierdzone' },
]

export const VerificationProgress = ({ badges }: VerificationProgressProps) => {
  const completed = allBadges.filter(({ type }) => badges.includes(type)).length
  const total = allBadges.length

  return (
    <Box
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      p="24"
      h="full"
    >
      <Flex justify="space-between" align="center" mb="20">
        <Text textStyle="titleSerifL" color="contentBlack01">
          Postęp weryfikacji
        </Text>
        <Text textStyle="labelMonoS" color="contentGrey">
          {completed} z {total}
        </Text>
      </Flex>

      {/* Progress bar */}
      <Box w="full" h="6px" bg="backgroundGrey" borderRadius="full" mb="20" overflow="hidden">
        <Box
          w={`${(completed / total) * 100}%`}
          h="full"
          bg="contentBlack01"
          borderRadius="full"
          transition="width 0.3s ease"
        />
      </Box>

      <Stack gap="12">
        {allBadges.map(({ type, label }) => {
          const isCompleted = badges.includes(type)
          return (
            <Flex key={type} align="center" gap="12">
              <Box
                w="22px"
                h="22px"
                borderRadius="full"
                bg={isCompleted ? 'contentBlack01' : 'backgroundPrimary'}
                border="1px solid"
                borderColor={isCompleted ? 'contentBlack01' : 'linePrimary'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {isCompleted && <LuCheck size={13} color="white" />}
              </Box>
              <Text textStyle="labelM" color={isCompleted ? 'contentBlack01' : 'contentGrey'}>
                {label}
              </Text>
            </Flex>
          )
        })}
      </Stack>

      {completed < total && (
        <Box mt="20">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/breeder/documents">
              Uzupełnij w Dokumentach
              <LuArrowRight size={15} />
            </Link>
          </Button>
        </Box>
      )}
    </Box>
  )
}
