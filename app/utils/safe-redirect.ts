/** Return a safe same-origin redirect path (no open redirect). */
export function getSafeRedirect(
  redirect: unknown,
  fallback = '/dashboard',
): string {
  if (redirect == null || typeof redirect !== 'string') return fallback
  const s = redirect.trim()
  if (!s) return fallback
  if (!s.startsWith('/')) return fallback
  if (s.startsWith('//') || s.includes('javascript:') || s.includes('data:')) return fallback
  return s
}
