import { IconButton } from '@chakra-ui/react'
import { LuHeart } from 'react-icons/lu'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { useFavoriteIds, useToggleFavorite } from '@/shared/api'

interface FavoriteButtonProps {
  listingId: string
  size?: 'xs' | 'sm' | 'md'
}

// Сердечко «в избранное»: аноним отправляется на /login, клики не всплывают
// (кнопка живёт внутри <Link> карточки)
export const FavoriteButton = ({ listingId, size = 'sm' }: FavoriteButtonProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()

  const { data: favoriteIds } = useFavoriteIds()
  const toggle = useToggleFavorite()

  const isFavorite = !!favoriteIds?.includes(listingId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    toggle.mutate({ listingId, favorite: !isFavorite })
  }

  return (
    <IconButton
      aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
      size={size}
      variant="solid"
      bg="backgroundPrimary"
      color={isFavorite ? 'contentBlack01' : 'contentGrey'}
      borderRadius="full"
      border="1px solid"
      borderColor="linePrimary"
      _hover={{ bg: 'backgroundGrey' }}
      onClick={handleClick}
    >
      <LuHeart fill={isFavorite ? 'currentColor' : 'none'} />
    </IconButton>
  )
}
