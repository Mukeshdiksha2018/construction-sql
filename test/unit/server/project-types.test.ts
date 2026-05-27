import { describe, expect, it } from 'vitest'
import {
  parseProjectTypeBody,
  parseProjectTypeUpdateBody,
} from '../../../server/utils/project-types'

describe('project-types utilities', () => {
  it('validates and normalizes create body', () => {
    expect(parseProjectTypeBody({
      name: 'Residential',
      description: 'Residential projects',
      color: '#3b82f6',
      isActive: true,
    })).toEqual({
      name: 'Residential',
      description: 'Residential projects',
      color: '#3B82F6',
      isActive: true,
    })
  })

  it('applies defaults for create body', () => {
    expect(parseProjectTypeBody({
      name: 'Commercial',
    })).toEqual({
      name: 'Commercial',
      description: null,
      color: '#3B82F6',
      isActive: true,
    })
  })

  it('rejects create body without name', () => {
    expect(() => parseProjectTypeBody({
      name: '   ',
    })).toThrowError(/Name is required/)
  })

  it('rejects create body with invalid color', () => {
    expect(() => parseProjectTypeBody({
      name: 'Commercial',
      color: 'blue',
    })).toThrowError(/Color must be a valid HEX value/)
  })

  it('validates update body and keeps optional fields', () => {
    expect(parseProjectTypeUpdateBody({
      name: 'Hospitality',
      description: '',
      color: '#00ff00',
      isActive: false,
    })).toEqual({
      name: 'Hospitality',
      description: null,
      color: '#00FF00',
      isActive: false,
    })
  })

  it('rejects empty update body', () => {
    expect(() => parseProjectTypeUpdateBody({})).toThrowError(/At least one field is required/)
  })
})
