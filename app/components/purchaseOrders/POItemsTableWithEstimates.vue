<template>
  <div class="rounded-xl border border-default bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-default/70 bg-gray-50 dark:bg-gray-800">
      <div>
        <h3 class="text-sm font-semibold text-default uppercase tracking-wide">
          {{ title }}
        </h3>
        <p v-if="description" class="text-xs text-muted mt-1">
          {{ description }}
        </p>
      </div>
      <div v-if="hasItems" class="flex items-center gap-3 ml-auto">
        <UButton
          v-if="showEditSelection"
          color="neutral"
          variant="solid"
          size="xs"
          icon="tdesign:edit-filled"
          @click="handleEditSelection"
        >
          Edit Selection
        </UButton>
        <span class="text-[11px] font-medium text-muted uppercase tracking-wide">
          {{ items.length }} items
        </span>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>

    <div v-else-if="loading" class="px-4 py-6 text-sm text-muted text-center">
      {{ loadingMessage }}
    </div>

    <div v-else-if="hasItems" :key="`items-${items.length}-${items.map(i => i.id).join('-')}`">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-1/12 px-2 py-2 text-left">Cost Code</th>
              <th class="w-1/12 px-4 py-2 text-left">Category / Location</th>
              <th class="w-1/12 px-4 py-2 text-left">Item Type</th>
              <th :class="[itemColumnWidthClass, 'px-4 py-2 text-left']">SPEC / Item</th>
              <th class="w-1/12 px-4 py-2 text-left">Description</th>
              <th v-if="!hideApprovalChecks" class="w-1/12 px-4 py-2 text-left">
                <div class="flex items-center gap-1">
                  <span>Approval Checks</span>
                  <UButton
                    v-if="!props.readonly"
                    icon="i-heroicons-plus"
                    size="xs"
                    color="primary"
                    variant="solid"
                    class="rounded-full !p-1"
                    @click.stop="openQuickAddApprovalCheck"
                  />
                </div>
              </th>
              <th class="w-1/12 px-4 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <span>UOM</span>
                  <UOMSelect
                    add-only
                    :show-add-button="!arePOFieldsDisabled"
                    :corporation-uuid="corporationUuid"
                    size="xs"
                    class="w-auto"
                    :disabled="arePOFieldsDisabled"
                  />
                </div>
              </th>
              <th class="w-4/12 px-4 py-2 text-right">{{ unitPriceColumnHeader }}</th>
              <th v-if="showInvoiceValues" class="w-1/12 px-4 py-2 text-center">To Be Invoiced</th>
              <th v-if="false && showEstimateValues" class="w-1/12 px-4 py-2 text-right">Available Qty</th>
              <th class="w-3/12 px-4 py-2 text-right">Qty</th>
              <th class="w-2/12 px-4 py-2 text-right">{{ totalColumnHeader }}</th>
              <th v-if="showActionsColumn" class="w-1/12 px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(item, index) in items"
              :key="item.id"
              :class="[
                'align-middle transition-colors duration-150',
                activeRowIndex === index ? 'bg-primary-50/40 dark:bg-primary-900/20' : '',
                isOverInvoiced(item, index) ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500' : '',
                isQuantityExceeded(item, index) ? 'bg-warning-50/50 dark:bg-warning-900/20 border-l-4 border-warning-500' : ''
              ]"
            >
              <td class="px-2 py-2 align-middle w-1/12">
                <div class="flex flex-col gap-2 min-w-0">
                  <div :class="{ 'pointer-events-none': arePOFieldsDisabled }">
                    <CostCodeSelect
                      :model-value="item.cost_code_uuid ?? undefined"
                      :label="item.cost_code_label"
                      size="xs"
                      class="w-full min-w-0 text-left"
                      :corporation-uuid="corporationUuid"
                      :external-configurations="scopedCostCodeConfigurations"
                      :disabled="arePOFieldsDisabled"
                      @update:model-value="(value) => emitCostCodeChange(index, value as string | undefined)"
                      @change="(option) =>
                        emitCostCodeChange(
                          index,
                          (option?.costCode?.uuid || option?.value || option?.uuid) as string | undefined,
                          option
                        )"
                    >
                      <template #default="slotProps">
                        <div class="flex flex-col text-left min-w-0">
                          <span class="text-xs font-medium text-default whitespace-normal break-words">
                            {{ slotProps.option?.label || slotProps.selectedLabel || 'Select cost code' }}
                          </span>
                          <span
                            v-if="slotProps.option?.hint"
                            class="text-[11px] text-muted uppercase tracking-wide whitespace-normal break-words"
                          >
                            {{ slotProps.option.hint }}
                          </span>
                        </div>
                      </template>
                    </CostCodeSelect>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 align-middle w-1/12">
                <div class="flex flex-col gap-1 min-w-0">
                  <ItemCategorySelect
                    :model-value="item.category ?? undefined"
                    placeholder="Select category"
                    size="xs"
                    class="w-full"
                    :disabled="arePOFieldsDisabled"
                    @update:model-value="(value) => emitCategoryChange(index, value as string | undefined)"
                  />
                  <LocationSelect
                    v-if="!hideLocation"
                    :model-value="item.location_uuid ?? undefined"
                    :locations="scopedLocationsWithSelected"
                    size="xs"
                    class-name="w-full"
                    :disabled="props.readonly"
                    @update:model-value="(value) => emitLocationChange(index, value as string | undefined)"
                    @change="(option) => emitLocationChange(index, option?.value as string | undefined, option)"
                  />
                </div>
              </td>
              <td :class="['px-2 py-2 align-middle', itemColumnWidthClass]">
                <div class="flex flex-col gap-2 min-w-0">
                  <ItemTypeSelect
                    :key="`item-type-${index}-${item.category}-${item.item_division_uuid}`"
                    :model-value="item.item_type_uuid ?? undefined"
                    size="xs"
                    class="w-full min-w-0 text-left"
                    :corporation-uuid="corporationUuid"
                    :project-uuid="projectUuid"
                    :external-item-types="scopedItemTypes"
                    :category="item.category || undefined"
                    :item-division-uuid="item.item_division_uuid || undefined"
                    :disabled="arePOFieldsDisabled"
                    variant="outline"
                    :ui="{
                      trigger: 'flex w-full justify-between gap-2 text-left',
                      content: 'max-h-60 min-w-full w-max'
                    }"
                    @update:model-value="(value) => emitItemTypeChange(index, value as string | undefined)"
                    @change="(option) => emitItemTypeChange(index, option?.value ?? option?.uuid, option)"
                  >
                    <template #default>
                      <span
                        class="flex-1 whitespace-normal text-left"
                        :class="{ 'text-muted': !item.item_type_uuid }"
                      >
                        {{ getItemTypeDisplayLabel(item) }}
                      </span>
                    </template>
                    <template #trailing="{ open }">
                      <UIcon
                        name="i-heroicons-chevron-down-20-solid"
                        class="transition-transform duration-200"
                        :class="{ 'rotate-180': open }"
                      />
                    </template>
                  </ItemTypeSelect>
                </div>
              </td>
              <td :class="['px-2 py-2 align-middle', itemColumnWidthClass]">
                <div class="flex flex-col gap-1 min-w-0">
                  <SequenceSelect
                    :model-value="item.item_uuid ?? undefined"
                    size="xs"
                    class="w-full min-w-0 text-left"
                    :items="item.options"
                    :disabled="arePOFieldsDisabled"
                    @change="(payload) => emitSequenceChange(index, payload?.value as string | undefined, payload?.option)"
                  />
                  <ItemSelect
                    :model-value="item.item_uuid ?? undefined"
                    size="xs"
                    class="w-full min-w-0 text-left"
                    placeholder="Select item"
                    :items="item.options"
                    :disabled="arePOFieldsDisabled"
                    @change="(payload) => emitItemChange(index, payload?.value ?? null, payload?.option)"
                  />
                </div>
              </td>
              <td class="px-2 py-2 align-middle w-1/12">
                <div
                  v-if="arePOFieldsDisabled"
                  class="w-full min-h-[52px] max-h-20 overflow-y-auto rounded-md border border-default px-2 py-1 text-xs text-muted bg-default"
                >
                  <div
                    class="prose prose-xs dark:prose-invert max-w-none [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                    v-html="getDescriptionPreviewHtml(item.description)"
                  />
                </div>
                <UPopover
                  v-else
                  :open="activeDescriptionCellKey === `desktop-${index}`"
                  :content="{ side: 'top', align: 'start' }"
                  :ui="{ content: 'w-[620px] p-3 bg-white dark:bg-gray-900 border border-default' }"
                  @update:open="(open) => {
                    if (open) openDescriptionEditor(index, item.description, 'desktop')
                    else closeDescriptionEditor()
                  }"
                >
                  <div
                    class="w-full min-h-[52px] max-h-20 overflow-y-auto rounded-md border border-default px-2 py-1 text-xs text-muted cursor-text bg-default"
                    @click="openDescriptionEditor(index, item.description, 'desktop')"
                  >
                    <div
                      class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                      v-html="getDescriptionPreviewHtml(item.description)"
                    />
                  </div>
                  <template #content>
                    <div class="space-y-3">
                      <div class="text-xs font-medium text-muted">Edit Description</div>
                      <div class="border border-default rounded-md bg-white dark:bg-gray-900">
                        <div class="border-b border-default p-2 flex flex-wrap gap-1">
                          <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBold().run()" />
                          <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleItalic().run()" />
                          <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBulletList().run()" />
                          <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleOrderedList().run()" />
                        </div>
                        <div class="p-3 min-h-[170px] max-h-[280px] overflow-y-auto">
                          <EditorContent :editor="descriptionEditor" />
                        </div>
                      </div>
                      <div class="flex justify-end">
                        <UButton size="xs" color="primary" label="Done" @click="closeDescriptionEditor" />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </td>
              <td v-if="!hideApprovalChecks" class="px-2 py-2 align-middle w-1/12">
                <ApprovalChecksSelect
                  :model-value="item.approval_checks ?? []"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emitApprovalChecksChange(index, value, item.raw)"
                  @change="(options) => emitApprovalChecksChange(index, options.map(opt => opt.value), item.raw)"
                />
              </td>
              <td class="px-2 py-2 align-middle">
                <UOMSelect
                  :model-value="uomSelectModelValue(item)"
                  :corporation-uuid="corporationUuid"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :disabled="arePOFieldsDisabled"
                  @update:model-value="(value) => emitUomChange(index, value as string | undefined)"
                  @change="(opt) => emitUomChange(index, opt?.value ?? null, opt)"
                />
              </td>
              <td class="px-2 py-2 text-right align-middle w-4/12">
                <div class="flex flex-col items-end gap-1">
                  <div v-if="showEstimateValues" class="w-full max-w-[260px]">
                    <div class="grid grid-cols-[auto_auto] items-center justify-end gap-0 rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 po-estimate-value">
                      <span class="text-xs font-semibold text-default">{{ currencySymbolText }}</span>
                      <span class="font-mono text-sm leading-none tracking-tight">
                        {{ formatCurrencyInput(item.unit_price) }}
                      </span>
                    </div>
                  </div>
                  <!-- PO Unit Price (greyed out when showInvoiceValues is true) -->
                  <div v-if="showInvoiceValues" class="w-full max-w-[260px]">
                    <div class="grid grid-cols-[auto_auto] items-center justify-end gap-0 rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 po-estimate-value">
                      <span class="text-xs font-semibold text-muted">{{ currencySymbolText }}</span>
                      <span class="font-mono text-sm leading-none tracking-tight text-muted">
                        {{ formatCurrencyInput(item.po_unit_price) }}
                      </span>
                    </div>
                  </div>
                  <!-- Editable PO Unit Price (when showInvoiceValues is false) or Invoice Unit Price (when showInvoiceValues is true) -->
                  <div class="w-full max-w-[260px]">
                    <div class="flex items-center justify-end gap-1">
                      <span class="text-xs font-semibold text-default">
                        {{ currencySymbolText }}
                      </span>
                      <UInput
                        v-if="!showInvoiceValues"
                        :model-value="getPoUnitPriceInputValue(item, index)"
                        placeholder="0"
                        :disabled="props.readonly"
                        size="xs"
                        inputmode="decimal"
                        class="w-full text-right font-mono"
                        :ui="{ base: 'text-right font-mono' }"
                        @keydown="preventUnitPriceKeydown"
                        @paste="preventUnitPricePaste"
                        @focus="setActiveRow(index)"
                        @blur="clearActiveRow(index)"
                        @update:model-value="(value) => emitPoUnitPriceChange(index, value ?? '')"
                      />
                      <UInput
                        v-else
                        :model-value="getInvoiceUnitPriceInputValue(item, index)"
                        placeholder="0"
                        :disabled="props.readonly"
                        size="xs"
                        inputmode="decimal"
                        class="w-full text-right font-mono"
                        :ui="{ base: 'text-right font-mono' }"
                        @keydown="preventUnitPriceKeydown"
                        @paste="preventUnitPricePaste"
                        @focus="setActiveRow(index)"
                        @blur="clearActiveRow(index)"
                        @update:model-value="(value) => emitInvoiceUnitPriceChange(index, value ?? '')"
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td v-if="showInvoiceValues" class="px-2 py-2 text-center align-middle">
                <div class="flex items-center justify-center">
                  <span class="font-mono text-sm text-default">{{ formatQuantity(item.to_be_invoiced ?? 0) }}</span>
                </div>
              </td>
              <td v-if="false && showEstimateValues" class="px-2 py-2 text-right align-middle">
                <div class="flex flex-col items-end gap-1">
                  <UInput
                    :model-value="formatQuantity(getAvailableQuantity(item, index))"
                    size="xs"
                    class="w-full max-w-[180px] text-right font-mono"
                    :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent' }"
                    disabled
                  />
                </div>
              </td>
              <td class="px-2 py-2 text-right align-middle w-3/12 min-w-[120px]">
                <div class="flex flex-col items-end gap-1">
                  <UInput
                    v-if="showEstimateValues"
                    :model-value="formatQuantity(item.quantity)"
                    size="xs"
                    class="w-full text-center font-mono"
                    :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent text-center' }"
                    disabled
                  />
                  <!-- PO Quantity (greyed out when showInvoiceValues is true) -->
                  <UInput
                    v-if="showInvoiceValues"
                    :model-value="formatQuantity(item.po_quantity)"
                    size="xs"
                    class="w-full text-center font-mono"
                    :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent text-center' }"
                    disabled
                  />
                  <!-- Editable PO Quantity (when showInvoiceValues is false) or Invoice Quantity (when showInvoiceValues is true) -->
                  <div class="flex flex-col items-end gap-0.5 w-full">
                    <UInput
                      v-if="!showInvoiceValues"
                      :model-value="getPoQuantityInputValue(item, index)"
                      placeholder="0"
                      size="xs"
                      inputmode="decimal"
                      class="w-full text-right font-mono"
                      :disabled="props.readonly"
                      @keydown="preventNonNumericKeydown"
                      @paste="preventNonNumericPaste"
                      @focus="setActiveRow(index)"
                      @blur="clearActiveRow(index)"
                      @update:model-value="(value) => emitPoQuantityChange(index, value)"
                    />
                    <UInputNumber
                      v-else
                      :model-value="getNumericValueForInput(invoiceDrafts[index]?.quantityInput, (item.invoice_quantity !== null && item.invoice_quantity !== undefined) ? item.invoice_quantity : null)"
                      placeholder="0"
                      size="xs"
                      class="w-full text-right font-mono"
                      :disabled="props.readonly"
                      :ui="{ 
                        base: 'text-right font-mono',
                        increment: 'hidden',
                        decrement: 'hidden'
                      }"
                      @focus="setActiveRow(index)"
                      @blur="clearActiveRow(index)"
                      @update:model-value="(value) => emitInvoiceQuantityChange(index, value !== null && value !== undefined ? String(value) : '')"
                    />
                    <!-- Visual indicator showing remaining available quantity -->
                    <div
                      v-if="showEstimateValues && !showInvoiceValues && !props.readonly"
                      class="w-full text-[10px] font-medium transition-colors duration-150"
                      :class="getRemainingQuantityClass(item, index)"
                    >
                      <span v-if="getRemainingQuantity(item, index) >= 0">
                        Remaining: {{ formatQuantity(getRemainingQuantity(item, index)) }}
                      </span>
                      <span v-else class="text-error-600 dark:text-error-400">
                        Over by: {{ formatQuantity(Math.abs(getRemainingQuantity(item, index))) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right align-middle w-2/12">
                <div class="flex flex-col items-end gap-1">
                  <div v-if="showEstimateValues" class="w-full max-w-[180px]">
                    <div class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 text-right">
                      <span class="font-mono text-sm leading-none tracking-tight">
                        {{ formatCurrency(item.total) }}
                      </span>
                    </div>
                  </div>
                  <!-- PO Total (greyed out when showInvoiceValues is true) -->
                  <div v-if="showInvoiceValues" class="w-full max-w-[180px]">
                    <div class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 text-right">
                      <span class="font-mono text-sm leading-none tracking-tight text-muted">
                        {{ formatCurrency(computePoTotal(item, index)) }}
                      </span>
                    </div>
                  </div>
                  <!-- Editable PO Total (when showInvoiceValues is false) or Invoice Total (when showInvoiceValues is true) -->
                  <div class="w-full max-w-[180px]">
                    <div class="po-total-display rounded-md border border-transparent bg-background dark:bg-gray-900/60 px-3 py-1.5 text-right">
                      <span class="font-mono text-sm leading-none tracking-tight">
                        {{ showInvoiceValues ? formatCurrency(computeInvoiceTotal(item, index)) : formatCurrency(computePoTotal(item, index)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td v-if="showActionsColumn" class="px-2 py-2 text-right align-middle">
                <slot name="actions" :item="item" :index="index">
                  <div class="flex justify-end gap-2">
                    <UButton
                      icon="i-heroicons-plus"
                      variant="soft"
                      color="neutral"
                      size="xs"
                      class="shrink-0"
                      @click.stop="handleAddRow(index)"
                    />
                    <UButton
                      icon="i-heroicons-minus"
                      variant="soft"
                      color="error"
                      size="xs"
                      class="shrink-0"
                      @click.stop="handleRemoveRow(index)"
                    />
                  </div>
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden divide-y divide-default/60">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          :class="[
            'px-4 py-4 space-y-3 transition-colors duration-150',
            activeRowIndex === index ? 'bg-primary-50/30 dark:bg-primary-900/10' : '',
            isQuantityExceeded(item, index) ? 'bg-warning-50/50 dark:bg-warning-900/20 border-l-4 border-warning-500' : ''
          ]"
        >
          <div class="col-span-2 space-y-2">
            <span class="text-xs uppercase tracking-wide text-muted/80">Cost Code</span>
            <div :class="{ 'pointer-events-none': arePOFieldsDisabled }">
              <CostCodeSelect
                :model-value="item.cost_code_uuid ?? undefined"
                :label="item.cost_code_label"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="corporationUuid"
                :external-configurations="scopedCostCodeConfigurations"
                :disabled="arePOFieldsDisabled"
                @update:model-value="(value) => emitCostCodeChange(index, value as string | undefined)"
                @change="(option) => emitCostCodeChange(index, option?.uuid, option)"
              >
              </CostCodeSelect>
            </div>
            <div v-if="item.cost_code_number && item.cost_code_name" class="text-[11px] text-muted uppercase tracking-wide">
              {{ item.cost_code_number }} · {{ item.cost_code_name }}
            </div>
          </div>
          <div class="space-y-2">
            <span class="block text-[11px] uppercase tracking-wide text-muted/80">Category / Location</span>
            <div class="flex flex-col gap-2 min-w-0">
              <ItemCategorySelect
                :model-value="item.category ?? undefined"
                placeholder="Select category"
                size="xs"
                class="w-full"
                :disabled="arePOFieldsDisabled"
                @update:model-value="(value) => emitCategoryChange(index, value as string | undefined)"
              />
              <LocationSelect
                v-if="!hideLocation"
                :model-value="item.location_uuid ?? undefined"
                :locations="scopedLocationsWithSelected"
                size="xs"
                class-name="w-full text-left"
                :disabled="props.readonly"
                @update:model-value="(value) => emitLocationChange(index, value as string | undefined)"
                @change="(opt) => emitLocationChange(index, opt?.value, opt)"
              />
              <div v-if="!hideLocation && item.location" class="text-[11px] text-muted uppercase tracking-wide">
                {{ item.location }}
              </div>
            </div>
          </div>

            <div class="grid grid-cols-2 gap-3 text-xs text-default">
            <div class="col-span-2">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Item Type</span>
              <ItemTypeSelect
                :key="`item-type-mobile-${index}-${item.category}-${item.item_division_uuid}`"
                :model-value="item.item_type_uuid ?? undefined"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="corporationUuid"
                :project-uuid="projectUuid"
                :external-item-types="scopedItemTypes"
                :category="item.category || undefined"
                :item-division-uuid="item.item_division_uuid || undefined"
                :disabled="arePOFieldsDisabled"
                variant="outline"
                :ui="{
                  trigger: 'flex w-full justify-between gap-2 text-left',
                  content: 'max-h-60 min-w-full w-max',
                  item: {
                    base: 'whitespace-normal break-words',
                    label: 'whitespace-normal break-words text-left'
                  }
                }"
                @update:model-value="(value) => emitItemTypeChange(index, value as string | undefined)"
                @change="(option) => emitItemTypeChange(index, option?.value ?? option?.uuid, option)"
              >
                <template #default>
                  <span
                    class="flex-1 whitespace-normal text-left"
                    :class="{ 'text-muted': !item.item_type_uuid }"
                  >
                    {{ getItemTypeDisplayLabel(item) }}
                  </span>
                </template>
                <template #trailing="{ open }">
                  <UIcon
                    name="i-heroicons-chevron-down-20-solid"
                    class="transition-transform duration-200"
                    :class="{ 'rotate-180': open }"
                  />
                </template>
              </ItemTypeSelect>
            </div>
            <div class="col-span-2 space-y-2">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">SPEC / Item</span>
              <div class="flex flex-col gap-2 min-w-0">
                <SequenceSelect
                  :model-value="item.item_uuid ?? undefined"
                  size="xs"
                  class="w-full text-left"
                  :items="item.options"
                  :disabled="arePOFieldsDisabled"
                  @change="(payload) => emitSequenceChange(index, payload?.value as string | undefined, payload?.option)"
                />
                <ItemSelect
                  :model-value="item.item_uuid ?? undefined"
                  size="xs"
                  class="w-full text-left"
                  placeholder="Select item"
                  :items="item.options"
                  :disabled="arePOFieldsDisabled"
                  @change="(payload) => emitItemChange(index, payload?.value ?? null, payload?.option)"
                />
              </div>
            </div>
            <div v-if="!hideApprovalChecks" class="col-span-2 space-y-1">
              <div class="flex items-center gap-1">
                <span class="block text-[11px] uppercase tracking-wide text-muted/80">Approval Checks</span>
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  @click.stop="openQuickAddApprovalCheck"
                />
              </div>
              <ApprovalChecksSelect
                :model-value="item.approval_checks ?? []"
                size="xs"
                class="w-full text-left"
                :disabled="props.readonly"
                @update:model-value="(value) => emitApprovalChecksChange(index, value, item.raw)"
                @change="(options) => emitApprovalChecksChange(index, options.map(opt => opt.value), item.raw)"
              />
            </div>
            <div class="col-span-2">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Description</span>
              <div
                v-if="arePOFieldsDisabled"
                class="w-full min-h-[52px] max-h-20 overflow-y-auto rounded-md border border-default px-2 py-1 text-xs text-muted bg-default"
              >
                <div
                  class="prose prose-xs dark:prose-invert max-w-none [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                  v-html="getDescriptionPreviewHtml(item.description)"
                />
              </div>
              <UPopover
                v-else
                :open="activeDescriptionCellKey === `mobile-${index}`"
                :content="{ side: 'top', align: 'start' }"
                :ui="{ content: 'w-[620px] p-3 bg-white dark:bg-gray-900 border border-default' }"
                @update:open="(open) => {
                  if (open) openDescriptionEditor(index, item.description, 'mobile')
                  else closeDescriptionEditor()
                }"
              >
                <div
                  class="w-full min-h-[52px] max-h-20 overflow-y-auto rounded-md border border-default px-2 py-1 text-xs text-muted cursor-text bg-default"
                  @click="openDescriptionEditor(index, item.description, 'mobile')"
                >
                  <div
                    class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                    v-html="getDescriptionPreviewHtml(item.description)"
                  />
                </div>
                <template #content>
                  <div class="space-y-3">
                    <div class="text-xs font-medium text-muted">Edit Description</div>
                    <div class="border border-default rounded-md bg-white dark:bg-gray-900">
                      <div class="border-b border-default p-2 flex flex-wrap gap-1">
                        <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBold().run()" />
                        <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleItalic().run()" />
                        <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBulletList().run()" />
                        <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleOrderedList().run()" />
                      </div>
                      <div class="p-3 min-h-[170px] max-h-[280px] overflow-y-auto">
                        <EditorContent :editor="descriptionEditor" />
                      </div>
                    </div>
                    <div class="flex justify-end">
                      <UButton size="xs" color="primary" label="Done" @click="closeDescriptionEditor" />
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">UOM</span>
              <UOMSelect
                :model-value="uomSelectModelValue(item)"
                :corporation-uuid="corporationUuid"
                size="xs"
                class="w-full text-left"
                :disabled="arePOFieldsDisabled"
                @update:model-value="(value) => emitUomChange(index, value as string | undefined)"
                @change="(opt) => emitUomChange(index, opt?.value ?? null, opt)"
              />
            </div>
            <div v-if="false && showEstimateValues" class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Available Qty</span>
              <UInput
                :model-value="formatQuantity(getAvailableQuantity(item, index))"
                size="xs"
                class="text-right font-mono"
                :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent' }"
                disabled
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Qty</span>
              <UInput
                v-if="showEstimateValues"
                :model-value="formatQuantity(item.quantity)"
                size="xs"
                class="text-center font-mono"
                :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent text-center' }"
                disabled
              />
              <!-- PO Quantity (greyed out when showInvoiceValues is true) -->
              <UInput
                v-if="showInvoiceValues"
                :model-value="formatQuantity(item.po_quantity)"
                size="xs"
                class="text-center font-mono"
                :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent text-center' }"
                disabled
              />
              <!-- Editable PO Quantity (when showInvoiceValues is false) or Invoice Quantity (when showInvoiceValues is true) -->
              <div class="flex flex-col gap-0.5">
                <UInput
                  v-if="!showInvoiceValues"
                  :model-value="getPoQuantityInputValue(item, index)"
                  placeholder="0"
                  size="xs"
                  inputmode="decimal"
                  class="text-right font-mono"
                  :disabled="props.readonly"
                  @keydown="preventNonNumericKeydown"
                  @paste="preventNonNumericPaste"
                  @focus="setActiveRow(index)"
                  @blur="clearActiveRow(index)"
                  @update:model-value="(value) => emitPoQuantityChange(index, value)"
                />
                <UInputNumber
                  v-else
                  :model-value="getNumericValueForInput(invoiceDrafts[index]?.quantityInput, (item.invoice_quantity !== null && item.invoice_quantity !== undefined) ? item.invoice_quantity : null)"
                  placeholder="0"
                  size="xs"
                  class="text-right font-mono"
                  :disabled="props.readonly"
                  :ui="{ 
                    base: 'text-right font-mono',
                    increment: 'hidden',
                    decrement: 'hidden'
                  }"
                  @focus="setActiveRow(index)"
                  @blur="clearActiveRow(index)"
                  @update:model-value="(value) => emitInvoiceQuantityChange(index, value !== null && value !== undefined ? String(value) : '')"
                />
                <!-- Visual indicator showing remaining available quantity -->
                <div
                  v-if="showEstimateValues && !showInvoiceValues && !props.readonly"
                  class="text-[10px] font-medium transition-colors duration-150"
                  :class="getRemainingQuantityClass(item, index)"
                >
                  <span v-if="getRemainingQuantity(item, index) >= 0">
                    Remaining: {{ formatQuantity(getRemainingQuantity(item, index)) }}
                  </span>
                  <span v-else class="text-error-600 dark:text-error-400">
                    Over by: {{ formatQuantity(Math.abs(getRemainingQuantity(item, index))) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Unit Price</span>
              <div
                v-if="showEstimateValues"
                class="grid grid-cols-[auto_auto] items-center justify-end gap-0 rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 po-estimate-value"
              >
                <span class="text-[11px] font-semibold text-default">{{ currencySymbolText }}</span>
                <span class="font-mono text-sm leading-none tracking-tight">
                  {{ formatCurrencyInput(item.unit_price) }}
                </span>
              </div>
              <!-- PO Unit Price (greyed out when showInvoiceValues is true) -->
              <div
                v-if="showInvoiceValues"
                class="grid grid-cols-[auto_auto] items-center justify-end gap-0 rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 po-estimate-value"
              >
                <span class="text-[11px] font-semibold text-muted">{{ currencySymbolText }}</span>
                <span class="font-mono text-sm leading-none tracking-tight text-muted">
                  {{ formatCurrencyInput(item.po_unit_price) }}
                </span>
              </div>
              <!-- Editable PO Unit Price (when showInvoiceValues is false) or Invoice Unit Price (when showInvoiceValues is true) -->
              <div class="flex items-center justify-end gap-1">
                <span class="text-[11px] font-semibold text-default">
                  {{ currencySymbolText }}
                </span>
                <UInput
                  v-if="!showInvoiceValues"
                  :model-value="getPoUnitPriceInputValue(item, index)"
                  placeholder="0"
                  :disabled="props.readonly"
                  size="xs"
                  inputmode="decimal"
                  class="w-full text-right font-mono"
                  :ui="{ base: 'text-right font-mono' }"
                  @keydown="preventUnitPriceKeydown"
                  @paste="preventUnitPricePaste"
                  @focus="setActiveRow(index)"
                  @blur="clearActiveRow(index)"
                  @update:model-value="(value) => emitPoUnitPriceChange(index, value ?? '')"
                />
                <UInput
                  v-else
                  :model-value="getInvoiceUnitPriceInputValue(item, index)"
                  placeholder="0"
                  :disabled="props.readonly"
                  size="xs"
                  inputmode="decimal"
                  class="w-full text-right font-mono"
                  :ui="{ base: 'text-right font-mono' }"
                  @keydown="preventNonNumericKeydown"
                  @paste="preventNonNumericPaste"
                  @focus="setActiveRow(index)"
                  @blur="clearActiveRow(index)"
                  @update:model-value="(value) => emitInvoiceUnitPriceChange(index, value ?? '')"
                />
              </div>
            </div>
            <div class="col-span-2 flex flex-col gap-1">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Total</span>
              <div
                v-if="showEstimateValues"
                class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 text-right"
              >
                <span class="font-mono text-sm leading-none tracking-tight">
                  {{ formatCurrency(item.total) }}
                </span>
              </div>
              <!-- PO Total (greyed out when showInvoiceValues is true) -->
              <div
                v-if="showInvoiceValues"
                class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 text-right"
              >
                <span class="font-mono text-sm leading-none tracking-tight text-muted">
                  {{ formatCurrency(computePoTotal(item, index)) }}
                </span>
              </div>
              <!-- Editable PO Total (when showInvoiceValues is false) or Invoice Total (when showInvoiceValues is true) -->
              <div class="po-total-display rounded-md border border-transparent bg-background dark:bg-gray-900/60 px-3 py-1.5 text-right">
                <span class="font-mono text-sm leading-none tracking-tight">
                  {{ showInvoiceValues ? formatCurrency(computeInvoiceTotal(item, index)) : formatCurrency(computePoTotal(item, index)) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!props.readonly" class="flex justify-end gap-2 pt-2">
            <slot name="actions" :item="item" :index="index">
              <UButton
                icon="i-heroicons-plus"
                variant="soft"
                color="neutral"
                size="xs"
                @click.stop="handleAddRow(index)"
              />
              <UButton
                icon="i-heroicons-minus"
                variant="soft"
                color="error"
                size="xs"
                @click.stop="handleRemoveRow(index)"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="px-4 py-6 text-sm text-muted text-center">
      {{ emptyMessage }}
    </div>

    <!-- Quick-add Approval Check Modal -->
    <UModal
      v-model:open="showQuickAddApprovalCheck"
      title="Add New Approval Check"
      description="Create a new approval check that will be available for selection."
      :ui="{
        content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
        body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto'
      }"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approval Check <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="quickApprovalCheckForm.approval_check"
              variant="subtle"
              placeholder="Enter approval check name"
              size="md"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <UTextarea
              v-model="quickApprovalCheckForm.description"
              variant="subtle"
              placeholder="Enter description"
              size="md"
              :rows="3"
              class="w-full"
            />
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <UCheckbox v-model="quickApprovalCheckForm.active" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Toggle to enable or disable this approval check</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeQuickAddApprovalCheck">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="saveQuickApprovalCheck"
            :loading="savingApprovalCheck"
            :disabled="!quickApprovalCheckForm.approval_check.trim()"
          >
            Save Approval Check
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, unref, reactive, ref, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import CostCodeSelect from '~/components/shared/CostCodeSelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import ItemSelect from '~/components/shared/ItemSelect.vue'
import SequenceSelect from '~/components/shared/SequenceSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import UOMSelect from '~/components/shared/UOMSelect.vue'
import ApprovalChecksSelect from '~/components/shared/ApprovalChecksSelect.vue'
import { useApprovalChecksStore } from '~/stores/approvalChecks'
import { formatPoAmountColumnHeader, type PoCurrencyCode } from '~/utils/poCurrencyConversion'

interface PurchaseOrderItemDisplay {
  id?: string | number
  name?: string
  description?: string
  item_uuid?: string | null
  cost_code_uuid?: string | null
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  division_name?: string
  category?: string | null
  item_division_uuid?: string | null
  item_type_uuid?: string | null
  item_type_label?: string
  sequence?: string
  model_number?: string
  location_uuid?: string | null
  unit?: string
  unit_uuid?: string | null
  unit_label?: string
  /** Display UOM text (e.g. direct invoice / preferred rows); UOMSelect also matches by short name when UUID is absent */
  uom?: string
  quantity?: number | string | null
  unit_price?: number | string | null
  total?: number | string | null
  location?: string
  approval_checks?: string[]
  po_unit_price?: string | number | null
  po_quantity?: string | number | null
  po_total?: string | number | null
  invoice_unit_price?: string | number | null
  invoice_quantity?: string | number | null
  invoice_total?: string | number | null
  to_be_invoiced?: string | number | null
  preferred_vendor_uuid?: string | null
  options?: Array<{
    label?: string
    value?: string
    short_name?: string
    description?: string
    unit?: string
    unit_price?: number | string | null
    [key: string]: any
  }>
  raw?: any
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  items: PurchaseOrderItemDisplay[]
  loading?: boolean
  error?: string | null
  loadingMessage?: string
  emptyMessage?: string
  corporationUuid?: string
  projectUuid?: string
  scopedItemTypes?: any[]
  scopedCostCodeConfigurations?: any[]
  scopedLocations?: any[]
  itemColumnWidthClass?: string
  showEstimateValues?: boolean
  showInvoiceValues?: boolean
  readonly?: boolean
  hideApprovalChecks?: boolean
  hideModelNumber?: boolean
  hideLocation?: boolean
  showEditSelection?: boolean
  usedQuantitiesByItem?: Record<string, number>
  estimateItems?: any[]
  poCurrencyConversionEnabled?: boolean
  poCurrencyFrom?: PoCurrencyCode
  poCurrencyTo?: PoCurrencyCode
  poConversionRate?: number
}>(), {
  title: 'PO Items',
  description: '',
  items: () => [],
  loading: false,
  error: null,
  loadingMessage: 'Loading items…',
  emptyMessage: 'No items found.',
  corporationUuid: undefined,
  projectUuid: undefined,
  scopedItemTypes: undefined,
  scopedCostCodeConfigurations: undefined,
  scopedLocations: undefined,
  itemColumnWidthClass: undefined,
  showEstimateValues: true,
  showInvoiceValues: false,
  readonly: false,
  hideApprovalChecks: false,
  hideModelNumber: false,
  hideLocation: false,
  showEditSelection: false,
  usedQuantitiesByItem: () => ({}),
  estimateItems: () => [],
  poCurrencyConversionEnabled: false,
  poCurrencyFrom: 'CAD',
  poCurrencyTo: 'USD',
  poConversionRate: 1,
})


const hasItems = computed(() => Array.isArray(props.items) && props.items.length > 0)
const corporationUuid = computed(() => props.corporationUuid)
const projectUuid = computed(() => props.projectUuid)
const showEstimateValues = computed(() => props.showEstimateValues !== false)
const showInvoiceValues = computed(() => props.showInvoiceValues === true)
const itemColumnWidthClass = computed(() => props.itemColumnWidthClass || 'w-1/12')

// Computed properties for scoped data to pass to child components
const scopedCostCodeConfigurations = computed(() => {
  return props.scopedCostCodeConfigurations || [];
});

const scopedItemTypes = computed(() => {
  return props.scopedItemTypes || [];
});
const scopedLocations = computed(() => props.scopedLocations || []);
const scopedLocationsWithSelected = computed(() => {
  const base = Array.isArray(scopedLocations.value) ? [...scopedLocations.value] : [];
  const existing = new Set(base.map((loc: any) => String(loc?.uuid || '').trim()).filter(Boolean));
  for (const item of props.items || []) {
    const uuid = String(item?.location_uuid || '').trim();
    if (!uuid || existing.has(uuid)) continue;
    base.push({
      uuid,
      location_name: item?.location || uuid,
    });
    existing.add(uuid);
  }
  return base;
});


// When showing invoice values, PO fields (cost code, item type, sequence, item name, description) should be readonly
const arePOFieldsDisabled = computed(() => props.readonly || showInvoiceValues.value)

// Computed property to determine if actions column should be shown
const showActionsColumn = computed(() => !props.readonly)


const { formatCurrency, currencySymbol } = useCurrencyFormat()

const unitPriceColumnHeader = computed(() =>
  formatPoAmountColumnHeader('Unit Price', props.poCurrencyFrom)
)
const totalColumnHeader = computed(() =>
  formatPoAmountColumnHeader('Total', props.poCurrencyFrom)
)

const currencySymbolText = computed(() => unref(currencySymbol) || '')

const quantityFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
})

const formatQuantity = (value: any) => {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return '0'
  return quantityFormatter.format(numeric)
}

const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

// Helper function to get numeric value for UInputNumber
// Returns null if value is empty/null/undefined (to show placeholder), otherwise returns the numeric value
const getNumericValueForInput = (draftValue: string | undefined, itemValue: any): number | null => {
  // Prefer draft value if it exists and is not empty
  if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
    const trimmed = String(draftValue).trim()
    if (trimmed === '') return null
    const parsed = parseNumericInput(draftValue)
    // Always return the parsed value (including 0) - 0 is a valid value to display
    return parsed
  }
  
  // Fall back to item value
  if (itemValue === null || itemValue === undefined) return null
  if (itemValue === '' || (typeof itemValue === 'string' && String(itemValue).trim() === '')) return null
  
  // Handle numeric 0 explicitly - it's a valid value that should be displayed
  if (typeof itemValue === 'number' && itemValue === 0) return 0
  
  const parsed = parseNumericInput(itemValue)
  // Always return the parsed value (including 0) - 0 is a valid value to display
  return parsed
}

const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : String(value)
}

