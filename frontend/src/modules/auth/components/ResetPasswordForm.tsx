import { Box, Text, Button, Input, Stack, Field } from '@chakra-ui/react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu'
import { useResetPassword } from '../hooks'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Hasło musi mieć minimum 8 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
      .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
    confirmPassword: z.string().min(1, 'Powtórz hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { mutate, isPending, isSuccess, error } = useResetPassword()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const apiError = error?.response?.data?.error

  if (!token) {
    return (
      <Box textAlign="center">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Nieprawidłowy link</Text>
        <Text textStyle="labelL" color="contentGrey" mb="24">
          Link resetowania hasła jest niekompletny. Poproś o nowy link.
        </Text>
        <Link to="/forgot-password">
          <Button variant="solid" size="lg" w="full">Wyślij nowy link</Button>
        </Link>
      </Box>
    )
  }

  if (isSuccess) {
    return (
      <Box textAlign="center">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Hasło zmienione</Text>
        <Box bg="statusBackgroundGreen" color="statusTextGreen" p="12" borderRadius="8px" mb="24">
          <Text textStyle="labelM">Twoje hasło zostało zmienione. Możesz się teraz zalogować.</Text>
        </Box>
        <Link to="/login">
          <Button variant="solid" size="lg" w="full">Przejdź do logowania</Button>
        </Link>
      </Box>
    )
  }

  const onSubmit = (data: ResetPasswordFormData) => mutate({ token, password: data.password })

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Ustaw nowe hasło</Text>
        <Text textStyle="labelL" color="contentGrey">
          Minimum 8 znaków, jedna wielka litera i jedna cyfra
        </Text>
      </Box>

      {apiError && (
        <Box bg="statusBackgroundRed" color="statusTextRed" p="12" borderRadius="8px" mb="20">
          <Text textStyle="labelM">{apiError.message}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="20">
          <Field.Root invalid={!!errors.password} w="full">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Nowe hasło</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuLock size={18} /></Box>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Wprowadź nowe hasło" pl="40px" pr="44px" {...register('password')} />
              <Button variant="ghost" size="sm" position="absolute" right="4px" top="50%" transform="translateY(-50%)" onClick={() => setShowPassword(!showPassword)} color="contentGrey" p="8" minW="auto" h="auto">
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </Button>
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.password?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.confirmPassword} w="full">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Powtórz hasło</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey"><LuLock size={18} /></Box>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Powtórz nowe hasło" pl="40px" {...register('confirmPassword')} />
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.confirmPassword?.message}</Field.ErrorText>
          </Field.Root>

          <Button type="submit" variant="solid" size="lg" w="full" loading={isPending} mt="8">
            Zmień hasło
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
