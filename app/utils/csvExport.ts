/** Escape a cell value for CSV (RFC 4180-style quoting). */
export function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Build CSV text from rows (first row is typically headers). */
export function buildCsvContent(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

/** Trigger a CSV file download in the browser. */
export function downloadCsvFile(filename: string, rows: unknown[][]): void {
  if (typeof document === 'undefined') return
  const csvContent = `\uFEFF${buildCsvContent(rows)}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
