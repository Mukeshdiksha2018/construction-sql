<template>
  <div class="flex flex-col">
    <div class="flex gap-4">
      <!-- Left/Main Panel -->
      <div class="flex-1 min-w-0">
        <UCard variant="soft" class="mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
        <!-- Skeleton Loaders -->
        <template v-if="loading">
          <!-- Corporation -->
          <div>
            <USkeleton class="h-3 w-20 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Project Name -->
          <div>
            <USkeleton class="h-3 w-24 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Vendor -->
          <div>
            <USkeleton class="h-3 w-16 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Created Date -->
          <div>
            <USkeleton class="h-3 w-28 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Change Order # -->
          <div>
            <USkeleton class="h-3 w-32 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Ship To -->
          <div>
            <USkeleton class="h-3 w-16 mb-1" />
            <USkeleton class="h-[50px] w-full" />
          </div>
          <!-- Vendor Address -->
          <div>
            <USkeleton class="h-3 w-28 mb-1" />
            <USkeleton class="h-[50px] w-full" />
          </div>
          <!-- Credit Days -->
          <div>
            <USkeleton class="h-3 w-24 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Est Delivery Date -->
          <div>
            <USkeleton class="h-3 w-32 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Requested By -->
          <div>
            <USkeleton class="h-3 w-28 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- CO Type -->
          <div>
            <USkeleton class="h-3 w-20 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Original Order -->
          <div>
            <USkeleton class="h-3 w-28 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Ship Via -->
          <div v-if="form.co_type === 'MATERIAL'">
            <USkeleton class="h-3 w-20 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Freight -->
          <div v-if="form.co_type === 'MATERIAL'">
            <USkeleton class="h-3 w-16 mb-1" />
            <USkeleton class="h-9 w-full" />
          </div>
          <!-- Shipping Instructions -->
          <div v-if="form.co_type === 'MATERIAL'" class="md:col-span-1 xl:col-span-1">
            <USkeleton class="h-3 w-40 mb-1" />
            <USkeleton class="h-16 w-full" />
          </div>
          <!-- Reason -->
          <div class="md:col-span-1 xl:col-span-1">
            <USkeleton class="h-3 w-16 mb-1" />
            <USkeleton class="h-16 w-full" />
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
            Project Name <span class="text-red-500">*</span>
          </label>
          <ProjectSelect
            :model-value="form.project_uuid"
            :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
            :disabled="!form.corporation_uuid && !corpStore.selectedCorporation || isReadOnly"
            placeholder="Select project"
            size="sm"
            class="w-full"
            @update:model-value="handleProjectChange"
          />
        </div>

        <!-- Vendor -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-default">
              Vendor <span class="text-red-500">*</span>
            </label>
            <UBadge
              v-if="!isReadOnly"
              color="primary"
              variant="solid"
              size="xs"
              class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              title="Add vendor"
              @click="vendorSelectRef?.openAddModal()"
            >
              <UIcon name="i-heroicons-plus" class="w-3 h-3" />
              Add
            </UBadge>
          </div>
          <label
            v-if="!loading"
            class="block text-xs font-medium text-default w-28 shrink-0 mb-1"
          >
            Currency
          </label>
          <div class="flex items-center gap-2">
            <VendorSelect
              ref="vendorSelectRef"
              :model-value="form.vendor_uuid"
              :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
              :disabled="!form.corporation_uuid && !corpStore.selectedCorporation || isReadOnly"
              :show-add-button="!isReadOnly"
              placeholder="Select vendor"
              size="sm"
              class="flex-1 min-w-0"
              @update:model-value="onVendorUpdate"
              @change="onVendorUpdate"
              @nimble-vendor-saved="emit('nimble-vendor-saved')"
            />
            <PoFromCurrencySelect
              v-if="!loading"
              v-model="coCurrencyFrom"
              :disabled="isReadOnly"
              size="sm"
              select-class="w-28 shrink-0"
            />
          </div>
        </div>

        <!-- Created Date -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Created Date <span class="text-red-500">*</span>
          </label>
          <UPopover v-model:open="createdDatePopoverOpen" :disabled="isReadOnly">
            <UButton 
              color="neutral" 
              variant="outline" 
              icon="i-heroicons-calendar-days"
              class="w-full justify-start"
              size="sm"
              :disabled="isReadOnly"
            >
              {{ createdDateDisplay }}
            </UButton>
            <template #content>
              <UCalendar v-model="createdDateValue" class="p-2" :disabled="isReadOnly" @update:model-value="createdDatePopoverOpen = false" />
            </template>
          </UPopover>
        </div>

          <!-- Change Order # -->
          <div>
            <label class="block text-xs font-medium text-default mb-1">
              Change Order # <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center">
              <span
                v-if="selectedProjectId"
                class="inline-flex items-center px-2.5 h-8 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md whitespace-nowrap"
              >
                {{ selectedProjectId }}-
              </span>
              <UInput
                :model-value="coNumberSuffix"
                placeholder="Enter change order number"
                size="sm"
                class="w-full"
                :class="selectedProjectId ? '[&_input]:rounded-l-none' : ''"
                icon="i-heroicons-hashtag"
                :disabled="isReadOnly"
                @update:model-value="handleCoNumberSuffixUpdate"
              />
            </div>
          </div>

        <!-- Ship To (project shipment addresses; dropdown when multiple) -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Ship To
          </label>
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
            :disabled="isReadOnly"
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
            {{ shipToAddress || 'No address selected' }}
          </div>
        </div>

        <!-- Vendor Address -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Vendor Address
          </label>
          <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-muted min-h-[50px] border border-default">
            {{ vendorAddressText || 'No vendor selected' }}
          </div>
        </div>

        <!-- Credit Days (static NET_* or Nimble GetCreditDaysList + credit_days_id) -->
        <div>
          <CreditDaysSelect
            v-model="creditDaysModel"
            label="Credit Days"
            :show-add-button="!isReadOnly"
            :disabled="isReadOnly"
          />
        </div>

        <!-- Est Delivery Date -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Est Delivery Date
          </label>
          <UPopover :disabled="isReadOnly">
            <UButton 
              color="neutral" 
              variant="outline" 
              icon="i-heroicons-calendar-days"
              class="w-full justify-start"
              size="sm"
              :disabled="isReadOnly"
            >
              {{ estDeliveryDateDisplay }}
            </UButton>
            <template #content>
              <UCalendar v-model="estDeliveryDateValue" class="p-2" :disabled="isReadOnly" :min-value="createdDateValue ?? undefined" />
            </template>
          </UPopover>
        </div>

        <!-- Requested By (optional): Nimble = client-sub-users + nimble UserID; else app UserSelect -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Requested By <span class="text-muted font-normal">(optional)</span>
          </label>
          <template v-if="nimbleIntegrationsEnabled">
            <div class="flex items-center gap-2">
              <UAvatar
                v-if="requestedByOption?.avatar"
                v-bind="requestedByOption.avatar"
                size="xs"
                class="flex-shrink-0"
              />
              <USelectMenu
                v-model="requestedByOption"
                :items="requestedByOptions"
                placeholder="Select team member"
                size="sm"
                class="flex-1 min-w-0"
                value-key="value"
                searchable
                clearable
                :disabled="isReadOnly"
              />
            </div>
          </template>
          <UserSelect
            v-else
            :model-value="form.requested_by || null"
            :corporation-uuid="props.form.corporation_uuid || corpStore.selectedCorporation?.uuid || null"
            placeholder="Select team member"
            size="sm"
            :disabled="isReadOnly"
            @update:model-value="(v) => updateForm({ requested_by: v })"
          />
        </div>

        <!-- CO Type -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            CO Type
          </label>
          <USelectMenu
            v-model="coTypeOption"
            :items="coTypeOptions"
            placeholder="Select CO type"
            size="sm"
            class="w-full"
            value-key="value"
            :disabled="isReadOnly"
          />
        </div>

        <!-- Original Order (PO for selected project) -->
        <div>
          <label class="block text-xs font-medium text-default mb-1">
            Original Order
          </label>
          <POSelectForCO
            :model-value="props.form.original_purchase_order_uuid"
            :corporation-uuid="props.form.corporation_uuid || corpStore.selectedCorporation?.uuid"
            :project-uuid="props.form.project_uuid"
            :vendor-uuid="props.form.vendor_uuid"
            :co-type="props.form.co_type"
            :disabled="!props.form.corporation_uuid || !props.form.project_uuid || !props.form.vendor_uuid || isReadOnly"
            placeholder="Select purchase order"
            size="sm"
            @update:model-value="(value) => updateForm({ original_purchase_order_uuid: value })"
          />
        </div>

        <!-- Ship Via -->
        <div v-if="form.co_type === 'MATERIAL'">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-default">
              Ship Via
            </label>
            <UBadge
              v-if="!isReadOnly"
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
            :disabled="isReadOnly"
            :show-add-button="!isReadOnly"
            :force-api-fetch="nimbleFreightShipViaStrictApi"
            @update:model-value="onShipViaModelUpdate"
          />
        </div>

        <!-- Freight -->
        <div v-if="form.co_type === 'MATERIAL'">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-default">
              Freight
            </label>
            <UBadge
              v-if="!isReadOnly"
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
            :disabled="isReadOnly"
            :show-add-button="!isReadOnly"
            :force-api-fetch="nimbleFreightShipViaStrictApi"
            @update:model-value="onFreightModelUpdate"
          />
        </div>

        <!-- Shipping Instructions -->
        <div v-if="form.co_type === 'MATERIAL'" class="md:col-span-1 xl:col-span-1">
          <label class="block text-xs font-medium text-default mb-1">
            Shipping Instructions
          </label>
          <UTextarea
            :model-value="form.shipping_instructions"
            placeholder="Enter shipping instructions"
            size="sm"
            :rows="2"
            class="w-full"
            autoresize
            :disabled="isReadOnly"
            @update:model-value="(value) => updateForm({ shipping_instructions: value ?? '' })"
          />
        </div>

        <!-- Quote Reference -->
        <div v-if="form.co_type === 'MATERIAL'" class="md:col-span-1 xl:col-span-1">
          <label class="block text-xs font-medium text-default mb-1">
            Quote Reference
          </label>
          <UInput
            :model-value="form.quote_reference || ''"
            placeholder="Enter quote reference"
            size="sm"
            class="w-full"
            :disabled="isReadOnly"
            @update:model-value="(value) => updateForm({ quote_reference: value ?? '' })"
          />
        </div>

        <!-- Reason (label row + Add badge via ReasonSelect, same pattern as Vendor / Ship Via / Freight) -->
        <div class="md:col-span-1 xl:col-span-1">
          <ReasonSelect
            label="Reason"
            :model-value="reasonDisplayValue"
            placeholder="Select reason"
            size="sm"
            class="w-full"
            :disabled="isReadOnly"
            @update:model-value="(v) => updateForm({ reason_uuid: v || null, reason: null })"
            @change="(opt) => updateForm({ reason_uuid: opt?.reason?.uuid || null, reason: opt?.reason?.reason || null })"
          />
        </div>

        <!-- Is Revised: shown for approval-level users or when already revised -->
        <div
          v-if="
            form.uuid && (
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
              :disabled="isReadOnly"
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
            <UPopover v-model:open="revisionDatePopoverOpen" :disabled="isReadOnly">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar-days"
                class="w-full justify-start"
                size="sm"
                :disabled="isReadOnly"
              >
                {{ revisionDateDisplayText }}
              </UButton>
              <template #content>
                <UCalendar v-model="revisionDateValue" class="p-2" :disabled="isReadOnly" @update:model-value="revisionDatePopoverOpen = false" />
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
                :disabled="isReadOnly"
                @update:model-value="(value) => updateForm({ revision_number: value ?? '' })"
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
              :disabled="isReadOnly"
              @input="(e) => updateForm({ revision_notes: (e.target as HTMLTextAreaElement).value ?? '' })"
            />
          </div>
        </template>

        <!-- Exchange Rate (last field; shown when vendor currency is USD) -->
        <div v-if="!loading && coCurrencyConversionEnabled" class="xl:col-span-2">
          <label class="block text-xs font-medium text-default mb-1">
            Exchange Rate
          </label>
          <div
            class="p-3 rounded-md text-xs min-h-[50px] border transition-colors duration-150 bg-primary-50 text-primary-800 border-primary-100 dark:bg-primary-900/20 dark:text-primary-200 dark:border-primary-800"
          >
            <PoCurrencyConversionBar
              :enabled="coCurrencyConversionEnabled"
              v-model:from-currency="coCurrencyFrom"
              v-model:to-currency="coCurrencyTo"
              v-model:conversion-rate="coConversionRate"
              :corporation-uuid="form.corporation_uuid"
              hide-enable-checkbox
              hide-from-currency-select
              lock-to-currency
              :readonly="isReadOnly"
            />
          </div>
        </div>
        </template>
        </div>
        </UCard>
      </div>
    </div>

    <!-- Original Order Items (Change Order Entry) -->
    <div v-if="loading || form.original_purchase_order_uuid" class="mt-6">
      <!-- Skeleton for Items Table -->
      <template v-if="loading">
        <div class="rounded-xl border border-default bg-white dark:bg-gray-900/40 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-default/70 bg-gray-50 dark:bg-gray-800">
            <div>
              <USkeleton class="h-4 w-40" />
              <USkeleton class="h-3 w-64 mt-1" />
            </div>
            <USkeleton class="h-4 w-16" />
          </div>
          <div class="hidden md:block">
            <table class="min-w-full table-fixed divide-y divide-default/60">
              <thead class="bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-left"><USkeleton class="h-3 w-16" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-16" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-20" /></th>
                  <th class="w-1/12 px-4 py-2 text-right"><USkeleton class="h-3 w-16" /></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default/60">
                <tr v-for="i in 3" :key="i" class="align-middle">
                  <td class="px-2 py-2"><USkeleton class="h-4 w-24" /></td>
                  <td class="px-2 py-2"><USkeleton class="h-4 w-32" /></td>
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
        </div>
      </template>
      
      <!-- Location-wise Material CO Items Table (from location-wise PO) -->
      <COLocationWiseMaterialTable
        v-else-if="form.co_type === 'MATERIAL' && shouldShowCoLocationWiseMaterialSection"
        :items="coLocationWiseMaterialDisplayItems"
        :loading="coLocationWiseMaterialLoading"
        :error="coLocationWiseMaterialError"
        title="Material Change Order Items (Location-wise)"
        description="Original PO amounts shown for reference. Enter change order amounts."
        :show-location-column="showCoLocationWiseMaterialLocationColumn"
        :show-budgeted-amount="true"
        :readonly="isReadOnly"
        @co-amount-change="handleCoLocationWiseMaterialAmountChange"
        @remove-row="removeCoLocationWiseMaterialRow"
        @location-change="handleCoLocationWiseMaterialLocationChange"
      />

      <!-- Item-wise Material CO Items Table -->
      <COItemsTableFromOriginal
        v-else-if="form.co_type === 'MATERIAL'"
        :items="coDisplayItems"
        :loading="originalItemsLoading"
        :error="originalItemsError"
        title="Change Order Items"
        description="Original purchase order values shown for reference. Enter change order price and quantity."
        :readonly="isReadOnly"
        :corporation-uuid="form.corporation_uuid || corpStore.selectedCorporation?.uuid"
        :project-uuid="form.project_uuid"
        :scoped-locations="coScopedLocations"
        :hide-location="!projectEnableLocationWise"
        :po-currency-conversion-enabled="coCurrencyConversionEnabled"
        :po-currency-from="coCurrencyFrom"
        :po-currency-to="coCurrencyTo"
        :po-conversion-rate="coConversionRate"
        @co-unit-price-change="handleCoUnitPriceChange"
        @co-quantity-change="handleCoQuantityChange"
        @approval-checks-change="handleApprovalChecksChange"
        @remove-row="removeCoRow"
        @add-row="addNewCoRow"
        @cost-code-change="updateNewItemCostCode"
        @item-type-change="updateNewItemType"
        @item-change="updateNewItemItem"
        @uom-change="handleCoUomChange"
        @location-change="handleStorageLocationChange"
        @description-change="handleCoDescriptionChange"
        @category-change="handleCoCategoryChange"
        @item-division-change="handleCoItemDivisionChange"
        @sequence-change="handleCoSequenceChange"
      />
      
      <!-- Labor CO Items Table -->
      <COLaborItemsTable
        v-else-if="form.co_type === 'LABOR'"
        :items="laborCODisplayItems"
        :loading="laborPOItemsLoading"
        :error="laborPOItemsError"
        title="Labor Change Order Items"
        description="Original purchase order amounts shown for reference. Enter change order amounts."
        :show-location-column="projectEnableLocationWise"
        :readonly="isReadOnly"
        :po-currency-conversion-enabled="coCurrencyConversionEnabled"
        :po-currency-from="coCurrencyFrom"
        :po-currency-to="coCurrencyTo"
        :po-conversion-rate="coConversionRate"
        @co-amount-change="handleLaborCoAmountChange"
        @remove-row="removeLaborCoRow"
        @location-change="handleLaborLocationChange"
        @description-change="handleLaborDescriptionChange"
      />
    </div>
    
    <div v-if="form.original_purchase_order_uuid && showRemovedItemsButton" class="mt-4 flex justify-end">
      <UButton
        size="xs"
        color="primary"
        variant="outline"
        icon="i-heroicons-arrow-path"
        class="self-start"
        @click="openRemovedCoItemsModal"
      >
        Show Removed Items ({{ removedItemsModalCount }})
      </UButton>
    </div>
    
    <!-- File Upload and Financial Breakdown Section (for Labor CO) -->
    <div v-if="(loading || form.original_purchase_order_uuid) && form.co_type === 'LABOR'" class="mt-6 flex flex-col lg:flex-row gap-6">
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
                  v-if="Number(uploadedAttachmentCount) > 0"
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
                Use the button above to add change order attachments.
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
                      @click.stop="removeFile(Number(index))"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </template>
      </div>

      <!-- Financial Breakdown (Labor CO — sales taxes only) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <!-- Skeleton for Financial Breakdown -->
          <template v-if="loading">
            <UCard
              variant="soft"
              class="w-full shadow-sm border border-default bg-white dark:bg-gray-900/40"
            >
              <div class="space-y-4">
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-4 w-32" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-20 ml-auto" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 2" :key="i" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                    <USkeleton class="h-8 w-full" />
                    <USkeleton class="h-8 w-20" />
                    <USkeleton class="h-8 w-24" />
                    <div></div>
                  </div>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-4 w-32" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-24 ml-auto" />
                </div>
              </div>
            </UCard>
          </template>

          <!-- Actual Financial Breakdown -->
          <FinancialBreakdown
            v-else
            :item-total="coItemTotal"
            :form-data="form"
            :read-only="isReadOnly"
            :po-currency-conversion-enabled="coCurrencyConversionEnabled"
            :po-currency-from="coCurrencyFrom"
            :po-currency-to="coCurrencyTo"
            :po-conversion-rate="coConversionRate"
            :hide-charges="true"
            item-total-label="CO Item Total"
            total-label="Total CO Amount"
            total-field-name="total_co_amount"
            @update="handleFinancialUpdate"
          />
        </div>
      </div>
    </div>

    <!-- File Upload and Financial Breakdown Section (for Material CO) -->
    <div v-if="(loading || form.original_purchase_order_uuid) && form.co_type === 'MATERIAL'" class="mt-6 flex flex-col lg:flex-row gap-6">
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
                  v-if="Number(uploadedAttachmentCount) > 0"
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
                Use the button above to add change order attachments.
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
                      @click.stop="removeFile(Number(index))"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </template>
      </div>

      <!-- Special Instructions + Terms and Conditions (Middle) — SI first (Material CO only) -->
      <div
        v-if="form.co_type === 'MATERIAL'"
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
                  v-if="!isReadOnly"
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
                :disabled="isReadOnly || !canUseSpecialInstructionsSelect"
                @update:model-value="(value) => updateForm({ special_instruction_uuid: value ?? null })"
              />
              <p
                v-if="!canUseSpecialInstructionsSelect"
                class="text-[11px] text-muted mt-1"
              >
                Select corporation and project to load special instructions for this change order.
              </p>
            </div>
          </UCard>
          <UCard variant="soft">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-base font-bold text-default flex items-center gap-2 border-b border-default/60 pb-2">
                <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-primary-500" />
                Terms and Conditions
                <UButton
                  v-if="!isReadOnly"
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
                :disabled="isReadOnly"
                @update:model-value="(value) => updateForm({ terms_and_conditions_uuid: value ?? null })"
              />
            </div>
          </UCard>
        </template>
      </div>

      <!-- Financial Breakdown (Right) -->
      <div class="w-full lg:flex-1 flex justify-start lg:justify-end">
        <div class="w-full lg:w-auto lg:min-w-[520px]">
          <!-- Skeleton for Financial Breakdown -->
          <template v-if="loading">
            <UCard
              variant="soft"
              class="w-full shadow-sm border border-default bg-white dark:bg-gray-900/40"
            >
              <div class="space-y-4">
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-4 w-32" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-20 ml-auto" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 4" :key="i" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                    <USkeleton class="h-4 w-24" />
                    <USkeleton class="h-8 w-20" />
                    <USkeleton class="h-8 w-24" />
                    <USkeleton class="h-4 w-16" />
                  </div>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-3 w-28" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-20 ml-auto" />
                </div>
                <div class="space-y-2">
                  <div v-for="i in 2" :key="i" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                    <USkeleton class="h-8 w-full" />
                    <USkeleton class="h-8 w-20" />
                    <USkeleton class="h-8 w-24" />
                    <div></div>
                  </div>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-3 w-24" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-20 ml-auto" />
                </div>
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                  <USkeleton class="h-4 w-32" />
                  <div></div>
                  <div></div>
                  <USkeleton class="h-4 w-24 ml-auto" />
                </div>
              </div>
            </UCard>
          </template>
          
          <!-- Actual Financial Breakdown -->
          <FinancialBreakdown
            v-else
            :item-total="coItemTotal"
            :form-data="form"
            :read-only="isReadOnly"
            :po-currency-conversion-enabled="coCurrencyConversionEnabled"
            :po-currency-from="coCurrencyFrom"
            :po-currency-to="coCurrencyTo"
            :po-conversion-rate="coConversionRate"
            item-total-label="CO Item Total"
            total-label="Total CO Amount"
            total-field-name="total_co_amount"
            @update="handleFinancialUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Removed CO Items Modal -->
    <UModal v-model:open="removedCoItemsModalOpen">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Removed Change Order Items</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeRemovedCoItemsModal" />
        </div>
      </template>
      <template #body>
        <!-- Material CO removed items -->
        <div v-if="form.co_type === 'MATERIAL' && removedCoItems.length" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(item, index) in removedCoItems"
            :key="`removed-co-${index}`"
            class="p-3 border border-default rounded-lg bg-elevated/40 dark:bg-elevated/20 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-default truncate">
                  {{ item.name || item.description || `Item ${Number(index) + 1}` }}
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="item.co_quantity !== null && item.co_quantity !== undefined">
                    Qty: {{ item.co_quantity }}
                  </span>
                  <span v-if="item.co_unit_price !== null && item.co_unit_price !== undefined">
                    Unit: {{ item.co_unit_price }}
                  </span>
                </div>
                <div v-if="item.removed_at" class="text-[11px] text-muted mt-1">
                  Removed: {{ item.removed_at }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <UButton size="xs" color="primary" variant="solid" @click="restoreRemovedCoItem(Number(index))">
                  Restore
                </UButton>
              </div>
            </div>
          </div>
        </div>
        <!-- Labor CO removed items -->
        <div v-else-if="form.co_type === 'LABOR' && removedLaborCoItems.length" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="(item, index) in removedLaborCoItems"
            :key="`removed-labor-co-${index}`"
            class="p-3 border border-default rounded-lg bg-elevated/40 dark:bg-elevated/20 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-default truncate">
                  {{ item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ') || `Cost code ${Number(index) + 1}` }}
                </div>
                <div v-if="item.location_label" class="text-xs text-muted mt-1">
                  Location: {{ item.location_label }}
                </div>
                <div v-if="item.description" class="text-xs text-muted mt-1 truncate">
                  {{ item.description }}
                </div>
                <div class="text-xs text-muted mt-1 space-x-2">
                  <span v-if="item.po_amount !== null && item.po_amount !== undefined">
                    PO: {{ formatCurrency(item.po_amount) }}
                  </span>
                  <span v-if="item.co_amount !== null && item.co_amount !== undefined">
                    CO: {{ formatCurrency(item.co_amount) }}
                  </span>
                </div>
                <div v-if="item.removed_at" class="text-[11px] text-muted mt-1">
                  Removed: {{ item.removed_at }}
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <UButton size="xs" color="primary" variant="solid" @click="restoreRemovedLaborCoItem(Number(index))">
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
          <UButton color="neutral" variant="soft" @click="closeRemovedCoItemsModal">
            Close
          </UButton>
          <UButton
            v-if="form.co_type === 'MATERIAL' && removedCoItems.length"
            color="primary"
            variant="solid"
            icon="i-heroicons-arrow-uturn-left"
            @click="restoreAllRemovedCoItems"
          >
            Restore All
          </UButton>
          <UButton
            v-else-if="form.co_type === 'LABOR' && removedLaborCoItems.length"
            color="primary"
            variant="solid"
            icon="i-heroicons-arrow-uturn-left"
            @click="restoreAllRemovedLaborCoItems"
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
        body: 'p-0 overflow-hidden w-[95vw] max-w-[95vw] h-[100vh] max-h-[100vh]'
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

    <!-- Special Instructions + Terms and Conditions previews (SI above T&C when both) -->
    <div
      v-if="form.co_type === 'MATERIAL' && (selectedSpecialInstruction || selectedTermsAndCondition)"
      class="mt-6 space-y-6"
    >
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
      description="Creates a special instruction for the selected corporation and project on this change order."
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
import { computed, watch, onMounted, onBeforeUnmount, nextTick, reactive, unref, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectAddressesStore, type ProjectAddress } from '~/stores/projectAddresses'
import { useLocationsStore } from '~/stores/locations'
import { useProjectsStore } from '~/stores/projects'
import { useVendorStore } from '~/stores/vendors'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useChangeOrderResourcesStore } from '~/stores/changeOrderResources'
import { useChangeOrdersStore } from '~/stores/changeOrders'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import POSelectForCO from '~/components/shared/POSelectForCO.vue'
import ShipViaSelect from '~/components/shared/ShipViaSelect.vue'
import FreightSelect from '~/components/shared/FreightSelect.vue'
import UserSelect from '~/components/shared/UserSelect.vue'
import ReasonSelect from '~/components/shared/ReasonSelect.vue'
import { useReasonsStore } from '~/stores/reasons'
import FilePreview from '~/components/shared/FilePreview.vue'
import COItemsTableFromOriginal from '~/components/changeOrders/COItemsTableFromOriginal.vue'
import COLaborItemsTable from '~/components/changeOrders/COLaborItemsTable.vue'
import COLocationWiseMaterialTable from '~/components/changeOrders/COLocationWiseMaterialTable.vue'
import FinancialBreakdown from '~/components/purchaseOrders/FinancialBreakdown.vue'
import PoCurrencyConversionBar from '~/components/purchaseOrders/PoCurrencyConversionBar.vue'
import PoFromCurrencySelect from '~/components/purchaseOrders/PoFromCurrencySelect.vue'
import {
  normalizePoCurrencyConversionFields,
  syncPoCurrencyConversionForFromCurrency,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'
import { usePoCurrencyFromSelection } from '~/composables/usePoCurrencyFromSelection'
import TermsAndConditionsSelect from '~/components/shared/TermsAndConditionsSelect.vue'
import SpecialInstructionsSelect from '~/components/shared/SpecialInstructionsSelect.vue'
import SpecialInstructionFormBody from '~/components/Configurations/SpecialInstructionFormBody.vue'
import { useShipViaStore } from '~/stores/freight'
import { useFreightStore } from '~/stores/freightGlobal'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import {
  pickFirstSequence,
  buildItemDivisionConfigMap,
  buildItemTypeConfigMap,
  buildPreferredItemTypeMetaLookup,
  mergeItemTypeFromPreferredCatalog,
  resolveItemHierarchyFields,
  type ItemDivisionConfigRow,
  type ItemTypeConfigRow,
} from '~/utils/itemHierarchyResolution'
import { useLaborChangeOrderResourcesStore } from '~/stores/laborChangeOrderResources'
import { useLaborChangeOrderItemsStore } from '~/stores/laborChangeOrderItems'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { useTermsAndConditionsStore } from '~/stores/termsAndConditions'
import { useSpecialInstructionsStore } from '~/stores/specialInstructions'
import { useNimbleSessionStore } from '~/stores/nimbleSession'
import { useUserProfilesStore } from '~/stores/userProfiles'
import CreditDaysSelect from '~/components/shared/CreditDaysSelect.vue'
import { useCreditDaysOptions } from '~/composables/useCreditDaysOptions'

interface Props {
  form: any
  loading?: boolean
  readonly?: boolean
  /** When true, the "Is Revised" checkbox is shown for approval-level users editing an existing CO. */
  allowRevise?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  loading: false,
  readonly: false,
  allowRevise: false,
})
const emit = defineEmits<{ 'update:form': [value: any]; 'nimble-vendor-saved': [] }>()

const corpStore = useCorporationStore()
const projectAddressesStore = useProjectAddressesStore()
const locationsStore = useLocationsStore()
const projectsStore = useProjectsStore()
const vendorStore = useVendorStore()
const purchaseOrdersStore = usePurchaseOrdersStore()
const changeOrderResourcesStore = useChangeOrderResourcesStore()
const changeOrdersStore = useChangeOrdersStore()
const shipViaStore = useShipViaStore()
const freightStore = useFreightStore()
const runtimeConfig = useRuntimeConfig()
/** Nimble: freight / ship-via lists must come from the API, not IndexedDB-backed store cache. */
const nimbleFreightShipViaStrictApi = computed(() => Boolean(runtimeConfig.public.nimbleIntegrations))
const nimbleIntegrationsEnabled = computed(() => Boolean(runtimeConfig.public.nimbleIntegrations))
const nimbleSession = useNimbleSessionStore()
const userProfilesStore = useUserProfilesStore()
const { users: allUsers, hasData: hasUsersData } = storeToRefs(userProfilesStore)
const { refreshCreditDaysOptions, resolveCreditDaysToDayCount } = useCreditDaysOptions()
const reasonsStore = useReasonsStore()
const costCodeConfigurationsStore = useCostCodeConfigurationsStore()
const laborChangeOrderResourcesStore = useLaborChangeOrderResourcesStore()
const laborChangeOrderItemsStore = useLaborChangeOrderItemsStore()
const { formatCurrency } = useCurrencyFormat()

const updateCoCurrencyFields = (
  patch: Partial<ReturnType<typeof normalizePoCurrencyConversionFields>>
) => {
  updateForm(
    normalizePoCurrencyConversionFields({
      ...(props.form as Record<string, unknown>),
      ...patch,
    })
  )
}

const { applyFromCurrency: applyCoFromCurrency, prefillFromVendor: prefillCoCurrencyFromVendor, prefillWhenVendorAlreadySet: prefillCoCurrencyWhenVendorAlreadySet } =
  usePoCurrencyFromSelection({
    getForm: () => props.form as Record<string, unknown>,
    updateCurrencyFields: (fields) => updateCoCurrencyFields(fields),
    isNewDocument: () => !props.form.uuid,
    getCorporationUuid: () => props.form.corporation_uuid,
  })

const coCurrencyConversionEnabled = computed(
  () => normalizePoCurrencyConversionFields(props.form).currency_from === 'USD'
)

const coCurrencyFrom = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).currency_from,
  set: (currency_from: PoCurrencyCode) => {
    void applyCoFromCurrency(currency_from)
  },
})

