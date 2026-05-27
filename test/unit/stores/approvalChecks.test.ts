import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useApprovalChecksStore } from '~/stores/approvalChecks'

describe('useApprovalChecksStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads approval checks from API', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        approval_check: 'Manager',
        description: null,
        active: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = useApprovalChecksStore()
    await store.fetchApprovalChecks()

    expect(mockFetch).toHaveBeenCalledWith('/api/approval-checks', { credentials: 'include' })
    expect(store.approvalChecks).toHaveLength(1)
    expect(store.approvalChecks[0]?.approval_check).toBe('Manager')
  })

  it('creates approval check and prepends to list', async () => {
    const created = {
      id: 2,
      uuid: 'uuid-2',
      approval_check: 'CFO',
      description: 'Required',
      active: true,
      created_at: '2026-01-02T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    }
    mockFetch.mockResolvedValue({ data: created })

    const store = useApprovalChecksStore()
    await store.createApprovalCheck({ approval_check: 'CFO', description: 'Required', active: true })

    expect(store.approvalChecks[0]).toEqual(created)
  })
})
