import { Flex, Button, Input } from '@chakra-ui/react'
import type { ListingModerationFilters, ListingStatus } from '../types'

interface ListingFiltersProps {
  filters: ListingModerationFilters
  onFiltersChange: (filters: ListingModerationFilters) => void
}

const statusFilters: { type: ListingStatus; label: string }[] = [
  { type: 'all', label: 'Wszystkie' },
  { type: 'pending', label: 'Oczekujące' },
  { type: 'active', label: 'Aktywne' },
  { type: 'rejected', label: 'Odrzucone' },
]

export const ListingFilters = ({ filters, onFiltersChange }: ListingFiltersProps) => {
  const handleStatusChange = (status: ListingStatus) => {
    onFiltersChange({ ...filters, status, page: 1 })
  }

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined, page: 1 })
  }

  return (
    <Flex gap="16" direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
      <Flex gap="8" flexWrap="wrap">
        {statusFilters.map(({ type, label }) => (
          <Button
            key={type}
            variant={filters.status === type ? 'solid' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange(type)}
          >
            {label}
          </Button>
        ))}
      </Flex>
      <Input
        placeholder="Szukaj po tytule lub rasie..."
        value={filters.search || ''}
        onChange={(e) => handleSearchChange(e.target.value)}
        maxW={{ base: 'full', md: '300px' }}
        size="sm"
      />
    </Flex>
  )
}

