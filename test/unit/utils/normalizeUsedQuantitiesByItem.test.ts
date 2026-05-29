import { describe, expect, it } from 'vitest'
import { normalizeUsedQuantitiesByItem } from '~/utils/normalizeUsedQuantitiesByItem'

describe('normalizeUsedQuantitiesByItem', () => {
  it('lowercases composite keys from the API', () => {
    expect(
      normalizeUsedQuantitiesByItem({
        'ITEM-1-CC-1': 4,
        'item-2-cc-2': 3,
      }),
    ).toEqual({
      'item-1-cc-1': 4,
      'item-2-cc-2': 3,
    })
  })

  it('returns empty object for null or undefined', () => {
    expect(normalizeUsedQuantitiesByItem(null)).toEqual({})
    expect(normalizeUsedQuantitiesByItem(undefined)).toEqual({})
  })

  it('returns empty object for non-object payloads', () => {
    expect(normalizeUsedQuantitiesByItem('bad' as unknown as Record<string, number>)).toEqual({})
  })
})
