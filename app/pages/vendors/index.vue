<template>
  <ClientOnly>
    <VendorsVendorManagement />
    <template #fallback>
      <div class="relative overflow-auto rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
        <USkeleton class="h-6 w-48 mb-4" />
        <USkeleton v-for="i in 6" :key="i" class="h-4 w-full mb-2" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'main-layout' })
</script>
