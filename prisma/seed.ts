import { PrismaClient, PlanPeriod, UserRole } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'

const prisma = new PrismaClient()

// DEV ONLY — credenciais fixas só para haver uma conta admin em ambiente
// de desenvolvimento (não existe nenhum outro caminho para criar uma:
// o signup nunca aceita role, e não há endpoint de promoção). Nunca usar
// em produção.
const DEV_ADMIN = {
  email: 'admin@fwa.pt',
  password: 'admin12345',
  firstName: 'Admin',
  lastName: 'FWA',
}

// Mantido em sincronia com src/features/landing/data.ts no fwa_frontend
// até o passo 7 (Landing Page passa a consumir GET /plans).
const plans = [
  {
    slug: 'weekly',
    name: 'SEMANAL',
    price: 4,
    period: PlanPeriod.WEEKLY,
    saving: null,
    featured: false,
    badge: null,
    features: ['Acesso a todos os vídeos', '1 plano de treino', 'Suporte básico'],
  },
  {
    slug: 'monthly',
    name: 'MENSAL',
    price: 14,
    period: PlanPeriod.MONTHLY,
    saving: 'Poupa 30%',
    featured: false,
    badge: null,
    features: ['Acesso a todos os vídeos', 'Acesso a todos os planos', 'Suporte avançado'],
  },
  {
    slug: 'quarterly',
    name: 'TRIMESTRAL',
    price: 35,
    period: PlanPeriod.QUARTERLY,
    saving: 'Poupa 38%',
    featured: true,
    badge: 'Mais Popular',
    features: ['Acesso a todos os vídeos', 'Acesso a todos os planos', 'Suporte prioritário'],
  },
  {
    slug: 'annual',
    name: 'ANUAL',
    price: 99,
    period: PlanPeriod.ANNUAL,
    saving: 'Poupa 52%',
    featured: false,
    badge: null,
    features: ['Acesso a todos os vídeos', 'Acesso a todos os planos', 'Suporte prioritário'],
  },
]

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    })
  }
  console.log(`Seed concluído: ${plans.length} planos.`)

  const passwordHash = await hashPassword(DEV_ADMIN.password)
  await prisma.user.upsert({
    where: { email: DEV_ADMIN.email },
    update: { role: UserRole.ADMIN },
    create: {
      email: DEV_ADMIN.email,
      passwordHash,
      firstName: DEV_ADMIN.firstName,
      lastName: DEV_ADMIN.lastName,
      role: UserRole.ADMIN,
    },
  })
  console.log(
    `Seed concluído: conta admin dev pronta (${DEV_ADMIN.email} / ${DEV_ADMIN.password}).`,
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
