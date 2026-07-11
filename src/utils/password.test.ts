import { describe, expect, it } from 'vitest'
import { comparePassword, hashPassword } from './password.js'

describe('password hashing', () => {
  it('produces a hash different from the plain text', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).not.toBe('correct horse battery staple')
  })

  it('verifies a matching password', async () => {
    const hash = await hashPassword('super-secret-123')
    await expect(comparePassword('super-secret-123', hash)).resolves.toBe(true)
  })

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('super-secret-123')
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false)
  })
})
