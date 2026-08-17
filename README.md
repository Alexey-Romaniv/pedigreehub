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