const coCurrencyTo = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).currency_to,
  set: (currency_to: PoCurrencyCode) =>
    updateCoCurrencyFields({ currency_to }),
})

const coConversionRate = computed({
  get: () => normalizePoCurrencyConversionFields(props.form).conversion_rate,
  set: (conversion_rate: number) =>
    updateCoCurrencyFields({ conversion_rate }),
})

function ensureCoCurrencyFieldsSynced() {
  const fields = normalizePoCurrencyConversionFields(props.form)
  const synced = syncPoCurrencyConversionForFromCurrency(fields.currency_from, {
    conversionRate: fields.conversion_rate,
  })
  if (
    fields.currency_conversion_enabled !== synced.currency_conversion_enabled ||
    fields.currency_from !== synced.currency_from ||
    fields.currency_to !== synced.currency_to
  ) {
    updateCoCurrencyFields(synced)
  }
}

function isCoCurrencyFieldEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

const CURRENCY_PREFILL_FIELDS = [
  'currency_conversion_enabled',
  'currency_from',
  'currency_to',
  'conversion_rate',
] as const
const { toUTCString, fromUTCString, getCurrentLocal } = useUTCDateFormat()
const termsAndConditionsStore = useTermsAndConditionsStore()
const specialInstructionsStore = useSpecialInstructionsStore()

// Template refs for quick-add modals (Vendor / Ship Via / Freight) — parity with PurchaseOrderForm
const vendorSelectRef = ref<InstanceType<typeof VendorSelect> | null>(null)
const shipViaSelectRef = ref<InstanceType<typeof ShipViaSelect> | null>(null)
const freightSelectRef = ref<InstanceType<typeof FreightSelect> | null>(null)

const df = new DateFormatter('en-US', { dateStyle: 'medium' })

// Determine if current project has enable_location_wise turned on
const projectEnableLocationWise = computed(() => {
  const projUuid = String((props.form as any)?.project_uuid || '').trim()
  if (!projUuid) return false
  const project = (projectsStore as any).projects?.find?.((p: any) => String(p.uuid) === projUuid)
  return Boolean(project?.enable_location_wise)
})

const coScopedLocations = ref<any[]>([])

const refreshCoScopedLocations = async (projectUuidInput?: string | null) => {
  const projectUuid = String(projectUuidInput || '').trim()
  if (!projectUuid) {
    coScopedLocations.value = []
    return
  }
  try {
    await locationsStore.fetchLocations(true)
    const allActiveLocations = locationsStore.getActive || []
    const response = await $fetch<{ data?: any[] }>(
      `/api/projects/location-breakdowns?project_uuid=${encodeURIComponent(projectUuid)}`
    ).catch(() => ({ data: [] }))
    const rows = Array.isArray(response?.data) ? response.data : []
    const allowedUuids = new Set(
      rows
        .map((row: any) => String(row?.location_uuid || '').trim())
        .filter(Boolean)
    )
    const scoped = allActiveLocations.filter((loc: any) =>
      allowedUuids.has(String(loc?.uuid || '').trim())
    )
    coScopedLocations.value = scoped.length > 0
      ? scoped
      : rows
          .filter((r: any) => r?.location_uuid)
          .map((r: any) => ({
            uuid: r.location_uuid,
            location_name: r.location_name || r.location_label || r.location_uuid,
          }))
  } catch {
    coScopedLocations.value = []
  }
}

// Project ID prefix for CO number and revision number (parity with PurchaseOrderForm)
const selectedProjectUuid = computed(() => {
  const uuid = (props.form as any).project_uuid
  return uuid ? String(uuid) : null
})
const selectedProjectId = computed(() => {
  if (!selectedProjectUuid.value) return ''
  if ((props.form as any).project_id) return (props.form as any).project_id
  const projects = (projectsStore as any).projects || []
  const project = projects.find((p: any) => p.uuid === selectedProjectUuid.value)
  return project?.project_id || ''
})

const coNumberSuffix = computed(() => {
  const raw = String((props.form as any).co_number || '')
  const prefix = selectedProjectId.value
  if (prefix && raw.startsWith(`${prefix}-`)) {
    return raw.slice(prefix.length + 1)
  }
  return raw
})

const revisionNumberSuffix = computed(() => {
  const raw = String((props.form as any).revision_number || '')
  const prefix = selectedProjectId.value
  if (prefix && raw.startsWith(`${prefix}-`)) {
    return raw.slice(prefix.length + 1)
  }
  return raw
})

// --- Financial breakdown helpers (mirror PurchaseOrderForm pattern) ---
const normalizeFinancialBreakdown = (breakdown: unknown): Record<string, any> | null => {
  if (!breakdown) return null
  if (typeof breakdown === 'string') {
    try {
      const parsed = JSON.parse(breakdown)
      return typeof parsed === 'object' && parsed !== null ? parsed : null
    } catch {
      return null
    }
  }
  if (typeof breakdown === 'object') {
    return breakdown as Record<string, any>
  }
  return null
}

