import { Box, Input, Stack, Field, Flex, Text, Button, Checkbox } from '@chakra-ui/react'
import { UseFormReturn } from 'react-hook-form'
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'
import type { CreateListingFormData } from '../types'
import { DocumentUploadField } from './DocumentUploadField'
import { toaster } from '@/shared/theme/toaster'

interface Step3Props {
  form: UseFormReturn<CreateListingFormData>
  onNext: () => void
  onBack: () => void
  /** Документы уже загружены ранее (режим редактирования): новый файл заменяет */
  existingDocuments?: { pedigree?: boolean; vetPassport?: boolean; metric?: boolean }
}

export const Step3Documents = ({ form, onNext, onBack, existingDocuments }: Step3Props) => {
  const { register, formState: { errors }, watch, setValue, trigger } = form
  
  const microchipNumber = watch('microchipNumber') || ''
  const hasPedigree = watch('hasPedigree')
  const hasVetPassport = watch('hasVetPassport')
  const hasMetric = watch('hasMetric')
  
  const handleMicrochipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Оставляем только цифры (max 15) — БЕЗ тихой подмены префикса:
    // номер с другим кодом страны должен дать ошибку walidacji, а не превратиться в 616…
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15)
    setValue('microchipNumber', digits, { shouldValidate: digits.length === 15 || digits.length === 0 })
  }
  
  const handleNext = async () => {
    const isValid = await trigger(['microchipNumber'])
    if (!isValid) return
    // Если zaznaczony чекбокс — файл обязателен (или документ уже загружен ранее);
    // объясняем вместо тихой блокировки
    const missing: string[] = []
    if (hasPedigree && !watch('pedigreeDocument') && !existingDocuments?.pedigree) missing.push('rodowód')
    if (hasVetPassport && !watch('vetPassportDocument') && !existingDocuments?.vetPassport) missing.push('paszport weterynaryjny')
    if (hasMetric && !watch('metricDocument') && !existingDocuments?.metric) missing.push('metrykę')
    if (missing.length > 0) {
      toaster.error({
        title: 'Brakuje dokumentów',
        description: `Załącz: ${missing.join(', ')} — lub odznacz odpowiednie pole`,
      })
      return
    }
    onNext()
  }
  
  const microchipDigits = microchipNumber.replace(/\D/g, '')

  return (
    <Box>
      <Stack gap="32">
        <Box>
          <Flex align="center" gap="12" mb="24">
            <Box w="4px" h="24px" bg="contentBlack01" borderRadius="full" />
            <Text textStyle="titleLBold" color="contentBlack01">Dokumenty szczenięcia</Text>
          </Flex>
        </Box>

        <Field.Root invalid={!!errors.microchipNumber} w="full">
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">
            Numer mikroczipa
          </Field.Label>
          <Box position="relative">
            <Input
              placeholder="616123456789012"
              maxLength={15}
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
              letterSpacing="0.08em"
              pl="12"
              pr="12"
              {...register('microchipNumber')}
              value={microchipNumber}
              onChange={handleMicrochipChange}
              onBlur={() => trigger('microchipNumber')}
            />
            {microchipDigits.length === 15 && microchipDigits.startsWith('616') && (
              <Box position="absolute" right="12px" top="50%" transform="translateY(-50%)">
                <Text textStyle="labelS" color="statusTextGreen">✓</Text>
              </Box>
            )}
          </Box>
          <Text textStyle="labelS" color="contentGrey" mt="6">
            Format ISO 11784/11785 — 15 cyfr, polski prefiks 616
          </Text>
          {microchipDigits.length > 0 && microchipDigits.length < 15 && (
            <Text textStyle="labelS" color="statusTextOrange" mt="4">
              Wprowadzono {microchipDigits.length} z 15 cyfr
            </Text>
          )}
          <Field.ErrorText textStyle="labelS" mt="4">{errors.microchipNumber?.message}</Field.ErrorText>
        </Field.Root>

        <Box>
          <Checkbox.Root
            checked={hasPedigree}
            onCheckedChange={(details) => {
              const checked = !!details.checked
              setValue('hasPedigree', checked, { shouldValidate: true })
              if (!checked) {
                setValue('pedigreeDocument', undefined)
              }
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label textStyle="labelMSemibold" color="contentBlack01">
              Posiadam rodowód
            </Checkbox.Label>
          </Checkbox.Root>
          
          {hasPedigree && (
            <Box mt="12">
              <DocumentUploadField
                label="Dokument rodowodu"
                file={watch('pedigreeDocument')}
                onFileChange={(file) => setValue('pedigreeDocument', file, { shouldValidate: true })}
              />
              {existingDocuments?.pedigree && !watch('pedigreeDocument') && (
                <Text textStyle="labelS" color="contentGrey" mt="6">
                  Dokument został już przesłany — załącz nowy plik, aby go zastąpić
                </Text>
              )}
            </Box>
          )}
        </Box>

        <Box>
          <Checkbox.Root
            checked={hasVetPassport}
            onCheckedChange={(details) => {
              const checked = !!details.checked
              setValue('hasVetPassport', checked, { shouldValidate: true })
              if (!checked) {
                setValue('vetPassportDocument', undefined)
              }
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label textStyle="labelMSemibold" color="contentBlack01">
              Posiadam paszport weterynaryjny
            </Checkbox.Label>
          </Checkbox.Root>
          
          {hasVetPassport && (
            <Box mt="12">
              <DocumentUploadField
                label="Paszport weterynaryjny"
                file={watch('vetPassportDocument')}
                onFileChange={(file) => setValue('vetPassportDocument', file, { shouldValidate: true })}
              />
              {existingDocuments?.vetPassport && !watch('vetPassportDocument') && (
                <Text textStyle="labelS" color="contentGrey" mt="6">
                  Dokument został już przesłany — załącz nowy plik, aby go zastąpić
                </Text>
              )}
            </Box>
          )}
        </Box>

        <Box>
          <Checkbox.Root
            checked={hasMetric}
            onCheckedChange={(details) => {
              const checked = !!details.checked
              setValue('hasMetric', checked, { shouldValidate: true })
              if (!checked) {
                setValue('metricDocument', undefined)
              }
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label textStyle="labelMSemibold" color="contentBlack01">
              Posiadam metrykę szczenięcia
            </Checkbox.Label>
          </Checkbox.Root>
          
          {hasMetric && (
            <Box mt="12">
              <DocumentUploadField
                label="Metryka szczenięcia"
                file={watch('metricDocument')}
                onFileChange={(file) => setValue('metricDocument', file, { shouldValidate: true })}
              />
              {existingDocuments?.metric && !watch('metricDocument') && (
                <Text textStyle="labelS" color="contentGrey" mt="6">
                  Dokument został już przesłany — załącz nowy plik, aby go zastąpić
                </Text>
              )}
            </Box>
          )}
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

