import { useUTCDateFormat } from './useUTCDateFormat'

export function useDateFormat() {
  const { fromUTCString } = useUTCDateFormat()

  /** YYYY-MM-DD → MM/DD/YY (calendar components, no timezone) */
  const formatYmdAsMmDdYy = (ymd: string): string => {
    const parts = ymd.split('-')
    if (parts.length !== 3) return ''
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
    const month = String(m).padStart(2, '0')
    const day = String(d).padStart(2, '0')
    const year = String(y).slice(-2)
    return `${month}/${day}/${year}`
  }

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return ''

    try {
      if (typeof date === 'string') {
        let raw = date.trim()
        if (/^\d{4}-\d{2}-\d{2} \d/.test(raw)) {
          raw = raw.replace(' ', 'T')
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const out = formatYmdAsMmDdYy(raw)
          if (out) return out
        }

        if (raw.includes('T')) {
          const ymd = fromUTCString(raw)
          const out = formatYmdAsMmDdYy(ymd)
          if (out) return out
        }
      }

      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (Number.isNaN(dateObj.getTime())) return ''

      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      const year = String(dateObj.getFullYear()).slice(-2)
      return `${month}/${day}/${year}`
    }
    catch {
      return ''
    }
  }

  /**
   * PO estimated delivery: stored via `toUTCString` from local calendar day (PurchaseOrderForm).
   * Match the form getter (fromUTCString → YYYY-MM-DD), not raw `Date` formatting.
   */
  const formatPoEstimatedDeliveryForPrint = (
    iso: string | null | undefined,
  ): string => {
    if (!iso) return ''
    const s = String(iso).trim()
    const ymd = s.includes('T') ? fromUTCString(s) : s
    const out = formatYmdAsMmDdYy(ymd)
    return out || formatDate(iso)
  }

  return { formatDate, formatPoEstimatedDeliveryForPrint }
}