const applyFinancialBreakdownFromField = () => {
  const raw = (props.form as any)?.financial_breakdown ?? (props.form as any)?.financialBreakdown
  const breakdown = normalizeFinancialBreakdown(raw)
  if (!breakdown) return

  const charges = breakdown.charges ?? {}
  const salesTaxes = breakdown.sales_taxes ?? {}

  const updates: Record<string, any> = {}

  // Charges: freight, packing, custom_duties, other
  const chargeKeys = ['freight', 'packing', 'custom_duties', 'other'] as const
  chargeKeys.forEach((key) => {
    const entry = charges[key] ?? {}
    const pctKey = `${key}_charges_percentage`
    const amtKey = `${key}_charges_amount`
    const taxableKey = `${key}_charges_taxable`

    if ((props.form as any)[pctKey] === undefined && entry.percentage !== undefined && entry.percentage !== null) {
      updates[pctKey] = entry.percentage
    }
    if ((props.form as any)[amtKey] === undefined && entry.amount !== undefined && entry.amount !== null) {
      updates[amtKey] = entry.amount
    }
    if ((props.form as any)[taxableKey] === undefined && entry.taxable !== undefined && entry.taxable !== null) {
      updates[taxableKey] = entry.taxable
    }
  })

  // Sales taxes: sales_tax_1, sales_tax_2
  const salesKeys = ['sales_tax_1', 'sales_tax_2'] as const
  salesKeys.forEach((key) => {
    const entry = salesTaxes[key] ?? {}
    const pctKey = `${key}_percentage`
    const amtKey = `${key}_amount`

    const pct = entry.percentage
    const amt = entry.amount
    if (
      (pct !== undefined && pct !== null) &&
      ((props.form as any)[pctKey] === undefined ||
        (props.form as any)[pctKey] === null ||
        (props.form as any)[pctKey] === '')
    ) {
      updates[pctKey] = pct
    }
    if (
      (amt !== undefined && amt !== null) &&
      ((props.form as any)[amtKey] === undefined ||
        (props.form as any)[amtKey] === null ||
        (props.form as any)[amtKey] === '')
    ) {
      updates[amtKey] = amt
    }
  })

  const totals = breakdown.totals ?? {}
  if (
    (props.form as any).item_total === undefined ||
    (props.form as any).item_total === null
  ) {
    const itemTotal = totals.item_total ?? totals.itemTotal
    if (itemTotal !== undefined && itemTotal !== null) {
      updates.item_total = itemTotal
    }
  }
  if (
    (props.form as any).tax_total === undefined ||
    (props.form as any).tax_total === null
  ) {
    const taxTotal = totals.tax_total ?? totals.taxTotal
    if (taxTotal !== undefined && taxTotal !== null) {
      updates.tax_total = taxTotal
    }
  }
  if (
    (props.form as any).total_co_amount === undefined ||
    (props.form as any).total_co_amount === null
  ) {
    const totalCo =
      totals.total_co_amount ??
      totals.totalCoAmount ??
      totals.total_po_amount ??
      totals.total
    if (totalCo !== undefined && totalCo !== null) {
      updates.total_co_amount = totalCo
    }
  }

  if (Object.keys(updates).length > 0) {
    updateForm(updates)
  }
}

const isReadOnly = computed(() => {
  if (props.readonly) return true
  const status = String(props.form.status || '').trim().toLowerCase()
  // Form should be read-only for Approved, Partially_Received, or Completed statuses
  return status === 'approved' || status === 'partially_received' || status === 'completed'
})

// Selected terms and conditions for preview
const selectedTermsAndCondition = computed(() => {
  if (!props.form.terms_and_conditions_uuid) {
    return null
  }
  return termsAndConditionsStore.getTermsAndConditionById(props.form.terms_and_conditions_uuid) || null
})

/** Corporation / project for special-instructions list + quick add (must match CO context). */
const specialInstructionCorpUuid = computed(() =>
  String((props.form as any).corporation_uuid || corpStore.selectedCorporation?.uuid || '').trim(),
)
const specialInstructionProjectUuid = computed(() =>
  String((props.form as any).project_uuid || '').trim(),
)
const canUseSpecialInstructionsSelect = computed(
  () =>
    Boolean(specialInstructionCorpUuid.value) && Boolean(specialInstructionProjectUuid.value),
)

const selectedSpecialInstruction = computed(() => {
  const uuid = (props.form as any).special_instruction_uuid
  if (!uuid) return null
  const list = specialInstructionsStore.items
  if (!Array.isArray(list) || list.length === 0) return null
  return list.find((x) => String(x.uuid) === String(uuid)) ?? null
})

// Quick-add Terms and Conditions
const showQuickAddTermsAndConditions = ref(false)
const savingTermsAndConditions = ref(false)
const quickTCForm = reactive({
  name: '',
  content: '',
  statusLabel: 'Active' as 'Active' | 'Inactive',
})

const showQuickAddSpecialInstruction = ref(false)
const savingQuickSpecialInstruction = ref(false)
const quickSIForm = reactive({
  name: '',
  content: '',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
  corporation_uuid: '' as string,
  project_uuid: '' as string,
})

// TipTap editor for quick-add T&C modal
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

// Sync editor content when modal opens
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

onBeforeUnmount(() => {
  const editorInstance = unref(quickTCEditor)
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    try { editorInstance.destroy() } catch (_) { /* ignore */ }
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
    const toast = useToast()
    const created = await specialInstructionsStore.createItem({
      corporation_uuid: String(quickSIForm.corporation_uuid).trim(),
      project_uuid: String(quickSIForm.project_uuid).trim(),
      name: quickSIForm.name.trim(),
      content: quickSIForm.content.trim(),
      isActive: quickSIForm.isActive === 'Active',
    })
    if (created?.uuid) {
      updateForm({ special_instruction_uuid: created.uuid })
    }
    toast.add({ title: 'Success', description: 'Special instruction created', color: 'success' })
    closeQuickAddSpecialInstruction()
    await specialInstructionsStore.fetchList({
      corporation_uuid: String(quickSIForm.corporation_uuid).trim(),
      project_uuid: String(quickSIForm.project_uuid).trim(),
    })
  } catch (error: unknown) {
    const toast = useToast()
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

const updateForm = (fields: Record<string, any>) => {
  // Allow attachments to be updated even when read-only (for approved change orders)
  // This enables attachment management without needing to save the change order
  const isAttachmentUpdate = Object.keys(fields).includes('attachments')
  
  // Prevent any further mutation once change order is approved, except for attachments
  if (isReadOnly.value && !isAttachmentUpdate) {
    return
  }
  // Ensure deep cloning for nested arrays to trigger reactivity
  const updatedForm = { ...props.form };
  Object.keys(fields).forEach(key => {
    if ((key === 'co_items' || key === 'removed_co_items' || key === 'removed_labor_co_items' || key === 'labor_co_items' || key === 'co_location_wise_material_items') && Array.isArray(fields[key])) {
      // Always create a new array reference with deep-cloned items to ensure Vue tracks changes
      // This ensures that nested property changes (like co_unit_price, co_quantity) trigger reactivity
      updatedForm[key] = fields[key].map((item: any) => ({
        ...item,
        display_metadata: item.display_metadata ? { ...item.display_metadata } : {},
      }));
    } else {
      updatedForm[key] = fields[key];
    }
  });

  if (Object.prototype.hasOwnProperty.call(fields, 'co_items') || Object.prototype.hasOwnProperty.call(fields, 'labor_co_items') || Object.prototype.hasOwnProperty.call(fields, 'removed_co_items')) {
    console.log('[CO_ROW_DEBUG][updateForm]', {
      co_type: updatedForm.co_type,
      original_purchase_order_uuid: updatedForm.original_purchase_order_uuid || null,
      uuid: updatedForm.uuid || null,
      co_items_count: Array.isArray(updatedForm.co_items) ? updatedForm.co_items.length : 0,
      labor_co_items_count: Array.isArray((updatedForm as any).labor_co_items) ? (updatedForm as any).labor_co_items.length : 0,
      removed_co_items_count: Array.isArray((updatedForm as any).removed_co_items) ? (updatedForm as any).removed_co_items.length : 0,
      changed_keys: Object.keys(fields),
    })
  }

  emit('update:form', updatedForm);
}

/** Requested-by: Nimble uses client-sub-users; app uses UserSelect (parity with ReceiptNoteForm received-by). */
const REQUESTED_BY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const computeRequestedByInitials = (user: any) => {
  const segments = [user.firstName, user.lastName]
    .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
    .map((v: string) => v.trim()[0]?.toUpperCase())
    .join('')
  if (segments.length) return segments
  const emailFirst = typeof user.email === 'string' ? user.email.trim()[0] : ''
  return emailFirst ? emailFirst.toUpperCase() : 'U'
}

const selectedCorporationUuidForRequestedBy = computed(
  () =>
    props.form.corporation_uuid ||
    corpStore.selectedCorporation?.uuid ||
    corpStore.selectedCorporationId ||
    null
)

type NimbleRequestedByUser = {
  userId: string
  userName: string
  firstName: string
  lastName: string
  middleName: string
}

const nimbleRequestedByUsers = ref<NimbleRequestedByUser[]>([])

const fetchNimbleRequestedByUsers = async () => {
  const token = String(nimbleSession.token || '').trim()
  if (!token) {
    nimbleRequestedByUsers.value = []
    return
  }
  try {
    const response = await $fetch<{ clientSubUsers?: any[] }>('/api/nimble/client-sub-users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    const list = Array.isArray(response?.clientSubUsers) ? response.clientSubUsers : []
    nimbleRequestedByUsers.value = list
      .map((row: any) => {
        const userId = String(row?.UserID ?? row?.userID ?? row?.userId ?? '').trim()
        if (!userId) return null
        return {
          userId,
          userName: String(row?.UserName ?? row?.userName ?? '').trim(),
          firstName: String(row?.FirstName ?? row?.firstName ?? '').trim(),
          lastName: String(row?.LastName ?? row?.lastName ?? '').trim(),
          middleName: String(row?.MiddleName ?? row?.middleName ?? '').trim(),
        } as NimbleRequestedByUser
      })
      .filter((item: NimbleRequestedByUser | null): item is NimbleRequestedByUser => item !== null)
  } catch {
    nimbleRequestedByUsers.value = []
  }
}

const corporationUsersForRequestedBy = computed(() => {
  const corpUuid = selectedCorporationUuidForRequestedBy.value
  const list = Array.isArray(allUsers.value) ? allUsers.value : []
  return list.filter((user: any) => {
    if (user.status !== 'active') return false
    if (!corpUuid) return true
    if (!Array.isArray(user.corporationAccess)) return false
    return user.corporationAccess.includes(corpUuid)
  })
})

const requestedByOptions = computed(() =>
  nimbleIntegrationsEnabled.value
    ? nimbleRequestedByUsers.value.map((user) => {
        const fullName = [user.firstName, user.middleName, user.lastName]
          .filter((s) => typeof s === 'string' && s.trim().length > 0)
          .join(' ')
        const label = fullName || user.userName || 'Team Member'
        const alt = label
        return {
          label,
          value: user.userId,
          description: user.userName || '',
          avatar: {
            alt,
            text: computeRequestedByInitials({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.userName,
            }),
            size: 'xs' as const,
          },
          user,
        }
      })
    : corporationUsersForRequestedBy.value.map((user: any) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const label = fullName || user.email || 'Team Member'
        const alt = label
        const avatar = user.imageUrl
          ? { src: user.imageUrl, alt, size: 'xs' as const }
          : { alt, text: computeRequestedByInitials(user), size: 'xs' as const }
        return {
          label,
          value: String(user.id ?? user.email ?? ''),
          description: user.email,
          avatar,
          user,
        }
      })
)

const requestedByOption = computed<any>({
  get: () => {
    const selectedValue = nimbleIntegrationsEnabled.value
      ? ((props.form as any).nimble_requested_by_user_id || props.form.requested_by || null)
      : (props.form.requested_by || null)
    if (!selectedValue) return null
    const key = String(selectedValue).trim()
    return (
      requestedByOptions.value.find((opt) => String(opt.value) === key) ?? null
    )
  },
  set: (option) => {
    const value =
      typeof option === 'string' ? option : option?.value ? String(option.value) : null
    if (!nimbleIntegrationsEnabled.value) {
      updateForm({ requested_by: value })
      return
    }
    if (!value) {
      updateForm({ requested_by: null, nimble_requested_by_user_id: null })
      return
    }
    if (REQUESTED_BY_UUID_RE.test(String(value).trim())) {
      updateForm({ requested_by: String(value).trim(), nimble_requested_by_user_id: null })
    } else {
      updateForm({ requested_by: value, nimble_requested_by_user_id: null })
    }
  },
})

const ensureRequestedByUsersLoaded = async () => {
  if (nimbleIntegrationsEnabled.value) {
    await fetchNimbleRequestedByUsers()
    return
  }
  try {
    await userProfilesStore.fetchUsers()
  } catch (e) {
    console.error('[ChangeOrderForm] Failed to load users:', e)
  }
}

const shouldFetchAppUsers = computed(
  () =>
    !hasUsersData.value || !(Array.isArray(allUsers.value) && allUsers.value.length > 0)
)

watch(
  [selectedCorporationUuidForRequestedBy, shouldFetchAppUsers, nimbleIntegrationsEnabled, () => nimbleSession.token],
  ([, needsAppUsers, nimbleOn, token]) => {
    if (nimbleOn && token) {
      ensureRequestedByUsersLoaded()
      return
    }
    if (nimbleOn && !token) {
      nimbleRequestedByUsers.value = []
      return
    }
    if (!nimbleOn && needsAppUsers) {
      ensureRequestedByUsersLoaded()
    }
  },
  { immediate: true }
)

/** Persist edited suffix; when a project prefix is shown, store full number as `{projectId}-{suffix}`. */
const handleCoNumberSuffixUpdate = (value: string) => {
  const v = String(value ?? '').trim()
  const pid = selectedProjectId.value
  const full = pid ? `${pid}-${v}` : v
  updateForm({ co_number: full })
}

const handleCorporationChange = async (corporationUuid?: string | null) => {
  const normalizedCorporationUuid = corporationUuid || ''
  
  // Update corporation_uuid and clear dependent fields in a single update
  // This ensures the prop updates atomically and triggers ProjectSelect's watcher
  updateForm({ 
    corporation_uuid: normalizedCorporationUuid,
    project_uuid: '',
    vendor_uuid: '',
    original_purchase_order_uuid: '',
    shipping_address_uuid: ''
  })
  
  // Wait for next tick to ensure the form prop is updated before fetching
  await nextTick()
  
  // Fetch data for the selected corporation
  // NOTE: We do NOT update corpStore.selectedCorporation here to avoid affecting other components
  // The form operates independently with its own corporation selection
  // NOTE: We don't fetch projects here - ProjectSelect's internal watcher will handle it
  if (normalizedCorporationUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(normalizedCorporationUuid),
      purchaseOrdersStore.fetchPurchaseOrders(normalizedCorporationUuid),
      changeOrdersStore.fetchChangeOrders(normalizedCorporationUuid, true),
    ])
  }
  
  // New CO: clear any draft number and regenerate once project context is known.
  if (!props.form.uuid) {
    updateForm({ co_number: '' })
  }

  // Auto-generate CO Number on corporation selection only when project is already selected.
  if (normalizedCorporationUuid && props.form.project_uuid) {
    generateCONumber({
      force: !props.form.uuid,
      projectId: props.form.project_id || selectedProjectId.value || '',
    })
  }
}

const handleProjectChange = async (projectUuid?: string | null) => {
  const normalized = projectUuid || ''
  let projectId = ''
  if (normalized) {
    const projects = (projectsStore as any).projects || []
    const project = projects.find((p: any) => p.uuid === normalized)
    projectId = project?.project_id || ''
  }
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid

  let shippingUuid = ''
  if (normalized && corpUuid) {
    try {
      await projectAddressesStore.fetchAddresses(normalized)
      const addresses = projectAddressesStore.getAddresses(normalized) as any[] | undefined
      const shippingList = Array.isArray(addresses)
        ? addresses.filter(
            (a: any) => a.is_active !== false && a.address_type === 'shipment'
          )
        : []
      const primary =
        shippingList.find((a: any) => a.is_primary) || shippingList[0] || null
      shippingUuid = primary?.uuid ? String(primary.uuid) : ''
    } catch (e) {
      // no-op
    }
  }

  // Single emit: a follow-up update with only shipping_address_uuid would spread stale
  // props.form and drop the new project_uuid before the parent applies the first emit.
  updateForm({
    project_uuid: normalized,
    project_id: projectId,
    shipping_address_uuid: shippingUuid,
  })
  await refreshCoScopedLocations(normalized)
  // Auto-generate CO Number on project selection if not set
  if (normalized) {
    generateCONumber({
      force: !props.form.uuid,
      projectId: projectId || selectedProjectId.value || '',
    })
  }
}

const onVendorUpdate = (v: any) => {
  const value = typeof v === 'string' ? v : (v && v.value) ? String(v.value) : ''
  updateForm({ vendor_uuid: value })
  void prefillCoCurrencyFromVendor(value)
}

// Generate next CO number suffix once project context is known.
function generateCONumber(options?: { force?: boolean; projectId?: string }) {
  const force = options?.force === true
  // Do not override if already set (e.g., editing)
  if (!force && props.form.co_number && String(props.form.co_number).trim() !== '') return
  // Use form's corporation_uuid, fallback to store's selectedCorporation
  const corporationId = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid
  if (!corporationId) return

  const projectIdPrefix =
    String(
      options?.projectId ||
      (props.form.project_id && String(props.form.project_id).trim()) ||
      selectedProjectId.value ||
      ''
    ).trim()

  // New COs: only assign a number once project context exists.
  if (!props.form.uuid && !projectIdPrefix) return

  // Ensure change orders are available in store
  const existing = (changeOrdersStore.changeOrders || []).filter((co: any) => co.corporation_uuid === corporationId)
  let maxNum = 0
  const extractCoSequenceNumber = (rawValue: unknown): number | null => {
    const coNumber = String(rawValue || '').trim()
    if (!coNumber) return null

    // Primary: capture first numeric run after "CO" token (supports "CO-12A", "PRJ-001-CO-12X", etc.).
    const coTokenMatch = coNumber.match(/CO[^0-9]*(\d+)/i)
    if (coTokenMatch?.[1]) {
      const parsed = parseInt(coTokenMatch[1], 10)
      if (!Number.isNaN(parsed)) return parsed
    }

    // Fallback: use the last numeric run anywhere in the value.
    const lastNumericMatch = coNumber.match(/(\d+)(?!.*\d)/)
    if (lastNumericMatch?.[1]) {
      const parsed = parseInt(lastNumericMatch[1], 10)
      if (!Number.isNaN(parsed)) return parsed
    }

    return null
  }

  for (const co of existing) {
    const rawCoNumber = String(co?.co_number || '')
    if (projectIdPrefix) {
      if (!rawCoNumber.startsWith(`${projectIdPrefix}-`)) continue
      const projectSpecificNumber = extractCoSequenceNumber(rawCoNumber)
      if (projectSpecificNumber !== null) {
        maxNum = Math.max(maxNum, projectSpecificNumber)
      }
      continue
    }

    const num = extractCoSequenceNumber(co?.co_number)
    if (num !== null) maxNum = Math.max(maxNum, num)
  }
  const next = maxNum + 1
  // Generate in simple format: CO-1, CO-2, CO-3, etc.
  updateForm({ co_number: `CO-${next}` })
}

