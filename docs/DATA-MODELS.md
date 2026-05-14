# Модели данных (MongoDB)

## Обзор

База данных MongoDB содержит следующие коллекции:
- users
- breeders
- breeds
- listings
- documents
- inquiries
- reviews
- favorites

---

## User (Пользователь)

**Коллекция:** `users`

```javascript
{
  _id: ObjectId,                    // Уникальный идентификатор
  
  // Основные данные
  email: String,                    // Email (уникальный, lowercase)
  password: String,                 // Хеш пароля (bcrypt)
  firstName: String,                // Имя
  lastName: String,                 // Фамилия
  phone: String,                    // Телефон
  
  // Роль и статус
  role: String,                     // "user" | "breeder" | "admin"
  isVerified: Boolean,              // Верифицирован админом
  isEmailVerified: Boolean,         // Email подтверждён
  isBlocked: Boolean,               // Заблокирован
  
  // Профиль
  avatar: String,                   // URL аватара
  
  // Токены
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: String,
  
  // Метаданные
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:**
- `email` — уникальный
- `role` — обычный
- `createdAt` — обычный

---

## Breeder (Заводчик)

**Коллекция:** `breeders`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // Ссылка на User
  
  // Данные питомника
  kennelName: String,               // Название питомника
  kennelRegistration: String,       // Номер регистрации ZKwP/FCI
  
  // Локация
  region: String,                   // Воеводство
  city: String,                     // Город
  address: String,                  // Адрес (опционально)
  
  // Описание
  description: String,              // Описание питомника
  
  // Контакты
  website: String,                  // Сайт
  socialLinks: {
    facebook: String,
    instagram: String
  },
  
  // Породы
  breeds: [ObjectId],               // Массив ссылок на Breed
  breedNames: [String],            // Временное поле для названий пород
  
  // Расширенная верификация
  verification: {
    status: String,                 // "pending" | "verified" | "rejected"
    level: String,                  // "new" | "verified" | "trusted" | "professional"
    
    // Email
    emailVerified: Boolean,
    emailVerifiedAt: Date,
    
    // ZKwP (обязательный)
    zkwpDocument: ObjectId,         // Ссылка на Document
    zkwpVerified: Boolean,
    zkwpVerifiedAt: Date,
    zkwpVerifiedBy: ObjectId,       // Кто верифицировал (admin)
    zkwpNote: String,
    
    // Документ личности (опционально)
    identityDocument: ObjectId,
    identityVerified: Boolean,
    identityVerifiedAt: Date,
    
    // NIP/CEIDG (опционально)
    nip: String,
    nipVerified: Boolean,
    nipVerifiedAt: Date,
    nipCompanyName: String,
    nipPkd: String,
    
    // Родословные собак (множественные)
    breedingDogs: [{
      name: String,                 // Имя собаки
      pedigreeNumber: String,       // Номер родословной
      pedigreeDocument: ObjectId,   // Ссылка на Document
      verified: Boolean             // Верифицирован ли документ
    }],
    
    // Награды/дипломы (множественные)
    awards: [{
      title: String,                // Название награды
      year: Number,                 // Год получения
      document: ObjectId,           // Ссылка на Document
      verified: Boolean             // Верифицирован ли документ
    }]
  },
  
  // Фото питомника
  kennelPhotos: [String],           // Массив URL фотографий
  
  // Отznaki (автоматически вычисляются)
  badges: [String],                 // ["email_verified", "zkwp_verified", "awards_verified", ...]
  
  // Статистика
  rating: Number,                   // Средний рейтинг (1-5)
  reviewsCount: Number,             // Количество отзывов
  listingsCount: Number,            // Количество объявлений
  
  // Статус
  isActive: Boolean,                // Активен
  
  createdAt: Date,
  updatedAt: Date
}
```

**Особенности верификации:**
- При одобрении документа типа `award` автоматически создается запись в `verification.awards[]` с ссылкой на документ
- При одобрении документа типа `pedigree` автоматически создается запись в `verification.breedingDogs[]` с ссылкой на документ
- Уровень верификации (`level`) вычисляется автоматически на основе количества отznak
- Отznaki (`badges`) вычисляются автоматически при сохранении профиля

**Индексы:**
- `userId` — уникальный
- `kennelName` — текстовый (поиск)
- `region` — обычный
- `verificationStatus` — обычный
- `breeds` — обычный
- `rating` — обычный

---

## Breed (Порода)

**Коллекция:** `breeds`

