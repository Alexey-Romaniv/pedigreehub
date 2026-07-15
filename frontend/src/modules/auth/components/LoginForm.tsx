import { Box, Text, Button, Input, Stack, Field, Flex } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks'
import { LuEye, LuEyeOff, LuMail, LuLock } from 'react-icons/lu'
import { useState } from 'react'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(1, 'Wprowadź hasło'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm = () => {
  const location = useLocation()
  const { mutate, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => mutate(data)
  const apiError = error?.response?.data?.error
  const justRegistered = location.state?.registered

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Witamy z powrotem!</Text>
        <Text textStyle="labelL" color="contentGrey">Zaloguj się do swojego konta</Text>
      </Box>

      {justRegistered && (
        <Box bg="statusBackgroundGreen" color="statusTextGreen" p="12" borderRadius="8px" mb="20">
          <Text textStyle="labelM">Rejestracja zakończona! Teraz zaloguj się do konta.</Text>
        </Box>
      )}

      {apiError && (
        <Box bg="statusBackgroundRed" color="statusTextRed" p="12" borderRadius="8px" mb="20">
          <Text textStyle="labelM">{apiError.message}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="20">
          <Field.Root invalid={!!errors.email} w="full">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Email</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuMail size={18} /></Box>
              <Input type="email" placeholder="email@example.com" pl="40px" {...register('email')} />
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.email?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.password} w="full">
            <Flex justify="space-between" align="center" mb="6" w="full">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" m="0">Hasło</Field.Label>
              <Link to="/forgot-password">
                <Text textStyle="labelS" color="contentGrey" _hover={{ color: 'contentBlack01' }}>Zapomniałeś hasła?</Text>
              </Link>
            </Flex>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuLock size={18} /></Box>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Wprowadź hasło" pl="40px" pr="44px" {...register('password')} />
              <Button variant="ghost" size="sm" position="absolute" right="4px" top="50%" transform="translateY(-50%)" onClick={() => setShowPassword(!showPassword)} color="contentGrey" p="8" minW="auto" h="auto">
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </Button>
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.password?.message}</Field.ErrorText>
          </Field.Root>

          <Button type="submit" variant="solid" size="lg" w="full" loading={isPending} mt="8">Zaloguj się</Button>

          <Text textStyle="labelM" textAlign="center" color="contentGrey" mt="16">
            Nie masz konta?{' '}
            <Link to="/register"><Text as="span" color="contentBlack01" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>Zarejestruj się</Text></Link>
          </Text>
        </Stack>
      </form>
    </Box>
  )
}