// Dates
const createdDateValue = computed({
  get: () => {
    const src = String(props.form.created_date || '')
    if (!src) return null
    const base = src.includes('T') ? src.substring(0, src.indexOf('T')) : src
    const ymd = base.split('-')
    const [y, m, d] = ymd.length === 3 ? (ymd as [string, string, string]) : [undefined, undefined, undefined] as any
    if (typeof y === 'string' && typeof m === 'string' && typeof d === 'string') {
      const year = parseInt(y, 10)
      const month = parseInt(m, 10)
      const day = parseInt(d, 10)
      return new CalendarDate(year, month, day)
    }
    return null
  },
  set: (val: CalendarDate | null) => {
    if (val) {
      const s = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
      updateForm({ created_date: `${s}T00:00:00.000Z` })
    } else {
      updateForm({ created_date: null })
    }
  }
})
const createdDateDisplay = computed(() => {
  if (!createdDateValue.value) return 'Select created date'
  return df.format((createdDateValue.value as CalendarDate).toDate(getLocalTimeZone()))
})

const estDeliveryDateValue = computed({
  get: () => {
    const src = String(props.form.estimated_delivery_date || '')
    if (!src) return undefined
    const base = src.includes('T') ? src.substring(0, src.indexOf('T')) : src
    const ymd = base.split('-')
    const [y, m, d] = ymd.length === 3 ? (ymd as [string, string, string]) : [undefined, undefined, undefined] as any
    if (typeof y === 'string' && typeof m === 'string' && typeof d === 'string') {
      const year = parseInt(y, 10)
      const month = parseInt(m, 10)
      const day = parseInt(d, 10)
      return new CalendarDate(year, month, day)
    }
    return undefined
  },
  set: (val: CalendarDate | null) => {
    if (val) {
      const s = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
      updateForm({ estimated_delivery_date: `${s}T23:59:59.000Z` })
    } else {
      updateForm({ estimated_delivery_date: null })
    }
  }
})
const estDeliveryDateDisplay = computed(() => {
  if (!estDeliveryDateValue.value) return 'Select delivery date'
  return df.format((estDeliveryDateValue.value as CalendarDate).toDate(getLocalTimeZone()))
})

// Guard flag to prevent recursive updates when calculating estimated delivery date
const isUpdatingEstimatedDeliveryDate = ref(false)
const createdDatePopoverOpen = ref(false)
const revisionDatePopoverOpen = ref(false)

const revisionDateValue = computed({
  get: () => {
    if (!props.form.revision_date) return null
    const src = String(props.form.revision_date)
    const localYmd = src.includes('T') ? fromUTCString(src) : src
    const parts = localYmd.split('-')
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new CalendarDate(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10))
    }
    return null
  },
  set: (value: CalendarDate | null) => {
    if (value) {
      const dateString = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
      updateForm({ revision_date: toUTCString(dateString) })
    } else {
      updateForm({ revision_date: null })
    }
  }
})

const revisionDateDisplayText = computed(() => {
  if (!revisionDateValue.value) return 'Select revision date'
  return df.format((revisionDateValue.value as CalendarDate).toDate(getLocalTimeZone()))
})

const handleIsRevisedChange = (value: boolean) => {
  if (value) {
    updateForm({ is_revised: true, revision_date: toUTCString(getCurrentLocal()) })
  } else {
    updateForm({ is_revised: false, revision_number: '', revision_notes: '', revision_date: null })
  }
}

// Country code helper (limited map similar to PO form)
const getCountryName = (countryCode: string): string => {
  if (!countryCode) return ''
  const countryMap: Record<string, string> = {
    US: 'UNITED STATES OF AMERICA',
    CA: 'CANADA',
    GB: 'UNITED KINGDOM',
    AU: 'AUSTRALIA',
    MX: 'MEXICO'
  }
  return countryMap[countryCode.toUpperCase()] || countryCode.toUpperCase()
}

/** Active shipment addresses for the selected project (same rules as PurchaseOrderForm). */
const projectShippingAddresses = computed((): ProjectAddress[] => {
  const pid = String(props.form.project_uuid || '').trim()
  if (!pid) return []
  const addresses = projectAddressesStore.getAddresses(pid)
  if (!addresses?.length) return []
  return addresses.filter(
    (a) => a.is_active !== false && a.address_type === 'shipment'
  )
})

