import { Box, Button, Container, Flex, Text } from '@chakra-ui/react'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { LuSave, LuTriangleAlert } from 'react-icons/lu'
import type { CreateListingFormData, Listing } from '../types'
import { StepIndicator } from './StepIndicator'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Parents } from './Step2Parents'
import { Step3Documents } from './Step3Documents'
import { Step4PhotosDescription } from './Step4PhotosDescription'
import { ListingPreview } from './ListingPreview'
import { useCreateListing, useUpdateListing } from '../hooks'
import { toaster } from '@/shared/theme/toaster'

// Первые 3 цифры микрочипа ISO 11784: код страны ISO 3166 или код
// производителя (900–998). Список синхронизирован с backend
// (listing.validation.ts, MICROCHIP_COUNTRY_CODES)
const MICROCHIP_COUNTRY_CODES = new Set([
  '616', '040', '056', '100', '112', '124', '191', '203', '208', '233',
  '246', '250', '276', '300', '348', '352', '372', '380', '428', '440',
  '442', '498', '528', '578', '620', '642', '643', '688', '703', '705',
  '724', '752', '756', '804', '826', '840',
])

const isValidMicrochip = (value: string): boolean => {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 15) return false
  const prefix = digits.slice(0, 3)
  const prefixNum = parseInt(prefix, 10)
  return MICROCHIP_COUNTRY_CODES.has(prefix) || (prefixNum >= 900 && prefixNum <= 998)
}

const listingSchema = z.object({
  title: z.string().min(10, 'Minimum 10 znaków').max(100, 'Maksimum 100 znaków'),
  breed: z.string().min(1, 'Rasa jest wymagana').refine(
    (val) => {
      // Проверка что это валидный MongoDB ObjectId (24 hex символа)
      return /^[0-9a-fA-F]{24}$/.test(val)
    },
    { message: 'Nieprawidłowy format ID rasy' }
  ),
  // Правило «минимум 6 tygodni» проверяется только при wysyłce do moderacji —
  // черновик можно создать для только что родившегося помёта
  birthDate: z.union([z.date(), z.string()]).refine(
    (val) => {
      if (!val) return false
      const date = val instanceof Date ? val : new Date(val)
      return !Number.isNaN(date.getTime())
    },
    { message: 'Data urodzenia jest wymagana' }
  ),
  gender: z.enum(['male', 'female', '']).refine((val) => val !== '', { message: 'Płeć jest wymagana' }),
  color: z.string().min(1, 'Umaszczenie jest wymagane'),
  puppyName: z.string().optional(),
  price: z.number().min(100, 'Minimum 100 PLN'),
  currency: z.enum(['PLN', 'EUR']).default('PLN'),
  father: z.object({
    name: z.string().min(1, 'Imię ojca jest wymagane'),
    pedigreeNumber: z.string().optional(),
    titles: z.array(z.string()),
    photo: z.instanceof(File).optional(),
  }),
  mother: z.object({
    name: z.string().min(1, 'Imię matki jest wymagane'),
    pedigreeNumber: z.string().optional(),
    titles: z.array(z.string()),
    photo: z.instanceof(File).optional(),
  }),
  microchipNumber: z.string().refine(isValidMicrochip, {
    message:
      'Numer mikroczipa musi mieć 15 cyfr i zaczynać się od kodu kraju ISO (np. 616 — Polska) lub kodu producenta (900–998)',
  }),
  hasPedigree: z.boolean(),
  pedigreeDocument: z.instanceof(File).optional(),
  hasVetPassport: z.boolean(),
  vetPassportDocument: z.instanceof(File).optional(),
  hasMetric: z.boolean(),
  metricDocument: z.instanceof(File).optional(),
  // Минимум 3 zdjęcia проверяется при wysyłce (razem z już zapisanymi w trybie edycji)
  photos: z.array(z.instanceof(File)).max(10, 'Maksimum 10 zdjęć'),
  videos: z.array(z.string()),
  description: z.string().min(100, 'Minimum 100 znaków').max(5000, 'Maksimum 5000 znaków'),
})

// Поля каждого шага — для навигации к первой ошибке после финальной валидации
const STEP_FIELDS: Record<number, string[]> = {
  1: ['title', 'breed', 'birthDate', 'gender', 'color', 'puppyName', 'price'],
  2: ['father', 'mother'],
  3: ['microchipNumber', 'pedigreeDocument', 'vetPassportDocument', 'metricDocument'],
  4: ['photos', 'videos', 'description'],
}

