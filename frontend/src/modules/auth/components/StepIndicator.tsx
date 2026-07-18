import { Box, Flex, Text, Circle } from '@chakra-ui/react'
import { LuCheck, LuUser, LuHouse, LuClipboardCheck } from 'react-icons/lu'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const steps = [
  { icon: LuUser, label: 'Dane osobowe' },
  { icon: LuHouse, label: 'Hodowla' },
  { icon: LuClipboardCheck, label: 'Potwierdzenie' },
]

export const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => (
  <Flex justify="center" mb="40" position="relative">
    {steps.slice(0, totalSteps).map((step, index) => {
      const isCompleted = index < currentStep
      const isActive = index === currentStep
      const Icon = step.icon

      return (
        <Flex key={index} align="center">
          <Flex direction="column" align="center" position="relative" zIndex="1">
            <Circle
              size="48px"
              bg={isCompleted ? 'positive' : isActive ? 'contentBlack01' : 'backgroundGrey'}
              color={isCompleted || isActive ? 'white' : 'contentGrey'}
              transition="all 0.3s ease"
            >
              {isCompleted ? <LuCheck size={20} /> : <Icon size={20} />}
            </Circle>
            <Text
              textStyle="labelS"
              color={isActive ? 'contentBlack01' : 'contentGrey'}
              mt="8"
              fontWeight={isActive ? 'semibold' : 'regular'}
              whiteSpace="nowrap"
            >
              {step.label}
            </Text>
          </Flex>

          {index < totalSteps - 1 && (
            <Box
              w={{ base: '40px', md: '60px' }}
              h="3px"
              bg={index < currentStep ? 'positive' : 'linePrimary'}
              mx="8"
              mt="-24px"
              borderRadius="full"
              transition="background 0.3s ease"
            />
          )}
        </Flex>
      )
    })}
  </Flex>
)
