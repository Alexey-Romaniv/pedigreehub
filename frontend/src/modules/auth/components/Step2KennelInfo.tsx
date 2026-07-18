import { Box, Input, Stack, Field, Flex, Text, Button, Textarea, NativeSelect } from '@chakra-ui/react'
import { UseFormReturn, Controller } from 'react-hook-form'
import { LuHouse, LuMapPin, LuGlobe, LuPenTool, LuArrowLeft } from 'react-icons/lu'
import { FaFacebook, FaInstagram } from 'react-icons/fa'
import { useBreederRegistrationStore } from '../store'
import { POLISH_REGIONS } from '@/shared/constants'
import { BreedCombobox } from '@/shared/ui'
import type { Step2FormData } from '../types'

interface Step2Props {
  form: UseFormReturn<Step2FormData>
  onNext: () => void
  onBack: () => void
}

export const Step2KennelInfo = ({ form, onNext, onBack }: Step2Props) => {
  const { register, formState: { errors }, trigger, getValues } = form
  const { setStep2Data } = useBreederRegistrationStore()

  const handleNext = async () => {
    const isValid = await trigger()
    if (!isValid) return
    setStep2Data(getValues())
    onNext()
  }

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="titleXLBold" color="contentBlack01" mb="8">Dane hodowli</Text>
        <Text textStyle="labelM" color="contentGrey">Opowiedz o swojej hodowli</Text>
      </Box>

      <Stack gap="20">
        <Field.Root invalid={!!errors.kennelName}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Nazwa hodowli</Field.Label>
          <Box position="relative" w="full">
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1"><LuHouse size={18} /></Box>
            <Input placeholder="np. Złote Łapki" pl="40px" {...register('kennelName')} />
          </Box>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.kennelName?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.kennelRegistration}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Numer rejestracyjny ZKwP/FCI</Field.Label>
          <Box position="relative" w="full">
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1"><LuPenTool size={18} /></Box>
            <Input placeholder="np. XII-1234/56" pl="40px" {...register('kennelRegistration')} />
          </Box>
          <Text textStyle="labelS" color="contentGrey" mt="4">Numer z oficjalnego zaświadczenia ZKwP</Text>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.kennelRegistration?.message}</Field.ErrorText>
        </Field.Root>

        <Flex gap="16" flexDir={{ base: 'column', md: 'row' }}>
          <Field.Root invalid={!!errors.region} flex="1">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Województwo</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field {...register('region')}>
                <option value="">Wybierz województwo</option>
                {POLISH_REGIONS.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.region?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.city} flex="1">
            <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Miasto</Field.Label>
            <Box position="relative" w="full">
              <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1"><LuMapPin size={18} /></Box>
              <Input placeholder="np. Warszawa" pl="40px" {...register('city')} />
            </Box>
            <Field.ErrorText textStyle="labelS" mt="4">{errors.city?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Field.Root>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Adres <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text></Field.Label>
          <Input placeholder="ul. Przykładowa 123" {...register('address')} w="full" />
        </Field.Root>

        <Field.Root invalid={!!errors.description}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Opis hodowli</Field.Label>
          <Textarea placeholder="Opowiedz o swojej hodowli, doświadczeniu, filozofii hodowlanej..." rows={4} {...register('description')} />
          <Text textStyle="labelS" color="contentGrey" mt="4">Minimum 50 znaków</Text>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.description?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.breeds}>
          <Field.Label textStyle="labelMSemibold" color="contentBlack01" mb="6">Rasy, które hodujesz</Field.Label>
          <Controller
            name="breeds"
            control={form.control}
            render={({ field }) => (
              <BreedCombobox
                multiple
                value={field.value || []}
                onValueChange={(ids) => {
                  field.onChange(ids)
                  trigger('breeds')
                }}
                invalid={!!errors.breeds}
                placeholder="Wyszukaj i dodaj rasy..."
              />
            )}
          />
          <Text textStyle="labelS" color="contentGrey" mt="4">Możesz wybrać kilka ras</Text>
          <Field.ErrorText textStyle="labelS" mt="4">{errors.breeds?.message}</Field.ErrorText>
        </Field.Root>

        <Box bg="backgroundGrey" p="20" borderRadius="12px">
          <Text textStyle="labelMSemibold" color="contentBlack01" mb="16">Linki <Text as="span" color="contentGrey" fontWeight="regular">(opcjonalnie)</Text></Text>
          <Stack gap="16">
            <Field.Root>
              <Box position="relative" w="full">
                <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="contentGrey" zIndex="1"><LuGlobe size={18} /></Box>
                <Input placeholder="https://twoja-strona.pl" pl="40px" bg="backgroundPrimary" {...register('website')} />
              </Box>
            </Field.Root>
            <Field.Root>
              <Box position="relative" w="full">
                <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="#1877F2" zIndex="1"><FaFacebook size={18} /></Box>
                <Input placeholder="facebook.com/twoja-hodowla" pl="40px" bg="backgroundPrimary" {...register('facebook')} />
              </Box>
            </Field.Root>
            <Field.Root>
              <Box position="relative" w="full">
                <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="#E4405F" zIndex="1"><FaInstagram size={18} /></Box>
                <Input placeholder="instagram.com/twoja-hodowla" pl="40px" bg="backgroundPrimary" {...register('instagram')} />
              </Box>
            </Field.Root>
          </Stack>
        </Box>

        <Flex gap="16" mt="16">
          <Button variant="outline" size="lg" flex="1" onClick={onBack}><LuArrowLeft /> Wstecz</Button>
          <Button variant="solid" size="lg" flex="2" onClick={handleNext}>Dalej</Button>
        </Flex>
      </Stack>
    </Box>
  )
}
