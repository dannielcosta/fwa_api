import { describe, expect, it } from 'vitest'
import { loginSchema, resetPasswordSchema, signupSchema } from './auth.dto.js'

describe('signupSchema', () => {
  it('accepts a valid payload', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'Rita',
      lastName: 'Almeida',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
      firstName: 'Rita',
      lastName: 'Almeida',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      firstName: 'Rita',
      lastName: 'Almeida',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing firstName', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      lastName: 'Almeida',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('rejects a weak new password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'abc.def', newPassword: 'short' })
    expect(result.success).toBe(false)
  })
})
