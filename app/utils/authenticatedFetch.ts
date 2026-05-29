import { fetchServerSession } from '~/utils/auth-session'
import { useAuthStore, type NimbleSession } from '~/stores/auth'
import { consumePrintAuthSession, readPersistedAuthSession } from '~/utils/printAuthBridge'
import { resolveAuthToken, syncNimbleSessionFromAuth, waitForAuthReady } from '~/utils/authToken'

function applySessionIfNeeded(session: NimbleSession | null | undefined): boolean {
  if (!session?.token) return false
  const authStore = useAuthStore()
  if (authStore.token === session.token) return true
  authStore.setSession(session)
  syncNimbleSessionFromAuth()
  return true
}

/** Sync Pinia auth from print bridge, localStorage, or the HTTP-only session cookie. */
export async function ensureAuthSession(): Promise<void> {
  if (typeof window === 'undefined') return

  await waitForAuthReady()

  if (resolveAuthToken()) return

  if (applySessionIfNeeded(consumePrintAuthSession())) return
  if (applySessionIfNeeded(readPersistedAuthSession())) return

  const session = await fetchServerSession()
  applySessionIfNeeded(session)
}

function buildAuthHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  const token = resolveAuthToken()
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
  if (typeof window === 'undefined') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authenticated requests must run on the client',
    })
  }

  await ensureAuthSession()
  return $fetch<T>(url, {
    ...options,
    credentials: 'include',
    headers: buildAuthHeaders(options.headers as HeadersInit | undefined),
  })
}
