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
      <div class="flex items-center gap-4">
        <div v-if="hasItems" class="text-[11px] font-medium text-muted uppercase tracking-wide">
          {{ items.length }} items
        </div>
        <UButton
          v-if="!props.readonly && props.corporationUuid"
          icon="i-heroicons-plus"
          size="xs"
          color="primary"
          variant="soft"
          @click="emit('add-row')"
        >
          Add Row
        </UButton>
      </div>
    </div>

    <div v-if="error" class="px-4 py-3 text-xs text-error-700 bg-error-50/80 dark:bg-error-900/20 border-b border-error-200">
      {{ error }}
    </div>
    
    <!-- Skeleton Loaders -->
    <div v-else-if="loading" class="px-4 py-4">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-16" /></th>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-24" /></th>
              <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/10 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-16" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
              <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-16" /></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60">
            <tr v-for="i in 3" :key="i" class="align-middle">
              <td class="px-2 py-2"><USkeleton class="h-4 w-24" /></td>
              <td class="px-2 py-2"><USkeleton class="h-4 w-24" /></td>
              <td class="px-2 py-2"><USkeleton class="h-4 w-32" /></td>
              <td class="px-2 py-2"><USkeleton class="h-4 w-32" /></td>
              <td class="px-2 py-2"><USkeleton class="h-4 w-24" /></td>
              <td class="px-2 py-2"><USkeleton class="h-4 w-28" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-16 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-12 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-16 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
              <td class="px-2 py-2 text-right"><USkeleton class="h-4 w-8 ml-auto" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="md:hidden divide-y divide-default/60">
        <div v-for="i in 3" :key="i" class="px-4 py-4 space-y-3">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-3 w-24" />
          <div class="grid grid-cols-2 gap-3">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
          </div>
          <USkeleton class="h-8 w-16 ml-auto" />
        </div>
      </div>
    </div>

    <div v-else-if="hasItems">
      <div class="hidden md:block">
        <table class="min-w-full table-fixed divide-y divide-default/60">
          <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th class="w-1/12 px-4 py-2 text-left">Cost Code</th>
              <th class="w-1/12 px-4 py-2 text-left">Category</th>
              <th class="w-1/12 px-4 py-2 text-left">Item Type</th>
              <th class="w-2/12 px-4 py-2 text-left">SPEC / Item</th>
              <th class="w-1/12 px-4 py-2 text-left">Description</th>
              <th v-if="!props.hideLocation" class="w-1/12 px-4 py-2 text-left">Location</th>
              <th class="w-1/12 px-4 py-2 text-right">UOM</th>
              <th v-if="!props.hideApprovalChecks" class="w-1/12 px-4 py-2 text-left">
                <div class="flex items-center gap-1">
                  <span>Approval Checks</span>
                  <UButton
                    v-if="!props.readonly"
                    icon="i-heroicons-plus"
                    size="2xs"
                    color="primary"
                    variant="solid"
                    class="rounded-full !p-1"
                    @click.stop="openQuickAddApprovalCheck"
                  />
                </div>
              </th>
              <th v-if="showInvoiceValues" class="w-1/12 px-4 py-2 text-right">To Be Invoiced</th>
              <th class="w-1/10 px-4 py-2 text-right">PO Unit / CO Unit</th>
              <th class="w-1/12 px-4 py-2 text-right">PO Qty / CO Qty</th>
              <th class="w-1/12 px-4 py-2 text-right">PO Total / CO Total</th>
              <th class="w-1/12 px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/60 text-sm text-default">
            <tr
              v-for="(row, index) in displayRows"
              :key="row.id || index"
              :class="[
                'align-middle',
                isOverInvoiced(row, index) ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500' : ''
              ]"
            >
              <td class="px-2 py-2">
                <CostCodeSelect
                  :model-value="row.cost_code_uuid ?? undefined"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :corporation-uuid="props.corporationUuid"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emit('cost-code-change', index, value as string | null)"
                  @change="(option) => emit('cost-code-change', index, (option?.costCode?.uuid || option?.value || option?.uuid) as string | null, option)"
                />
              </td>
              <td class="px-2 py-2">
                <div class="flex flex-col gap-1 min-w-0">
                  <ItemCategorySelect
                    :model-value="row.category ?? undefined"
                    placeholder="Select category"
                    size="xs"
                    class="w-full"
                    :disabled="props.readonly || !row.isNewItem"
                    @update:model-value="(value) => emit('category-change', index, value as string | null)"
                  />
                </div>
              </td>
              <td class="px-2 py-2">
                <ItemTypeSelect
                  :model-value="row.item_type_uuid ?? undefined"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :corporation-uuid="props.corporationUuid"
                  :project-uuid="props.projectUuid"
                  :category="row.category || undefined"
                  :item-division-uuid="row.item_division_uuid || undefined"
                  :disabled="isCoItemTypeSelectDisabled(row)"
                  @update:model-value="(value) => emit('item-type-change', index, value as string | null)"
                  @change="(option) => emit('item-type-change', index, (option?.value || option?.uuid) as string | null, option)"
                />
              </td>
              <td class="px-2 py-2">
                <div class="flex flex-col gap-1 min-w-0">
                  <SequenceSelect
                    :model-value="row.item_uuid ?? undefined"
                    size="xs"
                    class="w-full min-w-0 text-left"
                    :corporation-uuid="props.corporationUuid"
                    :project-uuid="props.projectUuid"
                    :item-type-uuid="row.item_type_uuid || undefined"
                    :category="row.isNewItem ? (row.category || undefined) : undefined"
                    :item-division-uuid="row.isNewItem ? (row.item_division_uuid || undefined) : undefined"
                    :disabled="isCoItemSelectDisabled(row)"
                    @change="(payload) => emit('sequence-change', index, payload?.value as string | null, payload?.option)"
                  />
                  <ItemSelect
                    :model-value="row.item_uuid ?? undefined"
                    size="xs"
                    class="w-full min-w-0 text-left"
                    :corporation-uuid="props.corporationUuid"
                    :project-uuid="props.projectUuid"
                    :cost-code-uuid="row.cost_code_uuid"
                    :item-type-uuid="row.item_type_uuid"
                    :category="row.isNewItem ? (row.category || undefined) : undefined"
                    :item-division-uuid="row.isNewItem ? (row.item_division_uuid || undefined) : undefined"
                    :disabled="isCoItemSelectDisabled(row)"
                    @update:model-value="(value) => emit('item-change', index, value as string | null)"
                    @change="(payload) => emit('item-change', index, payload.value as string | null, payload.option)"
                  />
                </div>
              </td>
              <td class="px-2 py-2 align-middle">
                <template v-if="!props.readonly && !showInvoiceValues">
                  <UPopover
                    :open="activeDescriptionCellKey === `desktop-${index}`"
                    @update:open="(open) => {
                      if (open) openDescriptionEditor(index, row.description, 'desktop')
                      else closeDescriptionEditor()
                    }"
                    :content="{ side: 'top', align: 'start' }"
                    :ui="{ content: 'w-[min(640px,92vw)] p-3 bg-white dark:bg-gray-900 border border-info/20' }"
                  >
                    <button type="button" class="w-full text-left rounded-md border border-default px-2 py-1.5 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" @click="openDescriptionEditor(index, row.description, 'desktop')">
                      <div class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0" v-html="getDescriptionPreviewHtml(row.description)" />
                    </button>
                    <template #content>
                      <div class="space-y-2">
                        <div class="flex items-center gap-1 border-b border-default pb-2">
                          <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBold().run()" />
                          <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleItalic().run()" />
                          <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBulletList().run()" />
                          <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleOrderedList().run()" />
                        </div>
                        <div class="max-h-[280px] overflow-y-auto rounded-md border border-default px-3 py-2">
                          <EditorContent :editor="descriptionEditor" />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </template>
                <div
                  v-else
                  class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                  v-html="getDescriptionPreviewHtml(row.description)"
                />
              </td>
              <td v-if="!props.hideLocation" class="px-2 py-2">
                <LocationSelect
                  :model-value="row.location_uuid ?? undefined"
                  :locations="scopedLocationsWithSelected"
                  placeholder="Select location"
                  size="xs"
                  class-name="w-full"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emit('location-change', index, value as string | null)"
                  @change="(option) => emit('location-change', index, (option?.value ?? option?.uuid) as string | null, option)"
                />
              </td>
              <td class="px-2 py-2 text-right">
                <UOMSelect
                  v-if="!props.readonly"
                  :model-value="row.unit_uuid ?? row.uom_uuid ?? undefined"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :corporation-uuid="props.corporationUuid"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emit('uom-change', index, value as string | null)"
                  @change="(option) => emit('uom-change', index, (option?.value ?? option?.uom?.uuid ?? option?.uuid) as string | null, option)"
                />
                <div v-else class="text-xs text-right">
                  <div class="font-medium truncate">{{ getUomDisplayLabel(row) || '—' }}</div>
                </div>
              </td>
              <td v-if="!props.hideApprovalChecks" class="px-2 py-2 align-middle w-1/12">
                <ApprovalChecksSelect
                  :model-value="row.approval_checks ?? []"
                  size="xs"
                  class="w-full min-w-0 text-left"
                  :disabled="props.readonly"
                  @update:model-value="(value) => emitApprovalChecksChange(index, value)"
                  @change="(options) => emitApprovalChecksChange(index, options.map(opt => opt.value))"
                />
              </td>
              <td v-if="showInvoiceValues" class="px-2 py-2 text-right align-top">
                <div class="flex flex-col items-end gap-1 w-full max-w-[160px] ml-auto">
                  <div class="rounded-md bg-gray-100/80 dark:bg-gray-800/60 px-2 py-1 border border-transparent w-full">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-mono text-sm leading-none tracking-tight text-muted">
                        {{ formatQuantity(row.to_be_invoiced) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right align-top">
                <div class="flex flex-col items-end gap-1 w-full max-w-[200px] ml-auto">
                  <div class="grid grid-cols-[auto_auto] items-center gap-1 rounded-md bg-gray-100/80 dark:bg-gray-800/60 px-2 py-1 border border-transparent">
                    <span class="font-mono text-sm leading-none tracking-tight text-muted">
                      {{ formatCurrency(row.unit_price) }}
                    </span>
                  </div>
                  <div class="w-full">
                    <div class="flex items-center justify-end gap-1">
                      <span class="text-xs font-semibold text-default">
                        {{ currencySymbolText }}
                      </span>
                      <UInput
                        v-if="!showInvoiceValues"
                        :model-value="coDrafts[index]?.unitPriceInput ?? toInputStringWithZeroPlaceholder(row.co_unit_price)"
                        size="xs"
                        inputmode="decimal"
                        :disabled="props.readonly"
                        placeholder="0"
                        class="w-full max-w-[140px]"
                        :ui="{ 
                          base: 'text-right font-mono',
                        }"
                        @keydown="preventUnitPriceKeydown"
                        @paste="preventUnitPricePaste"
                        @update:model-value="(value) => onCoUnitPriceInput(index, value)"
                      />
                      <UInput
                        v-else
                        :model-value="invoiceDrafts[index]?.unitPriceInput ?? toInputString((row.invoice_unit_price !== null && row.invoice_unit_price !== undefined) ? row.invoice_unit_price : null)"
                        size="xs"
                        inputmode="decimal"
                        :disabled="props.readonly"
                        placeholder="0"
                        class="w-full max-w-[140px]"
                        :ui="{ 
                          base: 'text-right font-mono',
                        }"
                        @keydown="preventUnitPriceKeydown"
                        @paste="preventUnitPricePaste"
                        @update:model-value="(value) => onInvoiceUnitPriceInput(index, value)"
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right align-top">
                <div class="flex flex-col items-end gap-1 w-full max-w-[160px] ml-auto">
                  <div class="rounded-md bg-gray-100/80 dark:bg-gray-800/60 px-2 py-1 border border-transparent w-full">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-mono text-sm leading-none tracking-tight text-muted">
                        {{ formatQuantity(row.quantity) }}
                      </span>
                    </div>
                  </div>
                  <div class="w-full">
                    <UInput
                      v-if="!showInvoiceValues"
                      :model-value="coDrafts[index]?.quantityInput ?? toInputStringWithZeroPlaceholder(row.co_quantity)"
                      size="xs"
                      inputmode="decimal"
                      class="w-full max-w-[120px] text-right font-mono ml-auto"
                      :disabled="props.readonly"
                      @keydown="preventQuantityKeydown"
                      @paste="preventQuantityPaste"
                      @update:model-value="(value) => onCoQuantityInput(index, value)"
                    />
                    <UInput
                      v-else
                      :model-value="invoiceDrafts[index]?.quantityInput ?? toInputString((row.invoice_quantity !== null && row.invoice_quantity !== undefined) ? row.invoice_quantity : null)"
                      size="xs"
                      inputmode="decimal"
                      class="w-full max-w-[120px] text-right font-mono ml-auto"
                      :disabled="props.readonly"
                      @keydown="preventQuantityKeydown"
                      @paste="preventQuantityPaste"
                      @update:model-value="(value) => onInvoiceQuantityInput(index, value)"
                    />
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right align-top">
                <div class="flex flex-col items-end gap-1 w-full max-w-[200px] ml-auto">
                  <div class="rounded-md bg-gray-100/80 dark:bg-gray-800/60 px-2 py-1 border border-transparent w-full">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-mono text-sm leading-none tracking-tight text-muted">
                        {{ formatCurrency(row.total) }}
                      </span>
                    </div>
                  </div>
                  <div class="w-full">
                    <div class="rounded-md bg-background dark:bg-gray-900/60 px-2 py-1 border border-transparent w-full">
                      <span class="font-mono text-sm leading-none tracking-tight">
                        {{ showInvoiceValues ? formatCurrency(computeInvoiceTotal(row, index)) : formatCurrency(computeCoTotal(row, index)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-2 py-2 text-right">
                <slot name="actions" :row="row" :index="index">
                  <UButton
                    icon="i-heroicons-minus"
                    variant="soft"
                    color="error"
                    size="xs"
                    class="shrink-0"
                    :disabled="props.readonly"
                    @click.stop="emitRemoveRow(index)"
                  />
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden divide-y divide-default/60">
        <div
          v-for="(row, index) in displayRows"
          :key="row.id || index"
          :class="[
            'px-4 py-4 space-y-3',
            isOverInvoiced(row, index) ? 'bg-error-50/50 dark:bg-error-900/20 border-l-4 border-error-500' : ''
          ]"
        >
          <div class="text-xs space-y-2">
            <!-- Cost Code -->
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Cost Code</span>
              <CostCodeSelect
                :model-value="row.cost_code_uuid ?? undefined"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="props.corporationUuid"
                :disabled="props.readonly"
                @update:model-value="(value) => emit('cost-code-change', index, value as string | null)"
                @change="(option) => emit('cost-code-change', index, (option?.costCode?.uuid || option?.value || option?.uuid) as string | null, option)"
              />
            </div>

            <div class="space-y-2">
              <div>
                <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Category</span>
                <ItemCategorySelect
                  :model-value="row.category ?? undefined"
                  placeholder="Select category"
                  size="xs"
                  class="w-full"
                  :disabled="props.readonly || !row.isNewItem"
                  @update:model-value="(value) => emit('category-change', index, value as string | null)"
                />
              </div>
            </div>
            
            <!-- Item Type -->
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Item Type</span>
              <ItemTypeSelect
                :model-value="row.item_type_uuid ?? undefined"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="props.corporationUuid"
                :project-uuid="props.projectUuid"
                :category="row.category || undefined"
                :item-division-uuid="row.item_division_uuid || undefined"
                :disabled="isCoItemTypeSelectDisabled(row)"
                @update:model-value="(value) => emit('item-type-change', index, value as string | null)"
                @change="(option) => emit('item-type-change', index, (option?.value || option?.uuid) as string | null, option)"
              />
            </div>
            
            <!-- Item/Sequence -->
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Item</span>
              <SequenceSelect
                :model-value="row.item_uuid ?? undefined"
                size="xs"
                class="w-full min-w-0 text-left"
                :corporation-uuid="props.corporationUuid"
                :project-uuid="props.projectUuid"
                :item-type-uuid="row.item_type_uuid || undefined"
                :category="row.isNewItem ? (row.category || undefined) : undefined"
                :item-division-uuid="row.isNewItem ? (row.item_division_uuid || undefined) : undefined"
                :disabled="isCoItemSelectDisabled(row)"
                @change="(payload) => emit('sequence-change', index, payload?.value as string | null, payload?.option)"
              />
              <ItemSelect
                :model-value="row.item_uuid ?? undefined"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="props.corporationUuid"
                :project-uuid="props.projectUuid"
                :cost-code-uuid="row.cost_code_uuid"
                :item-type-uuid="row.item_type_uuid"
                :category="row.isNewItem ? (row.category || undefined) : undefined"
                :item-division-uuid="row.isNewItem ? (row.item_division_uuid || undefined) : undefined"
                :disabled="isCoItemSelectDisabled(row)"
                @update:model-value="(value) => emit('item-change', index, value as string | null)"
                @change="(payload) => emit('item-change', index, payload.value as string | null, payload.option)"
              />
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Description</span>
              <template v-if="!props.readonly && !showInvoiceValues">
                <UPopover
                  :open="activeDescriptionCellKey === `mobile-${index}`"
                  @update:open="(open) => {
                    if (open) openDescriptionEditor(index, row.description, 'mobile')
                    else closeDescriptionEditor()
                  }"
                  :content="{ side: 'top', align: 'start' }"
                  :ui="{ content: 'w-[min(640px,92vw)] p-3 bg-white dark:bg-gray-900 border border-info/20' }"
                >
                  <button type="button" class="w-full text-left rounded-md border border-default px-2 py-1.5 hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" @click="openDescriptionEditor(index, row.description, 'mobile')">
                    <div class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0" v-html="getDescriptionPreviewHtml(row.description)" />
                  </button>
                  <template #content>
                    <div class="space-y-2">
                      <div class="flex items-center gap-1 border-b border-default pb-2">
                        <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBold().run()" />
                        <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleItalic().run()" />
                        <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBulletList().run()" />
                        <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleOrderedList().run()" />
                      </div>
                      <div class="max-h-[280px] overflow-y-auto rounded-md border border-default px-3 py-2">
                        <EditorContent :editor="descriptionEditor" />
                      </div>
                    </div>
                  </template>
                </UPopover>
              </template>
              <div
                v-else
                class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                v-html="getDescriptionPreviewHtml(row.description)"
              />
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">UOM</span>
              <UOMSelect
                :model-value="row.unit_uuid ?? row.uom_uuid ?? undefined"
                size="xs"
                class="w-full text-left"
                :corporation-uuid="props.corporationUuid"
                :disabled="props.readonly"
                @update:model-value="(value) => emit('uom-change', index, value as string | null)"
                @change="(option) => emit('uom-change', index, (option?.value ?? option?.uom?.uuid ?? option?.uuid) as string | null, option)"
              />
            </div>
            <!-- Location -->
            <div v-if="!props.hideLocation">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80 mb-1">Location</span>
              <LocationSelect
                :model-value="row.location_uuid ?? undefined"
                :locations="scopedLocationsWithSelected"
                placeholder="Select location"
                size="xs"
                class-name="w-full"
                :disabled="props.readonly"
                @update:model-value="(value) => emit('location-change', index, value as string | null)"
                @change="(option) => emit('location-change', index, (option?.value ?? option?.uuid) as string | null, option)"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs text-default">
            <div v-if="!props.hideApprovalChecks" class="col-span-2 space-y-1">
              <div class="flex items-center gap-1">
                <span class="block text-[11px] uppercase tracking-wide text-muted/80">Approval Checks</span>
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="2xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  @click.stop="openQuickAddApprovalCheck"
                />
              </div>
              <ApprovalChecksSelect
                :model-value="row.approval_checks ?? []"
                size="xs"
                class="w-full text-left"
                :disabled="props.readonly"
                @update:model-value="(value) => emitApprovalChecksChange(index, value)"
                @change="(options) => emitApprovalChecksChange(index, options.map(opt => opt.value))"
              />
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Orig Unit</span>
              <div class="font-mono">{{ formatCurrency(row.unit_price) }}</div>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Orig Qty</span>
              <div class="font-mono">{{ formatQuantity(row.quantity) }}</div>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">Orig Total</span>
              <div class="font-mono">{{ formatCurrency(row.total) }}</div>
            </div>
            <div v-if="showInvoiceValues">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">To Be Invoiced</span>
              <div class="font-mono text-sm leading-none tracking-tight text-default text-right">
                {{ formatQuantity(row.to_be_invoiced) }}
              </div>
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">CO Unit</span>
              <!-- CO Unit Price (greyed out when showInvoiceValues is true) -->
              <div
                v-if="showInvoiceValues"
                class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 max-w-[180px] text-right"
              >
                <span class="font-mono text-sm leading-none tracking-tight text-muted">
                  {{ formatCurrency(row.co_unit_price) }}
                </span>
              </div>
              <!-- Editable CO Unit Price (when showInvoiceValues is false) or Invoice Unit Price (when showInvoiceValues is true) -->
              <UInput
                v-if="!showInvoiceValues"
                :model-value="coDrafts[index]?.unitPriceInput ?? toInputStringWithZeroPlaceholder(row.co_unit_price)"
                size="xs"
                inputmode="decimal"
                :disabled="props.readonly"
                placeholder="0"
                class="w-full max-w-[140px]"
                :ui="{ 
                  base: 'text-right font-mono',
                }"
                @keydown="preventUnitPriceKeydown"
                @paste="preventUnitPricePaste"
                @update:model-value="(value) => onCoUnitPriceInput(index, value)"
              />
              <UInput
                v-else
                :model-value="invoiceDrafts[index]?.unitPriceInput ?? toInputString((row.invoice_unit_price !== null && row.invoice_unit_price !== undefined) ? row.invoice_unit_price : null)"
                size="xs"
                inputmode="decimal"
                :disabled="props.readonly"
                placeholder="0"
                class="w-full max-w-[140px]"
                :ui="{ 
                  base: 'text-right font-mono',
                }"
                @keydown="preventUnitPriceKeydown"
                @paste="preventUnitPricePaste"
                @update:model-value="(value) => onInvoiceUnitPriceInput(index, value)"
              />
            </div>
            <div>
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">CO Qty</span>
              <!-- CO Quantity (greyed out when showInvoiceValues is true) -->
              <UInput
                v-if="showInvoiceValues"
                :model-value="formatQuantity(row.co_quantity)"
                size="xs"
                class="text-right font-mono"
                :ui="{ base: 'bg-gray-100 dark:bg-gray-800/40 border border-transparent' }"
                disabled
              />
              <!-- Editable CO Quantity (when showInvoiceValues is false) or Invoice Quantity (when showInvoiceValues is true) -->
              <UInput
                v-if="!showInvoiceValues"
                :model-value="coDrafts[index]?.quantityInput ?? toInputStringWithZeroPlaceholder(row.co_quantity)"
                size="xs"
                inputmode="decimal"
                class="text-right font-mono"
                :disabled="props.readonly"
                @keydown="preventQuantityKeydown"
                @paste="preventQuantityPaste"
                @update:model-value="(value) => onCoQuantityInput(index, value)"
              />
              <UInput
                v-else
                :model-value="invoiceDrafts[index]?.quantityInput ?? toInputString((row.invoice_quantity !== null && row.invoice_quantity !== undefined) ? row.invoice_quantity : null)"
                size="xs"
                inputmode="decimal"
                class="text-right font-mono"
                :disabled="props.readonly"
                @keydown="preventQuantityKeydown"
                @paste="preventQuantityPaste"
                @update:model-value="(value) => onInvoiceQuantityInput(index, value)"
              />
            </div>
            <div class="col-span-2">
              <span class="block text-[11px] uppercase tracking-wide text-muted/80">CO Total</span>
              <!-- CO Total (greyed out when showInvoiceValues is true) -->
              <div
                v-if="showInvoiceValues"
                class="rounded-md border border-transparent bg-gray-100 dark:bg-gray-800/40 px-3 py-1.5 text-right"
              >
                <span class="font-mono text-sm leading-none tracking-tight text-muted">
                  {{ formatCurrency(computeCoTotal(row, index)) }}
                </span>
              </div>
              <!-- Editable CO Total (when showInvoiceValues is false) or Invoice Total (when showInvoiceValues is true) -->
              <div class="rounded-md border border-transparent bg-background dark:bg-gray-900/60 px-3 py-1.5 text-right">
                <span class="font-mono text-sm leading-none tracking-tight">
                  {{ showInvoiceValues ? formatCurrency(computeInvoiceTotal(row, index)) : formatCurrency(computeCoTotal(row, index)) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <slot name="actions" :row="row" :index="index">
              <UButton
                icon="i-heroicons-minus"
                variant="soft"
                color="error"
                size="xs"
                :disabled="props.readonly"
                @click.stop="emitRemoveRow(index)"
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
import { computed, reactive, ref, unref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import ApprovalChecksSelect from '~/components/shared/ApprovalChecksSelect.vue'
import { useApprovalChecksStore } from '~/stores/approvalChecks'
import CostCodeSelect from '~/components/shared/CostCodeSelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import ItemSelect from '~/components/shared/ItemSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import UOMSelect from '~/components/shared/UOMSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import SequenceSelect from '~/components/shared/SequenceSelect.vue'

interface OriginalItemDisplay {
  id?: string | number
  name?: string
  description?: string
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  cost_code_uuid?: string | null
  item_type_uuid?: string | null
  item_type_label?: string | null
  item_uuid?: string | null
  sequence?: string | null
  approval_checks?: string[]
  unit_price?: number | string | null
  quantity?: number | string | null
  total?: number | string | null
  co_unit_price?: number | string | null
  co_quantity?: number | string | null
  co_total?: number | string | null
  invoice_unit_price?: number | string | null
  invoice_quantity?: number | string | null
  invoice_total?: number | string | null
  to_be_invoiced?: number | string | null
  isNewItem?: boolean
  [key: string]: any
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  items: OriginalItemDisplay[]
  loading?: boolean
  error?: string | null
  loadingMessage?: string
  emptyMessage?: string
  readonly?: boolean
  showInvoiceValues?: boolean
  hideApprovalChecks?: boolean
  hideLocation?: boolean
  corporationUuid?: string
  projectUuid?: string
  scopedLocations?: any[]
}>(), {
  title: 'Change Order Items',
  description: 'Original order shown for reference. Enter change order values.',
  items: () => [],
  loading: false,
  error: null,
  loadingMessage: 'Loading original order…',
  emptyMessage: 'No original order items found.',
  showInvoiceValues: false,
  hideApprovalChecks: false,
  hideLocation: false,
  scopedLocations: undefined,
})

const emit = defineEmits<{
  (e: 'co-unit-price-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'co-quantity-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'invoice-unit-price-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'invoice-quantity-change', payload: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }): void
  (e: 'invoice-total-change', payload: { index: number; value: number }): void
  (e: 'approval-checks-change', payload: { index: number; value: string[] }): void
  (e: 'remove-row', index: number): void
  (e: 'add-row'): void
  (e: 'cost-code-change', index: number, value: string | null, option?: any): void
  (e: 'item-type-change', index: number, value: string | null, option?: any): void
  (e: 'item-change', index: number, value: string | null, option?: any): void
  (e: 'uom-change', index: number, value: string | null, option?: any): void
  (e: 'location-change', index: number, value: string | null, option?: any): void
  (e: 'category-change', index: number, value: string | null): void
  (e: 'item-division-change', index: number, value: string | null, option?: any): void
  (e: 'sequence-change', index: number, value: string | null, option?: any): void
  (e: 'description-change', payload: { index: number; value: string }): void
}>()

const hasItems = computed(() => Array.isArray(props.items) && props.items.length > 0)
const scopedLocations = computed(() => props.scopedLocations || [])
const scopedLocationsWithSelected = computed(() => {
  const base = Array.isArray(scopedLocations.value) ? [...scopedLocations.value] : []
  const existing = new Set(base.map((loc: any) => String(loc?.uuid || '').trim()).filter(Boolean))
  for (const item of props.items || []) {
    const uuid = String(item?.location_uuid || '').trim()
    if (!uuid || existing.has(uuid)) continue
    base.push({
      uuid,
      location_name: item?.location_label || item?.location || uuid,
    })
    existing.add(uuid)
  }
  return base
})
const { formatCurrency, currencySymbol } = useCurrencyFormat()
const currencySymbolText = computed(() => unref(currencySymbol) || '')

/** New manual CO rows: category first; PO-sourced rows: cost code gates item type/item */
const isCoItemTypeSelectDisabled = (row: any) => {
  if (props.readonly) return true
  if (row?.isNewItem) return !row?.category
  return !row?.cost_code_uuid
}

const isCoItemSelectDisabled = (row: any) => {
  if (props.readonly) return true
  if (row?.isNewItem) {
    return !row?.category || !row?.item_type_uuid
  }
  return !row?.cost_code_uuid
}

// Derive human-readable project location name from locations store when needed
import { useLocationsStore } from '~/stores/locations'
import { useUOMStore } from '~/stores/uom'

const locationsStore = useLocationsStore()
const uomStore = useUOMStore()
const locationsByUuid = computed(() => {
  const all = (locationsStore.getAll as any) || (locationsStore as any).locations || []
  const map = new Map<string, any>()
  if (Array.isArray(all)) {
    all.forEach((loc: any) => {
      if (loc?.uuid) {
        map.set(loc.uuid, loc)
      }
    })
  }
  return map
})

const isUuidLike = (value: any) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  )
}

const getLocationDisplayLabel = (row: any): string => {
  const raw = (row?.location_label ?? '') as string
  // If we already have a non-UUID-looking label, use it as-is
  if (raw && !isUuidLike(raw)) return raw

  const uuid = row?.location_uuid as string | undefined
  if (uuid && locationsByUuid.value.has(uuid)) {
    const loc = locationsByUuid.value.get(uuid)
    if (loc) {
      return loc.location_code
        ? `${loc.location_name} (${loc.location_code})`
        : loc.location_name
    }
  }

  return raw || ''
}

const getUomDisplayLabel = (row: any): string => {
  const direct = row?.uom || row?.unit_label || row?.unit || ''
  if (direct) return String(direct)

  const unitUuid = row?.unit_uuid || row?.uom_uuid || null
  if (unitUuid) {
    const u = uomStore.getUOMByUuid(unitUuid)
    if (u) return u.short_name || u.uom_name || ''
  }
  return ''
}


watch(
  () => props.corporationUuid,
  async (corporationUuid) => {
    const corp = String(corporationUuid || '').trim()
    if (!corp) return
    if (!Array.isArray(uomStore.uom) || uomStore.uom.length === 0) {
      try {
        await uomStore.fetchUOM(corp)
      } catch (error) {
        console.warn('[COItemsTableFromOriginal] Failed to fetch UOM list', error)
      }
    }
  },
  { immediate: true }
)

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
  descriptionEditor.value?.commands.setContent(String(currentValue || ''))
}
const closeDescriptionEditor = () => {
  activeDescriptionCellKey.value = null
  activeDescriptionIndex.value = null
}
const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : String(value)
}
const normalizeUnitPriceInput = (value: any): string => {
  const normalized = toInputString(value).replace(/,/g, '').trim()
  if (!normalized) return ''
  if (!/^\d*\.?\d*$/.test(normalized)) return ''
  const [integerPart, decimalPart = ''] = normalized.split('.')
  if (!normalized.includes('.')) return integerPart
  return `${integerPart}.${decimalPart.slice(0, 2)}`
}
// Helper to show "0" as placeholder when value is null/undefined (for initial display)
const toInputStringWithZeroPlaceholder = (value: any): string => {
  if (value === null || value === undefined) return '0'
  return typeof value === 'number' ? String(value) : String(value)
}

