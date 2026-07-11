# FWA API

Backend da **FWA — Fitness Workout Academy**. Express + TypeScript + Prisma

- PostgreSQL, organizado em Clean Architecture (módulo → controller →
  service → repository).

## Stack

- Node.js + Express + TypeScript (ESM)
- PostgreSQL + Prisma ORM
- Zod (validação)
- JWT (access + refresh token) + bcryptjs
- Stripe (subscrições)
- Cloudinary (vídeos)
- Swagger/OpenAPI (`/docs`)
- Vitest (testes unitários)

## A correr localmente

Pré-requisitos: Node 20+, Docker Desktop.

```bash
docker compose up -d        # Postgres local (porta 5433 — ver nota abaixo)
cp .env.example .env        # e preenche os segredos reais
npm install
npm run prisma:migrate      # aplica o schema
npm run prisma:seed         # semeia os 4 planos
npm run dev                 # http://localhost:5005
```

- Health check: `GET /health`
- Documentação da API: `GET /docs`

> **Nota sobre a porta do Postgres**: o `docker-compose.yml` expõe o
> Postgres do projeto em `5433` (não `5432`) porque esta máquina já tem um
> Postgres nativo/Supabase local a ocupar a porta 5432. Se a tua máquina
> não tiver esse conflito, podes alterar para `5432:5432` e ajustar
> `DATABASE_URL` em conformidade.

## Estrutura

```
src/
  modules/        # auth, users, subscriptions, trainings, categories,
                   # videos, payments, support — cada um com
                   # controller/service/repository/routes/dto próprios
  middlewares/     # error handler, auth guard, rate limit, etc.
  config/          # env, prisma client, cors, swagger
prisma/
  schema.prisma    # modelo de dados
  seed.ts          # seed dos planos
```

## Segurança

O `.env` **não** deve ser commitado (está no `.gitignore`). Se em algum
momento um segredo real for exposto no histórico do git, roda-o
imediatamente no respetivo painel (Stripe, cPanel, etc.) — rodar invalida
o valor antigo independentemente de conseguires reescrever o histórico.
