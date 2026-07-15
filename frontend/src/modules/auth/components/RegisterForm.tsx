import { Box, Text, Button, Input, Stack, Field, Flex } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '../hooks'
import { PhoneInput } from '@/shared/ui'
import { phoneSchema } from '@/shared/validation'
import { LuEye, LuEyeOff, LuMail, LuUser, LuLock } from 'react-icons/lu'
import { useState } from 'react'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 znaki'),
  lastName: z.string().min(2, 'Minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy email'),
  phone: phoneSchema,
  password: z.string().min(8, 'Minimum 8 znaków').regex(/[A-Z]/, 'Wymagana wielka litera').regex(/[0-9]/, 'Wymagana cyfra'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterForm = () => {
  const { mutate, isPending, error } = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => mutate(data)
  const apiError = error?.response?.data?.error

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Utwórz konto</Text>
        <Text textStyle="labelL" color="contentGrey">Dołącz do społeczności hodowców</Text>
      </Box>

      {apiError && (
        <Box bg="statusBackgroundRed" color="statusTextRed" p="12" borderRadius="8px" mb="20">
          <Text textStyle="labelM">{apiError.message}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="20">
          <Flex gap="16" w="full">
            <Field.Root invalid={!!errors.firstName} flex="1">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Imię</Field.Label>
              <Box position="relative" w="full">
                <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuUser size={18} /></Box>
                <Input placeholder="Jan" pl="40px" {...register('firstName')} />
              </Box>
              <Field.ErrorText textStyle="labelS" mt="4">{errors.firstName?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.lastName} flex="1">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Nazwisko</Field.Label>
              <Box position="relative" w="full">
                <Input placeholder="Kowalski" {...register('lastName')} />
              </Box>
              <Field.ErrorText textStyle="labelS" mt="4">{errors.lastName?.message}</Field.ErrorText>
            </Field.Root>
          </Flex>

          <Field.Root invalid={!!errors.email} w="full">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Email</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuMail size={18} /></Box>
              <Input type="email" placeholder="email@example.com" pl="40px" {...register('email')} />
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.email?.message}</Field.ErrorText>
          </Field.Root>

          <PhoneInput register={register} error={errors.phone} />

          <Field.Root invalid={!!errors.password} w="full">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Hasło</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuLock size={18} /></Box>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 znaków" pl="40px" pr="44px" {...register('password')} />
              <Button variant="ghost" size="sm" position="absolute" right="4px" top="50%" transform="translateY(-50%)" onClick={() => setShowPassword(!showPassword)} color="contentGrey" p="8" minW="auto" h="auto">
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </Button>
            </Box>
            <Text textStyle="labelS" color="contentGrey" mt="6">Minimum 8 znaków, wielka litera i cyfra</Text>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.password?.message}</Field.ErrorText>
          </Field.Root>

          <Button type="submit" variant="solid" size="lg" w="full" loading={isPending} mt="8">Zarejestruj się</Button>

          <Box position="relative" py="8">
            <Box position="absolute" top="50%" left="0" right="0" h="1px" bg="linePrimary" />
            <Text textStyle="labelS" position="relative" textAlign="center" color="contentGrey" bg="backgroundPrimary" px="12" mx="auto" w="fit-content">lub</Text>
          </Box>

          <Button variant="outline" size="lg" w="full" asChild>
            <Link to="/register/breeder">Rejestracja jako hodowca</Link>
          </Button>

          <Text textStyle="labelM" textAlign="center" color="contentGrey" mt="8">
            Masz już konto?{' '}
            <Link to="/login"><Text as="span" color="contentBlack01" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>Zaloguj się</Text></Link>
          </Text>
        </Stack>
      </form>
    </Box>
  )
}
