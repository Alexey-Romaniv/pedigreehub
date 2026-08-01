import { Box, Stack, Text, Button, Flex, Spinner } from '@chakra-ui/react'
import { 
  LuUpload, LuCheck, LuX, LuClock, LuEye
} from 'react-icons/lu'
import { useRef, useState, useCallback } from 'react'
import type { DocumentInfo } from '../api'
import { StatusPill } from '@/shared/ui'
import { toaster } from '@/shared/theme/toaster'

interface DocumentUploadMultipleProps {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  documentType: string
  existingDocs: DocumentInfo[]
  isUploading?: boolean
  onUpload: (files: File[], type: string) => void
  onRemove: (doc: DocumentInfo) => void
}

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'approved') return <StatusPill label="Zatwierdzony" tone="default" icon={LuCheck} />
  if (status === 'rejected') return <StatusPill label="Odrzucony" tone="negative" icon={LuX} />
  return <StatusPill label="W trakcie weryfikacji" tone="muted" icon={LuClock} />
}

// Польская плюрализация: 1 plik, 2–4 pliki, 5+ plików (с учётом 12–14)
const pluralPliki = (n: number) => {
  if (n === 1) return 'plik'
  const d = n % 10
  const h = n % 100
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'pliki'
  return 'plików'
}

export const DocumentUploadMultiple = ({ 
  icon: Icon, title, description, badge, documentType,
  existingDocs, isUploading, onUpload, onRemove,
}: DocumentUploadMultipleProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleClick = () => {
    if (!isUploading) inputRef.current?.click()
  }
  
  const validateFiles = useCallback((files: File[]): File[] => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    const validFiles: File[] = []
    
    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        toaster.error({ 
          title: 'Nieprawidłowy format pliku', 
          description: `${file.name}: Dozwolone: PDF, JPG, PNG, WebP` 
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toaster.error({ 
          title: 'Plik za duży', 
          description: `${file.name}: Maksymalny rozmiar: 10MB` 
        })
        return
      }
      validFiles.push(file)
    })
    
    return validFiles
  }, [])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    const validFiles = validateFiles(fileArray)
    
    if (validFiles.length > 0) {
      onUpload(validFiles, documentType)
    }
  }, [documentType, onUpload, validateFiles])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isUploading) setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (isUploading) return
    handleFiles(e.dataTransfer.files)
  }

  const handlePreview = (e: React.MouseEvent, doc: DocumentInfo) => {
    e.stopPropagation()
    if (doc?.fileUrl) window.open(doc.fileUrl, '_blank')
  }

  const approvedCount = existingDocs.filter(d => d.status === 'approved').length
  const pendingCount = existingDocs.filter(d => d.status === 'pending').length
  const rejectedCount = existingDocs.filter(d => d.status === 'rejected').length

  return (
    <Box>
      {/* Заголовок секции */}
      <Box
        border="2px dashed"
        borderColor={isDragOver ? 'positive' : 'linePrimary'}
        borderRadius="12px"
        p="16"
        cursor={isUploading ? 'default' : 'pointer'}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        bg={isDragOver ? 'statusBackgroundGreen' : 'backgroundPrimary'}
        opacity={isUploading ? 0.7 : 1}
        _hover={!isUploading ? { borderColor: 'lineSecondary', bg: 'backgroundGrey' } : undefined}
        transition="all 0.2s"
        mb="12"
      >
        <input 
          ref={inputRef} 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png,.webp" 
          multiple
          onChange={handleChange} 
          style={{ display: 'none' }} 
        />
        
        <Flex gap="16" align="flex-start">
          <Box 
            w="44px" h="44px" 
            bg="backgroundGrey" 
            borderRadius="10px" 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            flexShrink={0}
          >
            {isUploading ? (
              <Spinner size="sm" color="contentGrey" />
            ) : (
              <Box color="contentGrey" display="inline-flex"><Icon size={22} /></Box>
            )}
          </Box>
          
          <Box flex="1">
            <Flex align="center" gap="8" mb="4" flexWrap="wrap">
              <Text textStyle="labelMSemibold" color="contentBlack01">{title}</Text>
              {badge && <StatusPill label={badge} tone="muted" />}
              {existingDocs.length > 0 && (
                <Text textStyle="labelMonoS" color="contentGrey">
                  {existingDocs.length} {pluralPliki(existingDocs.length)}
                </Text>
              )}
            </Flex>
            
            {isUploading ? (
              <Text textStyle="labelS" color="contentGrey">Przesyłanie...</Text>
            ) : (
              <Text textStyle="labelS" color="contentGrey">
                {isDragOver ? 'Upuść pliki tutaj...' : description}
              </Text>
            )}
          </Box>
          
          {!isUploading && (
            <Box color="contentGrey">
              <LuUpload size={20} />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Список загруженных документов */}
      {existingDocs.length > 0 && (
        <Stack gap="8">
          {/* Статистика */}
          {(approvedCount > 0 || pendingCount > 0 || rejectedCount > 0) && (
            <Flex gap="12" flexWrap="wrap" mb="4">
              {approvedCount > 0 && (
                <Text textStyle="labelS" color="positive">
                  ✓ {approvedCount} {approvedCount === 1 ? 'zatwierdzony' : pluralPliki(approvedCount) === 'pliki' ? 'zatwierdzone' : 'zatwierdzonych'}
                </Text>
              )}
              {pendingCount > 0 && (
                <Text textStyle="labelS" color="contentGrey">
                  ⏳ {pendingCount} w trakcie
                </Text>
              )}
              {rejectedCount > 0 && (
                <Text textStyle="labelS" color="statusTextRed">
                  ✗ {rejectedCount} {rejectedCount === 1 ? 'odrzucony' : pluralPliki(rejectedCount) === 'pliki' ? 'odrzucone' : 'odrzuconych'}
                </Text>
              )}
            </Flex>
          )}

          {/* Документы */}
          {existingDocs.map((doc) => {
            const isApproved = doc.status === 'approved'
            const isRejected = doc.status === 'rejected'
            
            return (
              <Box
                key={doc._id}
                border="1px solid"
                borderColor={isApproved ? 'positive' : isRejected ? 'statusTextRed' : 'linePrimary'}
                borderRadius="8px"
                p="12"
                bg={isApproved ? 'statusBackgroundGreen' : isRejected ? 'statusBackgroundRed' : 'backgroundGrey'}
              >
                <Flex gap="12" align="flex-start">
                  <Box flex="1" minW="0">
                    <Flex align="center" gap="8" mb="4" flexWrap="wrap">
                      <Text textStyle="labelS" color="contentBlack01" flex="1" truncate>
                        {doc.originalName || doc.fileName}
                      </Text>
                      <StatusBadge status={doc.status} />
                    </Flex>
                    
                    {isRejected && doc.rejectionReason && (
                      <Box mt="4" p="6" bg="statusBackgroundRed" borderRadius="4px" mb="8">
                        <Text textStyle="labelS" color="statusTextRed">
                          Powód: {doc.rejectionReason}
                        </Text>
                      </Box>
                    )}

                    <Flex gap="8" flexWrap="wrap">
                      <Button variant="outline" size="xs" onClick={(e) => handlePreview(e, doc)}>
                        <LuEye size={14} /> Podgląd
                      </Button>
                      {doc.status !== 'approved' && (
                        <Button 
                          variant="outline" 
                          size="xs" 
                          color="negative" 
                          borderColor="negative"
                          onClick={(e) => { e.stopPropagation(); onRemove(doc) }}
                        >
                          <LuX size={14} /> Usuń
                        </Button>
                      )}
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

