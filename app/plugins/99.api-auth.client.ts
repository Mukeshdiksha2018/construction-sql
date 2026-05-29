import { resolveAuthToken } from '~/utils/authToken'

/**
 * Single client $fetch override — credentials + Nimble Bearer token.
 * Runs last so it wraps the final global $fetch.
 */
export default defineNuxtPlugin({
  name: 'api-auth',
  enforce: 'post',
  setup() {
    const customFetch = $fetch.create({
      credentials: 'include',
      onRequest({ options }) {
        const token = resolveAuthToken()
        if (!token) return

        const headers = new Headers(options.headers as HeadersInit | undefined)
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
        }
        options.headers = headers
      },
    })

    globalThis.$fetch = customFetch
  },
})
