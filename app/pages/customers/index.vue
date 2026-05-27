<template>
  <LayoutPlaceholder title="Customers" />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'main-layout' })
</script>
