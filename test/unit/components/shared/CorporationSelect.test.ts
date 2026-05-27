import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import { useCorporationStore } from '~/stores/corporations'
import { makeCorporation } from '../../../helpers/corporations'

const USelectMenuStub = {
  name: 'USelectMenu',
  props: [
    'modelValue',
    'items',
    'disabled',
    'loading',
    'placeholder',
    'searchable',
    'size',
    'class',
    'valueKey',
    'ui',
    'filterFields',
    'searchablePlaceholder',
  ],
  emits: ['update:modelValue'],
  template: `
    <div
      data-testid="corporation-select"
      :data-disabled="disabled"
      :data-loading="loading"
      :data-item-count="items?.length ?? 0"
    >
      <slot />
      <button
        type="button"
        data-testid="select-first"
        @click="$emit('update:modelValue', items?.[0])"
      >
        select
      </button>
    </div>
  `,
}

const UIconStub = { template: '<span />' }

describe('CorporationSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountSelect(props: Record<string, unknown> = {}) {
    return mount(CorporationSelect, {
      props: {
        modelValue: null,
        ...props,
      },
      global: {
        stubs: {
          USelectMenu: USelectMenuStub,
          UIcon: UIconStub,
        },
      },
    })
  }

  it('disables the select when the store has no corporations', () => {
    const wrapper = mountSelect()
    const select = wrapper.get('[data-testid="corporation-select"]')

    expect(select.attributes('data-disabled')).toBe('true')
    expect(select.attributes('data-item-count')).toBe('0')
    expect(wrapper.text()).toContain('No corporations accessible')
  })

  it('lists corporations from the store as select items', () => {
    const store = useCorporationStore()
    store.corporations = [
      makeCorporation({ id: 'a', name: 'Alpha', legalName: 'Alpha Legal' }),
      makeCorporation({ id: 'b', name: 'Beta', legalName: 'Beta' }),
    ]

    const wrapper = mountSelect()
    const select = wrapper.get('[data-testid="corporation-select"]')

    expect(select.attributes('data-disabled')).toBe('false')
    expect(select.attributes('data-item-count')).toBe('2')
  })

  it('emits update:modelValue and change when a corporation is selected', async () => {
    const store = useCorporationStore()
    const corp = makeCorporation({ id: 'pick-me', name: 'Pick Me' })
    store.corporations = [corp]

    const wrapper = mountSelect()
    await wrapper.get('[data-testid="select-first"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['pick-me'])
    expect(wrapper.emitted('change')?.[0]?.[0]).toMatchObject({
      value: 'pick-me',
      corporation_name: 'Pick Me',
    })
  })

  it('syncs display when modelValue is set externally', async () => {
    const store = useCorporationStore()
    store.corporations = [
      makeCorporation({ id: 'ext', name: 'External', legalName: 'External Legal' }),
    ]

    const wrapper = mountSelect({ modelValue: 'ext' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('External')
    expect(wrapper.text()).toContain('External Legal')
  })

  it('respects disabled prop even when corporations exist', () => {
    const store = useCorporationStore()
    store.corporations = [makeCorporation()]

    const wrapper = mountSelect({ disabled: true })
    expect(wrapper.get('[data-testid="corporation-select"]').attributes('data-disabled')).toBe('true')
  })

  it('shows loading state from the store', () => {
    const store = useCorporationStore()
    store.corporations = [makeCorporation()]
    store.loading = true

    const wrapper = mountSelect()
    expect(wrapper.get('[data-testid="corporation-select"]').attributes('data-loading')).toBe('true')
  })
})
