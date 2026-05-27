import { CalendarDate } from '@internationalized/date'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

export function calendarDateToYmd(value: CalendarDate): string {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

export function formatCalendarDateAsMmDdYyyy(value: CalendarDate): string {
  const month = String(value.month).padStart(2, '0')
  const day = String(value.day).padStart(2, '0')
  return `${month}/${day}/${value.year}`
}

export function sanitizeDateInputText(value: string): string {
  return value.replace(/[^\d/]/g, '')
}

export function parseMmDdYyyyToCalendarDate(input: string): CalendarDate | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (!match?.[1] || !match[2] || !match[3]) return null

  const month = parseInt(match[1], 10)
  const day = parseInt(match[2], 10)
  let year = parseInt(match[3], 10)
  if (match[3].length === 2) {
    year = year >= 70 ? 1900 + year : 2000 + year
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null
  }

  return new CalendarDate(year, month, day)
}

export function isCalendarDateOutOfRange(
  date: CalendarDate,
  min: CalendarDate | null,
  max: CalendarDate | null
): boolean {
  if (min && compareCalendarDates(date, min) < 0) return true
  if (max && compareCalendarDates(date, max) > 0) return true
  return false
}

export function isStartAfterCompletion(
  start: CalendarDate | null,
  completion: CalendarDate | null
): boolean {
  if (!start || !completion) return false
  return compareCalendarDates(start, completion) > 0
}

export function useFormDateField() {
  const { toUTCString, fromUTCString } = useUTCDateFormat()

  const parseUtcToCalendarDate = (raw?: string | null): CalendarDate | null => {
    if (!raw) return null
    const src = String(raw)
    const localYmd = src.includes('T') ? fromUTCString(src) : src
    const parts = localYmd.split('-')
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const day = parseInt(parts[2], 10)
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
    return new CalendarDate(year, month, day)
  }

  const calendarDateToUtc = (value: CalendarDate): string | null => {
    return toUTCString(calendarDateToYmd(value))
  }

  const formatUtcAsMmDdYyyy = (raw?: string | null): string => {
    const calendarDate = parseUtcToCalendarDate(raw)
    if (!calendarDate) return ''
    return formatCalendarDateAsMmDdYyyy(calendarDate)
  }

  return {
    parseUtcToCalendarDate,
    calendarDateToUtc,
    formatUtcAsMmDdYyyy,
    parseMmDdYyyyToCalendarDate,
    sanitizeDateInputText,
    compareCalendarDates,
    isStartAfterCompletion,
    isCalendarDateOutOfRange,
  }
}
