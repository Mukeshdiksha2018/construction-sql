import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import {
  hexToNimbleBinary,
  nimbleBinaryToHex,
  normalizeNimbleHexId,
} from '../../../server/utils/nimbleBinaryId'

vi.stubGlobal('createError', createError)

describe('nimbleBinaryId', () => {
  const sampleHex = 'a156fef05bbc45a24c33abe8e750147b0000'

  it('normalizes dashed and uppercase IDs', () => {
    const dashed = 'A156FEF0-5BBC-45A2-4C33-ABE8E750147B0000'
    expect(normalizeNimbleHexId(dashed)).toBe(sampleHex)
  })

  it('pads 32-char hex with 0000 suffix', () => {
    const short = 'a156fef05bbc45a24c33abe8e750147b'
    const buf = hexToNimbleBinary(short)
    expect(buf.length).toBe(18)
    expect(nimbleBinaryToHex(buf)).toBe(sampleHex)
  })

  it('round-trips 36-char hex', () => {
    const buf = hexToNimbleBinary(sampleHex)
    expect(nimbleBinaryToHex(buf)).toBe(sampleHex)
  })

  it('rejects invalid length', () => {
    expect(() => hexToNimbleBinary('abc')).toThrow(/Invalid Nimble ID length/)
  })

  it('returns null for empty binary', () => {
    expect(nimbleBinaryToHex(null)).toBeNull()
    expect(nimbleBinaryToHex(Buffer.alloc(0))).toBeNull()
  })
})
