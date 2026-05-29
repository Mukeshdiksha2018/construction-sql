import { computed, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockHydratePrintAuth = vi.fn().mockResolvedValue('test-token')

vi.mock('~/utils/authToken', () => ({
  hydratePrintAuth: () => mockHydratePrintAuth(),
}))

let mockRouteParams: { id: string } = { id: 'po-uuid-1' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: mockRouteParams }),
}))

vi.stubGlobal('useRoute', () => ({ params: mockRouteParams }))
vi.stubGlobal('computed', computed)

describe('Purchase Order Print Page', () => {
  const originalPrint = window.print
  let printSpy: ReturnType<typeof vi.fn>
  const originalDefinePageMeta = (globalThis as { definePageMeta?: unknown }).definePageMeta

  beforeEach(() => {
    vi.useFakeTimers()
    printSpy = vi.fn()
    // @ts-expect-error test override
    window.print = printSpy
    ;(globalThis as { definePageMeta?: unknown }).definePageMeta = vi.fn()
    vi.stubGlobal('useHead', vi.fn())
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    // @ts-expect-error restore
    window.print = originalPrint
    ;(globalThis as { definePageMeta?: unknown }).definePageMeta = originalDefinePageMeta
  })

  async function mountPrintPage(id = 'po-uuid-1') {
    mockRouteParams = { id }
    mockHydratePrintAuth.mockResolvedValue('test-token')
    const PrintPage = (await import('~/pages/purchase-orders/print/[id].vue')).default
    const wrapper = mount(PrintPage, {
      global: {
        stubs: {
          ClientOnly: { template: '<div><slot /></div>' },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          PurchaseOrderPreview: {
            name: 'PurchaseOrderPreview',
            props: ['purchaseOrderUuid'],
            emits: ['preview-ready'],
            template: '<div data-testid="po-preview">{{ purchaseOrderUuid }}</div>',
          },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('uses layout: false and no auth middleware (print tab like reference)', async () => {
    await mountPrintPage()
    expect(mockHydratePrintAuth).toHaveBeenCalled()
    expect((globalThis as { definePageMeta?: ReturnType<typeof vi.fn> }).definePageMeta).toHaveBeenCalledWith({
      layout: false,
    })
  })

  it('renders PurchaseOrderPreview with route id', async () => {
    const wrapper = await mountPrintPage('cfd6ee28-436b-428e-98fd-67093934156b')
    expect(wrapper.find('[data-testid="po-preview"]').text()).toBe('cfd6ee28-436b-428e-98fd-67093934156b')
  })

  it('calls window.print when the Print button is clicked', async () => {
    const wrapper = await mountPrintPage()
    await wrapper.find('button').trigger('click')
    expect(printSpy).toHaveBeenCalled()
  })

  it('auto-prints when preview emits preview-ready', async () => {
    const wrapper = await mountPrintPage()
    const preview = wrapper.findComponent({ name: 'PurchaseOrderPreview' })
    await preview.vm.$emit('preview-ready')
    vi.advanceTimersByTime(500)
    expect(printSpy).toHaveBeenCalled()
  })
})
