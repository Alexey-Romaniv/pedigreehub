import { Box, SimpleGrid, Text, Flex } from '@chakra-ui/react'
import { LuEye, LuMessageCircle, LuHeart, LuFileText } from 'react-icons/lu'
import type { DashboardStats } from '../types'

interface StatsCardsProps {
  stats: DashboardStats
}

const statsConfig = [
  { key: 'views', label: 'Wyświetleń', icon: LuEye },
  { key: 'inquiries', label: 'Zapytań', icon: LuMessageCircle },
  { key: 'favorites', label: 'W ulubionych', icon: LuHeart },
  { key: 'activeListings', label: 'Aktywnych', icon: LuFileText },
] as const

export const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap="16" w="full">
      {statsConfig.map(({ key, label, icon: Icon }) => (
        <Box
          key={key}
          bg="backgroundPrimary"
          border="1px solid"
          borderColor="linePrimary"
          borderRadius="12px"
          p="20"
        >
          <Flex align="center" gap="12" mb="12">
            <Box
              w="40px"
              h="40px"
              bg="backgroundGrey"
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="contentGrey"
            >
              <Icon size={20} />
            </Box>
          </Flex>
          <Text textStyle="titleSerifXL" color="contentBlack01" mb="4">
            {stats[key].toLocaleString('pl-PL')}
          </Text>
          <Text textStyle="labelMono" color="contentGrey">
            {label}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  )
}
