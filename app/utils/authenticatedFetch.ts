import { fetchServerSession } from '~/utils/auth-session'
import { useAuthStore, type NimbleSession } from '~/stores/auth'
import { consumePrintAuthSession, readPersistedAuthSession } from '~/utils/printAuthBridge'

function applySessionIfNeeded(session: NimbleSession | null | undefined): boolean {
  if (!session?.token) return false
  const authStore = useAuthStore()
  if (authStore.token === session.token) return true
  authStore.setSession(session)
  return true
}

/** Sync Pinia auth from print bridge, localStorage, or the HTTP-only session cookie. */
export async function ensureAuthSession(): Promise<void> {
  const authStore = useAuthStore()
  if (authStore.token) return

  if (applySessionIfNeeded(consumePrintAuthSession())) return
  if (applySessionIfNeeded(readPersistedAuthSession())) return

  const session = await fetchServerSession()
  applySessionIfNeeded(session)
}

function buildAuthHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = useAuthStore().token
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

/** $fetch wrapper that always sends cookies and the Nimble Bearer token when available. */
export async function authenticatedFetch<T>(
  url: string,
  options: Parameters<typeof $fetch>[1] = {},
): Promise<T> {
  await ensureAuthSession()
  return $fetch<T>(url, {
    ...options,
    credentials: 'include',
    headers: buildAuthHeaders(options.headers as HeadersInit | undefined),
  })
}
