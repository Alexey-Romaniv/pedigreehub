import { Box, Image, Text } from '@chakra-ui/react'

interface UserAvatarProps {
  firstName?: string
  lastName?: string
  avatar?: string
  /** Размер в px (квадрат) */
  size?: number
  /** textStyle инициалов — подобран под размер */
  initialsStyle?: string
}

// Один аватар для сайдбара, хедера и профиля: фото либо инициалы на тёмном круге
export const UserAvatar = ({
  firstName,
  lastName,
  avatar,
  size = 40,
  initialsStyle = 'labelMBold',
}: UserAvatarProps) => (
  <Box
    w={`${size}px`}
    h={`${size}px`}
    borderRadius="full"
    bg="contentBlack01"
    flexShrink={0}
    overflow="hidden"
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    {avatar ? (
      <Image src={avatar} alt="Zdjęcie profilowe" w="full" h="full" objectFit="cover" />
    ) : (
      <Text textStyle={initialsStyle} color="white">
        {firstName?.[0]}
        {lastName?.[0]}
      </Text>
    )}
  </Box>
)
