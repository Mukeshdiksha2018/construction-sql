import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useNimbleSessionStore = defineStore('nimbleSession', {
  state: () => ({
    authID: null as string | null,
    userID: null as string | null,
    userName: null as string | null,
    email: null as string | null,
    token: null as string | null,
    exchangedAuthId: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    syncFromAuthStore() {
      const authStore = useAuthStore()
      this.token = authStore.token ?? null
      this.email = authStore.user?.email ?? null
    },
    setToken(token: string | null) {
      this.token = token
    },
    clear() {
      this.authID = null
      this.userID = null
      this.userName = null
      this.email = null
      this.token = null
      this.exchangedAuthId = null
    },
  },
})