const formatShipmentAddressOneLine = (addr: ProjectAddress | null | undefined): string => {
  if (!addr) return ''
  const parts = [
    addr.address_line_1,
    addr.address_line_2,
    addr.city,
    addr.state,
    addr.zip_code,
    getCountryName(addr.country || ''),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ').toUpperCase() : ''
}

const formatShipmentAddressFullLines = (addr: ProjectAddress | null | undefined): string[] => {
  if (!addr) return []
  const up = (s: string) => String(s || '').trim().toUpperCase()
  const lines: string[] = []
  if (addr.address_line_1) lines.push(up(addr.address_line_1))
  if (addr.address_line_2) lines.push(up(addr.address_line_2))
  const city = addr.city ? String(addr.city).trim() : ''
  const state = addr.state ? String(addr.state).trim() : ''
  const zip = addr.zip_code ? String(addr.zip_code).trim() : ''
  const cityState = [city, state].filter(Boolean).join(', ')
  const locParts: string[] = []
  if (cityState) locParts.push(cityState.toUpperCase())
  if (zip) locParts.push(zip.toUpperCase())
  if (locParts.length) lines.push(locParts.join(' '))
  const country = getCountryName(addr.country || '')
  if (country) lines.push(country)
  const contact = addr.contact_person?.trim()
  if (contact) lines.push(`CONTACT: ${up(contact)}`)
  const phone = addr.phone?.trim()
  if (phone) lines.push(`PHONE: ${up(phone)}`)
  const email = addr.email?.trim()
  if (email) lines.push(`EMAIL: ${email.toUpperCase()}`)
  return lines
}

const resolvedShipToProjectAddress = computed((): ProjectAddress | null => {
  const list = projectShippingAddresses.value
  if (!list.length) return null
  const formUuid = String(props.form.shipping_address_uuid || '').trim()
  if (formUuid) {
    const match = list.find((a) => String(a.uuid) === formUuid)
    if (match) return match
  }
  return list.find((a) => a.is_primary) || list[0] || null
})

/** One-line ship-to for summary + tests (uses saved shipping_address_uuid when valid). */
const shipToAddress = computed(() =>
  formatShipmentAddressOneLine(resolvedShipToProjectAddress.value)
)

const showShipToAddressDropdown = computed(
  () =>
    Boolean(String(props.form.project_uuid || '').trim()) &&
    projectShippingAddresses.value.length > 1 &&
    !isReadOnly.value
)

const shipToAddressTriggerLines = computed((): string[] => {
  if (!showShipToAddressDropdown.value) return []
  const uuid = String(props.form.shipping_address_uuid || '').trim()
  const list = projectShippingAddresses.value
  const addr = uuid ? list.find((a) => String(a.uuid) === uuid) : null
  const resolved = addr ?? resolvedShipToProjectAddress.value
  return formatShipmentAddressFullLines(resolved)
})

const shipToAddressSelectMenuUi = {
  content: 'max-h-72 min-w-full max-w-lg',
}

const shipToAddressSelectItems = computed(() =>
  projectShippingAddresses.value.map((a) => {
    const lines = formatShipmentAddressFullLines(a)
    return {
      value: a.uuid,
      label: lines.join(' · ') || String(a.uuid),
      lines,
      searchText: lines.join(' '),
    }
  })
)

const shipToSelectModelValue = computed((): string | undefined => {
  const items = shipToAddressSelectItems.value
  if (!items.length) return undefined
  const uuid = String(props.form.shipping_address_uuid || '').trim()
  if (uuid && items.some((i) => String(i.value) === uuid)) {
    return uuid
  }
  return String(items[0].value)
})

const onShipToSelectUpdate = (payload: unknown) => {
  let next = ''
  if (payload != null && typeof payload === 'object' && 'value' in (payload as Record<string, unknown>)) {
    const v = (payload as { value?: unknown }).value
    next = v != null && String(v).trim() !== '' ? String(v) : ''
  } else if (payload != null && String(payload).trim() !== '') {
    next = String(payload)
  }
  updateForm({ shipping_address_uuid: next })
}

// Vendor address block (display only)
const vendorAddressText = computed(() => {
  if (props.form.vendor_uuid) {
    const vendor = vendorStore.vendors.find(v => v.uuid === props.form.vendor_uuid)
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

onMounted(async () => {
  ensureCoCurrencyFieldsSynced()
  await prefillCoCurrencyWhenVendorAlreadySet()

  // Initialize corporation_uuid in form if not set
  if (!props.form.corporation_uuid && corpStore.selectedCorporation?.uuid) {
    updateForm({ corporation_uuid: corpStore.selectedCorporation.uuid })
  }
  
  // NOTE: We do NOT update corpStore.selectedCorporation here to avoid affecting other components
  // The form operates independently with its own corporation selection (props.form.corporation_uuid)
  
  // Use the form's corporation_uuid for fetching data (independent from TopBar)
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporation?.uuid
  if (corpUuid) {
    await Promise.allSettled([
      vendorStore.fetchVendors(String(corpUuid)),
      purchaseOrdersStore.fetchPurchaseOrders(String(corpUuid)),
      changeOrdersStore.fetchChangeOrders(String(corpUuid), true),
      reasonsStore.fetchReasons(), // Fetch reasons (global, not corporation-specific)
      // NOTE: We don't fetch projects metadata here - ProjectSelect's internal watcher will handle it
      props.form.project_uuid ? projectAddressesStore.fetchAddresses(props.form.project_uuid) : Promise.resolve(),
    ])
  } else {
    // Fetch reasons even if no corporation (reasons are global)
    await reasonsStore.fetchReasons().catch(() => {})
  }
  
  // If creating and co_number empty, generate once project is known.
  if (!props.form.uuid && (!props.form.co_number || String(props.form.co_number).trim() === '')) {
    if (props.form.project_uuid) {
      generateCONumber({
        projectId: props.form.project_id || selectedProjectId.value || '',
      })
    }
  }

  await refreshCreditDaysOptions()
})

// Watch form's corporation_uuid for changes and fetch data
watch(() => props.form.corporation_uuid, async (newCorpUuid) => {
  if (!newCorpUuid) return
  try {
    // NOTE: We don't fetch projects here - ProjectSelect's internal watcher will handle it
    await Promise.allSettled([
      vendorStore.fetchVendors(String(newCorpUuid)),
      purchaseOrdersStore.fetchPurchaseOrders(String(newCorpUuid)),
      changeOrdersStore.fetchChangeOrders(String(newCorpUuid), true),
    ])
  } catch (e) {
    // no-op
  }
}, { immediate: true })

// Change Order Items from Original Order
// Use form's corporation_uuid, fallback to store's selectedCorporation
const selectedCorpUuid = computed(() => String(props.form.corporation_uuid || corpStore.selectedCorporation?.uuid || ''))
const originalOrderUuid = computed(() => String(props.form?.original_purchase_order_uuid || ''))

// Item category / division from API (same pipeline as pages/reports/purchase-order-breakout.vue)
const coHierarchyDivisionByUuid = ref(new Map<string, ItemDivisionConfigRow>())
const coHierarchyItemTypeByUuid = ref(new Map<string, ItemTypeConfigRow>())
const coHierarchyPreferredMeta = ref(buildPreferredItemTypeMetaLookup([]))
const coPreferredItemByUuid = ref<Map<string, any>>(new Map())
const coMasterSpecByItemUuid = ref<Map<string, string>>(new Map())
const coMasterSpecByTypeAndName = ref<Map<string, string>>(new Map())

const buildCoSpecTypeNameKey = (itemTypeUuid: unknown, itemName: unknown) =>
  `${String(itemTypeUuid || '').trim().toLowerCase()}::${String(itemName || '').trim().toLowerCase()}`

const getItemTypeLabelFromCoHierarchyApi = (uuid: string | null | undefined): string => {
  if (!uuid) return ''
  const t = coHierarchyItemTypeByUuid.value.get(String(uuid))
  if (!t) return ''
  return pickFirstSequence(t.item_type, t.short_name) || ''
}

const refreshCoItemHierarchyFromApi = async () => {
  const corp = selectedCorpUuid.value
  const proj = String(props.form?.project_uuid || '').trim()
  if (!corp || !proj) {
    coHierarchyDivisionByUuid.value = new Map()
    coHierarchyItemTypeByUuid.value = new Map()
    coHierarchyPreferredMeta.value = buildPreferredItemTypeMetaLookup([])
    coPreferredItemByUuid.value = new Map()
    coMasterSpecByItemUuid.value = new Map()
    coMasterSpecByTypeAndName.value = new Map()
    return
  }
  const [prefSettled, divSettled, typeSettled] = await Promise.allSettled([
    $fetch('/api/cost-code-preferred-items', {
      method: 'GET',
      params: { corporation_uuid: corp, project_uuid: proj },
    }),
    $fetch('/api/item-divisions', {
      method: 'GET',
      params: { corporation_uuid: corp },
    }),
    $fetch('/api/item-types', {
      method: 'GET',
      params: { corporation_uuid: corp },
    }),
  ])

  let preferredMeta = buildPreferredItemTypeMetaLookup([])
  if (prefSettled.status === 'fulfilled') {
    const preferredRows = (prefSettled.value as any)?.data || []
    preferredMeta = buildPreferredItemTypeMetaLookup(preferredRows)
    const byUuid = new Map<string, any>()
    const specByUuid = new Map<string, string>()
    const specByTypeName = new Map<string, string>()
    for (const row of preferredRows) {
      const prefUuid = String(row?.uuid || row?.item_uuid || '').trim()
      if (prefUuid && !byUuid.has(prefUuid)) {
        byUuid.set(prefUuid, row)
      }
      const seq = String(row?.item_sequence ?? row?.sequence ?? '').trim()
      if (!seq) continue
      if (prefUuid && !specByUuid.has(prefUuid)) {
        specByUuid.set(prefUuid, seq)
      }
      const key = buildCoSpecTypeNameKey(row?.item_type_uuid, row?.item_name || row?.name)
      if (key !== '::' && !specByTypeName.has(key)) {
        specByTypeName.set(key, seq)
      }
    }
    coPreferredItemByUuid.value = byUuid
    coMasterSpecByItemUuid.value = specByUuid
    coMasterSpecByTypeAndName.value = specByTypeName
  } else {
    coPreferredItemByUuid.value = new Map()
    coMasterSpecByItemUuid.value = new Map()
    coMasterSpecByTypeAndName.value = new Map()
  }
  coHierarchyPreferredMeta.value = preferredMeta

  let divMap = new Map<string, ItemDivisionConfigRow>()
  if (divSettled.status === 'fulfilled') {
    divMap = buildItemDivisionConfigMap((divSettled.value as any)?.data || [])
  }
  coHierarchyDivisionByUuid.value = divMap

  let typeMap = new Map<string, ItemTypeConfigRow>()
  if (typeSettled.status === 'fulfilled') {
    typeMap = buildItemTypeConfigMap((typeSettled.value as any)?.data || [])
  }
  coHierarchyItemTypeByUuid.value = typeMap
}

watch(
  () => [selectedCorpUuid.value, String(props.form?.project_uuid || '').trim()] as const,
  () => {
    refreshCoItemHierarchyFromApi()
  },
  { immediate: true }
)

/** Map PO/CO line → category, item division, labels using /api item_types + item_divisions + preferred items */
const applyCoLineItemHierarchyFromApi = (line: Record<string, any>) => {
  const mergedPref = mergeItemTypeFromPreferredCatalog(line, coHierarchyPreferredMeta.value)
  const hasType = Boolean(mergedPref.item_type_uuid)
  const source = hasType
    ? { ...mergedPref, division_name: '', division_label: '', item_division_uuid: null }
    : { ...mergedPref }
  const hier = resolveItemHierarchyFields(
    source,
    coHierarchyDivisionByUuid.value,
    coHierarchyItemTypeByUuid.value
  )
  const divName = hier._division_name === '-' ? '' : hier._division_name
  return {
    ...line,
    item_type_uuid: mergedPref.item_type_uuid ?? line.item_type_uuid,
    item_type_label:
      pickFirstSequence(
        line.item_type_label,
        mergedPref.item_type_label,
        hier._item_type_label !== '-' ? hier._item_type_label : ''
      ) || '',
    category: hier._category_value || line.category || '',
    division_name: divName,
    item_division_uuid: hier._resolved_item_division_uuid ?? line.item_division_uuid ?? null,
  }
}

const ensureOriginalItems = async (force = false) => {
  const corp = selectedCorpUuid.value
  const proj = String(props.form?.project_uuid || '')
  const po = originalOrderUuid.value
  if (!corp || !proj || !po) return
  await changeOrderResourcesStore.ensureOriginalOrderItems({
    corporationUuid: corp,
    projectUuid: proj,
    purchaseOrderUuid: po,
    force,
  })
}

watch([() => props.form.project_uuid, () => props.form.original_purchase_order_uuid], async ([proj, po]) => {
  if (proj && po) {
    await ensureOriginalItems()
  }
}, { immediate: true })

// Labor CO Items from Labor PO
const ensureLaborPOItems = async (force = true) => {
  const corp = selectedCorpUuid.value
  const proj = String(props.form?.project_uuid || '')
  const po = originalOrderUuid.value
  const coType = String(props.form?.co_type || '')
  if (!corp || !proj || !po || coType !== 'LABOR') return
  await laborChangeOrderResourcesStore.ensureLaborPOItems({
    corporationUuid: corp,
    projectUuid: proj,
    purchaseOrderUuid: po,
    force,
  })
}

// Only fetch original PO items when creating a NEW change order (no uuid yet)
watch([() => props.form.project_uuid, () => props.form.original_purchase_order_uuid, () => props.form.co_type, () => props.form.uuid], async ([proj, po, coType, uuid]) => {
  // For new change orders (no uuid), fetch original PO items to populate form
  // For existing change orders (has uuid), we'll use saved items from labor_change_order_items_list
  if (proj && po && coType === 'LABOR' && !uuid) {
    console.log('[CO_ROW_DEBUG][watch:ensureLaborPOItems]', {
      project_uuid: proj || null,
      original_purchase_order_uuid: po || null,
      co_type: coType || null,
      uuid: uuid || null,
      action: 'ensureLaborPOItems(true)',
    })
    await ensureLaborPOItems(true)
  }
}, { immediate: true })

const laborPOItemsLoading = computed(() =>
  laborChangeOrderResourcesStore.getLaborPOItemsLoading(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  )
)
const laborPOItemsError = computed(() =>
  laborChangeOrderResourcesStore.getLaborPOItemsError(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  )
)
const laborPOItems = computed(() =>
  laborChangeOrderResourcesStore.getLaborPOItems(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  ) as any[]
)

// Once existing labor items have been fetched at least once, an empty labor_co_items
// array should be treated as intentional (user removed all rows), not as a signal
// to repopulate from saved store rows.
const laborItemsHydratedForExistingCo = ref(false)

const parseLaborMetadata = (value: any): Record<string, any> => {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

const buildLaborMatchKey = (item: any): string => {
  const meta = parseLaborMetadata(item?.metadata)
  const code = String(item?.cost_code_uuid || '')
  const loc = String(item?.location_uuid || meta.location_uuid || '')
  return code ? `${code}::${loc}` : ''
}

const toLaborCoItemRecord = (row: any, idx: number, existing?: any) => {
  const meta = parseLaborMetadata(row?.metadata ?? existing?.metadata)
  return {
    ...(existing || {}),
    cost_code_uuid: row?.cost_code_uuid || null,
    location_uuid: row?.location_uuid ?? meta.location_uuid ?? null,
    location_label: row?.location_label ?? meta.location_label ?? null,
    description: row?.description ?? meta.description ?? '',
    cost_code_number: row?.cost_code_number ?? existing?.cost_code_number ?? '',
    cost_code_name: row?.cost_code_name ?? existing?.cost_code_name ?? '',
    cost_code_label: row?.cost_code_label ?? existing?.cost_code_label ?? '',
    division_name: row?.division_name ?? existing?.division_name ?? null,
    po_amount: row?.po_amount ?? existing?.po_amount ?? 0,
    co_amount: row?.co_amount ?? existing?.co_amount ?? null,
    order_index: idx,
    uuid: row?.uuid ?? existing?.uuid,
    metadata: meta,
  }
}

// Load saved labor CO items if editing
watch([() => props.form.uuid, () => props.form.co_type], async ([coUuid, coType]) => {
  if (coUuid && coType === 'LABOR') {
    await laborChangeOrderItemsStore.fetchItems(String(coUuid))
    // Load saved items into form data (always load when editing, even if form already has items)
    const savedItems = laborChangeOrderItemsStore.getItemsByChangeOrder(String(coUuid))
    if (savedItems.length > 0) {
      // Always update form with saved items when editing
      updateForm({
        labor_co_items: savedItems.map((item: any) => ({
          ...(item || {}),
          metadata: parseLaborMetadata(item?.metadata),
          cost_code_uuid: item.cost_code_uuid,
          cost_code_number: item.cost_code_number,
          cost_code_name: item.cost_code_name,
          cost_code_label: item.cost_code_label,
          division_name: item.division_name,
          po_amount: item.po_amount,
          co_amount: item.co_amount,
          order_index: item.order_index,
          uuid: item.uuid, // Include uuid from saved item
          // Ensure location and description fields are preserved on reload
          location_uuid: item.location_uuid ?? parseLaborMetadata(item?.metadata).location_uuid ?? null,
          location_label: item.location_label ?? parseLaborMetadata(item?.metadata).location_label ?? null,
          description: item.description ?? parseLaborMetadata(item?.metadata).description ?? '',
        })),
      })
    }
    laborItemsHydratedForExistingCo.value = true
  } else {
    laborItemsHydratedForExistingCo.value = false
  }

  // Load saved location-wise material CO items when editing Material CO
  if (coUuid && coType === 'MATERIAL') {
    try {
      const response: any = await $fetch(`/api/change-orders/${coUuid}`, { method: 'GET' })
      const coData = response?.data || response || {}
      const savedLwmItems = Array.isArray(coData?.co_location_wise_material_items)
        ? coData.co_location_wise_material_items
        : []
      if (savedLwmItems.length > 0) {
        originalPOHasLocationWiseMaterial.value = true
        updateForm({
          co_location_wise_material_items: savedLwmItems.map((item: any) => ({
            cost_code_uuid: item.cost_code_uuid,
            cost_code_number: item.cost_code_number,
            cost_code_name: item.cost_code_name,
            cost_code_label: item.cost_code_label,
            division_name: item.division_name,
            location_uuid: item.location_uuid,
            location_label: item.location_label,
            material_budgeted_amount: item.material_budgeted_amount,
            po_amount: item.po_amount,
            co_amount: item.co_amount,
            description: item.description || '',
            order_index: item.order_index,
          })),
        })
      }
    } catch (_err: any) {
      // Non-critical
    }
  }
}, { immediate: true })

// Map saved labor CO items by cost_code_uuid
const laborCOItemsMap = computed(() => {
  const map = new Map<string, any>()
  // Check saved items from store (when editing existing CO)
  const savedItems = props.form?.uuid
    ? laborChangeOrderItemsStore.getItemsByChangeOrder(String(props.form.uuid))
    : []
  // Also check form data (for new COs or unsaved changes)
  const formItems = Array.isArray((props.form as any)?.labor_co_items) ? (props.form as any).labor_co_items : []
  // Merge both, with form items taking precedence
  const allItems = [...savedItems, ...formItems]
  allItems.forEach((item: any) => {
    const key = buildLaborMatchKey(item)
    if (key) {
      map.set(key, item)
    }
  })
  return map
})

const laborCODisplayItems = computed(() => {
  // For existing COs, use labor_co_items from form, or fall back to saved items from store
  if (props.form?.uuid) {
    const laborCoItemsList = Array.isArray((props.form as any)?.labor_co_items) ? (props.form as any).labor_co_items : []
    const shouldUseFormRows =
      Array.isArray((props.form as any)?.labor_co_items) &&
      (laborCoItemsList.length > 0 || laborItemsHydratedForExistingCo.value)
    if (shouldUseFormRows) {
      return laborCoItemsList.map((row: any, idx: number) => ({
        ...(row || {}),
        metadata: parseLaborMetadata(row?.metadata),
        id: row?.uuid || row?.id || `labor-${row.cost_code_uuid || idx}-${row.location_uuid || ''}`,
        cost_code_uuid: row?.cost_code_uuid || null,
        cost_code_number: row?.cost_code_number || '',
        cost_code_name: row?.cost_code_name || '',
        cost_code_label: row?.cost_code_label || [row?.cost_code_number, row?.cost_code_name].filter(Boolean).join(' ').trim(),
        division_name: row?.division_name || null,
        po_amount: row?.po_amount ?? 0,
        co_amount: row?.co_amount ?? null,
        uuid: row?.uuid,
        location_uuid: row?.location_uuid ?? parseLaborMetadata(row?.metadata).location_uuid ?? null,
        location_label: row?.location_label ?? parseLaborMetadata(row?.metadata).location_label ?? null,
        description: row?.description ?? parseLaborMetadata(row?.metadata).description ?? '',
      }))
    } else {
      // Fall back to saved items from store for existing COs
      const savedItems = laborChangeOrderItemsStore.getItemsByChangeOrder(String(props.form.uuid))
      return savedItems.map((row: any, idx: number) => ({
        ...(row || {}),
        metadata: parseLaborMetadata(row?.metadata),
        id: row?.uuid || row?.id || `labor-${row.cost_code_uuid || idx}-${row.location_uuid || ''}`,
        cost_code_uuid: row?.cost_code_uuid || null,
        cost_code_number: row?.cost_code_number || '',
        cost_code_name: row?.cost_code_name || '',
        cost_code_label: row?.cost_code_label || [row?.cost_code_number, row?.cost_code_name].filter(Boolean).join(' ').trim(),
        division_name: row?.division_name || null,
        po_amount: row?.po_amount ?? 0,
        co_amount: row?.co_amount ?? null,
        uuid: row?.uuid,
        location_uuid: row?.location_uuid ?? parseLaborMetadata(row?.metadata).location_uuid ?? null,
        location_label: row?.location_label ?? parseLaborMetadata(row?.metadata).location_label ?? null,
        description: row?.description ?? parseLaborMetadata(row?.metadata).description ?? '',
      }))
    }
  }

  // For new COs, always use original PO items as base, then merge with edited amounts
  const source = Array.isArray(laborPOItems.value) ? laborPOItems.value : []
  const removedKeys = new Set<string>()
  const removedLabor = Array.isArray((props.form as any)?.removed_labor_co_items)
    ? (props.form as any).removed_labor_co_items
    : []
  removedLabor.forEach((removed: any) => {
    const key = buildLaborMatchKey(removed)
    if (key) removedKeys.add(key)
  })

  return source
    .filter((row: any) => {
      const key = buildLaborMatchKey(row)
      return !key || !removedKeys.has(key)
    })
    .map((row: any, idx: number) => {
    const rowMeta = parseLaborMetadata(row?.metadata)
    const key = buildLaborMatchKey(row)
    const editedItem = key ? laborCOItemsMap.value.get(key) : undefined

    return {
      id: row?.uuid || row?.id || `labor-${row.cost_code_uuid || idx}-${row.location_uuid || ''}`,
      cost_code_uuid: row?.cost_code_uuid || null,
      cost_code_number: row?.cost_code_number || '',
      cost_code_name: row?.cost_code_name || '',
      cost_code_label: row?.cost_code_number && row?.cost_code_name ? `${row.cost_code_number} ${row.cost_code_name}`.trim() : '',
      division_name: row?.division_name || null,
      po_amount: row?.po_amount ?? 0,
      co_amount: editedItem?.co_amount ?? null,
      uuid: row?.uuid,
      location_uuid: editedItem?.location_uuid ?? row?.location_uuid ?? rowMeta.location_uuid ?? null,
      location_label: editedItem?.location_label ?? row?.location_label ?? rowMeta.location_label ?? null,
      description: editedItem?.description ?? row?.description ?? rowMeta.description ?? '',
    }
  })
})

const updateLaborCoItemsAt = (costCodeUuid: string, locationUuid: string | null, fields: Record<string, any>) => {
  const currentList = Array.isArray((props.form as any)?.labor_co_items) ? [...(props.form as any).labor_co_items] : []

  const existingIndex = currentList.findIndex(
    (it: any) =>
      String(it.cost_code_uuid) === String(costCodeUuid) &&
      String(it.location_uuid || '') === String(locationUuid || '')
  )

  const recordBase = {
    cost_code_uuid: costCodeUuid || null,
    location_uuid: locationUuid || null,
    order_index: currentList.length,
  }

  const updatedList = [...currentList]
  if (existingIndex >= 0) {
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...recordBase, ...fields }
  } else {
    updatedList.push({ ...recordBase, ...fields })
  }

  updateForm({ labor_co_items: updatedList })
}

const handleLaborCoAmountChange = ({ index, numericValue }: { index: number; numericValue: number }) => {
  const item = laborCODisplayItems.value[index]
  if (!item || !item.cost_code_uuid) return
  const itemMeta = parseLaborMetadata(item?.metadata)

  updateLaborCoItemsAt(String(item.cost_code_uuid), item.location_uuid || null, {
    co_amount: numericValue,
    cost_code_number: item.cost_code_number,
    cost_code_name: item.cost_code_name,
    cost_code_label: item.cost_code_label,
    division_name: item.division_name,
    po_amount: item.po_amount,
    // Preserve default/hydrated description so it is saved even without manual edits.
    description: item.description ?? itemMeta.description ?? '',
    location_label: item.location_label ?? itemMeta.location_label ?? null,
  })
}

const handleLaborLocationChange = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const item = laborCODisplayItems.value[index]
  if (!item || !item.cost_code_uuid) return

  const locationLabel =
    option?.label ||
    option?.location_name ||
    option?.location?.location_name ||
    item.location_label ||
    ''

  // Use the newly selected location as the key so each (cost code, location) row is distinct
  updateLaborCoItemsAt(String(item.cost_code_uuid), value || null, {
    location_uuid: value || null,
    location_label: locationLabel,
  })
}

const handleLaborDescriptionChange = ({ index, value }: { index: number; value: string }) => {
  const item = laborCODisplayItems.value[index]
  if (!item || !item.cost_code_uuid) return

  updateLaborCoItemsAt(String(item.cost_code_uuid), item.location_uuid || null, {
    description: value ?? '',
    cost_code_number: item.cost_code_number,
    cost_code_name: item.cost_code_name,
    cost_code_label: item.cost_code_label,
    division_name: item.division_name,
    po_amount: item.po_amount,
    co_amount: item.co_amount,
    location_label: item.location_label,
  })
}

const removeLaborCoRow = (index: number) => {
  const item = laborCODisplayItems.value[index]
  if (!item || !item.cost_code_uuid) return

  const targetKey = buildLaborMatchKey(item)
  const formItems = Array.isArray((props.form as any)?.labor_co_items)
    ? (props.form as any).labor_co_items
    : []
  const formByKey = new Map<string, any>()
  formItems.forEach((it: any) => {
    const key = buildLaborMatchKey(it)
    if (key) formByKey.set(key, it)
  })

  const nextItems = laborCODisplayItems.value
    .map((row: any, idx: number) => {
      const key = buildLaborMatchKey(row)
      return toLaborCoItemRecord(row, idx, key ? formByKey.get(key) : undefined)
    })
    .filter((it: any) => buildLaborMatchKey(it) !== targetKey)

  const updates: Record<string, any> = { labor_co_items: nextItems }

  const removedList = Array.isArray((props.form as any)?.removed_labor_co_items)
    ? [...(props.form as any).removed_labor_co_items]
    : []
  if (!removedList.some((r: any) => buildLaborMatchKey(r) === targetKey)) {
    const snapshot = cloneCoItem({
      ...item,
      metadata: parseLaborMetadata(item?.metadata),
    })
    snapshot.removed_at = new Date().toISOString()
    removedList.push(snapshot)
  }
  updates.removed_labor_co_items = removedList

  if (props.form?.uuid) {
    laborItemsHydratedForExistingCo.value = true
  }

  updateForm(updates)
}

// ---------------------------------------------------------------------------
// Location-wise Material CO Items (for Material COs from location-wise estimates)
// ---------------------------------------------------------------------------
const coLocationWiseMaterialLoading = ref(false)
const coLocationWiseMaterialError = ref<string | null>(null)

const hasCoLocationWiseMaterialItems = computed(() =>
  Array.isArray((props.form as any)?.co_location_wise_material_items) &&
  (props.form as any).co_location_wise_material_items.length > 0
)

const originalPOHasLocationWiseMaterial = ref(false)

const shouldShowCoLocationWiseMaterialSection = computed(() => {
  if (props.form?.co_type === 'LABOR') return false
  if (!props.form?.original_purchase_order_uuid) return false
  return (
    coLocationWiseMaterialLoading.value ||
    !!coLocationWiseMaterialError.value ||
    hasCoLocationWiseMaterialItems.value ||
    originalPOHasLocationWiseMaterial.value
  )
})

const coLocationWiseMaterialDisplayItems = computed(() => {
  if (props.form?.uuid) {
    const formItems = Array.isArray((props.form as any)?.co_location_wise_material_items)
      ? (props.form as any).co_location_wise_material_items
      : []
    return formItems.map((row: any, idx: number) => ({
      id: row?.uuid || row?.id || `co-lwm-${row.cost_code_uuid || idx}-${row.location_uuid || ''}`,
      cost_code_uuid: row?.cost_code_uuid || null,
      cost_code_number: row?.cost_code_number || '',
      cost_code_name: row?.cost_code_name || '',
      cost_code_label: row?.cost_code_label || [row?.cost_code_number, row?.cost_code_name].filter(Boolean).join(' ').trim(),
      division_name: row?.division_name || null,
      location_uuid: row?.location_uuid || null,
      location_label: row?.location_label || null,
      material_budgeted_amount: row?.material_budgeted_amount ?? null,
      po_amount: row?.po_amount ?? 0,
      co_amount: row?.co_amount ?? null,
      description: row?.description || '',
    }))
  }

  const formItems = Array.isArray((props.form as any)?.co_location_wise_material_items)
    ? (props.form as any).co_location_wise_material_items
    : []
  return formItems.map((row: any, idx: number) => ({
    id: row?.id || `co-lwm-${row.cost_code_uuid || idx}-${row.location_uuid || ''}`,
    cost_code_uuid: row?.cost_code_uuid || null,
    cost_code_number: row?.cost_code_number || '',
    cost_code_name: row?.cost_code_name || '',
    cost_code_label: row?.cost_code_label || [row?.cost_code_number, row?.cost_code_name].filter(Boolean).join(' ').trim(),
    division_name: row?.division_name || null,
    location_uuid: row?.location_uuid || null,
    location_label: row?.location_label || null,
    material_budgeted_amount: row?.material_budgeted_amount ?? null,
    po_amount: row?.po_amount ?? 0,
    co_amount: row?.co_amount ?? null,
    description: row?.description || '',
  }))
})

const showCoLocationWiseMaterialLocationColumn = computed(() =>
  coLocationWiseMaterialDisplayItems.value.some(
    (item: any) => item.location_uuid != null && item.location_uuid !== ''
  )
)

const fetchPoLocationWiseMaterialForCO = async (poUuid: string) => {
  if (!poUuid) return
  coLocationWiseMaterialLoading.value = true
  coLocationWiseMaterialError.value = null
  try {
    const response: any = await $fetch(`/api/purchase-order-forms/${poUuid}`, {
      method: 'GET',
    })
    const poData = response?.data || response || {}
    const poLwmItems = Array.isArray(poData?.po_location_wise_material_items)
      ? poData.po_location_wise_material_items
      : []

    if (poLwmItems.length > 0) {
      originalPOHasLocationWiseMaterial.value = true
      if (!hasCoLocationWiseMaterialItems.value) {
        const coItems = poLwmItems.map((item: any, idx: number) => {
          const meta: Record<string, any> =
            item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
              ? { ...item.metadata }
              : {}
          const approvalFromPo =
            (Array.isArray(item.approval_checks_uuids) && item.approval_checks_uuids.length > 0
              ? item.approval_checks_uuids
              : null) ||
            (Array.isArray(item.approval_checks) && item.approval_checks.length > 0 ? item.approval_checks : null) ||
            (Array.isArray(meta.approval_checks_uuids) && meta.approval_checks_uuids.length > 0
              ? meta.approval_checks_uuids
              : null) ||
            (Array.isArray(meta.approval_checks) && meta.approval_checks.length > 0 ? meta.approval_checks : null) ||
            []
          const approvalArr = Array.isArray(approvalFromPo) ? approvalFromPo : []
          if (approvalArr.length > 0) {
            meta.approval_checks_uuids = approvalArr
            meta.approval_checks = approvalArr
          }
          return {
            cost_code_uuid: item.cost_code_uuid || null,
            cost_code_number: item.cost_code_number || '',
            cost_code_name: item.cost_code_name || '',
            cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
            division_name: item.division_name || null,
            location_uuid: item.location_uuid || null,
            location_label: item.location_label || null,
            material_budgeted_amount: item.material_budgeted_amount ?? null,
            po_amount: item.po_amount ?? 0,
            co_amount: null,
            description: item.description || '',
            order_index: idx,
            metadata: meta,
          }
        })
        updateForm({ co_location_wise_material_items: coItems })
      }
    } else {
      originalPOHasLocationWiseMaterial.value = false
    }
  } catch (err: any) {
    coLocationWiseMaterialError.value = null
    originalPOHasLocationWiseMaterial.value = false
  } finally {
    coLocationWiseMaterialLoading.value = false
  }
}

const handleCoLocationWiseMaterialAmountChange = ({ index, numericValue }: { index: number; numericValue: number }) => {
  const items = Array.isArray((props.form as any)?.co_location_wise_material_items)
    ? [...(props.form as any).co_location_wise_material_items]
    : []
  if (index >= 0 && index < items.length) {
    items[index] = { ...items[index], co_amount: numericValue }
    updateForm({ co_location_wise_material_items: items })
  }
}

const handleCoLocationWiseMaterialLocationChange = ({ index, value, option }: { index: number; value: string | null; option?: any }) => {
  const items = Array.isArray((props.form as any)?.co_location_wise_material_items)
    ? [...(props.form as any).co_location_wise_material_items]
    : []
  if (index >= 0 && index < items.length) {
    const locationLabel = option?.label || option?.location_name || ''
    items[index] = { ...items[index], location_uuid: value || null, location_label: locationLabel }
    updateForm({ co_location_wise_material_items: items })
  }
}

const removeCoLocationWiseMaterialRow = (index: number) => {
  const items = Array.isArray((props.form as any)?.co_location_wise_material_items)
    ? [...(props.form as any).co_location_wise_material_items]
    : []
  if (index >= 0 && index < items.length) {
    items.splice(index, 1)
    updateForm({ co_location_wise_material_items: items })
  }
}

// Fetch location-wise material from original PO when PO changes (Material CO)
watch([() => props.form.project_uuid, () => props.form.original_purchase_order_uuid, () => props.form.co_type], async ([proj, po, coType]) => {
  if (proj && po && coType !== 'LABOR') {
    await fetchPoLocationWiseMaterialForCO(String(po))
  } else if (!po) {
    originalPOHasLocationWiseMaterial.value = false
    if (!props.form?.uuid) {
      updateForm({ co_location_wise_material_items: [] })
    }
  }
}, { immediate: true })

const originalItemsLoading = computed(() =>
  changeOrderResourcesStore.getOriginalItemsLoading(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  )
)
const originalItemsError = computed(() =>
  changeOrderResourcesStore.getOriginalItemsError(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  )
)
const originalItems = computed(() =>
  changeOrderResourcesStore.getOriginalItems(
    selectedCorpUuid.value,
    String(props.form?.project_uuid || ''),
    originalOrderUuid.value
  ) as any[]
)

const normalize = (v: any) => (v === null || v === undefined ? '' : String(v).trim().toUpperCase())
const buildCoMatchKey = (item: any) => {
  return [
    normalize(item?.cost_code_uuid || item?.cost_code_id),
    normalize(item?.item_uuid || item?.item_id),
    normalize(item?.model_number || ''),
  ].join('|')
}

const coItemsMap = computed(() => {
  const map = new Map<string, any>()
  const list = Array.isArray(props.form?.co_items) ? props.form.co_items : []
  list.forEach((ci: any) => {
    map.set(buildCoMatchKey(ci), ci)
  })
  return map
})

// Separate new items (not from original PO) from co_items
const newCoItems = computed(() => {
  const coItemsList = Array.isArray(props.form?.co_items) ? props.form.co_items : []
  const source = Array.isArray(originalItems.value) ? originalItems.value : []
  
  // Build set of original item keys
  const originalKeys = new Set<string>()
  source.forEach((item: any) => {
    originalKeys.add(buildCoMatchKey(item))
  })
  
  // Filter out items that match original PO items - these are handled separately
  return coItemsList.filter((item: any) => {
    const itemKey = buildCoMatchKey(item)
    return !originalKeys.has(itemKey)
  })
})

// For existing Material COs, once rows are edited/removed in-session, an empty
// co_items array should be respected (do not fallback to full original PO set).
const coItemsTouchedForExistingCo = ref(false)

const coDisplayItems = computed(() => {
  const source = Array.isArray(originalItems.value) ? originalItems.value : []
  // Build set of removed item keys to exclude from display
  const removed = Array.isArray((props.form as any)?.removed_co_items) ? (props.form as any).removed_co_items : []
  const removedKeys = new Set<string>()
  removed.forEach((item: any) => {
    removedKeys.add(buildCoMatchKey(item))
  })
  
  // Check if co_items is pre-populated (e.g., from exceeded quantities)
  // Only filter by co_items when editing an existing change order (has uuid)
  // For new change orders, always show all items regardless of co_items
  const coItemsList = Array.isArray(props.form?.co_items) ? props.form.co_items : []
  const isEditingExistingCO = !!props.form?.uuid
  const hasPrePopulatedCoItems = isEditingExistingCO && (coItemsList.length > 0 || coItemsTouchedForExistingCo.value)
  
  // Build set of co_items keys for filtering
  const coItemsKeys = new Set<string>()
  if (hasPrePopulatedCoItems) {
    coItemsList.forEach((item: any) => {
      coItemsKeys.add(buildCoMatchKey(item))
    })
  }
  
  const filtered = source.filter((row: any) => {
    const rowKey = buildCoMatchKey(row)
    // Exclude removed items
    if (removedKeys.has(rowKey)) return false
    // If editing existing CO and co_items is pre-populated, only include items that are in co_items
    // For new COs, always show all items
    if (hasPrePopulatedCoItems && !coItemsKeys.has(rowKey)) return false
    return true
  })
  
  // Map original PO items
  const originalItemsDisplay = filtered.map((row: any, idx: number) => {
    // Get item name - prioritize item_name strictly (same logic as POBreakdown)
    const metadata = row?.metadata || row?.display_metadata || {}
    
    // Fetch sequence from multiple sources:
    // 1. Check metadata and display_metadata first (from saved PO items)
    const sequenceFromMetadata = metadata?.item_sequence || metadata?.sequence || null
    
    // 2. Check direct row fields
    const sequenceFromRow = row?.item_sequence || row?.sequence || null
    
    // 3. API-backed fallback from preferred-items catalog (project scoped)
    const itemUuid = row?.item_uuid || null
    const sequenceFromPreferredUuid = itemUuid
      ? coMasterSpecByItemUuid.value.get(String(itemUuid).trim()) || null
      : null
    const sequenceFromPreferredTypeName =
      coMasterSpecByTypeAndName.value.get(
        buildCoSpecTypeNameKey(row?.item_type_uuid, row?.item_name || row?.name)
      ) || null
    
    // Use the first available sequence
    const sequence =
      sequenceFromMetadata ||
      sequenceFromRow ||
      sequenceFromPreferredUuid ||
      sequenceFromPreferredTypeName ||
      null
    let itemName = row?.item_name || ''
    if (!itemName) {
      itemName = metadata?.item_name || ''
    }
    // If we have sequence but still no item_name, try row.name (preferred items may use 'name' field)
    // Also fallback to row.name if no item_name found (for backward compatibility with test data)
    if (!itemName) {
      if (sequence) {
        itemName = row?.name || ''
      } else {
        // Fallback to name even without sequence (for test compatibility and legacy data)
        itemName = row?.name || ''
      }
    }
    
    // Get item type label from multiple sources
    let itemTypeLabel = row?.item_type_label || ''
    if (!itemTypeLabel) {
      itemTypeLabel = metadata?.item_type_label || ''
    }
    // If still not found, try to get from item type UUID using store
    const itemTypeUuid = row?.item_type_uuid || metadata?.item_type_uuid || null
    if (!itemTypeLabel && itemTypeUuid) {
      itemTypeLabel = getItemTypeLabelFromCoHierarchyApi(itemTypeUuid)
    }
    // Also try to get from preferred item map if item_uuid is available
    const preferredItem = itemUuid ? coPreferredItemByUuid.value.get(String(itemUuid)) : null
    if (!itemTypeLabel && preferredItem?.item_type_uuid) {
      itemTypeLabel = getItemTypeLabelFromCoHierarchyApi(preferredItem.item_type_uuid)
    }
    
    const base = {
      id: row?.uuid || row?.id || `orig-${idx}`,
      name: itemName || '',
      description: row?.description || '',
      cost_code_label: row?.cost_code_label || [row?.cost_code_number, row?.cost_code_name].filter(Boolean).join(' ').trim(),
      cost_code_number: row?.cost_code_number || '',
      cost_code_name: row?.cost_code_name || '',
      unit_price: row?.po_unit_price ?? row?.unit_price ?? 0,
      quantity: row?.po_quantity ?? row?.quantity ?? 0,
      total: row?.po_total ?? row?.total ?? 0,
      // keys used for matching
      cost_code_uuid: row?.cost_code_uuid || null,
      item_uuid: itemUuid,
      item_type_uuid: itemTypeUuid,
      item_type_label: itemTypeLabel,
      model_number: row?.model_number || '',
      sequence: sequence,
      // Category / division / location (for display)
      category: row?.category || metadata?.category || '',
      division_name: row?.division_name || metadata?.division_name || '',
      item_division_uuid: row?.item_division_uuid || metadata?.item_division_uuid || null,
      location_uuid: row?.location_uuid || metadata?.location_uuid || null,
      location_label: row?.location_label || metadata?.location_display || metadata?.location_name || '',
      unit_uuid: row?.unit_uuid ?? row?.uom_uuid ?? metadata?.unit_uuid ?? metadata?.uom_uuid ?? null,
      unit_label: row?.unit_label || row?.uom || row?.unit || metadata?.unit_label || metadata?.uom || metadata?.unit || '',
      uom: row?.uom || row?.unit_label || row?.unit || metadata?.uom || metadata?.unit_label || metadata?.unit || '',
      // Map approval_checks_uuids (from DB) to approval_checks (for display)
      approval_checks: Array.isArray(row?.approval_checks_uuids) && row.approval_checks_uuids.length > 0
        ? row.approval_checks_uuids
        : (Array.isArray(row?.approval_checks) && row.approval_checks.length > 0
          ? row.approval_checks
          : []),
    }
    const matched = coItemsMap.value.get(buildCoMatchKey(base)) || {}
    const matchedMeta = matched?.metadata && typeof matched.metadata === 'object' ? matched.metadata : {}
    const hasSavedUomSelection = Boolean(
      matched?.unit_uuid ||
      matched?.uom_uuid ||
      matched?.unit_label ||
      matched?.uom_label ||
      matched?.uom ||
      matched?.unit ||
      matchedMeta?.unit_uuid ||
      matchedMeta?.uom_uuid ||
      matchedMeta?.unit_label ||
      matchedMeta?.uom ||
      matchedMeta?.unit
    )

    // Prefer CO item overrides (from form.co_items) over original PO values when present
    const merged = {
      ...base,
      // Category / division
      category: matched.category ?? base.category,
      division_name: matched.division_name ?? base.division_name,
      item_division_uuid: matched.item_division_uuid ?? base.item_division_uuid,
      // Item type
      item_type_uuid: matched.item_type_uuid ?? base.item_type_uuid,
      item_type_label: matched.item_type_label ?? base.item_type_label,
      // Item / sequence / description (description is edited on the CO line and stored in co_items)
      item_uuid: matched.item_uuid ?? base.item_uuid,
      name: matched.name ?? base.name,
      sequence: matched.sequence ?? base.sequence,
      description:
        matched.description ??
        matchedMeta?.description ??
        base.description,
      // Location (project location)
      location_uuid: matched.location_uuid ?? base.location_uuid,
      location_label: matched.location_label ?? matched.location ?? base.location_label,
      // For existing CO rows, never fall back to PO UOM when a saved CO UOM exists.
      unit_uuid: hasSavedUomSelection
        ? (matched.unit_uuid ?? matched.uom_uuid ?? matchedMeta?.unit_uuid ?? matchedMeta?.uom_uuid ?? null)
        : base.unit_uuid,
      unit_label: hasSavedUomSelection
        ? (matched.unit_label ?? matched.uom_label ?? matched.uom ?? matched.unit ?? matchedMeta?.unit_label ?? matchedMeta?.uom ?? matchedMeta?.unit ?? '')
        : base.unit_label,
      uom: hasSavedUomSelection
        ? (matched.uom ?? matched.unit_label ?? matched.unit ?? matchedMeta?.uom ?? matchedMeta?.unit_label ?? matchedMeta?.unit ?? '')
        : base.uom,
    }
    const hierarchyResolved = applyCoLineItemHierarchyFromApi(merged)
    return {
      ...hierarchyResolved,
      co_unit_price: matched?.co_unit_price ?? null,
      co_quantity: matched?.co_quantity ?? null,
      co_total: matched?.co_total ?? null,
      // Storage location from saved CO item (separate from project location)
      storage_location_uuid: matched?.storage_location_uuid ?? null,
      storage_location_label: matched?.storage_location_label ?? null,
      // Use approval_checks from matched item (saved CO item) or fall back to base (from original PO)
      approval_checks: Array.isArray(matched?.approval_checks) && matched.approval_checks.length > 0
        ? matched.approval_checks
        : base.approval_checks,
      isNewItem: false, // Mark as original item
    }
  })
  
  // Map new items (not from original PO)
  const newItemsDisplay = newCoItems.value.map((item: any, idx: number) => {
    // Use temp_id for tracking if available, otherwise use match key
    const itemId = item.temp_id || (item.cost_code_uuid && item.item_uuid ? buildCoMatchKey(item) : null) || `new-${idx}`
    // Get cost code info from item or store
    const costCodeUuid = item.cost_code_uuid || null
    let costCodeNumber = item.cost_code_number || ''
    let costCodeName = item.cost_code_name || ''
    let costCodeLabel = item.cost_code_label || ''
    
    if (costCodeUuid && (!costCodeNumber || !costCodeName)) {
      const costCodeConfig = costCodeConfigurationsStore.getConfigurationById(costCodeUuid)
      if (costCodeConfig) {
        costCodeNumber = costCodeConfig.cost_code_number || ''
        costCodeName = costCodeConfig.cost_code_name || ''
        costCodeLabel = [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim()
      }
    }
    
    // Get item info
    const itemUuid = item.item_uuid || null
    let itemName = item.item_name || item.name || ''
    let sequence = item.sequence || item.item_sequence || ''
    let modelNumber = item.model_number || ''
    
    if (itemUuid) {
      const preferredItem = coPreferredItemByUuid.value.get(String(itemUuid)) as any
      if (preferredItem) {
        if (!itemName) {
          itemName = preferredItem.item_name || preferredItem.name || ''
        }
        if (!sequence) {
          sequence =
            preferredItem.item_sequence ||
            preferredItem.sequence ||
            coMasterSpecByItemUuid.value.get(String(itemUuid)) ||
            sequence
        }
        if (!modelNumber) {
          modelNumber = preferredItem.model_number || modelNumber
        }
        if (!item.item_type_uuid && preferredItem.item_type_uuid) {
          item.item_type_uuid = preferredItem.item_type_uuid
          item.item_type_label = getItemTypeLabelFromCoHierarchyApi(preferredItem.item_type_uuid)
        }
      }
    }
    
    // Get item type info
    const itemTypeUuid = item.item_type_uuid || null
    let itemTypeLabel = item.item_type_label || ''
    if (itemTypeUuid && !itemTypeLabel) {
      itemTypeLabel = getItemTypeLabelFromCoHierarchyApi(itemTypeUuid)
    }
    
    const newRow = {
      id: itemId,
      name: itemName || '',
      description: item.description || '',
      cost_code_label: costCodeLabel,
      cost_code_number: costCodeNumber,
      cost_code_name: costCodeName,
      cost_code_uuid: costCodeUuid,
      item_type_uuid: itemTypeUuid,
      item_type_label: itemTypeLabel,
      unit_price: 0, // New items don't have original PO values
      quantity: 0,
      total: 0,
      item_uuid: itemUuid,
      model_number: modelNumber,
      sequence: sequence,
      // Category / division / location (for display and persistence)
      category: item.category || '',
      division_name: item.division_name || '',
      item_division_uuid: item.item_division_uuid ?? null,
      location_uuid: item.location_uuid ?? null,
      location_label: item.location_label ?? null,
      unit_uuid: item.unit_uuid ?? item.uom_uuid ?? null,
      unit_label: item.unit_label ?? item.uom ?? item.unit ?? '',
      uom: item.uom ?? item.unit_label ?? item.unit ?? '',
      approval_checks: Array.isArray(item.approval_checks) ? item.approval_checks : [],
      co_unit_price: item.co_unit_price ?? null,
      co_quantity: item.co_quantity ?? null,
      co_total: item.co_total ?? null,
      storage_location_uuid: item.storage_location_uuid ?? null,
      storage_location_label: item.storage_location_label ?? item.storage_location ?? null,
      isNewItem: true, // Mark as new item
    }
    return applyCoLineItemHierarchyFromApi(newRow)
  })
  
  // Combine original items and new items
  return [...originalItemsDisplay, ...newItemsDisplay]
})

const updateCoItemsAt = (index: number, fields: Record<string, any>) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return
  if (props.form?.uuid) {
    coItemsTouchedForExistingCo.value = true
  }
  
  // For new items, find by temp_id or match key
  let existingIndex = -1
  if (base.isNewItem) {
    existingIndex = list.findIndex((it: any) => {
      if (base.id && it.temp_id === base.id) return true
      const itKey = buildCoMatchKey(it)
      const baseKey = buildCoMatchKey(base)
      return itKey && baseKey && itKey === baseKey
    })
  } else {
    // For original items, use match key
    const key = buildCoMatchKey(base)
    existingIndex = list.findIndex((it: any) => buildCoMatchKey(it) === key)
  }
  
  const recordBase = {
    cost_code_uuid: base.cost_code_uuid || null,
    cost_code_label: base.cost_code_label || null,
    cost_code_number: base.cost_code_number || null,
    cost_code_name: base.cost_code_name || null,
    item_uuid: base.item_uuid || null,
    model_number: base.model_number || '',
    name: base.name || '',
    description: base.description || '',
    // Category and division so they are persisted when saving the change order
    category: base.category ?? null,
    division_name: base.division_name ?? null,
    item_division_uuid: base.item_division_uuid ?? null,
    location_uuid: base.location_uuid ?? null,
    location_label: base.location_label ?? base.location ?? null,
    unit_uuid: base.unit_uuid ?? base.uom_uuid ?? null,
    unit_label: base.unit_label ?? base.uom ?? base.unit ?? null,
    unit: base.unit ?? base.unit_label ?? base.uom ?? null,
    // Inherit from merged display row (PO + matched CO) so PO approval_checks_uuids persist without re-selecting in the table
    approval_checks: Array.isArray((base as any).approval_checks) ? [...(base as any).approval_checks] : [],
  }
  
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...recordBase, ...fields }
  } else {
    list.push({ ...recordBase, ...fields })
  }
  updateForm({ co_items: list })
}

const handleCoUnitPriceChange = ({ index, value, numericValue, computedTotal }: { index: number; value: any; numericValue: number; computedTotal: number }) => {
  updateCoItemsAt(index, { co_unit_price: numericValue, co_total: computedTotal })
}

const handleCoQuantityChange = ({ index, value, numericValue, computedTotal }: { index: number; value: any; numericValue: number; computedTotal: number }) => {
  updateCoItemsAt(index, { co_quantity: numericValue, co_total: computedTotal })
}

const handleCoDescriptionChange = ({ index, value }: { index: number; value: string }) => {
  updateCoItemsAt(index, { description: value ?? '' })
}

const handleCoUomChange = (index: number, value: string | null, option?: any) => {
  const raw = option?.uom || option || null
  const label = raw?.label || raw?.name || raw?.uom || raw?.unit || null
  updateCoItemsAt(index, {
    unit_uuid: value || null,
    unit_label: label,
    uom: label,
    unit: label,
  })
}

const handleApprovalChecksChange = ({ index, value }: { index: number; value: string[] }) => {
  updateCoItemsAt(index, { approval_checks: value || [] })
}

const removeCoRow = (index: number) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return
  if (props.form?.uuid) {
    coItemsTouchedForExistingCo.value = true
  }
  console.log('[CO_ROW_DEBUG][removeCoRow:before]', {
    index,
    co_type: props.form?.co_type,
    is_existing: Boolean(props.form?.uuid),
    display_count: coDisplayItems.value.length,
    original_source_count: Array.isArray(originalItems.value) ? originalItems.value.length : 0,
    form_co_count: list.length,
    removed_co_count: Array.isArray((props.form as any)?.removed_co_items) ? (props.form as any).removed_co_items.length : 0,
    is_new_item: Boolean(base.isNewItem),
    selected: {
      key: buildCoMatchKey(base),
      cost_code_uuid: base.cost_code_uuid || null,
      item_uuid: base.item_uuid || null,
      model_number: base.model_number || '',
    },
  })
  
  // If it's a new item (not from original PO), just remove it
  if (base.isNewItem) {
    const filtered = list.filter((it: any) => {
      // Match by temp_id if available, otherwise by match key
      if (base.id && it.temp_id === base.id) return false
      const itKey = buildCoMatchKey(it)
      const baseKey = buildCoMatchKey(base)
      return !itKey || !baseKey || itKey !== baseKey
    })
    console.log('[CO_ROW_DEBUG][removeCoRow:new-item-after-filter]', {
      previous_count: list.length,
      filtered_count: filtered.length,
    })
    updateForm({ co_items: filtered })
    return
  }
  
  // For original items, remove from co_items and add to removed list
  const key = buildCoMatchKey(base)
  const filtered = list.filter((it: any) => buildCoMatchKey(it) !== key)
  // Append to removed list, including totals snapshot for reference
  const matched = (props.form?.co_items || []).find((it: any) => buildCoMatchKey(it) === key) || {}
  const removedSnapshot = {
    cost_code_uuid: base.cost_code_uuid || null,
    item_uuid: base.item_uuid || null,
    model_number: base.model_number || '',
    name: base.name || '',
    description: base.description || '',
    co_unit_price: matched.co_unit_price ?? null,
    co_quantity: matched.co_quantity ?? null,
    co_total: matched.co_total ?? null,
  }
  const updatedRemoved = appendRemovedCoItem(removedSnapshot)
  console.log('[CO_ROW_DEBUG][removeCoRow:original-item-after-filter]', {
    previous_count: list.length,
    filtered_count: filtered.length,
    removed_count_after_append: updatedRemoved.length,
    removed_snapshot_key: buildCoMatchKey(removedSnapshot),
  })
  updateForm({ removed_co_items: updatedRemoved, co_items: filtered })
}

