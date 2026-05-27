import { describe, expect, it } from 'vitest'
import {
  parseServiceTypeBody,
  parseServiceTypeUpdateBody,
} from '../../../server/utils/service-types'

describe('service-types utilities', () => {
  it('validates and normalizes create body', () => {
    expect(parseServiceTypeBody({
      name: 'Electrical',
      description: 'Electrical services',
      color: '#3d5c7c',
      isActive: true,
    })).toEqual({
      name: 'Electrical',
      description: 'Electrical services',
      color: '#3D5C7C',
      isActive: true,
    })
  })

  it('applies defaults for create body', () => {
    expect(parseServiceTypeBody({
      name: 'Plumbing',
    })).toEqual({
      name: 'Plumbing',
      description: null,
      color: '#3D5C7C',
      isActive: true,
    })
  })

  it('rejects create body without name', () => {
    expect(() => parseServiceTypeBody({
      name: '  ',
    })).toThrowError(/Name is required/)
  })

  it('rejects create body with invalid color', () => {
    expect(() => parseServiceTypeBody({
      name: 'Plumbing',
      color: 'purple',
    })).toThrowError(/Color must be a valid HEX value/)
  })

  it('validates update body and keeps optional fields', () => {
    expect(parseServiceTypeUpdateBody({
      name: 'Mechanical',
      description: '',
      color: '#00ff00',
      isActive: false,
    })).toEqual({
      name: 'Mechanical',
      description: null,
      color: '#00FF00',
      isActive: false,
    })
  })

  it('rejects empty update body', () => {
    expect(() => parseServiceTypeUpdateBody({})).toThrowError(/At least one field is required/)
  })
})
