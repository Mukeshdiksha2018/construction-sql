<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-default mb-1">
          Item Category <span class="text-red-500">*</span>
        </label>
        <SharedItemCategorySelect
          v-model="form.category"
          placeholder="Select category"
          size="sm"
          class="w-full"
          :disabled="disabled"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-default mb-1">
          Spec Type <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="form.spec_type"
          placeholder="Enter spec type"
          size="sm"
          class="w-full"
          :disabled="disabled"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-default mb-1">
          Item Type <span class="text-red-500">*</span>
        </label>
        <UInput
          v-model="form.item_type"
          placeholder="Enter item type name"
          size="sm"
          class="w-full"
          :disabled="disabled"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-default mb-1">
          Description
        </label>
        <UTextarea
          v-model="form.description"
          placeholder="Enter description"
          size="sm"
          class="w-full"
          :rows="3"
          :disabled="disabled"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-default mb-1">
        Active
      </label>
      <UCheckbox
        v-model="form.is_active"
        label="Active"
        class="text-sm"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  form: {
    category: string
    spec_type: string
    item_type: string
    description: string
    is_active: boolean
  }
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})
</script>
