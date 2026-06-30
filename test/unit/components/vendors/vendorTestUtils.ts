import { h } from 'vue'

export function makeNimbleDbVendor(overrides: Record<string, unknown> = {}) {
  return {
    vendor_id: 'v1',
    name: 'Acme Supplies',
    company_name: 'Acme LLC',
    corporation_id: 'corp-1',
    account_id: null,
    status: 1,
    status_label: 'active',
    tax_id: '12-3456789',
    contact_person_name: null,
    credit_limit: null,
    check_reference: null,
    federal_id: '12-3456789',
    ssn: null,
    print_check_as: null,
    is_1099: false,
    credit_days_id: null,
    mobile_num: '555-0100',
    email: 'billing@acme.test',
    address: '100 Main St',
    business_type: 'Supplier',
    account_number: 'ACC-100',
    payment_method: 'Check',
    total_due: 1250.5,
    type: 1,
    bid: '1',
    created_by: null,
    modified_by: null,
    created_at: null,
    modified_at: null,
    ...overrides,
  }
}

export const UButtonStub = {
  name: 'UButton',
  props: ['disabled', 'loading', 'onClick'],
  emits: ['click'],
  template: '<button type="button" :disabled="disabled || loading" @click="onClick && onClick($event); $emit(\'click\', $event)"><slot /></button>',
}

export const UInputStub = {
  name: 'UInput',
  props: ['modelValue', 'placeholder', 'disabled', 'type'],
  emits: ['update:modelValue'],
  template: '<input :type="type || \'text\'" :placeholder="placeholder" :disabled="disabled" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

export const USelectStub = {
  name: 'USelect',
  props: ['modelValue', 'items'],
  emits: ['update:modelValue', 'change'],
  template: `
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value); $emit('change', $event)">
      <option v-for="item in items || []" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
  `,
}

export const UTooltipStub = {
  name: 'UTooltip',
  template: '<div><slot /></div>',
}

export const UBadgeStub = {
  name: 'UBadge',
  template: '<span class="badge"><slot /></span>',
}

export const UModalStub = {
  name: 'UModal',
  props: ['open'],
  emits: ['update:open'],
  template: `
    <div v-if="open" data-testid="modal">
      <slot name="header" />
      <slot name="body" />
      <slot name="footer" />
    </div>
  `,
}

export const UAlertStub = {
  name: 'UAlert',
  props: ['title', 'description'],
  template: '<div class="alert" :data-title="title"><slot />{{ title }} {{ description }}</div>',
}

export function createUTableStub() {
  return {
    name: 'UTable',
    props: ['data', 'columns'],
    setup(props: { data?: Array<Record<string, unknown>>, columns?: Array<Record<string, unknown>> }) {
      return () => h(
        'div',
        { 'data-testid': 'vendor-table', 'data-row-count': String(props.data?.length ?? 0) },
        (props.data ?? []).map((row) => {
          const actionsCol = props.columns?.find(col => col.id === 'actions')
          const actionVnode = typeof actionsCol?.cell === 'function'
            ? actionsCol.cell({ row: { original: row } })
            : null
          return h('div', { class: 'vendor-row', 'data-vendor-id': row.vendor_id }, [
            h('span', { class: 'vendor-name' }, String(row.name ?? '')),
            actionVnode,
          ])
        }),
      )
    },
  }
}
