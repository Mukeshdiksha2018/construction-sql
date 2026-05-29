const PUBLIC_API_ROUTES: Array<{ path: string, methods?: string[] }> = [
  { path: '/api/auth/login', methods: ['POST'] },
  { path: '/api/auth/logout', methods: ['POST'] },
  { path: '/api/auth/session', methods: ['GET'] },
  { path: '/api/auth/exchange-oauth', methods: ['POST'] },
]

/** Path prefixes that are always public (Nuxt internals, health checks, etc.). */
const PUBLIC_API_PREFIXES = [
  '/api/_nuxt_icon/',
  '/api/_hub/',
  '/api/_content/',
]

/** True when the HTTP method should require a session at the middleware layer (matches construction-management: GET reads are open). */
export function requiresAuthForMethod(method: string): boolean {
  const normalized = method.toUpperCase()
  return normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE'
}

export function isPublicApiRoute(pathname: string, method: string): boolean {
  if (PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true
  return PUBLIC_API_ROUTES.some((route) => {
    if (route.path !== pathname) return false
    if (!route.methods) return true
    return route.methods.includes(method.toUpperCase())
  })
}
