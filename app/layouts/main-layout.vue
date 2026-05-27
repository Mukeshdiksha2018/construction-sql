<template>
  <div class="flex h-full min-h-0 flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <LayoutSideMenu />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <LayoutTopBar class="w-full flex-shrink-0" />

      <main class="min-h-0 flex-1 p-2 bg-white dark:bg-gray-900 rounded-xl lg:rounded-xl mb-16 lg:mb-2 min-w-0 overflow-x-auto overflow-y-auto">
        <div class="h-min w-full max-w-full min-h-0">
          <slot />
        </div>
      </main>
    </div>

    <LayoutMobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import LayoutSideMenu from '~/components/layout/SideMenu.vue'
import LayoutTopBar from '~/components/layout/TopBar.vue'
import LayoutMobileBottomNav from '~/components/layout/MobileBottomNav.vue'
</script>
