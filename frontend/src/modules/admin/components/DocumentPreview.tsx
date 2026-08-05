import { Box, Text, Flex, Button, Badge, Textarea, Stack } from '@chakra-ui/react'
import { LuCheck, LuX, LuDownload, LuExternalLink } from 'react-icons/lu'
import { useState } from 'react'
import type { PendingDocument, DocumentType } from '../types'

interface DocumentPreviewProps {
  document: PendingDocument | null
  onApprove: (id: string) => void
  onReject: (id: string, reason?: string) => void
  isApproving: boolean
  isRejecting: boolean
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

export const DocumentPreview = ({
  document,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: DocumentPreviewProps) => {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!document) {
    return (
      <Box 
        bg="backgroundGrey" 
        borderRadius="12px" 
        h="full" 
        minH="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text textStyle="labelL" color="contentGrey">
          Wybierz dokument z listy
        </Text>
      </Box>
    )
  }

  const isImage = document.mimeType.startsWith('image/')
  const isPdf = document.mimeType === 'application/pdf'

  const handleReject = () => {
    onReject(document._id, rejectReason || undefined)
    setRejectReason('')
    setShowRejectForm(false)
  }

  return (
    <Box
      bg="backgroundPrimary"
      border="1px solid"
      borderColor="linePrimary"
      borderRadius="12px"
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p="16" borderBottom="1px solid" borderColor="linePrimary">
        <Flex justify="space-between" align="flex-start" mb="12">
          <Box>
            <Text textStyle="titleMBold" color="contentBlack01" mb="4">
              {document.userId.firstName} {document.userId.lastName}
            </Text>
            <Badge colorPalette="gray" size="sm">
              {typeLabels[document.type]}
            </Badge>
          </Box>
          <Button variant="ghost" size="sm" asChild>
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
              <LuExternalLink size={16} />
            </a>
          </Button>
        </Flex>
        <Text textStyle="labelS" color="contentGrey">
          {document.originalName}
        </Text>
      </Box>

      {/* Actions */}
      <Box p="16" borderBottom="1px solid" borderColor="linePrimary">
        {showRejectForm ? (
          <Stack gap="12">
            <Textarea
              placeholder="Powód odrzucenia (opcjonalnie)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
            />
            <Flex gap="8">
              <Button 
                variant="outline" 
                flex="1"
                onClick={() => setShowRejectForm(false)}
              >
                Anuluj
              </Button>
              <Button
                variant="solid"
                flex="1"
                bg="negative"
                onClick={handleReject}
                loading={isRejecting}
              >
                <LuX size={16} />
                Odrzuć
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Flex gap="12">
            <Button
              variant="outline"
              flex="1"
              onClick={() => setShowRejectForm(true)}
            >
              <LuX size={16} />
              Odrzuć
            </Button>
            <Button
              variant="solid"
              flex="1"
              bg="positive"
              color="white"
              onClick={() => onApprove(document._id)}
              loading={isApproving}
            >
              <LuCheck size={16} />
              Zatwierdź
            </Button>
          </Flex>
        )}
      </Box>

      {/* Preview */}
      <Box flex="1" p="16" overflow="auto" bg="backgroundGrey">
        {isImage ? (
          <img
            src={document.fileUrl}
            alt={document.originalName}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        ) : isPdf ? (
          <iframe
            src={document.fileUrl}
            title={document.originalName}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              border: 'none',
              borderRadius: '8px',
            }}
          />
        ) : (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="full"
            gap="16"
          >
            <Text textStyle="labelL" color="contentGrey">
              Podgląd niedostępny
            </Text>
            <Button variant="outline" asChild>
              <a href={document.fileUrl} download>
                <LuDownload size={16} />
                Pobierz plik
              </a>
            </Button>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
