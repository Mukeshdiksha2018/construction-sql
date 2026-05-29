import type { NimbleSession } from '~/stores/auth'

export const AUTH_PINIA_STORAGE_KEY = 'auth'
const PRINT_AUTH_BRIDGE_KEY = 'nimble-print-auth-bridge'
const PRINT_AUTH_BRIDGE_TTL_MS = 60_000

interface PrintAuthBridgePayload {
  session: NimbleSession
  exp: number
}

function isClient(): boolean {
  return typeof window !== 'undefined'
}

/** Copy the current session for a print tab opened via window.open (same origin). */
export function stashPrintAuthSession(session: NimbleSession | null | undefined): void {
  if (!isClient() || !session?.token) return

  const payload: PrintAuthBridgePayload = {
    session,
    exp: Date.now() + PRINT_AUTH_BRIDGE_TTL_MS,
  }
  localStorage.setItem(PRINT_AUTH_BRIDGE_KEY, JSON.stringify(payload))
}

/** One-time session handoff from the tab that opened print preview. */
export function consumePrintAuthSession(): NimbleSession | null {
  if (!isClient()) return null

  try {
    const raw = localStorage.getItem(PRINT_AUTH_BRIDGE_KEY)
    if (!raw) return null
    localStorage.removeItem(PRINT_AUTH_BRIDGE_KEY)

    const payload = JSON.parse(raw) as PrintAuthBridgePayload
    if (!payload?.session?.token || Date.now() > payload.exp) return null
    return payload.session
  }
  catch {
    localStorage.removeItem(PRINT_AUTH_BRIDGE_KEY)
    return null
  }
}

/** Read persisted Pinia auth when store hydration lags behind localStorage (common in new tabs). */
export function readPersistedAuthSession(): NimbleSession | null {
  if (!isClient()) return null

  try {
    const raw = localStorage.getItem(AUTH_PINIA_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as {
      session?: NimbleSession | null
      state?: { session?: NimbleSession | null }
    }

    const session = parsed.session ?? parsed.state?.session ?? null
    return session?.token ? session : null
  }
  catch {
    return null
  }
}
