import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  alias: {
    '@': fileURLToPath(new URL('./app', import.meta.url)),
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', 'nuxt-tiptap-editor'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['dexie'],
    },
  },
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral', 'brand']
    }
  },
  runtimeConfig: {
    // MSSQL — server-side only (set NUXT_MSSQL_CONNECTION_STRING in .env)
    mssqlConnectionString: '',
    // Nimble property MSSQL — server-side only (NUXT_NIMBLE_CONNECTION_STRING)
    nimbleConnectionString: process.env.NUXT_NIMBLE_CONNECTION_STRING || '',
    // Nimble API5 base (NIMBLE_API_BASE_URL) — e.g. https://qa-api5.nimbleproperty.net
    nimbleApiBaseUrl: process.env.NIMBLE_API_BASE_URL || '',
    // Nimble API3 base (NIMBLE_API3_URL) — e.g. https://qa-api3.nimbleproperty.net (vendor data)
    nimbleApi3Url: process.env.NIMBLE_API3_URL || '',
    // Signs HTTP-only session cookie (falls back to NIMBLE_WEBHOOK_SECRET)
    authSessionSecret: process.env.NUXT_AUTH_SESSION_SECRET || process.env.NIMBLE_WEBHOOK_SECRET || '',
    public: {
      // NUXT_PUBLIC_NIMBLE_OAUTH_EXCHANGE_URL — base for Nimble OpenApiAuth endpoints
      nimbleOauthExchangeUrl: '',
      // NUXT_PUBLIC_NIMBLE_PAYABLE_ENV — "url" field in login payload (e.g. qa22)
      nimblePayableEnv: '',
      // NUXT_PUBLIC_NIMBLE_INTEGRATIONS — true to enable menuId-driven tab filtering
      nimbleIntegrations: process.env.NUXT_PUBLIC_NIMBLE_INTEGRATIONS || 'false',
      // NUXT_PUBLIC_NIMBLE_CORE_API_URL — Nimble Core API base (used for chart of accounts etc.)
      nimbleCoreApiUrl: '',
    },
  },
})