// Поля, обязательные для сохранения черновика (= шаг 1)
const DRAFT_REQUIRED_FIELDS: FieldPath<CreateListingFormData>[] = [
  'title',
  'breed',
  'birthDate',
  'gender',
  'color',
  'price',
]

const isAtLeastSixWeeksOld = (value: Date | string | null): boolean => {
  if (!value) return false
  const date = value instanceof Date ? value : new Date(value)
  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 6 * 7)
  return date <= new Date() && date <= sixWeeksAgo
}

const listingToFormValues = (listing: Listing): CreateListingFormData => ({
  title: listing.title,
  breed: typeof listing.breed === 'string' ? listing.breed : listing.breed._id,
  birthDate: listing.birthDate ? new Date(listing.birthDate) : null,
  gender: listing.gender,
  color: listing.color,
  puppyName: listing.puppyName ?? '',
  price: listing.price,
  currency: listing.currency ?? 'PLN',
  father: {
    name: listing.father?.name ?? '',
    pedigreeNumber: listing.father?.pedigreeNumber ?? '',
    titles: listing.father?.titles ?? [],
    photo: undefined,
  },
  mother: {
    name: listing.mother?.name ?? '',
    pedigreeNumber: listing.mother?.pedigreeNumber ?? '',
    titles: listing.mother?.titles ?? [],
    photo: undefined,
  },
  microchipNumber: listing.microchipNumber ?? '',
  hasPedigree: listing.hasPedigree,
  pedigreeDocument: undefined,
  hasVetPassport: listing.hasVetPassport,
  vetPassportDocument: undefined,
  hasMetric: listing.hasMetric,
  metricDocument: undefined,
  photos: [],
  videos: listing.videos ?? [],
  description: listing.description ?? '',
})

interface CreateListingWizardProps {
  /** Передано объявление (draft/rejected) — визард работает в режиме редактирования */
  listing?: Listing
}

