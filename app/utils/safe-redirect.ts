/** Default landing page after login (first primary nav route). */
export const DEFAULT_AUTHENTICATED_ROUTE = '/projects'

/** Return a safe same-origin redirect path (no open redirect). */
export function getSafeRedirect(
  redirect: unknown,
  fallback = DEFAULT_AUTHENTICATED_ROUTE,
): string {
  if (redirect == null || typeof redirect !== 'string') return fallback
  const s = redirect.trim()
  if (!s) return fallback
  if (!s.startsWith('/')) return fallback
  if (s.startsWith('//') || s.includes('javascript:') || s.includes('data:')) return fallback
  return s
}