/** Digits and at most one decimal separator (aligned with PO quantity behavior). */
const sanitizeQuantityInput = (raw: string): string => {
  const normalized = raw.replace(/,/g, '').trim()
  if (!normalized) return ''
  const only = normalized.replace(/[^\d.]/g, '')
  const firstDot = only.indexOf('.')
  if (firstDot === -1) return only
  return only.slice(0, firstDot + 1) + only.slice(firstDot + 1).replace(/\./g, '')
}

const preventQuantityKeydown = (event: KeyboardEvent) => {
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

const preventQuantityPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const normalized = pastedText.trim()
  if (!/^\d*\.?\d*$/.test(normalized)) {
    event.preventDefault()
  }
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
// Get numeric value for CO unit price for UInputNumber
const getCoUnitPriceNumericValue = (index: number, row: any): number | null => {
  // If draft exists, use it
  if (coDrafts[index]?.unitPriceInput !== undefined) {
    // If empty string, user cleared it - return null (will show placeholder)
    if (coDrafts[index].unitPriceInput === '') {
      return null
    }
    const num = parseNumericInput(coDrafts[index].unitPriceInput)
    return Number.isFinite(num) ? num : null
  }
  // If row has a value, use it
  if (row.co_unit_price !== null && row.co_unit_price !== undefined) {
    const num = parseNumericInput(row.co_unit_price)
    return Number.isFinite(num) ? num : null
  }
  // Initial state: return null to show placeholder "0"
  return null
}
// Get numeric value for invoice unit price for UInputNumber
const getInvoiceUnitPriceNumericValue = (index: number, row: any): number | null => {
  if (invoiceDrafts[index]?.unitPriceInput !== undefined && invoiceDrafts[index].unitPriceInput !== '') {
    const num = parseNumericInput(invoiceDrafts[index].unitPriceInput)
    return num > 0 ? num : null
  }
  if (row.invoice_unit_price !== null && row.invoice_unit_price !== undefined) {
    const num = parseNumericInput(row.invoice_unit_price)
    return num > 0 ? num : null
  }
  return null
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

const coDrafts = reactive<Record<number, { unitPriceInput: string; quantityInput: string }>>({})
const invoiceDrafts = reactive<Record<number, { unitPriceInput: string; quantityInput: string }>>({})
const showInvoiceValues = computed(() => props.showInvoiceValues === true)

const displayRows = computed(() => {
  return (props.items || []).map((row, index) => {
    // Initialize CO drafts - use "0" as placeholder for null/undefined values
    const coDraft = coDrafts[index] || (coDrafts[index] = {
      unitPriceInput: toInputStringWithZeroPlaceholder(row.co_unit_price),
      quantityInput: toInputStringWithZeroPlaceholder(row.co_quantity),
    })
    // Keep CO drafts in sync if row value changes from null/undefined to a real value
    // Only update if draft is still the placeholder "0" and row now has a value
    if (coDraft.unitPriceInput === '0' && row.co_unit_price !== null && row.co_unit_price !== undefined && row.co_unit_price !== 0) {
      // If draft is "0" placeholder but row has a non-zero value, update it
      coDraft.unitPriceInput = toInputString(row.co_unit_price)
    } else if (coDraft.unitPriceInput === '' && toInputString(row.co_unit_price) !== '') {
      // If draft is empty but row has a value, update it
      coDraft.unitPriceInput = toInputString(row.co_unit_price)
    }
    if (coDraft.quantityInput === '0' && row.co_quantity !== null && row.co_quantity !== undefined && row.co_quantity !== 0) {
      // If draft is "0" placeholder but row has a non-zero value, update it
      coDraft.quantityInput = toInputString(row.co_quantity)
    } else if (coDraft.quantityInput === '' && toInputString(row.co_quantity) !== '') {
      // If draft is empty but row has a value, update it
      coDraft.quantityInput = toInputString(row.co_quantity)
    }
    
    // Initialize invoice drafts if showInvoiceValues is enabled
    if (showInvoiceValues.value) {
      // Use invoice values if they are explicitly set (not null/undefined), otherwise show empty
      // This ensures that:
      // - New invoices: invoice_unit_price/invoice_quantity will be null, so we show empty fields
      // - Existing invoices: invoice_unit_price/invoice_quantity will have saved values or null
      // - Don't fall back to CO values for new invoices - user should enter invoice values manually
      const invoiceUnitInput = (row.invoice_unit_price !== null && row.invoice_unit_price !== undefined)
        ? toInputString(row.invoice_unit_price)
        : ''
      const invoiceQuantityInput = (row.invoice_quantity !== null && row.invoice_quantity !== undefined)
        ? toInputString(row.invoice_quantity)
        : ''
      
      const invoiceDraft = invoiceDrafts[index] || (invoiceDrafts[index] = {
        unitPriceInput: invoiceUnitInput,
        quantityInput: invoiceQuantityInput,
      })
      
      // Keep invoice drafts in sync if untouched
      if (invoiceDraft.unitPriceInput === '' && invoiceUnitInput !== '') {
        invoiceDraft.unitPriceInput = invoiceUnitInput
      }
      if (invoiceDraft.quantityInput === '' && invoiceQuantityInput !== '') {
        invoiceDraft.quantityInput = invoiceQuantityInput
      }
    }
    
    return row
  })
})

const computeCoTotal = (row: OriginalItemDisplay, index?: number): number => {
  const d = index !== undefined ? coDrafts[index] : undefined
  if (d) {
    const unit = parseNumericInput(d.unitPriceInput)
    const qty = parseNumericInput(d.quantityInput)
    return roundCurrency(unit * qty)
  }
  const unitStored = parseNumericInput(row.co_unit_price)
  const qtyStored = parseNumericInput(row.co_quantity)
  const storedTotal = parseNumericInput(row.co_total)
  if (unitStored || qtyStored) {
    return roundCurrency(unitStored * qtyStored)
  }
  if (storedTotal) return roundCurrency(storedTotal)
  return 0
}

const computeInvoiceTotal = (row: OriginalItemDisplay, index?: number): number => {
  if (!showInvoiceValues.value) return 0
  
  const d = index !== undefined ? invoiceDrafts[index] : undefined
  if (d) {
    const unit = parseNumericInput(d.unitPriceInput)
    const qty = parseNumericInput(d.quantityInput)
    // If draft has non-zero values, use them
    if (unit > 0 && qty > 0) {
      return roundCurrency(unit * qty)
    }
    // If draft values are 0 or empty, check invoice_total before returning 0
    if (row.invoice_total !== null && row.invoice_total !== undefined) {
      const storedTotal = parseNumericInput(row.invoice_total)
      if (storedTotal > 0) {
        return roundCurrency(storedTotal)
      }
    }
    // Draft exists but values are 0/empty and no invoice_total, return 0
    return 0
  }
  
  // No draft - check if invoice values are explicitly set (not null/undefined)
  // For new invoices, invoice_unit_price and invoice_quantity are null, so don't fall back to CO values
  const hasInvoiceUnitPrice = row.invoice_unit_price !== null && row.invoice_unit_price !== undefined
  const hasInvoiceQuantity = row.invoice_quantity !== null && row.invoice_quantity !== undefined
  
  if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
    const unitStored = parseNumericInput(row.invoice_unit_price)
    const qtyStored = parseNumericInput(row.invoice_quantity)
    if (unitStored > 0 && qtyStored > 0) {
      return roundCurrency(unitStored * qtyStored)
    }
  }
  
  // If invoice_total is explicitly set (not null/undefined), use it
  if (row.invoice_total !== null && row.invoice_total !== undefined) {
    const storedTotal = parseNumericInput(row.invoice_total)
    if (storedTotal > 0) {
      return roundCurrency(storedTotal)
    }
  }
  
  // For new invoices, return 0 instead of falling back to CO values
  return 0
}

const onCoUnitPriceInput = (index: number, value: string | number | null | undefined) => {
  if (props.readonly || showInvoiceValues.value) return
  const d = coDrafts[index] || (coDrafts[index] = { unitPriceInput: '', quantityInput: '' })
  d.unitPriceInput = normalizeUnitPriceInput(value)
  const unit = parseNumericInput(d.unitPriceInput)
  const qty = parseNumericInput(d.quantityInput)
  const computedTotal = roundCurrency(unit * qty)
  emit('co-unit-price-change', { index, value: d.unitPriceInput, numericValue: unit, computedTotal })
}
// Handler for UInputNumber - receives numeric value
const onCoUnitPriceNumberChange = (index: number, value: number | null) => {
  if (props.readonly || showInvoiceValues.value) return
  onCoUnitPriceInput(index, value === null ? '' : String(value))
}
// Handler for invoice unit price UInputNumber
const onInvoiceUnitPriceNumberChange = (index: number, value: number | null) => {
  if (props.readonly || !showInvoiceValues.value) return
  onInvoiceUnitPriceInput(index, value === null ? '' : String(value))
}

const onCoQuantityInput = (index: number, value: string | number | null | undefined) => {
  if (props.readonly || showInvoiceValues.value) return
  const d = coDrafts[index] || (coDrafts[index] = { unitPriceInput: '', quantityInput: '' })
  d.quantityInput = sanitizeQuantityInput(toInputString(value))
  const qty = parseNumericInput(d.quantityInput)
  const unit = parseNumericInput(d.unitPriceInput)
  const computedTotal = roundCurrency(unit * qty)
  emit('co-quantity-change', { index, value: d.quantityInput, numericValue: qty, computedTotal })
}

const onInvoiceUnitPriceInput = (index: number, value: string | number | null | undefined) => {
  if (props.readonly || !showInvoiceValues.value) return
  const row = props.items[index]
  const invoiceUnitInput = (row?.invoice_unit_price !== null && row?.invoice_unit_price !== undefined)
    ? toInputString(row.invoice_unit_price)
    : ''
  const invoiceQuantityInput = (row?.invoice_quantity !== null && row?.invoice_quantity !== undefined)
    ? toInputString(row.invoice_quantity)
    : ''
  const d = invoiceDrafts[index] || (invoiceDrafts[index] = {
    unitPriceInput: invoiceUnitInput,
    quantityInput: invoiceQuantityInput,
  })
  d.unitPriceInput = normalizeUnitPriceInput(value)
  const unit = parseNumericInput(d.unitPriceInput)
  const qty = parseNumericInput(d.quantityInput)
  const computedTotal = roundCurrency(unit * qty)
  emit('invoice-unit-price-change', { index, value: d.unitPriceInput, numericValue: unit, computedTotal })
  emit('invoice-total-change', { index, value: computedTotal })
}

// Check if an item has invoice quantity greater than to_be_invoiced
const isOverInvoiced = (row: OriginalItemDisplay, index: number): boolean => {
  if (!showInvoiceValues.value) return false
  const toBeInvoiced = parseNumericInput(row.to_be_invoiced ?? 0)
  if (toBeInvoiced <= 0) return false // No limit if to_be_invoiced is 0 or negative
  
  // Check both the draft value and the actual row value
  const draftValue = invoiceDrafts[index]?.quantityInput
  const currentValue = row.invoice_quantity
  
  // Parse draft value if it exists
  if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
    const draftNumeric = parseNumericInput(draftValue)
    if (draftNumeric > toBeInvoiced) return true
  }
  
  // Parse current value
  const currentNumeric = parseNumericInput(currentValue)
  return currentNumeric > toBeInvoiced
}

