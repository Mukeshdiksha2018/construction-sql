import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCustomerOption } from '../../helpers/customers'

const mockMssqlQueryParams = vi.fn()

vi.mock('../../../server/utils/mssql', () => ({
  mssqlQueryParams: (...args: unknown[]) => mockMssqlQueryParams(...args),
}))

function stubNuxtGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal(
    'createError',
    (opts: { statusCode: number, statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  )
}

describe('GET /api/customers/options', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requires corporation_uuid', async () => {
    const handler = (await import('../../../server/api/customers/options.get')).default
    vi.stubGlobal('getQuery', () => ({}))

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'corporation_uuid is required',
    })
  })

  it('returns all corporation customers without project filter', async () => {
    const handler = (await import('../../../server/api/customers/options.get')).default
    mockMssqlQueryParams.mockResolvedValue([
      makeCustomerOption({ uuid: 'UUID-1', corporation_uuid: 'CORP-1' }),
    ])
    vi.stubGlobal('getQuery', () => ({ corporation_uuid: 'corp-1' }))

    const result = await handler({} as never)
    expect(mockMssqlQueryParams).toHaveBeenCalledTimes(1)
    expect(result.data).toEqual([
      expect.objectContaining({
        uuid: 'uuid-1',
        corporation_uuid: 'corp-1',
        first_name: 'Jane',
      }),
    ])
  })

  it('uses project-inclusive SQL when project_uuid provided', async () => {
    const handler = (await import('../../../server/api/customers/options.get')).default
    mockMssqlQueryParams.mockResolvedValue([])
    vi.stubGlobal('getQuery', () => ({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
    }))

    await handler({} as never)
    const sql = String(mockMssqlQueryParams.mock.calls[0][0])
    expect(sql).toContain('project_uuid IS NULL OR project_uuid = @projectUuid')
  })

  it('filters out rows without uuid', async () => {
    const handler = (await import('../../../server/api/customers/options.get')).default
    mockMssqlQueryParams.mockResolvedValue([
      { uuid: '', first_name: 'Ghost' },
      makeCustomerOption({ uuid: 'valid-1' }),
    ])
    vi.stubGlobal('getQuery', () => ({ corporation_uuid: 'corp-1' }))

    const result = await handler({} as never)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].uuid).toBe('valid-1')
  })
})
