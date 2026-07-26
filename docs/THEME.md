# Тема PedigreeHub (Chakra UI v3)

## Обзор

Проект использует кастомную тему на основе токенов из Figma. Тема поддерживает светлую и тёмную темы автоматически.

## Подключение темы

```tsx
// frontend/src/app/providers/index.tsx
import { system } from '@/shared/theme/theme'
import { ChakraProvider } from '@chakra-ui/react'

<ChakraProvider value={system}>
  {children}
</ChakraProvider>
```

---

## Семантические цвета

**ВАЖНО:** Всегда используй семантические токены вместо прямых цветов!

### Фон (Background)

| Токен | Описание | Использование |
|-------|----------|---------------|
| `backgroundPrimary` | Основной фон страницы | `bg="backgroundPrimary"` |
| `backgroundGrey` | Серый фон секций | `bg="backgroundGrey"` |
| `backgroundSecondary01` | Фон карточек | `bg="backgroundSecondary01"` |

### Текст (Content)

| Токен | Описание | Использование |
|-------|----------|---------------|
| `contentBlack01` | Основной текст | `color="contentBlack01"` |
| `contentGrey` | Вторичный текст | `color="contentGrey"` |
| `contentOrange` | Акцентный текст | `color="contentOrange"` |

### Кнопки (Button)

| Токен | Описание |
|-------|----------|
| `buttonOrange` | Основная кнопка (primary) |
| `buttonTextWhiteB` | Текст на оранжевой кнопке |
| `buttonTextBlack` | Текст на светлой кнопке |
| `buttonInactive` | Неактивная кнопка |
| `buttonGreen` | Кнопка успеха |

### Линии и границы (Line)

| Токен | Описание |
|-------|----------|
| `linePrimary` | Основные границы |
| `lineSecondary` | Вторичные границы |
| `lineOrange` | Акцентные границы |

### Статусы

| Токен фона | Токен текста | Назначение |
|------------|--------------|------------|
| `statusBackgroundGreen` | `statusTextGreen` | Успех |
| `statusBackgroundRed` | `statusTextRed` | Ошибка |
| `statusBackgroundOrange` | `statusTextOrange` | Предупреждение |
| `statusBackgroundPurple` | `statusTextPurple` | Информация |

### Input

| Токен | Описание |
|-------|----------|
| `input` | Граница инпута |
| `inputActive` | Граница при фокусе |
| `inputHover` | Граница при наведении |

### Общие

