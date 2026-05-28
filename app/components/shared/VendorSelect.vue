<template>
  <div class="relative">
    <USelectMenu
      :model-value="selectedVendorObject"
      :items="vendorOptions"
      :filter-fields="['label', 'searchText']"
      :placeholder="!corporationUuid ? 'Select corporation first' : placeholder"
      :searchable="searchable"
      :searchable-placeholder="searchablePlaceholder"
      :size="size"
      :class="className"
      :disabled="disabled || vendorStore.loading || !corporationUuid"
      :loading="vendorStore.loading"
      :ui="menuUi"
      value-key="value"
      label-key="label"
      @update:model-value="handleSelection"
    >
      <template #default>
        <span
          class="flex-1 whitespace-normal break-words text-left"
          :class="{ 'text-muted': !selectedVendorObject }"
        >
          <template v-if="selectedVendorObject">{{ selectedVendorObject.label }}</template>
          <template v-else>{{ !corporationUuid ? 'Select corporation first' : placeholder }}</template>
        </span>
      </template>
      <template #item-label="{ item }">
        <div class="flex items-center justify-between w-full">
          <span class="whitespace-normal break-words text-left font-medium">{{ item.label }}</span>
          <UBadge v-if="item.status" :color="item.status_color" variant="solid" size="xs" class="flex-shrink-0">
            {{ item.status }}
          </UBadge>
        </div>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useVendorStore } from '~/stores/vendors'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  localVendors?: any[]
  includeAllOption?: boolean
  allOptionLabel?: string
  showAddButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search vendor...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  includeAllOption: false,
  allOptionLabel: 'All Vendors',
  showAddButton: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [vendor: any]
}>()

const vendorStore = useVendorStore()
const selectedVendor = ref<string | undefined>(props.modelValue)
const selectedVendorObject = ref<any>(undefined)

const menuUi = {
  content: 'max-h-60 min-w-full w-max',
  item: { base: 'whitespace-normal break-words', label: 'whitespace-normal break-words text-left' },
}

const vendors = computed(() => {
  if (Array.isArray(props.localVendors)) return props.localVendors
  if (props.corporationUuid) return vendorStore.getVendorsForCorporation(props.corporationUuid)
  return vendorStore.vendors
})

const vendorOptions = computed(() => {
  const options = vendors.value.map((v: any) => ({
    label: v.vendor_name,
    value: v.uuid,
    vendor: v,
    searchText: `${v.vendor_name} ${v.uuid}`.toLowerCase(),
    status: v.is_active === false ? 'Inactive' : undefined,
    status_color: 'neutral' as const,
  }))
  if (props.includeAllOption) {
    return [
      { label: props.allOptionLabel, value: '__ALL__', vendor: null, searchText: '', isAllOption: true },
      ...options,
    ]
  }
  return options
})

const vendorOptionsMap = computed(() => new Map(vendorOptions.value.map(v => [v.value, v])))

const updateSelectedObject = () => {
  selectedVendorObject.value = selectedVendor.value
    ? vendorOptionsMap.value.get(selectedVendor.value) || undefined
    : undefined
}

const handleSelection = (vendor: any) => {
  if (!vendor) {
    selectedVendor.value = undefined
    selectedVendorObject.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const value = typeof vendor === 'string' ? vendor : vendor.value
  if (value === '__ALL__' || (typeof vendor === 'object' && vendor?.isAllOption)) {
    selectedVendor.value = undefined
    selectedVendorObject.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  if (value) {
    selectedVendor.value = value
    const option = vendorOptionsMap.value.get(value)
    selectedVendorObject.value = option
    emit('update:modelValue', value)
    emit('change', option || vendor)
  }
}

watch(() => props.modelValue, v => { selectedVendor.value = v; updateSelectedObject() })
watch(vendorOptions, () => updateSelectedObject(), { immediate: true })
watch(selectedVendor, () => updateSelectedObject())

watch(() => props.corporationUuid, (v) => {
  if (v) {
    vendorStore.fetchVendors(v).catch(() => {})
  }
}, { immediate: true })
</script>
