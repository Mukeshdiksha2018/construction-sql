<template>
  <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-brand-50 via-brand-50 to-brand-50 dark:from-gray-900 dark:via-brand-950 dark:to-gray-900 border-t border-brand-200 dark:border-brand-800 z-50 backdrop-blur-lg">
    <div class="px-2 py-1">
      <div class="flex space-x-2 overflow-x-auto scrollbar-hide">
        <NuxtLink
          v-for="item in mobileNavItems"
          :key="item.label"
          :to="item.to"
          class="flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]"
          :class="[
            isActiveRoute(item.to)
              ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg ring-2 ring-brand-300 dark:ring-brand-700'
              : 'text-gray-600 dark:text-gray-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 hover:text-brand-600 dark:hover:text-brand-400',
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5 mb-1" />
          <span class="text-xs font-medium text-center leading-tight">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mobileNavItems, useActiveRoute } from '~/composables/useNavigation'

const isActiveRoute = useActiveRoute()
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