| Токен | Описание |
|-------|----------|
| `brand` | Брендовый цвет (#ff4f01) |
| `positive` | Успех/Позитив (зелёный) |
| `negative` | Ошибка/Негатив (красный) |
| `warning` | Предупреждение (оранжевый) |

---

## Примеры использования

### Правильно ✅

```tsx
// Используем семантические токены
<Box bg="backgroundPrimary">
  <Text color="contentBlack01">Заголовок</Text>
  <Text color="contentGrey">Подзаголовок</Text>
  <Button variant="solid">Отправить</Button>
</Box>

// Статусы
<Box bg="statusBackgroundGreen" color="statusTextGreen">
  Успешно!
</Box>

// Ошибка
<Box bg="statusBackgroundRed" color="statusTextRed">
  Ошибка валидации
</Box>
```

### Неправильно ❌

```tsx
// НЕ используй прямые цвета!
<Box bg="white">           // ❌ Используй backgroundPrimary
<Text color="gray.600">    // ❌ Используй contentGrey
<Box bg="red.100">         // ❌ Используй statusBackgroundRed
```

---

## Компоненты темы

### Button

Варианты: `solid`, `outline`, `ghost`, `link`, `unstyled`
Размеры: `sm`, `md`, `lg`

```tsx
<Button variant="solid" size="md">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Input

Варианты: `outline`, `filled`
Размеры: `sm`, `md`, `lg`

```tsx
<Input placeholder="Email" size="md" />
<Input variant="filled" placeholder="Filled" />
```

### Field (Form Control)

```tsx
<Field.Root invalid={!!error}>
  <Field.Label>Email</Field.Label>
  <Input placeholder="email@example.com" />
  <Field.ErrorText>{error}</Field.ErrorText>
</Field.Root>
```

---

## Spacing (Отступы)

| Токен | Значение |
|-------|----------|
| `0` | 0 |
| `2` | 0.125rem (2px) |
| `4` | 0.25rem (4px) |
| `6` | 0.375rem (6px) |
| `8` | 0.5rem (8px) |
| `12` | 0.75rem (12px) |
| `16` | 1rem (16px) |
| `20` | 1.25rem (20px) |
| `24` | 1.5rem (24px) |
| `32` | 2rem (32px) |
| `40` | 2.5rem (40px) |
| `64` | 4rem (64px) |

---

## Text Styles (textStyle)

Готовые стили текста из Figma. Использовать через `textStyle` prop:

```tsx
<Text textStyle="titleXLBold">Заголовок страницы</Text>
<Text textStyle="labelM">Обычный текст</Text>
<Text textStyle="labelS">Мелкий текст</Text>
```

### Display (Крупные заголовки)

| Стиль | Размер | Вес | Использование |
|-------|--------|-----|---------------|
| `displayXXLBold` | 3rem (48px) | 700 | Hero секции |
| `displayXLBold` | 2rem (32px) | 700 | Заголовки страниц |

### Title (Заголовки)

| Стиль | Размер | Вес | Использование |
|-------|--------|-----|---------------|
| `titleXLBold` | 1.5rem (24px) | 700 | H1 |
| `titleLBold` | 1.125rem (18px) | 700 | H2 |
| `titleL` | 1.125rem (18px) | 400 | H2 light |
| `titleMBold` | 1rem (16px) | 700 | H3 |
| `titleSBold` | 0.875rem (14px) | 700 | H4 |

### Label (Текст интерфейса)

| Стиль | Размер | Вес | Использование |
|-------|--------|-----|---------------|
| `labelL` | 1rem (16px) | 400 | Крупный текст |
| `labelMBold` | 0.875rem (14px) | 700 | Жирный текст |
| `labelMSemibold` | 0.875rem (14px) | 600 | Полужирный |
| `labelM` | 0.875rem (14px) | 400 | Основной текст |
| `labelSBold` | 0.75rem (12px) | 700 | Мелкий жирный |
| `labelSSemibold` | 0.75rem (12px) | 600 | Мелкий полужирный |
| `labelS` | 0.75rem (12px) | 400 | Мелкий текст |
| `labelXSSemibold` | 0.625rem (10px) | 600 | Очень мелкий |
| `labelXS` | 0.625rem (10px) | 400 | Подписи |

### Примеры

```tsx
// Заголовок страницы
<Heading textStyle="displayXLBold">Каталог щенков</Heading>

// Заголовок карточки
<Text textStyle="titleMBold">Golden Retriever</Text>

// Цена
<Text textStyle="titleLBold" color="contentOrange">3500 PLN</Text>

// Описание
<Text textStyle="labelM" color="contentGrey">
  Прекрасный щенок из питомника...
</Text>

// Метка
<Text textStyle="labelS" color="contentGrey">
  Опубликовано: 2 дня назад
</Text>

// Badge
<Badge textStyle="labelXSSemibold">Верифицирован</Badge>
```

---

## Typography (Токены)

### Font Sizes

| Токен | Размер |
|-------|--------|
| `10` | 0.625rem |
| `12` | 0.75rem |
| `14` | 0.875rem |
| `16` | 1rem |
| `18` | 1.125rem |
| `24` | 1.5rem |
| `32` | 2rem |
| `48` | 3rem |

### Font Weights

| Токен | Значение |
|-------|----------|
| `regular` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

---

## Radii (Скругления)

| Токен | Значение |
|-------|----------|
| `button` | 6.25rem (100px) - для кнопок |
| `notification` | 0.75rem (12px) |
| `textfield` | 0.25rem (4px) - для инпутов |

---

## Структура файлов темы

```
frontend/src/shared/theme/
├── theme.ts              # Главный файл темы
├── provider.tsx          # UIProvider компонент
├── tokens.json           # Токены из Figma
├── figma.tokens.generated.ts  # Сгенерированные токены
├── color-mode/           # Переключатель темы
├── toaster/              # Toast уведомления
└── components/           # Рецепты компонентов
    ├── button.ts
    ├── formInput.ts
    ├── field.ts
    ├── badge.ts
    └── ...
```

