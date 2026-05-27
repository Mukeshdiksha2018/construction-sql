export const NIMBLE_VENDOR_IFRAME_MESSAGES = {
  VENDOR_CREATED: 'NIMBLE_VENDOR_CREATED',
  VENDOR_CANCELLED: 'NIMBLE_VENDOR_CANCELLED',
  CLOSE_IFRAME: 'NIMBLE_CLOSE_IFRAME',
} as const

export type NimbleVendorIframeMessage = typeof NIMBLE_VENDOR_IFRAME_MESSAGES[keyof typeof NIMBLE_VENDOR_IFRAME_MESSAGES]

export function isNimbleVendorIframeMessage(data: any): data is { type: NimbleVendorIframeMessage; vendor?: any } {
  return data && typeof data === 'object' && Object.values(NIMBLE_VENDOR_IFRAME_MESSAGES).includes(data.type)
}
