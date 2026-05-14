# Технологический стек

## Frontend

### Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19.x | UI библиотека |
| TypeScript | 5.x | Типизация |
| Vite | 6.x | Сборка и dev-сервер |

### UI и стилизация

| Технология | Версия | Назначение |
|------------|--------|------------|
| Chakra UI | 3.x | Компоненты интерфейса |
| Framer Motion | 11.x | Анимации |

### Состояние и данные

| Технология | Версия | Назначение |
|------------|--------|------------|
| React Query | 5.x | Серверное состояние, кэширование |
| Zustand | 5.x | Глобальное состояние |
| React Hook Form | 7.x | Формы |
| Zod | 3.x | Валидация схем |

### Роутинг и локализация

| Технология | Версия | Назначение |
|------------|--------|------------|
| React Router | 7.x | Маршрутизация |
| i18next | 24.x | Локализация |
| react-i18next | 15.x | React интеграция i18next |

### Утилиты

| Технология | Назначение |
|------------|------------|
| Axios | HTTP клиент |
| date-fns | Работа с датами |
| react-dropzone | Загрузка файлов |

---

## Backend

### Основные технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20.x LTS | Среда выполнения |
| Express.js | 4.x | Web framework |
| TypeScript | 5.x | Типизация |

### База данных

| Технология | Версия | Назначение |
|------------|--------|------------|
| MongoDB | 7.x | База данных |
| Mongoose | 8.x | ODM для MongoDB |

### Аутентификация

| Технология | Назначение |
|------------|------------|
| jsonwebtoken | JWT токены |
| bcryptjs | Хеширование паролей |
| passport | Стратегии аутентификации |

### Валидация

| Технология | Назначение |
|------------|------------|
| Zod | Валидация схем |
| express-validator | Валидация запросов (альтернатива) |

### Загрузка файлов

| Технология | Назначение |
|------------|------------|
| Multer | Парсинг multipart/form-data |
| Cloudinary | Хранение изображений |

### Email

| Технология | Назначение |
|------------|------------|
| Nodemailer | Отправка email |
| Handlebars | Шаблоны писем |

### Безопасность

| Технология | Назначение |
|------------|------------|
| Helmet | HTTP заголовки безопасности |
| cors | CORS настройки |
| express-rate-limit | Rate limiting |

### Документация

| Технология | Назначение |
|------------|------------|
| Swagger UI Express | Интерактивная документация API |
| swagger-jsdoc | Генерация OpenAPI из JSDoc |

---

## Инфраструктура

### Хостинг

| Сервис | Назначение |
|--------|------------|
| Vercel | Frontend хостинг |
| Railway / Render | Backend хостинг |
| MongoDB Atlas | Облачная база данных |
| Cloudinary | Хранение изображений |

### CI/CD

| Сервис | Назначение |
|--------|------------|
| GitHub Actions | CI/CD пайплайны |
| GitHub | Репозиторий кода |

### Мониторинг (опционально)

| Сервис | Назначение |
|--------|------------|
| Sentry | Отслеживание ошибок |

---

## Инструменты разработки

### Редактор

| Инструмент | Назначение |
|------------|------------|
| VS Code / Cursor | IDE |
| ESLint | Линтинг |
| Prettier | Форматирование |

### Тестирование

| Инструмент | Назначение |
|------------|------------|
| Vitest | Unit тесты |
| Testing Library | Тестирование React |
| Supertest | Тестирование API |

---

## Переменные окружения

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pedigreehub

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@pedigreehub.pl

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS and emails)
FRONTEND_URL=http://localhost:5173
```

