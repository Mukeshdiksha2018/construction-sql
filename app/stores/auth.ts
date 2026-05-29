import { defineStore } from 'pinia'

export interface NimbleSession {
  token: string
  authID: string
  clientUrl: string
  clientFullUrl: string
  userID: string
  userName: string
  urlID: number
  email: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as NimbleSession | null,
    isInitialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.session?.token,
    token: (state) => state.session?.token ?? null,
    user: (state) => state.session,
  },

  actions: {
    setSession(session: NimbleSession) {
      this.session = session
      this.isInitialized = true
    },
    syncAuthState(session: NimbleSession | null) {
      this.session = session
      this.isInitialized = true
    },
    clear() {
      this.session = null
      this.isInitialized = false
    },
  },

  persist: import.meta.client
    ? {
        storage: localStorage,
        pick: ['session', 'isInitialized'],
      }
    : false,
})
