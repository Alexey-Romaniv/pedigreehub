import { Box, Text, Button, Input, Stack, Field } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LuMail, LuArrowLeft } from 'react-icons/lu'
import { useForgotPassword } from '../hooks'

const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy email'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const ForgotPasswordForm = () => {
  const { mutate, isPending, isSuccess, error } = useForgotPassword()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormData) => mutate(data)
  const apiError = error?.response?.data?.error

  if (isSuccess) {
    return (
      <Box>
        <Box textAlign="center" mb="24">
          <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Sprawdź skrzynkę</Text>
          <Text textStyle="labelL" color="contentGrey">
            Jeśli konto <Text as="span" color="contentBlack01" fontWeight="semibold">{getValues('email')}</Text> istnieje,
            wysłaliśmy na nie link do resetowania hasła.
          </Text>
        </Box>
        <Box bg="statusBackgroundGreen" color="statusTextGreen" p="12" borderRadius="8px" mb="20">
          <Text textStyle="labelM">Link jest ważny przez 1 godzinę. Sprawdź też folder spam.</Text>
        </Box>
        <Link to="/login">
          <Button variant="outline" size="lg" w="full">
            <LuArrowLeft size={18} /> Wróć do logowania
          </Button>
        </Link>
      </Box>
    )
  }

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="displayXLBold" color="contentBlack01" mb="8">Odzyskiwanie hasła</Text>
        <Text textStyle="labelL" color="contentGrey">
          Podaj email, na który wyślemy link do resetowania hasła
        </Text>
      </Box>

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

          <Button type="submit" variant="solid" size="lg" w="full" loading={isPending} mt="8">
            Wyślij link
          </Button>

          <Text textStyle="labelM" textAlign="center" color="contentGrey" mt="16">
            Pamiętasz hasło?{' '}
            <Link to="/login"><Text as="span" color="contentBlack01" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>Zaloguj się</Text></Link>
          </Text>
        </Stack>
      </form>
    </Box>
  )
}
