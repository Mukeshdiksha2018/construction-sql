<template>
  <div>
    <!-- One row: label (left) + Add (right), same baseline as PO form vendor/freight -->
    <div
      v-if="label || canShowAdd"
      class="flex flex-nowrap items-center w-full mb-1 gap-2 min-h-[1.25rem]"
      :class="label ? '' : 'justify-end'"
    >
      <label
        v-if="label"
        class="text-xs font-medium text-default leading-none min-w-0 truncate"
      >
        {{ label }}<span v-if="required" class="text-red-500">*</span>
      </label>
      <UBadge
        v-if="canShowAdd"
        color="primary"
        variant="solid"
        size="xs"
        class="cursor-pointer hover:opacity-80 transition-opacity shrink-0 ml-auto"
        title="Add credit days"
        @click="openAddModal"
      >
        <UIcon name="i-heroicons-plus" class="w-3 h-3" />
        Add
      </UBadge>
    </div>
    <USelectMenu
      :model-value="selectedOption"
      :items="creditDaysOptions"
      :placeholder="placeholder"
      :size="size"
      :class="uiClass"
      value-key="value"
      :disabled="disabled"
      @update:model-value="onSelect"
    />

    <UModal v-model:open="showAddModal" :ui="{ wrapper: 'max-w-md', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Add Credit Days</h3>
          <UButton
            icon="i-heroicons-x-mark"
            size="xs"
            variant="solid"
            color="neutral"
            @click="showAddModal = false"
          />
        </div>
      </template>
      <template #body>
        <form class="space-y-4" @submit.prevent>
          <div>
            <label class="block text-sm font-medium text-default mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="addForm.name"
              placeholder="e.g. Net 15, Net 30"
              size="sm"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">
              Number of days <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model.number="addForm.interval"
              type="number"
              min="0"
              step="1"
              placeholder="Days"
              size="sm"
              class="w-full"
            />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="showAddModal = false">
            Cancel
          </UButton>
          <UButton
            variant="solid"
            color="primary"
            :disabled="!isAddFormValid || isCreating"
            :loading="isCreating"
            @click="saveAndSelect"
          >
            Save &amp; Select
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useNimbleSessionStore } from '~/stores/nimbleSession';
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions';
import { resolveCreditDaysToDayCount as resolveDaysFromOptions, type CreditDaysOption } from '~/utils/creditDaysResolve';

export type CreditDaysValue = {
  credit_days: string | null;
  credit_days_id: string | null;
};

const props = withDefaults(
  defineProps<{
    modelValue: CreditDaysValue;
    disabled?: boolean;
    placeholder?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** When set, wraps field with the same label row as PurchaseOrderForm / VendorInvoiceForm */
    label?: string;
    required?: boolean;
    uiClass?: string;
    /** Show small Add control (requires Nimble integration + session token). Uses same API3 base as list (NIMBLE_API3_URL). */
    showAddButton?: boolean;
  }>(),
  {
    disabled: false,
    placeholder: 'Select credit days',
    size: 'sm',
    uiClass: 'w-full',
    label: undefined,
    required: false,
    showAddButton: true,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: CreditDaysValue];
}>();

const runtimeConfig = useRuntimeConfig();
const nimbleSession = useNimbleSessionStore();
const { creditDaysOptions, refreshCreditDaysOptions } = useCreditDaysOptions();

const showAddModal = ref(false);
const isCreating = ref(false);
const addForm = ref({ name: '', interval: null as number | null });

const canShowAdd = computed(() => {
  if (!props.showAddButton || props.disabled) return false;
  if (!runtimeConfig.public.nimbleIntegrations) return false;
  return Boolean(String(nimbleSession.token || '').trim());
});

const isAddFormValid = computed(() => {
  const name = String(addForm.value.name || '').trim();
  const n = addForm.value.interval;
  return (
    name.length > 0 &&
    n !== null &&
    n !== undefined &&
    Number.isFinite(Number(n)) &&
    Number.isInteger(Number(n)) &&
    Number(n) >= 0
  );
});

const selectedOption = computed<CreditDaysOption | undefined>(() => {
  const v = props.modelValue?.credit_days;
  const id = props.modelValue?.credit_days_id;
  if (!v && !id) return undefined;
  if (id) {
    const idLower = String(id).toLowerCase()
    const byId = creditDaysOptions.value.find((opt) => String(opt.id || '').toLowerCase() === idLower)
    if (byId) return byId
  }
  const target = String(v || '').toLowerCase();
  let found = creditDaysOptions.value.find((opt) => String(opt.value).toLowerCase() === target);
  if (!found) {
    found = creditDaysOptions.value.find(
      (opt) => opt.label.toLowerCase() === target.replace(/_/g, ' ')
    );
  }
  if (!found) {
    const days = resolveDaysFromOptions(creditDaysOptions.value, v != null ? String(v) : null, id ?? null);
    if (typeof days === 'number') {
      found = creditDaysOptions.value.find((opt) => Number(opt.days) === days);
    }
  }
  return found;
});

function onSelect(val: string | CreditDaysOption | undefined) {
  const selected =
    typeof val === 'string'
      ? creditDaysOptions.value.find((opt) => String(opt.value) === val)
      : val;
  emit('update:modelValue', {
    credit_days: selected?.value ? String(selected.value) : null,
    credit_days_id: selected?.id != null && String(selected.id).trim() !== '' ? String(selected.id) : null,
  });
}

function openAddModal() {
  if (!canShowAdd.value) return;
  addForm.value = { name: '', interval: null };
  showAddModal.value = true;
}

async function saveAndSelect() {
  if (!isAddFormValid.value) return;
  const token = String(nimbleSession.token || '').trim();
  if (!token) return;

  isCreating.value = true;
  const toast = useToast();
  try {
    const res = await $fetch<{
      ID?: string;
      Name?: string;
      error?: string;
    }>('/api/nimble/credit-days', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name: String(addForm.value.name).trim(),
        interval: Number(addForm.value.interval),
      },
    });

    if (res && typeof res === 'object' && 'error' in res && res.error) {
      toast.add({
        title: 'Error',
        description: String(res.error),
        color: 'error',
        icon: 'i-heroicons-x-circle',
      });
      return;
    }

    const newId = String(res?.ID ?? '').trim();
    const newName = String(res?.Name ?? '').trim();
    if (!newId) {
      toast.add({
        title: 'Error',
        description: 'No credit days ID returned from Nimble.',
        color: 'error',
        icon: 'i-heroicons-x-circle',
      });
      return;
    }

    await refreshCreditDaysOptions();

    emit('update:modelValue', {
      credit_days: newName || String(addForm.value.name).trim(),
      credit_days_id: newId,
    });

    showAddModal.value = false;
    toast.add({
      title: 'Success',
      description: res?.Name
        ? `Credit days "${res.Name}" created and selected.`
        : 'Credit days created and selected.',
      color: 'success',
      icon: 'i-heroicons-check-circle',
    });
  } catch (err: unknown) {
    const msg =
      (err as { data?: { error?: string; details?: string } })?.data?.error ||
      (err as { data?: { details?: string } })?.data?.details ||
      (err as Error)?.message ||
      'Failed to create credit days';
    toast.add({
      title: 'Error',
      description: String(msg),
      color: 'error',
      icon: 'i-heroicons-x-circle',
    });
  } finally {
    isCreating.value = false;
  }
}

onMounted(() => {
  void refreshCreditDaysOptions();
});

watch(
  [() => nimbleSession.token, () => runtimeConfig.public.nimbleIntegrations],
  () => {
    void refreshCreditDaysOptions();
  }
);

defineExpose({ openAddModal });
</script>
