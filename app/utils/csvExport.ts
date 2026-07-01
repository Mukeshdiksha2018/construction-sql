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
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
}

export interface ReportCsvMetadata {
  title: string
  corporationName?: string | null
  projectLabel?: string | null
  dateRange?: string | null
}

type CorporationLike = {
  uuid?: string
  corporation_name?: string
  legal_name?: string
}

type ProjectLike = {
  uuid?: string
  project_name?: string
  project_id?: string | null
}

export function buildCenteredCsvRow(text: string, columnCount: number): unknown[] {
  const count = Math.max(columnCount, 1)
  const row = Array(count).fill('')
  row[Math.floor((count - 1) / 2)] = text
  return row
}

export function resolveCorporationDisplayName(
  corporations: CorporationLike[],
  corporationUuid?: string | null,
): string {
  if (!corporationUuid) return ''
  const corp = corporations.find(entry => entry.uuid === corporationUuid)
  return corp?.corporation_name || corp?.legal_name || ''
}

export function resolveProjectDisplayLabel(
  projects: ProjectLike[],
  projectUuid?: string | null,
): string {
  if (!projectUuid) return ''
  const project = projects.find(entry => entry.uuid === projectUuid)
  if (!project) return ''
  const projectId = project.project_id || 'N/A'
  return `${project.project_name || 'N/A'} (${projectId})`
}

export function formatReportDateRangeDisplay(
  start?: string | null,
  end?: string | null,
): string {
  const format = (value?: string | null) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const startText = format(start)
  const endText = format(end)
  if (startText && endText) return `${startText} to ${endText}`
  return startText || endText
}

export function buildReportCsvMetadataRows(
  metadata: ReportCsvMetadata,
  columnCount: number,
): unknown[][] {
  const count = Math.max(columnCount, 1)
  const rows: unknown[][] = []

  if (metadata.title) {
    rows.push(buildCenteredCsvRow(metadata.title, count))
  }
  if (metadata.corporationName) {
    rows.push(buildCenteredCsvRow(`Corporation: ${metadata.corporationName}`, count))
  }
  if (metadata.projectLabel) {
    rows.push(buildCenteredCsvRow(`Project: ${metadata.projectLabel}`, count))
  }
  if (metadata.dateRange) {
    rows.push(buildCenteredCsvRow(`Period: ${metadata.dateRange}`, count))
  }

  rows.push(Array(count).fill(''))
  return rows
}

export function prependReportCsvMetadata(
  metadata: ReportCsvMetadata,
  dataRows: unknown[][],
): unknown[][] {
  const columnCount = dataRows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  ) || 1

  return [...buildReportCsvMetadataRows(metadata, columnCount), ...dataRows]
}

export function buildReportCsvFilename(
  reportSlug: string,
  projectId?: string | null,
): string {
  const projectSlug = String(projectId || 'project').replace(/[^\w-]+/g, '_')
  const dateSlug = new Date().toISOString().split('T')[0]
  return `${reportSlug}_${projectSlug}_${dateSlug}.csv`
}

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
