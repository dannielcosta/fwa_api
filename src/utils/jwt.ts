import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { UserRole } from '@prisma/client'

export interface AccessTokenPayload {
  sub: string
  role: UserRole
}

const ACCESS_TOKEN_TTL = '15m'

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.TOKEN_SECRET) as AccessTokenPayload
}
