<template>
  <LayoutPlaceholder
    :title="isNew ? 'New Project' : 'Edit Project'"
    :description="`Project form (${projectId}) will appear here.`"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => String(route.params.id ?? ''))
const isNew = computed(() => projectId.value === 'new')
</script>
