import { useMemo, useState } from 'react'
import { Box, Combobox, Flex, Portal, Spinner, Text, chakra, createListCollection } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { useBreeds } from '@/shared/api'

interface BreedComboboxProps {
  /** Выбранные _id пород (для одиночного выбора — массив из 0/1 элемента) */
  value: string[]
  onValueChange: (ids: string[]) => void
  multiple?: boolean
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  size?: 'xs' | 'sm' | 'md'
  onBlur?: () => void
}

// NFD + вырезание комбинирующих знаков — поиск без учёта диакритики (ż → z);
// ł не раскладывается через NFD, поэтому заменяется отдельно
const normalize = (text: string) =>
  text.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l')

/**
 * Выпадающий список пород с поиском (по польскому и английскому названию,
 * без учёта диакритики). Одиночный и множественный режимы.
 */
export const BreedCombobox = ({
  value,
  onValueChange,
  multiple = false,
  invalid = false,
  disabled = false,
  placeholder = 'Wyszukaj rasę...',
  size = 'md',
  onBlur,
}: BreedComboboxProps) => {
  const { data: breeds, isLoading, error } = useBreeds()
  const [query, setQuery] = useState('')

  const items = useMemo(() => breeds ?? [], [breeds])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = normalize(query.trim())
    return items.filter(
      (breed) => normalize(breed.name).includes(q) || normalize(breed.nameEn).includes(q)
    )
  }, [items, query])

  const collection = useMemo(
    () =>
      createListCollection({
        items: filteredItems,
        itemToString: (item) => item.name,
        itemToValue: (item) => item._id,
      }),
    [filteredItems]
  )

  const nameById = useMemo(() => new Map(items.map((b) => [b._id, b.name])), [items])

  if (error) {
    return (
      <Box p="12" bg="statusBackgroundRed" borderRadius="8px" border="1px solid" borderColor="statusTextRed" w="full">
        <Text textStyle="labelS" color="statusTextRed">
          Nie udało się załadować listy ras. Odśwież stronę i spróbuj ponownie.
        </Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      <Combobox.Root
        collection={collection}
        value={value}
        onValueChange={(details) => onValueChange(details.value)}
        onInputValueChange={(details) => setQuery(details.inputValue)}
        onOpenChange={(details) => {
          // При открытии сбрасываем фильтр, чтобы показать весь список
          if (details.open) setQuery('')
        }}
        multiple={multiple}
        closeOnSelect={!multiple}
        selectionBehavior={multiple ? 'clear' : 'replace'}
        openOnClick
        invalid={invalid}
        disabled={disabled || isLoading}
        size={size}
        onInteractOutside={onBlur}
      >
        <Combobox.Control>
          <Combobox.Input placeholder={isLoading ? 'Ładowanie ras...' : placeholder} />
          <Combobox.IndicatorGroup>
            {isLoading ? <Spinner size="xs" color="contentGrey" /> : <Combobox.ClearTrigger />}
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content bg="backgroundPrimary">
              <Combobox.Empty>Nie znaleziono rasy o tej nazwie</Combobox.Empty>
              {collection.items.map((breed) => (
                <Combobox.Item item={breed} key={breed._id}>
                  <Flex direction="column" gap="0">
                    <Text textStyle="labelM" color="contentBlack01">
                      {breed.name}
                    </Text>
                    {breed.nameEn !== breed.name && (
                      <Text textStyle="labelS" color="contentGrey">
                        {breed.nameEn}
                      </Text>
                    )}
                  </Flex>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>

      {multiple && value.length > 0 && (
        <Flex gap="8" mt="8" flexWrap="wrap">
          {value.map((id) => (
            <Flex
              key={id}
              align="center"
              gap="6"
              bg="backgroundGrey"
              border="1px solid"
              borderColor="linePrimary"
              borderRadius="full"
              py="4"
              px="12"
            >
              <Text textStyle="labelS" color="contentBlack01">
                {nameById.get(id) ?? id}
              </Text>
              <chakra.button
                type="button"
                cursor="pointer"
                color="contentGrey"
                display="inline-flex"
                _hover={{ color: 'contentBlack01' }}
                aria-label={`Usuń rasę ${nameById.get(id) ?? ''}`}
                onClick={() => onValueChange(value.filter((v) => v !== id))}
              >
                <LuX size={14} />
              </chakra.button>
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  )
}
