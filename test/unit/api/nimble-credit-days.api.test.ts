import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', vi.fn())
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())

const mockUseAuth = vi.fn()
const mockListNimbleCreditDays = vi.fn()
const mockListCreditDaysOptions = vi.fn()
const mockCreateNimbleCreditDays = vi.fn()
const mockUpdateNimbleCreditDays = vi.fn()
const mockSoftDeleteNimbleCreditDays = vi.fn()
const mockParseNimbleCreditDaysBody = vi.fn()
const mockRequireAuthSession = vi.fn()

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (event: unknown) => mockUseAuth(event),
}))

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

vi.mock('../../../server/utils/nimbleCreditDays', () => ({
  listNimbleCreditDays: (...args: unknown[]) => mockListNimbleCreditDays(...args),
  listCreditDaysOptions: (...args: unknown[]) => mockListCreditDaysOptions(...args),
  createNimbleCreditDays: (...args: unknown[]) => mockCreateNimbleCreditDays(...args),
  updateNimbleCreditDays: (...args: unknown[]) => mockUpdateNimbleCreditDays(...args),
  softDeleteNimbleCreditDays: (...args: unknown[]) => mockSoftDeleteNimbleCreditDays(...args),
  parseNimbleCreditDaysBody: (...args: unknown[]) => mockParseNimbleCreditDaysBody(...args),
}))

const sampleRow = {
  credit_days_id: 'cd-1',
  name: 'Net 30',
  interval_days: 30,
  status: 1,
  status_label: 'active',
  client_id: null,
  is_default: false,
}

describe('nimble credit days API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockRequireAuthSession.mockReturnValue({ token: 'token' })
    mockListNimbleCreditDays.mockResolvedValue([sampleRow])
    mockListCreditDaysOptions.mockResolvedValue([
      { id: 'cd-1', label: 'Net 30', value: 'NET_30', days: 30 },
    ])
    mockCreateNimbleCreditDays.mockResolvedValue(sampleRow)
    mockUpdateNimbleCreditDays.mockResolvedValue(sampleRow)
    mockSoftDeleteNimbleCreditDays.mockResolvedValue({ ...sampleRow, status: 3, status_label: 'deleted' })
    mockParseNimbleCreditDaysBody.mockReturnValue({
      name: 'Net 30',
      interval_days: 30,
      status: 1,
    })
  })

  it('GET /api/nimble-credit-days returns credit_days list', async () => {
    vi.mocked(getQuery).mockReturnValue({})
    const { default: handler } = await import('../../../server/api/nimble-credit-days/index.get')
    const result = await handler({}) as { credit_days: unknown[] }

    expect(mockListNimbleCreditDays).toHaveBeenCalledWith({ status: undefined, includeDeleted: false })
    expect(result.credit_days).toHaveLength(1)
  })

  it('GET /api/credit-days returns dropdown options from MSSQL service', async () => {
    const { default: handler } = await import('../../../server/api/credit-days/index.get')
    const result = await handler({}) as { data: unknown[] }

    expect(mockRequireAuthSession).toHaveBeenCalled()
    expect(mockListCreditDaysOptions).toHaveBeenCalled()
    expect(result.data[0]).toMatchObject({ id: 'cd-1', label: 'Net 30' })
  })

  it('POST /api/nimble-credit-days creates credit days', async () => {
    vi.mocked(readBody).mockResolvedValue({ name: 'Net 30', interval: 30 })
    const { default: handler } = await import('../../../server/api/nimble-credit-days/index.post')
    const result = await handler({}) as { credit_days: { name: string } }

    expect(mockParseNimbleCreditDaysBody).toHaveBeenCalled()
    expect(mockCreateNimbleCreditDays).toHaveBeenCalled()
    expect(result.credit_days.name).toBe('Net 30')
  })

  it('POST /api/nimble/credit-days returns legacy ID/Name shape', async () => {
    vi.mocked(readBody).mockResolvedValue({ name: 'Net 30', interval: 30 })
    const { default: handler } = await import('../../../server/api/nimble/credit-days.post')
    const result = await handler({}) as { ID: string, Name: string }

    expect(result).toEqual({ ID: 'cd-1', Name: 'Net 30' })
  })

  it('PUT /api/nimble-credit-days/:id updates credit days', async () => {
    vi.mocked(getRouterParam).mockReturnValue('cd-1')
    vi.mocked(readBody).mockResolvedValue({ name: 'Net 45', interval: 45, active: true })
    const { default: handler } = await import('../../../server/api/nimble-credit-days/[id].put')
    await handler({})

    expect(mockUpdateNimbleCreditDays).toHaveBeenCalledWith('cd-1', expect.any(Object))
  })

  it('DELETE /api/nimble-credit-days/:id soft deletes credit days', async () => {
    vi.mocked(getRouterParam).mockReturnValue('cd-1')
    const { default: handler } = await import('../../../server/api/nimble-credit-days/[id].delete')
    await handler({})

    expect(mockSoftDeleteNimbleCreditDays).toHaveBeenCalledWith('cd-1')
  })
})
