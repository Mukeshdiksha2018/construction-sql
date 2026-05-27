import { ref, computed } from 'vue'

const nimbleAuthId = ref<string | null>(null)
const nimbleMenuId = ref<string | null>(null)
const nimbleCorporationId = ref<string | null>(null)
const nimbleUrlInfo = ref<string | null>(null)

export function useNimbleContext() {
  return {
    authId: nimbleAuthId,
    menuId: nimbleMenuId,
    corporationId: nimbleCorporationId,
    urlInfo: nimbleUrlInfo,

    setFromRoute(route: { params: Record<string, any>; query: Record<string, any> }) {
      nimbleAuthId.value = route.params.authId ?? route.query.authId ?? null
      nimbleMenuId.value = route.params.menuId ?? route.query.menuId ?? null
      const corpId = route.params.corporationId ?? route.query.corporationId ?? null
      nimbleCorporationId.value = corpId ? String(corpId) : null
      nimbleUrlInfo.value = route.query.url ?? route.query.urlInfo ?? null
    },

    clear() {
      nimbleAuthId.value = null
      nimbleMenuId.value = null
      nimbleCorporationId.value = null
      nimbleUrlInfo.value = null
    },

    isNimbleUrl: computed(
      () => !!nimbleAuthId.value || !!nimbleMenuId.value || !!nimbleCorporationId.value,
    ),
  }
}
