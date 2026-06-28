# Инструкция по тестированию API

## Подготовка

### 1. Запуск сервера

```bash
cd backend
yarn install  # если еще не установлены зависимости
yarn dev      # запуск в режиме разработки
```

Сервер запустится на `http://localhost:3000`

### 2. Настройка переменных окружения

Создай файл `.env` в папке `backend/` на основе `env.example`:

```bash
cp env.example .env
```

Минимально необходимые переменные для тестирования:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pedigreehub
JWT_SECRET=test_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Убедись что MongoDB запущен

```bash
# Если используешь локальный MongoDB
mongod

# Или используй MongoDB Atlas (облачный)
```

---

## Инструменты для тестирования

### Вариант 1: Thunder Client (VS Code расширение)
- Установи расширение "Thunder Client" в VS Code
- Открой панель Thunder Client (иконка молнии в боковой панели)
- Импортируй коллекцию (см. ниже)

### Вариант 2: Postman
- Скачай Postman: https://www.postman.com/downloads/
- Импортируй коллекцию (см. ниже)

### Вариант 3: curl (терминал)
- Используй примеры ниже в терминале

---

## Пошаговое тестирование

### Шаг 1: Регистрация и авторизация

#### 1.1 Регистрация заводчика

```bash
curl -X POST http://localhost:3000/api/auth/register/breeder \
  -H "Content-Type: application/json" \
  -d '{
    "email": "breeder@test.com",
    "password": "Test123456",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "phone": "+48123456789",
    "breeder": {
      "kennelName": "Test Kennel",
      "kennelRegistration": "XII-1234/56",
      "region": "Mazowieckie",
      "city": "Warszawa",
      "description": "Test description",
      "breeds": []
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Регистрация завершена..."
}
```

#### 1.2 Вход в систему

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "breeder@test.com",
    "password": "Test123456"
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```

**Сохрани `accessToken` для следующих запросов!**

---

### Шаг 2: Загрузка документов для верификации

#### 2.1 Загрузка сертификата ZKwP

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/zkwp_certificate.pdf" \
  -F "type=zkwp_certificate"
```

**Примечание:** Замени `YOUR_ACCESS_TOKEN` на токен из шага 1.2
**Примечание:** Замени `/path/to/zkwp_certificate.pdf` на реальный путь к файлу

#### 2.2 Загрузка документа личности

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/identity.pdf" \
  -F "type=identity"
```

#### 2.3 Проверка статуса документов

```bash
curl -X GET http://localhost:3000/api/documents/my \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Шаг 3: Верификация заводчика (как админ)

**Сначала нужно залогиниться как админ** (если есть тестовый админ аккаунт):

```bash
# Логин админа
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123456"
  }'
```

**Сохрани токен админа!**

#### 3.1 Получить документы на модерацию

```bash
curl -X GET http://localhost:3000/api/admin/documents/pending \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### 3.2 Одобрить документ ZKwP

```bash
curl -X POST http://localhost:3000/api/admin/documents/DOCUMENT_ID/approve \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Замени `DOCUMENT_ID` на реальный ID документа из шага 3.1**

---

### Шаг 4: Создание объявления

#### 4.1 Подготовка данных

Сначала нужно получить ID породы:

```bash
# Если есть эндпоинт для пород
curl -X GET http://localhost:3000/api/breeds
```

**Или создай породу вручную в БД, или используй существующий ID**

#### 4.2 Создание объявления (с файлами)

**Важно:** Это multipart/form-data запрос, лучше использовать Postman/Thunder Client

**Структура запроса:**

```
POST http://localhost:3000/api/listings
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data

Body (form-data):
- title: "Szczenięta Golden Retriever"
- breed: "BREED_ID"
- birthDate: "2024-10-15"
- gender: "male"
- color: "Złoty"
- puppyName: "Max"
- price: "3500"
- currency: "PLN"
- microchipNumber: "616123456789012"
- hasPedigree: "true"
- hasVetPassport: "true"
- hasMetric: "false"
- fatherName: "Champion Golden Star"
- fatherPedigreeNumber: "PKR.VIII-12345"
- fatherTitles: "[\"Champion Polski\"]"
- motherName: "Lady Sunshine"
- motherPedigreeNumber: "PKR.VIII-54321"
- description: "Piękne szczenięta z doskonałej linii..."
- videos: "[]"
- status: "pending"
- photos: [файл1.jpg, файл2.jpg, файл3.jpg] (минимум 3)
- fatherPhoto: [файл.jpg] (опционально)
- motherPhoto: [файл.jpg] (опционально)
- pedigreeDocument: [файл.pdf] (если hasPedigree=true)
- vetPassportDocument: [файл.pdf] (если hasVetPassport=true)
```

