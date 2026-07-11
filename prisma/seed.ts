import { PrismaClient, PlanPeriod } from '@prisma/client'

const prisma = new PrismaClient()

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
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
