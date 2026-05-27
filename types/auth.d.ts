import type { NimbleSessionPayload } from '../server/utils/nimble-auth'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      session: NimbleSessionPayload
    }
  }
}
