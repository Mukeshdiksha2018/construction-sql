import { describe, expect, it } from 'vitest'
import { toDocumentApiModel } from '../../../server/utils/projectDocuments'

const baseRow = {
  id: 1,
  uuid: 'doc-uuid-1',
  project_uuid: 'proj-uuid-1',
  document_name: 'invoice.pdf',
  document_type: 'pdf',
  file_size: 98971,
  mime_type: 'application/pdf',
  file_url: 'https://example.com/file.pdf',
  file_path: 'projects/proj-uuid-1/documents/file.pdf',
  description: null,
  tags: '[]',
  is_primary: 0,
  is_active: 1,
  uploaded_by: null,
  created_at: new Date('2026-05-19T06:59:49.000Z'),
  updated_at: new Date('2026-05-19T06:59:49.000Z'),
}

describe('toDocumentApiModel', () => {
  it('maps all fields correctly', () => {
    const model = toDocumentApiModel(baseRow)

    expect(model.id).toBe(1)
    expect(model.uuid).toBe('doc-uuid-1')
    expect(model.project_uuid).toBe('proj-uuid-1')
    expect(model.document_name).toBe('invoice.pdf')
    expect(model.document_type).toBe('pdf')
    expect(model.file_size).toBe(98971)
    expect(model.mime_type).toBe('application/pdf')
    expect(model.file_url).toBe('https://example.com/file.pdf')
    expect(model.file_path).toBe('projects/proj-uuid-1/documents/file.pdf')
  })

  it('parses tags from JSON string', () => {
    const model = toDocumentApiModel({ ...baseRow, tags: '["tag1","tag2"]' })
    expect(model.tags).toEqual(['tag1', 'tag2'])
  })

  it('defaults tags to empty array for empty string', () => {
    const model = toDocumentApiModel({ ...baseRow, tags: '' })
    expect(model.tags).toEqual([])
  })

  it('defaults tags to empty array for invalid JSON', () => {
    const model = toDocumentApiModel({ ...baseRow, tags: 'not-json' })
    expect(model.tags).toEqual([])
  })

  it('converts bit values to booleans', () => {
    const primary = toDocumentApiModel({ ...baseRow, is_primary: 1 })
    const notPrimary = toDocumentApiModel({ ...baseRow, is_primary: 0 })
    expect(primary.is_primary).toBe(true)
    expect(notPrimary.is_primary).toBe(false)
  })

  it('converts Date to ISO string', () => {
    const model = toDocumentApiModel(baseRow)
    expect(model.created_at).toBe('2026-05-19T06:59:49.000Z')
  })

  it('returns null for null description and uploaded_by', () => {
    const model = toDocumentApiModel({ ...baseRow, description: null, uploaded_by: null })
    expect(model.description).toBeNull()
    expect(model.uploaded_by).toBeNull()
  })

  it('converts file_size string to number', () => {
    const model = toDocumentApiModel({ ...baseRow, file_size: '142786' })
    expect(model.file_size).toBe(142786)
  })
})
