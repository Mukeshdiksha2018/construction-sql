<template>
  <LayoutPlaceholder title="Settings" description="Application settings will appear here." />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'main-layout' })
</script>
