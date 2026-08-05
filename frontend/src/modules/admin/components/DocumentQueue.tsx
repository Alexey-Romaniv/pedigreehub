import { Box, Text, Flex, Badge, Stack, Spinner } from '@chakra-ui/react'
import { LuFile, LuImage } from 'react-icons/lu'
import type { PendingDocument, DocumentType } from '../types'

interface DocumentQueueProps {
  documents: PendingDocument[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (doc: PendingDocument) => void
}

const typeLabels: Record<DocumentType, string> = {
  zkwp_certificate: 'Zaświadczenie ZKwP',
  identity: 'Dokument tożsamości',
  pedigree: 'Rodowód',
  award: 'Dyplom/Nagroda',
  kennel_photo: 'Zdjęcie hodowli',
  puppy_photo: 'Zdjęcie szczeniaka',
  vet_passport: 'Paszport weterynaryjny',
  metric: 'Metryka',
  other: 'Inny',
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const DocumentQueue = ({
  documents,
  isLoading,
  selectedId,
  onSelect,
}: DocumentQueueProps) => {
  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="lg" color="contentGrey" />
      </Flex>
    )
  }

  if (documents.length === 0) {
    return (
      <Box bg="backgroundGrey" borderRadius="12px" p="40" textAlign="center">
        <Text textStyle="labelL" color="contentGrey">
          Brak dokumentów do weryfikacji
        </Text>
      </Box>
    )
  }

  // Группировка документов по пользователю и типу для индикации
  const getSameTypeCount = (doc: PendingDocument) => {
    return documents.filter(
      d => d.userId._id === doc.userId._id && d.type === doc.type
    ).length
  }

  return (
    <Stack gap="12">
      {documents.map((doc) => {
        const isSelected = doc._id === selectedId
        const isImage = doc.mimeType.startsWith('image/')
        const sameTypeCount = getSameTypeCount(doc)

        return (
          <Box
            key={doc._id}
            bg="backgroundPrimary"
            border="2px solid"
            borderColor={isSelected ? 'contentBlack01' : 'linePrimary'}
            borderRadius="12px"
            p="16"
            cursor="pointer"
            onClick={() => onSelect(doc)}
            transition="border-color 0.2s"
            _hover={{ borderColor: 'lineSecondary' }}
          >
            <Flex justify="space-between" align="flex-start" gap="16">
              <Flex gap="12" flex="1">
                <Box 
                  w="40px" 
                  h="40px" 
                  bg="backgroundGrey" 
                  borderRadius="8px" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  flexShrink={0}
                >
                  {isImage ? <LuImage size={20} color="#888888" /> : <LuFile size={20} color="#888888" />}
                </Box>

                <Box flex="1" minW="0">
                  <Flex align="center" gap="8" mb="4" flexWrap="wrap">
                    <Text textStyle="labelMSemibold" color="contentBlack01">
                      {doc.userId.firstName} {doc.userId.lastName}
                    </Text>
                    <Badge colorPalette="gray" size="sm">
                      {typeLabels[doc.type]}
                    </Badge>
                    {sameTypeCount > 1 && (
                      <Badge colorPalette="blue" size="sm">
                        {sameTypeCount} {sameTypeCount === 1 ? 'plik' : 'plików'}
                      </Badge>
                    )}
                  </Flex>

                  <Text textStyle="labelS" color="contentGrey" mb="4" truncate>
                    {doc.originalName}
                  </Text>

                  <Flex gap="16" flexWrap="wrap">
                    <Text textStyle="labelS" color="contentGrey">
                      {formatDate(doc.createdAt)}
                    </Text>
                    <Text textStyle="labelS" color="contentGrey">
                      {formatFileSize(doc.fileSize)}
                    </Text>
                    <Text textStyle="labelS" color="contentGrey">
                      {doc.userId.email}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Box>
        )
      })}
    </Stack>
  )
}
