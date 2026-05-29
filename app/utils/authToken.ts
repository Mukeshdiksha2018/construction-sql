import type { NimbleSession } from '~/stores/auth'
import {
  consumePrintAuthSession,
  readPersistedAuthSession,
  AUTH_PINIA_STORAGE_KEY,
} from '~/utils/printAuthBridge'
import { fetchServerSession } from '~/utils/auth-session'

/** Resolve the Nimble Bearer token from Pinia or persisted storage. */
export function resolveAuthToken(): string | null {
  const authStore = useAuthStore()
  if (authStore.token) return authStore.token

  try {
    const nimbleSession = useNimbleSessionStore()
    if (nimbleSession.token) return nimbleSession.token
  }
  catch {
    // nimbleSession store may not be available during early boot
  }

  const persisted = readPersistedAuthSession()
  if (persisted?.token) {
    authStore.setSession(persisted)
    return persisted.token
  }

  return null
}

export function syncNimbleSessionFromAuth(): void {
  try {
    useNimbleSessionStore().syncFromAuthStore()
  }
  catch {
    // optional store
  }
}

/** $fetch options for Nimble proxy routes (cookie + Bearer for print tabs). */
function parsePersistedAuthRaw(raw: string | null): NimbleSession | null {
  if (!raw) return null
  try {
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

/** Restore auth in a new print tab (bridge, localStorage, opener, or session cookie). */
export async function hydratePrintAuth(): Promise<string | null> {
  await waitForAuthReady()

  const existing = resolveAuthToken()
  if (existing) return existing

  const bridged = consumePrintAuthSession()
  if (bridged?.token) {
    useAuthStore().setSession(bridged)
    syncNimbleSessionFromAuth()
    return bridged.token
  }

  const persisted = readPersistedAuthSession()
  if (persisted?.token) {
    useAuthStore().setSession(persisted)
    syncNimbleSessionFromAuth()
    return persisted.token
  }

  if (typeof window !== 'undefined') {
    try {
      const opener = window.opener
      if (opener && !opener.closed) {
        const fromOpener = parsePersistedAuthRaw(opener.localStorage.getItem(AUTH_PINIA_STORAGE_KEY))
        if (fromOpener?.token) {
          useAuthStore().setSession(fromOpener)
          syncNimbleSessionFromAuth()
          return fromOpener.token
        }
      }
    }
    catch {
      // opener access blocked
    }
  }

  const serverSession = await fetchServerSession()
  if (serverSession?.token) {
    useAuthStore().setSession(serverSession)
    syncNimbleSessionFromAuth()
    return serverSession.token
  }

  return null
}

export function nimbleAuthFetchOptions(): {
  credentials: 'include'
  headers?: { Authorization: string }
} {
  const base = { credentials: 'include' as const }
  try {
    const token = resolveAuthToken()
    if (token) {
      return { ...base, headers: { Authorization: `Bearer ${token}` } }
    }
  }
  catch {
    // Auth store unavailable (e.g. isolated unit tests)
  }
  return base
}

export async function waitForAuthReady(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const nuxtApp = useNuxtApp()
    const ready = nuxtApp.$authReady as Promise<void> | undefined
    if (ready) await ready
  }
  catch {
    // Nuxt app not available in unit tests
  }
}
