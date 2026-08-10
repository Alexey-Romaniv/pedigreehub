import { Flex } from '@chakra-ui/react'
import { LuStar } from 'react-icons/lu'

interface StarRatingProps {
  value: number
  size?: number
  // Интерактивный режим (форма отзыва)
  onChange?: (value: number) => void
}

// Нейтральные звёзды по конвенции темы: заполненные — чёрные, пустые — серые
export const StarRating = ({ value, size = 16, onChange }: StarRatingProps) => {
  return (
    <Flex gap="2" role={onChange ? 'radiogroup' : undefined} aria-label="Ocena">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        const common = {
          size,
          fill: filled ? 'currentColor' : 'none',
        }
        if (!onChange) {
          return (
            <Flex key={star} color={filled ? 'contentBlack01' : 'contentGrey'} align="center">
              <LuStar {...common} />
            </Flex>
          )
        }
        return (
          <Flex
            key={star}
            asChild
            color={filled ? 'contentBlack01' : 'contentGrey'}
            align="center"
            cursor="pointer"
            p="2"
          >
            <button
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} z 5`}
              onClick={() => onChange(star)}
            >
              <LuStar {...common} />
            </button>
          </Flex>
        )
      })}
    </Flex>
  )
}
