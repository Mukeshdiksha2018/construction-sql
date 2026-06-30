import { computed, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockHydratePrintAuth = vi.fn().mockResolvedValue('test-token')

vi.mock('~/utils/authToken', () => ({
  hydratePrintAuth: () => mockHydratePrintAuth(),
}))

let mockRouteParams: { id: string } = { id: 'co-uuid-1' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: mockRouteParams }),
}))

vi.stubGlobal('useRoute', () => ({ params: mockRouteParams }))
vi.stubGlobal('computed', computed)

describe('Change Order Print Page', () => {
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

  async function mountPrintPage(id = 'co-uuid-1') {
    mockRouteParams = { id }
    const PrintPage = (await import('~/pages/change-orders/print/[id].vue')).default
    const wrapper = mount(PrintPage, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          ChangeOrderPreview: {
            name: 'ChangeOrderPreview',
            props: ['changeOrderUuid', 'printInToCurrency', 'hideCurrencyPrintControls'],
            emits: ['preview-ready'],
            template: '<div data-testid="co-preview">{{ changeOrderUuid }}</div>',
          },
          PoPreviewCurrencyPrintBar: {
            template: '<div data-testid="po-preview-currency-print-bar" />',
          },
        },
      },
    })
    await flushPromises()
    return wrapper
  }

  it('uses layout: false for bare print page', async () => {
    await mountPrintPage()
    expect(mockHydratePrintAuth).toHaveBeenCalled()
    expect((globalThis as { definePageMeta?: ReturnType<typeof vi.fn> }).definePageMeta).toHaveBeenCalledWith({
      layout: false,
    })
  })

  it('renders ChangeOrderPreview with route id', async () => {
    const wrapper = await mountPrintPage('co-abc-123')
    expect(wrapper.find('[data-testid="co-preview"]').text()).toBe('co-abc-123')
  })

  it('calls window.print when the Print button is clicked', async () => {
    const wrapper = await mountPrintPage()
    await wrapper.find('button').trigger('click')
    expect(printSpy).toHaveBeenCalled()
  })
})
