# API Документация

## Базовая информация

- **Base URL:** `https://api.pedigreehub.pl/api` (production)
- **Local URL:** `http://localhost:3000/api` (development)
- **Формат:** JSON
- **Аутентификация:** Bearer Token (JWT)

---

## Аутентификация

### Регистрация пользователя

```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "phone": "+48123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Письмо с подтверждением отправлено на email"
}
```

---

### Регистрация заводчика

```http
POST /auth/register/breeder
```

**Body:**
```json
{
  "email": "breeder@example.com",
  "password": "securePassword123",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "phone": "+48123456789",
  "breeder": {
    "kennelName": "Złote Łapy",
    "kennelRegistration": "XII-1234/56",
    "region": "Mazowieckie",
    "city": "Warszawa",
    "description": "Hodowla Golden Retrieverów od 2010 roku...",
    "breeds": ["breed_id_1", "breed_id_2"],
    "website": "https://zlotelapy.pl",
    "socialLinks": {
      "facebook": "https://facebook.com/zlotelapy",
      "instagram": "https://instagram.com/zlotelapy"
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Регистрация завершена. Ожидайте верификации."
}
```

---

### Вход в систему

```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "role": "breeder",
      "isVerified": true
    }
  }
}
```

---

### Обновление токена

```http
POST /auth/refresh
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

---

### Текущий пользователь

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "role": "breeder",
    "isVerified": true,
    "breeder": {
      "id": "breeder_id",
      "kennelName": "Złote Łapy",
      "verificationStatus": "verified"
    }
  }
}
```

---

## Породы

### Список пород

```http
GET /breeds
```

