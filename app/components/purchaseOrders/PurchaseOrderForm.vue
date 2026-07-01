<template>
  <div class="flex flex-col">
    <!-- Main Content Area -->
    <div class="flex-1 flex min-h-0">
      <!-- Left Panel: Main Form -->
      <div ref="leftPanel" class="flex-1 flex flex-col w-full">
        <div class="mb-3 flex flex-col gap-4">
          <!-- Header Section -->
          <UCard variant="soft" class="mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            <!-- Skeleton Loaders -->
            <template v-if="loading">
              <!-- Corporation -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Project Name -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Ship To -->
              <div>
                <USkeleton class="h-3 w-16 mb-1" />
                <USkeleton class="h-[50px] w-full" />
              </div>
              <!-- PO Number -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- PO Type -->
              <div>
                <USkeleton class="h-3 w-16 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Vendor Name -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Vendor Address -->
              <div>
                <USkeleton class="h-3 w-28 mb-1" />
                <USkeleton class="h-[50px] w-full" />
              </div>
              <!-- Shipping Instructions -->
              <div>
                <USkeleton class="h-3 w-40 mb-1" />
                <USkeleton class="h-16 w-full" />
              </div>
              <!-- Credit Days -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Ship Via -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Freight -->
              <div>
                <USkeleton class="h-3 w-16 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Entry Date -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Est Delivery Date -->
              <div>
                <USkeleton class="h-3 w-32 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Include Items -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Estimate Details -->
              <div v-if="shouldShowEstimateDetails">
                <USkeleton class="h-3 w-32 mb-1" />
                <USkeleton class="h-[50px] w-full" />
              </div>
            </template>
            
            <!-- Actual Form Fields -->
            <template v-else>
            <!-- Corporation -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Corporation <span class="text-red-500">*</span>
              </label>
              <CorporationSelect
                :model-value="form.corporation_uuid"
                :disabled="props.readonly"
                placeholder="Select corporation"
                size="sm"
                class="w-full"
                @update:model-value="handleCorporationChange"
              />
            </div>

            <!-- Project Name -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Project Name
                <span v-if="isProjectPurchaseOrder" class="text-red-500">*</span>
              </label>
              <ProjectSelect
                v-if="isProjectPurchaseOrder"
                :model-value="form.project_uuid"
                :corporation-uuid="props.form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :disabled="!props.form.corporation_uuid && !corpStore.selectedCorporation || props.readonly"
                placeholder="Select project"
                size="sm"
                class="w-full"
                @update:model-value="handleProjectChange"
              />
              <div v-else class="p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-muted min-h-[50px] border border-default">
                Custom purchase orders do not require a project.
              </div>
            </div>

            <!-- Ship To (project shipment addresses; dropdown when multiple) -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Ship To
              </label>
              <template v-if="isProjectPurchaseOrder">
                <USelectMenu
                  v-if="showShipToAddressDropdown"
                  :model-value="shipToSelectModelValue"
                  :items="shipToAddressSelectItems"
                  placeholder="Select shipping address"
                  size="sm"
                  class="w-full"
                  value-key="value"
                  :filter-fields="['searchText', 'label']"
                  searchable
                  :disabled="props.readonly"
                  :ui="shipToAddressSelectMenuUi"
                  @update:model-value="onShipToSelectUpdate"
                >
                  <template #default>
                    <div
                      v-if="shipToAddressTriggerLines.length"
                      class="flex-1 min-w-0 text-left text-xs leading-snug whitespace-normal line-clamp-5"
                    >
                      <div v-for="(line, idx) in shipToAddressTriggerLines" :key="idx">
                        {{ line }}
                      </div>
                    </div>
                    <span v-else class="text-muted">Select shipping address</span>
                  </template>
                  <template #item-label="{ item }">
                    <div class="py-1.5 text-left text-xs leading-snug text-default whitespace-normal max-w-lg">
                      <div v-for="(line, idx) in item.lines || []" :key="idx">
                        {{ line }}
                      </div>
                    </div>
                  </template>
                </USelectMenu>
                <div
                  v-else
                  data-ship-to-summary
                  class="p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-muted min-h-[50px] border border-default"
                >
                  {{ activeProjectAddressText || 'No address selected' }}
                </div>
              </template>
              <UTextarea
                v-else
                :model-value="form.shipping_address_custom || ''"
                placeholder="Enter ship to address"
                size="sm"
                :rows="3"
                class="w-full text-xs"
                :disabled="props.readonly"
                autoresize
                @update:model-value="(value) => handleFormUpdate('shipping_address_custom', value ?? '')"
              />
            </div>

            <!-- PO Number -->
          <div>
            <label class="block text-xs font-medium text-default mb-1">
              PO Number <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center">
              <span
                v-if="selectedProjectId"
                class="inline-flex items-center px-2.5 h-8 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md whitespace-nowrap"
              >
                {{ selectedProjectId }}-
              </span>
              <UInput
                :model-value="poNumberSuffix"
                placeholder="Enter PO number"
                size="sm"
                class="w-full"
                :class="selectedProjectId ? '[&_input]:rounded-l-none' : ''"
                :disabled="props.readonly"
                icon="i-heroicons-hashtag"
                @update:model-value="(value) => handleFormUpdate('po_number', value ?? '')"
              />
            </div>
          </div>

            <!-- PO Type -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                PO Type <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="poTypeOption"
                :items="poTypeOptions"
                placeholder="Select PO type"
                size="sm"
                class="w-full"
                value-key="value"
                :disabled="props.readonly"
              />
            </div>

          <!-- Vendor Name -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-default">
                Vendor Name <span class="text-red-500">*</span>
              </label>
              <UBadge
                v-if="!props.readonly"
                color="primary"
                variant="solid"
                size="xs"
                class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                title="Add vendor"
                @click="openAddVendorModal"
              >
                <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                Add
              </UBadge>
            </div>
            <div class="flex items-center gap-2">
              <VendorSelect
                ref="vendorSelectRef"
                :model-value="form.vendor_uuid"
                :corporation-uuid="props.form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :disabled="!props.form.corporation_uuid && !corpStore.selectedCorporation || props.readonly"
                :show-add-button="!props.readonly"
                placeholder="Select vendor"
                size="sm"
                class="flex-1 min-w-0"
                @update:model-value="handleVendorChange"
                @change="handleVendorChange"
              />
              <PoFromCurrencySelect
                v-if="!loading"
                v-model="poCurrencyFrom"
                :disabled="props.readonly"
                size="sm"
                select-class="w-28 shrink-0"
              />
            </div>
          </div>

            <!-- Vendor Address -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Vendor Address
              </label>
              <div class="relative p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-muted min-h-[50px] border border-default group hover:border-primary-400 dark:hover:border-primary-600 transition-colors cursor-pointer">
                <div :class="props.form.vendor_uuid && !props.readonly ? 'pr-8' : ''">
                {{ vendorAddressText || 'No vendor selected' }}
                </div>
                <UButton
                  v-if="props.form.vendor_uuid && !props.readonly"
                  icon="tdesign:edit-filled"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="openVendorEditModal"
                  title="Edit vendor address"
                  class="absolute top-2 right-2 transition-all group-hover:!bg-primary-100 group-hover:!text-primary-600 group-hover:scale-110 dark:group-hover:!bg-primary-900 dark:group-hover:!text-primary-400"
                />
              </div>
            </div>

            <!-- Shipping Instructions -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Shipping Instructions
              </label>
              <UTextarea
                :model-value="form.shipping_instructions"
                placeholder="Enter shipping instructions"
                size="sm"
                :rows="3"
                class="w-full"
                :disabled="props.readonly"
                autoresize
                @update:model-value="(value) => handleFormUpdate('shipping_instructions', value ?? '')"
              />
            </div>

            <!-- Freight -->
            <div v-if="!isLaborPurchaseOrder">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium text-default">
                  Freight
                </label>
                <UBadge
                  v-if="!props.readonly"
                  color="primary"
                  variant="solid"
                  size="xs"
                  class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  title="Add freight"
                  @click="freightSelectRef?.openAddModal()"
                >
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                  Add
                </UBadge>
              </div>
              <FreightSelect
                ref="freightSelectRef"
                :model-value="freightSelectModelValue"
                size="sm"
                class="w-full"
                :disabled="props.readonly"
                :show-add-button="!props.readonly"
                :force-api-fetch="nimbleFreightShipViaStrictApi"
                @update:model-value="onFreightModelUpdate"
              />
            </div>

            <!-- Ship Via -->
            <div v-if="!isLaborPurchaseOrder">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium text-default">
                  Ship Via
                </label>
                <UBadge
                  v-if="!props.readonly"
                  color="primary"
                  variant="solid"
                  size="xs"
                  class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                  title="Add ship via"
                  @click="shipViaSelectRef?.openAddModal()"
                >
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                  Add
                </UBadge>
              </div>
              <ShipViaSelect
                ref="shipViaSelectRef"
                :model-value="shipViaSelectModelValue"
                size="sm"
                class="w-full"
                :disabled="props.readonly"
                :show-add-button="!props.readonly"
                :force-api-fetch="nimbleFreightShipViaStrictApi"
                @update:model-value="onShipViaModelUpdate"
              />
            </div>

            <!-- Entry Date -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Entry Date
              </label>
              <UPopover v-model:open="entryDatePopoverOpen" :disabled="props.readonly">
                <UButton 
                  color="neutral" 
                  variant="outline" 
                  icon="i-heroicons-calendar-days"
                  class="w-full justify-start"
                  size="sm"
                  :disabled="props.readonly"
                >
                  {{ entryDateDisplayText }}
                </UButton>
                <template #content>
                  <UCalendar v-model="entryDateValue" class="p-2" :disabled="props.readonly" @update:model-value="entryDatePopoverOpen = false" />
                </template>
              </UPopover>
            </div>

            <!-- Credit Days (Material PO only) -->
            <div v-if="!isLaborPurchaseOrder">
              <CreditDaysSelect
                v-model="creditDaysModel"
                label="Credit Days"
                :show-add-button="!props.readonly"
                :disabled="props.readonly"
              />
            </div>

            <!-- Est Delivery Date (Material PO only) -->
            <div v-if="!isLaborPurchaseOrder">
              <label class="block text-xs font-medium text-default mb-1">
                Est Delivery Date
              </label>
              <UPopover v-model:open="estimatedDeliveryDatePopoverOpen" :disabled="props.readonly">
                <UButton 
                  color="neutral" 
                  variant="outline" 
                  icon="i-heroicons-calendar-days"
                  class="w-full justify-start"
                  size="sm"
                  :disabled="props.readonly"
                >
                  {{ estimatedDeliveryDateDisplayText }}
                </UButton>
                <template #content>
                  <UCalendar v-model="estimatedDeliveryDateValue" class="p-2" :disabled="props.readonly" :min-value="entryDateValue ?? undefined" @update:model-value="estimatedDeliveryDatePopoverOpen = false" />
                </template>
              </UPopover>
            </div>

            <!-- Include Items (only for Material PO) -->
            <div v-if="!isLaborPurchaseOrder">
              <label class="block text-xs font-medium text-default mb-1">
                Include Items <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="includeItemsOption"
                :items="filteredIncludeItemsOptions"
                :placeholder="includeItemsPlaceholder"
                size="sm"
                class="w-full"
                value-key="value"
                :disabled="props.readonly || !canEnableIncludeItems"
              />
            </div>

            <!-- Quote Reference (only for Material PO) -->
            <div v-if="!isLaborPurchaseOrder">
              <label class="block text-xs font-medium text-default mb-1">
                Quote Reference
              </label>
              <UInput
                :model-value="form.quote_reference || ''"
                placeholder="Enter quote reference"
                size="sm"
                class="w-full"
                :disabled="props.readonly"
                @update:model-value="(value) => handleFormUpdate('quote_reference', value ?? '')"
              />
            </div>

            <!-- Estimate Details (visible when importing from estimate) -->
            <div v-if="shouldShowEstimateDetails" class="xl:col-span-2">
              <label class="block text-xs font-medium text-default mb-1">
                Estimate Details
              </label>
              <div
                class="p-3 rounded-md text-xs min-h-[50px] border transition-colors duration-150"
                :class="estimateDetails?.statusContainerClass || 'bg-gray-50 dark:bg-gray-800 border-default text-muted'"
              >
                <template v-if="estimatesLoading">
                  Loading estimate details...
                </template>
                <template v-else-if="estimateDetails">
                  <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-default/90">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-default whitespace-nowrap">Estimate #:</span>
                      <span class="font-mono text-sm text-default">{{ estimateDetails.number }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-default whitespace-nowrap">Status:</span>
                      <span
                        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border flex-shrink-0"
                        :class="estimateDetails.statusBadgeClass"
                      >
                        {{ estimateDetails.status }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-default whitespace-nowrap">Estimate Date:</span>
                      <span>{{ estimateDetails.estimateDate }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-default whitespace-nowrap">Final Amount:</span>
                      <span class="font-mono text-sm">{{ estimateDetails.finalAmount }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="text-default">No estimates found for the selected project.</span>
                </template>
              </div>
            </div>

            <!-- Is Revised: shown for approval-level users or when already revised -->
            <div
              v-if="
                editingPurchaseOrder && (
                  props.allowRevise ||
                  Boolean(form.is_revised) ||
                  Boolean(form.revision_date)
                )
              "
            >
              <label class="block text-xs font-medium text-default mb-1">
                Revision
              </label>
              <div class="flex items-center gap-3">
                <UCheckbox
                  :model-value="form.is_revised || false"
                  label="Is Revised"
                  size="md"
                  :disabled="props.readonly"
                  @update:model-value="(val: boolean | 'indeterminate') => handleIsRevisedChange(val === true)"
                />
              </div>
            </div>

            <!-- Revision Date, Number & Notes (shown when Is Revised is checked) -->
            <template v-if="form.is_revised">
              <div>
                <label class="block text-xs font-medium text-default mb-1">
                  Revision Date
                </label>
                <UPopover v-model:open="revisionDatePopoverOpen" :disabled="props.readonly">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-heroicons-calendar-days"
                    class="w-full justify-start"
                    size="sm"
                    :disabled="props.readonly"
                  >
                    {{ revisionDateDisplayText }}
                  </UButton>
                  <template #content>
                    <UCalendar v-model="revisionDateValue" class="p-2" :disabled="props.readonly" @update:model-value="revisionDatePopoverOpen = false" />
                  </template>
                </UPopover>
              </div>
              <div>
                <label class="block text-xs font-medium text-default mb-1">
                  Revision Number
                </label>
                <div class="flex items-center">
                  <span
                    v-if="selectedProjectId"
                    class="inline-flex items-center px-2.5 h-8 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md whitespace-nowrap"
                  >
                    {{ selectedProjectId }}-
                  </span>
                  <UInput
                    :model-value="revisionNumberSuffix"
                    placeholder="Enter revision number"
                    size="sm"
                    class="w-full"
                    :class="selectedProjectId ? '[&_input]:rounded-l-none' : ''"
                    icon="i-heroicons-document-text"
                    :disabled="props.readonly"
                    @update:model-value="(value) => handleFormUpdate('revision_number', value ?? '')"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-default mb-1">
                  Revision Notes
                </label>
                <textarea
                  :value="form.revision_notes || ''"
                  rows="2"
                  class="block w-full rounded-md border border-default/60 bg-white/80 dark:bg-gray-900/40 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y min-h-[2.5rem]"
                  placeholder="Reason for revision"
                  :disabled="props.readonly"
                  @input="(e) => handleFormUpdate('revision_notes', (e.target as HTMLTextAreaElement).value ?? '')"
                />
              </div>
            </template>

            <!-- Exchange Rate (last field; shown when vendor currency is USD) -->
            <div v-if="!loading && poCurrencyConversionEnabled" class="xl:col-span-2">
              <label class="block text-xs font-medium text-default mb-1">
                Exchange Rate
              </label>
              <div
                class="p-3 rounded-md text-xs min-h-[50px] border transition-colors duration-150 bg-primary-50 text-primary-800 border-primary-100 dark:bg-primary-900/20 dark:text-primary-200 dark:border-primary-800"
              >
                <PoCurrencyConversionBar
                  :enabled="poCurrencyConversionEnabled"
                  v-model:from-currency="poCurrencyFrom"
                  v-model:to-currency="poCurrencyTo"
                  v-model:conversion-rate="poConversionRate"
                  :corporation-uuid="form.corporation_uuid"
                  hide-enable-checkbox
                  hide-from-currency-select
                  lock-to-currency
                  :readonly="props.readonly"
                />
              </div>
            </div>
            </template>
          </div>
          </UCard>

          
        </div>
      </div>
    </div>

    <!-- Imported Estimate Items -->
    <div v-if="shouldShowEstimateImportWarning" class="mt-6">
      <UBanner
        color="error"
        icon="i-lucide-info"
        title="Estimate must be approved before creating a purchase order."
        :description="estimateImportBlockedMessage"
      />
    </div>
    <div v-if="shouldShowMasterItemsSection" class="mt-6">
      <POItemsFromItemMaster
        :items="poItemsForDisplay"
        :loading="false"
        :error="null"
        title="PO Items"
        description="Preferred items imported from item master"
        loading-message=""
        empty-message="No preferred items found."
        :corporation-uuid="(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid) ?? undefined"
        :project-uuid="props.form.project_uuid ?? undefined"
        :scoped-item-types="scopedItemTypes"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :scoped-locations="poScopedLocations"
        :hide-location="!isSelectedProjectLocationWiseEnabled"
        :show-edit-selection="isImportingFromMaster && !isPurchaseOrderApproved"
        @edit-selection="handleEditMasterSelection"
        :readonly="props.readonly"
        :po-currency-conversion-enabled="poCurrencyConversionEnabled"
        :po-currency-from="poCurrencyFrom"
        :po-currency-to="poCurrencyTo"
        :po-conversion-rate="poConversionRate"
        @add-row="insertPoItemAfter"
        @remove-row="removePoItemAt"
        @cost-code-change="updatePoItemCostCode"
        @category-change="updatePoItemCategory"
        @item-type-change="updatePoItemType"
        @sequence-change="updatePoItemSequence"
        @item-change="updatePoItemItem"
        @location-change="updatePoItemLocation"
        @description-change="updatePoItemDescription"
        @approval-checks-change="updatePoItemApprovalChecks"
        @model-number-change="updatePoItemModelNumber"
        @uom-change="updatePoItemUom"
        @po-unit-price-change="updatePoItemPoUnitPrice"
        @po-quantity-change="updatePoItemPoQuantity"
        @po-total-change="updatePoItemPoTotal"
      />
    </div>
    <div v-if="shouldShowEstimateItemsSection" class="mt-6">
      <POItemsTableWithEstimates
        :items="poItemsForDisplay"
        :loading="estimateItemsLoading"
        :error="estimateItemsError"
        title="PO Items"
        description="Material items imported from the latest project estimate"
        loading-message="Preparing material items from estimate…"
        empty-message="No material items found in the selected estimate."
        :corporation-uuid="(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid) ?? undefined"
        :project-uuid="props.form.project_uuid ?? undefined"
        :scoped-item-types="scopedItemTypes"
        :scoped-locations="poScopedLocations"
        :hide-location="!isSelectedProjectLocationWiseEnabled"
        :show-edit-selection="isImportingFromEstimate && !isPurchaseOrderApproved"
        @edit-selection="handleEditEstimateSelection"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :readonly="props.readonly"
        :used-quantities-by-item="usedQuantitiesByItem"
        :estimate-items="estimatePoItems"
        :po-currency-conversion-enabled="poCurrencyConversionEnabled"
        :po-currency-from="poCurrencyFrom"
        :po-currency-to="poCurrencyTo"
        :po-conversion-rate="poConversionRate"
        @add-row="insertPoItemAfter"
        @remove-row="removePoItemAt"
        @cost-code-change="updatePoItemCostCode"
        @category-change="updatePoItemCategory"
        @item-type-change="updatePoItemType"
        @sequence-change="updatePoItemSequence"
        @item-change="updatePoItemItem"
        @location-change="updatePoItemLocation"
        @description-change="updatePoItemDescription"
        @approval-checks-change="updatePoItemApprovalChecks"
        @model-number-change="updatePoItemModelNumber"
        @uom-change="updatePoItemUom"
        @po-unit-price-change="updatePoItemPoUnitPrice"
        @po-quantity-change="updatePoItemPoQuantity"
        @po-total-change="updatePoItemPoTotal"
      />
    </div>

    <!-- Location-wise Material PO Items Section (manual material per location) -->
    <div v-if="shouldShowLocationWiseMaterialSection" class="mt-6">
      <POLocationWiseMaterialTable
        :items="locationWiseMaterialItemsForDisplay"
        :loading="locationWiseMaterialLoading"
        :error="locationWiseMaterialError"
        title="Material PO Items (Location-wise)"
        description="Material amounts per location from the estimate (manual material mode)"
        loading-message="Loading location-wise material from estimate…"
        empty-message="No location-wise material items found."
        :corporation-uuid="(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid) ?? undefined"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :show-budgeted-amount="isImportingFromEstimate"
        :show-location-column="showLocationWiseMaterialLocationColumn"
        :show-edit-selection="isImportingFromEstimate && !isPurchaseOrderApproved"
        @edit-selection="handleEditLocationWiseMaterialSelection"
        :readonly="props.readonly"
        @add-row="insertLocationWiseMaterialItemAfter"
        @remove-row="removeLocationWiseMaterialItemAt"
        @cost-code-change="updateLocationWiseMaterialItemCostCode"
        @po-amount-change="updateLocationWiseMaterialItemPoAmount"
        @location-change="updateLocationWiseMaterialItemLocation"
        @description-change="updateLocationWiseMaterialItemDescription"
      />
    </div>
    
    <!-- Labor PO Items Section -->
    <div v-if="shouldShowLaborItemsSection" class="mt-6">
      <POLaborItemsTable
        :items="laborPoItemsForDisplay"
        :loading="laborItemsLoading"
        :error="laborItemsError"
        title="Labor PO Items"
        :description="laborItemsDescription"
        loading-message="Loading labor items from estimate…"
        empty-message="No labor items found."
        :corporation-uuid="(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid) ?? undefined"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :show-labor-budgeted="isLaborPurchaseOrder"
        :show-location-column="showLaborLocationColumn"
        :show-edit-selection="isLaborPurchaseOrder && !isPurchaseOrderApproved"
        @edit-selection="handleEditLaborSelection"
        :readonly="props.readonly"
        :po-currency-conversion-enabled="poCurrencyConversionEnabled"
        :po-currency-from="poCurrencyFrom"
        :po-currency-to="poCurrencyTo"
        :po-conversion-rate="poConversionRate"
        @add-row="insertLaborPoItemAfter"
        @remove-row="removeLaborPoItemAt"
        @cost-code-change="updateLaborPoItemCostCode"
        @po-amount-change="updateLaborPoItemAmount"
        @location-change="updateLaborPoItemLocation"
        @description-change="updateLaborPoItemDescription"
      />
    </div>

    <div v-if="hasRemovedPoItems && !props.readonly" class="mt-4 flex justify-end">
      <UButton
        size="xs"
        color="primary"
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="openRemovedPoItemsModal"
      >
        Show Removed Items ({{ removedPoItems.length }})
      </UButton>
    </div>

    <!-- File Upload and Terms and Conditions (for Labor PO) -->
    <div v-if="isLaborPurchaseOrder" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
        <!-- Skeleton Loaders for File Upload -->
        <template v-if="loading">
          <UCard variant="soft" class="mb-3">
            <div class="space-y-3">
              <USkeleton class="h-6 w-32" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-4 w-full" />
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-40" />
              <div class="space-y-2">
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
              </div>
            </div>
          </UCard>
        </template>
        
        <!-- Actual File Upload Section -->
        <template v-else>
          <!-- Upload Section -->
          <UCard variant="soft" class="mb-3">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-cloud-arrow-up-solid" class="w-5 h-5 text-primary-500" />
                File Upload
              </h4>
              <span class="text-xs text-muted bg-elevated px-2 py-1 rounded border border-default/60">
                {{ totalAttachmentCount }} files
                <span
                  v-if="uploadedAttachmentCount > 0"
                  class="text-success-600 dark:text-success-400"
                >
                  ({{ uploadedAttachmentCount }} uploaded)
                </span>
              </span>
            </div>

            <UFileUpload
              v-slot="{ open }"
              v-model="uploadedFiles"
              accept=".pdf"
              multiple
            >
              <div class="space-y-2">
                <UButton
                  :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose PDF files')"
                  color="primary"
                  variant="solid"
                  size="sm"
                  :icon="isUploading ? 'i-heroicons-arrow-path' : 'i-heroicons-document-plus'"
                  :loading="isUploading"
                  :disabled="isUploading"
                  @click="open()"
                />

                <p
                  v-if="fileUploadErrorMessage"
                  class="text-xs text-error-600 flex items-center gap-1 p-2 bg-error-50 rounded border border-error-200 dark:bg-error-500/10 dark:border-error-500/30"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate">{{ fileUploadErrorMessage }}</span>
                </p>

                <p class="text-[11px] text-muted text-center">
                  PDF files only · Maximum size 10MB each
                </p>
              </div>
            </UFileUpload>
          </UCard>

          <!-- Uploaded Files List -->
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
                Uploaded Files
              </h4>
            </div>

            <div
              v-if="!form.attachments || form.attachments.length === 0"
              class="flex flex-col items-center justify-center min-h-[200px] text-muted p-6"
            >
              <UIcon name="i-heroicons-document" class="w-12 h-12 mb-3 text-muted" />
              <p class="text-sm font-medium mb-1">No files uploaded</p>
              <p class="text-xs text-muted text-center">
                Use the button above to add purchase order attachments.
              </p>
            </div>

            <div v-else class="max-h-[300px] overflow-y-auto">
              <div class="space-y-2">
                <div
                  v-for="(attachment, index) in form.attachments"
                  :key="attachment.uuid || attachment.tempId || `attachment-${index}`"
                  class="flex items-center gap-2 p-2 bg-elevated rounded-md border border-default text-xs hover:bg-accented transition-colors"
                >
                  <UIcon
                    :name="attachment.uuid || attachment.isUploaded ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-up-tray'"
                    class="w-3 h-3"
                    :class="attachment.uuid || attachment.isUploaded ? 'text-success-600' : 'text-warning-500'"
                  />
                  <span class="truncate flex-1 text-default">
                    {{ attachment.document_name || attachment.name || `File ${+index + 1}` }}
                  </span>
                  <div class="flex items-center gap-1">
                    <UButton
                      icon="i-heroicons-eye-solid"
                      color="neutral"
                      variant="soft"
                      size="xs"
                      class="p-1 h-auto text-xs"
                      @click.stop="previewFile(attachment)"
                    />
                    <UButton
                      v-if="!props.readonly"
                      icon="mingcute:delete-fill"
                      color="error"
                      variant="soft"
                      size="xs"
                      class="p-1 h-auto text-xs"
                      @click.stop="removeFile(+index)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </template>
      </div>

      <!-- Special Instructions + Terms and Conditions (next to File Upload for Labor PO) — SI first -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:min-w-[320px] lg:max-w-lg flex flex-col gap-4">
        <template v-if="loading">
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-48" />
              <USkeleton class="h-10 w-full" />
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-52" />
              <USkeleton class="h-10 w-full" />
            </div>
          </UCard>
        </template>
        <template v-else>
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-primary-500" />
                Special Instructions
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  :disabled="!canUseSpecialInstructionsSelect"
                  @click.stop="openQuickAddSpecialInstruction"
                />
              </h4>
            </div>
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Select Special Instruction
              </label>
              <SpecialInstructionsSelect
                :model-value="form.special_instruction_uuid"
                :corporation-uuid="specialInstructionCorpUuid"
                :project-uuid="specialInstructionProjectUuid"
                placeholder="Select special instruction..."
                size="sm"
                class="w-full"
                :disabled="props.readonly || !canUseSpecialInstructionsSelect"
                @update:model-value="(value) => handleFormUpdate('special_instruction_uuid', value ?? null)"
              />
              <p
                v-if="!canUseSpecialInstructionsSelect"
                class="text-[11px] text-muted mt-1"
              >
                Select corporation and project to load special instructions for this PO.
              </p>
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
                Terms and Conditions
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  @click.stop="openQuickAddTermsAndConditions"
                />
              </h4>
            </div>
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Select Terms and Conditions
              </label>
              <TermsAndConditionsSelect
                :model-value="form.terms_and_conditions_uuid"
                placeholder="Select terms and conditions..."
                size="sm"
                class="w-full"
                :disabled="props.readonly"
                @update:model-value="(value) => handleFormUpdate('terms_and_conditions_uuid', value ?? null)"
              />
            </div>
          </UCard>
        </template>
      </div>

      <!-- Financial Breakdown (Labor PO — sales taxes only) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <FinancialBreakdown
            :item-total="itemTotal"
            :form-data="form"
            :read-only="props.readonly"
            :po-currency-conversion-enabled="poCurrencyConversionEnabled"
            :po-currency-from="poCurrencyFrom"
            :po-currency-to="poCurrencyTo"
            :po-conversion-rate="poConversionRate"
            :hide-charges="true"
            item-total-label="Item Total"
            total-label="Total PO Amount"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Material PO) -->
    <div v-if="!isLaborPurchaseOrder" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
        <!-- Skeleton Loaders for File Upload -->
        <template v-if="loading">
          <UCard variant="soft" class="mb-3">
            <div class="space-y-3">
              <USkeleton class="h-6 w-32" />
              <USkeleton class="h-10 w-full" />
              <USkeleton class="h-4 w-full" />
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-40" />
              <div class="space-y-2">
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
              </div>
            </div>
          </UCard>
        </template>
        
        <!-- Actual File Upload Section -->
        <template v-else>
          <!-- Upload Section -->
          <UCard variant="soft" class="mb-3">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-cloud-arrow-up-solid" class="w-5 h-5 text-primary-500" />
                File Upload
              </h4>
              <span class="text-xs text-muted bg-elevated px-2 py-1 rounded border border-default/60">
                {{ totalAttachmentCount }} files
                <span
                  v-if="uploadedAttachmentCount > 0"
                  class="text-success-600 dark:text-success-400"
                >
                  ({{ uploadedAttachmentCount }} uploaded)
                </span>
              </span>
            </div>

            <UFileUpload
              v-slot="{ open }"
              v-model="uploadedFiles"
              accept=".pdf"
              multiple
            >
              <div class="space-y-2">
                <UButton
                  :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose PDF files')"
                  color="primary"
                  variant="solid"
                  size="sm"
                  :icon="isUploading ? 'i-heroicons-arrow-path' : 'i-heroicons-document-plus'"
                  :loading="isUploading"
                  :disabled="isUploading"
                  @click="open()"
                />

                <p
                  v-if="fileUploadErrorMessage"
                  class="text-xs text-error-600 flex items-center gap-1 p-2 bg-error-50 rounded border border-error-200 dark:bg-error-500/10 dark:border-error-500/30"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate">{{ fileUploadErrorMessage }}</span>
                </p>

                <p class="text-[11px] text-muted text-center">
                  PDF files only · Maximum size 10MB each
                </p>
              </div>
            </UFileUpload>
          </UCard>

          <!-- Uploaded Files List -->
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
                Uploaded Files
              </h4>
            </div>

            <div
              v-if="!form.attachments || form.attachments.length === 0"
              class="flex flex-col items-center justify-center min-h-[200px] text-muted p-6"
            >
              <UIcon name="i-heroicons-document" class="w-12 h-12 mb-3 text-muted" />
              <p class="text-sm font-medium mb-1">No files uploaded</p>
              <p class="text-xs text-muted text-center">
                Use the button above to add purchase order attachments.
              </p>
            </div>

            <div v-else class="max-h-[300px] overflow-y-auto">
              <div class="space-y-2">
                <div
                  v-for="(attachment, index) in form.attachments"
                  :key="attachment.uuid || attachment.tempId || `attachment-${index}`"
                  class="flex items-center gap-2 p-2 bg-elevated rounded-md border border-default text-xs hover:bg-accented transition-colors"
                >
                  <UIcon
                    :name="attachment.uuid || attachment.isUploaded ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-up-tray'"
                    class="w-3 h-3"
                    :class="attachment.uuid || attachment.isUploaded ? 'text-success-600' : 'text-warning-500'"
                  />
                  <span class="truncate flex-1 text-default">
                    {{ attachment.document_name || attachment.name || `File ${+index + 1}` }}
                  </span>
                  <div class="flex items-center gap-1">
                    <UButton
                      icon="i-heroicons-eye-solid"
                      color="neutral"
                      variant="soft"
                      size="xs"
                      class="p-1 h-auto text-xs"
                      @click.stop="previewFile(attachment)"
                    />
                    <UButton
                      v-if="!props.readonly"
                      icon="mingcute:delete-fill"
                      color="error"
                      variant="soft"
                      size="xs"
                      class="p-1 h-auto text-xs"
                      @click.stop="removeFile(+index)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </template>
      </div>

      <!-- Special Instructions + Terms and Conditions (Middle) — SI first -->
      <div
        v-if="!isLaborPurchaseOrder"
        class="w-full lg:w-auto lg:flex-shrink-0 lg:min-w-[320px] lg:max-w-lg flex flex-col gap-4"
      >
        <template v-if="loading">
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-48" />
              <USkeleton class="h-10 w-full" />
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="space-y-3">
              <USkeleton class="h-6 w-52" />
              <USkeleton class="h-10 w-full" />
            </div>
          </UCard>
        </template>
        <template v-else>
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-primary-500" />
                Special Instructions
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  :disabled="!canUseSpecialInstructionsSelect"
                  @click.stop="openQuickAddSpecialInstruction"
                />
              </h4>
            </div>
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Select Special Instruction
              </label>
              <SpecialInstructionsSelect
                :model-value="form.special_instruction_uuid"
                :corporation-uuid="specialInstructionCorpUuid"
                :project-uuid="specialInstructionProjectUuid"
                placeholder="Select special instruction..."
                size="sm"
                class="w-full"
                :disabled="props.readonly || !canUseSpecialInstructionsSelect"
                @update:model-value="(value) => handleFormUpdate('special_instruction_uuid', value ?? null)"
              />
              <p
                v-if="!canUseSpecialInstructionsSelect"
                class="text-[11px] text-muted mt-1"
              >
                Select corporation and project to load special instructions for this PO.
              </p>
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
                Terms and Conditions
                <UButton
                  v-if="!props.readonly"
                  icon="i-heroicons-plus"
                  size="xs"
                  color="primary"
                  variant="solid"
                  class="rounded-full !p-1"
                  @click.stop="openQuickAddTermsAndConditions"
                />
              </h4>
            </div>
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Select Terms and Conditions
              </label>
              <TermsAndConditionsSelect
                :model-value="form.terms_and_conditions_uuid"
                placeholder="Select terms and conditions..."
                size="sm"
                class="w-full"
                :disabled="props.readonly"
                @update:model-value="(value) => handleFormUpdate('terms_and_conditions_uuid', value ?? null)"
              />
            </div>
          </UCard>
        </template>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <FinancialBreakdown
            :item-total="itemTotal"
            :form-data="form"
            :read-only="props.readonly"
            :po-currency-conversion-enabled="poCurrencyConversionEnabled"
            :po-currency-from="poCurrencyFrom"
            :po-currency-to="poCurrencyTo"
            :po-conversion-rate="poConversionRate"
            item-total-label="Item Total"
            total-label="Total PO Amount"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Removed PO Items Modal -->
    <UModal v-model:open="removedPoItemsModalOpen">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Removed PO Items</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeRemovedPoItemsModal" />
        </div>
      </template>
      <template #body>
        <div v-if="removedPoItems.length" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(item, index) in removedPoItems"
            :key="item.uuid || item.id || `removed-${index}`"
            class="p-3 border border-default rounded-lg bg-elevated/40 dark:bg-elevated/20 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-default truncate">
                  {{ item.description || item.name || item.item_name || `Item ${+index + 1}` }}
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="item.po_quantity !== null && item.po_quantity !== undefined">
                    Qty: {{ item.po_quantity }}
                  </span>
                  <span v-if="item.po_unit_price !== null && item.po_unit_price !== undefined">
                    Unit: {{ formatCurrency(item.po_unit_price) }}
                  </span>
                </div>
                <div v-if="item.removed_at" class="text-[11px] text-muted mt-1">
                  Removed: {{ item.removed_at }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <div class="text-sm font-mono text-default">
                  {{ formatCurrency(computePoItemEffectiveTotal(item)) }}
                </div>
                <UButton size="xs" color="primary" variant="solid" @click="restoreRemovedPoItem(+index)">
                  Restore
                </UButton>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-6 text-sm text-muted text-center">
          No removed items available.
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between w-full">
          <UButton color="neutral" variant="soft" @click="closeRemovedPoItemsModal">
            Close
          </UButton>
          <UButton
            v-if="removedPoItems.length"
            color="primary"
            variant="solid"
            icon="i-heroicons-arrow-uturn-left"
            @click="restoreAllRemovedPoItems"
          >
            Restore All
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- File Preview Modal -->
    <UModal 
      v-model:open="showFilePreviewModal"
      :ui="{ 
        content: 'w-[95vw] max-w-[95vw] h-[100vh] max-h-[100vh]',
        body: 'p-0 overflow-hidden'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">File Preview</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeFilePreview" />
        </div>
      </template>
      <template #body>
        <div class="h-[calc(100vh-8rem)] overflow-hidden">
          <FilePreview :attachment="selectedFileForPreview" />
        </div>
      </template>
    </UModal>

    <!-- Vendor Edit Modal -->
    <VendorForm 
      v-model="showVendorEditModal" 
      :vendor="editingVendor"
      @vendor-saved="handleVendorSaved"
    />

    <!-- Special Instructions + Terms and Conditions previews (SI above T&C when both) -->
    <div v-if="selectedSpecialInstruction || selectedTermsAndCondition" class="mt-6 space-y-6">
      <UCard v-if="selectedSpecialInstruction" variant="soft">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
            <UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5 text-primary-500" />
            Special Instructions Preview
          </h4>
          <UBadge color="primary" variant="soft" size="sm">
            {{ selectedSpecialInstruction.name }}
          </UBadge>
        </div>
        <div
          class="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          v-html="selectedSpecialInstruction.content"
        />
      </UCard>
      <UCard v-if="selectedTermsAndCondition" variant="soft">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
            <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
            Terms and Conditions Preview
          </h4>
          <UBadge color="primary" variant="soft" size="sm">
            {{ selectedTermsAndCondition.name }}
          </UBadge>
        </div>
        <div
          class="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          v-html="selectedTermsAndCondition.content"
        />
      </UCard>
    </div>

    <!-- Estimate Items Selection Modal -->
    <PurchaseOrdersEstimateItemsSelectionModal
      v-model:open="showEstimateItemsModal"
      :items="estimatePoItems"
      :preselected-items="currentFormItemsForPreselection"
      title="Select Items to Import from Estimate"
      @confirm="handleEstimateItemsConfirm"
      @cancel="handleEstimateItemsCancel"
    />

    <!-- Master Items Selection Modal -->
    <PurchaseOrdersMasterItemsSelectionModal
      v-model:open="showMasterItemsModal"
      :items="vendorFilteredMasterItems"
      :preselected-items="currentFormItemsForPreselection"
      title="Select Items to Import from Master"
      @confirm="handleMasterItemsConfirm"
      @cancel="handleMasterItemsCancel"
    />

    <!-- Labor Items Selection Modal -->
    <LaborItemsSelectionModal
      v-model:open="showLaborItemsModal"
      :items="laborPoItems"
      :preselected-items="currentFormLaborItemsForPreselection"
      title="Select Labor Cost Codes from Estimate"
      :show-labor-budgeted="true"
      :show-location-column="showLaborSelectionLocationColumn"
      :is-from-estimate="true"
      @confirm="handleLaborItemsConfirm"
      @cancel="handleLaborItemsCancel"
    />

    <!-- Quick-add Terms and Conditions Modal -->
    <UModal
      v-model:open="showQuickAddTermsAndConditions"
      title="Add New Terms and Conditions"
      description="Create a new terms and conditions entry that will be available for selection."
      :ui="{
        content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-[95vw] h-[calc(100vh-2rem)] max-h-[95vh] rounded-lg shadow-lg ring ring-default overflow-hidden flex flex-col',
        body: 'flex-1 flex flex-col overflow-y-auto p-0',
        header: 'p-4 sm:p-6 border-b border-default flex-shrink-0',
        footer: 'p-4 sm:p-6 border-t border-default flex-shrink-0'
      }"
    >
      <template #body>
        <div class="flex flex-col">
          <!-- Form Fields (Name and Status) -->
          <div class="p-4 sm:p-6 border-b border-default space-y-4 flex-shrink-0">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="quickTCForm.name"
                  placeholder="e.g., Standard Terms, Payment Terms"
                  variant="subtle"
                  size="sm"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <USelect
                  v-model="quickTCForm.statusLabel"
                  :items="['Active', 'Inactive']"
                  placeholder="Select status"
                  variant="subtle"
                  size="sm"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Rich Text Editor -->
          <div class="flex flex-col flex-shrink-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 px-4 sm:px-6 pt-4 pb-2">
              Content <span class="text-red-500">*</span>
            </label>
            <div class="px-4 sm:px-6 pb-4">
              <ClientOnly>
                <div class="w-full border border-default rounded-md flex flex-col bg-white dark:bg-gray-900">
                  <!-- Toolbar -->
                  <div v-if="unref(quickTCEditor)" class="border-b border-default p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                    <UButton
                      icon="i-lucide-list"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('bulletList') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleBulletList().run()"
                    />
                    <UButton
                      icon="i-lucide-list-ordered"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('orderedList') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleOrderedList().run()"
                    />
                    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <UButton
                      icon="i-lucide-bold"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('bold') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleBold().run()"
                    />
                    <UButton
                      icon="i-lucide-italic"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('italic') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleItalic().run()"
                    />
                    <UButton
                      icon="i-lucide-strikethrough"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('strike') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleStrike().run()"
                    />
                    <UButton
                      icon="i-lucide-code"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('code') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleCode().run()"
                    />
                    <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <UButton
                      icon="i-lucide-text-quote"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('blockquote') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleBlockquote().run()"
                    />
                    <UButton
                      icon="i-lucide-square-code"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      class="rounded-md"
                      :class="{ 'bg-gray-200 dark:bg-gray-700': unref(quickTCEditor)?.isActive('codeBlock') }"
                      @click="unref(quickTCEditor)?.chain().focus().toggleCodeBlock().run()"
                    />
                  </div>
                  <!-- Editor Content -->
                  <div class="p-4 sm:p-6">
                    <TiptapEditorContent
                      v-if="unref(quickTCEditor)"
                      :editor="unref(quickTCEditor)"
                      class="prose prose-sm dark:prose-invert max-w-none focus:outline-none"
                    />
                    <div v-else class="flex items-center justify-center py-12 text-gray-500">
                      <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading editor...</p>
                      </div>
                    </div>
                  </div>
                </div>
                <template #fallback>
                  <div class="flex items-center justify-center py-12 border border-default rounded-md">
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p class="text-gray-600">Loading editor...</p>
                    </div>
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeQuickAddTermsAndConditions">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="saveQuickTermsAndConditions"
            :loading="savingTermsAndConditions"
            :disabled="!quickTCForm.name.trim() || !quickTCForm.content.trim()"
          >
            Save Terms and Conditions
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Quick-add Special Instruction (reuses SpecialInstructionFormBody) -->
    <UModal
      v-model:open="showQuickAddSpecialInstruction"
      title="Add Special Instruction"
      description="Creates a special instruction for the selected corporation and project on this PO."
      :ui="{
        content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-[95vw] h-[calc(100vh-2rem)] max-h-[95vh] rounded-lg shadow-lg ring ring-default overflow-hidden flex flex-col',
        body: 'flex-1 flex flex-col overflow-y-auto p-0',
        header: 'p-4 sm:p-6 border-b border-default flex-shrink-0',
        footer: 'p-4 sm:p-6 border-t border-default flex-shrink-0',
      }"
    >
      <template #body>
        <SpecialInstructionFormBody
          :form-state="quickSIForm"
          :show-corporation-project-row="false"
          :scope-disabled="true"
          :editor-sync-open="showQuickAddSpecialInstruction"
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeQuickAddSpecialInstruction">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="savingQuickSpecialInstruction"
            :disabled="
              !quickSIForm.name.trim() ||
                !quickSIForm.content.trim() ||
                !String(quickSIForm.corporation_uuid).trim() ||
                !String(quickSIForm.project_uuid).trim()
            "
            @click="saveQuickSpecialInstruction"
          >
            Save Special Instruction
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, reactive, unref } from "vue";
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { useCorporationStore } from "~/stores/corporations";
import { usePurchaseOrdersStore } from "~/stores/purchaseOrders";
import { useProjectsStore } from "~/stores/projects";
import { useProjectAddressesStore, type ProjectAddress } from "~/stores/projectAddresses";
import { useVendorStore } from "~/stores/vendors";
import { useUTCDateFormat } from '~/composables/useUTCDateFormat';
import { useCurrencyFormat } from '~/composables/useCurrencyFormat';
import { normalizeUsedQuantitiesByItem } from '~/utils/normalizeUsedQuantitiesByItem';
import { useShipViaStore } from '~/stores/freight';
import { useFreightStore } from '~/stores/freightGlobal';
// NOTE: We use purchaseOrderResourcesStore for all data fetching to avoid affecting global stores
// Global stores (itemTypesStore, costCodeConfigurationsStore, etc.) remain scoped to TopBar's corporation
import { usePurchaseOrderResourcesStore } from '~/stores/purchaseOrderResources';
import { usePurchaseOrderListResourcesStore } from '~/stores/purchaseOrderListResources';
import { useUOMStore } from '~/stores/uom';
import { useLocationsStore } from '~/stores/locations';
import { useItemDivisionsStore } from '~/stores/itemDivisions';
import { useTermsAndConditionsStore } from '~/stores/termsAndConditions';
import { useSpecialInstructionsStore } from '~/stores/specialInstructions';
import { useNimbleSessionStore } from '~/stores/nimbleSession';
import ProjectSelect from '~/components/shared/ProjectSelect.vue';
import VendorSelect from '~/components/shared/VendorSelect.vue';
import ShipViaSelect from '~/components/shared/ShipViaSelect.vue';
import FreightSelect from '~/components/shared/FreightSelect.vue';
import FilePreview from '~/components/shared/FilePreview.vue';
import POItemsTableWithEstimates from '~/components/purchaseOrders/POItemsTableWithEstimates.vue';
import POItemsFromItemMaster from './POItemsFromItemMaster.vue';
import POLaborItemsTable from '~/components/purchaseOrders/POLaborItemsTable.vue';
import POLocationWiseMaterialTable from '~/components/purchaseOrders/POLocationWiseMaterialTable.vue';
import PurchaseOrdersMasterItemsSelectionModal from '~/components/purchaseOrders/PurchaseOrdersMasterItemsSelectionModal.vue';
import LaborItemsSelectionModal from '~/components/purchaseOrders/LaborItemsSelectionModal.vue';
import FinancialBreakdown from '~/components/purchaseOrders/FinancialBreakdown.vue';
import PoCurrencyConversionBar from '~/components/purchaseOrders/PoCurrencyConversionBar.vue';
import PoFromCurrencySelect from '~/components/purchaseOrders/PoFromCurrencySelect.vue';
import {
  normalizePoCurrencyConversionFields,
  syncPoCurrencyConversionForFromCurrency,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion';
import { usePoCurrencyFromSelection } from '~/composables/usePoCurrencyFromSelection';
import VendorForm from '~/components/purchaseOrders/VendorForm.vue';
import TermsAndConditionsSelect from '~/components/shared/TermsAndConditionsSelect.vue';
import SpecialInstructionsSelect from '~/components/shared/SpecialInstructionsSelect.vue';
import SpecialInstructionFormBody from '~/components/configurations/SpecialInstructionFormBody.vue';
import CorporationSelect from '~/components/shared/CorporationSelect.vue';
import CreditDaysSelect from '~/components/shared/CreditDaysSelect.vue';
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions';

// Props
interface Props {
  form: any;
  editingPurchaseOrder: boolean;
  loading?: boolean;
  readonly?: boolean;
  /** When true, the "Is Revised" checkbox is shown for approval-level users editing an existing PO. */
  allowRevise?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  readonly: false,
  allowRevise: false,
});

// Emits
const emit = defineEmits<{
  'update:form': [value: any];
  'file-upload': [files: File[]];
  'estimate-import-blocked-change': [value: boolean];
  'validation-change': [isValid: boolean];
}>();

// Stores
const corpStore = useCorporationStore();
const purchaseOrdersStore = usePurchaseOrdersStore();
const projectsStore = useProjectsStore();
const projectAddressesStore = useProjectAddressesStore();
const vendorStore = useVendorStore();
const { toUTCString, fromUTCString, getCurrentLocal } = useUTCDateFormat();
const shipViaStore = useShipViaStore();
const freightStore = useFreightStore();
const runtimeConfig = useRuntimeConfig();
/** Nimble: freight / ship-via lists must come from the API, not IndexedDB-backed store cache. */
const nimbleFreightShipViaStrictApi = computed(() => Boolean(runtimeConfig.public.nimbleIntegrations));
// Estimates are now managed by purchaseOrderResourcesStore - no global store needed
// NOTE: We use purchaseOrderResourcesStore for all data fetching to avoid affecting global stores
// Global stores (itemTypesStore, costCodeConfigurationsStore, etc.) remain scoped to TopBar's corporation
const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore();
const purchaseOrderListResourcesStore = usePurchaseOrderListResourcesStore();
const uomStore = useUOMStore();
const locationsStore = useLocationsStore();
const itemDivisionsStore = useItemDivisionsStore();
const termsAndConditionsStore = useTermsAndConditionsStore();
const specialInstructionsStore = useSpecialInstructionsStore();
const nimbleSession = useNimbleSessionStore();
const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = useCreditDaysOptions();
const toast = useToast();
const itemTypesFetchPromises = new Map<string, Promise<void>>();

const buildItemTypesKey = (corpUuid: string, projectUuid?: string) =>
  projectUuid ? `${corpUuid}::${projectUuid}` : `${corpUuid}::__all__`;

const hasCachedItemTypes = (corpUuid: string, projectUuid?: string) => {
  // Check if item types are cached in purchaseOrderResourcesStore (scoped store)
  const cachedTypes = purchaseOrderResourcesStore.getItemTypes(corpUuid, projectUuid);
  return Array.isArray(cachedTypes) && cachedTypes.length > 0;
};

const fetchItemTypesIfNeeded = async (
  corpUuid: string,
  projectUuid?: string,
  force = false
) => {
  const key = buildItemTypesKey(corpUuid, projectUuid);

  if (!force && hasCachedItemTypes(corpUuid, projectUuid)) {
    return;
  }

  const existingPromise = itemTypesFetchPromises.get(key);
  if (existingPromise) {
    if (!force) {
      return existingPromise;
    }
    try {
      await existingPromise.catch(() => {});
    } finally {
      if (itemTypesFetchPromises.get(key) === existingPromise) {
        itemTypesFetchPromises.delete(key);
      }
    }
  }

  // Use purchaseOrderResourcesStore instead of global itemTypesStore
  // This ensures we don't affect the global store scoped to TopBar's corporation
  const promise: Promise<void> = purchaseOrderResourcesStore
    .ensureItemTypes({ corporationUuid: corpUuid, projectUuid, force })
    .then(() => {}) // Convert to Promise<void>
    .catch((error: unknown) => {
      // Failed to fetch item types
    })
    .finally(() => {
      const current = itemTypesFetchPromises.get(key);
      if (current === promise) {
        itemTypesFetchPromises.delete(key);
      }
    }) as Promise<void>;

  itemTypesFetchPromises.set(key, promise);
  return promise;
};

const selectedCorporationUuid = computed(() => {
  // Prioritize form's corporation_uuid over store's selectedCorporation
  // This ensures we use the corporation selected in the form, not TopBar
  const uuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  return uuid ? String(uuid) : null;
});

const selectedProjectUuid = computed(() => {
  const uuid = props.form.project_uuid;
  return uuid ? String(uuid) : null;
});

/** Corporation / project for special-instructions list + quick add (must match PO context). */
const specialInstructionCorpUuid = computed(() =>
  String(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid || '').trim(),
);
const specialInstructionProjectUuid = computed(() =>
  String(props.form.project_uuid || '').trim(),
);
const canUseSpecialInstructionsSelect = computed(
  () =>
    Boolean(specialInstructionCorpUuid.value) && Boolean(specialInstructionProjectUuid.value),
);

const selectedProjectId = computed(() => {
  if (!selectedProjectUuid.value) return '';
  if (props.form.project_id) return props.form.project_id;
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  const listProjects = corpUuid ? purchaseOrderListResourcesStore.getProjects(corpUuid) : [];
  const project = listProjects.find((p: any) => p.uuid === selectedProjectUuid.value)
    || (projectsStore.projects || []).find((p: any) => p.uuid === selectedProjectUuid.value);
  return project?.project_id || '';
});

const isSelectedProjectLocationWiseEnabled = computed(() => {
  const projectUuid = selectedProjectUuid.value;
  if (!projectUuid) return false;
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  const listProjects = corpUuid ? purchaseOrderListResourcesStore.getProjects(corpUuid) : [];
  const project = listProjects.find((p: any) => p.uuid === projectUuid)
    || (projectsStore.projects || []).find((p: any) => p.uuid === projectUuid);
  return !!project?.enable_location_wise;
});

const poScopedLocations = ref<any[]>([]);

const refreshPoScopedLocations = async (projectUuidInput?: string | null) => {
  const projectUuid = String(projectUuidInput || '').trim();
  if (!projectUuid || !isSelectedProjectLocationWiseEnabled.value) {
    poScopedLocations.value = [];
    return;
  }
  await locationsStore.fetchLocations(true);
  const allActiveLocations = locationsStore.getActive || [];
  const response = await $fetch<{ data?: any[] }>(
    `/api/projects/location-breakdowns?project_uuid=${encodeURIComponent(projectUuid)}`
  ).catch(() => ({ data: [] }));
  const rows = Array.isArray(response?.data) ? response.data : [];
  const allowedUuids = new Set(
    rows
      .map((row: any) => String(row?.location_uuid || '').trim())
      .filter(Boolean)
  );
  const scoped = allActiveLocations.filter((loc: any) =>
    allowedUuids.has(String(loc?.uuid || '').trim())
  );
  poScopedLocations.value = scoped.length > 0
    ? scoped
    : rows
      .filter((r: any) => r?.location_uuid)
      .map((r: any) => ({
        uuid: r.location_uuid,
        location_name: r.location_name || r.location_label || r.location_uuid,
      }));
};

const poNumberSuffix = computed(() => {
  const raw = String(props.form.po_number || '');
  const prefix = selectedProjectId.value;
  if (prefix && raw.startsWith(`${prefix}-`)) {
    return raw.slice(prefix.length + 1);
  }
  return raw;
});

const revisionNumberSuffix = computed(() => {
  const raw = String(props.form.revision_number || '');
  const prefix = selectedProjectId.value;
  if (prefix && raw.startsWith(`${prefix}-`)) {
    return raw.slice(prefix.length + 1);
  }
  return raw;
});

// Selected terms and conditions for preview
const selectedTermsAndCondition = computed(() => {
  if (!props.form.terms_and_conditions_uuid) {
    return null
  }
  return termsAndConditionsStore.getTermsAndConditionById(props.form.terms_and_conditions_uuid) || null
});

/** Resolved special instruction for preview (store list is keyed by uuid). */
const selectedSpecialInstruction = computed(() => {
  const uuid = props.form.special_instruction_uuid
  if (!uuid) return null
  const list = specialInstructionsStore.items
  if (!Array.isArray(list) || list.length === 0) return null
  return list.find((x) => String(x.uuid) === String(uuid)) ?? null
});

// Quick-add Terms and Conditions
const showQuickAddTermsAndConditions = ref(false)
const savingTermsAndConditions = ref(false)
const showQuickAddSpecialInstruction = ref(false)
const savingQuickSpecialInstruction = ref(false)
const quickSIForm = reactive({
  name: '',
  content: '',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
  corporation_uuid: '' as string,
  project_uuid: '' as string,
})
const quickTCForm = reactive({
  name: '',
  content: '',
  statusLabel: 'Active' as 'Active' | 'Inactive',
})

const quickTCEditor = useEditor({
  content: '',
  extensions: [TiptapStarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    quickTCForm.content = editor.getHTML()
  },
})

watch(showQuickAddTermsAndConditions, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const editorInstance = unref(quickTCEditor)
      if (editorInstance) {
        editorInstance.commands.setContent(quickTCForm.content || '')
      }
    })
  }
})

