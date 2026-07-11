import type { CorsOptions } from 'cors'
import { env } from './env.js'

const allowedOrigins = [env.FRONTEND_URL]

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}
