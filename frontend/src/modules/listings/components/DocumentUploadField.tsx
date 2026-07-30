import { Box, Text, Button, Flex } from '@chakra-ui/react'
import { LuUpload, LuX, LuFileText } from 'react-icons/lu'
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { toaster } from '@/shared/theme/toaster'

interface DocumentUploadFieldProps {
  label: string
  file: File | undefined
  onFileChange: (file: File | undefined) => void
}

export const DocumentUploadField = ({ 
  label, 
  file, 
  onFileChange, 
}: DocumentUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Превью строится из файла в форме (раньше локальный state терялся при возврате на шаг)
  const preview = useMemo(() => {
    if (!file) return null
    return file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file)
  }, [file])
  useEffect(() => () => {
    if (preview && preview !== 'pdf') URL.revokeObjectURL(preview)
  }, [preview])
  
  const validateFile = useCallback((file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    
    if (!validTypes.includes(file.type)) {
      toaster.error({ 
        title: 'Nieprawidłowy format pliku', 
        description: `${file.name}: Dozwolone: PDF, JPG, PNG, WebP` 
      })
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toaster.error({ 
        title: 'Plik za duży', 
        description: `${file.name}: Maksymalny rozmiar: 10MB` 
      })
      return false
    }
    return true
  }, [])

  const handleFile = useCallback((selectedFile: File) => {
    if (!validateFile(selectedFile)) return
    onFileChange(selectedFile)
  }, [validateFile, onFileChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  const handleRemove = () => {
    onFileChange(undefined)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <Box>
      <Box
        border="2px dashed"
        borderColor={isDragOver ? 'positive' : 'linePrimary'}
        borderRadius="12px"
        p="16"
        cursor="pointer"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        bg={isDragOver ? 'statusBackgroundGreen' : 'backgroundPrimary'}
        _hover={{ borderColor: 'lineSecondary', bg: 'backgroundGrey' }}
        transition="all 0.2s"
        mb="12"
      >
        <input 
          ref={inputRef} 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png,.webp" 
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
            <Box color="contentGrey" display="inline-flex"><LuFileText size={22} /></Box>
          </Box>
          
          <Box flex="1">
            <Flex align="center" gap="8" mb="4" flexWrap="wrap">
              <Text textStyle="labelMSemibold" color="contentBlack01">{label}</Text>
            </Flex>
            
            <Text textStyle="labelS" color="contentGrey">
              {isDragOver 
                ? 'Upuść plik tutaj...' 
                : file 
                ? file.name 
                : 'Przeciągnij i upuść lub kliknij, aby wybrać (PDF, JPG, PNG, WebP, max. 10MB)'
              }
            </Text>
          </Box>
          
          <Box color="contentGrey">
            <LuUpload size={20} />
          </Box>
        </Flex>
      </Box>

      {file && preview && (
        <Box
          border="1px solid"
          borderColor="linePrimary"
          borderRadius="8px"
          p="12"
          bg="backgroundGrey"
        >
          <Flex gap="12" align="center">
            {preview === 'pdf' ? (
              <Box 
                w="48px" 
                h="48px" 
                bg="statusBackgroundRed" 
                borderRadius="6px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Box color="negative" display="inline-flex"><LuFileText size={24} /></Box>
              </Box>
            ) : (
              <img
                src={preview}
                alt="Preview"
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
              />
            )}
            <Box flex="1" minW="0">
              <Text textStyle="labelS" color="contentBlack01" truncate>
                {file.name}
              </Text>
              <Text textStyle="labelXS" color="contentGrey">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </Box>
            <Button 
              variant="outline" 
              size="xs" 
              colorPalette="red"
              onClick={handleRemove}
            >
              <LuX size={14} /> Usuń
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  )
}

