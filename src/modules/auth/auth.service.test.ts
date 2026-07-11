import { describe, expect, it, vi, beforeEach } from 'vitest'

const { findUserByEmail, createPasswordResetToken } = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  createPasswordResetToken: vi.fn(),
}))

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findUserByEmail,
    createPasswordResetToken,
  },
}))

vi.mock('../../utils/mailer.js', () => ({
  sendMail: vi.fn().mockRejectedValue(new Error('SMTP indisponível')),
}))

const { authService } = await import('./auth.service.js')

describe('authService.forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não rebenta quando o envio de email falha', async () => {
    findUserByEmail.mockResolvedValue({
      id: 'user_1',
      email: 'rita@example.com',
      firstName: 'Rita',
    })
    createPasswordResetToken.mockResolvedValue({})

    await expect(authService.forgotPassword({ email: 'rita@example.com' })).resolves.toBeUndefined()
  })

  it('não revela se o email não existe (não cria token nem lança erro)', async () => {
    findUserByEmail.mockResolvedValue(null)

    await expect(
      authService.forgotPassword({ email: 'inexistente@example.com' }),
    ).resolves.toBeUndefined()
    expect(createPasswordResetToken).not.toHaveBeenCalled()
  })
})
