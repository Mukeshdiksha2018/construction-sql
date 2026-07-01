<template>
  <UModal
    v-model:open="open"
    fullscreen
    scrollable
    :ui="{ footer: 'hidden' }"
    @update:open="onOpenChange"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <h3 class="text-lg font-semibold text-primary">
          {{ isEditing ? 'Edit Vendor' : 'Add Vendor' }}
        </h3>
        <div class="flex items-center gap-2">
          <UButton variant="soft" color="neutral" @click="close">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="!isValid"
            @click="save(false)"
          >
            Save
          </UButton>
          <UButton
            v-if="!isEditing"
            color="primary"
            variant="outline"
            :loading="submitting"
            :disabled="!isValid"
            @click="save(true)"
          >
            Save & New
          </UButton>
        </div>
      </div>
    </template>

    <template #body>
      <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 max-w-[1600px] mx-auto w-full">
        <div class="space-y-3 lg:sticky lg:top-0 lg:self-start">
          <UCard variant="soft" :ui="{ body: 'p-3 sm:p-4' }">
            <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2 mb-2">
              <UIcon name="i-heroicons-building-storefront" class="w-5 h-5 text-primary-500" />
              Vendor Profile
            </h4>

            <div class="space-y-2">
              <div>
                <label class="block text-xs font-medium text-default mb-1">Corporation</label>
                <CorporationSelect
                  v-model="form.corporation_id"
                  disabled
                  placeholder="Corporation"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-default mb-1">
                  Vendor Name <span class="text-error">*</span>
                </label>
                <UInput v-model="form.name" variant="subtle" size="sm" class="w-full" />
              </div>

              <div>
                <label class="block text-xs font-medium text-default mb-1">
                  Federal ID <span class="text-error">*</span>
                </label>
                <UInput v-model="form.federal_id" variant="subtle" size="sm" class="w-full" />
              </div>

              <div>
                <label class="block text-xs font-medium text-default mb-1">SSN</label>
                <UInput v-model="form.ssn" variant="subtle" size="sm" class="w-full" />
              </div>

              <div>
                <CreditDaysSelect
                  v-model="creditDaysModel"
                  placeholder="Select credit days"
                  size="sm"
                  :show-add-button="false"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-default mb-1">Check to be printed as</label>
                <UInput v-model="form.print_check_as" variant="subtle" size="sm" class="w-full" />
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-default">1099 Vendor</span>
                <USwitch v-model="form.is_1099" />
              </div>
            </div>
          </UCard>

          <UCard variant="soft" class="opacity-60" :ui="{ body: 'p-3 sm:p-4' }">
            <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2 mb-2">
              <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-primary-500" />
              Opening Balance
              <span class="text-xs font-normal text-muted ml-auto">Coming soon</span>
            </h4>

            <div class="space-y-2">
              <div>
                <label class="block text-xs font-medium text-default mb-1">Opening Balance</label>
                <UInput disabled variant="subtle" size="sm" placeholder="—" class="w-full" />
              </div>
              <div>
                <label class="block text-xs font-medium text-default mb-1">As of Date</label>
                <UInput disabled type="date" variant="subtle" size="sm" class="w-full" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-default">Add to all corporations</span>
                <USwitch disabled :model-value="false" />
              </div>
            </div>
          </UCard>
        </div>

        <div class="min-w-0">
          <div class="rounded-xl border border-default bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
            <CustomAccordion
              :items="accordionItems"
              type="multiple"
              :default-open="['address-contract']"
              class="w-full"
            >
              <template #trigger="{ item, isOpen }">
                <div
                  class="flex items-center justify-between w-full px-4 py-3 group transition-all duration-200 border-l-4"
                  :class="isOpen
                    ? 'bg-primary-50/80 dark:bg-primary-900/20 border-primary-500'
                    : 'bg-gray-50/60 dark:bg-gray-800/40 border-transparent hover:bg-primary-50/50 dark:hover:bg-primary-900/10 hover:border-primary-300 dark:hover:border-primary-600'"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors"
                      :class="isOpen
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-900 text-primary-500 border border-default/60 group-hover:border-primary-300 dark:group-hover:border-primary-600'"
                    >
                      <UIcon :name="item.icon" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0 text-left">
                      <span
                        class="text-sm font-semibold text-default transition-colors"
                        :class="isOpen ? 'text-primary-700 dark:text-primary-300' : 'group-hover:text-primary-700 dark:group-hover:text-primary-300'"
                      >
                        {{ item.label }}
                      </span>
                      <p v-if="item.description" class="text-xs text-muted truncate mt-0.5">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 ml-3">
                    <UBadge
                      v-if="item.comingSoon"
                      label="Coming soon"
                      color="neutral"
                      variant="soft"
                      size="xs"
                    />
                    <UIcon
                      name="i-heroicons-chevron-right"
                      class="w-4 h-4 text-primary-600 dark:text-primary-400 transition-transform duration-200"
                      :class="{ 'rotate-90': isOpen }"
                    />
                  </div>
                </div>
              </template>

              <template #content="{ item }">
                <div class="px-4 pb-3 pt-2 bg-gradient-to-r from-primary-50/40 via-transparent to-transparent dark:from-primary-900/10 border-t border-default/40">
                  <template v-if="item.key === 'address-contract'">
                    <VendorsVendorAddressTable
                      :vendor-id="vendorId"
                      :vendor-name="vendorDisplayName"
                    />

                    <div class="mt-4 space-y-2 opacity-60">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-default">
                          Contract Details
                        </h4>
                        <UButton size="xs" color="primary" variant="soft" disabled>
                          Add New Contract
                        </UButton>
                      </div>
                      <div class="py-5 text-center text-sm text-muted border border-dashed border-default rounded-lg bg-white/60 dark:bg-gray-900/30">
                        Contract management coming in a later phase.
                      </div>
                    </div>
                  </template>

                  <p v-else class="text-sm text-muted py-3 text-center">
                    This section will be available in a future update.
                  </p>
                </div>
              </template>
            </CustomAccordion>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import CreditDaysSelect from '~/components/shared/CreditDaysSelect.vue'
