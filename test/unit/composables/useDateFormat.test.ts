import { describe, expect, it, vi } from 'vitest'

vi.mock('~/composables/useUTCDateFormat', () => ({
  useUTCDateFormat: () => ({
    fromUTCString: (utcString: string | null) => {
      if (!utcString) return ''
      const match = utcString.match(/^(\d{4}-\d{2}-\d{2})/)
      return match ? match[1] : ''
    },
  }),
}))

describe('useDateFormat', () => {
  it('formatPoEstimatedDeliveryForPrint formats UTC ISO using calendar day from fromUTCString', async () => {
    const { useDateFormat } = await import('../../../app/composables/useDateFormat')
    const { formatPoEstimatedDeliveryForPrint } = useDateFormat()

    expect(formatPoEstimatedDeliveryForPrint('2026-05-15T23:59:59.000Z')).toBe('05/15/26')
  })

  it('formatPoEstimatedDeliveryForPrint formats plain YYYY-MM-DD', async () => {
    const { useDateFormat } = await import('../../../app/composables/useDateFormat')
    const { formatPoEstimatedDeliveryForPrint } = useDateFormat()

    expect(formatPoEstimatedDeliveryForPrint('2026-05-15')).toBe('05/15/26')
  })

  it('formatPoEstimatedDeliveryForPrint returns empty for nullish values', async () => {
    const { useDateFormat } = await import('../../../app/composables/useDateFormat')
    const { formatPoEstimatedDeliveryForPrint } = useDateFormat()

    expect(formatPoEstimatedDeliveryForPrint(null)).toBe('')
    expect(formatPoEstimatedDeliveryForPrint(undefined)).toBe('')
    expect(formatPoEstimatedDeliveryForPrint('')).toBe('')
  })

  it('formatDate formats date-only strings without timezone shift', async () => {
    const { useDateFormat } = await import('../../../app/composables/useDateFormat')
    const { formatDate } = useDateFormat()

    expect(formatDate('2026-05-15')).toBe('05/15/26')
  })
})
