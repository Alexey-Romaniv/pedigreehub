import { Box, Input, Stack, Field, Flex, Text, Button } from '@chakra-ui/react'
import { UseFormReturn } from 'react-hook-form'
import { LuArrowLeft, LuArrowRight, LuX, LuPlus, LuImage } from 'react-icons/lu'
import { useRef, useState, useMemo, useEffect } from 'react'
import type { CreateListingFormData } from '../types'
import { toaster } from '@/shared/theme/toaster'

interface Step2Props {
  form: UseFormReturn<CreateListingFormData>
  onNext: () => void
  onBack: () => void
  /** URL текущих фото родителей (режим редактирования): новый файл заменяет */
  existingPhotos?: { father?: string; mother?: string }
}

export const Step2Parents = ({ form, onNext, onBack, existingPhotos }: Step2Props) => {
  const { register, formState: { errors }, watch, setValue, trigger } = form
  const fatherInputRef = useRef<HTMLInputElement>(null)
  const motherInputRef = useRef<HTMLInputElement>(null)
  
  const fatherTitles = watch('father.titles') || []
  const fatherPhoto = watch('father.photo')
  const motherTitles = watch('mother.titles') || []
  const motherPhoto = watch('mother.photo')
  
  const [newFatherTitle, setNewFatherTitle] = useState('')
  const [newMotherTitle, setNewMotherTitle] = useState('')

  // Превью строятся из файла в форме — не теряются при переходах между шагами
  const fatherPhotoPreview = useMemo(
    () => (fatherPhoto ? URL.createObjectURL(fatherPhoto) : null),
    [fatherPhoto]
  )
  const motherPhotoPreview = useMemo(
    () => (motherPhoto ? URL.createObjectURL(motherPhoto) : null),
    [motherPhoto]
  )
  useEffect(() => () => {
    if (fatherPhotoPreview) URL.revokeObjectURL(fatherPhotoPreview)
  }, [fatherPhotoPreview])
  useEffect(() => () => {
    if (motherPhotoPreview) URL.revokeObjectURL(motherPhotoPreview)
  }, [motherPhotoPreview])

  const validatePhoto = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toaster.error({ title: 'Nieprawidłowy format', description: 'Dozwolone: JPG, PNG, WebP' })
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toaster.error({ title: 'Plik za duży', description: 'Maksymalny rozmiar: 5MB' })
      return false
    }
    return true
  }

  const handleFatherPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validatePhoto(file)) {
      setValue('father.photo', file, { shouldValidate: true })
    }
    e.target.value = ''
  }

  const handleMotherPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validatePhoto(file)) {
      setValue('mother.photo', file, { shouldValidate: true })
    }
    e.target.value = ''
  }

  const addFatherTitle = () => {
    if (newFatherTitle.trim()) {
      setValue('father.titles', [...fatherTitles, newFatherTitle.trim()], { shouldValidate: true })
      setNewFatherTitle('')
    }
  }

  const removeFatherTitle = (index: number) => {
    setValue('father.titles', fatherTitles.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const addMotherTitle = () => {
    if (newMotherTitle.trim()) {
      setValue('mother.titles', [...motherTitles, newMotherTitle.trim()], { shouldValidate: true })
      setNewMotherTitle('')
    }
  }

  const removeMotherTitle = (index: number) => {
    setValue('mother.titles', motherTitles.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleNext = async () => {
    const isValid = await trigger(['father.name', 'mother.name'])
    if (isValid) {
      onNext()
    }
  }

  return (
    <Box>
      <Stack gap="24">
        {/* Отец */}
        <Box>
          <Flex align="center" gap="12" mb="20">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">Ojciec</Text>
          </Flex>
          <Stack gap="16">
            <Field.Root invalid={!!errors.father?.name} w="full">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Imię ojca
              </Field.Label>
              <Input 
                placeholder="np. Champion Max"
                {...register('father.name')}
                onBlur={() => trigger('father.name')}
              />
              <Field.ErrorText textStyle="labelS" mt="4">{errors.father?.name?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root w="full">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Numer rodowodu <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Field.Label>
              <Input 
                placeholder="np. PL12345/2023"
                {...register('father.pedigreeNumber')}
              />
            </Field.Root>

            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Tytuły <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Text>
              <Flex gap="8" mb="8">
                <Input 
                  placeholder="np. Champion Polski"
                  value={newFatherTitle}
                  onChange={(e) => setNewFatherTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addFatherTitle() } }}
                />
                <Button onClick={addFatherTitle}><LuPlus /> Dodaj</Button>
              </Flex>
              {fatherTitles.length > 0 && (
                <Flex gap="8" flexWrap="wrap">
                  {fatherTitles.map((title, index) => (
                    <Flex
                      key={index}
                      align="center"
                      gap="6"
                      px="12"
                      py="4"
                      border="1px solid"
                      borderColor="linePrimary"
                      borderRadius="full"
                    >
                      <Text textStyle="labelS" color="contentBlack01">{title}</Text>
                      <Button
                        variant="ghost"
                        size="xs"
                        h="auto"
                        minW="auto"
                        p="2"
                        onClick={() => removeFatherTitle(index)}
                        aria-label="Usuń tytuł"
                      >
                        <LuX size={12} />
                      </Button>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Box>

            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Zdjęcie ojca <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Text>
              <Box
                border="2px dashed"
                borderColor="linePrimary"
                borderRadius="12px"
                p="16"
                cursor="pointer"
                onClick={() => fatherInputRef.current?.click()}
                _hover={{ borderColor: 'lineSecondary', bg: 'backgroundGrey' }}
                transition="all 0.2s"
              >
                <input 
                  ref={fatherInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleFatherPhoto}
                  style={{ display: 'none' }} 
                />
                <Flex gap="12" align="center">
                  <Box color="contentGrey" display="inline-flex"><LuImage size={24} /></Box>
                  <Text textStyle="labelM" color="contentGrey">
                    {fatherPhoto
                      ? fatherPhoto.name
                      : existingPhotos?.father
                      ? 'Aktualne zdjęcie zapisane — kliknij, aby je zastąpić'
                      : 'Kliknij, aby wybrać zdjęcie (JPG, PNG, WebP, max. 5MB)'}
                  </Text>
                </Flex>
              </Box>
              {(fatherPhotoPreview || existingPhotos?.father) && (
                <Box mt="12" w="200px" h="200px" borderRadius="8px" overflow="hidden" border="1px solid" borderColor="linePrimary">
                  <img
                    src={fatherPhotoPreview ?? existingPhotos?.father}
                    alt="Zdjęcie ojca"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Мать */}
        <Box>
          <Flex align="center" gap="12" mb="20">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">Matka</Text>
          </Flex>
          <Stack gap="16">
            <Field.Root invalid={!!errors.mother?.name} w="full">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Imię matki
              </Field.Label>
              <Input 
                placeholder="np. Champion Bella"
                {...register('mother.name')}
                onBlur={() => trigger('mother.name')}
              />
              <Field.ErrorText textStyle="labelS" mt="4">{errors.mother?.name?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root w="full">
              <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Numer rodowodu <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Field.Label>
              <Input 
                placeholder="np. PL12345/2023"
                {...register('mother.pedigreeNumber')}
              />
            </Field.Root>

            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Tytuły <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Text>
              <Flex gap="8" mb="8">
                <Input 
                  placeholder="np. Champion Polski"
                  value={newMotherTitle}
                  onChange={(e) => setNewMotherTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addMotherTitle() } }}
                />
                <Button onClick={addMotherTitle}><LuPlus /> Dodaj</Button>
              </Flex>
              {motherTitles.length > 0 && (
                <Flex gap="8" flexWrap="wrap">
                  {motherTitles.map((title, index) => (
                    <Flex
                      key={index}
                      align="center"
                      gap="6"
                      px="12"
                      py="4"
                      border="1px solid"
                      borderColor="linePrimary"
                      borderRadius="full"
                    >
                      <Text textStyle="labelS" color="contentBlack01">{title}</Text>
                      <Button
                        variant="ghost"
                        size="xs"
                        h="auto"
                        minW="auto"
                        p="2"
                        onClick={() => removeMotherTitle(index)}
                        aria-label="Usuń tytuł"
                      >
                        <LuX size={12} />
                      </Button>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Box>

            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="6">
                Zdjęcie matki <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text>
              </Text>
              <Box
                border="2px dashed"
                borderColor="linePrimary"
                borderRadius="12px"
                p="16"
                cursor="pointer"
                onClick={() => motherInputRef.current?.click()}
                _hover={{ borderColor: 'lineSecondary', bg: 'backgroundGrey' }}
                transition="all 0.2s"
              >
                <input 
                  ref={motherInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handleMotherPhoto}
                  style={{ display: 'none' }} 
                />
                <Flex gap="12" align="center">
                  <Box color="contentGrey" display="inline-flex"><LuImage size={24} /></Box>
                  <Text textStyle="labelM" color="contentGrey">
                    {motherPhoto
                      ? motherPhoto.name
                      : existingPhotos?.mother
                      ? 'Aktualne zdjęcie zapisane — kliknij, aby je zastąpić'
                      : 'Kliknij, aby wybrać zdjęcie (JPG, PNG, WebP, max. 5MB)'}
                  </Text>
                </Flex>
              </Box>
              {(motherPhotoPreview || existingPhotos?.mother) && (
                <Box mt="12" w="200px" h="200px" borderRadius="8px" overflow="hidden" border="1px solid" borderColor="linePrimary">
                  <img
                    src={motherPhotoPreview ?? existingPhotos?.mother}
                    alt="Zdjęcie matki"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        <Flex justify="space-between" mt="40" pt="32" borderTop="2px solid" borderColor="linePrimary">
          <Button variant="outline" size="lg" onClick={onBack} minW="160px">
            <LuArrowLeft /> Wstecz
          </Button>
          <Button variant="solid" size="lg" onClick={handleNext} minW="160px">
            Dalej <LuArrowRight />
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}

