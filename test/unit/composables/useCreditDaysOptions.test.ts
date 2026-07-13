import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.stubGlobal('ref', ref)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useCreditDaysOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module so the module-level shared ref is fresh each suite
    vi.resetModules()
  })

  async function getComposable() {
    const { useCreditDaysOptions } = await import('../../../app/composables/useCreditDaysOptions')
    return useCreditDaysOptions()
  }

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with the static credit-days options', async () => {
      const { creditDaysOptions } = await getComposable()
      expect(creditDaysOptions.value.length).toBeGreaterThan(0)
      const values = creditDaysOptions.value.map((o: any) => o.value)
      expect(values).toContain('NET_15')
      expect(values).toContain('NET_30')
    })
  })

  // ── refreshCreditDaysOptions ───────────────────────────────────────────────

  describe('refreshCreditDaysOptions', () => {
    it('replaces options with data from /api/credit-days', async () => {
      mockFetch.mockResolvedValue({
        data: [
          { id: 'id-1', label: 'Net 15', value: 'NET_15', days: 15 },
          { id: 'id-2', label: 'Net 30', value: 'NET_30', days: 30 },
        ],
      })

      const { refreshCreditDaysOptions, creditDaysOptions } = await getComposable()
      await refreshCreditDaysOptions()

      expect(mockFetch).toHaveBeenCalledWith('/api/credit-days', {
        credentials: 'include',
      })
      expect(creditDaysOptions.value).toHaveLength(2)
      expect(creditDaysOptions.value[0]).toMatchObject({ id: 'id-1', label: 'Net 15', days: 15 })
    })

    it('falls back to static options when API returns empty array', async () => {
      mockFetch.mockResolvedValue({ data: [] })

      const { refreshCreditDaysOptions, creditDaysOptions } = await getComposable()
      await refreshCreditDaysOptions()

      const values = creditDaysOptions.value.map((o: any) => o.value)
      expect(values).toContain('NET_15')
    })

    it('falls back to static options when API call throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { refreshCreditDaysOptions, creditDaysOptions } = await getComposable()
      await refreshCreditDaysOptions()

      expect(creditDaysOptions.value.length).toBeGreaterThan(0)
      const values = creditDaysOptions.value.map((o: any) => o.value)
      expect(values).toContain('NET_30')
    })

    it('falls back to static options when API returns no data key', async () => {
      mockFetch.mockResolvedValue({})

      const { refreshCreditDaysOptions, creditDaysOptions } = await getComposable()
      await refreshCreditDaysOptions()

      const values = creditDaysOptions.value.map((o: any) => o.value)
      expect(values).toContain('NET_15')
    })
  })

  // ── resolveCreditDaysToDayCount ────────────────────────────────────────────

  describe('resolveCreditDaysToDayCount', () => {
    it('resolves by value match', async () => {
      mockFetch.mockResolvedValue({
        data: [{ id: 'id-30', label: 'Net 30', value: 'NET_30', days: 30 }],
      })
      const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = await getComposable()
      await refreshCreditDaysOptions()

      expect(resolveCreditDaysToDayCount('NET_30')).toBe(30)
    })

    it('resolves by value case-insensitively', async () => {
      const { resolveCreditDaysToDayCount } = await getComposable()
      // Uses static defaults: NET_15 = 15
      expect(resolveCreditDaysToDayCount('net_15')).toBe(15)
    })

    it('resolves by Nimble ID', async () => {
      mockFetch.mockResolvedValue({
        data: [{ id: 'nimble-id-45', label: 'Net 45', value: 'NET_45', days: 45 }],
      })
      const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = await getComposable()
      await refreshCreditDaysOptions()

      expect(resolveCreditDaysToDayCount(null, 'nimble-id-45')).toBe(45)
    })

    it('resolves by extracting number from string fallback', async () => {
      const { resolveCreditDaysToDayCount } = await getComposable()
      // "60" days not in static list → extract number
      expect(resolveCreditDaysToDayCount('60')).toBe(60)
    })

    it('returns null for null/empty inputs', async () => {
      const { resolveCreditDaysToDayCount } = await getComposable()
      expect(resolveCreditDaysToDayCount(null)).toBeNull()
      expect(resolveCreditDaysToDayCount(null, null)).toBeNull()
    })

    it('prefers ID match over value match', async () => {
      mockFetch.mockResolvedValue({
        data: [
          { id: 'special-id', label: 'Net 20', value: 'NET_20', days: 20 },
          { id: 'other-id', label: 'Net 20 Alt', value: 'NET_20_ALT', days: 99 },
        ],
      })
      const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = await getComposable()
      await refreshCreditDaysOptions()

      // ID match wins
      expect(resolveCreditDaysToDayCount('NET_20_ALT', 'special-id')).toBe(20)
    })
  })
})
