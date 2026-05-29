import { describe, expect, it } from 'vitest'
import { normalizeNimbleEntityId } from '../../../app/utils/nimbleVendorMaster'

describe('normalizeNimbleEntityId', () => {
  it('matches UUIDs with and without dashes', () => {
    const a = '8a076d54-d975-40de-84dd-715dd97adf6b'
    const b = '8A076D54D97540DE84DD715DD97ADF6B'
    expect(normalizeNimbleEntityId(a)).toBe(normalizeNimbleEntityId(b))
  })
})
