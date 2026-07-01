import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mapFrequencyRow,
  mapToCreditDaysOption,
  parseNimbleCreditDaysBody,
} from '../../../server/utils/nimbleCreditDays'

vi.stubGlobal('createError', createError)

describe('nimbleCreditDays utils', () => {
  it('maps frequency row to dto', () => {
    const dto = mapFrequencyRow({
      id_hex: '4820e0b644539e9f4e65f65c422838840000',
      Name: '30 Days',
      Interval: 30,
      Status: 1,
      IsDefault: false,
      client_id_hex: '4ad36722df87fe8d44b4a49b63fa837d0000',
    })

    expect(dto).toMatchObject({
      credit_days_id: '4820e0b644539e9f4e65f65c422838840000',
      name: '30 Days',
      interval_days: 30,
      status: 1,
      status_label: 'active',
    })
  })

  it('maps dto to dropdown option', () => {
    const option = mapToCreditDaysOption({
      credit_days_id: 'abc123',
      name: 'Net 30',
      interval_days: 30,
      status: 1,
      status_label: 'active',
      client_id: null,
      is_default: null,
    })

    expect(option).toEqual({
      id: 'abc123',
      label: 'Net 30',
      value: 'NET_30',
      days: 30,
    })
  })

  it('parses create body with interval alias', () => {
    const input = parseNimbleCreditDaysBody({
      name: 'Net 45',
      interval: 45,
      active: true,
    })

    expect(input).toEqual({
      name: 'Net 45',
      interval_days: 45,
      status: 1,
    })
  })

  it('throws when name is missing', () => {
    expect(() => parseNimbleCreditDaysBody({ interval: 30 })).toThrowError(
      expect.objectContaining({ statusMessage: 'name is required' }),
    )
  })

  it('throws when interval is invalid', () => {
    expect(() => parseNimbleCreditDaysBody({ name: 'Bad', interval: -1 })).toThrowError(
      expect.objectContaining({ statusMessage: 'interval must be a non-negative integer' }),
    )
  })
})