const normalizeUnitPriceInput = (value: any): string => {
  const normalized = toInputString(value).replace(/,/g, '').trim()
  if (!normalized) return ''
  if (!/^\d*\.?\d*$/.test(normalized)) return ''
  const parts = normalized.split('.')
  const integerPart = parts[0] ?? ''
  const decimalPart = parts[1] ?? ''
  if (!normalized.includes('.')) return integerPart
  return `${integerPart}.${decimalPart.slice(0, 2)}`
}

const preventNonNumericKeydown = (event: KeyboardEvent) => {
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ])
  if (allowedKeys.has(event.key)) return
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) return

  if (!/^[0-9.]$/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (event.key === '.') {
    const target = event.target as HTMLInputElement | null
    const current = target?.value ?? ''
    if (current.includes('.')) {
      event.preventDefault()
    }
  }
}

const preventNonNumericPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const normalized = pastedText.trim()
  if (!/^\d*\.?\d*$/.test(normalized)) {
    event.preventDefault()
  }
}

/** Digits and at most one decimal point (PO / invoice quantity). */
const normalizeQuantityInput = (raw: string): string => {
  const normalized = raw.replace(/,/g, '').trim()
  if (!normalized) return ''
  const only = normalized.replace(/[^\d.]/g, '')
  const firstDot = only.indexOf('.')
  if (firstDot === -1) return only
  return only.slice(0, firstDot + 1) + only.slice(firstDot + 1).replace(/\./g, '')
}

