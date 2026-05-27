import { describe, expect, it } from 'vitest'
import { isPublicApiRoute } from '../../../server/utils/api-auth-routes'

describe('isPublicApiRoute', () => {
  it('allows POST /api/auth/login', () => {
    expect(isPublicApiRoute('/api/auth/login', 'POST')).toBe(true)
    expect(isPublicApiRoute('/api/auth/login', 'GET')).toBe(false)
  })

  it('allows POST /api/auth/logout', () => {
    expect(isPublicApiRoute('/api/auth/logout', 'POST')).toBe(true)
  })

  it('protects other API routes', () => {
    expect(isPublicApiRoute('/api/auth/session', 'GET')).toBe(false)
    expect(isPublicApiRoute('/api/db/health', 'GET')).toBe(false)
  })
})
