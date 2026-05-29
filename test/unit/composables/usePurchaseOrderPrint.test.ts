import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockResolve = vi.fn((to: string) => ({ href: to }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ resolve: mockResolve }),
}))

vi.stubGlobal('useAuthStore', () => ({
  user: { token: 'parent-token' },
  session: { token: 'parent-token', authID: '1', clientUrl: '', clientFullUrl: '', userID: 'u1', userName: 'User', urlID: 1, email: 'u@test.com' },
}))

describe('usePurchaseOrderPrint', () => {
  const originalOpen = window.open
  let openSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    openSpy = vi.fn()
    // @ts-expect-error test override
    window.open = openSpy
    mockResolve.mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    // @ts-expect-error restore
    window.open = originalOpen
  })

  it('opens print route in a new tab using router.resolve with id string', async () => {
    const { usePurchaseOrderPrint } = await import('../../../app/composables/usePurchaseOrderPrint')
    const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

    openPurchaseOrderPrint('cfd6ee28-436b-428e-98fd-67093934156b')

    expect(mockResolve).toHaveBeenCalledWith('/purchase-orders/print/cfd6ee28-436b-428e-98fd-67093934156b')
    expect(openSpy).toHaveBeenCalledWith(
      '/purchase-orders/print/cfd6ee28-436b-428e-98fd-67093934156b',
      '_blank',
    )
  })

  it('opens print route when given a purchase order object', async () => {
    const { usePurchaseOrderPrint } = await import('../../../app/composables/usePurchaseOrderPrint')
    const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

    openPurchaseOrderPrint({ uuid: 'po-uuid-1' })

    expect(openSpy).toHaveBeenCalledWith('/purchase-orders/print/po-uuid-1', '_blank')
  })

  it('does nothing when no id is provided', async () => {
    const { usePurchaseOrderPrint } = await import('../../../app/composables/usePurchaseOrderPrint')
    const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

    // @ts-expect-error intentionally missing id
    openPurchaseOrderPrint({})

    expect(openSpy).not.toHaveBeenCalled()
  })

  it('falls back to raw URL when router.resolve throws', async () => {
    mockResolve.mockImplementationOnce(() => {
      throw new Error('resolve failed')
    })

    const { usePurchaseOrderPrint } = await import('../../../app/composables/usePurchaseOrderPrint')
    const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

    openPurchaseOrderPrint('po-fallback')

    expect(openSpy).toHaveBeenCalledWith('/purchase-orders/print/po-fallback', '_blank')
  })

  it('stashes auth bridge for print tab when parent session exists', async () => {
    const { usePurchaseOrderPrint } = await import('../../../app/composables/usePurchaseOrderPrint')
    const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

    openPurchaseOrderPrint('po-uuid-1')

    const raw = localStorage.getItem('nimble-print-auth-bridge')
    expect(raw).not.toBeNull()
    const payload = JSON.parse(raw!)
    expect(payload.session.token).toBe('parent-token')
  })
})
