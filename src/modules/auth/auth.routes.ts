import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from './auth.controller.js'
import { requireAuth } from '../../middlewares/require-auth.js'
import { asyncHandler } from '../../utils/async-handler.js'

const router = Router()

// Rate limit mais apertado nas rotas sensíveis a força-bruta.
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Criar conta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201: { description: Conta criada, sessão iniciada }
 *       409: { description: Já existe uma conta com este email }
 */
router.post('/signup', strictLimiter, asyncHandler(authController.signup))

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sessão
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Sessão iniciada }
 *       401: { description: Credenciais inválidas }
 */
router.post('/login', strictLimiter, asyncHandler(authController.login))

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token a partir do refresh token (cookie httpOnly)
 *     responses:
 *       200: { description: Novo access token emitido }
 *       401: { description: Sessão inválida ou expirada }
 */
router.post('/refresh', asyncHandler(authController.refresh))

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Terminar sessão
 *     responses:
 *       204: { description: Sessão terminada }
 */
router.post('/logout', asyncHandler(authController.logout))

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Pedir link de recuperação de password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Email enviado se a conta existir }
 */
router.post('/forgot-password', strictLimiter, asyncHandler(authController.forgotPassword))

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Repor password a partir do token recebido por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password alterada }
 *       400: { description: Token inválido ou expirado }
 */
router.post('/reset-password', strictLimiter, asyncHandler(authController.resetPassword))

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Alterar password (autenticado)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Password alterada }
 *       401: { description: Password atual incorreta ou sessão inválida }
 */
router.patch('/change-password', requireAuth, asyncHandler(authController.changePassword))

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dados do utilizador autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Utilizador autenticado }
 *       401: { description: Sessão inválida }
 */
router.get('/me', requireAuth, asyncHandler(authController.me))

export default router
