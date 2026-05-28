<template>
  <header class="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <nav class="flex items-center justify-between px-3 lg:px-4 py-2">
      <div class="flex items-center gap-2 flex-shrink-0 w-[200px]" />

      <div class="flex items-center gap-2 flex-1 justify-center max-w-md mx-4">
        <ClientOnly>
          <SharedCorporationSelect
            v-model="selectedCorporationId"
            class="w-full"
            size="sm"
            @change="onCorporationChange"
          />
          <template #fallback>
            <USkeleton class="h-8 w-full rounded-md" />
          </template>
        </ClientOnly>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-settings"
          variant="solid"
          size="sm"
          color="neutral"
          title="Settings"
          class="hidden md:flex transition-all duration-200 hover:scale-105 flex-shrink-0"
          to="/settings"
        />

        <UButton
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          variant="solid"
          size="sm"
          color="neutral"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          class="hidden md:flex transition-all duration-200 hover:scale-105 flex-shrink-0"
          @click="toggleDarkMode"
        />

        <UButton
          icon="i-lucide-log-out"
          variant="soft"
          size="sm"
          color="error"
          title="Logout"
          class="lg:hidden transition-all duration-200 hover:scale-105 flex-shrink-0"
          @click="logout"
        />

        <div class="hidden lg:flex items-center gap-3">
          <ClientOnly>
            <UDropdownMenu :items="userMenuItems" :ui="{ content: 'w-56' }">
              <UButton
                variant="soft"
                color="neutral"
                class="group flex items-center gap-3 px-3 py-1 rounded-lg transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                <div class="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center overflow-hidden ring-2 ring-brand-200 dark:ring-brand-800 group-hover:ring-brand-400 dark:group-hover:ring-brand-600 transition-colors">
                  <UAvatar
                    :alt="userDisplayName"
                    size="xs"
                    :text="userInitials"
                  />
                </div>

                <div class="text-left min-w-0">
                  <div class="font-medium text-default text-sm truncate max-w-[140px]">
                    {{ userDisplayName }}
                  </div>
                  <div class="text-xs text-muted truncate max-w-[140px]">
                    {{ userSubtitle }}
                  </div>
                </div>

                <UIcon
                  name="i-lucide-chevron-down"
                  class="w-4 h-4 text-muted group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0"
                />
              </UButton>
            </UDropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import type { Corporation } from '~/stores/corporations'
import { useDarkMode } from '~/composables/useDarkMode'

const authStore = useAuthStore()
const corporationStore = useCorporationStore()
const router = useRouter()
const { isDark, toggleDarkMode, initializeTheme, watchSystemTheme } = useDarkMode()

const selectedCorporationId = computed({
  get: () => corporationStore.selectedCorporationId,
  set: (id: string | null) => corporationStore.setSelectedCorporation(id),
})

function onCorporationChange(_corporation: Corporation | null) {
  // Hook for future corporation-scoped data loading
}

const userDisplayName = computed(() => {
  const session = authStore.session
  if (!session) return 'Unknown User'
  if (session.userName?.trim()) return session.userName.trim()
  if (session.email?.trim()) return session.email.split('@')[0]
  return 'Unknown User'
})

const userSubtitle = computed(() => {
  const session = authStore.session
  if (!session) return 'Not signed in'
  const parts: string[] = []
  if (session.email) parts.push(session.email)
  if (session.clientUrl) parts.push(`Env: ${session.clientUrl}`)
  return parts.join(' · ') || 'Nimble User'
})

const userInitials = computed(() => {
  const name = userDisplayName.value
  const bits = name.split(/\s+/).filter(Boolean)
  if (bits.length >= 2) {
    return `${bits[0]![0]}${bits[1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const userMenuItems = computed(() => [
  [
    {
      label: userDisplayName.value,
      description: authStore.session?.email || undefined,
      type: 'label' as const,
    },
  ],
  [
    {
      label: 'User ID',
      description: authStore.session?.userID || '—',
      icon: 'i-lucide-fingerprint',
      type: 'label' as const,
    },
    {
      label: 'Environment',
      description: authStore.session?.clientUrl || '—',
      icon: 'i-lucide-globe',
      type: 'label' as const,
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: () => logout(),
    },
  ],
])

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  }
  catch {
    // still clear local session
  }
  authStore.clear()
  corporationStore.clear()
  await router.push('/')
}

onMounted(() => {
  initializeTheme()
  watchSystemTheme()
})
</script>

<style scoped>
header {
  z-index: 50;
}
</style>