const openQuickAddTermsAndConditions = () => {
  quickTCForm.name = ''
  quickTCForm.content = ''
  quickTCForm.statusLabel = 'Active'
  const editorInstance = unref(quickTCEditor)
  if (editorInstance) {
    editorInstance.commands.setContent('')
  }
  showQuickAddTermsAndConditions.value = true
}

const closeQuickAddTermsAndConditions = () => {
  showQuickAddTermsAndConditions.value = false
}

const saveQuickTermsAndConditions = async () => {
  if (!quickTCForm.name.trim() || !quickTCForm.content.trim()) return
  savingTermsAndConditions.value = true
  try {
    const toast = useToast()
    await termsAndConditionsStore.createTermsAndCondition({
      name: quickTCForm.name.trim(),
      content: quickTCForm.content.trim(),
      isActive: quickTCForm.statusLabel === 'Active',
    })
    toast.add({ title: 'Success', description: 'Terms and Conditions created successfully', color: 'success' })
    closeQuickAddTermsAndConditions()
  } catch (error: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: error.message || 'Failed to create terms and conditions', color: 'error' })
  } finally {
    savingTermsAndConditions.value = false
  }
}

const openQuickAddSpecialInstruction = () => {
  if (!canUseSpecialInstructionsSelect.value) return
  quickSIForm.name = ''
  quickSIForm.content = ''
  quickSIForm.isActive = 'Active'
  quickSIForm.corporation_uuid = specialInstructionCorpUuid.value
  quickSIForm.project_uuid = specialInstructionProjectUuid.value
  showQuickAddSpecialInstruction.value = true
}

const closeQuickAddSpecialInstruction = () => {
  showQuickAddSpecialInstruction.value = false
}

const saveQuickSpecialInstruction = async () => {
  if (!quickSIForm.name.trim() || !quickSIForm.content.trim()) return
  if (!String(quickSIForm.corporation_uuid).trim() || !String(quickSIForm.project_uuid).trim()) return
  savingQuickSpecialInstruction.value = true
  try {
    const created = await specialInstructionsStore.createItem({
      corporation_uuid: String(quickSIForm.corporation_uuid).trim(),
      project_uuid: String(quickSIForm.project_uuid).trim(),
      name: quickSIForm.name.trim(),
      content: quickSIForm.content.trim(),
      isActive: quickSIForm.isActive === 'Active',
    })
    if (created?.uuid) {
      handleFormUpdate('special_instruction_uuid', created.uuid)
    }
    toast.add({ title: 'Success', description: 'Special instruction created', color: 'success' })
    closeQuickAddSpecialInstruction()
    await specialInstructionsStore.fetchList({
      corporation_uuid: String(quickSIForm.corporation_uuid).trim(),
      project_uuid: String(quickSIForm.project_uuid).trim(),
    })
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }; message?: string }
    toast.add({
      title: 'Error',
      description: err.data?.statusMessage || err.message || 'Failed to create special instruction',
      color: 'error',
    })
  } finally {
    savingQuickSpecialInstruction.value = false
  }
}

const { formatCurrency } = useCurrencyFormat();

const updatePoCurrencyFields = (
  patch: Partial<ReturnType<typeof normalizePoCurrencyConversionFields>>
) => {
  updateFormFields(
    normalizePoCurrencyConversionFields({
      ...(props.form as Record<string, unknown>),
      ...patch,
    })
  );
};

const { applyFromCurrency: applyPoFromCurrency, prefillFromVendor: prefillPoCurrencyFromVendor, prefillWhenVendorAlreadySet: prefillPoCurrencyWhenVendorAlreadySet } =
  usePoCurrencyFromSelection({
    getForm: () => props.form as Record<string, unknown>,
    updateCurrencyFields: (fields) => updatePoCurrencyFields(fields),
    isNewDocument: () => !props.editingPurchaseOrder,
    getCorporationUuid: () => props.form.corporation_uuid,
  });

const poCurrencyConversionEnabled = computed(
  () => normalizePoCurrencyConversionFields(props.form).currency_from === 'USD'
);

const poCurrencyFrom = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).currency_from,
  set: (currency_from: PoCurrencyCode) => {
    void applyPoFromCurrency(currency_from);
  },
});

const poCurrencyTo = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).currency_to,
  set: (currency_to: PoCurrencyCode) =>
    updatePoCurrencyFields({ currency_to }),
});

const poConversionRate = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).conversion_rate,
  set: (conversion_rate: number) =>
    updatePoCurrencyFields({ conversion_rate }),
});

function ensurePoCurrencyFieldsSynced() {
  const fields = normalizePoCurrencyConversionFields(props.form);
  const synced = syncPoCurrencyConversionForFromCurrency(fields.currency_from, {
    conversionRate: fields.conversion_rate,
  });
  if (
    fields.currency_conversion_enabled !== synced.currency_conversion_enabled ||
    fields.currency_from !== synced.currency_from ||
    fields.currency_to !== synced.currency_to
  ) {
    updatePoCurrencyFields(synced);
  }
}

onMounted(() => {
  ensurePoCurrencyFieldsSynced();
  void prefillPoCurrencyWhenVendorAlreadySet();
});

const formatQuantity = (value: any) => {
  if (value === null || value === undefined) return '0';
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0';
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  return formatter.format(numeric);
};

const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

const toInputString = (value: any): string => {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : String(value)
}

const roundCurrencyValue = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

const roundTo = (value: number, decimals = 4): number => {
  if (!Number.isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

// Date formatter
const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
});

// Date computed properties
const entryDateValue = computed({
  get: () => {
    if (!props.form.entry_date) return null;
    const src = String(props.form.entry_date);
    // Convert UTC string to local date string (YYYY-MM-DD)
    const localYmd = src.includes('T') ? fromUTCString(src) : src;
    // Parse the date string directly to avoid timezone issues
    // Split YYYY-MM-DD and create CalendarDate directly
    const parts = localYmd.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new CalendarDate(year, month, day);
      }
    }
    // Fallback: return null if parsing fails
    return null;
  },
  set: (value: CalendarDate | null) => {
    if (value) {
      // Create date string in YYYY-MM-DD format
      const dateString = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
      // Convert to UTC, treating the date as local midnight
      handleFormUpdate('entry_date', toUTCString(dateString));
    } else {
      handleFormUpdate('entry_date', null);
    }
  }
});

const estimatedDeliveryDateValue = computed({
  get: () => {
    if (!props.form.estimated_delivery_date) return null;
    const src = String(props.form.estimated_delivery_date);
    // Convert UTC string to local date string (YYYY-MM-DD)
    const localYmd = src.includes('T') ? fromUTCString(src) : src;
    // Parse the date string directly to avoid timezone issues
    // Split YYYY-MM-DD and create CalendarDate directly
    const parts = localYmd.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new CalendarDate(year, month, day);
      }
    }
    // Fallback: return null if parsing fails
    return null;
  },
  set: (value: CalendarDate | null) => {
    if (value) {
      // Create date string in YYYY-MM-DD format
      const dateString = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
      // Convert to UTC, treating the date as local midnight
      handleFormUpdate('estimated_delivery_date', toUTCString(dateString));
    } else {
      handleFormUpdate('estimated_delivery_date', null);
    }
  }
});

// Display text for dates
const entryDateDisplayText = computed(() => {
  if (!entryDateValue.value) return 'Select entry date';
  return df.format(entryDateValue.value.toDate(getLocalTimeZone()));
});

const estimatedDeliveryDateDisplayText = computed(() => {
  if (!estimatedDeliveryDateValue.value) return 'Select delivery date';
  return df.format(estimatedDeliveryDateValue.value.toDate(getLocalTimeZone()));
});

// Template refs for quick-add modals
const vendorSelectRef = ref<InstanceType<typeof VendorSelect> | null>(null);
const freightSelectRef = ref<InstanceType<typeof FreightSelect> | null>(null);
const shipViaSelectRef = ref<InstanceType<typeof ShipViaSelect> | null>(null);

