import { describe, expect, it } from 'vitest'
import { isPublicApiRoute, requiresAuthForMethod } from '../../../server/utils/api-auth-routes'

describe('isPublicApiRoute', () => {
  describe('auth endpoints', () => {
    it('allows POST /api/auth/login only', () => {
      expect(isPublicApiRoute('/api/auth/login', 'POST')).toBe(true)
      expect(isPublicApiRoute('/api/auth/login', 'GET')).toBe(false)
    })

    it('allows POST /api/auth/logout', () => {
      expect(isPublicApiRoute('/api/auth/logout', 'POST')).toBe(true)
    })

    it('allows GET /api/auth/session', () => {
      expect(isPublicApiRoute('/api/auth/session', 'GET')).toBe(true)
      expect(isPublicApiRoute('/api/auth/session', 'POST')).toBe(false)
    })

    it('allows POST /api/auth/exchange-oauth', () => {
      expect(isPublicApiRoute('/api/auth/exchange-oauth', 'POST')).toBe(true)
    })
  })

  describe('Nuxt internal prefix routes (always public)', () => {
    it('allows any method on /api/_nuxt_icon/* (icon requests)', () => {
      expect(isPublicApiRoute('/api/_nuxt_icon/heroicons.json', 'GET')).toBe(true)
      expect(isPublicApiRoute('/api/_nuxt_icon/ri.json?icons=building-fill', 'GET')).toBe(true)
      expect(isPublicApiRoute('/api/_nuxt_icon/lucide.json', 'GET')).toBe(true)
    })

    it('allows /api/_hub/* routes', () => {
      expect(isPublicApiRoute('/api/_hub/health', 'GET')).toBe(true)
    })

    it('allows /api/_content/* routes', () => {
      expect(isPublicApiRoute('/api/_content/query', 'GET')).toBe(true)
    })

    it('does NOT exempt partial-prefix matches that are not prefixed routes', () => {
      // "/api/_nuxt_icon_custom" does not start with "/api/_nuxt_icon/" (no trailing slash match)
      // The prefix ends with '/', so "icon_custom" won't match
      expect(isPublicApiRoute('/api/_nuxt_icon_custom/something', 'GET')).toBe(false)
    })
  })

  describe('protected routes', () => {
    it('marks arbitrary API routes as not public', () => {
      expect(isPublicApiRoute('/api/projects', 'GET')).toBe(false)
      expect(isPublicApiRoute('/api/purchase-order-forms', 'GET')).toBe(false)
      expect(isPublicApiRoute('/api/ship-via', 'GET')).toBe(false)
      expect(isPublicApiRoute('/api/credit-days', 'GET')).toBe(false)
    })

    it('requires auth only for mutating HTTP methods', () => {
      expect(requiresAuthForMethod('GET')).toBe(false)
      expect(requiresAuthForMethod('HEAD')).toBe(false)
      expect(requiresAuthForMethod('POST')).toBe(true)
      expect(requiresAuthForMethod('PUT')).toBe(true)
      expect(requiresAuthForMethod('PATCH')).toBe(true)
      expect(requiresAuthForMethod('DELETE')).toBe(true)
    })

    it('protects admin/DB-level routes', () => {
      expect(isPublicApiRoute('/api/db/health', 'GET')).toBe(false)
    })

    it('is case-insensitive on method (uppercase comparison)', () => {
      expect(isPublicApiRoute('/api/auth/login', 'post')).toBe(true)
      expect(isPublicApiRoute('/api/auth/login', 'Post')).toBe(true)
    })
  })
})
