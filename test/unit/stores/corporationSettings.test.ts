import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('defineStore', (await import('pinia')).defineStore)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useAppSettingsStore (stubbed – no corporation-settings API)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  async function getStore() {
    const { useAppSettingsStore } = await import('../../../app/stores/corporationSettings')
    return useAppSettingsStore()
  }

  describe('initial state', () => {
    it('settings is null', async () => {
      const store = await getStore()
      expect(store.settings).toBeNull()
    })

    it('loading is false', async () => {
      const store = await getStore()
      expect(store.loading).toBe(false)
    })

    it('error is null', async () => {
      const store = await getStore()
      expect(store.error).toBeNull()
    })
  })

  describe('getters return safe defaults', () => {
    it('poPrintApprovedByVendor is false', async () => {
      const store = await getStore()
      expect(store.poPrintApprovedByVendor).toBe(false)
    })

    it('poUseEntityName is false', async () => {
      const store = await getStore()
      expect(store.poUseEntityName).toBe(false)
    })
  })

  describe('fetchSettings (no-op)', () => {
    it('does NOT call the /api/corporation-settings endpoint', async () => {
      const store = await getStore()
      await store.fetchSettings()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('completes without throwing', async () => {
      const store = await getStore()
      await expect(store.fetchSettings()).resolves.toBeUndefined()
    })

    it('does not change settings after call', async () => {
      const store = await getStore()
      await store.fetchSettings()
      expect(store.settings).toBeNull()
    })

    it('getters remain false after fetchSettings', async () => {
      const store = await getStore()
      await store.fetchSettings()
      expect(store.poPrintApprovedByVendor).toBe(false)
      expect(store.poUseEntityName).toBe(false)
    })
  })

  describe('updateSettings (no-op)', () => {
    it('does NOT call the /api/corporation-settings endpoint', async () => {
      const store = await getStore()
      await store.updateSettings({ po_print_approved_by_vendor: true })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('completes without throwing', async () => {
      const store = await getStore()
      await expect(
        store.updateSettings({ po_use_entity_name: true, po_print_approved_by_vendor: false }),
      ).resolves.toBeUndefined()
    })

    it('getters remain false after updateSettings', async () => {
      const store = await getStore()
      await store.updateSettings({ po_print_approved_by_vendor: true, po_use_entity_name: true })
      expect(store.poPrintApprovedByVendor).toBe(false)
      expect(store.poUseEntityName).toBe(false)
    })
  })
})
