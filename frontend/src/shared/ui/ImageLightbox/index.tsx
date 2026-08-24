import { Box, chakra, Dialog, Flex, Image, Portal, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LuChevronLeft, LuChevronRight, LuExternalLink, LuX } from 'react-icons/lu'

export interface LightboxImage {
  src: string
  alt?: string
  /** Подпись под фото — имя файла, номер снимка, что угодно */
  caption?: string
}

export type LightboxSource = LightboxImage | string

interface ImageLightboxProps {
  images: LightboxSource[]
  index: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onIndexChange?: (index: number) => void
}

const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
/** Порог горизонтального свайпа для перехода к соседнему фото */
const SWIPE_NEXT_PX = 60
/** Свайп вниз закрывает просмотр — привычный жест на телефонах */
const SWIPE_CLOSE_PX = 110

// Круглые кнопки поверх фото: 44px — минимальная удобная цель для пальца
const controlBase = {
  w: '44px',
  h: '44px',
  flexShrink: 0,
  bg: '#ffffff2e',
  color: 'white',
  borderRadius: '999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s ease-out',
  _hover: { bg: '#ffffff5c' },
  // Синяя системная обводка на чёрном фоне выглядит чужеродно
  _focusVisible: { outline: '2px solid #ffffff', outlineOffset: '2px' },
}

const ControlButton = chakra('button', { base: controlBase })
const ControlLink = chakra('a', { base: controlBase })
const ThumbButton = chakra('button', {
  base: {
    flexShrink: 0,
    w: '56px',
    h: '56px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'opacity 0.15s ease-out',
  },
})

const normalize = (image: LightboxSource): LightboxImage =>
  typeof image === 'string' ? { src: image } : image

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Полноэкранный просмотр фото: стрелки и клавиатура на десктопе, свайпы и
 * пинч на тач-устройствах, зум колесом и двойным кликом/тапом.
 *
 * Используется для всех изображений платформы — фото объявлений, снимков
 * родителей, фотографий питомника и сканов документов.
 */
