import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias em dev (tsx watch reinicia o módulo a cada save).
declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
