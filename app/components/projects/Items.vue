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
        v-if="activeTab === 'item-types'"
        title="Item Types"
        description="Item types for the selected corporation will appear here."
      />
      <LayoutPlaceholder
        v-else-if="activeTab === 'items'"
        title="Items"
        description="Project items will appear here."
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
    key: 'item-types',
    label: 'Item Types',
    icon: 'i-heroicons-tag',
    value: 'item-types',
  },
  {
    key: 'items',
    label: 'Items',
    icon: 'i-heroicons-cube',
    value: 'items',
  },
]

const activeTab = computed(() => {
  const subTab = route.query.subTab
  if (subTab === 'item-divisions') {
    return 'item-types'
  }
  if (subTab && typeof subTab === 'string') {
    const validTab = tabs.find(t => t.value === subTab)
    return validTab ? subTab : tabs[0]!.value
  }
  return tabs[0]!.value
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
  if (!route.query.subTab || route.query.subTab === 'item-divisions') {
    const currentQuery = { ...route.query }
    currentQuery.subTab = tabs[0]!.value
    router.replace({ query: currentQuery })
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'items' && (!route.query.subTab || route.query.subTab === 'item-divisions')) {
      const currentQuery = { ...route.query, subTab: tabs[0]!.value }
      router.replace({ query: currentQuery })
    }
  },
)
</script>
