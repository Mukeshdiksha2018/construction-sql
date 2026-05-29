import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin({
  name: 'pinia-persistedstate',
  dependsOn: ['pinia'],
  setup(nuxtApp) {
    const pinia = nuxtApp.$pinia as Pinia
    pinia.use(piniaPluginPersistedstate)
  },
})
