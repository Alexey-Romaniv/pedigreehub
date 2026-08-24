import { Box, Text, Flex, Button, Badge, Stack, SimpleGrid, Image, Textarea } from '@chakra-ui/react'
import { LuCheck, LuX, LuExternalLink, LuTriangleAlert, LuCircleCheck, LuCircleHelp } from 'react-icons/lu'
import { useState } from 'react'
import { ImageLightbox, useImageLightbox } from '@/shared/ui'
import type { AdminListing } from '../types'
import { DocumentViewer } from './DocumentViewer'

interface AdminListingPreviewProps {
  listing: AdminListing | null
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
  isApproving: boolean
  isRejecting: boolean
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  
  if (months > 0) {
    return `${months} ${months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}`
  }
  return `${days} ${days === 1 ? 'dzień' : 'dni'}`
}

const validateMicrochip = (microchip: string) => {
  return /^\d{15}$/.test(microchip)
}

export const AdminListingPreview = ({
  listing,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: AdminListingPreviewProps) => {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  // Один просмотрщик на всё объявление: модератор листает снимки щенка
  // и фото родителей подряд, не закрывая окно
  const photos = listing?.photos || []
  const gallery = useImageLightbox([
    ...photos.map((photo, index) => ({
      src: photo,
      alt: listing?.title,
      caption: `Zdjęcie ${index + 1} z ${photos.length}`,
    })),
    ...(listing?.father?.photo
      ? [{ src: listing.father.photo, alt: listing.father.name, caption: `Ojciec: ${listing.father.name}` }]
      : []),
    ...(listing?.mother?.photo
      ? [{ src: listing.mother.photo, alt: listing.mother.name, caption: `Matka: ${listing.mother.name}` }]
      : []),
  ])
  const fatherPhotoIndex = photos.length
  const motherPhotoIndex = photos.length + (listing?.father?.photo ? 1 : 0)

  if (!listing) {
    return (
      <Box 
        bg="backgroundGrey" 
        borderRadius="12px" 
        h="full" 
        minH="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text textStyle="labelL" color="contentGrey">
          Wybierz ogłoszenie z listy
        </Text>
      </Box>
    )
  }

  const breedName = typeof listing.breed === 'object' ? listing.breed.name : 'Nieznana rasa'
  // Заводчик приходит в populate-нутом breederId; listing.breeder — старый фолбэк
  const breeder =
    typeof listing.breederId === 'object'
      ? listing.breederId
      : typeof listing.breeder === 'object'
        ? listing.breeder
        : null

  const handleReject = () => {
    onReject(listing._id, rejectReason || undefined)
    setRejectReason('')
    setShowRejectForm(false)
  }

  return (
    <Box
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      h="full"
      display="flex"
      flexDirection="column"
      maxH="calc(100vh - 200px)"
      overflow="hidden"
    >
      {/* Header */}
      <Box 
        p="16" 
        borderBottom="1px solid" 
        borderColor="linePrimary" 
        flexShrink={0}
        bg={listing.status === 'pending' ? 'statusBackgroundPurple' : 'backgroundPrimary'}
      >
        <Flex justify="space-between" align="flex-start" mb="8">
          <Box flex="1">
            <Text textStyle="titleMBold" color="contentBlack01" mb="4">
              {listing.title}
            </Text>
            <Flex gap="8" flexWrap="wrap" align="center">
              <Badge colorPalette="blue" size="sm">{breedName}</Badge>
              <Badge 
                colorPalette={
                  listing.status === 'pending' ? 'blue' :
                  listing.status === 'active' ? 'green' :
                  listing.status === 'rejected' ? 'red' : 'gray'
                }
                size="sm"
              >
                {listing.status === 'pending' ? 'Oczekujące na moderację' : 
                 listing.status === 'active' ? 'Aktywne' : 
                 listing.status === 'rejected' ? 'Odrzucone' : listing.status}
              </Badge>
            </Flex>
          </Box>
        </Flex>
        {listing.status === 'pending' && (
          <Box
            bg="backgroundPrimary"
            p="8"
            borderRadius="6px"
            border="1px solid"
            borderColor="linePrimary"
          >
            <Text textStyle="labelS" color="contentGrey">
              Ogłoszenie oczekuje na weryfikację. Sprawdź wszystkie dane i dokumenty przed zatwierdzeniem.
            </Text>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box p="16" borderBottom="1px solid" borderColor="linePrimary" flexShrink={0}>
        {showRejectForm ? (
          <Stack gap="12">
            <Box>
              <Text textStyle="labelM" color="contentBlack01" mb="8">
                Powód odrzucenia (opcjonalnie)
              </Text>
              <Textarea
                w="full"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Wpisz powód odrzucenia..."
              />
            </Box>
            <Flex gap="8">
              <Button 
                variant="outline" 
                flex="1"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
              >
                Anuluj
              </Button>
              <Button
                variant="solid"
                flex="1"
                bg="negative"
                color="white"
                onClick={handleReject}
                loading={isRejecting}
              >
                <LuX size={16} />
                Odrzuć
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Flex gap="12">
            <Button
              variant="outline"
              flex="1"
              onClick={() => setShowRejectForm(true)}
            >
              <LuX size={16} />
              Odrzuć
            </Button>
            <Button
              variant="solid"
              flex="1"
              bg="positive"
              color="white"
              onClick={() => onApprove(listing._id)}
              loading={isApproving}
            >
              <LuCheck size={16} />
              Zatwierdź
            </Button>
          </Flex>
        )}
      </Box>

      {/* Content */}
      <Box flex="1" p="16" overflow="auto" bg="backgroundGrey">
        <Stack gap="24">
          {/* Галерея фотографий */}
          {listing.photos && listing.photos.length > 0 && (
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
                Zdjęcia ({listing.photos.length})
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3 }} gap="12">
                {listing.photos.map((photo, index) => (
                  <Box
                    key={index}
                    w="full"
                    aspectRatio="1"
                    borderRadius="8px"
                    overflow="hidden"
                    bg="backgroundPrimary"
                    border="1px solid"
                    borderColor="linePrimary"
                    cursor="zoom-in"
                    onClick={() => gallery.openAt(index)}
                  >
                    <Image
                      src={photo}
                      alt={`${listing.title} - zdjęcie ${index + 1}`}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Основная информация */}
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
              Podstawowe informacje
            </Text>
            <Stack gap="12">
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Tytuł:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">{listing.title}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Rasa:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">{breedName}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Płeć:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">
                  {listing.gender === 'male' ? 'Samiec' : 'Samica'}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Data urodzenia:</Text>
                <Flex direction="column" align="flex-end" gap="4">
                  <Text textStyle="labelMBold" color="contentBlack01">
                    {formatDate(listing.birthDate)}
                  </Text>
                  <Text textStyle="labelS" color="contentGrey">
                    ({calculateAge(listing.birthDate)})
                  </Text>
                </Flex>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Umaszczenie:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">{listing.color}</Text>
              </Flex>
              {listing.puppyName && (
                <Flex justify="space-between">
                  <Text textStyle="labelM" color="contentGrey">Imię:</Text>
                  <Text textStyle="labelMBold" color="contentBlack01">{listing.puppyName}</Text>
                </Flex>
              )}
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Cena:</Text>
                <Text textStyle="labelMBold" color="contentBlack01">
                  {listing.price} {listing.currency}
                </Text>
              </Flex>
            </Stack>
          </Box>

          {/* Информация о родителях */}
          {(listing.father || listing.mother) && (
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
                Rodzice
              </Text>
              <Stack gap="16">
                {listing.father && (
                  <Box>
                    <Text textStyle="labelMBold" color="contentBlack01" mb="8">Ojciec</Text>
                    <Flex gap="12" align="flex-start">
                      {listing.father.photo && (
                        <Box
                          w="80px"
                          h="80px"
                          borderRadius="8px"
                          overflow="hidden"
                          bg="backgroundPrimary"
                          border="1px solid"
                          borderColor="linePrimary"
                          flexShrink={0}
                          cursor="zoom-in"
                          onClick={() => gallery.openAt(fatherPhotoIndex)}
                        >
                          <Image
                            src={listing.father.photo}
                            alt={listing.father.name}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                      <Box flex="1">
                        <Text textStyle="labelM" color="contentBlack01" mb="4">
                          {listing.father.name}
                        </Text>
                        {listing.father.pedigreeNumber && (
                          <Text textStyle="labelS" color="contentGrey" mb="4">
                            Rodowód: {listing.father.pedigreeNumber}
                          </Text>
                        )}
                        {listing.father.titles && listing.father.titles.length > 0 && (
                          <Flex gap="8" flexWrap="wrap">
                            {listing.father.titles.map((title, index) => (
                              <Badge key={index} colorPalette="blue" size="sm">
                                {title}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                )}
                {listing.mother && (
                  <Box>
                    <Text textStyle="labelMBold" color="contentBlack01" mb="8">Matka</Text>
                    <Flex gap="12" align="flex-start">
                      {listing.mother.photo && (
                        <Box
                          w="80px"
                          h="80px"
                          borderRadius="8px"
                          overflow="hidden"
                          bg="backgroundPrimary"
                          border="1px solid"
                          borderColor="linePrimary"
                          flexShrink={0}
                          cursor="zoom-in"
                          onClick={() => gallery.openAt(motherPhotoIndex)}
                        >
                          <Image
                            src={listing.mother.photo}
                            alt={listing.mother.name}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                      <Box flex="1">
                        <Text textStyle="labelM" color="contentBlack01" mb="4">
                          {listing.mother.name}
                        </Text>
                        {listing.mother.pedigreeNumber && (
                          <Text textStyle="labelS" color="contentGrey" mb="4">
                            Rodowód: {listing.mother.pedigreeNumber}
                          </Text>
                        )}
                        {listing.mother.titles && listing.mother.titles.length > 0 && (
                          <Flex gap="8" flexWrap="wrap">
                            {listing.mother.titles.map((title, index) => (
                              <Badge key={index} colorPalette="blue" size="sm">
                                {title}
                              </Badge>
                            ))}
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Проверка данных */}
          <Box
            bg="backgroundPrimary"
            border="1px solid"
            borderColor="linePrimary"
            borderRadius="8px"
            p="16"
          >
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
              Weryfikacja danych
            </Text>
            <Stack gap="12">
              <Flex align="flex-start" gap="8">
                {validateMicrochip(listing.microchipNumber) ? (
                  <>
                    <Box as="span" color="iconGreen" display="inline-flex" flexShrink={0}><LuCircleCheck size={20} /></Box>
                    <Text textStyle="labelM" color="contentBlack01">
                      Mikroczip: {listing.microchipNumber} (poprawny format)
                    </Text>
                  </>
                ) : (
                  <>
                    <Box as="span" color="negative" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                    <Text textStyle="labelM" color="contentBlack01">
                      Mikroczip: {listing.microchipNumber} (nieprawidłowy format - powinno być 15 cyfr)
                    </Text>
                  </>
                )}
              </Flex>
              {listing.autoChecks && (
                <>
                  {listing.autoChecks.microchipFormatValid !== undefined && (
                    <Flex align="flex-start" gap="8">
                      {listing.autoChecks.microchipFormatValid ? (
                        <>
                          <Box as="span" color="iconGreen" display="inline-flex" flexShrink={0}><LuCircleCheck size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Format mikroczipa zweryfikowany automatycznie
                          </Text>
                        </>
                      ) : (
                        <>
                          <Box as="span" color="negative" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Format mikroczipa nieprawidłowy
                          </Text>
                        </>
                      )}
                    </Flex>
                  )}
                  {listing.autoChecks.documentsUploaded !== undefined && (
                    <Flex align="flex-start" gap="8">
                      {listing.autoChecks.documentsUploaded ? (
                        <>
                          <Box as="span" color="iconGreen" display="inline-flex" flexShrink={0}><LuCircleCheck size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Wszystkie wymagane dokumenty załączone
                          </Text>
                        </>
                      ) : (
                        <>
                          <Box as="span" color="negative" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Brakuje niektórych dokumentów
                          </Text>
                        </>
                      )}
                    </Flex>
                  )}
                  {listing.autoChecks.dataConsistency !== undefined && (
                    <Flex align="flex-start" gap="8">
                      {listing.autoChecks.dataConsistency ? (
                        <>
                          <Box as="span" color="iconGreen" display="inline-flex" flexShrink={0}><LuCircleCheck size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Spójność danych potwierdzona
                          </Text>
                        </>
                      ) : (
                        <>
                          <Box as="span" color="negative" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Wykryto niespójności w danych
                          </Text>
                        </>
                      )}
                    </Flex>
                  )}
                  {listing.autoChecks.zkwpChip && (
                    <Box>
                      {listing.autoChecks.zkwpChip.status === 'found' && (
                        <>
                          {/* Odpowiedź rozpoznana polami = potwierdzenie (zielone).
                              Sam rawText = struktura nierozpoznana — nie liczymy jej
                              za weryfikację (publiczna flaga też jej nie dostaje) */}
                          {listing.autoChecks.zkwpChip.dogName ||
                          listing.autoChecks.zkwpChip.kennelName ||
                          listing.autoChecks.zkwpChip.sex ||
                          listing.autoChecks.zkwpChip.birthDate ||
                          listing.autoChecks.zkwpChip.branch ? (
                            <Flex align="flex-start" gap="8">
                              <Box as="span" color="iconGreen" display="inline-flex" flexShrink={0}><LuCircleCheck size={20} /></Box>
                              <Text textStyle="labelM" color="contentBlack01">
                                Mikroczip znaleziony w bazie ZKwP
                              </Text>
                            </Flex>
                          ) : (
                            <Flex align="flex-start" gap="8">
                              <Box as="span" color="iconWarning" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                              <Text textStyle="labelM" color="contentBlack01">
                                Odpowiedź bazy ZKwP nierozpoznana — sprawdź dane ręcznie
                              </Text>
                            </Flex>
                          )}
                          <Stack gap="2" mt="8" pl="28px">
                            {listing.autoChecks.zkwpChip.dogName && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                Nazwa: {listing.autoChecks.zkwpChip.dogName}
                              </Text>
                            )}
                            {listing.autoChecks.zkwpChip.kennelName && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                Przydomek: {listing.autoChecks.zkwpChip.kennelName}
                              </Text>
                            )}
                            {listing.autoChecks.zkwpChip.sex && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                Płeć: {listing.autoChecks.zkwpChip.sex}
                              </Text>
                            )}
                            {listing.autoChecks.zkwpChip.birthDate && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                Data urodzenia: {listing.autoChecks.zkwpChip.birthDate}
                              </Text>
                            )}
                            {listing.autoChecks.zkwpChip.branch && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                Oddział: {listing.autoChecks.zkwpChip.branch}
                              </Text>
                            )}
                            {listing.autoChecks.zkwpChip.rawText && (
                              <Text textStyle="labelMonoS" color="contentGrey">
                                {listing.autoChecks.zkwpChip.rawText}
                              </Text>
                            )}
                          </Stack>
                          {listing.autoChecks.zkwpChip.birthDateMatches === false && (
                            <Flex align="flex-start" gap="8" mt="8">
                              <Box as="span" color="iconWarning" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                              <Text textStyle="labelM" color="contentBlack01">
                                Data urodzenia w bazie ZKwP różni się od podanej w ogłoszeniu
                              </Text>
                            </Flex>
                          )}
                        </>
                      )}
                      {listing.autoChecks.zkwpChip.status === 'not_found' && (
                        <Flex align="flex-start" gap="8">
                          <Box as="span" color="iconWarning" display="inline-flex" flexShrink={0}><LuTriangleAlert size={20} /></Box>
                          <Text textStyle="labelM" color="contentBlack01">
                            Nie znaleziono w bazie ZKwP — szczenię mogło nie zostać jeszcze
                            zarejestrowane. Zweryfikuj metrykę ręcznie.
                          </Text>
                        </Flex>
                      )}
                      {listing.autoChecks.zkwpChip.status === 'unavailable' && (
                        <Flex align="flex-start" gap="8">
                          <Box as="span" color="iconGrey01" display="inline-flex" flexShrink={0}><LuCircleHelp size={20} /></Box>
                          <Text textStyle="labelM" color="contentGrey">
                            Baza ZKwP była niedostępna podczas sprawdzania
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  )}
                </>
              )}
              <Flex align="flex-start" gap="8">
                <Text textStyle="labelM" color="contentBlack01">
                  Wiek szczeniaka: {calculateAge(listing.birthDate)}
                </Text>
              </Flex>
            </Stack>
          </Box>

          {/* Документы */}
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
              Dokumenty
            </Text>
            <Stack gap="16">
              {listing.hasPedigree && (
                <DocumentViewer
                  document={listing.pedigreeDocument}
                  title="Rodowód"
                  required={listing.hasPedigree}
                />
              )}
              {listing.hasVetPassport && (
                <DocumentViewer
                  document={listing.vetPassportDocument}
                  title="Paszport weterynaryjny"
                  required={listing.hasVetPassport}
                />
              )}
              {listing.hasMetric && (
                <DocumentViewer
                  document={listing.metricDocument}
                  title="Metryka"
                  required={listing.hasMetric}
                />
              )}
              {!listing.hasPedigree && !listing.hasVetPassport && !listing.hasMetric && (
                <Text textStyle="labelM" color="contentGrey">
                  Brak załączonych dokumentów
                </Text>
              )}
            </Stack>
          </Box>

          {/* Описание */}
          {listing.description && (
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
                Opis
              </Text>
              <Text textStyle="labelM" color="contentBlack01" whiteSpace="pre-wrap">
                {listing.description}
              </Text>
            </Box>
          )}

          {/* Видео */}
          {listing.videos && listing.videos.length > 0 && (
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
                Wideo
              </Text>
              <Stack gap="8">
                {listing.videos.map((video, index) => (
                  <Box key={index}>
                    <Button variant="outline" size="sm" asChild>
                      <a href={video} target="_blank" rel="noopener noreferrer">
                        <LuExternalLink size={16} />
                        Otwórz wideo {index + 1}
                      </a>
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Информация о заводчике */}
          {breeder && (
            <Box>
              <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
                Hodowca
              </Text>
              <Stack gap="8">
                <Text textStyle="labelM" color="contentBlack01">
                  {breeder.userId.firstName} {breeder.userId.lastName}
                </Text>
                <Text textStyle="labelM" color="contentBlack01">
                  {breeder.kennelName}
                </Text>
                <Text textStyle="labelS" color="contentGrey">
                  {breeder.city}, {breeder.region}
                </Text>
                <Text textStyle="labelS" color="contentGrey">
                  {breeder.userId.email}
                </Text>
              </Stack>
            </Box>
          )}

          {/* Информация о статусе */}
          {listing.verificationNote && (
            <Box
              bg="statusBackgroundRed"
              color="negative"
              p="12"
              borderRadius="8px"
            >
              <Text textStyle="labelMSemibold" mb="4">Powód odrzucenia:</Text>
              <Text textStyle="labelM">{listing.verificationNote}</Text>
            </Box>
          )}

          {/* Даты */}
          <Box>
            <Text textStyle="labelMSemibold" color="contentBlack01" mb="12">
              Informacje techniczne
            </Text>
            <Stack gap="8">
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Utworzono:</Text>
                <Text textStyle="labelM" color="contentBlack01">
                  {formatDateTime(listing.createdAt)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Zaktualizowano:</Text>
                <Text textStyle="labelM" color="contentBlack01">
                  {formatDateTime(listing.updatedAt)}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text textStyle="labelM" color="contentGrey">Status weryfikacji:</Text>
                <Badge
                  colorPalette={
                    listing.verificationStatus === 'verified' ? 'green' :
                    listing.verificationStatus === 'rejected' ? 'red' : 'blue'
                  }
                  size="sm"
                >
                  {listing.verificationStatus === 'verified' ? 'Zweryfikowane' :
                   listing.verificationStatus === 'rejected' ? 'Odrzucone' : 'Oczekujące'}
                </Badge>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <ImageLightbox {...gallery.lightboxProps} />
    </Box>
  )
}