const preventUnitPriceKeydown = (event: KeyboardEvent) => {
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ])
  if (allowedKeys.has(event.key)) return
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) return

  const isDigit = /^[0-9]$/.test(event.key)
  const isDot = event.key === '.'
  if (!isDigit && !isDot) {
    event.preventDefault()
    return
  }

  const input = event.target as HTMLInputElement | null
  const value = input?.value ?? ''
  if (isDot) {
    if (value.includes('.')) {
      event.preventDefault()
    }
    return
  }

  const dotIndex = value.indexOf('.')
  if (dotIndex >= 0) {
    const selectionStart = input?.selectionStart ?? value.length
    const selectionEnd = input?.selectionEnd ?? value.length
    const isReplacingSelection = selectionEnd > selectionStart
    const decimalPartLength = value.slice(dotIndex + 1).length
    const caretInDecimalPart = selectionStart > dotIndex
    if (decimalPartLength >= 2 && caretInDecimalPart && !isReplacingSelection) {
      event.preventDefault()
    }
  }
}

const preventUnitPricePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const normalized = pastedText.trim()
  if (!/^\d*\.?\d{0,2}$/.test(normalized)) {
    event.preventDefault()
  }
}

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

const formatCurrencyInput = (value: any): string => {
  const formatted = formatCurrency(value)
  const symbol = currencySymbolText.value
  if (typeof formatted !== 'string') {
    return String(formatted ?? '')
  }
  if (symbol && formatted.startsWith(symbol)) {
    return formatted.slice(symbol.length).trimStart()
  }
  return formatted
}

