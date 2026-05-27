/**
 * Ensure all client $fetch calls include session cookies for protected API routes.
 */
export default defineNuxtPlugin(() => {
  globalThis.$fetch = $fetch.create({
    credentials: 'include',
  }) as typeof $fetch
})
