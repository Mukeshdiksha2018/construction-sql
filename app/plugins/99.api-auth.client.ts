/**
 * Single client $fetch override — credentials + Nimble Bearer token.
 * Must load after other plugins (99 prefix) so this is the final global $fetch.
 */
export default defineNuxtPlugin(() => {
  const customFetch = $fetch.create({
    credentials: 'include',
    onRequest({ options }) {
      const authStore = useAuthStore()
      const token = authStore.token
      if (!token) return

      const headers = new Headers(options.headers as HeadersInit | undefined)
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      options.headers = headers
    },
  })

  globalThis.$fetch = customFetch
})