const poDrafts = reactive<Record<
  number,
  {
    key: string;
    unitPriceInput: string;
    quantityInput: string;
    unitTouched: boolean;
    quantityTouched: boolean;
  }
>>({})
const invoiceDrafts = reactive<Record<
  number,
  {
    key: string;
    unitPriceInput: string;
    quantityInput: string;
    unitTouched: boolean;
    quantityTouched: boolean;
  }
>>({})
const activeRowIndex = ref<number | null>(null)


const buildDraftKey = (item: PurchaseOrderItemDisplay, index: number) => {
  return [
    item.id ?? "",
    item.cost_code_uuid ?? "",
    item.item_type_uuid ?? "",
    item.item_uuid ?? "",
    index,
  ]
    .map((segment) => String(segment || "").trim().toUpperCase())
    .filter(Boolean)
    .join("|")
}

// PO quantity input value for UInput — same pattern as ReceiptNoteItemsTable.getReceivedInputValue.
// UInput emits @update:model-value on every keystroke, so the draft (and remaining/over-by) updates reactively.
const getPoQuantityInputValue = (item: PurchaseOrderItemDisplay, index: number): string => {
  const draft = poDrafts[index]
  const itemValue = toInputString(item.po_quantity)
  const draftValue = draft?.quantityInput
  const isTouched = draft?.quantityTouched ?? false
  return (isTouched ? draftValue : null) ?? itemValue
}

