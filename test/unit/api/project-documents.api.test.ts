import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjectDocuments = vi.fn()
const mockSoftDeleteProjectDocument = vi.fn()
const mockReadBody = vi.fn()
const mockGetQuery = vi.fn()
const mockReadMultipartFormData = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('readMultipartFormData', mockReadMultipartFormData)

vi.mock('../../../server/utils/projectDocuments', () => ({
  listProjectDocuments: (...args: unknown[]) => mockListProjectDocuments(...args),
  createProjectDocument: vi.fn().mockResolvedValue({ uuid: 'new-doc', project_uuid: 'proj-1' }),
  softDeleteProjectDocument: (...args: unknown[]) => mockSoftDeleteProjectDocument(...args),
}))

const makeDocument = (overrides = {}) => ({
  id: 1,
  uuid: 'doc-uuid-1',
  project_uuid: 'proj-uuid-1',
  document_name: 'invoice.pdf',
  document_type: 'pdf',
  file_size: 98971,
  mime_type: 'application/pdf',
  file_url: 'https://example.com/invoice.pdf',
  file_path: 'projects/proj-uuid-1/documents/invoice.pdf',
  description: null,
  tags: [],
  is_primary: false,
  is_active: true,
  uploaded_by: null,
  created_at: '2026-05-19T06:59:49.000Z',
  updated_at: '2026-05-19T06:59:49.000Z',
  ...overrides,
})

describe('project documents API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({})
    mockGetQuery.mockReturnValue({})
  })

  describe('GET /api/projects/documents', () => {
    it('returns documents for a project', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-uuid-1' })
      mockListProjectDocuments.mockResolvedValue([makeDocument()])
      const { default: handler } = await import('../../../server/api/projects/documents/index.get')

      const result = await handler({})
      expect(mockListProjectDocuments).toHaveBeenCalledWith('proj-uuid-1')
      expect(result).toEqual({ data: [makeDocument()] })
    })

    it('returns 400 when project_uuid missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/documents/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('propagates DB errors as 500', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-1' })
      mockListProjectDocuments.mockRejectedValue(new Error('DB error'))
      const { default: handler } = await import('../../../server/api/projects/documents/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    })
  })

  describe('POST /api/projects/upload-files', () => {
    it('returns 400 when form data is missing', async () => {
      mockReadMultipartFormData.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/projects/upload-files.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Multipart form data required' })
    })

    it('returns 400 when project_uuid is missing from form', async () => {
      mockReadMultipartFormData.mockResolvedValue([
        { name: 'files', filename: 'test.pdf', type: 'application/pdf', data: Buffer.from('hello') },
      ])
      const { default: handler } = await import('../../../server/api/projects/upload-files.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'project_uuid is required' })
    })

    it('returns 400 when no files are provided', async () => {
      mockReadMultipartFormData.mockResolvedValue([
        { name: 'project_uuid', data: Buffer.from('proj-1') },
      ])
      const { default: handler } = await import('../../../server/api/projects/upload-files.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'No files provided' })
    })

    it('saves files and returns document records', async () => {
      mockReadMultipartFormData.mockResolvedValue([
        { name: 'project_uuid', data: Buffer.from('proj-uuid-1') },
        { name: 'files', filename: 'invoice.pdf', type: 'application/pdf', data: Buffer.from('pdf-content') },
      ])
      const { default: handler } = await import('../../../server/api/projects/upload-files.post')

      const result = await handler({}) as { data: unknown[] }
      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('POST /api/projects/remove-file', () => {
    it('removes a document by uuid', async () => {
      mockReadBody.mockResolvedValue({ uuid: 'doc-uuid-1' })
      mockSoftDeleteProjectDocument.mockResolvedValue(true)
      const { default: handler } = await import('../../../server/api/projects/remove-file.post')

      const result = await handler({})
      expect(mockSoftDeleteProjectDocument).toHaveBeenCalledWith('doc-uuid-1')
      expect(result).toEqual({ success: true })
    })

    it('returns 400 when uuid missing', async () => {
      mockReadBody.mockResolvedValue({})
      const { default: handler } = await import('../../../server/api/projects/remove-file.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
