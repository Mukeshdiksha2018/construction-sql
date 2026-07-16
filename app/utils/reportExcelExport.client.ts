import type { ReportCsvMetadata } from '~/utils/csvExport'
import { buildReportCsvFilename } from '~/utils/csvExport'

const HEADER_BACKGROUND = '#374151'
const HEADER_TEXT = '#FFFFFF'

export type ReportExcelCell = {
  value?: unknown
  type?: typeof String | typeof Number
  format?: string
  fontWeight?: string
  textColor?: string
  backgroundColor?: string
  align?: 'left' | 'center' | 'right'
  columnSpan?: number
} | null

export type ReportExcelColumn = {
  width: number
}

export function buildReportExcelFilename(
  reportSlug: string,
  projectId?: string | null,
): string {
  return buildReportCsvFilename(reportSlug, projectId).replace(/\.csv$/, '.xlsx')
}

function cellDisplayLength(value: unknown): number {
  if (value === null || value === undefined) return 0
  return String(value).length
}

function estimateColumnWidths(
  headers: unknown[],
  bodyRows: unknown[][],
): ReportExcelColumn[] {
  return headers.map((header, index) => {
    const lengths = [
      cellDisplayLength(header),
      ...bodyRows.slice(0, 200).map(row => cellDisplayLength(row[index])),
    ]
    const maxLen = Math.max(...lengths, 8)
    return { width: Math.min(Math.max(maxLen + 2, 12), 48) }
  })
}

function buildCenteredMetadataRow(
  text: string,
  columnCount: number,
): ReportExcelCell[] {
  const row: ReportExcelCell[] = [
    {
      value: text,
      fontWeight: 'bold',
      align: 'center',
      columnSpan: columnCount,
    },
  ]

  for (let index = 1; index < columnCount; index++) {
    row.push(null)
  }

  return row
}

function buildHeaderCells(headers: unknown[]): ReportExcelCell[] {
  return headers.map(header => ({
    value: header ?? '',
    fontWeight: 'bold',
    backgroundColor: HEADER_BACKGROUND,
    textColor: HEADER_TEXT,
    align: 'center',
  }))
}

function buildDataCells(row: unknown[], columnCount: number): ReportExcelCell[] {
  return Array.from({ length: columnCount }, (_, index) => {
    const value = row[index] ?? ''

    if (typeof value === 'number' && Number.isFinite(value)) {
      return {
        value,
        type: Number,
        format: '#,##0.00',
        align: 'right',
      }
    }

    return { value: String(value) }
  })
}

export function buildReportExcelSheetData(
  metadata: ReportCsvMetadata,
  tableRows: unknown[][],
): { data: ReportExcelCell[][]; columns: ReportExcelColumn[] } {
  if (tableRows.length === 0) {
    throw new Error('Report export requires at least a header row')
  }

  const [headerRow, ...bodyRows] = tableRows
  const columnCount =
    tableRows.reduce((max, row) => Math.max(max, row.length), 0) || 1
  const headers = Array.from(
    { length: columnCount },
    (_, index) => headerRow?.[index] ?? '',
  )

  const data: ReportExcelCell[][] = []
  const metadataLines = [
    metadata.title,
    metadata.corporationName ? `Corporation: ${metadata.corporationName}` : null,
    metadata.projectLabel ? `Project: ${metadata.projectLabel}` : null,
    metadata.dateRange ? `Period: ${metadata.dateRange}` : null,
  ].filter(Boolean) as string[]

  for (const line of metadataLines) {
    data.push(buildCenteredMetadataRow(line, columnCount))
  }

  if (metadataLines.length > 0) {
    data.push(Array.from({ length: columnCount }, () => null))
  }

  data.push(buildHeaderCells(headers))

  for (const row of bodyRows) {
    data.push(buildDataCells(row, columnCount))
  }

  return {
    data,
    columns: estimateColumnWidths(headers, bodyRows),
  }
}

export async function buildReportExcelBuffer(
  metadata: ReportCsvMetadata,
  tableRows: unknown[][],
): Promise<ArrayBuffer> {
  const { data, columns } = buildReportExcelSheetData(metadata, tableRows)
  // Lazy-load excel writer so report pages don't pay for it until export
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const blob = await writeXlsxFile(data, { columns }).toBlob()
  return blob.arrayBuffer()
}

export async function downloadReportExcelFile(
  filename: string,
  metadata: ReportCsvMetadata,
  tableRows: unknown[][],
): Promise<void> {
  if (typeof document === 'undefined' || tableRows.length === 0) return

  const { data, columns } = buildReportExcelSheetData(metadata, tableRows)
  await writeXlsxFile(data, { columns }).toFile(filename)
}
