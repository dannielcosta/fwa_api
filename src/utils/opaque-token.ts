import { randomBytes, randomUUID, createHash } from 'node:crypto'

// Padrão usado para refresh tokens e tokens de reset de password: o token
// enviado ao cliente é `{id}.{secret}` — o `id` permite um lookup O(1) na
// base de dados, e só o hash do `secret` é guardado, para que uma fuga de
// dados da BD não permita reutilizar os tokens.

export interface OpaqueToken {
  id: string
  token: string
  secretHash: string
}

export function createOpaqueToken(): OpaqueToken {
  const id = randomUUID()
  const secret = randomBytes(32).toString('hex')
  return {
    id,
    token: `${id}.${secret}`,
    secretHash: hashSecret(secret),
  }
}

export function parseOpaqueToken(token: string): { id: string; secret: string } | null {
  const [id, secret] = token.split('.')
  if (!id || !secret) return null
  return { id, secret }
}

export function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex')
}
