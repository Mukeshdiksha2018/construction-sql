import { useRouter } from 'vue-router'
import { stashPrintAuthSession } from '~/utils/printAuthBridge'

export function useEstimatePrint() {
  const router = useRouter()
  const authStore = useAuthStore()

  const openEstimatePrint = (estimateOrId: { uuid?: string } | string) => {
    const id = typeof estimateOrId === 'string' ? estimateOrId : estimateOrId?.uuid
    if (!id) return

    stashPrintAuthSession(authStore.user)

    const targetUrl = `/estimates/print/${id}`
    try {
      const resolved = router.resolve(targetUrl)
      window.open(resolved.href, '_blank')
    }
    catch {
      window.open(targetUrl, '_blank')
    }
  }

  return { openEstimatePrint }
}
