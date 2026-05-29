const STORAGE_KEY = 'po-print-debug'

export function isPoPrintDebugEnabled(): boolean {
  if (import.meta.dev) return true
  if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') {
    return true
  }
  return false
}

/** Filter console with `[PO Print Debug]` — on in dev; in prod: `localStorage.setItem('po-print-debug','1')` */
export function poPrintDebug(step: string, data?: unknown): void {
  if (!isPoPrintDebugEnabled()) return
  if (data !== undefined) {
    console.log(`[PO Print Debug] ${step}`, data)
  }
  else {
    console.log(`[PO Print Debug] ${step}`)
  }
}

export function poPrintDebugWarn(step: string, data?: unknown): void {
  if (!isPoPrintDebugEnabled()) return
  if (data !== undefined) {
    console.warn(`[PO Print Debug] ${step}`, data)
  }
  else {
    console.warn(`[PO Print Debug] ${step}`)
  }
}