// Add a new row (not from original PO)
const addNewCoRow = () => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const newItem = {
    temp_id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Temporary ID for tracking
    cost_code_uuid: null,
    cost_code_number: '',
    cost_code_name: '',
    cost_code_label: '',
    category: null as string | null,
    item_division_uuid: null as string | null,
    division_name: '',
    item_type_uuid: null,
    item_type_label: '',
    item_uuid: null,
    item_name: '',
    sequence: '',
    model_number: '',
    description: '',
    unit_uuid: null,
    unit_label: '',
    uom: '',
    co_unit_price: null,
    co_quantity: null,
    co_total: null,
    approval_checks: [],
  }
  list.push(newItem)
  updateForm({ co_items: list })
}

// Update cost code for a CO item (original or new)
const updateNewItemCostCode = (index: number, value: string | null, option?: any) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return
  
  // Find the item in the list by temp_id or match key
  const itemIndex = list.findIndex((it: any) => {
    if (base.id && it.temp_id === base.id) return true
    const itKey = buildCoMatchKey(it)
    const baseKey = buildCoMatchKey(base)
    return itKey && baseKey && itKey === baseKey
  })
  if (itemIndex < 0) return
  
  const item = { ...list[itemIndex] }
  item.cost_code_uuid = value || null
  
  if (option) {
    const raw = option.costCode || option
    item.cost_code_number = raw.cost_code_number || ''
    item.cost_code_name = raw.cost_code_name || ''
    item.cost_code_label = [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim()
  }
  
  // Clear item selection when cost code changes
  item.item_uuid = null
  item.item_name = ''
  item.sequence = ''
  item.model_number = ''
  item.item_type_uuid = null
  item.item_type_label = ''
  
  list[itemIndex] = item
  updateForm({ co_items: list })
}