```javascript
{
  _id: ObjectId,
  
  // Названия
  name: String,                     // Название на польском
  nameEn: String,                   // Название на английском
  nameRu: String,                   // Название на русском
  
  // Классификация FCI
  fciGroup: Number,                 // Группа FCI (1-10)
  fciSection: Number,               // Секция
  fciNumber: Number,                // Номер стандарта FCI
  
  // Описание
  description: String,
  
  // Характеристики
  sizeCategory: String,             // "small" | "medium" | "large" | "giant"
  averageLifespan: String,          // Средняя продолжительность жизни
  
  // Медиа
  photo: String,                    // URL фото породы
  
  // Статус
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:**
- `name` — уникальный, текстовый
- `fciGroup` — обычный
- `isActive` — обычный

---

## Listing (Объявление)

**Коллекция:** `listings`

```javascript
{
  _id: ObjectId,
  breederId: ObjectId,              // Ссылка на Breeder
  breed: ObjectId,                  // Ссылка на Breed
  
  // Основная информация
  title: String,                    // Заголовок
  description: String,              // Описание
  price: Number,                    // Цена
  currency: String,                 // "PLN" | "EUR"
  
  // Данные о щенке
  puppyName: String,                // Имя щенка (опционально)
  birthDate: Date,                  // Дата рождения
  gender: String,                   // "male" | "female"
  color: String,                    // Окрас
  
  // Документы
  microchipNumber: String,          // Номер микрочипа (15 цифр)
  
  hasPedigree: Boolean,             // Есть родословная
  pedigreeDocument: ObjectId,       // Ссылка на Document
  
  hasVetPassport: Boolean,          // Есть ветпаспорт
  vetPassportDocument: ObjectId,    // Ссылка на Document
  
  hasMetric: Boolean,               // Есть метрика
  metricDocument: ObjectId,         // Ссылка на Document
  
  // Родители
  father: {
    name: String,
    pedigreeNumber: String,         // Номер родословной
    titles: [String],               // Титулы (Champion и т.д.)
    photo: String                   // URL фото
  },
  mother: {
    name: String,
    pedigreeNumber: String,
    titles: [String],
    photo: String
  },
  
  // Медиа
  photos: [String],                 // Массив URL фотографий
  videos: [String],                 // Массив URL видео
  
  // Статус
  status: String,                   // "draft" | "pending" | "active" | "sold" | "reserved" | "archived"
  
  // Верификация
  verificationStatus: String,       // "pending" | "verified" | "rejected"
  verificationNote: String,         // Причина отклонения
  verifiedAt: Date,
  verifiedBy: ObjectId,
  
  // Статистика
  viewsCount: Number,               // Просмотры
  inquiriesCount: Number,           // Запросы
  favoritesCount: Number,           // В избранном
  
  // Локация (денормализация для поиска)
  location: {
    region: String,                 // Воеводство
    city: String                    // Город
  },
  
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date,                // Дата публикации
  soldAt: Date                      // Дата продажи
}
```

**Индексы:**
- `breederId` — обычный
- `breed` — обычный
- `status` — обычный
- `verificationStatus` — обычный
- `price` — обычный
- `birthDate` — обычный
- `location.region` — обычный
- `gender` — обычный
- `createdAt` — обычный
- Составной: `{ status: 1, verificationStatus: 1, publishedAt: -1 }`
- Текстовый: `{ title: "text", description: "text" }`

---

## Document (Документ)

**Коллекция:** `documents`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // Кто загрузил
  
  // Тип документа
  type: String,                     // "zkwp_certificate" | "identity" | "pedigree" | 
                                    // "award" | "kennel_photo" | "puppy_photo" |
                                    // "vet_passport" | "metric" | "other"
  
  // Файл
  fileName: String,                 // Имя файла в хранилище
  originalName: String,              // Оригинальное имя файла
  fileUrl: String,                  // URL в Cloudinary
  publicId: String,                 // Cloudinary public_id для удаления
  fileSize: Number,                 // Размер в байтах
  mimeType: String,                 // MIME тип
  
  // Метаданные (для изображений)
  metadata: {
    width: Number,                   // Ширина (для изображений)
    height: Number,                 // Высота (для изображений)
    format: String                  // Формат файла
  },
  
  // Верификация
  status: String,                   // "pending" | "approved" | "rejected"
  rejectionReason: String,          // Причина отклонения
  verifiedBy: ObjectId,             // Кто проверил (admin)
  verifiedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Особенности:**
- **Множественная загрузка:** Для типов `award`, `pedigree`, `kennel_photo` можно загружать несколько файлов
- **Независимая верификация:** Каждый документ верифицируется отдельно
- **Автоматическая связь:** При одобрении документов типа `award` и `pedigree` автоматически создаются/обновляются записи в `breeder.verification.awards[]` и `breeder.verification.breedingDogs[]`

**Индексы:**
- `userId` — обычный
- `type` — обычный
- `status` — обычный
- `createdAt` — по убыванию (для сортировки)

---

## Inquiry (Запрос)

**Коллекция:** `inquiries`

```javascript
{
  _id: ObjectId,
  
  // Участники
  listingId: ObjectId,              // Ссылка на Listing
  buyerId: ObjectId,                // Ссылка на User (покупатель)
  breederId: ObjectId,              // Ссылка на Breeder
  
  // Первое сообщение
  message: String,
  contactPhone: String,             // Контактный телефон покупателя
  
  // Статус
  status: String,                   // "new" | "read" | "replied" | "closed"
  
  // Переписка
  replies: [{
    senderId: ObjectId,             // User ID отправителя
    message: String,
    createdAt: Date
  }],
  
  // Метаданные
  lastReplyAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:**
- `listingId` — обычный
- `buyerId` — обычный
- `breederId` — обычный
- `status` — обычный
- `createdAt` — обычный

---

## Review (Отзыв)

**Коллекция:** `reviews`

```javascript
{
  _id: ObjectId,
  
  // Участники
  breederId: ObjectId,              // О ком отзыв
  reviewerId: ObjectId,             // Кто написал (User ID)
  listingId: ObjectId,              // По какому объявлению (опционально)
  
  // Содержание
  rating: Number,                   // Рейтинг 1-5
  title: String,                    // Заголовок
  content: String,                  // Текст отзыва
  
  // Верификация покупки
  isVerifiedPurchase: Boolean,      // Подтверждённая покупка
  
  // Модерация
  status: String,                   // "pending" | "approved" | "rejected"
  rejectionReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Индексы:**
- `breederId` — обычный
- `reviewerId` — обычный
- `status` — обычный
- `rating` — обычный
- `createdAt` — обычный

---

## Диаграмма связей

```
┌─────────┐       ┌──────────┐       ┌─────────┐
│  User   │───1:1─│ Breeder  │───1:N─│ Listing │
└─────────┘       └──────────┘       └─────────┘
     │                 │                  │
     │                 │                  │
     │            ┌────┴────┐            │
     │            │         │            │
     │            ▼         ▼            │
     │       ┌────────┐ ┌────────┐       │
     │       │ Review │ │Document│◄──────┘
     │       └────────┘ └────────┘
     │            ▲
     │            │
     └────────────┘
           │
           │         ┌─────────┐
           └─────────│ Inquiry │
                     └─────────┘
                          │
                          ▼
                     ┌─────────┐
                     │ Listing │
                     └─────────┘
```

---

## Favorite (Избранное)

**Коллекция:** `favorites`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // Кто добавил (покупатель)
  listingId: ObjectId,              // Какое объявление
  createdAt: Date
}
```

**Индексы:**
- `{ userId: 1, listingId: 1 }` — уникальный составной
- `userId` — для получения избранного пользователя

---

## Диаграмма связей (обновлённая)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────┐                                                    │
│  │  User   │◄─────────────────┐                                 │
│  │ (buyer) │                  │                                 │
│  └────┬────┘                  │                                 │
│       │                       │                                 │
│       │ 1:N                   │ 1:N                             │
│       ▼                       │                                 │
│  ┌──────────┐            ┌────┴────┐                           │
│  │ Favorite │            │ Inquiry │◄────────────┐              │
│  └────┬─────┘            └────┬────┘             │              │
│       │                       │                  │              │
│       │ N:1                   │ N:1              │              │
│       ▼                       ▼                  │              │
│  ┌─────────┐            ┌─────────┐         ┌───┴────┐         │
│  │ Listing │◄───────────│ Inquiry │         │ Review │         │
│  └────┬────┘            └─────────┘         └────────┘         │
│       │                                          ▲              │
│       │ N:1                                      │              │
│       ▼                                          │              │
│  ┌──────────┐                               ┌────┴────┐        │
│  │ Breeder  │◄──────────────────────────────│  User   │        │
│  └──────────┘                               │(breeder)│        │
│       │                                     └─────────┘        │
│       │ 1:1                                                    │
│       ▼                                                        │
│  ┌─────────┐                                                   │
│  │  User   │                                                   │
│  └─────────┘                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Валидация микрочипа

**Важно:** Автоматическая проверка подлинности микрочипа в национальной БД недоступна (нет бесплатного API). Мы проверяем только формат и уникальность в нашей системе. Подробнее см. [VERIFICATION-STRATEGY.md](./VERIFICATION-STRATEGY.md).

Формат микрочипа ISO 11784/11785:
- 15 цифр
- Первые 3 цифры — код страны (616 = Польша)
- Следующие 2 цифры — код производителя
- Остальные 10 цифр — уникальный номер

```javascript
// Пример валидации формата
const microchipRegex = /^\d{15}$/;

function validateMicrochipFormat(chip) {
  if (!microchipRegex.test(chip)) {
    return { valid: false, error: 'Микрочип должен содержать 15 цифр' };
  }
  
  const countryCode = chip.substring(0, 3);
  const validCountryCodes = ['616']; // Польша, можно добавить другие
  
  if (!validCountryCodes.includes(countryCode)) {
    return { valid: false, error: 'Неверный код страны' };
  }
  
  // Проверка уникальности в нашей БД
  const exists = await Listing.findOne({ microchipNumber: chip });
  if (exists) {
    return { valid: false, error: 'Этот микрочип уже используется' };
  }
  
  return { valid: true };
}
```

**Что проверяется автоматически:**
- ✅ Формат (15 цифр, ISO 11784/11785)
- ✅ Код страны
- ✅ Уникальность в нашей БД

**Что проверяется администратором вручную:**
- ✅ Соответствие номера на документе номеру в объявлении
- ✅ Наличие документа с микрочипом
- ✅ Читаемость документа

