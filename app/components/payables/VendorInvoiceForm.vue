<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Main Form -->
      <div class="flex-1">
        <UCard variant="soft">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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
              <!-- Bill Date -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Number -->
              <div>
                <USkeleton class="h-3 w-16 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Invoice Type -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Vendor -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Credit Days -->
              <div>
                <USkeleton class="h-3 w-24 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Due Date -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- PO Number -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
              </div>
              <!-- Holdback -->
              <div>
                <USkeleton class="h-3 w-20 mb-1" />
                <USkeleton class="h-9 w-full" />
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
                :model-value="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
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
                Project Name <span class="text-red-500">*</span>
              </label>
              <ProjectSelect
                :model-value="form.project_uuid"
                :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :disabled="!form.corporation_uuid && !corpStore.selectedCorporation || props.readonly"
                placeholder="Select project"
                size="sm"
                class="w-full"
                @update:model-value="handleProjectChange"
              />
            </div>

            <!-- Bill Date -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Bill Date <span class="text-red-500">*</span>
              </label>
              <UPopover :disabled="props.readonly">
                <UButton 
                  color="neutral" 
                  variant="outline" 
                  icon="i-heroicons-calendar-days"
                  class="w-full justify-start"
                  size="sm"
                  :disabled="props.readonly"
                >
                  {{ billDateDisplayText }}
                </UButton>
                <template #content>
                  <UCalendar v-model="billDateValue" class="p-2" :disabled="props.readonly" />
                </template>
              </UPopover>
            </div>

            <!-- Invoice Number -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Invoice Number
              </label>
              <UInput
                :model-value="form.number"
                placeholder="Auto-generated"
                size="sm"
                class="w-full"
                disabled
                icon="i-heroicons-hashtag"
              />
            </div>

            <!-- Invoice Type -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Invoice type <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="invoiceTypeOption"
                :items="invoiceTypeOptions"
                placeholder="Select invoice type"
                size="sm"
                class="w-full"
                value-key="value"
                :disabled="!form.project_uuid || props.readonly"
              />
            </div>

            <!-- Vendor -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Vendor <span class="text-red-500">*</span>
              </label>
              <VendorSelect
                :model-value="form.vendor_uuid"
                :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :disabled="!form.corporation_uuid && !corpStore.selectedCorporation || areSubsequentFieldsDisabled"
                placeholder="Select vendor"
                size="sm"
                class="w-full"
                @update:model-value="handleVendorChange"
                @change="handleVendorChange"
              />
            </div>

            <!-- Credit Days (static NET_* or Nimble GetCreditDaysList + credit_days_id) -->
            <div>
              <CreditDaysSelect
                v-model="creditDaysModel"
                label="Credit Days"
                required
                :show-add-button="!areSubsequentFieldsDisabled"
                :disabled="areSubsequentFieldsDisabled"
              />
            </div>

            <!-- Due Date -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">
                Due Date <span class="text-red-500">*</span>
              </label>
              <UPopover v-model:open="dueDatePopoverOpen" :disabled="areSubsequentFieldsDisabled">
                <UButton 
                  color="neutral" 
                  variant="outline" 
                  icon="i-heroicons-calendar-days"
                  class="w-full justify-start"
                  size="sm"
                  :disabled="areSubsequentFieldsDisabled"
                >
                  {{ dueDateDisplayText }}
                </UButton>
                <template #content>
                  <UCalendar v-model="dueDateValue" class="p-2" :disabled="areSubsequentFieldsDisabled" @update:model-value="dueDatePopoverOpen = false" />
                </template>
              </UPopover>
            </div>

            <!-- PO Number (only visible when invoice type is "Against PO") -->
            <div v-if="isAgainstPO">
              <label class="block text-xs font-medium text-default mb-1">
                PO Number <span class="text-red-500">*</span>
              </label>
              <POCOSelect
                :model-value="form.po_co_uuid || (form.purchase_order_uuid ? `PO:${form.purchase_order_uuid}` : undefined)"
                :model-value-fallback-label="form.po_number || undefined"
                :project-uuid="form.project_uuid"
                :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :vendor-uuid="form.vendor_uuid"
                :show-invoice-summary="true"
                :showOnlyPOs="true"
                :fullscreen="true"
                required
                :show-validation-error="showFormValidationErrors"
                :disabled="areSubsequentFieldsDisabled"
                placeholder="Select purchase order"
                size="sm"
                class="w-full"
                @update:model-value="handlePOCOModelValue"
                @change="handlePOCOChangeForPO"
              />
            </div>

            <!-- CO Number (only visible when invoice type is "Against CO") -->
            <div v-if="isAgainstCO">
              <label class="block text-xs font-medium text-default mb-1">
                CO Number <span class="text-red-500">*</span>
              </label>
              <POCOSelect
                :model-value="form.po_co_uuid || (form.change_order_uuid ? `CO:${form.change_order_uuid}` : undefined)"
                :model-value-fallback-label="form.co_number || undefined"
                :project-uuid="form.project_uuid"
                :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :vendor-uuid="form.vendor_uuid"
                :show-invoice-summary="true"
                :showOnlyCOs="true"
                :fullscreen="true"
                required
                :show-validation-error="showFormValidationErrors"
                :disabled="areSubsequentFieldsDisabled"
                placeholder="Select change order"
                size="sm"
                class="w-full"
                @update:model-value="handlePOCOModelValue"
                @change="handlePOCOChangeForCO"
              />
            </div>

            <!-- PO/CO Select (only visible when invoice type is "Against Advance Payment") -->
            <div v-if="isAgainstAdvancePayment">
              <label class="block text-xs font-medium text-default mb-1">
                Select PO/CO <span class="text-red-500">*</span>
              </label>
              <POCOSelect
                :model-value="form.po_co_uuid"
                :project-uuid="form.project_uuid"
                :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
                :vendor-uuid="form.vendor_uuid"
                :show-invoice-summary="true"
                required
                :show-validation-error="showFormValidationErrors"
                :disabled="areSubsequentFieldsDisabled"
                placeholder="Select PO or CO"
                size="sm"
                class="w-full"
                @update:model-value="handlePOCOModelValue"
                @change="handlePOCOChange"
              />
            </div>

            <!-- Holdback Invoice Select (only visible when invoice type is "Against Holdback Amount") -->
            <div v-if="isAgainstHoldback">
              <label class="block text-xs font-medium text-default mb-1">
                Select PO/CO for Holdback <span class="text-red-500">*</span>
              </label>
              <UButton
                :disabled="areSubsequentFieldsDisabled"
                color="neutral"
                variant="outline"
                size="sm"
                class="w-full justify-start"
                @click="showHoldbackModal = true"
              >
                <span v-if="form.holdback_invoice_uuid || form.po_co_uuid || form.purchase_order_uuid || form.change_order_uuid">
                  <span v-if="form.po_number">{{ form.po_number }}</span>
                  <span v-else-if="form.co_number">{{ form.co_number }}</span>
                  <span v-else-if="form.holdback_invoice_uuid">Holdback Invoice Selected</span>
                  <span v-else-if="form.purchase_order_uuid || form.change_order_uuid">Loading...</span>
                  <span v-else>Selected</span>
                </span>
                <span v-else>
                  {{ !form.project_uuid ? 'Select project first' : !form.vendor_uuid ? 'Select vendor first' : 'Select PO/CO for holdback invoice' }}
                </span>
              </UButton>
            </div>

            <!-- Holdback (only for Against PO or Against CO) -->
            <div v-if="isAgainstPO || isAgainstCO">
              <label class="block text-xs font-medium text-default mb-1">
                Holdback
              </label>
              <div class="relative">
                <UInput
                  :model-value="holdbackInputValue"
                  type="number"
                  min="0"
                  step="1"
                  pattern="[0-9]*"
                  inputmode="numeric"
                  placeholder="0"
                  size="sm"
                  class="w-full pr-8"
                  :disabled="areSubsequentFieldsDisabled"
                  @wheel.prevent
                  @keydown="onHoldbackInputKeydown"
                  @update:model-value="handleHoldbackChange"
                />
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-default">
                  %
                </div>
              </div>
            </div>
            </template>
          </div>
          <div class="mt-3 flex justify-end">
            <UPopover
              v-if="showPaidStamp || showPartiallyPaidStamp"
              v-model:open="paymentsPopoverOpen"
              @update:open="onPaymentsPopoverOpenChanged"
            >
              <img
                :src="showPaidStamp ? '/PaidImage.png' : '/PartiallyPaidImage.png'"
                :alt="showPaidStamp ? 'Paid stamp' : 'Partially paid stamp'"
                class="h-20 w-auto object-contain shrink-0 cursor-pointer"
              />
              <template #content>
                <div class="w-[680px] max-w-[90vw] p-3">
                  <div class="text-sm font-semibold mb-2 text-center">Payment Details</div>
                  <div v-if="paymentsLoading" class="text-sm text-gray-500 py-2 text-center">
                    Loading payments...
                  </div>
                  <div
                    v-else-if="paymentsError"
                    class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"
                  >
                    {{ paymentsError }}
                  </div>
                  <div v-else-if="!paymentsRows.length" class="text-sm text-gray-500 py-2 text-center">
                    No payment rows found.
                  </div>
                  <UTable
                    v-else
                    :data="paymentsRows"
                    :columns="paymentsColumns"
                    :ui="{ td: 'py-2 text-sm text-center', th: 'py-2 text-xs uppercase tracking-wide text-center' }"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Advance Payment Cost Codes Table (only for Against Advance Payment) -->
    <AdvancePaymentCostCodesTable
      ref="advancePaymentCostCodesTableRef"
      v-if="isAgainstAdvancePayment && !hasAllItemsZeroToBeInvoiced"
      :po-co-uuid="form.po_co_uuid"
      :po-co-type="poCoType"
      :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
      :readonly="props.readonly"
      :model-value="advancePaymentCostCodes"
      :removed-cost-codes="removedAdvancePaymentCostCodes"
      :consumed-advance-amounts-by-key="consumedAdvanceAmountsByKey"
      @update:model-value="handleAdvancePaymentCostCodesUpdate"
      @update:removed-cost-codes="handleRemovedCostCodesUpdate"
    />

    <!-- Labor PO Invoice Items Table (for Against PO with labor PO) -->
    <div v-if="isAgainstPO && isLaborPO && !hasAllItemsZeroToBeInvoiced" class="mt-6">
      <LaborInvoiceItemsTable
        ref="laborInvoiceItemsTableRef"
        title="Labor Purchase Order Items"
        :description="form.purchase_order_uuid ? 'Labor items from the selected purchase order' : 'Select a labor purchase order to view items'"
        :items="laborInvoiceItems"
        :loading="laborInvoiceItemsLoading"
        :error="laborInvoiceItemsError"
        :readonly="props.readonly"
        @invoice-amount-change="handleLaborInvoiceAmountChange"
      />

      <!-- Advance Payment Breakdown Table for labor POs -->
      <AdvancePaymentBreakdownTable
        ref="poAdvancePaymentBreakdownRef"
        :purchase-order-uuid="form.purchase_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- Labor CO Invoice Items Table (for Against CO/Advance Payment with labor CO) -->
    <div v-if="isAgainstCO && isLaborCO && !hasAllItemsZeroToBeInvoiced" class="mt-6">
      <LaborInvoiceItemsTable
        ref="laborInvoiceItemsTableRef"
        title="Labor Change Order Items"
        :description="form.change_order_uuid ? 'Labor items from the selected change order' : 'Select a labor change order to view items'"
        :items="laborInvoiceItems"
        :loading="laborInvoiceItemsLoading"
        :error="laborInvoiceItemsError"
        :readonly="props.readonly"
        @invoice-amount-change="handleLaborInvoiceAmountChange"
      />

      <!-- Advance Payment Breakdown Table for labor CO invoices -->
      <AdvancePaymentBreakdownTable
        v-if="isAgainstCO"
        ref="coAdvancePaymentBreakdownRef"
        :change-order-uuid="form.change_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- Validation Error Message for Zero To Be Invoiced (shown before tables) -->
    <UAlert
      v-if="showFormValidationErrors && overInvoicedValidationError && hasAllItemsZeroToBeInvoiced"
      color="error"
      variant="soft"
      class="mt-6"
      title="Cannot Create Invoice"
      :description="overInvoicedValidationError"
    />

    <!-- PO Items Table (only for Against PO with material PO, not for manual/LWM estimates) -->
    <div v-if="isAgainstPO && !isLaborPO && !hasAllItemsZeroToBeInvoiced && !hasPoLwmItems" class="mt-6">
      <POItemsTableWithEstimates
        :key="`po-items-${form.purchase_order_uuid || 'none'}-${poItemsKey}-${poItems.length}`"
        title="Purchase Order Items"
        :description="form.purchase_order_uuid ? 'Items from the selected purchase order' : 'Select a purchase order to view items'"
        :items="poItems"
        :loading="poItemsLoading"
        :error="poItemsError"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :project-uuid="form.project_uuid"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :scoped-item-types="scopedItemTypes"
        :scoped-locations="poScopedLocations"
        :show-estimate-values="false"
        :show-invoice-values="true"
        :readonly="props.readonly"
        :hide-approval-checks="true"
        :hide-model-number="true"
        :hide-location="!isSelectedProjectLocationWiseEnabled"
        @invoice-unit-price-change="handleInvoiceUnitPriceChange"
        @invoice-quantity-change="handleInvoiceQuantityChange"
        @invoice-total-change="handleInvoiceTotalChange"
        @approval-checks-change="handlePOItemApprovalChecksChange"
      />

      <!-- Advance Payment Breakdown Table -->
      <AdvancePaymentBreakdownTable
        ref="poAdvancePaymentBreakdownRef"
        :purchase-order-uuid="form.purchase_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- PO Location-wise Material Items (for manual estimate POs) -->
    <div v-if="isAgainstPO && !isLaborPO && hasPoLwmItems" class="mt-6">
      <InvoiceLocationWiseMaterialTable
        title="Location-wise Material Items"
        description="Invoice items from location-wise material purchase order"
        :items="poLwmItems"
        :loading="poLwmItemsLoading"
        :readonly="props.readonly"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :show-budgeted-amount="true"
        mode="po"
        @invoice-amount-change="handlePoLwmInvoiceAmountChange"
      />

      <!-- Advance Payment Breakdown Table for LWM POs -->
      <AdvancePaymentBreakdownTable
        ref="poAdvancePaymentBreakdownRef"
        :purchase-order-uuid="form.purchase_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- CO Items Table (only for Against CO with material CO, not for manual/LWM estimates) -->
    <div v-if="isAgainstCO && !isLaborCO && !hasAllItemsZeroToBeInvoiced && !hasCoLwmItems" class="mt-6">
      <COItemsTableFromOriginal
        :key="`co-items-${form.change_order_uuid || 'none'}-${coItemsKey}-${coItems.length}`"
        title="Change Order Items"
        :description="form.change_order_uuid ? 'Items from the selected change order' : 'Select a change order to view items'"
        :items="coItems"
        :loading="coItemsLoading"
        :error="coItemsError"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :project-uuid="form.project_uuid"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :scoped-item-types="scopedItemTypes"
        :show-invoice-values="true"
        :readonly="props.readonly"
        :hide-approval-checks="true"
        :hide-location="!isSelectedProjectLocationWiseEnabled"
        @invoice-unit-price-change="handleCOInvoiceUnitPriceChange"
        @invoice-quantity-change="handleCOInvoiceQuantityChange"
        @invoice-total-change="handleCOInvoiceTotalChange"
      />

      <!-- Advance Payment Breakdown Table -->
      <AdvancePaymentBreakdownTable
        ref="coAdvancePaymentBreakdownRef"
        :change-order-uuid="form.change_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- CO Location-wise Material Items (for manual estimate COs) -->
    <div v-if="isAgainstCO && !isLaborCO && hasCoLwmItems" class="mt-6">
      <InvoiceLocationWiseMaterialTable
        title="Location-wise Material Items"
        description="Invoice items from location-wise material change order"
        :items="coLwmItems"
        :loading="coLwmItemsLoading"
        :readonly="props.readonly"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :show-budgeted-amount="true"
        mode="co"
        @invoice-amount-change="handleCoLwmInvoiceAmountChange"
      />

      <!-- Advance Payment Breakdown Table for LWM COs -->
      <AdvancePaymentBreakdownTable
        ref="coAdvancePaymentBreakdownRef"
        :change-order-uuid="form.change_order_uuid"
        :current-invoice-uuid="form.uuid"
        :show-adjustment-inputs="true"
        :readonly="props.readonly"
        :adjusted-amounts="adjustedAdvancePaymentAmounts"
        :previously-adjusted-cost-codes="previouslyAdjustedCostCodes"
        :is-invoice-saved="!!(form.uuid && props.editingInvoice)"
        @adjusted-amount-change="handleAdjustedAmountChange"
        @adjusted-amounts-update="handleAdjustedAmountsUpdate"
      />
    </div>

    <!-- Holdback Breakdown Table (only for Against Holdback Amount) -->
    <!-- Show table if we have holdback invoice UUID OR if we have saved holdback cost codes (for existing invoices) -->
    <!-- Hide when all holdback amounts are zero (but show alert in that case) -->
    <div v-if="isAgainstHoldback && (form.holdback_invoice_uuid || (form.purchase_order_uuid || form.change_order_uuid) || (holdbackCostCodes && holdbackCostCodes.length > 0))" class="mt-6">
      <!-- Skeleton loader for holdback breakdown table -->
      <div v-if="loadingHoldbackData" class="mt-6">
        <UCard variant="soft">
          <div class="flex items-center justify-between mb-4">
            <USkeleton class="h-5 w-40" />
            <USkeleton class="h-8 w-24" />
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-default/60">
              <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th class="px-3 py-2 text-left"><USkeleton class="h-4 w-20" /></th>
                  <th class="px-3 py-2 text-left"><USkeleton class="h-4 w-24" /></th>
                  <th class="px-3 py-2 text-right"><USkeleton class="h-4 w-28" /></th>
                  <th class="px-3 py-2 text-right"><USkeleton class="h-4 w-20" /></th>
                  <th class="px-3 py-2 text-right"><USkeleton class="h-4 w-24" /></th>
                  <th class="px-3 py-2 text-center"><USkeleton class="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default/60 text-sm text-default bg-white dark:bg-gray-900/40">
                <tr v-for="i in 3" :key="i" class="align-middle">
                  <td class="px-3 py-2"><USkeleton class="h-8 w-full" /></td>
                  <td class="px-3 py-2"><USkeleton class="h-8 w-full" /></td>
                  <td class="px-3 py-2 text-right"><USkeleton class="h-4 w-20 ml-auto" /></td>
                  <td class="px-3 py-2 text-right"><USkeleton class="h-4 w-16 ml-auto" /></td>
                  <td class="px-3 py-2"><USkeleton class="h-8 w-full" /></td>
                  <td class="px-3 py-2 text-center"><USkeleton class="h-6 w-12 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
      <!-- Actual holdback breakdown table -->
      <HoldbackBreakdownTable
        v-else
        ref="holdbackBreakdownTableRef"
        :purchase-order-uuid="form.purchase_order_uuid"
        :change-order-uuid="form.change_order_uuid"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :invoice-status="form.status"
        :readonly="props.readonly"
        :model-value="holdbackCostCodes"
        :holdback-invoice-uuid="form.holdback_invoice_uuid"
        :current-invoice-uuid="form.uuid"
        :previously-released-cost-codes="previouslyReleasedCostCodes"
        :is-labor-p-o="isLaborPO"
        :is-labor-c-o="isLaborCO"
        @update:model-value="handleHoldbackCostCodesUpdate"
        @release-amounts-update="handleHoldbackReleaseAmountsUpdate"
      />
    </div>

    <!-- Validation error message when all holdback amounts are zero (shown outside the table container) -->
    <UAlert
      v-if="showFormValidationErrors && isAgainstHoldback && holdbackValidationError"
      color="error"
      variant="soft"
      class="mt-6"
      title="Cannot Create Holdback Invoice"
      :description="holdbackValidationError"
    />

    <!-- Line Items Table (only for Direct Invoice) -->
    <div v-if="isDirectInvoice && !hasAllItemsZeroToBeInvoiced" class="mt-6">
      <div
        v-if="canOpenDirectProjectImport"
        class="flex justify-end mb-2"
      >
        <UButton
          size="sm"
          color="primary"
          variant="outline"
          icon="i-heroicons-arrow-down-tray"
          @click="openDirectMasterImportModal(false)"
        >
          Import from project
        </UButton>
      </div>
      <PreferredItemsFromMasterSection
        v-model:master-import-open="showMasterDirectLineModal"
        :items="directLineItemsForMasterDisplay"
        :loading="false"
        :error="null"
        title="Line items"
        description="Preferred items from item master"
        loading-message=""
        empty-message="No line items yet. Use Import from project or add rows."
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :project-uuid="form.project_uuid"
        :scoped-item-types="scopedItemTypes"
        :scoped-cost-code-configurations="scopedCostCodeConfigurations"
        :show-edit-selection="canOpenDirectProjectImport"
        :hide-approval-checks="true"
        :hide-model-number="true"
        :hide-location="!isSelectedProjectLocationWiseEnabled"
        :readonly="props.readonly"
        :master-items="masterDirectLineModalItems"
        :master-preselected-items="directLineMasterModalPreselected"
        master-modal-title="Select items to import from master"
        @add-row="handleAddLineItem"
        @remove-row="handleRemoveLineItem"
        @cost-code-change="handleLineItemCostCodeChange"
        @category-change="handleDirectLineCategoryChange"
        @item-division-change="handleDirectLineMasterTableNoOp"
        @location-change="handleDirectLineLocationChange"
        @item-type-change="handleLineItemItemTypeChange"
        @sequence-change="handleLineItemSequenceChange"
        @item-change="handleLineItemItemChange"
        @approval-checks-change="handleDirectLineMasterTableNoOp"
        @model-number-change="handleLineItemModelNumberChange"
        @uom-change="handleLineItemUomChange"
        @po-unit-price-change="handleDirectLinePoUnitPriceChange"
        @po-quantity-change="handleDirectLinePoQuantityChange"
        @po-total-change="handleDirectLinePoTotalChange"
        @description-change="handleLineItemDescriptionChange"
        @edit-selection="handleEditMasterDirectLineSelection"
        @master-confirm="handleMasterDirectLineConfirm"
        @master-cancel="handleMasterDirectLineCancel"
      />
    </div>

    <!-- File Upload and Financial Breakdown Section (for Advance Payment Invoice) -->
    <div v-if="isAgainstAdvancePayment && !hasAllItemsZeroToBeInvoiced" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
          >
            <div class="space-y-2">
              <UButton
                :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose files')"
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
                PDF or image files · Maximum size 10MB each
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
              Use the button above to attach invoice documents.
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
                  {{ attachment.document_name || attachment.name || `File ${Number(index) + 1}` }}
                </span>
                <span class="text-[11px] text-muted">
                  {{ formatFileSize(attachment.size || attachment.file_size) }}
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
                    icon="mingcute:delete-fill"
                    color="error"
                    variant="soft"
                    size="xs"
                    class="p-1 h-auto text-xs"
                    :disabled="props.readonly"
                    @click.stop="removeFile(Number(index))"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px] space-y-3">
          <UBanner
            v-if="showFormValidationErrors && hasAdvancePaymentBelowConsumedError"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            title="Advance payment amounts cannot be reduced"
            :description="advancePaymentBelowConsumedBannerDescription"
            class="w-full rounded-lg"
          />
          <FinancialBreakdown
            :item-total="advancePaymentTotal"
            :form-data="form"
            :read-only="props.readonly"
            :coa-selection-read-only="isAgainstAdvancePayment"
            :show-account-config="true"
            :item-breakdown-by-account="advancePaymentCOAContext.itemBreakdownByAccount"
            item-total-label="Advance Payment Total"
            total-label="Total Invoice Amount"
            total-field-name="amount"
            :hide-charges="true"
            :show-total-amount="true"
            total-amount-label="Total Amount"
            :allow-edit-total="false"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Direct Invoice) -->
    <div v-if="isDirectInvoice" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
          >
            <div class="space-y-2">
              <UButton
                :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose files')"
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
                PDF or image files · Maximum size 10MB each
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
              Use the button above to attach invoice documents.
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
                  {{ attachment.document_name || attachment.name || `File ${Number(index) + 1}` }}
                </span>
                <span class="text-[11px] text-muted">
                  {{ formatFileSize(attachment.size || attachment.file_size) }}
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
                    icon="mingcute:delete-fill"
                    color="error"
                    variant="soft"
                    size="xs"
                    class="p-1 h-auto text-xs"
                    :disabled="props.readonly"
                    @click.stop="removeFile(Number(index))"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <FinancialBreakdown
            :item-total="lineItemsTotal"
            :form-data="form"
            :read-only="props.readonly"
            :show-account-config="true"
            item-total-label="Item Total"
            total-label="Total Invoice Amount"
            total-field-name="amount"
            :show-total-amount="true"
            total-amount-label="Total Amount"
            :allow-edit-total="false"
            :item-breakdown-by-account="directCoaItemBreakdown"
            :corporation-uuid="form.corporation_uuid"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Against PO) -->
    <div v-if="isAgainstPO && !hasAllItemsZeroToBeInvoiced" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
          >
            <div class="space-y-2">
              <UButton
                :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose files')"
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
                PDF or image files · Maximum size 10MB each
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
              Use the button above to attach invoice documents.
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
                  {{ attachment.document_name || attachment.name || `File ${Number(index) + 1}` }}
                </span>
                <span class="text-[11px] text-muted">
                  {{ formatFileSize(attachment.size || attachment.file_size) }}
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
                    icon="mingcute:delete-fill"
                    color="error"
                    variant="soft"
                    size="xs"
                    class="p-1 h-auto text-xs"
                    :disabled="props.readonly"
                    @click.stop="removeFile(Number(index))"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px] space-y-3">
          <UBanner
            v-if="hasInvoiceItemsLessThanAdvanceError"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            title="Invoice items total is below advance payments applied"
            :description="invoiceItemsLessThanAdvanceBannerDescription"
            class="w-full rounded-lg"
          />
          <FinancialBreakdown
            :item-total="isLaborPO ? laborInvoiceItemsTotal : (poItemsTotal + poLwmItemsTotal)"
            :form-data="form"
            :read-only="props.readonly"
            :show-account-config="true"
            :hide-charges="shouldHideCharges"
            item-total-label="Invoice Items Total"
            total-label="Total Invoice Amount"
            total-field-name="amount"
            :show-total-amount="true"
            total-amount-label="Total Amount"
            :allow-edit-total="false"
            :total-invoice-amount-error="props.totalInvoiceAmountError"
            :advance-payment-deduction="effectiveAdvancePaymentDeduction"
            :holdback-percentage="form.holdback"
            :item-breakdown-by-account="againstPoCoaItemBreakdown"
            :advance-amounts-by-row="advanceAmountsByBreakdownRow"
            :advance-tax-credits-by-line="advanceTaxCreditsBySalesTaxLine"
            :corporation-uuid="form.corporation_uuid"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Against Holdback Amount) -->
    <!-- Show if we have holdback invoice UUID OR if we have saved holdback cost codes (for existing invoices) -->
    <!-- Hide when all holdback amounts are zero -->
    <div v-if="isAgainstHoldback && !allHoldbackAmountsZero && ((form.purchase_order_uuid || form.change_order_uuid) || (holdbackCostCodes && holdbackCostCodes.length > 0))" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
          >
            <div class="space-y-2">
              <UButton
                :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose files')"
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
                PDF or image files · Maximum size 10MB each
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
              Use the button above to attach invoice documents.
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
                  {{ attachment.document_name || attachment.name || `File ${Number(index) + 1}` }}
                </span>
                <span class="text-[11px] text-muted">
                  {{ formatFileSize(attachment.size || attachment.file_size) }}
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
                    icon="mingcute:delete-fill"
                    color="error"
                    variant="soft"
                    size="xs"
                    class="p-1 h-auto text-xs"
                    :disabled="props.readonly"
                    @click.stop="removeFile(Number(index))"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <!-- Skeleton loader for financial breakdown -->
          <UCard v-if="loadingHoldbackData" variant="soft" class="w-full shadow-sm border border-default bg-white dark:bg-gray-900/40">
            <div class="space-y-4">
              <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                <USkeleton class="h-4 w-32" />
                <div></div>
                <div></div>
                <USkeleton class="h-4 w-24 ml-auto" />
              </div>
              <div class="space-y-2">
                <div v-for="i in 2" :key="i" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-10 w-full" />
                  <USkeleton class="h-8 w-20" />
                  <USkeleton class="h-8 w-24" />
                  <div></div>
                </div>
              </div>
              <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                <USkeleton class="h-4 w-24" />
                <div></div>
                <div></div>
                <USkeleton class="h-4 w-20 ml-auto" />
              </div>
              <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                <USkeleton class="h-4 w-32" />
                <div></div>
                <div></div>
                <USkeleton class="h-4 w-28 ml-auto" />
              </div>
            </div>
          </UCard>
          <!-- Actual financial breakdown -->
          <FinancialBreakdown
            v-else
            :item-total="holdbackReleaseAmountTotal"
            :form-data="form"
            :read-only="props.readonly"
            :show-account-config="true"
            item-total-label="Release Amount Total"
            total-label="Total Invoice Amount"
            total-field-name="amount"
            :hide-charges="true"
            :show-total-amount="true"
            total-amount-label="Total Amount"
            :allow-edit-total="false"
            :holdback-percentage="0"
            :item-breakdown-by-account="holdbackCoaItemBreakdown"
            :simplify-coa-modal-columns="isAgainstHoldback"
            :corporation-uuid="form.corporation_uuid"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Against CO) -->
    <div v-if="isAgainstCO && !hasAllItemsZeroToBeInvoiced" class="mt-6 flex flex-col lg:flex-row gap-6">
      <!-- File Upload Section (Left) -->
      <div class="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
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
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
          >
            <div class="space-y-2">
              <UButton
                :label="isUploading ? 'Uploading...' : (uploadedFiles.length > 0 ? 'Add more files' : 'Choose files')"
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
                PDF or image files · Maximum size 10MB each
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
              Use the button above to attach invoice documents.
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
                  {{ attachment.document_name || attachment.name || `File ${Number(index) + 1}` }}
                </span>
                <span class="text-[11px] text-muted">
                  {{ formatFileSize(attachment.size || attachment.file_size) }}
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
                    icon="mingcute:delete-fill"
                    color="error"
                    variant="soft"
                    size="xs"
                    class="p-1 h-auto text-xs"
                    :disabled="props.readonly"
                    @click.stop="removeFile(Number(index))"
                  />
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px] space-y-3">
          <UBanner
            v-if="hasInvoiceItemsLessThanAdvanceError"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            title="Invoice items total is below advance payments applied"
            :description="invoiceItemsLessThanAdvanceBannerDescription"
            class="w-full rounded-lg"
          />
          <FinancialBreakdown
            :item-total="isLaborCO ? laborInvoiceItemsTotal : (coItemsTotal + coLwmItemsTotal)"
            :form-data="form"
            :read-only="props.readonly"
            :show-account-config="true"
            :hide-charges="shouldHideCharges"
            item-total-label="CO Items Total"
            total-label="Total Invoice Amount"
            total-field-name="amount"
            :show-total-amount="true"
            total-amount-label="Total Amount"
            :allow-edit-total="false"
            :total-invoice-amount-error="props.totalInvoiceAmountError"
            :advance-payment-deduction="effectiveAdvancePaymentDeduction"
            :holdback-percentage="form.holdback"
            :item-breakdown-by-account="againstCoCoaItemBreakdown"
            :advance-amounts-by-row="advanceAmountsByBreakdownRow"
            :advance-tax-credits-by-line="advanceTaxCreditsBySalesTaxLine"
            :corporation-uuid="form.corporation_uuid"
            @update="handleFinancialBreakdownUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Preview Modal -->
    <UModal
      v-model:open="showFilePreviewModal"
      title="File Preview"
      :ui="{
        content: 'fixed inset-0 z-[110] flex h-[100dvh] max-h-[100dvh] w-[95vw] max-w-[95vw] flex-col rounded-lg shadow-lg ring ring-default overflow-hidden',
        body: 'flex-1 min-h-0 overflow-hidden p-0',
        header: 'flex-shrink-0 px-4 sm:px-6 py-4 border-b border-default',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">File Preview</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeFilePreview" />
        </div>
      </template>
      <template #body>
        <div class="h-full min-h-[50vh] overflow-hidden">
          <FilePreview :attachment="selectedFileForPreview" />
        </div>
      </template>
    </UModal>

    <!-- Holdback Invoice Select Modal -->
    <HoldbackInvoiceSelect
      v-model="showHoldbackModal"
      :project-uuid="form.project_uuid"
      :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
      :vendor-uuid="form.vendor_uuid"
      @select="handleHoldbackSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, triggerRef } from "vue";
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { useCorporationStore } from "~/stores/corporations";
import { useVendorStore } from "~/stores/vendors";
import { useProjectsStore } from "~/stores/projects";
import { useLocationsStore } from "~/stores/locations";
import { useCostCodeConfigurationsStore } from "~/stores/costCodeConfigurations";
import { usePurchaseOrdersStore } from "~/stores/purchaseOrders";
import { useChangeOrdersStore } from "~/stores/changeOrders";
import { usePurchaseOrderResourcesStore } from "~/stores/purchaseOrderResources";
import { useApprovalChecksStore } from "~/stores/approvalChecks";
import { useUOMStore } from "~/stores/uom";
import CorporationSelect from '~/components/shared/CorporationSelect.vue';
import ProjectSelect from '~/components/shared/ProjectSelect.vue';
import VendorSelect from '~/components/shared/VendorSelect.vue';
import PurchaseOrderSelect from '~/components/shared/PurchaseOrderSelect.vue';
import POCOSelect from '~/components/shared/POCOSelect.vue';
import FilePreview from '~/components/shared/FilePreview.vue';
import PreferredItemsFromMasterSection from '~/components/shared/PreferredItemsFromMasterSection.vue';
import type { CostCodePreferredItemImportRow } from '~/components/payables/DirectInvoiceImportProjectItemsModal.vue';
import AdvancePaymentCostCodesTable from '~/components/payables/AdvancePaymentCostCodesTable.vue';
import AdvancePaymentBreakdownTable from '~/components/payables/AdvancePaymentBreakdownTable.vue';
import LaborInvoiceItemsTable from '~/components/payables/LaborInvoiceItemsTable.vue';
import HoldbackInvoiceSelect from '~/components/payables/HoldbackInvoiceSelect.vue';
import HoldbackBreakdownTable from '~/components/payables/HoldbackBreakdownTable.vue';
import CreditDaysSelect from '~/components/shared/CreditDaysSelect.vue';
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions';
import FinancialBreakdown from '~/components/purchaseOrders/FinancialBreakdown.vue';
import { useCurrencyFormat } from '~/composables/useCurrencyFormat';
import { applyEqualAdvanceDeductionToBreakdown } from '~/utils/applyEqualAdvanceDeductionToBreakdown';
import { applyPerRowOrEqualCostAdvanceToBreakdown } from '~/utils/applyPerRowOrEqualAdvanceToBreakdown';
import { applyPerLinePercentHoldbackToBreakdown } from '~/utils/applyPerLinePercentHoldbackToBreakdown';
import { allocateGlobalHoldbackProportionally } from '~/utils/allocateGlobalHoldbackProportionally';
import { buildAdvanceAmountsByRow } from '~/utils/buildAdvanceAdjustmentLabelsByRow';
import { isTaxAdjustmentKey, taxAdjustmentKey } from '~/utils/advancePaymentTaxAdjustmentKeys';
import { buildAdvancePaymentCOABreakdown } from '~/utils/buildAdvancePaymentCOABreakdown';
import { mergeSavedCoaAccountUuidsOntoItemBreakdown } from '~/utils/mergeSavedCoaAccountUuidsOntoItemBreakdown';
import { computeHoldbackByCostCodeFromGlPipeline } from '~/utils/computeHoldbackByCostCodeFromGlPipeline';
import {
  computeRetainageAmountsByCostCode,
  resolveSourceItemsFromVendorInvoicePayload,
} from '~/utils/holdbackRetainageByCostCode';
import { applyPoCurrencyToVendorInvoiceLineItem } from '~/utils/poCurrencyConversion';
import {
  aggregateAdjustedAdvancePaymentAmounts,
  validateAdvancePaymentNotBelowConsumed,
} from '~/utils/adjustedAdvancePaymentAggregates';
import POItemsTableWithEstimates from '~/components/purchaseOrders/POItemsTableWithEstimates.vue';
import COItemsTableFromOriginal from '~/components/changeOrders/COItemsTableFromOriginal.vue';
import InvoiceLocationWiseMaterialTable from '~/components/payables/InvoiceLocationWiseMaterialTable.vue';

// Props
interface Props {
  form: any;
  editingInvoice: boolean;
  loading?: boolean;
  readonly?: boolean;
  totalInvoiceAmountError?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  readonly: false,
  totalInvoiceAmountError: null
});

// Emits
const emit = defineEmits<{
  'update:form': [value: any];
  'file-upload': [files: File[]];
}>();

// Stores
const corpStore = useCorporationStore();
const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = useCreditDaysOptions();
const vendorStore = useVendorStore();
const projectsStore = useProjectsStore();
const locationsStore = useLocationsStore();
const costCodeConfigurationsStore = useCostCodeConfigurationsStore();
// Import stores for PO/CO data fetching (used by POCOSelect)
// NOTE: We fetch data for the form's corporation, not TopBar's corporation
const purchaseOrdersStore = usePurchaseOrdersStore();
const changeOrdersStore = useChangeOrdersStore();
// Use purchaseOrderResourcesStore for cost codes, item types, and preferred items
// This ensures we fetch data for the form's corporation, not TopBar's corporation
const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore();
const approvalChecksStore = useApprovalChecksStore();
const uomStore = useUOMStore();
const { formatCurrency } = useCurrencyFormat();

// Helper functions for numeric parsing and rounding (same as PurchaseOrderForm)
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

const roundCurrencyValue = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

const normalizedInvoiceStatus = computed(() =>
  String(props.form?.status || '').trim().toLowerCase()
)
const showPaidStamp = computed(() => normalizedInvoiceStatus.value === 'paid')
const showPartiallyPaidStamp = computed(() => normalizedInvoiceStatus.value === 'partially_paid')
const paymentsPopoverOpen = ref(false)
const paymentsLoading = ref(false)
const paymentsError = ref('')
const paymentsRows = ref<Array<{
  bill_info_id: number | null
  check_no: string | null
  pay_method: string | null
  paid_status: string | null
}>>([])
const paymentsColumns = [
  { accessorKey: 'bill_info_id', header: 'Bill Info ID' },
  { accessorKey: 'check_no', header: 'Check Number' },
  { accessorKey: 'pay_method', header: 'Pay Method' },
  { accessorKey: 'paid_status', header: 'Payment Status' },
]

const loadPaymentsForCurrentInvoice = async () => {
  const invoiceUuid = String(props.form?.uuid || '').trim()
  if (!invoiceUuid) {
    paymentsRows.value = []
    paymentsError.value = 'Invoice UUID is missing.'
    return
  }

  paymentsLoading.value = true
  paymentsError.value = ''
  try {
    const response = await $fetch<{
      data?: Array<{
        bill_info_id?: number | null
        check_no?: string | null
        pay_method?: string | null
        paid_status?: string | null
      }>
      error?: string
    }>(`/api/vendor-invoices/${invoiceUuid}/nimble-payments`)

    if (response?.error) {
      throw new Error(response.error)
    }

    const rows = Array.isArray(response?.data) ? response.data : []
    paymentsRows.value = rows.map((row) => ({
      bill_info_id: row.bill_info_id ?? null,
      check_no: row.check_no ?? null,
      pay_method: row.pay_method ?? null,
      paid_status: row.paid_status ?? null,
    }))
  } catch (err: any) {
    paymentsRows.value = []
    paymentsError.value = err?.message || 'Failed to load payment details'
  } finally {
    paymentsLoading.value = false
  }
}

const onPaymentsPopoverOpenChanged = async (open: boolean) => {
  paymentsPopoverOpen.value = open
  if (open) {
    await loadPaymentsForCurrentInvoice()
  }
}

// Generate next invoice number from API allocation endpoint.
async function generateInvoiceNumber() {
  // Never generate for existing/editing invoices.
  if (props.editingInvoice) return;
  // Do not override if already set (e.g., editing)
  if (props.form.number && String(props.form.number).trim() !== '') return;
  const corporationId = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid || corpStore.selectedCorporationId;
  if (!corporationId) return;

  try {
    const response = await $fetch<{ data?: { number?: string | null } }>(`/api/vendor-invoices`, {
      method: "GET",
      query: {
        corporation_uuid: String(corporationId),
        next_invoice_number: true,
      },
    });
    const nextNumber = String(response?.data?.number || "").trim();
    if (nextNumber) {
      handleFormUpdate('number', nextNumber);
    }
  } catch (error) {
    console.error('[VendorInvoiceForm] Error allocating next invoice number from API:', error);
  }
}

// Date formatter
const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
});

// Invoice type options
const invoiceTypeOptions = [
  { label: 'Enter Direct Invoice', value: 'ENTER_DIRECT_INVOICE' },
  { label: 'Against PO', value: 'AGAINST_PO' },
  { label: 'Against CO', value: 'AGAINST_CO' },
  { label: 'Against Advance Payment', value: 'AGAINST_ADVANCE_PAYMENT' },
  { label: 'Against the hold back amount', value: 'AGAINST_HOLDBACK_AMOUNT' },
];

// Check if invoice type is selected
const isInvoiceTypeSelected = computed(() => {
  return !!props.form.invoice_type && String(props.form.invoice_type).trim() !== '';
});

// Check if invoice type is "Against PO"
const isAgainstPO = computed(() => {
  return String(props.form.invoice_type || '').toUpperCase() === 'AGAINST_PO';
});

// Check if invoice type is "Against CO"
const isAgainstCO = computed(() => {
  return String(props.form.invoice_type || '').toUpperCase() === 'AGAINST_CO';
});

const isSelectedProjectLocationWiseEnabled = computed(() => {
  const projectUuid = String(props.form.project_uuid || "").trim();
  if (!projectUuid) return false;
  const projectsAny = projectsStore as any;
  const projectFromProjects = Array.isArray(projectsAny?.projects)
    ? projectsAny.projects.find((p: any) => String(p?.uuid || "").trim() === projectUuid)
    : null;
  const projectFromMetadata = Array.isArray(projectsAny?.projectsMetadata)
    ? projectsAny.projectsMetadata.find((p: any) => String(p?.uuid || "").trim() === projectUuid)
    : null;
  const project = projectFromProjects || projectFromMetadata;
  return Boolean(project?.enable_location_wise);
});

const poScopedLocations = ref<any[]>([]);
const refreshPoScopedLocations = async (projectUuidInput?: string | null) => {
  const projectUuid = String(projectUuidInput || "").trim();
  if (!projectUuid) {
    poScopedLocations.value = [];
    return;
  }
  try {
    await locationsStore.fetchLocations(true);
    const allActiveLocations = (locationsStore as any).getActive || [];
    const response = await $fetch<{ data?: any[] }>(
      `/api/projects/location-breakdowns?project_uuid=${encodeURIComponent(projectUuid)}`
    ).catch(() => ({ data: [] }));
    const rows = Array.isArray(response?.data) ? response.data : [];
    const allowedUuids = new Set(
      rows.map((row: any) => String(row?.location_uuid || "").trim()).filter(Boolean)
    );
    const scoped = Array.isArray(allActiveLocations)
      ? allActiveLocations.filter((loc: any) =>
          allowedUuids.has(String(loc?.uuid || "").trim())
        )
      : [];
    poScopedLocations.value = scoped.length > 0
      ? scoped
      : rows
          .filter((row: any) => row?.location_uuid)
          .map((row: any) => ({
            uuid: row.location_uuid,
            location_name: row.location_name || row.location_label || row.location_uuid,
          }));
  } catch {
    poScopedLocations.value = [];
  }
};

watch(
  () => props.form.project_uuid,
  async (projectUuid) => {
    if (!isAgainstPO.value) {
      poScopedLocations.value = [];
      return;
    }
    await refreshPoScopedLocations(projectUuid);
  },
  { immediate: true }
);

watch(
  () => props.form.invoice_type,
  async () => {
    if (!isAgainstPO.value) {
      poScopedLocations.value = [];
      return;
    }
    await refreshPoScopedLocations(props.form.project_uuid);
  }
);

// Check if invoice type is "Enter Direct Invoice"
const isDirectInvoice = computed(() => {
  return String(props.form.invoice_type || '').toUpperCase() === 'ENTER_DIRECT_INVOICE';
});

/** Normalized IDs for `purchaseOrderResourcesStore` — must match `ensureProjectResources` (trim; never `""`). */
const vendorInvoiceResourceCorpUuid = computed(() => {
  const c = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  const t = c != null ? String(c).trim() : "";
  return t === "" ? undefined : t;
});

const vendorInvoiceResourceProjectUuid = computed(() => {
  const p = props.form.project_uuid;
  if (p == null || p === "") return undefined;
  const t = String(p).trim();
  return t === "" ? undefined : t;
});

/**
 * Snapshot corporation for async emits (e.g. holdback PO/CO fetch) so v-model parent updates
 * that have not flushed to props yet do not drop corporation_uuid from the next full-form emit.
 */
const snapshotVendorInvoiceCorporationUuid = () => vendorInvoiceResourceCorpUuid.value;

/** Project items import (Enter Direct Invoice): corp + project; list is all project preferred items (not vendor-filtered). */
const canOpenDirectProjectImport = computed(() => {
  if (!isDirectInvoice.value || props.readonly) return false;
  return !!(vendorInvoiceResourceCorpUuid.value && vendorInvoiceResourceProjectUuid.value);
});

/**
 * Bumps after `ensureProjectResources` for direct invoice scope so line-item preferred-item auto-bind
 * re-runs once Pinia preferred items are populated (same lifecycle as PurchaseOrderForm project watcher).
 */
const directInvoicePreferredItemsRefreshToken = ref(0);

watch(
  () => ({
    corp: vendorInvoiceResourceCorpUuid.value,
    project: vendorInvoiceResourceProjectUuid.value,
    direct: isDirectInvoice.value,
  }),
  async ({ corp, project, direct }) => {
    if (!direct || !corp || !project) return;
    try {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: corp,
        projectUuid: project,
      });
    } finally {
      directInvoicePreferredItemsRefreshToken.value += 1;
    }
  },
  { immediate: true }
);

// Check if invoice type is "Against Advance Payment"
const isAgainstAdvancePayment = computed(() => {
  return String(props.form.invoice_type || '').toUpperCase() === 'AGAINST_ADVANCE_PAYMENT';
});

// Check if invoice type is "Against Holdback Amount"
const isAgainstHoldback = computed(() => {
  return String(props.form.invoice_type || '').toUpperCase() === 'AGAINST_HOLDBACK_AMOUNT';
});

// Check if selected PO is labor type
const isLaborPO = computed(() => {
  return poType.value === 'LABOR';
});

// Check if selected CO is labor type
const isLaborCO = computed(() => {
  return coType.value === 'LABOR';
});

// Computed property for labor invoice items total
const laborInvoiceItemsTotal = computed(() => {
  return laborInvoiceItemsTableRef.value?.totalInvoiceAmount || 0;
});

// Computed property to determine if charges should be hidden for labor PO/CO invoices
const shouldHideCharges = computed(() => {
  return (isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value);
});

// Fetch previously invoiced amounts for labor items to calculate remaining amounts
// Includes regular labor invoices and original advance payments
const fetchPreviouslyInvoicedLaborAmounts = async (
  entityUuid: string,
  entityType: 'purchase_order' | 'change_order',
  currentInvoiceUuid?: string | null
): Promise<Record<string, number>> => {
  if (!entityUuid) return {};

  try {
    // Query labor invoice items with aggregated invoiced amounts
    const response = await $fetch<{ data: any[] }>('/api/labor-invoice-items', {
      method: 'GET',
      query: {
        [entityType === 'purchase_order' ? 'purchase_order_uuid' : 'change_order_uuid']: entityUuid,
        aggregate_invoiced: true,
        exclude_vendor_invoice_uuid: currentInvoiceUuid || undefined
      },
    });

    const aggregatedData = Array.isArray(response?.data) ? response.data : [];

    // Convert aggregated data to item-keyed format (line UUID first, else cost + location, else cost).
    const previouslyInvoicedByItemKey: Record<string, number> = {};
    aggregatedData.forEach((item: any) => {
      const key = getLaborInvoiceAggregationKey(item);
      if (!key) return;
      previouslyInvoicedByItemKey[key] = parseFloat(item.total_invoiced_amount) || 0;
    });

    return previouslyInvoicedByItemKey;
  } catch (error) {
    console.warn('[VendorInvoiceForm] Failed to fetch previously invoiced labor amounts:', error);
    return {};
  }
};

/** Must stay in sync with server/api/labor-invoice-items laborInvoiceLineAggregationKey */
const getLaborInvoiceAggregationKey = (item: any): string => {
  if (item?.labor_co_item_uuid) return `lco:${item.labor_co_item_uuid}`;
  if (item?.labor_po_item_uuid) return `lpo:${item.labor_po_item_uuid}`;
  const costCodeUuid = item?.cost_code_uuid || '';
  const locationUuid = item?.location_uuid || '';
  return locationUuid ? `${costCodeUuid}|${locationUuid}` : costCodeUuid;
};


// Determine PO/CO type from po_co_uuid
const poCoType = computed<'PO' | 'CO' | null>(() => {
  const poCoUuid = props.form.po_co_uuid
  if (!poCoUuid || typeof poCoUuid !== 'string') {
    return null
  }
  
  if (poCoUuid.startsWith('PO:')) {
    return 'PO'
  }
  if (poCoUuid.startsWith('CO:')) {
    return 'CO'
  }
  return null
});

// Scoped cost code configurations for passing to child components (avoids polluting global store)
const scopedCostCodeConfigurations = computed(() => {
  const corpUuid = vendorInvoiceResourceCorpUuid.value;
  const projectUuid = vendorInvoiceResourceProjectUuid.value;
  if (!corpUuid) {
    return [];
  }
  const configs = purchaseOrderResourcesStore.getCostCodeConfigurations(
    corpUuid,
    projectUuid
  );
  return configs;
});

// Scoped item types for passing to child components (avoids polluting global store)
const scopedItemTypes = computed(() => {
  const corpUuid = vendorInvoiceResourceCorpUuid.value;
  const projectUuid = vendorInvoiceResourceProjectUuid.value;
  if (!corpUuid) return [];
  return purchaseOrderResourcesStore.getItemTypes(
    corpUuid,
    projectUuid
  );
});

// Preferred items for direct-invoice line rows (same identity rules as PurchaseOrderForm.preferredItemOptions).
// Option `value` is catalog item_uuid when present, else cost_code_preferred_items row uuid / id so selects can match saved rows.
const preferredItemOptions = computed(() => {
  void directInvoicePreferredItemsRefreshToken.value;
  const corpUuid = vendorInvoiceResourceCorpUuid.value;
  const projectUuid = vendorInvoiceResourceProjectUuid.value;
  if (!corpUuid || !projectUuid) return [];
  const source = purchaseOrderResourcesStore.getPreferredItems(corpUuid, projectUuid) || [];
  return source
    .map((item: any) => {
      const itemUuid =
        item.item_uuid != null && String(item.item_uuid).trim() !== ""
          ? String(item.item_uuid).trim()
          : "";
      const rowUuid =
        item.uuid != null && String(item.uuid).trim() !== "" ? String(item.uuid).trim() : "";
      const legacyId =
        item.id != null && String(item.id).trim() !== "" ? String(item.id).trim() : "";
      const value =
        itemUuid ||
        rowUuid ||
        legacyId ||
        (typeof item.value === "string" && item.value.trim() !== "" ? item.value.trim() : "");
      if (!value) {
        return null;
      }
      const label =
        item.item_name ||
        item.name ||
        item.label ||
        item.description ||
        String(value);
      const itemSequence = item.item_sequence || item.sequence || "";
      const canonicalCatalog = itemUuid || null;
      return {
        label,
        value,
        item_uuid: canonicalCatalog || value,
        item_sequence: itemSequence,
        sequence: itemSequence,
        raw: {
          ...item,
          item_uuid: canonicalCatalog ?? item.item_uuid ?? undefined,
        },
      };
    })
    .filter((opt: any): opt is NonNullable<typeof opt> => opt != null && Boolean(opt.value));
});

const itemTypeDetailsByUuidForLineItems = computed(() => {
  const map = new Map<string, any>();
  for (const it of scopedItemTypes.value || []) {
    const u = String(it?.uuid || it?.value || it?.item_type_uuid || "").trim();
    if (u) map.set(u, it);
  }
  return map;
});

const itemTypeNamesByUuidForLineItems = computed(() => {
  const map = new Map<string, string>();
  for (const it of scopedItemTypes.value || []) {
    const u = String(it?.uuid || it?.value || "").trim();
    const nm = String(it?.item_type || it?.type_label || it?.label || "").trim();
    if (u) map.set(u, nm);
  }
  return map;
});

const preferredItemOptionMapForLineItems = computed(() => {
  const m = new Map<string, any>();
  const put = (key: string, opt: any) => {
    const k = String(key).trim();
    if (!k) return;
    m.set(k, opt);
    m.set(k.toLowerCase(), opt);
  };
  for (const opt of preferredItemOptions.value) {
    put(String(opt.value), opt);
    const rawU = opt.raw?.item_uuid != null ? String(opt.raw.item_uuid).trim() : "";
    if (rawU) put(rawU, opt);
    const rowU = opt.raw?.uuid != null ? String(opt.raw.uuid).trim() : "";
    if (rowU) put(rowU, opt);
  }
  return m;
});

function directLineItemIdCandidates(item: any): string[] {
  const meta = item?.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const ids = [
    item?.item_uuid,
    item?.sequence_uuid,
    meta?.item_uuid,
    item?.display_metadata?.item_uuid,
  ]
    .map((x: any) => (x != null ? String(x).trim() : ""))
    .filter(Boolean);
  return [...new Set(ids)];
}

/** Preferred row matching a direct line (catalog uuid, row uuid, or metadata; case-insensitive). */
function findPreferredOptionForDirectLineItem(item: any): any | null {
  const candidates = directLineItemIdCandidates(item);
  if (candidates.length === 0) return null;
  const lowered = new Set(candidates.map((c) => c.toLowerCase()));
  for (const opt of preferredItemOptions.value) {
    const keys = [
      opt.value,
      opt.raw?.item_uuid,
      opt.raw?.uuid,
      opt.raw?.id,
    ]
      .filter((x) => x != null && String(x).trim() !== "")
      .map((x) => String(x).trim().toLowerCase());
    for (const k of keys) {
      if (lowered.has(k)) return opt;
    }
  }
  return null;
}

/** Catalog / preferred-row id for SequenceSelect / ItemSelect (matches preferred option `value`). */
function getDirectLineCatalogItemUuid(item: any): string {
  const meta = item?.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const a = item?.item_uuid != null ? String(item.item_uuid).trim() : "";
  if (a) return a;
  const metaItem = meta?.item_uuid != null ? String(meta.item_uuid).trim() : "";
  if (metaItem) return metaItem;
  const b = item?.sequence_uuid != null ? String(item.sequence_uuid).trim() : "";
  if (b) return b;
  const rowU = item?.uuid != null ? String(item.uuid).trim() : "";
  if (rowU) return rowU;
  return "";
}

function buildSyntheticPreferredOptionForDirectLine(item: any) {
  const uuid = getDirectLineCatalogItemUuid(item);
  if (!uuid) return null;
  const seq =
    [item.item_sequence, item.sequence]
      .map((s: any) => (s != null ? String(s).trim() : ""))
      .find(Boolean) || "";
  const name = String(item.item_name || "").trim();
  const displaySeq = seq || name || String(uuid).trim();
  const value = String(uuid).trim();
  const label = name || displaySeq;
  const typeUuid =
    item.item_type_uuid != null && String(item.item_type_uuid).trim() !== ""
      ? String(item.item_type_uuid).trim()
      : null;
  return {
    label,
    value,
    item_uuid: value,
    item_sequence: displaySeq,
    sequence: displaySeq,
    raw: {
      item_uuid: value,
      item_name: name,
      name,
      item_sequence: seq || displaySeq,
      sequence: seq || displaySeq,
      item_type_uuid: typeUuid,
      item_type_label: item.item_type_label,
      item_category_label: item.item_category_label,
      project_uuid: props.form.project_uuid || undefined,
      status: "Active",
    },
  };
}

/** Preferred-item options for a line after cost code + item type filters (no synthetic row). */
function getDirectLineFilteredPreferredOptionList(item: any): any[] {
  const base = [...preferredItemOptions.value];
  const cc = item.cost_code_uuid;
  let list = base;
  if (cc) {
    const forCc = base.filter((opt) => {
      const r = opt.raw || {};
      const occ = r.cost_code_configuration_uuid ?? r.cost_code_uuid;
      return occ != null && String(occ) === String(cc);
    });
    if (forCc.length > 0) list = forCc;
  }

  if (item.item_type_uuid) {
    const filtered = list.filter((opt) => {
      const optionItemTypeUuid = opt.raw?.item_type_uuid;
      return (
        optionItemTypeUuid != null &&
        String(optionItemTypeUuid) === String(item.item_type_uuid)
      );
    });
    if (filtered.length > 0) {
      list = filtered;
    }
  }
  return list;
}

function getDirectLineItemSelectOptions(item: any) {
  let list = getDirectLineFilteredPreferredOptionList(item);

  const uid = getDirectLineCatalogItemUuid(item);
  if (!uid) return list;
  const lower = uid.toLowerCase();
  const inList = list.some((o) => {
    const v = o.value != null ? String(o.value).trim().toLowerCase() : "";
    const ru = o.raw?.item_uuid != null ? String(o.raw.item_uuid).trim().toLowerCase() : "";
    const rz = o.raw?.uuid != null ? String(o.raw.uuid).trim().toLowerCase() : "";
    return v === lower || ru === lower || rz === lower;
  });
  if (inList) return list;
  const syn = buildSyntheticPreferredOptionForDirectLine(item);
  return syn ? [...list, syn] : list;
}

/** ItemCategorySelect only accepts procurement | construction. */
function normalizeCategoryForItemCategorySelect(
  ...sources: (string | null | undefined)[]
): string {
  for (const s of sources) {
    const t = String(s ?? "").trim().toLowerCase();
    if (t === "procurement" || t === "construction") return t;
  }
  return "";
}

function costCodeDisplayForLineItem(costCodeUuid: string | null | undefined) {
  if (!costCodeUuid) {
    return { cost_code_number: "", cost_code_name: "", cost_code_label: null as string | null };
  }
  const c = (scopedCostCodeConfigurations.value || []).find(
    (x: any) => String(x?.uuid || x?.cost_code_configuration_uuid || "") === String(costCodeUuid)
  );
  const num = c?.cost_code_number != null ? String(c.cost_code_number) : "";
  const name = c?.cost_code_name != null ? String(c.cost_code_name) : "";
  const label =
    [num, name]
      .filter((segment: string) => String(segment || "").trim().length > 0)
      .join(" ")
      .trim() || null;
  return { cost_code_number: num, cost_code_name: name, cost_code_label: label };
}

function mapDirectLineItemToMasterTableRow(item: any, index: number) {
  const pm = preferredItemOptionMapForLineItems.value;
  const prefOpt = findPreferredOptionForDirectLineItem(item);
  const lineCatalogOrRowId = getDirectLineCatalogItemUuid(item);
  const displaySelectUuid =
    prefOpt?.value != null && String(prefOpt.value).trim() !== ""
      ? String(prefOpt.value).trim()
      : lineCatalogOrRowId || "";
  const displayMeta = item.display_metadata || item.metadata || {};
  let sequenceValue =
    displayMeta.sequence || item.item_sequence || item.sequence || "";
  if (!sequenceValue && displaySelectUuid) {
    const matched = prefOpt || pm.get(displaySelectUuid) || pm.get(displaySelectUuid.toLowerCase());
    if (matched?.item_sequence) sequenceValue = matched.item_sequence;
    else if (matched?.sequence) sequenceValue = matched.sequence;
    else if (matched?.raw?.item_sequence) sequenceValue = matched.raw.item_sequence;
  }
  const preferredRaw = prefOpt?.raw ?? null;
  const resolvedItemTypeUuid =
    item.item_type_uuid || displayMeta.item_type_uuid || preferredRaw?.item_type_uuid || null;
  const itemTypeObj = resolvedItemTypeUuid
    ? itemTypeDetailsByUuidForLineItems.value.get(String(resolvedItemTypeUuid))
    : null;
  const category = normalizeCategoryForItemCategorySelect(
    item.category,
    displayMeta.category,
    preferredRaw?.category,
    itemTypeObj?.category,
    item.item_category_label,
    preferredRaw?.item_category_label
  );
  const itemDivisionUuid =
    item.item_division_uuid ||
    displayMeta.item_division_uuid ||
    preferredRaw?.item_division_uuid ||
    itemTypeObj?.item_division_uuid ||
    null;
  const divisionName =
    item.division_name ||
    displayMeta.division_name ||
    preferredRaw?.division_name ||
    itemTypeObj?.division_name ||
    itemTypeObj?.divisions?.division_name ||
    "";
  const ccDisp = costCodeDisplayForLineItem(item.cost_code_uuid);
  const cost_code_number = item.cost_code_number ?? ccDisp.cost_code_number;
  const cost_code_name = item.cost_code_name ?? ccDisp.cost_code_name;
  const cost_code_label =
    item.cost_code_label ||
    ccDisp.cost_code_label ||
    [cost_code_number, cost_code_name].filter(Boolean).join(" ").trim() ||
    null;
  const itemTypeLabel =
    item.item_type_label ||
    (resolvedItemTypeUuid
      ? itemTypeNamesByUuidForLineItems.value.get(String(resolvedItemTypeUuid)) || ""
      : "");
  const unitLabel =
    displayMeta.unit_label ||
    item.uom ||
    item.unit_label ||
    item.unit ||
    preferredRaw?.unit_label ||
    preferredRaw?.unit ||
    "";
  const qty = item.quantity ?? null;
  const unitPrice = item.unit_price ?? null;
  const lineTotal = item.total ?? null;

  const resolvedRowName =
    String(item.item_name || "").trim() ||
    String(item.name || "").trim() ||
    String(displayMeta.item_name || "").trim() ||
    String(prefOpt?.label || "").trim() ||
    String(prefOpt?.raw?.item_name || prefOpt?.raw?.name || "").trim() ||
    "";

  let options = getDirectLineItemSelectOptions({
    ...item,
    item_type_uuid: resolvedItemTypeUuid ?? item.item_type_uuid,
  });

  // PurchaseOrderForm.mapPoItemForDisplay: if the resolved select value is missing from the filtered option list
  // (e.g. cost-code slice), SequenceSelect clears the model — keep a synthetic row so spec/item never blanks.
  const selectKey = (displaySelectUuid || "").trim();
  if (selectKey) {
    const hasKey = options.some(
      (o) => String(o.value || "").trim().toLowerCase() === selectKey.toLowerCase()
    );
    if (!hasKey) {
      const syn = buildSyntheticPreferredOptionForDirectLine({
        ...item,
        item_uuid: selectKey,
        sequence_uuid: selectKey,
        item_name: resolvedRowName || item.item_name,
        item_sequence: sequenceValue || item.item_sequence,
        sequence: sequenceValue || item.sequence,
        item_type_uuid: resolvedItemTypeUuid ?? item.item_type_uuid,
      });
      if (syn) {
        options = [...options, syn];
      }
    }
  }

  return {
    id: item.id ?? `direct-line-${index}`,
    cost_code_uuid: item.cost_code_uuid || null,
    cost_code_label,
    cost_code_number,
    cost_code_name,
    item_type_uuid: resolvedItemTypeUuid,
    item_type_label: itemTypeLabel,
    category,
    item_division_uuid: itemDivisionUuid,
    division_name: divisionName,
    sequence: sequenceValue,
    item_sequence: sequenceValue,
    item_uuid: displaySelectUuid || null,
    name: resolvedRowName,
    description: item.description || "",
    model_number: item.model_number || "",
    unit_uuid: item.unit_uuid || null,
    unit_label: unitLabel,
    uom: unitLabel,
    po_unit_price: unitPrice,
    po_quantity: qty,
    po_total: lineTotal,
    location_uuid: item.location_uuid || displayMeta.location_uuid || null,
    location:
      item.location ||
      item.location_label ||
      displayMeta.location ||
      displayMeta.location_label ||
      "",
    approval_checks: [],
    options,
  };
}

// Advance payment cost codes
const advancePaymentCostCodes = computed(() => {
  return Array.isArray(props.form.advance_payment_cost_codes) 
    ? props.form.advance_payment_cost_codes 
    : []
});

// Removed advance payment cost codes (for persistence)
const removedAdvancePaymentCostCodes = computed(() => {
  return Array.isArray(props.form.removed_advance_payment_cost_codes) 
    ? props.form.removed_advance_payment_cost_codes 
    : []
});

// Holdback cost codes (for Against Holdback Amount invoice type)
const holdbackCostCodes = computed(() => {
  return Array.isArray(props.form.holdback_cost_codes) 
    ? props.form.holdback_cost_codes 
    : []
});

/** Release amounts aggregated by GL for Configure COA and Nimble item_breakdown_by_account. */
const holdbackItemBreakdownByAccount = computed(() => {
  const rows = holdbackCostCodes.value;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const map = new Map<string, number>();
  for (const row of rows) {
    const gl = row.gl_account_uuid;
    if (!gl || typeof gl !== 'string' || !gl.trim()) continue;
    const key = gl.trim();
    const raw =
      row.releaseAmount != null && row.releaseAmount !== ''
        ? row.releaseAmount
        : row.release_amount;
    const rel = parseFloat(String(raw ?? 0)) || 0;
    if (!Number.isFinite(rel)) continue;
    map.set(key, (map.get(key) ?? 0) + rel);
  }
  return [...map.entries()].map(([accountUuid, total]) => ({ accountUuid, total }));
});

// Total release amount from holdback breakdown table
const holdbackReleaseAmountTotal = ref(0);

// When editing an existing holdback invoice, hydrate the release total from saved financial_breakdown
// or persisted holdback rows so FinancialBreakdown and totals show immediately (table emit may lag or miss snake_case).
watch(
  () => ({
    uuid: props.form.uuid,
    editing: props.editingInvoice,
    invoiceType: props.form.invoice_type,
    financial_breakdown: props.form.financial_breakdown,
    holdback_cost_codes: props.form.holdback_cost_codes,
  }),
  () => {
    if (!props.editingInvoice || !props.form?.uuid) return;
    if (String(props.form.invoice_type || '').toUpperCase() !== 'AGAINST_HOLDBACK_AMOUNT') return;

    const fb = props.form.financial_breakdown;
    if (fb && typeof fb === 'object' && fb.totals && typeof fb.totals === 'object') {
      const raw = (fb.totals as Record<string, unknown>).item_total;
      if (raw !== null && raw !== undefined && raw !== '') {
        const n = parseFloat(String(raw));
        if (Number.isFinite(n) && n >= 0) {
          holdbackReleaseAmountTotal.value = Math.round(n * 100) / 100;
          return;
        }
      }
    }

    const rows = Array.isArray(props.form.holdback_cost_codes) ? props.form.holdback_cost_codes : [];
    let sum = 0;
    for (const r of rows) {
      const row = r as Record<string, unknown>;
      const raw = row.releaseAmount ?? row.release_amount;
      sum += parseFloat(String(raw ?? 0)) || 0;
    }
    holdbackReleaseAmountTotal.value = Math.round(sum * 100) / 100;
  },
  { immediate: true, deep: true }
);

// Computed property to check if all available holdback amounts are zero
// This checks if all cost codes have zero available amount (retainage - previously released)
const allHoldbackAmountsZero = computed(() => {
  // Only check for new holdback invoices (not when editing)
  if (!isAgainstHoldback.value || props.form.uuid || !props.form.holdback_invoice_uuid) {
    return false;
  }

  // If we don't have holdback cost codes yet, wait
  if (!holdbackCostCodes.value || holdbackCostCodes.value.length === 0) {
    return false;
  }

  // If still loading, don't show error yet
  if (loadingHoldbackData.value) {
    return false;
  }

  // Check if user has entered any release amounts
  // If they have, keep the table visible even if all available amounts become zero
  let hasEnteredReleaseAmounts = false;
  for (const costCode of holdbackCostCodes.value) {
    const releaseAmount = parseFloat(String(costCode.releaseAmount || costCode.release_amount || 0)) || 0;
    if (releaseAmount > 0) {
      hasEnteredReleaseAmounts = true;
      break;
    }
  }

  // If user has entered release amounts, don't hide the table
  // This allows them to see and modify their entries even if all available amounts become zero
  if (hasEnteredReleaseAmounts) {
    return false;
  }

  // Check each cost code to see if all have zero available amount
  let allZero = true;
  let hasAtLeastOneCostCode = false;

  for (const costCode of holdbackCostCodes.value) {
    const costCodeUuid = costCode.cost_code_uuid;
    const retainageAmount = parseFloat(String(costCode.retainageAmount || costCode.retainage_amount || 0)) || 0;

    // Skip if no cost code selected or no retainage amount
    if (!costCodeUuid || retainageAmount <= 0) {
      continue;
    }

    hasAtLeastOneCostCode = true;

    // Calculate previously released amount for this cost code
    let previouslyReleased = 0;
    if (previouslyReleasedCostCodes.value && previouslyReleasedCostCodes.value.length > 0) {
      const matchingReleases = previouslyReleasedCostCodes.value.filter(
        (cc: PreviouslyReleasedCostCode) => cc.cost_code_uuid === costCodeUuid
      );
      previouslyReleased = matchingReleases.reduce(
        (sum: number, cc: PreviouslyReleasedCostCode) => sum + (parseFloat(String(cc.release_amount)) || 0),
        0
      );
    }

    // Calculate available amount
    const availableAmount = Math.max(0, retainageAmount - previouslyReleased);

    // If any cost code has available amount > 0, not all are zero
    if (availableAmount > 0) {
      allZero = false;
      break;
    }
  }

  // Only return true if we have at least one cost code with retainage and all have zero available
  return hasAtLeastOneCostCode && allZero;
});

// Computed property for the holdback validation error message
const holdbackValidationError = computed(() => {
  // For holdback invoices, don't show the "all amounts zero" error
  // Allow creating holdback invoices even when all amounts have been released
  if (isAgainstHoldback.value) {
    return null;
  }

  if (!allHoldbackAmountsZero.value) {
    return null;
  }

  const poNumber = props.form.po_number;
  const coNumber = props.form.co_number;

  if (poNumber) {
    return `The holdback invoices for the total holdback amount of the purchase order ${poNumber} are already raised.`;
  } else if (coNumber) {
    return `The holdback invoices for the total holdback amount of the change order ${coNumber} are already raised.`;
  } else {
    return `The holdback invoices for the total holdback amount of the specific purchase order or change order are already raised.`;
  }
});

const toPlainYmd = (value: string | null | undefined): string => {
  if (!value) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || raw;
};

// Debug: Watch form values for holdback invoice
watch(
  [() => props.form.po_number, () => props.form.co_number, () => props.form.po_co_uuid, () => props.form.holdback_invoice_uuid],
  ([newPoNumber, newCoNumber, newPoCoUuid, newHoldbackInvoiceUuid], [oldPoNumber, oldCoNumber, oldPoCoUuid, oldHoldbackInvoiceUuid]) => {
    if (isAgainstHoldback.value) {
    }
  },
  { immediate: true }
);

// Computed property to determine if subsequent fields should be disabled
const areSubsequentFieldsDisabled = computed(() => {
  return !isInvoiceTypeSelected.value || props.readonly;
});

// Date computed properties
const billDateValue = computed({
  get: () => {
    if (!props.form.bill_date) return null;
    const plainYmd = toPlainYmd(props.form.bill_date);
    const parts = plainYmd.split('-');
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
      // Keep plain YYYY-MM-DD from the form calendar; server handles persistence format.
      handleFormUpdate('bill_date', dateString);
    } else {
      handleFormUpdate('bill_date', null);
    }
  }
});

const dueDateValue = computed({
  get: () => {
    if (!props.form.due_date) return null;
    const plainYmd = toPlainYmd(props.form.due_date);
    const parts = plainYmd.split('-');
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
      // Keep plain YYYY-MM-DD from the form calendar; server handles persistence format.
      handleFormUpdate('due_date', dateString);
    } else {
      handleFormUpdate('due_date', null);
    }
  }
});

// Display text for dates
const billDateDisplayText = computed(() => {
  if (!billDateValue.value) return 'Select bill date';
  return df.format(billDateValue.value.toDate(getLocalTimeZone()));
});

const dueDateDisplayText = computed(() => {
  if (!dueDateValue.value) return 'Select due date';
  return df.format(dueDateValue.value.toDate(getLocalTimeZone()));
});


// Invoice type option
const invoiceTypeOption = computed<any>({
  get: () => {
    const v = props.form.invoice_type
    if (!v) return undefined
    const target = String(v).toUpperCase()
    return invoiceTypeOptions.find(opt => String(opt.value).toUpperCase() === target)
  },
  set: (val) => {
    const value = typeof val === 'string' ? val : (val?.value || '')
    handleFormUpdate('invoice_type', value)
  }
});

// Credit days + optional Nimble row id (shared CreditDaysSelect)
const creditDaysModel = computed({
  get() {
    return {
      credit_days: props.form.credit_days ?? null,
      credit_days_id: props.form.credit_days_id ?? null,
    };
  },
  set(v: { credit_days: string | null; credit_days_id: string | null }) {
    const updatedForm = { ...props.form };
    updatedForm.credit_days = v.credit_days;
    updatedForm.credit_days_id = v.credit_days_id;
    emit('update:form', updatedForm);
  },
});

// Amount input value
const amountInputValue = computed(() => {
  const amount = props.form.amount
  if (amount === null || amount === undefined || amount === '') return ''
  return String(amount)
});

// Holdback input value (non-negative whole number %)
const holdbackInputValue = computed(() => {
  const holdback = props.form.holdback
  if (holdback === null || holdback === undefined || holdback === '') return ''
  const n = Number(holdback)
  if (!Number.isFinite(n)) return ''
  return String(Math.round(Math.max(0, n)))
});

function onHoldbackInputKeydown(e: KeyboardEvent) {
  const k = e.key
  if (k === '-' || k === '+' || k === 'e' || k === 'E' || k === '.') {
    e.preventDefault()
  }
}

// Line items for direct invoice
const lineItems = computed(() => {
  return Array.isArray(props.form.line_items) ? props.form.line_items : [];
});

const directLineItemsForMasterDisplay = computed(() =>
  (lineItems.value || []).map((item: any, index: number) => mapDirectLineItemToMasterTableRow(item, index))
);

const directLineMasterModalPreselected = computed(() =>
  (lineItems.value || [])
    .filter((li: any) => Boolean(getDirectLineCatalogItemUuid(li)))
    .map((li: any) => {
      const id = getDirectLineCatalogItemUuid(li);
      return { item_uuid: id, id, uuid: id };
    })
);

// Watch line_items to ensure reactivity (same pattern as PurchaseOrderForm)
watch(
  () => props.form.line_items,
  (newItems, oldItems) => {
    if (newItems !== oldItems) {
      if (Array.isArray(newItems)) {
        // Force lineItemsTotal to recalculate by accessing it
        // This ensures the FinancialBreakdown component's watcher fires
        const _ = lineItemsTotal.value
      }
    }
  },
  { deep: true }
)

// Watch for po_invoice_items to become available and re-map PO items if needed
// This fixes the race condition where items are loaded before invoice items are available
watch(
  () => props.form.po_invoice_items,
  async (newInvoiceItems, oldInvoiceItems) => {
    // Only re-map if:
    // 1. This is an existing invoice (has uuid)
    // 2. We have PO items already loaded
    // 3. Invoice items just became available (were undefined/null before, now defined)
    // 4. We're in Against PO mode
    // 5. We have a purchase order UUID
    const wasUndefined = !oldInvoiceItems || (Array.isArray(oldInvoiceItems) && oldInvoiceItems.length === 0);
    const isNowDefined = Array.isArray(newInvoiceItems);
    
    if (
      props.form.uuid &&
      isAgainstPO.value &&
      props.form.purchase_order_uuid &&
      poItems.value.length > 0 &&
      wasUndefined &&
      isNowDefined
    ) {
      // Re-fetch PO items to re-map with saved invoice values
      await fetchPOItems(props.form.purchase_order_uuid);
    }
  },
  { immediate: false }
)

// Watch for co_invoice_items to become available and re-map CO items if needed
// This fixes the race condition where items are loaded before invoice items are available
watch(
  () => props.form.co_invoice_items,
  async (newInvoiceItems, oldInvoiceItems) => {
    // Only re-map if:
    // 1. This is an existing invoice (has uuid)
    // 2. We have CO items already loaded
    // 3. Invoice items just became available (were undefined/null before, now defined)
    // 4. We're in Against CO mode
    // 5. We have a change order UUID
    const wasUndefined = !oldInvoiceItems || (Array.isArray(oldInvoiceItems) && oldInvoiceItems.length === 0);
    const isNowDefined = Array.isArray(newInvoiceItems);
    
    if (
      props.form.uuid &&
      isAgainstCO.value &&
      props.form.change_order_uuid &&
      coItems.value.length > 0 &&
      wasUndefined &&
      isNowDefined
    ) {
      // Re-fetch CO items to re-map with saved invoice values
      await fetchCOItems(props.form.change_order_uuid);
    }
  },
  { immediate: false }
)

// File upload functionality
const uploadedFiles = ref<File[]>([]);
const fileUploadError = ref<string | null>(null);
const isUploading = ref(false);
const dueDatePopoverOpen = ref(false);

// File preview functionality
const showFilePreviewModal = ref(false);
const selectedFileForPreview = ref<any>(null);

// Holdback invoice selection modal
const showHoldbackModal = ref(false);

/** Master preferred-items import (same modal as PO item master). */
const showMasterDirectLineModal = ref(false);
const masterDirectLineModalItems = ref<any[]>([]);
const masterDirectLineModalLoading = ref(false);
const masterDirectLineModalError = ref<string | null>(null);
const isEditingMasterDirectLineSelection = ref(false);

/** True while POCO modal handlers are applying PO/CO selection — skips duplicate PO/CO sync watchers */
const isUpdatingFromPOCOSelect = ref(false);

// PO items state (for Against PO invoice type)
const poItems = ref<any[]>([]);
const poItemsLoading = ref(false);
const poItemsError = ref<string | null>(null);
const poItemsKey = ref(0); // Key to force re-render of POItemsTableWithEstimates
const poAdvancePaid = ref<number>(0); // Total advance payments made for the selected PO
const poAdvancePaymentBreakdownRef = ref<InstanceType<typeof AdvancePaymentBreakdownTable> | null>(null);
const advancePaymentCostCodesTableRef = ref<InstanceType<typeof AdvancePaymentCostCodesTable> | null>(null);
const holdbackBreakdownTableRef = ref<InstanceType<typeof HoldbackBreakdownTable> | null>(null);
const laborInvoiceItemsTableRef = ref<InstanceType<typeof LaborInvoiceItemsTable> | null>(null);

// PO location-wise material items state
const poLwmItems = ref<any[]>([]);
const poLwmItemsLoading = ref(false);
const isUpdatingPoLwmInvoiceItems = ref(false);
const hasPoLwmItems = computed(() => Array.isArray(poLwmItems.value) && poLwmItems.value.length > 0);

// CO items state (for Against CO invoice type)
const coItems = ref<any[]>([]);
const coItemsLoading = ref(false);
const coItemsError = ref<string | null>(null);
const coItemsKey = ref(0);
const isUpdatingCOInvoiceItems = ref(false);
const coAdvancePaid = ref<number>(0);

// CO location-wise material items state
const coLwmItems = ref<any[]>([]);
const coLwmItemsLoading = ref(false);
const isUpdatingCoLwmInvoiceItems = ref(false);
const hasCoLwmItems = computed(() => Array.isArray(coLwmItems.value) && coLwmItems.value.length > 0);
const coAdvancePaymentBreakdownRef = ref<InstanceType<typeof AdvancePaymentBreakdownTable> | null>(null);

// When loading a saved invoice, fetchPOItems may complete before or after the parent sets
// uuid + po_lwm_invoice_items on the form (race condition). These helpers patch the already-loaded
// poLwmItems/coLwmItems with saved invoice_amount values from the form, regardless of timing.
const restorePoLwmInvoiceAmounts = (_caller: string) => {
  if (!props.form.uuid) return;
  const savedItems = props.form.po_lwm_invoice_items;
  if (!Array.isArray(savedItems) || savedItems.length === 0) return;
  if (poLwmItems.value.length === 0) return;

  // Build lookup by po_lwm_uuid + fallback by cost_code|location for legacy records with null po_lwm_uuid
  const savedByUuid = new Map<string, number>();
  const savedByKey = new Map<string, number>();
  savedItems.forEach((si: any) => {
    const amount = si.invoice_amount != null ? (parseFloat(String(si.invoice_amount)) || 0) : 0;
    if (si.po_lwm_uuid) {
      savedByUuid.set(si.po_lwm_uuid, amount);
    } else {
      const key = `${si.cost_code_uuid || ''}|${si.location_uuid || ''}`;
      savedByKey.set(key, amount);
    }
  });
  if (savedByUuid.size === 0 && savedByKey.size === 0) return;

  const hasUnrestoredAmounts = poLwmItems.value.some((item: any) => {
    if (item.invoice_amount !== null && item.invoice_amount !== 0) return false;
    if (item.po_lwm_uuid && savedByUuid.has(item.po_lwm_uuid)) return true;
    const key = `${item.cost_code_uuid || ''}|${item.location_uuid || ''}`;
    return savedByKey.has(key);
  });
  if (!hasUnrestoredAmounts) return;

  const patched = poLwmItems.value.map((item: any) => {
    if (item.invoice_amount !== null && item.invoice_amount !== 0) return item;
    let savedAmount = item.po_lwm_uuid ? savedByUuid.get(item.po_lwm_uuid) : undefined;
    if (savedAmount === undefined) {
      const key = `${item.cost_code_uuid || ''}|${item.location_uuid || ''}`;
      savedAmount = savedByKey.get(key);
    }
    if (savedAmount !== undefined && savedAmount !== 0) {
      return { ...item, invoice_amount: savedAmount };
    }
    return item;
  });

  isUpdatingPoLwmInvoiceItems.value = true;
  poLwmItems.value = patched;
  nextTick(() => { isUpdatingPoLwmInvoiceItems.value = false; });
};

const restoreCoLwmInvoiceAmounts = (_caller: string) => {
  if (!props.form.uuid) return;
  const savedItems = props.form.co_lwm_invoice_items;
  if (!Array.isArray(savedItems) || savedItems.length === 0) return;
  if (coLwmItems.value.length === 0) return;

  const savedByUuid = new Map<string, number>();
  const savedByKey = new Map<string, number>();
  savedItems.forEach((si: any) => {
    const amount = si.invoice_amount != null ? (parseFloat(String(si.invoice_amount)) || 0) : 0;
    if (si.co_lwm_uuid) {
      savedByUuid.set(si.co_lwm_uuid, amount);
    } else {
      const key = `${si.cost_code_uuid || ''}|${si.location_uuid || ''}`;
      savedByKey.set(key, amount);
    }
  });
  if (savedByUuid.size === 0 && savedByKey.size === 0) return;

  const hasUnrestoredAmounts = coLwmItems.value.some((item: any) => {
    if (item.invoice_amount !== null && item.invoice_amount !== 0) return false;
    if (item.co_lwm_uuid && savedByUuid.has(item.co_lwm_uuid)) return true;
    const key = `${item.cost_code_uuid || ''}|${item.location_uuid || ''}`;
    return savedByKey.has(key);
  });
  if (!hasUnrestoredAmounts) return;

  const patched = coLwmItems.value.map((item: any) => {
    if (item.invoice_amount !== null && item.invoice_amount !== 0) return item;
    let savedAmount = item.co_lwm_uuid ? savedByUuid.get(item.co_lwm_uuid) : undefined;
    if (savedAmount === undefined) {
      const key = `${item.cost_code_uuid || ''}|${item.location_uuid || ''}`;
      savedAmount = savedByKey.get(key);
    }
    if (savedAmount !== undefined && savedAmount !== 0) {
      return { ...item, invoice_amount: savedAmount };
    }
    return item;
  });

  isUpdatingCoLwmInvoiceItems.value = true;
  coLwmItems.value = patched;
  nextTick(() => { isUpdatingCoLwmInvoiceItems.value = false; });
};

// Case A: Saved data arrives on form AFTER fetchPOItems already populated poLwmItems
watch(
  () => [props.form.uuid, props.form.po_lwm_invoice_items] as const,
  () => { restorePoLwmInvoiceAmounts('Watch CaseA PO'); },
  { immediate: false }
)

// Case B: fetchPOItems completes AFTER parent already set saved data on form
watch(
  () => poLwmItems.value.length,
  (newLen, oldLen) => {
    if (newLen > 0 && oldLen === 0) restorePoLwmInvoiceAmounts('Watch CaseB PO');
  }
)

// Same for CO
watch(
  () => [props.form.uuid, props.form.co_lwm_invoice_items] as const,
  () => { restoreCoLwmInvoiceAmounts('Watch CaseA CO'); },
  { immediate: false }
)

watch(
  () => coLwmItems.value.length,
  (newLen, oldLen) => {
    if (newLen > 0 && oldLen === 0) restoreCoLwmInvoiceAmounts('Watch CaseB CO');
  }
)

// Item total breakdown by preferred chart of account (for Configure COA modal)
const poItemBreakdownByAccount = ref<{ accountUuid: string; total: number }[]>([]);
const coItemBreakdownByAccount = ref<{ accountUuid: string; total: number }[]>([]);
/** Enter Direct Invoice: line_items totals by GL from cost code → gl_account_uuid (same pattern as PO/CO). */
const directInvoiceItemBreakdownByAccount = ref<{ accountUuid: string; total: number }[]>([]);
/** Labor PO / Labor CO: item totals by GL from cost code config (same source as material breakdown). */
const laborInvoiceItemsBreakdownByAccount = ref<{ accountUuid: string; total: number }[]>([]);

// Labor invoice items state (for labor POs/COs)
const laborInvoiceItems = ref<any[]>([]);
const laborInvoiceItemsLoading = ref(false);
const laborInvoiceItemsError = ref<string | null>(null);

// PO/CO type tracking
const poType = ref<string | null>(null);
const coType = ref<string | null>(null);

// Flag to prevent circular updates between laborInvoiceItems and form updates
const isUpdatingLaborInvoiceItems = ref(false);

/** Deduplicate concurrent identical `/api/cost-code-configurations?uuids=…` calls (many code paths request the same set). */
const fetchCostCodeDetailsInflight = new Map<string, Promise<Record<string, any>>>();

// Fetch cost code details for labor invoice items
const fetchCostCodeDetails = async (costCodeUuids: string[]): Promise<Record<string, any>> => {
  const realUuids = costCodeUuids.filter((id) => id && !isTaxAdjustmentKey(id));
  if (realUuids.length === 0) return {};

  const corp = String(props.form.corporation_uuid || "");
  const dedupeKey = `${corp}::${[...new Set(realUuids)].sort().join("|")}`;
  const existing = fetchCostCodeDetailsInflight.get(dedupeKey);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<Record<string, any>> => {
    try {
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/cost-code-configurations', {
        query: {
          corporation_uuid: props.form.corporation_uuid,
          uuids: realUuids
        }
      });

      if (response.success && Array.isArray(response.data)) {
        return response.data.reduce((acc, costCode) => {
          acc[costCode.uuid] = costCode;
          return acc;
        }, {} as Record<string, any>);
      }
    } catch (error) {
      console.warn('[VendorInvoiceForm] Failed to fetch cost code details:', error);
    }
    return {};
  })();

  fetchCostCodeDetailsInflight.set(dedupeKey, promise);
  try {
    return await promise;
  } finally {
    fetchCostCodeDetailsInflight.delete(dedupeKey);
  }
};

onBeforeUnmount(() => {
  fetchCostCodeDetailsInflight.clear();
});

// Watch for labor_invoice_items to become available and populate laborInvoiceItems
// This handles displaying saved labor invoice items for existing invoices
watch(
  () => props.form.labor_invoice_items,
  async (newLaborInvoiceItems, oldLaborInvoiceItems) => {
    // Skip if we're currently updating from the UI to prevent circular updates
    if (isUpdatingLaborInvoiceItems.value) {
      return;
    }

    // Skip if fetchLaborInvoiceItems is currently in progress — let it finish
    if (laborInvoiceItemsLoading.value) {
      return;
    }

    // Skip if laborInvoiceItems already has properly computed amounts
    // (i.e., fetchLaborInvoiceItems has already run and populated the data).
    // Overwriting here would lose original_amount / already_invoiced / remaining_amount.
    if (
      laborInvoiceItems.value.length > 0 &&
      laborInvoiceItems.value.some((item: any) => item.remaining_amount !== undefined && item.remaining_amount !== null)
    ) {
      return;
    }

    // Populate laborInvoiceItems when data becomes available
    const isNowDefined = Array.isArray(newLaborInvoiceItems) && newLaborInvoiceItems.length > 0;

    if (isNowDefined) {
      // For existing invoices with a PO or CO, call fetchLaborInvoiceItems to get items
      // enriched with original_amount, already_invoiced, and remaining_amount
      const entityUuid = props.form.change_order_uuid || props.form.purchase_order_uuid;
      if (props.form.uuid && entityUuid) {
        const entityType: 'purchase_order' | 'change_order' = props.form.change_order_uuid ? 'change_order' : 'purchase_order';
        // Defer until after setup: fetchLaborInvoiceItems is declared later in this file; immediate watch
        // runs during setup and would hit TDZ if we called it synchronously here.
        const uid = entityUuid;
        queueMicrotask(() => {
          void fetchLaborInvoiceItems(uid, entityType);
        });
        return;
      }

      // Fallback for new invoices or when entity UUID isn't available yet:
      // enrich with fresh cost code display info only
      const costCodeUuids = [...new Set(newLaborInvoiceItems.map((item: any) => item.cost_code_uuid).filter(Boolean))];
      const costCodeDetails = await fetchCostCodeDetails(costCodeUuids);

      const enrichedItems = newLaborInvoiceItems.map((item: any) => {
        const costCode = item.cost_code_uuid ? costCodeDetails[item.cost_code_uuid] : null;

        return {
          ...item,
          cost_code_label: costCode ? `${costCode.cost_code_number || ''} - ${costCode.cost_code_name || ''}`.trim() : item.cost_code_label,
          cost_code_number: costCode ? costCode.cost_code_number : item.cost_code_number,
          cost_code_name: costCode ? costCode.cost_code_name : item.cost_code_name,
          division_name: costCode ? costCode.division_name : item.division_name,
        };
      });

      laborInvoiceItems.value = enrichedItems;
      laborInvoiceItemsError.value = null;
    } else if (!newLaborInvoiceItems || (Array.isArray(newLaborInvoiceItems) && newLaborInvoiceItems.length === 0)) {
      // Clear labor invoice items if no data
      laborInvoiceItems.value = [];
      laborInvoiceItemsError.value = null;
    }
  },
  { immediate: true }
)

// Adjusted advance payment amounts (keyed by advancePaymentUuid -> costCodeUuid -> adjustedAmount)
const adjustedAdvancePaymentAmounts = ref<Record<string, Record<string, number>>>({});

/** Per GL advance $ (aligned with PO/CO item breakdown rows) for Configure COA math */
const advanceAmountsByBreakdownRow = ref<number[]>([]);

// Previously adjusted cost codes from the database (for display in the table)
interface PreviouslyAdjustedCostCode {
  cost_code_uuid: string;
  cost_code_label?: string;
  cost_code_number?: string;
  cost_code_name?: string;
  adjusted_amount: number;
  advance_payment_uuid: string;
}
const previouslyAdjustedCostCodes = ref<PreviouslyAdjustedCostCode[]>([]);

/** Amounts from this advance payment already adjusted on other PO/CO vendor invoices (edit floor). */
const consumedAdvanceAmountsByKey = ref<Record<string, number>>({});

interface PreviouslyReleasedCostCode {
  cost_code_uuid: string;
  cost_code_label?: string;
  cost_code_number?: string;
  cost_code_name?: string;
  release_amount: number;
  holdback_invoice_uuid: string;
  vendor_invoice_uuid: string;
}
const previouslyReleasedCostCodes = ref<PreviouslyReleasedCostCode[]>([]);

// Loading state for holdback data (table and financial breakdown)
const loadingHoldbackData = ref(false);

// Guard to prevent watcher from overwriting user input
const isUpdatingAdjustedAmounts = ref(false);

// Fetch adjusted_advance_payment_cost_codes for this PO/CO, excluding the current vendor invoice when
// `excludeInvoiceUuid` is set. Remaining amounts and "/ after" comparisons must not subtract this invoice's
// adjustments twice (once in "previously adjusted" and again as the current input).
const fetchAllPreviouslyAdjustedCostCodes = async (poOrCoUuid: string, isCO = false, excludeInvoiceUuid?: string) => {
  if (!poOrCoUuid) {
    previouslyAdjustedCostCodes.value = [];
    return;
  }

  try {
    const queryParams: Record<string, string> = {};
    
    if (isCO) {
      queryParams.change_order_uuid = poOrCoUuid;
    } else {
      queryParams.purchase_order_uuid = poOrCoUuid;
    }

    // Exclude current invoice if editing
    if (excludeInvoiceUuid) {
      queryParams.exclude_current_invoice = 'true';
      queryParams.vendor_invoice_uuid = excludeInvoiceUuid;
    }

    const response = await $fetch<{ data: any[] }>('/api/adjusted-advance-payment-cost-codes', {
      query: queryParams,
    });

    const costCodes = Array.isArray(response?.data) ? response.data : [];
    previouslyAdjustedCostCodes.value = costCodes.map((cc: any) => ({
      cost_code_uuid:
        cc.cost_code_uuid ||
        (cc.metadata?.tax_line_key ? taxAdjustmentKey(String(cc.metadata.tax_line_key)) : ''),
      cost_code_label: cc.cost_code_label,
      cost_code_number: cc.cost_code_number,
      cost_code_name: cc.cost_code_name,
      adjusted_amount: parseFloat(String(cc.adjusted_amount)) || 0,
      advance_payment_uuid: cc.advance_payment_uuid,
    }));

  } catch (err: any) {
    console.error('[VendorInvoiceForm] Error fetching all previously adjusted cost codes:', err);
    previouslyAdjustedCostCodes.value = [];
  }
};

const fetchConsumedAdvanceAmountsForEdit = async (advancePaymentInvoiceUuid: string) => {
  if (!advancePaymentInvoiceUuid) {
    consumedAdvanceAmountsByKey.value = {};
    return;
  }

  try {
    const response = await $fetch<{ data: any[] }>('/api/adjusted-advance-payment-cost-codes', {
      query: { advance_payment_uuid: advancePaymentInvoiceUuid },
    });
    const records = Array.isArray(response?.data) ? response.data : [];
    consumedAdvanceAmountsByKey.value = aggregateAdjustedAdvancePaymentAmounts(records);
  } catch (err: any) {
    console.error('[VendorInvoiceForm] Error fetching consumed advance amounts:', err);
    consumedAdvanceAmountsByKey.value = {};
  }
};

// Fetch previously released cost codes for an existing invoice
const fetchPreviouslyReleasedCostCodes = async (vendorInvoiceUuid: string) => {
  if (!vendorInvoiceUuid) {
    previouslyReleasedCostCodes.value = [];
    return;
  }

  try {
    const response = await $fetch<{ data: any[] }>(
      '/api/holdback-releases',
      {
        query: {
          vendor_invoice_uuid: vendorInvoiceUuid,
        },
      }
    );

    const costCodes = Array.isArray(response?.data) ? response.data : [];
    previouslyReleasedCostCodes.value = costCodes.map((cc: any) => ({
      cost_code_uuid: cc.cost_code_uuid,
      cost_code_label: cc.cost_code_label,
      cost_code_number: cc.cost_code_number,
      cost_code_name: cc.cost_code_name,
      release_amount: parseFloat(String(cc.release_amount)) || 0,
      holdback_invoice_uuid: cc.holdback_invoice_uuid,
      vendor_invoice_uuid: cc.vendor_invoice_uuid,
    }));
  } catch (err: any) {
    console.error('[VendorInvoiceForm] Error fetching previously released cost codes:', err);
    previouslyReleasedCostCodes.value = [];
  }
};

// Fetch ALL previously released cost codes for a PO/CO (across all invoices)
// This is used for new invoices to show remaining amounts
const fetchAllPreviouslyReleasedCostCodes = async (poOrCoUuid: string, isCO: boolean, currentInvoiceUuid?: string | null, holdbackInvoiceUuid?: string | null) => {
  if (!poOrCoUuid) {
    previouslyReleasedCostCodes.value = [];
    return;
  }

  try {
    const queryParams: Record<string, string> = {};
    if (isCO) {
      queryParams.change_order_uuid = poOrCoUuid;
    } else {
      queryParams.purchase_order_uuid = poOrCoUuid;
    }

    // For holdback invoices, filter by the specific holdback invoice UUID
    if (holdbackInvoiceUuid) {
      queryParams.holdback_invoice_uuid = holdbackInvoiceUuid;
    }

    // Exclude current invoice if provided (when editing and we want all other invoices' releases)
    if (currentInvoiceUuid) {
      queryParams.exclude_current_invoice = 'true';
      queryParams.vendor_invoice_uuid = currentInvoiceUuid;
    }

    const response = await $fetch<{ data: any[] }>(
      '/api/holdback-releases',
      { query: queryParams }
    );

    const costCodes = Array.isArray(response?.data) ? response.data : [];
    previouslyReleasedCostCodes.value = costCodes.map((cc: any) => ({
      cost_code_uuid: cc.cost_code_uuid,
      cost_code_label: cc.cost_code_label,
      cost_code_number: cc.cost_code_number,
      cost_code_name: cc.cost_code_name,
      release_amount: parseFloat(String(cc.release_amount)) || 0,
      holdback_invoice_uuid: cc.holdback_invoice_uuid,
      vendor_invoice_uuid: cc.vendor_invoice_uuid,
    }));
  } catch (err: any) {
    console.error('[VendorInvoiceForm] Error fetching all previously released cost codes:', err);
    previouslyReleasedCostCodes.value = [];
  }
};

// Watch for form changes to load adjusted amounts when editing
watch(
  () => props.form.adjusted_advance_payment_amounts,
  (newAmounts) => {
    // Skip if we're currently updating from user input (to prevent overwriting)
    if (isUpdatingAdjustedAmounts.value) {
      return;
    }
    
    if (newAmounts && typeof newAmounts === 'object' && Object.keys(newAmounts).length > 0) {
      // Deep copy to ensure Vue reactivity works properly with nested objects
      const deepCopy = JSON.parse(JSON.stringify(newAmounts));
      adjustedAdvancePaymentAmounts.value = deepCopy;
    } else if (!newAmounts) {
      // Only reset if we don't have local values (preserve user input)
      if (Object.keys(adjustedAdvancePaymentAmounts.value).length === 0) {
        adjustedAdvancePaymentAmounts.value = {};
      }
    }
  },
  { immediate: true, deep: true }
);

// Watch for form UUID and PO/CO changes to fetch previously adjusted cost codes
// This is needed to display what amounts were previously adjusted
watch(
  [() => props.form.uuid, () => props.form.purchase_order_uuid, () => props.form.change_order_uuid, () => props.form.invoice_type],
  async ([newUuid, newPoUuid, newCoUuid, newInvoiceType], [oldUuid]) => {
    // Only fetch for AGAINST_PO or AGAINST_CO invoices
    const invoiceType = String(newInvoiceType || '').toUpperCase();
    if (invoiceType !== 'AGAINST_PO' && invoiceType !== 'AGAINST_CO') {
      previouslyAdjustedCostCodes.value = [];
      return;
    }

    // Determine if this is a PO or CO invoice
    const isCO = invoiceType === 'AGAINST_CO';
    const poOrCoUuid = isCO ? newCoUuid : newPoUuid;

    if (!poOrCoUuid) {
      previouslyAdjustedCostCodes.value = [];
      return;
    }

    // PO/CO-wide fetch; exclude current invoice when it has a uuid so "remaining" and "/ after" values
    // do not double-count this invoice's adjustments against the current input.
    await fetchAllPreviouslyAdjustedCostCodes(poOrCoUuid, isCO, newUuid || undefined);
  },
  { immediate: true }
);

watch(
  [() => props.form.uuid, () => props.form.invoice_type, () => props.editingInvoice],
  async ([newUuid, newInvoiceType, editingInvoice]) => {
    const invoiceType = String(newInvoiceType || '').toUpperCase();
    if (invoiceType !== 'AGAINST_ADVANCE_PAYMENT' || !editingInvoice || !newUuid) {
      consumedAdvanceAmountsByKey.value = {};
      return;
    }

    await fetchConsumedAdvanceAmountsForEdit(String(newUuid));
  },
  { immediate: true }
);


// Watch for po_co_uuid, purchase_order_uuid, or change_order_uuid changes to set loading state immediately (for holdback invoices)
// This ensures skeletons appear as soon as a PO/CO is selected
watch(
  [() => props.form.po_co_uuid, () => props.form.purchase_order_uuid, () => props.form.change_order_uuid, () => props.form.invoice_type],
  ([newPoCoUuid, newPoUuid, newCoUuid, newInvoiceType], [oldPoCoUuid, oldPoUuid, oldCoUuid]) => {
    const invoiceType = String(newInvoiceType || '').toUpperCase();
    
    // Only for holdback invoices
    if (invoiceType !== 'AGAINST_HOLDBACK_AMOUNT') {
      return;
    }
    
    // Set loading immediately when any of these change from null/undefined to a value
    const poCoChanged = !oldPoCoUuid && newPoCoUuid;
    const poChanged = !oldPoUuid && newPoUuid;
    const coChanged = !oldCoUuid && newCoUuid;
    
    // Also set loading if values change to different ones
    const poCoValueChanged = oldPoCoUuid && newPoCoUuid && oldPoCoUuid !== newPoCoUuid;
    const poValueChanged = oldPoUuid && newPoUuid && oldPoUuid !== newPoUuid;
    const coValueChanged = oldCoUuid && newCoUuid && oldCoUuid !== newCoUuid;
    
    if (poCoChanged || poChanged || coChanged || poCoValueChanged || poValueChanged || coValueChanged) {
      loadingHoldbackData.value = true;
    }
  },
  { immediate: false }
);

// Watch for form UUID and PO/CO changes to fetch previously released cost codes for holdback invoices
// This is needed to display what amounts were previously released
watch(
  [() => props.form.uuid, () => props.form.purchase_order_uuid, () => props.form.change_order_uuid, () => props.form.invoice_type, () => props.form.holdback_invoice_uuid, () => props.editingInvoice],
  async ([newUuid, newPoUuid, newCoUuid, newInvoiceType, newHoldbackInvoiceUuid, newEditingInvoice], [oldUuid]) => {
    // Only fetch for AGAINST_HOLDBACK_AMOUNT invoices
    const invoiceType = String(newInvoiceType || '').toUpperCase();
    
    if (invoiceType !== 'AGAINST_HOLDBACK_AMOUNT') {
      previouslyReleasedCostCodes.value = [];
      if (loadingHoldbackData.value) {
        loadingHoldbackData.value = false;
      }
      return;
    }

    // For new invoices, we need PO/CO UUID to fetch releases
    // For existing invoices, we need holdback_invoice_uuid OR PO/CO UUID
    // Determine if this is a PO or CO invoice based on which UUID is set
    const isCO = !!newCoUuid;
    const poOrCoUuid = isCO ? newCoUuid : newPoUuid;

    // For new invoices: we need PO/CO UUID (which comes from the selected holdback invoice)
    // For existing invoices: we can fetch by vendor_invoice_uuid OR by PO/CO UUID
    // If we don't have PO/CO UUID yet, wait for it (don't clear data)
    if (!poOrCoUuid) {
      if (newUuid && newEditingInvoice) {
        // Existing invoice but no PO/CO UUID - try fetching by vendor_invoice_uuid
        if (newUuid !== oldUuid || previouslyReleasedCostCodes.value.length === 0) {
          await fetchPreviouslyReleasedCostCodes(newUuid);
        }
        loadingHoldbackData.value = false;
        return;
      } else {
        // New invoice but no PO/CO UUID yet - wait for it to be set (don't clear, just return)
        return;
      }
    }

    // Fetch releases for the PO/CO (scoped by holdback_invoice_uuid when set).
    // For existing invoices pass newUuid so the API excludes this invoice's rows — same as new invoices.
    // Do not use fetchPreviouslyReleasedCostCodes(thisUuid) here: that loads only *this* invoice's releases
    // and HoldbackBreakdownTable would subtract them from retainage while the form still shows those amounts,
    // which double-counts and falsely flags "exceeds available" on edit.
    try {
      if (newUuid && newEditingInvoice) {
        if (newUuid !== oldUuid || previouslyReleasedCostCodes.value.length === 0) {
          await fetchAllPreviouslyReleasedCostCodes(poOrCoUuid, isCO, newUuid, newHoldbackInvoiceUuid);
        }
      } else {
        await fetchAllPreviouslyReleasedCostCodes(poOrCoUuid, isCO, newUuid, newHoldbackInvoiceUuid);
      }
    } finally {
      // Clear loading state after data is fetched
      // Wait a bit more to ensure the table has time to render
      await nextTick();
      setTimeout(() => {
        loadingHoldbackData.value = false;
      }, 200);
    }
  },
  { immediate: true }
);

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

// Methods
const handleFormUpdate = (field: string, value: any) => {
  // Ensure deep cloning for nested arrays to trigger reactivity (same pattern as PurchaseOrderForm)
  const updatedForm = { ...props.form };
  
  if (field === 'line_items' && Array.isArray(value)) {
    // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
    // This ensures that nested property changes (like unit_price, quantity, total) trigger reactivity
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'po_invoice_items' && Array.isArray(value)) {
    // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'co_invoice_items' && Array.isArray(value)) {
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'po_lwm_invoice_items' && Array.isArray(value)) {
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'co_lwm_invoice_items' && Array.isArray(value)) {
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'advance_payment_cost_codes' && Array.isArray(value)) {
    // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
    updatedForm[field] = value.map((item: any) => ({
      ...item,
    }));
  } else if (field === 'removed_advance_payment_cost_codes') {
    // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
    const arrayValue = Array.isArray(value) ? value : []
    updatedForm[field] = arrayValue.map((item: any) => ({
      ...item,
    }));
  } else {
    updatedForm[field] = value;
  }
  
  emit('update:form', updatedForm);
};

// Normalize legacy timestamp bill_date to plain YYYY-MM-DD in form state.
// Keep bill date as a plain calendar day without UTC/local conversion.
watch(
  () => props.form.bill_date,
  (value) => {
    if (!value) return;
    const normalized = toPlainYmd(value);
    if (normalized && normalized !== value) {
      handleFormUpdate('bill_date', normalized);
    }
  },
  { immediate: true }
);

// Normalize legacy timestamp due_date to plain YYYY-MM-DD in form state.
// Keep due date as a plain calendar day without UTC/local conversion.
watch(
  () => props.form.due_date,
  (value) => {
    if (!value) return;
    const normalized = toPlainYmd(value);
    if (normalized && normalized !== value) {
      handleFormUpdate('due_date', normalized);
    }
  },
  { immediate: true }
);

const handleCorporationChange = async (corporationUuid?: string | null) => {
  const normalizedCorporationUuid = corporationUuid || '';
  handleFormUpdate('corporation_uuid', normalizedCorporationUuid);
  
  // Fetch data for the selected corporation
  // NOTE: We do NOT update corpStore.selectedCorporation here to avoid affecting other components
  // The form operates independently with its own corporation selection
  // All data fetching is scoped to the form's corporation, not TopBar's corporation
  if (normalizedCorporationUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(normalizedCorporationUuid),
      projectsStore.fetchProjectsMetadata(normalizedCorporationUuid),
      // Note: vendorInvoicesStore.fetchVendorInvoices is scoped to TopBar's corporation
      // We don't fetch it here to avoid polluting the global store
      // The form will fetch vendor invoices directly from API when needed
      costCodeConfigurationsStore.fetchConfigurations(normalizedCorporationUuid, false, false),
      // Fetch PO/CO data for the form's corporation so POCOSelect can use it
      // This ensures POCOSelect shows data for the form's corporation, not TopBar's
      purchaseOrdersStore.fetchPurchaseOrders(normalizedCorporationUuid, true), // forceRefresh = true
      changeOrdersStore.fetchChangeOrders(normalizedCorporationUuid, true), // forceRefresh = true
    ]);
    
    // If project is already selected, ensure project resources are loaded
    // This uses purchaseOrderResourcesStore which is scoped to the form's corporation
    const projTrim =
      props.form.project_uuid != null && String(props.form.project_uuid).trim() !== ""
        ? String(props.form.project_uuid).trim()
        : "";
    if (normalizedCorporationUuid && projTrim) {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: normalizedCorporationUuid,
        projectUuid: projTrim,
      });
      if (isDirectInvoice.value) {
        directInvoicePreferredItemsRefreshToken.value += 1;
      }
    }
  }
  
  // Auto-generate Invoice Number on corporation selection if not set
  if (normalizedCorporationUuid) {
    await generateInvoiceNumber();
  }
  
  // Clear project if corporation changes (project must belong to the selected corporation)
  // But skip this check if we're loading an existing invoice (project might not be in store yet)
  if (normalizedCorporationUuid && props.form.project_uuid && !props.form.uuid) {
    // Check if the current project belongs to the new corporation
    const projects = projectsStore.projectsMetadata;
    const currentProject = projects?.find((p: any) => p.uuid === props.form.project_uuid);
    if (!currentProject) {
      handleFormUpdate('project_uuid', null);
    }
  }
};

const handleProjectChange = async (projectUuid?: string | null) => {
  const normalizedProjectUuid = projectUuid || '';
  handleFormUpdate('project_uuid', normalizedProjectUuid);
  
  // Ensure project resources (cost codes, item types, preferred items) are loaded
  // This ensures POItemsTableWithEstimates has the data it needs
  const corpUuid = vendorInvoiceResourceCorpUuid.value;
  const projectForEnsure = vendorInvoiceResourceProjectUuid.value;
  if (projectForEnsure && corpUuid) {
    await purchaseOrderResourcesStore.ensureProjectResources({
      corporationUuid: corpUuid,
      projectUuid: projectForEnsure,
    });
    if (isDirectInvoice.value) {
      directInvoicePreferredItemsRefreshToken.value += 1;
    }
  }
};

const handleVendorChange = async (value: any) => {
  const vendorUuid = typeof value === 'string' ? value : (value && typeof value === 'object' ? value.value : '');
  const prev = String(props.form.vendor_uuid || '').trim();
  const next = String(vendorUuid || '').trim();
  handleFormUpdate('vendor_uuid', next);

  // Same as PurchaseOrderForm project watcher: preferred items for line Spec/Item come from Pinia — reload
  // after vendor is chosen so Enter Direct Invoice line rows can resolve options (vendor pick often follows project).
  const corp = vendorInvoiceResourceCorpUuid.value;
  const projectUuid = vendorInvoiceResourceProjectUuid.value;
  if (
    corp &&
    projectUuid &&
    String(props.form.invoice_type || '').toUpperCase() === 'ENTER_DIRECT_INVOICE'
  ) {
    await purchaseOrderResourcesStore.ensureProjectResources({
      corporationUuid: corp,
      projectUuid,
    });
    directInvoicePreferredItemsRefreshToken.value += 1;
  }

  // Direct invoice: reopen master import when vendor changes so users still get the modal after picking vendor.
  // Preferred items are loaded for the whole project (not filtered by this vendor — see fetchMasterDirectLineModalItems).
  nextTick(() => {
    if (String(props.form.invoice_type || '').toUpperCase() !== 'ENTER_DIRECT_INVOICE') return;
    if (!vendorInvoiceResourceProjectUuid.value || !next || props.readonly) return;
    const c = vendorInvoiceResourceCorpUuid.value;
    if (!c) return;
    if (next === prev) return;
    void openDirectMasterImportModal(false);
  });
};

const handlePOChange = async (value: any) => {
  // Extract UUID - handle both string and object formats
  let poUuid: string | null = null;
  
  if (typeof value === 'string') {
    poUuid = value || null;
  } else if (value && typeof value === 'object') {
    // Try different possible properties
    poUuid = value.value || value.uuid || value.id || null;
    
    // Also check if it's a purchaseOrder object
    if (!poUuid && value.purchaseOrder) {
      poUuid = value.purchaseOrder.uuid || value.purchaseOrder.value || null;
    }
  }
  
  // Update purchase_order_uuid - ensure it's a string or null, not empty string
  const finalPoUuid = poUuid && poUuid.trim() ? poUuid.trim() : null;
  handleFormUpdate('purchase_order_uuid', finalPoUuid);
  
  // Also update po_number if we have the purchase order object
  if (value && typeof value === 'object' && value.purchaseOrder) {
    handleFormUpdate('po_number', value.purchaseOrder.po_number || '');
  } else if (!finalPoUuid) {
    handleFormUpdate('po_number', '');
    poItems.value = [];
    poItemsError.value = null;
    return;
  }
  
  // Fetch PO items when PO is selected (for Against PO invoice type)
  // We fetch directly here to ensure it happens immediately, and the watcher will also handle it
  if (finalPoUuid && isAgainstPO.value) {
    await fetchPOItems(finalPoUuid);
  } else if (!finalPoUuid) {
    // Clear items if PO is cleared
    poItems.value = [];
    poItemsError.value = null;
    poItemsKey.value += 1; // Force re-render when clearing
  }
};


/** Server-aggregated prior AGAINST_PO / AGAINST_CO line quantities and LWM amounts (one PO or one CO). */
const fetchPreviouslyInvoicedForOrder = async (args: {
  purchase_order_uuid?: string;
  change_order_uuid?: string;
  exclude_vendor_invoice_uuid?: string | null;
}): Promise<{ lineQuantities: Map<string, number>; lwmAmounts: Map<string, number> }> => {
  const corporationUuid =
    props.form.corporation_uuid || corpStore.selectedCorporation?.uuid || "";
  if (!corporationUuid) {
    return { lineQuantities: new Map(), lwmAmounts: new Map() };
  }
  if (!args.purchase_order_uuid && !args.change_order_uuid) {
    return { lineQuantities: new Map(), lwmAmounts: new Map() };
  }
  try {
    const query: Record<string, string> = { corporation_uuid: corporationUuid };
    if (args.purchase_order_uuid) {
      query.purchase_order_uuid = args.purchase_order_uuid;
    }
    if (args.change_order_uuid) {
      query.change_order_uuid = args.change_order_uuid;
    }
    if (args.exclude_vendor_invoice_uuid) {
      query.exclude_vendor_invoice_uuid = args.exclude_vendor_invoice_uuid;
    }
    const response = await $fetch<{
      data: { lineQuantities: Record<string, number>; lwmAmounts: Record<string, number> };
    }>("/api/vendor-invoices/previously-invoiced-for-order", { query });

    const toMap = (rec: Record<string, number> | undefined) => {
      const m = new Map<string, number>();
      if (!rec || typeof rec !== "object") return m;
      for (const [k, v] of Object.entries(rec)) {
        const n = typeof v === "number" ? v : parseFloat(String(v));
        m.set(k, Number.isFinite(n) ? n : 0);
      }
      return m;
    };

    return {
      lineQuantities: toMap(response?.data?.lineQuantities),
      lwmAmounts: toMap(response?.data?.lwmAmounts),
    };
  } catch (error) {
    console.warn(
      "[VendorInvoiceForm] Failed to fetch previously invoiced aggregates:",
      error
    );
    return { lineQuantities: new Map(), lwmAmounts: new Map() };
  }
};

const applyOrderCurrencyToVendorInvoiceLineItem = (
  item: Record<string, any>,
  orderHeader: Record<string, any> | null | undefined,
) => applyPoCurrencyToVendorInvoiceLineItem(item, orderHeader)

// Fetch PO items and financial breakdown
const fetchPOItems = async (poUuid: string) => {
  if (!poUuid) {
    poItems.value = [];
    poLwmItems.value = [];
    return;
  }

  const corporationUuidSnapshot = snapshotVendorInvoiceCorporationUuid();
  
  poItemsLoading.value = true;
  poItemsError.value = null;
  laborInvoiceItems.value = [];

  try {
    // Ensure project resources (cost codes, item types, preferred items) are loaded
    // This ensures POItemsTableWithEstimates has the data it needs for cost code, item type, sequence, and item selects
    const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
    if (corpUuid && props.form.project_uuid) {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: corpUuid,
        projectUuid: props.form.project_uuid,
      });
    }
    
    const excludeInv = props.form.uuid || undefined;
    const fetchPoHeader = async (): Promise<{ data: any } | null> => {
      try {
        return await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
      } catch (error1) {
        console.warn(
          "[VendorInvoiceForm] Failed to fetch from purchase-order-forms, trying purchase-orders:",
          error1
        );
        try {
          return await $fetch<{ data: any }>(`/api/purchase-orders?uuid=${poUuid}`);
        } catch (error2) {
          console.warn("[VendorInvoiceForm] Failed to fetch from purchase-orders:", error2);
          return null;
        }
      }
    };

    const [previousAgg, poResponse, itemsResponse] = await Promise.all([
      fetchPreviouslyInvoicedForOrder({
        purchase_order_uuid: poUuid,
        exclude_vendor_invoice_uuid: excludeInv,
      }),
      fetchPoHeader(),
      $fetch<{ data: any[] }>(
        `/api/purchase-order-items?purchase_order_uuid=${poUuid}`
      ),
    ]);

    const previousInvoiceQuantities = previousAgg.lineQuantities;
    const items = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];
    
    // Check if we have saved invoice items for this invoice
    let savedInvoiceItems: any[] = [];
    if (props.form.uuid && props.form.po_invoice_items && Array.isArray(props.form.po_invoice_items)) {
      savedInvoiceItems = props.form.po_invoice_items;
    }
    
    // Create a map of saved invoice items by po_item_uuid for quick lookup
    const invoiceItemsMap = new Map<string, any>();
    savedInvoiceItems.forEach((invoiceItem: any) => {
      if (invoiceItem.po_item_uuid) {
        invoiceItemsMap.set(invoiceItem.po_item_uuid, invoiceItem);
      }
    });
    
    // Get preferred items for populating options (sequence and item selects)
    const preferredItems = preferredItemOptions.value;
    const preferredItemOptionMap = new Map<string, any>();
    preferredItems.forEach((opt) => {
      preferredItemOptionMap.set(String(opt.value), opt);
    });
    
    // Map items to the format expected by POItemsTableWithEstimates
    const mappedItems = items.map((item: any, index: number) => {
      const poItemUuid = item.uuid;
      const savedInvoiceItem = invoiceItemsMap.get(poItemUuid);
      
      // Extract sequence from multiple sources (similar to PurchaseOrderForm)
      // Check both metadata (JSONB from DB) and display_metadata (computed/display)
      const display = item?.display_metadata || item?.metadata || {};
      
      // Extract sequence - check multiple sources
      let sequenceValue = 
        display.sequence || 
        item.sequence || 
        item.item_sequence || 
        item.sequence_uuid || 
        '';
      
      // If no sequence found and we have item_uuid, lookup from preferred items
      if (!sequenceValue && item.item_uuid) {
        const matchedItem = preferredItemOptionMap.get(String(item.item_uuid));
        if (matchedItem?.item_sequence) {
          sequenceValue = matchedItem.item_sequence;
        } else if (matchedItem?.sequence) {
          sequenceValue = matchedItem.sequence;
        } else if (matchedItem?.raw?.item_sequence) {
          sequenceValue = matchedItem.raw.item_sequence;
        }
      }

      const preferredItemRaw = item.item_uuid
        ? preferredItemOptionMap.get(String(item.item_uuid))?.raw
        : null;
      const resolvedItemTypeUuid =
        item.item_type_uuid ||
        display.item_type_uuid ||
        preferredItemRaw?.item_type_uuid ||
        null;
      const itemTypeObj = resolvedItemTypeUuid
        ? (scopedItemTypes.value || []).find(
            (it: any) =>
              String(it?.uuid || it?.value || it?.item_type_uuid || "") ===
              String(resolvedItemTypeUuid)
          )
        : null;
      const category =
        item.category ||
        display.category ||
        preferredItemRaw?.category ||
        itemTypeObj?.category ||
        "";
      const itemDivisionUuid =
        item.item_division_uuid ||
        display.item_division_uuid ||
        preferredItemRaw?.item_division_uuid ||
        itemTypeObj?.item_division_uuid ||
        null;
      const divisionName =
        item.division_name ||
        display.division_name ||
        preferredItemRaw?.division_name ||
        itemTypeObj?.division_name ||
        itemTypeObj?.division?.division_name ||
        "";
      
      // Build options array - use item.options from API if available, otherwise build from preferred items
      // Include the current item if it's not in preferred items (for saved items)
      let options: any[] = [];
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        // Use options from API response if available
        options = item.options;
      } else {
        // Fall back to building from preferred items
        options = [...preferredItems];
        if (item.item_uuid && !preferredItemOptionMap.has(String(item.item_uuid))) {
          // Add the current item to options if it's not in the preferred items list
          // This ensures the select components can display the saved item
          const resolvedItemName = item.description || item.item_name || item.name || String(item.item_uuid);
          const resolvedSequence = sequenceValue || item.sequence || item.item_sequence || '';
          options.push({
            label: resolvedItemName,
            value: String(item.item_uuid),
            uuid: String(item.item_uuid),
            item_uuid: String(item.item_uuid),
            item_name: resolvedItemName,
            name: resolvedItemName,
            item_sequence: resolvedSequence,
            sequence: resolvedSequence,
            raw: item,
          });
        }
      }
      
      return {
      id: item.uuid || item.id || `po-item-${index}`,
        po_item_uuid: poItemUuid, // Store reference to original PO item for saving
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_label: item.cost_code_label || 
        (item.cost_code_number && item.cost_code_name 
          ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
          : null),
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      item_type_uuid: resolvedItemTypeUuid,
      item_type_label: item.item_type_label || '',
      category,
      item_division_uuid: itemDivisionUuid,
      division_name: divisionName,
      sequence: sequenceValue, // Include sequence for SequenceSelect
      item_sequence: sequenceValue, // Also include as item_sequence for compatibility
      item_uuid: item.item_uuid || null,
      description: item.description || '',
      model_number: item.model_number || '',
      location_uuid: item.location_uuid || null,
      location_label:
        item.location_label ||
        item.location ||
        display.location_label ||
        display.location_display ||
        null,
      location: (() => {
        const preferred = [
          item.location_label,
          item.location,
          display.location_label,
          display.location_display,
        ]
          .map((value: any) => (value == null ? '' : String(value).trim()))
          .find((value: string) => value.length > 0 && value !== String(item.location_uuid || '').trim());
        if (preferred) return preferred;
        const scopedMatch = poScopedLocations.value.find(
          (loc: any) => String(loc?.uuid || '').trim() === String(item.location_uuid || '').trim()
        );
        return scopedMatch?.location_name || String(item.location_uuid || '');
      })(),
      unit_uuid: item.unit_uuid || null,
      unit_label: item.unit_label || item.unit || '',
      quantity: item.quantity || null,
      unit_price: item.unit_price || null,
      total: item.total || null,
      po_unit_price: item.po_unit_price || item.unit_price || null,
      po_quantity: item.po_quantity || item.quantity || null,
      po_total: item.po_total || item.total || null,
        // For new invoices: show empty fields (null)
        // For existing invoices: 
        //   - If savedInvoiceItem exists: use its values (even if null/undefined)
        //   - If savedInvoiceItems exist but no match: use null (empty field)
        //   - If no savedInvoiceItems at all: fall back to PO values
        invoice_unit_price: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_unit_price !== undefined ? savedInvoiceItem.invoice_unit_price : null)
              : (savedInvoiceItems.length > 0 ? null : (item.po_unit_price ?? item.unit_price ?? null)))
          : null,
        invoice_quantity: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_quantity !== undefined ? savedInvoiceItem.invoice_quantity : null)
              : (savedInvoiceItems.length > 0 ? null : (item.po_quantity ?? item.quantity ?? null)))
          : null,
        invoice_total: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_total !== undefined ? savedInvoiceItem.invoice_total : null)
              : (savedInvoiceItems.length > 0 ? null : (item.po_total ?? item.total ?? null)))
          : null,
      // Calculate "to be invoiced" quantity: PO quantity - sum of previously invoiced quantities
      to_be_invoiced: (() => {
        const poQty = parseFloat(String(item.po_quantity ?? item.quantity ?? 0)) || 0;
        const previouslyInvoiced = previousInvoiceQuantities.get(poItemUuid) || 0;
        const result = Math.max(0, poQty - previouslyInvoiced);
        return result;
      })(),
      approval_checks: props.form.uuid && savedInvoiceItem
        ? (savedInvoiceItem.approval_checks || [])
        : (item.approval_checks || item.approval_checks_uuids || []),
      options: options // Use options from API if available, otherwise from preferred items
      };
    });

    
    // Set loading to false BEFORE setting items to ensure component is ready
    poItemsLoading.value = false;
    
    // Wait for next tick to ensure component state is updated
    await nextTick();
    
    // Filter out items where to_be_invoiced is zero
    const filteredItems = mappedItems.filter((item: any) => {
      const toBeInvoiced = parseFloat(String(item.to_be_invoiced ?? 0)) || 0;
      return toBeInvoiced > 0;
    });
    
    // Create a completely new array with new object references to ensure Vue reactivity
    poItems.value = filteredItems.map((item) =>
      applyOrderCurrencyToVendorInvoiceLineItem(item, poResponse?.data),
    );
    
    // Immediately sync poItems to form.po_invoice_items for saving
    // This ensures the data is available even if the watcher hasn't fired yet
    if (isAgainstPO.value && poItems.value.length > 0) {
      const poInvoiceItems = poItems.value.map((item: any, index: number) => ({
        order_index: index,
        po_item_uuid: item.po_item_uuid || item.id || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        category: item.category || null,
        item_division_uuid: item.item_division_uuid || null,
        division_name: item.division_name || null,
        item_type_uuid: item.item_type_uuid || null,
        item_type_label: item.item_type_label || '',
        item_uuid: item.item_uuid || null,
        item_name: item.item_name || item.description || '',
        description: item.description || '',
        model_number: item.model_number || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location || item.location_label || null,
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
        // Use the invoice values from the mapped items (which are already set correctly based on new vs existing invoice)
        invoice_quantity: item.invoice_quantity !== undefined ? item.invoice_quantity : null,
        invoice_unit_price: item.invoice_unit_price !== undefined ? item.invoice_unit_price : null,
        invoice_total: item.invoice_total !== undefined ? item.invoice_total : null,
        approval_checks: item.approval_checks || [],
        metadata: item.metadata || {}
      }));
      
      // Update form with po_invoice_items
      isUpdatingPOInvoiceItems.value = true;
      try {
        handleFormUpdate('po_invoice_items', poInvoiceItems);
      } finally {
        await nextTick();
        isUpdatingPOInvoiceItems.value = false;
      }
    }
    
    // Extract location-wise material items from PO if present
    const poLwmRawItems = poResponse?.data?.po_location_wise_material_items;
    if (Array.isArray(poLwmRawItems) && poLwmRawItems.length > 0) {
      poLwmItemsLoading.value = true;
      const savedLwmItems: any[] =
        props.form.uuid && Array.isArray(props.form.po_lwm_invoice_items)
          ? props.form.po_lwm_invoice_items
          : [];

      // Build lookup maps: by po_lwm_uuid, and fallback by cost_code+location for legacy records saved with null po_lwm_uuid
      const savedByUuid = new Map<string, any>();
      const savedByKey = new Map<string, any>();
      savedLwmItems.forEach((si: any) => {
        if (si.po_lwm_uuid) {
          savedByUuid.set(si.po_lwm_uuid, si);
        } else {
          const key = `${si.cost_code_uuid || ''}|${si.location_uuid || ''}`;
          savedByKey.set(key, si);
        }
      });

      const previousLwmAmounts = previousAgg.lwmAmounts;

      const mappedLwm = poLwmRawItems.map((lwm: any, idx: number) => {
        const lwmUuid = lwm.uuid || null;
        const saved = lwmUuid
          ? savedByUuid.get(lwmUuid)
          : null;
        // Fallback: match by cost_code + location for legacy records
        const fallbackKey = `${lwm.cost_code_uuid || ''}|${lwm.location_uuid || ''}`;
        const savedFallback = !saved ? savedByKey.get(fallbackKey) : null;
        const matchedSaved = saved || savedFallback;

        const prevInvoiced = (lwmUuid ? previousLwmAmounts.get(lwmUuid) : 0) || 0;
        const invoiceAmt = props.form.uuid && matchedSaved
            ? (matchedSaved.invoice_amount !== undefined ? matchedSaved.invoice_amount : null)
            : null;
        return {
          po_lwm_uuid: lwmUuid,
          cost_code_uuid: lwm.cost_code_uuid || null,
          cost_code_label: lwm.cost_code_label || null,
          cost_code_number: lwm.cost_code_number || '',
          cost_code_name: lwm.cost_code_name || '',
          division_name: lwm.division_name || '',
          location_uuid: lwm.location_uuid || null,
          location_label: lwm.location_label || '',
          material_budgeted_amount: parseFloat(String(lwm.material_budgeted_amount || 0)) || 0,
          po_amount: parseFloat(String(lwm.po_amount || 0)) || 0,
          previously_invoiced: prevInvoiced,
          invoice_amount: invoiceAmt,
          description: lwm.description || '',
          metadata: lwm.metadata || {},
        };
      });

      // Avoid clobbering any in-flight edits/manual assignments.
      if (poLwmItems.value.length === 0) {
        poLwmItems.value = mappedLwm;
      }
      poLwmItemsLoading.value = false;

      if (isAgainstPO.value && poLwmItems.value.length > 0) {
        const lwmInvoiceItems = poLwmItems.value.map((item: any, index: number) => ({
          order_index: index,
          po_lwm_uuid: item.po_lwm_uuid || null,
          cost_code_uuid: item.cost_code_uuid || null,
          cost_code_label: item.cost_code_label || null,
          cost_code_number: item.cost_code_number || '',
          cost_code_name: item.cost_code_name || '',
          division_name: item.division_name || '',
          location_uuid: item.location_uuid || null,
          location_label: item.location_label || '',
          material_budgeted_amount: item.material_budgeted_amount,
          po_amount: item.po_amount,
          invoice_amount: item.invoice_amount ?? 0,
          description: item.description || '',
          metadata: item.metadata || {},
        }));
        isUpdatingPoLwmInvoiceItems.value = true;
        try {
          handleFormUpdate('po_lwm_invoice_items', lwmInvoiceItems);
        } finally {
          await nextTick();
          isUpdatingPoLwmInvoiceItems.value = false;
        }
      }
    } else {
      // Only clear if nothing else has populated the list while we were fetching.
      if (poLwmItems.value.length === 0) {
        poLwmItems.value = [];
      }
    }

    // Fetch advance payment invoices for this PO to calculate amount without taxes
    try {
      const queryParams: Record<string, string> = {};
      if (props.form.uuid) {
        queryParams.currentInvoiceUuid = props.form.uuid;
      }
      const advancePaymentsResponse = await $fetch<{ data: any[] }>(
        `/api/purchase-orders/${poUuid}/advance-payments`,
        { query: queryParams }
      );
      
      const advancePayments = Array.isArray(advancePaymentsResponse?.data) ? advancePaymentsResponse.data : [];

      // Calculate total advance paid without taxes
      const totalWithoutTaxes = advancePayments.reduce((sum, payment) => {
        const totalAmount = parseFloat(payment.amount || '0') || 0;
        
        // Get tax total from financial_breakdown
        let taxTotal = 0;
        if (payment.financial_breakdown) {
          try {
            let breakdown = payment.financial_breakdown;
            if (typeof breakdown === 'string') {
              breakdown = JSON.parse(breakdown);
            }
            const totals = breakdown?.totals || breakdown || {};
            if (breakdown?.sales_taxes) {
              const salesTaxes = breakdown.sales_taxes;
              const tax1 = parseFloat(salesTaxes.sales_tax_1?.amount || salesTaxes.salesTax1?.amount || '0') || 0;
              const tax2 = parseFloat(salesTaxes.sales_tax_2?.amount || salesTaxes.salesTax2?.amount || '0') || 0;
              taxTotal = tax1 + tax2;
            } else {
              taxTotal = parseFloat(totals.tax_total || totals.taxTotal || '0') || 0;
            }
          } catch (e) {
            // If parsing fails, use 0 for tax
          }
        }
        
        return sum + (totalAmount - taxTotal);
      }, 0);
      
      poAdvancePaid.value = totalWithoutTaxes;
    } catch (error) {
      console.warn('[VendorInvoiceForm] Failed to fetch advance payments:', error);
      poAdvancePaid.value = 0;
    }
    
    // Increment key to force component re-render
    poItemsKey.value += 1;
    
    // Force another tick to ensure the component receives the update and re-renders
    await nextTick();
    
    // Populate financial breakdown from PO if available
    if (poResponse?.data) {
      const po = poResponse.data;
      
      // Try to get financial breakdown from JSON field first
      let poFinancialBreakdown = po.financial_breakdown || po.financialBreakdown;
      
      // If financial_breakdown is a string, parse it
      if (typeof poFinancialBreakdown === 'string') {
        try {
          poFinancialBreakdown = JSON.parse(poFinancialBreakdown);
        } catch (e) {
          console.warn('[VendorInvoiceForm] Failed to parse financial_breakdown string:', e);
          poFinancialBreakdown = null;
        }
      }
      
      // If no financial breakdown JSON, build it from individual fields
      if (!poFinancialBreakdown || (typeof poFinancialBreakdown === 'object' && Object.keys(poFinancialBreakdown).length === 0)) {
        poFinancialBreakdown = {
          charges: {
            freight: {
              percentage: po.freight_charges_percentage ?? null,
              amount: po.freight_charges_amount ?? null,
              taxable: po.freight_charges_taxable ?? false
            },
            packing: {
              percentage: po.packing_charges_percentage ?? null,
              amount: po.packing_charges_amount ?? null,
              taxable: po.packing_charges_taxable ?? false
            },
            custom_duties: {
              percentage: po.custom_duties_percentage ?? null,
              amount: po.custom_duties_amount ?? null,
              taxable: po.custom_duties_taxable ?? false
            },
            other: {
              percentage: po.other_charges_percentage ?? null,
              amount: po.other_charges_amount ?? null,
              taxable: po.other_charges_taxable ?? false
            }
          },
          sales_taxes: {
            sales_tax_1: {
              percentage: po.sales_tax_1_percentage ?? null,
              amount: po.sales_tax_1_amount ?? null
            },
            sales_tax_2: {
              percentage: po.sales_tax_2_percentage ?? null,
              amount: po.sales_tax_2_amount ?? null
            }
          },
          totals: {
            item_total: po.item_total ?? poItemsTotal.value ?? null,
            charges_total: po.charges_total ?? null,
            tax_total: po.tax_total ?? null,
            total_po_amount: po.total_po_amount ?? null
          }
        };
      }
      
      if (poFinancialBreakdown && typeof poFinancialBreakdown === 'object') {
        // For existing invoices, check if there's a saved financial breakdown
        // If there is, use the saved charges and taxes instead of PO values
        let savedFinancialBreakdown = null;
        if (props.form.uuid) {
          // This is an existing invoice - check for saved financial breakdown
          savedFinancialBreakdown = props.form.financial_breakdown;
          if (typeof savedFinancialBreakdown === 'string') {
            try {
              savedFinancialBreakdown = JSON.parse(savedFinancialBreakdown);
            } catch (e) {
              console.warn('[VendorInvoiceForm] Failed to parse saved financial_breakdown:', e);
              savedFinancialBreakdown = null;
            }
          }
        }
        
        // Use saved financial breakdown if available (for existing invoices with saved charges/taxes)
        // Otherwise, use PO financial breakdown (for new invoices or invoices without saved values)
        // Only use saved if it has charges or sales_taxes defined (not just totals)
        const hasSavedChargesOrTaxes = savedFinancialBreakdown && typeof savedFinancialBreakdown === 'object' && 
          (savedFinancialBreakdown.charges || savedFinancialBreakdown.sales_taxes);
        
        const sourceFinancialBreakdown = hasSavedChargesOrTaxes 
          ? savedFinancialBreakdown 
          : poFinancialBreakdown;
        
        // Deep clone the financial breakdown to avoid mutating the original
        const financialBreakdown = JSON.parse(JSON.stringify(sourceFinancialBreakdown));
        
        // Ensure the structure matches what FinancialBreakdown expects
        if (!financialBreakdown.charges) {
          financialBreakdown.charges = {
            freight: { percentage: null, amount: null, taxable: false },
            packing: { percentage: null, amount: null, taxable: false },
            custom_duties: { percentage: null, amount: null, taxable: false },
            other: { percentage: null, amount: null, taxable: false },
          };
        }
        
        if (!financialBreakdown.sales_taxes) {
          financialBreakdown.sales_taxes = {
            sales_tax_1: { percentage: null, amount: null },
            sales_tax_2: { percentage: null, amount: null },
          };
        }
        
        if (!financialBreakdown.totals) {
          financialBreakdown.totals = {
            item_total: null,
            charges_total: null,
            tax_total: null,
            total_po_amount: null,
          };
        }
        
        // Update totals with PO items total if not already set
        if (!financialBreakdown.totals.item_total && poItemsTotal.value > 0) {
          financialBreakdown.totals.item_total = poItemsTotal.value;
        }
        
        // DO NOT map total_po_amount to total_invoice_amount
        // total_invoice_amount should only be calculated from invoice item values + charges + taxes
        // The FinancialBreakdown component will calculate total_invoice_amount automatically
        // We keep total_po_amount for reference only
        
        // Flatten the financial breakdown structure for the form
        // The FinancialBreakdown component expects flat fields like freight_charges_percentage, etc.
        const updatedForm = { ...props.form };
        
        // Explicitly preserve purchase_order_uuid and other critical fields
        // IMPORTANT: Use the poUuid parameter passed to this function, not props.form.purchase_order_uuid
        // because props.form might not have been updated yet due to timing/reactivity
        const preservedFields = {
          purchase_order_uuid: poUuid || props.form.purchase_order_uuid || null,
          change_order_uuid: props.form.change_order_uuid,
          po_co_uuid: props.form.po_co_uuid,
          po_number: props.form.po_number,
          co_number: props.form.co_number,
          invoice_type: props.form.invoice_type,
          project_uuid: props.form.project_uuid,
          vendor_uuid: props.form.vendor_uuid,
          corporation_uuid: (() => {
            const cur = props.form.corporation_uuid;
            if (cur != null && String(cur).trim() !== "") return String(cur).trim();
            return corporationUuidSnapshot || null;
          })(),
        };
        
        // Update financial_breakdown object
        updatedForm.financial_breakdown = financialBreakdown;
        
        // Explicitly preserve critical fields - this ensures purchase_order_uuid is not lost
        Object.assign(updatedForm, preservedFields);
        
        // Flatten charge fields
        if (financialBreakdown.charges) {
          updatedForm.freight_charges_percentage = financialBreakdown.charges.freight?.percentage ?? null;
          updatedForm.freight_charges_amount = financialBreakdown.charges.freight?.amount ?? null;
          updatedForm.freight_charges_taxable = financialBreakdown.charges.freight?.taxable ?? false;
          
          updatedForm.packing_charges_percentage = financialBreakdown.charges.packing?.percentage ?? null;
          updatedForm.packing_charges_amount = financialBreakdown.charges.packing?.amount ?? null;
          updatedForm.packing_charges_taxable = financialBreakdown.charges.packing?.taxable ?? false;
          
          updatedForm.custom_duties_charges_percentage = financialBreakdown.charges.custom_duties?.percentage ?? null;
          updatedForm.custom_duties_charges_amount = financialBreakdown.charges.custom_duties?.amount ?? null;
          updatedForm.custom_duties_charges_taxable = financialBreakdown.charges.custom_duties?.taxable ?? false;
          
          updatedForm.other_charges_percentage = financialBreakdown.charges.other?.percentage ?? null;
          updatedForm.other_charges_amount = financialBreakdown.charges.other?.amount ?? null;
          updatedForm.other_charges_taxable = financialBreakdown.charges.other?.taxable ?? false;
        }
        
        // Flatten sales tax fields
        if (financialBreakdown.sales_taxes) {
          updatedForm.sales_tax_1_percentage = financialBreakdown.sales_taxes.sales_tax_1?.percentage ?? null;
          updatedForm.sales_tax_1_amount = financialBreakdown.sales_taxes.sales_tax_1?.amount ?? null;
          
          updatedForm.sales_tax_2_percentage = financialBreakdown.sales_taxes.sales_tax_2?.percentage ?? null;
          updatedForm.sales_tax_2_amount = financialBreakdown.sales_taxes.sales_tax_2?.amount ?? null;
        }
        
        // Flatten totals fields
        if (financialBreakdown.totals) {
          updatedForm.item_total = financialBreakdown.totals.item_total ?? null;
          updatedForm.charges_total = financialBreakdown.totals.charges_total ?? null;
          updatedForm.tax_total = financialBreakdown.totals.tax_total ?? null;
        }
        
        // For existing invoices (Against PO):
        // Since we fetched advance payment BEFORE building financial breakdown,
        // the FinancialBreakdown component will automatically recalculate with:
        // - item_total (from saved invoice values via poItemsTotal)
        // - charges and taxes (from saved financial breakdown)
        // - current advance payment (poAdvancePaid - fetched above)
        // - current holdback (poHoldbackAmount)
        // So we don't need to clear or manipulate the amount - just let it flow naturally
        
        updatedForm.financial_breakdown = financialBreakdown
        
        // Emit the complete updated form with all flattened fields
        emit('update:form', updatedForm);
      } else {
        console.warn('[VendorInvoiceForm] No valid financial breakdown found in PO');
      }
    } else {
      console.warn('[VendorInvoiceForm] No PO data received from API');
    }
  } catch (error) {
    console.error('[VendorInvoiceForm] Error fetching PO items:', error);
    poItemsError.value = 'Failed to load purchase order items';
    poItems.value = [];
    poLwmItems.value = [];
    poItemsLoading.value = false;
  }
};

// Reset advance paid when PO changes
watch(
  () => props.form.purchase_order_uuid,
  (newPoUuid, oldPoUuid) => {
    if (newPoUuid !== oldPoUuid) {
      poAdvancePaid.value = 0;
    }
  }
);

/** CO advance payments (net of taxes) — shared by material CO fetch and labor CO labor-invoice fetch */
async function loadCoAdvancePaidForChangeOrder(coUuid: string) {
  try {
    const queryParams: Record<string, string> = {};
    if (props.form.uuid) {
      queryParams.currentInvoiceUuid = props.form.uuid;
    }
    const advancePaymentsResponse = await $fetch<{ data: any[] }>(
      `/api/change-orders/${coUuid}/advance-payments`,
      { query: queryParams }
    );

    const advancePayments = Array.isArray(advancePaymentsResponse?.data) ? advancePaymentsResponse.data : [];

    const totalWithoutTaxes = advancePayments.reduce((sum, payment) => {
      const totalAmount = parseFloat(payment.amount || '0') || 0;

      let taxTotal = 0;
      if (payment.financial_breakdown) {
        try {
          let breakdown = payment.financial_breakdown;
          if (typeof breakdown === 'string') {
            breakdown = JSON.parse(breakdown);
          }
          const totals = breakdown?.totals || breakdown || {};
          if (breakdown?.sales_taxes) {
            const salesTaxes = breakdown.sales_taxes;
            const tax1 = parseFloat(salesTaxes.sales_tax_1?.amount || salesTaxes.salesTax1?.amount || '0') || 0;
            const tax2 = parseFloat(salesTaxes.sales_tax_2?.amount || salesTaxes.salesTax2?.amount || '0') || 0;
            taxTotal = tax1 + tax2;
          } else {
            taxTotal = parseFloat(totals.tax_total || totals.taxTotal || '0') || 0;
          }
        } catch {
          /* ignore */
        }
      }

      return sum + (totalAmount - taxTotal);
    }, 0);

    coAdvancePaid.value = totalWithoutTaxes;
  } catch (error) {
    console.warn('[VendorInvoiceForm] Failed to fetch CO advance payments:', error);
    coAdvancePaid.value = 0;
  }
}

// Fetch CO items and financial breakdown
const fetchCOItems = async (coUuid: string) => {
  if (!coUuid) {
    coItems.value = [];
    coLwmItems.value = [];
    return;
  }

  const corporationUuidSnapshot = snapshotVendorInvoiceCorporationUuid();

  coItemsLoading.value = true;
  coItemsError.value = null;
  laborInvoiceItems.value = [];

  // Ensure project resources are available so CO rows can resolve
  // cost code, item type, sequence and item labels similarly to PO flow.
  try {
    const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
    if (corpUuid && props.form.project_uuid) {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: corpUuid,
        projectUuid: props.form.project_uuid,
      });
    }
  } catch (error) {
    console.warn('[VendorInvoiceForm] Failed to ensure project resources for CO items:', error);
  }

  await loadCoAdvancePaidForChangeOrder(coUuid);

  try {
    await locationsStore.fetchLocations(true);
    const excludeInvCo = props.form.uuid || undefined;
    const [previousAggCo, coResponse, itemsResponse] = await Promise.all([
      fetchPreviouslyInvoicedForOrder({
        change_order_uuid: coUuid,
        exclude_vendor_invoice_uuid: excludeInvCo,
      }),
      $fetch<{ data: any }>(`/api/change-orders/${coUuid}`),
      $fetch<{ data: any[] }>(
        `/api/change-order-items?change_order_uuid=${coUuid}`
      ),
    ]);

    const previousInvoiceQuantities = previousAggCo.lineQuantities;
    const items = Array.isArray(itemsResponse?.data) ? itemsResponse.data : [];
    
    // Check if we have saved invoice items for this invoice
    let savedInvoiceItems: any[] = [];
    if (props.form.uuid && props.form.co_invoice_items && Array.isArray(props.form.co_invoice_items)) {
      savedInvoiceItems = props.form.co_invoice_items;
    }
    
    // Create a map of saved invoice items by co_item_uuid for quick lookup
    const invoiceItemsMap = new Map<string, any>();
    savedInvoiceItems.forEach((invoiceItem: any) => {
      if (invoiceItem.co_item_uuid) {
        invoiceItemsMap.set(invoiceItem.co_item_uuid, invoiceItem);
      }
    });
    
    // Map items to the format expected by COItemsTableFromOriginal
    // Original values: unit_price, quantity, total (from PO)
    // CO values: co_unit_price, co_quantity, co_total
    // Invoice values: invoice_unit_price, invoice_quantity, invoice_total
    const preferredItems = preferredItemOptions.value;
    const preferredItemOptionMap = new Map<string, any>();
    preferredItems.forEach((opt) => {
      preferredItemOptionMap.set(String(opt.value), opt);
    });

    const mappedItems = items.map((item: any, index: number) => {
      const coItemUuid = item.uuid;
      const savedInvoiceItem = invoiceItemsMap.get(coItemUuid);
      
      // Extract metadata (cost code info might be in metadata)
      const metadata = item.metadata || item.display_metadata || item.displayMetadata || {};
      const display = item.display_metadata || metadata || {};
      
      // Fetch sequence from cost code configurations store using item_uuid (similar to ChangeOrderForm)
      const itemUuid =
        item.item_uuid ||
        metadata.item_uuid ||
        metadata.preferred_item_uuid ||
        null;
      const itemFromStore = itemUuid ? costCodeConfigurationsStore.getItemById(itemUuid) : null;
      const sequence =
        itemFromStore?.item_sequence ||
        item.item_sequence ||
        item.sequence ||
        metadata.item_sequence ||
        metadata.sequence ||
        null;
      const preferredItemRaw = itemUuid ? preferredItemOptionMap.get(String(itemUuid))?.raw : null;
      const resolvedItemTypeUuid =
        item.item_type_uuid ||
        metadata.item_type_uuid ||
        preferredItemRaw?.item_type_uuid ||
        null;
      const itemTypeObj = resolvedItemTypeUuid
        ? (scopedItemTypes.value || []).find(
            (it: any) =>
              String(it?.uuid || it?.value || it?.item_type_uuid || "") ===
              String(resolvedItemTypeUuid)
          )
        : null;
      const category =
        item.category ||
        metadata.category ||
        preferredItemRaw?.category ||
        itemTypeObj?.category ||
        null;
      const itemDivisionUuid =
        item.item_division_uuid ||
        metadata.item_division_uuid ||
        preferredItemRaw?.item_division_uuid ||
        itemTypeObj?.item_division_uuid ||
        null;
      const divisionName =
        item.division_name ||
        metadata.division_name ||
        preferredItemRaw?.division_name ||
        itemTypeObj?.division_name ||
        itemTypeObj?.division?.division_name ||
        '';
      const itemTypeLabel =
        item.item_type_label ||
        metadata.item_type_label ||
        itemTypeObj?.item_type ||
        itemTypeObj?.label ||
        '';
      
      // Get cost code UUID from item or metadata
      const costCodeUuid = item.cost_code_uuid || metadata.cost_code_uuid || null;
      
      // Fetch cost code information from the cost code configurations store using cost_code_uuid
      // This is the primary source of truth for cost code information
      let costCodeNumber = '';
      let costCodeName = '';
      let costCodeLabel = null;
      
      if (costCodeUuid) {
        const costCodeConfig = costCodeConfigurationsStore.getConfigurationById(costCodeUuid);
        if (costCodeConfig) {
          // Use store values as primary source
          costCodeNumber = costCodeConfig.cost_code_number || '';
          costCodeName = costCodeConfig.cost_code_name || '';
          // Construct label from number + name
          costCodeLabel = [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim() || null;
        }
      }
      
      // Fallback to item/metadata values if store doesn't have them
      if (!costCodeNumber) {
        costCodeNumber = item.cost_code_number || metadata.cost_code_number || '';
      }
      if (!costCodeName) {
        costCodeName = item.cost_code_name || metadata.cost_code_name || '';
      }
      if (!costCodeLabel) {
        // Construct cost_code_label from item/metadata or constructed from number + name
        costCodeLabel = item.cost_code_label || 
          metadata.cost_code_label || 
          metadata.cost_code ||
          [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim() ||
          null;
      }
      
      return {
        id: item.uuid || item.id || `co-item-${index}`,
        co_item_uuid: coItemUuid, // Store reference to original CO item for saving
        cost_code_uuid: costCodeUuid,
        cost_code_label: costCodeLabel,
        cost_code_number: costCodeNumber,
        cost_code_name: costCodeName,
        item_type_uuid: resolvedItemTypeUuid,
        item_type_label: itemTypeLabel,
        category,
        item_division_uuid: itemDivisionUuid,
        division_name: divisionName,
        item_uuid: itemUuid,
        name:
          item.item_name ||
          item.name ||
          metadata.item_name ||
          metadata.name ||
          preferredItemRaw?.item_name ||
          preferredItemRaw?.name ||
          item.description ||
          '',
        description: item.description || '',
        model_number: item.model_number || '',
        sequence: sequence,
        location_uuid: item.location_uuid || null,
        location_label:
          item.location_label ||
          item.location ||
          display.location_label ||
          display.location_display ||
          null,
        location: (() => {
          const locationUuid = String(item.location_uuid || '').trim();
          const preferred = [
            item.location_label,
            item.location,
            display.location_label,
            display.location_display,
          ]
            .map((value: any) => (value == null ? '' : String(value).trim()))
            .find((value: string) => value.length > 0 && value !== locationUuid);
          if (preferred) return preferred;

          const allLocations = Array.isArray((locationsStore as any).getAll)
            ? (locationsStore as any).getAll
            : (locationsStore as any).locations || [];
          const storeMatch = allLocations.find(
            (loc: any) => String(loc?.uuid || '').trim() === locationUuid
          );
          if (storeMatch?.location_name) {
            return storeMatch.location_name;
          }

          return locationUuid;
        })(),
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || item.unit || '',
        // Original values (from PO). Orig Total = Orig Unit × Orig Qty, not backfilled.
        unit_price: item.unit_price ?? null,
        quantity: item.quantity ?? null,
        total:
          item.unit_price != null && item.quantity != null
            ? Number(item.unit_price) * Number(item.quantity)
            : (item.total ?? null),
        // CO values
        co_unit_price: item.co_unit_price || null,
        co_quantity: item.co_quantity || null,
        co_total: item.co_total || null,
        // For new invoices: show empty fields (null)
        // For existing invoices: 
        //   - If savedInvoiceItem exists: use its values (even if null/undefined)
        //   - If savedInvoiceItems exist but no match: use null (empty field)
        //   - If no savedInvoiceItems at all: fall back to CO values
        invoice_unit_price: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_unit_price !== undefined ? savedInvoiceItem.invoice_unit_price : null)
              : (savedInvoiceItems.length > 0 ? null : (item.co_unit_price ?? null)))
          : null,
        invoice_quantity: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_quantity !== undefined ? savedInvoiceItem.invoice_quantity : null)
              : (savedInvoiceItems.length > 0 ? null : (item.co_quantity ?? null)))
          : null,
        invoice_total: props.form.uuid 
          ? (savedInvoiceItem 
              ? (savedInvoiceItem.invoice_total !== undefined ? savedInvoiceItem.invoice_total : null)
              : (savedInvoiceItems.length > 0 ? null : (item.co_total ?? null)))
          : null,
        // Calculate "to be invoiced" quantity: CO quantity - sum of previously invoiced quantities
        to_be_invoiced: (() => {
          const coQty = parseFloat(String(item.co_quantity ?? 0)) || 0;
          const previouslyInvoiced = previousInvoiceQuantities.get(coItemUuid) || 0;
          const result = Math.max(0, coQty - previouslyInvoiced);
          return result;
        })(),
        approval_checks: item.approval_checks || [],
        options:
          (Array.isArray(item.options) && item.options.length > 0)
            ? item.options
            : preferredItems
      };
    });

    
    // Set loading to false BEFORE setting items to ensure component is ready
    coItemsLoading.value = false;
    
    // Wait for next tick to ensure component state is updated
    await nextTick();
    
    // Filter out items where to_be_invoiced is zero
    const filteredItems = mappedItems.filter((item: any) => {
      const toBeInvoiced = parseFloat(String(item.to_be_invoiced ?? 0)) || 0;
      return toBeInvoiced > 0;
    });
    
    // Create a completely new array with new object references to ensure Vue reactivity
    coItems.value = filteredItems.map((item) =>
      applyOrderCurrencyToVendorInvoiceLineItem(item, coResponse?.data),
    );
    
    // Immediately sync coItems to form.co_invoice_items for saving
    // This ensures the data is available even if the watcher hasn't fired yet
    if (isAgainstCO.value && coItems.value.length > 0) {
      const coInvoiceItems = coItems.value.map((item: any, index: number) => ({
        order_index: index,
        co_item_uuid: item.co_item_uuid || item.id || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        category: item.category || null,
        item_division_uuid: item.item_division_uuid || null,
        division_name: item.division_name || null,
        item_type_uuid: item.item_type_uuid || null,
        item_type_label: item.item_type_label || '',
        item_uuid: item.item_uuid || null,
        item_name: item.item_name || item.name || item.description || '',
        description: item.description || '',
        model_number: item.model_number || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location || item.location_label || null,
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
        // Use the invoice values from the mapped items (which are already set correctly based on new vs existing invoice)
        invoice_quantity: item.invoice_quantity !== undefined ? item.invoice_quantity : null,
        invoice_unit_price: item.invoice_unit_price !== undefined ? item.invoice_unit_price : null,
        invoice_total: item.invoice_total !== undefined ? item.invoice_total : null,
        metadata: item.metadata || {}
      }));
      
      // Update form with co_invoice_items
      isUpdatingCOInvoiceItems.value = true;
      try {
        handleFormUpdate('co_invoice_items', coInvoiceItems);
      } finally {
        await nextTick();
        isUpdatingCOInvoiceItems.value = false;
      }
    }
    
    // Extract location-wise material items from CO if present
    const coLwmRawItems = coResponse?.data?.co_location_wise_material_items;
    if (Array.isArray(coLwmRawItems) && coLwmRawItems.length > 0) {
      coLwmItemsLoading.value = true;
      const savedLwmItems: any[] =
        props.form.uuid && Array.isArray(props.form.co_lwm_invoice_items)
          ? props.form.co_lwm_invoice_items
          : [];

      // Build lookup maps: by co_lwm_uuid, and fallback by cost_code+location for legacy records
      const savedByUuid = new Map<string, any>();
      const savedByKey = new Map<string, any>();
      savedLwmItems.forEach((si: any) => {
        if (si.co_lwm_uuid) {
          savedByUuid.set(si.co_lwm_uuid, si);
        } else {
          const key = `${si.cost_code_uuid || ''}|${si.location_uuid || ''}`;
          savedByKey.set(key, si);
        }
      });

      const previousLwmAmounts = previousAggCo.lwmAmounts;

      const mappedLwm = coLwmRawItems.map((lwm: any, idx: number) => {
        const lwmUuid = lwm.uuid || null;
        const saved = lwmUuid
          ? savedByUuid.get(lwmUuid)
          : null;
        const fallbackKey = `${lwm.cost_code_uuid || ''}|${lwm.location_uuid || ''}`;
        const savedFallback = !saved ? savedByKey.get(fallbackKey) : null;
        const matchedSaved = saved || savedFallback;

        const prevInvoiced = (lwmUuid ? previousLwmAmounts.get(lwmUuid) : 0) || 0;
        const invoiceAmt = props.form.uuid && matchedSaved
            ? (matchedSaved.invoice_amount !== undefined ? matchedSaved.invoice_amount : null)
            : null;
        return {
          co_lwm_uuid: lwmUuid,
          cost_code_uuid: lwm.cost_code_uuid || null,
          cost_code_label: lwm.cost_code_label || null,
          cost_code_number: lwm.cost_code_number || '',
          cost_code_name: lwm.cost_code_name || '',
          division_name: lwm.division_name || '',
          location_uuid: lwm.location_uuid || null,
          location_label: lwm.location_label || '',
          material_budgeted_amount: parseFloat(String(lwm.material_budgeted_amount || 0)) || 0,
          po_amount: parseFloat(String(lwm.po_amount || 0)) || 0,
          co_amount: parseFloat(String(lwm.co_amount || 0)) || 0,
          previously_invoiced: prevInvoiced,
          invoice_amount: invoiceAmt,
          description: lwm.description || '',
          metadata: lwm.metadata || {},
        };
      });

      // Avoid clobbering any in-flight edits/manual assignments.
      if (coLwmItems.value.length === 0) {
        coLwmItems.value = mappedLwm;
      }
      coLwmItemsLoading.value = false;

      if (isAgainstCO.value && coLwmItems.value.length > 0) {
        const lwmInvoiceItems = coLwmItems.value.map((item: any, index: number) => ({
          order_index: index,
          co_lwm_uuid: item.co_lwm_uuid || null,
          cost_code_uuid: item.cost_code_uuid || null,
          cost_code_label: item.cost_code_label || null,
          cost_code_number: item.cost_code_number || '',
          cost_code_name: item.cost_code_name || '',
          division_name: item.division_name || '',
          location_uuid: item.location_uuid || null,
          location_label: item.location_label || '',
          material_budgeted_amount: item.material_budgeted_amount,
          po_amount: item.po_amount,
          co_amount: item.co_amount,
          invoice_amount: item.invoice_amount ?? 0,
          description: item.description || '',
          metadata: item.metadata || {},
        }));
        isUpdatingCoLwmInvoiceItems.value = true;
        try {
          handleFormUpdate('co_lwm_invoice_items', lwmInvoiceItems);
        } finally {
          await nextTick();
          isUpdatingCoLwmInvoiceItems.value = false;
        }
      }
    } else {
      // Only clear if nothing else populated the list while we were fetching.
      if (coLwmItems.value.length === 0) {
        coLwmItems.value = [];
      }
    }

    coItemsKey.value += 1;
    await nextTick();
    
    // Populate financial breakdown from CO if available
    if (coResponse?.data) {
      const co = coResponse.data;
      
      let coFinancialBreakdown = co.financial_breakdown || co.financialBreakdown;
      
      // If financial_breakdown is a string, parse it
      if (typeof coFinancialBreakdown === 'string') {
        try {
          coFinancialBreakdown = JSON.parse(coFinancialBreakdown);
        } catch (e) {
          console.warn('[VendorInvoiceForm] Failed to parse financial_breakdown string:', e);
          coFinancialBreakdown = null;
        }
      }
      
      // If no financial breakdown JSON, build it from individual fields
      if (!coFinancialBreakdown || (typeof coFinancialBreakdown === 'object' && Object.keys(coFinancialBreakdown).length === 0)) {
        coFinancialBreakdown = {
          charges: {
            freight: {
              percentage: co.freight_charges_percentage ?? null,
              amount: co.freight_charges_amount ?? null,
              taxable: co.freight_charges_taxable ?? false
            },
            packing: {
              percentage: co.packing_charges_percentage ?? null,
              amount: co.packing_charges_amount ?? null,
              taxable: co.packing_charges_taxable ?? false
            },
            custom_duties: {
              percentage: co.custom_duties_charges_percentage ?? null,
              amount: co.custom_duties_charges_amount ?? null,
              taxable: co.custom_duties_charges_taxable ?? false
            },
            other: {
              percentage: co.other_charges_percentage ?? null,
              amount: co.other_charges_amount ?? null,
              taxable: co.other_charges_taxable ?? false
            }
          },
          sales_taxes: {
            sales_tax_1: {
              percentage: co.sales_tax_1_percentage ?? null,
              amount: co.sales_tax_1_amount ?? null
            },
            sales_tax_2: {
              percentage: co.sales_tax_2_percentage ?? null,
              amount: co.sales_tax_2_amount ?? null
            }
          },
          totals: {
            // Always use invoice values (coItemsTotal) instead of CO values (co.item_total)
            // coItemsTotal is calculated from invoice_unit_price * invoice_quantity
            item_total: coItemsTotal.value ?? null,
            charges_total: co.charges_total ?? null,
            tax_total: co.tax_total ?? null,
            total_co_amount: co.total_co_amount ?? null
          }
        };
      }
      
      if (coFinancialBreakdown && typeof coFinancialBreakdown === 'object') {
        // For existing invoices, check if there's a saved financial breakdown
        // If there is, use the saved charges and taxes instead of CO values
        let savedFinancialBreakdown = null;
        if (props.form.uuid) {
          // This is an existing invoice - check for saved financial breakdown
          savedFinancialBreakdown = props.form.financial_breakdown;
          if (typeof savedFinancialBreakdown === 'string') {
            try {
              savedFinancialBreakdown = JSON.parse(savedFinancialBreakdown);
            } catch (e) {
              console.warn('[VendorInvoiceForm] Failed to parse saved financial_breakdown:', e);
              savedFinancialBreakdown = null;
            }
          }
        }
        
        // Use saved financial breakdown if available (for existing invoices with saved charges/taxes)
        // Otherwise, use CO financial breakdown (for new invoices or invoices without saved values)
        // Only use saved if it has charges or sales_taxes defined (not just totals)
        const hasSavedChargesOrTaxes = savedFinancialBreakdown && typeof savedFinancialBreakdown === 'object' && 
          (savedFinancialBreakdown.charges || savedFinancialBreakdown.sales_taxes);
        
        // If we have saved financial breakdown with charges/taxes, use it
        // Otherwise, use CO financial breakdown
        let sourceFinancialBreakdown = coFinancialBreakdown;
        if (hasSavedChargesOrTaxes) {
          sourceFinancialBreakdown = savedFinancialBreakdown;
        }
        
        // Deep clone the financial breakdown to avoid mutating the original
        const financialBreakdown = JSON.parse(JSON.stringify(sourceFinancialBreakdown));
        
        // If we're using saved financial breakdown, ensure we preserve all saved totals
        // Merge in any missing structure from CO breakdown, but preserve saved values
        if (hasSavedChargesOrTaxes && coFinancialBreakdown) {
          // Ensure we have the full structure, but preserve saved values
          if (!financialBreakdown.totals && coFinancialBreakdown.totals) {
            financialBreakdown.totals = { ...coFinancialBreakdown.totals };
          } else if (financialBreakdown.totals && coFinancialBreakdown.totals) {
            // Merge: saved totals take precedence, but fill in missing fields from CO
            financialBreakdown.totals = {
              ...coFinancialBreakdown.totals,
              ...financialBreakdown.totals, // Saved totals override CO totals
            };
          }
        }
        
        // Ensure the structure matches what FinancialBreakdown expects
        if (!financialBreakdown.charges) {
          financialBreakdown.charges = {
            freight: { percentage: null, amount: null, taxable: false },
            packing: { percentage: null, amount: null, taxable: false },
            custom_duties: { percentage: null, amount: null, taxable: false },
            other: { percentage: null, amount: null, taxable: false },
          };
        }
        
        if (!financialBreakdown.sales_taxes) {
          financialBreakdown.sales_taxes = {
            sales_tax_1: { percentage: null, amount: null },
            sales_tax_2: { percentage: null, amount: null },
          };
        }
        
        if (!financialBreakdown.totals) {
          financialBreakdown.totals = {
            item_total: null,
            charges_total: null,
            tax_total: null,
            total_co_amount: null,
          };
        }
        
        // Update totals with CO items total (from invoice values) if not already set
        // For existing invoices with saved financial breakdown, preserve the saved totals
        // For new invoices or invoices without saved totals, use coItemsTotal
        // coItemsTotal is calculated from invoice_unit_price * invoice_quantity (or invoice_total)
        if (hasSavedChargesOrTaxes && financialBreakdown.totals.item_total !== null && financialBreakdown.totals.item_total !== undefined) {
          // Preserve saved item_total from the invoice's financial breakdown
          // Don't overwrite it
        } else if (!financialBreakdown.totals.item_total && coItemsTotal.value > 0) {
          // Only update if not already set and we have invoice items total
          financialBreakdown.totals.item_total = coItemsTotal.value;
        }
        
        // DO NOT map total_co_amount to total_invoice_amount
        // total_invoice_amount should only be calculated from invoice item values + charges + taxes
        // The FinancialBreakdown component will calculate total_invoice_amount automatically
        // We keep total_co_amount for reference only
        
        // Flatten the financial breakdown structure for the form
        const updatedForm = { ...props.form };
        
        // Explicitly preserve change_order_uuid and other critical fields
        const preservedFields = {
          change_order_uuid: coUuid || props.form.change_order_uuid || null,
          purchase_order_uuid: props.form.purchase_order_uuid,
          po_co_uuid: props.form.po_co_uuid,
          po_number: props.form.po_number,
          co_number: props.form.co_number,
          invoice_type: props.form.invoice_type,
          project_uuid: props.form.project_uuid,
          vendor_uuid: props.form.vendor_uuid,
          corporation_uuid: (() => {
            const cur = props.form.corporation_uuid;
            if (cur != null && String(cur).trim() !== "") return String(cur).trim();
            return corporationUuidSnapshot || null;
          })(),
        };
        
        // Update financial_breakdown object
        updatedForm.financial_breakdown = financialBreakdown;
        
        // Explicitly preserve critical fields
        Object.assign(updatedForm, preservedFields);
        
        // Flatten charge fields
        if (financialBreakdown.charges) {
          updatedForm.freight_charges_percentage = financialBreakdown.charges.freight?.percentage ?? null;
          updatedForm.freight_charges_amount = financialBreakdown.charges.freight?.amount ?? null;
          updatedForm.freight_charges_taxable = financialBreakdown.charges.freight?.taxable ?? false;
          
          updatedForm.packing_charges_percentage = financialBreakdown.charges.packing?.percentage ?? null;
          updatedForm.packing_charges_amount = financialBreakdown.charges.packing?.amount ?? null;
          updatedForm.packing_charges_taxable = financialBreakdown.charges.packing?.taxable ?? false;
          
          updatedForm.custom_duties_charges_percentage = financialBreakdown.charges.custom_duties?.percentage ?? null;
          updatedForm.custom_duties_charges_amount = financialBreakdown.charges.custom_duties?.amount ?? null;
          updatedForm.custom_duties_charges_taxable = financialBreakdown.charges.custom_duties?.taxable ?? false;
          
          updatedForm.other_charges_percentage = financialBreakdown.charges.other?.percentage ?? null;
          updatedForm.other_charges_amount = financialBreakdown.charges.other?.amount ?? null;
          updatedForm.other_charges_taxable = financialBreakdown.charges.other?.taxable ?? false;
        }
        
        // Flatten sales tax fields
        if (financialBreakdown.sales_taxes) {
          updatedForm.sales_tax_1_percentage = financialBreakdown.sales_taxes.sales_tax_1?.percentage ?? null;
          updatedForm.sales_tax_1_amount = financialBreakdown.sales_taxes.sales_tax_1?.amount ?? null;
          
          updatedForm.sales_tax_2_percentage = financialBreakdown.sales_taxes.sales_tax_2?.percentage ?? null;
          updatedForm.sales_tax_2_amount = financialBreakdown.sales_taxes.sales_tax_2?.amount ?? null;
        }
        
        // Flatten totals fields
        if (financialBreakdown.totals) {
          updatedForm.item_total = financialBreakdown.totals.item_total ?? null;
          updatedForm.charges_total = financialBreakdown.totals.charges_total ?? null;
          updatedForm.tax_total = financialBreakdown.totals.tax_total ?? null;
        }
        
        // For existing invoices (Against CO):
        // Since we fetched advance payment BEFORE building financial breakdown,
        // the FinancialBreakdown component will automatically recalculate with:
        // - item_total (from saved invoice values via coItemsTotal)
        // - charges and taxes (from saved financial breakdown)
        // - current advance payment (coAdvancePaid - fetched above)
        // - current holdback (coHoldbackAmount)
        // So we don't need to clear or manipulate the amount - just let it flow naturally
        
        updatedForm.financial_breakdown = financialBreakdown
        
        // Emit the complete updated form with all flattened fields
        emit('update:form', updatedForm);
      } else {
        console.warn('[VendorInvoiceForm] No valid financial breakdown found in CO');
      }
    } else {
      console.warn('[VendorInvoiceForm] No CO data received from API');
    }
  } catch (error) {
    console.error('[VendorInvoiceForm] Error fetching CO items:', error);
    coItemsError.value = 'Failed to load change order items';
    coItems.value = [];
    coLwmItems.value = [];
  } finally {
    coItemsLoading.value = false;
  }
};

// Fetch labor invoice items for advance payment invoices
const fetchLaborInvoiceItems = async (entityUuid: string, entityType: 'purchase_order' | 'change_order', forValidation = false) => {
  laborInvoiceItemsLoading.value = true;
  laborInvoiceItemsError.value = null;

  if (entityType === 'change_order') {
    coItems.value = [];
    coLwmItems.value = [];
  } else {
    poItems.value = [];
    poLwmItems.value = [];
  }

  try {
    // Use API endpoint to fetch labor invoice items
    const queryParams: Record<string, string> = entityType === 'purchase_order'
      ? { purchase_order_uuid: entityUuid }
      : { change_order_uuid: entityUuid };

    // If editing existing invoice, include current invoice UUID to get merged data
    if (props.form.uuid) {
      queryParams.vendor_invoice_uuid = props.form.uuid;
    }

    const response = await $fetch<{ data: any[] }>(`/api/labor-invoice-items`, {
      method: 'GET',
      query: queryParams,
    });

    let items = Array.isArray(response?.data) ? response.data : [];

    // Extract unique cost code UUIDs and fetch fresh cost code details
    const costCodeUuids = [...new Set(items.map((item: any) => item.cost_code_uuid).filter(Boolean))];
    if (costCodeUuids.length > 0) {
      const costCodeDetails = await fetchCostCodeDetails(costCodeUuids);

      // Enrich items with fresh cost code information
      items = items.map((item: any) => {
        const costCode = item.cost_code_uuid ? costCodeDetails[item.cost_code_uuid] : null;

        return {
          ...item,
          // Override stored cost code info with fresh data
          cost_code_label: costCode ? `${costCode.cost_code_number || ''} - ${costCode.cost_code_name || ''}`.trim() : item.cost_code_label,
          cost_code_number: costCode ? costCode.cost_code_number : item.cost_code_number,
          cost_code_name: costCode ? costCode.cost_code_name : item.cost_code_name,
          division_name: costCode ? costCode.division_name : item.division_name,
        };
      });
    }

    // Always calculate remaining amounts based on previously invoiced amounts
    if (!forValidation) {
      const previouslyInvoicedAmounts = await fetchPreviouslyInvoicedLaborAmounts(entityUuid, entityType, props.form.uuid);

      // Calculate remaining amounts for each item
      items = items.map((item: any) => {
        // Calculate original amount the same way as LaborInvoiceItemsTable component
        let originalAmount = 0
        if (item.original_amount !== undefined && item.original_amount !== null) {
          originalAmount = parseFloat(item.original_amount) || 0
        } else if (item.co_amount !== undefined && item.co_amount !== null) {
          const coAmount = parseFloat(item.co_amount || '0') || 0
          if (entityType === 'change_order') {
            // Against a labor CO: bill the CO delta per row (co_amount). po_amount is the base PO slice, not additive per location line.
            originalAmount = coAmount
          } else {
            const poAmount = parseFloat(item.po_amount || '0') || 0
            originalAmount = poAmount + coAmount
          }
        } else if (item.po_amount !== undefined && item.po_amount !== null) {
          // For PO items, use po_amount
          originalAmount = parseFloat(item.po_amount) || 0
        } else {
          // Fallback to labor_budgeted_amount
          originalAmount = parseFloat(item.labor_budgeted_amount || '0') || 0
        }

        const itemKey = getLaborInvoiceAggregationKey(item);
        const fallbackCostCodeKey = item.cost_code_uuid || '';
        const hasLocation = Boolean(item.location_uuid || item.location_label);
        const hasLineRef = Boolean(item.labor_co_item_uuid || item.labor_po_item_uuid);
        const costLocationKey =
          item.cost_code_uuid && item.location_uuid
            ? `${item.cost_code_uuid}|${item.location_uuid}`
            : '';
        const fromLineKey = previouslyInvoicedAmounts[itemKey];
        const fromCostLoc = costLocationKey ? previouslyInvoicedAmounts[costLocationKey] : undefined;
        const fromCostOnly =
          !hasLocation && !hasLineRef ? previouslyInvoicedAmounts[fallbackCostCodeKey] : undefined;
        const alreadyInvoiced =
          fromLineKey ?? fromCostLoc ?? fromCostOnly ?? 0;
        const remainingAmount = Math.max(0, originalAmount - alreadyInvoiced);

        return {
          ...item,
          original_amount: originalAmount,
          already_invoiced: alreadyInvoiced,
          remaining_amount: remainingAmount,
        };
      });

      // For new invoices, filter out items with zero remaining amount
      if (!props.form.uuid) {
        items = items.filter((item: any) => item.remaining_amount > 0);
      }
    }

    if (entityType === 'change_order' && !forValidation) {
      await loadCoAdvancePaidForChangeOrder(entityUuid);
    }

    laborInvoiceItems.value = items;
  } catch (error: any) {
    console.error('[VendorInvoiceForm] Error in fetchLaborInvoiceItems:', error);
    laborInvoiceItemsError.value = error.message || 'Failed to load labor invoice items';
    laborInvoiceItems.value = [];
  } finally {
    laborInvoiceItemsLoading.value = false;
  }
};

/** Fetch PO lines vs labor lines from API by po_type (Against PO). */
const syncAgainstPoDataIfNeeded = async (poUuid: string | null | undefined) => {
  if (!poUuid || !isAgainstPO.value) return;
  try {
    poLwmItems.value = [];
    poLwmItemsLoading.value = false;
    const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
    const fetchedPoType = poResponse?.data?.po_type?.toUpperCase() || null;
    poType.value = fetchedPoType;
    if (fetchedPoType === 'LABOR') {
      poItems.value = [];
      poItemsError.value = null;
      await fetchLaborInvoiceItems(poUuid, 'purchase_order');
    } else {
      await fetchPOItems(poUuid);
    }
  } catch (error) {
    console.warn('[VendorInvoiceForm] Could not fetch PO type:', error);
    poType.value = null;
    await fetchPOItems(poUuid);
  }
};

/** Fetch CO lines vs labor lines from API by co_type (Against CO). */
const syncAgainstCoDataIfNeeded = async (coUuid: string | null | undefined) => {
  if (!coUuid || !isAgainstCO.value) return;
  try {
    coLwmItems.value = [];
    coLwmItemsLoading.value = false;
    const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
    const fetchedCoType = coResponse?.data?.co_type?.toUpperCase() || null;
    coType.value = fetchedCoType;
    if (fetchedCoType === 'LABOR') {
      coItems.value = [];
      coItemsError.value = null;
      await fetchLaborInvoiceItems(coUuid, 'change_order');
    } else {
      await fetchCOItems(coUuid);
    }
  } catch (error) {
    console.warn('[VendorInvoiceForm] Could not fetch CO type:', error);
    coType.value = null;
    await fetchCOItems(coUuid);
  }
};

// PO/CO selection: determine labor vs material and fetch the correct dataset (also runs on mount for existing invoices)
watch(
  [() => props.form.purchase_order_uuid, () => props.form.change_order_uuid],
  async ([newPurchaseOrderUuid, newChangeOrderUuid], [oldPurchaseOrderUuid, oldChangeOrderUuid]) => {
    if (isUpdatingFromPOCOSelect.value) {
      return;
    }
    if (newPurchaseOrderUuid && newPurchaseOrderUuid !== oldPurchaseOrderUuid) {
      if (isAgainstPO.value) {
        await syncAgainstPoDataIfNeeded(newPurchaseOrderUuid);
      }
    }
    if (newChangeOrderUuid && newChangeOrderUuid !== oldChangeOrderUuid) {
      if (isAgainstCO.value) {
        await syncAgainstCoDataIfNeeded(newChangeOrderUuid);
      }
    }
    if (!newPurchaseOrderUuid && oldPurchaseOrderUuid) {
      poType.value = null;
      poItems.value = [];
      poItemsError.value = null;
      poItemsKey.value += 1;
      poLwmItems.value = [];
      poLwmItemsLoading.value = false;
      laborInvoiceItems.value = [];
    }
    if (!newChangeOrderUuid && oldChangeOrderUuid) {
      coType.value = null;
      coItems.value = [];
      coItemsError.value = null;
      coItemsKey.value += 1;
      coLwmItems.value = [];
      coLwmItemsLoading.value = false;
      laborInvoiceItems.value = [];
    }
  },
  { immediate: true }
);

// Handle labor invoice amount changes
const handleLaborInvoiceAmountChange = (index: number, value: string | null) => {
  // Set flag to prevent watcher from interfering
  isUpdatingLaborInvoiceItems.value = true;

  try {
    const items = [...laborInvoiceItems.value];
    if (items[index]) {
      const numericValue = value === null || value === undefined || value === ''
        ? null
        : parseFloat(value);

      items[index] = {
        ...items[index],
        invoice_amount: isNaN(numericValue!) ? null : numericValue
      };
      laborInvoiceItems.value = items;

      // Emit form update to include labor invoice items
      const updatedForm = { ...props.form };
      updatedForm.labor_invoice_items = items;
      emit('update:form', updatedForm);
    }
  } finally {
    // Reset flag after next tick to allow normal updates
    nextTick(() => {
      isUpdatingLaborInvoiceItems.value = false;
    });
  }
};

// Handle update:model-value event (string value like "PO:uuid" or "CO:uuid")
const handlePOCOModelValue = (value: string | undefined) => {
  // Just update the po_co_uuid for the component binding
  // The actual UUID extraction will be handled by handlePOCOChange
  handleFormUpdate('po_co_uuid', value || null);
}

const resetPoCoDependentState = (updatedForm: any, opts?: { clearAdvance?: boolean; clearHoldback?: boolean }) => {
  // Clear rendered table state immediately to avoid showing stale rows while new selection loads.
  poItems.value = [];
  coItems.value = [];
  poLwmItems.value = [];
  coLwmItems.value = [];
  laborInvoiceItems.value = [];
  poItemsError.value = null;
  coItemsError.value = null;
  poType.value = null;
  coType.value = null;
  poAdvancePaid.value = 0;
  coAdvancePaid.value = 0;
  poItemsKey.value += 1;
  coItemsKey.value += 1;

  // Clear persisted line arrays tied to selected PO/CO.
  updatedForm.po_invoice_items = [];
  updatedForm.co_invoice_items = [];
  updatedForm.po_lwm_invoice_items = [];
  updatedForm.co_lwm_invoice_items = [];
  updatedForm.labor_invoice_items = [];

  if (opts?.clearAdvance) {
    updatedForm.advance_payment_cost_codes = [];
    updatedForm.removed_advance_payment_cost_codes = [];
    updatedForm.adjusted_advance_payment_amounts = {};
    updatedForm.adjusted_advance_payment_uuid = null;
    adjustedAdvancePaymentAmounts.value = {};
  }

  if (opts?.clearHoldback) {
    updatedForm.holdback_cost_codes = [];
    holdbackReleaseAmountTotal.value = 0;
  }
};

// Handle POCO change specifically for Against PO invoices
const handlePOCOChangeForPO = async (value: any) => {
  // Set flag to prevent watcher from interfering
  isUpdatingFromPOCOSelect.value = true;
  
  try {
    // Extract PO UUID from the value
    if (!value || typeof value !== 'object') {
      const updatedForm = { ...props.form };
      updatedForm.purchase_order_uuid = null;
      updatedForm.po_number = '';
      updatedForm.po_co_uuid = null;
      resetPoCoDependentState(updatedForm, {
        clearAdvance: isAgainstAdvancePayment.value,
        clearHoldback: isAgainstHoldback.value,
      });
      emit('update:form', updatedForm);
      return;
    }
    
    const optionValue = value.value; // This should be "PO:uuid"
    const optionOrder = value.order; // The full PO object
    
    if (optionValue && typeof optionValue === 'string' && optionValue.startsWith('PO:')) {
      const extractedUuid = optionValue.replace(/^PO:/, '').trim();
      if (extractedUuid && extractedUuid.length > 0) {
        // Update all fields in a single form update to ensure consistency
        const updatedForm = { ...props.form };
        const selectionChanged =
          (updatedForm.po_co_uuid || null) !== optionValue ||
          (updatedForm.purchase_order_uuid || null) !== extractedUuid;
        updatedForm.purchase_order_uuid = extractedUuid;
        updatedForm.po_co_uuid = optionValue;
        
        // Extract PO number
        if (optionOrder) {
          updatedForm.po_number = optionOrder.po_number || value.number || '';
        } else {
          updatedForm.po_number = value.number || '';
        }
        if (selectionChanged) {
          resetPoCoDependentState(updatedForm, {
            clearAdvance: isAgainstAdvancePayment.value,
            clearHoldback: isAgainstHoldback.value,
          });
        }
        
        emit('update:form', updatedForm);
        
        if (isAgainstPO.value) {
          await syncAgainstPoDataIfNeeded(extractedUuid);
        }
      }
    } else {
      const updatedForm = { ...props.form };
      updatedForm.purchase_order_uuid = null;
      updatedForm.po_number = '';
      updatedForm.po_co_uuid = null;
      resetPoCoDependentState(updatedForm, {
        clearAdvance: isAgainstAdvancePayment.value,
        clearHoldback: isAgainstHoldback.value,
      });
      emit('update:form', updatedForm);
    }
  } finally {
    // Reset flag after updates are complete
    await nextTick();
    isUpdatingFromPOCOSelect.value = false;
  }
}

// Handle POCO change specifically for Against CO invoices
const handlePOCOChangeForCO = async (value: any) => {
  // Set flag to prevent watcher from interfering
  isUpdatingFromPOCOSelect.value = true;
  
  try {
    // Extract CO UUID from the value
    if (!value || typeof value !== 'object') {
      const updatedForm = { ...props.form };
      updatedForm.change_order_uuid = null;
      updatedForm.co_number = '';
      updatedForm.po_co_uuid = null;
      resetPoCoDependentState(updatedForm, {
        clearAdvance: isAgainstAdvancePayment.value,
        clearHoldback: isAgainstHoldback.value,
      });
      emit('update:form', updatedForm);
      return;
    }
    
    const optionValue = value.value; // This should be "CO:uuid"
    const optionOrder = value.order; // The full CO object
    
    if (optionValue && typeof optionValue === 'string' && optionValue.startsWith('CO:')) {
      const extractedUuid = optionValue.replace(/^CO:/, '').trim();
      if (extractedUuid && extractedUuid.length > 0) {
        // Update all fields in a single form update to ensure consistency
        const updatedForm = { ...props.form };
        const selectionChanged =
          (updatedForm.po_co_uuid || null) !== optionValue ||
          (updatedForm.change_order_uuid || null) !== extractedUuid;
        updatedForm.change_order_uuid = extractedUuid;
        updatedForm.po_co_uuid = optionValue;
        
        // Extract CO number
        if (optionOrder) {
          updatedForm.co_number = optionOrder.co_number || value.number || '';
        } else {
          updatedForm.co_number = value.number || '';
        }
        if (selectionChanged) {
          resetPoCoDependentState(updatedForm, {
            clearAdvance: isAgainstAdvancePayment.value,
            clearHoldback: isAgainstHoldback.value,
          });
        }
        
        emit('update:form', updatedForm);
        
        if (isAgainstCO.value) {
          await syncAgainstCoDataIfNeeded(extractedUuid);
        }
      }
    } else {
      const updatedForm = { ...props.form };
      updatedForm.change_order_uuid = null;
      updatedForm.co_number = '';
      updatedForm.po_co_uuid = null;
      resetPoCoDependentState(updatedForm, {
        clearAdvance: isAgainstAdvancePayment.value,
        clearHoldback: isAgainstHoldback.value,
      });
      emit('update:form', updatedForm);
    }
  } finally {
    // Reset flag after updates are complete
    await nextTick();
    isUpdatingFromPOCOSelect.value = false;
  }
}

// Handle change event (full option object with all details)
const handlePOCOChange = (value: any) => {
  // The value from change event is an object with { value: "PO:uuid" or "CO:uuid", order: {...}, type: "PO" or "CO", ... }
  if (!value || typeof value !== 'object') {
    // If value is cleared/undefined, clear everything
    const updatedForm = { ...props.form };
    updatedForm.po_co_uuid = null;
    updatedForm.purchase_order_uuid = null;
    updatedForm.change_order_uuid = null;
    updatedForm.po_number = '';
    updatedForm.co_number = '';
    if (isAgainstAdvancePayment.value) {
      // Reset distribution rows so stale PO/CO data does not remain visible.
      updatedForm.advance_payment_cost_codes = [];
      updatedForm.removed_advance_payment_cost_codes = [];
      updatedForm.adjusted_advance_payment_amounts = {};
      updatedForm.adjusted_advance_payment_uuid = null;
      adjustedAdvancePaymentAmounts.value = {};
    }
    emit('update:form', updatedForm);
    return;
  }
  
  const optionValue = value.value; // This should be "PO:uuid" or "CO:uuid"
  const optionType = value.type; // This should be "PO" or "CO"
  const optionOrder = value.order; // The full PO or CO object
  
  let poCoUuid = '';
  let poNumber = '';
  let coNumber = '';
  let purchaseOrderUuid: string | null = null;
  let changeOrderUuid: string | null = null;
  
  // Extract UUIDs based on the option value
  if (optionValue && typeof optionValue === 'string' && optionValue.length > 0) {
    if (optionValue.startsWith('PO:')) {
      poCoUuid = optionValue;
      const extractedUuid = optionValue.replace(/^PO:/, '').trim();
      // Only set if we have a valid UUID (non-empty after removing prefix)
      if (extractedUuid && extractedUuid.length > 0) {
        purchaseOrderUuid = extractedUuid;
      } else {
        purchaseOrderUuid = null;
      }
      changeOrderUuid = null; // Clear change order when PO is selected
      
      // Extract PO number
      if (optionOrder) {
        poNumber = optionOrder.po_number || value.number || '';
      } else {
        poNumber = value.number || '';
      }
      coNumber = '';
    } else if (optionValue.startsWith('CO:')) {
      poCoUuid = optionValue;
      const extractedUuid = optionValue.replace(/^CO:/, '').trim();
      // Only set if we have a valid UUID (non-empty after removing prefix)
      if (extractedUuid && extractedUuid.length > 0) {
        changeOrderUuid = extractedUuid;
      } else {
        changeOrderUuid = null;
      }
      purchaseOrderUuid = null; // Clear purchase order when CO is selected
      
      // Extract CO number
      if (optionOrder) {
        coNumber = optionOrder.co_number || value.number || '';
      } else {
        coNumber = value.number || '';
      }
      poNumber = '';
    } else {
      console.warn('[VendorInvoiceForm] Invalid optionValue format:', optionValue);
    }
  } else {
    console.warn('[VendorInvoiceForm] Missing or invalid optionValue:', optionValue);
  }
  
  // Set flag to prevent watcher from interfering
  isUpdatingFromPOCOSelect.value = true;
  
  // Update all fields in a single form update to ensure consistency
  // This prevents race conditions where multiple handleFormUpdate calls might overwrite each other
  const updatedForm = { ...props.form };
  const selectionChanged =
    (updatedForm.po_co_uuid || null) !== (poCoUuid || null) ||
    (updatedForm.purchase_order_uuid || null) !== purchaseOrderUuid ||
    (updatedForm.change_order_uuid || null) !== changeOrderUuid;

  updatedForm.po_co_uuid = poCoUuid || null;
  updatedForm.purchase_order_uuid = purchaseOrderUuid;
  updatedForm.change_order_uuid = changeOrderUuid;
  updatedForm.po_number = poNumber;
  updatedForm.co_number = coNumber;
  if (isAgainstAdvancePayment.value && selectionChanged) {
    // Force recalculation from the newly selected PO/CO.
    updatedForm.advance_payment_cost_codes = [];
    updatedForm.removed_advance_payment_cost_codes = [];
    updatedForm.adjusted_advance_payment_amounts = {};
    updatedForm.adjusted_advance_payment_uuid = null;
    adjustedAdvancePaymentAmounts.value = {};
  }
  
  emit('update:form', updatedForm);
  
  // Reset flag after updates are complete
  nextTick(() => {
    isUpdatingFromPOCOSelect.value = false;
  });
};

const handleAmountChange = (value: string | null) => {
  let numericValue = 0;
  if (value !== null && value !== undefined && value !== '') {
    numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      numericValue = 0;
    }
  }
  
  handleFormUpdate('amount', numericValue);
  
  // If invoice type is AGAINST_ADVANCE_PAYMENT, also update financial_breakdown
  if (isAgainstAdvancePayment.value) {
    updateFinancialBreakdownForAdvancePayment(numericValue);
  }
};

const handleHoldbackChange = (value: string | null) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    handleFormUpdate('holdback', null);
    return;
  }
  const numericValue = parseFloat(String(value));
  if (Number.isNaN(numericValue)) {
    return;
  }
  const whole = Math.round(Math.max(0, numericValue));
  handleFormUpdate('holdback', whole);
};

/** Normalize legacy or imported holdback to a non-negative integer. */
watch(
  () => props.form.holdback,
  (h) => {
    if (h === null || h === undefined || h === '') return;
    const n = Number(h);
    if (!Number.isFinite(n)) return;
    const fixed = Math.round(Math.max(0, n));
    if (fixed !== n) {
      handleFormUpdate('holdback', fixed);
    }
  },
  { flush: 'post' }
);

// Fetch holdback invoice details to populate PO/CO number when loading existing invoice
const fetchHoldbackInvoiceDetails = async () => {
  if (isFetchingHoldbackInvoiceDetails.value) {
    return; // Prevent concurrent fetches
  }
  
  if (!props.form.holdback_invoice_uuid || !isAgainstHoldback.value) {
    return;
  }
  
  isFetchingHoldbackInvoiceDetails.value = true;
  
  try {
    // Fetch the holdback invoice to get its PO/CO UUID
    const invoiceResponse = await $fetch<{ data: any }>(`/api/vendor-invoices/${props.form.holdback_invoice_uuid}`);
    const holdbackInvoice = invoiceResponse?.data;
    
    if (!holdbackInvoice) {
      console.warn('[VendorInvoiceForm] No holdback invoice data returned');
      return;
    }
    
    const updatedForm = { ...props.form };
    
    // Determine if this is against PO or CO based on invoice type
    if (holdbackInvoice.invoice_type === 'AGAINST_PO' && holdbackInvoice.purchase_order_uuid) {
      const poUuid = holdbackInvoice.purchase_order_uuid;
      
      // Only update if not already set (to avoid overwriting)
      if (!updatedForm.purchase_order_uuid || updatedForm.purchase_order_uuid !== poUuid) {
        updatedForm.purchase_order_uuid = poUuid;
        updatedForm.po_co_uuid = `PO:${poUuid}`;
        updatedForm.change_order_uuid = null;
      }
      
      // Always get PO number from invoice, or fetch from PO if not available
      // This ensures we always have the PO number even if form already has an empty string
      let poNumber = holdbackInvoice.po_number || '';
      if (!poNumber && poUuid) {
        try {
          const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
          poNumber = poResponse?.data?.po_number || '';
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching PO number:', error);
        }
      }
      updatedForm.po_number = poNumber;
      updatedForm.co_number = '';
      
      // Also ensure po_co_uuid is set
      if (!updatedForm.po_co_uuid || updatedForm.po_co_uuid !== `PO:${poUuid}`) {
        updatedForm.po_co_uuid = `PO:${poUuid}`;
      }
      
    } else if (holdbackInvoice.invoice_type === 'AGAINST_CO' && holdbackInvoice.change_order_uuid) {
      const coUuid = holdbackInvoice.change_order_uuid;
      // Only update if not already set (to avoid overwriting)
      if (!updatedForm.change_order_uuid || updatedForm.change_order_uuid !== coUuid) {
        updatedForm.change_order_uuid = coUuid;
        updatedForm.po_co_uuid = `CO:${coUuid}`;
        updatedForm.purchase_order_uuid = null;
      }
      
      // Always get CO number from invoice, or fetch from CO if not available
      // This ensures we always have the CO number even if form already has an empty string
      let coNumber = holdbackInvoice.co_number || '';
      if (!coNumber && coUuid) {
        try {
          const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
          coNumber = coResponse?.data?.co_number || '';
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching CO number:', error);
        }
      }
      updatedForm.co_number = coNumber;
      updatedForm.po_number = '';
      
      // Also ensure po_co_uuid is set
      if (!updatedForm.po_co_uuid || updatedForm.po_co_uuid !== `CO:${coUuid}`) {
        updatedForm.po_co_uuid = `CO:${coUuid}`;
      }
      
    } else {
      console.warn('[VendorInvoiceForm] Invalid invoice type or missing UUID', {
        invoice_type: holdbackInvoice.invoice_type,
        purchase_order_uuid: holdbackInvoice.purchase_order_uuid,
        change_order_uuid: holdbackInvoice.change_order_uuid
      });
    }
    
    // Always emit update to ensure form is updated (even if values appear the same, they might be empty strings)
    emit('update:form', updatedForm);
  } catch (error) {
    console.error('[VendorInvoiceForm] Error fetching holdback invoice details:', error);
  } finally {
    isFetchingHoldbackInvoiceDetails.value = false;
  }
};

// Handle holdback invoice selection
const handleHoldbackSelection = async (invoice: any) => {
  if (!invoice || typeof invoice !== 'object' || !invoice.uuid) {
    return;
  }

  const corporationUuidSnapshot = snapshotVendorInvoiceCorporationUuid();
  
  // Set loading state IMMEDIATELY to show skeletons before any async operations
  loadingHoldbackData.value = true;
  
  const updatedForm = { ...props.form };
  const holdbackSelectionChanged =
    String(updatedForm.holdback_invoice_uuid || '') !== String(invoice.uuid || '');
  
  // Store the holdback invoice UUID for the breakdown table
  updatedForm.holdback_invoice_uuid = invoice.uuid;
  if (holdbackSelectionChanged) {
    // Reset old holdback breakdown rows before loading the newly selected source.
    updatedForm.holdback_cost_codes = [];
    holdbackReleaseAmountTotal.value = 0;
  }
  
  // Determine if this is against PO or CO based on invoice type
  const isPO = invoice.invoice_type === 'AGAINST_PO' && invoice.purchase_order_uuid;
  const isCO = invoice.invoice_type === 'AGAINST_CO' && invoice.change_order_uuid;
  
  // Update form fields SYNCHRONOUSLY first to trigger watchers and show skeletons immediately
  if (isPO) {
    const poUuid = invoice.purchase_order_uuid;
    updatedForm.purchase_order_uuid = poUuid;
    updatedForm.po_co_uuid = `PO:${poUuid}`;
    updatedForm.change_order_uuid = null;
    updatedForm.po_number = invoice.po_number || '';
    updatedForm.co_number = '';

    // Fetch PO type to determine if it's labor
    try {
      const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
      const fetchedPoType = poResponse?.data?.po_type?.toUpperCase() || null;
      poType.value = fetchedPoType;
      console.log('[VendorInvoiceForm] Set poType for holdback PO:', fetchedPoType);
    } catch (error) {
      console.warn('[VendorInvoiceForm] Could not fetch PO type for holdback:', error);
      poType.value = null;
    }
  } else if (isCO) {
    const coUuid = invoice.change_order_uuid;
    updatedForm.change_order_uuid = coUuid;
    updatedForm.po_co_uuid = `CO:${coUuid}`;
    updatedForm.purchase_order_uuid = null;
    updatedForm.co_number = invoice.co_number || '';
    updatedForm.po_number = '';

    // Fetch CO type to determine if it's labor
    try {
      const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
      const fetchedCoType = coResponse?.data?.co_type?.toUpperCase() || null;
      coType.value = fetchedCoType;
      console.log('[VendorInvoiceForm] Set coType for holdback CO:', fetchedCoType);
    } catch (error) {
      console.warn('[VendorInvoiceForm] Could not fetch CO type for holdback:', error);
      coType.value = null;
    }
  } else {
    console.warn('[VendorInvoiceForm] Invalid invoice type for holdback selection:', invoice.invoice_type);
    loadingHoldbackData.value = false;
    return;
  }
  
  // Set holdback percentage from the invoice
  const holdbackPercentage = typeof invoice.holdback === 'number' 
    ? invoice.holdback 
    : (parseFloat(String(invoice.holdback || '0')) || 0);
  
  if (holdbackPercentage > 0) {
    updatedForm.holdback = holdbackPercentage;
  }

  if (corporationUuidSnapshot) {
    const cur = updatedForm.corporation_uuid;
    if (cur == null || String(cur).trim() === "") {
      updatedForm.corporation_uuid = corporationUuidSnapshot;
    }
  }
  
  // Emit form update SYNCHRONOUSLY to trigger watchers immediately
  // This will make skeletons appear right away
  emit('update:form', updatedForm);
  
  // Wait for next tick to ensure watchers have fired
  await nextTick();
  
  try {
    // Now do async operations (fetching PO/CO number if missing, fetching items, etc.)
    if (isPO) {
      const poUuid = invoice.purchase_order_uuid;
      
      // Get PO number from invoice, or fetch from PO if not available
      let poNumber = invoice.po_number || '';
      if (!poNumber && poUuid) {
        try {
          const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
          poNumber = poResponse?.data?.po_number || '';
          if (poNumber) {
            handleFormUpdate('po_number', poNumber);
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching PO number:', error);
        }
      }
      
      // Fetch PO items if needed
      if (isAgainstHoldback.value) {
        await fetchPOItems(poUuid);
      }
    } else if (isCO) {
      const coUuid = invoice.change_order_uuid;
      
      // Get CO number from invoice, or fetch from CO if not available
      let coNumber = invoice.co_number || '';
      if (!coNumber && coUuid) {
        try {
          const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
          coNumber = coResponse?.data?.co_number || '';
          if (coNumber) {
            handleFormUpdate('co_number', coNumber);
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching CO number:', error);
        }
      }
      
      // Fetch CO items if needed
      if (isAgainstHoldback.value) {
        await fetchCOItems(coUuid);
      }
    }
  } catch (error) {
    console.error('[VendorInvoiceForm] Error in handleHoldbackSelection:', error);
    // Loading state will be cleared by the watcher
  }
  // Note: Loading state is cleared by the watcher after data is fetched
};

// Handle advance payment cost codes update
const handleAdvancePaymentCostCodesUpdate = (value: any[]) => {
  handleFormUpdate('advance_payment_cost_codes', value);
};

// Handle removed cost codes update
const handleRemovedCostCodesUpdate = (value: any[]) => {
  // Ensure we're passing an array
  const arrayValue = Array.isArray(value) ? value : []
  handleFormUpdate('removed_advance_payment_cost_codes', arrayValue);
};

// Handle holdback cost codes update
const handleHoldbackCostCodesUpdate = (value: any[]) => {
  handleFormUpdate('holdback_cost_codes', value);
};

// Handle holdback release amounts update
const handleHoldbackReleaseAmountsUpdate = (totalReleaseAmount: number) => {
  const invoiceTypeUpper = String(props.form.invoice_type || "").toUpperCase();
  if (invoiceTypeUpper !== "AGAINST_HOLDBACK_AMOUNT") {
    return;
  }

  console.log('[VendorInvoiceForm] handleHoldbackReleaseAmountsUpdate called');
  console.log('[VendorInvoiceForm] totalReleaseAmount received:', totalReleaseAmount);
  
  // Round to 2 decimal places to avoid floating point precision issues
  const roundedTotal = Math.round(totalReleaseAmount * 100) / 100;
  console.log('[VendorInvoiceForm] roundedTotal:', roundedTotal);
  
  holdbackReleaseAmountTotal.value = roundedTotal;
  console.log('[VendorInvoiceForm] holdbackReleaseAmountTotal.value set to:', holdbackReleaseAmountTotal.value);
  
  // Update financial_breakdown.totals.item_total to ensure it matches the release amount total
  // This ensures the FinancialBreakdown component has the correct item_total
  const updatedForm = { ...props.form };
  console.log('[VendorInvoiceForm] Current form.financial_breakdown:', updatedForm.financial_breakdown);
  
  if (!updatedForm.financial_breakdown || typeof updatedForm.financial_breakdown === 'string') {
    try {
      updatedForm.financial_breakdown = typeof updatedForm.financial_breakdown === 'string' 
        ? JSON.parse(updatedForm.financial_breakdown) 
        : { totals: {} };
    } catch (e) {
      console.warn('[VendorInvoiceForm] Error parsing financial_breakdown:', e);
      updatedForm.financial_breakdown = { totals: {} };
    }
  }
  if (!updatedForm.financial_breakdown.totals) {
    updatedForm.financial_breakdown.totals = {};
  }
  
  console.log('[VendorInvoiceForm] Before update - financial_breakdown.totals.item_total:', updatedForm.financial_breakdown.totals.item_total);
  updatedForm.financial_breakdown.totals.item_total = roundedTotal;
  console.log('[VendorInvoiceForm] After update - financial_breakdown.totals.item_total:', updatedForm.financial_breakdown.totals.item_total);
  
  // For holdback invoices, also recalculate the total invoice amount here
  // Get current charges and tax from financial breakdown
  const chargesTotal = parseFloat(updatedForm.financial_breakdown.totals.charges_total || '0') || 0;
  const taxTotal = parseFloat(updatedForm.financial_breakdown.totals.tax_total || '0') || 0;
  const calculatedTotal = roundedTotal + chargesTotal + taxTotal;
  
  console.log('[VendorInvoiceForm] Recalculating total in handleHoldbackReleaseAmountsUpdate:');
  console.log('[VendorInvoiceForm]   item_total (from release):', roundedTotal);
  console.log('[VendorInvoiceForm]   charges_total:', chargesTotal);
  console.log('[VendorInvoiceForm]   tax_total:', taxTotal);
  console.log('[VendorInvoiceForm]   calculatedTotal:', calculatedTotal);
  
  // Update the total_invoice_amount (single source of truth)
  updatedForm.financial_breakdown.totals.total_invoice_amount = calculatedTotal;

  // For holdback invoices, set amount to the release amount only (item_total) if there are no charges/taxes,
  // otherwise keep it as 0
  const invoiceType = String(props.form.invoice_type || '').toUpperCase();
  if (invoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    updatedForm.amount = chargesTotal === 0 && taxTotal === 0 ? calculatedTotal : 0;
  } else {
    updatedForm.amount = calculatedTotal;
  }
  
  console.log('[VendorInvoiceForm] Updated financial_breakdown.totals:', updatedForm.financial_breakdown.totals);
  console.log('[VendorInvoiceForm] Updated form.amount:', updatedForm.amount);
  
  emit('update:form', updatedForm);
};

// Helper function to update financial_breakdown for advance payment invoices
// skipGuard: if true, skip the guard check (used when called from watcher that already has guard)
const updateFinancialBreakdownForAdvancePayment = (amount: number, skipGuard = false) => {
  // Skip if we're already updating to prevent recursive updates (unless skipGuard is true)
  if (!skipGuard && isUpdatingAdvancePaymentAmount.value) {
    return;
  }
  
  const updatedForm = { ...props.form };
  
  // Deep clone financial_breakdown to avoid mutating the original
  if (!updatedForm.financial_breakdown) {
    updatedForm.financial_breakdown = {
      charges: {
        freight: { percentage: null, amount: null, taxable: false },
        packing: { percentage: null, amount: null, taxable: false },
        custom_duties: { percentage: null, amount: null, taxable: false },
        other: { percentage: null, amount: null, taxable: false },
      },
      sales_taxes: {
        sales_tax_1: { percentage: null, amount: null },
        sales_tax_2: { percentage: null, amount: null },
      },
      totals: {
        item_total: null,
        charges_total: null,
        tax_total: null,
        total_invoice_amount: null,
      },
    };
  } else {
    // Deep clone existing financial_breakdown
    updatedForm.financial_breakdown = JSON.parse(JSON.stringify(updatedForm.financial_breakdown));
  }
  
  // Ensure totals object exists
  if (!updatedForm.financial_breakdown.totals) {
    updatedForm.financial_breakdown.totals = {
      item_total: null,
      charges_total: null,
      tax_total: null,
      total_invoice_amount: null,
    };
  }
  
  // For advance payment invoices, charges are hidden, so charges_total should always be 0
  // The FinancialBreakdown component will recalculate tax_total based on sales tax percentages
  // We need to update item_total so the component can recalculate correctly
  
  const currentItemTotal = updatedForm.financial_breakdown.totals.item_total || 0;
  const currentTaxTotal = updatedForm.financial_breakdown.totals.tax_total || 0;
  const currentTotal = updatedForm.financial_breakdown.totals.total_invoice_amount || 0;
  
  // For advance payment invoices, charges and taxes are always 0
  // Ensure charges_total and tax_total are set to 0 (not null)
  updatedForm.financial_breakdown.totals.charges_total = 0;
  updatedForm.financial_breakdown.totals.tax_total = 0;
  
  // Only update if item_total changed - this will trigger FinancialBreakdown to recalculate
  if (Math.abs(amount - currentItemTotal) > 0.01) {
    // Update item_total to match the advance payment total
    updatedForm.financial_breakdown.totals.item_total = amount || 0;
    
    // Calculate total_invoice_amount = item_total + tax_total
    // For advance payments, this equals item_total since tax_total is 0
    updatedForm.financial_breakdown.totals.total_invoice_amount = amount;
    
    emit('update:form', updatedForm);
  } else {
    // Even if item_total hasn't changed, ensure totals are correct
    // Update total_invoice_amount to match item_total (since tax_total is 0)
    const currentItemTotalValue = updatedForm.financial_breakdown.totals.item_total || 0;
    if (Math.abs(updatedForm.financial_breakdown.totals.total_invoice_amount - currentItemTotalValue) > 0.01) {
      updatedForm.financial_breakdown.totals.total_invoice_amount = currentItemTotalValue;
      emit('update:form', updatedForm);
    } else if (updatedForm.financial_breakdown.totals.tax_total === null || updatedForm.financial_breakdown.totals.charges_total === null) {
      // Ensure null values are set to 0
      emit('update:form', updatedForm);
    }
  }
};

// Line items handlers
const getDirectLineMasterItemUniqueId = (item: any) =>
  String(item?.item_uuid || item?.uuid || item?.id || "").trim();

/** Case-insensitive id for modal vs line-item matching (UUID casing differs). */
function getDirectLineMasterItemUniqueIdNormalized(item: any): string {
  return getDirectLineMasterItemUniqueId(item).toLowerCase();
}

/** Same cost code + same catalog/spec id = duplicate (keeps first row; allows one row per cost code for the same item). */
function directLineItemDedupeKey(item: any): string {
  const ccRaw = item?.cost_code_uuid ?? item?.cost_code_configuration_uuid;
  const cc =
    ccRaw != null && String(ccRaw).trim() !== ""
      ? String(ccRaw).trim().toLowerCase()
      : "";
  const catalog =
    getDirectLineCatalogItemUuid(item) ||
    getDirectLineMasterItemUniqueId(item);
  if (!catalog) return "";
  return `${cc}|${catalog.toLowerCase()}`;
}

function dedupeDirectLineItemsByCatalogId(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const row of items) {
    const k = directLineItemDedupeKey(row);
    if (k) {
      if (seen.has(k)) continue;
      seen.add(k);
    }
    out.push(row);
  }
  return out;
}

function transformPreferredToMasterModalRow(item: any, index: number) {
  const unitPrice = parseFloat(String(item.unit_price ?? "")) || 0;
  const poQty = 1;
  const poUnitPrice = unitPrice > 0 ? unitPrice : null;
  const poTotal = poUnitPrice != null ? roundCurrencyValue(poUnitPrice * poQty) : null;
  const itemSequence = item.item_sequence || item.sequence || "";
  const costCodeLabel =
    item.cost_code_label ||
    [item.cost_code_number, item.cost_code_name].filter(Boolean).join(" ").trim() ||
    "";
  return {
    id: item.uuid || item.id || `pref-${index}`,
    cost_code_uuid: item.cost_code_uuid || item.cost_code_configuration_uuid || null,
    cost_code_label: costCodeLabel,
    cost_code_number: item.cost_code_number || "",
    cost_code_name: item.cost_code_name || "",
    item_type_uuid: item.item_type_uuid || null,
    item_type_label: item.item_type_label || "",
    item_uuid:
      item.item_uuid != null && String(item.item_uuid).trim() !== ""
        ? String(item.item_uuid).trim()
        : item.uuid != null && String(item.uuid).trim() !== ""
          ? String(item.uuid).trim()
          : item.id != null && String(item.id).trim() !== ""
            ? String(item.id).trim()
            : null,
    item_name: item.item_name || "",
    description: item.description || "",
    po_description: item.description || "",
    item_sequence: itemSequence,
    sequence: itemSequence,
    preferred_vendor_uuid: item.preferred_vendor_uuid ?? null,
    unit_label: item.unit_label || item.unit || item.uom || "",
    unit: item.unit || item.uom || "",
    uom: item.uom || item.unit_label || "",
    po_unit_price: poUnitPrice === null ? undefined : poUnitPrice,
    po_quantity: poQty,
    po_total: poTotal === null ? undefined : poTotal,
    unit_price: unitPrice > 0 ? unitPrice : undefined,
    quantity: item.quantity,
    model_number: item.model_number || "",
    item_category_label: item.item_category_label || "",
    category: normalizeCategoryForItemCategorySelect(
      item.category,
      item.item_category_label
    ),
    unit_uuid: item.unit_uuid ?? item.uom_uuid ?? null,
    display_metadata: {
      cost_code_label: costCodeLabel,
      cost_code_number: item.cost_code_number || "",
      cost_code_name: item.cost_code_name || "",
      item_type_label: item.item_type_label || "",
      sequence: itemSequence,
      item_name: item.item_name || "",
      preferred_vendor_uuid: item.preferred_vendor_uuid ?? null,
      model_number: item.model_number || "",
    },
    location_uuid: item.location_uuid ?? null,
    location: item.location_label != null && String(item.location_label).trim() !== ""
      ? String(item.location_label).trim()
      : item.location != null && String(item.location).trim() !== ""
        ? String(item.location).trim()
        : "",
  };
}

const fetchMasterDirectLineModalItems = async () => {
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (!corpUuid) {
    masterDirectLineModalItems.value = [];
    return;
  }
  masterDirectLineModalLoading.value = true;
  masterDirectLineModalError.value = null;
  try {
    const resCorp = vendorInvoiceResourceCorpUuid.value;
    const resProject = vendorInvoiceResourceProjectUuid.value;
    if (resCorp && resProject) {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: resCorp,
        projectUuid: resProject,
      });
    }
    const query: Record<string, string> = { corporation_uuid: corpUuid };
    if (resProject) query.project_uuid = resProject;
    // Enter Direct Invoice: load all project preferred items for import (do not filter by invoice vendor).
    const response: any = await $fetch("/api/cost-code-preferred-items", { method: "GET", query });
    const preferredItems = Array.isArray(response?.data) ? response.data : [];
    const seenPreferredKeys = new Set<string>();
    const uniquePreferred = preferredItems.filter((it: any) => {
      const row = {
        ...it,
        cost_code_uuid: it.cost_code_uuid ?? it.cost_code_configuration_uuid ?? null,
      };
      const k = directLineItemDedupeKey(row);
      if (!k) return true;
      if (seenPreferredKeys.has(k)) return false;
      seenPreferredKeys.add(k);
      return true;
    });
    masterDirectLineModalItems.value = uniquePreferred.map((it: any, idx: number) =>
      transformPreferredToMasterModalRow(it, idx)
    );
  } catch (e: any) {
    masterDirectLineModalItems.value = [];
    masterDirectLineModalError.value = e?.message || "Failed to load preferred items";
  } finally {
    masterDirectLineModalLoading.value = false;
  }
};

const openDirectMasterImportModal = async (editing: boolean) => {
  await fetchMasterDirectLineModalItems();
  if (masterDirectLineModalItems.value.length === 0) return;
  isEditingMasterDirectLineSelection.value = editing;
  showMasterDirectLineModal.value = true;
};

const mapMasterModalItemToLineItem = (item: any) => {
  const unitLabel =
    [item.unit_label, item.uom, item.unit]
      .map((x: any) => (x != null ? String(x).trim() : ""))
      .find(Boolean) || "";
  return mapPreferredItemToLineItem({
    cost_code_uuid: item.cost_code_uuid ?? item.cost_code_configuration_uuid ?? null,
    item_uuid: item.item_uuid ?? item.uuid ?? item.id ?? null,
    uuid: item.uuid,
    id: item.id,
    item_name: item.item_name || item.name || "",
    description: item.description || item.item_description || item.display_metadata?.po_description || "",
    unit_price: item.po_unit_price ?? item.unit_price ?? null,
    quantity: item.po_quantity ?? item.quantity ?? 1,
    item_sequence: item.item_sequence || item.sequence,
    sequence: item.sequence || item.item_sequence,
    item_type_uuid: item.item_type_uuid ?? null,
    item_type_label: item.item_type_label,
    item_category_label: item.item_category_label,
    category: item.category,
    location_uuid: item.location_uuid ?? null,
    location: item.location,
    location_label: item.location_label,
    unit_label: unitLabel,
    uom: item.uom || item.unit_label || item.unit || "",
    unit: item.unit,
    unit_uuid: item.unit_uuid ?? item.uom_uuid ?? null,
  } as CostCodePreferredItemImportRow & {
    item_type_uuid?: string | null;
    unit_uuid?: string | null;
    uuid?: string;
    id?: string | number;
    uom?: string;
    unit?: string;
    category?: string | null;
    location_uuid?: string | null;
    location?: string | null;
    location_label?: string | null;
  });
};

const handleMasterDirectLineConfirm = (selectedItems: any[]) => {
  if (!Array.isArray(selectedItems) || selectedItems.length === 0) return;
  let nextLineItems: any[];
  if (isEditingMasterDirectLineSelection.value) {
    const currentItems = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
    const selectedIds = new Set(
      selectedItems.map((it) => getDirectLineMasterItemUniqueIdNormalized(it)).filter(Boolean)
    );
    const itemsToKeep = currentItems.filter((li) => {
      const id = getDirectLineMasterItemUniqueIdNormalized(li);
      if (!id) return true;
      return selectedIds.has(id);
    });
    const currentIds = new Set(
      currentItems.map((li) => getDirectLineMasterItemUniqueIdNormalized(li)).filter(Boolean)
    );
    const keptDedupeKeys = new Set(
      itemsToKeep.map((li) => directLineItemDedupeKey(li)).filter(Boolean)
    );
    const newRows = selectedItems
      .filter((si) => {
        const id = getDirectLineMasterItemUniqueIdNormalized(si);
        return id && !currentIds.has(id);
      })
      .map(mapMasterModalItemToLineItem)
      .filter((row) => {
        const k = directLineItemDedupeKey(row);
        if (!k) return true;
        if (keptDedupeKeys.has(k)) return false;
        keptDedupeKeys.add(k);
        return true;
      });
    nextLineItems = [...itemsToKeep, ...newRows];
  } else {
    const current = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
    const existingKeys = new Set(
      current.map((li) => directLineItemDedupeKey(li)).filter(Boolean)
    );
    const newRows = selectedItems
      .filter((si) => {
        const rowForKey = {
          ...si,
          cost_code_uuid: si.cost_code_uuid ?? si.cost_code_configuration_uuid ?? null,
        };
        const k = directLineItemDedupeKey(rowForKey);
        if (!k) return true;
        return !existingKeys.has(k);
      })
      .map(mapMasterModalItemToLineItem);
    nextLineItems = [...current, ...newRows];
  }
  handleFormUpdate("line_items", dedupeDirectLineItemsByCatalogId(nextLineItems));
  isEditingMasterDirectLineSelection.value = false;
  directInvoicePreferredItemsRefreshToken.value += 1;
  nextTick(() => {
    void lineItemsTotal.value;
  });
};

const handleMasterDirectLineCancel = () => {
  isEditingMasterDirectLineSelection.value = false;
};

const handleEditMasterDirectLineSelection = async () => {
  await fetchMasterDirectLineModalItems();
  if (masterDirectLineModalItems.value.length === 0) return;
  isEditingMasterDirectLineSelection.value = true;
  showMasterDirectLineModal.value = true;
};

const createEmptyLineItem = () => ({
  id: Date.now() + Math.random().toString(36).substring(2),
  cost_code_uuid: null,
  sequence_uuid: null,
  item_uuid: null,
  item_name: '',
  item_sequence: null,
  sequence: null,
  item_type_uuid: null,
  item_type_label: '',
  category: '',
  item_category_label: '',
  location_uuid: null,
  location: '',
  description: '',
  unit_price: null,
  uom: '',
  unit_uuid: null,
  quantity: null,
  total: null,
});

const mapPreferredItemToLineItem = (
  row: CostCodePreferredItemImportRow & {
    item_type_uuid?: string | null;
    unit_uuid?: string | null;
    uuid?: string;
    id?: string | number;
    uom?: string;
    unit?: string;
    cost_code_configuration_uuid?: string | null;
    category?: string | null;
    location_uuid?: string | null;
    location?: string | null;
    location_label?: string | null;
  }
) => {
  const specId =
    row.item_uuid != null && String(row.item_uuid).trim() !== ""
      ? String(row.item_uuid).trim()
      : row.uuid != null && String(row.uuid).trim() !== ""
        ? String(row.uuid).trim()
        : row.id != null && String(row.id).trim() !== ""
          ? String(row.id).trim()
          : "";
  const qRaw = Number(row.initial_quantity ?? row.quantity ?? 1);
  const qty = Number.isFinite(qRaw) && qRaw > 0 ? qRaw : 1;
  const unitPrice = row.unit_price != null ? Number(row.unit_price) : null;
  let total: number | null = null;
  if (unitPrice != null && Number.isFinite(unitPrice) && qty > 0) {
    total = roundCurrencyValue(unitPrice * qty);
  }
  const desc = row.description != null ? String(row.description) : '';
  const description = desc.trim() || row.item_name || '';
  const seq =
    [row.item_sequence, row.sequence]
      .map((s) => (s != null ? String(s).trim() : ''))
      .find(Boolean) || ''
  const itemName = row.item_name != null ? String(row.item_name).trim() : ''
  const typeUuid =
    row.item_type_uuid != null && String(row.item_type_uuid).trim() !== ""
      ? String(row.item_type_uuid).trim()
      : null;
  const unitUuid =
    row.unit_uuid != null && String(row.unit_uuid).trim() !== ""
      ? String(row.unit_uuid).trim()
      : null;
  const unitLabel =
    [row.unit_label, row.uom, row.unit]
      .map((x) => (x != null ? String(x).trim() : ""))
      .find(Boolean) || "";
  const sid = specId || null;
  const category = normalizeCategoryForItemCategorySelect(
    row.category,
    row.item_category_label
  );
  const locUuid =
    row.location_uuid != null && String(row.location_uuid).trim() !== ""
      ? String(row.location_uuid).trim()
      : null;
  const locLabel =
    [row.location_label, row.location]
      .map((x) => (x != null ? String(x).trim() : ""))
      .find(Boolean) || "";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    cost_code_uuid: row.cost_code_uuid ?? row.cost_code_configuration_uuid ?? null,
    sequence_uuid: sid,
    item_uuid: sid,
    item_name: itemName,
    item_sequence: seq || null,
    sequence: seq || null,
    item_type_uuid: typeUuid,
    item_type_label: row.item_type_label != null ? String(row.item_type_label) : '',
    category,
    item_category_label: row.item_category_label != null ? String(row.item_category_label) : '',
    location_uuid: locUuid,
    location: locLabel,
    description,
    unit_price: unitPrice != null && Number.isFinite(unitPrice) ? unitPrice : null,
    uom: unitLabel,
    unit_label: unitLabel,
    unit_uuid: unitUuid,
    quantity: qty,
    total,
  };
};

const handleAddLineItem = (index: number) => {
  const currentItems = [...lineItems.value];
  const newItem = createEmptyLineItem();
  const insertIndex = index === -1 ? currentItems.length : Math.min(index + 1, currentItems.length);
  currentItems.splice(insertIndex, 0, newItem);
  handleFormUpdate('line_items', currentItems);
};

const handleRemoveLineItem = (index: number) => {
  const currentItems = [...lineItems.value];
  if (index >= 0 && index < currentItems.length) {
    currentItems.splice(index, 1);
    handleFormUpdate('line_items', currentItems);
  }
};

const handleLineItemCostCodeChange = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const currentItems = [...lineItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    const prevCc = item.cost_code_uuid;
    item.cost_code_uuid = value;

    if (String(prevCc || "") !== String(value || "")) {
      item.sequence_uuid = null;
      item.item_uuid = null;
      item.item_type_uuid = null;
    }

    currentItems[index] = item;
    handleFormUpdate('line_items', currentItems);
  }
};

const handleLineItemSequenceChange = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const currentItems = [...lineItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.sequence_uuid = value;
    item.item_uuid = value; // Sequence select uses item_uuid
    
    // Populate item data from option if available
    const raw = option?.raw || option?.option?.raw;
    if (raw) {
      item.description = raw.description || item.description || '';
      item.unit_price = raw.unit_price || item.unit_price || null;
      item.uom = raw.unit_label || raw.unit || raw.short_name || item.uom || '';
      item.unit_label = raw.unit_label || raw.unit || raw.short_name || '';
      const nm = raw.item_name || raw.name;
      if (nm != null && String(nm).trim() !== '') item.item_name = String(nm).trim();
      const seqPick = raw.item_sequence || raw.sequence;
      if (seqPick != null && String(seqPick).trim() !== '') {
        const s = String(seqPick).trim();
        item.item_sequence = s;
        item.sequence = s;
      }
      if (raw.item_type_label != null && String(raw.item_type_label).trim() !== '') {
        item.item_type_label = String(raw.item_type_label).trim();
      }
      if (raw.item_category_label != null && String(raw.item_category_label).trim() !== '') {
        item.item_category_label = String(raw.item_category_label).trim();
      }
      if (raw.item_type_uuid != null && String(raw.item_type_uuid).trim() !== "") {
        item.item_type_uuid = String(raw.item_type_uuid).trim();
      }
      const rawUnitUuid = raw.unit_uuid ?? raw.uom_uuid;
      if (rawUnitUuid != null && String(rawUnitUuid).trim() !== "") {
        item.unit_uuid = String(rawUnitUuid).trim();
      }
    }
    
    currentItems[index] = item;
    handleFormUpdate('line_items', currentItems);
  }
};

const handleLineItemItemChange = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const currentItems = [...lineItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.item_uuid = value;
    item.sequence_uuid = value; // Keep sequence_uuid in sync with item_uuid
    
    // Populate item data from option if available
    const raw = option?.raw || option?.option?.raw;
    if (raw) {
      item.description = raw.description || raw.item_name || item.description || '';
      item.unit_price = raw.unit_price || item.unit_price || null;
      item.uom = raw.unit_label || raw.unit || raw.short_name || item.uom || '';
      item.unit_label = raw.unit_label || raw.unit || raw.short_name || '';
      const nm = raw.item_name || raw.name;
      if (nm != null && String(nm).trim() !== '') item.item_name = String(nm).trim();
      const seqPick = raw.item_sequence || raw.sequence;
      if (seqPick != null && String(seqPick).trim() !== '') {
        const s = String(seqPick).trim();
        item.item_sequence = s;
        item.sequence = s;
      }
      if (raw.item_type_label != null && String(raw.item_type_label).trim() !== '') {
        item.item_type_label = String(raw.item_type_label).trim();
      }
      if (raw.item_category_label != null && String(raw.item_category_label).trim() !== '') {
        item.item_category_label = String(raw.item_category_label).trim();
      }
      if (raw.item_type_uuid != null && String(raw.item_type_uuid).trim() !== "") {
        item.item_type_uuid = String(raw.item_type_uuid).trim();
      }
      const rawUnitUuid = raw.unit_uuid ?? raw.uom_uuid;
      if (rawUnitUuid != null && String(rawUnitUuid).trim() !== "") {
        item.unit_uuid = String(rawUnitUuid).trim();
      }
    }
    
    currentItems[index] = item;
    handleFormUpdate('line_items', currentItems);
  }
};

const handleLineItemDescriptionChange = ({ index, value }: { index: number; value: string }) => {
  const currentItems = [...lineItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.description = value;
    currentItems[index] = item;
    handleFormUpdate('line_items', currentItems);
  }
};

const updateLineItems = (items: any[]) => {
  // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
  // This ensures that nested property changes (like unit_price, quantity, total) trigger reactivity
  const clonedItems = items.map((item: any) => ({
    ...item,
  }))

  handleFormUpdate('line_items', clonedItems);
  // Force lineItemsTotal to recalculate immediately after update
  const _ = lineItemsTotal.value
}

const handleLineItemUnitPriceChange = ({ index, value, numericValue, computedTotal }: { index: number; value: number | null; numericValue: number; computedTotal: number }) => {
  const currentItems = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
  
  if (!currentItems.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), currentItems.length - 1);
  const item = { ...currentItems[targetIndex] };
  const isEmpty = value === null || value === undefined;

  item.unit_price = isEmpty ? null : numericValue;
  item.total = computedTotal;

  currentItems[targetIndex] = item;
  updateLineItems(currentItems);
};

const handleLineItemQuantityChange = ({ index, value, numericValue, computedTotal }: { index: number; value: number | null; numericValue: number; computedTotal: number }) => {
  const currentItems = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
  
  if (!currentItems.length) {
    return;
  }

  const targetIndex = Math.min(Math.max(index, 0), currentItems.length - 1);
  const item = { ...currentItems[targetIndex] };
  const isEmpty = value === null || value === undefined;

  item.quantity = isEmpty ? null : numericValue;
  item.total = computedTotal;

  currentItems[targetIndex] = item;
  updateLineItems(currentItems);
};

const handleDirectLineMasterTableNoOp = () => {};

const handleDirectLineCategoryChange = ({
  index,
  value,
}: {
  index: number;
  value: string | null;
}) => {
  const current = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
  if (!current.length) return;
  const targetIndex = Math.min(Math.max(index, 0), current.length - 1);
  const item = { ...current[targetIndex] };
  const metadata = { ...(item.display_metadata || {}) };

  item.category = value || "";
  metadata.category = value || "";

  item.item_division_uuid = null;
  metadata.item_division_uuid = null;
  item.division_name = "";
  metadata.division_name = "";

  item.item_type_uuid = null;
  item.item_type_label = "";
  metadata.item_type_label = "";

  item.item_uuid = null;
  item.sequence_uuid = null;
  item.item_name = "";
  item.sequence = null;
  item.item_sequence = null;
  metadata.sequence = null;

  item.description = "";
  item.display_metadata = metadata;

  current[targetIndex] = item;
  handleFormUpdate("line_items", current);
};

const handleDirectLineLocationChange = ({
  index,
  value,
  option,
}: {
  index: number;
  value: string | null;
  option?: any;
}) => {
  const current = Array.isArray(lineItems.value) ? [...lineItems.value] : [];
  if (index < 0 || index >= current.length) return;
  const item = { ...current[index] };
  item.location_uuid = value || null;
  let label = "";
  if (option?.label) {
    label = String(option.label);
  } else if (option?.location) {
    const loc = option.location;
    const name = loc.location_name != null ? String(loc.location_name) : "";
    const code = loc.location_code != null ? String(loc.location_code) : "";
    label = code ? `${name} (${code})` : name;
  }
  item.location = label;
  current[index] = item;
  handleFormUpdate("line_items", current);
};

const handleDirectLinePoUnitPriceChange = ({
  index,
  value,
  numericValue,
  computedTotal,
}: {
  index: number;
  value: string | number | null | undefined;
  numericValue: number;
  computedTotal: number;
}) => {
  const isEmpty = value === "" || value === null || value === undefined;
  const coerced =
    !isEmpty && typeof value === "string" ? parseFloat(value) : (value as number | null | undefined);
  handleLineItemUnitPriceChange({
    index,
    value: isEmpty ? null : (coerced as number),
    numericValue,
    computedTotal,
  });
};

const handleDirectLinePoQuantityChange = ({
  index,
  value,
  numericValue,
  computedTotal,
}: {
  index: number;
  value: string | number | null | undefined;
  numericValue: number;
  computedTotal: number;
}) => {
  const isEmpty = value === "" || value === null || value === undefined;
  const coerced =
    !isEmpty && typeof value === "string" ? parseFloat(value) : (value as number | null | undefined);
  handleLineItemQuantityChange({
    index,
    value: isEmpty ? null : (coerced as number),
    numericValue,
    computedTotal,
  });
};

const handleDirectLinePoTotalChange = () => {};

const handleLineItemItemTypeChange = ({
  index,
  value,
  option,
}: {
  index: number;
  value: string | null;
  option?: any;
}) => {
  const currentItems = [...lineItems.value];
  if (index < 0 || index >= currentItems.length) return;
  const item = { ...currentItems[index] };
  const old = item.item_type_uuid;
  item.item_type_uuid = value || null;
  const resolvedLabel =
    option?.label ||
    option?.item_type ||
    (value ? itemTypeNamesByUuidForLineItems.value.get(String(value)) : "") ||
    "";
  item.item_type_label = resolvedLabel ? String(resolvedLabel) : "";
  // Do not clear spec/item when the type is first "hydrated" (null/empty → uuid). The table row can show a
  // resolved item_type_uuid from preferred-item lookup while form.line_items still had null; ItemTypeSelect
  // then emits that uuid and would wipe a freshly imported item_uuid (SequenceSelect shows placeholders).
  const prevType = old != null && String(old).trim() !== "" ? String(old).trim() : "";
  const nextType =
    item.item_type_uuid != null && String(item.item_type_uuid).trim() !== ""
      ? String(item.item_type_uuid).trim()
      : "";
  const typeHydratedFromEmpty = !prevType && nextType;
  const typeClearedAfterSet = Boolean(prevType && !nextType);
  const typeChanged = Boolean(prevType && nextType && prevType !== nextType);
  if (!typeHydratedFromEmpty && (typeClearedAfterSet || typeChanged)) {
    item.item_uuid = null;
    item.sequence_uuid = null;
    item.item_name = "";
    item.item_sequence = null;
    item.sequence = null;
    item.description = "";
  }
  currentItems[index] = item;
  handleFormUpdate("line_items", currentItems);
};

const handleLineItemUomChange = ({
  index,
  value,
  option,
}: {
  index: number;
  value: string | null;
  option?: any;
}) => {
  const currentItems = [...lineItems.value];
  if (index < 0 || index >= currentItems.length) return;
  const item = { ...currentItems[index] };
  item.unit_uuid = value || null;
  const resolvedLabel =
    option?.label ||
    option?.shortName ||
    option?.uom?.short_name ||
    option?.uom?.uom_name ||
    "";
  item.uom = resolvedLabel || item.uom || "";
  item.unit_label = resolvedLabel || item.unit_label || "";
  currentItems[index] = item;
  handleFormUpdate("line_items", currentItems);
};

const handleLineItemModelNumberChange = ({ index, value }: { index: number; value: string }) => {
  const currentItems = [...lineItems.value];
  if (index < 0 || index >= currentItems.length) return;
  const item = { ...currentItems[index] };
  item.model_number = value;
  currentItems[index] = item;
  handleFormUpdate("line_items", currentItems);
};

// Handle invoice unit price changes for PO items
// Similar to how direct invoice handles line item unit price changes
// The poItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleInvoiceUnitPriceChange = ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const currentItems = [...poItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_unit_price = numericValue;
    item.invoice_total = computedTotal;
    currentItems[index] = item;
    poItems.value = currentItems;
    // poItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

// Handle invoice quantity changes for PO items
// Similar to how direct invoice handles line item quantity changes
// The poItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleInvoiceQuantityChange = ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const currentItems = [...poItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_quantity = numericValue;
    item.invoice_total = computedTotal;
    currentItems[index] = item;
    poItems.value = currentItems;
    // poItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

// Handle invoice total changes for PO items
// Similar to how direct invoice handles line item total changes
// The poItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleInvoiceTotalChange = ({ index, value }: { index: number; value: number }) => {
  const currentItems = [...poItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_total = value;
    currentItems[index] = item;
    poItems.value = currentItems;
    // poItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

// Handle approval checks changes for PO items
const handlePOItemApprovalChecksChange = ({ index, value }: { index: number; value: string[] }) => {
  const currentItems = [...poItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.approval_checks = Array.isArray(value) ? value : [];
    currentItems[index] = item;
    poItems.value = currentItems;
  }
};

// Handle invoice unit price changes for CO items
// Similar to how PO items handle invoice unit price changes
// The coItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleCOInvoiceUnitPriceChange = async ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const currentItems = [...coItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_unit_price = numericValue;
    item.invoice_total = computedTotal;
    currentItems[index] = item;
    coItems.value = currentItems;
    // Wait for nextTick to ensure watcher fires
    await nextTick();
    // coItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

// Handle invoice quantity changes for CO items
// Similar to how PO items handle invoice quantity changes
// The coItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleCOInvoiceQuantityChange = async ({ index, value, numericValue, computedTotal }: { index: number; value: string | number | null | undefined; numericValue: number; computedTotal: number }) => {
  const currentItems = [...coItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_quantity = numericValue;
    item.invoice_total = computedTotal;
    currentItems[index] = item;
    coItems.value = currentItems;
    // Wait for nextTick to ensure watcher fires
    await nextTick();
    // coItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

// Handle invoice total changes for CO items
// Similar to how PO items handle invoice total changes
// The coItemsTotal computed property will automatically recalculate, and FinancialBreakdown will update
const handleCOInvoiceTotalChange = ({ index, value }: { index: number; value: number }) => {
  const currentItems = [...coItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_total = value;
    currentItems[index] = item;
    coItems.value = currentItems;
    // coItemsTotal computed property will automatically update
    // FinancialBreakdown watches itemTotal and will recalculate charges/taxes automatically
    // This matches the behavior of direct invoices - no manual amount update needed
  }
};

const handlePoLwmInvoiceAmountChange = ({ index, value, numericValue }: { index: number; value: string | number | null | undefined; numericValue: number }) => {
  const currentItems = [...poLwmItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_amount = numericValue;
    currentItems[index] = item;
    poLwmItems.value = currentItems;
  }
};

const handleCoLwmInvoiceAmountChange = ({ index, value, numericValue }: { index: number; value: string | number | null | undefined; numericValue: number }) => {
  const currentItems = [...coLwmItems.value];
  if (index >= 0 && index < currentItems.length) {
    const item = { ...currentItems[index] };
    item.invoice_amount = numericValue;
    currentItems[index] = item;
    coLwmItems.value = currentItems;
  }
};

// Helper function to compute effective total for a line item (same pattern as computePoItemEffectiveTotal)
const computeLineItemEffectiveTotal = (item: any): number => {
  const hasUnitPrice =
    item?.unit_price !== null &&
    item?.unit_price !== undefined &&
    item?.unit_price !== ''
  const hasQuantity =
    item?.quantity !== null &&
    item?.quantity !== undefined &&
    item?.quantity !== ''

  if (hasUnitPrice && hasQuantity) {
    const unitPrice = parseNumericInput(item?.unit_price)
    const quantity = parseNumericInput(item?.quantity)
    return roundCurrencyValue(unitPrice * quantity)
  }

  const itemTotal = parseNumericInput(item?.total)
  if (itemTotal) {
    return roundCurrencyValue(itemTotal)
  }

  return 0
}

// Calculate total from line items - directly access properties for maximum reactivity (same pattern as itemTotal in PurchaseOrderForm)
const lineItemsTotal = computed(() => {
  // Access props.form.line_items directly to ensure reactivity (same as PurchaseOrderForm accesses props.form.po_items)
  const items = Array.isArray(props.form.line_items) ? props.form.line_items : []
  
  // Access deep properties to ensure Vue tracks changes
  // Iterate through all items and access their properties to ensure reactivity
  const total = items.reduce((sum: number, item: any, index: number) => {
    // Force reactivity by accessing the specific fields that affect the total
    // Accessing these properties ensures Vue tracks changes to them
    const unitPrice = item?.unit_price
    const quantity = item?.quantity
    const itemTotal = item?.total
    
    // Also access the item itself and its index to ensure array changes are tracked
    const _ = item && index
    
    const effectiveTotal = computeLineItemEffectiveTotal(item)
    return sum + effectiveTotal
  }, 0)
  
  return roundCurrencyValue(total)
})

// Calculate total from advance payment cost codes
const advancePaymentTotal = computed(() => {
  const costCodes = Array.isArray(props.form.advance_payment_cost_codes) 
    ? props.form.advance_payment_cost_codes 
    : []
  
  const total = costCodes.reduce((sum: number, row: any) => {
    // Handle both camelCase and snake_case field names
    const advanceAmount = row.advanceAmount !== undefined 
      ? row.advanceAmount 
      : (row.advance_amount !== undefined ? row.advance_amount : null)
    
    if (advanceAmount === null || advanceAmount === undefined || advanceAmount === '') {
      return sum
    }
    
    const numericValue = parseNumericInput(advanceAmount)
    return sum + numericValue
  }, 0)
  
  return roundCurrencyValue(total)
})

// For AGAINST_ADVANCE_PAYMENT invoices, Configure COA modal should show
// the GL breakdown created in Advance Payment Distribution.
const advancePaymentCOAContext = computed(() => {
  const rows = advancePaymentCostCodes.value || [];
  const built = buildAdvancePaymentCOABreakdown({
    rows,
    formatCurrency: (n: number) => formatCurrency(n),
  });
  return {
    ...built,
    itemBreakdownByAccount: mergeSavedCoaAccountUuidsOntoItemBreakdown(
      built.itemBreakdownByAccount,
      props.form.item_breakdown_by_account,
      props.form.coa_assignments
    ),
  };
})

// Get item amount for breakdown — must match poItemsTotal/coItemsTotal logic exactly so the
// Total amount breakdown sums to the same item total as the financial breakdown (invoice values only).
function getItemAmountForBreakdown(item: any): number {
  const hasInvoiceUnitPrice = item.invoice_unit_price !== null && item.invoice_unit_price !== undefined;
  const hasInvoiceQuantity = item.invoice_quantity !== null && item.invoice_quantity !== undefined;
  if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
    const invoiceUnitPrice = parseNumericInput(item.invoice_unit_price);
    const invoiceQuantity = parseNumericInput(item.invoice_quantity);
    if (invoiceUnitPrice > 0 && invoiceQuantity > 0) {
      return roundCurrencyValue(invoiceUnitPrice * invoiceQuantity);
    }
  }
  if (item.invoice_total !== null && item.invoice_total !== undefined) {
    const invoiceTotal = parseNumericInput(item.invoice_total);
    if (invoiceTotal > 0) {
      return roundCurrencyValue(invoiceTotal);
    }
  }
  return 0;
}

// Calculate total from PO items (for Against PO invoice type)
// Always use invoice values (invoice qty and unit price) when showInvoiceValues is enabled
// This matches how direct invoices calculate from line items
// For new invoices, invoice values are null, so return 0 (don't fall back to PO values)
const poItemsTotal = computed(() => {
  const items = poItems.value || []
  
  const total = items.reduce((sum: number, item: any) => {
    // Only use invoice values - don't fall back to PO values
    // For new invoices, invoice_unit_price and invoice_quantity are null, so return 0 for that item
    const hasInvoiceUnitPrice = item.invoice_unit_price !== null && item.invoice_unit_price !== undefined
    const hasInvoiceQuantity = item.invoice_quantity !== null && item.invoice_quantity !== undefined
    
    // Calculate from invoice unit price and quantity if both are available
    if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
      const invoiceUnitPrice = parseNumericInput(item.invoice_unit_price)
      const invoiceQuantity = parseNumericInput(item.invoice_quantity)
      if (invoiceUnitPrice > 0 && invoiceQuantity > 0) {
        return sum + roundCurrencyValue(invoiceUnitPrice * invoiceQuantity)
      }
    }
    
    // Fallback to invoice_total if available (and invoice_unit_price/invoice_quantity are not set)
    if (item.invoice_total !== null && item.invoice_total !== undefined) {
      const invoiceTotal = parseNumericInput(item.invoice_total)
      if (invoiceTotal > 0) {
        return sum + roundCurrencyValue(invoiceTotal)
      }
    }
    
    // For new invoices, invoice values are null, so return 0 (don't add anything to sum)
    return sum
  }, 0)
  
  return roundCurrencyValue(total)
})

// Calculate total from CO items (for Against CO invoice type)
// Always use invoice values (invoice qty and unit price) when showInvoiceValues is enabled
// This matches how direct invoices calculate from line items
// For new invoices, invoice values are null, so return 0 (don't fall back to CO values)
const coItemsTotal = computed(() => {
  const items = coItems.value || []
  
  const total = items.reduce((sum: number, item: any) => {
    // Only use invoice values - don't fall back to CO values
    // For new invoices, invoice_unit_price and invoice_quantity are null, so return 0 for that item
    const hasInvoiceUnitPrice = item.invoice_unit_price !== null && item.invoice_unit_price !== undefined
    const hasInvoiceQuantity = item.invoice_quantity !== null && item.invoice_quantity !== undefined
    
    // Calculate from invoice unit price and quantity if both are available
    if (hasInvoiceUnitPrice && hasInvoiceQuantity) {
      const invoiceUnitPrice = parseNumericInput(item.invoice_unit_price)
      const invoiceQuantity = parseNumericInput(item.invoice_quantity)
      if (invoiceUnitPrice > 0 && invoiceQuantity > 0) {
        return sum + roundCurrencyValue(invoiceUnitPrice * invoiceQuantity)
      }
    }
    
    // Fallback to invoice_total if available (and invoice_unit_price/invoice_quantity are not set)
    if (item.invoice_total !== null && item.invoice_total !== undefined) {
      const invoiceTotal = parseNumericInput(item.invoice_total)
      if (invoiceTotal > 0) {
        return sum + roundCurrencyValue(invoiceTotal)
      }
    }
    
    // For new invoices, invoice values are null, so return 0 (don't add anything to sum)
    return sum
  }, 0)
  
  return roundCurrencyValue(total)
})

const poLwmItemsTotal = computed(() => {
  const items = poLwmItems.value || [];
  return roundCurrencyValue(items.reduce((sum: number, item: any) => {
    const amt = parseNumericInput(item.invoice_amount);
    return sum + amt;
  }, 0));
});

const coLwmItemsTotal = computed(() => {
  const items = coLwmItems.value || [];
  return roundCurrencyValue(items.reduce((sum: number, item: any) => {
    const amt = parseNumericInput(item.invoice_amount);
    return sum + amt;
  }, 0));
});

const updateInvoiceAmount = () => {
  // Update amount based on invoice type
  if (isAgainstAdvancePayment.value) {
    // For advance payment invoices, use the sum of advance amounts
    handleFormUpdate('amount', advancePaymentTotal.value);
  } else if (isDirectInvoice.value) {
    // For direct invoices, use line items total (will be overridden by FinancialBreakdown if used)
    handleFormUpdate('amount', lineItemsTotal.value);
  }
};

// Handler for financial breakdown component updates
const handleFinancialBreakdownUpdate = (updates: Record<string, any>) => {
  // The FinancialBreakdown component handles all calculations
  // We just need to update the form with the updates
  const updatedForm = { ...props.form };
  
  const invoiceType = String(props.form.invoice_type || '').toUpperCase();
  const isHoldbackInvoice = invoiceType === 'AGAINST_HOLDBACK_AMOUNT';
  
  if (isHoldbackInvoice) {
    console.log('[VendorInvoiceForm] handleFinancialBreakdownUpdate for AGAINST_HOLDBACK_AMOUNT');
    console.log('[VendorInvoiceForm] Current form.amount:', props.form.amount);
    console.log('[VendorInvoiceForm] Current holdbackReleaseAmountTotal.value:', holdbackReleaseAmountTotal.value);
    console.log('[VendorInvoiceForm] updates:', updates);
  }

  // Now update the form with all updates
  Object.keys(updates).forEach((key) => {
    updatedForm[key] = updates[key];
  });

  // For holdback invoices, ensure item_total matches the release amount total
  // and recalculate amount from item_total + charges_total + tax_total
  if (isHoldbackInvoice) {
    // Ensure financial_breakdown structure exists
    if (!updatedForm.financial_breakdown || typeof updatedForm.financial_breakdown === 'object') {
      // If it's already an object, use it; otherwise initialize
      if (typeof updatedForm.financial_breakdown === 'string') {
        try {
          updatedForm.financial_breakdown = JSON.parse(updatedForm.financial_breakdown);
        } catch (e) {
          updatedForm.financial_breakdown = { totals: {} };
        }
      }
      if (!updatedForm.financial_breakdown || typeof updatedForm.financial_breakdown !== 'object') {
        updatedForm.financial_breakdown = { totals: {} };
      }
    }
    if (!updatedForm.financial_breakdown.totals) {
      updatedForm.financial_breakdown.totals = {};
    }

    const releaseAmountTotal = holdbackReleaseAmountTotal.value || 0;
    // When release lines are not loaded yet (or zero), respect FinancialBreakdown payload like other types.
    if (releaseAmountTotal <= 0) {
      let calculatedAmount: any = null;
      const fbEarly = updates.financial_breakdown;
      if (fbEarly && typeof fbEarly === 'object' && fbEarly.totals) {
        calculatedAmount =
          fbEarly.totals.total_invoice_amount ?? (fbEarly.totals as Record<string, unknown>).amount;
      }
      if (
        (calculatedAmount === null || calculatedAmount === undefined || calculatedAmount === '') &&
        updates.amount !== null &&
        updates.amount !== undefined &&
        updates.amount !== ''
      ) {
        calculatedAmount = updates.amount;
      }
      if (calculatedAmount !== null && calculatedAmount !== undefined && calculatedAmount !== '') {
        const amountNum = parseNumericInput(calculatedAmount);
        updatedForm.amount = amountNum;
        const t = updatedForm.financial_breakdown.totals as Record<string, unknown>;
        if (t.total_invoice_amount == null || t.total_invoice_amount === '') {
          t.total_invoice_amount = amountNum;
        }
      } else {
        updatedForm.amount = 0;
      }
      emit('update:form', updatedForm);
      return;
    }

    // Use the release amount total as item_total (this is the source of truth for holdback invoices)
    console.log('[VendorInvoiceForm] Using releaseAmountTotal from holdbackReleaseAmountTotal.value:', releaseAmountTotal);
    
    // Update item_total with the release amount total
    updatedForm.financial_breakdown.totals.item_total = releaseAmountTotal;
    console.log('[VendorInvoiceForm] Updated item_total from release amount total:', releaseAmountTotal);
    
    // Get charges and tax from the UPDATED form (after applying updates), not from the updates object
    // This ensures we use the latest values
    const chargesTotal = parseFloat(updatedForm.financial_breakdown.totals.charges_total || '0') || 0;
    const taxTotal = parseFloat(updatedForm.financial_breakdown.totals.tax_total || '0') || 0;
    const calculatedTotal = releaseAmountTotal + chargesTotal + taxTotal;
    
    console.log('[VendorInvoiceForm] Recalculated total for holdback invoice:');
    console.log('[VendorInvoiceForm]   item_total (from release):', releaseAmountTotal);
    console.log('[VendorInvoiceForm]   charges_total:', chargesTotal);
    console.log('[VendorInvoiceForm]   tax_total:', taxTotal);
    console.log('[VendorInvoiceForm]   calculatedTotal:', calculatedTotal);
    
    // Update the total_invoice_amount (single source of truth)
    updatedForm.financial_breakdown.totals.total_invoice_amount = calculatedTotal;
    updatedForm.amount = calculatedTotal;
    
    console.log('[VendorInvoiceForm] Final updatedForm.amount:', updatedForm.amount);
    console.log('[VendorInvoiceForm] Final updatedForm.financial_breakdown.totals:', updatedForm.financial_breakdown.totals);
  } else {
    // For non-holdback invoices, use the standard logic
    // Get the amount from financial_breakdown.totals.total_invoice_amount BEFORE updating the form
    // This is the exact value displayed in FinancialBreakdown component
    // total_invoice_amount is the single source of truth
    let calculatedAmount: any = null;
    
    // First, try to get from updates.financial_breakdown.totals.total_invoice_amount (this is what's displayed)
    const fb = updates.financial_breakdown;
    if (fb && typeof fb === 'object' && fb.totals) {
      // Prefer totals.total_invoice_amount; older payloads use totals.amount
      calculatedAmount =
        fb.totals.total_invoice_amount ?? (fb.totals as Record<string, unknown>).amount;
    }
    
    // Fallback to updates.amount if not found in financial_breakdown
    if ((calculatedAmount === null || calculatedAmount === undefined || calculatedAmount === '') && updates.amount !== null && updates.amount !== undefined && updates.amount !== '') {
      calculatedAmount = updates.amount;
    }
    
    // Always update the amount field to match FinancialBreakdown's calculated total
    // This is the single source of truth for the invoice amount
    // Use the exact value from FinancialBreakdown (already rounded by FinancialBreakdown)
    if (calculatedAmount !== null && calculatedAmount !== undefined && calculatedAmount !== '') {
      const amountNum = parseNumericInput(calculatedAmount);
      // Use the exact value from FinancialBreakdown - it's already rounded, so don't round again
      updatedForm.amount = amountNum;
      const mergedFb = updatedForm.financial_breakdown;
      if (!mergedFb || typeof mergedFb !== 'object') {
        updatedForm.financial_breakdown = { totals: {} };
      }
      if (
        !updatedForm.financial_breakdown.totals ||
        typeof updatedForm.financial_breakdown.totals !== 'object'
      ) {
        updatedForm.financial_breakdown.totals = {};
      }
      const t = updatedForm.financial_breakdown.totals as Record<string, unknown>;
      if (t.total_invoice_amount == null || t.total_invoice_amount === '') {
        t.total_invoice_amount = amountNum;
      }
      if (t.amount == null || t.amount === '') {
        t.amount = amountNum;
      }
    } else {
      // If no calculated amount, set to 0
      updatedForm.amount = 0;
    }
  }
  
  emit('update:form', updatedForm);
};

const previewFile = (attachment: any) => {
  selectedFileForPreview.value = {
    id: attachment.uuid || attachment.tempId,
    file_name: attachment.document_name || attachment.name,
    name: attachment.document_name || attachment.name,
    file_type: attachment.mime_type || attachment.type,
    type: attachment.mime_type || attachment.type,
    file_size: attachment.file_size || attachment.size,
    size: attachment.file_size || attachment.size,
    file_url: attachment.file_url || attachment.url || attachment.fileData,
    url: attachment.file_url || attachment.url || attachment.fileData
  };
  showFilePreviewModal.value = true;
};

const closeFilePreview = () => {
  showFilePreviewModal.value = false;
  selectedFileForPreview.value = null;
};

const formatFileSize = (size?: number | null) => {
  if (!size || size <= 0) return "0 KB";
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const removeFile = async (index: number) => {
  const attachment = props.form.attachments[index];

  if (!attachment) return;

  if (attachment?.uuid && props.editingInvoice && props.form.uuid) {
    try {
      const response = await $fetch<{ attachments: any[] }>("/api/vendor-invoices/documents/remove", {
        method: "POST",
        body: {
          invoice_uuid: props.form.uuid,
          attachment_uuid: attachment.uuid,
        },
      });
      handleFormUpdate("attachments", response?.attachments ?? []);
      return;
    } catch (error) {
      console.error("Error deleting file from storage:", error);
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

// Auto-calculate due date when bill date or credit days change
const calculateDueDate = (
  billDate: CalendarDate | null,
  creditDays: string | null,
  creditDaysId?: string | null
) => {
  if (!billDate || !creditDays) return null;
  const days = resolveCreditDaysToDayCount(creditDays, creditDaysId);
  if (typeof days !== 'number') return null;
  return billDate.add({ days });
};

// Watch for invoice type changes to clear PO Number if not "Against PO" and initialize line items for direct invoice
watch(
  () => props.form.invoice_type,
  async (newInvoiceType, oldInvoiceType) => {
    // If switching away from "Against PO", clear the PO UUID and items
    const wasAgainstPO = String(oldInvoiceType || '').toUpperCase() === 'AGAINST_PO';
    const isNowAgainstPO = String(newInvoiceType || '').toUpperCase() === 'AGAINST_PO';
    
    if (wasAgainstPO && !isNowAgainstPO) {
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('po_number', '');
      poItems.value = [];
      poItemsError.value = null;
    }
    
    // If switching to "Against PO", load PO or labor lines if PO is already selected
    if (!wasAgainstPO && isNowAgainstPO && props.form.purchase_order_uuid) {
      await syncAgainstPoDataIfNeeded(props.form.purchase_order_uuid);
      // Update amount after fetching items (will be handled by poItemsTotal watcher)
      nextTick(() => {
        const t = isLaborPO.value ? laborInvoiceItemsTotal.value : poItemsTotal.value;
        if (t > 0) {
          handleFormUpdate('amount', t);
        }
      });
    }
    
    // If switching away from "Against CO", clear the CO UUID and items
    const wasAgainstCO = String(oldInvoiceType || '').toUpperCase() === 'AGAINST_CO';
    const isNowAgainstCO = String(newInvoiceType || '').toUpperCase() === 'AGAINST_CO';
    
    if (wasAgainstCO && !isNowAgainstCO) {
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('co_number', '');
      coItems.value = [];
      coItemsError.value = null;
    }
    
    // If switching to "Against CO", load CO or labor lines if CO is already selected
    if (!wasAgainstCO && isNowAgainstCO && props.form.change_order_uuid) {
      await syncAgainstCoDataIfNeeded(props.form.change_order_uuid);
      // Update amount after fetching items (will be handled by coItemsTotal watcher)
      nextTick(() => {
        const t = isLaborCO.value ? laborInvoiceItemsTotal.value : coItemsTotal.value;
        if (t > 0) {
          handleFormUpdate('amount', t);
        }
      });
    }
    
    // If switching away from "Against Advance Payment", clear PO/CO selection and advance payment cost codes
    const wasAgainstAdvancePayment = String(oldInvoiceType || '').toUpperCase() === 'AGAINST_ADVANCE_PAYMENT';
    const isNowAgainstAdvancePayment = String(newInvoiceType || '').toUpperCase() === 'AGAINST_ADVANCE_PAYMENT';
    
    if (wasAgainstAdvancePayment && !isNowAgainstAdvancePayment) {
      handleFormUpdate('po_co_uuid', null);
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('po_number', '');
      handleFormUpdate('co_number', '');
      handleFormUpdate('advance_payment_cost_codes', []);
    }
    
    // If switching away from "Against Holdback Amount", clear PO/CO selection
    const wasAgainstHoldback = String(oldInvoiceType || '').toUpperCase() === 'AGAINST_HOLDBACK_AMOUNT';
    const isNowAgainstHoldback = String(newInvoiceType || '').toUpperCase() === 'AGAINST_HOLDBACK_AMOUNT';
    
    if (wasAgainstHoldback && !isNowAgainstHoldback) {
      handleFormUpdate('po_co_uuid', null);
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('po_number', '');
      handleFormUpdate('co_number', '');
      handleFormUpdate('holdback', null);
      handleFormUpdate('holdback_invoice_uuid', null);
      handleFormUpdate('holdback_cost_codes', []);
      poItems.value = [];
      coItems.value = [];
      poItemsError.value = null;
      coItemsError.value = null;
      holdbackReleaseAmountTotal.value = 0;
    }
    
    // If switching to "Against Holdback Amount", open modal if project and vendor are selected
    if (!wasAgainstHoldback && isNowAgainstHoldback && props.form.project_uuid && props.form.vendor_uuid) {
      showHoldbackModal.value = true;
    }
    
    // If switching to "Enter Direct Invoice", initialize line items if empty
    const isNowDirectInvoice = String(newInvoiceType || '').toUpperCase() === 'ENTER_DIRECT_INVOICE';
    if (isNowDirectInvoice && (!props.form.line_items || props.form.line_items.length === 0)) {
      handleFormUpdate('line_items', [createEmptyLineItem()]);
    }
    
    // If switching away from "Enter Direct Invoice", clear line items
    const wasDirectInvoice = String(oldInvoiceType || '').toUpperCase() === 'ENTER_DIRECT_INVOICE';
    if (wasDirectInvoice && !isNowDirectInvoice) {
      handleFormUpdate('line_items', []);
      handleFormUpdate('amount', 0);
    }
    
    // Update amount based on new invoice type
    if (isAgainstAdvancePayment.value) {
      // If switching to advance payment, update amount from advance payment total
      const newTotal = advancePaymentTotal.value;
      handleFormUpdate('amount', newTotal);
      updateFinancialBreakdownForAdvancePayment(newTotal);
    } else if (isDirectInvoice.value) {
      // If switching to direct invoice, update amount from line items total
      handleFormUpdate('amount', lineItemsTotal.value);
    }
  }
);

// Watch for project changes to clear dependent fields
watch(
  () => props.form.project_uuid,
  (newProjectUuid, oldProjectUuid) => {
    // Skip clearing fields if we're loading an existing invoice (uuid exists)
    // This prevents watchers from clearing fields during initial load
    if (props.form.uuid && props.editingInvoice && !oldProjectUuid) {
      return;
    }
    
    // If project is cleared, clear invoice type and all subsequent fields
    if (!newProjectUuid && oldProjectUuid) {
      handleFormUpdate('invoice_type', null);
      handleFormUpdate('vendor_uuid', null);
      handleFormUpdate('credit_days', null);
      handleFormUpdate('credit_days_id', null);
      handleFormUpdate('due_date', null);
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('po_number', '');
      handleFormUpdate('po_co_uuid', null);
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('co_number', '');
    }
    // If project changed and we have a PO selected, clear it
    else if (newProjectUuid !== oldProjectUuid && props.form.purchase_order_uuid) {
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('po_number', '');
    }
    // If project changed and we have a CO selected, clear it
    else if (newProjectUuid !== oldProjectUuid && props.form.change_order_uuid) {
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('co_number', '');
    }
    // If project changed and we have a PO/CO selected (for advance payment), clear it
    else if (newProjectUuid !== oldProjectUuid && props.form.po_co_uuid) {
      handleFormUpdate('po_co_uuid', null);
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('po_number', '');
      handleFormUpdate('co_number', '');
    }
  }
);

// Watch for vendor changes to clear PO if it doesn't match the new vendor
watch(
  () => props.form.vendor_uuid,
  (newVendorUuid, oldVendorUuid) => {
    // Skip clearing while hydrating an existing invoice: first assignment of vendor (undefined → uuid)
    // matches "vendor change" and would wipe CO / po_co_uuid / co_number after load.
    if (props.form.uuid && props.editingInvoice && !oldVendorUuid) {
      return;
    }
    // If vendor changed and we have a PO selected, clear it
    if (newVendorUuid !== oldVendorUuid && props.form.purchase_order_uuid) {
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('po_number', '');
    }
    // If vendor changed and we have a CO selected, clear it
    if (newVendorUuid !== oldVendorUuid && props.form.change_order_uuid) {
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('co_number', '');
    }
    // If vendor changed and we have a PO/CO selected (for advance payment), clear it
    if (newVendorUuid !== oldVendorUuid && props.form.po_co_uuid) {
      handleFormUpdate('po_co_uuid', null);
      handleFormUpdate('purchase_order_uuid', null);
      handleFormUpdate('change_order_uuid', null);
      handleFormUpdate('po_number', '');
      handleFormUpdate('co_number', '');
    }
  }
);

// Watch for corporation/project/vendor changes to ensure PO/CO data is fetched for POCOSelect
// This ensures POCOSelect has data for the form's corporation, not TopBar's corporation
watch(
  [() => props.form.corporation_uuid, () => props.form.project_uuid, () => props.form.vendor_uuid],
  async ([newCorpUuid, newProjectUuid, newVendorUuid], [oldCorpUuid, oldProjectUuid, oldVendorUuid]) => {
    // Only fetch if we have all required fields and something changed
    if (newCorpUuid && newProjectUuid && newVendorUuid) {
      const corpChanged = newCorpUuid !== oldCorpUuid;
      const projectChanged = newProjectUuid !== oldProjectUuid;
      const vendorChanged = newVendorUuid !== oldVendorUuid;
      
      // Fetch PO/CO data when corporation changes (force refresh to ensure fresh data)
      // Also fetch when project or vendor changes if corporation is set (to ensure data is available)
      if (corpChanged || (projectChanged && newCorpUuid) || (vendorChanged && newCorpUuid)) {
        try {
          await Promise.allSettled([
            purchaseOrdersStore.fetchPurchaseOrders(newCorpUuid, corpChanged), // forceRefresh only if corp changed
            changeOrdersStore.fetchChangeOrders(newCorpUuid, corpChanged), // forceRefresh only if corp changed
          ]);
        } catch (error) {
          console.error('[VendorInvoiceForm] Error fetching PO/CO data:', error);
        }
      }
    }
  },
  { immediate: false } // Don't run immediately - let handleCorporationChange handle initial fetch
);

// Watch for purchase_order_uuid or change_order_uuid changes to update po_co_uuid for POCOSelect component
// This is mainly for when loading existing invoices, not for user selections (which are handled by handlePOCOChange)
// We use a flag to prevent circular updates when handlePOCOChange is setting values
const isUpdatingAdvancePaymentAmount = ref(false); // Guard flag to prevent recursive updates
const isUpdatingDueDate = ref(false); // Guard flag to prevent recursive updates when calculating due date
const isFetchingHoldbackInvoiceDetails = ref(false); // Guard flag to prevent recursive fetches

// Watch for holdback_invoice_uuid to fetch PO/CO number when loading existing invoice
watch(
  [() => props.form.holdback_invoice_uuid, () => props.form.uuid, () => props.editingInvoice, () => props.form.invoice_type],
  async ([newHoldbackInvoiceUuid, newUuid, newEditingInvoice, newInvoiceType], [oldHoldbackInvoiceUuid]) => {
    
    // Only fetch for existing holdback invoices
    if (!newHoldbackInvoiceUuid || !newUuid || !newEditingInvoice) {
      return;
    }
    
    // Only fetch if invoice type is AGAINST_HOLDBACK_AMOUNT
    if (String(newInvoiceType || '').toUpperCase() !== 'AGAINST_HOLDBACK_AMOUNT') {
      return;
    }
    
    // Always fetch if holdback_invoice_uuid changed (loading new invoice)
    // Or if PO/CO number is missing/empty (even if it's an empty string)
    const poNumberEmpty = !props.form.po_number || String(props.form.po_number).trim() === '';
    const coNumberEmpty = !props.form.co_number || String(props.form.co_number).trim() === '';
    const shouldFetch = newHoldbackInvoiceUuid !== oldHoldbackInvoiceUuid || 
                       (poNumberEmpty && coNumberEmpty);
    
    if (shouldFetch) {
      // Add a small delay to ensure form is fully loaded
      await nextTick();
      // Fetch holdback invoice details to get PO/CO number
      await fetchHoldbackInvoiceDetails();
    }
  },
  { immediate: true }
);

// Watch for po_co_uuid to fetch PO/CO number when it's set but number is missing
// This handles the case where po_co_uuid is set but po_number/co_number are empty
watch(
  [() => props.form.po_co_uuid, () => props.form.po_number, () => props.form.co_number, () => props.form.invoice_type, () => props.form.uuid, () => props.editingInvoice],
  async ([newPoCoUuid, newPoNumber, newCoNumber, invoiceType, uuid, editingInvoice], [oldPoCoUuid]) => {
    const t = String(invoiceType || '').toUpperCase();
    // Holdback / Against PO / Against CO: hydrate PO or CO number when po_co_uuid is set but label is missing
    if (!['AGAINST_HOLDBACK_AMOUNT', 'AGAINST_PO', 'AGAINST_CO'].includes(t)) {
      return;
    }
    
    // Only for existing invoices
    if (!uuid || !editingInvoice) {
      return;
    }
    
    // Only if po_co_uuid is set and changed
    if (!newPoCoUuid || newPoCoUuid === oldPoCoUuid) {
      return;
    }
    
    // Only if PO/CO number is missing
    const poNumberEmpty = !newPoNumber || String(newPoNumber).trim() === '';
    const coNumberEmpty = !newCoNumber || String(newCoNumber).trim() === '';
    
    if (!poNumberEmpty && !coNumberEmpty) {
      return; // Already has numbers
    }
    
    // Extract UUID from po_co_uuid (format: "PO:uuid" or "CO:uuid")
    if (newPoCoUuid.startsWith('PO:')) {
      const poUuid = newPoCoUuid.replace(/^PO:/, '').trim();
      if (poUuid && poNumberEmpty) {
        try {
          const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
          const poNumber = poResponse?.data?.po_number || '';
          if (poNumber) {
            const updatedForm = { ...props.form };
            updatedForm.po_number = poNumber;
            emit('update:form', updatedForm);
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching PO number:', error);
        }
      }
    } else if (newPoCoUuid.startsWith('CO:')) {
      const coUuid = newPoCoUuid.replace(/^CO:/, '').trim();
      if (coUuid && coNumberEmpty) {
        try {
          const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
          const coNumber = coResponse?.data?.co_number || '';
          if (coNumber) {
            const updatedForm = { ...props.form };
            updatedForm.co_number = coNumber;
            emit('update:form', updatedForm);
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Error fetching CO number:', error);
        }
      }
    }
  },
  { immediate: true }
);

watch(
  [() => props.form.purchase_order_uuid, () => props.form.change_order_uuid, () => props.form.invoice_type],
  async ([newPurchaseOrderUuid, newChangeOrderUuid, invoiceType], [oldPurchaseOrderUuid, oldChangeOrderUuid, oldInvoiceType]) => {
    // Skip if we're currently updating from POCOSelect to avoid circular updates
    if (isUpdatingFromPOCOSelect.value) {
      return;
    }
    
    // Only update if we're in "Against Advance Payment" mode (not "Against PO")
    const isAgainstAdvancePayment = String(invoiceType || '').toUpperCase() === 'AGAINST_ADVANCE_PAYMENT';
    const isAgainstPO = String(invoiceType || '').toUpperCase() === 'AGAINST_PO';
    
    // Skip if we're in Against PO mode - handlePOCOChangeForPO handles that
    if (isAgainstPO) {
      return;
    }
    
    if (isAgainstAdvancePayment) {
      // Only update po_co_uuid if it's not already set correctly (to avoid circular updates)
      const currentPoCoUuid = props.form.po_co_uuid;
      
      // If purchase_order_uuid is set and po_co_uuid doesn't match, update it
      if (newPurchaseOrderUuid && currentPoCoUuid !== `PO:${newPurchaseOrderUuid}`) {
        handleFormUpdate('po_co_uuid', `PO:${newPurchaseOrderUuid}`);
      }
      // If change_order_uuid is set and po_co_uuid doesn't match, update it
      else if (newChangeOrderUuid && currentPoCoUuid !== `CO:${newChangeOrderUuid}`) {
        handleFormUpdate('po_co_uuid', `CO:${newChangeOrderUuid}`);
      }
      // If both are cleared, clear po_co_uuid
      else if (!newPurchaseOrderUuid && !newChangeOrderUuid && (oldPurchaseOrderUuid || oldChangeOrderUuid)) {
        handleFormUpdate('po_co_uuid', null);
        // Clear labor invoice items and types when PO/CO is cleared
        laborInvoiceItems.value = [];
        laborInvoiceItemsError.value = null;
        poType.value = null;
        coType.value = null;
      }

      // For AGAINST_ADVANCE_PAYMENT, fetch PO/CO type and handle labor items
      if (newPurchaseOrderUuid && newPurchaseOrderUuid !== oldPurchaseOrderUuid) {
        // Fetch PO type and store it
        try {
          const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${newPurchaseOrderUuid}`);
          poType.value = poResponse?.data?.po_type?.toUpperCase() || null;
          if (poType.value === 'LABOR') {
            await fetchLaborInvoiceItems(newPurchaseOrderUuid, 'purchase_order');
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Could not fetch PO type for advance payment:', error);
          poType.value = null;
        }
      } else if (newChangeOrderUuid && newChangeOrderUuid !== oldChangeOrderUuid) {
        // Fetch CO type and store it
        try {
          const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${newChangeOrderUuid}`);
          coType.value = coResponse?.data?.co_type?.toUpperCase() || null;
          if (coType.value === 'LABOR') {
            await fetchLaborInvoiceItems(newChangeOrderUuid, 'change_order');
          }
        } catch (error) {
          console.warn('[VendorInvoiceForm] Could not fetch CO type for advance payment:', error);
          coType.value = null;
        }
      }
    }
  },
  { immediate: true } // Run immediately when component mounts to handle initial load
);

// Watch for advance payment cost codes changes to update amount and financial_breakdown
// Watch the array directly to catch all changes including initial mount
// Use a flag to track if this is the initial load of an existing invoice
const isInitialLoad = ref(true);

// Reset initial load flag when switching between invoices
watch(
  () => props.form.uuid,
  (newUuid, oldUuid) => {
    // Reset initial load flag when UUID changes (including when reopening after closing)
    // This ensures proper initialization when reopening the same or different invoice
    // Also reset when UUID becomes undefined (form is closed/reset)
    if (newUuid !== oldUuid) {
      // Always reset initial load flag when UUID changes
      isInitialLoad.value = true;
      // Reset the updating flag when form is closed/reset
      if (!newUuid) {
        isUpdatingAdvancePaymentAmount.value = false;
      } else {
        // When opening a new invoice, ensure updating flag is reset
        // Use nextTick to ensure this happens after other watchers
        nextTick(() => {
          isUpdatingAdvancePaymentAmount.value = false;
        });
      }
    }
  },
  { immediate: false }
);

watch(
  () => props.form.advance_payment_cost_codes,
  (newCostCodes, oldCostCodes) => {
    // Skip if we're already updating to prevent recursive updates
    if (isUpdatingAdvancePaymentAmount.value) {
      return;
    }
    
    // Skip if invoice type is not advance payment
    if (!isAgainstAdvancePayment.value) {
      return;
    }
    
    // Skip if form is being closed/reset (no UUID and no cost codes)
    if (!props.form.uuid && (!newCostCodes || !Array.isArray(newCostCodes) || newCostCodes.length === 0)) {
      return;
    }
    
    // For existing invoices, we still need to update the financial breakdown
    // to ensure item_total and total_invoice_amount match the current advance payment total
    const isExistingInvoice = props.form.uuid && props.editingInvoice;
    
    // Check if cost codes just became available (were empty/undefined, now have data)
    // This handles the case when reopening an invoice and cost codes are loaded asynchronously
    const wasEmpty = !oldCostCodes || !Array.isArray(oldCostCodes) || oldCostCodes.length === 0;
    const isNowAvailable = Array.isArray(newCostCodes) && newCostCodes.length > 0;
    const costCodesBecameAvailable = wasEmpty && isNowAvailable;
    
    // Check if this is initial load BEFORE setting it to false
    const isInitialLoadOfExisting = isInitialLoad.value && isExistingInvoice;
    
    const newTotal = advancePaymentTotal.value;
    const currentAmount = props.form.amount || 0;
    
    // For existing invoices on initial load, always update to ensure financial breakdown is correct
    // For subsequent changes, only update if the total actually changed
    // Also update if financial breakdown is missing or incomplete
    // Also update if cost codes just became available (reopening case)
    const hasFinancialBreakdown = props.form.financial_breakdown && 
      typeof props.form.financial_breakdown === 'object' &&
      props.form.financial_breakdown.totals &&
      props.form.financial_breakdown.totals.item_total !== null &&
      props.form.financial_breakdown.totals.item_total !== undefined &&
      props.form.financial_breakdown.totals.tax_total !== null &&
      props.form.financial_breakdown.totals.tax_total !== undefined;
    
    const currentItemTotal = props.form.financial_breakdown?.totals?.item_total || 0;
    const totalsMatch = Math.abs(currentItemTotal - newTotal) < 0.01;
    
    const shouldUpdate = isInitialLoadOfExisting || 
      costCodesBecameAvailable ||
      !hasFinancialBreakdown ||
      !totalsMatch ||
      Math.abs(newTotal - currentAmount) > 0.01;
    
    if (shouldUpdate && newTotal > 0) {
      isUpdatingAdvancePaymentAmount.value = true;
      try {
        handleFormUpdate('amount', newTotal);
        // Update financial breakdown - this will trigger FinancialBreakdown component to recalculate
        updateFinancialBreakdownForAdvancePayment(newTotal, true); // Pass skipGuard=true since we already have guard
        // Use nextTick to ensure the update is processed and FinancialBreakdown component can detect the change
        nextTick(() => {
          // FinancialBreakdown component should now recalculate with the updated item_total
        });
      } finally {
        // Mark initial load as complete AFTER update (but only if we have cost codes)
        if (isInitialLoad.value && isNowAvailable) {
          isInitialLoad.value = false;
        }
        // Reset flag after a short delay to allow the update to complete
        nextTick(() => {
          isUpdatingAdvancePaymentAmount.value = false;
        });
      }
    } else if (isInitialLoad.value && isNowAvailable && hasFinancialBreakdown && totalsMatch) {
      // Even if we don't update, mark initial load as complete if everything is already correct
      isInitialLoad.value = false;
    }
  },
  { immediate: true, deep: true } // Immediate and deep watch to catch initial values and nested property changes
);

// Handle adjusted amount change from AdvancePaymentBreakdownTable
const handleAdjustedAmountChange = (advancePaymentUuid: string, costCode: any, amount: number | null) => {
  // This is handled by handleAdjustedAmountsUpdate, but we keep it for individual change tracking if needed
  // The parent component will receive the full update via adjusted-amounts-update event
};

// Calculate total adjusted amount from adjusted advance payment amounts
const totalAdjustedAdvancePayment = computed(() => {
  let total = 0;
  Object.values(adjustedAdvancePaymentAmounts.value).forEach((costCodeAmounts) => {
    Object.values(costCodeAmounts).forEach((amount) => {
      total += amount || 0;
    });
  });
  return total;
});

/**
 * Dollar advance applied in FinancialBreakdown: **only** the sum of amounts in Advance Payment Breakdown
 * adjust-amount inputs (persisted as `adjusted_advance_payment_amounts`). Do not fall back to full
 * PO/CO advance totals — that matched the "remaining after /" display and not what the user entered.
 */
const effectiveAdvancePaymentDeduction = computed(() => {
  if (!isAgainstPO.value && !isAgainstCO.value) {
    return 0;
  }
  return roundCurrencyValue(totalAdjustedAdvancePayment.value ?? 0);
});

/** Sum of advance amounts allocated to Sales Tax 1 / 2 in Advance Payment Breakdown (for Configure COA). */
const advanceTaxCreditsBySalesTaxLine = computed((): Partial<Record<'sales_tax_1' | 'sales_tax_2', number>> => {
  let sales_tax_1 = 0;
  let sales_tax_2 = 0;
  for (const byCc of Object.values(adjustedAdvancePaymentAmounts.value)) {
    if (!byCc || typeof byCc !== 'object') continue;
    sales_tax_1 += Number(byCc[taxAdjustmentKey('sales_tax_1')]) || 0;
    sales_tax_2 += Number(byCc[taxAdjustmentKey('sales_tax_2')]) || 0;
  }
  const out: Partial<Record<'sales_tax_1' | 'sales_tax_2', number>> = {};
  if (sales_tax_1 > 0) out.sales_tax_1 = roundCurrencyValue(sales_tax_1);
  if (sales_tax_2 > 0) out.sales_tax_2 = roundCurrencyValue(sales_tax_2);
  return out;
});

/** Same total passed to FinancialBreakdown as :item-total (PO/CO invoice lines only). */
const financialBreakdownItemTotal = computed(() => {
  if (isAgainstPO.value) {
    const raw = isLaborPO.value
      ? laborInvoiceItemsTotal.value
      : poItemsTotal.value + poLwmItemsTotal.value;
    return roundCurrencyValue(raw || 0);
  }
  if (isAgainstCO.value) {
    const raw = isLaborCO.value
      ? laborInvoiceItemsTotal.value
      : coItemsTotal.value + coLwmItemsTotal.value;
    return roundCurrencyValue(raw || 0);
  }
  return 0;
});

/** Block save when advance applied exceeds invoice line-item total (FinancialBreakdown would show invalid deduction). */
const hasInvoiceItemsLessThanAdvanceError = computed(() => {
  if (!isAgainstPO.value && !isAgainstCO.value) return false;
  const advanceApplied = roundCurrencyValue(effectiveAdvancePaymentDeduction.value ?? 0);
  if (advanceApplied <= 0) return false;
  return financialBreakdownItemTotal.value < advanceApplied;
});

/** Shown in UBanner above FinancialBreakdown and appended after “Cannot save:” on submit toast. */
const invoiceItemsLessThanAdvanceBannerDescription = computed(() => {
  if (!hasInvoiceItemsLessThanAdvanceError.value) return '';
  return `Invoice items total (${formatCurrency(financialBreakdownItemTotal.value)}) cannot be less than advance payments already applied (${formatCurrency(roundCurrencyValue(effectiveAdvancePaymentDeduction.value))}). Increase line items or reduce adjusted advance amounts before saving.`;
});

// Configure COA modal: per-GL advance $ from adjusted amounts (cost code → gl_account_uuid)
watch(
  () => [
    adjustedAdvancePaymentAmounts.value,
    props.form.invoice_type,
    isLaborPO.value,
    isLaborCO.value,
    poItemBreakdownByAccount.value,
    coItemBreakdownByAccount.value,
    laborInvoiceItemsBreakdownByAccount.value,
  ] as const,
  async () => {
    const invoiceType = String(props.form.invoice_type || '').toUpperCase();
    let breakdown: { accountUuid: string; total: number }[] = [];
    if (invoiceType === 'AGAINST_PO') {
      breakdown = isLaborPO.value ? laborInvoiceItemsBreakdownByAccount.value : poItemBreakdownByAccount.value;
    } else if (invoiceType === 'AGAINST_CO') {
      breakdown = isLaborCO.value ? laborInvoiceItemsBreakdownByAccount.value : coItemBreakdownByAccount.value;
    } else {
      advanceAmountsByBreakdownRow.value = [];
      return;
    }

    const amounts = adjustedAdvancePaymentAmounts.value;
    const costCodeUuids = new Set<string>();
    for (const byCc of Object.values(amounts)) {
      if (!byCc || typeof byCc !== 'object') continue;
      for (const [ccUuid, raw] of Object.entries(byCc)) {
        if (isTaxAdjustmentKey(ccUuid)) continue;
        const amt = Number(raw);
        if (Number.isFinite(amt) && amt > 0) costCodeUuids.add(ccUuid);
      }
    }
    if (costCodeUuids.size === 0) {
      advanceAmountsByBreakdownRow.value = breakdown.map(() => 0);
      return;
    }

    const details = await fetchCostCodeDetails([...costCodeUuids]);

    advanceAmountsByBreakdownRow.value = buildAdvanceAmountsByRow({
      breakdown,
      adjustedAmounts: amounts,
      costCodeDetailsByUuid: details,
      round2: roundCurrencyValue,
    });
  },
  { deep: true }
);

// Handle adjusted amounts update from AdvancePaymentBreakdownTable
const handleAdjustedAmountsUpdate = (adjustedAmounts: Record<string, Record<string, number>>) => {
  // Set guard to prevent watcher from overwriting this update
  isUpdatingAdjustedAmounts.value = true;
  
  // Deep copy to ensure Vue reactivity works properly with nested objects
  const deepCopiedAmounts: Record<string, Record<string, number>> = JSON.parse(JSON.stringify(adjustedAmounts));
  adjustedAdvancePaymentAmounts.value = deepCopiedAmounts;
  
  // Force trigger reactivity to ensure computed properties update
  triggerRef(adjustedAdvancePaymentAmounts);
  
  // Calculate total adjusted amount
  let totalAdjusted = 0;
  Object.values(deepCopiedAmounts).forEach((costCodeAmounts) => {
    Object.values(costCodeAmounts).forEach((amount) => {
      totalAdjusted += amount || 0;
    });
  });
  
  // If there are adjusted amounts, we should also track which advance payment is being adjusted
  // Find the first advance payment UUID that has adjustments
  const firstAdjustedPaymentUuid = Object.keys(deepCopiedAmounts).find(uuid => 
    Object.keys(deepCopiedAmounts[uuid] || {}).length > 0
  );
  
  // IMPORTANT: Emit both fields in a SINGLE update to avoid race condition
  // When calling handleFormUpdate twice in sequence, the second call may use stale props.form
  // because Vue reactivity hasn't propagated the first update yet
  const updatedFields: Record<string, any> = {
    adjusted_advance_payment_amounts: deepCopiedAmounts,
    adjusted_advance_payment_uuid: (firstAdjustedPaymentUuid && totalAdjusted > 0) 
      ? firstAdjustedPaymentUuid 
      : null
  };
  
  // Emit a single update with both fields
  emit('update:form', { 
    ...props.form, 
    ...updatedFields 
  });
  
  // Reset guard after a short delay to allow the form update to complete
  nextTick(() => {
    isUpdatingAdjustedAmounts.value = false;
  });
};

// Watch for form UUID and invoice type changes to ensure financial breakdown is initialized
// This handles the case when reopening an existing advance payment invoice
watch(
  [() => props.form.uuid, () => props.form.invoice_type, () => props.editingInvoice],
  ([newUuid, newInvoiceType, newEditingInvoice], [oldUuid, oldInvoiceType, oldEditingInvoice]) => {
    // Skip if form is being closed/reset (UUID becomes undefined)
    if (!newUuid) {
      return;
    }
    
    // Only handle advance payment invoices
    if (String(newInvoiceType || '').toUpperCase() !== 'AGAINST_ADVANCE_PAYMENT') {
      return;
    }
    
    // Only handle existing invoices that are being edited
    const isExistingInvoice = newUuid && newEditingInvoice;
    if (!isExistingInvoice) {
      return;
    }
    
    // Check if UUID changed (reopening an invoice) or invoice type changed to advance payment
    // UUID changed when: going from undefined/null to a UUID (opening), or from one UUID to another (switching)
    const uuidChanged = newUuid !== oldUuid && newUuid;
    const invoiceTypeChanged = newInvoiceType !== oldInvoiceType && 
      String(newInvoiceType || '').toUpperCase() === 'AGAINST_ADVANCE_PAYMENT';
    
    if (uuidChanged || invoiceTypeChanged) {
      // Reset initial load flag when UUID changes (this should already be set by UUID watcher, but ensure it)
      isInitialLoad.value = true;
      
      // Wait for data to be loaded - use multiple ticks to ensure advance_payment_cost_codes are available
      nextTick(() => {
        nextTick(() => {
          // Check if advance payment cost codes are available
          const costCodes = Array.isArray(props.form.advance_payment_cost_codes) 
            ? props.form.advance_payment_cost_codes 
            : [];
          
          if (costCodes.length > 0) {
            const advanceTotal = advancePaymentTotal.value;
            
            // Check if financial breakdown needs initialization
            const hasFinancialBreakdown = props.form.financial_breakdown && 
              typeof props.form.financial_breakdown === 'object' &&
              props.form.financial_breakdown.totals &&
              props.form.financial_breakdown.totals.item_total !== null &&
              props.form.financial_breakdown.totals.item_total !== undefined &&
              props.form.financial_breakdown.totals.tax_total !== null &&
              props.form.financial_breakdown.totals.tax_total !== undefined;
            
            const currentItemTotal = props.form.financial_breakdown?.totals?.item_total || 0;
            
            // Initialize if financial breakdown is missing, incomplete, or if totals don't match
            if (!hasFinancialBreakdown || Math.abs(currentItemTotal - advanceTotal) > 0.01) {
              if (advanceTotal > 0 && !isUpdatingAdvancePaymentAmount.value) {
                isUpdatingAdvancePaymentAmount.value = true;
                try {
                  handleFormUpdate('amount', advanceTotal);
                  updateFinancialBreakdownForAdvancePayment(advanceTotal, true);
                } finally {
                  nextTick(() => {
                    isUpdatingAdvancePaymentAmount.value = false;
                  });
                }
              }
            }
          }
        });
      });
    }
  },
  { immediate: false } // Don't run immediately - let the advance_payment_cost_codes watcher handle initial load
);

// Watch for when advance_payment_cost_codes becomes available (for existing invoices)
// This handles the case when reopening an invoice and the cost codes are loaded asynchronously
watch(
  () => props.form.advance_payment_cost_codes,
  (newCostCodes, oldCostCodes) => {
    // Only handle advance payment invoices
    if (!isAgainstAdvancePayment.value) {
      return;
    }
    
    // Only handle existing invoices
    const isExistingInvoice = props.form.uuid && props.editingInvoice;
    if (!isExistingInvoice) {
      return;
    }
    
    // Check if cost codes just became available (were empty/undefined, now have data)
    const wasEmpty = !oldCostCodes || !Array.isArray(oldCostCodes) || oldCostCodes.length === 0;
    const isNowAvailable = Array.isArray(newCostCodes) && newCostCodes.length > 0;
    
    if (wasEmpty && isNowAvailable && isInitialLoad.value) {
      // Cost codes just became available - ensure financial breakdown is initialized
      const advanceTotal = advancePaymentTotal.value;
      if (advanceTotal > 0 && !isUpdatingAdvancePaymentAmount.value) {
        isUpdatingAdvancePaymentAmount.value = true;
        try {
          handleFormUpdate('amount', advanceTotal);
          updateFinancialBreakdownForAdvancePayment(advanceTotal, true);
        } finally {
          nextTick(() => {
            isUpdatingAdvancePaymentAmount.value = false;
            isInitialLoad.value = false;
          });
        }
      }
    }
  },
  { immediate: false, deep: true }
);

// Calculate holdback amount from percentage for PO invoices
// Holdback is calculated from: itemTotal + chargesTotal + taxTotal (before advance payment deduction)
// This needs to be reactive to changes in financial breakdown totals
const poHoldbackAmount = computed(() => {
  if (!isAgainstPO.value || !props.form.holdback) {
    return 0
  }
  
  // Get the base total (item total + charges + taxes) from financial breakdown
  // If financial breakdown is not available yet, calculate from poItemsTotal
  let baseTotal = poItemsTotal.value
  
  // Try to get charges and taxes from financial breakdown if available
  const financialBreakdown = props.form.financial_breakdown
  if (financialBreakdown) {
    let fb = financialBreakdown
    if (typeof fb === 'string') {
      try {
        fb = JSON.parse(fb)
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    if (fb && typeof fb === 'object' && fb.totals) {
      const itemTotal = parseNumericInput(fb.totals.item_total || poItemsTotal.value)
      const chargesTotal = parseNumericInput(fb.totals.charges_total || 0)
      const taxTotal = parseNumericInput(fb.totals.tax_total || 0)
      baseTotal = itemTotal + chargesTotal + taxTotal
    }
  }
  
  const holdbackPercentage = parseNumericInput(props.form.holdback)
  if (holdbackPercentage <= 0 || baseTotal <= 0) {
    return 0
  }
  
  return roundCurrencyValue((baseTotal * holdbackPercentage) / 100)
})

// Calculate holdback amount from percentage for CO invoices
// Holdback is calculated from: itemTotal + chargesTotal + taxTotal (before advance payment deduction)
// This needs to be reactive to changes in financial breakdown totals
const coHoldbackAmount = computed(() => {
  if (!isAgainstCO.value || !props.form.holdback) {
    return 0
  }
  
  // Get the base total (item total + charges + taxes) from financial breakdown
  // If financial breakdown is not available yet, calculate from coItemsTotal
  let baseTotal = coItemsTotal.value
  
  // Try to get charges and taxes from financial breakdown if available
  const financialBreakdown = props.form.financial_breakdown
  if (financialBreakdown) {
    let fb = financialBreakdown
    if (typeof fb === 'string') {
      try {
        fb = JSON.parse(fb)
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    if (fb && typeof fb === 'object' && fb.totals) {
      const itemTotal = parseNumericInput(fb.totals.item_total || coItemsTotal.value)
      const chargesTotal = parseNumericInput(fb.totals.charges_total || 0)
      const taxTotal = parseNumericInput(fb.totals.tax_total || 0)
      baseTotal = itemTotal + chargesTotal + taxTotal
    }
  }
  
  const holdbackPercentage = parseNumericInput(props.form.holdback)
  if (holdbackPercentage <= 0 || baseTotal <= 0) {
    return 0
  }
  
  return roundCurrencyValue((baseTotal * holdbackPercentage) / 100)
})

// Watch for financial_breakdown changes - REMOVED
// The handleFinancialBreakdownUpdate function now handles all amount updates directly from FinancialBreakdown
// This ensures we use the exact value from financial_breakdown.totals.total_invoice_amount (the displayed value)

// Watch poItemsTotal to ensure FinancialBreakdown recalculates when invoice values change
// This matches the behavior of direct invoices where lineItemsTotal changes trigger recalculation
// The FinancialBreakdown component watches itemTotal prop and will automatically recalculate charges/taxes
watch(
  () => poItemsTotal.value,
  (newTotal, oldTotal) => {
    if (isAgainstPO.value && newTotal !== oldTotal) {
      // FinancialBreakdown component automatically watches itemTotal and recalculates
      // No manual intervention needed - same as direct invoices
    }
  }
);

// Watch coItemsTotal to ensure FinancialBreakdown recalculates when invoice values change
// This matches the behavior of PO invoices where poItemsTotal changes trigger recalculation
// The FinancialBreakdown component watches itemTotal prop and will automatically recalculate charges/taxes
watch(
  () => coItemsTotal.value,
  (newTotal, oldTotal) => {
    if (isAgainstCO.value && newTotal !== oldTotal) {
      // FinancialBreakdown component automatically watches itemTotal and recalculates
      // No manual intervention needed - same as PO invoices
    }
  }
);

// Watch laborInvoiceItemsTotal to ensure FinancialBreakdown recalculates when labor invoice amounts change
// This matches the behavior of material PO/CO invoices where item totals trigger recalculation
watch(
  () => laborInvoiceItemsTotal.value,
  (newTotal, oldTotal) => {
    if ((isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value)) {
      if (newTotal !== oldTotal) {
        // FinancialBreakdown component automatically watches itemTotal and recalculates
        // This ensures amount field is updated when labor invoice amounts change
        // For labor invoices, charges are hidden, so total = labor items total + taxes only
      }
    }
  }
);

// Compute item total breakdown by preferred chart of account (for Configure COA modal)
// Includes both regular PO items and location-wise material items
watch(
  [() => poItems.value, () => poLwmItems.value],
  async ([items, lwmItems]) => {
    const corporationUuid = props.form.corporation_uuid;
    const hasRegularItems = items?.length > 0;
    const hasLwm = lwmItems?.length > 0;
    if ((!hasRegularItems && !hasLwm) || !corporationUuid) {
      poItemBreakdownByAccount.value = [];
      return;
    }

    const allCostCodeUuids = new Set<string>();
    if (hasRegularItems) {
      for (const item of items!) {
        if (item.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
      }
    }
    if (hasLwm) {
      for (const item of lwmItems!) {
        if (item.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
      }
    }
    if (allCostCodeUuids.size === 0) {
      poItemBreakdownByAccount.value = [];
      return;
    }

    const costCodeDetails = await fetchCostCodeDetails([...allCostCodeUuids]);
    const byAccount = new Map<string, number>();

    if (hasRegularItems) {
      for (const item of items!) {
        const amount = getItemAmountForBreakdown(item);
        if (amount <= 0 || !item.cost_code_uuid) continue;
        const config = costCodeDetails[item.cost_code_uuid];
        const accountUuid = config?.gl_account_uuid;
        if (!accountUuid) continue;
        byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + amount);
      }
    }
    if (hasLwm) {
      for (const lwm of lwmItems!) {
        const amount = parseFloat(String(lwm.invoice_amount || 0));
        if (amount <= 0 || !lwm.cost_code_uuid) continue;
        const config = costCodeDetails[lwm.cost_code_uuid];
        const accountUuid = config?.gl_account_uuid;
        if (!accountUuid) continue;
        byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + roundCurrencyValue(amount));
      }
    }

    poItemBreakdownByAccount.value = Array.from(byAccount.entries()).map(([accountUuid, total]) => ({
      accountUuid,
      total: roundCurrencyValue(total),
    }));
  },
  { immediate: true, deep: true }
);

watch(
  [() => coItems.value, () => coLwmItems.value],
  async ([items, lwmItems]) => {
    const corporationUuid = props.form.corporation_uuid;
    const hasRegularItems = items?.length > 0;
    const hasLwm = lwmItems?.length > 0;
    if ((!hasRegularItems && !hasLwm) || !corporationUuid) {
      coItemBreakdownByAccount.value = [];
      return;
    }

    const allCostCodeUuids = new Set<string>();
    if (hasRegularItems) {
      for (const item of items!) {
        if (item.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
      }
    }
    if (hasLwm) {
      for (const item of lwmItems!) {
        if (item.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
      }
    }
    if (allCostCodeUuids.size === 0) {
      coItemBreakdownByAccount.value = [];
      return;
    }

    const costCodeDetails = await fetchCostCodeDetails([...allCostCodeUuids]);
    const byAccount = new Map<string, number>();

    if (hasRegularItems) {
      for (const item of items!) {
        const amount = getItemAmountForBreakdown(item);
        if (amount <= 0 || !item.cost_code_uuid) continue;
        const config = costCodeDetails[item.cost_code_uuid];
        const accountUuid = config?.gl_account_uuid;
        if (!accountUuid) continue;
        byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + amount);
      }
    }
    if (hasLwm) {
      for (const lwm of lwmItems!) {
        const amount = parseFloat(String(lwm.invoice_amount || 0));
        if (amount <= 0 || !lwm.cost_code_uuid) continue;
        const config = costCodeDetails[lwm.cost_code_uuid];
        const accountUuid = config?.gl_account_uuid;
        if (!accountUuid) continue;
        byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + roundCurrencyValue(amount));
      }
    }

    coItemBreakdownByAccount.value = Array.from(byAccount.entries()).map(([accountUuid, total]) => ({
      accountUuid,
      total: roundCurrencyValue(total),
    }));
  },
  { immediate: true, deep: true }
);

// Enter Direct Invoice: aggregate line item amounts by GL (cost code → gl_account_uuid), for Configure COA + Nimble BillEntrySave
watch(
  [() => lineItems.value, () => props.form.corporation_uuid, () => isDirectInvoice.value],
  async ([items, corporationUuid, direct]) => {
    if (!direct || !corporationUuid || !Array.isArray(items) || items.length === 0) {
      directInvoiceItemBreakdownByAccount.value = [];
      return;
    }

    const allCostCodeUuids = new Set<string>();
    for (const item of items) {
      if (item?.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
    }
    if (allCostCodeUuids.size === 0) {
      directInvoiceItemBreakdownByAccount.value = [];
      return;
    }

    const costCodeDetails = await fetchCostCodeDetails([...allCostCodeUuids]);
    const byAccount = new Map<string, number>();

    for (const item of items) {
      const amount = computeLineItemEffectiveTotal(item);
      if (amount <= 0 || !item.cost_code_uuid) continue;
      const config = costCodeDetails[item.cost_code_uuid];
      const accountUuid = config?.gl_account_uuid;
      if (!accountUuid) continue;
      byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + amount);
    }

    directInvoiceItemBreakdownByAccount.value = Array.from(byAccount.entries()).map(([accountUuid, total]) => ({
      accountUuid,
      total: roundCurrencyValue(total),
    }));
  },
  { immediate: true, deep: true }
);

// Labor PO / Labor CO: aggregate invoice_amount by GL (cost code → gl_account_uuid), for Configure COA + Nimble BillEntrySave
watch(
  [
    laborInvoiceItems,
    () => props.form.corporation_uuid,
    isLaborPO,
    isLaborCO,
    isAgainstPO,
    isAgainstCO,
  ],
  async () => {
    const laborMode =
      (isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value);
    const corporationUuid = props.form.corporation_uuid;
    const items = laborInvoiceItems.value;
    if (!laborMode || !corporationUuid || !Array.isArray(items) || items.length === 0) {
      laborInvoiceItemsBreakdownByAccount.value = [];
      return;
    }

    const allCostCodeUuids = new Set<string>();
    for (const item of items) {
      if (item?.cost_code_uuid) allCostCodeUuids.add(item.cost_code_uuid);
    }
    if (allCostCodeUuids.size === 0) {
      laborInvoiceItemsBreakdownByAccount.value = [];
      return;
    }

    const costCodeDetails = await fetchCostCodeDetails([...allCostCodeUuids]);
    const byAccount = new Map<string, number>();

    for (const item of items) {
      const amount = parseFloat(String(item?.invoice_amount ?? 0));
      if (!Number.isFinite(amount) || amount <= 0 || !item?.cost_code_uuid) continue;
      const config = costCodeDetails[item.cost_code_uuid];
      const accountUuid = config?.gl_account_uuid;
      if (!accountUuid) continue;
      byAccount.set(accountUuid, (byAccount.get(accountUuid) ?? 0) + roundCurrencyValue(amount));
    }

    laborInvoiceItemsBreakdownByAccount.value = Array.from(byAccount.entries()).map(([accountUuid, total]) => ({
      accountUuid,
      total: roundCurrencyValue(total),
    }));
  },
  { immediate: true, deep: true }
);

// Clear item breakdown by account when invoice type or PO/CO selection changes so the Configure COA modal
// never shows stale breakdown (e.g. when switching from Against PO to Against CO)
watch(
  () => [
    String(props.form.invoice_type || '').toUpperCase(),
    props.form.purchase_order_uuid,
    props.form.change_order_uuid,
  ] as const,
  ([invoiceType, poUuid, coUuid], prev) => {
    const [prevInvoiceType, prevPoUuid, prevCoUuid] = prev ?? [undefined, undefined, undefined];
    // On invoice type change, clear both so the active section shows fresh data when items load
    if (invoiceType !== prevInvoiceType) {
      poItemBreakdownByAccount.value = [];
      coItemBreakdownByAccount.value = [];
      laborInvoiceItemsBreakdownByAccount.value = [];
      directInvoiceItemBreakdownByAccount.value = [];
    }
    if (invoiceType !== 'AGAINST_PO') {
      poItemBreakdownByAccount.value = [];
    }
    if (invoiceType !== 'AGAINST_CO') {
      coItemBreakdownByAccount.value = [];
    }
    if (invoiceType !== 'ENTER_DIRECT_INVOICE') {
      directInvoiceItemBreakdownByAccount.value = [];
    }
    if (poUuid !== prevPoUuid) {
      poItemBreakdownByAccount.value = [];
      laborInvoiceItemsBreakdownByAccount.value = [];
    }
    if (coUuid !== prevCoUuid) {
      coItemBreakdownByAccount.value = [];
      laborInvoiceItemsBreakdownByAccount.value = [];
    }
  },
  { immediate: true }
);

/** Overlay persisted Configure COA GL UUIDs onto computed item rows for the modal (index-aligned). */
const againstPoCoaItemBreakdown = computed(() => {
  const base = isLaborPO.value
    ? laborInvoiceItemsBreakdownByAccount.value
    : poItemBreakdownByAccount.value;
  return mergeSavedCoaAccountUuidsOntoItemBreakdown(
    base,
    props.form.item_breakdown_by_account,
    props.form.coa_assignments
  );
});

const againstCoCoaItemBreakdown = computed(() => {
  const base = isLaborCO.value
    ? laborInvoiceItemsBreakdownByAccount.value
    : coItemBreakdownByAccount.value;
  return mergeSavedCoaAccountUuidsOntoItemBreakdown(
    base,
    props.form.item_breakdown_by_account,
    props.form.coa_assignments
  );
});

const holdbackCoaItemBreakdown = computed(() =>
  mergeSavedCoaAccountUuidsOntoItemBreakdown(
    holdbackItemBreakdownByAccount.value,
    props.form.item_breakdown_by_account,
    props.form.coa_assignments
  )
);

const directCoaItemBreakdown = computed(() =>
  mergeSavedCoaAccountUuidsOntoItemBreakdown(
    directInvoiceItemBreakdownByAccount.value,
    props.form.item_breakdown_by_account,
    props.form.coa_assignments
  )
);

// COA breakdown for Nimble BillEntrySave is added at save time by VendorInvoicesList via getCoaBreakdownForSave().
// We do not sync it to the form here to avoid extra update:form emissions that overwrite the "last" emit in tests.

// Watch poItems to sync invoice values to form.po_invoice_items for saving
// This ensures the invoice items are saved to the database when the form is submitted
const isUpdatingPOInvoiceItems = ref(false);
watch(
  () => poItems.value,
  (newItems) => {
    // Skip if we're already updating to prevent infinite loops
    if (isUpdatingPOInvoiceItems.value) return;
    
    if (isAgainstPO.value && Array.isArray(newItems) && newItems.length > 0) {
      // Convert poItems to po_invoice_items format for saving
      const poInvoiceItems = newItems.map((item: any, index: number) => ({
        order_index: index,
        po_item_uuid: item.po_item_uuid || item.id || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        division_name: item.division_name || null,
        item_type_uuid: item.item_type_uuid || null,
        item_type_label: item.item_type_label || '',
        item_uuid: item.item_uuid || null,
        item_name: item.item_name || item.description || '',
        description: item.description || '',
        model_number: item.model_number || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location || item.location_label || null,
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
        invoice_quantity: item.invoice_quantity ?? item.po_quantity ?? null,
        invoice_unit_price: item.invoice_unit_price ?? item.po_unit_price ?? null,
        invoice_total: item.invoice_total ?? item.po_total ?? null,
        approval_checks: item.approval_checks || [],
        metadata: item.metadata || {}
      }));
      
      // Update form with po_invoice_items
      isUpdatingPOInvoiceItems.value = true;
      try {
        handleFormUpdate('po_invoice_items', poInvoiceItems);
      } finally {
        nextTick(() => {
          isUpdatingPOInvoiceItems.value = false;
        });
      }
    } else if (isAgainstPO.value && (!newItems || newItems.length === 0)) {
      // Clear po_invoice_items if no items
      isUpdatingPOInvoiceItems.value = true;
      try {
        handleFormUpdate('po_invoice_items', []);
      } finally {
        nextTick(() => {
          isUpdatingPOInvoiceItems.value = false;
        });
      }
    }
  },
  { deep: true }
);

// Watch coItems to sync invoice values to form.co_invoice_items for saving
// This ensures the invoice items are saved to the database when the form is submitted
watch(
  () => coItems.value,
  (newItems) => {
    // Skip if we're already updating to prevent infinite loops
    if (isUpdatingCOInvoiceItems.value) return;
    
    if (isAgainstCO.value && Array.isArray(newItems) && newItems.length > 0) {
      // Convert coItems to co_invoice_items format for saving
      const coInvoiceItems = newItems.map((item: any, index: number) => ({
        order_index: index,
        co_item_uuid: item.co_item_uuid || item.id || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        division_name: item.division_name || null,
        item_type_uuid: item.item_type_uuid || null,
        item_type_label: item.item_type_label || '',
        item_uuid: item.item_uuid || null,
        item_name: item.item_name || item.name || item.description || '',
        description: item.description || '',
        model_number: item.model_number || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location || item.location_label || null,
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
        invoice_quantity: item.invoice_quantity !== null && item.invoice_quantity !== undefined ? item.invoice_quantity : null,
        invoice_unit_price: item.invoice_unit_price !== null && item.invoice_unit_price !== undefined ? item.invoice_unit_price : null,
        invoice_total: item.invoice_total !== null && item.invoice_total !== undefined ? item.invoice_total : null,
        metadata: item.metadata || {}
      }));
      
      // Update form with co_invoice_items
      isUpdatingCOInvoiceItems.value = true;
      try {
        handleFormUpdate('co_invoice_items', coInvoiceItems);
      } finally {
        nextTick(() => {
          isUpdatingCOInvoiceItems.value = false;
        });
      }
    } else if (isAgainstCO.value && (!newItems || newItems.length === 0)) {
      // Clear co_invoice_items if no items
      isUpdatingCOInvoiceItems.value = true;
      try {
        handleFormUpdate('co_invoice_items', []);
      } finally {
        nextTick(() => {
          isUpdatingCOInvoiceItems.value = false;
        });
      }
    }
  },
  { deep: true }
);

watch(
  () => poLwmItems.value,
  (newItems) => {
    if (isUpdatingPoLwmInvoiceItems.value) return;
    if (isAgainstPO.value && Array.isArray(newItems) && newItems.length > 0) {
      const lwmInvoiceItems = newItems.map((item: any, index: number) => ({
        order_index: index,
        po_lwm_uuid: item.po_lwm_uuid || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        division_name: item.division_name || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location_label || '',
        material_budgeted_amount: item.material_budgeted_amount,
        po_amount: item.po_amount,
        invoice_amount: item.invoice_amount ?? 0,
        description: item.description || '',
        metadata: item.metadata || {},
      }));
      isUpdatingPoLwmInvoiceItems.value = true;
      try {
        handleFormUpdate('po_lwm_invoice_items', lwmInvoiceItems);
      } finally {
        nextTick(() => { isUpdatingPoLwmInvoiceItems.value = false; });
      }
    } else if (isAgainstPO.value && (!newItems || newItems.length === 0)) {
      isUpdatingPoLwmInvoiceItems.value = true;
      try {
        handleFormUpdate('po_lwm_invoice_items', []);
      } finally {
        nextTick(() => { isUpdatingPoLwmInvoiceItems.value = false; });
      }
    }
  },
  { deep: true }
);

watch(
  () => coLwmItems.value,
  (newItems) => {
    if (isUpdatingCoLwmInvoiceItems.value) return;
    if (isAgainstCO.value && Array.isArray(newItems) && newItems.length > 0) {
      const lwmInvoiceItems = newItems.map((item: any, index: number) => ({
        order_index: index,
        co_lwm_uuid: item.co_lwm_uuid || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_label: item.cost_code_label || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        division_name: item.division_name || '',
        location_uuid: item.location_uuid || null,
        location_label: item.location_label || '',
        material_budgeted_amount: item.material_budgeted_amount,
        po_amount: item.po_amount,
        co_amount: item.co_amount,
        invoice_amount: item.invoice_amount ?? 0,
        description: item.description || '',
        metadata: item.metadata || {},
      }));
      isUpdatingCoLwmInvoiceItems.value = true;
      try {
        handleFormUpdate('co_lwm_invoice_items', lwmInvoiceItems);
      } finally {
        nextTick(() => { isUpdatingCoLwmInvoiceItems.value = false; });
      }
    } else if (isAgainstCO.value && (!newItems || newItems.length === 0)) {
      isUpdatingCoLwmInvoiceItems.value = true;
      try {
        handleFormUpdate('co_lwm_invoice_items', []);
      } finally {
        nextTick(() => { isUpdatingCoLwmInvoiceItems.value = false; });
      }
    }
  },
  { deep: true }
);

// Watch for PO items total changes - DO NOT auto-update amount for Against PO invoices
// For Against PO, the amount should only come from financial_breakdown.totals.total_invoice_amount
// or be manually entered by the user (for partial payments)
// This watcher is intentionally disabled for Against PO to allow partial payments

// Watch for line items changes to update amount (for direct invoices)
watch(
  () => lineItemsTotal.value,
  (newTotal) => {
    if (isDirectInvoice.value) {
      // Only update if financial breakdown is not being used
      // Financial breakdown will override this if it's active
      if (!props.form.financial_breakdown || 
          !props.form.financial_breakdown.totals || 
          !props.form.financial_breakdown.totals.total_invoice_amount) {
        handleFormUpdate('amount', newTotal);
      }
    }
  }
);

// Watch for bill date and credit days changes to auto-calculate due date
watch(
  [() => billDateValue.value, () => props.form.credit_days, () => props.form.credit_days_id],
  ([newBillDate, newCreditDays, newCreditDaysId], [oldBillDate, oldCreditDays, oldCreditDaysId]) => {
    // Skip if we're already updating to prevent recursive updates
    if (isUpdatingDueDate.value) {
      return;
    }
    
    // Only auto-calculate if both bill date and credit days are set
    if (newBillDate && newCreditDays) {
      // Check if due date was manually set (different from calculated)
      const calculatedDueDate = calculateDueDate(newBillDate, newCreditDays, newCreditDaysId);
      if (calculatedDueDate) {
        // Calculate the new due date string
        const newDueDateString = `${calculatedDueDate.year}-${String(calculatedDueDate.month).padStart(2, '0')}-${String(calculatedDueDate.day).padStart(2, '0')}`;
        const newDueDateValue = newDueDateString;
        
        // Get current due date from form (avoid reading computed property to prevent recursion)
        const currentDueDateValue = props.form.due_date;
        
        // Calculate old due date if we had both old values
        let oldCalculatedDueDateValue: string | null = null;
        if (oldBillDate && oldCreditDays) {
          const oldCalculated = calculateDueDate(oldBillDate, oldCreditDays, oldCreditDaysId);
          if (oldCalculated) {
            const oldDateString = `${oldCalculated.year}-${String(oldCalculated.month).padStart(2, '0')}-${String(oldCalculated.day).padStart(2, '0')}`;
            oldCalculatedDueDateValue = oldDateString;
          }
        }
        
        // Check if bill date changed (by comparing the date strings)
        const billDateChanged = oldBillDate && newBillDate && 
          (oldBillDate.year !== newBillDate.year || 
           oldBillDate.month !== newBillDate.month || 
           oldBillDate.day !== newBillDate.day);
        
        // Check if credit days changed (handle empty/null/undefined cases)
        const creditDaysChanged =
          String(oldCreditDays || '') !== String(newCreditDays || '') ||
          String(oldCreditDaysId || '') !== String(newCreditDaysId || '');
        
        // Update if:
        // 1. Due date is empty/null, OR
        // 2. Bill date changed (always recalculate when bill date changes), OR
        // 3. Credit days changed (always recalculate when credit days changes), OR
        // 4. Current due date matches the old calculated value (meaning it was auto-calculated, not manually set)
        const shouldUpdate = !currentDueDateValue || 
                            billDateChanged ||
                            creditDaysChanged ||
                            (oldCalculatedDueDateValue && currentDueDateValue === oldCalculatedDueDateValue);
        
        // Only update if the new value is different from current
        if (shouldUpdate && currentDueDateValue !== newDueDateValue) {
          isUpdatingDueDate.value = true;
          try {
            handleFormUpdate('due_date', newDueDateValue);
          } finally {
            // Reset flag after a short delay to allow the update to complete
            nextTick(() => {
              isUpdatingDueDate.value = false;
            });
          }
        }
      }
    } else if (!newBillDate || !newCreditDays) {
      // If either bill date or credit days is cleared, clear due date only if it was auto-calculated
      // We can't easily determine if it was manually set, so we'll leave it as is to avoid clearing user input
    }
  },
  { flush: 'post' }
);

// Watch for uploaded files changes
watch(() => uploadedFiles.value, async () => {
  fileUploadError.value = null;

  if (uploadedFiles.value.length === 0) {
    return;
  }

  if (isUploading.value) {
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const file of uploadedFiles.value) {
    if (!allowedTypes.includes(file.type)) {
      fileUploadError.value = "Invalid file type. Only PDF or image files are allowed.";
      uploadedFiles.value = [];
      return;
    }

    if (file.size > maxSize) {
      fileUploadError.value = "File size too large. Maximum size is 10MB.";
      uploadedFiles.value = [];
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

    if (props.editingInvoice && props.form.uuid) {
      try {
        const response = await $fetch<{
          attachments: any[];
          errors?: Array<{ fileName: string; error: string }>;
        }>("/api/vendor-invoices/documents/upload", {
          method: "POST",
          body: {
            invoice_uuid: props.form.uuid,
            files: pendingAttachments.map((file: any) => ({
              name: file.name,
              type: file.type,
              size: file.size,
              fileData: file.fileData,
            })),
          },
        });

        handleFormUpdate("attachments", response?.attachments ?? []);
        uploadedFiles.value = [];

        if (response?.errors?.length) {
          fileUploadError.value = response.errors
            .map((err) => err.error)
            .join(", ");
        } else {
          fileUploadError.value = null;
        }
      } catch (error) {
        console.error("Error uploading invoice files:", error);
        fileUploadError.value = "Failed to upload files. Please try again.";
      }
      return;
    }

    const allAttachments = [
      ...(props.form.attachments || []),
      ...pendingAttachments.map((file: any) => ({
        ...file,
        isUploaded: false,
      })),
    ];

    handleFormUpdate("attachments", allAttachments);
    uploadedFiles.value = [];
  } catch (error) {
    console.error("Error processing files:", error);
    fileUploadError.value = "Failed to process files. Please try again.";
  } finally {
    isUploading.value = false;
  }
}, { deep: true });

// Watch for form corporation_uuid changes to regenerate invoice number if needed
watch(
  () => props.form.corporation_uuid,
  async (newCorpUuid) => {
    if (newCorpUuid) {
      // Fetch cost code configurations for the new corporation (scoped to form)
      // Note: We don't fetch vendorInvoicesStore here to avoid polluting the global store
      // The form operates independently with its own corporation selection
      await Promise.allSettled([
        costCodeConfigurationsStore.fetchConfigurations(newCorpUuid, false, false),
      ]);
      
      // Regenerate invoice number if creating new invoice and number is empty
      if (!props.editingInvoice && !props.form.uuid && (!props.form.number || String(props.form.number).trim() === '')) {
        await generateInvoiceNumber();
      }
    }
  }
);

// Initialize
onMounted(async () => {
  await refreshCreditDaysOptions();
  // Initialize corporation_uuid from form or fallback to selected corporation
  // For new invoices, use the selected corporation from TopBar as default
  // For existing invoices, use the form's corporation_uuid
  // NOTE: The form's corporation selection is isolated from TopBar's selection
  if (!props.form.corporation_uuid && !props.form.uuid) {
    // New invoice: initialize with selected corporation from TopBar as default
    const selectedCorpUuid = corpStore.selectedCorporation?.uuid;
    if (selectedCorpUuid) {
      handleFormUpdate('corporation_uuid', selectedCorpUuid);
    }
  }
  
  // Use form's corporation_uuid, fallback to TopBar's only for initial load
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid;
  if (corpUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(corpUuid),
      projectsStore.fetchProjectsMetadata(corpUuid),
      // Note: vendorInvoicesStore.fetchVendorInvoices is scoped to TopBar's corporation
      // We don't fetch it here to avoid polluting the global store
      // The form will fetch vendor invoices directly from API when needed
      costCodeConfigurationsStore.fetchConfigurations(corpUuid, false, false),
      // Fetch PO/CO data for the form's corporation so POCOSelect can use it
      // This ensures POCOSelect shows data for the form's corporation, not TopBar's
      purchaseOrdersStore.fetchPurchaseOrders(corpUuid, false), // Don't force refresh on mount
      changeOrdersStore.fetchChangeOrders(corpUuid, false), // Don't force refresh on mount
      // One shared load for PO/CO line ApprovalChecksSelect rows (store coalesces duplicates).
      approvalChecksStore.fetchApprovalChecks(false),
      // One shared load for UOMSelect rows (store coalesces duplicates).
      uomStore.fetchUOM(undefined, false),
    ]);
    
    // If project is already selected, ensure project resources are loaded
    // This uses purchaseOrderResourcesStore which is scoped to the form's corporation
    // This ensures POItemsTableWithEstimates has cost codes, item types, and preferred items
    if (props.form.project_uuid) {
      await purchaseOrderResourcesStore.ensureProjectResources({
        corporationUuid: corpUuid,
        projectUuid: props.form.project_uuid,
      });
    }
  } else {
    void approvalChecksStore.fetchApprovalChecks(false);
    void uomStore.fetchUOM(undefined, false);
  }
  
  // Wait for all async operations and computed values to be ready
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Initialize amount based on invoice type first (before invoice number generation)
  // to ensure it's set correctly on mount
  // Skip this for existing invoices with populated financial_breakdown to preserve existing data
  if (isAgainstAdvancePayment.value) {
    const isExistingInvoice = props.form.uuid && props.editingInvoice;
    const total = advancePaymentTotal.value;
    
    // Check if financial_breakdown exists and has correct values
    const hasExistingFinancialBreakdown = props.form.financial_breakdown && 
      typeof props.form.financial_breakdown === 'object' &&
      props.form.financial_breakdown.totals &&
      props.form.financial_breakdown.totals.item_total !== null &&
      props.form.financial_breakdown.totals.item_total !== undefined &&
      props.form.financial_breakdown.totals.tax_total !== null &&
      props.form.financial_breakdown.totals.tax_total !== undefined;
    
    // Check if totals match
    const currentItemTotal = props.form.financial_breakdown?.totals?.item_total || 0;
    const totalsMatch = Math.abs(currentItemTotal - total) < 0.01;
    
    // Update on mount if:
    // 1. New invoice (always initialize)
    // 2. Existing invoice without financial breakdown
    // 3. Existing invoice where totals don't match
    if (!isExistingInvoice || !hasExistingFinancialBreakdown || !totalsMatch) {
      // Always update on mount if there's a total, regardless of current amount
      // The watcher will handle subsequent changes
      if (total > 0) {
        isUpdatingAdvancePaymentAmount.value = true;
        try {
          handleFormUpdate('amount', total);
          updateFinancialBreakdownForAdvancePayment(total, true); // Pass skipGuard=true since we already have guard
        } finally {
          nextTick(() => {
            isUpdatingAdvancePaymentAmount.value = false;
          });
        }
      }
    } else if (isExistingInvoice && hasExistingFinancialBreakdown) {
      // Even if totals match, ensure tax_total is 0 (not null) for advance payments
      const taxTotal = props.form.financial_breakdown.totals.tax_total;
      if (taxTotal === null || taxTotal === undefined) {
        isUpdatingAdvancePaymentAmount.value = true;
        try {
          updateFinancialBreakdownForAdvancePayment(total, true);
        } finally {
          nextTick(() => {
            isUpdatingAdvancePaymentAmount.value = false;
          });
        }
      }
    }
  } else if (isDirectInvoice.value) {
    const total = lineItemsTotal.value;
    if (total > 0) {
      handleFormUpdate('amount', total);
    }
  }
  
  // If creating and number empty, generate initial number (after amount is set)
  if (!props.editingInvoice && !props.form.uuid && (!props.form.number || String(props.form.number).trim() === '')) {
    await generateInvoiceNumber();
  }
  
  // Against PO / Against CO data load: handled by watch on purchase_order_uuid / change_order_uuid (immediate)

  // If loading an existing invoice tied to a PO/CO, fetch PO/CO numbers when missing (holdback, Against PO, Against CO)
  if (
    (isAgainstHoldback.value || isAgainstPO.value || isAgainstCO.value) &&
    props.form.uuid &&
    props.editingInvoice
  ) {
    const poNumberEmpty = !props.form.po_number || String(props.form.po_number).trim() === '';
    const coNumberEmpty = !props.form.co_number || String(props.form.co_number).trim() === '';

    if (props.form.purchase_order_uuid && poNumberEmpty) {
      try {
        const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${props.form.purchase_order_uuid}`);
        const poNumber = poResponse?.data?.po_number || '';
        if (poNumber) {
          handleFormUpdate('po_number', poNumber);
          handleFormUpdate('po_co_uuid', `PO:${props.form.purchase_order_uuid}`);
        }
      } catch (error) {
        console.warn('[VendorInvoiceForm] onMounted: Error fetching PO number for holdback invoice:', error);
      }
    } else if (props.form.change_order_uuid && coNumberEmpty) {
      try {
        const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${props.form.change_order_uuid}`);
        const coNumber = coResponse?.data?.co_number || '';
        if (coNumber) {
          handleFormUpdate('co_number', coNumber);
          handleFormUpdate('po_co_uuid', `CO:${props.form.change_order_uuid}`);
        }
      } catch (error) {
        console.warn('[VendorInvoiceForm] onMounted: Error fetching CO number for holdback invoice:', error);
      }
    }
  }
  
  // Also check if po_co_uuid is set but po_number/co_number are missing
  if (
    (isAgainstHoldback.value || isAgainstPO.value || isAgainstCO.value) &&
    props.form.po_co_uuid &&
    props.form.uuid &&
    props.editingInvoice
  ) {
    const poNumberEmpty = !props.form.po_number || String(props.form.po_number).trim() === '';
    const coNumberEmpty = !props.form.co_number || String(props.form.co_number).trim() === '';
    
    if (poNumberEmpty || coNumberEmpty) {
      // Extract UUID from po_co_uuid and fetch the number
      if (props.form.po_co_uuid.startsWith('PO:')) {
        const poUuid = props.form.po_co_uuid.replace(/^PO:/, '').trim();
        if (poUuid && poNumberEmpty) {
          try {
            const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${poUuid}`);
            const poNumber = poResponse?.data?.po_number || '';
            if (poNumber) {
              handleFormUpdate('po_number', poNumber);
            }
          } catch (error) {
            console.warn('[VendorInvoiceForm] onMounted: Error fetching PO number:', error);
          }
        }
      } else if (props.form.po_co_uuid.startsWith('CO:')) {
        const coUuid = props.form.po_co_uuid.replace(/^CO:/, '').trim();
        if (coUuid && coNumberEmpty) {
          try {
            const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${coUuid}`);
            const coNumber = coResponse?.data?.co_number || '';
            if (coNumber) {
              handleFormUpdate('co_number', coNumber);
            }
          } catch (error) {
            console.warn('[VendorInvoiceForm] onMounted: Error fetching CO number:', error);
          }
        }
      }
    }
  }
  
  // Note: We don't need to manually initialize amount for Against PO/CO invoices in onMounted
  // The watch function on financial_breakdown (lines 3546-3591) handles syncing the amount
  // from financial_breakdown.totals.total_invoice_amount automatically, both for new and existing invoices
});

// Validation: Check for items with invoice quantity > to_be_invoiced
const parseNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) return 0;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const overInvoicedItems = computed(() => {
  const items: any[] = [];
  
  // Check PO items
  if (isAgainstPO.value && Array.isArray(poItems.value)) {
    poItems.value.forEach((item: any, index: number) => {
      const toBeInvoiced = parseNumericValue(item.to_be_invoiced ?? 0);
      const invoiceQty = parseNumericValue(item.invoice_quantity ?? 0);
      
      if (toBeInvoiced > 0 && invoiceQty > toBeInvoiced) {
        items.push({
          ...item,
          index,
          to_be_invoiced: toBeInvoiced,
          invoice_quantity: invoiceQty,
          over_invoiced_quantity: invoiceQty - toBeInvoiced,
          source: 'PO'
        });
      }
    });
  }
  
  // Check CO items
  if (isAgainstCO.value && Array.isArray(coItems.value)) {
    coItems.value.forEach((item: any, index: number) => {
      const toBeInvoiced = parseNumericValue(item.to_be_invoiced ?? 0);
      const invoiceQty = parseNumericValue(item.invoice_quantity ?? 0);

      if (toBeInvoiced > 0 && invoiceQty > toBeInvoiced) {
        items.push({
          ...item,
          index,
          to_be_invoiced: toBeInvoiced,
          invoice_quantity: invoiceQty,
          over_invoiced_quantity: invoiceQty - toBeInvoiced,
          source: 'CO'
        });
      }
    });
  }

  // Check labor invoice items
  if ((isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value)) {
    laborInvoiceItems.value.forEach((item: any, index: number) => {
      const remainingAmount = parseNumericValue(item.remaining_amount ?? item.po_amount ?? item.co_amount ?? item.labor_budgeted_amount ?? 0);
      const invoiceAmount = parseNumericValue(item.invoice_amount ?? 0);

      if (remainingAmount > 0 && invoiceAmount > remainingAmount) {
        items.push({
          ...item,
          index,
          item_name: item.cost_code_label || item.cost_code_name || `Labor Item ${index + 1}`,
          remaining_amount: remainingAmount,
          invoice_amount: invoiceAmount,
          over_invoiced_amount: invoiceAmount - remainingAmount,
          source: isLaborPO.value ? 'Labor PO' : 'Labor CO'
        });
      }
    });
  }

  return items;
});

const hasOverInvoicedItems = computed(() => overInvoicedItems.value.length > 0);

// Check if all items have to_be_invoiced === 0 (no items available to invoice)
const hasAllItemsZeroToBeInvoiced = computed(() => {
  // Only check for new invoices (not editing existing ones)
  if (props.form.uuid) return false;

  // Labor PO / Labor CO first — avoids misclassifying when material poItems/coItems are stale
  if ((isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value)) {
    if (Array.isArray(laborInvoiceItems.value) && laborInvoiceItems.value.length > 0) {
      const allZero = laborInvoiceItems.value.every((item: any) => {
        const remainingAmount = parseNumericValue(item.remaining_amount ?? 0);
        return remainingAmount <= 0;
      });
      return allZero;
    }
    return false;
  }

  // Material Against PO
  if (isAgainstPO.value && Array.isArray(poItems.value) && poItems.value.length > 0) {
    const allZero = poItems.value.every((item: any) => {
      const toBeInvoiced = parseNumericValue(item.to_be_invoiced ?? 0);
      return toBeInvoiced <= 0;
    });
    return allZero;
  }

  // Material Against CO
  if (isAgainstCO.value && Array.isArray(coItems.value) && coItems.value.length > 0) {
    const allZero = coItems.value.every((item: any) => {
      const toBeInvoiced = parseNumericValue(item.to_be_invoiced ?? 0);
      return toBeInvoiced <= 0;
    });
    return allZero;
  }

  return false;
});

const hasLaborPoFullAdvanceAdjustmentError = computed(() => {
  // Applies only to new "Against PO" labor invoices.
  if (!isAgainstPO.value || !isLaborPO.value || props.editingInvoice) return false;
  if (!Array.isArray(laborInvoiceItems.value) || laborInvoiceItems.value.length === 0) return false;

  // Trigger this rule only when invoice amounts fully consume all remaining amounts.
  const hasFullConsumption = laborInvoiceItems.value.every((item: any) => {
    const remainingAmount = parseNumericValue(item.remaining_amount ?? 0);
    const invoiceAmount = parseNumericValue(item.invoice_amount ?? 0);
    if (remainingAmount <= 0) return true;
    return Math.abs(invoiceAmount - remainingAmount) < 0.01;
  });
  if (!hasFullConsumption) return false;

  // Prefer live totals from AdvancePaymentBreakdownTable when available.
  const breakdownRef = poAdvancePaymentBreakdownRef.value as any;
  let totalRemainingAdvance = parseNumericValue(
    breakdownRef?.totalRemainingAdjustableAmount ?? 0
  );
  let totalAdjustedAdvance = parseNumericValue(
    breakdownRef?.totalAdjustedAmount ?? totalAdjustedAdvancePayment.value
  );

  // Fallback when the table ref is not yet mounted.
  if (totalRemainingAdvance <= 0) {
    const totalPreviouslyAdjustedAdvance = previouslyAdjustedCostCodes.value.reduce(
      (sum: number, cc: any) => sum + parseNumericValue(cc?.adjusted_amount ?? 0),
      0
    );
    totalRemainingAdvance = Math.max(
      0,
      parseNumericValue(poAdvancePaid.value) - totalPreviouslyAdjustedAdvance
    );
  }
  if (totalRemainingAdvance <= 0) return false;

  return Math.abs(totalAdjustedAdvance - totalRemainingAdvance) >= 0.01;
});

const hasLaborCoFullAdvanceAdjustmentError = computed(() => {
  // Applies only to new "Against CO" labor invoices.
  if (!isAgainstCO.value || !isLaborCO.value || props.editingInvoice) return false;
  if (!Array.isArray(laborInvoiceItems.value) || laborInvoiceItems.value.length === 0) return false;

  // Trigger this rule only when invoice amounts fully consume all remaining amounts.
  const hasFullConsumption = laborInvoiceItems.value.every((item: any) => {
    const remainingAmount = parseNumericValue(item.remaining_amount ?? 0);
    const invoiceAmount = parseNumericValue(item.invoice_amount ?? 0);
    if (remainingAmount <= 0) return true;
    return Math.abs(invoiceAmount - remainingAmount) < 0.01;
  });
  if (!hasFullConsumption) return false;

  // Prefer live totals from AdvancePaymentBreakdownTable when available.
  const breakdownRef = coAdvancePaymentBreakdownRef.value as any;
  let totalRemainingAdvance = parseNumericValue(
    breakdownRef?.totalRemainingAdjustableAmount ?? 0
  );
  const totalAdjustedAdvance = parseNumericValue(
    breakdownRef?.totalAdjustedAmount ?? totalAdjustedAdvancePayment.value
  );

  // Fallback when the table ref is not yet mounted.
  if (totalRemainingAdvance <= 0) {
    const totalPreviouslyAdjustedAdvance = previouslyAdjustedCostCodes.value.reduce(
      (sum: number, cc: any) => sum + parseNumericValue(cc?.adjusted_amount ?? 0),
      0
    );
    totalRemainingAdvance = Math.max(
      0,
      parseNumericValue(coAdvancePaid.value) - totalPreviouslyAdjustedAdvance
    );
  }
  if (totalRemainingAdvance <= 0) return false;

  return Math.abs(totalAdjustedAdvance - totalRemainingAdvance) >= 0.01;
});

const hasMaterialPoFullAdvanceAdjustmentError = computed(() => {
  // Applies only to new "Against PO" item-wise material invoices.
  if (!isAgainstPO.value || isLaborPO.value || hasPoLwmItems.value || props.editingInvoice) return false;
  if (!Array.isArray(poItems.value) || poItems.value.length === 0) return false;

  // Trigger this rule only when invoice quantities fully consume all remaining PO quantities.
  const hasFullConsumption = poItems.value.every((item: any) => {
    const remainingQty = parseNumericValue(item.to_be_invoiced ?? 0);
    const invoiceQty = parseNumericValue(item.invoice_quantity ?? 0);
    if (remainingQty <= 0) return true;
    return Math.abs(invoiceQty - remainingQty) < 0.0001;
  });
  if (!hasFullConsumption) return false;

  // Prefer live totals from AdvancePaymentBreakdownTable when available.
  const breakdownRef = poAdvancePaymentBreakdownRef.value as any;
  let totalRemainingAdvance = parseNumericValue(
    breakdownRef?.totalRemainingAdjustableAmount ?? 0
  );
  let totalAdjustedAdvance = parseNumericValue(
    breakdownRef?.totalAdjustedAmount ?? totalAdjustedAdvancePayment.value
  );

  // Fallback when table totals are not available yet.
  if (totalRemainingAdvance <= 0) {
    const totalPreviouslyAdjustedAdvance = previouslyAdjustedCostCodes.value.reduce(
      (sum: number, cc: any) => sum + parseNumericValue(cc?.adjusted_amount ?? 0),
      0
    );
    totalRemainingAdvance = Math.max(
      0,
      parseNumericValue(poAdvancePaid.value) - totalPreviouslyAdjustedAdvance
    );
  }
  if (totalRemainingAdvance <= 0) return false;

  return Math.abs(totalAdjustedAdvance - totalRemainingAdvance) >= 0.01;
});

// Check for over-adjusted advance payment amounts
const advancePaymentBelowConsumedValidation = computed(() =>
  validateAdvancePaymentNotBelowConsumed({
    advancePaymentCostCodes: props.form.advance_payment_cost_codes,
    financialBreakdown: props.form.financial_breakdown,
    consumedByKey: consumedAdvanceAmountsByKey.value,
  })
);

const hasAdvancePaymentBelowConsumedError = computed(() => {
  if (!isAgainstAdvancePayment.value) return false;
  if (!props.editingInvoice || !props.form.uuid) return false;
  if (Object.keys(consumedAdvanceAmountsByKey.value).length === 0) return false;
  return !advancePaymentBelowConsumedValidation.value.valid;
});

const advancePaymentBelowConsumedBannerDescription = computed(() => {
  const errors = advancePaymentBelowConsumedValidation.value.errors;
  if (errors.length === 0) {
    return 'Amounts already adjusted in other vendor invoices cannot be reduced. Increase cost code or tax amounts before saving.';
  }
  return errors[0];
});

const hasAdvancePaymentValidationError = computed(() => {
  if (isAgainstPO.value) {
    const tableValidationError = poAdvancePaymentBreakdownRef.value?.hasValidationError ?? false;
    return tableValidationError || hasLaborPoFullAdvanceAdjustmentError.value || hasMaterialPoFullAdvanceAdjustmentError.value;
  }
  if (isAgainstCO.value) {
    const tableValidationError = coAdvancePaymentBreakdownRef.value?.hasValidationError ?? false;
    return tableValidationError || hasLaborCoFullAdvanceAdjustmentError.value;
  }
  // Check for over-advanced or below-consumed amounts in "Against Advance Payment" invoices
  if (isAgainstAdvancePayment.value) {
    const tableValidationError = advancePaymentCostCodesTableRef.value?.hasValidationError ?? false;
    return tableValidationError || hasAdvancePaymentBelowConsumedError.value;
  }
  return false;
});

const hasHoldbackValidationError = computed(() => {
  // Check if all holdback amounts are zero (all available amounts are zero)
  if (isAgainstHoldback.value && allHoldbackAmountsZero.value) {
    return true;
  }
  // Check for validation errors from the holdback breakdown table
  if (isAgainstHoldback.value && holdbackBreakdownTableRef.value) {
    return holdbackBreakdownTableRef.value.hasValidationError ?? false;
  }
  return false;
});

const overInvoicedValidationError = computed(() => {
  if (
    !hasOverInvoicedItems.value &&
    !hasAdvancePaymentValidationError.value &&
    !hasAllItemsZeroToBeInvoiced.value &&
    !hasInvoiceItemsLessThanAdvanceError.value
  ) {
    return null;
  }

  // If all items have zero to_be_invoiced, show specific error
  if (hasAllItemsZeroToBeInvoiced.value) {
    return "Cannot create invoice: All items have zero quantity available to be invoiced. All quantities have already been invoiced.";
  }

  // Full-invoice advance rules must win over generic "items total < advance" (same scenario can trip both).
  if (hasLaborPoFullAdvanceAdjustmentError.value) {
    return "Cannot create invoice: All labor items are fully invoiced, so the full remaining advance payment amount must be adjusted in Advance Payment Breakdown.";
  }

  if (hasLaborCoFullAdvanceAdjustmentError.value) {
    return "Cannot create invoice: All labor change order items are fully invoiced, so the full remaining advance payment amount must be adjusted in Advance Payment Breakdown.";
  }

  if (hasMaterialPoFullAdvanceAdjustmentError.value) {
    return "Cannot create invoice: All purchase order item quantities are fully invoiced, so the full remaining advance payment amount must be adjusted in Advance Payment Breakdown.";
  }

  if (hasInvoiceItemsLessThanAdvanceError.value) {
    return `Cannot save: ${invoiceItemsLessThanAdvanceBannerDescription.value}`;
  }

  if (hasAdvancePaymentBelowConsumedError.value) {
    return `Cannot save: ${advancePaymentBelowConsumedBannerDescription.value}`;
  }
  
  const itemCount = overInvoicedItems.value.length;
  const itemsList = overInvoicedItems.value
    .map((item, idx) => {
      const itemName = item.item_name || item.name || item.description || `Item ${idx + 1}`;

      // Handle different validation types (quantity vs amount)
      if (item.source === 'Labor PO' || item.source === 'Labor CO') {
        const remainingAmount = item.remaining_amount ?? 0;
        const invoiceAmount = item.invoice_amount ?? 0;
        return `"${itemName}" (Remaining: ${remainingAmount}, Invoice Amount: ${invoiceAmount})`;
      } else {
        const toBeInvoiced = item.to_be_invoiced ?? 0;
        const invoiceQty = item.invoice_quantity ?? 0;
        return `"${itemName}" (To Be Invoiced: ${toBeInvoiced}, Invoice Qty: ${invoiceQty})`;
      }
    })
    .join('; ');

  const isLaborValidation = overInvoicedItems.value.some(item => item.source === 'Labor PO' || item.source === 'Labor CO');
  const validationType = isLaborValidation ? 'amount' : 'quantity';

  return `${itemCount} item(s) have invoice ${validationType} greater than remaining ${validationType}. ${itemsList}`;
});

// Validation for credit days - must be selected
const hasCreditDaysValidationError = computed(() => {
  if (areSubsequentFieldsDisabled.value) return false; // Skip validation if fields are disabled
  const cd = props.form.credit_days;
  return cd === null || cd === undefined || String(cd).trim() === '';
});

const hasPoCoSelectionValidationError = computed(() => {
  if (areSubsequentFieldsDisabled.value) return false;

  const poCoUuid = String(props.form.po_co_uuid || '').trim();

  if (isAgainstPO.value) {
    return !props.form.purchase_order_uuid && !poCoUuid.startsWith('PO:');
  }

  if (isAgainstCO.value) {
    return !props.form.change_order_uuid && !poCoUuid.startsWith('CO:');
  }

  if (isAgainstAdvancePayment.value) {
    return (
      !poCoUuid &&
      !props.form.purchase_order_uuid &&
      !props.form.change_order_uuid
    );
  }

  return false;
});

// Validation for due date - must be selected
const hasDueDateValidationError = computed(() => {
  if (areSubsequentFieldsDisabled.value) return false; // Skip validation if fields are disabled
  return !dueDateValue.value;
});

const hasValidationError = computed(
  () =>
    hasOverInvoicedItems.value ||
    hasAdvancePaymentValidationError.value ||
    hasAllItemsZeroToBeInvoiced.value ||
    hasInvoiceItemsLessThanAdvanceError.value ||
    hasHoldbackValidationError.value ||
    hasCreditDaysValidationError.value ||
    hasPoCoSelectionValidationError.value ||
    hasDueDateValidationError.value
);

// Hide modal action buttons until async hydration for tables/form sections is complete.
const isHydratingForModalActions = computed(() => {
  const advanceTableRef = advancePaymentCostCodesTableRef.value as any
  const requiresAdvanceDistributionRows =
    isAgainstAdvancePayment.value &&
    Boolean(props.form.po_co_uuid) &&
    !hasAllItemsZeroToBeInvoiced.value

  const isAdvanceDistributionHydrating =
    requiresAdvanceDistributionRows &&
    (
      !advanceTableRef ||
      Boolean(advanceTableRef.isHydratingRows) ||
      Number(advanceTableRef.tableRowsCount || 0) <= 0
    )

  return Boolean(
    props.loading ||
    laborInvoiceItemsLoading.value ||
    poItemsLoading.value ||
    poLwmItemsLoading.value ||
    coItemsLoading.value ||
    coLwmItemsLoading.value ||
    loadingHoldbackData.value ||
    isAdvanceDistributionHydrating
  );
});

/** Suppress validation banners until async PO/CO items and hydration finish loading. */
const showFormValidationErrors = computed(() => {
  if (isHydratingForModalActions.value) return false
  if (
    (isAgainstPO.value || isAgainstCO.value) &&
    (
      laborInvoiceItemsLoading.value ||
      poItemsLoading.value ||
      poLwmItemsLoading.value ||
      coItemsLoading.value ||
      coLwmItemsLoading.value
    )
  ) {
    return false
  }
  return true
})

function sumAdvanceAllocationsExcludingTax(
  amounts: Record<string, Record<string, number>> | undefined,
  round2: (n: number) => number
): number {
  if (!amounts) return 0;
  let s = 0;
  for (const by of Object.values(amounts)) {
    if (!by) continue;
    for (const [k, v] of Object.entries(by)) {
      if (isTaxAdjustmentKey(k)) continue;
      s += Number(v) || 0;
    }
  }
  return round2(s);
}

function sumAdvanceTaxAllocationsFromForm(
  amounts: Record<string, Record<string, number>> | undefined,
  round2: (n: number) => number
): number {
  if (!amounts) return 0;
  let s = 0;
  const k1 = taxAdjustmentKey('sales_tax_1');
  const k2 = taxAdjustmentKey('sales_tax_2');
  for (const by of Object.values(amounts)) {
    if (!by) continue;
    s += Number(by[k1]) || 0;
    s += Number(by[k2]) || 0;
  }
  return round2(s);
}

/** Current COA breakdown for Nimble BillEntrySave; used by VendorInvoicesList at save time.
 * Includes: item breakdown by account (from Configure COA or computed), each charge (freight, packing, custom duties, other)
 * with its configured COA, and sales tax 1/2 with their configured COAs, so the full breakup is sent to Nimble.
 * For AGAINST_PO / AGAINST_CO with holdback, matches FinancialBreakdown Configure COA: retention applies to item GL lines only;
 * freight and tax rows use full financial_breakdown amounts (not reduced by holdback %).
 * AGAINST_ADVANCE_PAYMENT uses Advance Payment Distribution (grouped by GL), same pattern as Against PO/CO.
 * When Nimble integration is on and BillEntrySave fails, the API persists the invoice as Pending, returns nimble_bill_entry_failed, and VendorInvoicesList shows a toast (“Failed to create a bill entry”).
 * If Nimble rejects the bill number as a duplicate, the server advances INV-&lt;n&gt; to the next sequence, updates the row, and retries BillEntrySave. */
function getCoaBreakdownForSave(): Array<{ accountUuid: string; total: number }> {
  const result: Array<{ accountUuid: string; total: number }> = [];
  const form = props.form;
  const fb = form.financial_breakdown && typeof form.financial_breakdown === 'object' ? form.financial_breakdown : null;
  const invoiceType = String(form.invoice_type || '').toUpperCase();

  /** Per-line holdback % for PO/CO only (same as FinancialBreakdown Configure COA). */
  const coaHoldbackPct =
    invoiceType === 'AGAINST_PO' || invoiceType === 'AGAINST_CO'
      ? Number(form.holdback ?? 0) || 0
      : 0;

  // 1) Item breakdown: use saved item_breakdown_by_account from Configure COA if present, else computed breakdown
  const savedItemBreakdown = Array.isArray(form.item_breakdown_by_account) ? form.item_breakdown_by_account : [];
  const advanceDeductionForCoa = roundCurrencyValue(totalAdjustedAdvancePayment.value ?? 0);
  const adjMap = form.adjusted_advance_payment_amounts as Record<string, Record<string, number>> | undefined;
  const advanceCostForCoa = sumAdvanceAllocationsExcludingTax(adjMap, roundCurrencyValue);
  const advanceTaxForCoa = sumAdvanceTaxAllocationsFromForm(adjMap, roundCurrencyValue);
  let itemLines: Array<{ accountUuid: string; total: number }> = [];
  if (invoiceType === 'AGAINST_PO') {
    const computedLines = isLaborPO.value
      ? laborInvoiceItemsBreakdownByAccount.value
      : poItemBreakdownByAccount.value;
    if (savedItemBreakdown.length > 0) {
      itemLines = savedItemBreakdown
        .filter((r: any) => r?.accountUuid && Number(r?.total) > 0)
        .map((r: any) => ({ accountUuid: String(r.accountUuid), total: roundCurrencyValue(Number(r.total)) }));
    } else {
      const gross = computedLines.map((r) => ({ ...r, total: roundCurrencyValue(r.total) }));
      let rows = gross;
      if (advanceCostForCoa > 0) {
        rows = applyPerRowOrEqualCostAdvanceToBreakdown(
          rows,
          advanceCostForCoa,
          advanceAmountsByBreakdownRow.value,
          roundCurrencyValue
        );
      }
      if (advanceTaxForCoa > 0) {
        rows = applyEqualAdvanceDeductionToBreakdown(rows, advanceTaxForCoa);
      }
      /** Same as FinancialBreakdown Configure COA: holdback $ applies to item GL lines only; a second pass then splits that $ proportionally across items (not charges/taxes). */
      const willUseGlobalHoldbackPipeline = coaHoldbackPct > 0 && !!fb;
      if (coaHoldbackPct > 0 && !willUseGlobalHoldbackPipeline) {
        rows = applyPerLinePercentHoldbackToBreakdown(rows, coaHoldbackPct);
      }
      itemLines = rows;
    }
  } else if (invoiceType === 'AGAINST_CO') {
    const computedLines = isLaborCO.value
      ? laborInvoiceItemsBreakdownByAccount.value
      : coItemBreakdownByAccount.value;
    if (savedItemBreakdown.length > 0) {
      itemLines = savedItemBreakdown
        .filter((r: any) => r?.accountUuid && Number(r?.total) > 0)
        .map((r: any) => ({ accountUuid: String(r.accountUuid), total: roundCurrencyValue(Number(r.total)) }));
    } else {
      const gross = computedLines.map((r) => ({ ...r, total: roundCurrencyValue(r.total) }));
      let rows = gross;
      if (advanceCostForCoa > 0) {
        rows = applyPerRowOrEqualCostAdvanceToBreakdown(
          rows,
          advanceCostForCoa,
          advanceAmountsByBreakdownRow.value,
          roundCurrencyValue
        );
      }
      if (advanceTaxForCoa > 0) {
        rows = applyEqualAdvanceDeductionToBreakdown(rows, advanceTaxForCoa);
      }
      const willUseGlobalHoldbackPipeline = coaHoldbackPct > 0 && !!fb;
      if (coaHoldbackPct > 0 && !willUseGlobalHoldbackPipeline) {
        rows = applyPerLinePercentHoldbackToBreakdown(rows, coaHoldbackPct);
      }
      itemLines = rows;
    }
  } else if (invoiceType === 'AGAINST_ADVANCE_PAYMENT') {
    const rows = advancePaymentCostCodes.value || [];
    const computedLines = buildAdvancePaymentCOABreakdown({
      rows,
      formatCurrency: (n: number) => formatCurrency(n),
      round2: roundCurrencyValue,
    }).itemBreakdownByAccount;
    if (savedItemBreakdown.length > 0) {
      itemLines = savedItemBreakdown
        .filter((r: any) => r?.accountUuid && Number(r?.total) > 0)
        .map((r: any) => ({ accountUuid: String(r.accountUuid), total: roundCurrencyValue(Number(r.total)) }));
    } else {
      const gross = computedLines.map((r) => ({ ...r, total: roundCurrencyValue(r.total) }));
      itemLines =
        advanceDeductionForCoa > 0
          ? applyEqualAdvanceDeductionToBreakdown(gross, advanceDeductionForCoa)
          : gross;
    }
  } else if (invoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    const computedLines = holdbackItemBreakdownByAccount.value;
    if (savedItemBreakdown.length > 0) {
      itemLines = savedItemBreakdown
        .filter((r: any) => r?.accountUuid && Number(r?.total) > 0)
        .map((r: any) => ({ accountUuid: String(r.accountUuid), total: roundCurrencyValue(Number(r.total)) }));
    } else {
      itemLines = computedLines.map((r) => ({ accountUuid: r.accountUuid, total: roundCurrencyValue(r.total) }));
    }
  } else if (invoiceType === 'ENTER_DIRECT_INVOICE') {
    const computedLines = directInvoiceItemBreakdownByAccount.value;
    if (savedItemBreakdown.length > 0) {
      itemLines = savedItemBreakdown
        .filter((r: any) => r?.accountUuid && Number(r?.total) > 0)
        .map((r: any) => ({ accountUuid: String(r.accountUuid), total: roundCurrencyValue(Number(r.total)) }));
    } else {
      itemLines = computedLines.map((r) => ({
        accountUuid: r.accountUuid,
        total: roundCurrencyValue(r.total),
      }));
    }
  }

  let coaChargeNets: number[] | null = null;
  let coaTaxNets: number[] | null = null;
  const isPocoComputedGlobalHoldback =
    (invoiceType === 'AGAINST_PO' || invoiceType === 'AGAINST_CO') &&
    savedItemBreakdown.length === 0 &&
    coaHoldbackPct > 0 &&
    fb;

  if (isPocoComputedGlobalHoldback) {
    const itemG = itemLines.map((r) => roundCurrencyValue(Number(r.total)));
    const itemSum = roundCurrencyValue(itemG.reduce((a, b) => roundCurrencyValue(a + b), 0));
    /** Matches FinancialBreakdown: retention is % of item total (after advances), not of charges/taxes. */
    const H = roundCurrencyValue((itemSum * coaHoldbackPct) / 100);
    const { netAmounts } = allocateGlobalHoldbackProportionally(itemG, H, roundCurrencyValue);
    itemLines = itemLines.map((r, i) => ({
      accountUuid: r.accountUuid,
      total: netAmounts[i]!,
    }));
    const chargeKeysForHb = ['freight', 'packing', 'custom_duties', 'other'] as const;
    const cg = chargeKeysForHb.map((key) => {
      if (!fb?.charges || typeof fb.charges !== 'object') return 0;
      const charge = fb.charges[key];
      return charge && typeof charge === 'object' && charge.amount != null
        ? roundCurrencyValue(Number(charge.amount))
        : 0;
    });
    const taxKeysForHb = ['sales_tax_1', 'sales_tax_2'] as const;
    const tg = taxKeysForHb.map((key) => {
      if (!fb?.sales_taxes || typeof fb.sales_taxes !== 'object') return 0;
      const tax = fb.sales_taxes[key];
      return tax && typeof tax === 'object' && tax.amount != null
        ? roundCurrencyValue(Number(tax.amount))
        : 0;
    });
    /** Configure COA modal shows full freight/tax amounts on those rows (no holdback on charges/taxes). */
    coaChargeNets = cg.map((x) => x);
    coaTaxNets = tg.map((x) => x);
  }

  result.push(...itemLines);

  // 2) Charge lines (freight, packing, custom_duties, other) with configured COA
  if (fb?.charges && typeof fb.charges === 'object') {
    const chargeKeys = ['freight', 'packing', 'custom_duties', 'other'] as const;
    const chargeAccountKeys: Record<(typeof chargeKeys)[number], string> = {
      freight: 'freight_charges_account_uuid',
      packing: 'packing_charges_account_uuid',
      custom_duties: 'custom_duties_charges_account_uuid',
      other: 'other_charges_account_uuid',
    };
    const grossCharges = chargeKeys.map((key) => {
      const charge = fb.charges[key];
      const amount = charge && typeof charge === 'object' && charge.amount != null ? Number(charge.amount) : 0;
      return { accountUuid: key, total: roundCurrencyValue(amount) };
    });
    const netCharges =
      coaChargeNets != null
        ? grossCharges.map((g, i) => ({ ...g, total: coaChargeNets[i]! }))
        : coaHoldbackPct > 0 && savedItemBreakdown.length === 0
          ? applyPerLinePercentHoldbackToBreakdown(grossCharges, coaHoldbackPct)
          : grossCharges;
    for (let i = 0; i < chargeKeys.length; i++) {
      const key = chargeKeys[i]!;
      const net = netCharges[i]?.total ?? 0;
      if (!Number.isFinite(net) || net <= 0) continue;
      const accountUuid = form[chargeAccountKeys[key]];
      if (!accountUuid || typeof accountUuid !== 'string' || !accountUuid.trim()) continue;
      result.push({ accountUuid: accountUuid.trim(), total: roundCurrencyValue(net) });
    }
  }

  // 3) Sales tax lines with configured COA
  if (fb?.sales_taxes && typeof fb.sales_taxes === 'object') {
    const taxKeys = ['sales_tax_1', 'sales_tax_2'] as const;
    const taxAccountKeys: Record<(typeof taxKeys)[number], string> = {
      sales_tax_1: 'sales_tax_1_account_uuid',
      sales_tax_2: 'sales_tax_2_account_uuid',
    };
    const grossTaxes = taxKeys.map((key) => {
      const tax = fb.sales_taxes[key];
      const amount = tax && typeof tax === 'object' && tax.amount != null ? Number(tax.amount) : 0;
      return { accountUuid: key, total: roundCurrencyValue(amount) };
    });
    const netTaxes =
      coaTaxNets != null
        ? grossTaxes.map((g, i) => ({ ...g, total: coaTaxNets[i]! }))
        : coaHoldbackPct > 0 && savedItemBreakdown.length === 0
          ? applyPerLinePercentHoldbackToBreakdown(grossTaxes, coaHoldbackPct)
          : grossTaxes;
    for (let i = 0; i < taxKeys.length; i++) {
      const key = taxKeys[i]!;
      const net = netTaxes[i]?.total ?? 0;
      if (!Number.isFinite(net) || net <= 0) continue;
      const accountUuid = form[taxAccountKeys[key]];
      if (!accountUuid || typeof accountUuid !== 'string' || !accountUuid.trim()) continue;
      result.push({ accountUuid: accountUuid.trim(), total: roundCurrencyValue(net) });
    }
  }

  return result;
}

/** Persisted per–cost-code holdback for AGAINST_PO / AGAINST_CO (Holdback Breakdown column). */
async function buildHoldbackCoaBreakdownForSave(): Promise<
  Array<{
    cost_code_uuid: string;
    gl_account_uuid: string | null;
    holdback_amount: number;
    cost_code_label: string | null;
    cost_code_number: string | null;
    cost_code_name: string | null;
    sort_order: number;
  }>
> {
  try {
    const invoiceType = String(props.form.invoice_type || '').toUpperCase();
    if (invoiceType !== 'AGAINST_PO' && invoiceType !== 'AGAINST_CO') return [];

    const payload = {
      labor_invoice_items: props.form.labor_invoice_items,
      po_invoice_items: props.form.po_invoice_items,
      co_invoice_items: props.form.co_invoice_items,
      po_lwm_invoice_items: props.form.po_lwm_invoice_items,
      co_lwm_invoice_items: props.form.co_lwm_invoice_items,
      invoice_type: invoiceType,
    };

    const holdbackLike = {
      financial_breakdown: props.form.financial_breakdown,
      holdback: props.form.holdback,
      amount: props.form.amount,
      adjusted_advance_payment_amounts: props.form.adjusted_advance_payment_amounts,
      invoice_type: invoiceType,
    };
    const holdbackPct = Number(props.form.holdback ?? 0) || 0;

    // Same GL rows + advance pipeline as FinancialBreakdown Configure COA (per-GL advances + equal tax share).
    const baseBreakdown =
      invoiceType === 'AGAINST_PO'
        ? againstPoCoaItemBreakdown.value
        : againstCoCoaItemBreakdown.value;
    if (!Array.isArray(baseBreakdown) || baseBreakdown.length === 0) return [];

    const grossRows = baseBreakdown
      .map((r: any) => ({
        accountUuid: String(r?.accountUuid || '').trim(),
        total: roundCurrencyValue(Number(r?.total) || 0),
      }))
      .filter((r) => r.accountUuid);
    if (grossRows.length === 0) return [];

    const taxOffsetTotal = roundCurrencyValue(
      (Number(advanceTaxCreditsBySalesTaxLine.value?.sales_tax_1) || 0) +
        (Number(advanceTaxCreditsBySalesTaxLine.value?.sales_tax_2) || 0)
    );

    const totals = props.form.financial_breakdown?.totals as Record<string, unknown> | undefined;
    let H = 0;
    const hbFromFb = totals?.holdback_amount ?? totals?.holdbackAmount;
    if (hbFromFb !== null && hbFromFb !== undefined && hbFromFb !== '') {
      const v = Number(hbFromFb);
      if (Number.isFinite(v) && v > 0) H = roundCurrencyValue(v);
    }
    if (H <= 0 && holdbackPct > 0) {
      const adjustedItemTotal = roundCurrencyValue(
        Math.max(
          0,
          financialBreakdownItemTotal.value - roundCurrencyValue(effectiveAdvancePaymentDeduction.value ?? 0)
        )
      );
      H = roundCurrencyValue((adjustedItemTotal * holdbackPct) / 100);
    }

    if (H <= 0) {
      const itemsForRetainage = resolveSourceItemsFromVendorInvoicePayload(
        payload,
        isLaborPO.value,
        isLaborCO.value
      );
      const retainageFallback = computeRetainageAmountsByCostCode(itemsForRetainage, holdbackLike, {
        preferInvoiceAmountFirst: isLaborPO.value || isLaborCO.value,
      });
      if (retainageFallback.size === 0) return [];
      const ccList = [...retainageFallback.keys()].sort();
      const det = await fetchCostCodeDetails(ccList);
      return ccList
        .map((costCodeUuid, index) => {
          const cfg = det[costCodeUuid];
          const hb = retainageFallback.get(costCodeUuid) ?? 0;
          return {
            cost_code_uuid: costCodeUuid,
            gl_account_uuid: cfg?.gl_account_uuid ?? null,
            holdback_amount: roundCurrencyValue(hb),
            cost_code_label: cfg
              ? [cfg.cost_code_number, cfg.cost_code_name].filter(Boolean).join(' ').trim() || null
              : null,
            cost_code_number: cfg?.cost_code_number ?? null,
            cost_code_name: cfg?.cost_code_name ?? null,
            sort_order: index,
          };
        })
        .filter((r) => r.holdback_amount > 0);
    }

    const laborRows =
      Array.isArray(laborInvoiceItems.value) && laborInvoiceItems.value.length > 0
        ? laborInvoiceItems.value
        : Array.isArray(props.form.labor_invoice_items)
          ? props.form.labor_invoice_items
          : [];

    const allCcUuids = new Set<string>();
    const isLaborMode =
      (isAgainstPO.value && isLaborPO.value) || (isAgainstCO.value && isLaborCO.value);

    if (isLaborMode) {
      for (const row of laborRows) {
        if (row?.cost_code_uuid) allCcUuids.add(String(row.cost_code_uuid));
      }
    } else if (isAgainstPO.value) {
      const regular =
        Array.isArray(poItems.value) && poItems.value.length > 0
          ? poItems.value
          : Array.isArray(props.form.po_invoice_items)
            ? props.form.po_invoice_items
            : [];
      const lwmRows =
        Array.isArray(poLwmItems.value) && poLwmItems.value.length > 0
          ? poLwmItems.value
          : Array.isArray(props.form.po_lwm_invoice_items)
            ? props.form.po_lwm_invoice_items
            : [];
      for (const item of regular) {
        if (item?.cost_code_uuid) allCcUuids.add(String(item.cost_code_uuid));
      }
      for (const lwm of lwmRows) {
        if (lwm?.cost_code_uuid) allCcUuids.add(String(lwm.cost_code_uuid));
      }
    } else if (isAgainstCO.value) {
      const regular =
        Array.isArray(coItems.value) && coItems.value.length > 0
          ? coItems.value
          : Array.isArray(props.form.co_invoice_items)
            ? props.form.co_invoice_items
            : [];
      const lwmRows =
        Array.isArray(coLwmItems.value) && coLwmItems.value.length > 0
          ? coLwmItems.value
          : Array.isArray(props.form.co_lwm_invoice_items)
            ? props.form.co_lwm_invoice_items
            : [];
      for (const item of regular) {
        if (item?.cost_code_uuid) allCcUuids.add(String(item.cost_code_uuid));
      }
      for (const lwm of lwmRows) {
        if (lwm?.cost_code_uuid) allCcUuids.add(String(lwm.cost_code_uuid));
      }
    }

    const lineDetails = await fetchCostCodeDetails([...allCcUuids]);

    const glToLines = new Map<string, { costCodeUuid: string; amount: number }[]>();
    const pushLine = (gl: string | null | undefined, cc: string | null | undefined, amt: number) => {
      const g = String(gl || '').trim();
      const c = String(cc || '').trim();
      if (!g || !c || isTaxAdjustmentKey(c)) return;
      const a = roundCurrencyValue(amt);
      if (a <= 0) return;
      if (!glToLines.has(g)) glToLines.set(g, []);
      glToLines.get(g)!.push({ costCodeUuid: c, amount: a });
    };

    if (isLaborMode) {
      for (const row of laborRows) {
        const cc = row?.cost_code_uuid;
        const cfg = cc ? lineDetails[String(cc)] : null;
        pushLine(cfg?.gl_account_uuid, cc, parseFloat(String(row?.invoice_amount ?? 0)) || 0);
      }
    } else if (isAgainstPO.value) {
      const regular =
        Array.isArray(poItems.value) && poItems.value.length > 0
          ? poItems.value
          : Array.isArray(props.form.po_invoice_items)
            ? props.form.po_invoice_items
            : [];
      const lwmRows =
        Array.isArray(poLwmItems.value) && poLwmItems.value.length > 0
          ? poLwmItems.value
          : Array.isArray(props.form.po_lwm_invoice_items)
            ? props.form.po_lwm_invoice_items
            : [];
      for (const item of regular) {
        const cc = item?.cost_code_uuid;
        const cfg = cc ? lineDetails[String(cc)] : null;
        pushLine(cfg?.gl_account_uuid, cc, getItemAmountForBreakdown(item));
      }
      for (const lwm of lwmRows) {
        const cc = lwm?.cost_code_uuid;
        const cfg = cc ? lineDetails[String(cc)] : null;
        pushLine(cfg?.gl_account_uuid, cc, parseFloat(String(lwm?.invoice_amount || 0)) || 0);
      }
    } else if (isAgainstCO.value) {
      const regular =
        Array.isArray(coItems.value) && coItems.value.length > 0
          ? coItems.value
          : Array.isArray(props.form.co_invoice_items)
            ? props.form.co_invoice_items
            : [];
      const lwmRows =
        Array.isArray(coLwmItems.value) && coLwmItems.value.length > 0
          ? coLwmItems.value
          : Array.isArray(props.form.co_lwm_invoice_items)
            ? props.form.co_lwm_invoice_items
            : [];
      for (const item of regular) {
        const cc = item?.cost_code_uuid;
        const cfg = cc ? lineDetails[String(cc)] : null;
        pushLine(cfg?.gl_account_uuid, cc, getItemAmountForBreakdown(item));
      }
      for (const lwm of lwmRows) {
        const cc = lwm?.cost_code_uuid;
        const cfg = cc ? lineDetails[String(cc)] : null;
        pushLine(cfg?.gl_account_uuid, cc, parseFloat(String(lwm?.invoice_amount || 0)) || 0);
      }
    }

    const retainageMap = computeHoldbackByCostCodeFromGlPipeline(
      grossRows,
      roundCurrencyValue(effectiveAdvancePaymentDeduction.value ?? 0),
      advanceAmountsByBreakdownRow.value,
      taxOffsetTotal,
      H,
      glToLines,
      roundCurrencyValue
    );

    if (retainageMap.size === 0) return [];

    const costCodeUuids = [...retainageMap.keys()].sort();
    const details = await fetchCostCodeDetails(costCodeUuids);

    return costCodeUuids
      .map((costCodeUuid, index) => {
        const cfg = details[costCodeUuid];
        const hb = retainageMap.get(costCodeUuid) ?? 0;
        return {
          cost_code_uuid: costCodeUuid,
          gl_account_uuid: cfg?.gl_account_uuid ?? null,
          holdback_amount: roundCurrencyValue(hb),
          cost_code_label: cfg
            ? [cfg.cost_code_number, cfg.cost_code_name].filter(Boolean).join(' ').trim() || null
            : null,
          cost_code_number: cfg?.cost_code_number ?? null,
          cost_code_name: cfg?.cost_code_name ?? null,
          sort_order: index,
        };
      })
      .filter((r) => r.holdback_amount > 0);
  } catch (e) {
    console.warn('[VendorInvoiceForm] buildHoldbackCoaBreakdownForSave failed; saving without holdback COA rows.', e);
    return [];
  }
}

// Expose validation errors and save helpers to parent component
defineExpose({
  overInvoicedItems,
  hasOverInvoicedItems,
  overInvoicedValidationError,
  hasInvoiceItemsLessThanAdvanceError,
  financialBreakdownItemTotal,
  hasAdvancePaymentValidationError,
  hasHoldbackValidationError,
  hasAllItemsZeroToBeInvoiced,
  hasValidationError,
  allHoldbackAmountsZero,
  holdbackValidationError,
  hasCreditDaysValidationError,
  hasDueDateValidationError,
  isHydratingForModalActions,
  showFormValidationErrors,
  getCoaBreakdownForSave,
  buildHoldbackCoaBreakdownForSave,
  holdbackReleaseAmountTotal,
  /** For tests: PO-style rows passed to PreferredItemsFromMasterSection (category, location_uuid, etc.). */
  directLineItemsForMasterDisplay,
});

</script>

