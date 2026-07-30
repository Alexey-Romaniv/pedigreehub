import { Box, Flex, Text, Circle } from '@chakra-ui/react'
import { LuCheck } from 'react-icons/lu'

interface StepIndicatorProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

const steps = [
  { number: 1, label: 'Podstawowe informacje' },
  { number: 2, label: 'Rodzice' },
  { number: 3, label: 'Dokumenty' },
  { number: 4, label: 'Zdjęcia i opis' },
]

export const StepIndicator = ({ currentStep, onStepClick }: StepIndicatorProps) => {
  return (
    <Box mb="40">
      <Flex gap="8" align="center" justify="space-between" flexWrap="wrap">
        {steps.map((step, index) => {
          const isActive = step.number === currentStep
          const isCompleted = step.number < currentStep
          const isClickable = isCompleted && onStepClick

          return (
            <Flex key={step.number} align="center" flex="1" minW="140px">
              <Flex
                align="center"
                gap="12"
                cursor={isClickable ? 'pointer' : 'default'}
                onClick={isClickable ? () => onStepClick?.(step.number) : undefined}
                opacity={step.number > currentStep ? 0.45 : 1}
                transition="all 0.2s"
                _hover={isClickable ? { opacity: 0.75 } : undefined}
              >
                <Circle
                  size="36px"
                  bg={isActive || isCompleted ? 'contentBlack01' : 'backgroundPrimary'}
                  color={isActive || isCompleted ? 'backgroundPrimary' : 'contentGrey'}
                  border="1px solid"
                  borderColor={isActive || isCompleted ? 'contentBlack01' : 'linePrimary'}
                  transition="all 0.3s"
                >
                  {isCompleted ? (
                    <LuCheck size={16} />
                  ) : (
                    <Text textStyle="labelMonoS" color="inherit">
                      {String(step.number).padStart(2, '0')}
                    </Text>
                  )}
                </Circle>
                <Box display={{ base: 'none', md: 'block' }}>
                  <Text textStyle="labelMonoS" color="contentGrey" mb="2" textTransform="uppercase">
                    Krok {step.number}
                  </Text>
                  <Text
                    textStyle="labelMSemibold"
                    color={isActive || isCompleted ? 'contentBlack01' : 'contentGrey'}
                  >
                    {step.label}
                  </Text>
                </Box>
              </Flex>
              {index < steps.length - 1 && (
                <Box
                  flex="1"
                  h="1px"
                  bg={step.number < currentStep ? 'contentBlack01' : 'linePrimary'}
                  mx="12"
                  minW="20px"
                  transition="all 0.3s"
                />
              )}
            </Flex>
          )
        })}
      </Flex>
    </Box>
  )
}
