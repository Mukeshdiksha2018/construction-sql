<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-default">
        Vendors
      </h1>
      <p class="text-sm text-muted mt-1">
        Manage vendor master data in Nimble Business (Sunray database).
      </p>
    </div>

    <ClientOnly>
      <VendorsVendorManagement />
      <template #fallback>
        <p class="text-muted text-sm py-8 text-center">
          Loading vendors...
        </p>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'main-layout' })
</script>