// Guard flag to prevent recursive updates when calculating estimated delivery date
const isUpdatingEstimatedDeliveryDate = ref(false);
const entryDatePopoverOpen = ref(false);
const estimatedDeliveryDatePopoverOpen = ref(false);
const revisionDatePopoverOpen = ref(false);

const revisionDateValue = computed({
  get: () => {
    if (!props.form.revision_date) return null;
    const src = String(props.form.revision_date);
    const localYmd = src.includes('T') ? fromUTCString(src) : src;
    const parts = localYmd.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new CalendarDate(year, month, day);
      }
    }
    return null;
  },
  set: (value: CalendarDate | null) => {
    if (value) {
      const dateString = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
      handleFormUpdate('revision_date', toUTCString(dateString));
    } else {
      handleFormUpdate('revision_date', null);
    }
  }
});

const revisionDateDisplayText = computed(() => {
  if (!revisionDateValue.value) return 'Select revision date';
  return df.format(revisionDateValue.value.toDate(getLocalTimeZone()));
});

// Auto-calculate estimated delivery date when entry date or credit days change
const calculateEstimatedDeliveryDate = (entryDate: CalendarDate | null, creditDays: string | null, creditDaysId?: string | null) => {
  if (!entryDate || !creditDays) return null;

  const days = resolveCreditDaysToDayCount(creditDays, creditDaysId);
  if (typeof days !== 'number') return null;
  const estimatedDeliveryDate = entryDate.add({ days });
  return estimatedDeliveryDate;
};

/** Prefer UUID so FreightSelect options never collide with ShipVia when labels match (e.g. Nimble). */
const freightSelectModelValue = computed(() => {
  if (props.form.freight_uuid) return String(props.form.freight_uuid);
  if (props.form.freight && String(props.form.freight).trim() !== '') return String(props.form.freight).trim();
  return '';
});

const shipViaSelectModelValue = computed(() => {
  if (props.form.ship_via_uuid) return String(props.form.ship_via_uuid);
  if (props.form.ship_via && String(props.form.ship_via).trim() !== '') return String(props.form.ship_via).trim();
  return '';
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function onFreightModelUpdate(val: string | undefined) {
  if (val == null || val === '') {
    updateFormFields({ freight_uuid: '', freight: '' });
    return;
  }
  if (UUID_RE.test(val)) {
    let rec = freightStore.getFreightByUuid(val);
    if (!rec && nimbleFreightShipViaStrictApi.value) {
      await freightStore.fetchFreight(true).catch(() => {});
      rec = freightStore.getFreightByUuid(val);
    }
    // Freight records use `freight_name`; ShipVia records use `ship_via`.
    updateFormFields({ freight_uuid: val, freight: rec?.freight_name || '' });
  } else {
    updateFormFields({ freight: val, freight_uuid: '' });
  }
}

async function onShipViaModelUpdate(val: string | undefined) {
  if (val == null || val === '') {
    updateFormFields({ ship_via_uuid: '', ship_via: '' });
    return;
  }
  if (UUID_RE.test(val)) {
    let rec = shipViaStore.getShipViaByUuid(val);
    if (!rec && nimbleFreightShipViaStrictApi.value) {
      await shipViaStore.fetchShipVia(true).catch(() => {});
      rec = shipViaStore.getShipViaByUuid(val);
    }
    updateFormFields({ ship_via_uuid: val, ship_via: rec?.ship_via || '' });
  } else {
    updateFormFields({ ship_via: val, ship_via_uuid: '' });
  }
}

const normalizePoMode = (value?: string | null) => {
  // Always return PROJECT as only one option is available
  // const mode = String(value || "PROJECT").toUpperCase();
  // return mode === "CUSTOM" ? "CUSTOM" : "PROJECT";
  return "PROJECT";
};

const poModeOptions = [
  { label: "Purchase Order for Project", value: "PROJECT" },
  // { label: "Custom Purchase Order", value: "CUSTOM" }, // Commented out - only Project PO available
];

interface PoTypeOption {
  label: string
  value: string
  uuid: string
}

const poTypeOptions: PoTypeOption[] = [
  { label: 'Labor', value: 'LABOR', uuid: 'LABOR' },
  { label: 'Material', value: 'MATERIAL', uuid: 'MATERIAL' },
];

const isCustomPurchaseOrder = computed(() => normalizePoMode(props.form.po_mode) === "CUSTOM");
const isProjectPurchaseOrder = computed(() => !isCustomPurchaseOrder.value);
const isLaborPurchaseOrder = computed(() => {
  const poType = String(props.form.po_type || props.form.po_type_uuid || '').toUpperCase();
  return poType === 'LABOR';
});

// Validation for required fields
const isFormValid = computed(() => {
  // Required for all POs
  const hasCorporation = !!props.form.corporation_uuid;
  const hasPoType = !!(props.form.po_type || props.form.po_type_uuid);
  const hasVendor = !!props.form.vendor_uuid;
  const hasEntryDate = !!props.form.entry_date;
  const hasPoNumber = !!(props.form.po_number && String(props.form.po_number).trim() !== '');

  // Required for project POs
  const hasProject = isProjectPurchaseOrder.value ? !!props.form.project_uuid : true;

  // Optional on the form (ship via, freight, credit days, est. delivery) — do not block save.
  const hasIncludeItems = isLaborPurchaseOrder.value ? true : !!props.form.include_items;

  // Note: Quantity validation removed - exceeded quantities will be handled via modal
  // when user tries to save/approve, allowing them to raise a change order

  return hasCorporation &&
         hasPoType &&
         hasVendor &&
         hasEntryDate &&
         hasPoNumber &&
         hasProject &&
         hasIncludeItems;
});

const poModeOption = computed<any>({
  get: () => {
    const mode = normalizePoMode(props.form.po_mode);
    return poModeOptions.find((opt) => opt.value === mode);
  },
  set: (val) => {
    const value = typeof val === "string" ? val : val?.value;
    handlePoModeChange(value);
  },
});

// Ship Via and Freight now use shared reusable selects

const includeItemsOptions = [
  { label: 'Custom', value: 'CUSTOM' },
  { label: 'Import Items from Master', value: 'IMPORT_ITEMS_FROM_MASTER' },
  { label: 'Import Items from Estimate', value: 'IMPORT_ITEMS_FROM_ESTIMATE' },
];

// Check if Include Items field can be enabled (requires project, PO type, and vendor)
const canEnableIncludeItems = computed(() => {
  // For project POs, need project, PO type, and vendor
  if (isProjectPurchaseOrder.value) {
    return !!(
      props.form.project_uuid &&
      (props.form.po_type || props.form.po_type_uuid) &&
      props.form.vendor_uuid
    );
  }
  // For custom POs, need PO type and vendor (no project required)
  return !!(
    (props.form.po_type || props.form.po_type_uuid) &&
    props.form.vendor_uuid
  );
});

// Placeholder for Include Items field
const includeItemsPlaceholder = computed(() => {
  if (props.readonly) {
    return 'Select how to include items';
  }
  if (!canEnableIncludeItems.value) {
    if (isProjectPurchaseOrder.value) {
      if (!props.form.project_uuid && !(props.form.po_type || props.form.po_type_uuid) && !props.form.vendor_uuid) {
        return 'Select project, PO type, and vendor first';
      } else if (!props.form.project_uuid) {
        return 'Select project first';
      } else if (!(props.form.po_type || props.form.po_type_uuid)) {
        return 'Select PO type first';
      } else if (!props.form.vendor_uuid) {
        return 'Select vendor first';
      }
    } else {
      if (!(props.form.po_type || props.form.po_type_uuid) && !props.form.vendor_uuid) {
        return 'Select PO type and vendor first';
      } else if (!(props.form.po_type || props.form.po_type_uuid)) {
        return 'Select PO type first';
      } else if (!props.form.vendor_uuid) {
        return 'Select vendor first';
      }
    }
  }
  return 'Select how to include items';
});

const filteredIncludeItemsOptions = computed(() => {
  let options = includeItemsOptions
  
  // Remove 'Custom' option when creating a new purchase order
  if (!props.editingPurchaseOrder || !props.form.uuid) {
    options = options.filter((opt) => opt.value !== 'CUSTOM')
  }
  
  if (isCustomPurchaseOrder.value) {
    return options.filter(
      (opt) => opt.value !== 'IMPORT_ITEMS_FROM_ESTIMATE'
    )
  }
  return options
})

// Labor PO always uses "Against Estimate" behavior - raise_against field removed

const enforceIncludeItemsConsistency = () => {
  // Skip enforcement for Labor PO as they don't use include_items
  if (isLaborPurchaseOrder.value) {
    return;
  }
  
  // Only enforce consistency if a value is already set (don't auto-select for empty values)
  const currentValue = props.form.include_items
  if (!currentValue || String(currentValue).trim() === '') {
    return; // Don't set a default, let user select
  }
  
  const allowedValues = filteredIncludeItemsOptions.value.map(opt => opt.value)
  if (!allowedValues.includes(currentValue)) {
    // When editing and in CUSTOM mode, set to CUSTOM as default
    // Otherwise, clear the invalid value
    if (props.editingPurchaseOrder && props.form.uuid && isCustomPurchaseOrder.value) {
      const customOption = filteredIncludeItemsOptions.value.find(opt => opt.value === 'CUSTOM')
      if (customOption) {
        updateFormFields({ include_items: 'CUSTOM' })
        return
      }
    }
    // Clear the invalid value instead of setting a default
    updateFormFields({ include_items: '' })
  }
}

// Removed Terms & Conditions UI

// Selected options
const resolvePoTypeOption = (input: any): PoTypeOption | undefined => {
  if (input === null || input === undefined || input === '') return undefined;
  if (typeof input === 'object') {
    const candidate = input.uuid ?? input.value ?? input.label ?? input.id;
    return resolvePoTypeOption(candidate);
  }
  const key = String(input).trim().toUpperCase();
  if (!key) return undefined;
  return poTypeOptions.find(
    (opt) => opt.uuid === key || opt.value === key || opt.label.toUpperCase() === key
  );
};

const setPoTypeFromInput = (input: any) => {
  const option = resolvePoTypeOption(input);
  updateFormFields({
    po_type_uuid: option?.uuid ?? null,
    po_type: option?.value ?? null,
  });
};

const poTypeOption = computed<any>({
  get: () => {
    return (
      resolvePoTypeOption(props.form.po_type_uuid) ||
      resolvePoTypeOption(props.form.po_type)
    );
  },
  set: (val) => {
    setPoTypeFromInput(val)
  },
});

const creditDaysModel = computed({
  get() {
    return {
      credit_days: props.form.credit_days ?? null,
      credit_days_id: props.form.credit_days_id ?? null,
    };
  },
  set(v: { credit_days: string | null; credit_days_id: string | null }) {
    updateFormFields({
      credit_days: v.credit_days ?? '',
      credit_days_id: v.credit_days_id ?? null,
    });
  },
});

// Removed local computeds for ship via and freight; handled by shared selects

const includeItemsOption = computed<any>({
  get: () => {
    const v = props.form.include_items
    // Return undefined if no value is set, so the field shows as unselected
    if (!v || String(v).trim() === '') return undefined
    const target = String(v).toLowerCase()
    // match by ID first
    let found = includeItemsOptions.find(opt => String(opt.value).toLowerCase() === target)
    if (!found) {
      // legacy label support
      found = includeItemsOptions.find(opt => opt.label.toLowerCase() === target.replace(/_/g, ' '))
    }
    const available = filteredIncludeItemsOptions.value
    if (found && available.some(opt => opt.value === found.value)) {
      return found
    }
    // Return undefined if no match found, instead of defaulting to first option
    return undefined
  },
  set: (val) => {
    // Handle both string value (when value-key is used) and option object
    const value = typeof val === 'string' ? val : (val?.value || '')
    handleFormUpdate('include_items', value)
  }
});

const isImportingFromEstimate = computed(() => {
  return String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE';
});

const isImportingFromMaster = computed(() => {
  return String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_MASTER';
});

const isPurchaseOrderApproved = computed(() => {
  const status = String(props.form?.status || '').toLowerCase();
  // PO should be locked (no edit selection, no add/remove rows) for Approved, Partially_Received, or Completed statuses
  return status === 'approved' || status === 'partially_received' || status === 'completed';
});

const projectEstimates = computed(() => {
  if (!isProjectPurchaseOrder.value || !props.form.project_uuid) return [];
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) return [];
  return purchaseOrderResourcesStore.getEstimatesByProject(corpUuid, props.form.project_uuid) || [];
});

const parseEstimateDate = (dateString?: string | null): Date | null => {
  if (!dateString) return null;
  try {
    const source = String(dateString);
    const normalized = source.includes('T') ? fromUTCString(source) : source;
    if (normalized && normalized.includes('-')) {
      const [yearStr, monthStr, dayStr] = normalized.split('-');
      if (yearStr && monthStr && dayStr) {
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
    }
    const fallback = new Date(source);
    return isNaN(fallback.getTime()) ? null : fallback;
  } catch (error) {
    // Failed to parse estimate date
    return null;
  }
};

const latestProjectEstimate = computed(() => {
  if (!projectEstimates.value.length) return null;
  const sorted = [...projectEstimates.value].sort((a, b) => {
    const dateA = parseEstimateDate(a.estimate_date)?.getTime() || 0;
    const dateB = parseEstimateDate(b.estimate_date)?.getTime() || 0;
    return dateB - dateA;
  });
  return sorted[0];
});

const formatEstimateDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  const source = String(dateString);
  const normalized = source.includes('T') ? fromUTCString(source) : source;
  if (normalized && normalized.includes('-')) {
    const [yearStr, monthStr, dayStr] = normalized.split('-');
    if (yearStr && monthStr && dayStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const calendarDate = new CalendarDate(year, month, day);
        return df.format(calendarDate.toDate(getLocalTimeZone()));
      }
    }
  }
  const fallback = parseEstimateDate(dateString);
  return fallback ? df.format(fallback) : 'N/A';
};

const estimateStatusStyles: Record<
  string,
  { label: string; containerClass: string; badgeClass: string }
> = {
  draft: {
    label: 'Drafting…',
    containerClass:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800',
    badgeClass:
      'bg-gray-500/20 text-gray-700 border-gray-300 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600',
  },
  ready: {
    label: 'Estimate ready for approval',
    containerClass:
      'bg-sky-50 text-sky-800 border-sky-100 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-800',
    badgeClass:
      'bg-info/20 text-info border-sky-200 dark:bg-sky-800/40 dark:text-sky-200 dark:border-sky-700',
  },
  approved: {
    label: 'Estimate approved',
    containerClass:
      'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
    badgeClass:
      'bg-success/20 text-success border-emerald-200 dark:bg-emerald-800/40 dark:text-emerald-200 dark:border-emerald-700',
  },
};

const defaultEstimateStatusStyle = {
  label: 'Estimate status unavailable',
  containerClass:
    'bg-muted/10 text-default border border-default/60 dark:bg-muted/10 dark:text-default dark:border-default/40',
  badgeClass:
    'bg-default/10 text-default border border-default/40 dark:bg-default/10 dark:text-default dark:border-default/30',
};

const resolveEstimateStatusPresentation = (status?: string | null) => {
  const rawStatus = typeof status === 'string' ? status : '';
  const normalizedKey = rawStatus.trim().toLowerCase();
  const config = estimateStatusStyles[normalizedKey];

  if (config) {
    return {
      key: normalizedKey,
      label: config.label,
      containerClass: config.containerClass,
      badgeClass: config.badgeClass,
    };
  }

  return {
    key: normalizedKey || 'unknown',
    label: rawStatus || defaultEstimateStatusStyle.label,
    containerClass: defaultEstimateStatusStyle.containerClass,
    badgeClass: defaultEstimateStatusStyle.badgeClass,
  };
};

const estimateDetails = computed(() => {
  const estimate = latestProjectEstimate.value;
  if (!estimate) return null;
  const statusInfo = resolveEstimateStatusPresentation(estimate.status);
  return {
    number: estimate.estimate_number || 'N/A',
    status: statusInfo.label,
    statusKey: statusInfo.key,
    statusContainerClass: statusInfo.containerClass,
    statusBadgeClass: statusInfo.badgeClass,
    estimateDate: formatEstimateDate(estimate.estimate_date),
    validUntil: estimate.valid_until ? formatEstimateDate(estimate.valid_until) : null,
    finalAmount: formatCurrency(estimate.final_amount ?? estimate.total_amount ?? 0),
    lineItems: Array.isArray(estimate.line_items) ? estimate.line_items.length : 0,
    projectName: estimate.project?.project_name || '',
  };
});

const isEstimateImportBlocked = computed(() => {
  // For Material PO: check if importing from estimate and estimate is not approved
  const materialBlocked = (
    isImportingFromEstimate.value &&
    !!estimateDetails.value &&
    estimateDetails.value.statusKey !== 'approved'
  );
  
  // For Labor PO: always uses estimate, so check if estimate is not approved
  const laborBlocked = (
    isLaborPurchaseOrder.value &&
    !!estimateDetails.value &&
    estimateDetails.value.statusKey !== 'approved'
  );
  
  return materialBlocked || laborBlocked;
});

const estimateImportBlockedMessage = computed(() => {
  if (!isEstimateImportBlocked.value) return '';
  const details = estimateDetails.value;
  const number = details?.number ? ` ${details.number}` : '';
  const status = details?.status ?? 'Unavailable';
  
  // Different message for Labor PO vs Material PO
  if (isLaborPurchaseOrder.value) {
    return `Estimate${number} is ${status.toLowerCase()}. Approve the estimate before creating a labor purchase order.`;
  }
  
  return `Estimate${number} is ${status.toLowerCase()}. Approve the estimate before creating a purchase order or select a different include option.`;
});

const shouldShowEstimateImportWarning = computed(
  () => isEstimateImportBlocked.value && (isProjectPurchaseOrder.value || isLaborPurchaseOrder.value)
);

watch(
  isEstimateImportBlocked,
  (value) => {
    emit('estimate-import-blocked-change', value);
  },
  { immediate: true }
);

// Computed property for estimates loading state (scoped to purchaseOrderResources store)
const estimatesLoading = computed(() => {
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) return false;
  const state = purchaseOrderResourcesStore.getProjectState(corpUuid, undefined);
  return state?.estimatesLoading || false;
});

const shouldShowEstimateDetails = computed(() => {
  return (
    isProjectPurchaseOrder.value &&
    !isLaborPurchaseOrder.value &&
    isImportingFromEstimate.value &&
    (!!estimateDetails.value || estimatesLoading.value)
  );
});

// Watch for changes that require fetching estimates (when all required fields are selected)
watch(
  [
    () => props.form.corporation_uuid,
    () => props.form.project_uuid,
    () => props.form.include_items,
  ],
  async ([corpUuid, projectUuid, includeItems], [prevCorpUuid]) => {
    // Only fetch estimates if importing from estimate and we have corporation and project
    if (
      isProjectPurchaseOrder.value &&
      String(includeItems || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE' &&
      corpUuid &&
      projectUuid
    ) {
      // Fetch estimates scoped to the current project
      await purchaseOrderResourcesStore.ensureEstimates({
        corporationUuid: corpUuid,
        projectUuid,
        force: true,
      });
    }
  },
  { immediate: true }
);

const chargeRows = [
  { key: 'freight', label: 'Freight Charges' },
  { key: 'packing', label: 'Packing Charges' },
  { key: 'custom_duties', label: 'Custom & Duties' },
  { key: 'other', label: 'Other Charges' },
] as const

const salesTaxRows = [
  { key: 'sales_tax_1', label: 'Sales Tax 1' },
  { key: 'sales_tax_2', label: 'Sales Tax 2' },
] as const

const resolveFieldValue = (key: string, overrides: Record<string, any> = {}) => {
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key]
  }
  return (props.form as any)?.[key]
}

type ChargeRowKey = (typeof chargeRows)[number]['key']

interface ChargeComputationState {
  key: ChargeRowKey
  percentage: number
  amount: number
  taxable: boolean
}

const buildChargeStates = (
  overrides: Record<string, any> = {},
  itemTotalValue?: number
): ChargeComputationState[] => {
  const resolvedItemTotal = roundCurrencyValue(
    itemTotalValue !== undefined
      ? itemTotalValue
      : parseNumericInput(resolveFieldValue('item_total', overrides))
  )
  const itemTotalChanged = Object.prototype.hasOwnProperty.call(overrides, 'item_total')

  return chargeRows.map((row) => {
    const percentageKey = `${row.key}_charges_percentage`
    const amountKey = `${row.key}_charges_amount`
    const taxableKey = `${row.key}_charges_taxable`

    const percentageRaw = resolveFieldValue(percentageKey, overrides)
    const amountRaw = resolveFieldValue(amountKey, overrides)
    const taxableRaw = resolveFieldValue(taxableKey, overrides)

    const percentage = roundTo(parseNumericInput(percentageRaw), 4)
    const taxable = Boolean(taxableRaw)

    const percentageChanged = Object.prototype.hasOwnProperty.call(overrides, percentageKey)
    const amountChanged = Object.prototype.hasOwnProperty.call(overrides, amountKey)

    let amount = roundCurrencyValue(parseNumericInput(amountRaw))
    const shouldRecalculateAmount =
      itemTotalChanged ||
      percentageChanged ||
      (!amountChanged && percentage !== 0)

    if (shouldRecalculateAmount) {
      amount = roundCurrencyValue(resolvedItemTotal * (percentage / 100))
    }

    return {
      key: row.key,
      percentage,
      amount,
      taxable,
    }
  })
}

type SalesTaxRowKey = (typeof salesTaxRows)[number]['key']

interface SalesTaxComputationState {
  key: SalesTaxRowKey
  percentage: number
  amount: number
}

const buildSalesTaxStates = (
  overrides: Record<string, any> = {},
  taxableBase: number,
  options: { chargesChanged?: boolean } = {}
): SalesTaxComputationState[] => {
  const itemTotalChanged = Object.prototype.hasOwnProperty.call(overrides, 'item_total')
  const chargesChanged = options.chargesChanged ?? false

  return salesTaxRows.map((row) => {
    const percentageKey = `${row.key}_percentage`
    const amountKey = `${row.key}_amount`

    const percentageRaw = resolveFieldValue(percentageKey, overrides)
    const amountRaw = resolveFieldValue(amountKey, overrides)

    const percentage = roundTo(parseNumericInput(percentageRaw), 4)
    const percentageChanged = Object.prototype.hasOwnProperty.call(overrides, percentageKey)
    const amountChanged = Object.prototype.hasOwnProperty.call(overrides, amountKey)

    let amount = roundCurrencyValue(parseNumericInput(amountRaw))
    const shouldRecalculateAmount =
      itemTotalChanged ||
      chargesChanged ||
      percentageChanged ||
      (!amountChanged && percentage !== 0)

    if (shouldRecalculateAmount) {
      amount = roundCurrencyValue(taxableBase * (percentage / 100))
    }

    return {
      key: row.key,
      percentage,
      amount,
    }
  })
}

const chargesTotal = computed(() => roundCurrencyValue(parseNumericInput(props.form.charges_total)))
const taxTotal = computed(() => roundCurrencyValue(parseNumericInput(props.form.tax_total)))
const totalPoAmount = computed(() => roundCurrencyValue(parseNumericInput(props.form.total_po_amount)))

const calculateTaxableChargeTotal = (overrides: Record<string, any> = {}) => {
  const states = buildChargeStates(overrides)
  return roundCurrencyValue(
    states.reduce((sum, state) => (state.taxable ? sum + state.amount : sum), 0)
  )
}

const recalculateChargesAndTaxes = (
  overrides: Record<string, any> = {},
  options: { poItems?: any[]; includeItems?: any } = {}
) => {
  // Use the computed itemTotal if no override is provided
  // This ensures we always use the freshly calculated value from po_items
  const resolvedItemTotal = roundCurrencyValue(
    Object.prototype.hasOwnProperty.call(overrides, 'item_total')
      ? parseNumericInput(overrides.item_total)
      : itemTotal.value
  )

  const chargeStates = buildChargeStates(overrides, resolvedItemTotal)
  const chargesTotalValue = roundCurrencyValue(
    chargeStates.reduce((sum, state) => sum + state.amount, 0)
  )
  const taxableChargesValue = roundCurrencyValue(
    chargeStates.reduce((sum, state) => (state.taxable ? sum + state.amount : sum), 0)
  )
  const taxableBase = roundCurrencyValue(resolvedItemTotal + taxableChargesValue)

  const chargesChanged = Object.keys(overrides).some((key) =>
    key.endsWith('_charges_amount') ||
    key.endsWith('_charges_percentage') ||
    key.endsWith('_charges_taxable')
  )

  const salesTaxStates = buildSalesTaxStates(overrides, taxableBase, { chargesChanged })
  const taxTotalValue = roundCurrencyValue(
    salesTaxStates.reduce((sum, state) => sum + state.amount, 0)
  )
  const totalAmount = roundCurrencyValue(resolvedItemTotal + chargesTotalValue + taxTotalValue)

  const updatedFields: Record<string, any> = {
    item_total: resolvedItemTotal,
    charges_total: chargesTotalValue,
    tax_total: taxTotalValue,
    total_po_amount: totalAmount,
  }
  
  // Only include po_items if explicitly provided in options
  if (options.poItems) {
    updatedFields.po_items = options.poItems.map((item: any) => ({ ...item }))
  }
  
  // Only include include_items if explicitly provided in options
  if (options.includeItems !== undefined) {
    updatedFields.include_items = options.includeItems
  }

  chargeStates.forEach((state) => {
    updatedFields[`${state.key}_charges_percentage`] = state.percentage
    updatedFields[`${state.key}_charges_amount`] = state.amount
    updatedFields[`${state.key}_charges_taxable`] = state.taxable
  })

  salesTaxStates.forEach((state) => {
    updatedFields[`${state.key}_percentage`] = state.percentage
    updatedFields[`${state.key}_amount`] = state.amount
  })

  const chargesBreakdown = chargeStates.reduce(
    (acc, state) => {
      acc[state.key] = {
        percentage: state.percentage,
        amount: state.amount,
        taxable: state.taxable,
      }
      return acc
    },
    {} as Record<
      string,
      { percentage: number | null; amount: number | null; taxable: boolean }
    >
  )

  const salesTaxesBreakdown = salesTaxStates.reduce(
    (acc, state) => {
      acc[state.key] = {
        percentage: state.percentage,
        amount: state.amount,
      }
      return acc
    },
    {} as Record<string, { percentage: number | null; amount: number | null }>
  )

  updatedFields.financial_breakdown = {
    charges: chargesBreakdown,
    sales_taxes: salesTaxesBreakdown,
    totals: {
      item_total: resolvedItemTotal,
      charges_total: chargesTotalValue,
      tax_total: taxTotalValue,
      total_po_amount: totalAmount,
    },
  }

  updateFormFields(updatedFields)
}

// Handler for financial breakdown component updates
const handleFinancialBreakdownUpdate = (updates: Record<string, any>) => {
  updateFormFields(updates)
}

const normalizeNumber = (value: any, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const itemTypeNamesByUuid = computed(() => {
  const lookup = new Map<string, string>();
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) return lookup;
  // Use purchaseOrderResourcesStore instead of global itemTypesStore
  const activeTypes = purchaseOrderResourcesStore.getItemTypes(
    corpUuid,
    props.form.project_uuid
  );
  activeTypes.forEach((type: any) => {
    lookup.set(type.uuid, type.item_type);
  });
  return lookup;
});

const itemTypeDetailsByUuid = computed(() => {
  const lookup = new Map<string, any>();
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) return lookup;
  const activeTypes = purchaseOrderResourcesStore.getItemTypes(
    corpUuid,
    props.form.project_uuid
  );
  activeTypes.forEach((type: any) => {
    lookup.set(type.uuid, type);
  });
  return lookup;
});

// Scoped item types for passing to child components (avoids polluting global store)
const scopedItemTypes = computed(() => {
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) return [];
  return purchaseOrderResourcesStore.getItemTypes(
    corpUuid,
    props.form.project_uuid
  );
});

// Scoped cost code configurations for passing to child components (avoids polluting global store)
const scopedCostCodeConfigurations = computed(() => {
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) {
    return [];
  }
  const configs = purchaseOrderResourcesStore.getCostCodeConfigurations(
    corpUuid,
    props.form.project_uuid
  );
  return configs;
});

const preferredItemOptions = computed(() => {
  const corpUuid = selectedCorporationUuid.value;
  if (!corpUuid) return [];
  const projectUuid = selectedProjectUuid.value ?? undefined;
  const source =
    purchaseOrderResourcesStore.getPreferredItems(corpUuid, projectUuid) || [];
  
  console.log('[preferredItemOptions] Source items:', source.length, 'items');
  if (source.length > 0) {
    console.log('[preferredItemOptions] Sample item:', {
      item_uuid: source[0]?.item_uuid || source[0]?.uuid,
      item_name: source[0]?.item_name || source[0]?.name,
      model_number: source[0]?.model_number,
      hasModelNumber: source[0]?.model_number !== undefined,
      keys: Object.keys(source[0] || {})
    });
  }
  
  const options = source
    .map((item: any) => {
      // Use item_uuid if available (for UUID-based matching), otherwise fall back to uuid or id
      // This ensures UUID-based matching works correctly
      const itemUuid = item.item_uuid || item.uuid || item.id || (typeof item.value === "string" ? item.value : "");
      const value = String(itemUuid || "");
      const label =
        item.item_name ||
        item.name ||
        item.label ||
        item.description ||
        String(value);
      // Extract sequence for SequenceSelect matching
      const itemSequence = item.item_sequence || item.sequence || '';
      const option = {
        label,
        value: value,
        item_sequence: itemSequence, // Include sequence for SequenceSelect
        sequence: itemSequence, // Also include as 'sequence' for compatibility
        raw: {
          ...item,
          item_uuid: itemUuid, // Ensure item_uuid is explicitly set in raw for UUID-based matching
        },
      };
      
      // Log if model_number is present
      if (item.model_number) {
        console.log('[preferredItemOptions] Item with model_number:', {
          value: option.value,
          label: option.label,
          model_number: item.model_number
        });
      }
      
      return option;
    })
    .filter((opt: any) => Boolean(opt.value));
  
  console.log('[preferredItemOptions] Final options count:', options.length);
  return options;
});

const preferredItemOptionMap = computed(() => {
  const map = new Map<string, any>();
  preferredItemOptions.value.forEach((opt) => {
    map.set(String(opt.value), opt);
  });
  return map;
});

const preferredItemsForProject = computed(() => {
  const corpUuid = selectedCorporationUuid.value ?? undefined;
  if (!corpUuid) return [];
  const projectUuid = selectedProjectUuid.value ?? undefined;
  // Directly call the getter (Pinia automatically unwraps the computed)
  return purchaseOrderResourcesStore.getPreferredItems(corpUuid, projectUuid) || [];
});

const getPreferredItemsSignature = (items: any[]) =>
  items
    .map((item, index) =>
      String(
        item?.item_uuid ??
          item?.uuid ??
          item?.id ??
          item?.value ??
          `${item?.cost_code_uuid || 'item'}-${index}`
      )
    )
    .join('|');