export const ImageLightbox = ({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
}: ImageLightboxProps) => {
  const items = images.map(normalize)
  const total = items.length
  const current = items[index]

  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 })
  // Смещение пальца/курсора до отпускания: даёт фото «ехать» за жестом
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [natural, setNatural] = useState({ width: 0, height: 0 })

  const viewportRef = useRef<HTMLDivElement>(null)
  // Активные указатели: один — свайп или панорамирование, два — пинч
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gestureStart = useRef({ x: 0, y: 0, distance: 0, scale: 1, panX: 0, panY: 0 })
  const lastTapAt = useRef(0)
  // Отличает клик по фону (закрыть) от завершения жеста
  const movedRef = useRef(false)

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, x: 0, y: 0 })
    setDrag({ x: 0, y: 0 })
  }, [])

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return
      // Зацикливаем: с последнего фото стрелка «вперёд» ведёт на первое
      const target = (next + total) % total
      resetZoom()
      onIndexChange?.(target)
    },
    [onIndexChange, resetZoom, total]
  )

  // Сброс масштаба при открытии и при смене снимка снаружи
  useEffect(() => {
    resetZoom()
    setNatural({ width: 0, height: 0 })
  }, [index, open, resetZoom])

  // Соседние фото подгружаются заранее — переход стрелкой без пустого кадра.
  // В зависимостях именно ссылки, а не массив: он пересоздаётся каждый рендер
  const nextSrc = total > 1 ? items[(index + 1) % total]?.src : undefined
  const prevSrc = total > 1 ? items[(index - 1 + total) % total]?.src : undefined

  useEffect(() => {
    if (!open) return
    for (const src of [nextSrc, prevSrc]) {
      if (!src) continue
      const preload = new window.Image()
      preload.src = src
    }
  }, [nextSrc, open, prevSrc])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goTo(index - 1)
      if (event.key === 'ArrowRight') goTo(index + 1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, index, open])

  /** Границы панорамирования — за край изображения уехать нельзя */
  const clampPan = useCallback(
    (scale: number, x: number, y: number) => {
      const viewport = viewportRef.current
      if (!viewport || !natural.width || !natural.height) return { x, y }

      const { width: vw, height: vh } = viewport.getBoundingClientRect()
      const fit = Math.min(vw / natural.width, vh / natural.height, 1)
      const shownWidth = natural.width * fit * scale
      const shownHeight = natural.height * fit * scale
      const maxX = Math.max(0, (shownWidth - vw) / 2)
      const maxY = Math.max(0, (shownHeight - vh) / 2)

      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
    },
    [natural.height, natural.width]
  )

  /** Зум к точке экрана: под курсором/пальцем остаётся та же часть снимка */
  const zoomTo = useCallback(
    (nextScale: number, originX?: number, originY?: number) => {
      setZoom((prev) => {
        const scale = clamp(nextScale, 1, MAX_SCALE)
        if (scale === 1) return { scale: 1, x: 0, y: 0 }

        const viewport = viewportRef.current
        let { x, y } = prev

        if (viewport && originX !== undefined && originY !== undefined) {
          const rect = viewport.getBoundingClientRect()
          const dx = originX - (rect.left + rect.width / 2)
          const dy = originY - (rect.top + rect.height / 2)
          const ratio = scale / prev.scale
          x = dx - (dx - prev.x) * ratio
          y = dy - (dy - prev.y) * ratio
        }

        return { scale, ...clampPan(scale, x, y) }
      })
    },
    [clampPan]
  )

  const handlePointerDown = (event: React.PointerEvent) => {
    // Нажатие на стрелку или кнопку — не начало жеста: перехват указателя
    // ломал бы им клик
    if ((event.target as HTMLElement).closest('button, a')) return

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    movedRef.current = false

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gestureStart.current = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        distance: distance(a, b),
        scale: zoom.scale,
        panX: zoom.x,
        panY: zoom.y,
      }
      setDrag({ x: 0, y: 0 })
      return
    }

    gestureStart.current = {
      x: event.clientX,
      y: event.clientY,
      distance: 0,
      scale: zoom.scale,
      panX: zoom.x,
      panY: zoom.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const start = gestureStart.current
      if (!start.distance) return
      movedRef.current = true
      zoomTo((distance(a, b) / start.distance) * start.scale, start.x, start.y)
      return
    }

    const start = gestureStart.current
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true

    if (zoom.scale > 1) {
      // Приближенное фото таскаем, а не листаем
      setZoom((prev) => ({ ...prev, ...clampPan(prev.scale, start.panX + dx, start.panY + dy) }))
      return
    }

    setDrag({ x: dx, y: dy })
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)

    if (zoom.scale > 1 || pointers.current.size > 0) {
      setDrag({ x: 0, y: 0 })
      return
    }

    const { x: dx, y: dy } = drag
    setDrag({ x: 0, y: 0 })

    if (Math.abs(dy) > SWIPE_CLOSE_PX && Math.abs(dy) > Math.abs(dx)) {
      onOpenChange(false)
      return
    }

    if (Math.abs(dx) > SWIPE_NEXT_PX && total > 1) {
      goTo(index + (dx < 0 ? 1 : -1))
      return
    }

    // Тап по фото без движения: второй подряд — зум, одиночный ничего не делает
    if (!movedRef.current) {
      const now = event.timeStamp
      if (now - lastTapAt.current < 300) {
        zoomTo(zoom.scale > 1 ? 1 : DOUBLE_TAP_SCALE, event.clientX, event.clientY)
        lastTapAt.current = 0
      } else {
        lastTapAt.current = now
      }
    }
  }

  const handleWheel = (event: React.WheelEvent) => {
    if (!natural.width) return
    // Экспонента, а не фиксированный шаг: мышь с крупными deltaY и трекпад
    // с мелкими дают одинаково предсказуемое приближение
    zoomTo(zoom.scale * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
  }

  if (!current) return null

  const isZoomed = zoom.scale > 1

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="full"
      motionPreset="scale"
      // Иначе фокус садится на первую кнопку и она открывается с обводкой
      initialFocusEl={() => viewportRef.current}
    >
      <Portal>
        <Dialog.Backdrop bg="#000000" />
        <Dialog.Positioner>
          {/* Фон держим на самом контенте: слой backdrop в этой теме
              отрисовывается бледнее заданного */}
          <Dialog.Content
            bg="#000000f2"
            boxShadow="none"
            w="100vw"
            h="100dvh"
            maxW="none"
            m="0"
            borderRadius="0"
            overflow="hidden"
          >
            <Dialog.Title srOnly>{current.alt || 'Podgląd zdjęcia'}</Dialog.Title>

            <Flex direction="column" h="full">
              {/* Верхняя панель: счётчик и действия */}
              <Flex
                justify="space-between"
                align="center"
                gap="12"
                px="16"
                py="12"
                flexShrink={0}
                color="white"
              >
                <Text textStyle="labelM" color="white" opacity={0.85}>
                  {total > 1 ? `${index + 1} / ${total}` : ''}
                </Text>
                <Flex gap="8" align="center">
                  <ControlLink
                    href={current.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Otwórz oryginał w nowej karcie"
                  >
                    <LuExternalLink size={18} />
                  </ControlLink>
                  <ControlButton
                    type="button"
                    aria-label="Zamknij podgląd"
                    onClick={() => onOpenChange(false)}
                  >
                    <LuX size={20} />
                  </ControlButton>
                </Flex>
              </Flex>

              {/* Область просмотра */}
              <Box
                ref={viewportRef}
                tabIndex={-1}
                outline="none"
                position="relative"
                flex="1"
                minH="0"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                // Жесты обрабатываем сами: браузерный скролл/зум мешал бы свайпу
                touchAction="none"
                userSelect="none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                onDoubleClick={(e) => zoomTo(isZoomed ? 1 : DOUBLE_TAP_SCALE, e.clientX, e.clientY)}
                onClick={(e) => {
                  // Клик мимо фото закрывает; после свайпа/зума — нет
                  if (e.target === e.currentTarget && !movedRef.current) onOpenChange(false)
                }}
              >
                <Image
                  src={current.src}
                  alt={current.alt || ''}
                  maxW="100%"
                  maxH="100%"
                  objectFit="contain"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget
                    setNatural({ width: img.naturalWidth, height: img.naturalHeight })
                  }}
                  transform={`translate3d(${zoom.x + drag.x}px, ${zoom.y + drag.y}px, 0) scale(${zoom.scale})`}
                  transition={drag.x || drag.y ? 'none' : 'transform 0.15s ease-out'}
                  cursor={isZoomed ? 'grab' : 'zoom-in'}
                />

                {/* На тач-экранах листаем свайпом, стрелки только с mouse-указателем */}
                {total > 1 && (
                  <>
                    <ControlButton
                      type="button"
                      aria-label="Poprzednie zdjęcie"
                      onClick={() => goTo(index - 1)}
                      position="absolute"
                      left="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      display={{ base: 'none', md: 'flex' }}
                    >
                      <LuChevronLeft size={22} />
                    </ControlButton>
                    <ControlButton
                      type="button"
                      aria-label="Następne zdjęcie"
                      onClick={() => goTo(index + 1)}
                      position="absolute"
                      right="12px"
                      top="50%"
                      transform="translateY(-50%)"
                      display={{ base: 'none', md: 'flex' }}
                    >
                      <LuChevronRight size={22} />
                    </ControlButton>
                  </>
                )}
              </Box>

              {/* Подпись и миниатюры */}
              <Box flexShrink={0} px="16" pb="16" pt="8">
                {current.caption && (
                  <Text
                    textStyle="labelS"
                    color="white"
                    opacity={0.8}
                    textAlign="center"
                    mb="12"
                    lineClamp={2}
                  >
                    {current.caption}
                  </Text>
                )}
                {total > 1 && (
                  <Flex gap="8" justify="center" overflowX="auto" pb="4">
                    {items.map((item, thumbIndex) => (
                      <ThumbButton
                        key={`${item.src}-${thumbIndex}`}
                        type="button"
                        aria-label={`Zdjęcie ${thumbIndex + 1}`}
                        onClick={() => goTo(thumbIndex)}
                        borderColor={thumbIndex === index ? 'white' : 'transparent'}
                        opacity={thumbIndex === index ? 1 : 0.55}
                        _hover={{ opacity: 1 }}
                      >
                        <Image
                          src={item.src}
                          alt=""
                          w="full"
                          h="full"
                          objectFit="cover"
                          draggable={false}
                        />
                      </ThumbButton>
                    ))}
                  </Flex>
                )}
              </Box>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
