import { Box, Button, Container, Flex, Image, Skeleton, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { LuImage, LuMessageCircle, LuRefreshCw } from 'react-icons/lu'
import type { Inquiry, InquiryBreederPreview, InquiryBuyerPreview, InquiryListingPreview, InquiryRole } from '../types'
import { InquiryStatusBadge } from './InquiryStatusBadge'

const formatListDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

interface InquiryListProps {
  title: string
  inquiries: Inquiry[] | undefined
  isLoading: boolean
  isError: boolean
  role: InquiryRole
  basePath: string
  emptyText: string
  emptyHint?: string
  onRetry?: () => void
}

const InquiryRow = ({
  inquiry,
  role,
  basePath,
}: {
  inquiry: Inquiry
  role: InquiryRole
  basePath: string
}) => {
  const listing =
    typeof inquiry.listingId === 'string' ? null : (inquiry.listingId as InquiryListingPreview)
  const buyer =
    typeof inquiry.buyerId === 'string' ? null : (inquiry.buyerId as InquiryBuyerPreview)
  const breeder =
    typeof inquiry.breederId === 'string' ? null : (inquiry.breederId as InquiryBreederPreview)

  const unreadCount = role === 'buyer' ? inquiry.buyerUnreadCount : inquiry.breederUnreadCount
  const lastMessage = inquiry.messages[inquiry.messages.length - 1]
  const counterpartyLabel =
    role === 'buyer'
      ? breeder?.kennelName
      : buyer
        ? `${buyer.firstName} ${buyer.lastName}`
        : undefined

  const photo = listing?.photos?.[0]

  return (
    <Link to={`${basePath}/${inquiry._id}`}>
      <Flex
        p="16"
        bg="backgroundPrimary"
        border="1px solid"
        borderColor="linePrimary"
        borderRadius="12px"
        gap="16"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        _hover={{ borderColor: 'contentGrey' }}
        transition="border-color 0.15s"
      >
        {photo ? (
          <Image
            src={photo}
            alt={listing?.title || 'Ogłoszenie'}
            w={{ base: 'full', md: '80px' }}
            h={{ base: '140px', md: '60px' }}
            objectFit="cover"
            borderRadius="8px"
            bg="backgroundGrey"
            flexShrink={0}
          />
        ) : (
          <Flex
            w={{ base: 'full', md: '80px' }}
            h={{ base: '140px', md: '60px' }}
            borderRadius="8px"
            bg="backgroundGrey"
            align="center"
            justify="center"
            color="contentGrey"
            flexShrink={0}
          >
            <LuImage size={20} />
          </Flex>
        )}
        <Box flex="1" minW="0">
          <Flex align="center" gap="8" mb="4" wrap="wrap">
            <Text textStyle="labelMSemibold" color="contentBlack01" lineClamp={1}>
              {listing?.title || 'Ogłoszenie niedostępne'}
            </Text>
            {unreadCount > 0 && (
              <Flex
                bg="contentBlack01"
                color="backgroundPrimary"
                borderRadius="full"
                minW="20px"
                h="20px"
                px="6"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Text textStyle="labelMonoS" color="backgroundPrimary">
                  {unreadCount}
                </Text>
              </Flex>
            )}
          </Flex>
          {counterpartyLabel && (
            <Text textStyle="labelS" color="contentGrey" mb="4">
              {role === 'buyer' ? 'Hodowca' : 'Kupujący'}: {counterpartyLabel}
            </Text>
          )}
          {lastMessage && (
            <Text textStyle="labelS" color="contentGrey" lineClamp={1}>
              {lastMessage.text}
            </Text>
          )}
        </Box>
        <Flex
          direction="column"
          align={{ base: 'flex-start', md: 'flex-end' }}
          gap="6"
          flexShrink={0}
        >
          <InquiryStatusBadge status={inquiry.status} />
          <Text textStyle="labelMonoS" color="contentGrey">
            {formatListDate(inquiry.lastMessageAt)}
          </Text>
        </Flex>
      </Flex>
    </Link>
  )
}

export const InquiryList = ({
  title,
  inquiries,
  isLoading,
  isError,
  role,
  basePath,
  emptyText,
  emptyHint,
  onRetry,
}: InquiryListProps) => {
  return (
    <Container maxW="container.lg" py="32">
      <Text textStyle="labelMono" color="contentGrey" mb="6">
        {role === 'buyer' ? 'Moje konto' : 'Panel hodowcy'}
      </Text>
      <Text textStyle="titleSerifXL" color="contentBlack01" mb="24">
        {title}
      </Text>

      {isLoading && (
        <Flex direction="column" gap="12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="92px" borderRadius="12px" />
          ))}
        </Flex>
      )}

      {isError && !isLoading && (
        <Flex direction="column" align="center" gap="12" py="40">
          <Text textStyle="labelM" color="contentGrey">
            Nie udało się załadować zapytań. Spróbuj ponownie później.
          </Text>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <LuRefreshCw size={15} />
              Spróbuj ponownie
            </Button>
          )}
        </Flex>
      )}

      {!isLoading && !isError && inquiries && inquiries.length === 0 && (
        <Flex direction="column" align="center" gap="12" py="40" textAlign="center">
          <Box as="span" color="contentGrey" display="inline-flex"><LuMessageCircle size={40} /></Box>
          <Text textStyle="titleSBold" color="contentBlack01">
            {emptyText}
          </Text>
          {emptyHint && (
            <Text textStyle="labelM" color="contentGrey" maxW="360px">
              {emptyHint}
            </Text>
          )}
          {role === 'buyer' && (
            <Button variant="solid" size="sm" asChild mt="8">
              <Link to="/catalog">Przeglądaj katalog</Link>
            </Button>
          )}
        </Flex>
      )}

      {!isLoading && !isError && inquiries && inquiries.length > 0 && (
        <Flex direction="column" gap="12">
          {inquiries.map((inquiry) => (
            <InquiryRow
              key={inquiry._id}
              inquiry={inquiry}
              role={role}
              basePath={basePath}
            />
          ))}
        </Flex>
      )}
    </Container>
  )
}