// Same string-draft pattern as quantity — avoids Number() coercing "12." to 12 mid-entry.
const getPoUnitPriceInputValue = (item: PurchaseOrderItemDisplay, index: number): string => {
  const draft = poDrafts[index]
  const itemValue = toInputString(item.po_unit_price)
  const draftValue = draft?.unitPriceInput
  const isTouched = draft?.unitTouched ?? false
  return (isTouched ? draftValue : null) ?? itemValue
}

const getInvoiceUnitPriceInputValue = (item: PurchaseOrderItemDisplay, index: number): string => {
  const draft = invoiceDrafts[index]
  const itemValue =
    item.invoice_unit_price !== null && item.invoice_unit_price !== undefined
      ? toInputString(item.invoice_unit_price)
      : ''
  const draftValue = draft?.unitPriceInput
  const isTouched = draft?.unitTouched ?? false
  return (isTouched ? draftValue : null) ?? itemValue
}

watch(
  () => props.items,
  (newItems = []) => {
    // Ensure we have a valid array
    if (!Array.isArray(newItems)) {
      return
    }
    
    newItems.forEach((item, index) => {
      const unitInput = toInputString(item.po_unit_price)
      const quantityInput = toInputString(item.po_quantity)
      const draftKey = buildDraftKey(item, index)
      const draft = poDrafts[index]

      if (!draft || draft.key !== draftKey) {
        poDrafts[index] = {
          key: draftKey,
          unitPriceInput: unitInput,
          quantityInput,
          unitTouched: false,
          quantityTouched: false,
        }
        return
      }

      draft.key = draftKey
      if (!draft.unitTouched && draft.unitPriceInput !== unitInput) {
        draft.unitPriceInput = unitInput
      }
      if (!draft.quantityTouched && draft.quantityInput !== quantityInput) {
        draft.quantityInput = quantityInput
      }
    })

    Object.keys(poDrafts).forEach((key) => {
      const idx = Number(key)
      if (!Number.isNaN(idx) && !newItems[idx]) {
        delete poDrafts[idx]
      }
    })
    
    // Initialize invoice drafts if showInvoiceValues is enabled
    if (showInvoiceValues.value) {
      newItems.forEach((item, index) => {
        // Use invoice values if they are explicitly set (not null/undefined), otherwise show empty
        // This ensures that:
        // - New invoices: invoice_unit_price/invoice_quantity will be null, so we show empty fields
        // - Existing invoices: invoice_unit_price/invoice_quantity will have saved values or null
        // - Don't fall back to PO values for new invoices - user should enter invoice values manually
        const invoiceUnitInput = (item.invoice_unit_price !== null && item.invoice_unit_price !== undefined)
          ? toInputString(item.invoice_unit_price)
          : ''
        const invoiceQuantityInput = (item.invoice_quantity !== null && item.invoice_quantity !== undefined)
          ? toInputString(item.invoice_quantity)
          : ''
        const draftKey = buildDraftKey(item, index)
        const invoiceDraft = invoiceDrafts[index]

        if (!invoiceDraft || invoiceDraft.key !== draftKey) {
          invoiceDrafts[index] = {
            key: draftKey,
            unitPriceInput: invoiceUnitInput,
            quantityInput: invoiceQuantityInput,
            unitTouched: false,
            quantityTouched: false,
          }
          return
        }

        invoiceDraft.key = draftKey
        // Update if not touched and value has changed
        // This ensures saved invoice values are applied when loading existing invoices
        if (!invoiceDraft.unitTouched && invoiceDraft.unitPriceInput !== invoiceUnitInput) {
          invoiceDraft.unitPriceInput = invoiceUnitInput
        }
        if (!invoiceDraft.quantityTouched && invoiceDraft.quantityInput !== invoiceQuantityInput) {
          invoiceDraft.quantityInput = invoiceQuantityInput
        }
      })

      Object.keys(invoiceDrafts).forEach((key) => {
        const idx = Number(key)
        if (!Number.isNaN(idx) && !newItems[idx]) {
          delete invoiceDrafts[idx]
        }
      })
    }
  },
  { immediate: true, deep: true }
)

