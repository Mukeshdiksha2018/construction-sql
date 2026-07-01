import { describe, expect, it } from 'vitest'
import {
  extractCalendarYmdFromStoredDate,
  extractUtcCalendarYmdFromStoredDate,
  isWithinCalendarDateRange,
  isWithinUtcStoredDateRange,
  pickLaterStoredCalendarDate,
  toReportRangeEndIso,
  toReportRangeStartIso,
} from '~/utils/calendarDateRange'

describe('calendarDateRange', () => {
  const istFromUtc = (utc: string | null): string => {
    if (!utc) return ''
    const date = new Date(utc)
    const shifted = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
    const y = shifted.getUTCFullYear()
    const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
    const d = String(shifted.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  it('extractCalendarYmdFromStoredDate uses fromUTCString for datetime values', () => {
    const fromUTC = (utc: string | null) =>
      utc === '2026-06-12T18:30:00.000Z' ? '2026-06-13' : String(utc || '').split('T')[0]

    expect(extractCalendarYmdFromStoredDate('2026-06-12T18:30:00.000Z', fromUTC)).toBe(
      '2026-06-13'
    )
    expect(extractCalendarYmdFromStoredDate('2026-06-13', fromUTC)).toBe('2026-06-13')
  })

  it('includes records on the selected end date when stored UTC differs from calendar day', () => {
    expect(
      isWithinCalendarDateRange(
        '2026-06-13T04:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
        '2026-06-12T18:30:00.000Z',
        istFromUtc
      )
    ).toBe(true)
  })

  it('excludes records after the selected end date', () => {
    expect(
      isWithinCalendarDateRange(
        '2026-06-14T04:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
        '2026-06-12T18:30:00.000Z',
        istFromUtc
      )
    ).toBe(false)
  })

  it('toReportRangeStartIso and toReportRangeEndIso normalize YYYY-MM-DD bounds', () => {
    expect(toReportRangeStartIso('2026-06-13')).toBe('2026-06-13T00:00:00.000Z')
    expect(toReportRangeEndIso('2026-06-13')).toBe('2026-06-13T23:59:59.999Z')
    expect(toReportRangeStartIso('2026-06-13T04:00:00.000Z')).toBe('2026-06-13T00:00:00.000Z')
    expect(toReportRangeEndIso('2026-06-13T18:30:00.000Z')).toBe('2026-06-13T23:59:59.999Z')
  })

  it('extractUtcCalendarYmdFromStoredDate uses the UTC calendar day', () => {
    expect(extractUtcCalendarYmdFromStoredDate('2026-06-14T00:00:00.000Z')).toBe(
      '2026-06-14'
    )
    expect(extractUtcCalendarYmdFromStoredDate('2026-06-13')).toBe('2026-06-13')
  })

  it('isWithinUtcStoredDateRange excludes records after the selected end date', () => {
    expect(
      isWithinUtcStoredDateRange(
        '2026-06-14T00:00:00.000Z',
        '2026-01-01',
        '2026-06-13'
      )
    ).toBe(false)
    expect(
      isWithinUtcStoredDateRange(
        '2026-06-13T00:00:00.000Z',
        '2026-01-01',
        '2026-06-13'
      )
    ).toBe(true)
  })

  it('pickLaterStoredCalendarDate keeps the later calendar day', () => {
    const fromUTC = (utc: string | null) => String(utc || '').split('T')[0]

    expect(
      pickLaterStoredCalendarDate(
        '2024-01-10T00:00:00.000Z',
        '2024-06-01T00:00:00.000Z',
        fromUTC
      )
    ).toBe('2024-06-01T00:00:00.000Z')

    expect(
      pickLaterStoredCalendarDate(
        '2024-06-01T00:00:00.000Z',
        '2024-01-10T00:00:00.000Z',
        fromUTC
      )
    ).toBe('2024-06-01T00:00:00.000Z')

    expect(
      pickLaterStoredCalendarDate(null, '2024-03-01T00:00:00.000Z', fromUTC)
    ).toBe('2024-03-01T00:00:00.000Z')
  })
})
