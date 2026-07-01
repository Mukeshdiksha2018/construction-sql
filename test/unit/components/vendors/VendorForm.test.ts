import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VendorForm from '~/components/vendors/VendorForm.vue'
import { makeNimbleDbVendor, UButtonStub, UInputStub, USelectStub } from './vendorTestUtils'

const mockCreateNimbleVendor = vi.fn()
const mockUpdateNimbleVendor = vi.fn()
const mockEnsureReady = vi.fn()
const mockRefreshCreditDaysOptions = vi.fn()
const toastAdd = vi.fn()

const corpState = vi.hoisted(() => ({
  selectedCorporationId: 'corp-1',
  corporations: [
    { id: 'corp-1', name: 'Test Corp' },
    { id: 'CORP-UPPER', name: 'Upper Corp' },
  ],
}))

vi.mock('~/stores/vendors', () => ({
  useVendorStore: () => ({
    createNimbleVendor: mockCreateNimbleVendor,
    updateNimbleVendor: mockUpdateNimbleVendor,
  }),
}))

vi.mock('~/stores/corporations', () => ({
  useCorporationStore: () => ({
    selectedCorporation: { id: corpState.selectedCorporationId, name: 'Test Corp' },
    corporations: corpState.corporations,
    ensureReady: mockEnsureReady,
  }),
}))

vi.mock('~/composables/useCreditDaysOptions', () => ({
  useCreditDaysOptions: () => ({
    creditDaysOptions: {
      value: [
        { id: 'cd-30', value: '30', label: 'Net 30' },
      ],
    },
    refreshCreditDaysOptions: mockRefreshCreditDaysOptions,
  }),
}))

vi.stubGlobal('useToast', () => ({ add: toastAdd }))

const UModalStub = {
  name: 'UModal',
  props: ['open'],
  emits: ['update:open'],
  watch: {
    open: {
      immediate: true,
      handler(this: { $emit: (event: string, value: boolean) => void }, value: boolean) {
        this.$emit('update:open', value)
      },
    },
  },
  template: `
    <div v-if="open" data-testid="vendor-form-modal">
      <slot name="header" />
      <slot name="body" />
    </div>
  `,
}

function mountVendorForm(props: Record<string, unknown> = {}) {
  return mount(VendorForm, {
    props: {
      modelValue: false,
      ...props,
    },
    global: {
      stubs: {
        UModal: UModalStub,
        UButton: UButtonStub,
        UInput: UInputStub,
        USelect: USelectStub,
        USwitch: {
          props: ['modelValue', 'disabled'],
          emits: ['update:modelValue'],
          template: '<input type="checkbox" :disabled="disabled" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        },
        UCard: { template: '<div class="card"><slot /></div>' },
        UIcon: true,
        UBadge: { template: '<span><slot /></span>' },
        CorporationSelect: {
          props: ['modelValue', 'disabled'],
          template: '<div data-testid="corporation-select" :data-value="modelValue" :data-disabled="String(disabled)" />',
        },
        CreditDaysSelect: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<div data-testid="credit-days-select" :data-credit-days-id="modelValue?.credit_days_id || \'\'" />',
        },
        CustomAccordion: {
          props: ['items'],
          template: `
            <div data-testid="accordion">
              <div v-for="item in items" :key="item.key" class="accordion-item">
                <slot name="trigger" :item="item" :is-open="true" />
                <slot name="content" :item="item" />
              </div>
            </div>
          `,
        },
        VendorsVendorAddressTable: {
          props: ['vendorId', 'vendorName'],
          template: '<div data-testid="vendor-address-table" :data-vendor-id="vendorId || \'\'" :data-vendor-name="vendorName" />',
        },
      },
    },
  })
}

async function openModalAndReset(wrapper: ReturnType<typeof mountVendorForm>) {
  await wrapper.setProps({ modelValue: false })
  mockEnsureReady.mockResolvedValue(undefined)
  mockRefreshCreditDaysOptions.mockResolvedValue(undefined)
  await wrapper.setProps({ modelValue: true })
  await nextTick()
  await nextTick()
}

