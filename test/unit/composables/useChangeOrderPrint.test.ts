import { describe, it, expect, vi, beforeEach } from 'vitest'

const resolveMock = vi.fn((path: string) => ({ href: path }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ resolve: resolveMock }),
}))

import { useChangeOrderPrint } from '~/composables/useChangeOrderPrint'

describe('useChangeOrderPrint', () => {
  const openMock = vi.fn()

  beforeEach(() => {
    openMock.mockClear()
    resolveMock.mockImplementation((path: string) => ({ href: path }))
    vi.stubGlobal('window', { open: openMock })
  })

  it('opens print URL in a new tab for uuid string', () => {
    const { openChangeOrderPrint } = useChangeOrderPrint()
    openChangeOrderPrint('co-abc-123')
    expect(openMock).toHaveBeenCalledWith('/change-orders/print/co-abc-123', '_blank')
  })

  it('opens print URL when passed change order object', () => {
    const { openChangeOrderPrint } = useChangeOrderPrint()
    openChangeOrderPrint({ uuid: 'co-xyz' })
    expect(openMock).toHaveBeenCalledWith('/change-orders/print/co-xyz', '_blank')
  })

  it('does nothing when uuid is missing', () => {
    const { openChangeOrderPrint } = useChangeOrderPrint()
    openChangeOrderPrint({})
    expect(openMock).not.toHaveBeenCalled()
  })
})
