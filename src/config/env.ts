import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5005),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL é obrigatório'),

  TOKEN_SECRET: z.string().min(32, 'TOKEN_SECRET deve ter pelo menos 32 caracteres'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET deve ter pelo menos 32 caracteres'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  throw new Error('Configuração de ambiente inválida.')
}

export const env = parsed.data
