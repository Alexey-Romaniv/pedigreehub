import { Button, Container, Flex, Skeleton, Text } from '@chakra-ui/react'
import { Link, useParams } from 'react-router-dom'
import { InquiryThreadView, useInquiry } from '@/modules/inquiries'

const BreederInquiryThreadPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: inquiry, isLoading, isError } = useInquiry(id)

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
            <Link to="/breeder/inquiries">Wróć do listy</Link>
          </Button>
        </Flex>
      )}

      {inquiry && (
        <InquiryThreadView key={inquiry._id} inquiry={inquiry} role="breeder" backPath="/breeder/inquiries" />
      )}
    </Container>
  )
}

export default BreederInquiryThreadPage