const transformPreferredItemToPoItem = (item: any, index: number) => {
  
  const costCodeNumber = item?.cost_code_number || '';
  const costCodeName = item?.cost_code_name || '';
  const costCodeLabel = [costCodeNumber, costCodeName]
    .filter((segment: string) => String(segment || '').trim().length > 0)
    .join(' ')
    .trim();

  const unitLabel =
    item?.unit_label ||
    item?.unit ||
    item?.uom ||
    item?.uom_label ||
    item?.unit_short_name ||
    '';

  // Try to find unit_uuid from UOM store by matching unit string
  let unitUuid = item?.unit_uuid || item?.uom_uuid || null;
  const corpUuidForUOM = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!unitUuid && unitLabel && corpUuidForUOM) {
    const activeUOMs = uomStore.getActiveUOM(corpUuidForUOM);
    const matchedUOM = activeUOMs.find((uom: any) => 
      uom.short_name?.toLowerCase() === unitLabel.toLowerCase() ||
      uom.uom_name?.toLowerCase() === unitLabel.toLowerCase()
    );
    if (matchedUOM) {
      unitUuid = matchedUOM.uuid;
    }
  }

  const unitPrice = normalizeNumber(item?.unit_price, 0);
  const quantity = normalizeNumber(item?.quantity, 0);
  const total =
    item?.total != null ? normalizeNumber(item?.total, unitPrice * quantity) : unitPrice * quantity;

  const itemTypeObj = item?.item_type_uuid
    ? itemTypeDetailsByUuid.value.get(item.item_type_uuid)
    : null;

  const itemTypeLabel =
    item?.item_type_label ||
    item?.item_type ||
    (itemTypeObj?.item_type) ||
    (item?.item_type_uuid ? itemTypeNamesByUuid.value.get(item.item_type_uuid) : '') ||
    '';

  const category = item?.category || itemTypeObj?.category || '';
  const itemDivisionUuid = item?.item_division_uuid || itemTypeObj?.item_division_uuid || null;
  const divisionName =
    item?.division_name ||
    (itemDivisionUuid ? itemDivisionsStore.getItemDivisionById(itemDivisionUuid)?.division_name : '') ||
    '';

  // Set po_unit_price and po_quantity to default values from preferred item
  // User can still change them in the table
  const poUnitPrice = unitPrice > 0 ? unitPrice : null;

  // For manually selected items (POItemsFromItemMaster), always default quantity to 1
  const poQuantity = 1;

  const poTotal = poUnitPrice && poQuantity ? roundCurrencyValue(poUnitPrice * poQuantity) : null;

  // Extract sequence from preferred item (for SequenceSelect matching)
  const itemSequence = item?.item_sequence || item?.sequence || '';

  const modelNumber = item?.model_number || '';
  const locationUuid = item?.location_uuid || null;
  const locationLabel =
    item?.location_name ||
    item?.location_label ||
    item?.location ||
    '';

  return {
    id: item?.id || `${item?.cost_code_uuid || 'master'}-${index}`,
    cost_code_uuid: item?.cost_code_uuid || item?.cost_code_configuration_uuid || null,
    cost_code_number: costCodeNumber,
    cost_code_name: costCodeName,
    cost_code_label: costCodeLabel,
    category,
    item_division_uuid: itemDivisionUuid,
    division_name: divisionName,
    item_type_uuid: item?.item_type_uuid || null,
    item_type_label: itemTypeLabel,
    sequence_uuid: null,
    sequence: itemSequence, // Include sequence for SequenceSelect
    item_sequence: itemSequence, // Also include as item_sequence for compatibility
    item_uuid: item?.item_uuid || item?.uuid || null,
    item_name: item?.item_name || item?.name || item?.label || '',
    item_label: item?.item_label || item?.item_name || item?.name || item?.label || '',
    item_description: item?.item_description || item?.description || '',
    name: item?.item_name || item?.name || item?.label || '',
    description: item?.description || '',
    approval_checks: null,
    model_number: modelNumber,
    preferred_vendor_uuid: item?.preferred_vendor_uuid || item?.vendor_uuid || null,
    location_uuid: locationUuid,
    location: locationLabel,
    unit_price: unitPrice,
    po_unit_price: poUnitPrice,
    uom: unitLabel,
    uom_uuid: unitUuid,
    uom_label: unitLabel,
    unit_uuid: unitUuid,
    unit_label: unitLabel,
    quantity,
    po_quantity: poQuantity,
    total,
    po_total: poTotal,
    display_metadata: {
      cost_code_label: costCodeLabel,
      cost_code_number: costCodeNumber,
      cost_code_name: costCodeName,
      category,
      item_division_uuid: itemDivisionUuid,
      division_name: divisionName,
      item_type_label: itemTypeLabel,
      sequence: itemSequence, // Preserve sequence in display_metadata
      location_display: locationLabel,
      location_uuid: locationUuid,
      item_label: item?.item_label || item?.item_name || item?.name || item?.label || '',
      item_name: item?.item_name || item?.name || item?.label || '',
      item_description: item?.item_description || item?.description || '',
      po_description: item?.description || '',
      unit_label: unitLabel,
      unit_uuid: unitUuid,
      model_number: item?.model_number || '',
      preferred_vendor_uuid: item?.preferred_vendor_uuid || item?.vendor_uuid || null,
    },
  };
};

const applyPreferredItemsToForm = async (preferredItems: any[], { force = false } = {}) => {
  if (!Array.isArray(preferredItems) || preferredItems.length === 0) {
    return;
  }

  const signature = getPreferredItemsSignature(preferredItems);
  const currentItems = Array.isArray(props.form.po_items) ? props.form.po_items : [];
  
  // Don't overwrite items if we're editing an existing PO (unless forced)
  if (!force && props.editingPurchaseOrder && currentItems.length > 0) {
    return;
  }
  
  const shouldApply =
    force ||
    !currentItems.length ||
    signature !== lastAppliedPreferredItemsSignature.value;

  if (!shouldApply) {
    return;
  }

  // Note: fetchMasterPoItems() is already called by the watcher before this function
  // So we don't need to fetch again here - the items are already in masterPoItems.value
  
  // Show modal for item selection instead of directly applying
  // Mark this as initial import (not editing existing selection)
  isEditingMasterSelection.value = false;
  
  pendingMasterSignature.value = signature;
  showMasterItemsModal.value = true;
};

const mapPoItemForDisplay = (item: any, index: number, estimateItem?: any) => {
  // Check both metadata (JSONB from DB) and display_metadata (computed/display)
  const display = item?.display_metadata || item?.metadata || {};
  const storedMetadata =
    item?.metadata && typeof item.metadata === "object" ? item.metadata : {};

  const costCodeNumber = display.cost_code_number || item.cost_code_number || '';
  const costCodeName = display.cost_code_name || item.cost_code_name || '';
  const costCodeLabel =
    display.cost_code_label ||
    [costCodeNumber, costCodeName]
      .filter((segment: string) => String(segment || '').trim().length > 0)
      .join(' ')
      .trim();

  const displayItemTypeObj = item.item_type_uuid
    ? itemTypeDetailsByUuid.value.get(item.item_type_uuid)
    : null;

  const category =
    display.category ||
    item.category ||
    (estimateItem && (estimateItem.category || estimateItem.display_metadata?.category || estimateItem.metadata?.category)) ||
    displayItemTypeObj?.category ||
    '';
  const itemDivisionUuid =
    item.item_division_uuid ||
    display.item_division_uuid ||
    (estimateItem && (estimateItem.item_division_uuid || estimateItem.metadata?.item_division_uuid)) ||
    displayItemTypeObj?.item_division_uuid ||
    null;
  const divisionName =
    display.division_name ||
    item.division_name ||
    (itemDivisionUuid ? itemDivisionsStore.getItemDivisionById(itemDivisionUuid)?.division_name : '') ||
    '';
  const itemTypeLabel =
    display.item_type_label ||
    item.item_type_label ||
    (item.item_type_uuid ? itemTypeNamesByUuid.value.get(item.item_type_uuid) : '') ||
    '';
  const locationDisplay =
    display.location_display || item.location || item.location_uuid || '';
  
  // Extract sequence - first try from display_metadata/metadata, then from the item itself,
  // then from estimate item (if available), then look it up from preferred items using item_uuid
  // Also check item.metadata directly (JSONB from database)
  const itemMetadata = item?.metadata || {};
  let sequenceValue = display.sequence || 
                      itemMetadata.sequence ||
                      item.item_sequence || 
                      item.sequence || '';
  
  // If no sequence found and we have an estimate item, use it as source of truth
  if (!sequenceValue && estimateItem) {
    sequenceValue = estimateItem.item_sequence || 
                    estimateItem.sequence || 
                    estimateItem.display_metadata?.sequence ||
                    estimateItem.metadata?.sequence ||
                    '';
  }
  
  // If still no sequence found and we have an item_uuid, look it up in preferred items
  if (!sequenceValue && item.item_uuid) {
    const matchedItem = preferredItemOptionMap.value.get(String(item.item_uuid));
    if (matchedItem?.item_sequence) {
      sequenceValue = matchedItem.item_sequence;
    } else if (matchedItem?.sequence) {
      sequenceValue = matchedItem.sequence;
    } else if (matchedItem?.raw?.item_sequence) {
      sequenceValue = matchedItem.raw.item_sequence;
    }
  }

  // Check for approval_checks_uuids (JSONB from DB) or approval_checks (legacy/display)
  const approvalSource =
    display.approval_checks || 
    item.approval_checks || 
    item.approvalChecks || 
    (item.approval_checks_uuids && Array.isArray(item.approval_checks_uuids) ? item.approval_checks_uuids : null) ||
    null;
  const approvalChecks = Array.isArray(approvalSource)
    ? approvalSource
    : approvalSource
      ? [approvalSource]
      : [];
  
  const unitValue =
    display.unit_label ||
    item.unit_label ||
    item.uom_label ||
    item.unit ||
    item.uom ||
    '';
  const unitUuid = item.uom_uuid || item.unit_uuid || display.unit_uuid || null;

  // Estimate fields: derive from the estimate source of truth (estimateItem)
  // whenever available. Fallback to values on the PO item only if no estimate
  // data is present.
  const estimateUnitPrice = estimateItem
    ? normalizeNumber(estimateItem.unit_price, 0)
    : normalizeNumber(item.unit_price, 0);

  // Use quantity directly from estimate_material_items - do NOT recalculate from total/unit_price
  // as that would override the actual stored quantity with a potentially stale total
  const estimateQuantity = estimateItem
    ? normalizeNumber(estimateItem.quantity, 0)
    : normalizeNumber(item.quantity, 0);

  // Calculate total from estimate_material_items, or recalculate if not available
  // Priority: estimateItem.total > estimateItem.total_amount > unitPrice * quantity
  const estimateTotal = estimateItem
    ? normalizeNumber(estimateItem.total ?? estimateItem.total_amount ?? (estimateUnitPrice * estimateQuantity), 0)
    : normalizeNumber(item.total ?? item.total_amount ?? (estimateUnitPrice * estimateQuantity), 0);

  const matchedItemOption =
    item.item_uuid && preferredItemOptionMap.value.get(String(item.item_uuid));
  
  // Resolve item name - prefer saved name, then from estimate item (if available), then lookup from preferred items
  // Also check item.metadata directly (JSONB from database) and display_metadata
  let resolvedItemName =
    item.item_name ||  // Direct database field (primary source)
    item.name ||
    itemMetadata.item_name ||
    display.item_name ||
    '';
  
  // If no item name found and we have an estimate item, use it as source of truth
  if (!resolvedItemName && estimateItem) {
    resolvedItemName = estimateItem.item_name ||
                       estimateItem.name ||
                       estimateItem.display_metadata?.item_name ||
                       estimateItem.metadata?.item_name ||
                       '';
  }
  
  // If still no item name found, lookup from preferred items
  if (!resolvedItemName && item.item_uuid) {
    resolvedItemName = matchedItemOption?.label ||
                       matchedItemOption?.raw?.item_name ||
                       matchedItemOption?.raw?.name ||
                       '';
  }
  
  // Final fallback to description if still no name
  if (!resolvedItemName) {
    resolvedItemName = item.description || '';
  }

  // Resolve model_number - prefer saved model_number, then from estimate item (if available), then lookup from preferred items
  // Also check item.metadata directly (JSONB from database) and display_metadata
  // Use explicit checks to handle empty strings correctly (empty string is a valid value)
  let resolvedModelNumber = '';
  if (item.model_number !== undefined && item.model_number !== null && item.model_number !== '') {
    resolvedModelNumber = String(item.model_number);
  } else if (itemMetadata.model_number !== undefined && itemMetadata.model_number !== null && itemMetadata.model_number !== '') {
    resolvedModelNumber = String(itemMetadata.model_number);
  } else if (display.model_number !== undefined && display.model_number !== null && display.model_number !== '') {
    resolvedModelNumber = String(display.model_number);
  }
  
  console.log('[mapPoItemForDisplay] Initial model_number resolution:', {
    itemModelNumber: item.model_number,
    itemMetadataModelNumber: itemMetadata.model_number,
    displayModelNumber: display.model_number,
    resolved: resolvedModelNumber,
    hasEstimateItem: !!estimateItem,
    itemUuid: item.item_uuid
  });
  
  // If no model_number found and we have an estimate item, use it as source of truth
  if (!resolvedModelNumber && estimateItem) {
    console.log('[mapPoItemForDisplay] Estimate item structure:', {
      hasEstimateItem: !!estimateItem,
      estimateItemKeys: estimateItem ? Object.keys(estimateItem) : [],
      estimateItemModelNumber: estimateItem?.model_number,
      estimateItemDisplayMetadata: estimateItem?.display_metadata ? {
        keys: Object.keys(estimateItem.display_metadata),
        model_number: estimateItem.display_metadata.model_number
      } : null,
      estimateItemMetadata: estimateItem?.metadata ? {
        keys: Object.keys(estimateItem.metadata),
        model_number: estimateItem.metadata.model_number
      } : null,
      estimateItemFull: estimateItem
    });
    
    resolvedModelNumber = estimateItem.model_number ||
                          estimateItem.display_metadata?.model_number ||
                          estimateItem.metadata?.model_number ||
                          '';
    console.log('[mapPoItemForDisplay] Model_number from estimate item:', resolvedModelNumber);
  }
  
  // If still no model_number found, lookup from preferred items
  // PRIORITY: Use UUID-based matching first (most reliable), then fall back to name matching
  if (!resolvedModelNumber && item.item_uuid) {
    const itemUuidStr = String(item.item_uuid).toLowerCase().trim();
    let preferredItem: any = null;
    
    // STEP 1: Try the map lookup (fast path) by UUID
    preferredItem = matchedItemOption;
    
    // STEP 2: If not found in map, search through all preferred items by matching item_uuid
    // This is the PRIMARY matching method - UUID-based matching is most reliable
    if (!preferredItem) {
      preferredItem = preferredItemOptions.value.find((opt: any) => {
        // Check item_uuid in raw data (this is the new field we added)
        const rawItemUuid = opt.raw?.item_uuid ? String(opt.raw.item_uuid).toLowerCase().trim() : '';
        if (rawItemUuid && rawItemUuid === itemUuidStr) {
          return true;
        }
        // Also check value field (which might be item_uuid)
        const optValueUuid = opt.value ? String(opt.value).toLowerCase().trim() : '';
        if (optValueUuid && optValueUuid === itemUuidStr) {
          return true;
        }
        // Also check uuid field (preferred item's own UUID - not for matching, but included for completeness)
        const optUuid = opt.raw?.uuid ? String(opt.raw.uuid).toLowerCase().trim() : '';
        if (optUuid && optUuid === itemUuidStr) {
          return true;
        }
        return false;
      });
    }
    
    // STEP 3: If still not found by UUID, try matching by item name (fallback for legacy data)
    // This is a FALLBACK only - UUID matching is preferred
    if (!preferredItem && resolvedItemName) {
      const itemNameLower = resolvedItemName.toLowerCase().trim();
      preferredItem = preferredItemOptions.value.find((opt: any) => {
        const optName = opt.raw?.item_name || opt.raw?.name || opt.label || '';
        return optName.toLowerCase().trim() === itemNameLower;
      });
    }
    
    const preferredModelNumber = preferredItem?.raw?.model_number ||
                                 preferredItem?.model_number ||
                                 '';
    console.log('[mapPoItemForDisplay] Looking up from preferred items:', {
      itemUuid: item.item_uuid,
      itemName: resolvedItemName,
      matchedItemOption: preferredItem ? {
        hasRaw: !!preferredItem.raw,
        rawModelNumber: preferredItem.raw?.model_number,
        rawItemUuid: preferredItem.raw?.item_uuid,
        rawItemName: preferredItem.raw?.item_name || preferredItem.raw?.name,
        rawKeys: preferredItem.raw ? Object.keys(preferredItem.raw) : [],
        directModelNumber: preferredItem.model_number,
        keys: Object.keys(preferredItem),
        fullRaw: preferredItem.raw
      } : null,
      preferredModelNumber,
      preferredItemOptionMapSize: preferredItemOptionMap.value.size,
      preferredItemOptionMapHasKey: preferredItemOptionMap.value.has(String(item.item_uuid)),
      foundInSearch: !!preferredItem && !matchedItemOption,
      matchedBy: preferredItem ? (preferredItemOptionMap.value.has(String(item.item_uuid)) ? 'uuid-map' : (preferredItem.raw?.item_uuid === item.item_uuid ? 'uuid-search' : 'name')) : 'none'
    });
    
    // If preferred item has model_number (even if null, check if it's explicitly null vs undefined)
    // Only use it if it's a non-empty string
    if (preferredModelNumber && typeof preferredModelNumber === 'string' && preferredModelNumber.trim()) {
      resolvedModelNumber = preferredModelNumber;
    } else {
      // If preferred item exists but model_number is null/empty, check if we can get it from the raw item's other fields
      // Sometimes model_number might be stored differently
      if (preferredItem?.raw) {
        const raw = preferredItem.raw;
        // Try alternative field names
        const altModelNumber = raw.modelNumber || raw.model_no || raw.model || '';
        if (altModelNumber && typeof altModelNumber === 'string' && altModelNumber.trim()) {
          resolvedModelNumber = altModelNumber;
          console.log('[mapPoItemForDisplay] Found model_number from alternative field:', altModelNumber);
        }
      }
    }
  }
  
  console.log('[mapPoItemForDisplay] Final resolved model_number:', resolvedModelNumber);
  
  // Ensure model_number is always a string (even if empty) for consistency
  const finalModelNumber = resolvedModelNumber !== undefined && resolvedModelNumber !== null 
    ? String(resolvedModelNumber) 
    : '';

  // Extract sequence from item (for SequenceSelect matching)
  // Use the same value we extracted above for consistency
  const resolvedSequence = sequenceValue;
  
  // Also update display_metadata.sequence to ensure it's available for SequenceSelect
  if (sequenceValue && item.display_metadata) {
    item.display_metadata.sequence = sequenceValue;
  }

  // Prefer saved line + display_metadata; fall back to raw metadata (DB) before estimate defaults
  const preferredVendorUuid =
    item.preferred_vendor_uuid ??
    display.preferred_vendor_uuid ??
    storedMetadata.preferred_vendor_uuid ??
    (estimateItem?.preferred_vendor_uuid ?? null);

  // Filter options based on selected item type if one is selected
  let options: any[] = [...preferredItemOptions.value];

  if (item.item_type_uuid) {
    // Filter options to only include items that belong to the selected item type
    options = options.filter(option => {
      const optionItemTypeUuid = option.raw?.item_type_uuid;
      return optionItemTypeUuid === item.item_type_uuid;
    });

    console.log(`[mapPoItemForDisplay] Filtered options for item type ${item.item_type_uuid}: ${options.length} items`);
  }

  if (
    item.item_uuid &&
    !preferredItemOptionMap.value.has(String(item.item_uuid))
  ) {
    // Add the current item to options if it's not in the preferred items list
    // This ensures the select components can display the saved item
    options.push({
      label: resolvedItemName || String(item.item_uuid),
      value: String(item.item_uuid),
      uuid: String(item.item_uuid), // Also add uuid for SequenceSelect/ItemSelect compatibility
      item_uuid: String(item.item_uuid), // And item_uuid
      item_name: resolvedItemName, // Add item_name for ItemSelect
      name: resolvedItemName, // And name
      item_sequence: resolvedSequence, // Include sequence for SequenceSelect
      sequence: resolvedSequence, // Also include as 'sequence' for compatibility
      raw: {
        ...item,
        item_sequence: resolvedSequence, // Ensure sequence is in raw data
        sequence: resolvedSequence,
        item_name: resolvedItemName,
        name: resolvedItemName,
        model_number: resolvedModelNumber || item.model_number || '', // Include model_number in raw data
        item_type_uuid: item.item_type_uuid, // Include item_type_uuid to match filtering logic
      },
    });
  }

  return {
    id: item.id || `${item.cost_code_uuid || 'po'}-${index}`,
    cost_code_uuid: item.cost_code_uuid || null,
    cost_code_number: costCodeNumber,
    cost_code_name: costCodeName,
    cost_code_label: costCodeLabel || costCodeNumber || costCodeName || '',
    division_name: divisionName,
    category,
    item_division_uuid: itemDivisionUuid,
    item_type_uuid: item.item_type_uuid || null,
    item_type_label: itemTypeLabel,
    sequence: sequenceValue,
    item_sequence: sequenceValue, // Also include as item_sequence for compatibility
    item_uuid: item.item_uuid || null,
    name: resolvedItemName,
    description: item.description || '',
    approval_checks: approvalChecks,
    model_number: finalModelNumber,
    location: locationDisplay,
    location_uuid: item.location_uuid || display.location_uuid || (estimateItem && (estimateItem.location_uuid || estimateItem.metadata?.location_uuid)) || null,
    unit_price: estimateUnitPrice,
    unit: unitValue,
    unit_uuid: unitUuid,
    quantity: estimateQuantity,
    total: estimateTotal,
    po_unit_price: item.po_unit_price ?? null,
    po_quantity: item.po_quantity ?? null,
    po_total: item.po_total ?? null,
    preferred_vendor_uuid: preferredVendorUuid,
    options,
    raw: item,
  };
};

const poItemsForDisplay = computed(() => {
  const source = Array.isArray(props.form.po_items) ? props.form.po_items : []

  // Build a lookup of estimate items by composite key of item_uuid and cost_code_uuid
  // to use as the source of truth for grey, read-only estimate fields in the PO items table.
  // This ensures items with same item_uuid but different cost codes show correct values.
  const estimateLookup = new Map<string, any>();
  (estimatePoItems.value || []).forEach((estItem: any) => {
    if (estItem?.item_uuid && estItem?.cost_code_uuid) {
      const key = `${String(estItem.item_uuid).toLowerCase()}-${String(estItem.cost_code_uuid).toLowerCase()}`;
      estimateLookup.set(key, estItem);
    }
  });
  
  
  // Get list of removed items
  const removedItems = Array.isArray((props.form as any)?.removed_po_items)
    ? (props.form as any).removed_po_items
    : []
  
  // If no items are removed, just return all mapped items
  if (removedItems.length === 0) {
    const mapped = source.map((item: any, index: number) => {
      // Use composite key of item_uuid and cost_code_uuid to match estimate lookup
      const key = (item?.item_uuid && item?.cost_code_uuid)
        ? `${String(item.item_uuid).toLowerCase()}-${String(item.cost_code_uuid).toLowerCase()}`
        : '';
      const estimateItem = key ? estimateLookup.get(key) : undefined;
      
      // Debug logging for estimate lookup matching
      if (index < 3) {
        console.log('[poItemsForDisplay] Item', index, 'lookup:', {
          item_uuid: item.item_uuid,
          cost_code_uuid: item.cost_code_uuid,
          lookupKey: key, // Composite key: item_uuid-cost_code_uuid
          foundEstimateItem: !!estimateItem,
          estimateItemValues: estimateItem ? {
            unit_price: estimateItem.unit_price,
            quantity: estimateItem.quantity,
            total: estimateItem.total,
          } : null,
          poItemValues: {
            po_unit_price: item.po_unit_price,
            po_quantity: item.po_quantity,
            unit_price: item.unit_price,
            quantity: item.quantity,
          },
        });
      }
      const mappedItem = mapPoItemForDisplay(item, index, estimateItem);
      // Log estimate values after mapping
      if (index < 3) {
        console.log('[poItemsForDisplay] Item', index, 'after mapPoItemForDisplay:', {
          item_uuid: mappedItem.item_uuid,
          // Greyed out estimate values (should be from estimate data)
          unit_price: mappedItem.unit_price,
          quantity: mappedItem.quantity,
          total: mappedItem.total,
          // Editable PO values
          po_unit_price: mappedItem.po_unit_price,
          po_quantity: mappedItem.po_quantity,
          po_total: mappedItem.po_total,
        });
      }
      return mappedItem;
    })
    return mapped
  }
  
  // Build sets of stable identifiers from removed items for efficient lookup.
  // Do not filter by item_uuid alone because the same item can appear under
  // multiple cost codes; removing one row should not hide/save-remove siblings.
  const removedKeys = new Set<string>()
  
  removedItems.forEach((removedItem: any) => {
    // Primary: Match by composite key
    const key = buildPoItemMatchKey(removedItem)
    if (key) {
      removedKeys.add(key)
    }
    
    // Secondary: Match by id/uuid
    const idKey = normalizeMatchValue(removedItem?.id || removedItem?.uuid)
    if (idKey) {
      removedKeys.add(`id:${idKey}`)
    }
  })
  
  // Filter out items that match any removed item
  const filtered = source.filter((item: any) => {
    // Check by composite key
    const key = buildPoItemMatchKey(item)
    if (key && removedKeys.has(key)) {
      return false
    }
    
    // Check by id
    const idKey = normalizeMatchValue(item?.id || item?.uuid)
    if (idKey && removedKeys.has(`id:${idKey}`)) {
      return false
    }
    
    return true // Keep this item
  })
  
  // Map filtered items for display
  return filtered.map((item: any, index: number) => mapPoItemForDisplay(item, index))
})

const removedPoItemsModalOpen = ref(false)
const removedPoItems = computed(() =>
  Array.isArray((props.form as any)?.removed_po_items)
    ? (props.form as any).removed_po_items
    : []
)
const hasRemovedPoItems = computed(() => removedPoItems.value.length > 0)

const openRemovedPoItemsModal = () => {
  removedPoItemsModalOpen.value = true
}

const closeRemovedPoItemsModal = () => {
  removedPoItemsModalOpen.value = false
}

const appendRemovedPoItem = (item: any) => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_po_items)
    ? [...(props.form as any).removed_po_items]
    : []
  const cloned = clonePoItem(item)
  cloned.removed_at = new Date().toISOString()
  currentRemoved.push(cloned)
  return currentRemoved
}

const syncRemovedPoItemsWithCurrent = (items: any[]) => {
  const existingRemoved = Array.isArray((props.form as any)?.removed_po_items)
    ? (props.form as any).removed_po_items
    : []
  if (!existingRemoved.length) return

  const currentKeys = new Set<string>()
  items.forEach((item: any) => {
    const key = buildPoItemMatchKey(item)
    if (key) currentKeys.add(`key:${key}`)
    const fallback = normalizeMatchValue(item?.id || item?.uuid)
    if (fallback) currentKeys.add(`id:${fallback}`)
  })

  const filtered = existingRemoved.filter((item: any) => {
    const key = buildPoItemMatchKey(item)
    if (key && currentKeys.has(`key:${key}`)) {
      return false
    }
    const fallback = normalizeMatchValue(item?.id || item?.uuid)
    if (fallback && currentKeys.has(`id:${fallback}`)) {
      return false
    }
    return true
  })

  if (filtered.length !== existingRemoved.length) {
    updateFormFields({ removed_po_items: filtered })
  }
}

const restoreRemovedPoItem = (index: number) => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_po_items)
    ? [...(props.form as any).removed_po_items]
    : []
  if (!currentRemoved.length) return
  const targetIndex = Math.min(Math.max(index, 0), currentRemoved.length - 1)
  const [restored] = currentRemoved.splice(targetIndex, 1)
  if (!restored) return

  const sanitized = clonePoItem(restored)
  delete sanitized.removed_at
  sanitized.po_total = computePoItemEffectiveTotal(sanitized)

  const currentItems = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : []
  currentItems.push(sanitized)

  // Update both removed_po_items and po_items in a single emission to avoid race conditions
  updateFormFields({ removed_po_items: currentRemoved, po_items: currentItems })
  
  // Recalculate totals after restoring the item
  nextTick(() => {
    recalculateChargesAndTaxes()
  })

  if (!currentRemoved.length) {
    closeRemovedPoItemsModal()
  }
}

const restoreAllRemovedPoItems = () => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_po_items)
    ? [...(props.form as any).removed_po_items]
    : []
  if (!currentRemoved.length) return

  const currentItems = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : []

  currentRemoved.forEach((item: any) => {
    const sanitized = clonePoItem(item)
    delete sanitized.removed_at
    sanitized.po_total = computePoItemEffectiveTotal(sanitized)
    currentItems.push(sanitized)
  })

  // Update both removed_po_items and po_items in a single emission to avoid race conditions
  updateFormFields({ removed_po_items: [], po_items: currentItems })
  
  // Recalculate totals after restoring all items
  nextTick(() => {
    recalculateChargesAndTaxes()
  })
  
  closeRemovedPoItemsModal()
}

const hasImportedEstimateItems = computed(
  () => poItemsForDisplay.value.length > 0
);

const latestEstimateUuid = computed(() => latestProjectEstimate.value?.uuid || null);

// Use explicit estimate on the PO when set, otherwise latest approved estimate for the project
const effectiveEstimateUuid = computed(() => {
  if (props.form.estimate_uuid) {
    return props.form.estimate_uuid;
  }
  return latestEstimateUuid.value;
});

const estimateItemsLoading = computed(() =>
  purchaseOrderResourcesStore.getEstimateItemsLoading(
    selectedCorporationUuid.value,
    selectedProjectUuid.value,
    effectiveEstimateUuid.value
  )
);

const estimateItemsError = computed(() =>
  purchaseOrderResourcesStore.getEstimateItemsError(
    selectedCorporationUuid.value,
    selectedProjectUuid.value,
    effectiveEstimateUuid.value
  )
);

const estimatePoItems = computed(() =>
  purchaseOrderResourcesStore.getEstimateItems(
    selectedCorporationUuid.value,
    selectedProjectUuid.value,
    effectiveEstimateUuid.value
  )
);

/** Backfill location UUID from estimate row when PO item only has display text. */
const estimateLocationByCompositeKey = computed(() => {
  const map = new Map<string, { uuid: string | null; label: string | null }>();
  (estimatePoItems.value || []).forEach((estItem: any) => {
    const itemUuid = estItem?.item_uuid;
    const costCodeUuid = estItem?.cost_code_uuid;
    if (!itemUuid || !costCodeUuid) return;
    const key = `${String(itemUuid).toLowerCase()}-${String(costCodeUuid).toLowerCase()}`;
    const uuid =
      estItem?.location_uuid ||
      estItem?.metadata?.location_uuid ||
      estItem?.display_metadata?.location_uuid ||
      null;
    const label =
      estItem?.location ||
      estItem?.location_label ||
      estItem?.metadata?.location_label ||
      estItem?.display_metadata?.location_display ||
      null;
    map.set(key, { uuid: uuid ? String(uuid) : null, label: label ? String(label) : null });
  });
  return map;
});

// When importing from master, only auto-suggest items whose preferred vendor matches
// the currently selected vendor on the PO. Items without a preferred_vendor_uuid are
// excluded from this auto-import list, but can still be added manually via item selectors.
const vendorFilteredMasterItems = computed(() => {
  const items = masterPoItems.value || [];
  const vendorUuid = props.form.vendor_uuid;

  if (
    !vendorUuid ||
    String(props.form.include_items || '').toUpperCase() !== 'IMPORT_ITEMS_FROM_MASTER'
  ) {
    return items;
  }

  const vendor = String(vendorUuid);
  return items.filter((item: any) => {
    const prefVendor = item?.preferred_vendor_uuid;
    if (!prefVendor) return false;
    return String(prefVendor) === vendor;
  });
});

// Fetch used quantities from existing purchase orders for the estimate
const fetchUsedQuantities = async () => {
  if (!isImportingFromEstimate.value || !isProjectPurchaseOrder.value) {
    usedQuantitiesByItem.value = {};
    return;
  }

  const corpUuid = selectedCorporationUuid.value;
  const projectUuid = selectedProjectUuid.value;
  const estimateUuid = effectiveEstimateUuid.value;

  if (!corpUuid || !projectUuid || !estimateUuid) {
    usedQuantitiesByItem.value = {};
    return;
  }

  loadingQuantityAvailability.value = true;
  try {
    const response: any = await $fetch("/api/estimate-quantity-availability", {
      method: "GET",
      query: {
        corporation_uuid: corpUuid,
        project_uuid: projectUuid,
        estimate_uuid: estimateUuid,
        exclude_po_uuid: props.editingPurchaseOrder && props.form.uuid ? props.form.uuid : undefined,
      },
    });

    usedQuantitiesByItem.value = normalizeUsedQuantitiesByItem(response?.data);
  } catch (error: any) {
    console.error("Failed to fetch used quantities:", error);
    usedQuantitiesByItem.value = {};
  } finally {
    loadingQuantityAvailability.value = false;
  }
};

