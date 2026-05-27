const PUBLIC_API_ROUTES: Array<{ path: string, methods?: string[] }> = [
  { path: '/api/auth/login', methods: ['POST'] },
  { path: '/api/auth/logout', methods: ['POST'] },
]

export function isPublicApiRoute(pathname: string, method: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => {
    if (route.path !== pathname) return false
    if (!route.methods) return true
    return route.methods.includes(method.toUpperCase())
  })
}
