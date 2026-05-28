import { useAuthStore } from '~/stores/auth'

export interface PurchaseOrderAuditLogEntry {
  timestamp: string
  user_uuid: string
  user_name: string
  user_email: string
  user_image_url?: string | null
  action: 'created' | 'updated' | 'marked_ready' | 'approved' | 'rejected' | 'deleted'
  description: string
}

export function usePurchaseOrderAuditLog() {
  const getCurrentUserInfo = () => {
    try {
      const config = useRuntimeConfig()
      const nimbleEnabled = !!config.public?.nimbleIntegrations
      if (nimbleEnabled) {
        try {
          const nimbleSession = useNimbleSessionStore?.()
          if (nimbleSession) {
            const name = String(nimbleSession.userName || nimbleSession.userFullName || nimbleSession.email || '').trim()
            if (name) return { user_uuid: '', user_name: name, user_email: nimbleSession.email || '', user_image_url: null }
          }
        } catch {}
      }
    } catch {}

    try {
      const authStore = useAuthStore()
      const user = authStore.user
      if (user) {
        return {
          user_uuid: user.id || '',
          user_name: user.user_metadata?.full_name ||
            `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
            user.email?.split('@')[0] || 'Unknown User',
          user_email: user.email || '',
          user_image_url: user.user_metadata?.avatar_url || null,
        }
      }
    } catch {}

    return { user_uuid: '', user_name: 'Unknown User', user_email: '', user_image_url: null }
  }

  const createAuditLogEntry = (
    action: PurchaseOrderAuditLogEntry['action'],
    description: string
  ): PurchaseOrderAuditLogEntry => {
    const userInfo = getCurrentUserInfo()
    return {
      timestamp: new Date().toISOString(),
      user_uuid: userInfo.user_uuid,
      user_name: userInfo.user_name,
      user_email: userInfo.user_email,
      user_image_url: userInfo.user_image_url,
      action,
      description,
    }
  }

  const trackPurchaseOrderCreated = (poNumber: string) =>
    createAuditLogEntry('created', `Purchase order ${poNumber} created`)

  const trackPurchaseOrderUpdated = () =>
    createAuditLogEntry('updated', 'Purchase order updated')

  const trackMarkedReady = () =>
    createAuditLogEntry('marked_ready', 'Purchase order marked as ready for approval')

  const trackApproved = () =>
    createAuditLogEntry('approved', 'Purchase order approved')

  const trackRejected = () =>
    createAuditLogEntry('rejected', 'Purchase order rejected')

  const trackDeleted = () =>
    createAuditLogEntry('deleted', 'Purchase order deleted')

  return {
    trackPurchaseOrderCreated,
    trackPurchaseOrderUpdated,
    trackMarkedReady,
    trackApproved,
    trackRejected,
    trackDeleted,
    getCurrentUserInfo,
  }
}
