<template>
  <div class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-8 text-center">
    <h2 class="text-lg font-semibold text-default">
      {{ title }}
    </h2>
    <p class="mt-2 text-sm text-muted">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
}

defineProps<Props>()
</script>
