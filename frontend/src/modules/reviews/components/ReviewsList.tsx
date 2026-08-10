import { Box, Flex, Skeleton, Text } from '@chakra-ui/react'
import type { Review, ReviewBuyerPreview } from '../types'
import { StarRating } from './StarRating'

const getBuyer = (value: Review['buyerId']): ReviewBuyerPreview | null =>
  typeof value === 'string' || value === null ? null : value

const formatReviewDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

// «Jan K.» — фамилия до инициала, приватность в публичном списке
const buyerDisplayName = (buyer: ReviewBuyerPreview | null): string => {
  if (!buyer) return 'Kupujący'
  const initial = buyer.lastName ? ` ${buyer.lastName.charAt(0)}.` : ''
  return `${buyer.firstName}${initial}`
}

interface ReviewsListProps {
  reviews: Review[]
  isLoading?: boolean
}

export const ReviewsList = ({ reviews, isLoading }: ReviewsListProps) => {
  if (isLoading) {
    return (
      <Flex direction="column" gap="12">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} h="96px" borderRadius="12px" />
        ))}
      </Flex>
    )
  }

  if (reviews.length === 0) {
    return (
      <Box bg="backgroundGrey" borderRadius="12px" p="32" textAlign="center">
        <Text textStyle="labelM" color="contentGrey">
          Ten hodowca nie ma jeszcze opinii.
        </Text>
      </Box>
    )
  }

  return (
    <Flex direction="column" gap="12">
      {reviews.map((review) => {
        const buyer = getBuyer(review.buyerId)
        return (
          <Box
            key={review._id}
            p="16"
            bg="backgroundPrimary"
            border="1px solid"
            borderColor="linePrimary"
            borderRadius="12px"
          >
            <Flex justify="space-between" align="center" mb="8" gap="12" wrap="wrap">
              <Flex align="center" gap="12">
                <Text textStyle="labelMSemibold" color="contentBlack01">
                  {buyerDisplayName(buyer)}
                </Text>
                <StarRating value={review.rating} size={14} />
              </Flex>
              <Text textStyle="labelXS" color="contentGrey">
                {formatReviewDate(review.createdAt)}
              </Text>
            </Flex>
            <Text textStyle="labelM" color="contentBlack01" whiteSpace="pre-wrap">
              {review.text}
            </Text>
          </Box>
        )
      })}
    </Flex>
  )
}
