import { describe, expect, it } from 'vitest'
import { signAccessToken, verifyAccessToken } from './jwt.js'

describe('access token', () => {
  it('round-trips the payload', () => {
    const token = signAccessToken({ sub: 'user_123', role: 'USER' })
    const payload = verifyAccessToken(token)

    expect(payload.sub).toBe('user_123')
    expect(payload.role).toBe('USER')
  })

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user_123', role: 'USER' })
    const tampered = token.slice(0, -1) + (token.at(-1) === 'a' ? 'b' : 'a')

    expect(() => verifyAccessToken(tampered)).toThrow()
  })
})
