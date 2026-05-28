import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', 'nuxt-tiptap-editor'],
  vite: {
    plugins: [tailwindcss()],
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
    // Nimble API5 base (NIMBLE_API_BASE_URL) — e.g. https://qa-api5.nimbleproperty.net
    nimbleApiBaseUrl: process.env.NIMBLE_API_BASE_URL || '',
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
