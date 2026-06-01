/**
 * Dev-only bridge for nimble-integration-launcher.html lightweight mode.
 * Allows the launcher page to navigate this app inside iframe via postMessage
 * so iframe document is not reloaded on each menu click.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const router = useRouter()
  const route = useRoute()
  let bridgeToken = String(route.query.launcherBridgeToken || '').trim()

  const onMessage = (event: MessageEvent) => {
    try {
      const payload = event.data as
        | {
            type?: string
            path?: string
            query?: Record<string, unknown>
            bridgeToken?: string
          }
        | undefined
      if (!payload || payload.type !== 'NIMBLE_LAUNCHER_NAVIGATE') return
      const payloadToken = String(payload.bridgeToken || '').trim()
      if (!bridgeToken || !payloadToken || payloadToken !== bridgeToken) return

      const path = String(payload.path || '').trim()
      if (!path.startsWith('/')) return
      const query = (payload.query || {}) as Record<string, string | string[]>

      void router.push({ path, query })
    } catch {
      // non-fatal
    }
  }

  window.addEventListener('message', onMessage)

  router.afterEach((to) => {
    const nextToken = String(to.query.launcherBridgeToken || '').trim()
    if (nextToken) {
      bridgeToken = nextToken
    }
  })
})
