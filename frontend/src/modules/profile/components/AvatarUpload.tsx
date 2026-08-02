import { useRef } from 'react'
import { Avatar, Box, Button, Flex, Text } from '@chakra-ui/react'
import { LuTrash2, LuUpload } from 'react-icons/lu'
import { toaster } from '@/shared/theme/toaster'
import { useAvatar } from '../hooks'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // как limit multera на backendzie

interface AvatarUploadProps {
  firstName?: string
  lastName?: string
  avatar?: string
}

export const AvatarUpload = ({ firstName, lastName, avatar }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, remove } = useAvatar()

  const isBusy = upload.isPending || remove.isPending

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toaster.error({
        title: 'Nieprawidłowy format pliku',
        description: 'Dozwolone: JPG, PNG, WebP',
      })
      return
    }
    if (file.size > MAX_SIZE) {
      toaster.error({ title: 'Plik za duży', description: 'Maksymalny rozmiar: 2MB' })
      return
    }
    upload.mutate(file)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) handleFile(file)
    event.target.value = ''
  }

  return (
    <Flex gap="20" align="center" wrap="wrap">
      <Avatar.Root size="2xl">
        {avatar && <Avatar.Image src={avatar} alt="Zdjęcie profilowe" />}
        <Avatar.Fallback>
          {firstName?.[0]}
          {lastName?.[0]}
        </Avatar.Fallback>
      </Avatar.Root>

      <Box>
        <Flex gap="12" wrap="wrap" mb="8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={upload.isPending}
            disabled={isBusy}
          >
            <LuUpload size={16} />
            {avatar ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
          </Button>
          {avatar && (
            <Button
              variant="ghost"
              size="sm"
              color="contentGrey"
              onClick={() => remove.mutate()}
              loading={remove.isPending}
              disabled={isBusy}
            >
              <LuTrash2 size={16} />
              Usuń
            </Button>
          )}
        </Flex>
        <Text textStyle="labelS" color="contentGrey">
          JPG, PNG lub WebP, maksymalnie 2MB
        </Text>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </Flex>
  )
}
