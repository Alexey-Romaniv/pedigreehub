import { useState } from 'react'
import { Box, Button, Field, Input, Stack } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu'
import { useChangePassword } from '../hooks'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Wprowadź aktualne hasło'),
    newPassword: z
      .string()
      .min(8, 'Hasło musi mieć minimum 8 znaków')
      .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
      .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
    confirmPassword: z.string().min(1, 'Powtórz nowe hasło'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Nowe hasło musi różnić się od aktualnego',
    path: ['newPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

interface PasswordFieldProps {
  label: string
  placeholder: string
  error?: string
  visible: boolean
  onToggleVisible?: () => void
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordFormValues>>['register']>
}

const PasswordField = ({
  label,
  placeholder,
  error,
  visible,
  onToggleVisible,
  registration,
}: PasswordFieldProps) => (
  <Field.Root invalid={!!error} w="full">
    <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
      {label}
    </Field.Label>
    <Box position="relative" w="full">
      <Box
        position="absolute"
        left="12px"
        top="50%"
        transform="translateY(-50%)"
        color="contentGrey"
        zIndex="1"
      >
        <LuLock size={18} />
      </Box>
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        pl="40px"
        pr={onToggleVisible ? '44px' : undefined}
        autoComplete={label === 'Aktualne hasło' ? 'current-password' : 'new-password'}
        {...registration}
      />
      {onToggleVisible && (
        <Button
          variant="ghost"
          size="sm"
          position="absolute"
          right="4px"
          top="50%"
          transform="translateY(-50%)"
          onClick={onToggleVisible}
          color="contentGrey"
          p="8"
          minW="auto"
          h="auto"
          aria-label={visible ? 'Ukryj hasło' : 'Pokaż hasło'}
        >
          {visible ? <LuEyeOff size={18} /> : <LuEye size={18} />}
        </Button>
      )}
    </Box>
    <Field.ErrorText textStyle="labelS" mt="4">
      {error}
    </Field.ErrorText>
  </Field.Root>
)

export const ChangePasswordForm = () => {
  const { mutate, isPending } = useChangePassword()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (values: ChangePasswordFormValues) =>
    mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => reset() }
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="20" maxW="480px">
        <PasswordField
          label="Aktualne hasło"
          placeholder="Wprowadź aktualne hasło"
          error={errors.currentPassword?.message}
          visible={showPassword}
          registration={register('currentPassword')}
        />

        <PasswordField
          label="Nowe hasło"
          placeholder="Minimum 8 znaków, wielka litera i cyfra"
          error={errors.newPassword?.message}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((prev) => !prev)}
          registration={register('newPassword')}
        />

        <PasswordField
          label="Powtórz nowe hasło"
          placeholder="Powtórz nowe hasło"
          error={errors.confirmPassword?.message}
          visible={showPassword}
          registration={register('confirmPassword')}
        />

        <Button type="submit" variant="solid" alignSelf="start" loading={isPending}>
          Zmień hasło
        </Button>
      </Stack>
    </form>
  )
}