**Query параметры:**
- `group` — фильтр по группе FCI (1-10)
- `search` — поиск по названию

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "breed_id",
      "name": "Golden Retriever",
      "nameEn": "Golden Retriever",
      "fciGroup": 8,
      "fciSection": 1,
      "photo": "https://..."
    }
  ]
}
```

---

## Объявления (Listings)

### Каталог объявлений

```http
GET /listings
```

**Query параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| breed | string | ID породы |
| region | string | Воеводство |
| priceMin | number | Минимальная цена |
| priceMax | number | Максимальная цена |
| ageMin | number | Минимальный возраст (недели) |
| ageMax | number | Максимальный возраст (недели) |
| gender | string | "male" \| "female" |
| verified | boolean | Только верифицированные |
| sort | string | "price_asc" \| "price_desc" \| "date_desc" \| "views_desc" |
| page | number | Номер страницы (default: 1) |
| limit | number | Количество на странице (default: 20) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "listing_id",
      "title": "Szczenięta Golden Retriever",
      "breed": {
        "id": "breed_id",
        "name": "Golden Retriever"
      },
      "price": 3500,
      "currency": "PLN",
      "birthDate": "2024-10-15",
      "gender": "male",
      "photos": ["https://..."],
      "breeder": {
        "id": "breeder_id",
        "kennelName": "Złote Łapy",
        "isVerified": true,
        "rating": 4.8
      },
      "verification": {
        "status": "verified",
        "hasPedigree": true,
        "hasVetPassport": true,
        "hasMicrochip": true
      },
      "location": {
        "region": "Mazowieckie",
        "city": "Warszawa"
      },
      "viewsCount": 156,
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Детали объявления

```http
GET /listings/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "listing_id",
    "title": "Szczenięta Golden Retriever",
    "description": "Piękne szczenięta z doskonałej linii...",
    "breed": {
      "id": "breed_id",
      "name": "Golden Retriever"
    },
    "price": 3500,
    "currency": "PLN",
    "puppyName": "Max",
    "birthDate": "2024-10-15",
    "gender": "male",
    "color": "Złoty",
    "microchipNumber": "616***********",
    "hasPedigree": true,
    "hasVetPassport": true,
    "hasMetric": true,
    "father": {
      "name": "Champion Golden Star",
      "pedigreeNumber": "PKR.VIII-12345",
      "titles": ["Champion Polski", "Champion Międzynarodowy"],
      "photo": "https://..."
    },
    "mother": {
      "name": "Lady Sunshine",
      "pedigreeNumber": "PKR.VIII-54321",
      "titles": ["Champion Polski"],
      "photo": "https://..."
    },
    "photos": ["https://...", "https://..."],
    "videos": ["https://youtube.com/..."],
    "breeder": {
      "id": "breeder_id",
      "kennelName": "Złote Łapy",
      "isVerified": true,
      "rating": 4.8,
      "reviewsCount": 24,
      "location": {
        "region": "Mazowieckie",
        "city": "Warszawa"
      }
    },
    "verification": {
      "status": "verified",
      "verifiedAt": "2024-11-02T10:00:00Z"
    },
    "status": "active",
    "viewsCount": 156,
    "inquiriesCount": 12,
    "createdAt": "2024-11-01T10:00:00Z",
    "publishedAt": "2024-11-02T10:00:00Z"
  }
}
```

---

### Создание объявления

```http
POST /listings
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "title": "Szczenięta Golden Retriever",
  "description": "Piękne szczenięta z doskonałej linii...",
  "breed": "breed_id",
  "price": 3500,
  "currency": "PLN",
  "puppyName": "Max",
  "birthDate": "2024-10-15",
  "gender": "male",
  "color": "Złoty",
  "microchipNumber": "616123456789012",
  "father": {
    "name": "Champion Golden Star",
    "pedigreeNumber": "PKR.VIII-12345",
    "titles": ["Champion Polski"]
  },
  "mother": {
    "name": "Lady Sunshine",
    "pedigreeNumber": "PKR.VIII-54321"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new_listing_id",
    "status": "pending",
    "verificationStatus": "pending"
  }
}
```

---

### Загрузка фотографий

```http
POST /listings/:id/photos
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body:**
- `photos[]` — массив файлов (max 10, каждый до 5MB)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "photos": ["https://cloudinary.com/...", "https://cloudinary.com/..."]
  }
}
```

---

## Запросы на покупку (Inquiries)

Система коммуникации между покупателем и заводчиком.
- **Покупатель** — обычный пользователь (role: user), который хочет купить щенка
- **Заводчик** — получает запросы и отвечает на них

### Отправка запроса (покупатель)

```http
POST /inquiries
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "listingId": "listing_id",
  "message": "Dzień dobry! Jestem zainteresowany tym szczeniakiem...",
  "contactPhone": "+48123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "inquiry_id",
    "status": "new"
  }
}
```

---

### Ответ на запрос (заводчик или покупатель)

```http
POST /inquiries/:id/reply
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "message": "Dzień dobry! Dziękuję za zainteresowanie..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "inquiry_id",
    "status": "replied"
  }
}
```

---

### Мои запросы (покупатель)

```http
GET /inquiries
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inquiry_id",
      "listing": {
        "id": "listing_id",
        "title": "Golden Retriever",
        "photo": "https://..."
      },
      "breeder": {
        "kennelName": "Złote Łapy"
      },
      "status": "in_progress",
      "lastMessage": "Zapraszam na wizytę...",
      "unreadCount": 2,
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### Входящие запросы (заводчик)

```http
GET /inquiries/received
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inquiry_id",
      "listing": {
        "id": "listing_id",
        "title": "Golden Retriever"
      },
      "buyer": {
        "firstName": "Anna",
        "lastName": "Nowak",
        "phone": "+48123456789"
      },
      "status": "new",
      "message": "Dzień dobry! Jestem zainteresowana...",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### Отметить сделку как завершённую

```http
POST /inquiries/:id/mark-purchased
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Сделка отмечена как завершённая. Покупатель может оставить отзыв."
}
```

---

## Избранное (Favorites)

Позволяет покупателям сохранять понравившиеся объявления.

### Получить избранное

```http
GET /favorites
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "favorite_id",
      "listing": {
        "id": "listing_id",
        "title": "Golden Retriever",
        "price": 3500,
        "photos": ["https://..."],
        "status": "active"
      },
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

### Добавить в избранное

```http
POST /favorites/:listingId
Authorization: Bearer <access_token>
```

