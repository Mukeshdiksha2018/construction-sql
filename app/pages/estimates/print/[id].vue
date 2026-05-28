<template>
  <div class="min-h-screen bg-white text-black">
    <div class="print:hidden w-full">
      <div class="max-w-5xl mx-auto px-4 pt-4">
        <div class="flex justify-end">
          <UButton color="primary" icon="i-heroicons-printer" @click="printPage">Print</UButton>
        </div>
      </div>
    </div>
    <div class="max-w-5xl mx-auto px-4 py-6">
      <ProjectsEstimatePreview :estimate-uuid="estimateId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({ layout: false })

const route = useRoute()
const estimateId = computed(() => route.params.id as string)
const printPage = () => window.print()
</script>

<style>
@media print {
  html, body { background: #ffffff !important; }
}
</style>
