import { useRouter } from 'vue-router'
import { stashPrintAuthSession } from '~/utils/printAuthBridge'

export function usePurchaseOrderPrint() {
  const router = useRouter()
  const authStore = useAuthStore()

  const openPurchaseOrderPrint = (purchaseOrderOrId: { uuid?: string } | string) => {
    const id = typeof purchaseOrderOrId === 'string' ? purchaseOrderOrId : purchaseOrderOrId?.uuid
    if (!id) return

    stashPrintAuthSession(authStore.user)

    const targetUrl = `/purchase-orders/print/${id}`
    try {
      const resolved = router.resolve(targetUrl)
      window.open(resolved.href, '_blank')
    } catch {
      window.open(targetUrl, '_blank')
    }
  }

  return { openPurchaseOrderPrint }
}