**Пример через curl (сложно, лучше Postman):**

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=Szczenięta Golden Retriever" \
  -F "breed=BREED_ID" \
  -F "birthDate=2024-10-15" \
  -F "gender=male" \
  -F "color=Złoty" \
  -F "price=3500" \
  -F "currency=PLN" \
  -F "microchipNumber=616123456789012" \
  -F "hasPedigree=true" \
  -F "hasVetPassport=true" \
  -F "fatherName=Champion Golden Star" \
  -F "fatherPedigreeNumber=PKR.VIII-12345" \
  -F "motherName=Lady Sunshine" \
  -F "description=Piekne szczenięta..." \
  -F "status=pending" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "photos=@photo3.jpg" \
  -F "pedigreeDocument=@pedigree.pdf" \
  -F "vetPassportDocument=@passport.pdf"
```

---

### Шаг 5: Проверка созданных объявлений

#### 5.1 Мои объявления

```bash
curl -X GET http://localhost:3000/api/listings/my \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5.2 Получить объявление по ID

```bash
curl -X GET http://localhost:3000/api/listings/LISTING_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5.3 Публичный каталог (без авторизации)

```bash
curl -X GET "http://localhost:3000/api/listings?page=1&limit=20"
```

#### 5.4 Каталог с фильтрами

```bash
curl -X GET "http://localhost:3000/api/listings?breed=BREED_ID&region=Mazowieckie&priceMin=1000&priceMax=5000&gender=male&verified=true"
```

---

### Шаг 6: Обновление и управление объявлением

#### 6.1 Изменить статус объявления

```bash
curl -X PATCH http://localhost:3000/api/listings/LISTING_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sold"
  }'
```

#### 6.2 Удалить объявление

```bash
curl -X DELETE http://localhost:3000/api/listings/LISTING_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Чеклист тестирования

### ✅ Базовые проверки

- [ ] Сервер запускается без ошибок
- [ ] Подключение к MongoDB работает
- [ ] Авторизация работает (логин/регистрация)
- [ ] JWT токены генерируются и валидируются

### ✅ Документы

- [ ] Загрузка документа работает
- [ ] Получение списка моих документов работает
- [ ] Удаление документа работает
- [ ] Админ видит документы на модерацию
- [ ] Одобрение/отклонение документа работает

### ✅ Объявления - Создание

- [ ] Создание черновика работает
- [ ] Создание с отправкой на модерацию работает
- [ ] Загрузка фото щенка работает (минимум 3)
- [ ] Загрузка фото родителей работает
- [ ] Загрузка документов работает
- [ ] Валидация микрочипа работает (формат, уникальность)
- [ ] Валидация родословных работает
- [ ] Проверка верификации заводчика работает
- [ ] Проверка породы заводчика работает

### ✅ Объявления - Получение

- [ ] Получение публичного каталога работает
- [ ] Фильтры работают (порода, регион, цена, пол)
- [ ] Пагинация работает
- [ ] Получение объявления по ID работает
- [ ] Получение моих объявлений работает

### ✅ Объявления - Управление

- [ ] Изменение статуса работает
- [ ] Удаление объявления работает
- [ ] Обновление объявления работает (для draft/rejected)

### ✅ Валидация и ошибки

- [ ] Неверный формат микрочипа → ошибка 400
- [ ] Дубликат микрочипа → ошибка 400
- [ ] Неверный формат родословной → ошибка 400
- [ ] Меньше 3 фото → ошибка 400
- [ ] Не верифицированный заводчик → ошибка 403
- [ ] Неверный формат данных → ошибка 400
- [ ] Недостаточно прав → ошибка 403

---

## Тестовые данные

### Тестовый микрочип
```
616123456789012
```
Формат валидный (616 = Польша), но не проверяется в реальной БД.

### Тестовые номера родословных ZKwP
```
PKR.VIII-12345
XII-1234/56
VIII-98765
```

### Тестовые породы
Создай в БД или используй существующие ID пород.

---

## Полезные команды MongoDB

### Подключиться к БД
```bash
mongosh mongodb://localhost:27017/pedigreehub
```

### Проверить объявления
```javascript
db.listings.find().pretty()
```

### Проверить документы
```javascript
db.documents.find().pretty()
```

### Проверить заводчиков
```javascript
db.breeders.find().pretty()
```

### Очистить тестовые данные
```javascript
db.listings.deleteMany({})
db.documents.deleteMany({})
```

---

## Troubleshooting

### Ошибка: "Cannot connect to MongoDB"
- Проверь что MongoDB запущен
- Проверь `MONGODB_URI` в `.env`

### Ошибка: "Cloudinary upload failed"
- Проверь настройки Cloudinary в `.env`
- Убедись что аккаунт Cloudinary активен

### Ошибка: "JWT expired"
- Токен истек (15 минут по умолчанию)
- Залогинься заново

### Ошибка: "Breeder not verified"
- Нужно сначала одобрить документы ZKwP как админ
- Проверь статус верификации заводчика

### Ошибка: "Microchip already exists"
- Микрочип уже используется в другом объявлении
- Используй другой тестовый номер

---

## Рекомендации

1. **Используй Postman/Thunder Client** для тестирования с файлами
2. **Сохраняй токены** в переменные окружения инструмента
3. **Создай коллекцию** с запросами для быстрого доступа
4. **Тестируй по порядку:** сначала авторизация, потом документы, потом объявления
5. **Проверяй логи сервера** для отладки ошибок