export const CreateListingWizard = ({ listing }: CreateListingWizardProps) => {
  const isEdit = !!listing
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  // Уже загруженные фото (URL) в режиме редактирования; можно удалять
  const [existingPhotos, setExistingPhotos] = useState<string[]>(listing?.photos ?? [])

  const createMutation = useCreateListing()
  const updateMutation = useUpdateListing()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(listingSchema),
    mode: 'onBlur', // Валидация при потере фокуса
    reValidateMode: 'onChange', // Повторная валидация при изменении
    defaultValues: listing
      ? listingToFormValues(listing)
      : {
          title: '',
          breed: '',
          birthDate: null as Date | null,
          gender: '',
          color: '',
          puppyName: '',
          price: 0,
          currency: 'PLN' as const,
          father: {
            name: '',
            pedigreeNumber: '',
            titles: [],
            photo: undefined,
          },
          mother: {
            name: '',
            pedigreeNumber: '',
            titles: [],
            photo: undefined,
          },
          microchipNumber: '',
          hasPedigree: false,
          pedigreeDocument: undefined,
          hasVetPassport: false,
          vetPassportDocument: undefined,
          hasMetric: false,
          metricDocument: undefined,
          photos: [],
          videos: [],
          description: '',
        },
  })

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowPreview(true)
    }
  }

  const handleBack = () => {
    if (showPreview) {
      setShowPreview(false)
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
      setShowPreview(false)
    }
  }

  // Переход к первому шагу, на котором есть ошибка (вместо слепого «шаг 1»)
  const goToFirstErrorStep = () => {
    const errorKeys = Object.keys(form.formState.errors)
    const step =
      [1, 2, 3, 4].find((s) => STEP_FIELDS[s].some((f) => errorKeys.includes(f))) ?? 1
    setShowPreview(false)
    setCurrentStep(step)
    toaster.error({ title: `Formularz zawiera błędy — sprawdź krok ${step}` })
  }

  const persist = (status: 'draft' | 'pending') => {
    if (isEdit && listing) {
      updateMutation.mutate({
        id: listing._id,
        data: form.getValues(),
        existingPhotos,
        submit: status === 'pending',
      })
    } else {
      createMutation.mutate({ data: form.getValues(), status })
    }
  }

  // Черновик: обязателен только шаг 1; заполненные поля дальше валидируются,
  // если в них что-то введено
  const handleSaveDraft = async () => {
    const values = form.getValues()
    const fields: FieldPath<CreateListingFormData>[] = [...DRAFT_REQUIRED_FIELDS]
    if (values.microchipNumber) fields.push('microchipNumber')
    if (values.description) fields.push('description')

    const isValid = await form.trigger(fields)
    if (!isValid) {
      goToFirstErrorStep()
      return
    }
    persist('draft')
  }

  // Отправка на модерацию: полная валидация + проверки, которых нет в zod
  // (минимум 3 фото с учётом уже сохранённых, wiek 6 tygodni)
  const handleSubmit = async () => {
    const isValid = await form.trigger()

    const values = form.getValues()
    if (values.photos.length + existingPhotos.length < 3) {
      form.setError('photos', { message: 'Minimum 3 zdjęcia' })
    }
    if (!isAtLeastSixWeeksOld(values.birthDate)) {
      form.setError('birthDate', { message: 'Szczenię musi mieć minimum 6 tygodni' })
    }

    if (!isValid || Object.keys(form.formState.errors).length > 0) {
      goToFirstErrorStep()
      return
    }
    persist('pending')
  }

  const rejectionNote =
    listing?.verificationStatus === 'rejected' ? listing.verificationNote : undefined

  if (showPreview) {
    return (
      <Container maxW="container.xl" py="32">
        <ListingPreview
          formData={form.getValues()}
          existingPhotos={existingPhotos}
          onBack={handleBack}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          saveLabel={isEdit ? 'Zapisz zmiany' : 'Zapisz jako szkic'}
          submitLabel={isEdit && listing?.status === 'rejected' ? 'Wyślij ponownie' : 'Wyślij do moderacji'}
        />
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py="32">
      <Box>
        <Flex mb="40" justify="space-between" align="flex-start" gap="16" wrap="wrap">
          <Box>
            <Text textStyle="labelMono" color="contentGrey" mb="6">
              Panel hodowcy
            </Text>
            <Text textStyle="titleSerifXL" color="contentBlack01" mb="8">
              {isEdit ? 'Edytuj ogłoszenie' : 'Nowe ogłoszenie'}
            </Text>
            <Text textStyle="labelL" color="contentGrey">
              {isEdit
                ? 'Popraw dane i zapisz zmiany lub wyślij ogłoszenie do moderacji'
                : 'Możesz zapisać szkic w dowolnym momencie — wystarczy krok 1'}
            </Text>
          </Box>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isPending}
          >
            <LuSave size={16} />
            {isEdit ? 'Zapisz zmiany' : 'Zapisz szkic'}
          </Button>
        </Flex>

        {rejectionNote && (
          <Flex
            gap="12"
            align="flex-start"
            bg="backgroundGrey"
            border="1px solid"
            borderColor="linePrimary"
            borderRadius="12px"
            p="16"
            mb="24"
          >
            <Box color="statusTextRed" display="inline-flex" mt="2">
              <LuTriangleAlert size={18} />
            </Box>
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="2">
                Ogłoszenie zostało odrzucone przez moderatora
              </Text>
              <Text textStyle="labelS" color="contentGrey">
                Powód: {rejectionNote}. Popraw dane i wyślij ogłoszenie ponownie.
              </Text>
            </Box>
          </Flex>
        )}

        <StepIndicator
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <Box
          bg="backgroundPrimary"
          borderRadius="16px"
          p={{ base: "24", md: "40" }}
          border="1px solid"
          borderColor="linePrimary"
        >
          {currentStep === 1 && <Step1BasicInfo form={form} onNext={handleNext} />}
          {currentStep === 2 && (
            <Step2Parents
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              existingPhotos={{
                father: listing?.father?.photo,
                mother: listing?.mother?.photo,
              }}
            />
          )}
          {currentStep === 3 && (
            <Step3Documents
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              existingDocuments={{
                pedigree: !!listing?.pedigreeDocument,
                vetPassport: !!listing?.vetPassportDocument,
                metric: !!listing?.metricDocument,
              }}
            />
          )}
          {currentStep === 4 && (
            <Step4PhotosDescription
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              existingPhotos={existingPhotos}
              onRemoveExistingPhoto={(url) =>
                setExistingPhotos((prev) => prev.filter((p) => p !== url))
              }
            />
          )}
        </Box>
      </Box>
    </Container>
  )
}
