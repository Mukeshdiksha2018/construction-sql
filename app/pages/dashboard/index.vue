<template>
  <div class="p-4 lg:p-6">
    <UCard>
      <h1 class="text-2xl font-semibold text-default mb-2">
        Dashboard
      </h1>
      <p class="text-muted">
        Welcome, {{ authStore.session?.userName || authStore.session?.email }}.
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'main-layout',
})

const authStore = useAuthStore()
</script>
