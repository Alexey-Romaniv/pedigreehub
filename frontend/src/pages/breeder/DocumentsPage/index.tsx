import { Box, Container, Text, VStack } from '@chakra-ui/react'
import { VerificationDocuments } from '@/modules/profile'

const DocumentsPage = () => {
  return (
    <Box bg="backgroundPrimary" minH="100vh" py="40">
      <Container maxW="container.md">
        <VStack gap="24" align="stretch">
          <Box>
            <Text textStyle="labelMono" color="contentGrey" mb="6">
              Panel hodowcy
            </Text>
            <Text textStyle="titleSerifXL" color="contentBlack01" mb="8">
              Dokumenty weryfikacyjne
            </Text>
            <Text textStyle="labelM" color="contentGrey">
              Prześlij dokumenty, aby zweryfikować swój profil hodowcy
            </Text>
          </Box>
          <VerificationDocuments />
        </VStack>
      </Container>
    </Box>
  )
}

export default DocumentsPage



