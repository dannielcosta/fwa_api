import type { CorsOptions } from 'cors'
import { env } from './env.js'

const allowedOrigins = [env.FRONTEND_URL]

// IP de rede local (192.168.x.x / 10.x.x.x / 172.16-31.x.x) — permite testar
// a partir de outro dispositivo (ex.: telemóvel) na mesma rede em dev.
const isLocalNetworkOrigin = (origin: string) =>
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin,
  )

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') ||
      isLocalNetworkOrigin(origin)
    ) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}