const computePoTotal = (item: PurchaseOrderItemDisplay, index?: number): number => {
  const draft = index !== undefined ? poDrafts[index] : undefined

  if (draft) {
    const unitFromDraft = parseNumericInput(draft.unitPriceInput)
    const quantityFromDraft = parseNumericInput(draft.quantityInput)
    const unitFromItem = parseNumericInput(item.po_unit_price)
    const quantityFromItem = parseNumericInput(item.po_quantity)
    const draftDiffers =
      draft.unitTouched ||
      draft.quantityTouched ||
      draft.unitPriceInput !== toInputString(item.po_unit_price) ||
      draft.quantityInput !== toInputString(item.po_quantity)

    if (draftDiffers) {
      return roundCurrency(unitFromDraft * quantityFromDraft)
    }

    if (unitFromItem || quantityFromItem) {
      return roundCurrency(unitFromItem * quantityFromItem)
    }
  }

  const storedUnit = parseNumericInput(item.po_unit_price)
  const storedQuantity = parseNumericInput(item.po_quantity)
  if (storedUnit || storedQuantity) {
    return roundCurrency(storedUnit * storedQuantity)
  }

  const storedTotal = parseNumericInput(item.po_total)
  if (storedTotal) {
    return roundCurrency(storedTotal)
  }

  return 0
}

const computeInvoiceTotal = (item: PurchaseOrderItemDisplay, index?: number): number => {
  if (!showInvoiceValues.value) return 0
  
  const draft = index !== undefined ? invoiceDrafts[index] : undefined

  if (draft) {
    const unitFromDraft = parseNumericInput(draft.unitPriceInput)
    const quantityFromDraft = parseNumericInput(draft.quantityInput)
    
    // If draft has been touched or has values, use draft values
    if (draft.unitTouched || draft.quantityTouched || (unitFromDraft > 0 && quantityFromDraft > 0)) {
      return roundCurrency(unitFromDraft * quantityFromDraft)
    }
    
    // Otherwise, check if invoice values are set (not null/undefined)
    // For new invoices, invoice_unit_price and invoice_quantity are null, so we should return 0
    const hasInvoiceUnitPrice = item.invoice_unit_price !== null && item.invoice_unit_price !== undefined
    const hasInvoiceQuantity = item.invoice_quantity !== null && item.invoice_quantity !== undefined
    
    if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
      const unitFromItem = parseNumericInput(item.invoice_unit_price)
      const quantityFromItem = parseNumericInput(item.invoice_quantity)
      if (unitFromItem > 0 && quantityFromItem > 0) {
        return roundCurrency(unitFromItem * quantityFromItem)
      }
    }
    
    // If invoice_total is set (not null/undefined), use it
    if (item.invoice_total !== null && item.invoice_total !== undefined) {
      const storedTotal = parseNumericInput(item.invoice_total)
      if (storedTotal > 0) {
        return roundCurrency(storedTotal)
      }
    }
  }

  // No draft - check if invoice values are explicitly set (not null/undefined)
  // For new invoices, invoice_unit_price and invoice_quantity are null, so don't fall back to PO values
  const hasInvoiceUnitPrice = item.invoice_unit_price !== null && item.invoice_unit_price !== undefined
  const hasInvoiceQuantity = item.invoice_quantity !== null && item.invoice_quantity !== undefined
  
  if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
    const storedUnit = parseNumericInput(item.invoice_unit_price)
    const storedQuantity = parseNumericInput(item.invoice_quantity)
    if (storedUnit > 0 && storedQuantity > 0) {
      return roundCurrency(storedUnit * storedQuantity)
    }
  }

  // If invoice_total is explicitly set (not null/undefined), use it
  if (item.invoice_total !== null && item.invoice_total !== undefined) {
    const storedTotal = parseNumericInput(item.invoice_total)
    if (storedTotal > 0) {
      return roundCurrency(storedTotal)
    }
  }

  // For new invoices, return 0 instead of falling back to PO values
  return 0
}

