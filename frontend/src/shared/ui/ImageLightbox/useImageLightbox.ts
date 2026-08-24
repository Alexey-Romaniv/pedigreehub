import { useCallback, useState } from 'react'
import type { LightboxSource } from '.'

/**
 * Состояние просмотрщика: `openAt(index)` вешаем на клик по фото,
 * `lightboxProps` разворачиваем в <ImageLightbox {...lightboxProps} />.
 */
export const useImageLightbox = (images: LightboxSource[]) => {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const openAt = useCallback((next = 0) => {
    setIndex(next)
    setOpen(true)
  }, [])

  return {
    openAt,
    isOpen: open,
    lightboxProps: {
      images,
      index,
      open,
      onOpenChange: setOpen,
      onIndexChange: setIndex,
    },
  }
}
