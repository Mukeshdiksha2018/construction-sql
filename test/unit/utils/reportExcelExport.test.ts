import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildReportExcelFilename,
  buildReportExcelSheetData,
  downloadReportExcelFile,
} from '~/utils/reportExcelExport.client'

const { mockToBlob, mockToFile, mockWriteXlsxFile } = vi.hoisted(() => {
  const mockToBlob = vi.fn().mockResolvedValue(
    new Blob(['xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  )
  const mockToFile = vi.fn().mockResolvedValue(undefined)
  const mockWriteXlsxFile = vi.fn(() => ({
    toBlob: mockToBlob,
    toFile: mockToFile,
  }))
  return { mockToBlob, mockToFile, mockWriteXlsxFile }
})

vi.mock('write-excel-file/browser', () => ({
  default: mockWriteXlsxFile,
}))

describe('reportExcelExport', () => {
  describe('buildReportExcelFilename', () => {
    it('builds slugged filename with xlsx extension', () => {
      const filename = buildReportExcelFilename('stock-report', 'P-001')
      expect(filename).toMatch(/^stock-report_P-001_\d{4}-\d{2}-\d{2}\.xlsx$/)
    })
  })

  describe('buildReportExcelSheetData', () => {
    it('styles the column header row with dark background and bold text', () => {
      const { data } = buildReportExcelSheetData(
        {
          title: 'Stock Report',
          corporationName: 'Acme Corp',
        },
        [['Item', 'Qty'], ['Widget', 5]]
      )

      expect(data[0]?.[0]).toMatchObject({
        value: 'Stock Report',
        fontWeight: 'bold',
        columnSpan: 2,
      })
      expect(data[1]?.[0]).toMatchObject({
        value: 'Corporation: Acme Corp',
      })

      const headerRow = data[3]
      expect(headerRow?.[0]).toMatchObject({
        value: 'Item',
        fontWeight: 'bold',
        backgroundColor: '#374151',
        textColor: '#FFFFFF',
      })
      expect(headerRow?.[1]).toMatchObject({
        value: 'Qty',
        backgroundColor: '#374151',
      })

      expect(data[4]?.[0]).toMatchObject({ value: 'Widget' })
      expect(data[4]?.[1]).toMatchObject({ value: 5, type: Number })
    })
  })

  describe('downloadReportExcelFile', () => {
    afterEach(() => {
      vi.clearAllMocks()
    })

    it('writes an xlsx file with metadata and table rows', async () => {
      await downloadReportExcelFile(
        'report.xlsx',
        { title: 'Budget Report' },
        [['Col'], ['Val']]
      )

      expect(mockWriteXlsxFile).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          columns: expect.any(Array),
        })
      )
      expect(mockToFile).toHaveBeenCalledWith('report.xlsx')
    })
  })
})
