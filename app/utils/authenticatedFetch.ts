import { fetchServerSession } from '~/utils/auth-session'
import { useAuthStore } from '~/stores/auth'

/** Sync Pinia auth from the HTTP-only session cookie when the store is empty (e.g. new print tab). */
export async function ensureAuthSession(): Promise<void> {
  const authStore = useAuthStore()
  if (authStore.token) return

  const session = await fetchServerSession()
  if (session?.token) {
    authStore.setSession(session)
  }
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
