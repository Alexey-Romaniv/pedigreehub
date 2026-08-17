# План разработки (8 недель)

## Обзор

| Неделя | Фокус | Результат |
|--------|-------|-----------|
| 1 | Setup | Рабочее окружение |
| 2 | Auth | Авторизация работает |
| 3 | Core API | Базовые эндпоинты |
| 4 | Catalog | Публичная часть |
| 5-6 | Panels | Панели заводчика и админа |
| 7 | Polish | Доработки, тесты |
| 8 | Deploy | Деплой и документация |

---

## Неделя 1: Setup

### Разработчик 1

**Backend:**
- [ ] Инициализация проекта (npm init, TypeScript)
- [ ] Настройка Express.js
- [ ] Подключение MongoDB (Mongoose)
- [ ] Структура папок
- [ ] Базовые middleware (cors, helmet, error handler)
- [ ] Swagger настройка

**Frontend:**
- [ ] Инициализация Vite + React + TypeScript
- [ ] Настройка Chakra UI
- [ ] Настройка React Query
- [ ] Структура папок (FSD)
- [ ] Базовый роутинг

### Разработчик 2

- [ ] Настройка Cloudinary аккаунта
- [ ] Настройка email сервиса
- [ ] Создание Figma макетов (базовых)
- [ ] Подготовка GitHub репозитория
- [ ] Настройка GitHub Projects (задачи)

### Совместно

- [ ] Определение API контрактов
- [ ] Согласование моделей данных

---

## Неделя 2: Auth

### Разработчик 1

**Backend:**
- [ ] Модель User
- [ ] Регистрация пользователя
- [ ] Подтверждение email
- [ ] Логин (JWT)
- [ ] Refresh token
- [ ] Logout
- [ ] Forgot/Reset password
- [ ] Auth middleware

**Frontend:**
- [ ] Zustand store для auth
- [ ] Axios interceptors (токены)
- [ ] LoginPage + форма
- [ ] RegisterPage + форма
- [ ] ForgotPasswordPage
- [ ] ProtectedRoute компонент

### Разработчик 2

**Backend:**
- [ ] Модель Breeder
- [ ] Регистрация заводчика (расширенная)
- [ ] Middleware проверки ролей

**Frontend:**
- [ ] BreederRegisterForm (wizard)
- [ ] Shared UI компоненты (FormInput, FormSelect)

---

## Неделя 3: Core API

### Разработчик 1

**Backend:**
- [ ] Модель Breed
- [ ] CRUD пород
- [ ] Seed данных (породы FCI)
- [ ] Модель Listing (базовая)
- [ ] GET /listings (с фильтрами)
- [ ] GET /listings/:id
- [ ] Публичный профиль заводчика

**Frontend:**
- [ ] API хуки (useBreeds, usePuppies)
- [ ] BreedSelector компонент

### Разработчик 2

**Backend:**
- [ ] POST /listings
- [ ] PATCH /listings/:id
- [ ] DELETE /listings/:id
- [ ] Модель Document
- [ ] Upload endpoint (Multer + Cloudinary)
- [ ] PATCH /listings/:id/status

---

## Неделя 4: Catalog

### Разработчик 1

**Frontend:**
- [ ] HomePage
- [ ] CatalogPage
- [ ] PuppyCard компонент
- [ ] PuppyFilters компонент
- [ ] PuppyGrid с пагинацией
- [ ] PuppyDetailPage
- [ ] ImageGallery компонент
- [ ] BreederProfilePage

**Backend:**
- [ ] Оптимизация запросов (индексы)
- [ ] Полнотекстовый поиск

### Разработчик 2

**Frontend:**
- [ ] Загрузка фотографий (react-dropzone)
- [ ] DocumentUpload компонент
- [ ] Начало работы над Create Listing wizard

---

## Неделя 5: Breeder Panel

### Разработчик 1

- [ ] Помощь с frontend
- [ ] Модель Review
- [ ] GET /reviews/breeder/:id
- [ ] ReviewsList компонент
- [ ] RatingStars компонент

### Разработчик 2

**Frontend:**
- [ ] BreederDashboard
- [ ] StatsCards
- [ ] MyListingsPage
- [ ] ListingsTable
- [ ] CreateListingPage (все 4 шага)
- [ ] EditListingPage

**Backend:**
- [ ] Модель Inquiry
- [ ] CRUD запросов
- [ ] POST /reviews

---

## Неделя 6: Admin + Inquiries

### Разработчик 1

**Frontend:**
- [ ] InquiryForm (на странице объявления)
- [ ] Отправка запроса

**Backend:**
- [ ] Доработка API по результатам тестов

### Разработчик 2

**Frontend:**
- [ ] InquiriesPage
- [ ] InquiryChat
- [ ] AdminDashboard
- [ ] AdminStats
- [ ] VerificationQueue
- [ ] ModerationQueue
- [ ] UsersTable

**Backend:**
- [ ] Admin эндпоинты
- [ ] Верификация заводчиков API
- [ ] Модерация объявлений API
- [ ] Email уведомления

---

## Неделя 7: Polish

### Оба разработчика

- [ ] Исправление багов
- [ ] Оптимизация производительности
- [ ] Адаптивный дизайн (мобильные)
- [ ] Обработка edge cases
- [ ] Локализация (PL/EN)
- [ ] Улучшение UX
- [ ] Code review
- [ ] Рефакторинг

### Тестирование

- [ ] Интеграционное тестирование
- [ ] Тестирование на реальных данных
- [ ] Тестирование безопасности

---

## Неделя 8: Deploy

### Разработчик 1

- [ ] Деплой Frontend на Vercel
- [ ] Настройка домена (опционально)
- [ ] Финальная документация

### Разработчик 2

- [ ] Деплой Backend на Railway/Render
- [ ] Настройка MongoDB Atlas (production)
- [ ] Настройка переменных окружения

### Совместно

- [ ] Финальное тестирование на production
- [ ] Исправление критических багов
- [ ] Подготовка презентации
- [ ] README обновление

---

## Milestones

| Milestone | Дата | Критерий готовности |
|-----------|------|---------------------|
| M1: Setup | Конец недели 1 | Проекты запускаются локально |
| M2: Auth | Конец недели 2 | Можно зарегистрироваться и войти |
| M3: MVP | Конец недели 4 | Можно просматривать каталог |
| M4: Full | Конец недели 6 | Все фичи реализованы |
| M5: Production | Конец недели 8 | Деплой завершён |

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Задержка с auth | Средняя | Начать параллельно с mock данными |
| Проблемы с Cloudinary | Низкая | Локальное хранение как fallback |
| Сложность wizard формы | Высокая | Упростить до минимума, расширять итеративно |
| Проблемы интеграции | Средняя | Частые синхронизации, общие типы |

---

## Definition of Done (общий)

Фича считается готовой когда:
- [ ] Функционал работает
- [ ] Код прошёл review
- [ ] Нет критических багов
- [ ] Есть базовая обработка ошибок
- [ ] Работает на мобильных (responsive)

