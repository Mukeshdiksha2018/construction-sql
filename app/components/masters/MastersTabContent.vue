<template>
  <MastersFreight v-if="tab === 'freight'" />
  <MastersApprovalChecks v-else-if="tab === 'approval-checks'" />
  <MastersPOInstruction v-else-if="tab === 'po-instruction'" />
  <MastersLocation v-else-if="tab === 'location'" />
  <MastersReason v-else-if="tab === 'reason'" />
  <MastersCreditDays v-else-if="tab === 'credit-days'" />
  <p v-else class="text-muted text-sm">
    No master screen available for this menu.
  </p>
</template>

<script setup lang="ts">
import MastersFreight from '~/components/masters/Freight.vue'
import MastersApprovalChecks from '~/components/masters/ApprovalChecks.vue'
import MastersPOInstruction from '~/components/masters/POInstruction.vue'
import MastersLocation from '~/components/masters/Location.vue'
import MastersReason from '~/components/masters/Reason.vue'
import MastersCreditDays from '~/components/masters/CreditDays.vue'

defineProps<{
  tab: string
}>()
</script>