// Update category for a CO item (original or new)
const handleCoCategoryChange = (index: number, value: string | null) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return

  const itemIndex = list.findIndex((it: any) => {
    if (base.id && it.temp_id === base.id) return true
    const itKey = buildCoMatchKey(it)
    const baseKey = buildCoMatchKey(base)
    return itKey && baseKey && itKey === baseKey
  })
  if (itemIndex < 0) return

  const item = { ...list[itemIndex] }
  item.category = value || null
  // When category changes, clear division to avoid inconsistent pairing
  item.item_division_uuid = null
  item.division_name = ''
  item.item_type_uuid = null
  item.item_type_label = ''
  item.item_uuid = null
  item.item_name = ''
  item.sequence = ''
  item.model_number = ''

  list[itemIndex] = item
  updateForm({ co_items: list })
}

// Update item division for a CO item (original or new)
const handleCoItemDivisionChange = (index: number, value: string | null, option?: any) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return

  const itemIndex = list.findIndex((it: any) => {
    if (base.id && it.temp_id === base.id) return true
    const itKey = buildCoMatchKey(it)
    const baseKey = buildCoMatchKey(base)
    return itKey && baseKey && itKey === baseKey
  })
  if (itemIndex < 0) return

  const item = { ...list[itemIndex] }
  item.item_division_uuid = value || null
  if (option) {
    const raw = option.division || option
    item.division_name = raw.division_name || raw.label || ''
  }
  item.item_type_uuid = null
  item.item_type_label = ''
  item.item_uuid = null
  item.item_name = ''
  item.sequence = ''
  item.model_number = ''

  list[itemIndex] = item
  updateForm({ co_items: list })
}

// Update SPEC/sequence for a CO item (reuse item update logic)
const handleCoSequenceChange = (index: number, value: string | null, option?: any) => {
  updateNewItemItem(index, value, option)
}

// Update item type for a CO item (original or new)
const updateNewItemType = (index: number, value: string | null, option?: any) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return
  
  // Find the item in the list by temp_id or match key
  const itemIndex = list.findIndex((it: any) => {
    if (base.id && it.temp_id === base.id) return true
    const itKey = buildCoMatchKey(it)
    const baseKey = buildCoMatchKey(base)
    return itKey && baseKey && itKey === baseKey
  })
  if (itemIndex < 0) return
  
  const item = { ...list[itemIndex] }
  item.item_type_uuid = value || null
  
  if (option) {
    item.item_type_label = option.label || option.item_type || ''
  }
  
  // Clear item when item type changes (cascade)
  item.item_uuid = null
  item.item_name = ''
  item.sequence = ''
  item.model_number = ''
  
  list[itemIndex] = item
  updateForm({ co_items: list })
}

// Update storage location for a CO item (any row – original or new)
const handleStorageLocationChange = (index: number, value: string | null, option?: any) => {
  const locationLabel = option?.label ?? option?.location_name ?? option?.location?.location_name ?? null
  // Use central updater so original rows without an existing co_items entry
  // still get persisted (it will create a row if needed).
  updateCoItemsAt(index, {
    location_uuid: value || null,
    location_label: locationLabel,
    // Keep legacy field for server-side fallback mapping.
    location: locationLabel,
  })
}

// Update item/sequence for a CO item (original or new)
const updateNewItemItem = (index: number, value: string | null, option?: any) => {
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  const base = coDisplayItems.value[index]
  if (!base) return
  
  // Find the item in the list by temp_id or match key
  const itemIndex = list.findIndex((it: any) => {
    if (base.id && it.temp_id === base.id) return true
    const itKey = buildCoMatchKey(it)
    const baseKey = buildCoMatchKey(base)
    return itKey && baseKey && itKey === baseKey
  })
  if (itemIndex < 0) return
  
  const item = { ...list[itemIndex] }
  item.item_uuid = value || null
  
  if (option) {
    const raw = option.raw || option
    item.item_name = raw.item_name || raw.name || raw.label || ''
    // Get sequence from multiple sources
    item.sequence = raw.item_sequence || raw.sequence || ''
    item.item_sequence = item.sequence // Also set item_sequence for consistency
    // If sequence is still not found and we have item_uuid, use API-backed preferred items map
    if (!item.sequence && item.item_uuid) {
      const preferredItem = coPreferredItemByUuid.value.get(String(item.item_uuid)) as any
      if (preferredItem) {
        item.sequence =
          preferredItem.item_sequence ||
          preferredItem.sequence ||
          coMasterSpecByItemUuid.value.get(String(item.item_uuid)) ||
          ''
        item.item_sequence = item.sequence // Also set item_sequence for consistency
      }
    }
    item.model_number = raw.model_number || ''
    item.description = raw.description || item.description || ''
    item.unit_uuid = raw.unit_uuid || raw.uom_uuid || item.unit_uuid || null
    item.unit_label = raw.unit_label || raw.uom || raw.unit || item.unit_label || ''
    item.uom = raw.uom || raw.unit || raw.unit_label || item.uom || item.unit_label || ''
    
    // If item type is not set, try to get it from the item
    if (!item.item_type_uuid && raw.item_type_uuid) {
      item.item_type_uuid = raw.item_type_uuid
      item.item_type_label = raw.item_type_label || raw.item_type || ''
    }
    // Also try to get item type from API preferred items map if item_uuid is available
    if (!item.item_type_uuid && item.item_uuid) {
      const preferredItem = coPreferredItemByUuid.value.get(String(item.item_uuid)) as any
      if (preferredItem?.item_type_uuid) {
        item.item_type_uuid = preferredItem.item_type_uuid
        item.item_type_label = getItemTypeLabelFromCoHierarchyApi(item.item_type_uuid)
      }
    }
  }
  
  list[itemIndex] = item
  updateForm({ co_items: list })
}

// Removed CO items management
const removedCoItemsModalOpen = ref(false)
const removedCoItems = computed(() =>
  Array.isArray((props.form as any)?.removed_co_items)
    ? (props.form as any).removed_co_items
    : []
)
const hasRemovedCoItems = computed(() => removedCoItems.value.length > 0)

const removedLaborCoItems = computed(() =>
  Array.isArray((props.form as any)?.removed_labor_co_items)
    ? (props.form as any).removed_labor_co_items
    : []
)
const hasRemovedLaborCoItems = computed(() => removedLaborCoItems.value.length > 0)

const showRemovedItemsButton = computed(() => {
  if (props.form?.co_type === 'LABOR') return hasRemovedLaborCoItems.value
  return hasRemovedCoItems.value
})

const removedItemsModalCount = computed(() => {
  if (props.form?.co_type === 'LABOR') return removedLaborCoItems.value.length
  return removedCoItems.value.length
})

const openRemovedCoItemsModal = () => {
  removedCoItemsModalOpen.value = true
}

const closeRemovedCoItemsModal = () => {
  removedCoItemsModalOpen.value = false
}

const cloneCoItem = (item: any) => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(item)
    } catch {
      // fall through
    }
  }
  try {
    return JSON.parse(JSON.stringify(item ?? {}))
  } catch {
    return item
  }
}

const appendRemovedCoItem = (item: any) => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_co_items)
    ? [...(props.form as any).removed_co_items]
    : []
  const cloned = cloneCoItem(item)
  cloned.removed_at = new Date().toISOString()
  currentRemoved.push(cloned)
  return currentRemoved
}

const restoreRemovedCoItem = (index: number) => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_co_items)
    ? [...(props.form as any).removed_co_items]
    : []
  if (!currentRemoved.length) return
  const targetIndex = Math.min(Math.max(index, 0), currentRemoved.length - 1)
  const [restored] = currentRemoved.splice(targetIndex, 1)
  if (!restored) return
  const sanitized = cloneCoItem(restored)
  delete sanitized.removed_at
  // Merge back into co_items
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  // Ensure the restored line has matching base identifiers
  const base = {
    cost_code_uuid: sanitized.cost_code_uuid || null,
    item_uuid: sanitized.item_uuid || null,
    model_number: sanitized.model_number || '',
    name: sanitized.name || '',
    description: sanitized.description || '',
    co_unit_price: sanitized.co_unit_price ?? null,
    co_quantity: sanitized.co_quantity ?? null,
    co_total: sanitized.co_total ?? null,
  }
  list.push(base)
  updateForm({ removed_co_items: currentRemoved, co_items: list })
}

const restoreAllRemovedCoItems = () => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_co_items)
    ? [...(props.form as any).removed_co_items]
    : []
  if (!currentRemoved.length) return
  const list = Array.isArray(props.form?.co_items) ? [...props.form.co_items] : []
  currentRemoved.forEach((it: any) => {
    const sanitized = cloneCoItem(it)
    delete sanitized.removed_at
    const base = {
      cost_code_uuid: sanitized.cost_code_uuid || null,
      item_uuid: sanitized.item_uuid || null,
      model_number: sanitized.model_number || '',
      name: sanitized.name || '',
      description: sanitized.description || '',
      co_unit_price: sanitized.co_unit_price ?? null,
      co_quantity: sanitized.co_quantity ?? null,
      co_total: sanitized.co_total ?? null,
    }
    list.push(base)
  })
  updateForm({ removed_co_items: [], co_items: list })
  closeRemovedCoItemsModal()
}

const restoreRemovedLaborCoItem = (index: number) => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_labor_co_items)
    ? [...(props.form as any).removed_labor_co_items]
    : []
  if (!currentRemoved.length) return
  const targetIndex = Math.min(Math.max(index, 0), currentRemoved.length - 1)
  const [restored] = currentRemoved.splice(targetIndex, 1)
  if (!restored) return

  const sanitized = cloneCoItem(restored)
  delete sanitized.removed_at
  const restoreKey = buildLaborMatchKey(sanitized)

  const list = Array.isArray((props.form as any)?.labor_co_items)
    ? [...(props.form as any).labor_co_items]
    : []
  if (restoreKey && !list.some((it: any) => buildLaborMatchKey(it) === restoreKey)) {
    list.push(toLaborCoItemRecord(sanitized, list.length, sanitized))
  }

  if (props.form?.uuid) {
    laborItemsHydratedForExistingCo.value = true
  }

  updateForm({ removed_labor_co_items: currentRemoved, labor_co_items: list })
}

const restoreAllRemovedLaborCoItems = () => {
  const currentRemoved = Array.isArray((props.form as any)?.removed_labor_co_items)
    ? [...(props.form as any).removed_labor_co_items]
    : []
  if (!currentRemoved.length) return

  const list = Array.isArray((props.form as any)?.labor_co_items)
    ? [...(props.form as any).labor_co_items]
    : []
  const existingKeys = new Set(list.map((it: any) => buildLaborMatchKey(it)).filter(Boolean))

  currentRemoved.forEach((it: any) => {
    const sanitized = cloneCoItem(it)
    delete sanitized.removed_at
    const key = buildLaborMatchKey(sanitized)
    if (key && !existingKeys.has(key)) {
      list.push(toLaborCoItemRecord(sanitized, list.length, sanitized))
      existingKeys.add(key)
    }
  })

  if (props.form?.uuid) {
    laborItemsHydratedForExistingCo.value = true
  }

  updateForm({ removed_labor_co_items: [], labor_co_items: list })
  closeRemovedCoItemsModal()
}

const syncRemovedCoItemsWithCurrent = (items: any[]) => {
  const existingRemoved = Array.isArray((props.form as any)?.removed_co_items)
    ? (props.form as any).removed_co_items
    : []
  if (!existingRemoved.length) return
  const currentKeys = new Set<string>()
  items.forEach((item: any) => {
    currentKeys.add(buildCoMatchKey(item))
  })
  const filtered = existingRemoved.filter((it: any) => !currentKeys.has(buildCoMatchKey(it)))
  if (filtered.length !== existingRemoved.length) {
    updateForm({ removed_co_items: filtered })
  }
}

// (reassignment removed; logic handled in removeCoRow)

