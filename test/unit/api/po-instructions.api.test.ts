import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListPOInstructions = vi.fn()
const mockCreatePOInstruction = vi.fn()
const mockUpdatePOInstruction = vi.fn()
const mockDeletePOInstruction = vi.fn()
const mockParsePOInstructionBody = vi.fn()
const mockParsePOInstructionUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/po-instructions', () => ({
  listPOInstructions: (...args: unknown[]) => mockListPOInstructions(...args),
  createPOInstruction: (...args: unknown[]) => mockCreatePOInstruction(...args),
  updatePOInstruction: (...args: unknown[]) => mockUpdatePOInstruction(...args),
  deletePOInstruction: (...args: unknown[]) => mockDeletePOInstruction(...args),
  parsePOInstructionBody: (...args: unknown[]) => mockParsePOInstructionBody(...args),
  parsePOInstructionUpdateBody: (...args: unknown[]) => mockParsePOInstructionUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('po-instructions API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('uuid-1')
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
  })

  it('GET /api/po-instructions returns data', async () => {
    mockListPOInstructions.mockResolvedValue([{ uuid: 'uuid-1' }])
    const { default: handler } = await import('../../../server/api/po-instructions/index.get')

    const result = await handler({})
    expect(mockListPOInstructions).toHaveBeenCalledWith('corp-1')
    expect(result).toEqual({ success: true, data: [{ uuid: 'uuid-1' }] })
  })

  it('GET /api/po-instructions returns 400 without corporation uuid', async () => {
    mockGetQuery.mockReturnValue({})
    const { default: handler } = await import('../../../server/api/po-instructions/index.get')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Corporation UUID is required',
    })
  })

  it('POST /api/po-instructions parses body and creates PO instruction', async () => {
    mockReadBody.mockResolvedValue({ po_instruction_name: 'A', instruction: 'B' })
    mockParsePOInstructionBody.mockReturnValue({
      corporation_uuid: 'corp-1',
      po_instruction_name: 'A',
      instruction: 'B',
      status: 'ACTIVE',
    })
    mockCreatePOInstruction.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/po-instructions/index.post')

    const result = await handler({})
    expect(mockCreatePOInstruction).toHaveBeenCalledWith({
      corporation_uuid: 'corp-1',
      po_instruction_name: 'A',
      instruction: 'B',
      status: 'ACTIVE',
    }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'PO instruction created successfully' })
  })

  it('PUT /api/po-instructions/:uuid updates PO instruction', async () => {
    mockReadBody.mockResolvedValue({ po_instruction_name: 'A', instruction: 'B', status: 'INACTIVE' })
    mockParsePOInstructionUpdateBody.mockReturnValue({
      po_instruction_name: 'A',
      instruction: 'B',
      status: 'INACTIVE',
    })
    mockUpdatePOInstruction.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/po-instructions/[uuid].put')

    const result = await handler({})
    expect(mockUpdatePOInstruction).toHaveBeenCalledWith('uuid-1', {
      po_instruction_name: 'A',
      instruction: 'B',
      status: 'INACTIVE',
    }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'PO instruction updated successfully' })
  })

  it('PUT /api/po-instructions/:uuid returns 400 when uuid missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/po-instructions/[uuid].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'PO Instruction UUID is required',
    })
  })

  it('DELETE /api/po-instructions/:uuid deletes PO instruction', async () => {
    mockDeletePOInstruction.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/po-instructions/[uuid].delete')

    const result = await handler({})
    expect(mockDeletePOInstruction).toHaveBeenCalledWith('uuid-1')
    expect(result).toEqual({ success: true, message: 'PO instruction deleted successfully' })
  })
})
