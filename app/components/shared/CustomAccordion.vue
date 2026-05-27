<template>
  <div class="w-full">
    <div
      v-for="(item, index) in items"
      :key="item.key || index"
      class="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
    >
      <button
        :id="`accordion-trigger-${item.key || index}`"
        :aria-expanded="openItems.includes(item.key || index)"
        :aria-controls="`accordion-content-${item.key || index}`"
        class="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none"
        @click="toggleItem(item.key || index)"
      >
        <div class="flex-1">
          <slot name="trigger" :item="item" :index="index" :isOpen="openItems.includes(item.key || index)">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.label }}</span>
            </div>
          </slot>
        </div>
      </button>

      <div
        v-show="openItems.includes(item.key || index)"
        :id="`accordion-content-${item.key || index}`"
        class="overflow-hidden transition-all duration-200"
        :class="{
          'max-h-0 opacity-0': !openItems.includes(item.key || index),
          'max-h-screen opacity-100': openItems.includes(item.key || index),
        }"
      >
        <div>
          <slot name="content" :item="item" :index="index" :isOpen="openItems.includes(item.key || index)">
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ item.content }}</div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface AccordionItem {
  key?: string | number
  label?: string
  content?: string
  disabled?: boolean
  [key: string]: any
}

interface Props {
  items: AccordionItem[]
  type?: 'single' | 'multiple'
  collapsible?: boolean
  defaultOpen?: (string | number)[]
  trailingIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'single',
  collapsible: true,
  defaultOpen: () => [],
  trailingIcon: 'i-heroicons-chevron-down',
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  'item-toggle': [item: AccordionItem, isOpen: boolean]
}>()

const openItems = ref<(string | number)[]>([])

onMounted(() => {
  if (props.defaultOpen.length > 0) openItems.value = [...props.defaultOpen]
})

const toggleItem = (itemKey: string | number) => {
  const item = props.items.find(i => (i.key || props.items.indexOf(i)) === itemKey)
  if (item?.disabled) return
  const isCurrentlyOpen = openItems.value.includes(itemKey)
  if (props.type === 'single') {
    openItems.value = isCurrentlyOpen && props.collapsible ? [] : [itemKey]
  } else {
    openItems.value = isCurrentlyOpen
      ? openItems.value.filter(k => k !== itemKey)
      : [...openItems.value, itemKey]
  }
  emit('update:modelValue', openItems.value)
  emit('item-toggle', item!, !isCurrentlyOpen)
}

watch(() => props.defaultOpen, v => { if (v.length > 0) openItems.value = [...v] }, { deep: true })
</script>