// Check if PO quantities exceed available estimate quantities
const quantityExceededItems = computed(() => {
  if (!isImportingFromEstimate.value || !isProjectPurchaseOrder.value) {
    return [];
  }

  const exceededItems: Array<{
    itemUuid: string;
    itemName: string;
    costCodeUuid: string;
    costCodeNumber: string;
    costCodeName: string;
    costCodeLabel: string;
    estimateQuantity: number;
    usedQuantity: number;
    currentQuantity: number;
    totalQuantity: number;
  }> = [];

  // Build a map of estimate items by composite key of item_uuid and cost_code_uuid
  const estimateItemsMap = new Map<string, any>();
  (estimatePoItems.value || []).forEach((estItem: any) => {
    if (estItem?.item_uuid && estItem?.cost_code_uuid) {
      // Use composite key: item_uuid-cost_code_uuid
      const key = `${String(estItem.item_uuid).toLowerCase()}-${String(estItem.cost_code_uuid).toLowerCase()}`;
      estimateItemsMap.set(key, estItem);
    }
  });

  // Check each PO item
  const poItems = Array.isArray(props.form.po_items) ? props.form.po_items : [];
  poItems.forEach((poItem: any) => {
    const itemUuid = poItem?.item_uuid;
    const costCodeUuid = poItem?.cost_code_uuid;
    if (!itemUuid || !costCodeUuid) return;

    // Use composite key: item_uuid-cost_code_uuid
    const compositeKey = `${String(itemUuid).toLowerCase()}-${String(costCodeUuid).toLowerCase()}`;
    const estimateItem = estimateItemsMap.get(compositeKey);
    if (!estimateItem) return;

    const estimateQuantity = parseNumericInput(estimateItem.quantity || 0);
    const currentPoQuantity = parseNumericInput(poItem.po_quantity || 0);
    const usedQuantity = usedQuantitiesByItem.value[compositeKey] || 0;
    const totalQuantity = usedQuantity + currentPoQuantity;

    if (totalQuantity > estimateQuantity) {
      exceededItems.push({
        itemUuid: String(itemUuid),
        itemName: poItem.name || poItem.description || estimateItem.name || `Item ${itemUuid.substring(0, 8)}`,
        costCodeUuid: String(costCodeUuid),
        costCodeNumber: poItem.cost_code_number || estimateItem.cost_code_number || '',
        costCodeName: poItem.cost_code_name || estimateItem.cost_code_name || '',
        costCodeLabel: poItem.cost_code_label || estimateItem.cost_code_label ||
          [poItem.cost_code_number || estimateItem.cost_code_number, poItem.cost_code_name || estimateItem.cost_code_name]
            .filter(Boolean).join(' ').trim() || `Cost Code ${costCodeUuid.substring(0, 8)}`,
        estimateQuantity,
        usedQuantity,
        currentQuantity: currentPoQuantity,
        totalQuantity,
      });
    }
  });

  return exceededItems;
});

// Check if any items exceed estimate quantities
const hasQuantityExceeded = computed(() => quantityExceededItems.value.length > 0);

// Generate notification message for exceeded quantities
const quantityExceededMessage = computed(() => {
  if (!hasQuantityExceeded.value) return null;

  const items = quantityExceededItems.value;
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0];
    if (!item) return null;
    return `Quantity for "${item.itemName}" exceeds the estimate quantity. Estimate: ${formatQuantity(item.estimateQuantity)}, Already used: ${formatQuantity(item.usedQuantity)}, Current: ${formatQuantity(item.currentQuantity)}, Total: ${formatQuantity(item.totalQuantity)}.`;
  }

  return `${items.length} items exceed their estimate quantities. Total PO quantities (including existing purchase orders) cannot exceed the estimate quantities.`;
});

// Watch for estimate UUID changes to refetch used quantities (after effectiveEstimateUuid is defined)
watch(
  () => effectiveEstimateUuid.value,
  async (newEstimateUuid, oldEstimateUuid) => {
    if (
      isImportingFromEstimate.value &&
      isProjectPurchaseOrder.value &&
      newEstimateUuid &&
      newEstimateUuid !== oldEstimateUuid
    ) {
      await fetchUsedQuantities();
    }
  },
  { immediate: false }
);

// Watch for changes that require fetching used quantities (when importing from estimate)
watch(
  [
    () => props.form.corporation_uuid,
    () => props.form.project_uuid,
    () => props.form.include_items,
    () => effectiveEstimateUuid.value,
  ],
  async ([corpUuid, projectUuid, includeItems, estimateUuid], [prevCorpUuid, prevProjectUuid, prevIncludeItems, prevEstimateUuid]) => {
    // Only fetch used quantities if importing from estimate and we have all required values
    if (
      isProjectPurchaseOrder.value &&
      String(includeItems || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE' &&
      corpUuid &&
      projectUuid &&
      estimateUuid
    ) {
      const wasAlreadyLoading = loadingQuantityAvailability.value;
      await fetchUsedQuantities();
      
      // After fetching used quantities, adjust PO quantities for newly imported items
      // This handles the case where items were imported before used quantities were loaded
      // Only adjust if not editing (editing should preserve existing quantities)
      if (!wasAlreadyLoading && !props.editingPurchaseOrder) {
        const currentItems = Array.isArray(props.form.po_items) ? [...props.form.po_items] : [];
        if (currentItems.length > 0) {
          // Don't adjust existing items - only new ones without saved quantities
          // For now, skip auto-adjustment here to avoid overriding user input
          // Items will be adjusted when confirmed from modal via handleEstimateItemsConfirm
        }
      }
    } else {
      // Clear used quantities if not importing from estimate
      usedQuantitiesByItem.value = {};
    }
  },
  { immediate: true }
);

// Fetch preferred items directly from API instead of store
// This ensures cost_code_preferred_items is the source of truth
const masterPoItems = ref<any[]>([])
const masterPoItemsLoading = ref(false)
const masterPoItemsError = ref<string | null>(null)

const fetchMasterPoItems = async () => {
  const corpUuid = selectedCorporationUuid.value
  if (!corpUuid) {
    masterPoItems.value = []
    return
  }

  const projectUuid = selectedProjectUuid.value ?? undefined

  masterPoItemsLoading.value = true
  masterPoItemsError.value = null

  try {
    const response: any = await $fetch('/api/cost-code-preferred-items', {
      method: 'GET',
      query: {
        corporation_uuid: corpUuid,
        project_uuid: projectUuid,
      },
    })

    const preferredItems = Array.isArray(response?.data) ? response.data : []

    // Transform preferred items to match the format expected by the modal
    // The API response already has item_name and description from cost_code_preferred_items
    const transformedItems = preferredItems.map((item: any, index: number) => {
      const poItem = transformPreferredItemToPoItem(item, index)
      // Convert null to undefined for fields that the modal expects as optional
      // Ensure item_name and description come directly from API (cost_code_preferred_items is source of truth)
      return {
        ...poItem,
        // Primary: use item_name from API response (cost_code_preferred_items.item_name)
        item_name: item.item_name || poItem.item_name || '',
        // Primary: use description from API response (cost_code_preferred_items.description)
        description: item.description || item.item_description || poItem.description || '',
        po_description: item.description || item.item_description || poItem.description || '',
        po_unit_price: poItem.po_unit_price === null ? undefined : poItem.po_unit_price,
        po_quantity: poItem.po_quantity === null ? undefined : poItem.po_quantity,
        unit_price: poItem.unit_price === null ? undefined : poItem.unit_price,
        quantity: poItem.quantity === null ? undefined : poItem.quantity,
      } as any
    })

    masterPoItems.value = transformedItems
  } catch (error: any) {
    console.error('[PurchaseOrderForm] Failed to fetch preferred items from API:', error)
    masterPoItemsError.value = error?.message || 'Failed to load preferred items'
    masterPoItems.value = []
  } finally {
    masterPoItemsLoading.value = false
  }
}

const currentEstimateItemsKey = computed(() =>
  purchaseOrderResourcesStore.estimateKey(
    selectedCorporationUuid.value,
    selectedProjectUuid.value,
    effectiveEstimateUuid.value
  )
);

const shouldShowEstimateItemsSection = computed(() => {
  // Don't show estimate items section for Labor PO
  if (isLaborPurchaseOrder.value) {
    return false;
  }
  
  // Don't show estimate items section if estimate import is blocked (not approved)
  if (isEstimateImportBlocked.value) {
    return false;
  }
  
  const isMaster = isImportingFromMaster.value;
  const isEstimate = isImportingFromEstimate.value;
  const loading = estimateItemsLoading.value;
  const error = !!estimateItemsError.value;
  const hasItems = hasImportedEstimateItems.value;
  
  // Don't show item-wise table when location-wise material section is active or loading
  if (!hasItems && !loading && !error) {
    if (shouldShowLocationWiseMaterialSection.value || hasLocationWiseMaterialItems.value || locationWiseMaterialLoading.value) {
      return false;
    }
  }

  const shouldShow = !isMaster && (isEstimate || loading || error || hasItems);
  return shouldShow;
});

const shouldShowMasterItemsSection = computed(() => {
  // Don't show master items section for Labor PO
  if (isLaborPurchaseOrder.value) {
    return false;
  }
  if (!isImportingFromMaster.value) {
    return false;
  }
  return poItemsForDisplay.value.length > 0;
});

const shouldShowLaborItemsSection = computed(() => {
  // Don't show labor items section if estimate is not approved
  if (isLaborPurchaseOrder.value && isEstimateImportBlocked.value) {
    return false;
  }
  // Always show labor items section for Labor PO (even if empty, to allow adding items)
  return isLaborPurchaseOrder.value;
});

const laborItemsLoading = ref(false);
const laborItemsError = ref<string | null>(null);

// ---------------------------------------------------------------------------
// Location-wise Material PO Items (manual material per location from estimate)
// ---------------------------------------------------------------------------
const locationWiseMaterialLoading = ref(false);
const locationWiseMaterialError = ref<string | null>(null);

const hasLocationWiseMaterialItems = computed(() => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? props.form.po_location_wise_material_items
    : [];
  return items.length > 0;
});

const estimateHasLocationWiseMaterial = computed(() => {
  const lineItems = estimateLineItemsForLocationWise.value;
  return lineItems.some((li: any) =>
    Array.isArray(li.location_wise_material) && li.location_wise_material.length > 0
    && (!Array.isArray(li.material_items) || li.material_items.length === 0)
  );
});

const shouldShowLocationWiseMaterialSection = computed(() => {
  if (isLaborPurchaseOrder.value) return false;
  if (isEstimateImportBlocked.value) return false;
  if (!isImportingFromEstimate.value) return false;

  return (
    locationWiseMaterialLoading.value ||
    !!locationWiseMaterialError.value ||
    hasLocationWiseMaterialItems.value ||
    estimateHasLocationWiseMaterial.value
  );
});

const locationWiseMaterialItemsForDisplay = computed(() => {
  const source = Array.isArray(props.form.po_location_wise_material_items)
    ? props.form.po_location_wise_material_items
    : [];
  return source.map((item: any, index: number) => ({
    id: item.id || `lw-mat-${index}`,
    cost_code_uuid: item.cost_code_uuid || null,
    cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
    cost_code_number: item.cost_code_number || '',
    cost_code_name: item.cost_code_name || '',
    location_uuid: item.location_uuid || null,
    location_label: item.location_label || null,
    material_budgeted_amount: item.material_budgeted_amount || null,
    po_amount: item.po_amount || null,
    description: item.description || '',
  }));
});

const showLocationWiseMaterialLocationColumn = computed(() =>
  locationWiseMaterialItemsForDisplay.value.some(
    (item: any) => item.location_uuid != null && item.location_uuid !== ''
  )
);

const estimateLineItemsForLocationWise = ref<any[]>([]);

const transformEstimateLineItemsToLocationWiseMaterial = (
  lineItems: any[],
  enableLocationWise: boolean,
): any[] => {
  if (!enableLocationWise) return [];
  const materialItems: any[] = [];
  const currentItems = Array.isArray(props.form.po_location_wise_material_items)
    ? props.form.po_location_wise_material_items
    : [];
  const existingMap = new Map<string, any>();
  const keyFor = (item: any) =>
    item.location_uuid
      ? `${item.cost_code_uuid}::${item.location_uuid}`
      : String(item.cost_code_uuid || '');
  currentItems.forEach((item: any) => {
    if (item.cost_code_uuid) existingMap.set(keyFor(item), item);
  });

  lineItems.forEach((lineItem: any) => {
    const costCodeUuid = lineItem.cost_code_uuid;
    if (!costCodeUuid) return;
    const costCodeNumber = lineItem.cost_code_number || '';
    const costCodeName = lineItem.cost_code_name || '';
    const costCodeLabel = [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim();
    const locationWiseMaterial = Array.isArray(lineItem.location_wise_material)
      ? lineItem.location_wise_material
      : [];
    const hasItemWise = Array.isArray(lineItem.material_items) && lineItem.material_items.length > 0;
    if (hasItemWise || locationWiseMaterial.length === 0) return;

    locationWiseMaterial.forEach((row: any) => {
      const amount = parseNumericInput(row.amount ?? 0);
      if (amount <= 0) return;
      const locationUuid = row.location_uuid || '';
      const locationLabel = row.location_name ?? '';
      const key = `${costCodeUuid}::${locationUuid}`;
      const existing = existingMap.get(key);
      const base = {
        cost_code_uuid: costCodeUuid,
        cost_code_number: costCodeNumber,
        cost_code_name: costCodeName,
        cost_code_label: costCodeLabel,
        division_name: lineItem.division_name || '',
        material_budgeted_amount: amount,
        location_uuid: locationUuid,
        location_label: locationLabel,
        metadata: {
          ...(existing?.metadata || {}),
          location_uuid: locationUuid,
          location_label: locationLabel,
        },
      };
      if (existing) {
        materialItems.push({ ...existing, ...base, po_amount: existing.po_amount ?? null });
      } else {
        materialItems.push({ ...base, po_amount: null });
      }
    });
  });
  return materialItems;
};

const loadLocationWiseMaterialFromEstimate = async (
  lineItems: any[],
  enableLocationWise: boolean,
) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return;
  if (isEstimateImportBlocked.value) return;

  const items = transformEstimateLineItemsToLocationWiseMaterial(lineItems, enableLocationWise);
  if (items.length === 0) return;

  // When editing with existing items, don't auto-overwrite
  if (hasLocationWiseMaterialItems.value) return;

  updateFormFields({ po_location_wise_material_items: items });
};

const handleEditLocationWiseMaterialSelection = async () => {
  const projectUuid = selectedProjectUuid.value;
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  const estimateUuid = effectiveEstimateUuid.value;
  if (!projectUuid || !corpUuid || !estimateUuid) return;

  try {
    const response: any = await $fetch('/api/estimate-line-items', {
      method: 'GET',
      query: { project_uuid: projectUuid, estimate_uuid: estimateUuid, corporation_uuid: corpUuid },
    });
    const lineItems = Array.isArray(response?.data) ? response.data : [];
    const projectEnableLocationWise = response?.project_enable_location_wise === true;
    const items = transformEstimateLineItemsToLocationWiseMaterial(lineItems, projectEnableLocationWise);
    if (items.length > 0) {
      updateFormFields({ po_location_wise_material_items: items });
    }
  } catch (_err: any) {
    // silent
  }
};

const insertLocationWiseMaterialItemAfter = (index: number) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  items.splice(index + 1, 0, {
    cost_code_uuid: null,
    cost_code_label: '',
    cost_code_number: '',
    cost_code_name: '',
    location_uuid: null,
    location_label: null,
    material_budgeted_amount: null,
    po_amount: null,
    description: '',
  });
  updateFormFields({ po_location_wise_material_items: items });
};

const removeLocationWiseMaterialItemAt = (index: number) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  if (index >= 0 && index < items.length) {
    items.splice(index, 1);
    updateFormFields({ po_location_wise_material_items: items });
  }
};

const updateLocationWiseMaterialItemCostCode = (payload: {
  index: number;
  value: string | null;
  option?: any;
}) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  const item = { ...items[payload.index] };
  item.cost_code_uuid = payload.value;
  if (payload.option) {
    item.cost_code_number = payload.option.costCode?.cost_code_number || payload.option.cost_code_number || '';
    item.cost_code_name = payload.option.costCode?.cost_code_name || payload.option.cost_code_name || '';
    item.cost_code_label = payload.option.label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim();
  }
  items[payload.index] = item;
  updateFormFields({ po_location_wise_material_items: items });
};

const updateLocationWiseMaterialItemPoAmount = (payload: {
  index: number;
  value: string | number | null | undefined;
  numericValue: number;
}) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  const item = { ...items[payload.index] };
  item.po_amount = payload.numericValue;
  items[payload.index] = item;
  updateFormFields({ po_location_wise_material_items: items });
};

const updateLocationWiseMaterialItemLocation = (payload: {
  index: number;
  value: string | null;
  option?: any;
}) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  const item = { ...items[payload.index] };
  item.location_uuid = payload.value;
  if (payload.option) {
    item.location_label = payload.option.label || payload.option.location_name || '';
  }
  items[payload.index] = item;
  updateFormFields({ po_location_wise_material_items: items });
};

const updateLocationWiseMaterialItemDescription = (payload: {
  index: number;
  value: string;
}) => {
  const items = Array.isArray(props.form.po_location_wise_material_items)
    ? [...props.form.po_location_wise_material_items]
    : [];
  const item = { ...items[payload.index] };
  item.description = payload.value;
  items[payload.index] = item;
  updateFormFields({ po_location_wise_material_items: items });
};

// Estimate quantity availability tracking
const usedQuantitiesByItem = ref<Record<string, number>>({});
const loadingQuantityAvailability = ref(false);

// Labor items description
const laborItemsDescription = computed(() => {
  if (latestProjectEstimate.value) {
    return `Labor cost codes from estimate #${latestProjectEstimate.value.estimate_number || 'N/A'}`;
  }
  return 'Labor cost codes for purchase order';
});

// Labor PO Items display
const laborPoItemsForDisplay = computed(() => {
  const source = Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [];
  return source.map((item: any, index: number) => {
    const meta =
      item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {};
    return {
      id: item.id || `labor-${index}`,
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      labor_budgeted_amount: item.labor_budgeted_amount ?? null,
      po_amount: item.po_amount ?? null,
      location_uuid: item.location_uuid ?? meta.location_uuid ?? null,
      location_label: item.location_label ?? meta.location_label ?? null,
      // Pass through row description so POLaborItemsTable textarea value
      // doesn't get reset on reactivity updates (e.g., click-away/blur).
      description: item.description ?? meta.description ?? '',
      metadata: meta,
      prior_committed_po_amount:
        item.prior_committed_po_amount ?? meta.prior_committed_po_amount ?? null,
    };
  });
});

const showLaborLocationColumn = computed(() =>
  laborPoItemsForDisplay.value.some((item: any) => item.location_uuid != null && item.location_uuid !== "")
);

// Ref to store available labor items for modal
const availableLaborItems = ref<any[]>([]);

// Computed property for labor items available for selection (from estimate or all cost codes)
const laborPoItems = computed(() => {
  return availableLaborItems.value;
});

const showLaborSelectionLocationColumn = computed(() =>
  laborPoItems.value.some((item: any) => item.location_uuid != null && item.location_uuid !== "")
);

watch(
  [
    selectedCorporationUuid,
    selectedProjectUuid,
    () => effectiveEstimateUuid.value,
    () => isProjectPurchaseOrder.value,
  ],
  async ([corpUuid, projectUuid, estimateUuid, isProject]) => {
    if (!corpUuid || !projectUuid || !isProject) {
      if (corpUuid || projectUuid) {
        purchaseOrderResourcesStore.clearProject(corpUuid, projectUuid);
      }
      return;
    }

    await purchaseOrderResourcesStore.ensureProjectResources({
      corporationUuid: corpUuid,
      projectUuid,
      estimateUuid,
    });
  },
  { immediate: true }
);

// Dedicated watcher: once effectiveEstimateUuid resolves (after estimates are loaded),
// ensure estimate items are fetched into the cache so estimatePoItems populates.
// This handles the timing gap where ensureProjectResources first runs with estimateUuid=null.
watch(
  () => effectiveEstimateUuid.value,
  async (estimateUuid) => {
    const corpUuid = selectedCorporationUuid.value
    const projectUuid = selectedProjectUuid.value
    if (!estimateUuid || !corpUuid || !projectUuid) return
    await purchaseOrderResourcesStore.ensureEstimateItems({
      corporationUuid: corpUuid,
      projectUuid,
      estimateUuid,
    })
  },
  { immediate: true }
)

const lastAppliedEstimateItemsKey = ref<string | null>(null);
// Track if we should skip auto-import for editing mode or when items are pre-populated
// This prevents auto-importing estimate items when loading an existing PO with saved items
// OR when items are already pre-populated (e.g., from "To be raised" screen)
// Use a ref that gets set once on mount to remember if we started with items
const hasInitialPoItems = ref(
  (props.editingPurchaseOrder && Array.isArray(props.form.po_items) && props.form.po_items.length > 0) ||
  (!props.editingPurchaseOrder && Array.isArray(props.form.po_items) && props.form.po_items.length > 0 && props.form.include_items === 'IMPORT_ITEMS_FROM_ESTIMATE')
);
const shouldSkipEstimateAutoImport = computed(() => hasInitialPoItems.value);
const lastAppliedPreferredItemsSignature = ref<string | null>(null);

// Track if we should skip auto-import from master for editing mode
// This prevents auto-importing preferred items when loading an existing PO with "Import from Master"
// Set to true if we're editing an existing PO (regardless of whether items are loaded yet)
const hasInitialMasterItems = ref(props.editingPurchaseOrder && String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_MASTER');

// Track if we're currently processing the preferred items watcher to prevent re-entry loops
const isProcessingPreferredItemsWatcher = ref(false);
// Track if we're currently processing the estimate items watcher to prevent re-entry loops
const isProcessingEstimateItemsWatcher = ref(false);
const shouldSkipMasterAutoImport = computed(() => hasInitialMasterItems.value);

// Latching flag that prevents the labor-items modal from being re-opened by
// reactive watchers once items have been loaded/confirmed.  It starts as true
// when editing an existing labor PO that already has items, and is set to true
// after the user confirms a selection from the modal.  Explicit user actions
// (project change, corporation change, PO-type switch) reset it to false so
// that a fresh import can happen.
const laborItemsUserConfirmed = ref(
  String(props.form.po_type || props.form.po_type_uuid || '').toUpperCase() === 'LABOR' &&
  Array.isArray(props.form.labor_po_items) &&
  props.form.labor_po_items.length > 0
);

/** Snapshot when a saved PO first has uuid + po_type: used to skip auto-opening the labor cost-code modal for existing Labor POs (items may load async). */
const loadedEditPoLaborSignature = ref<{ uuid: string; openedAsLabor: boolean } | null>(null);

watch(
  () => props.form.uuid,
  (uuid, oldUuid) => {
    if (!uuid) {
      loadedEditPoLaborSignature.value = null;
    } else if (oldUuid !== undefined && uuid !== oldUuid) {
      loadedEditPoLaborSignature.value = null;
    }
  }
);

watch(
  () =>
    props.editingPurchaseOrder &&
    props.form.uuid &&
    (props.form.po_type || props.form.po_type_uuid)
      ? {
          uuid: props.form.uuid,
          type: String(props.form.po_type || props.form.po_type_uuid || '').toUpperCase(),
        }
      : null,
  (curr, prev) => {
    if (!curr) {
      return;
    }
    if (!prev || prev.uuid !== curr.uuid) {
      loadedEditPoLaborSignature.value = {
        uuid: curr.uuid,
        openedAsLabor: curr.type === 'LABOR',
      };
    }
  },
  { immediate: true, flush: 'post' }
);

const skipAutoLaborCostCodeModal = computed(() => {
  if (!props.editingPurchaseOrder || !props.form.uuid || !isLaborPurchaseOrder.value) {
    return false;
  }
  const sig = loadedEditPoLaborSignature.value;
  if (!sig || sig.uuid !== props.form.uuid) {
    return false;
  }
  return sig.openedAsLabor;
});

const shouldSkipLaborAutoImport = computed(
  () => laborItemsUserConfirmed.value || skipAutoLaborCostCodeModal.value
);

// Modal state for estimate items selection
const showEstimateItemsModal = ref(false);
const pendingEstimateKey = ref<string | null>(null);
const isEditingSelection = ref(false); // Track if modal opened for editing vs initial import

// Modal state for master items selection
const showMasterItemsModal = ref(false);
const pendingMasterSignature = ref<string | null>(null);
const isEditingMasterSelection = ref(false); // Track if modal opened for editing vs initial import

// Note: fetchMasterPoItems is called directly in handlers that open the modal
// (applyPreferredItemsToForm, handleEditMasterSelection) to ensure fresh data

// Modal state for labor items selection
const showLaborItemsModal = ref(false);
const pendingLaborItemsKey = ref<string | null>(null);
const isEditingLaborSelection = ref(false); // Track if modal opened for editing vs initial import

// Computed property for preselected items when editing
const currentFormItemsForPreselection = computed(() => {
  // Return current form items when editing, empty array when creating new
  return Array.isArray(props.form.po_items) ? props.form.po_items : [];
});

// Computed property for preselected labor items when editing
const currentFormLaborItemsForPreselection = computed(() => {
  // Return current form labor items when editing, empty array when creating new
  return Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [];
});

// Helper to get unique identifier for an item
const getItemUniqueId = (item: any): string => {
  return item.item_uuid || item.uuid || item.id || '';
}

// Helper to calculate available quantity for an item (estimate quantity - used quantities)
const calculateAvailableQuantityForItem = (item: any): number => {
  if (!item?.item_uuid || !item?.cost_code_uuid) return 0;

  // Use composite key: item_uuid-cost_code_uuid
  const compositeKey = `${String(item.item_uuid).toLowerCase()}-${String(item.cost_code_uuid).toLowerCase()}`;
  const estimateQuantity = parseNumericInput(item.quantity || 0);
  const usedQuantity = usedQuantitiesByItem.value[compositeKey] || 0;

  const availableQuantity = Math.max(0, estimateQuantity - usedQuantity);
  return availableQuantity;
}

// Helper to adjust PO quantities to available quantities for estimate items
// Only adjusts items that don't already have a saved/edited po_quantity value
const adjustPoQuantitiesToAvailable = (items: any[], existingItemIds?: Set<string>): any[] => {
  const existingIds = existingItemIds || new Set<string>();
  
  return items.map((item: any) => {
    const itemId = getItemUniqueId(item);
    const isExistingItem = itemId && existingIds.has(itemId);
    
    // Only adjust if this is a new item (not already in the form)
    // Existing items should preserve their current po_quantity values
    if (!isExistingItem) {
      const availableQty = calculateAvailableQuantityForItem(item);
      
      if (availableQty > 0) {
        const poUnitPrice = item.po_unit_price || item.unit_price || null;
        const poQuantity = availableQty;
        const poTotal = poUnitPrice && poQuantity ? roundCurrencyValue(poUnitPrice * poQuantity) : null;
        
        return {
          ...item,
          po_quantity: poQuantity,
          po_total: poTotal,
        };
      }
    }
    
    return item;
  });
}

// Handler for when user confirms item selection in modal
const handleEstimateItemsConfirm = (selectedItems: any[]) => {
  
  if (isEditingSelection.value) {
    // When editing: Replace items with only the selected ones from the modal
    // This allows user to add/remove items by selecting/deselecting in the modal
    // The modal shows all estimate items, user selects which ones to keep/add
    const currentItems = Array.isArray(props.form.po_items) ? [...props.form.po_items] : [];
    const currentItemIds = new Set(currentItems.map(item => getItemUniqueId(item)));
    const selectedItemIds = new Set(selectedItems.map(item => getItemUniqueId(item)));
    
    // Keep existing items that are still selected in the modal
    const itemsToKeep = currentItems.filter(item => {
      const itemId = getItemUniqueId(item);
      return itemId && selectedItemIds.has(itemId);
    });
    
    // Add newly selected items that don't exist yet
    const newItems = selectedItems.filter(item => {
      const itemId = getItemUniqueId(item);
      return itemId && !currentItemIds.has(itemId);
    });
    
    // Adjust PO quantities to available quantities for new items only (preserve existing items' quantities)
    const existingItemIds = new Set(itemsToKeep.map(item => getItemUniqueId(item)));
    const adjustedNewItems = adjustPoQuantitiesToAvailable(newItems, existingItemIds);
    
    // Merge: keep existing selected items + add new selected items with adjusted quantities
    const mergedItems = [...itemsToKeep, ...adjustedNewItems];
    updatePoItems(mergedItems, true);
  } else {
    // Initial import: Replace all items with selected items, adjusting quantities to available
    // No existing items, so adjust all
    const adjustedItems = adjustPoQuantitiesToAvailable(selectedItems, new Set());
    updatePoItems(adjustedItems, true);
  }
  
  if (pendingEstimateKey.value) {
    lastAppliedEstimateItemsKey.value = pendingEstimateKey.value;
  }
  
  // Clear pending data
  pendingEstimateKey.value = null;
  
  // Reset editing flag
  isEditingSelection.value = false;
};

// Handler for when user cancels item selection
const handleEstimateItemsCancel = () => {
  
  // Clear pending data without applying
  pendingEstimateKey.value = null;
  
  // Only revert include_items if this was the initial import (not editing existing selection)
  // When editing, user already has items selected, so we should not clear include_items
  if (!isEditingSelection.value) {
    // This was initial import - revert include_items since user cancelled
    updateFormFields({ include_items: '' });
    // Clear store only if this was initial import
    purchaseOrderResourcesStore.clear();
  } else {
    // This was editing existing selection - just close modal, don't affect existing data
  }
  
  // Reset editing flag
  isEditingSelection.value = false;
};

// Handler for when user clicks "Edit Selection" button
const handleEditEstimateSelection = () => {
  
  // Get the current estimate items from store
  const currentEstimateItems = estimatePoItems.value;
  
  if (!Array.isArray(currentEstimateItems) || currentEstimateItems.length === 0) {
    return;
  }
  
  // Get the current key
  const key = currentEstimateItemsKey.value;
  
  if (!key) {
    return;
  }
  
  // Mark this as editing existing selection (not initial import)
  isEditingSelection.value = true;
  
  // Set pending data and open modal
  pendingEstimateKey.value = key;
  showEstimateItemsModal.value = true;
  
};

// Handler for when user confirms master item selection in modal
const handleMasterItemsConfirm = (selectedItems: any[]) => {
  // Log selected items to verify model_number is present
  console.log('[handleMasterItemsConfirm] Selected items:', selectedItems.length);
  selectedItems.forEach((item, index) => {
    if (index < 3) { // Log first 3 items
      console.log('[handleMasterItemsConfirm] Item', index, ':', {
        item_uuid: item.item_uuid,
        model_number: item.model_number,
        hasModelNumber: !!item.model_number,
        display_metadata: item.display_metadata ? {
          model_number: item.display_metadata.model_number
        } : null
      });
    }
  });
  
  if (isEditingMasterSelection.value) {
    // When editing: Replace items with only the selected ones from the modal
    const currentItems = Array.isArray(props.form.po_items) ? [...props.form.po_items] : [];
    const currentItemIds = new Set(currentItems.map(item => getItemUniqueId(item)));
    const selectedItemIds = new Set(selectedItems.map(item => getItemUniqueId(item)));
    
    // Keep existing items that are still selected in the modal
    const itemsToKeep = currentItems.filter(item => {
      const itemId = getItemUniqueId(item);
      return itemId && selectedItemIds.has(itemId);
    });
    
    // Add newly selected items that don't exist yet
    const newItems = selectedItems.filter(item => {
      const itemId = getItemUniqueId(item);
      return itemId && !currentItemIds.has(itemId);
    });
    
    
    // Merge: keep existing selected items + add new selected items
    const mergedItems = [...itemsToKeep, ...newItems];
    console.log('[handleMasterItemsConfirm] Merged items count:', mergedItems.length);
    updatePoItems(mergedItems, true);
  } else {
    // Initial import: Replace all items with selected items
    console.log('[handleMasterItemsConfirm] Initial import, updating with', selectedItems.length, 'items');
    updatePoItems(selectedItems, true);
  }
  
  if (pendingMasterSignature.value) {
    lastAppliedPreferredItemsSignature.value = pendingMasterSignature.value;
  }
  
  // Clear pending data
  pendingMasterSignature.value = null;
  
  // Reset editing flag
  isEditingMasterSelection.value = false;
};

// Handler for when user cancels master item selection
const handleMasterItemsCancel = () => {
  
  // Clear pending data without applying
  pendingMasterSignature.value = null;
  
  // Only revert include_items if this was the initial import (not editing existing selection)
  if (!isEditingMasterSelection.value) {
    // This was initial import - revert include_items since user cancelled
    updateFormFields({ include_items: '' });
    // Clear store only if this was initial import
    purchaseOrderResourcesStore.clear();
  } else {
    // This was editing existing selection - just close modal, don't affect existing data
  }
  
  // Reset editing flag
  isEditingMasterSelection.value = false;
};

// Handler for when user clicks "Edit Selection" button for master items
const handleEditMasterSelection = async () => {
  // Fetch master items from API before showing modal
  await fetchMasterPoItems();
  
  // Get the current master items from API
  const currentMasterItems = vendorFilteredMasterItems.value;
  
  if (!Array.isArray(currentMasterItems) || currentMasterItems.length === 0) {
    return;
  }
  
  // Get the current signature from fetched items
  const signature = getPreferredItemsSignature(currentMasterItems);
  
  if (!signature) {
    return;
  }
  
  // Mark this as editing existing selection (not initial import)
  isEditingMasterSelection.value = true;
  
  // Set pending data and open modal
  pendingMasterSignature.value = signature;
  showMasterItemsModal.value = true;
};

// Helper to get unique identifier for labor items.
// Uses cost_code_uuid + location_uuid composite key for location-wise projects
// so that each (cost code, location) row is treated independently.
const getLaborItemUniqueId = (item: any): string => {
  const base = item.cost_code_uuid || item.uuid || item.id || ''
  const loc = item.location_uuid || ''
  if (base && loc) return `${base}::${loc}`
  return base
}

/** Same logic as LaborItemsSelectionModal: budgeted labor minus prior committed on other POs. */
const getLaborImportRemainingAmount = (item: any): number => {
  const priorRaw =
    item?.metadata?.prior_committed_po_amount ??
    item?.prior_committed_po_amount ??
    0
  const prior = typeof priorRaw === 'string' ? parseFloat(priorRaw) : Number(priorRaw ?? 0)
  const safePrior = Number.isFinite(prior) ? prior : 0
  const budgeted =
    typeof item?.labor_budgeted_amount === 'string'
      ? parseFloat(item.labor_budgeted_amount)
      : Number(item?.labor_budgeted_amount ?? 0)
  const safeBudgeted = Number.isFinite(budgeted) ? budgeted : 0
  return safeBudgeted - safePrior
}

// Handler for when user confirms labor item selection in modal
const handleLaborItemsConfirm = (selectedItems: any[]) => {
  const filtered = selectedItems.filter((item) => getLaborImportRemainingAmount(item) > 0)
  const skippedCount = selectedItems.length - filtered.length

  if (skippedCount > 0 && filtered.length === 0) {
    toast.add({
      title: 'Estimate amount fulfilled',
      description:
        'Purchase order amounts against this estimate are already fulfilled. Create a change order if you need additional labor.',
      color: 'warning',
    })
  } else if (skippedCount > 0) {
    toast.add({
      title: 'Some lines not imported',
      description:
        'Cost codes with no remaining amount against the estimate were skipped. Create a change order to add more labor.',
      color: 'warning',
    })
  }

  if (isEditingLaborSelection.value) {
    // When editing: Replace items with only the selected ones from the modal
    const currentItems = Array.isArray(props.form.labor_po_items) ? [...props.form.labor_po_items] : [];
    const currentItemIds = new Set(currentItems.map(item => getLaborItemUniqueId(item)));
    const selectedItemIds = new Set(filtered.map(item => getLaborItemUniqueId(item)));
    
    // Keep existing items that are still selected in the modal
    const itemsToKeep = currentItems.filter(item => {
      const itemId = getLaborItemUniqueId(item);
      return itemId && selectedItemIds.has(itemId);
    });
    
    // Add newly selected items that don't exist yet
    const newItems = filtered.filter(item => {
      const itemId = getLaborItemUniqueId(item);
      return itemId && !currentItemIds.has(itemId);
    });
    
    
    // Merge: keep existing selected items + add new selected items
    const mergedItems = [...itemsToKeep, ...newItems];
    updateFormFields({ labor_po_items: mergedItems });
  } else {
    // Initial import: Replace all items with selected items
    updateFormFields({ labor_po_items: filtered });
  }
  
  // Latch: prevent watchers from re-opening the modal after items have been confirmed
  laborItemsUserConfirmed.value = true;

  // Clear pending data
  pendingLaborItemsKey.value = null;
  
  // Reset editing flag
  isEditingLaborSelection.value = false;
};

// Handler for when user cancels labor item selection
const handleLaborItemsCancel = () => {
  
  // Clear pending data without applying
  pendingLaborItemsKey.value = null;
  
  // Reset editing flag
  isEditingLaborSelection.value = false;
};

// Handler for when user clicks "Edit Selection" button for labor items
const handleEditLaborSelection = async () => {
  
  // Load from estimate (Labor PO always uses estimate)
  const projectUuid = props.form.project_uuid;
  const estimateUuid = latestProjectEstimate.value?.uuid;
  
  if (!projectUuid || !estimateUuid) {
    return;
  }
  
  try {
    const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
    if (!corpUuid) {
      return;
    }
    
    const response: any = await $fetch("/api/estimate-line-items", {
      method: "GET",
      query: {
        project_uuid: projectUuid,
        estimate_uuid: estimateUuid,
        corporation_uuid: corpUuid,
      },
    });

    const lineItems = Array.isArray(response?.data) ? response.data : [];
    const projectEnableLocationWise = response?.project_enable_location_wise === true;
    const priorCommitted = await fetchLaborPriorCommittedByKey();
    const laborItems = transformEstimateLineItemsToLaborItems(
      lineItems,
      projectEnableLocationWise,
      priorCommitted
    );
    availableLaborItems.value = laborItems;
  } catch (error: any) {
    return;
  }
  
  if (availableLaborItems.value.length === 0) {
    return;
  }
  
  // Mark this as editing existing selection (not initial import)
  isEditingLaborSelection.value = true;
  
  // Set pending data and open modal
  pendingLaborItemsKey.value = `estimate-${latestProjectEstimate.value?.uuid}`;
  showLaborItemsModal.value = true;
};

/** Prior labor PO line totals per cost code (+ location), for the same project, vendor, and corporation (exclude current PO when editing). */
const fetchLaborPriorCommittedByKey = async (): Promise<Map<string, number>> => {
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  const projectUuid = props.form.project_uuid;
  const vendorUuid = props.form.vendor_uuid;
  if (!corpUuid || !projectUuid || !vendorUuid) return new Map();
  try {
    const res: any = await $fetch('/api/labor-po-committed-amounts', {
      method: 'GET',
      query: {
        corporation_uuid: corpUuid,
        project_uuid: projectUuid,
        vendor_uuid: vendorUuid,
        ...(props.form.uuid ? { exclude_po_uuid: props.form.uuid } : {}),
      },
    });
    const raw = res?.data?.by_key;
    const map = new Map<string, number>();
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        if (Number.isFinite(num) && num !== 0) map.set(k, num);
      }
    }
    return map;
  } catch {
    return new Map();
  }
};

