/**
 * Ensure client API calls carry Nimble Bearer token.
 * This is a fallback for iframe environments where cookies may be blocked.
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

  // Override global $fetch used by app code.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).$fetch = customFetch
})
