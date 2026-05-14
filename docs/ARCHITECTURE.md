# Архитектура проекта PedigreeHub

## Обзор

Проект построен на основе модульной архитектуры **Feature-Sliced Design (FSD)** для Frontend и модульной архитектуры для Backend.

## Принципы архитектуры

1. **Однонаправленные зависимости** — модули нижних слоёв не зависят от верхних
2. **Единственная ответственность** — каждый модуль решает одну задачу
3. **Переиспользование** — компоненты могут использоваться в разных контекстах
4. **Тестируемость** — каждый модуль легко тестируется изолированно

---

## Структура Frontend

```
frontend/
├── src/
│   ├── app/                          # Глобальные провайдеры, роутер
│   │   ├── App.tsx
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── QueryProvider.tsx
│   │   │   └── index.tsx
│   │   ├── router/
│   │   │   ├── index.tsx
│   │   │   ├── routes.ts
│   │   │   └── ProtectedRoute.tsx
│   │   └── layouts/
│   │       ├── MainLayout.tsx
│   │       ├── AuthLayout.tsx
│   │       └── AdminLayout.tsx
│   │
│   ├── pages/                        # Страницы по роутам
│   │   ├── public/                   # Публичные страницы
│   │   │   ├── HomePage/
│   │   │   ├── CatalogPage/
│   │   │   ├── PuppyDetailPage/
│   │   │   ├── BreederProfilePage/
│   │   │   └── SearchPage/
│   │   ├── auth/                     # Аутентификация
│   │   │   ├── LoginPage/
│   │   │   ├── RegisterPage/
│   │   │   ├── ForgotPasswordPage/
│   │   │   └── VerifyEmailPage/
│   │   ├── breeder/                  # Панель заводчика
│   │   │   ├── DashboardPage/
│   │   │   ├── MyListingsPage/
│   │   │   ├── CreateListingPage/
│   │   │   ├── EditListingPage/
│   │   │   ├── InquiriesPage/
│   │   │   └── ProfileSettingsPage/
│   │   └── admin/                    # Админ-панель
│   │       ├── DashboardPage/
│   │       ├── UsersPage/
│   │       ├── VerificationPage/
│   │       └── ModerationPage/
│   │
│   ├── modules/                      # Бизнес-модули
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── catalog/
│   │   ├── listings/
│   │   ├── breeder-panel/
│   │   ├── inquiries/
│   │   ├── reviews/
│   │   └── admin/
│   │
│   ├── shared/                       # Переиспользуемые ресурсы
│   │   ├── api/
│   │   │   ├── axiosInstance.ts
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── ui/
│   │   │   ├── FormInput/
│   │   │   ├── FormSelect/
│   │   │   ├── ImageGallery/
│   │   │   ├── Pagination/
│   │   │   └── icons/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── config/
│   │   ├── localization/
│   │   └── theme/
│   │
│   └── store/                        # Глобальное состояние Zustand
│       ├── auth.ts
│       ├── ui.ts
│       └── index.ts
│
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Структура Backend

```
backend/
├── src/
│   ├── app.ts                        # Express приложение
│   ├── server.ts                     # Точка входа
│   │
│   ├── config/
│   │   ├── database.ts               # MongoDB подключение
│   │   ├── env.ts                    # Переменные окружения
│   │   ├── cors.ts                   # CORS настройки
│   │   └── swagger.ts                # OpenAPI конфигурация
│   │
│   ├── modules/                      # API модули
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.types.ts
│   │   ├── users/
│   │   ├── breeders/
│   │   ├── breeds/
│   │   ├── listings/
│   │   ├── documents/
│   │   ├── inquiries/
│   │   ├── reviews/
│   │   ├── notifications/
│   │   └── admin/
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT верификация
│   │   ├── role.middleware.ts        # Проверка ролей
│   │   ├── validation.middleware.ts  # Zod валидация
│   │   ├── upload.middleware.ts      # Multer для файлов
│   │   ├── error.middleware.ts       # Обработка ошибок
│   │   └── rateLimit.middleware.ts   # Rate limiting
│   │
│   ├── shared/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   │
│   └── routes/
│       └── index.ts                  # Главный роутер
│
├── tests/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Правила взаимодействия между слоями

### Frontend

```
app → может импортировать из pages, modules, shared, store
pages → может импортировать из modules, shared, store
modules → может импортировать только из shared и store
shared → не может импортировать из вышестоящих слоёв
store → может импортировать только из shared
```

### Backend

```
routes → импортирует controllers
controllers → импортирует services, validation
services → импортирует models, shared/utils
models → независимы
middleware → импортирует shared/utils
```

---

## Структура модуля (Frontend)

Каждый модуль имеет стандартную структуру:

```
modules/module-name/
├── components/           # React компоненты
│   ├── ComponentName/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   └── schema.ts     # Zod схема (для форм)
├── hooks/                # Кастомные хуки
│   ├── useModuleLogic.ts
│   └── useModuleQuery.ts
├── schemas/              # Zod схемы валидации
├── types/                # TypeScript типы
│   └── index.ts
├── utils/                # Утилиты модуля
└── index.ts              # Публичное API модуля
```

---

## Структура модуля (Backend)

```
modules/module-name/
├── module.controller.ts  # HTTP обработчики
├── module.service.ts     # Бизнес-логика
├── module.model.ts       # Mongoose модель
├── module.routes.ts      # Express роуты
├── module.validation.ts  # Zod схемы
└── module.types.ts       # TypeScript типы
```

---

## Диаграмма взаимодействия

```
┌─────────────────────────────────────────────────────────────┐
│                         КЛИЕНТ                              │
│                    (React + Chakra UI)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         СЕРВЕР                              │
│                    (Express.js + JWT)                       │
├─────────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Models                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      БАЗА ДАННЫХ                            │
│                       (MongoDB)                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ВНЕШНИЕ СЕРВИСЫ                           │
│         Cloudinary (файлы) | Nodemailer (email)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Окружения

| Окружение | Описание |
|-----------|----------|
| **development** | Локальная разработка |
| **staging** | Тестовый сервер |
| **production** | Боевой сервер |

## Переменные окружения

Смотри файлы `.env.example` в папках `frontend/` и `backend/`.

