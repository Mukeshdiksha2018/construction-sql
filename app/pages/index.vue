<template>
  <div
    class="h-screen w-full overflow-hidden transition-all duration-500"
    :class="isDark ? 'bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-slate-200'"
    :style="isDark ? 'background: linear-gradient(135deg, #111827 0%, #1a2532 25%, #25364a 50%, #1a2532 75%, #111827 100%);' : ''"
  >
    <div class="flex flex-col lg:flex-row h-full">
      <!-- Logo section - desktop -->
      <div class="hidden lg:flex flex-1 items-center justify-center">
        <div class="text-center">
          <div
            class="w-32 h-32 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-300"
            :class="isDark ? 'bg-gradient-to-br from-brand-600 to-brand-700 shadow-2xl shadow-brand-500/30 ring-2 ring-brand-400/20' : 'bg-brand-100 shadow-lg'"
          >
            <UIcon
              name="i-heroicons-building-office-2"
              :class="isDark ? 'w-16 h-16 text-white drop-shadow-lg' : 'w-16 h-16 text-brand-600'"
            />
          </div>
          <h1
            class="text-3xl font-bold mb-2 transition-colors duration-300"
            :class="isDark ? 'text-white drop-shadow-lg' : 'text-gray-800'"
          >
            Nimble Construction Accounting
          </h1>
        </div>
      </div>

      <!-- Logo section - mobile -->
      <div class="lg:hidden flex justify-center pt-6 pb-3">
        <div class="text-center">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto transition-all duration-300"
            :class="isDark ? 'bg-gradient-to-br from-brand-600 to-brand-700 shadow-xl shadow-brand-500/30 ring-2 ring-brand-400/20' : 'bg-brand-100 shadow-lg'"
          >
            <UIcon
              name="i-heroicons-building-office-2"
              :class="isDark ? 'w-8 h-8 text-white drop-shadow-lg' : 'w-8 h-8 text-brand-600'"
            />
          </div>
          <h1
            class="text-lg font-bold mb-1 transition-colors duration-300"
            :class="isDark ? 'text-white drop-shadow-lg' : 'text-gray-800'"
          >
            Nimble Construction accounting
          </h1>
        </div>
      </div>

      <!-- Login form -->
      <div class="flex-1 flex items-center justify-center px-4 pb-6 lg:pb-0 relative">
        <div class="absolute top-4 right-4 z-10">
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            variant="soft"
            size="sm"
            :color="isDark ? 'primary' : 'neutral'"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            :class="[
              'transition-all duration-300 hover:scale-110',
              isDark ? 'text-yellow-300 bg-gradient-to-br from-brand-600/20 to-brand-700/20 border border-brand-400/30 backdrop-blur-sm shadow-lg shadow-brand-500/20' : '',
            ]"
            @click="toggleDarkMode"
          />
        </div>

        <UCard
          class="w-full max-w-md p-6 lg:p-8 rounded-2xl transition-all duration-500"
          :class="isDark ? 'bg-gradient-to-br from-gray-800/90 via-gray-900/80 to-gray-800/90 backdrop-blur-xl shadow-2xl shadow-brand-900/50 border border-brand-500/20 ring-1 ring-brand-400/10' : 'shadow-lg bg-white'"
        >
          <h2
            class="text-center text-2xl font-semibold mb-6 transition-colors duration-300"
            :class="isDark ? 'text-white drop-shadow-sm' : 'text-gray-800'"
          >
            Login to Your Account
          </h2>

          <form @submit.prevent="submit">
            <div class="mb-6">
              <label
                for="email"
                class="block text-sm font-medium mb-2 transition-colors duration-300"
                :class="isDark ? 'text-brand-200' : 'text-gray-700'"
              >
                Email
              </label>
              <UInput
                id="email"
                v-model="email"
                placeholder="Enter your email"
                type="email"
                variant="outline"
                :color="isDark ? 'neutral' : 'primary'"
                size="lg"
                :class="[
                  'w-full transition-all duration-300',
                  isDark ? 'bg-gray-800/60 border-brand-500/30 text-white placeholder-brand-300/70 focus:border-brand-400/50 focus:ring-brand-400/20' : '',
                ]"
                required
              />
            </div>

            <div class="mb-6">
              <label
                for="password"
                class="block text-sm font-medium mb-2 transition-colors duration-300"
                :class="isDark ? 'text-brand-200' : 'text-gray-700'"
              >
                Password
              </label>
              <UInput
                id="password"
                v-model="password"
                placeholder="Enter your password"
                :type="showPassword ? 'text' : 'password'"
                variant="outline"
                :color="isDark ? 'neutral' : 'primary'"
                size="lg"
                :class="[
                  'w-full transition-all duration-300',
                  isDark ? 'bg-gray-800/60 border-brand-500/30 text-white placeholder-brand-300/70 focus:border-brand-400/50 focus:ring-brand-400/20' : '',
                ]"
                :ui="{ trailing: 'pe-1' }"
                required
              >
                <template #trailing>
                  <UButton
                    :color="isDark ? 'neutral' : 'neutral'"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    :aria-pressed="showPassword"
                    aria-controls="password"
                    :class="isDark ? 'text-brand-300 hover:text-brand-100' : ''"
                    @click="togglePasswordVisibility"
                  />
                </template>
              </UInput>
            </div>

            <div v-if="errMessage" class="mb-4">
              <p
                class="text-sm text-center transition-colors duration-300"
                :class="isDark ? 'text-red-300' : 'text-red-500'"
              >
                {{ errMessage }}
              </p>
            </div>

            <UButton
              type="submit"
              color="primary"
              size="lg"
              :class="[
                'w-full flex justify-center items-center transition-all duration-300',
                isDark ? 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-lg shadow-brand-500/30 ring-2 ring-brand-400/20' : '',
              ]"
              :loading="isLoading"
            >
              Login
            </UButton>
          </form>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPathForMenuId } from '~/utils/nimbleMenuIds'
