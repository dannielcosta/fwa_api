import { prisma } from '../../config/prisma.js'
import type { Prisma } from '@prisma/client'

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data })
  },

  updatePasswordHash(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  },

  createRefreshToken(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data })
  },

  findRefreshToken(id: string) {
    return prisma.refreshToken.findUnique({ where: { id } })
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } })
  },

  revokeAllRefreshTokensForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  },

  createPasswordResetToken(data: {
    id: string
    userId: string
    tokenHash: string
    expiresAt: Date
  }) {
    return prisma.passwordResetToken.create({ data })
  },

  findPasswordResetToken(id: string) {
    return prisma.passwordResetToken.findUnique({ where: { id } })
  },

  markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } })
  },
}
