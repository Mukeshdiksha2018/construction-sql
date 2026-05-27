import { describe, expect, it } from 'vitest'
import { DEFAULT_AUTHENTICATED_ROUTE, getSafeRedirect } from '../../../app/utils/safe-redirect'

describe('getSafeRedirect', () => {
  it('returns fallback for null/undefined', () => {
    expect(getSafeRedirect(null)).toBe(DEFAULT_AUTHENTICATED_ROUTE)
    expect(getSafeRedirect(undefined)).toBe(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('returns fallback for empty or non-path values', () => {
    expect(getSafeRedirect('')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
    expect(getSafeRedirect('projects')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
    expect(getSafeRedirect('https://evil.com')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('blocks open redirects', () => {
    expect(getSafeRedirect('//evil.com')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
    expect(getSafeRedirect('/ok/javascript:alert(1)')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
    expect(getSafeRedirect('/ok/data:text/html,x')).toBe(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('allows safe same-origin paths', () => {
    expect(getSafeRedirect('/projects')).toBe('/projects')
    expect(getSafeRedirect('  /reports  ')).toBe('/reports')
  })

  it('uses custom fallback when provided', () => {
    expect(getSafeRedirect(null, '/home')).toBe('/home')
  })
})