import CustomAccordion from '~/components/shared/CustomAccordion.vue'
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions'
import { useVendorStore, type NimbleDbVendor } from '~/stores/vendors'
import { useCorporationStore } from '~/stores/corporations'

const props = defineProps<{
  vendor?: NimbleDbVendor | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [vendor?: NimbleDbVendor]
}>()

const vendorStore = useVendorStore()
const corpStore = useCorporationStore()
const toast = useToast()
const { refreshCreditDaysOptions } = useCreditDaysOptions()

const submitting = ref(false)
const savedVendor = ref<NimbleDbVendor | null>(null)

const accordionItems = [
  {
    key: 'address-contract',
    label: 'Address & Contract Details',
    icon: 'i-heroicons-map-pin',
    description: 'Vendor addresses and contract records',
    comingSoon: false,
  },
  {
    key: 'payment-preferences',
    label: 'Payment Preferences',
    icon: 'i-heroicons-credit-card',
    description: 'Payment methods and billing preferences',
    comingSoon: true,
  },
  {
    key: 'additional-info',
    label: 'Additional Information',
    icon: 'i-heroicons-information-circle',
    description: 'Extra vendor profile details',
    comingSoon: true,
  },
  {
    key: 'notes-attachments',
    label: 'Notes & Attachments',
    icon: 'i-heroicons-paper-clip',
    description: 'Notes and supporting documents',
    comingSoon: true,
  },
]

const emptyForm = () => ({
  corporation_id: corpStore.selectedCorporation?.id ?? '',
  name: '',
  federal_id: '',
  ssn: '',
  credit_days_id: '' as string,
  print_check_as: '',
  is_1099: false,
  status: 1 as 0 | 1,
})

const form = ref(emptyForm())

