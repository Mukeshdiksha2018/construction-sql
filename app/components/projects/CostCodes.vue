<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <UTabs
        :items="tabs"
        :model-value="activeTab"
        size="sm"
        color="neutral"
        :content="false"
        @update:model-value="handleTabChange"
      />
    </div>

    <div class="w-full">
      <LayoutPlaceholder
        v-if="activeTab === 'cost-codes-division'"
        title="Cost Codes Division"
        description="Cost code divisions will appear here."
      />
      <LayoutPlaceholder
        v-else-if="activeTab === 'cost-codes-configuration'"
        title="Cost Codes Configuration"
        description="Cost code configuration will appear here."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  {
    key: 'cost-codes-division',
    label: 'Cost Codes Division',
    icon: 'i-heroicons-building-office',
    value: 'cost-codes-division',
  },
  {
    key: 'cost-codes-configuration',
    label: 'Cost Codes Configuration',
    icon: 'i-heroicons-cog-6-tooth',
    value: 'cost-codes-configuration',
  },
]

const activeTab = computed(() => {
  const subTab = route.query.subTab
  if (subTab && typeof subTab === 'string') {
    const validTab = tabs.find(t => t.value === subTab)
    return validTab ? subTab : 'cost-codes-division'
  }
  return 'cost-codes-division'
})

function handleTabChange(tab: string | number) {
  const tabValue = String(tab)
  const validTab = tabs.find(t => t.value === tabValue)
  if (!validTab) return

  const currentQuery = { ...route.query }
  currentQuery.subTab = tabValue
  router.push({ query: currentQuery })
}

onMounted(() => {
  if (!route.query.subTab) {
    const currentQuery = { ...route.query }
    currentQuery.subTab = 'cost-codes-division'
    router.replace({ query: currentQuery })
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'cost-codes' && !route.query.subTab) {
      const currentQuery = { ...route.query, subTab: 'cost-codes-division' }
      router.replace({ query: currentQuery })
    }
  },
)
</script>
