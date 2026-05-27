import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

export function useUTCDateFormat() {
  const toUTCString = (dateInput: string | Date | null): string | null => {
    if (!dateInput) return null
    try {
      if (dateInput instanceof Date) {
        return dayjs(dateInput).utc().toISOString()
      }
      return dayjs(dateInput).startOf('day').utc().toISOString()
    } catch {
      return null
    }
  }

  const fromUTCString = (utcString: string | null): string => {
    if (!utcString) return ''
    try {
      return dayjs.utc(utcString).local().format('YYYY-MM-DD')
    } catch {
      return ''
    }
  }

  const formatForDisplay = (utcString: string | null, format: string = 'MMM DD, YYYY'): string => {
    if (!utcString) return ''
    try {
      return dayjs.utc(utcString).format(format)
    } catch {
      return ''
    }
  }

  const getCurrentUTC = (): string => dayjs.utc().toISOString()
  const getCurrentLocal = (): string => dayjs().format('YYYY-MM-DD')

  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false
    try {
      return dayjs(dateString).isValid()
    } catch {
      return false
    }
  }

  return {
    toUTCString,
    fromUTCString,
    formatForDisplay,
    getCurrentUTC,
    getCurrentLocal,
    isValidDate,
    dayjs,
  }
}
