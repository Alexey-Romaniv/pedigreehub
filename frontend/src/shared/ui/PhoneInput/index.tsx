import { Box, Input, Text, Field } from '@chakra-ui/react'
import { LuPhone } from 'react-icons/lu'
import { UseFormRegister, FieldError } from 'react-hook-form'

interface IPhoneInputProps {
  name?: string
  label?: string
  register: UseFormRegister<any>
  error?: FieldError
  optional?: boolean
}

export const PhoneInput = ({
  name = 'phone',
  label = 'Telefon',
  register,
  error,
  optional,
}: IPhoneInputProps) => {
  return (
    <Field.Root invalid={!!error} w="full">
      <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
        {label}
        {optional && <Text as="span" color="contentGrey" fontWeight="regular"> (opcjonalnie)</Text>}
      </Field.Label>
      <Box position="relative" w="full">
        <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1">
          <LuPhone size={18} />
        </Box>
        <Input type="tel" placeholder="+48 123 456 789" pl="40px" {...register(name)} />
      </Box>
      <Text textStyle="labelS" color="contentGrey" mt="6">Format: +48 XXX XXX XXX</Text>
      <Field.ErrorText textStyle="labelS" mt="4">{error?.message}</Field.ErrorText>
    </Field.Root>
  )
}
