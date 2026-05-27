<template>
  <div class="flex items-center gap-2">
    <UAvatar
      v-if="selectedCustomerOption?.avatarData"
      v-bind="selectedCustomerOption.avatarData"
      size="xs"
      class="flex-shrink-0"
    />
    <USelectMenu
      v-model="selectedCustomerObject"
      :items="customerOptions"
      :filter-fields="['label', 'searchText']"
      :placeholder="getPlaceholder"
      :searchable="searchable"
      :searchable-placeholder="searchablePlaceholder"
      :size="size"
      :class="className"
      :disabled="disabled || loading || !isEnabled"
      :loading="loading"
      :ui="menuUi"
      value-key="value"
      label-key="label"
      clearable
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div class="flex items-center gap-2 w-full">
          <UAvatar
            v-if="item.avatarData"
            v-bind="item.avatarData"
            size="xs"
            class="flex-shrink-0"
          />
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-medium whitespace-normal break-words text-left">{{ item.label }}</span>
            <span v-if="item.description" class="text-xs text-muted truncate">{{ item.description }}</span>
          </div>
        </div>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCustomerStore } from '~/stores/customers'

interface Props {
  modelValue?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
  projectUuid?: string
  localCustomers?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select customer...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'flex-1 min-w-0',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [customer: any]
}>()

const customerStore = useCustomerStore()
const selectedCustomer = ref<string | undefined>(props.modelValue)
const selectedCustomerObject = ref<any>(undefined)
const customers = ref<any[]>([])
const loading = ref(false)

const menuUi = {
  content: 'max-h-60 min-w-full w-max',
  item: {
    base: 'whitespace-normal break-words',
    label: 'whitespace-normal break-words text-left',
  },
}

const isEnabled = computed(() => !!props.corporationUuid)
const getPlaceholder = computed(() => {
  if (!props.corporationUuid) return 'Select corporation first'
  return props.placeholder
})

const computeInitials = (customer: any) => {
  const segments = [customer.first_name, customer.last_name]
    .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
    .map((v: string) => v.trim()[0]?.toUpperCase())
    .join('')
  if (segments.length) return segments
  if (customer.company_name) return customer.company_name.trim()[0]?.toUpperCase() || 'C'
  if (customer.customer_email) return customer.customer_email.trim()[0]?.toUpperCase() || 'C'
  return 'C'
}

const fetchCustomersFromAPI = async (corporationUuid: string, projectUuid?: string) => {
  if (!corporationUuid) { customers.value = []; return }
  if (props.localCustomers !== undefined && Array.isArray(props.localCustomers)) {
    let filtered = props.localCustomers.filter(c => c.corporation_uuid === corporationUuid)
    if (projectUuid) filtered = filtered.filter(c => !c.project_uuid || c.project_uuid === projectUuid)
    customers.value = filtered
    return
  }
  loading.value = true
  try {
    await customerStore.fetchCustomers(corporationUuid, projectUuid || null, false)
    let filtered = customerStore.customers.filter(c => c.corporation_uuid === corporationUuid)
    if (projectUuid) filtered = filtered.filter(c => !c.project_uuid || c.project_uuid === projectUuid)
    customers.value = filtered
  } catch {
    customers.value = []
  } finally {
    loading.value = false
  }
}

const customerOptions = computed(() =>
  customers.value.map(customer => {
    const nameParts = [customer.salutation, customer.first_name, customer.middle_name, customer.last_name].filter(Boolean)
    const fullName = nameParts.join(' ').trim()
    const label = fullName || customer.company_name || 'Unnamed Customer'
    const description = customer.company_name || customer.customer_email || null
    const alt = label
    const avatarData = customer.profile_image_url
      ? { src: customer.profile_image_url, alt, size: 'xs' as const }
      : { alt, text: computeInitials(customer), size: 'xs' as const }
    return {
      label,
      value: customer.uuid,
      customer,
      description,
      avatarData,
      searchText: `${fullName} ${customer.company_name || ''} ${customer.customer_email || ''}`.toLowerCase(),
    }
  })
)

const customerOptionsMap = computed(() => new Map(customerOptions.value.map(c => [c.value, c])))
const selectedCustomerOption = computed(() =>
  selectedCustomer.value ? customerOptionsMap.value.get(selectedCustomer.value) : undefined
)

const updateSelectedObject = () => {
  selectedCustomerObject.value = selectedCustomer.value
    ? customerOptionsMap.value.get(selectedCustomer.value) || undefined
    : undefined
}

const handleSelection = (customer: any) => {
  if (!customer) {
    selectedCustomer.value = undefined
    emit('update:modelValue', undefined)
    return
  }
  let customerValue: string | undefined
  let customerObject: any
  if (typeof customer === 'string') {
    customerValue = customer
    customerObject = customerOptionsMap.value.get(customer)
  } else if (customer && typeof customer === 'object') {
    customerValue = customer.value || customer.uuid || customer.id
    customerObject = customer
  } else {
    emit('update:modelValue', undefined)
    return
  }
  if (!customerValue) { emit('update:modelValue', undefined); return }
  selectedCustomer.value = customerValue
  emit('update:modelValue', customerValue)
  emit('change', customerObject || customer)
}

watch(() => props.modelValue, v => { selectedCustomer.value = v; updateSelectedObject() })
watch(customerOptions, () => updateSelectedObject(), { immediate: true })
watch(selectedCustomer, () => updateSelectedObject())
watch(
  [() => props.corporationUuid, () => props.projectUuid],
  async ([newCorp, newProj], [oldCorp]) => {
    if (newCorp !== oldCorp && oldCorp) {
      selectedCustomer.value = undefined
      selectedCustomerObject.value = undefined
      emit('update:modelValue', undefined)
    }
    if (newCorp) await fetchCustomersFromAPI(newCorp, newProj)
    else customers.value = []
  },
  { immediate: true }
)
</script>
