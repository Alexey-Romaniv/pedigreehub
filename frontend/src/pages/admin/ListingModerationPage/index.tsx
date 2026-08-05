import { Box, Container, Text, Flex } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi } from '@/modules/admin/api'
import { ListingQueue, AdminListingPreview, ListingFilters } from '@/modules/admin/components'
import type { AdminListing, ListingModerationFilters } from '@/modules/admin/types'
import { toaster } from '@/shared/theme/toaster'

const ListingModerationPage = () => {
  const queryClient = useQueryClient()
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null)
  const [filters, setFilters] = useState<ListingModerationFilters>({ status: 'pending' })

  const { data, isLoading } = useQuery({
    queryKey: ['adminListings', filters],
    queryFn: () => adminApi.getPendingListings(filters),
  })

  const approveMutation = useMutation({
    mutationFn: adminApi.approveListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminListings'] })
      toaster.success({ title: 'Ogłoszenie zatwierdzone' })
      setSelectedListing(null)
    },
    onError: () => {
      toaster.error({ title: 'Błąd zatwierdzania' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      adminApi.rejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminListings'] })
      toaster.success({ title: 'Ogłoszenie odrzucone' })
      setSelectedListing(null)
    },
    onError: () => {
      toaster.error({ title: 'Błąd odrzucania' })
    },
  })

  const response = data?.data as { data: AdminListing[]; pagination?: { total: number } } | undefined
  const listings = response?.data || []
  const total = response?.pagination?.total || listings.length

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
              Moderacja ogłoszeń
            </Text>
            <Text textStyle="labelL" color="contentGrey">
              {total} ogłoszeń {filters.status === 'pending' ? 'oczekuje' : filters.status === 'all' ? 'łącznie' : 'w statusie'}
            </Text>
          </Box>
        </Flex>

        {/* Filters */}
        <Box mb="24">
          <ListingFilters filters={filters} onFiltersChange={setFilters} />
        </Box>

        {/* Content */}
        <Flex gap="24" direction={{ base: 'column', lg: 'row' }}>
          {/* Queue */}
          <Box flex="1" minW="0">
            <ListingQueue
              listings={listings}
              isLoading={isLoading}
              selectedId={selectedListing?._id || null}
              onSelect={setSelectedListing}
            />
          </Box>

          {/* Preview */}
          <Box w={{ base: 'full', lg: '500px' }} flexShrink={0}>
            <Box position="sticky" top="24">
              <AdminListingPreview
                listing={selectedListing}
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

export default ListingModerationPage

