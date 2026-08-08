import { Button, Dialog, Field, Portal, Text, Textarea } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInput } from '@/shared/ui'
import { normalizePhone } from '@/shared/validation'
import { useCreateInquiry } from '../hooks'

const inquiryFormSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Wiadomość musi mieć minimum 10 znaków')
    .max(2000, 'Wiadomość może mieć maksymalnie 2000 znaków'),
  contactPhone: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^(\+?48)?\d{9}$/.test(value.replace(/[\s-]/g, '')),
      { message: 'Numer musi być w formacie +48 XXX XXX XXX' }
    ),
})

type InquiryFormData = z.infer<typeof inquiryFormSchema>

interface InquiryFormDialogProps {
  listingId: string
  listingTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const InquiryFormDialog = ({
  listingId,
  listingTitle,
  open,
  onOpenChange,
}: InquiryFormDialogProps) => {
  const createInquiry = useCreateInquiry()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { message: '', contactPhone: '' },
  })

  const onSubmit = handleSubmit((data) => {
    createInquiry.mutate(
      {
        listingId,
        message: data.message,
        contactPhone: data.contactPhone ? normalizePhone(data.contactPhone) : undefined,
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      }
    )
  })

  // При закрытии без отправки чистим форму — иначе при повторном открытии
  // висят старые ошибки валидации и текст
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => handleOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="backgroundPrimary"
            borderRadius="16px"
            p="24"
            maxW="480px"
            w="full"
            mx="16"
          >
            <Dialog.Header p="0" mb="8">
              <Dialog.Title>
                <Text textStyle="titleSBold" color="contentBlack01">
                  Zapytaj o szczeniaka
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p="0" mb="24">
              <Text textStyle="labelS" color="contentGrey" mb="16">
                {listingTitle}
              </Text>
              <form id="inquiry-form" onSubmit={onSubmit}>
                <Field.Root invalid={!!errors.message} w="full" mb="16">
                  <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                    Wiadomość do hodowcy
                  </Field.Label>
                  <Textarea
                    placeholder="Dzień dobry! Jestem zainteresowany(a) tym szczeniakiem..."
                    rows={5}
                    {...register('message')}
                  />
                  <Field.ErrorText textStyle="labelS" mt="4">
                    {errors.message?.message}
                  </Field.ErrorText>
                </Field.Root>
                <PhoneInput
                  name="contactPhone"
                  label="Telefon kontaktowy"
                  register={register}
                  error={errors.contactPhone}
                  optional
                />
              </form>
            </Dialog.Body>
            <Dialog.Footer p="0" display="flex" justifyContent="flex-end" gap="8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={createInquiry.isPending}
              >
                Anuluj
              </Button>
              <Button
                variant="solid"
                size="sm"
                type="submit"
                form="inquiry-form"
                loading={createInquiry.isPending}
              >
                Wyślij zapytanie
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
