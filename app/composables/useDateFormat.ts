export function useDateFormat() {
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return ''

    try {
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

  return { formatDate }
}
