import { ref } from 'vue'

export function useLocalPOCOData() {
  const localPurchaseOrders = ref<any[]>([])
  const localChangeOrders = ref<any[]>([])

  const fetchLocalPurchaseOrders = async (
    corporationUuid: string,
    vendorUuid?: string | null,
    projectUuid?: string | null
  ) => {
    if (!corporationUuid) { localPurchaseOrders.value = []; return }
    try {
      const response: any = await $fetch('/api/purchase-order-forms', {
        query: { corporation_uuid: corporationUuid },
      })
      let orders = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
      if (vendorUuid || projectUuid) {
        orders = orders.filter((order: any) => {
          if (vendorUuid && order.vendor_uuid !== vendorUuid) return false
          if (projectUuid && order.project_uuid !== projectUuid) return false
          return true
        })
      }
      localPurchaseOrders.value = orders
    } catch (error: any) {
      console.error('[useLocalPOCOData] Failed to fetch purchase orders:', error)
      localPurchaseOrders.value = []
    }
  }

  const fetchLocalChangeOrders = async (
    corporationUuid: string,
    vendorUuid?: string | null,
    projectUuid?: string | null
  ) => {
    if (!corporationUuid) { localChangeOrders.value = []; return }
    try {
      const response: any = await $fetch('/api/change-orders', {
        query: { corporation_uuid: corporationUuid },
      }).catch(() => ({ data: [] }))
      let orders = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
      if (vendorUuid || projectUuid) {
        orders = orders.filter((order: any) => {
          if (vendorUuid && order.vendor_uuid !== vendorUuid) return false
          if (projectUuid && order.project_uuid !== projectUuid) return false
          return true
        })
      }
      localChangeOrders.value = orders
    } catch (error: any) {
      console.error('[useLocalPOCOData] Failed to fetch change orders:', error)
      localChangeOrders.value = []
    }
  }

  return { localPurchaseOrders, localChangeOrders, fetchLocalPurchaseOrders, fetchLocalChangeOrders }
}