// Compute CO item total from co_items (Material) or labor_co_items (Labor)
const coItemTotal = computed(() => {
  const toNum = (v: any) => {
    if (v === null || v === undefined || v === '') return 0
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0
    const n = Number(String(v).replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : 0
  }
  const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100
  
  // For Labor CO, calculate from labor_co_items
  if (props.form?.co_type === 'LABOR') {
    // For existing CO, prefer saved items from store (they have the actual saved co_amount values)
    // For new CO, use form items
    let laborItems: any[] = []
    
    if (props.form?.uuid) {
      // When editing existing CO, use saved items from store as primary source
      // Access store items directly for reactivity - accessing items.value ensures reactivity
      const allStoreItems = laborChangeOrderItemsStore.items
      const savedItems = allStoreItems.filter(item => 
        item.change_order_uuid === props.form.uuid && item.is_active !== false
      )
      const formItems = Array.isArray((props.form as any)?.labor_co_items) ? (props.form as any).labor_co_items : []
      
      // If we have saved items, use them as the base (they have the actual saved co_amount values)
      if (savedItems.length > 0) {
        // Create a map starting with saved items (they have the actual saved values)
        const itemsMap = new Map<string, any>()
        savedItems.forEach((item: any) => {
          const code = String(item?.cost_code_uuid || '')
          const loc = String(item?.location_uuid || '')
          const key = code ? `${code}::${loc}` : ''
          if (key) itemsMap.set(key, item)
        })

        // Override with form items if they exist and have co_amount (for unsaved changes)
        formItems.forEach((item: any) => {
          const code = String(item?.cost_code_uuid || '')
          const loc = String(item?.location_uuid || '')
          const key = code ? `${code}::${loc}` : ''
          if (key && item?.co_amount !== null && item?.co_amount !== undefined) {
            itemsMap.set(key, item)
          }
        })
        
        laborItems = Array.from(itemsMap.values())
      } else {
        // Fallback to form items if no saved items yet
        laborItems = formItems
      }
    } else {
      // For new CO, just use form items
      laborItems = Array.isArray((props.form as any)?.labor_co_items) ? (props.form as any).labor_co_items : []
    }
    
    const total = laborItems.reduce((sum: number, item: any) => {
      const coAmount = toNum(item?.co_amount)
      return sum + (Number.isFinite(coAmount) ? coAmount : 0)
    }, 0)
    return round2(total)
  }
  
  // For Material CO, calculate from co_items (co_unit_price * co_quantity or co_total)
  const items = Array.isArray(props.form?.co_items) ? props.form.co_items : []
  const itemWiseTotal = items.reduce((sum: number, item: any) => {
    const unit = toNum(item?.co_unit_price)
    const qty = toNum(item?.co_quantity)
    const line =
      (unit || qty) ? unit * qty : toNum(item?.co_total)
    return sum + (Number.isFinite(line) ? line : 0)
  }, 0)

  // Add location-wise material CO amounts
  const lwmItems = Array.isArray((props.form as any)?.co_location_wise_material_items)
    ? (props.form as any).co_location_wise_material_items
    : []
  const lwmTotal = lwmItems.reduce((sum: number, item: any) => {
    const coAmount = toNum(item?.co_amount)
    return sum + (Number.isFinite(coAmount) ? coAmount : 0)
  }, 0)

  return round2(itemWiseTotal + lwmTotal)
})

// Prefill charges/taxes (percentages and taxable flags) from the original PO when selected
const prefillFinancialsFromOriginalOrder = () => {
  const poUuid = String(props.form?.original_purchase_order_uuid || '')
  if (!poUuid) return
  const po = (purchaseOrdersStore.purchaseOrders || []).find((p: any) => String(p.uuid) === poUuid)
  if (!po) return
  const fieldsToCopy = [
    'credit_days',
    'credit_days_id',
    'freight_charges_percentage',
    'freight_charges_taxable',
    'packing_charges_percentage',
    'packing_charges_taxable',
    'custom_duties_charges_percentage',
    'custom_duties_charges_taxable',
    'other_charges_percentage',
    'other_charges_taxable',
    'sales_tax_1_percentage',
    'sales_tax_2_percentage',
  ]
  const updates: Record<string, any> = {}
  fieldsToCopy.forEach((key) => {
    const current: any = props.form as any
    const poAny: any = po as any
    if (current[key] === undefined || current[key] === null || current[key] === '') {
      if (poAny[key] !== undefined) {
        updates[key] = poAny[key]
      }
    }
  })
  CURRENCY_PREFILL_FIELDS.forEach((key) => {
    const current: any = props.form as any
    const poAny: any = po as any
    if (isCoCurrencyFieldEmpty(current[key]) && poAny[key] !== undefined && poAny[key] !== null && poAny[key] !== '') {
      updates[key] = poAny[key]
    }
  })
  if (Object.keys(updates).length > 0) {
    updateForm(updates)
    queueMicrotask(() => ensureCoCurrencyFieldsSynced())
  }
}

// When editing an existing change order that has financial_breakdown JSON,
// populate the percentage fields so FinancialBreakdown can calculate amounts.
watch(
  () => (props.form as any)?.financial_breakdown ?? (props.form as any)?.financialBreakdown,
  () => {
    applyFinancialBreakdownFromField()
  },
  { immediate: true }
)

// Trigger prefill when original order changes (after items load as well)
watch(() => props.form.original_purchase_order_uuid, () => {
  coItemsTouchedForExistingCo.value = false
  prefillFinancialsFromOriginalOrder()
})

watch([() => props.form.uuid, () => props.form.co_type], () => {
  coItemsTouchedForExistingCo.value = false
})

// Handle updates from FinancialBreakdown
const handleFinancialUpdate = (updates: Record<string, any>) => {
  updateForm(updates)
}

const CO_FREIGHT_SHIP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const shipViaSelectModelValue = computed(() => {
  if (props.form.ship_via_uuid) return String(props.form.ship_via_uuid)
  if (props.form.ship_via && String(props.form.ship_via).trim() !== '') return String(props.form.ship_via).trim()
  return ''
})

const freightSelectModelValue = computed(() => {
  if (props.form.freight_uuid) return String(props.form.freight_uuid)
  if (props.form.freight && String(props.form.freight).trim() !== '') return String(props.form.freight).trim()
  return ''
})

async function onShipViaModelUpdate(val: string | undefined) {
  if (val == null || val === '') {
    updateForm({ ship_via_uuid: null, ship_via: '' })
    return
  }
  if (CO_FREIGHT_SHIP_UUID_RE.test(val)) {
    let rec = shipViaStore.getShipViaByUuid?.(String(val))
    if (!rec && nimbleFreightShipViaStrictApi.value) {
      await shipViaStore.fetchShipVia(true).catch(() => {})
      rec = shipViaStore.getShipViaByUuid?.(String(val))
    }
    updateForm({ ship_via_uuid: val, ship_via: rec?.ship_via || '' })
  } else {
    updateForm({ ship_via: val, ship_via_uuid: null })
  }
}

async function onFreightModelUpdate(val: string | undefined) {
  if (val == null || val === '') {
    updateForm({ freight_uuid: null, freight: '' })
    return
  }
  if (CO_FREIGHT_SHIP_UUID_RE.test(val)) {
    let rec = freightStore.getFreightByUuid?.(String(val))
    if (!rec && nimbleFreightShipViaStrictApi.value) {
      await freightStore.fetchFreight(true).catch(() => {})
      rec = freightStore.getFreightByUuid?.(String(val))
    }
    updateForm({ freight_uuid: val, freight: rec?.ship_via || '' })
  } else {
    updateForm({ freight: val, freight_uuid: null })
  }
}

const reasonDisplayValue = computed(() => {
  // Prioritize reason_uuid (new approach)
  if (props.form.reason_uuid) {
    return props.form.reason_uuid
  }
  // Fallback to reason text (backward compatibility)
  if (props.form.reason && String(props.form.reason).trim() !== '') {
    // Try to find matching UUID by reason text
    const reason = reasonsStore.getAllReasons.find(r => r.reason === props.form.reason)
    return reason?.uuid || props.form.reason
  }
  return ''
})

// Keep removed list in sync when co_items changes
watch(() => props.form.co_items, (newItems, oldItems) => {
  if (newItems !== oldItems && Array.isArray(newItems)) {
    console.log('[CO_ROW_DEBUG][watch:co_items-changed]', {
      new_count: newItems.length,
      old_count: Array.isArray(oldItems) ? oldItems.length : 0,
      removed_count: Array.isArray((props.form as any)?.removed_co_items) ? (props.form as any).removed_co_items.length : 0,
      display_count: coDisplayItems.value.length,
      source_count: Array.isArray(originalItems.value) ? originalItems.value.length : 0,
    })
    syncRemovedCoItemsWithCurrent(newItems)
    // force coItemTotal reactivity
    const _ = coItemTotal.value
  }
}, { deep: true })

// File preview functionality
const showFilePreviewModal = ref(false)
const selectedFileForPreview = ref<any>(null)

// File upload functionality
const uploadedFiles = ref<File[]>([])
const fileUploadError = ref<string | null>(null)
const isUploading = ref(false)

// Computed properties for attachments
const fileUploadErrorMessage = computed(() => fileUploadError.value)
const totalAttachmentCount = computed(() =>
  Array.isArray(props.form.attachments) ? props.form.attachments.length : 0
)
const uploadedAttachmentCount = computed(() =>
  Array.isArray(props.form.attachments)
    ? props.form.attachments.filter((att: any) => att?.uuid || att?.isUploaded).length
    : 0
)

const handleFileUpload = async () => {
  fileUploadError.value = null
  if (uploadedFiles.value.length === 0) return
  if (isUploading.value) return

  const allowedTypes = ['application/pdf']
  const maxSize = 10 * 1024 * 1024

  for (const file of uploadedFiles.value) {
    if (!allowedTypes.includes(file.type)) {
      fileUploadError.value = 'Invalid file type. Only PDF files are allowed.'
      return
    }
    if (file.size > maxSize) {
      fileUploadError.value = 'File size too large. Maximum size is 10MB per file.'
      return
    }
  }

  isUploading.value = true
  try {
    const pendingAttachments = await Promise.all(
      uploadedFiles.value.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const fileData = e.target?.result
              if (typeof fileData !== 'string') {
                reject(new Error('Failed to read file'))
                return
              }
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                fileData,
                tempId: Date.now() + Math.random().toString(36).substring(2)
              })
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })
      )
    )

    // If editing an existing change order, upload directly to server
    if (props.form.uuid) {
      try {
        const response = await $fetch<{
          attachments: any[]
          errors?: Array<{ fileName: string; error: string }>
        }>('/api/change-orders/documents/upload', {
          method: 'POST',
          body: {
            change_order_uuid: props.form.uuid,
            files: pendingAttachments.map((file: any) => ({
              name: file.name,
              type: file.type,
              size: file.size,
              fileData: file.fileData,
            })),
          },
        })

        updateForm({ attachments: response?.attachments ?? [] })
        uploadedFiles.value = []

        if (response?.errors?.length) {
          fileUploadError.value = response.errors
            .map((err) => err.error)
            .join(', ')
        } else {
          fileUploadError.value = null
        }
      } catch (error) {
        fileUploadError.value = 'Failed to upload files. Please try again.'
      }
      return
    }

    // For new change orders, add to form state
    const allAttachments = [
      ...(props.form.attachments || []),
      ...pendingAttachments.map((file: any) => ({
        ...file,
        isUploaded: false
      }))
    ]
    updateForm({ attachments: allAttachments })
    uploadedFiles.value = []
  } catch (error) {
    console.error('Error processing files:', error)
    fileUploadError.value = 'Failed to process files. Please try again.'
  } finally {
    isUploading.value = false
  }
}

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
  }
  showFilePreviewModal.value = true
}

const closeFilePreview = () => {
  showFilePreviewModal.value = false
  selectedFileForPreview.value = null
}

const removeFile = async (index: number) => {
  const attachment = props.form.attachments[index]

  if (!attachment) return

  // If editing an existing change order and attachment has UUID, delete directly from server
  if (attachment?.uuid && props.form.uuid) {
    try {
      const response = await $fetch<{
        attachments: any[]
      }>('/api/change-orders/documents/remove', {
        method: 'POST',
        body: {
          change_order_uuid: props.form.uuid,
          attachment_uuid: attachment.uuid,
        },
      })

      updateForm({ attachments: response?.attachments ?? [] })
      return
    } catch (error) {
      fileUploadError.value = 'Failed to delete file. Please try again.'
      return
    }
  }

  // For new change orders or temporary attachments, remove from form state
  const updatedAttachments = Array.isArray(props.form.attachments) ? [...props.form.attachments] : []
  updatedAttachments.splice(index, 1)
  updateForm({ attachments: updatedAttachments })

  // Also remove from uploadedFiles if it's a temporary file
  if (attachment?.tempId) {
    const fileIndex = uploadedFiles.value.findIndex(
      (file) => file.name === attachment.name
    )
    if (fileIndex !== -1) {
      uploadedFiles.value.splice(fileIndex, 1)
    }
  }
}

watch(() => uploadedFiles.value, () => {
  handleFileUpload()
}, { deep: true })

const creditDaysModel = computed({
  get() {
    return {
      credit_days: props.form.credit_days ?? null,
      credit_days_id: (props.form as any).credit_days_id ?? null,
    };
  },
  set(v: { credit_days: string | null; credit_days_id: string | null }) {
    updateForm({
      credit_days: v.credit_days ?? '',
      credit_days_id: v.credit_days_id ?? null,
    });
  },
});

const calculateEstimatedDeliveryDate = (
  createdDate: CalendarDate | null,
  creditDays: string | null,
  creditDaysId?: string | null
) => {
  if (!createdDate || !creditDays) return null;
  const days = resolveCreditDaysToDayCount(creditDays, creditDaysId);
  if (typeof days !== 'number') return null;
  return createdDate.add({ days });
};

// CO Type
const coTypeOptions = [
  { label: 'Labor', value: 'LABOR' },
  { label: 'Material', value: 'MATERIAL' },
]
const coTypeOption = computed<any>({
  get: () => {
    const v = props.form.co_type
    if (!v) return undefined
    const target = String(v).toUpperCase()
    return coTypeOptions.find(opt => String(opt.value).toUpperCase() === target)
  },
  set: (val) => {
    const value = typeof val === 'string' ? val : (val?.value || '')
    updateForm({ co_type: value })
  }
})

// Ensure addresses are fetched and shipping address is set when editing/pre-filled
watch(() => props.form.project_uuid, async (newProjectUuid) => {
  if (!newProjectUuid) {
    coScopedLocations.value = []
    return
  }
  try {
    await projectAddressesStore.fetchAddresses(String(newProjectUuid))
    await refreshCoScopedLocations(String(newProjectUuid))
    const addresses = projectAddressesStore.getAddresses(String(newProjectUuid)) as any[] | undefined
    const shippingList = Array.isArray(addresses)
      ? addresses.filter(
          (a: any) => a.is_active !== false && a.address_type === 'shipment'
        )
      : []
    const currentUuid = String(props.form.shipping_address_uuid || '').trim()
    const stillValid =
      Boolean(currentUuid) &&
      shippingList.some((a: any) => String(a.uuid) === currentUuid)
    if (!stillValid) {
      const primary =
        shippingList.find((a: any) => a.is_primary) || shippingList[0] || null
      updateForm({ shipping_address_uuid: primary?.uuid ?? '' })
    }
  } catch (e) {
    // no-op
  }
}, { immediate: true })

// Watch for created date and credit days changes to auto-calculate estimated delivery date
watch(
  [() => createdDateValue.value, () => props.form.credit_days, () => (props.form as any).credit_days_id],
  (
    [newCreatedDate, newCreditDays, newCreditDaysId],
    [oldCreatedDate, oldCreditDays, oldCreditDaysId]
  ) => {
    // Skip if we're already updating to prevent recursive updates
    if (isUpdatingEstimatedDeliveryDate.value) {
      return;
    }
    
    // Only auto-calculate if both created date and credit days are set
    if (newCreatedDate && newCreditDays) {
      // Check if estimated delivery date was manually set (different from calculated)
      const calculatedEstimatedDeliveryDate = calculateEstimatedDeliveryDate(
        newCreatedDate,
        newCreditDays,
        newCreditDaysId
      );
      if (calculatedEstimatedDeliveryDate) {
        // Calculate the new estimated delivery date string
        const newEstimatedDeliveryDateString = `${calculatedEstimatedDeliveryDate.year}-${String(calculatedEstimatedDeliveryDate.month).padStart(2, '0')}-${String(calculatedEstimatedDeliveryDate.day).padStart(2, '0')}`;
        const newEstimatedDeliveryDateUTC = toUTCString(newEstimatedDeliveryDateString);
        
        // Get current estimated delivery date from form (avoid reading computed property to prevent recursion)
        const currentEstimatedDeliveryDateUTC = props.form.estimated_delivery_date;
        
        // Calculate old estimated delivery date if we had both old values
        let oldCalculatedEstimatedDeliveryDateUTC: string | null = null;
        if (oldCreatedDate && oldCreditDays) {
          const oldCalculated = calculateEstimatedDeliveryDate(
            oldCreatedDate,
            oldCreditDays,
            oldCreditDaysId
          );
          if (oldCalculated) {
            const oldDateString = `${oldCalculated.year}-${String(oldCalculated.month).padStart(2, '0')}-${String(oldCalculated.day).padStart(2, '0')}`;
            oldCalculatedEstimatedDeliveryDateUTC = toUTCString(oldDateString);
          }
        }
        
        // Check if created date changed (by comparing the date strings)
        const createdDateChanged = oldCreatedDate && newCreatedDate && 
          (oldCreatedDate.year !== newCreatedDate.year || 
           oldCreatedDate.month !== newCreatedDate.month || 
           oldCreatedDate.day !== newCreatedDate.day);
        
        // Check if credit days changed (handle empty/null/undefined cases)
        const creditDaysChanged =
          String(oldCreditDays || '') !== String(newCreditDays || '') ||
          String(oldCreditDaysId || '') !== String(newCreditDaysId || '');
        
        // Update if:
        // 1. Estimated delivery date is empty/null, OR
        // 2. Created date changed (always recalculate when created date changes), OR
        // 3. Credit days changed (always recalculate when credit days changes), OR
        // 4. Current estimated delivery date matches the old calculated value (meaning it was auto-calculated, not manually set)
        const shouldUpdate = !currentEstimatedDeliveryDateUTC || 
                            createdDateChanged ||
                            creditDaysChanged ||
                            (oldCalculatedEstimatedDeliveryDateUTC && currentEstimatedDeliveryDateUTC === oldCalculatedEstimatedDeliveryDateUTC);
        
        // Only update if the new value is different from current
        if (shouldUpdate && currentEstimatedDeliveryDateUTC !== newEstimatedDeliveryDateUTC) {
          isUpdatingEstimatedDeliveryDate.value = true;
          try {
            updateForm({ estimated_delivery_date: newEstimatedDeliveryDateUTC });
          } finally {
            // Reset flag after a short delay to allow the update to complete
            nextTick(() => {
              isUpdatingEstimatedDeliveryDate.value = false;
            });
          }
        }
      }
    } else if (!newCreatedDate || !newCreditDays) {
      // If either created date or credit days is cleared, clear estimated delivery date only if it was auto-calculated
      // We can't easily determine if it was manually set, so we'll leave it as is to avoid clearing user input
    }
  },
  { flush: 'post', immediate: true }
);

watch(
  [() => props.form.corporation_uuid, () => nimbleSession.token, () => runtimeConfig.public.nimbleIntegrations],
  async () => {
    await refreshCreditDaysOptions();
  },
  { immediate: true }
);

// Exposed for tests (e.g. API-driven category / item division resolution on coDisplayItems)
defineExpose({
  coDisplayItems,
  addNewCoRow,
  handleCoCategoryChange,
  handleCoItemDivisionChange,
})
</script>


