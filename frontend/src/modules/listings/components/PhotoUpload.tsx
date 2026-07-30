import { Box, Stack, Text, Button, Flex } from '@chakra-ui/react'
import { LuUpload, LuX, LuImage } from 'react-icons/lu'
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { toaster } from '@/shared/theme/toaster'

interface PhotoUploadProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  minPhotos?: number
  maxPhotos?: number
  /** Уже сохранённые фото (URL) — режим редактирования */
  existingPhotos?: string[]
  onRemoveExisting?: (url: string) => void
}

export const PhotoUpload = ({
  photos,
  onPhotosChange,
  minPhotos = 3,
  maxPhotos = 10,
  existingPhotos = [],
  onRemoveExisting,
}: PhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const totalCount = existingPhotos.length + photos.length

  // Превью по индексу из массива формы: переживают навигацию между шагами,
  // дубликаты файлов не конфликтуют (раньше ключ name+size ломал их)
  const previews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos])
  useEffect(() => () => {
    previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])
  
  const validateFiles = useCallback((files: File[]): File[] => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    const validFiles: File[] = []
    
    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        toaster.error({ 
          title: 'Nieprawidłowy format pliku', 
          description: `${file.name}: Dozwolone: JPG, PNG, WebP` 
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toaster.error({ 
          title: 'Plik za duży', 
          description: `${file.name}: Maksymalny rozmiar: 5MB` 
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

    if (existingPhotos.length + photos.length + validFiles.length > maxPhotos) {
      toaster.error({
        title: 'Za dużo zdjęć',
        description: `Maksymalnie ${maxPhotos} zdjęć`
      })
      return
    }

    onPhotosChange([...photos, ...validFiles])
  }, [photos, existingPhotos.length, maxPhotos, validateFiles, onPhotosChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
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
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  const handleClick = () => {
    if (totalCount < maxPhotos) {
      inputRef.current?.click()
    }
  }

  return (
    <Box>
      <Box
        border="2px dashed"
        borderColor={isDragOver ? 'positive' : 'linePrimary'}
        borderRadius="12px"
        p="16"
        cursor={totalCount >= maxPhotos ? 'default' : 'pointer'}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        bg={isDragOver ? 'statusBackgroundGreen' : 'backgroundPrimary'}
        _hover={totalCount < maxPhotos ? { borderColor: 'lineSecondary', bg: 'backgroundGrey' } : undefined}
        transition="all 0.2s"
        mb="12"
      >
        <input 
          ref={inputRef} 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
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
            <Box color="contentGrey" display="inline-flex"><LuImage size={22} /></Box>
          </Box>
          
          <Box flex="1">
            <Flex align="center" gap="8" mb="4" flexWrap="wrap">
              <Text textStyle="labelMSemibold" color="contentBlack01">Zdjęcia szczenięcia</Text>
              <Text textStyle="labelMonoS" color="contentGrey">
                {totalCount}/{maxPhotos}
              </Text>
            </Flex>

            <Text textStyle="labelS" color="contentGrey">
              {isDragOver
                ? 'Upuść zdjęcia tutaj...'
                : totalCount >= maxPhotos
                ? `Osiągnięto maksimum ${maxPhotos} zdjęć`
                : `Przeciągnij i upuść lub kliknij, aby wybrać (min. ${minPhotos}, max. ${maxPhotos})`
              }
            </Text>
          </Box>

          {totalCount < maxPhotos && (
            <Box color="contentGrey">
              <LuUpload size={20} />
            </Box>
          )}
        </Flex>
      </Box>

      {totalCount > 0 && (
        <Stack gap="8">
          <Flex gap="12" flexWrap="wrap">
            {/* Уже сохранённые фото (URL) — первые в списке, «Główne» = первое общее */}
            {existingPhotos.map((url, index) => (
              <Box
                key={url}
                position="relative"
                w="120px"
                h="120px"
                borderRadius="8px"
                overflow="hidden"
                border="1px solid"
                borderColor="linePrimary"
                bg="backgroundGrey"
              >
                <img
                  src={url}
                  alt={`Zapisane zdjęcie ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {index === 0 && (
                  <Box
                    position="absolute"
                    top="4"
                    left="4"
                    bg="contentBlack01"
                    borderRadius="full"
                    px="8"
                    py="2"
                  >
                    <Text textStyle="labelMonoS" color="backgroundPrimary" textTransform="uppercase">
                      Główne
                    </Text>
                  </Box>
                )}
                {onRemoveExisting && (
                  <Button
                    position="absolute"
                    top="4"
                    right="4"
                    size="xs"
                    variant="solid"
                    colorPalette="red"
                    onClick={() => onRemoveExisting(url)}
                    aria-label={`Usuń zapisane zdjęcie ${index + 1}`}
                  >
                    <LuX size={14} />
                  </Button>
                )}
              </Box>
            ))}
            {photos.map((_photo, index) => {
              const preview = previews[index]
              return (
                <Box
                  key={index}
                  position="relative"
                  w="120px"
                  h="120px"
                  borderRadius="8px"
                  overflow="hidden"
                  border="1px solid"
                  borderColor="linePrimary"
                  bg="backgroundGrey"
                >
                  <img
                    src={preview}
                    alt={`Podgląd ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {existingPhotos.length === 0 && index === 0 && (
                    <Box
                      position="absolute"
                      top="4"
                      left="4"
                      bg="contentBlack01"
                      borderRadius="full"
                      px="8"
                      py="2"
                    >
                      <Text textStyle="labelMonoS" color="backgroundPrimary" textTransform="uppercase">
                        Główne
                      </Text>
                    </Box>
                  )}
                  <Button
                    position="absolute"
                    top="4"
                    right="4"
                    size="xs"
                    variant="solid"
                    colorPalette="red"
                    onClick={() => handleRemove(index)}
                    aria-label={`Usuń zdjęcie ${index + 1}`}
                  >
                    <LuX size={14} />
                  </Button>
                </Box>
              )
            })}
          </Flex>
        </Stack>
      )}
    </Box>
  )
}

