import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockRequireAuthSession = vi.fn()
const mockUseRuntimeConfig = vi.fn()
const mockFetch = vi.fn()
const mockReadBody = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('readBody', mockReadBody)

vi.mock('../../../server/utils/auth-session', () => ({
  requireAuthSession: (event: unknown) => mockRequireAuthSession(event),
}))

function makePrivilegeDto(menuId: string, overrides: Record<string, boolean> = {}) {
  return {
    MenuID: menuId,
    Create: true,
    View: true,
    Update: true,
    Delete: true,
    ...overrides,
  }
}

describe('POST /api/nimble/privileges', () => {
  const mockEvent = { path: '/api/nimble/privileges' }
  const BASE_URL = 'https://qa-api5.nimbleproperty.net'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthSession.mockReturnValue({ token: 'test-token' })
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: BASE_URL })
    mockReadBody.mockResolvedValue({ menuIds: ['0x01abc', '0x01def'] })
    mockFetch.mockResolvedValue({
      Details: [
        makePrivilegeDto('01abc'),
        makePrivilegeDto('01def', { Delete: false }),
      ],
    })
  })

  async function loadHandler() {
    vi.resetModules()
    const mod = await import('../../../server/api/nimble/privileges.post')
    return (mod as any).default ?? mod
  }

  it('POSTs to Nimble /v1/Previlages with Bearer token', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/v1/Previlages`,
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      }),
    )
  })

  it('strips 0x prefix and lowercases menu IDs in the payload', async () => {
    mockReadBody.mockResolvedValue({ menuIds: ['0x010000AAAA', '0xBBBB1234'] })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({
          MenuIds: '010000aaaa,bbbb1234',
        }),
      }),
    )
  })

  it('sends UserID and RoleID as null', async () => {
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({ UserID: null, RoleID: null }),
      }),
    )
  })

  it('maps Nimble response to normalized privilege objects', async () => {
    mockFetch.mockResolvedValue({
      Details: [
        { MenuID: 'MENU-001', Create: true, View: false, Update: true, Delete: false },
      ],
    })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { details: any[] }

    expect(result.details).toHaveLength(1)
    expect(result.details[0]).toEqual({
      menuId: 'menu-001',
      create: true,
      view: false,
      update: true,
      delete: false,
    })
  })

  it('lowercases menuId in response', async () => {
    mockFetch.mockResolvedValue({
      Details: [{ MenuID: 'UPPERCASE-MENU-ID', Create: true, View: true, Update: true, Delete: true }],
    })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { details: any[] }
    expect(result.details[0].menuId).toBe('uppercase-menu-id')
  })

  it('returns empty details when menuIds body is empty', async () => {
    mockReadBody.mockResolvedValue({ menuIds: [] })
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { details: any[] }
    expect(result.details).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty details when body is missing menuIds', async () => {
    mockReadBody.mockResolvedValue({})
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { details: any[] }
    expect(result.details).toEqual([])
  })

  it('handles Nimble returning no Details array', async () => {
    mockFetch.mockResolvedValue({})
    const handler = await loadHandler()
    const result = await handler(mockEvent) as { details: any[] }
    expect(result.details).toEqual([])
  })

  it('throws 500 when NIMBLE_API_BASE_URL is not configured', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nimbleApiBaseUrl: '' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NIMBLE_API_BASE_URL is not configured',
    })
  })

  it('throws 502 when Nimble API call fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch privileges from Nimble',
    })
  })

  it('preserves upstream status code from Nimble error', async () => {
    mockFetch.mockRejectedValue({ statusCode: 403, message: 'Forbidden' })
    const handler = await loadHandler()
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('uses session token for Authorization header', async () => {
    mockRequireAuthSession.mockReturnValue({ token: 'special-token-xyz' })
    const handler = await loadHandler()
    await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: 'Bearer special-token-xyz' },
      }),
    )
  })
})
