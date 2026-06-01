import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizeCoEmailAttachmentFilename,
  validateCoEmailAttachmentPlan,
  normalizeStoredCoAttachments,
  filterCoAttachmentsExcludingUuids,
  loadChangeOrderEmailStorageAttachments,
  CO_EMAIL_MAX_EXTRA_FILES,
  CO_EMAIL_MAX_FILE_BYTES,
} from '../../../server/utils/changeOrderEmailAttachments'

describe('changeOrderEmailAttachments utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes attachments with file_path or file_url', () => {
    const list = normalizeStoredCoAttachments([
      { document_name: 'a.pdf', file_path: 'change-orders/co-1/a.pdf' },
      { document_name: 'b.pdf', file_url: 'data:application/pdf;base64,abc' },
      null,
    ])
    expect(list).toHaveLength(2)
  })

  it('sanitizes unsafe filenames and ensures .pdf extension', () => {
    expect(sanitizeCoEmailAttachmentFilename('co<script>.pdf', 0)).toBe('co_script_.pdf')
    expect(sanitizeCoEmailAttachmentFilename('scan', 1)).toBe('scan.pdf')
  })

  it('rejects when attachment count exceeds limit', () => {
    const stored = Array.from({ length: CO_EMAIL_MAX_EXTRA_FILES + 1 }, (_, i) => ({
      document_name: `f${i}.pdf`,
      file_path: `change-orders/co/x${i}.pdf`,
      mime_type: 'application/pdf',
      file_size: 1000,
    }))
    const result = validateCoEmailAttachmentPlan(stored, 100_000)
    expect(result.ok).toBe(false)
  })

  it('rejects non-PDF mime types', () => {
    const stored = [{
      document_name: 'image.png',
      file_path: 'change-orders/co/img.png',
      mime_type: 'image/png',
      file_size: 1000,
    }]
    const result = validateCoEmailAttachmentPlan(stored, 1000)
    expect(result.ok).toBe(false)
  })

  it('filterCoAttachmentsExcludingUuids removes listed uuids', () => {
    const filtered = filterCoAttachmentsExcludingUuids(
      [
        { uuid: 'a', file_path: 'x/a.pdf' },
        { uuid: 'b', file_path: 'x/b.pdf' },
      ],
      ['a'],
    ) as any[]
    expect(filtered).toHaveLength(1)
    expect(filtered[0].uuid).toBe('b')
  })

  it('loadChangeOrderEmailStorageAttachments decodes data URLs', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 test')
    const b64 = pdfBytes.toString('base64')
    const result = await loadChangeOrderEmailStorageAttachments(
      [{
        document_name: 'doc.pdf',
        file_url: `data:application/pdf;base64,${b64}`,
        mime_type: 'application/pdf',
        file_size: pdfBytes.length,
      }],
      1000,
    )
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments[0].content.toString()).toContain('%PDF')
  })

  it('throws when every stored attachment lacks decodable content', async () => {
    await expect(
      loadChangeOrderEmailStorageAttachments(
        [{ document_name: 'x.pdf', file_path: 'bucket/missing.pdf', mime_type: 'application/pdf', file_size: 10 }],
        1000,
      ),
    ).rejects.toThrow(/Could not attach any change order documents/)
  })

  it('rejects per-file size over limit in plan', () => {
    const stored = [{
      document_name: 'big.pdf',
      file_url: 'data:application/pdf;base64,aa',
      mime_type: 'application/pdf',
      file_size: CO_EMAIL_MAX_FILE_BYTES + 1,
    }]
    const result = validateCoEmailAttachmentPlan(stored, 1000)
    expect(result.ok).toBe(false)
  })
})
