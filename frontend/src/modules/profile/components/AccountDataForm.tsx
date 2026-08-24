import { Badge, Box, Button, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormInput, PhoneInput } from '@/shared/ui'
import { phoneSchema } from '@/shared/validation'
import { useResendVerification, useUpdateProfile } from '../hooks'
import type { AccountProfile } from '../api'

const accountDataSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki').max(50),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki').max(50),
  phone: phoneSchema,
})

type AccountDataFormValues = z.infer<typeof accountDataSchema>

interface AccountDataFormProps {
  profile: AccountProfile
}

export const AccountDataForm = ({ profile }: AccountDataFormProps) => {
  const { mutate, isPending } = useUpdateProfile()
  const { mutate: resendVerification, isPending: isResending } = useResendVerification()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountDataFormValues>({
    resolver: zodResolver(accountDataSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    },
  })

  const onSubmit = (values: AccountDataFormValues) =>
    mutate(values, {
      // Бэкенд нормализует телефон (+48XXXXXXXXX) — показываем сохранённую версию и гасим кнопку
      onSuccess: (saved) =>
        reset({
          firstName: saved.firstName,
          lastName: saved.lastName,
          phone: saved.phone,
        }),
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="20">
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="20">
          <FormInput
            name="firstName"
            label="Imię"
            placeholder="Jan"
            register={register}
            error={errors.firstName}
          />
          <FormInput
            name="lastName"
            label="Nazwisko"
            placeholder="Kowalski"
            register={register}
            error={errors.lastName}
          />
        </SimpleGrid>

        <PhoneInput register={register} error={errors.phone} />

        {/* E-mail не меняем — он нужен для входа и верификации */}
        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
            Adres e-mail
          </Text>
          <Flex
            align="center"
            justify="space-between"
            gap="12"
            bg="backgroundGrey"
            borderRadius="8px"
            px="16"
            py="12"
            wrap="wrap"
          >
            <Text textStyle="labelM" color="contentBlack01">
              {profile.email}
            </Text>
            <Flex align="center" gap="12">
              <Badge colorPalette={profile.isEmailVerified ? 'green' : 'gray'}>
                {profile.isEmailVerified ? 'Potwierdzony' : 'Niepotwierdzony'}
              </Badge>
              {/* type="button" — иначе кнопка сабмитит форму данных аккаунта */}
              {!profile.isEmailVerified && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isResending}
                  onClick={() => resendVerification()}
                >
                  Wyślij ponownie
                </Button>
              )}
            </Flex>
          </Flex>
          <Text textStyle="labelS" color="contentGrey" mt="6">
            {profile.isEmailVerified
              ? 'E-mail służy do logowania i nie może zostać zmieniony'
              : 'E-mail służy do logowania i nie może zostać zmieniony. Link weryfikacyjny jest ważny 24 godziny'}
          </Text>
        </Box>

        <Button
          type="submit"
          variant="solid"
          alignSelf="start"
          loading={isPending}
          disabled={!isDirty}
        >
          Zapisz zmiany
        </Button>
      </Stack>
    </form>
  )
}