**Response (201):**
```json
{
  "success": true,
  "message": "Добавлено в избранное"
}
```

### Удалить из избранного

```http
DELETE /favorites/:listingId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Удалено из избранного"
}
```

---

## Отзывы (Reviews)

### Создание отзыва

```http
POST /reviews
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "breederId": "breeder_id",
  "listingId": "listing_id",
  "rating": 5,
  "title": "Polecam serdecznie!",
  "content": "Profesjonalna hodowla, zdrowe szczenięta..."
}
```

---

## Документы (Documents)

### Загрузка документа

```http
POST /documents/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body:**
- `file` — файл (PDF, JPG, PNG, WebP, максимум 10MB)
- `type` — тип документа (zkwp_certificate, identity, award, pedigree, kennel_photo, и т.д.)

**Примечание:** Для типов `award`, `pedigree`, `kennel_photo` можно загружать несколько файлов, вызывая эндпоинт несколько раз.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "type": "award",
    "fileName": "award_123.pdf",
    "originalName": "Champion Certificate 2023.pdf",
    "fileUrl": "https://cloudinary.com/...",
    "status": "pending",
    "createdAt": "2024-11-01T10:00:00Z"
  }
}
```

---

### Получить мои документы

```http
GET /documents/my?type=award
Authorization: Bearer <access_token>
```

**Query параметры:**
- `type` (опционально) — фильтр по типу документа

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "document_id",
      "type": "award",
      "fileName": "award_123.pdf",
      "originalName": "Champion Certificate 2023.pdf",
      "fileUrl": "https://cloudinary.com/...",
      "mimeType": "application/pdf",
      "status": "approved",
      "rejectionReason": null,
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ]
}
```

---

### Удалить документ

```http
DELETE /documents/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dokument usunięty"
}
```

---

## Администрирование

### Статистика

```http
GET /admin/stats
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1250,
      "newToday": 12
    },
    "breeders": {
      "total": 180,
      "verified": 165,
      "pendingVerification": 5
    },
    "listings": {
      "total": 450,
      "active": 320,
      "pendingModeration": 8
    }
  }
}
```

---

### Верификация заводчика

```http
POST /admin/verification/breeders/:id/approve
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Заводчик верифицирован"
}
```

---

### Отклонение заводчика

```http
POST /admin/verification/breeders/:id/reject
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "reason": "Документы не соответствуют требованиям..."
}
```

---

### Модерация документов

#### Получить документы на модерацию

```http
GET /admin/documents/pending?type=award&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Query параметры:**
- `type` (опционально) — фильтр по типу документа
- `page` — номер страницы (default: 1)
- `limit` — количество на странице (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "document_id",
      "userId": {
        "_id": "user_id",
        "firstName": "Jan",
        "lastName": "Kowalski",
        "email": "jan@example.com"
      },
      "type": "award",
      "originalName": "Champion Certificate 2023.pdf",
      "fileUrl": "https://cloudinary.com/...",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "status": "pending",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

#### Одобрить документ

```http
POST /admin/documents/:id/approve
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "status": "approved",
    "verifiedBy": "admin_id",
    "verifiedAt": "2024-11-01T12:00:00Z"
  }
}
```

**Примечание:** При одобрении документов типа `award` или `pedigree` автоматически создаются/обновляются записи в профиле заводчика.

---

#### Отклонить документ

```http
POST /admin/documents/:id/reject
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "reason": "Документ нечеткий, невозможно прочитать информацию"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "document_id",
    "status": "rejected",
    "rejectionReason": "Документ нечеткий, невозможно прочитать информацию",
    "verifiedBy": "admin_id",
    "verifiedAt": "2024-11-01T12:00:00Z"
  }
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Ошибка валидации |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Не найдено |
| 409 | Конфликт (email уже существует и т.д.) |
| 422 | Невозможно обработать |
| 429 | Слишком много запросов |
| 500 | Внутренняя ошибка сервера |

**Формат ошибки:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации",
    "details": [
      {
        "field": "email",
        "message": "Email уже используется"
      }
    ]
  }
}
```

