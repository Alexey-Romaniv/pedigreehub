import { Input, Text, Field } from '@chakra-ui/react'
import { UseFormRegister, FieldError } from 'react-hook-form'

interface IFormInputProps {
  name: string
  label: string
  placeholder?: string
  type?: string
  register: UseFormRegister<any>
  error?: FieldError
  optional?: boolean
  hint?: string
}

export const FormInput = ({
  name,
  label,
  placeholder,
  type = 'text',
  register,
  error,
  optional,
  hint,
}: IFormInputProps) => {
  return (
    <Field.Root invalid={!!error} w="full">
      <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
        {label}
        {optional && <Text as="span" color="contentGrey" fontWeight="regular"> (opcjonalnie)</Text>}
      </Field.Label>
      <Input
        type={type}
        placeholder={placeholder}
        {...register(name)}
      />
      {hint && <Text textStyle="labelS" color="contentGrey" mt="6">{hint}</Text>}
      <Field.ErrorText textStyle="labelS" mt="4">{error?.message}</Field.ErrorText>
    </Field.Root>
  )
}
