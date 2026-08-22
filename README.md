# PedigreeHub

Платформа для заводчиков породистых собак с верификацией

## Описание

PedigreeHub — специализированная веб-платформа для легальной продажи породистых собак с полной документацией. Система обеспечивает верификацию заводчиков и документов животных.

## Технологический стек

### Frontend
- React 19 + TypeScript
- Chakra UI v3
- React Query + Zustand
- React Hook Form + Zod
- Vite

### Backend
- Express.js + TypeScript
- MongoDB + Mongoose
- JWT аутентификация
- Cloudinary (файлы)
- Nodemailer (email)

## Быстрый старт

### Требования
- Node.js 18+
- MongoDB 6+
- Yarn

### Backend

```bash
cd backend
cp env.example .env
# Отредактируйте .env файл

yarn install
yarn dev
```

Сервер запустится на http://localhost:3000

### Frontend

```bash
cd frontend
cp env.example .env
# Отредактируйте .env файл

yarn install
yarn dev
```

Приложение запустится на http://localhost:5173

## Структура проекта

```
pedigreehub-docs/
├── docs/                   # Документация проекта
│   ├── README.md           # Обзор проекта
│   ├── ARCHITECTURE.md     # Архитектура
│   ├── USER-FLOWS.md       # Пользовательские сценарии
│   ├── MODULES.md          # Описание модулей
│   ├── DATA-MODELS.md      # Модели данных
│   ├── API.md              # API документация
│   ├── TEAM-SPLIT.md       # Разделение работы
│   ├── TECH-STACK.md       # Технологии
│   └── DEVELOPMENT-PLAN.md # План разработки
│
├── frontend/               # React приложение
│   ├── src/
│   │   ├── app/            # Провайдеры, роутер
│   │   ├── pages/          # Страницы
│   │   ├── modules/        # Бизнес-модули
│   │   ├── shared/         # Переиспользуемое
│   │   └── store/          # Zustand
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                # Express API
    ├── src/
    │   ├── config/         # Конфигурация
    │   ├── modules/        # API модули
    │   ├── middleware/     # Middleware
    │   └── routes/         # Роуты
    ├── package.json
    └── tsconfig.json
```

## Документация

| Документ | Описание |
|----------|----------|
| [README](./docs/README.md) | Обзор проекта |
| [Архитектура](./docs/ARCHITECTURE.md) | Структура и слои |
| [User Flows](./docs/USER-FLOWS.md) | Пользовательские сценарии |
| [Модули](./docs/MODULES.md) | Описание модулей |
| [Модели данных](./docs/DATA-MODELS.md) | MongoDB схемы |
| [API](./docs/API.md) | REST эндпоинты |
| [Команда](./docs/TEAM-SPLIT.md) | Разделение задач |
| [Технологии](./docs/TECH-STACK.md) | Стек технологий |
| [План](./docs/DEVELOPMENT-PLAN.md) | План на 8 недель |

## Роли пользователей

| Роль | Возможности |
|------|-------------|
| **Гость** | Просмотр каталога, фильтрация |
| **Пользователь** | + Отправка запросов, отзывы |
| **Заводчик** | + Создание объявлений, управление |
| **Администратор** | + Верификация, модерация |

## Основные команды

### Backend
```bash
yarn dev          # Запуск в режиме разработки
yarn build        # Сборка
yarn start        # Запуск production
```

### Frontend
```bash
yarn dev          # Запуск в режиме разработки
yarn build        # Сборка
yarn preview      # Просмотр сборки
```

## План разработки

- **Неделя 1-2:** Setup + Auth
- **Неделя 3-4:** Core API + Catalog
- **Неделя 5-6:** Panels (Breeder + Admin)
- **Неделя 7:** Polish + Testing
- **Неделя 8:** Deploy

## Лицензия

MIT License © 2024

