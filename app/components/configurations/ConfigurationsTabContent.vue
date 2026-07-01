<template>
  <ConfigurationsProjectTypes v-if="tab === 'project-types'" />
  <ConfigurationsServiceTypes v-else-if="tab === 'service-types'" />
  <ConfigurationsTermsAndConditions v-else-if="tab === 'terms-and-conditions'" />
  <ConfigurationsSpecialInstructions v-else-if="tab === 'special-instructions'" />
  <p v-else class="text-muted text-sm">
    No configuration screen available for this menu.
  </p>
</template>

<script setup lang="ts">
import ConfigurationsProjectTypes from '~/components/configurations/ProjectTypes.vue'
import ConfigurationsServiceTypes from '~/components/configurations/ServiceTypes.vue'
import ConfigurationsTermsAndConditions from '~/components/configurations/TermsAndConditions.vue'
import ConfigurationsSpecialInstructions from '~/components/configurations/SpecialInstructions.vue'

defineProps<{
  tab: string
}>()
</script>
