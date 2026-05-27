import { defineStore } from 'pinia'

export interface UserProfile {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  status?: string
  roleId?: string | null
  corporationAccess?: string[]
}

export const useUserProfilesStore = defineStore('userProfiles', {
  state: () => ({
    users: [] as UserProfile[],
    loading: false,
    error: null as string | null,
    hasData: false,
  }),

  getters: {
    activeUsers: (state) => state.users.filter(u => u.status === 'active'),
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        this.users = []
        this.hasData = true
      } finally {
        this.loading = false
      }
    },
    clear() {
      this.users = []
      this.hasData = false
    },
  },
})