/** Prior committed on other POs; new lines default PO amount to null (user fills PO column). */
const computeLaborLineAmounts = (
  _budgetedLabor: number,
  existing: any | undefined,
  key: string,
  priorCommittedByKey?: Map<string, number>
): { priorCommitted: number; poAmount: number | null } => {
  const priorRaw = priorCommittedByKey?.get(key) ?? 0;
  const prior = Number.isFinite(priorRaw) ? priorRaw : 0;

  if (existing && existing.po_amount != null && existing.po_amount !== '') {
    const n = parseNumericInput(existing.po_amount);
    return {
      priorCommitted: prior,
      poAmount: Number.isFinite(n) ? n : null,
    };
  }
  return {
    priorCommitted: prior,
    poAmount: null,
  };
};

// Helper to transform estimate line items to labor items format.
// When enableLocationWise is true and a line item has location_wise_labor, one row per location is emitted.
const transformEstimateLineItemsToLaborItems = (
  lineItems: any[],
  enableLocationWise?: boolean,
  priorCommittedByKey?: Map<string, number>
): any[] => {
  const laborItems: any[] = [];
  const currentItems = Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [];
  const existingMap = new Map<string, any>();
  const keyFor = (item: any) =>
    item.location_uuid
      ? `${item.cost_code_uuid}::${item.location_uuid}`
      : String(item.cost_code_uuid || "");
  currentItems.forEach((item: any) => {
    if (item.cost_code_uuid) {
      existingMap.set(keyFor(item), item);
    }
  });

  lineItems.forEach((lineItem: any) => {
    const costCodeUuid = lineItem.cost_code_uuid;
    if (!costCodeUuid) return;

    const costCodeNumber = lineItem.cost_code_number || "";
    const costCodeName = lineItem.cost_code_name || "";
    const costCodeLabel = [costCodeNumber, costCodeName].filter(Boolean).join(" ").trim();
    const locationWise = Array.isArray(lineItem.location_wise_labor) ? lineItem.location_wise_labor : [];
    const useLocationWise = enableLocationWise === true && locationWise.length > 0;

    if (useLocationWise) {
      locationWise.forEach((row: { location_uuid?: string; amount?: number; location_name?: string }) => {
        const amount = parseNumericInput(row.amount ?? 0);
        if (amount <= 0) return;
        const locationUuid = row.location_uuid || "";
        const locationLabel = row.location_name ?? "";
        const key = `${costCodeUuid}::${locationUuid}`;
        const existing = existingMap.get(key);
        const { priorCommitted, poAmount } = computeLaborLineAmounts(
          amount,
          existing,
          key,
          priorCommittedByKey
        );
        const base = {
          cost_code_uuid: costCodeUuid,
          cost_code_number: costCodeNumber,
          cost_code_name: costCodeName,
          cost_code_label: costCodeLabel,
          labor_budgeted_amount: amount,
          location_uuid: locationUuid,
          location_label: locationLabel,
          metadata: {
            ...(existing?.metadata || {}),
            location_uuid: locationUuid,
            location_label: locationLabel,
            prior_committed_po_amount: priorCommitted,
          },
        };
        if (existing) {
          laborItems.push({
            ...existing,
            ...base,
            po_amount: poAmount,
          });
        } else {
          laborItems.push({
            ...base,
            po_amount: poAmount,
          });
        }
      });
    } else {
      const laborAmount = parseNumericInput(lineItem.labor_amount || 0);
      if (laborAmount <= 0) return;
      const existing = existingMap.get(String(costCodeUuid));
      const key = String(costCodeUuid);
      const { priorCommitted, poAmount } = computeLaborLineAmounts(
        laborAmount,
        existing,
        key,
        priorCommittedByKey
      );
      const meta = {
        ...(existing?.metadata || {}),
        location_uuid: undefined,
        location_label: undefined,
        prior_committed_po_amount: priorCommitted,
      };
      if (existing) {
        laborItems.push({
          ...existing,
          labor_budgeted_amount: laborAmount,
          cost_code_number: costCodeNumber,
          cost_code_name: costCodeName,
          cost_code_label: costCodeLabel,
          location_uuid: undefined,
          location_label: undefined,
          metadata: meta,
          po_amount: poAmount,
        });
      } else {
        laborItems.push({
          cost_code_uuid: costCodeUuid,
          cost_code_number: costCodeNumber,
          cost_code_name: costCodeName,
          cost_code_label: costCodeLabel,
          labor_budgeted_amount: laborAmount,
          metadata: meta,
          po_amount: poAmount,
        });
      }
    }
  });

  return laborItems;
};

// Helper to transform cost code configs to labor items format
const transformCostCodeConfigsToLaborItems = (
  configs: any[],
  priorCommittedByKey?: Map<string, number>
): any[] => {
  const laborItems: any[] = [];
  const currentItems = Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [];
  const existingMap = new Map<string, any>();
  currentItems.forEach((item: any) => {
    if (item.cost_code_uuid) {
      existingMap.set(String(item.cost_code_uuid), item);
    }
  });
  
  configs.forEach((config: any) => {
    const costCodeUuid = config.uuid;
    if (!costCodeUuid) return;
    
    const existing = existingMap.get(String(costCodeUuid));
    const key = String(costCodeUuid);
    const { priorCommitted, poAmount } = computeLaborLineAmounts(
      0,
      existing,
      key,
      priorCommittedByKey
    );
    const meta = {
      ...(existing?.metadata || {}),
      prior_committed_po_amount: priorCommitted,
    };
    if (existing) {
      laborItems.push({
        ...existing,
        labor_budgeted_amount: null,
        metadata: meta,
        po_amount: poAmount,
      });
    } else {
      laborItems.push({
        cost_code_uuid: costCodeUuid,
        cost_code_number: config.cost_code_number || '',
        cost_code_name: config.cost_code_name || '',
        cost_code_label: [config.cost_code_number, config.cost_code_name].filter(Boolean).join(' ').trim(),
        labor_budgeted_amount: null,
        metadata: meta,
        po_amount: poAmount,
      });
    }
  });
  
  return laborItems;
};

const applyEstimateItemsToForm = (
  poItems: any[],
  key: string | null,
  options: { force?: boolean } = {}
) => {
  const { force = false } = options

  if (!Array.isArray(poItems) || poItems.length === 0 || !key) {
    return
  }

  // Don't show modal if estimate is not approved
  if (isEstimateImportBlocked.value) {
    return
  }

  const currentItems = Array.isArray(props.form.po_items) ? props.form.po_items : []
  
  // Don't overwrite items if we're editing an existing PO (unless forced)
  if (!force && props.editingPurchaseOrder && currentItems.length > 0) {
    return
  }
  
  if (!force && lastAppliedEstimateItemsKey.value === key && currentItems.length > 0) {
    return
  }
  
  // Mark this as initial import (not editing existing selection)
  isEditingSelection.value = false;
  pendingEstimateKey.value = key;
  showEstimateItemsModal.value = true;
};

watch(
  [
    () => props.form.include_items,
    () => estimatePoItems.value,
    currentEstimateItemsKey,
    selectedCorporationUuid,
    selectedProjectUuid,
    () => effectiveEstimateUuid.value,
    () => estimateItemsLoading.value,
  ],
  async (
    [includeItems, poItems, estimateKey, corpUuid, projectUuid, estimateUuid, isLoading],
    [prevIncludeItems]
  ) => {
    // Prevent re-entry loop: if we're already processing this watcher, skip
    if (isProcessingEstimateItemsWatcher.value) {
      return;
    }
    
    try {
      isProcessingEstimateItemsWatcher.value = true;
      
      const includeValue = String(includeItems || '').toUpperCase();
      const previousInclude = String(prevIncludeItems || '').toUpperCase();

      const switchedToEstimate = includeValue === 'IMPORT_ITEMS_FROM_ESTIMATE'
      const switchedFromEstimate = previousInclude === 'IMPORT_ITEMS_FROM_ESTIMATE'

      const isInitialRun = typeof prevIncludeItems === 'undefined'

      // When editing an existing PO: skip item auto-import but still fetch estimate line items
      // so we can detect location-wise material and show the correct table
      if (switchedToEstimate && shouldSkipEstimateAutoImport.value) {
        if (corpUuid && projectUuid && estimateUuid && !isLaborPurchaseOrder.value) {
          try {
            locationWiseMaterialLoading.value = true;
            const lwResponse: any = await $fetch('/api/estimate-line-items', {
              method: 'GET',
              query: {
                project_uuid: projectUuid,
                estimate_uuid: estimateUuid,
                corporation_uuid: corpUuid,
              },
            });
            const lineItems = Array.isArray(lwResponse?.data) ? lwResponse.data : [];
            const enableLW = lwResponse?.project_enable_location_wise === true;
            estimateLineItemsForLocationWise.value = lineItems;
            // Only populate if no items already exist (editing mode preserves saved data)
            if (!hasLocationWiseMaterialItems.value) {
              await loadLocationWiseMaterialFromEstimate(lineItems, enableLW);
            }
          } catch (_err: any) {
            locationWiseMaterialError.value = null;
          } finally {
            locationWiseMaterialLoading.value = false;
          }
        }
        return
      }

      // Handle switching to estimate import
      if (switchedToEstimate) {

        // Ensure estimates are fetched first — estimateUuid from watcher args may be null
        // when the user selects the option before the store has loaded estimates for the project.
        if (corpUuid && projectUuid) {
          await purchaseOrderResourcesStore.ensureEstimates({
            corporationUuid: corpUuid,
            projectUuid,
            force: true,
          });
        }

        // Re-read reactive values AFTER the await: the store may now have estimates that
        // weren't there when the watcher args were captured (the stale-closure timing bug).
        const resolvedEstimateUuid = effectiveEstimateUuid.value
        const resolvedEstimateKey = currentEstimateItemsKey.value
        const resolvedPoItems = resolvedEstimateUuid
          ? purchaseOrderResourcesStore.getEstimateItems(corpUuid, projectUuid, resolvedEstimateUuid)
          : []
        const resolvedIsLoading = resolvedEstimateUuid
          ? purchaseOrderResourcesStore.getEstimateItemsLoading(corpUuid, projectUuid, resolvedEstimateUuid)
          : false

        // Now check the approval guard with freshly-loaded estimate data.
        if (isEstimateImportBlocked.value) {
          return
        }

        // If we have all required values, load and apply items
        // Skip this if we're editing an existing PO with saved items
        if (corpUuid && projectUuid && resolvedEstimateUuid && !shouldSkipEstimateAutoImport.value) {
          // If items are already loaded, show modal for selection
          if (Array.isArray(resolvedPoItems) && resolvedPoItems.length > 0) {
            applyEstimateItemsToForm(resolvedPoItems, resolvedEstimateKey, { force: switchedFromEstimate !== switchedToEstimate })
          }
          // If items are not loaded and not currently loading, fetch them first
          else if (!resolvedIsLoading && !shouldSkipEstimateAutoImport.value) {
            try {
              const loadedItems = await purchaseOrderResourcesStore.ensureEstimateItems({
                corporationUuid: corpUuid,
                projectUuid,
                estimateUuid: resolvedEstimateUuid,
                force: true,
              })

              const itemsToApply = Array.isArray(loadedItems) && loadedItems.length > 0
                ? loadedItems
                : purchaseOrderResourcesStore.getEstimateItems(corpUuid, projectUuid, resolvedEstimateUuid)

              if (Array.isArray(itemsToApply) && itemsToApply.length > 0 && resolvedEstimateKey) {
                applyEstimateItemsToForm(itemsToApply, resolvedEstimateKey, { force: switchedFromEstimate !== switchedToEstimate })
              }
            } catch (error) {
              // Failed to load estimate items
            }
          }
        }

        // For Material POs: also fetch estimate line items to detect location-wise material
        if (corpUuid && projectUuid && resolvedEstimateUuid && !isLaborPurchaseOrder.value) {
          try {
            locationWiseMaterialLoading.value = true;
            const lwResponse: any = await $fetch('/api/estimate-line-items', {
              method: 'GET',
              query: {
                project_uuid: projectUuid,
                estimate_uuid: resolvedEstimateUuid,
                corporation_uuid: corpUuid,
              },
            });
            const lineItems = Array.isArray(lwResponse?.data) ? lwResponse.data : [];
            const projectEnableLocationWise = lwResponse?.project_enable_location_wise === true;
            estimateLineItemsForLocationWise.value = lineItems;
            await loadLocationWiseMaterialFromEstimate(lineItems, projectEnableLocationWise);
          } catch (_err: any) {
            locationWiseMaterialError.value = null;
          } finally {
            locationWiseMaterialLoading.value = false;
          }
        }
      } else if (switchedFromEstimate && !switchedToEstimate) {
        lastAppliedEstimateItemsKey.value = null
        // Clear the skip flag when user switches away from estimate import
        // This allows fresh import if they switch back
        hasInitialPoItems.value = false
      }
    } finally {
      isProcessingEstimateItemsWatcher.value = false;
    }
  },
  { immediate: true }
);

watch(
  [
    () => props.form.include_items,
    selectedCorporationUuid,
    selectedProjectUuid,
  ],
  async ([includeItems, corpUuid, projectUuid], [prevIncludeItems]) => {
    // Prevent re-entry loop: if we're already processing this watcher, skip
    if (isProcessingPreferredItemsWatcher.value) {
      return;
    }
    
    try {
      isProcessingPreferredItemsWatcher.value = true;
      
      const includeValue = String(includeItems || '').toUpperCase();
      const previousInclude = String(prevIncludeItems || '').toUpperCase();

    const switchedToMaster = includeValue === 'IMPORT_ITEMS_FROM_MASTER'
    const switchedFromMaster = previousInclude === 'IMPORT_ITEMS_FROM_MASTER'

    if (switchedToMaster) {
    // Skip entire application logic when editing an existing PO with "Import from Master"
    // This check happens on initial mount (immediate: true) before DB items are loaded
    if (shouldSkipMasterAutoImport.value) {
      // Just fetch preferred items for dropdown options, but don't apply to form
      if (corpUuid) {
        await fetchMasterPoItems();
      }
      return; // Exit early - don't apply items to form
    }
    
    // Only apply preferred items when creating a new PO or switching modes
    if (corpUuid) {
      // Fetch preferred items directly from API
      await fetchMasterPoItems();
      
      // Get the fetched items
      const updatedPreferredItems = vendorFilteredMasterItems.value || [];
      const updatedSignature = getPreferredItemsSignature(updatedPreferredItems);
      
      const shouldForce =
        switchedFromMaster !== switchedToMaster ||
        updatedSignature !== lastAppliedPreferredItemsSignature.value;

      await applyPreferredItemsToForm(updatedPreferredItems, { force: shouldForce })
    }
    } else if (switchedFromMaster && !switchedToMaster) {
      lastAppliedPreferredItemsSignature.value = null
      // Clear the skip flag when user switches away from master import
      // This allows fresh import if they switch back
      hasInitialMasterItems.value = false
    }
    } finally {
      isProcessingPreferredItemsWatcher.value = false;
    }
  },
  { immediate: true }
);

// Note: Initialization is handled in the main onMounted hook below

const createEmptyPoItem = () => ({
  cost_code_uuid: null,
  cost_code_number: '',
  cost_code_name: '',
  division_name: '',
  item_type_uuid: null,
  sequence_uuid: null,
  item_uuid: null,
  description: '',
  model_number: '',
  location_uuid: null,
  location: '',
  unit_price: 0,
  po_unit_price: null,
  uom: '',
  uom_uuid: null,
  uom_label: '',
  quantity: 0,
  po_quantity: null,
  total: 0,
  po_total: null,
  approval_checks: null,
  display_metadata: {
    cost_code_label: '',
    cost_code_number: '',
    cost_code_name: '',
    division_name: '',
    item_type_label: '',
    sequence: '',
    location_display: '',
    unit_uuid: null,
    unit_label: '',
  },
});

const createEmptyLaborPoItem = () => ({
  cost_code_uuid: null,
  cost_code_number: '',
  cost_code_name: '',
  cost_code_label: '',
  labor_budgeted_amount: null,
  po_amount: null,
});

const computePoItemEffectiveTotal = (item: any): number => {
  const hasPoUnitPrice =
    item?.po_unit_price !== null &&
    item?.po_unit_price !== undefined &&
    item?.po_unit_price !== ''
  const hasPoQuantity =
    item?.po_quantity !== null &&
    item?.po_quantity !== undefined &&
    item?.po_quantity !== ''

  if (hasPoUnitPrice && hasPoQuantity) {
    const poUnitPrice = parseNumericInput(item?.po_unit_price)
    const poQuantity = parseNumericInput(item?.po_quantity)
    return roundCurrencyValue(poUnitPrice * poQuantity)
  }

  const poTotal = parseNumericInput(item?.po_total)
  if (poTotal) {
    return roundCurrencyValue(poTotal)
  }

  return 0
}

// Compute item total directly from PO items using a computed property for maximum reactivity
const itemTotal = computed(() => {
  // For Labor PO, calculate from labor_po_items
  if (isLaborPurchaseOrder.value) {
    const laborItems = Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [];
    const total = laborItems.reduce((sum: number, item: any) => {
      const poAmount = parseNumericInput(item?.po_amount);
      return sum + roundCurrencyValue(poAmount);
    }, 0);
    return total;
  }
  
  // For Material PO, calculate from po_items + location-wise material items
  const items = Array.isArray(props.form.po_items) ? props.form.po_items : []
  
  const total = items.reduce((sum: number, item: any, index: number) => {
    const unitPrice = item?.po_unit_price
    const quantity = item?.po_quantity
    const poTotal = item?.po_total
    const _ = item && index
    
    const itemTotal = computePoItemEffectiveTotal(item)
    return sum + itemTotal
  }, 0)

  // Add location-wise material PO amounts
  const lwmItems = Array.isArray(props.form.po_location_wise_material_items)
    ? props.form.po_location_wise_material_items
    : [];
  const lwmTotal = lwmItems.reduce((sum: number, item: any) => {
    return sum + roundCurrencyValue(parseNumericInput(item?.po_amount));
  }, 0);
  
  const rounded = roundCurrencyValue(total + lwmTotal)
  return rounded
})

const normalizeMatchValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  return String(value).trim().toUpperCase()
}

const firstNonEmptyMatch = (...values: any[]) => {
  for (const candidate of values) {
    const normalized = normalizeMatchValue(candidate)
    if (normalized) {
      return normalized
    }
  }
  return ''
}

const buildPoItemMatchKey = (item: any): string => {
  const display = item?.display_metadata || {}
  const costCode = firstNonEmptyMatch(
    item?.cost_code_uuid,
    display?.cost_code_uuid,
    item?.cost_code_number,
    display?.cost_code_number,
    item?.cost_code_label,
    display?.cost_code_label
  )
  const itemType = firstNonEmptyMatch(
    item?.item_type_uuid,
    display?.item_type_uuid,
    item?.item_type_label,
    display?.item_type_label
  )
  const itemIdentifier = firstNonEmptyMatch(
    item?.item_uuid,
    display?.item_uuid,
    item?.name,
    item?.item_name,
    display?.item_name,
    item?.description
  )

  if (!costCode && !itemType && !itemIdentifier) {
    return normalizeMatchValue(item?.id || item?.uuid || '')
  }

  return [costCode, itemType, itemIdentifier].join('|')
}

const mergePoSpecificFields = (target: any, source: any) => {
  if (!source || typeof source !== 'object') return

  const hasValue = (value: any) =>
    value !== null && value !== undefined && value !== ''

  const fieldsToCopy = ['po_unit_price', 'po_quantity', 'po_total']
  fieldsToCopy.forEach((field) => {
    if (hasValue(source[field]) && !hasValue(target[field])) {
      target[field] = source[field]
    }
  })

  const srcChecks = Array.isArray(source.approval_checks) ? source.approval_checks : null
  const srcChecksUuids = Array.isArray(source.approval_checks_uuids)
    ? source.approval_checks_uuids
    : null
  const tgtChecks = Array.isArray(target.approval_checks) ? target.approval_checks : null
  const tgtChecksUuids = Array.isArray(target.approval_checks_uuids)
    ? target.approval_checks_uuids
    : null
  if ((!tgtChecks || tgtChecks.length === 0) && srcChecks && srcChecks.length > 0) {
    target.approval_checks = [...srcChecks]
  }
  if ((!tgtChecksUuids || tgtChecksUuids.length === 0) && srcChecksUuids && srcChecksUuids.length > 0) {
    target.approval_checks_uuids = [...srcChecksUuids]
  }

  if (source.unit && !target.unit) {
    target.unit = source.unit
  }
  if (source.unit_label && !target.unit_label) {
    target.unit_label = source.unit_label
  }
  if (source.uom_label && !target.uom_label) {
    target.uom_label = source.uom_label
  }
  if (source.uom_uuid && !target.uom_uuid) {
    target.uom_uuid = source.uom_uuid
  }
  if (source.model_number && !target.model_number) {
    target.model_number = source.model_number
  }

  if (source.display_metadata) {
    target.display_metadata = {
      ...(source.display_metadata || {}),
      ...(target.display_metadata || {}),
    }
  }
}

const updatePoItems = (items: any[], skipMerge = false) => {
  // Validate items array
  if (!Array.isArray(items)) {
    return;
  }
  
  if (items.length === 0) {
    // Don't return early - empty array might be valid (e.g., clearing items)
  }

  // If skipMerge is true, just use the items as-is (for direct user edits)
  // Always create a new array reference to ensure reactivity
  if (skipMerge) {
    // Deep clone items to ensure Vue tracks changes
    const clonedItems = items.map((item: any) => {
      // Log model_number before cloning
      if (item.model_number || (item.display_metadata && item.display_metadata.model_number)) {
        console.log('[updatePoItems] Item with model_number before clone:', {
          item_uuid: item.item_uuid,
          model_number: item.model_number,
          display_metadata: item.display_metadata ? {
            model_number: item.display_metadata.model_number
          } : null
        });
      }
      // Ensure model_number is preserved from both top-level and display_metadata
      const modelNumber = item.model_number || (item.display_metadata?.model_number) || '';
      return {
        ...item,
        model_number: modelNumber, // Explicitly preserve model_number
        display_metadata: item.display_metadata ? { 
          ...item.display_metadata,
          model_number: modelNumber // Also ensure it's in display_metadata
        } : { model_number: modelNumber },
      };
    });
    
    // Log after cloning
    clonedItems.forEach((item: any, index: number) => {
      if ((item.model_number || (item.display_metadata && item.display_metadata.model_number)) && index < 3) {
        console.log('[updatePoItems] Item', index, 'after clone:', {
          item_uuid: item.item_uuid,
          model_number: item.model_number,
          display_metadata: item.display_metadata ? {
            model_number: item.display_metadata.model_number
          } : null
        });
      }
    });
    
    // Apply immediately so edits (e.g., rich-text description) are present
    // in the form state before a user triggers Save in the same interaction.
    updateFormFields({
      po_items: clonedItems,
    });
    return
  }
  
  const existingItems = Array.isArray(props.form.po_items)
    ? props.form.po_items
    : []
  const existingLookup = new Map<string, any>()
  const matchedKeys = new Set<string>()
  existingItems.forEach((item: any, index: number) => {
    const key = buildPoItemMatchKey(item)
    if (key) {
      existingLookup.set(`key:${key}`, item)
    }
    const fallback = normalizeMatchValue(item?.id || item?.uuid || index)
    if (fallback) {
      existingLookup.set(`id:${fallback}`, item)
    }
  })

  const cloned = items.map((item: any) => ({
    ...item,
    display_metadata: { ...(item.display_metadata || {}) },
  }))
  const merged = cloned.map((item, index) => {
    const key = buildPoItemMatchKey(item)
    let existing: any = null
    if (key) {
      existing = existingLookup.get(`key:${key}`)
    }
    if (!existing) {
      const fallback = normalizeMatchValue(item?.id || item?.uuid || index)
      if (fallback) {
        existing = existingLookup.get(`id:${fallback}`)
        if (existing) {
          matchedKeys.add(`id:${fallback}`)
        }
      }
    } else {
      matchedKeys.add(`key:${key}`)
      const fallback = normalizeMatchValue(existing?.id || existing?.uuid || index)
      if (fallback) {
        matchedKeys.add(`id:${fallback}`)
      }
    }

    if (existing) {
      mergePoSpecificFields(item, existing)
    }
    item.po_total = computePoItemEffectiveTotal(item)
    return item
  })
  existingItems.forEach((item: any, index: number) => {
    const key = buildPoItemMatchKey(item)
    const fallback = normalizeMatchValue(item?.id || item?.uuid || index)
    const keyMatched = key ? matchedKeys.has(`key:${key}`) : false
    const idMatched = fallback ? matchedKeys.has(`id:${fallback}`) : false

    if (!keyMatched && !idMatched) {
      const clonedItem = {
        ...item,
        display_metadata: { ...(item.display_metadata || {}) },
      }
      clonedItem.po_total = computePoItemEffectiveTotal(clonedItem)
      merged.push(clonedItem)
    }
  })
  // Update the form with the new items array
  // Don't set item_total here - let the computed handle it
  updateFormFields({
    po_items: merged,
  })
  
  // The itemTotal computed will automatically recalculate
  // which will then trigger recalculateChargesAndTaxes via its watcher
};

