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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
