import { defineStore } from 'pinia'

export interface Role {
  id: string
  role_name: string
}

export const useRoleStore = defineStore('roles', {
  state: () => ({
    roles: [] as Role[],
    loading: false,
  }),

  actions: {
    async fetchRoles() {
      this.roles = []
    },
  },
})
