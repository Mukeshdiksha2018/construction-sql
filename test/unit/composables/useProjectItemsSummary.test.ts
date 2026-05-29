import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useProjectItemsSummary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  async function loadComposable() {
    const { useProjectItemsSummary } = await import('../../../app/composables/useProjectItemsSummary')
    return useProjectItemsSummary()
  }

  it('fetches summary from /api/project-items-summary', async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          item_uuid: 'item-1',
          budget_qty: 10,
          po_qty: 4,
          pending_qty: 6,
        },
      ],
    })

    const summary = await loadComposable()
    const result = await summary.fetchProjectItemsSummary('corp-1', 'proj-1', 'vendor-1', 'Warehouse')

    expect(mockFetch).toHaveBeenCalledWith('/api/project-items-summary', {
      method: 'GET',
      query: {
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
        vendor_uuid: 'vendor-1',
        location: 'Warehouse',
      },
    })
    expect(result?.items).toHaveLength(1)
    expect(summary.data.value?.items[0]).toMatchObject({ pending_qty: 6 })
    expect(summary.loading.value).toBe(false)
  })

  it('returns null when corporation or project is missing', async () => {
    const summary = await loadComposable()
    const result = await summary.fetchProjectItemsSummary('', 'proj-1')
    expect(result).toBeNull()
    expect(summary.error.value).toContain('required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sets error state when API fails', async () => {
    mockFetch.mockRejectedValue({
      data: { statusMessage: 'Server error' },
      message: 'fail',
    })
    const summary = await loadComposable()
    const result = await summary.fetchProjectItemsSummary('corp-1', 'proj-1')
    expect(result).toBeNull()
    expect(summary.error.value).toBeTruthy()
  })
})