const insertPoItemAfter = (index: number) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  const newItem = createEmptyPoItem();
  const insertIndex = Math.min(Math.max(index, -1), current.length - 1);
  current.splice(insertIndex + 1, 0, newItem);
  updatePoItems(current, true); // Skip merge for direct edits
};

const removePoItemAt = (index: number) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const removedItem = clonePoItem(current[targetIndex])
  current.splice(targetIndex, 1);
  
  if (removedItem) {
    // Ensure removed item has computed total before adding to removed list
    removedItem.po_total = computePoItemEffectiveTotal(removedItem)
    const updatedRemoved = appendRemovedPoItem(removedItem)
    
    // Update both removed_po_items and po_items in a single emission to avoid race conditions
    updateFormFields({ removed_po_items: updatedRemoved, po_items: current })
    
    // Recalculate totals after removing the item
    nextTick(() => {
      recalculateChargesAndTaxes()
    })
    return
  }
  
  // If no item was removed, just update po_items
  updateFormFields({ po_items: current })
  nextTick(() => {
    recalculateChargesAndTaxes()
  })
};

const updatePoItemCostCode = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.cost_code_uuid = value || null;

  if (option) {
    const raw = option.costCode || option;
    const costCodeNumber = raw.cost_code_number || raw.cost_code_number_display || '';
    const costCodeName = raw.cost_code_name || '';
    const divisionName = raw.division?.division_name || raw.division_name || '';

    item.cost_code_number = costCodeNumber;
    item.cost_code_name = costCodeName;
    item.division_name = divisionName;

    metadata.cost_code_number = costCodeNumber;
    metadata.cost_code_name = costCodeName;
    metadata.division_name = divisionName;
    metadata.cost_code_label = [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim();
  }

  metadata.cost_code_label = metadata.cost_code_label || '';
  metadata.cost_code_number = metadata.cost_code_number || '';
  metadata.cost_code_name = metadata.cost_code_name || '';
  metadata.division_name = metadata.division_name || '';
  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemType = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  const oldItemTypeUuid = item.item_type_uuid;
  item.item_type_uuid = value || null;

  const resolvedLabel =
    option?.label ||
    option?.item_type ||
    option?.item_type_name ||
    (value ? itemTypeNamesByUuid.value.get(value) : '') ||
    '';

  item.item_type_label = resolvedLabel;
  metadata.item_type_label = resolvedLabel;
  item.display_metadata = metadata;

  if (oldItemTypeUuid !== item.item_type_uuid) {
    item.item_uuid = null;
    item.item_name = '';
    item.name = '';
    metadata.item_name = '';
    item.sequence = null;
    item.item_sequence = null;
    metadata.sequence = null;
    item.description = '';
  }

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemCategory = ({ index, value }: { index: number; value: string | null }) => {
  const current = Array.isArray(props.form.po_items) ? [...props.form.po_items] : [];
  if (!current.length) return;

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.category = value || '';
  metadata.category = value || '';

  item.item_division_uuid = null;
  metadata.item_division_uuid = null;
  item.division_name = '';
  metadata.division_name = '';

  item.item_type_uuid = null;
  item.item_type_label = '';
  metadata.item_type_label = '';

  item.item_uuid = null;
  item.item_name = '';
  item.name = '';
  metadata.item_name = '';
  item.sequence = null;
  item.item_sequence = null;
  metadata.sequence = null;

  item.description = '';
  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true);
};

/** Kept for programmatic updates and unit tests; PO items table no longer exposes a division control. */
const updatePoItemDivision = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.po_items) ? [...props.form.po_items] : [];
  if (!current.length) return;

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.item_division_uuid = value || null;
  metadata.item_division_uuid = value || null;

  const divisionName =
    option?.label ||
    option?.division_name ||
    '';

  item.division_name = divisionName;
  metadata.division_name = divisionName;

  item.item_type_uuid = null;
  item.item_type_label = '';
  metadata.item_type_label = '';

  item.item_uuid = null;
  item.item_name = '';
  item.name = '';
  metadata.item_name = '';
  item.sequence = null;
  item.item_sequence = null;
  metadata.sequence = null;

  item.description = '';
  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true);
};

const updatePoItemLocation = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.location_uuid = value || null;

  if (option) {
    const locationName = option?.location_name || option?.label || '';
    item.location = locationName;
    metadata.location_display = locationName;
  }

  if (!option) {
    item.location = '';
    metadata.location_display = '';
  }

  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemDescription = ({ index, value }: { index: number; value: string }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.description = value ?? '';
  metadata.description = item.description;
  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemItem = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  console.log('[updatePoItemItem] Called with:', { index, value, option: option ? { label: option.label, raw: option.raw, hasRaw: !!option.raw } : null });
  
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.item_uuid = value || null;

  if (option) {
    const raw = option.raw || option;
    console.log('[updatePoItemItem] Raw option data:', { 
      hasRaw: !!raw, 
      model_number: raw?.model_number,
      item_uuid: raw?.item_uuid || raw?.uuid,
      item_name: raw?.item_name || raw?.name,
      keys: raw ? Object.keys(raw) : []
    });
    
    const label = option.label || raw?.item_name || raw?.label || '';
    if (label) {
      item.name = label;
      metadata.item_name = label;
    }

    if (raw?.description !== undefined) {
      item.description = raw.description || '';
      metadata.description = raw.description || '';
    }

    if (raw?.unit !== undefined) {
      item.unit = raw.unit || '';
    }

    const resolvedUnitUuid =
      raw?.unit_uuid ||
      raw?.uom_uuid ||
      (raw?.unit && String(raw.unit).length === 36 ? raw.unit : null);
    const resolvedUnitLabel = raw?.unit_label || raw?.unit_short_name || raw?.unit || '';

    if (resolvedUnitUuid || resolvedUnitLabel) {
      item.uom_uuid = resolvedUnitUuid || null;
      item.uom_label = resolvedUnitLabel || '';
      item.uom = resolvedUnitLabel || item.uom || '';
      metadata.unit_uuid = item.uom_uuid;
      metadata.unit_label = resolvedUnitLabel;
      metadata.unit = resolvedUnitLabel;
    }

    if (raw?.item_type_uuid) {
      item.item_type_uuid = raw.item_type_uuid;
      metadata.item_type_uuid = raw.item_type_uuid;
    }

    const unitPrice = normalizeNumber(raw?.unit_price, item.unit_price ?? 0);
    item.unit_price = unitPrice;

    // Resolve model_number - prefer from raw option, then lookup from preferred items
    let resolvedModelNumber = raw?.model_number;
    console.log('[updatePoItemItem] Initial model_number from raw:', resolvedModelNumber);
    
    if ((resolvedModelNumber === undefined || resolvedModelNumber === null || resolvedModelNumber === '') && value) {
      // Look up from preferred items if not in raw option
      const preferredItem = preferredItemOptionMap.value.get(String(value));
      console.log('[updatePoItemItem] Looking up preferred item:', {
        value,
        found: !!preferredItem,
        preferredItemRaw: preferredItem?.raw ? {
          model_number: preferredItem.raw.model_number,
          item_uuid: preferredItem.raw.item_uuid || preferredItem.raw.uuid,
          keys: Object.keys(preferredItem.raw)
        } : null,
        preferredItemKeys: preferredItem ? Object.keys(preferredItem) : []
      });
      
      if (preferredItem?.raw?.model_number !== undefined && preferredItem.raw.model_number !== null && preferredItem.raw.model_number !== '') {
        resolvedModelNumber = preferredItem.raw.model_number;
        console.log('[updatePoItemItem] Found model_number from preferred item:', resolvedModelNumber);
      } else {
        console.log('[updatePoItemItem] No model_number found in preferred item raw');
      }
    }
    
    // Always set model_number (even if empty string) to ensure it's available for display
    const finalModelNumber = resolvedModelNumber !== undefined && resolvedModelNumber !== null ? (resolvedModelNumber || '') : (item.model_number || '');
    item.model_number = finalModelNumber;
    metadata.model_number = finalModelNumber;
    console.log('[updatePoItemItem] Final model_number set:', { 
      finalModelNumber, 
      itemModelNumber: item.model_number,
      metadataModelNumber: metadata.model_number
    });

    const quantity = normalizeNumber(item.quantity, 0);
    item.total = unitPrice * quantity;
  }

  item.display_metadata = metadata;
  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

// When sequence (item UUID) changes via SequenceSelect, reuse the same logic as item selection
const updatePoItemSequence = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  updatePoItemItem({ index, value, option });
};

const updatePoItemPoUnitPrice = ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const isEmpty = value === '' || value === null || value === undefined;

  item.po_unit_price = isEmpty ? null : numericValue;
  item.po_total = computedTotal;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemPoQuantity = ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const isEmpty = value === '' || value === null || value === undefined;

  item.po_quantity = isEmpty ? null : numericValue;
  item.po_total = computedTotal;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemPoTotal = ({ index, value }: { index: number; value: number }) => {
  // This event is emitted after po-unit-price-change or po-quantity-change
  // The total has already been set by those handlers, so we can skip this
  // to avoid race conditions where we read stale data from props.form.po_items
  return;
};

const updatePoItemModelNumber = ({ index, value }: { index: number; value: string }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };

  item.model_number = value;
  if (item.display_metadata) {
    item.display_metadata.model_number = value;
  }

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemApprovalChecks = ({
  index,
  value,
  rawItem,
}: {
  index: number;
  value: string[];
  /** Same object reference as the row in `form.po_items` (see `mapPoItemForDisplay` → `raw`). Required when the table is filtered (e.g. removed rows) so display index ≠ `po_items` index. */
  rawItem?: unknown;
}) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  let targetIndex = -1;
  if (rawItem != null && typeof rawItem === "object") {
    targetIndex = current.findIndex((row) => row === rawItem);
  }
  if (targetIndex < 0) {
    targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  }

  const item = { ...current[targetIndex] };

  // Store approval checks as array of UUIDs
  item.approval_checks = Array.isArray(value) ? value : [];
  if (item.display_metadata) {
    item.display_metadata.approval_checks = item.approval_checks;
  }

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

const updatePoItemUom = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.po_items)
    ? [...props.form.po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.uom_uuid = value || null;
  item.unit_uuid = item.uom_uuid;

  const resolvedLabel =
    option?.label ||
    option?.shortName ||
    option?.uom?.short_name ||
    option?.uom?.uom_name ||
    '';

  item.uom_label = resolvedLabel;
  item.uom = resolvedLabel || item.uom || '';
  item.unit_label = resolvedLabel || item.unit_label || '';
  item.unit = resolvedLabel || item.unit || '';

  metadata.unit_uuid = item.uom_uuid;
  metadata.unit_label = resolvedLabel;
  metadata.unit = resolvedLabel;
  item.display_metadata = metadata;

  current[targetIndex] = item;
  updatePoItems(current, true); // Skip merge for direct edits
};

// Labor PO Items handlers
const insertLaborPoItemAfter = (index: number) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  const newItem = createEmptyLaborPoItem();
  const insertIndex = Math.min(Math.max(index, -1), current.length - 1);
  current.splice(insertIndex + 1, 0, newItem);
  updateFormFields({ labor_po_items: current });
};

const removeLaborPoItemAt = (index: number) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  current.splice(targetIndex, 1);
  updateFormFields({ labor_po_items: current });
  
  // Recalculate totals after removing the item
  nextTick(() => {
    recalculateChargesAndTaxes()
  })
};

const updateLaborPoItemCostCode = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };

  item.cost_code_uuid = value || null;

  if (option) {
    const raw = option.costCode || option;
    const costCodeNumber = raw.cost_code_number || raw.cost_code_number_display || '';
    const costCodeName = raw.cost_code_name || '';
    const divisionName = raw.division?.division_name || raw.division_name || '';

    item.cost_code_number = costCodeNumber;
    item.cost_code_name = costCodeName;
    item.cost_code_label = [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim();
    
    // Fetch labor budgeted amount from estimate (Labor PO always uses estimate)
    if (latestProjectEstimate.value && value) {
      const estimate = latestProjectEstimate.value;
      if (estimate.line_items && Array.isArray(estimate.line_items)) {
        const matchingLineItem = estimate.line_items.find(
          (li: any) => String(li.cost_code_uuid || '') === String(value)
        );
        if (matchingLineItem) {
          const laborAmount = parseNumericInput(matchingLineItem.labor_amount || 0);
          item.labor_budgeted_amount = laborAmount > 0 ? laborAmount : null;
        }
      }
    }
  } else {
    // If cost code is cleared, clear labor budgeted amount
    item.labor_budgeted_amount = null;
  }

  current[targetIndex] = item;
  updateFormFields({ labor_po_items: current });
};

const updateLaborPoItemAmount = ({ index, numericValue }: { index: number; numericValue: number }) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };

  item.po_amount = numericValue;

  current[targetIndex] = item;
  updateFormFields({ labor_po_items: current });

  // Recalculate totals after updating the amount
  nextTick(() => {
    recalculateChargesAndTaxes()
  })
};

const updateLaborPoItemLocation = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };

  item.location_uuid = value || null;

  const locationLabel =
    option?.label ||
    option?.location?.location_name ||
    null;

  item.location_label = locationLabel;

  const metadata = (item.metadata && typeof item.metadata === 'object') ? { ...item.metadata } : {};
  metadata.location_uuid = item.location_uuid;
  metadata.location_label = item.location_label;
  item.metadata = metadata;

  current[targetIndex] = item;
  updateFormFields({ labor_po_items: current });
};

const updateLaborPoItemDescription = ({ index, value }: { index: number; value: string }) => {
  const current = Array.isArray(props.form.labor_po_items)
    ? [...props.form.labor_po_items]
    : [];

  if (!current.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };

  item.description = value || '';

  const metadata = (item.metadata && typeof item.metadata === 'object') ? { ...item.metadata } : {};
  metadata.description = item.description;
  item.metadata = metadata;

  current[targetIndex] = item;
  updateFormFields({ labor_po_items: current });
};

// File upload functionality
const uploadedFiles = ref<File[]>([]);
const fileUploadError = ref<string | null>(null);
const isUploading = ref(false);
// Removed: Estimates are now fetched only when a project is selected

// File preview functionality
const showFilePreviewModal = ref(false);
const selectedFileForPreview = ref<any>(null);

// Vendor edit functionality
const showVendorEditModal = ref(false);
const editingVendor = ref<any>(null);

// Computed property for file upload error message
const fileUploadErrorMessage = computed(() => {
  return fileUploadError.value;
});

const totalAttachmentCount = computed(() =>
  Array.isArray(props.form.attachments) ? props.form.attachments.length : 0
);

const uploadedAttachmentCount = computed(() =>
  Array.isArray(props.form.attachments)
    ? props.form.attachments.filter((att: any) => att?.uuid || att?.isUploaded).length
    : 0
);

// Helper to format country code to full name
const getCountryName = (countryCode: string): string => {
  if (!countryCode) return '';
  const countryMap: Record<string, string> = {
    'US': 'UNITED STATES OF AMERICA',
    'CA': 'CANADA',
    'GB': 'UNITED KINGDOM',
    'AU': 'AUSTRALIA',
    'MX': 'MEXICO',
    // Add more as needed
  };
  return countryMap[countryCode.toUpperCase()] || countryCode.toUpperCase();
};

/** Active shipment addresses for the selected project (matches ProjectDetailsForm shipment rows). */
const projectShippingAddresses = computed((): ProjectAddress[] => {
  if (!isProjectPurchaseOrder.value || !props.form.project_uuid) return [];
  const addresses = projectAddressesStore.getAddresses(props.form.project_uuid);
  if (!addresses?.length) return [];
  return addresses.filter(
    (a) => a.is_active !== false && a.address_type === 'shipment'
  );
});

const formatShipmentAddressOneLine = (addr: ProjectAddress | null | undefined): string => {
  if (!addr) return '';
  const parts = [
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state,
    addr.zip_code,
    getCountryName(addr.country || ''),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ').toUpperCase() : '';
};

/** Full shipment block for dropdown (one string per line), same data as one-line plus contact fields. */
const formatShipmentAddressFullLines = (addr: ProjectAddress | null | undefined): string[] => {
  if (!addr) return [];
  const up = (s: string) => String(s || '').trim().toUpperCase();
  const lines: string[] = [];
  if (addr.address_line_1) lines.push(up(addr.address_line_1));
  if (addr.address_line_2) lines.push(up(addr.address_line_2));
  const city = addr.city ? String(addr.city).trim() : '';
  const state = addr.state ? String(addr.state).trim() : '';
  const zip = addr.zip_code ? String(addr.zip_code).trim() : '';
  const cityState = [city, state].filter(Boolean).join(', ');
  const locParts: string[] = [];
  if (cityState) locParts.push(cityState.toUpperCase());
  if (zip) locParts.push(zip.toUpperCase());
  if (locParts.length) lines.push(locParts.join(' '));
  const country = getCountryName(addr.country || '');
  if (country) lines.push(country);
  const contact = addr.contact_person?.trim();
  if (contact) lines.push(`CONTACT: ${up(contact)}`);
  const phone = addr.phone?.trim();
  if (phone) lines.push(`PHONE: ${up(phone)}`);
  const email = addr.email?.trim();
  if (email) lines.push(`EMAIL: ${email.toUpperCase()}`);
  return lines;
};

/** Resolved row for Ship To display: form UUID if valid, else primary / first shipment address. */
const resolvedShipToProjectAddress = computed((): ProjectAddress | null => {
  const list = projectShippingAddresses.value;
  if (!list.length) return null;
  const formUuid = String(props.form.shipping_address_uuid || '').trim();
  if (formUuid) {
    const match = list.find((a) => String(a.uuid) === formUuid);
    if (match) return match;
  }
  return list.find((a) => a.is_primary) || list[0] || null;
});

// Ship To formatted text (single display + tests); uses saved shipping_address_uuid when set and valid
const activeProjectAddressText = computed(() =>
  formatShipmentAddressOneLine(resolvedShipToProjectAddress.value)
);

const showShipToAddressDropdown = computed(
  () =>
    isProjectPurchaseOrder.value &&
    projectShippingAddresses.value.length > 1 &&
    !props.readonly
);

/** Lines shown in the Ship To select trigger when multiple addresses exist */
const shipToAddressTriggerLines = computed((): string[] => {
  if (!showShipToAddressDropdown.value) return [];
  const uuid = String(props.form.shipping_address_uuid || '').trim();
  const list = projectShippingAddresses.value;
  const addr = uuid ? list.find((a) => String(a.uuid) === uuid) : null;
  const resolved = addr ?? resolvedShipToProjectAddress.value;
  return formatShipmentAddressFullLines(resolved);
});

const shipToAddressSelectMenuUi = {
  content: 'max-h-72 min-w-full max-w-lg',
};

const shipToAddressSelectItems = computed(() =>
  projectShippingAddresses.value.map((a) => {
    const lines = formatShipmentAddressFullLines(a);
    return {
      value: a.uuid,
      label: lines.join(' · ') || String(a.uuid),
      lines,
      searchText: lines.join(' '),
    };
  })
);

/** Primitive UUID for USelectMenu (value-key); object v-model breaks option list in Nuxt UI alpha. */
const shipToSelectModelValue = computed((): string | undefined => {
  const items = shipToAddressSelectItems.value;
  if (!items.length) return undefined;
  const uuid = String(props.form.shipping_address_uuid || '').trim();
  if (uuid && items.some((i) => String(i.value) === uuid)) {
    return uuid;
  }
  const first = items[0];
  return first ? String(first.value) : undefined;
});

const onShipToSelectUpdate = (payload: unknown) => {
  let next = '';
  if (payload != null && typeof payload === 'object' && 'value' in (payload as Record<string, unknown>)) {
    const v = (payload as { value?: unknown }).value;
    next = v != null && String(v).trim() !== '' ? String(v) : '';
  } else if (payload != null && String(payload).trim() !== '') {
    next = String(payload);
  }
  handleFormUpdate('shipping_address_uuid', next);
};

// Vendor address block (display only)
const vendorAddressText = computed(() => {
  if (props.form.vendor_uuid) {
    const vendor = vendorStore.vendors.find((v: any) => v.uuid === props.form.vendor_uuid)
    if (vendor) {
      const parts = [
        vendor.vendor_address,
        vendor.vendor_city,
        vendor.vendor_state,
        vendor.vendor_zip,
        getCountryName(vendor.vendor_country || '')
      ].filter(Boolean)
      const addr = parts.length > 0 ? parts.join(', ').toUpperCase() : ''
      return addr
    }
  }
  return ''
})

// Methods
const updateFormFields = (fields: Record<string, any>) => {
  // Ensure deep cloning for nested arrays to trigger reactivity
  const updatedForm = { ...props.form };
  Object.keys(fields).forEach(key => {
    if ((key === 'po_items' || key === 'removed_po_items') && Array.isArray(fields[key])) {
      // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
      // This ensures that nested property changes (like po_unit_price, po_quantity) trigger reactivity
      updatedForm[key] = fields[key].map((item: any) => ({
        ...item,
        display_metadata: item.display_metadata ? { ...item.display_metadata } : {},
      }));
    } else {
      updatedForm[key] = fields[key];
    }
  });
  
  emit('update:form', updatedForm);
};

const handleFormUpdate = (field: string, value: any) => {
  if (field === 'po_type' || field === 'po_type_uuid') {
    setPoTypeFromInput(value);
    return;
  }
  updateFormFields({ [field]: value });
};

const handleIsRevisedChange = (value: boolean) => {
  if (value) {
    updateFormFields({ is_revised: true, revision_date: toUTCString(getCurrentLocal()) });
  } else {
    updateFormFields({ is_revised: false, revision_number: '', revision_notes: '', revision_date: null });
  }
};

const handlePoModeChange = (value?: string) => {
  const normalized = normalizePoMode(value);
  const updates: Record<string, any> = { po_mode: normalized };

  // CUSTOM mode is no longer available - commented out
  // if (normalized === "CUSTOM") {
  //   if (props.form.project_uuid) {
  //     updates.project_uuid = null;
  //   }
  //   if (props.form.shipping_address_uuid) {
  //     updates.shipping_address_uuid = null;
  //   }
  // } else {
    if (props.form.shipping_address_custom) {
      updates.shipping_address_custom = null;
    }
  // }

  updateFormFields(updates);
  enforceIncludeItemsConsistency();
};

const handleCorporationChange = async (corporationUuid?: string | null) => {
  const normalizedCorporationUuid = corporationUuid || '';

  // Switching corporations invalidates project, vendor, and all item data.
  laborItemsUserConfirmed.value = false;
  updateFormFields({
    corporation_uuid: normalizedCorporationUuid,
    project_uuid: '',
    project_id: '',
    vendor_uuid: '',
    shipping_address_uuid: '',
    po_items: [],
    labor_po_items: [],
    po_location_wise_material_items: [],
    removed_po_items: [],
    include_items: '',
    estimate_uuid: null,
  });

  if (normalizedCorporationUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(normalizedCorporationUuid),
      ensureItemTypesLoaded(normalizedCorporationUuid, undefined),
      uomStore.fetchUOM(normalizedCorporationUuid, false),
    ]);
  }

  // New PO: clear draft number until a project is selected so sequence matches per-project prefix on save.
  if (!props.form.uuid) {
    handleFormUpdate('po_number', '');
  }
};

const handleProjectChange = async (projectUuid?: string | null) => {
  const normalizedProjectUuid = projectUuid || '';
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;

  // Look up project_id from stores
  let projectId = '';
  if (normalizedProjectUuid && corpUuid) {
    const listProjects = purchaseOrderListResourcesStore.getProjects(corpUuid) || [];
    const project = listProjects.find((p: any) => p.uuid === normalizedProjectUuid)
      || (projectsStore.projects || []).find((p: any) => p.uuid === normalizedProjectUuid);
    projectId = project?.project_id || '';
  }

  // Clear all item data and dependent selections when switching projects.
  // Items are project-specific (tied to estimates/cost codes) and become
  // stale when the project changes.
  laborItemsUserConfirmed.value = false;
  updateFormFields({
    project_uuid: normalizedProjectUuid,
    project_id: projectId,
    po_items: [],
    labor_po_items: [],
    po_location_wise_material_items: [],
    removed_po_items: [],
    include_items: '',
    estimate_uuid: null,
  });

  if (normalizedProjectUuid && corpUuid) {
    await projectAddressesStore.fetchAddresses(normalizedProjectUuid);
    const addresses = projectAddressesStore.getAddresses(normalizedProjectUuid) as any[] | undefined;
    const shippingList = Array.isArray(addresses)
      ? addresses.filter(
          (a: any) => a.is_active !== false && a.address_type === 'shipment'
        )
      : [];
    const primary =
      shippingList.find((a: any) => a.is_primary) || shippingList[0] || null;
    // Preserve project fields while setting shipment address to avoid async overwrite races.
    updateFormFields({
      project_uuid: normalizedProjectUuid,
      project_id: projectId,
      shipping_address_uuid: primary?.uuid ?? '',
    });
    await refreshPoScopedLocations(normalizedProjectUuid);
  } else {
    poScopedLocations.value = [];
  }
  if (normalizedProjectUuid) {
    // Recompute next suffix for the selected project so "Add new PO" matches To be raised / save prefix behavior.
    await generatePONumber({ force: !props.form.uuid, projectId });
  }
};

const handleVendorChange = (value: any) => {
  const vendorUuid = typeof value === 'string' ? value : (value && typeof value === 'object' ? value.value : '');

  // Material + estimate lines (including "Create PO for pending QTY" from To be raised) are tied
  // to cost codes / estimate quantities, not to the header vendor. Labor POs still clear lines
  // on vendor change so cost-code rows can reload for the new vendor.
  const keepItemsOnVendorChange =
    !isLaborPurchaseOrder.value &&
    String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE';

  if (keepItemsOnVendorChange) {
    updateFormFields({
      vendor_uuid: vendorUuid || '',
    });
    void prefillPoCurrencyFromVendor(vendorUuid || '');
    return;
  }

  // Clear item data when switching vendors to prevent stale mismatched rows.
  updateFormFields({
    vendor_uuid: vendorUuid || '',
    po_items: [],
    labor_po_items: [],
    po_location_wise_material_items: [],
    removed_po_items: [],
    include_items: '',
  });
  void prefillPoCurrencyFromVendor(vendorUuid || '');
};

// Removed PO items management (not needed currently)

// Generate next PO number suffix (stored without project prefix; list prepends project_id on save).
// Scopes by project when project_id is known so it stays consistent with To be raised and PurchaseOrdersList prefixing.
async function generatePONumber(options?: { force?: boolean; projectId?: string }) {
  const force = options?.force === true;
  if (!force && String(props.form.po_number ?? '').trim() !== '') return;

  const corporationId =
    props.form.corporation_uuid ||
    corpStore.selectedCorporation?.uuid ||
    corpStore.selectedCorporationId;
  if (!corporationId) return;

  const projectId =
    options?.projectId ??
    ((props.form.project_id && String(props.form.project_id).trim()) ||
      selectedProjectId.value ||
      '');

  // New POs: only assign a number once we know the project (same moment To be raised has project_id).
  if (!props.form.uuid && !projectId) return;

  try {
    const response: any = await $fetch("/api/purchase-order-forms", {
      method: "GET",
      query: {
        corporation_uuid: corporationId,
        next_po_number: true,
        project_id: projectId || undefined,
      },
    });
    const next = String(response?.data?.po_number || "").trim();
    if (next) {
      handleFormUpdate('po_number', next);
    }
  } catch (error) {
    console.error("[PurchaseOrderForm] Failed to allocate next PO number from API", error);
  }
}

// Removed PO items calculations and watchers (not needed currently)

// File upload methods
const handleFileUpload = async () => {
  fileUploadError.value = null;

  if (uploadedFiles.value.length === 0) {
    return;
  }

  // Prevent starting a new upload if one is already in progress
  if (isUploading.value) {
    return;
  }

  const allowedTypes = ["application/pdf"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const file of uploadedFiles.value) {
    if (!allowedTypes.includes(file.type)) {
      fileUploadError.value = "Invalid file type. Only PDF files are allowed.";
      return;
    }

    if (file.size > maxSize) {
      fileUploadError.value = "File size too large. Maximum size is 10MB per file.";
      return;
    }
  }

  isUploading.value = true;
  try {
    const pendingAttachments = await Promise.all(
      uploadedFiles.value.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const fileData = e.target?.result;
              if (typeof fileData !== "string") {
                reject(new Error("Failed to read file"));
                return;
              }

              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                fileData,
                tempId: Date.now() + Math.random().toString(36).substring(2),
              });
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          })
      )
    );

    if (props.editingPurchaseOrder && props.form.uuid) {
      try {
        const response = await $fetch<{
          attachments: any[];
          errors?: Array<{ fileName: string; error: string }>;
        }>("/api/purchase-order-forms/documents/upload", {
          method: "POST",
          body: {
            purchase_order_uuid: props.form.uuid,
            files: pendingAttachments.map((file: any) => ({
              name: file.name,
              type: file.type,
              size: file.size,
              fileData: file.fileData,
            })),
          },
        });

        // For existing POs, the API returns all attachments (existing + newly uploaded)
        // Use the API response as the source of truth to avoid duplicates
        // Clear uploadedFiles first to prevent watcher from firing again
        uploadedFiles.value = [];
        
        // Deduplicate attachments from API response (handles existing records with duplicates)
        const apiAttachments = Array.isArray(response?.attachments) ? response.attachments : [];
        const deduplicatedAttachments = deduplicateAttachments(apiAttachments);
        
        // Use deduplicated API response
        handleFormUpdate("attachments", deduplicatedAttachments);

        if (response?.errors?.length) {
          fileUploadError.value = response.errors
            .map((err) => err.error)
            .join(", ");
        } else {
          fileUploadError.value = null;
        }
      } catch (error) {
        fileUploadError.value = "Failed to upload files. Please try again.";
      } finally {
        isUploading.value = false;
      }
      return;
    }

    const existingAttachments = Array.isArray(props.form.attachments) ? props.form.attachments : [];
    const newAttachments = pendingAttachments.map((file: any) => ({
      ...file,
      isUploaded: false,
    }));
    
    // Combine and deduplicate to handle any existing duplicates
    const allAttachments = [...existingAttachments, ...newAttachments];
    const deduplicatedAttachments = deduplicateAttachments(allAttachments);

    handleFormUpdate("attachments", deduplicatedAttachments);
    uploadedFiles.value = [];
  } catch (error) {
    fileUploadError.value = "Failed to process files. Please try again.";
  } finally {
    isUploading.value = false;
  }
};

// Helper function to deduplicate attachments
// Removes duplicates based on UUID (for uploaded files) or tempId/name+size (for temporary files)
const deduplicateAttachments = (attachments: any[]): any[] => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  const seen = new Map<string, any>();
  const deduplicated: any[] = [];

  for (const attachment of attachments) {
    if (!attachment) continue;

    // For uploaded files (have UUID), use UUID as the key
    if (attachment.uuid) {
      const key = `uuid:${attachment.uuid}`;
      if (!seen.has(key)) {
        seen.set(key, attachment);
        deduplicated.push(attachment);
      }
    }
    // For temporary files, use tempId if available
    else if (attachment.tempId) {
      const key = `temp:${attachment.tempId}`;
      if (!seen.has(key)) {
        seen.set(key, attachment);
        deduplicated.push(attachment);
      }
    }
    // Fallback: use name + size as key (less reliable but better than nothing)
    else {
      const name = attachment.document_name || attachment.name || '';
      const size = attachment.file_size || attachment.size || 0;
      const key = `name:${name}:size:${size}`;
      if (!seen.has(key)) {
        seen.set(key, attachment);
        deduplicated.push(attachment);
      }
    }
  }

  return deduplicated;
};

