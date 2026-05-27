<template>
  <div class="p-4 lg:p-6">
    <UCard>
      <h1 class="text-2xl font-semibold text-default mb-2">
        {{ title }}
      </h1>
      <p class="text-muted">
        {{ description }}
      </p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
}>(), {
  description: 'This section will be available soon.',
})
</script>
