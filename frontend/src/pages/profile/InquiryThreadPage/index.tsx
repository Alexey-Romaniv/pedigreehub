import { useState } from 'react'
import { Box, Button, Container, Flex, Skeleton, Text } from '@chakra-ui/react'
import { Link, useParams } from 'react-router-dom'
import { LuStar } from 'react-icons/lu'
import { InquiryThreadView, useInquiry } from '@/modules/inquiries'
import { ReviewFormDialog, useReviewEligibility } from '@/modules/reviews'

const InquiryThreadPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: inquiry, isLoading, isError } = useInquiry(id)
  const [reviewOpen, setReviewOpen] = useState(false)

  // После подтверждённой покупки покупатель может оставить отзыв заводчику
  const isConfirmed = inquiry?.status === 'purchase_confirmed'
  const breeder =
    inquiry && typeof inquiry.breederId !== 'string' ? inquiry.breederId : null
  const { data: eligibility } = useReviewEligibility(breeder?._id, isConfirmed)

  return (
    <Container maxW="container.lg" py="32">
      {isLoading && (
        <Flex direction="column" gap="16">
          <Skeleton h="104px" borderRadius="12px" />
          <Skeleton h="320px" borderRadius="12px" />
        </Flex>
      )}

      {(isError || (!isLoading && !inquiry)) && (
        <Flex direction="column" align="center" gap="12" py="48" textAlign="center">
          <Text textStyle="titleSBold" color="contentBlack01">
            Zapytanie nie zostało znalezione
          </Text>
          <Text textStyle="labelM" color="contentGrey">
            Zapytanie nie istnieje lub nie masz do niego dostępu.
          </Text>
          <Button variant="outline" size="sm" asChild mt="8">
            <Link to="/profile/inquiries">Wróć do listy</Link>
          </Button>
        </Flex>
      )}

      {inquiry && (
        <>
          <InquiryThreadView
            key={inquiry._id}
            inquiry={inquiry}
            role="buyer"
            backPath="/profile/inquiries"
          />

          {/* CTA отзыва после подтверждённой покупки */}
          {isConfirmed && breeder && eligibility && (
            <Box
              mt="16"
              p="16"
              bg="backgroundGrey"
              borderRadius="12px"
            >
              {eligibility.canReview ? (
                <Flex
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap="12"
                >
                  <Text textStyle="labelM" color="contentBlack01">
                    Jak oceniasz współpracę z hodowcą {breeder.kennelName}?
                  </Text>
                  <Button variant="solid" size="sm" onClick={() => setReviewOpen(true)}>
                    <LuStar size={14} />
                    Wystaw opinię
                  </Button>
                </Flex>
              ) : (
                <Text textStyle="labelM" color="contentGrey">
                  Twoja opinia dla tego hodowcy została już wystawiona. Dziękujemy!
                </Text>
              )}
            </Box>
          )}

          {breeder && (
            <ReviewFormDialog
              open={reviewOpen}
              onOpenChange={setReviewOpen}
              breederId={breeder._id}
              breederName={breeder.kennelName}
            />
          )}
        </>
      )}
    </Container>
  )
}

export default InquiryThreadPage
