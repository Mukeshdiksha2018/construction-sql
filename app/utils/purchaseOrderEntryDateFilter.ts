import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/** Local calendar YYYY-MM-DD from PO entry_date (matches Entry Date column display). */
export function poEntryDateToLocalYmd(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (s.includes('T') || /^\d{4}-\d{2}-\d{2} /.test(s)) {
    try {
      const ymd = dayjs.utc(s.replace(' ', 'T')).local().format('YYYY-MM-DD')
      return ymd || null
    } catch {
      return null
    }
  }
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m?.[1] ?? null
}

/** Convert filter YYYY-MM-DD bounds to UTC ISO range for API queries. */
export function poEntryDateFilterToApiBounds(
  dateFrom?: string,
  dateTo?: string
): { entry_date_from: string; entry_date_to: string } | null {
  const fromYmd = dateFrom || dateTo
  const toYmd = dateTo || dateFrom
  if (!fromYmd || !toYmd) return null
  try {
    return {
      entry_date_from: dayjs(fromYmd).startOf('day').utc().toISOString(),
      entry_date_to: dayjs(toYmd).endOf('day').utc().toISOString(),
    }
  } catch {
    return null
  }
}

/** Client-side filter: local calendar day within YYYY-MM-DD bounds (matches PO list). */
export function isPoEntryDateWithinLocalYmdRange(
  raw: unknown,
  dateFrom?: string,
  dateTo?: string
): boolean {
  const ymd = poEntryDateToLocalYmd(raw)
  if (!ymd) return false
  const fromYmd = dateFrom || dateTo
  const toYmd = dateTo || dateFrom
  if (!fromYmd || !toYmd) return true
  return ymd >= fromYmd && ymd <= toYmd
}

/** Server-side filter: stored timestamp within client-computed UTC ISO bounds. */
export function isStoredDateWithinApiBounds(
  raw: unknown,
  fromIso: string,
  toIso: string
): boolean {
  if (raw == null || raw === '' || !fromIso || !toIso) return false
  const valueMs = new Date(String(raw).trim()).getTime()
  const fromMs = new Date(fromIso).getTime()
  const toMs = new Date(toIso).getTime()
  if ([valueMs, fromMs, toMs].some(Number.isNaN)) return false
  return valueMs >= fromMs && valueMs <= toMs
}
