import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListApprovalChecks = vi.fn()
const mockCreateApprovalCheck = vi.fn()
const mockUpdateApprovalCheck = vi.fn()
const mockDeleteApprovalCheck = vi.fn()
const mockParseApprovalCheckBody = vi.fn()
const mockParseApprovalCheckUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/approval-checks', () => ({
  listApprovalChecks: () => mockListApprovalChecks(),
  createApprovalCheck: (...args: unknown[]) => mockCreateApprovalCheck(...args),
  updateApprovalCheck: (...args: unknown[]) => mockUpdateApprovalCheck(...args),
  deleteApprovalCheck: (...args: unknown[]) => mockDeleteApprovalCheck(...args),
  parseApprovalCheckBody: (...args: unknown[]) => mockParseApprovalCheckBody(...args),
  parseApprovalCheckUpdateBody: (...args: unknown[]) => mockParseApprovalCheckUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('approval-checks API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('uuid-1')
  })

  it('GET /api/approval-checks returns data', async () => {
    mockListApprovalChecks.mockResolvedValue([{ uuid: 'uuid-1' }])
    const { default: handler } = await import('../../../server/api/approval-checks/index.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ uuid: 'uuid-1' }] })
  })

  it('GET /api/approval-checks maps errors', async () => {
    mockListApprovalChecks.mockRejectedValue({ statusCode: 500, statusMessage: 'Failed' })
    const { default: handler } = await import('../../../server/api/approval-checks/index.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 500, statusMessage: 'Failed' })
  })

  it('POST /api/approval-checks parses body and creates approval check', async () => {
    mockReadBody.mockResolvedValue({ approval_check: 'Manager', active: true })
    mockParseApprovalCheckBody.mockReturnValue({ approval_check: 'Manager', active: true })
    mockCreateApprovalCheck.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/approval-checks/index.post')

    const result = await handler({})
    expect(mockCreateApprovalCheck).toHaveBeenCalledWith({ approval_check: 'Manager', active: true }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Approval Check created successfully' })
  })

  it('PUT /api/approval-checks/:uuid updates approval check', async () => {
    mockReadBody.mockResolvedValue({ approval_check: 'CFO', active: false })
    mockParseApprovalCheckUpdateBody.mockReturnValue({ approval_check: 'CFO', active: false })
    mockUpdateApprovalCheck.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/approval-checks/[uuid].put')

    const result = await handler({})
    expect(mockUpdateApprovalCheck).toHaveBeenCalledWith('uuid-1', { approval_check: 'CFO', active: false }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Approval Check updated successfully' })
  })

  it('PUT /api/approval-checks/:uuid returns 400 when uuid missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/approval-checks/[uuid].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Approval Check UUID is required',
    })
  })

  it('DELETE /api/approval-checks/:uuid deletes approval check', async () => {
    mockDeleteApprovalCheck.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/approval-checks/[uuid].delete')

    const result = await handler({})
    expect(mockDeleteApprovalCheck).toHaveBeenCalledWith('uuid-1')
    expect(result).toEqual({ success: true, message: 'Approval Check deleted successfully' })
  })
})
