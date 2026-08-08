import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  Flex,
  Image,
  Portal,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuArrowLeft, LuCircleCheck, LuPhone, LuSend, LuShieldCheck, LuX } from 'react-icons/lu'
import { useAuthStore } from '@/store'
import type { Inquiry, InquiryBreederPreview, InquiryBuyerPreview, InquiryListingPreview, InquiryRole } from '../types'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import { StatusPill } from '@/shared/ui'
import { useCloseInquiry, useConfirmPurchase, useSendInquiryMessage } from '../hooks'

const getListing = (value: Inquiry['listingId']): InquiryListingPreview | null =>
  typeof value === 'string' ? null : value

const getBuyer = (value: Inquiry['buyerId']): InquiryBuyerPreview | null =>
  typeof value === 'string' ? null : value

const getBreeder = (value: Inquiry['breederId']): InquiryBreederPreview | null =>
  typeof value === 'string' ? null : value

const formatMessageDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatPriceShort = (price: number, currency: string) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)

interface InquiryThreadViewProps {
  inquiry: Inquiry
  role: InquiryRole
  backPath: string
}

export const InquiryThreadView = ({ inquiry, role, backPath }: InquiryThreadViewProps) => {
  const user = useAuthStore((state) => state.user)
  const [messageText, setMessageText] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const messagesBoxRef = useRef<HTMLDivElement>(null)

  const sendMessage = useSendInquiryMessage(inquiry._id)
  const closeInquiry = useCloseInquiry(inquiry._id)
  const confirmPurchase = useConfirmPurchase(inquiry._id)

  const listing = getListing(inquiry.listingId)
  const buyer = getBuyer(inquiry.buyerId)
  const breeder = getBreeder(inquiry.breederId)

  const isClosed = inquiry.status === 'closed'
  const isConfirmed = inquiry.status === 'purchase_confirmed'
  const canMessage = !isClosed
  const canConfirm = role === 'buyer' && !isClosed && !isConfirmed
  const canClose = !isClosed && !isConfirmed

  // Autoscroll do ostatniej wiadomości — скроллим только контейнер сообщений,
  // scrollIntoView дёргал бы всю страницу вниз
  useEffect(() => {
    const box = messagesBoxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [inquiry.messages.length])

  const handleSend = () => {
    const text = messageText.trim()
    if (!text || sendMessage.isPending) return
    sendMessage.mutate(text, {
      onSuccess: () => setMessageText(''),
    })
  }

  return (
    <Box>
      {/* Назад */}
      <Box mb="16">
        <Button variant="ghost" size="sm" asChild w="fit-content">
          <Link to={backPath}>
            <LuArrowLeft size={16} />
            Wróć do listy
          </Link>
        </Button>
      </Box>

      {/* Заголовок: объявление + вторая сторона */}
      <Flex
        p="16"
        bg="backgroundPrimary"
        border="1px solid"
        borderColor="linePrimary"
        borderRadius="12px"
        gap="16"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        mb="16"
      >
        {listing && (
          <>
            <Image
              src={listing.photos?.[0]}
              alt={listing.title}
              w={{ base: 'full', md: '96px' }}
              h={{ base: '160px', md: '72px' }}
              objectFit="cover"
              borderRadius="8px"
              bg="backgroundGrey"
              flexShrink={0}
            />
            <Box flex="1" minW="0">
              <Link to={`/puppy/${listing._id}`}>
                <Text
                  textStyle="labelMSemibold"
                  color="contentBlack01"
                  lineClamp={1}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {listing.title}
                </Text>
              </Link>
              <Text textStyle="labelS" color="contentGrey" mt="4">
                {formatPriceShort(listing.price, listing.currency)}
              </Text>
              {role === 'buyer' && breeder && (
                <Flex align="center" gap="6" mt="4" wrap="wrap">
                  <Text textStyle="labelS" color="contentGrey">
                    Hodowca: {breeder.kennelName}
                  </Text>
                  {breeder.verification?.status === 'verified' && (
                    <StatusPill label="Zweryfikowany" tone="default" icon={LuShieldCheck} />
                  )}
                </Flex>
              )}
              {role === 'breeder' && buyer && (
                <Flex align="center" gap="12" mt="4" wrap="wrap">
                  <Text textStyle="labelS" color="contentGrey">
                    Kupujący: {buyer.firstName} {buyer.lastName}
                  </Text>
                  {inquiry.contactPhone && (
                    <Flex align="center" gap="4" color="contentGrey">
                      <LuPhone size={12} />
                      <Text textStyle="labelS" color="contentGrey">
                        {inquiry.contactPhone}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
            </Box>
          </>
        )}
        <Flex direction="column" align={{ base: 'flex-start', md: 'flex-end' }} gap="8">
          <InquiryStatusBadge status={inquiry.status} size="md" />
          <Flex gap="8">
            {canConfirm && (
              <Button variant="solid" size="xs" onClick={() => setConfirmOpen(true)}>
                <LuCircleCheck size={14} />
                Potwierdź zakup
              </Button>
            )}
            {canClose && (
              <Button variant="outline" size="xs" onClick={() => setCloseOpen(true)}>
                <LuX size={14} />
                Zamknij
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>

      {/* Информация о финальном статусе */}
      {isConfirmed && (
        <Flex
          p="12"
          bg="backgroundGrey"
          borderRadius="8px"
          align="center"
          gap="8"
          mb="16"
        >
          <Box color="iconGreen" display="inline-flex" flexShrink={0}>
            <LuCircleCheck size={18} />
          </Box>
          <Text textStyle="labelM" color="contentBlack01">
            {role === 'buyer'
              ? 'Zakup został potwierdzony. Wkrótce będziesz mógł wystawić opinię hodowcy.'
              : 'Kupujący potwierdził zakup szczeniaka.'}
          </Text>
        </Flex>
      )}
      {isClosed && (
        <Flex p="12" bg="backgroundGrey" borderRadius="8px" align="center" gap="8" mb="16">
          <Box color="contentGrey" display="inline-flex" flexShrink={0}>
            <LuX size={18} />
          </Box>
          <Text textStyle="labelM" color="contentGrey">
            Zapytanie zostało zamknięte.
          </Text>
        </Flex>
      )}

      {/* Сообщения */}
      <Box
        ref={messagesBoxRef}
        p="16"
        bg="backgroundPrimary"
        border="1px solid"
        borderColor="linePrimary"
        borderRadius="12px"
        mb="16"
        maxH="480px"
        overflowY="auto"
      >
        {inquiry.messages.length === 0 && (
          <Flex align="center" justify="center" py="24">
            <Text textStyle="labelM" color="contentGrey">
              Brak wiadomości w tym zapytaniu.
            </Text>
          </Flex>
        )}
        <Flex direction="column" gap="12">
          {inquiry.messages.map((message) => {
            const isMine = user ? message.senderId === user.id : false
            return (
              <Flex key={message._id} justify={isMine ? 'flex-end' : 'flex-start'}>
                <Box
                  maxW="75%"
                  p="12"
                  borderRadius="12px"
                  bg={isMine ? 'backgroundGrey' : 'backgroundPrimary'}
                  border="1px solid"
                  borderColor="linePrimary"
                >
                  <Text textStyle="labelM" color="contentBlack01" whiteSpace="pre-wrap">
                    {message.text}
                  </Text>
                  <Text textStyle="labelMonoS" color="contentGrey" mt="6" textAlign="right">
                    {formatMessageDate(message.createdAt)}
                  </Text>
                </Box>
              </Flex>
            )
          })}
        </Flex>
      </Box>

      {/* Форма сообщения */}
      {canMessage && (
        <Flex gap="8" align="flex-end">
          <Textarea
            placeholder="Napisz wiadomość..."
            rows={2}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              // isComposing — не отправлять недописанный IME-ввод
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                handleSend()
              }
            }}
            flex="1"
          />
          <Button
            variant="solid"
            onClick={handleSend}
            loading={sendMessage.isPending}
            disabled={!messageText.trim()}
          >
            <LuSend size={16} />
            Wyślij
          </Button>
        </Flex>
      )}

      {/* Диалог подтверждения покупки */}
      <Dialog.Root open={confirmOpen} onOpenChange={(e) => setConfirmOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="420px" mx="16">
              <Dialog.Header p="0" mb="8">
                <Dialog.Title>
                  <Text textStyle="titleSBold" color="contentBlack01">
                    Potwierdzić zakup?
                  </Text>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p="0" mb="24">
                <Text textStyle="labelM" color="contentGrey">
                  Potwierdź tylko wtedy, gdy szczeniak został już odebrany. Po
                  potwierdzeniu będziesz mógł wystawić opinię hodowcy. Tej operacji nie
                  można cofnąć.
                </Text>
              </Dialog.Body>
              <Dialog.Footer p="0" display="flex" justifyContent="flex-end" gap="8">
                <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
                  Anuluj
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  loading={confirmPurchase.isPending}
                  onClick={() =>
                    confirmPurchase.mutate(undefined, {
                      onSuccess: () => setConfirmOpen(false),
                    })
                  }
                >
                  Potwierdzam zakup
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Диалог закрытия запроса */}
      <Dialog.Root open={closeOpen} onOpenChange={(e) => setCloseOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content bg="backgroundPrimary" borderRadius="16px" p="24" maxW="420px" mx="16">
              <Dialog.Header p="0" mb="8">
                <Dialog.Title>
                  <Text textStyle="titleSBold" color="contentBlack01">
                    Zamknąć zapytanie?
                  </Text>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p="0" mb="24">
                <Text textStyle="labelM" color="contentGrey">
                  Po zamknięciu nie będzie można wysyłać nowych wiadomości w tym
                  zapytaniu.
                </Text>
              </Dialog.Body>
              <Dialog.Footer p="0" display="flex" justifyContent="flex-end" gap="8">
                <Button variant="outline" size="sm" onClick={() => setCloseOpen(false)}>
                  Anuluj
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  loading={closeInquiry.isPending}
                  onClick={() =>
                    closeInquiry.mutate(undefined, {
                      onSuccess: () => setCloseOpen(false),
                    })
                  }
                >
                  Zamknij zapytanie
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}
