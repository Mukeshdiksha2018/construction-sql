<template>
  <div class="hidden lg:flex h-screen bg-brand-600 dark:bg-brand-800">
    <aside
      class="text-white flex flex-col transition-all duration-300 border-r border-brand-700 dark:border-brand-900"
      :class="isExpanded ? 'w-56' : 'w-16'"
      aria-label="Sidebar"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="p-4 text-lg font-bold border-b border-brand-700 dark:border-brand-900 truncate text-white">
        <span v-if="isExpanded">Nimble Property Management</span>
        <span v-else>NPM</span>
      </div>

      <nav class="flex-1 px-2 py-4">
        <div class="space-y-1">
          <NuxtLink
            v-for="item in desktopNavItems"
            :key="item.label"
            :to="item.to"
            class="group flex items-center px-3 py-2 rounded-lg transition-all duration-200"
            :class="[
              item.class,
              isActiveRoute(item.to)
                ? 'bg-white text-brand-600 dark:text-brand-700 font-semibold shadow-md'
                : 'text-white/90 hover:bg-brand-500 dark:hover:bg-brand-700 hover:text-white',
            ]"
          >
            <UIcon
              :name="item.icon"
              class="w-5 h-5 flex-shrink-0 transition-colors duration-200"
              :class="isActiveRoute(item.to)
                ? 'text-brand-600 dark:text-brand-700'
                : 'text-white/80 group-hover:text-white'"
            />
            <span v-if="isExpanded" class="ml-3 truncate text-md">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { desktopNavItems, useActiveRoute } from '~/composables/useNavigation'

const isExpanded = ref(false)
const isActiveRoute = useActiveRoute()

function handleMouseEnter() {
  isExpanded.value = true
}

function handleMouseLeave() {
  isExpanded.value = false
}
</script>
