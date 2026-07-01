export function extractCalendarYmdFromStoredDate(
  raw: string | null | undefined,
  fromUTCString: (utc: string | null) => string,
): string | null {
  if (!raw) return null
  const src = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(src)) return src
  if (src.includes('T')) {
    const ymd = fromUTCString(src)
    return ymd || null
  }
  const prefix = src.substring(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(prefix) ? prefix : null
}

export function extractUtcCalendarYmdFromStoredDate(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null
  const src = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(src)) return src
  if (src.includes('T')) {
    const prefix = src.substring(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return prefix
  }
  const parsed = new Date(src)
  if (Number.isNaN(parsed.getTime())) return null
  const y = parsed.getUTCFullYear()
  const m = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const d = String(parsed.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isWithinCalendarDateRange(
  value: string | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
  fromUTCString: (utc: string | null) => string,
): boolean {
  const recordDate = extractCalendarYmdFromStoredDate(value, fromUTCString)
  const startDateStr = extractCalendarYmdFromStoredDate(start, fromUTCString)
  const endDateStr = extractCalendarYmdFromStoredDate(end, fromUTCString)
  if (!recordDate || !startDateStr || !endDateStr) return false
  return recordDate >= startDateStr && recordDate <= endDateStr
}

export function isWithinUtcStoredDateRange(
  value: string | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
): boolean {
  const recordDate = extractUtcCalendarYmdFromStoredDate(value)
  const startDateStr =
    extractUtcCalendarYmdFromStoredDate(start)
    ?? String(start || '').trim().substring(0, 10)
  const endDateStr =
    extractUtcCalendarYmdFromStoredDate(end)
    ?? String(end || '').trim().substring(0, 10)
  if (
    !recordDate
    || !/^\d{4}-\d{2}-\d{2}$/.test(startDateStr)
    || !/^\d{4}-\d{2}-\d{2}$/.test(endDateStr)
  ) {
    return false
  }
  return recordDate >= startDateStr && recordDate <= endDateStr
}

export function pickLaterStoredCalendarDate(
  existing: string | null | undefined,
  candidate: string | null | undefined,
  fromUTCString: (utc: string | null) => string,
): string | null {
  if (!candidate) return existing ?? null
  if (!existing) return candidate
  const existingYmd = extractCalendarYmdFromStoredDate(existing, fromUTCString)
  const candidateYmd = extractCalendarYmdFromStoredDate(candidate, fromUTCString)
  if (!candidateYmd) return existing
  if (!existingYmd) return candidate
  return candidateYmd >= existingYmd ? candidate : existing
}

export function toReportRangeStartIso(date: string): string {
  const ymd = String(date || '').trim().substring(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return `${ymd}T00:00:00.000Z`
  return String(date)
}

export function toReportRangeEndIso(date: string): string {
  const ymd = String(date || '').trim().substring(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return `${ymd}T23:59:59.999Z`
  return String(date)
}
