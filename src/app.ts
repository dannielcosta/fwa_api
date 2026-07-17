import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { corsOptions } from './config/cors.js'
import { swaggerSpec } from './config/swagger.js'
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js'
import authRoutes from './modules/auth/auth.routes.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors(corsOptions))
  app.use(morgan('dev'))
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  app.use('/auth', authRoutes)

  // Restantes módulos registados à medida que forem implementados (ver plano):
  // app.use('/api/plans', plansRoutes)
  // ...

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
