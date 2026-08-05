import { Box, Container, Text, Flex } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi } from '@/modules/admin/api'
import { DocumentQueue, DocumentPreview, DocumentFilters } from '@/modules/admin/components'
import type { PendingDocument, DocumentType } from '@/modules/admin/types'
import { toaster } from '@/shared/theme/toaster'

const VerificationPage = () => {
  const queryClient = useQueryClient()
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null)
  const [filterType, setFilterType] = useState<DocumentType | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pendingDocuments', filterType],
    queryFn: () => adminApi.getPendingDocuments({ type: filterType ?? undefined }),
  })

  const approveMutation = useMutation({
    mutationFn: adminApi.approveDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] })
      toaster.success({ title: 'Dokument zatwierdzony' })
      setSelectedDoc(null)
    },
    onError: () => {
      toaster.error({ title: 'Błąd zatwierdzania' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      adminApi.rejectDocument(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] })
      toaster.success({ title: 'Dokument odrzucony' })
      setSelectedDoc(null)
    },
    onError: () => {
      toaster.error({ title: 'Błąd odrzucania' })
    },
  })

  const response = data?.data as { data: PendingDocument[]; pagination?: { total: number } } | undefined
  const documents = response?.data || []
  const total = response?.pagination?.total || documents.length

  const handleApprove = (id: string) => {
    approveMutation.mutate(id)
  }

  const handleReject = (id: string, reason?: string) => {
    rejectMutation.mutate({ id, reason })
  }

  return (
    <Box bg="backgroundPrimary" minH="100vh" py="32">
      <Container maxW="container.xl">
        {/* Header */}
        <Flex justify="space-between" align="center" mb="24">
          <Box>
            <Text textStyle="displayXLBold" color="contentBlack01" mb="4">
              Weryfikacja dokumentów
            </Text>
            <Text textStyle="labelL" color="contentGrey">
              {total} dokumentów oczekuje na weryfikację
            </Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Box mb="24">
          <DocumentFilters 
            selectedType={filterType} 
            onTypeChange={setFilterType} 
          />
        </Box>

        {/* Content */}
        <Flex gap="24" direction={{ base: 'column', lg: 'row' }}>
          {/* Queue */}
          <Box flex="1" minW="0">
            <DocumentQueue
              documents={documents}
              isLoading={isLoading}
              selectedId={selectedDoc?._id || null}
              onSelect={setSelectedDoc}
            />
          </Box>

          {/* Preview */}
          <Box w={{ base: 'full', lg: '500px' }} flexShrink={0}>
            <Box position="sticky" top="24">
              <DocumentPreview
                document={selectedDoc}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default VerificationPage
