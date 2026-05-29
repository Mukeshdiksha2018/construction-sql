import { describe, expect, it } from 'vitest'
import { resolvePrintUomDisplay } from '../../../app/utils/printUomDisplay'

describe('resolvePrintUomDisplay', () => {
  it('returns direct uom label when present on the item', () => {
    const result = resolvePrintUomDisplay(
      { uom: 'BOX', unit_uuid: 'uom-1' },
      () => ({ short_name: 'EA' }),
    )
    expect(result).toBe('BOX')
  })

  it('returns uom_label from DB row without catalog lookup', () => {
    const result = resolvePrintUomDisplay(
      { unit_uuid: 'uom-1', uom_label: 'Kilogram' },
      () => undefined,
    )
    expect(result).toBe('Kilogram')
  })

  it('resolves short_name from catalog lookup by unit_uuid', () => {
    const result = resolvePrintUomDisplay(
      { unit_uuid: 'uom-uuid-1' },
      () => ({ short_name: 'EA', name: 'Each' }),
    )
    expect(result).toBe('EA')
  })

  it('falls back to name when short_name is empty', () => {
    const result = resolvePrintUomDisplay(
      { uom_uuid: 'uom-uuid-2' },
      () => ({ name: 'Kilogram' }),
    )
    expect(result).toBe('Kilogram')
  })

  it('returns empty string when no label and lookup misses', () => {
    const result = resolvePrintUomDisplay({ unit_uuid: 'missing' }, () => undefined)
    expect(result).toBe('')
  })
})