describe('VendorForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    corpState.selectedCorporationId = 'corp-1'
    mockCreateNimbleVendor.mockReset()
    mockUpdateNimbleVendor.mockReset()
    mockEnsureReady.mockReset().mockResolvedValue(undefined)
    mockRefreshCreditDaysOptions.mockReset().mockResolvedValue(undefined)
    toastAdd.mockReset()
  })

  it('renders add vendor header in create mode', async () => {
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    expect(wrapper.text()).toContain('Add Vendor')
    expect(wrapper.text()).toContain('Vendor Profile')
    expect(wrapper.text()).toContain('Save & New')
  })

  it('renders edit vendor header when vendor prop is provided', async () => {
    const vendor = makeNimbleDbVendor({
      vendor_id: 'edit-1',
      name: 'Edit Me',
      federal_id: '98-7654321',
      corporation_id: 'CORP-UPPER',
    })
    const wrapper = await mountVendorForm({ vendor })
    await openModalAndReset(wrapper)

    expect(wrapper.text()).toContain('Edit Vendor')
    expect(wrapper.text()).not.toContain('Save & New')
    expect(wrapper.find('[data-testid="corporation-select"]').attributes('data-value')).toBe('CORP-UPPER')
  })

  it('loads credit days before populating edit form', async () => {
    const vendor = makeNimbleDbVendor({
      vendor_id: 'edit-cd',
      credit_days_id: 'CD-UPPER-ID',
    })
    const wrapper = await mountVendorForm({ vendor })
    await openModalAndReset(wrapper)

    expect(mockRefreshCreditDaysOptions).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="credit-days-select"]').attributes('data-credit-days-id')).toBe('cd-upper-id')
  })

  it('initializes create form from selected corporation on open', async () => {
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    expect(mockEnsureReady).toHaveBeenCalled()
    expect(mockRefreshCreditDaysOptions).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="corporation-select"]').attributes('data-value')).toBe('corp-1')
  })

  it('keeps save disabled until required fields are filled', async () => {
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const saveButton = wrapper.findAll('button').find(btn => btn.text().trim() === 'Save')
    expect(saveButton?.attributes('disabled')).toBeDefined()

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('New Vendor LLC')
    await inputs[1]!.setValue('11-2233445')
    await nextTick()

    expect(saveButton?.attributes('disabled')).toBeUndefined()
  })

  it('creates vendor with trimmed payload and shows success toast', async () => {
    const created = makeNimbleDbVendor({ vendor_id: 'created-1', name: 'New Vendor LLC' })
    mockCreateNimbleVendor.mockResolvedValue(created)

    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('  New Vendor LLC  ')
    await inputs[1]!.setValue(' 11-2233445 ')
    await inputs[2]!.setValue(' 123-45-6789 ')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(btn => btn.text().trim() === 'Save')
    await saveButton!.trigger('click')
    await nextTick()

    expect(mockCreateNimbleVendor).toHaveBeenCalledWith({
      corporation_id: 'corp-1',
      name: 'New Vendor LLC',
      federal_id: '11-2233445',
      ssn: '123-45-6789',
      credit_days_id: null,
      print_check_as: null,
      is_1099: false,
      status: 1,
    })
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vendor created', color: 'success' }))
    expect(wrapper.emitted('saved')?.[0]).toEqual([created])
  })

  it('save and new clears the form after create without closing modal', async () => {
    mockCreateNimbleVendor.mockResolvedValue(makeNimbleDbVendor({ vendor_id: 'created-2', name: 'Temp Vendor' }))
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('Temp Vendor')
    await inputs[1]!.setValue('11-2233445')
    await nextTick()

    const saveAndNewButton = wrapper.findAll('button').find(btn => btn.text().includes('Save & New'))
    await saveAndNewButton!.trigger('click')
    await nextTick()

    expect(mockCreateNimbleVendor).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="vendor-form-modal"]').exists()).toBe(true)
    expect(inputs[0]!.element.value).toBe('')
    expect(inputs[1]!.element.value).toBe('')
  })

  it('updates existing vendor and closes modal on save', async () => {
    const vendor = makeNimbleDbVendor({
      vendor_id: 'edit-2',
      name: 'Existing Vendor',
      federal_id: '11-1111111',
    })
    const updated = { ...vendor, name: 'Updated Vendor' }
    mockUpdateNimbleVendor.mockResolvedValue(updated)

    const wrapper = await mountVendorForm({ vendor })
    await openModalAndReset(wrapper)

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('Updated Vendor')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(btn => btn.text().trim() === 'Save')
    await saveButton!.trigger('click')
    await nextTick()

    expect(mockUpdateNimbleVendor).toHaveBeenCalledWith('edit-2', expect.objectContaining({
      name: 'Updated Vendor',
      federal_id: '11-1111111',
    }))
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vendor updated', color: 'success' }))
    expect(wrapper.emitted('saved')?.[0]).toEqual([updated])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('populates federal id from tax id when editing legacy vendor data', async () => {
    const vendor = makeNimbleDbVendor({
      vendor_id: 'legacy-1',
      federal_id: null,
      tax_id: '55-9988776',
    })
    const wrapper = await mountVendorForm({ vendor })
    await openModalAndReset(wrapper)

    const federalInput = wrapper.findAll('input')[1]
    expect(federalInput!.element.value).toBe('55-9988776')
  })

  it('passes vendor name to address table for new vendors', async () => {
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('Address Vendor')
    await nextTick()

    const addressTable = wrapper.find('[data-testid="vendor-address-table"]')
    expect(addressTable.attributes('data-vendor-name')).toBe('Address Vendor')
    expect(addressTable.attributes('data-vendor-id')).toBe('')
  })

  it('passes vendor id and name to address table when editing', async () => {
    const vendor = makeNimbleDbVendor({ vendor_id: 'addr-1', name: 'Addressed Vendor' })
    const wrapper = await mountVendorForm({ vendor })
    await openModalAndReset(wrapper)

    const addressTable = wrapper.find('[data-testid="vendor-address-table"]')
    expect(addressTable.attributes('data-vendor-id')).toBe('addr-1')
    expect(addressTable.attributes('data-vendor-name')).toBe('Addressed Vendor')
  })

  it('shows error toast when save fails', async () => {
    mockCreateNimbleVendor.mockRejectedValue({ statusMessage: 'Duplicate vendor name' })
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue('Duplicate Vendor')
    await inputs[1]!.setValue('11-2233445')
    await nextTick()

    const saveButton = wrapper.findAll('button').find(btn => btn.text().trim() === 'Save')
    await saveButton!.trigger('click')
    await nextTick()

    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Save failed',
      description: 'Duplicate vendor name',
      color: 'error',
    }))
  })

  it('closes modal when cancel is clicked', async () => {
    const wrapper = await mountVendorForm()
    await openModalAndReset(wrapper)

    const cancelButton = wrapper.findAll('button').find(btn => btn.text().trim() === 'Cancel')
    await cancelButton!.trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