const onInvoiceQuantityInput = (index: number, value: string | number | null | undefined) => {
  if (props.readonly || !showInvoiceValues.value) return
  const row = props.items[index]
  const invoiceUnitInput = (row?.invoice_unit_price !== null && row?.invoice_unit_price !== undefined)
    ? toInputString(row.invoice_unit_price)
    : ''
  const invoiceQuantityInput = (row?.invoice_quantity !== null && row?.invoice_quantity !== undefined)
    ? toInputString(row.invoice_quantity)
    : ''
  const d = invoiceDrafts[index] || (invoiceDrafts[index] = {
    unitPriceInput: invoiceUnitInput,
    quantityInput: invoiceQuantityInput,
  })
  d.quantityInput = sanitizeQuantityInput(toInputString(value))
  const qty = parseNumericInput(d.quantityInput)
  const unit = parseNumericInput(d.unitPriceInput)
  const computedTotal = roundCurrency(unit * qty)
  emit('invoice-quantity-change', { index, value: d.quantityInput, numericValue: qty, computedTotal })
  emit('invoice-total-change', { index, value: computedTotal })
}

const emitApprovalChecksChange = (index: number, value: string[]) => {
  if (props.readonly) return
  emit('approval-checks-change', { index, value: value || [] })
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

const emitRemoveRow = (index: number) => {
  if (props.readonly) return
  emit('remove-row', index)
}

// Expose drafts and other methods for testing
// Expose coDrafts as 'drafts' for backward compatibility with tests
// Tests access vm.drafts when showInvoiceValues is false (default), which should be coDrafts
defineExpose({
  drafts: coDrafts, // Expose coDrafts as 'drafts' for backward compatibility
  coDrafts,
  invoiceDrafts,
  computeCoTotal,
  computeInvoiceTotal,
  formatCurrencyInput,
  formatQuantity,
  parseNumericInput,
  toInputString,
  normalizeUnitPriceInput,
  sanitizeQuantityInput,
  preventQuantityKeydown,
  preventQuantityPaste,
  preventUnitPriceKeydown,
  preventUnitPricePaste,
  roundCurrency,
  onCoUnitPriceInput,
  onCoQuantityInput,
  onInvoiceUnitPriceInput,
  onInvoiceQuantityInput,
  emitApprovalChecksChange,
  emitRemoveRow,
  showQuickAddApprovalCheck,
  savingApprovalCheck,
  quickApprovalCheckForm,
  openQuickAddApprovalCheck,
  closeQuickAddApprovalCheck,
  saveQuickApprovalCheck,
})

onBeforeUnmount(() => {
  if (descriptionEditor.value && typeof descriptionEditor.value.destroy === 'function') {
    descriptionEditor.value.destroy()
  }
})
</script>

<style scoped>
</style>


