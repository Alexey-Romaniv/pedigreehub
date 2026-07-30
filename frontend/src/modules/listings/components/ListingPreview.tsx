import { Box, Stack, Text, Button, Flex, Badge, SimpleGrid } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { LuArrowLeft, LuSave, LuSend } from 'react-icons/lu'
import type { CreateListingFormData } from '../types'
import { useBreeds } from '../hooks'

const PhotoPreview = ({ photo, isMain }: { photo: File | string; isMain: boolean }) => {
  const [preview, setPreview] = useState<string | null>(
    typeof photo === 'string' ? photo : null
  )

  useEffect(() => {
    if (typeof photo === 'string') {
      setPreview(photo)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(photo)
  }, [photo])

  return (
    <Box
      position="relative"
      w="full"
      aspectRatio="1"
      borderRadius="8px"
      overflow="hidden"
      border="1px solid"
      borderColor="linePrimary"
      bg="backgroundGrey"
    >
      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {isMain && (
        <Badge 
          position="absolute" 
          top="8" 
          left="8" 
          colorPalette="blue" 
          size="sm"
        >
          Główne
        </Badge>
      )}
    </Box>
  )
}

interface ListingPreviewProps {
  formData: CreateListingFormData
  onBack: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  isSubmitting: boolean
  /** Уже сохранённые фото (URL) в режиме редактирования */
  existingPhotos?: string[]
  saveLabel?: string
  submitLabel?: string
}

export const ListingPreview = ({
  formData,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  existingPhotos = [],
  saveLabel = 'Zapisz jako szkic',
  submitLabel = 'Wyślij do moderacji',
}: ListingPreviewProps) => {
  // Сохранённые фото первые — «Główne» соответствует порядку на сервере
  const photos: (File | string)[] = [...existingPhotos, ...(formData.photos || [])]
  const { data: breedsData } = useBreeds()
  const breedName =
    breedsData?.find((b) => b._id === formData.breed)?.name ?? formData.breed

  return (
    <Box>
      <Stack gap="24">
        <Text textStyle="titleXLBold" color="contentBlack01">Podgląd ogłoszenia</Text>

        {/* Галерея фотографий */}
        {photos.length > 0 && (
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Zdjęcia</Text>
            <SimpleGrid columns={{ base: 2, md: 3 }} gap="12">
              {photos.slice(0, 6).map((photo, index) => (
                <PhotoPreview key={index} photo={photo} isMain={index === 0} />
              ))}
            </SimpleGrid>
            {photos.length > 6 && (
              <Text textStyle="labelS" color="contentGrey" mt="8">
                +{photos.length - 6} więcej zdjęć
              </Text>
            )}
          </Box>
        )}

        {/* Основная информация */}
        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Podstawowe informacje</Text>
          <Stack gap="12">
            <Flex justify="space-between">
              <Text textStyle="labelM" color="contentGrey">Tytuł:</Text>
              <Text textStyle="labelMBold" color="contentBlack01">{formData.title}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text textStyle="labelM" color="contentGrey">Rasa:</Text>
              <Text textStyle="labelMBold" color="contentBlack01">{breedName}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text textStyle="labelM" color="contentGrey">Płeć:</Text>
              <Text textStyle="labelMBold" color="contentBlack01">
                {formData.gender === 'male' ? 'Samiec' : 'Samica'}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text textStyle="labelM" color="contentGrey">Umaszczenie:</Text>
              <Text textStyle="labelMBold" color="contentBlack01">{formData.color}</Text>
            </Flex>
            {formData.puppyName && (
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Imię:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">{formData.puppyName}</Text>
              </Flex>
            )}
            <Flex justify="space-between">
              <Text textStyle="labelM" color="contentGrey">Cena:</Text>
              <Text textStyle="labelMBold" color="contentBlack01">
                {formData.price} PLN
              </Text>
            </Flex>
          </Stack>
        </Box>

        {/* Информация о родителях */}
        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Rodzice</Text>
          <Stack gap="16">
            <Box>
              <Text textStyle="labelMBold" color="contentBlack01" mb="8">Ojciec</Text>
              <Stack gap="8">
                <Text textStyle="labelM" color="contentBlack01">{formData.father.name}</Text>
                {formData.father.pedigreeNumber && (
                  <Text textStyle="labelS" color="contentGrey">
                    Rodowód: {formData.father.pedigreeNumber}
                  </Text>
                )}
                {formData.father.titles.length > 0 && (
                  <Flex gap="8" flexWrap="wrap">
                    {formData.father.titles.map((title, index) => (
                      <Badge key={index} colorPalette="blue" size="sm">{title}</Badge>
                    ))}
                  </Flex>
                )}
              </Stack>
            </Box>
            <Box>
              <Text textStyle="labelMBold" color="contentBlack01" mb="8">Matka</Text>
              <Stack gap="8">
                <Text textStyle="labelM" color="contentBlack01">{formData.mother.name}</Text>
                {formData.mother.pedigreeNumber && (
                  <Text textStyle="labelS" color="contentGrey">
                    Rodowód: {formData.mother.pedigreeNumber}
                  </Text>
                )}
                {formData.mother.titles.length > 0 && (
                  <Flex gap="8" flexWrap="wrap">
                    {formData.mother.titles.map((title, index) => (
                      <Badge key={index} colorPalette="blue" size="sm">{title}</Badge>
                    ))}
                  </Flex>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Документы */}
        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Dokumenty</Text>
          <Stack gap="8">
            <Flex align="center" gap="8">
              <Text textStyle="labelM" color="contentBlack01">Mikroczip:</Text>
              <Badge colorPalette="green" size="sm">✓ {formData.microchipNumber.length >= 3 ? formData.microchipNumber.slice(-3) : '***'}</Badge>
            </Flex>
            {formData.hasPedigree && (
              <Flex align="center" gap="8">
                <Text textStyle="labelM" color="contentBlack01">Rodowód:</Text>
                <Badge colorPalette="green" size="sm">✓ Załączony</Badge>
              </Flex>
            )}
            {formData.hasVetPassport && (
              <Flex align="center" gap="8">
                <Text textStyle="labelM" color="contentBlack01">Paszport weterynaryjny:</Text>
                <Badge colorPalette="green" size="sm">✓ Załączony</Badge>
              </Flex>
            )}
            {formData.hasMetric && (
              <Flex align="center" gap="8">
                <Text textStyle="labelM" color="contentBlack01">Metryka:</Text>
                <Badge colorPalette="green" size="sm">✓ Załączony</Badge>
              </Flex>
            )}
          </Stack>
        </Box>

        {/* Описание */}
        <Box>
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Opis</Text>
          <Text textStyle="labelM" color="contentBlack01" whiteSpace="pre-wrap">
            {formData.description}
          </Text>
        </Box>

        {/* Видео */}
        {formData.videos && formData.videos.length > 0 && (
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">Wideo</Text>
            <Stack gap="8">
              {formData.videos.map((video, index) => (
                <Text key={index} textStyle="labelM" color="contentGrey" truncate>
                  {video}
                </Text>
              ))}
            </Stack>
          </Box>
        )}

        {/* Кнопки */}
        <Flex justify="space-between" mt="24" gap="16">
          <Button variant="outline" size="lg" onClick={onBack}>
            <LuArrowLeft style={{ marginRight: '8px' }} /> Wstecz do edycji
          </Button>
          <Flex gap="12">
            <Button
              variant="outline"
              size="lg"
              onClick={onSaveDraft}
              disabled={isSubmitting}
            >
              <LuSave style={{ marginRight: '8px' }} /> {saveLabel}
            </Button>
            <Button
              variant="solid"
              size="lg"
              onClick={onSubmit}
              loading={isSubmitting}
            >
              <LuSend style={{ marginRight: '8px' }} /> {submitLabel}
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Box>
  )
}

