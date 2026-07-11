import type { Request, Response } from 'express'
import { env } from '../../config/env.js'
import { authService } from './auth.service.js'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from './auth.dto.js'

const REFRESH_COOKIE_NAME = 'fwa_refresh'
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS)
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_OPTIONS.path })
}

export const authController = {
  async signup(req: Request, res: Response) {
    const input = signupSchema.parse(req.body)
    const { accessToken, refreshToken, user } = await authService.signup(input)
    setRefreshCookie(res, refreshToken)
    res.status(201).json({ accessToken, user })
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body)
    const { accessToken, refreshToken, user } = await authService.login(input)
    setRefreshCookie(res, refreshToken)
    res.status(200).json({ accessToken, user })
  },

  async refresh(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.refresh(
      req.cookies?.[REFRESH_COOKIE_NAME],
    )
    setRefreshCookie(res, refreshToken)
    res.status(200).json({ accessToken, user })
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME])
    clearRefreshCookie(res)
    res.status(204).send()
  },

  async forgotPassword(req: Request, res: Response) {
    const input = forgotPasswordSchema.parse(req.body)
    await authService.forgotPassword(input)
    res.status(200).json({ message: 'Se o email existir, foi enviado um link de recuperação.' })
  },

  async resetPassword(req: Request, res: Response) {
    const input = resetPasswordSchema.parse(req.body)
    await authService.resetPassword(input)
    res.status(200).json({ message: 'Password alterada com sucesso.' })
  },

  async changePassword(req: Request, res: Response) {
    const input = changePasswordSchema.parse(req.body)
    await authService.changePassword(req.user!.sub, input.currentPassword, input.newPassword)
    res.status(200).json({ message: 'Password alterada com sucesso.' })
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.sub)
    res.status(200).json({ user })
  },
}
