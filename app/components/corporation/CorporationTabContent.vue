<template>
  <LayoutPlaceholder
    :title="title"
    :description="description"
  />
</template>

<script setup lang="ts">
import type { CorporationTabName } from '~/composables/useTabRouting'

const props = defineProps<{
  tab: string
}>()

const TAB_COPY: Record<CorporationTabName, { title: string, description: string }> = {
  'manage-corporation': {
    title: 'Manage Corporation',
    description: 'Create and maintain corporation profiles, settings, and defaults.',
  },
  'profit-center': {
    title: 'Profit Center',
    description: 'Configure profit centers for financial reporting and project allocation.',
  },
  'chart-of-accounts': {
    title: 'Chart of Accounts',
    description: 'Manage the general ledger chart of accounts for the selected corporation.',
  },
  'locking-unlocking': {
    title: 'Locking/Unlocking',
    description: 'Control accounting period locks and unlock periods for posting.',
  },
  'bank-details': {
    title: 'Bank Details',
    description: 'Maintain corporation bank accounts used for payments and reconciliation.',
  },
  'digital-signature': {
    title: 'Digital Signature',
    description: 'Upload and manage digital signatures for checks and documents.',
  },
}

const title = computed(() => {
  const copy = TAB_COPY[props.tab as CorporationTabName]
  return copy?.title ?? 'Corporation'
})

const description = computed(() => {
  const copy = TAB_COPY[props.tab as CorporationTabName]
  return copy?.description ?? 'This screen is not available yet.'
})
</script>
