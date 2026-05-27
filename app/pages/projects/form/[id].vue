<template>
  <ProjectsProjectDetailsForm />
</template>

<script setup lang="ts">
import ProjectsProjectDetailsForm from '~/components/projects/ProjectDetailsForm.vue'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})
</script>
