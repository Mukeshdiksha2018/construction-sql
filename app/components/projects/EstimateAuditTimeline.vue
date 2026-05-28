<template>
  <div class="estimate-audit-timeline">
    <div v-if="loading" class="flex items-center justify-center py-6">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
      <span class="ml-2 text-sm text-gray-500">Loading audit timeline...</span>
    </div>

    <div v-else-if="error" class="text-center py-6">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-500 mx-auto mb-2" />
      <p class="text-sm text-red-600">{{ error }}</p>
      <UButton color="primary" variant="soft" size="sm" class="mt-2" @click="loadTimeline">
        Try Again
      </UButton>
    </div>

    <div v-else-if="timelineItems.length === 0" class="text-center py-6">
      <UIcon name="i-heroicons-clock" class="w-8 h-8 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-500">No audit history found</p>
      <p class="text-xs text-gray-400">Activity will appear here as changes are made</p>
    </div>

    <div v-else>
      <UTimeline color="neutral" :items="timelineItems" class="w-full">
        <template #title="{ item }">
          <div class="flex flex-col gap-1">
            <span class="text-primary font-medium text-sm">{{ item.userName }}</span>
            <span class="font-medium text-sm">{{ item.title }}</span>
          </div>
        </template>
      </UTimeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Props {
  auditLog?: any[]
  estimateUuid?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  auditLog: () => [],
  estimateUuid: '',
  autoRefresh: false,
  refreshInterval: 30000,
})

const emit = defineEmits<{
  'logs-loaded': [logs: any[]]
  'error': [error: string]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const rawTimelineItems = ref<any[]>([])

const timelineItems = computed(() =>
  rawTimelineItems.value.map(item => ({
    date: item.date,
    title: item.title,
    description: item.description,
    icon: item.icon,
    avatar: item.avatar,
    userName: item.userInfo?.name || item.user || 'Unknown User',
  })),
)

const loadTimeline = async () => {
  loading.value = true
  error.value = null
  try {
    const logs = Array.isArray(props.auditLog) ? props.auditLog : []

    const uniqueLogs = logs.filter((log, idx, self) =>
      idx === self.findIndex(l =>
        l.timestamp === log.timestamp && l.action === log.action && l.user_uuid === log.user_uuid,
      ),
    )

    const items: any[] = uniqueLogs.map((log) => {
      const userName = log.user_name || 'Unknown User'
      const userImageUrl = log.user_image_url || null
      const userInfo = {
        name: userName,
        imageUrl: userImageUrl,
        id: log.user_uuid || null,
        initials: userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
      }

      return {
        id: log.timestamp || Date.now(),
        date: new Date(log.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        title: getActionTitle(log.action),
        description: log.description || getActionDescription(log),
        icon: userInfo.imageUrl ? undefined : getActionIcon(log.action),
        avatar: userInfo.imageUrl ? { src: userInfo.imageUrl, alt: userInfo.name } : undefined,
        user: userInfo.name,
        userInfo,
        timestamp: log.timestamp,
        action: log.action,
      }
    })

    rawTimelineItems.value = items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    emit('logs-loaded', rawTimelineItems.value)
  }
  catch (err: any) {
    const msg = err.message || 'Failed to load audit timeline'
    error.value = msg
    emit('error', msg)
  }
  finally {
    loading.value = false
  }
}

function getActionTitle(action: string): string {
  return ({ created: 'Created', updated: 'Updated', marked_ready: 'Marked Ready', approved: 'Approved', unapproved: 'Unapproved' } as any)[action]
    || action.charAt(0).toUpperCase() + action.slice(1)
}

function getActionIcon(action: string): string {
  return ({ created: 'i-heroicons-plus-circle', updated: 'i-heroicons-pencil-square', marked_ready: 'i-heroicons-bolt', approved: 'i-heroicons-check-circle', unapproved: 'i-heroicons-x-circle' } as any)[action]
    || 'i-heroicons-information-circle'
}

function getActionDescription(log: any): string {
  if (log.description) return log.description
  return ({ created: 'Estimate was created', updated: 'Estimate was updated', marked_ready: 'Estimate was marked as ready', approved: 'Estimate was approved', unapproved: 'Estimate was unapproved' } as any)[log.action]
    || 'Estimate was modified'
}

watch(() => props.auditLog, () => { loadTimeline() }, { immediate: true, deep: true })
onMounted(() => { loadTimeline() })
</script>

<style scoped>
.estimate-audit-timeline { width: 100%; }
</style>
