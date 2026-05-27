export interface NimbleVendorIframeUrlOptions {
  nimbleBaseUrl?: string | null
  corporationId?: string | null
  sessionToken?: string | null
}

export function buildNimbleVendorAddIframeUrl(options: NimbleVendorIframeUrlOptions): string | null {
  const { nimbleBaseUrl, corporationId, sessionToken } = options
  if (!nimbleBaseUrl || !corporationId) return null
  const base = nimbleBaseUrl.replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('corporationId', corporationId)
  if (sessionToken) params.set('token', sessionToken)
  return `${base}/vendors/new?${params.toString()}`
}
