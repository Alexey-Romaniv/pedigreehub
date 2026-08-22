import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { errorMiddleware } from './middleware/error.middleware.js'
import { routes } from './routes/index.js'
import { swaggerSpec } from './config/swagger.js'

export const app = express()

// Swagger UI — до helmet, иначе CSP блокирует inline-скрипты UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec))

// Middleware
app.use(helmet())

// FRONTEND_URL может содержать несколько адресов через запятую
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Домены Cloudflare Pages проекта: сам проект (имя может быть с суффиксом,
// напр. pedigreehub-2of) и его превью-деплои <hash>.<projekt>.pages.dev
const pagesOriginPattern = /^https:\/\/([a-z0-9-]+\.)?pedigreehub\.pages\.dev$/

app.use(cors({
  origin: (origin, callback) => {
    // Запросы без Origin (Swagger, curl, health-check) не блокируем
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    if (pagesOriginPattern.test(origin)) return callback(null, true)
    // В dev разрешаем любой localhost — порт Vite меняется
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorMiddleware)

