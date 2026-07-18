import { Box, Input, Stack, Field, Flex, Text, Button, Spinner } from '@chakra-ui/react'
import { UseFormReturn } from 'react-hook-form'
import { LuUser, LuMail, LuLock, LuEye, LuEyeOff, LuCheck, LuX } from 'react-icons/lu'
import { PhoneInput } from '@/shared/ui'
import { normalizePhone } from '@/shared/validation'
import { useState } from 'react'
import { useBreederRegistrationStore } from '../store'
import { useCheckEmail } from '../hooks'
import type { Step1FormData } from '../types'

interface Step1Props {
  form: UseFormReturn<Step1FormData>
  onNext: () => void
}

export const Step1PersonalInfo = ({ form, onNext }: Step1Props) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { register, formState: { errors }, trigger, getValues, setError } = form
  const { setStep1Data, setEmailChecked, isEmailChecked, isEmailAvailable } = useBreederRegistrationStore()
  const checkEmailMutation = useCheckEmail()

  const handleNext = async () => {
    const isValid = await trigger()
    if (!isValid) return

    const values = getValues()
    const result = await checkEmailMutation.mutateAsync(values.email)
    setEmailChecked(true, result.data.available)
    
    if (!result.data.available) {
      setError('email', { message: 'Ten email jest już zajęty' })
      return
    }

    setStep1Data({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: normalizePhone(values.phone),
      password: values.password,
    })
    onNext()
  }

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="titleXLBold" color="contentBlack01" mb="8">Dane osobowe</Text>
        <Text textStyle="labelM" color="contentGrey">Wprowadź swoje dane kontaktowe</Text>
      </Box>

      <Stack gap="20">
        <Flex gap="16" flexDir={{ base: 'column', md: 'row' }}>
          <Field.Root invalid={!!errors.firstName} flex="1">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Imię</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
                <LuUser size={18} />
              </Box>
              <Input placeholder="Jan" pl="40px" {...register('firstName')} />
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.firstName?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.lastName} flex="1">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Nazwisko</Field.Label>
            <Input placeholder="Kowalski" {...register('lastName')} w="full"/>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.lastName?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Field.Root invalid={!!errors.email}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Email</Field.Label>
          <Box position="relative" w="full">
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
              <LuMail size={18} />
            </Box>
            <Input type="email" placeholder="email@example.com" pl="40px" pr="44px" {...register('email')} />
            {isEmailChecked && (
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)" color={isEmailAvailable ? 'positive' : 'negative'}>
                {isEmailAvailable ? <LuCheck size={18} /> : <LuX size={18} />}
              </Box>
            )}
          </Box>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.email?.message}</Field.ErrorText>
        </Field.Root>

        <PhoneInput register={register} error={errors.phone} />

        <Field.Root invalid={!!errors.password}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Hasło</Field.Label>
          <Box position="relative" w="full">
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
              <LuLock size={18} />
            </Box>
            <Input type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 znaków" pl="40px" pr="44px" {...register('password')} />
            <Button variant="ghost" size="sm" position="absolute" right="4px" top="50%" transform="translateY(-50%)" onClick={() => setShowPassword(!showPassword)} color="contentGrey" p="8" minW="auto" h="auto" zIndex="1">
              {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </Button>
          </Box>
          <Text textStyle="labelS" color="contentGrey" mt="4">Minimum 8 znaków, wielka litera i cyfra</Text>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.password?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.confirmPassword}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Powtórz hasło</Field.Label>
          <Box position="relative" w="full" >
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
              <LuLock size={18} />
            </Box>
            <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Powtórz hasło" pl="40px" pr="44px" {...register('confirmPassword')} />
            <Button variant="ghost" size="sm" position="absolute" right="4px" top="50%" transform="translateY(-50%)" onClick={() => setShowConfirmPassword(!showConfirmPassword)} color="contentGrey" p="8" minW="auto" h="auto" zIndex="1">
              {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </Button>
          </Box>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.confirmPassword?.message}</Field.ErrorText>
        </Field.Root>

        <Button variant="solid" size="lg" w="full" mt="16" onClick={handleNext} disabled={checkEmailMutation.isPending}>
          {checkEmailMutation.isPending ? <Spinner size="sm" /> : 'Dalej'}
        </Button>
      </Stack>
    </Box>
  )
}
