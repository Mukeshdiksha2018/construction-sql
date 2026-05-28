export interface EstimateAuditLogEntry {
  timestamp: string
  user_uuid: string
  user_name: string
  user_email: string
  user_image_url?: string | null
  action: 'created' | 'updated' | 'marked_ready' | 'approved' | 'unapproved'
  description: string
}

export function useEstimateAuditLog() {
  const getCurrentUserInfo = () => {
    try {
      const { useAuthStore } = require('~/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      if (!user) return { user_uuid: '', user_name: 'System', user_email: '', user_image_url: null }
      return {
        user_uuid: user.id || '',
        user_name: user.user_metadata?.full_name
          || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
          || user.email?.split('@')[0]
          || 'Unknown User',
        user_email: user.email || '',
        user_image_url: user.user_metadata?.avatar_url || user.user_metadata?.image_url || null,
      }
    }
    catch {
      return { user_uuid: '', user_name: 'System', user_email: '', user_image_url: null }
    }
  }

  const createAuditLogEntry = (action: EstimateAuditLogEntry['action'], description: string): EstimateAuditLogEntry => {
    const userInfo = getCurrentUserInfo()
    return { timestamp: new Date().toISOString(), ...userInfo, action, description }
  }

  const trackEstimateCreated = (estimateNumber: string) => createAuditLogEntry('created', `Estimate ${estimateNumber} created`)
  const trackEstimateUpdated = () => createAuditLogEntry('updated', 'Estimate updated')
  const trackMarkedReady = () => createAuditLogEntry('marked_ready', 'Estimate marked as ready')
  const trackApproved = () => createAuditLogEntry('approved', 'Estimate approved')
  const trackUnapproved = () => createAuditLogEntry('unapproved', 'Estimate unapproved')

  return { trackEstimateCreated, trackEstimateUpdated, trackMarkedReady, trackApproved, trackUnapproved, getCurrentUserInfo }
}