const emit = defineEmits<{
  (e: 'edit-selection'): void
  (e: 'add-row', index: number): void
  (e: 'remove-row', index: number): void
  (e: 'cost-code-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'category-change', payload: { index: number; value: string | null }): void
  (e: 'location-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'item-type-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'sequence-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'item-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'approval-checks-change', payload: { index: number; value: string[]; rawItem?: unknown }): void
  (e: 'model-number-change', payload: { index: number; value: string }): void
  (e: 'uom-change', payload: { index: number; value: string | null; option?: any }): void
  (e: 'po-unit-price-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'po-quantity-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'po-total-change', payload: { index: number; value: number }): void
  (e: 'invoice-unit-price-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'invoice-quantity-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'invoice-total-change', payload: { index: number; value: number }): void
  (e: 'description-change', payload: { index: number; value: string }): void
}>()

const activeDescriptionCellKey = ref<string | null>(null)
const activeDescriptionIndex = ref<number | null>(null)

const descriptionEditor = useEditor({
  content: '',
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none min-h-[140px] focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    if (activeDescriptionIndex.value === null) return
    emit('description-change', {
      index: activeDescriptionIndex.value,
      value: editor.getHTML(),
    })
  },
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getDescriptionPreviewHtml = (value: unknown) => {
  const raw = String(value || '').trim()
  if (!raw) return '<p>-</p>'
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw)
  if (looksLikeHtml) return raw
  return `<p>${escapeHtml(raw)}</p>`
}

const openDescriptionEditor = (index: number, currentValue: unknown, mode: 'desktop' | 'mobile') => {
  activeDescriptionIndex.value = index
  activeDescriptionCellKey.value = `${mode}-${index}`
  const html = String(currentValue || '')
  descriptionEditor.value?.commands.setContent(html || '')
}

const closeDescriptionEditor = () => {
  activeDescriptionCellKey.value = null
  activeDescriptionIndex.value = null
}

const handleAddRow = (index: number) => {
  emit('add-row', index)
}

const handleRemoveRow = (index: number) => {
  emit('remove-row', index)
}

const emitCostCodeChange = (index: number, value?: string, option?: any) => {
  // Don't emit changes when readonly to prevent modifications while preserving appearance
  if (!props.readonly) {
    emit('cost-code-change', { index, value: value ?? null, option })
  }
}

const emitCategoryChange = (index: number, value?: string) => {
  if (!props.readonly) {
    emit('category-change', { index, value: value ?? null })
  }
}

const emitItemTypeChange = (index: number, value?: string, option?: any) => {
  emit('item-type-change', { index, value: value ?? null, option })
}

const emitSequenceChange = (index: number, value?: string | null, option?: any) => {
  emit('sequence-change', { index, value: value ?? null, option })
}

const emitLocationChange = (index: number, value?: string, option?: any) => {
  emit('location-change', { index, value: value ?? null, option })
}

onBeforeUnmount(() => {
  if (descriptionEditor.value && typeof descriptionEditor.value.destroy === 'function') {
    try {
      descriptionEditor.value.destroy()
    } catch {
      // no-op
    }
  }
})

const emitItemChange = (index: number, value?: string | null, option?: any) => {
  emit('item-change', { index, value: value ?? null, option })
}

const emitApprovalChecksChange = (index: number, value: string[], rawItem?: unknown) => {
  emit('approval-checks-change', { index, value: value || [], rawItem })
}

// Quick-add Approval Check
const approvalChecksStore = useApprovalChecksStore()
const showQuickAddApprovalCheck = ref(false)
const savingApprovalCheck = ref(false)
const quickApprovalCheckForm = reactive({
  approval_check: '',
  description: '',
  active: true,
})

const openQuickAddApprovalCheck = () => {
  quickApprovalCheckForm.approval_check = ''
  quickApprovalCheckForm.description = ''
  quickApprovalCheckForm.active = true
  showQuickAddApprovalCheck.value = true
}

const closeQuickAddApprovalCheck = () => {
  showQuickAddApprovalCheck.value = false
}

const saveQuickApprovalCheck = async () => {
  if (!quickApprovalCheckForm.approval_check.trim()) return
  savingApprovalCheck.value = true
  try {
    const toast = useToast()
    await approvalChecksStore.createApprovalCheck({
      approval_check: quickApprovalCheckForm.approval_check.trim(),
      description: quickApprovalCheckForm.description.trim() || null,
      active: quickApprovalCheckForm.active,
    })
    toast.add({ title: 'Success', description: 'Approval Check created successfully', color: 'success' })
    closeQuickAddApprovalCheck()
  } catch (error: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: error.message || 'Failed to create approval check', color: 'error' })
  } finally {
    savingApprovalCheck.value = false
  }
}

const emitModelNumberChange = (index: number, value?: string) => {
  emit('model-number-change', { index, value: value ?? '' })
}

/** UOMSelect resolves options by UUID or by short name (case-insensitive). */
const uomSelectModelValue = (item: PurchaseOrderItemDisplay) => {
  const raw =
    item.unit_uuid ??
    item.unit_label ??
    item.uom ??
    item.unit
  if (raw == null || raw === '') return undefined
  const s = String(raw).trim()
  return s === '' ? undefined : s
}

const emitUomChange = (index: number, value?: string | null, option?: any) => {
  emit('uom-change', { index, value: value ?? null, option })
}

const emitPoTotalChange = (index: number, total: number) => {
  emit('po-total-change', { index, value: total })
}

const emitPoUnitPriceChange = (index: number, value: string | number | null | undefined) => {
  const item = props.items?.[index]
  const draft =
    poDrafts[index] ||
    (poDrafts[index] = {
      key: buildDraftKey(item as PurchaseOrderItemDisplay, index),
      unitPriceInput: toInputString(item?.po_unit_price),
      quantityInput: toInputString(item?.po_quantity),
      unitTouched: false,
      quantityTouched: false,
    })
  const normalizedValue = normalizeUnitPriceInput(value)
  draft.unitPriceInput = normalizedValue
  draft.unitTouched = true
  const numericValue = parseNumericInput(draft.unitPriceInput)
  const quantityNumeric = parseNumericInput(draft.quantityInput ?? '')
  const computedTotal = roundCurrency(numericValue * quantityNumeric)
  emit('po-unit-price-change', { index, value: normalizedValue, numericValue, computedTotal })
  emitPoTotalChange(index, computedTotal)
}

const emitPoQuantityChange = (index: number, value: string | number | null | undefined) => {
  const item = props.items?.[index]
  const draft =
    poDrafts[index] ||
    (poDrafts[index] = {
      key: buildDraftKey(item as PurchaseOrderItemDisplay, index),
      unitPriceInput: toInputString(item?.po_unit_price),
      quantityInput: toInputString(item?.po_quantity),
      unitTouched: false,
      quantityTouched: false,
    })
  draft.quantityInput = normalizeQuantityInput(toInputString(value))
  draft.quantityTouched = true
  const numericValue = parseNumericInput(draft.quantityInput)
  const unitNumeric = parseNumericInput(draft.unitPriceInput ?? '')
  const computedTotal = roundCurrency(unitNumeric * numericValue)
  emit('po-quantity-change', { index, value: draft.quantityInput, numericValue, computedTotal })
  emitPoTotalChange(index, computedTotal)
}

const emitInvoiceTotalChange = (index: number, total: number) => {
  emit('invoice-total-change', { index, value: total })
}

const emitInvoiceUnitPriceChange = (index: number, value: string | number | null | undefined) => {
  const item = props.items?.[index]
  const invoiceUnitInput = (item?.invoice_unit_price !== null && item?.invoice_unit_price !== undefined)
    ? toInputString(item.invoice_unit_price)
    : ''
  const invoiceQuantityInput = (item?.invoice_quantity !== null && item?.invoice_quantity !== undefined)
    ? toInputString(item.invoice_quantity)
    : ''
  const draft =
    invoiceDrafts[index] ||
    (invoiceDrafts[index] = {
      key: buildDraftKey(item as PurchaseOrderItemDisplay, index),
      unitPriceInput: invoiceUnitInput,
      quantityInput: invoiceQuantityInput,
      unitTouched: false,
      quantityTouched: false,
    })
  const normalizedValue = normalizeUnitPriceInput(value)
  draft.unitPriceInput = normalizedValue
  draft.unitTouched = true
  const numericValue = parseNumericInput(draft.unitPriceInput)
  const quantityNumeric = parseNumericInput(draft.quantityInput ?? '')
  const computedTotal = roundCurrency(numericValue * quantityNumeric)
  emit('invoice-unit-price-change', { index, value: normalizedValue, numericValue, computedTotal })
  emitInvoiceTotalChange(index, computedTotal)
}

