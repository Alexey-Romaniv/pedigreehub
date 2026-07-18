import { Box, Stack, Text, Button, Flex, Badge } from '@chakra-ui/react'
import { LuArrowLeft, LuUser, LuMail, LuPhone, LuHouse, LuMapPin, LuPenTool, LuCircleCheck, LuShield, LuFileText, LuTriangleAlert } from 'react-icons/lu'
import { useBreederRegistrationStore } from '../store'
import { POLISH_REGIONS } from '@/shared/constants'
import { useBreeds } from '@/shared/api'

interface Step3Props {
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <Flex gap="12" align="flex-start">
    <Box color="contentGrey" mt="2px"><Icon size={16} /></Box>
    <Box flex="1">
      <Text textStyle="labelS" color="contentGrey">{label}</Text>
      <Text textStyle="labelM" color="contentBlack01">{value}</Text>
    </Box>
  </Flex>
)

export const Step3Summary = ({ onBack, onSubmit, isPending }: Step3Props) => {
  const { step1Data, step2Data } = useBreederRegistrationStore()
  const { data: breeds } = useBreeds()
  if (!step1Data || !step2Data) return null

  const regionLabel = POLISH_REGIONS.find(r => r.value === step2Data.region)?.label || step2Data.region
  // breeds в сторе — ObjectId из каталога; резолвим названия для отображения
  const breedNameById = new Map((breeds || []).map(b => [b._id, b.name]))

  return (
    <Box>
      <Box textAlign="center" mb="32">
        <Text textStyle="titleXLBold" color="contentBlack01" mb="8">Potwierdzenie</Text>
        <Text textStyle="labelM" color="contentGrey">Sprawdź swoje dane przed rejestracją</Text>
      </Box>

      <Stack gap="24">
        <Box bg="backgroundGrey" p="20" borderRadius="12px" border="1px solid" borderColor="linePrimary">
          <Flex align="center" gap="8" mb="16">
            <Box w="32px" h="32px" bg="contentBlack01" borderRadius="full" display="flex" alignItems="center" justifyContent="center"><LuUser size={16} color="white" /></Box>
            <Text textStyle="titleMBold" color="contentBlack01">Dane osobowe</Text>
          </Flex>
          <Stack gap="12">
            <InfoRow icon={LuUser} label="Imię i nazwisko" value={`${step1Data.firstName} ${step1Data.lastName}`} />
            <InfoRow icon={LuMail} label="Email" value={step1Data.email} />
            <InfoRow icon={LuPhone} label="Telefon" value={step1Data.phone} />
          </Stack>
        </Box>

        <Box bg="backgroundGrey" p="20" borderRadius="12px" border="1px solid" borderColor="linePrimary">
          <Flex align="center" gap="8" mb="16">
            <Box w="32px" h="32px" bg="contentBlack01" borderRadius="full" display="flex" alignItems="center" justifyContent="center"><LuHouse size={16} color="white" /></Box>
            <Text textStyle="titleMBold" color="contentBlack01">Dane hodowli</Text>
          </Flex>
          <Stack gap="12">
            <InfoRow icon={LuHouse} label="Nazwa hodowli" value={step2Data.kennelName} />
            <InfoRow icon={LuPenTool} label="Numer ZKwP" value={step2Data.kennelRegistration} />
            <InfoRow icon={LuMapPin} label="Lokalizacja" value={`${step2Data.city}, ${regionLabel}`} />
            <Box>
              <Flex gap="12" align="flex-start">
                <Box color="contentGrey" mt="2px"><LuFileText size={16} /></Box>
                <Box flex="1">
                  <Text textStyle="labelS" color="contentGrey">Hodowane rasy</Text>
                  <Flex gap="6" flexWrap="wrap" mt="4">
                    {step2Data.breeds.map(id => (
                      <Badge key={id} variant="subtle" colorPalette="gray" size="sm">{breedNameById.get(id) ?? id}</Badge>
                    ))}
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Stack>
        </Box>

        <Box bg="statusBackgroundGreyLight" p="20" borderRadius="12px" border="1px solid" borderColor="linePrimary">
          <Flex align="center" gap="12" mb="12">
            <LuTriangleAlert size={24} color="#888888" />
            <Text textStyle="titleSBold" color="contentBlack01">Wymagana weryfikacja dokumentów</Text>
          </Flex>
          <Text textStyle="labelM" color="contentBlack01" mb="12">Po rejestracji zaloguj się i prześlij dokumenty w panelu hodowcy, aby uzyskać pełny dostęp:</Text>
          <Stack gap="8">
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#888888" /><Text textStyle="labelM" color="contentBlack01">Certyfikat ZKwP (wymagany)</Text></Flex>
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#888888" /><Text textStyle="labelM" color="contentBlack01">Dokument tożsamości (opcjonalnie)</Text></Flex>
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#888888" /><Text textStyle="labelM" color="contentBlack01">NIP firmy (opcjonalnie)</Text></Flex>
          </Stack>
        </Box>

        <Box bg="backgroundGrey" p="20" borderRadius="12px" border="1px solid" borderColor="linePrimary">
          <Flex align="center" gap="12" mb="12">
            <LuShield size={24} color="#888888" />
            <Text textStyle="titleSBold" color="contentBlack01">Co dalej?</Text>
          </Flex>
          <Stack gap="8">
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#35aa1b" /><Text textStyle="labelM" color="contentBlack01">Zaloguj się do panelu hodowcy</Text></Flex>
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#35aa1b" /><Text textStyle="labelM" color="contentBlack01">Prześlij dokumenty do weryfikacji</Text></Flex>
            <Flex align="center" gap="8"><LuCircleCheck size={16} color="#35aa1b" /><Text textStyle="labelM" color="contentBlack01">Weryfikacja zajmuje 1-2 dni robocze</Text></Flex>
          </Stack>
        </Box>

        <Text textStyle="labelS" color="contentGrey" textAlign="center">
          Klikając "Zarejestruj się", akceptujesz nasze <Text as="span" color="contentBlack01" cursor="pointer" fontWeight="semibold">Warunki użytkowania</Text> i <Text as="span" color="contentBlack01" cursor="pointer" fontWeight="semibold">Politykę prywatności</Text>
        </Text>

        <Flex gap="16">
          <Button variant="outline" size="lg" flex="1" onClick={onBack} disabled={isPending}><LuArrowLeft /> Wstecz</Button>
          <Button variant="solid" size="lg" flex="2" onClick={onSubmit} loading={isPending}>Zarejestruj się jako hodowca</Button>
        </Flex>
      </Stack>
    </Box>
  )
}
