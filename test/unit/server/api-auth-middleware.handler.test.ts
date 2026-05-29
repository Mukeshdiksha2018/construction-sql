import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetRequestURL = vi.fn()
const mockGetSessionFromEvent = vi.fn()

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getRequestURL: (...args: unknown[]) => mockGetRequestURL(...args),
  }
})

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

vi.mock('../../../server/utils/auth-session', () => ({
  getSessionFromEvent: (...args: unknown[]) => mockGetSessionFromEvent(...args),
}))

type MockEvent = {
  method?: string
  context: Record<string, unknown>
}

async function getMiddleware() {
  const mod = await import('../../../server/middleware/auth')
  return mod.default as (event: MockEvent) => unknown
}

function makeEvent(method: string): MockEvent {
  return { method, context: {} }
}

describe('server auth middleware handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionFromEvent.mockReturnValue(null)
  })

  describe('GET requests (print preview reads)', () => {
    const printPreviewGetRoutes = [
      '/api/purchase-order-forms/cfd6ee28-436b-428e-98fd-67093934156b',
      '/api/purchase-order-items',
      '/api/purchase-orders/vendors',
      '/api/projects/proj-uuid-1',
      '/api/cost-code-preferred-items',
      '/api/customers',
      '/api/projects/addresses',
    ]

    it.each(printPreviewGetRoutes)('allows GET %s without a session', async (pathname) => {
      mockGetRequestURL.mockReturnValue({ pathname })
      const middleware = await getMiddleware()

      expect(middleware(makeEvent('GET'))).toBeUndefined()
      expect(mockGetSessionFromEvent).not.toHaveBeenCalled()
    })

    it('allows HEAD without a session', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms/po-1' })
      const middleware = await getMiddleware()

      expect(middleware(makeEvent('HEAD'))).toBeUndefined()
      expect(mockGetSessionFromEvent).not.toHaveBeenCalled()
    })
  })

  describe('mutating requests', () => {
    it('returns 401 for POST when no session is present', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms' })
      const middleware = await getMiddleware()

      expect(() => middleware(makeEvent('POST'))).toThrowError(
        expect.objectContaining({ statusCode: 401, statusMessage: 'Unauthorized' }),
      )
    })

    it('returns 401 for PUT when no session is present', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms/po-1' })
      const middleware = await getMiddleware()

      expect(() => middleware(makeEvent('PUT'))).toThrowError(
        expect.objectContaining({ statusCode: 401 }),
      )
    })

    it('returns 401 for PATCH when no session is present', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms/po-1' })
      const middleware = await getMiddleware()

      expect(() => middleware(makeEvent('PATCH'))).toThrowError(
        expect.objectContaining({ statusCode: 401 }),
      )
    })

    it('returns 401 for DELETE when no session is present', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms/po-1' })
      const middleware = await getMiddleware()

      expect(() => middleware(makeEvent('DELETE'))).toThrowError(
        expect.objectContaining({ statusCode: 401 }),
      )
    })

    it('sets event.context.auth when POST has a valid session', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/purchase-order-forms' })
      const session = { token: 'jwt-token', authID: 'a', clientUrl: '', clientFullUrl: '', userID: '', userName: '', urlID: 0, email: '' }
      mockGetSessionFromEvent.mockReturnValue(session)
      const middleware = await getMiddleware()
      const event = makeEvent('POST')

      middleware(event)

      expect(event.context.auth).toEqual({ session })
    })

    it('allows POST /api/auth/login without a session (public route)', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/api/auth/login' })
      const middleware = await getMiddleware()

      expect(middleware(makeEvent('POST'))).toBeUndefined()
      expect(mockGetSessionFromEvent).not.toHaveBeenCalled()
    })
  })

  describe('non-API routes', () => {
    it('ignores non-API paths', async () => {
      mockGetRequestURL.mockReturnValue({ pathname: '/purchase-orders/print/po-1' })
      const middleware = await getMiddleware()

      expect(middleware(makeEvent('GET'))).toBeUndefined()
      expect(mockGetSessionFromEvent).not.toHaveBeenCalled()
    })
  })
})
