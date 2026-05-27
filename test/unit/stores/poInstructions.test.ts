import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePOInstructionsStore } from '~/stores/poInstructions'

describe('usePOInstructionsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads PO instructions for selected corporation', async () => {
    mockFetch.mockResolvedValue({
      data: [{
        id: 1,
        uuid: 'uuid-1',
        corporation_uuid: 'corp-1',
        po_instruction_name: 'Invoice',
        instruction: 'Attach invoice',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
    })

    const store = usePOInstructionsStore()
    await store.fetchPOInstructions('corp-1')

    expect(mockFetch).toHaveBeenCalledWith('/api/po-instructions', {
      query: { corporation_uuid: 'corp-1' },
      credentials: 'include',
    })
    expect(store.poInstructions).toHaveLength(1)
    expect(store.poInstructions[0]?.po_instruction_name).toBe('Invoice')
  })

  it('replaces only current corporation records on fetch', async () => {
    const store = usePOInstructionsStore()
    store.poInstructions = [
      {
        id: 1,
        uuid: 'old-c1',
        corporation_uuid: 'corp-1',
        po_instruction_name: 'Old',
        instruction: 'Old',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        uuid: 'c2',
        corporation_uuid: 'corp-2',
        po_instruction_name: 'Other Corp',
        instruction: 'Other',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    mockFetch.mockResolvedValue({
      data: [{
        id: 3,
        uuid: 'new-c1',
        corporation_uuid: 'corp-1',
        po_instruction_name: 'New',
        instruction: 'New',
        status: 'INACTIVE',
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      }],
    })

    await store.fetchPOInstructions('corp-1')

    expect(store.poInstructions.map(p => p.uuid)).toEqual(['c2', 'new-c1'])
  })

  it('creates PO instruction and prepends to list', async () => {
    const created = {
      id: 4,
      uuid: 'uuid-4',
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Receive note',
      instruction: 'Capture receiver signature',
      status: 'ACTIVE' as const,
      created_at: '2026-01-03T00:00:00.000Z',
      updated_at: '2026-01-03T00:00:00.000Z',
    }
    mockFetch.mockResolvedValue({ data: created })

    const store = usePOInstructionsStore()
    await store.createPOInstruction('corp-1', {
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Receive note',
      instruction: 'Capture receiver signature',
      status: 'ACTIVE',
    })

    expect(store.poInstructions[0]).toEqual(created)
  })

  it('updates PO instruction in existing list', async () => {
    const store = usePOInstructionsStore()
    store.poInstructions = [{
      id: 1,
      uuid: 'uuid-1',
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Old Name',
      instruction: 'Old',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }]

    mockFetch.mockResolvedValue({
      data: {
        ...store.poInstructions[0],
        po_instruction_name: 'New Name',
        status: 'INACTIVE',
      },
    })

    await store.updatePOInstruction('uuid-1', {
      po_instruction_name: 'New Name',
      instruction: 'Old',
      status: 'INACTIVE',
    })

    expect(store.poInstructions[0]?.po_instruction_name).toBe('New Name')
    expect(store.poInstructions[0]?.status).toBe('INACTIVE')
  })
})
