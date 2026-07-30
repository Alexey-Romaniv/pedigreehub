import { Box, Textarea, Stack, Field, Flex, Text, Button, Input } from '@chakra-ui/react'
import { UseFormReturn } from 'react-hook-form'
import { useState } from 'react'
import { LuArrowLeft, LuX, LuPlus } from 'react-icons/lu'
import type { CreateListingFormData } from '../types'
import { PhotoUpload } from './PhotoUpload'
import { toaster } from '@/shared/theme/toaster'

interface Step4Props {
  form: UseFormReturn<CreateListingFormData>
  onNext: () => void
  onBack: () => void
  /** Уже сохранённые фото (режим редактирования) */
  existingPhotos?: string[]
  onRemoveExistingPhoto?: (url: string) => void
}

export const Step4PhotosDescription = ({
  form,
  onNext,
  onBack,
  existingPhotos = [],
  onRemoveExistingPhoto,
}: Step4Props) => {
  const { register, formState: { errors }, watch, setValue, trigger, setError, clearErrors } = form
  
  const photos = watch('photos') || []
  const videos = watch('videos') || []
  const description = watch('description') || ''
  const [newVideoUrl, setNewVideoUrl] = useState('')

  const isAllowedVideoUrl = (raw: string): boolean => {
    try {
      const host = new URL(raw).hostname.replace(/^www\./, '')
      return ['youtube.com', 'youtu.be', 'vimeo.com'].some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`)
      )
    } catch {
      return false
    }
  }

  const addVideo = () => {
    const url = newVideoUrl.trim()
    if (!url || videos.length >= 3) return
    if (!isAllowedVideoUrl(url)) {
      toaster.error({
        title: 'Nieprawidłowy link',
        description: 'Obsługiwane są tylko linki YouTube i Vimeo',
      })
      return
    }
    setValue('videos', [...videos, url], { shouldValidate: true })
    setNewVideoUrl('')
  }

  const removeVideo = (index: number) => {
    setValue('videos', videos.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleNext = async () => {
    const isValid = await trigger(['photos', 'description'])
    // Минимум 3 фото считаем вместе с уже сохранёнными (режим редактирования)
    if (photos.length + existingPhotos.length < 3) {
      setError('photos', { message: 'Minimum 3 zdjęcia' })
      return
    }
    if (isValid) {
      onNext()
    }
  }

  return (
    <Box>
      <Stack gap="32">
        <Box>
          <Flex align="center" gap="12" mb="24">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">Zdjęcia i opis</Text>
          </Flex>
        </Box>
        <Field.Root invalid={!!errors.photos} w="full">
          <PhotoUpload
            photos={photos}
            onPhotosChange={(newPhotos) => {
              clearErrors('photos')
              setValue('photos', newPhotos, { shouldValidate: true })
            }}
            minPhotos={3}
            maxPhotos={10}
            existingPhotos={existingPhotos}
            onRemoveExisting={(url) => {
              clearErrors('photos')
              onRemoveExistingPhoto?.(url)
            }}
          />
          <Field.ErrorText textStyle="labelS" mt="4">
            {errors.photos?.message as string}
          </Field.ErrorText>
        </Field.Root>

        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
            Wideo <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
          </Text>
          <Text textStyle="labelS" color="contentGrey" mb="8">
            Dodaj linki do filmów na YouTube lub Vimeo (maksymalnie 3)
          </Text>
          <Flex gap="8" mb="12">
            <Input 
              placeholder="https://www.youtube.com/watch?v=..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addVideo() } }}
              disabled={videos.length >= 3}
            />
            <Button onClick={addVideo} disabled={videos.length >= 3 || !newVideoUrl.trim()}>
              <LuPlus /> Dodaj
            </Button>
          </Flex>
          {videos.length > 0 && (
            <Stack gap="8">
              {videos.map((video, index) => (
                <Box
                  key={index}
                  border="1px solid"
                  borderColor="linePrimary"
                  borderRadius="8px"
                  p="12"
                  bg="backgroundGrey"
                >
                  <Flex gap="12" align="center">
                    <Box flex="1" minW="0">
                      <Text textStyle="labelS" color="contentBlack01" truncate>
                        {video}
                      </Text>
                    </Box>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      colorPalette="red"
                      onClick={() => removeVideo(index)}
                    >
                      <LuX size={14} /> Usuń
                    </Button>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Field.Root invalid={!!errors.description} w="full">
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
            Opis
          </Field.Label>
          <Textarea 
            placeholder="Opisz szczenię: charakter, cechy, zdrowie, warunki utrzymania..."
            rows={8}
            {...register('description')}
            onBlur={() => trigger('description')}
          />
          <Flex justify="space-between" mt="6">
            <Field.ErrorText textStyle="labelS">{errors.description?.message}</Field.ErrorText>
            <Text textStyle="labelS" color={errors.description ? 'statusTextRed' : 'contentGrey'}>
              {description.length}/5000 znaków (minimum 100)
            </Text>
          </Flex>
        </Field.Root>

        <Flex justify="space-between" mt="40" pt="32" borderTop="2px solid" borderColor="linePrimary">
          <Button variant="outline" size="lg" onClick={onBack} minW="160px">
            <LuArrowLeft /> Wstecz
          </Button>
          <Button variant="solid" size="lg" onClick={handleNext} minW="160px">
            Podgląd
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}

