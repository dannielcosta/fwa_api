import { HttpError } from '../../middlewares/error-handler.js'
import { comparePassword, hashPassword } from '../../utils/password.js'
import { signAccessToken } from '../../utils/jwt.js'
import { createOpaqueToken, hashSecret, parseOpaqueToken } from '../../utils/opaque-token.js'
import { sendMail } from '../../utils/mailer.js'
import { env } from '../../config/env.js'
import { authRepository } from './auth.repository.js'
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from './auth.dto.js'
import type { User } from '@prisma/client'

const REFRESH_TOKEN_TTL_DAYS = 30
const RESET_TOKEN_TTL_HOURS = 1

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    address: user.address,
    role: user.role,
  }
}

async function issueSession(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role })

  const opaque = createOpaqueToken()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  await authRepository.createRefreshToken({
    id: opaque.id,
    userId: user.id,
    tokenHash: opaque.secretHash,
    expiresAt,
  })

  return { accessToken, refreshToken: opaque.token, user: toPublicUser(user) }
}

export const authService = {
  async signup(input: SignupInput) {
    const existing = await authRepository.findUserByEmail(input.email)
    if (existing) {
      throw new HttpError(409, 'Já existe uma conta com este email.')
    }

    const passwordHash = await hashPassword(input.password)
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      address: input.address,
      birthDate: input.birthDate,
      nationality: input.nationality,
      nif: input.nif,
      weight: input.weight,
      height: input.height,
    })

    return issueSession(user)
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email)
    if (!user) {
      throw new HttpError(401, 'Credenciais inválidas.')
    }

    const valid = await comparePassword(input.password, user.passwordHash)
    if (!valid) {
      throw new HttpError(401, 'Credenciais inválidas.')
    }

    return issueSession(user)
  },

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new HttpError(401, 'Sessão inválida.')
    }

    const parsed = parseOpaqueToken(refreshToken)
    if (!parsed) {
      throw new HttpError(401, 'Sessão inválida.')
    }

    const stored = await authRepository.findRefreshToken(parsed.id)
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashSecret(parsed.secret)
    ) {
      throw new HttpError(401, 'Sessão expirada. Autentica-te novamente.')
    }

    await authRepository.revokeRefreshToken(stored.id)

    const user = await authRepository.findUserById(stored.userId)
    if (!user) {
      throw new HttpError(401, 'Sessão inválida.')
    }

    return issueSession(user)
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return
    const parsed = parseOpaqueToken(refreshToken)
    if (!parsed) return
    const stored = await authRepository.findRefreshToken(parsed.id)
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id)
    }
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await authRepository.findUserByEmail(input.email)
    // Não revela se o email existe ou não — resposta é sempre a mesma.
    if (!user) return

    const opaque = createOpaqueToken()
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000)
    await authRepository.createPasswordResetToken({
      id: opaque.id,
      userId: user.id,
      tokenHash: opaque.secretHash,
      expiresAt,
    })

    const resetLink = `${env.FRONTEND_URL}/recuperar-password/confirmar?token=${opaque.token}`
    try {
      await sendMail({
        to: user.email,
        subject: 'FWA — Recuperar password',
        html: `<p>Olá ${user.firstName},</p><p>Recebemos um pedido para repor a tua password. O link é válido durante ${RESET_TOKEN_TTL_HOURS} hora(s):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se não pediste isto, ignora este email.</p>`,
      })
    } catch (err) {
      // Uma falha no envio não pode transformar-se num 500 nem revelar ao
      // cliente se o email existe — fica registada para investigação.
      console.error('[auth] falha ao enviar email de recuperação de password:', err)
    }
  },

  async resetPassword(input: ResetPasswordInput) {
    const parsed = parseOpaqueToken(input.token)
    if (!parsed) {
      throw new HttpError(400, 'Token inválido.')
    }

    const stored = await authRepository.findPasswordResetToken(parsed.id)
    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashSecret(parsed.secret)
    ) {
      throw new HttpError(400, 'Token inválido ou expirado.')
    }

    const passwordHash = await hashPassword(input.newPassword)
    await authRepository.updatePasswordHash(stored.userId, passwordHash)
    await authRepository.markPasswordResetTokenUsed(stored.id)
    await authRepository.revokeAllRefreshTokensForUser(stored.userId)
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) {
      throw new HttpError(404, 'Utilizador não encontrado.')
    }

    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) {
      throw new HttpError(401, 'Password atual incorreta.')
    }

    const passwordHash = await hashPassword(newPassword)
    await authRepository.updatePasswordHash(userId, passwordHash)
    await authRepository.revokeAllRefreshTokensForUser(userId)
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) {
      throw new HttpError(404, 'Utilizador não encontrado.')
    }
    return toPublicUser(user)
  },
}