import { exchangeNimbleAuthId } from '~/utils/nimbleAuthIdExchange'
import { syncNimbleSessionFromAuth } from '~/utils/authToken'

definePageMeta({
  layout: false,
  middleware: 'guest',
})

function toMenuRedirect(menuPath: string | undefined, corporationId: string): string | null {
  if (!menuPath) return null
  const [path = '', rawQuery = ''] = menuPath.split('?')
  const params = new URLSearchParams(rawQuery)
  if (corporationId) params.set('corporationId', corporationId)
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

const { isDark, toggleDarkMode, initializeTheme, watchSystemTheme } = useDarkMode()
const {
  email,
  password,
  isLoading,
  errMessage,
  showPassword,
  togglePasswordVisibility,
  submit,
} = useLoginForm()

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()

onMounted(async () => {
  initializeTheme()
  watchSystemTheme()

  const nimbleOn = String(runtimeConfig.public.nimbleIntegrations || '').toLowerCase() === 'true'
  if (!nimbleOn) return

  const authId = String(route.query.authId ?? '').trim()
  if (!authId) return

  const menuId = String(route.query.menuId ?? '').trim()
  const corporationId = String(route.query.corporationId ?? '').trim()

  try {
    const session = await exchangeNimbleAuthId(authId)

    if (session) {
      authStore.setSession(session)
      syncNimbleSessionFromAuth()

      // Fetch privileges + approvals in the background before navigation
      const { loadPrivileges } = usePrivilegesFetch()
      loadPrivileges().catch((err: unknown) => {
        console.warn('[Privileges] Background load failed after authId exchange:', err)
      })

      const menuRedirect = toMenuRedirect(getPathForMenuId(menuId), corporationId)
      if (menuRedirect) {
        await router.replace(menuRedirect)
        return
      }
      await router.replace('/projects')
    }
  }
  catch {
    // Keep user on login page when authId exchange fails.
  }
})
</script>
