<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-3xl' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold">Audit Log</h3>
        <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="isOpen = false" />
      </div>
    </template>
    <template #body>
      <div class="p-4 text-center text-sm text-muted">Audit log is not available in this version.</div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="soft" @click="isOpen = false">Close</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  open?: boolean
  entityId?: string
  entityType?: string
  corporationUuid?: string
  billInfo?: any
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  entityId: '',
  entityType: '',
  corporationUuid: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'logs-loaded': [logs: any[]]
  'error': [error: any]
  'export': [logs: any[]]
}>()

const isOpen = computed({
  get: () => props.open,
  set: v => emit('update:open', v),
})
</script>
