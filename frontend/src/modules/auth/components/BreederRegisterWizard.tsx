import { Box, Text, Stack } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useBreederRegistrationStore } from '../store'
import { useRegisterBreeder } from '../hooks'
import { step1Schema, step2Schema } from '../types'
import type { Step1FormData, Step2FormData } from '../types'
import { toaster } from '@/shared/theme/toaster'
import { StepIndicator } from './StepIndicator'
import { Step1PersonalInfo } from './Step1PersonalInfo'
import { Step2KennelInfo } from './Step2KennelInfo'
import { Step3Summary } from './Step3Summary'

export const BreederRegisterWizard = () => {
  const { currentStep, setCurrentStep, step1Data, step2Data } = useBreederRegistrationStore()
  const { submit, isPending, error } = useRegisterBreeder()
  
  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: step1Data?.firstName || '',
      lastName: step1Data?.lastName || '',
      email: step1Data?.email || '',
      phone: step1Data?.phone || '+48',
      password: step1Data?.password || '',
      confirmPassword: step1Data?.password || '',
    },
  })
  
  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      kennelName: step2Data?.kennelName || '',
      kennelRegistration: step2Data?.kennelRegistration || '',
      region: step2Data?.region || '',
      city: step2Data?.city || '',
      address: step2Data?.address || '',
      description: step2Data?.description || '',
      website: step2Data?.website || '',
      facebook: step2Data?.facebook || '',
      instagram: step2Data?.instagram || '',
      breeds: step2Data?.breeds || [],
    },
  })

  useEffect(() => {
    if (step1Data) {
      step1Form.reset({
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        email: step1Data.email,
        phone: step1Data.phone,
        password: step1Data.password,
        confirmPassword: step1Data.password,
      })
    }
  }, [step1Data])

  useEffect(() => {
    if (step2Data) step2Form.reset(step2Data)
  }, [step2Data])

  const apiError = error?.response?.data?.error

  const handleNext = () => setCurrentStep(Math.min(currentStep + 1, 2))
  const handleBack = () => setCurrentStep(Math.max(currentStep - 1, 0))

  const handleSubmit = () => {
    if (!step1Data || !step2Data) {
      toaster.error({ title: 'Wypełnij wszystkie kroki.' })
      return
    }
    submit(step1Data, step2Data)
  }

  return (
    <Box>
      <Box mb="24">
        <Link to="/register">
          <Text textStyle="labelM" color="contentGrey" _hover={{ color: 'contentBlack01' }}>← Wróć do wyboru typu konta</Text>
        </Link>
      </Box>

      <StepIndicator currentStep={currentStep} totalSteps={3} />

      {apiError && (
        <Box bg="statusBackgroundRed" color="statusTextRed" p="16" borderRadius="8px" mb="24">
          <Text textStyle="labelMSemibold">{apiError.message}</Text>
          {apiError.details && (
            <Stack gap="4" mt="8">
              {apiError.details.map((detail: any, i: number) => (
                <Text key={i} textStyle="labelS">• {detail.field}: {detail.message}</Text>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {currentStep === 0 && <Step1PersonalInfo form={step1Form} onNext={handleNext} />}
      {currentStep === 1 && <Step2KennelInfo form={step2Form} onNext={handleNext} onBack={handleBack} />}
      {currentStep === 2 && <Step3Summary onBack={handleBack} onSubmit={handleSubmit} isPending={isPending} />}

      <Text textAlign="center" textStyle="labelM" color="contentGrey" mt="32">
        Masz już konto?{' '}
        <Link to="/login"><Text as="span" color="contentBlack01" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>Zaloguj się</Text></Link>
      </Text>
    </Box>
  )
}
