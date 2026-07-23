import { Box, Flex, Text } from '@chakra-ui/react'

export type StatusPillTone = 'default' | 'muted' | 'positive' | 'negative'

interface StatusPillProps {
  label: string
  /** Тон пилюли: default — чёрный, muted — серый, positive — чёрный с зелёной точкой, negative — красный */
  tone?: StatusPillTone
  icon?: React.ComponentType<{ size?: number }>
  /** Точка-индикатор слева (альтернатива иконке) */
  dot?: boolean
}

const toneConfig: Record<
  StatusPillTone,
  { color: string; borderColor: string; dotColor: string }
> = {
  default: { color: 'contentBlack01', borderColor: 'linePrimary', dotColor: 'contentBlack01' },
  muted: { color: 'contentGrey', borderColor: 'linePrimary', dotColor: 'contentGrey' },
  positive: { color: 'contentBlack01', borderColor: 'linePrimary', dotColor: 'positive' },
  negative: { color: 'negative', borderColor: 'negative', dotColor: 'negative' },
}

/**
 * Документальная mono-пилюля статуса (вместо цветных Chakra-бейджей).
 */
export const StatusPill = ({ label, tone = 'default', icon: Icon, dot }: StatusPillProps) => {
  const config = toneConfig[tone]

  return (
    <Flex
      align="center"
      gap="6"
      px="10px"
      py="2"
      border="1px solid"
      borderColor={config.borderColor}
      borderRadius="full"
      color={config.color}
      flexShrink={0}
      w="fit-content"
    >
      {Icon && <Icon size={12} />}
      {!Icon && dot && (
        <Box w="6px" h="6px" borderRadius="full" bg={config.dotColor} flexShrink={0} />
      )}
      <Text textStyle="labelMonoS" color={config.color} whiteSpace="nowrap" textTransform="uppercase">
        {label}
      </Text>
    </Flex>
  )
}
