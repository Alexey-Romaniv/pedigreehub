import { Box, Text, Flex, Button, Badge, Image } from '@chakra-ui/react'
import { LuDownload, LuExternalLink, LuFile } from 'react-icons/lu'
import { useState } from 'react'

interface Document {
  _id: string
  fileUrl: string
  originalName: string
  mimeType: string
  fileSize?: number
  type?: string
}

interface DocumentViewerProps {
  document: Document | string | null | undefined
  title: string
  required?: boolean
}

export const DocumentViewer = ({ document, title, required }: DocumentViewerProps) => {
  const [showPreview, setShowPreview] = useState(false)

  if (!document) {
    return (
      <Box>
        <Flex align="center" gap="8" mb="8">
          <Text textStyle="labelM" color="contentBlack01">{title}:</Text>
          {required ? (
            <Badge colorPalette="red" size="sm">Brak dokumentu</Badge>
          ) : (
            <Badge colorPalette="gray" size="sm">Nie załączono</Badge>
          )}
        </Flex>
      </Box>
    )
  }

  // Если документ это строка (ID), не можем показать превью
  if (typeof document === 'string') {
    return (
      <Box>
        <Flex align="center" gap="8" mb="8">
          <Text textStyle="labelM" color="contentBlack01">{title}:</Text>
          <Badge colorPalette="green" size="sm">✓ Załączony</Badge>
        </Flex>
      </Box>
    )
  }

  const doc = document as Document
  const isImage = doc.mimeType?.startsWith('image/')
  const isPdf = doc.mimeType === 'application/pdf'

  return (
    <Box mb="16">
      <Flex align="center" gap="8" mb="8">
        <Text textStyle="labelM" color="contentBlack01">{title}:</Text>
        <Badge colorPalette="green" size="sm">✓ Załączony</Badge>
        {doc.fileSize && (
          <Text textStyle="labelS" color="contentGrey">
            ({(doc.fileSize / 1024).toFixed(1)} KB)
          </Text>
        )}
      </Flex>

      <Box
        border="1px solid"
        borderColor="linePrimary"
        borderRadius="8px"
        overflow="hidden"
        bg="backgroundGrey"
      >
        {isImage ? (
          <Box position="relative">
            <Image
              src={doc.fileUrl}
              alt={doc.originalName}
              w="full"
              maxH="400px"
              objectFit="contain"
              cursor="pointer"
              onClick={() => setShowPreview(!showPreview)}
            />
            {showPreview && (
              <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(0,0,0,0.9)"
                zIndex={1000}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p="40"
                onClick={() => setShowPreview(false)}
                cursor="pointer"
              >
                <Image
                  src={doc.fileUrl}
                  alt={doc.originalName}
                  maxW="90%"
                  maxH="90%"
                  objectFit="contain"
                />
              </Box>
            )}
          </Box>
        ) : isPdf ? (
          <Box h="400px">
            <iframe
              src={doc.fileUrl}
              title={doc.originalName}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </Box>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            p="40"
            gap="16"
          >
            <Box
              w="64px"
              h="64px"
              bg="backgroundPrimary"
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LuFile size={32} color="#888888" />
            </Box>
            <Text textStyle="labelM" color="contentGrey" textAlign="center">
              {doc.originalName}
            </Text>
          </Flex>
        )}

        <Flex gap="8" p="12" borderTop="1px solid" borderColor="linePrimary">
          <Button variant="outline" size="sm" flex="1" asChild>
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
              <LuExternalLink size={16} />
              Otwórz
            </a>
          </Button>
          <Button variant="outline" size="sm" flex="1" asChild>
            <a href={doc.fileUrl} download>
              <LuDownload size={16} />
              Pobierz
            </a>
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