// Check if an item has invoice quantity greater than to_be_invoiced
const isOverInvoiced = (item: PurchaseOrderItemDisplay, index: number): boolean => {
  if (!showInvoiceValues.value) return false
  const toBeInvoiced = parseNumericInput(item.to_be_invoiced ?? 0)
  if (toBeInvoiced <= 0) return false // No limit if to_be_invoiced is 0 or negative
  
  // Check both the draft value and the actual item value
  const draftValue = invoiceDrafts[index]?.quantityInput
  const currentValue = item.invoice_quantity
  
  // Parse draft value if it exists
  if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
    const draftNumeric = parseNumericInput(draftValue)
    if (draftNumeric > toBeInvoiced) return true
  }
  
  // Parse current value
  const currentNumeric = parseNumericInput(currentValue)
  return currentNumeric > toBeInvoiced
}

// Build a map of estimate items by composite key of item_uuid and cost_code_uuid for quick lookup
const estimateItemsMap = computed(() => {
  const map = new Map<string, any>();
  const estimateItems = props.estimateItems || [];
  estimateItems.forEach((estItem: any) => {
    if (estItem?.item_uuid && estItem?.cost_code_uuid) {
      // Use composite key: item_uuid-cost_code_uuid (same as PurchaseOrderForm.vue)
      const key = `${String(estItem.item_uuid).toLowerCase()}-${String(estItem.cost_code_uuid).toLowerCase()}`;
      map.set(key, estItem);
    }
  });
  return map;
});

// Get available quantity for a PO item (estimate quantity - used quantities from other POs)
const getAvailableQuantity = (item: PurchaseOrderItemDisplay, index: number): number => {
  if (!item.item_uuid || !item.cost_code_uuid) return 0;

  // Use composite key: item_uuid-cost_code_uuid (same as PurchaseOrderForm.vue)
  const compositeKey = `${String(item.item_uuid).toLowerCase()}-${String(item.cost_code_uuid).toLowerCase()}`;
  const estimateItem = estimateItemsMap.value.get(compositeKey);
  if (!estimateItem) return 0;

  const estimateQuantity = parseNumericInput(estimateItem.quantity || 0);
  const usedQuantity = props.usedQuantitiesByItem?.[compositeKey] || 0;

  const availableQuantity = Math.max(0, estimateQuantity - usedQuantity);
  return availableQuantity;
}

// Get remaining available quantity after subtracting current PO quantity input
// This provides visual feedback as the user types
const getRemainingQuantity = (item: PurchaseOrderItemDisplay, index: number): number => {
  if (!item.item_uuid) return 0;
  
  const availableQty = getAvailableQuantity(item, index);
  
  // Get current input value (from draft if user is typing, otherwise from item)
  const draftValue = poDrafts[index]?.quantityInput;
  const currentValue = item.po_quantity;
  
  let currentPoQuantity = 0;
  if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
    currentPoQuantity = parseNumericInput(draftValue);
  } else if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
    currentPoQuantity = parseNumericInput(currentValue);
  }
  
  // Calculate remaining: available - current input
  const remaining = availableQty - currentPoQuantity;
  return remaining;
}

// Get CSS class for remaining quantity indicator based on value
const getRemainingQuantityClass = (item: PurchaseOrderItemDisplay, index: number): string => {
  const remaining = getRemainingQuantity(item, index);
  const availableQty = getAvailableQuantity(item, index);
  
  if (remaining < 0) {
    // Over the available quantity
    return 'text-error-600 dark:text-error-400';
  } else if (remaining === 0) {
    // Exactly at available quantity
    return 'text-warning-600 dark:text-warning-400';
  } else if (availableQty > 0 && remaining <= availableQty * 0.1) {
    // Less than 10% remaining
    return 'text-warning-500 dark:text-warning-500';
  } else {
    // Plenty remaining
    return 'text-muted';
  }
}

// Check if an item has PO quantity exceeding available estimate quantity
const isQuantityExceeded = (item: PurchaseOrderItemDisplay, index: number): boolean => {
  if (showInvoiceValues.value) return false; // Only check for PO quantities, not invoice
  if (!item.item_uuid || !item.cost_code_uuid) return false;

  // Use composite key: item_uuid-cost_code_uuid (same as PurchaseOrderForm.vue)
  const compositeKey = `${String(item.item_uuid).toLowerCase()}-${String(item.cost_code_uuid).toLowerCase()}`;
  const estimateItem = estimateItemsMap.value.get(compositeKey);
  if (!estimateItem) return false;

  const estimateQuantity = parseNumericInput(estimateItem.quantity || 0);
  if (estimateQuantity <= 0) return false; // No limit if estimate quantity is 0 or negative

  // Check both the draft value and the actual item value
  const draftValue = poDrafts[index]?.quantityInput;
  const currentValue = item.po_quantity;
  const usedQuantity = props.usedQuantitiesByItem?.[compositeKey] || 0;
  
  let currentPoQuantity = 0;
  
  // Parse draft value if it exists (user is typing)
  if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
    currentPoQuantity = parseNumericInput(draftValue);
  } else if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
    currentPoQuantity = parseNumericInput(currentValue);
  }
  
  const totalQuantity = usedQuantity + currentPoQuantity;
  return totalQuantity > estimateQuantity;
}

const emitInvoiceQuantityChange = (index: number, value: string | number | null | undefined) => {
  const item = props.items?.[index]
  const invoiceUnitInput = (item?.invoice_unit_price !== null && item?.invoice_unit_price !== undefined)
    ? toInputString(item.invoice_unit_price)
    : ''
  const invoiceQuantityInput = (item?.invoice_quantity !== null && item?.invoice_quantity !== undefined)
    ? toInputString(item.invoice_quantity)
    : ''
  const draft =
    invoiceDrafts[index] ||
    (invoiceDrafts[index] = {
      key: buildDraftKey(item as PurchaseOrderItemDisplay, index),
      unitPriceInput: invoiceUnitInput,
      quantityInput: invoiceQuantityInput,
      unitTouched: false,
      quantityTouched: false,
    })
  draft.quantityInput = normalizeQuantityInput(toInputString(value))
  draft.quantityTouched = true
  const numericValue = parseNumericInput(draft.quantityInput)
  const unitNumeric = parseNumericInput(draft.unitPriceInput ?? '')
  const computedTotal = roundCurrency(unitNumeric * numericValue)
  emit('invoice-quantity-change', { index, value: draft.quantityInput, numericValue, computedTotal })
  emitInvoiceTotalChange(index, computedTotal)
}

const setActiveRow = (index: number | null) => {
  activeRowIndex.value = index
}

const clearActiveRow = (index: number) => {
  if (activeRowIndex.value === index) {
    activeRowIndex.value = null
  }
}

const handleEditSelection = () => {
  emit('edit-selection')
}

const formatItemTypeLabel = (itemType: any): string => {
  const specType = String(itemType?.spec_type ?? '').trim()
  const itemTypeName = String(itemType?.item_type ?? '').trim()
  if (specType && itemTypeName) return `${specType} - ${itemTypeName}`
  return itemTypeName || specType || ''
}

const normalizeLegacyItemTypeLabel = (label?: string | null): string => {
  const raw = String(label ?? '').trim()
  if (!raw) return ''
  // Handle legacy labels like "Spec - Item - SHORT"
  const parts = raw.split(' - ').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 3) {
    return `${parts[0]} - ${parts[1]}`
  }
  return raw
}

// Helper to get item type display label
const getItemTypeDisplayLabel = (item: PurchaseOrderItemDisplay): string => {
  // Try to find the item type label from scopedItemTypes if available
  if (item.item_type_uuid && props.scopedItemTypes && Array.isArray(props.scopedItemTypes)) {
    const itemType = props.scopedItemTypes.find((it: any) => it.uuid === item.item_type_uuid)
    const formatted = formatItemTypeLabel(itemType)
    if (formatted) {
      return formatted
    }
  }
  
  // Fallback to stored label
  if (item.item_type_label) {
    return normalizeLegacyItemTypeLabel(item.item_type_label)
  }
  
  // Final fallback
  return 'Select item type'
}

// Expose to template
defineExpose({ formatCurrency, formatQuantity, normalizeQuantityInput })
</script>

<style scoped>
</style>

