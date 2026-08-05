import { Flex, Button } from '@chakra-ui/react'
import type { DocumentType } from '../types'

interface DocumentFiltersProps {
  selectedType: DocumentType | null
  onTypeChange: (type: DocumentType | null) => void
}

const filters: { type: DocumentType | null; label: string }[] = [
  { type: null, label: 'Wszystkie' },
  { type: 'zkwp_certificate', label: 'ZKwP' },
  { type: 'identity', label: 'Tożsamość' },
  { type: 'pedigree', label: 'Rodowody' },
  { type: 'award', label: 'Nagrody' },
  { type: 'vet_passport', label: 'Paszporty wet.' },
  { type: 'metric', label: 'Metryki' },
  { type: 'kennel_photo', label: 'Zdjęcia hodowli' },
  { type: 'puppy_photo', label: 'Zdjęcia szczeniąt' },
  { type: 'other', label: 'Inne' },
]

export const DocumentFilters = ({ selectedType, onTypeChange }: DocumentFiltersProps) => {
  return (
    <Flex gap="8" flexWrap="wrap">
      {filters.map(({ type, label }) => (
        <Button
          key={type ?? 'all'}
          variant={selectedType === type ? 'solid' : 'outline'}
          size="sm"
          onClick={() => onTypeChange(type)}
        >
          {label}
        </Button>
      ))}
    </Flex>
  )
}