const previewFile = (attachment: any) => {
  // Map the attachment to the format expected by FilePreview component
  selectedFileForPreview.value = {
    id: attachment.uuid || attachment.tempId,
    // Handle both database format (document_name) and temporary format (name)
    file_name: attachment.document_name || attachment.name,
    name: attachment.document_name || attachment.name,
    // Handle both database format (mime_type) and temporary format (type)
    file_type: attachment.mime_type || attachment.type,
    type: attachment.mime_type || attachment.type,
    // Handle both database format (file_size) and temporary format (size)
    file_size: attachment.file_size || attachment.size,
    size: attachment.file_size || attachment.size,
    // For database files, use file_url; for temporary files, use base64 data
    file_url: attachment.file_url || attachment.url || attachment.fileData,
    url: attachment.file_url || attachment.url || attachment.fileData
  };
  showFilePreviewModal.value = true;
};

const closeFilePreview = () => {
  showFilePreviewModal.value = false;
  selectedFileForPreview.value = null;
};

// Vendor edit methods
const openAddVendorModal = () => {
  if (props.readonly) return;
  editingVendor.value = null;
  showVendorEditModal.value = true;
};

const openVendorEditModal = () => {
  if (!props.form.vendor_uuid) return;
  
  // Find the vendor data
  const vendor = vendorStore.vendors.find((v) => v.uuid === props.form.vendor_uuid);
  if (!vendor) {
    return;
  }
  
  editingVendor.value = vendor;
  showVendorEditModal.value = true;
};

const handleVendorSaved = async () => {
  // Refresh vendors from API to get the updated data
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (corpUuid) {
    await vendorStore.fetchVendors(corpUuid);
  }
  
  // Close the modal
  showVendorEditModal.value = false;
  editingVendor.value = null;
};

const removeFile = async (index: number) => {
  const attachment = props.form.attachments[index];

  if (!attachment) return;

  if (attachment?.uuid && props.editingPurchaseOrder && props.form.uuid) {
    try {
      const response = await $fetch<{
        attachments: any[];
      }>("/api/purchase-order-forms/documents/remove", {
        method: "POST",
        body: {
          purchase_order_uuid: props.form.uuid,
          attachment_uuid: attachment.uuid,
        },
      });

      handleFormUpdate("attachments", response?.attachments ?? []);
      return;
    } catch (error) {
      fileUploadError.value = "Failed to delete file. Please try again.";
      return;
    }
  }

  const updatedAttachments = [...(props.form.attachments || [])];
  updatedAttachments.splice(index, 1);
  handleFormUpdate("attachments", updatedAttachments);

  if (attachment?.tempId) {
    const fileIndex = uploadedFiles.value.findIndex(
      (file) => file.name === attachment.name
    );
    if (fileIndex !== -1) {
      uploadedFiles.value.splice(fileIndex, 1);
    }
  }
};

// Watch for entry date and credit days changes to auto-calculate estimated delivery date
watch(
  [() => entryDateValue.value, () => props.form.credit_days, () => props.form.credit_days_id],
  ([newEntryDate, newCreditDays, newCreditDaysId], [oldEntryDate, oldCreditDays, oldCreditDaysId]) => {
    // Skip if we're already updating to prevent recursive updates
    if (isUpdatingEstimatedDeliveryDate.value) {
      return;
    }
    
    // Only auto-calculate if both entry date and credit days are set
    if (newEntryDate && newCreditDays) {
      // Check if estimated delivery date was manually set (different from calculated)
      const calculatedEstimatedDeliveryDate = calculateEstimatedDeliveryDate(newEntryDate, newCreditDays, newCreditDaysId);
      if (calculatedEstimatedDeliveryDate) {
        // Calculate the new estimated delivery date string
        const newEstimatedDeliveryDateString = `${calculatedEstimatedDeliveryDate.year}-${String(calculatedEstimatedDeliveryDate.month).padStart(2, '0')}-${String(calculatedEstimatedDeliveryDate.day).padStart(2, '0')}`;
        const newEstimatedDeliveryDateUTC = toUTCString(newEstimatedDeliveryDateString);
        
        // Get current estimated delivery date from form (avoid reading computed property to prevent recursion)
        const currentEstimatedDeliveryDateUTC = props.form.estimated_delivery_date;
        
        // Calculate old estimated delivery date if we had both old values
        let oldCalculatedEstimatedDeliveryDateUTC: string | null = null;
        if (oldEntryDate && oldCreditDays) {
          const oldCalculated = calculateEstimatedDeliveryDate(oldEntryDate, oldCreditDays, oldCreditDaysId);
          if (oldCalculated) {
            const oldDateString = `${oldCalculated.year}-${String(oldCalculated.month).padStart(2, '0')}-${String(oldCalculated.day).padStart(2, '0')}`;
            oldCalculatedEstimatedDeliveryDateUTC = toUTCString(oldDateString);
          }
        }
        
        // Check if entry date changed (by comparing the date strings)
        const entryDateChanged = oldEntryDate && newEntryDate && 
          (oldEntryDate.year !== newEntryDate.year || 
           oldEntryDate.month !== newEntryDate.month || 
           oldEntryDate.day !== newEntryDate.day);
        
        // Check if credit days changed (handle empty/null/undefined cases)
        const creditDaysChanged =
          String(oldCreditDays || '') !== String(newCreditDays || '') ||
          String(oldCreditDaysId || '') !== String(newCreditDaysId || '');
        
        // Update if:
        // 1. Estimated delivery date is empty/null, OR
        // 2. Entry date changed (always recalculate when entry date changes), OR
        // 3. Credit days changed (always recalculate when credit days changes), OR
        // 4. Current estimated delivery date matches the old calculated value (meaning it was auto-calculated, not manually set)
        const shouldUpdate = !currentEstimatedDeliveryDateUTC || 
                            entryDateChanged ||
                            creditDaysChanged ||
                            (oldCalculatedEstimatedDeliveryDateUTC && currentEstimatedDeliveryDateUTC === oldCalculatedEstimatedDeliveryDateUTC);
        
        // Only update if the new value is different from current
        if (shouldUpdate && currentEstimatedDeliveryDateUTC !== newEstimatedDeliveryDateUTC) {
          isUpdatingEstimatedDeliveryDate.value = true;
          try {
            handleFormUpdate('estimated_delivery_date', newEstimatedDeliveryDateUTC);
          } finally {
            // Reset flag after a short delay to allow the update to complete
            nextTick(() => {
              isUpdatingEstimatedDeliveryDate.value = false;
            });
          }
        }
      }
    } else if (!newEntryDate || !newCreditDays) {
      // If either entry date or credit days is cleared, clear estimated delivery date only if it was auto-calculated
      // We can't easily determine if it was manually set, so we'll leave it as is to avoid clearing user input
    }
  },
  { flush: 'post', immediate: true }
);

// Persist auto-populated location UUIDs for PO items even when user doesn't touch the location field.
watch(
  [() => props.form.po_items, () => estimateLocationByCompositeKey.value],
  ([poItems]) => {
    if (!Array.isArray(poItems) || poItems.length === 0) return;

    let changed = false;
    const normalizedItems = poItems.map((item: any) => {
      const next = { ...item };
      const display = { ...(next.display_metadata || {}) };
      const metadata = { ...(next.metadata || {}) };

      const currentLocationUuid =
        next.location_uuid ||
        display.location_uuid ||
        metadata.location_uuid ||
        null;

      if (!currentLocationUuid && next.item_uuid && next.cost_code_uuid) {
        const key = `${String(next.item_uuid).toLowerCase()}-${String(next.cost_code_uuid).toLowerCase()}`;
        const estimateLocation = estimateLocationByCompositeKey.value.get(key);
        if (estimateLocation?.uuid) {
          next.location_uuid = estimateLocation.uuid;
          display.location_uuid = estimateLocation.uuid;
          metadata.location_uuid = estimateLocation.uuid;
          if (!next.location && estimateLocation.label) {
            next.location = estimateLocation.label;
          }
          if (!display.location_display) {
            display.location_display = next.location || estimateLocation.label || '';
          }
          changed = true;
        }
      }

      next.display_metadata = display;
      if (Object.keys(metadata).length > 0) {
        next.metadata = metadata;
      }
      return next;
    });

    if (changed) {
      updateFormFields({ po_items: normalizedItems });
    }
  },
  { immediate: true, deep: true }
);

// Watch for attachments changes to deduplicate existing records
// Only runs once on mount to clean up existing duplicates, not on every change
let hasDeduplicatedOnMount = false;
watch(
  () => props.form.attachments,
  (newAttachments) => {
    // Only deduplicate once when component mounts with existing attachments
    // Skip if we've already deduplicated or if attachments are empty
    if (hasDeduplicatedOnMount || !Array.isArray(newAttachments) || newAttachments.length === 0) {
      return;
    }
    
    // Deduplicate attachments when they're loaded from props (handles existing records with duplicates)
    const deduplicated = deduplicateAttachments(newAttachments);
    
    // Only update if there were duplicates removed
    if (deduplicated.length !== newAttachments.length) {
      hasDeduplicatedOnMount = true;
      // Use nextTick to avoid infinite loop
      nextTick(() => {
        handleFormUpdate("attachments", deduplicated);
      });
    } else {
      hasDeduplicatedOnMount = true; // Mark as processed even if no duplicates
    }
  },
  { deep: true, immediate: true }
);

// Watch for uploaded files changes
watch(() => uploadedFiles.value, () => {
  // Prevent watcher from firing during upload to avoid duplicates
  if (isUploading.value) {
    return;
  }
  if (uploadedFiles.value.length > 0) {
    handleFileUpload();
  }
  emit('file-upload', uploadedFiles.value);
}, { deep: true });

watch(
  () => props.form.po_mode,
  (mode) => {
    const normalized = normalizePoMode(mode);
    // CUSTOM mode is no longer available - commented out
    // if (normalized === "CUSTOM") {
    //   const updates: Record<string, any> = {};
    //   if (props.form.project_uuid) {
    //     updates.project_uuid = null;
    //   }
    //   if (props.form.shipping_address_uuid) {
    //     updates.shipping_address_uuid = null;
    //   }
    //   if (Object.keys(updates).length > 0) {
    //     updateFormFields(updates);
    //   }
    //   enforceIncludeItemsConsistency();
    // } else {
      if (props.form.shipping_address_custom) {
        updateFormFields({ shipping_address_custom: null });
      }
      enforceIncludeItemsConsistency();
    // }
  },
  { immediate: true }
);

// Watch PO type changes to handle Labor vs Material PO transitions
watch(
  () => isLaborPurchaseOrder.value,
  async (isLabor, wasLabor) => {
    // When switching to Labor PO, clear material-specific items and initialize labor items
    if (isLabor && !wasLabor) {
      // Initial immediate run uses wasLabor === undefined; do not treat that as "user switched to Labor"
      // or we reset the form and open the cost-code modal for every opened saved Labor PO.
      if (wasLabor !== undefined) {
        const updates: Record<string, any> = {
          include_items: null,
          po_items: [],
          removed_po_items: [],
          po_location_wise_material_items: [],
          labor_po_items: Array.isArray(props.form.labor_po_items) ? props.form.labor_po_items : [],
        };
        updateFormFields(updates);
      }

      // Explicitly trigger labor items loading from estimate after form update
      // Skip if editing an existing PO with labor items
      // Skip if estimate is not approved
      if (!shouldSkipLaborAutoImport.value && !isEstimateImportBlocked.value) {
        await nextTick();
        // Automatically load labor items from estimate (Labor PO always uses estimate)
        const projectUuid = props.form.project_uuid;
        const estimateUuid = latestProjectEstimate.value?.uuid;
        const vendorUuid = props.form.vendor_uuid;
        
        if (projectUuid && estimateUuid && vendorUuid) {
          laborItemsLoading.value = true;
          laborItemsError.value = null;
          try {
            const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
            if (!corpUuid) {
              throw new Error('No corporation selected');
            }
            
            // Fetch estimate line items from API
            const response: any = await $fetch("/api/estimate-line-items", {
              method: "GET",
              query: {
                project_uuid: projectUuid,
                estimate_uuid: estimateUuid,
                corporation_uuid: corpUuid,
              },
            });

            const lineItems = Array.isArray(response?.data) ? response.data : [];
            const projectEnableLocationWise = response?.project_enable_location_wise === true;

            if (!lineItems || lineItems.length === 0) {
              throw new Error('Estimate line items not available');
            }

            // Load labor items from the estimate line items (location-wise when project has enable_location_wise)
            await loadLaborItemsFromEstimateLineItems(lineItems, projectEnableLocationWise);

            // Also load location-wise material items from estimate
            estimateLineItemsForLocationWise.value = lineItems;
            await loadLocationWiseMaterialFromEstimate(lineItems, projectEnableLocationWise);
          } catch (error: any) {
            laborItemsError.value = error.message || 'Failed to load labor items from estimate';
          } finally {
            laborItemsLoading.value = false;
          }
        } else if (projectUuid && !estimateUuid) {
          laborItemsError.value = 'Please select a project with an approved estimate';
        } else if (!vendorUuid) {
          laborItemsError.value = null;
        } else {
          laborItemsError.value = 'Please select a project first';
        }
      }
    }
    // When switching to Material PO, clear labor-specific items and reset latch
    else if (!isLabor && wasLabor) {
      laborItemsUserConfirmed.value = false;
      if (loadedEditPoLaborSignature.value && props.form.uuid) {
        loadedEditPoLaborSignature.value = {
          uuid: props.form.uuid,
          openedAsLabor: false,
        };
      }
      const updates: Record<string, any> = {
        labor_po_items: [],
        po_items: [],
        po_location_wise_material_items: [],
        removed_po_items: [],
        include_items: '',
      };
      updateFormFields(updates);
    }
  },
  { immediate: true }
);

watch(filteredIncludeItemsOptions, () => {
  enforceIncludeItemsConsistency();
});

// Note: Financial calculations are now handled by FinancialBreakdown component
// The component watches itemTotal and recalculates automatically

// Watch po_items to sync removed items and ensure reactivity
watch(
  () => props.form.po_items,
  (newItems, oldItems) => {
    if (newItems !== oldItems) {
      if (Array.isArray(newItems)) {
        syncRemovedPoItemsWithCurrent(newItems)
      }
      // Force itemTotal to recalculate by accessing it
      // This ensures the FinancialBreakdown component's watcher fires
      const _ = itemTotal.value
    }
  },
  { deep: true }
)

// Watch labor_po_items to ensure reactivity
watch(
  () => props.form.labor_po_items,
  (newItems, oldItems) => {
    if (newItems !== oldItems) {
      const _ = itemTotal.value
    }
  },
  { deep: true }
)

// Watch location-wise material items to ensure itemTotal reactivity
watch(
  () => props.form.po_location_wise_material_items,
  (newItems, oldItems) => {
    if (newItems !== oldItems) {
      const _ = itemTotal.value
    }
  },
  { deep: true }
)

// Watch for vendor changes to update addresses
watch(() => props.form.vendor_uuid, () => {
  // Address will update automatically via computed property
});

const ensureItemTypesLoaded = async (
  corpUuid?: string | null,
  projectUuid?: string | null,
  options: { force?: boolean } = {}
) => {
  if (typeof window === 'undefined') return;
  const normalizedCorp = corpUuid ? String(corpUuid) : '';
  if (!normalizedCorp) return;

  const normalizedProject = projectUuid ? String(projectUuid) : undefined;
  const force = Boolean(options.force);

  if (normalizedProject) {
    await fetchItemTypesIfNeeded(normalizedCorp, normalizedProject, force);

    // Use purchaseOrderResourcesStore instead of global itemTypesStore
    const hasProjectItems =
      purchaseOrderResourcesStore.getItemTypes(normalizedCorp, normalizedProject)
        .length > 0;

    if (!hasProjectItems) {
      await fetchItemTypesIfNeeded(
        normalizedCorp,
        undefined,
        force || !hasCachedItemTypes(normalizedCorp)
      );
    }
  } else {
    await fetchItemTypesIfNeeded(normalizedCorp, undefined, force);
  }
};

// Watch for corporation changes to fetch cost codes and preferred items
watch(() => props.form.corporation_uuid, async (newCorpUuid, oldCorpUuid) => {
  if (!newCorpUuid) return;
  
  // Always fetch fresh data from API
  // This ensures we have the latest data regardless of TopBar's selected corporation
  const corporationChanged = oldCorpUuid && oldCorpUuid !== newCorpUuid;
  
  // Ensure cost codes and preferred items are fetched for the selected corporation
  // This ensures cost codes are available regardless of TopBar's selected corporation
  const projectUuid = props.form.project_uuid ?? undefined;
  
  await Promise.allSettled([
    purchaseOrderResourcesStore.ensureCostCodeConfigurations({
      corporationUuid: newCorpUuid,
      projectUuid: projectUuid,
      force: corporationChanged, // Force refresh if corporation changed
    }),
    purchaseOrderResourcesStore.ensurePreferredItems({
      corporationUuid: newCorpUuid,
      projectUuid: projectUuid,
      force: corporationChanged, // Force refresh if corporation changed
    }),
    // Fetch estimates scoped to the current project
    projectUuid
      ? purchaseOrderResourcesStore.ensureEstimates({
          corporationUuid: newCorpUuid,
          projectUuid,
          force: true,
        })
      : Promise.resolve(),
  ]);
});

// Watch for project changes to update addresses, preload item types, and fetch project-specific estimates
watch(() => props.form.project_uuid, async (newProjectUuid) => {
  if (!isProjectPurchaseOrder.value) return;
  // Use form's corporation_uuid, fallback to store's selectedCorporation
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (corpUuid && newProjectUuid) {
    await Promise.allSettled([
      projectAddressesStore.fetchAddresses(newProjectUuid),
      ensureItemTypesLoaded(corpUuid, newProjectUuid),
      // Fetch estimates scoped to the selected project
      purchaseOrderResourcesStore.ensureEstimates({
        corporationUuid: corpUuid,
        projectUuid: newProjectUuid,
        force: true,
      }),
      // Ensure cost code configurations are loaded for the project
      purchaseOrderResourcesStore.ensureCostCodeConfigurations({
        corporationUuid: corpUuid,
        projectUuid: newProjectUuid,
        force: false,
      }),
      // Ensure preferred items are loaded for the project
      purchaseOrderResourcesStore.ensurePreferredItems({
        corporationUuid: corpUuid,
        projectUuid: newProjectUuid,
        force: false,
      }),
      refreshPoScopedLocations(newProjectUuid),
    ]);
    const addresses = projectAddressesStore.getAddresses(newProjectUuid) as any[] | undefined;
    const shippingList = Array.isArray(addresses)
      ? addresses.filter(
          (a: any) => a.is_active !== false && a.address_type === 'shipment'
        )
      : [];
    const currentUuid = String(props.form.shipping_address_uuid || '').trim();
    const stillValid =
      Boolean(currentUuid) &&
      shippingList.some((a: any) => String(a.uuid) === currentUuid);
    if (!stillValid) {
      const primary =
        shippingList.find((a: any) => a.is_primary) || shippingList[0] || null;
      updateFormFields({
        project_uuid: newProjectUuid,
        shipping_address_uuid: primary?.uuid ?? '',
      });
    }
  } else {
    poScopedLocations.value = [];
  }
}, { immediate: true });

watch(
  () => isSelectedProjectLocationWiseEnabled.value,
  async (enabled) => {
    if (!enabled) {
      poScopedLocations.value = [];
      return;
    }
    await refreshPoScopedLocations(props.form.project_uuid);
  }
);

// Initialize
onMounted(async () => {
  // Initialize corporation_uuid in form if not set
  if (!props.form.corporation_uuid && corpStore.selectedCorporation?.uuid) {
    handleFormUpdate('corporation_uuid', corpStore.selectedCorporation.uuid);
  }
  
  // NOTE: We do NOT update corpStore.selectedCorporation here to avoid affecting other components
  // The form operates independently with its own corporation selection (props.form.corporation_uuid)
  // This ensures ItemsList, ItemTypes, Estimates, and other components stay synced with TopBar
  
  // Use the form's corporation_uuid for fetching data (independent from TopBar)
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (corpUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(corpUuid),
      // Estimates are fetched only when a project is selected (see project watcher below)
      ensureItemTypesLoaded(corpUuid, props.form.project_uuid),
      // Fetch UOM to enable unit_uuid lookups when importing from master
      uomStore.fetchUOM(corpUuid, false),
      // NOTE: We don't fetch projects metadata here to avoid affecting global projectsStore
      // Projects metadata is managed by TopBar's corporation selection
      Promise.resolve(),
      props.form.project_uuid ? projectAddressesStore.fetchAddresses(props.form.project_uuid) : Promise.resolve(),
      // If importing from estimate, ensure estimates are loaded (important for "to be raised" screen)
      props.form.project_uuid && String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE'
        ? purchaseOrderResourcesStore.ensureEstimates({
            corporationUuid: corpUuid,
            projectUuid: props.form.project_uuid,
            force: false,
          })
        : Promise.resolve(),
    ]);
    
    // CRITICAL: For existing POs with "Import from Master", explicitly fetch preferred items from API
    // This ensures items are available when user clicks "Edit Selection"
    const isEditingMasterPO = 
      props.editingPurchaseOrder && 
      String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_MASTER';
    
    if (isEditingMasterPO) {
      await fetchMasterPoItems();
    }
  }
  await refreshCreditDaysOptions();
  // If creating and po_number empty, generate once project is known (avoids wrong global sequence before project select).
  if (!props.form.uuid && (!props.form.po_number || String(props.form.po_number).trim() === '')) {
    if (props.form.project_uuid) {
      await generatePONumber({ projectId: props.form.project_id || selectedProjectId.value || '' });
    }
  }
  
  // Set default po_mode to PROJECT if not set
  // Use multiple nextTick calls to ensure this happens after all computed properties are initialized
  if (!props.form.po_mode || String(props.form.po_mode).trim() === '') {
    await nextTick();
    await nextTick();
    handleFormUpdate('po_mode', 'PROJECT');
    // If po_items exist, trigger recalculation to ensure item_total is calculated
    if (Array.isArray(props.form.po_items) && props.form.po_items.length > 0) {
      await nextTick();
      recalculateChargesAndTaxes();
    }
  }
  
  // Note: Financial calculations are now handled by FinancialBreakdown component
  // The component will automatically calculate on mount
  
  // Fetch used quantities if importing from estimate and we have all required values
  // This is important for "to be raised" screen where items are pre-populated
  // Only do this for new POs or when form has explicit estimate_uuid (not for existing POs without estimate_uuid)
  if (
    isProjectPurchaseOrder.value &&
    String(props.form.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_ESTIMATE' &&
    props.form.corporation_uuid &&
    props.form.project_uuid &&
    (!props.editingPurchaseOrder || props.form.estimate_uuid) // Only for new POs or existing POs with explicit estimate_uuid
  ) {
    // Wait for estimates to be loaded and effectiveEstimateUuid to be computed
    await nextTick();
    await nextTick();
    
    // Use effectiveEstimateUuid which already handles the form.estimate_uuid fallback
    const estimateUuid = effectiveEstimateUuid.value;
    
    // If we have an estimate UUID, fetch used quantities
    // Also ensure estimate items are loaded if we have items pre-populated (from "to be raised")
    if (estimateUuid) {
      // If items are pre-populated, ensure estimate items are loaded so available quantity can be calculated
      // Only for new POs (not editing) to avoid auto-importing when editing existing POs
      if (!props.editingPurchaseOrder && Array.isArray(props.form.po_items) && props.form.po_items.length > 0) {
        await purchaseOrderResourcesStore.ensureEstimateItems({
          corporationUuid: props.form.corporation_uuid,
          projectUuid: props.form.project_uuid,
          estimateUuid: estimateUuid,
          force: false,
        });
        await nextTick();
      }
      await fetchUsedQuantities();
    }

    // For Material POs: fetch estimate line items to detect location-wise material
    const normalizedPoType = String(props.form.po_type || '').toUpperCase();
    if (normalizedPoType !== 'LABOR' && estimateUuid && props.form.corporation_uuid && props.form.project_uuid) {
      try {
        locationWiseMaterialLoading.value = true;
        const lwResponse: any = await $fetch('/api/estimate-line-items', {
          method: 'GET',
          query: {
            project_uuid: props.form.project_uuid,
            estimate_uuid: estimateUuid,
            corporation_uuid: props.form.corporation_uuid,
          },
        });
        const lineItems = Array.isArray(lwResponse?.data) ? lwResponse.data : [];
        const enableLW = lwResponse?.project_enable_location_wise === true;
        estimateLineItemsForLocationWise.value = lineItems;
        if (!hasLocationWiseMaterialItems.value) {
          await loadLocationWiseMaterialFromEstimate(lineItems, enableLW);
        }
      } catch (_err: any) {
        // Non-critical: just means location-wise detection won't work on initial load
      } finally {
        locationWiseMaterialLoading.value = false;
      }
    }
  }
});

watch(
  [selectedCorporationUuid, () => nimbleSession.token, () => runtimeConfig.public.nimbleIntegrations],
  async () => {
    await refreshCreditDaysOptions();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  purchaseOrderResourcesStore.clear();
  const editorInstance = unref(quickTCEditor)
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    try { editorInstance.destroy() } catch (_) { /* ignore */ }
  }
});

watch(() => corpStore.selectedCorporation?.uuid, async (newCorpUuid) => {
  if (!newCorpUuid) return;
  // Estimates are fetched only when a project is selected (see project watcher)
  // No need to fetch all estimates when corporation changes
  await ensureItemTypesLoaded(newCorpUuid, props.form.project_uuid);
}, { immediate: true });

// Watch validation state and emit changes
watch(() => isFormValid.value, (isValid) => {
  emit('validation-change', isValid);
}, { immediate: true });

// Watch for Labor PO Type and project/estimate changes to load labor items
watch(
  [
    () => isLaborPurchaseOrder.value,
    () => props.form.project_uuid,
    () => latestProjectEstimate.value?.uuid,
    () => props.form.vendor_uuid,
  ],
  async ([isLabor, projectUuid, estimateUuid, vendorUuid], [prevIsLabor, prevProjectUuid, prevEstimateUuid, prevVendorUuid]) => {
    // Only process if it's a Labor PO
    if (!isLabor) {
      // Clear labor items if switching away from Labor PO
      if (prevIsLabor && !isLabor) {
        updateFormFields({ labor_po_items: [] });
      }
      return;
    }

    // Initialize labor_po_items if it doesn't exist
    if (!Array.isArray(props.form.labor_po_items)) {
      updateFormFields({ labor_po_items: [] });
    }

    // Clear error state when opening existing labor POs with items
    if (props.editingPurchaseOrder && Array.isArray(props.form.labor_po_items) && props.form.labor_po_items.length > 0) {
      laborItemsError.value = null;
    }
    
    // Skip loading if we just switched to Labor PO (handled by PO type watcher)
    // Only handle changes when already in Labor PO mode
    const justSwitchedToLabor = prevIsLabor === false && isLabor === true;
    if (justSwitchedToLabor) {
      return; // Let the PO type watcher handle the initial load
    }

    // Labor PO always uses "Against Estimate" behavior
    // Skip auto-loading if editing an existing PO with labor items
    // Skip if estimate is not approved
    if (shouldSkipLaborAutoImport.value || isEstimateImportBlocked.value) {
      return;
    }
    
    // Load if: estimate changed OR vendor was newly selected while in Labor mode.
    const estimateUuidChanged = estimateUuid !== prevEstimateUuid;
    const vendorJustSelected = !prevVendorUuid && !!vendorUuid;
    const shouldLoadLaborItems = estimateUuidChanged || vendorJustSelected;
    
    if (shouldLoadLaborItems && projectUuid && estimateUuid && vendorUuid) {
      // Set loading state
      laborItemsLoading.value = true;
      laborItemsError.value = null;
      
      try {
        const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
        if (!corpUuid) {
          throw new Error('No corporation selected');
        }
        
        // Fetch estimate line items from API (similar to how material items are fetched)
        const response: any = await $fetch("/api/estimate-line-items", {
          method: "GET",
          query: {
            project_uuid: projectUuid,
            estimate_uuid: estimateUuid,
            corporation_uuid: corpUuid,
          },
        });

        const lineItems = Array.isArray(response?.data) ? response.data : [];
        const projectEnableLocationWise = response?.project_enable_location_wise === true;

        if (!lineItems || lineItems.length === 0) {
          throw new Error('Estimate line items not available');
        }

        // Load labor items from the estimate line items (location-wise when project has enable_location_wise)
        await loadLaborItemsFromEstimateLineItems(lineItems, projectEnableLocationWise);

        // Also load location-wise material items from estimate
        estimateLineItemsForLocationWise.value = lineItems;
        await loadLocationWiseMaterialFromEstimate(lineItems, projectEnableLocationWise);
      } catch (error: any) {
        laborItemsError.value = error.message || 'Failed to load labor items from estimate';
        updateFormFields({ labor_po_items: [] });
      } finally {
        laborItemsLoading.value = false;
      }
    } else if (estimateUuidChanged && !estimateUuid) {
      // Don't clear items when the estimate UUID temporarily disappears due to
      // a store clear during save — the latch protects against this.
      if (!laborItemsUserConfirmed.value) {
        updateFormFields({ labor_po_items: [], po_location_wise_material_items: [] });
        laborItemsError.value = null;
        locationWiseMaterialError.value = null;
        estimateLineItemsForLocationWise.value = [];
      }
    }
  },
  { immediate: true }
);

// Load all cost codes for Custom option
const loadAllCostCodes = async () => {
  // Use form's corporation_uuid, fallback to store's selectedCorporation
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) {
    return;
  }

  // Ensure preferred items are loaded (which fetches configurations internally)
  // This uses purchaseOrderResourcesStore, not the global costCodeConfigurationsStore
  await purchaseOrderResourcesStore.ensurePreferredItems({
    corporationUuid: corpUuid,
    projectUuid: undefined,
    force: false,
  });

  // Fetch configurations directly from API for this store only (not affecting global store)
  // We need the raw configurations for labor PO items, not just preferred items
  let allConfigurations: any[] = [];
  try {
    const response: any = await $fetch("/api/cost-code-configurations", {
      method: "GET",
      query: { corporation_uuid: corpUuid },
    });
    const configs = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    // Filter to active configurations only
    allConfigurations = configs.filter((config: any) => config.is_active !== false);
  } catch (error) {
    return;
  }
  
  if (!allConfigurations || allConfigurations.length === 0) {
    // No cost codes available, clear items or keep existing
    return;
  }

  // Transform configurations to labor items format
  const priorCommitted = await fetchLaborPriorCommittedByKey();
  const laborItems = transformCostCodeConfigsToLaborItems(allConfigurations, priorCommitted);
  
  // Don't open modal automatically when editing an existing PO with labor items
  // The modal should only open when user clicks "Edit Selection" button
  if (shouldSkipLaborAutoImport.value) {
    return;
  }
  
  // Show modal for item selection instead of directly applying
  // Mark this as initial import (not editing existing selection)
  isEditingLaborSelection.value = false;
  availableLaborItems.value = laborItems;
  pendingLaborItemsKey.value = 'custom-all';
  showLaborItemsModal.value = true;
};

// Load labor items from estimate line items (similar to how material items are loaded).
// When enableLocationWise is true, labor items are expanded per location from estimate_location_wise_labor.
const loadLaborItemsFromEstimateLineItems = async (lineItems: any[], enableLocationWise?: boolean) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return;
  }

  // Don't show modal if estimate is not approved
  if (isEstimateImportBlocked.value) {
    return;
  }

  // Transform estimate line items to labor items format (location-wise when enableLocationWise)
  const priorCommitted = await fetchLaborPriorCommittedByKey();
  const laborItems = transformEstimateLineItemsToLaborItems(
    lineItems,
    enableLocationWise,
    priorCommitted
  );
  
  if (laborItems.length === 0) {
    return;
  }
  
  // Don't open modal automatically when editing an existing PO with labor items
  // The modal should only open when user clicks "Edit Selection" button
  if (shouldSkipLaborAutoImport.value) {
    return;
  }
  
  // Show modal for item selection instead of directly applying
  // Mark this as initial import (not editing existing selection)
  isEditingLaborSelection.value = false;
  availableLaborItems.value = laborItems;
  pendingLaborItemsKey.value = `estimate-${latestProjectEstimate.value?.uuid}`;
  showLaborItemsModal.value = true;
};

const clonePoItem = (item: any) => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(item)
    } catch (error) {
      // fall through to JSON clone
    }
  }
  try {
    return JSON.parse(JSON.stringify(item ?? {}))
  } catch (error) {
    return item
  }
}

</script>