const isEditing = computed(() => !!(props.vendor?.vendor_id || savedVendor.value?.vendor_id))

const vendorId = computed(() =>
  props.vendor?.vendor_id ?? savedVendor.value?.vendor_id ?? null,
)

const vendorDisplayName = computed(() =>
  form.value.name
  || props.vendor?.name
  || savedVendor.value?.name
  || '',
)

function resolveCorporationId(corporationId: string): string {
  if (!corporationId) return ''
  const match = corpStore.corporations.find(
    c => c.id.toLowerCase() === corporationId.toLowerCase(),
  )
  return match?.id ?? corporationId
}

function normalizeCreditDaysId(creditDaysId: string | null | undefined): string {
  return creditDaysId ? String(creditDaysId).trim().toLowerCase() : ''
}

const creditDaysModel = computed({
  get: () => ({
    credit_days: null,
    credit_days_id: form.value.credit_days_id || null,
  }),
  set: (value: { credit_days: string | null, credit_days_id: string | null }) => {
    form.value.credit_days_id = value.credit_days_id || ''
  },
})

const isValid = computed(() =>
  form.value.corporation_id.trim() !== ''
  && form.value.name.trim() !== ''
  && form.value.federal_id.trim() !== '',
)

function vendorToForm(vendor: NimbleDbVendor) {
  form.value = {
    corporation_id: resolveCorporationId(vendor.corporation_id),
    name: vendor.name,
    federal_id: vendor.federal_id ?? vendor.tax_id ?? '',
    ssn: vendor.ssn ?? '',
    credit_days_id: normalizeCreditDaysId(vendor.credit_days_id),
    print_check_as: vendor.print_check_as ?? '',
    is_1099: vendor.is_1099 ?? false,
    status: vendor.status === 3 ? 1 : (vendor.status as 0 | 1),
  }
}

function resetForm() {
  savedVendor.value = null
  form.value = emptyForm()
  if (props.vendor?.vendor_id) {
    vendorToForm(props.vendor)
  }
}

watch(() => props.vendor, () => {
  if (open.value) resetForm()
}, { deep: true })

watch(() => corpStore.selectedCorporation?.id, (id) => {
  if (!isEditing.value && id) {
    form.value.corporation_id = id
  }
})

async function onOpenChange(value: boolean) {
  if (value) {
    await corpStore.ensureReady()
    await refreshCreditDaysOptions()
    resetForm()
  }
  else {
    savedVendor.value = null
  }
}

function close() {
  open.value = false
}

function buildPayload() {
  return {
    corporation_id: form.value.corporation_id,
    name: form.value.name.trim(),
    federal_id: form.value.federal_id.trim() || null,
    ssn: form.value.ssn.trim() || null,
    credit_days_id: form.value.credit_days_id || null,
    print_check_as: form.value.print_check_as.trim() || null,
    is_1099: form.value.is_1099,
    status: form.value.status,
  }
}

async function save(saveAndNew: boolean) {
  if (!isValid.value) return

  submitting.value = true
  try {
    const payload = buildPayload()
    let vendor: NimbleDbVendor | undefined

    if (isEditing.value) {
      const id = vendorId.value!
      vendor = await vendorStore.updateNimbleVendor(id, payload)
      toast.add({ title: 'Vendor updated', color: 'success' })
      emit('saved', vendor)
      if (!saveAndNew) close()
    }
    else {
      vendor = await vendorStore.createNimbleVendor(payload)
      toast.add({ title: 'Vendor created', color: 'success' })
      emit('saved', vendor)

      if (saveAndNew) {
        savedVendor.value = null
        form.value = emptyForm()
      }
      else {
        savedVendor.value = vendor ?? null
        if (vendor) vendorToForm(vendor)
      }
    }
  }
  catch (err: unknown) {
    const e = err as Record<string, unknown>
    toast.add({
      title: 'Save failed',
      description: (e?.statusMessage as string) || (err as Error).message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}
</script>
