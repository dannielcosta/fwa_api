import { describe, expect, it } from 'vitest'
import { createOpaqueToken, hashSecret, parseOpaqueToken } from './opaque-token.js'

describe('opaque token', () => {
  it('creates a token whose parsed secret hashes to the stored hash', () => {
    const { id, token, secretHash } = createOpaqueToken()
    const parsed = parseOpaqueToken(token)

    expect(parsed).not.toBeNull()
    expect(parsed?.id).toBe(id)
    expect(hashSecret(parsed!.secret)).toBe(secretHash)
  })

  it('generates unique tokens on each call', () => {
    const a = createOpaqueToken()
    const b = createOpaqueToken()
    expect(a.token).not.toBe(b.token)
  })

  it('fails to parse a malformed token', () => {
    expect(parseOpaqueToken('not-a-valid-token')).toBeNull()
    expect(parseOpaqueToken('')).toBeNull()
  })

  it('rejects a tampered secret against the original hash', () => {
    const { secretHash } = createOpaqueToken()
    expect(hashSecret('a-different-secret')).not.toBe(secretHash)
  })
})
