import type { NimbleSession } from '~/stores/auth'
import { readPersistedAuthSession } from '~/utils/printAuthBridge'

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
