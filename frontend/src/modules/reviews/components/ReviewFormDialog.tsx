import { useState } from 'react'
import { Button, Dialog, Field, Portal, Text, Textarea } from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { StarRating } from './StarRating'
import { useCreateReview } from '../hooks'

const reviewFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, 'Opinia musi mieć minimum 10 znaków')
    .max(2000, 'Opinia może mieć maksymalnie 2000 znaków'),
})

type ReviewFormData = z.infer<typeof reviewFormSchema>

interface ReviewFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  breederId: string
  breederName?: string
}

export const ReviewFormDialog = ({
  open,
  onOpenChange,
  breederId,
  breederName,
}: ReviewFormDialogProps) => {
  const [rating, setRating] = useState(5)
  const createReview = useCreateReview()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { text: '' },
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      setRating(5)
    }
    onOpenChange(isOpen)
  }

  const onSubmit = handleSubmit((data) => {
    createReview.mutate(
      { breederId, rating, text: data.text },
      {
        onSuccess: () => handleOpenChange(false),
      }
    )
  })

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
                  Wystaw opinię
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p="0" mb="24">
              {breederName && (
                <Text textStyle="labelS" color="contentGrey" mb="16">
                  Hodowca: {breederName}
                </Text>
              )}
              <form id="review-form" onSubmit={onSubmit}>
                <Field.Root w="full" mb="16">
                  <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                    Ocena
                  </Field.Label>
                  <StarRating value={rating} size={28} onChange={setRating} />
                </Field.Root>
                <Field.Root invalid={!!errors.text} w="full">
                  <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                    Twoja opinia
                  </Field.Label>
                  <Textarea
                    placeholder="Opisz swoje doświadczenie z hodowcą..."
                    rows={5}
                    {...register('text')}
                  />
                  {errors.text && (
                    <Field.ErrorText textStyle="labelS">{errors.text.message}</Field.ErrorText>
                  )}
                </Field.Root>
              </form>
            </Dialog.Body>
            <Dialog.Footer p="0" display="flex" justifyContent="flex-end" gap="8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={createReview.isPending}
              >
                Anuluj
              </Button>
              <Button
                variant="solid"
                size="sm"
                type="submit"
                form="review-form"
                loading={createReview.isPending}
              >
                Wyślij opinię
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
