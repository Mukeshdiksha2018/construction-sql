import { describe, expect, it } from 'vitest'
import { getSafeRedirect } from '../../../app/utils/safe-redirect'

describe('getSafeRedirect', () => {
  it('returns fallback for null/undefined', () => {
    expect(getSafeRedirect(null)).toBe('/dashboard')
    expect(getSafeRedirect(undefined)).toBe('/dashboard')
  })

  it('returns fallback for empty or non-path values', () => {
    expect(getSafeRedirect('')).toBe('/dashboard')
    expect(getSafeRedirect('dashboard')).toBe('/dashboard')
    expect(getSafeRedirect('https://evil.com')).toBe('/dashboard')
  })

  it('blocks open redirects', () => {
    expect(getSafeRedirect('//evil.com')).toBe('/dashboard')
    expect(getSafeRedirect('/ok/javascript:alert(1)')).toBe('/dashboard')
    expect(getSafeRedirect('/ok/data:text/html,x')).toBe('/dashboard')
  })

  it('allows safe same-origin paths', () => {
    expect(getSafeRedirect('/projects')).toBe('/projects')
    expect(getSafeRedirect('  /reports  ')).toBe('/reports')
  })

  it('uses custom fallback when provided', () => {
    expect(getSafeRedirect(null, '/home')).toBe('/home')
  })
})
