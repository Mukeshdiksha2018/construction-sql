<template>
  <div>
    <!-- Status Stat Cards with Add New Button -->
    <div v-if="isReady && !loading" class="flex items-center gap-4 mb-4">
      <div class="flex flex-row flex-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <!-- Summary Section (Highlighted) -->
      <div
        @click="clearStatusFilter()"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === null 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Summary ({{ allStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(allStats.totalValue) }}
          </div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
      
      <!-- Shipment Section -->
      <div
        @click="toggleStatusFilter('Shipment')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Shipment'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Shipment ({{ shipmentStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(shipmentStats.totalValue) }}
          </div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
      
      <!-- Received Section -->
      <div
        @click="toggleStatusFilter('Received')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Received'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Received ({{ receivedStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(receivedStats.totalValue) }}
          </div>
        </div>
      </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Filter Button -->
        <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filter Receipt Notes" description="Apply filters to narrow down the receipt notes list.">
          <UButton
            icon="i-heroicons-funnel-solid"
            color="neutral"
            variant="solid"
            size="xs"
          >
            Advanced
          </UButton>

          <template #body>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Corporation</label>
                <CorporationSelect
                  v-model="filterCorporation"
                  placeholder="All Corporations"
                  size="sm"
                  class="w-full"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Project</label>
                <ProjectSelect
                  v-model="filterProject"
                  :corporation-uuid="filterCorporation || undefined"
                  placeholder="All Projects"
                  size="sm"
                  class="w-full"
                  :disabled="!filterCorporation"
                  :include-all-option="true"
                  all-option-label="All Projects"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                <VendorSelect
                  v-model="filterVendor"
                  :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
                  placeholder="All Vendors"
                  size="sm"
                  class="w-full"
                  :disabled="!filterCorporation && !selectedCorporationId"
                  :include-all-option="true"
                  all-option-label="All Vendors"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Location</label>
                <LocationSelect
                  v-model="filterLocation"
                  placeholder="All Locations"
                  size="sm"
                  class-name="w-full"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Category</label>
                <ItemCategorySelect
                  v-model="filterCategory"
                  placeholder="All Categories"
                  size="sm"
                  class-name="w-full"
                  :disabled="!filterCorporation && !selectedCorporationId"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Division</label>
                <ItemDivisionSelect
                  v-model="filterDivision"
                  :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
                  :category="filterCategory || ''"
                  placeholder="All Divisions"
                  size="sm"
                  class-name="w-full"
                  :disabled="!filterCorporation && !selectedCorporationId"
                  :show-add-button="false"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Type</label>
                <ItemTypeSelect
                  v-model="filterItemType"
                  :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
                  :project-uuid="filterProject || undefined"
                  :category="filterCategory || undefined"
                  :item-division-uuid="filterDivision || undefined"
                  placeholder="All Types"
                  size="sm"
                  class-name="w-full"
                  :disabled="!filterCorporation"
                  variant="outline"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Date From</label>
                <UPopover v-model:open="drawerPopoverFilterDateFromOpen">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-heroicons-calendar-days"
                    class="w-full justify-start"
                    size="sm"
                  >
                    {{ filterDateFromDisplayText }}
                  </UButton>
                  <template #content>
                    <UCalendar
                      v-model="filterDateFromCalendarValue"
                      class="p-2"
                      :max-value="filterDateToCalendarBound"
                      @update:model-value="drawerPopoverFilterDateFromOpen = false"
                    />
                  </template>
                </UPopover>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Date To</label>
                <UPopover v-model:open="drawerPopoverFilterDateToOpen">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-heroicons-calendar-days"
                    class="w-full justify-start"
                    size="sm"
                  >
                    {{ filterDateToDisplayText }}
                  </UButton>
                  <template #content>
                    <UCalendar
                      v-model="filterDateToCalendarValue"
                      class="p-2"
                      :min-value="filterDateFromCalendarBound"
                      @update:model-value="drawerPopoverFilterDateToOpen = false"
                    />
                  </template>
                </UPopover>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="flex items-center justify-end gap-2">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                @click="handleClearDrawerFilters"
              >
                Clear All
              </UButton>
              <UButton
                color="primary"
                size="sm"
                @click="handleApplyDrawerFilters"
              >
                Apply Filters
              </UButton>
            </div>
          </template>
        </UDrawer>

        <!-- Add New Button -->
        <UButton
          v-if="hasPermission('po_create')"
          icon="i-heroicons-plus"
          color="primary"
          size="xs"
          @click="openCreateModal"
        >
          Add new Receipt Note
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="isReady && !loading" class="mb-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <!-- Filters Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1 items-end">
          <!-- Project Filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Project</label>
            <ProjectSelect
              v-model="filterProject"
              :corporation-uuid="filterCorporation || undefined"
              placeholder="All Projects"
              size="sm"
              class="w-full"
              :disabled="!filterCorporation"
              :include-all-option="true"
              all-option-label="All Projects"
            />
          </div>

          <!-- Vendor Filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Vendor</label>
            <VendorSelect
              v-model="filterVendor"
              :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
              placeholder="All Vendors"
              size="sm"
              class="w-full"
              :disabled="!filterCorporation && !selectedCorporationId"
              :include-all-option="true"
              all-option-label="All Vendors"
            />
          </div>

          <!-- Location Filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Location</label>
            <LocationSelect
              v-model="filterLocation"
              placeholder="All Locations"
              size="sm"
              class-name="w-full"
              :include-all-option="true"
              all-option-label="All"
            />
          </div>

          <div class="flex flex-col gap-1.5 min-w-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Date From</label>
            <UPopover v-model:open="inlinePopoverFilterDateFromOpen">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar-days"
                class="w-full min-w-0 justify-start"
                size="sm"
              >
                {{ filterDateFromDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="filterDateFromCalendarValue"
                  class="p-2"
                  :max-value="filterDateToCalendarBound"
                  @update:model-value="inlinePopoverFilterDateFromOpen = false"
                />
              </template>
            </UPopover>
          </div>

          <div class="flex flex-col gap-1.5 min-w-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Date To</label>
            <UPopover v-model:open="inlinePopoverFilterDateToOpen">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar-days"
                class="w-full min-w-0 justify-start"
                size="sm"
              >
                {{ filterDateToDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="filterDateToCalendarValue"
                  class="p-2"
                  :min-value="filterDateFromCalendarBound"
                  @update:model-value="inlinePopoverFilterDateToOpen = false"
                />
              </template>
            </UPopover>
          </div>
        </div>

        <!-- Show and Clear Buttons - Stacked -->
        <div class="flex-shrink-0 flex flex-col gap-2">
          <UButton
            color="primary"
            size="sm"
            @click="handleShowResults"
          >
            Show
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="handleClearFilters"
          >
            Clear
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <div class="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-9 gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600">
            <USkeleton v-for="n in 9" :key="`header-${n}`" class="h-4 w-20" />
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 6" :key="`row-${i}`" class="grid grid-cols-9 gap-4 px-2 py-2">
            <USkeleton v-for="n in 9" :key="`row-${i}-${n}`" class="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
        description="Please try refreshing the page or contact support if the issue persists."
      />
    </div>

    <div
      v-else-if="hasPermission('po_view') && groupedOrderData.length > 0 && isReady"
    >
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:expanded="expanded"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="groupedOrderData"
        :columns="columns"
        class="max-h-[70vh] overflow-auto"
      >
        <template #expanded="{ row }">
          <ReceiptNotesExpanded 
            :receipt-notes="row.original.receiptNotes" 
            :order-type="row.original.orderType"
            @view="previewReceiptNote"
            @edit="editReceiptNote"
            @delete="deleteReceiptNote"
          />
        </template>
      </UTable>

      <div
        v-if="shouldShowPagination(groupedOrderData.length).value"
        class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <USelect
            v-model="pagination.pageSize"
            :items="pageSizeOptions"
            icon="i-heroicons-list-bullet"
            size="sm"
            variant="outline"
            class="w-32"
            @change="handlePageSizeChange"
          />
        </div>
        <UPagination v-bind="getPaginationProps(table)" />
        <div class="text-sm text-gray-600">
          {{ getPageInfo(table, 'orders').value }}
        </div>
      </div>
    </div>

    <div
      v-else-if="!hasPermission('po_view') && isReady"
      class="text-center py-12"
    >
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">Access Denied</p>
      <p class="text-gray-400 text-sm">
        You don't have permission to view receipt notes
      </p>
    </div>

    <div v-else-if="isReady && groupedOrderData.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-document" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">No purchase orders or change orders with receipt notes found</p>
      <p class="text-gray-400 text-sm mb-6">
        Click add new to create your first receipt note
      </p>
      <UButton
        v-if="hasPermission('po_create')"
        icon="i-heroicons-plus"
        @click="openCreateModal"
      >
        Add Receipt Note
      </UButton>
    </div>

    <UModal v-model:open="showDeleteModal" title="Delete Receipt Note">
      <template #body>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-8 h-8 text-red-500"
            />
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Delete Receipt Note
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div v-if="receiptNoteToDelete" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <span class="block">
                <strong>GRN Number:</strong>
                {{ receiptNoteToDelete.grn_number }}
              </span>
              <span class="block">
                <strong>Entry Date:</strong>
                {{ formatDate(receiptNoteToDelete.entry_date) }}
              </span>
              <span class="block">
                <strong>Status:</strong>
                {{ receiptNoteToDelete.status }}
              </span>
              <span class="block">
                <strong>Total Received:</strong>
                {{ formatCurrency(receiptNoteToDelete.total_received_amount || 0) }}
              </span>
            </p>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this receipt note? The associated
            data will be removed.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton color="error" @click="confirmDelete">
            Delete Receipt Note
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showFormModal"
      :title="formModalTitle"
      fullscreen
      scrollable
      :ui="receiptNoteModalUi"
    >
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formModalTitle }}
          </h3>

          <div class="flex items-center gap-2 flex-1 justify-end">
            <div class="flex items-center gap-2">
              <UButton
                v-if="isViewMode && canEdit"
                type="button"
                color="primary"
                icon="tdesign:edit-filled"
                size="sm"
                @click="switchToEditMode"
              >
                Edit Receipt Note
              </UButton>
              
              <UButton
                v-if="!isViewMode && canEdit && !receiptNoteForm?.uuid"
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                :loading="savingReceiptNote"
                :disabled="savingReceiptNote || hasFormValidationError"
                @click="handleSaveAndNew"
              >
                Save & New
              </UButton>
              <UButton
                v-if="!isViewMode && canEdit"
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                :loading="savingReceiptNote"
                :disabled="savingReceiptNote || hasFormValidationError"
                @click="handleSaveAndClose"
              >
                {{ receiptNoteForm?.uuid ? "Update" : "Save & Close" }}
              </UButton>
            </div>

            <UTooltip text="Close Modal" color="neutral">
              <UButton
                color="neutral"
                variant="solid"
                icon="i-heroicons-x-mark"
                size="sm"
                @click="closeFormModal"
              />
            </UTooltip>
          </div>
        </div>
      </template>
      <template #body>
        <ReceiptNoteForm
          ref="receiptNoteFormRef"
          v-if="showFormModal"
          v-model:form="receiptNoteForm"
          :editing-receipt-note="Boolean(receiptNoteForm?.uuid)"
          :readonly="isViewMode"
        />
      </template>
    </UModal>

    <!-- Shortfall Quantity Confirmation Modal -->
    <UModal v-model:open="showShortfallModal" title="Items with Shortfall Quantities">
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Items with Shortfall Quantities
          </h3>
          <UTooltip text="Close Modal" color="neutral">
            <UButton
              color="neutral"
              variant="solid"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="closeShortfallModal"
            />
          </UTooltip>
        </div>
      </template>
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-warning-500 mr-3" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Some items have received quantities that are less than the ordered quantities.
            </p>
          </div>

          <div v-if="shortfallItemsForModal.length" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div class="space-y-2">
              <div
                v-for="(item, index) in shortfallItemsForModal"
                :key="index"
                class="text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0"
              >
                <div class="font-medium">{{ item.item_name || item.description || `Item ${index + 1}` }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ordered Qty: {{ item.ordered_quantity }} | Received Qty: {{ item.received_quantity }} | 
                  Shortfall: <span class="font-semibold text-warning-600">{{ item.shortfall_quantity }}</span>
                </div>
              </div>
            </div>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Would you like to:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
            <li><strong>Save as Open PO</strong> - Save the receipt note as is with shortfall quantities</li>
            <li><strong>Raise a Return Note</strong> - Create a return note for the shortfall quantities</li>
          </ul>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="warning" variant="solid" @click="handleSaveAsOpenPO">
            Save as Open PO
          </UButton>
          <UButton color="primary" variant="solid" @click="handleRaiseReturnNote">
            Create Return Note
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Return Note Form Modal (for shortfall quantities) -->
    <UModal
      v-model:open="showReturnNoteModal"
      title="Create Return Note for Shortfall Quantities"
      fullscreen
      scrollable
    >
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Create Return Note for Shortfall Quantities
          </h3>
          <UTooltip text="Close Modal" color="neutral">
            <UButton
              color="neutral"
              variant="solid"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="closeReturnNoteModal"
            />
          </UTooltip>
        </div>
      </template>
      <template #body>
        <ReturnNoteForm
          v-if="showReturnNoteModal && returnNoteFormData"
          ref="returnNoteFormRef"
          v-model:form="returnNoteFormData"
          :editing-return-note="false"
          :readonly="false"
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="soft"
            @click="closeReturnNoteModal"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            :loading="savingReturnNote"
            :disabled="savingReturnNote || hasReturnNoteFormValidationError"
            @click="saveReturnNoteFromShortfall"
          >
            Save Return Note
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  h,
  watch,
  onMounted,
  useTemplateRef,
  resolveComponent,
  nextTick,
} from "vue";
import { storeToRefs } from "pinia";
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import ReceiptNoteForm from "~/components/purchaseOrders/ReceiptNoteForm.vue";
import ReturnNoteForm from "~/components/purchaseOrders/ReturnNoteForm.vue";
import ReceiptNotesExpanded from "~/components/purchaseOrders/ReceiptNotesExpanded.vue";
import { useCorporationStore } from "~/stores/corporations";
import { useStockReceiptNotesStore } from "~/stores/stockReceiptNotes";
import { useStockReturnNotesStore } from "~/stores/stockReturnNotes";
import { usePurchaseOrdersStore } from "~/stores/purchaseOrders";
import { usePurchaseOrderResourcesStore } from "~/stores/purchaseOrderResources";
import { useChangeOrdersStore } from "~/stores/changeOrders";
import { useProjectsStore } from "~/stores/projects";
import { useVendorStore } from "~/stores/vendors";
import { useUserProfilesStore } from "~/stores/userProfiles";
import { usePermissions } from "~/composables/usePermissions";
import { useDateFormat } from "~/composables/useDateFormat";
import { useCurrencyFormat } from "~/composables/useCurrencyFormat";
import { useUTCDateFormat } from "~/composables/useUTCDateFormat";
import { useTableStandard } from "~/composables/useTableStandard";
import type { TableColumn } from "@nuxt/ui";
import type { Column } from '@tanstack/vue-table';
import ProjectSelect from "~/components/shared/ProjectSelect.vue";
import VendorSelect from "~/components/shared/VendorSelect.vue";
import CorporationSelect from "~/components/shared/CorporationSelect.vue";
import LocationSelect from "~/components/shared/LocationSelect.vue";
import ItemCategorySelect from "~/components/shared/ItemCategorySelect.vue";
import ItemDivisionSelect from "~/components/shared/ItemDivisionSelect.vue";
import ItemTypeSelect from "~/components/shared/ItemTypeSelect.vue";
import { useLocationsStore } from "~/stores/locations";

const UButton = resolveComponent("UButton");
const UTooltip = resolveComponent("UTooltip");
const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");
const UIcon = resolveComponent("UIcon");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const corporationStore = useCorporationStore();

const corporationNameByUuid = computed<Record<string, string>>(() => {
  const list = corporationStore.corporations || []
  const map: Record<string, string> = {}
  list.forEach((corp: any) => { 
    if (corp?.uuid) {
      map[corp.uuid] = corp.corporation_name || corp.uuid
    }
  })
  return map
})
const stockReceiptNotesStore = useStockReceiptNotesStore();
const stockReturnNotesStore = useStockReturnNotesStore();
const purchaseOrdersStore = usePurchaseOrdersStore();
const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore();
const changeOrdersStore = useChangeOrdersStore();
const projectsStore = useProjectsStore();
const vendorStore = useVendorStore();
const userProfilesStore = useUserProfilesStore();
const { users: profileUsers } = storeToRefs(userProfilesStore);
const { hasPermission, isReady } = usePermissions();
const { formatDate } = useDateFormat();
const { formatCurrency, formatCurrencyAbbreviated } = useCurrencyFormat();
const { toUTCString, getCurrentLocal } = useUTCDateFormat();

const {
  pagination,
  paginationOptions,
  pageSizeOptions,
  updatePageSize,
  getPaginationProps,
  getPageInfo,
  shouldShowPagination,
} = useTableStandard();

const table = useTemplateRef<any>("table");

// Column pinning for sticky columns
const columnPinning = ref({
  left: [],
  right: []
});

// Expanded rows state
const expanded = ref<Record<string, boolean>>({});

// Helper function for sortable headers
function getHeader(column: Column<any>, label: string) {
  const isSorted = column.getIsSorted()

  return h(
    UDropdownMenu,
    {
      content: {
        align: 'start'
      },
      'aria-label': 'Sort options',
      items: [
        {
          label: 'Asc',
          type: 'checkbox',
          icon: 'i-lucide-arrow-up-narrow-wide',
          checked: isSorted === 'asc',
          onSelect: () => {
            if (isSorted === 'asc') {
              column.clearSorting()
            } else {
              column.toggleSorting(false)
            }
          }
        },
        {
          label: 'Desc',
          icon: 'i-lucide-arrow-down-wide-narrow',
          type: 'checkbox',
          checked: isSorted === 'desc',
          onSelect: () => {
            if (isSorted === 'desc') {
              column.clearSorting()
            } else {
              column.toggleSorting(true)
            }
          }
        }
      ]
    },
    () =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label,
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5 data-[state=open]:bg-elevated',
        'aria-label': `Sort by ${label} ${isSorted === 'asc' ? 'descending' : 'ascending'}`
      })
  )
}

const globalFilter = ref("");
const selectedStatusFilter = ref<string | null>(null);
const isFilterDrawerOpen = ref(false);
const locationsStore = useLocationsStore();

const createDefaultGrnListDateRange = (days: number) => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { dateFrom: ymd(start), dateTo: ymd(end) };
};

const defaultGrnListDateRange = createDefaultGrnListDateRange(60);

// Sorting state
const sorting = ref([]);

// Filter state (temporary - not applied until Show Results is clicked)
// Initialize as undefined, will be set from TopBar selection in onMounted
const filterCorporation = ref<string | undefined>(undefined);
const filterProject = ref<string | undefined>(undefined);
const filterVendor = ref<string | undefined>(undefined);
const filterLocation = ref<string | undefined>(undefined);
const filterCategory = ref<string | undefined>(undefined);
const filterDivision = ref<string | undefined>(undefined);
const filterItemType = ref<string | undefined>(undefined);
const filterDateFrom = ref<string | undefined>(defaultGrnListDateRange.dateFrom);
const filterDateTo = ref<string | undefined>(defaultGrnListDateRange.dateTo);

const inlinePopoverFilterDateFromOpen = ref(false);
const inlinePopoverFilterDateToOpen = ref(false);
const drawerPopoverFilterDateFromOpen = ref(false);
const drawerPopoverFilterDateToOpen = ref(false);

const ymdStringToCalendarDate = (ymd: string | undefined | null): CalendarDate | null => {
  if (!ymd) return null;
  const parts = String(ymd).trim().split("-");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return new CalendarDate(year, month, day);
};

const calendarDateToYmd = (v: CalendarDate | null | undefined): string | undefined => {
  if (!v) return undefined;
  return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
};

const listGrnDateFormatter = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const filterDateFromCalendarValue = computed({
  get: () => ymdStringToCalendarDate(filterDateFrom.value),
  set: (value: CalendarDate | null | undefined) => {
    filterDateFrom.value = calendarDateToYmd(value ?? null);
  },
});

const filterDateToCalendarValue = computed({
  get: () => ymdStringToCalendarDate(filterDateTo.value),
  set: (value: CalendarDate | null | undefined) => {
    filterDateTo.value = calendarDateToYmd(value ?? null);
  },
});

const filterDateToCalendarBound = computed(() => ymdStringToCalendarDate(filterDateTo.value) ?? undefined);
const filterDateFromCalendarBound = computed(() => ymdStringToCalendarDate(filterDateFrom.value) ?? undefined);

const filterDateFromDisplayText = computed(() => {
  const cd = filterDateFromCalendarValue.value;
  if (!cd) return "Select date from";
  return listGrnDateFormatter.format(cd.toDate(getLocalTimeZone()));
});

const filterDateToDisplayText = computed(() => {
  const cd = filterDateToCalendarValue.value;
  if (!cd) return "Select date to";
  return listGrnDateFormatter.format(cd.toDate(getLocalTimeZone()));
});

// Applied filters (set when "Show Results" is clicked; dates default to last 60 days)
const appliedFilters = ref({
  corporation: undefined as string | undefined,
  project: undefined as string | undefined,
  vendor: undefined as string | undefined,
  location: undefined as string | undefined,
  category: undefined as string | undefined,
  division: undefined as string | undefined,
  itemType: undefined as string | undefined,
  dateFrom: defaultGrnListDateRange.dateFrom as string | undefined,
  dateTo: defaultGrnListDateRange.dateTo as string | undefined,
});

type StockReceiptApiListFilters = {
  project_uuid?: string;
  vendor_uuid?: string;
  entry_date_from?: string;
  entry_date_to?: string;
};

function normalizeVendorFilterUuid(v: any): string | undefined {
  if (v == null) return undefined;

  if (typeof v === "object") {
    const candidate =
      v?.uuid ??
      v?.value ??
      v?.id ??
      v?.vendor_uuid ??
      undefined;
    const s = String(candidate ?? "").trim();
    if (!s || s === "__ALL__") return undefined;
    return s;
  }

  const s = String(v).trim();
  if (!s || s === "__ALL__") return undefined;
  return s;
}

/** API list filters on entry_date; summary uses live filters, status tiles use applied after Show. */
const buildStockReceiptApiListFilters = (): StockReceiptApiListFilters | undefined => {
  const useFilterInputs =
    selectedStatusFilter.value === null || selectedStatusFilter.value === undefined;
  const project = useFilterInputs ? filterProject.value : appliedFilters.value.project;
  const vendor = useFilterInputs
    ? normalizeVendorFilterUuid(filterVendor.value)
    : normalizeVendorFilterUuid(appliedFilters.value.vendor);
  const dateFrom = useFilterInputs ? filterDateFrom.value : appliedFilters.value.dateFrom;
  const dateTo = useFilterInputs ? filterDateTo.value : appliedFilters.value.dateTo;

  const f: StockReceiptApiListFilters = {};
  if (project) f.project_uuid = project;
  if (vendor) f.vendor_uuid = vendor;
  if (dateFrom) f.entry_date_from = dateFrom;
  if (dateTo) f.entry_date_to = dateTo;
  return Object.keys(f).length > 0 ? f : undefined;
};

const showDeleteModal = ref(false);
const receiptNoteToDelete = ref<any>(null);
const showFormModal = ref(false);
const receiptNoteForm = ref<any>({});
const savingReceiptNote = ref(false);
const loadingEdit = ref(false);
const isViewMode = ref(false);
const showReturnNoteModal = ref(false);
const returnNoteFormData = ref<any>(null);
const returnNoteFormRef = ref<any>(null);
const savingReturnNote = ref(false);

// Ref to track validation state for return note form - updated via watch to ensure reactivity
const hasReturnNoteFormValidationError = ref(false);

// Watch the return note form ref's validation state to update the button disabled state
watch(
  () => returnNoteFormRef.value?.hasValidationError,
  (hasError) => {
    hasReturnNoteFormValidationError.value = hasError ?? false;
  },
  { immediate: true }
);

// Also watch for changes in the return note form ref itself
watch(
  () => returnNoteFormRef.value,
  (formRef) => {
    if (formRef) {
      hasReturnNoteFormValidationError.value = formRef.hasValidationError ?? false;
    } else {
      hasReturnNoteFormValidationError.value = false;
    }
  },
  { immediate: true }
);
const shortfallItemsForReturn = ref<any[]>([]);
const pendingReceiptNoteSave = ref<(() => Promise<void>) | null>(null);
const showShortfallModal = ref(false);
const shortfallItemsForModal = ref<any[]>([]);
const receiptNoteFormRef = ref<any>(null);

// Ref to track validation state - updated via watch to ensure reactivity
const hasFormValidationError = ref(false);

// Watch the form ref's validation state to update the button disabled state
watch(
  () => receiptNoteFormRef.value?.hasValidationError,
  (hasError) => {
    hasFormValidationError.value = hasError ?? false;
  },
  { immediate: true }
);

// Also watch for changes in the form ref itself
watch(
  () => receiptNoteFormRef.value,
  (formRef) => {
    if (formRef) {
      hasFormValidationError.value = formRef.hasValidationError ?? false;
    } else {
      hasFormValidationError.value = false;
    }
  },
  { immediate: true }
);

const selectedCorporationId = computed(
  () => corporationStore.selectedCorporationId
);

const receiptNotes = computed(() => {
  // Use applied corporation filter if set, otherwise use selected corporation
  const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value;
  
  return stockReceiptNotesStore.stockReceiptNotes.filter(
    (note) => note.corporation_uuid === corporationUuid
  );
});

const loading = computed(() => stockReceiptNotesStore.loading);
// Only show error alert for fetch errors, not delete operation errors
// Delete errors are handled via toast notifications
const error = computed(() => {
  const storeError = stockReceiptNotesStore.error
  // Don't show error alert for delete-related errors (they're handled via toast)
  if (storeError && (storeError.includes('delete') || storeError.includes('Cannot delete'))) {
    return null
  }
  return storeError
});
const canEdit = computed(
  () => hasPermission("po_edit") || hasPermission("po_create")
);
const formModalTitle = computed(() =>
  receiptNoteForm.value?.uuid ? "Edit Stock Receipt Note" : "New Stock Receipt Note"
);
const receiptNoteModalUi = {
  body: "sm:p-3 p-2",
  header: "px-2 py-2 sm:px-3 sm:py-2",
  footer: "px-2 py-2 sm:px-3 sm:py-3"
};

const cardUi = {
  primary: {
    container:
      "p-2 sm:p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
  neutral: {
    container:
      "p-2 sm:p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
  warning: {
    container:
      "p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
  success: {
    container:
      "p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
  info: {
    container:
      "p-2 sm:p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
  error: {
    container:
      "p-2 sm:p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg",
    wrapper: "w-full",
    body: "flex flex-row items-center justify-between w-full min-w-0",
  },
};

const projectLookup = computed(() => {
  const map = new Map<string, string>();
  const list = projectsStore.projects ?? [];
  list.forEach((project: any) => {
    if (project?.uuid) {
      map.set(project.uuid, project.project_name || project.project_id || "");
    }
  });
  return map;
});

const purchaseOrderLookup = computed(() => {
  const map = new Map<
    string,
    { poNumber: string; total: number; projectUuid?: string | null; vendorUuid?: string | null }
  >();
  const list = purchaseOrdersStore.purchaseOrders ?? [];
  list.forEach((po: any) => {
    if (po?.uuid) {
      map.set(po.uuid, {
        poNumber: po.po_number || "Unnamed PO",
        total: Number(po.total_po_amount) || 0,
        projectUuid: po.project_uuid,
        vendorUuid: po.vendor_uuid || null,
      });
    }
  });
  return map;
});

const changeOrderLookup = computed(() => {
  const map = new Map<
    string,
    { coNumber: string; total: number; projectUuid?: string | null; vendorUuid?: string | null }
  >();
  const list = changeOrdersStore.changeOrders ?? [];
  list.forEach((co: any) => {
    if (co?.uuid) {
      map.set(co.uuid, {
        coNumber: co.co_number || "Unnamed CO",
        total: Number(co.total_co_amount) || 0,
        projectUuid: co.project_uuid,
        vendorUuid: co.vendor_uuid || null,
      });
    }
  });
  return map;
});

const vendorLookup = computed(() => {
  const map = new Map<string, string>();
  const list = vendorStore.vendors ?? [];
  list.forEach((vendor: any) => {
    if (vendor?.uuid) {
      map.set(vendor.uuid, vendor.vendor_name || vendor.uuid);
    }
  });
  return map;
});

const userLookup = computed(() => {
  const map = new Map<string, { name: string; imageUrl?: string }>();
  const list = profileUsers.value ?? [];
  list.forEach((user: any) => {
    if (user?.id) {
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "Unknown User";
      map.set(user.id, {
        name: fullName,
        imageUrl: user.imageUrl || undefined,
      });
    }
  });
  return map;
});

const allStats = computed(() => ({
  count: receiptNotes.value.length,
  totalValue: receiptNotes.value.reduce(
    (sum, note) => sum + (Number(note.total_received_amount) || 0),
    0
  ),
}));

const shipmentStats = computed(() => {
  const shipment = receiptNotes.value.filter(
    (note) => (note.status || "Shipment") === "Shipment"
  );
  return {
    count: shipment.length,
    totalValue: shipment.reduce(
      (sum, note) => sum + (Number(note.total_received_amount) || 0),
      0
    ),
  };
});

const receivedStats = computed(() => {
  const received = receiptNotes.value.filter((note) => note.status === "Received");
  return {
    count: received.length,
    totalValue: received.reduce(
      (sum, note) => sum + (Number(note.total_received_amount) || 0),
      0
    ),
  };
});

/** YYYY-MM-DD for client-side date filter (matches API entry_date_from / entry_date_to). */
function rowGrnEntryYmd(note: any): string | null {
  const raw =
    note?.entry_date ?? note?.created_at ?? note?.grn_date ?? note?.receipt_date;
  if (raw == null || raw === "") return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1]!;
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  } catch {
    return null;
  }
}

function resolveReceiptVendorUuid(note: any): string | null {
  const receiptType = note?.receipt_type || "purchase_order";
  const orderUuid =
    receiptType === "change_order"
      ? (note?.change_order_uuid || note?.purchase_order_uuid)
      : note?.purchase_order_uuid;

  if (orderUuid) {
    if (receiptType === "change_order") {
      const co = changeOrderLookup.value.get(orderUuid);
      if (co?.vendorUuid) return String(co.vendorUuid);
    } else {
      const po = purchaseOrderLookup.value.get(orderUuid);
      if (po?.vendorUuid) return String(po.vendorUuid);
    }
  }

  const direct =
    note?.vendor_uuid ??
    note?.vendorUuid ??
    note?.vendor?.uuid ??
    null;
  return direct ? String(direct) : null;
}

const filteredReceiptNotes = computed(() => {
  let list = [...receiptNotes.value];

  if (appliedFilters.value.project) {
    list = list.filter(
      (note) => note.project_uuid === appliedFilters.value.project
    );
  }

  const normalizedAppliedVendor = normalizeVendorFilterUuid(appliedFilters.value.vendor as any);
  if (normalizedAppliedVendor) {
    list = list.filter((note) => {
      const vendorUuid = resolveReceiptVendorUuid(note);
      return vendorUuid === normalizedAppliedVendor;
    });
  }

  const activeDateFrom = appliedFilters.value.dateFrom;
  const activeDateTo = appliedFilters.value.dateTo;
  if (activeDateFrom) {
    list = list.filter((note: any) => {
      const ymd = rowGrnEntryYmd(note);
      return ymd != null && ymd >= activeDateFrom;
    });
  }
  if (activeDateTo) {
    list = list.filter((note: any) => {
      const ymd = rowGrnEntryYmd(note);
      return ymd != null && ymd <= activeDateTo;
    });
  }

  if (selectedStatusFilter.value) {
    list = list.filter(
      (note) => (note.status || "Shipment") === selectedStatusFilter.value
    );
  }

  const filter = globalFilter.value.trim().toLowerCase();
  if (filter) {
    list = list.filter((note) => {
      const receiptType = note.receipt_type || 'purchase_order';
      const orderUuid = receiptType === 'change_order'
        ? (note.change_order_uuid || note.purchase_order_uuid)
        : note.purchase_order_uuid;

      let orderNumber = "";
      if (receiptType === 'change_order') {
        orderNumber =
          changeOrderLookup.value.get(orderUuid || "")?.coNumber ||
          "";
      } else {
        orderNumber =
          purchaseOrderLookup.value.get(orderUuid || "")?.poNumber ||
          "";
      }
      const projectName =
        projectLookup.value.get(note.project_uuid || "") || "";
      const vendorName = (() => {
        const vendorUuid = resolveReceiptVendorUuid(note);
        const directVendorName =
          String(note?.vendor_name || note?.vendorName || note?.vendor?.vendor_name || "").trim();
        if (directVendorName) return directVendorName;

        return vendorUuid ? (vendorLookup.value.get(vendorUuid) || "") : "";
      })();

      return (
        note.grn_number?.toLowerCase().includes(filter) ||
        orderNumber.toLowerCase().includes(filter) ||
        projectName.toLowerCase().includes(filter) ||
        vendorName.toLowerCase().includes(filter) ||
        note.status?.toLowerCase().includes(filter)
      );
    });
  }

  const activeLocation = appliedFilters.value.location;
  if (activeLocation) {
    list = list.filter((note: any) => {
      if (note.items && Array.isArray(note.items)) {
        return note.items.some((item: any) => item.location === activeLocation || item.location_uuid === activeLocation || item.storage_location === activeLocation);
      }
      return note.location_uuid === activeLocation || note.storage_location === activeLocation;
    });
  }

  const activeCategory = appliedFilters.value.category;
  if (activeCategory) {
    list = list.filter((note: any) => {
      if (note.items && Array.isArray(note.items)) {
        return note.items.some((item: any) => item.category === activeCategory);
      }
      return false;
    });
  }

  const activeDivision = appliedFilters.value.division;
  if (activeDivision) {
    list = list.filter((note: any) => {
      if (note.items && Array.isArray(note.items)) {
        return note.items.some((item: any) => item.item_division_uuid === activeDivision);
      }
      return false;
    });
  }

  const activeItemType = appliedFilters.value.itemType;
  if (activeItemType) {
    list = list.filter((note: any) => {
      if (note.items && Array.isArray(note.items)) {
        return note.items.some((item: any) => item.item_type_uuid === activeItemType);
      }
      return false;
    });
  }

  return list;
});

// Group receipt notes by Purchase Order or Change Order
const groupedOrderData = computed(() => {
  const groups = new Map<string, {
    orderUuid: string
    orderType: 'purchase_order' | 'change_order'
    orderNumber: string
    corporationUuid: string
    projectUuid: string
    vendorUuid: string | null
    receiptNotes: any[]
    totalAmount: number
    receiptCount: number
  }>()

  filteredReceiptNotes.value.forEach((note) => {
    const receiptType = note.receipt_type || 'purchase_order'
    const orderUuid = receiptType === 'change_order' 
      ? (note.change_order_uuid || note.purchase_order_uuid)
      : note.purchase_order_uuid

    if (!orderUuid) return

    const key = `${receiptType}:${orderUuid}`
    
    if (!groups.has(key)) {
      let orderNumber = ''
      let vendorUuid: string | null = resolveReceiptVendorUuid(note)
      
      if (receiptType === 'change_order') {
        const co = changeOrderLookup.value.get(orderUuid)
        orderNumber = co?.coNumber || 'N/A'
      } else {
        const po = purchaseOrderLookup.value.get(orderUuid)
        orderNumber = po?.poNumber || 'N/A'
      }

      groups.set(key, {
        orderUuid,
        orderType: receiptType,
        orderNumber,
        corporationUuid: note.corporation_uuid || '',
        projectUuid: note.project_uuid || '',
        vendorUuid,
        receiptNotes: [],
        totalAmount: 0,
        receiptCount: 0,
      })
    }

    const group = groups.get(key)!
    group.receiptNotes.push(note)
    group.totalAmount += Number(note.total_received_amount || 0)
    group.receiptCount += 1
  })

  return Array.from(groups.values())
})

const columns: TableColumn<any>[] = [
  {
    id: 'expand',
    header: '',
    enableSorting: false,
    meta: { class: { th: 'w-12', td: 'w-12' } },
    cell: ({ row }: { row: { original: any; id?: string } }) => {
      const rowId = (row.id || `${row.original.orderType}:${row.original.orderUuid}`) as string
      const isExpanded = expanded.value[rowId] || false
      return h(UButton, {
        color: 'primary',
        variant: isExpanded ? 'solid' : 'soft',
        icon: isExpanded ? 'i-heroicons-chevron-down-solid' : 'i-heroicons-chevron-right-solid',
        size: 'xs',
        square: true,
        class: 'transition-transform',
        onClick: () => {
          expanded.value[rowId] = !expanded.value[rowId]
        }
      })
    }
  },
  {
    accessorKey: 'orderType',
    header: 'Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const type = row.original.orderType === 'change_order' ? 'Change Order' : 'Purchase Order'
      return h(UBadge, {
        color: row.original.orderType === 'change_order' ? 'secondary' : 'primary',
        variant: 'soft',
        size: 'sm'
      }, () => type)
    }
  },
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => getHeader(column, 'Order Number'),
    enableSorting: true,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      return h('div', { class: 'font-medium text-default' }, row.original.orderNumber || 'N/A')
    }
  },
  {
    accessorKey: 'corporation_uuid',
    header: 'Corporation',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const uuid = row.original.corporationUuid
      const label = uuid ? (corporationNameByUuid.value[uuid] || uuid) : 'N/A'
      return h('div', label)
    }
  },
  {
    accessorKey: "project_uuid",
    header: "Project",
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const name =
        projectLookup.value.get(row.original.projectUuid || "") || "N/A";
      return h("div", name);
    },
  },
  {
    accessorKey: "vendor",
    header: "Vendor",
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }) => {
      const vendorUuid = row.original.vendorUuid
      const vendorName = vendorUuid ? (vendorLookup.value.get(vendorUuid) || "N/A") : "N/A";
      return h("div", vendorName);
    },
  },
  {
    accessorKey: "receiptCount",
    header: "Receipt Notes",
    enableSorting: false,
    meta: { class: { th: 'text-center', td: 'text-center' } },
    cell: ({ row }) => {
      return h(UBadge, {
        color: 'neutral',
        variant: 'soft',
        size: 'sm'
      }, () => `${row.original.receiptCount}`)
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) => {
      const amount = row.original.totalAmount || 0;
      return h(
        "div",
        { class: "text-right font-mono text-sm font-semibold" },
        formatCurrency(amount)
      );
    },
  },
];

const createEmptyForm = () => ({
  uuid: null,
  corporation_uuid: corporationStore.selectedCorporationId,
  project_uuid: null,
  purchase_order_uuid: null,
  change_order_uuid: null,
  receipt_type: 'purchase_order' as 'purchase_order' | 'change_order',
  entry_date: toUTCString(getCurrentLocal()),
  grn_number: "",
  reference_number: "",
  received_by: "",
  location_uuid: null,
  notes: "",
  status: "Shipment",
  total_received_amount: null,
  attachments: [],
});

const ensureSupportingData = async (corporationUuid: string) => {
  await Promise.allSettled([
    purchaseOrdersStore.fetchPurchaseOrders(corporationUuid),
    changeOrdersStore.fetchChangeOrders(corporationUuid),
    projectsStore.fetchProjectsMetadata(corporationUuid).catch(() => {}),
    vendorStore.fetchVendors(corporationUuid).catch(() => {}),
    userProfilesStore.fetchUsers(false).catch(() => {}),
  ]);
};

const fetchNextGrnNumber = async (corporationUuid: string): Promise<string> => {
  try {
    const response: any = await $fetch("/api/stock-receipt-notes", {
      method: "GET",
      query: {
        corporation_uuid: corporationUuid,
        next_grn_number: true,
      },
    });
    const value = String(response?.data?.grn_number || "").trim();
    if (value) {
      return value;
    }
  } catch (error) {
    console.warn("[ReceiptNoteList] Failed to fetch next GRN number from API, falling back to store", error);
  }
  return stockReceiptNotesStore.generateNextGrnNumber(corporationUuid);
};

// Receipt notes are fetched by TopBar.vue when corporation changes
// This component just reads from the store reactively
// Only fetch supporting data when needed (e.g., when opening a form)

const openCreateModal = async () => {
  // Clear resource store before opening new receipt note
  purchaseOrderResourcesStore.clear();

  if (!hasPermission("po_create")) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to create receipt notes.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  const corpUuid = corporationStore.selectedCorporationId;
  if (!corpUuid) {
    const toast = useToast();
    toast.add({
      title: "Select Corporation",
      description: "Please select a corporation before creating a receipt note.",
      color: "error",
    });
    return;
  }

  await ensureSupportingData(corpUuid);

  const grnNumber = await fetchNextGrnNumber(corpUuid);
  receiptNoteForm.value = {
    ...createEmptyForm(),
    corporation_uuid: corpUuid,
    grn_number: grnNumber,
  };

  showFormModal.value = true;
};

const loadReceiptNoteForModal = async (note: any, viewMode: boolean = false) => {
  // Clear resource store before loading receipt note
  purchaseOrderResourcesStore.clear();

  if (!note?.uuid) {
    return
  }

  isViewMode.value = viewMode
  loadingEdit.value = true;
  
  try {
    // Ensure supporting data is loaded (including change orders)
    const corpUuid = corporationStore.selectedCorporationId;
    if (corpUuid) {
      await ensureSupportingData(corpUuid);
    }
    
    const formData = { ...note };

    formData.corporation_uuid =
      formData.corporation_uuid || corporationStore.selectedCorporationId || null;

    // Use receipt_type from database (defaults to 'purchase_order' if not set)
    const receiptType = formData.receipt_type || 'purchase_order';
    formData.receipt_type = receiptType;
    
    
    // Use the correct UUID column based on receipt_type
    // purchase_order_uuid and change_order_uuid are now separate columns
    if (receiptType === 'change_order') {
      // For change orders, use change_order_uuid from database
      // Support legacy data where it might still be in purchase_order_uuid
      if (!formData.change_order_uuid && formData.purchase_order_uuid) {
        formData.change_order_uuid = formData.purchase_order_uuid;
        formData.purchase_order_uuid = null;
      }
    } else {
      // For purchase orders, ensure change_order_uuid is null
      formData.change_order_uuid = null;
    }
    
    
    receiptNoteForm.value = formData;
    showFormModal.value = true;
  } catch (error) {
    console.error("[RNL] Failed to load receipt note details:", error);
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to load receipt note details.",
      color: "error",
    });
  } finally {
    loadingEdit.value = false;
  }
};

const editReceiptNote = async (note: any) => {
  if (!hasPermission("po_edit")) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to edit receipt notes.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  await loadReceiptNoteForModal(note, false);
};

const previewReceiptNote = async (note: any) => {
  if (!hasPermission("po_view")) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to view receipt note details.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  
  await loadReceiptNoteForModal(note, true);
};

const switchToEditMode = () => {
  if (!hasPermission("po_edit")) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to edit receipt notes.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  isViewMode.value = false;
};

const closeFormModal = () => {
  showFormModal.value = false;
  isViewMode.value = false;
  // Form will be reset when modal opens next time via openCreateModal or editReceiptNote
};

// Check for existing return notes for shortfall items
const checkExistingReturnNotesForShortfall = async (
  shortfallItems: any[],
  receiptData: any
): Promise<any[]> => {
  if (!shortfallItems || shortfallItems.length === 0) {
    return shortfallItems;
  }

  const corpUuid = corporationStore.selectedCorporationId;
  if (!corpUuid) {
    return shortfallItems;
  }

  const returnType = receiptData.receipt_type || 'purchase_order';
  const sourceUuid = returnType === 'purchase_order' 
    ? receiptData.purchase_order_uuid 
    : receiptData.change_order_uuid;

  if (!sourceUuid) {
    return shortfallItems;
  }

  try {
    // Fetch existing return notes for this PO/CO
    await stockReturnNotesStore.fetchStockReturnNotes(corpUuid, false, 1, 100);
    // Filter return notes for this corporation (getNotesForCorporation is not exported, so filter directly)
    const allReturnNotes = stockReturnNotesStore.stockReturnNotes.filter(
      (note: any) => note.corporation_uuid === corpUuid
    );
    
    // Filter return notes that match the source (PO/CO), return type, status, and are active
    // Only consider return notes in "Waiting" or "Returned" status (not cancelled/inactive)
    const matchingReturnNotes = allReturnNotes.filter((note: any) => {
      // Check if note is active (explicitly check for false, undefined/null means active)
      if (note.is_active === false) {
        return false;
      }

      // Check status - only consider "Waiting" or "Returned" status (case-insensitive)
      const status = String(note.status || '').trim();
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      if (normalizedStatus !== 'Waiting' && normalizedStatus !== 'Returned') {
        return false;
      }

      // Check if it matches the source (PO/CO) and return type
      if (returnType === 'purchase_order') {
        return note.purchase_order_uuid === sourceUuid && note.return_type === 'purchase_order';
      } else {
        return note.change_order_uuid === sourceUuid && note.return_type === 'change_order';
      }
    });

    if (matchingReturnNotes.length === 0) {
      return shortfallItems;
    }

    // Fetch return note items for all matching return notes
    const projectUuid = receiptData.project_uuid;
    const returnNoteUuids = matchingReturnNotes.map((note: any) => note.uuid);
    
    // Fetch return note items for all matching return notes
    const allReturnNoteItems: any[] = [];
    for (const returnNoteUuid of returnNoteUuids) {
      try {
        const response: any = await $fetch("/api/return-note-items", {
          method: "GET",
          query: {
            corporation_uuid: corpUuid,
            project_uuid: projectUuid || undefined,
            return_note_uuid: returnNoteUuid,
            item_type: returnType,
          },
        });
        
        const items = Array.isArray(response?.data) ? response.data : [];
        allReturnNoteItems.push(...items);
      } catch (error) {
        // Continue if one fails
        console.error(`[ReceiptNoteList] Failed to fetch return note items for ${returnNoteUuid}:`, error);
      }
    }

    // Create a map of returned quantities by item_uuid
    // Only consider active return note items (API should filter, but double-check)
    const returnedQuantitiesMap = new Map<string, number>();
    allReturnNoteItems.forEach((rni: any) => {
      // Skip inactive items (API should filter, but be safe)
      if (rni.is_active === false) {
        return;
      }

      const itemUuid = rni.item_uuid || rni.base_item_uuid;
      if (itemUuid) {
        const key = String(itemUuid).trim().toLowerCase();
        const existingQty = returnedQuantitiesMap.get(key) || 0;
        const returnQty = parseFloat(String(rni.return_quantity || 0)) || 0;
        returnedQuantitiesMap.set(key, existingQty + returnQty);
      }
    });

    // Filter out shortfall items that are already fully covered by return notes
    // Match by item.uuid (PO/CO item UUID) which is what return_note_items.item_uuid references
    // Also update the shortfall_quantity to reflect the remaining shortfall after returns
    const unmatchedShortfallItems = shortfallItems
      .map((item: any) => {
        // The item.uuid in shortfall items is the PO/CO item UUID (from purchase_order_items_list or change_order_items_list)
        // This is what return_note_items.item_uuid references
        const itemUuid = item.uuid || item.base_item_uuid || item.item_uuid;
        if (!itemUuid) {
          // Keep items without UUID (can't match, so show modal with original shortfall)
          return item;
        }

        const key = String(itemUuid).trim().toLowerCase();
        const returnedQty = returnedQuantitiesMap.get(key) || 0;
        const originalShortfallQty = parseFloat(String(item.shortfall_quantity || 0)) || 0;

        // Calculate remaining shortfall after returns
        const remainingShortfall = Math.max(0, originalShortfallQty - returnedQty);

        // If there's remaining shortfall, update the item with the new shortfall quantity
        if (remainingShortfall > 0) {
          return {
            ...item,
            shortfall_quantity: remainingShortfall,
            // Also update received_quantity to reflect what's actually remaining to be received
            // This helps with display accuracy
            received_quantity: parseFloat(String(item.ordered_quantity || 0)) - remainingShortfall,
          };
        }

        // Return null for items that are fully covered (will be filtered out)
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return unmatchedShortfallItems;
  } catch (error) {
    console.error("[ReceiptNoteList] Error checking existing return notes:", error);
    // On error, return all shortfall items (better to show modal than miss something)
    return shortfallItems;
  }
};

// Check for items with shortfall quantities
const checkForShortfallQuantities = async (): Promise<{ hasShortfall: boolean; items: any[] }> => {
  if (!receiptNoteFormRef.value) {
    return { hasShortfall: false, items: [] };
  }

  // Access the computed property - it might be a ref or a computed
  const shortfallItemsRef = receiptNoteFormRef.value.shortfallItems;
  const shortfallItems = shortfallItemsRef?.value || shortfallItemsRef || [];
  
  if (!Array.isArray(shortfallItems) || shortfallItems.length === 0) {
    return { hasShortfall: false, items: [] };
  }

  // Check for existing return notes and filter out already covered items
  const receiptData = receiptNoteForm.value;
  const unmatchedShortfallItems = await checkExistingReturnNotesForShortfall(shortfallItems, receiptData);
  
  return {
    hasShortfall: unmatchedShortfallItems.length > 0,
    items: unmatchedShortfallItems,
  };
};

const handleSaveAndNew = async () => {
  await saveReceiptNote(true);
};

const handleSaveAndClose = async () => {
  await saveReceiptNote(false);
};

const saveReceiptNote = async (openNewForm: boolean = false) => {
  if (savingReceiptNote.value) return;
  const corpUuid = corporationStore.selectedCorporationId;
  if (!corpUuid) {
    const toast = useToast();
    toast.add({
      title: "Select Corporation",
      description: "Please select a corporation before saving.",
      color: "error",
    });
    return;
  }

  // Check for over-received quantities (received > ordered) before saving
  if (receiptNoteFormRef.value?.hasOverReceivedItems) {
    const errorMessage = receiptNoteFormRef.value.overReceivedValidationError || 
      "Cannot save receipt note: One or more items have received quantity greater than ordered quantity.";
    const toast = useToast();
    toast.add({
      title: "Validation Error",
      description: errorMessage,
      color: "error",
    });
    return;
  }

  // Check for shortfall quantities before saving
  // Only show shortfall modal when creating a new receipt note (not when editing an existing one)
  const isNewReceiptNote = !receiptNoteForm.value?.uuid;
  
  if (isNewReceiptNote) {
    const { hasShortfall, items } = await checkForShortfallQuantities();

    if (hasShortfall && !isViewMode.value) {
      shortfallItemsForModal.value = items;
      pendingReceiptNoteSave.value = async () => {
        await performSaveReceiptNote(true, false, openNewForm); // Pass openNewForm parameter
      };
      showShortfallModal.value = true;
      return;
    }
  }

  await performSaveReceiptNote(false, false, openNewForm); // Pass openNewForm parameter
};

const performSaveReceiptNote = async (saveAsOpenPO: boolean = false, suppressToast: boolean = false, openNewForm: boolean = false, raiseReturnNoteForShortfall: boolean = false) => {
  if (savingReceiptNote.value) return;
  const corpUuid = corporationStore.selectedCorporationId;
  if (!corpUuid) {
    const toast = useToast();
    toast.add({
      title: "Select Corporation",
      description: "Please select a corporation before saving.",
      color: "error",
    });
    return;
  }

  savingReceiptNote.value = true;
  try {
    // Ensure total_received_amount is synced with grn_total_with_charges_taxes before saving
    const formData = { ...receiptNoteForm.value };
    
    // Calculate GRN total from FinancialBreakdown data if grn_total_with_charges_taxes is not available
    // This ensures we always save the correct GRN total (item_total + charges_total + tax_total)
    let grnTotalWithCharges = formData.grn_total_with_charges_taxes;
    
    if (grnTotalWithCharges === undefined || grnTotalWithCharges === null) {
      // Calculate from FinancialBreakdown totals: item_total + charges_total + tax_total
      const itemTotal = parseFloat(String(formData.item_total || 0)) || 0;
      const chargesTotal = parseFloat(String(formData.charges_total || 0)) || 0;
      const taxTotal = parseFloat(String(formData.tax_total || 0)) || 0;
      
      grnTotalWithCharges = itemTotal + chargesTotal + taxTotal;
      grnTotalWithCharges = Math.round((grnTotalWithCharges + Number.EPSILON) * 100) / 100;
      
      // Also check financial_breakdown.totals if available
      if (formData.financial_breakdown?.totals?.grn_total_with_charges_taxes) {
        const breakdownTotal = parseFloat(String(formData.financial_breakdown.totals.grn_total_with_charges_taxes)) || 0;
        if (breakdownTotal > 0) {
          grnTotalWithCharges = breakdownTotal;
        }
      }
      
      // Update form data for consistency
      formData.grn_total_with_charges_taxes = grnTotalWithCharges;
    }
    
    // Always use the calculated GRN total (with charges/taxes) for total_received_amount
    // This ensures consistency: both purchase orders and change orders save the GRN total
    formData.total_received_amount = grnTotalWithCharges;

    // Ensure receipt_type is set (defaults to 'purchase_order')
    const receiptType = formData.receipt_type || 'purchase_order';
    formData.receipt_type = receiptType;

    // Clear the opposite UUID column based on receipt_type
    // purchase_order_uuid and change_order_uuid are now separate columns
    if (receiptType === 'change_order') {
      // For change orders, clear purchase_order_uuid
      formData.purchase_order_uuid = null;
      // change_order_uuid is already set in formData
    } else {
      // For purchase orders, clear change_order_uuid
      formData.change_order_uuid = null;
      // purchase_order_uuid is already set in formData
    }

    const payload = {
      ...formData,
      corporation_uuid: corpUuid,
      save_as_open_po: saveAsOpenPO, // Flag to indicate saving as open PO
      raise_return_note_for_shortfall: raiseReturnNoteForShortfall, // Flag to indicate raising return note for shortfall
    };

    if (receiptNoteForm.value?.uuid) {
      await stockReceiptNotesStore.updateStockReceiptNote(payload);
      if (!suppressToast) {
        const toast = useToast();
        toast.add({
          title: "Updated",
          description: "Receipt note updated successfully.",
          color: "success",
        });
      }
    } else {
      await stockReceiptNotesStore.createStockReceiptNote(payload);
      if (!suppressToast) {
        const toast = useToast();
        toast.add({
          title: "Created",
          description: "Receipt note created successfully.",
          color: "success",
        });
      }
    }
    
    // Check if form's corporation matches TopBar's selected corporation
    // Only update store/IndexedDB if they match, otherwise just call API directly
    const formCorpUuid = formData.corporation_uuid;
    const topBarCorpUuid = corporationStore.selectedCorporationId;
    const shouldUpdateStore = formCorpUuid && topBarCorpUuid && formCorpUuid === topBarCorpUuid;

    // Refresh the specific purchase order if status was updated to Partially_Received
    // Only refresh if form's corporation matches TopBar's selected corporation
    if (saveAsOpenPO && receiptType === 'purchase_order' && formData.purchase_order_uuid && shouldUpdateStore) {
      try {
        // Fetch only the specific purchase order that was updated
        const updatedPO = await purchaseOrdersStore.fetchPurchaseOrder(formData.purchase_order_uuid);
        if (updatedPO) {
          // Use store method to update the purchase order in the list (ensures proper reactivity and IndexedDB update)
          purchaseOrdersStore.updatePurchaseOrderInList(updatedPO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh purchase order:", refreshError);
        // Don't fail the operation, just log the error
      }
    }

    // Refresh the specific change order if status was updated to Partially_Received
    // Only refresh if form's corporation matches TopBar's selected corporation
    if (saveAsOpenPO && receiptType === 'change_order' && formData.change_order_uuid && shouldUpdateStore) {
      try {
        // Fetch only the specific change order that was updated
        const updatedCO = await changeOrdersStore.fetchChangeOrder(formData.change_order_uuid);
        if (updatedCO) {
          // Use store method to update the change order in the list (ensures proper reactivity and IndexedDB update)
          changeOrdersStore.updateChangeOrderInList(updatedCO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh change order:", refreshError);
        // Don't fail the operation, just log the error
      }
    }

    // Refresh the specific purchase order if status was updated to Completed
    // This happens when saveAsOpenPO is false (normal save) and all items are fully received
    // Only refresh if form's corporation matches TopBar's selected corporation

    if (!saveAsOpenPO && receiptType === 'purchase_order' && formData.purchase_order_uuid && shouldUpdateStore) {
      try {
        // Fetch only the specific purchase order that was updated
        // The API may have marked it as Completed if all items are fully received
        const updatedPO = await purchaseOrdersStore.fetchPurchaseOrder(formData.purchase_order_uuid);
        if (updatedPO) {
          // Use store method to update the purchase order in the list (ensures proper reactivity and IndexedDB update)
          purchaseOrdersStore.updatePurchaseOrderInList(updatedPO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh purchase order after completion check:", refreshError);
        // Don't fail the operation, just log the error
      }
    }

    // Refresh the specific change order if status was updated to Completed
    // This happens when saveAsOpenPO is false (normal save) and all items are fully received
    // Only refresh if form's corporation matches TopBar's selected corporation
    if (!saveAsOpenPO && receiptType === 'change_order' && formData.change_order_uuid && shouldUpdateStore) {
      try {
        // Fetch only the specific change order that was updated
        // The API may have marked it as Completed if all items are fully received
        const updatedCO = await changeOrdersStore.fetchChangeOrder(formData.change_order_uuid);
        if (updatedCO) {
          // Use store method to update the change order in the list (ensures proper reactivity and IndexedDB update)
          changeOrdersStore.updateChangeOrderInList(updatedCO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh change order after completion check:", refreshError);
        // Don't fail the operation, just log the error
      }
    }
    
    if (openNewForm) {
      // Open a new form instead of closing
      const corpUuid = corporationStore.selectedCorporationId;
      if (corpUuid) {
        await ensureSupportingData(corpUuid);
        const grnNumber = await fetchNextGrnNumber(corpUuid);
        receiptNoteForm.value = {
          ...createEmptyForm(),
          corporation_uuid: corpUuid,
          grn_number: grnNumber,
        };
        // Keep modal open with new form
      } else {
        // If no corporation, just close the modal
        showFormModal.value = false;
        await nextTick();
        receiptNoteForm.value = createEmptyForm();
      }
    } else {
      // Close modal and reset form
      showFormModal.value = false;
      await nextTick();
      receiptNoteForm.value = createEmptyForm();
    }
  } catch (error: any) {
    console.error("[ReceiptNoteList] save error", error);
    const toast = useToast();
    toast.add({
      title: "Error",
      description: error?.message || "Failed to save receipt note.",
      color: "error",
    });
  } finally {
    savingReceiptNote.value = false;
  }
};

const deleteReceiptNote = (note: any) => {
  if (!hasPermission("po_delete")) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to delete receipt notes.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  receiptNoteToDelete.value = note;
  showDeleteModal.value = true;
};

// Helper function to clean error messages
const getCleanMessage = (msg: string | undefined): string => {
  if (!msg) return ''
  let clean = msg
  // Remove [METHOD] "URL": statusCode patterns like [DELETE] "/api/receipt-notes?uuid=...": 400
  clean = clean.replace(/\[.*?\]\s*"[^"]*":\s*\d{3}\s*/g, '')
  // Remove [METHOD] "URL" patterns (without status code)
  clean = clean.replace(/\[.*?\]\s*"[^"]*":\s*/g, '')
  // Remove API endpoint URLs (standalone)
  clean = clean.replace(/\/api\/[^\s"]+/g, '')
  // Remove status codes like "500" or "400" (standalone numbers, but keep them in context)
  clean = clean.replace(/\b\d{3}\b(?=\s|$)/g, '')
  // Remove common error prefixes
  clean = clean.replace(/^(FetchError|Error|Failed to load resource):\s*/i, '')
  // Remove extra whitespace and leading/trailing colons
  clean = clean.trim().replace(/\s+/g, ' ').replace(/^\s*:\s*/, '').replace(/\s*:\s*$/, '')
  return clean
}

const confirmDelete = async () => {
  if (!receiptNoteToDelete.value) return;
  try {
    await stockReceiptNotesStore.deleteStockReceiptNote(
      receiptNoteToDelete.value.uuid
    );
    const toast = useToast();
    toast.add({
      title: "Deleted",
      description: "Receipt note deleted successfully.",
      color: "success",
    });
    showDeleteModal.value = false;
    receiptNoteToDelete.value = null;
  } catch (error: any) {
    console.error("[ReceiptNoteList] delete error", error);
    // Clear the store error after handling it so it doesn't affect the table display
    stockReceiptNotesStore.error = null
    
    const toast = useToast();
    let errorDescription = 'Failed to delete receipt note.'
    
    // Use statusMessage from API if available (it should be clean), otherwise use cleaned message
    if (error?.statusMessage) {
      errorDescription = getCleanMessage(error.statusMessage) || errorDescription
    } else if (error?.message) {
      errorDescription = getCleanMessage(error.message) || errorDescription
    }
    
    toast.add({
      title: "Error",
      description: errorDescription,
      color: "error",
    });
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  receiptNoteToDelete.value = null;
};

// Handle shortfall items - save as open PO
const handleSaveAsOpenPO = async () => {
  showShortfallModal.value = false;
  
  // Save the receipt note normally (as open PO) - this will update PO status to Partially_Received
  if (pendingReceiptNoteSave.value) {
    await pendingReceiptNoteSave.value();
    pendingReceiptNoteSave.value = null;
  } else {
    await performSaveReceiptNote(true, false, false); // Pass true to indicate saving as open PO, false for openNewForm
  }
  
  shortfallItemsForModal.value = [];
};

// Handle shortfall items - raise return note
const handleRaiseReturnNote = async () => {
  showShortfallModal.value = false;
  
  const shortfallItems = shortfallItemsForModal.value;
  if (!shortfallItems || shortfallItems.length === 0) {
    return;
  }

  shortfallItemsForReturn.value = shortfallItems;

  // Get the receipt note data to use as reference
  const receiptData = receiptNoteForm.value;
  const corpUuid = corporationStore.selectedCorporationId;
  
  if (!corpUuid) {
    const toast = useToast();
    toast.add({
      title: "Select Corporation",
      description: "Please select a corporation before creating return note.",
      color: "error",
    });
    return;
  }

  // First, save the receipt note as open PO (suppress toast - we'll show combined message later)
  // Pass raiseReturnNoteForShortfall flag to indicate we're raising a return note for shortfall
  try {
    await performSaveReceiptNote(true, true, false, true); // Save as open PO, suppress toast, false for openNewForm, true for raiseReturnNoteForShortfall
  } catch (error: any) {
    console.error("[ReceiptNoteList] Failed to save receipt note:", error);
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to save receipt note. Return note was not created.",
      color: "error",
    });
    return;
  }

  // Now automatically create the return note
  try {
    // Generate next return number
    await stockReturnNotesStore.fetchStockReturnNotes(corpUuid, false, 1, 100);
    const returnNumber = stockReturnNotesStore.generateNextReturnNumber(corpUuid);

    // Prepare return note items from shortfall items
    const returnItems = shortfallItems.map((item: any) => {
      const returnType = receiptData.receipt_type || 'purchase_order';
      const orderedQty = item.ordered_quantity || item.po_quantity || 0;
      
      return {
        base_item_uuid: item.uuid || item.base_item_uuid || null,
        cost_code_uuid: item.cost_code_uuid || null,
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
        item_type_uuid: item.item_type_uuid || null,
        item_type_code: item.item_type_code || null,
        item_type_label: item.item_type_label || null,
        // Use PO/CO line UUID for return-note linkage so completion checks
        // (which key off purchase_order_items_list/change_order_items_list.uuid) can reconcile quantities.
        item_uuid: item.uuid || item.base_item_uuid || item.item_uuid || null,
        item_name: item.item_name || '',
        description: item.description || '',
        model_number: item.model_number || '',
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
        unit_price: item.unit_price || 0,
        // Set ordered quantity based on return type
        ordered_quantity: orderedQty,
        po_quantity: returnType === 'purchase_order' ? orderedQty : null,
        co_quantity: returnType === 'change_order' ? orderedQty : null,
        return_quantity: item.shortfall_quantity, // The shortfall quantity
        return_total: item.shortfall_quantity * (item.unit_price || 0),
        location_uuid: item.location_uuid || null,
        location_label: item.location_label || null,
        sequence_label: item.sequence_label || null,
      };
    });

    // Calculate total return amount
    const totalReturnAmount = returnItems.reduce((sum: number, item: any) => {
      return sum + (item.return_total || 0);
    }, 0);

    // Determine return type based on receipt type
    const returnType = receiptData.receipt_type || 'purchase_order';
    const purchaseOrderUuid = returnType === 'purchase_order' ? receiptData.purchase_order_uuid : null;
    const changeOrderUuid = returnType === 'change_order' ? receiptData.change_order_uuid : null;

    // Create return note payload
    const returnNotePayload = {
      return_number: returnNumber,
      entry_date: receiptData.entry_date || toUTCString(getCurrentLocal()),
      return_type: returnType,
      purchase_order_uuid: purchaseOrderUuid,
      change_order_uuid: changeOrderUuid,
      project_uuid: receiptData.project_uuid || null,
      returned_by: receiptData.received_by || null,
      location_uuid: receiptData.location_uuid || null,
      notes: `Return note for shortfall quantities from receipt note ${receiptData.grn_number || ''}`,
      status: 'Returned',
      return_items: returnItems,
      total_return_amount: totalReturnAmount,
      attachments: [],
      corporation_uuid: corpUuid,
      has_excluded_source_items: receiptData.has_excluded_source_items === true,
    };

    // Check if form's corporation matches TopBar's selected corporation
    const topBarCorpUuid = corporationStore.selectedCorporationId;
    const shouldUpdateStore = corpUuid && topBarCorpUuid && corpUuid === topBarCorpUuid;

    // Create the return note automatically
    let createdReturnNote;
    if (shouldUpdateStore) {
      // Form's corporation matches TopBar's selected corporation - update store and IndexedDB
      createdReturnNote = await stockReturnNotesStore.createStockReturnNote(returnNotePayload);
    } else {
      // Form's corporation is different - just call API directly (bypass store/IndexedDB)
      const response = await $fetch("/api/stock-return-notes", {
        method: "POST",
        body: returnNotePayload,
      });
      createdReturnNote = (response as any)?.data ?? response ?? null;
    }

    // Refresh purchase order or change order if needed
    if (returnType === 'purchase_order' && purchaseOrderUuid && shouldUpdateStore && topBarCorpUuid) {
      try {
        const updatedPO = await purchaseOrdersStore.fetchPurchaseOrder(purchaseOrderUuid);
        if (updatedPO) {
          purchaseOrdersStore.updatePurchaseOrderInList(updatedPO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh purchase order:", refreshError);
      }
    }

    if (returnType === 'change_order' && changeOrderUuid && shouldUpdateStore && topBarCorpUuid) {
      try {
        const updatedCO = await changeOrdersStore.fetchChangeOrder(changeOrderUuid);
        if (updatedCO) {
          changeOrdersStore.updateChangeOrderInList(updatedCO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh change order:", refreshError);
      }
    }

    // Refresh return notes store if needed
    if (shouldUpdateStore && topBarCorpUuid) {
      await stockReturnNotesStore.fetchStockReturnNotes(topBarCorpUuid, true, 1, 100);
    }

    // Fetch return note items to ensure they're available
    if (createdReturnNote?.uuid) {
      try {
        await $fetch("/api/return-note-items", {
          method: "GET",
          query: {
            corporation_uuid: corpUuid,
            project_uuid: returnNotePayload.project_uuid || undefined,
            return_note_uuid: createdReturnNote.uuid,
            item_type: returnType,
          },
        });
      } catch (error) {
        console.warn("[ReceiptNoteList] Failed to fetch return note items after creation:", error);
      }
    }

    // Show success message
    const toast = useToast();
    toast.add({
      title: "Success",
      description: "Receipt note saved and return note created successfully.",
      color: "success",
    });

    // Clear shortfall state
    shortfallItemsForModal.value = [];
    shortfallItemsForReturn.value = [];
    
    // Close the receipt note form modal
    closeFormModal();
  } catch (error: any) {
    console.error("[ReceiptNoteList] Failed to create return note:", error);
    const toast = useToast();
    let errorDescription = 'Failed to create return note.';
    
    if (error?.statusMessage) {
      errorDescription = error.statusMessage;
    } else if (error?.message) {
      errorDescription = error.message;
    }
    
    toast.add({
      title: "Error",
      description: errorDescription,
      color: "error",
    });
  }
};

// Save return note from shortfall
const saveReturnNoteFromShortfall = async () => {
  if (savingReturnNote.value) return;
  
  // Use form's corporation_uuid (not TopBar's selectedCorporationId)
  // This allows the form to operate independently with its own corporation selection
  const formCorpUuid = returnNoteFormData.value?.corporation_uuid;
  const topBarCorpUuid = corporationStore.selectedCorporationId;
  
  // Use form's corporation_uuid if available, otherwise fall back to TopBar's selected corporation
  const corpUuid = formCorpUuid || topBarCorpUuid;
  
  if (!corpUuid) {
    const toast = useToast();
    toast.add({
      title: "Select Corporation",
      description: "Please select a corporation before saving.",
      color: "error",
    });
    return;
  }

  // Check if form's corporation matches TopBar's selected corporation
  // Only update store/IndexedDB if they match, otherwise just call API directly
  const shouldUpdateStore = formCorpUuid && topBarCorpUuid && formCorpUuid === topBarCorpUuid;

  // Check for validation errors
  if (returnNoteFormRef.value?.hasValidationError) {
    const toast = useToast();
    toast.add({
      title: "Validation Error",
      description: returnNoteFormRef.value.combinedValidationError || returnNoteFormRef.value.receiptNotesValidationError || "Cannot save return note due to validation errors.",
      color: "error",
    });
    return;
  }

  savingReturnNote.value = true;
  try {
    // Wait for any pending form updates to propagate
    await nextTick();
    
    // Get the latest form data from returnNoteFormData (which is bound via v-model)
    // This ensures we have the most up-to-date data including any changes made in ReturnNoteItemsTable
    // Read directly from returnNoteFormData.value right before using it to ensure we have the latest data
    const latestFormData = returnNoteFormData.value;
    if (!latestFormData) {
      throw new Error("Return note form data is not available");
    }
    
    const formData = { ...latestFormData };
    
    // Ensure return_items are included - get from formData which should be synced via v-model
    let returnItems = formData.return_items || [];
    
    // Calculate total return amount from return items
    let totalReturnAmount = formData.total_return_amount;
    
    if (totalReturnAmount === undefined || totalReturnAmount === null) {
      totalReturnAmount = returnItems.reduce((sum: number, item: any) => {
        const returnTotal = parseFloat(String(item.return_total || 0)) || 0;
        return sum + returnTotal;
      }, 0);
      totalReturnAmount = Math.round((totalReturnAmount + Number.EPSILON) * 100) / 100;
      formData.total_return_amount = totalReturnAmount;
    }

    // Ensure return_type is set
    const returnType = formData.return_type || 'purchase_order';
    formData.return_type = returnType;

    // Always set status to "Returned" - never save "Waiting" status
    formData.status = "Returned";

    // Clear the opposite UUID column based on return_type
    if (returnType === 'change_order') {
      formData.purchase_order_uuid = null;
    } else {
      formData.change_order_uuid = null;
    }

    const payload = {
      ...formData,
      corporation_uuid: corpUuid,
      return_items: returnItems,
    };

    let createdReturnNote;
    if (shouldUpdateStore) {
      // Form's corporation matches TopBar's selected corporation - update store and IndexedDB
      createdReturnNote = await stockReturnNotesStore.createStockReturnNote(payload);
    } else {
      // Form's corporation is different - just call API directly (bypass store/IndexedDB)
      const response = await $fetch("/api/stock-return-notes", {
        method: "POST",
        body: payload,
      });
      createdReturnNote = (response as any)?.data ?? response ?? null;
    }
    
    // The API updates the PO/CO status when the return note is created
    // The API awaits the PO/CO update before returning, so the status should be updated by now
    // But we'll refresh the PO/CO to ensure we have the latest data
    
    // Refresh the specific purchase order if status was updated to Completed
    // This happens after the return note is saved, which means the API has finished
    // updating the PO status (the API awaits the PO update before returning)
    // Use formData (the payload sent to API) instead of returnNoteFormData.value to ensure we have the correct UUIDs
    // Only refresh if form's corporation matches TopBar's selected corporation
    if (returnType === 'purchase_order' && formData.purchase_order_uuid && shouldUpdateStore && topBarCorpUuid) {
      try {
        // Fetch only the specific purchase order that was updated
        const updatedPO = await purchaseOrdersStore.fetchPurchaseOrder(formData.purchase_order_uuid);
        if (updatedPO) {
          // Use store method to update the purchase order in the list (ensures proper reactivity)
          purchaseOrdersStore.updatePurchaseOrderInList(updatedPO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh purchase order:", refreshError);
        // Don't fail the operation, just log the error
      }
    }

    // Refresh the specific change order if status was updated to Completed
    // This happens after the return note is saved, which means the API has finished
    // updating the CO status (the API awaits the CO update before returning)
    // Use formData (the payload sent to API) instead of returnNoteFormData.value to ensure we have the correct UUIDs
    // Only refresh if form's corporation matches TopBar's selected corporation
    if (returnType === 'change_order' && formData.change_order_uuid && shouldUpdateStore && topBarCorpUuid) {
      try {
        // Fetch only the specific change order that was updated
        const updatedCO = await changeOrdersStore.fetchChangeOrder(formData.change_order_uuid);
        if (updatedCO) {
          // Use store method to update the change order in the list (ensures proper reactivity)
          changeOrdersStore.updateChangeOrderInList(updatedCO);
        }
      } catch (refreshError) {
        console.error("[ReceiptNoteList] Failed to refresh change order:", refreshError);
        // Don't fail the operation, just log the error
      }
    }
    
    // Only refresh return notes store if form's corporation matches TopBar's selected corporation
    // This ensures we don't unnecessarily fetch data for a different corporation
    if (shouldUpdateStore && topBarCorpUuid) {
      // Refresh return notes store to ensure the new return note is available for shortfall checking
      // Force refresh to get the latest data including the return note items
      await stockReturnNotesStore.fetchStockReturnNotes(topBarCorpUuid, true, 1, 100);
    }
    
    // Also fetch return note items to ensure they're available for the shortfall check
    // This ensures the return note items are in the database and can be queried
    if (createdReturnNote?.uuid) {
      try {
        await $fetch("/api/return-note-items", {
          method: "GET",
          query: {
            corporation_uuid: corpUuid,
            project_uuid: formData.project_uuid || undefined,
            return_note_uuid: createdReturnNote.uuid,
            item_type: formData.return_type || 'purchase_order',
          },
        });
      } catch (error) {
        // Continue even if this fails - the main fetch should have worked
        console.warn("[ReceiptNoteList] Failed to fetch return note items after creation:", error);
      }
    }
    
    const toast = useToast();
    toast.add({
      title: "Created",
      description: "Return note created successfully.",
      color: "success",
    });

    // Close return note modal
    closeReturnNoteModal();

    // Ensure shortfall modal is closed and clear state
    showShortfallModal.value = false;
    shortfallItemsForModal.value = [];
    shortfallItemsForReturn.value = [];
    
    // Now save the receipt note as open PO
    // The shortfall check should now filter out items that have return notes
    // and show only the remaining shortfall quantities
    if (pendingReceiptNoteSave.value) {
      await pendingReceiptNoteSave.value();
      pendingReceiptNoteSave.value = null;
    } else {
      await performSaveReceiptNote(false, false, false); // Normal save, no suppress toast, false for openNewForm
    }
  } catch (error: any) {
    console.error("[ReceiptNoteList] save return note error", error);
    const toast = useToast();
    toast.add({
      title: "Error",
      description: error?.message || "Failed to save return note.",
      color: "error",
    });
  } finally {
    savingReturnNote.value = false;
  }
};

// Close return note modal
const closeReturnNoteModal = () => {
  showReturnNoteModal.value = false;
  returnNoteFormData.value = null;
  shortfallItemsForReturn.value = [];
};

// Close shortfall modal
const closeShortfallModal = () => {
  showShortfallModal.value = false;
  pendingReceiptNoteSave.value = null;
  shortfallItemsForModal.value = [];
};

const toggleStatusFilter = (status: string) => {
  if (selectedStatusFilter.value === status) {
    selectedStatusFilter.value = null;
  } else {
    selectedStatusFilter.value = status;
  }
  resetTablePage();
};

const clearStatusFilter = () => {
  selectedStatusFilter.value = null;

  const preservedCorporation = filterCorporation.value;

  filterProject.value = undefined;
  filterVendor.value = undefined;
  filterLocation.value = undefined;
  filterCategory.value = undefined;
  filterDivision.value = undefined;
  filterItemType.value = undefined;
  filterDateFrom.value = undefined;
  filterDateTo.value = undefined;

  appliedFilters.value = {
    corporation: preservedCorporation,
    project: undefined,
    vendor: undefined,
    location: undefined,
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  };

  const corporationUuid = preservedCorporation || selectedCorporationId.value;
  if (corporationUuid) {
    stockReceiptNotesStore.fetchStockReceiptNotes(corporationUuid, {
      force: true,
      useIndexedDB: false,
    });
  }

  resetTablePage();
};

// Filter handlers
// Fetch receipt notes from API with filters applied to get all matching records from DB
const handleShowResults = async () => {
  appliedFilters.value = {
    corporation: filterCorporation.value,
    project: filterProject.value,
    vendor: filterVendor.value,
    location: filterLocation.value,
    category: filterCategory.value,
    division: filterDivision.value,
    itemType: filterItemType.value,
    dateFrom: filterDateFrom.value,
    dateTo: filterDateTo.value,
  };

  const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value;
  if (corporationUuid) {
    await stockReceiptNotesStore.fetchStockReceiptNotes(corporationUuid, {
      force: true,
      useIndexedDB: false,
      filters: buildStockReceiptApiListFilters(),
    });
  }

  resetTablePage();
};

const handleClearFilters = () => {
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined);

  filterCorporation.value = preservedCorporationUuid;

  filterProject.value = undefined;
  filterVendor.value = undefined;
  filterLocation.value = undefined;
  filterCategory.value = undefined;
  filterDivision.value = undefined;
  filterItemType.value = undefined;
  filterDateFrom.value = undefined;
  filterDateTo.value = undefined;

  appliedFilters.value = {
    corporation: preservedCorporationUuid,
    project: undefined,
    vendor: undefined,
    location: undefined,
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  };

  const corporationUuid = preservedCorporationUuid || selectedCorporationId.value;
  if (corporationUuid) {
    stockReceiptNotesStore.fetchStockReceiptNotes(corporationUuid, {
      force: true,
      useIndexedDB: false,
    });
  }

  resetTablePage();
};

const handleApplyDrawerFilters = () => {
  isFilterDrawerOpen.value = false;
  handleShowResults();
};

const handleClearDrawerFilters = () => {
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined);

  filterCorporation.value = preservedCorporationUuid;

  filterProject.value = undefined;
  filterVendor.value = undefined;
  filterLocation.value = undefined;
  filterCategory.value = undefined;
  filterDivision.value = undefined;
  filterItemType.value = undefined;
  filterDateFrom.value = undefined;
  filterDateTo.value = undefined;
};

const handlePageSizeChange = () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageSize(pagination.value.pageSize);
  }
};

const resetTablePage = () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0);
  }
};

// Scope receipt-note APIs to this screen: load data only when this component is active.
watch(selectedCorporationId, (newCorpUuid) => {
  if (newCorpUuid) {
    void Promise.resolve(stockReceiptNotesStore.fetchStockReceiptNotes(newCorpUuid, {
      force: false,
      page: 1,
      pageSize: 100,
    })).catch(() => {});
    void Promise.resolve(vendorStore.fetchVendors(newCorpUuid)).catch(() => {});
    void Promise.resolve(userProfilesStore.fetchUsers(false)).catch(() => {});
    void Promise.resolve(projectsStore.fetchProjectsMetadata(newCorpUuid)).catch(() => {});
    void Promise.resolve(purchaseOrdersStore.fetchPurchaseOrders(newCorpUuid)).catch(() => {});
    void Promise.resolve(changeOrdersStore.fetchChangeOrders(newCorpUuid)).catch(() => {});
  }
}, { immediate: true });

watch(globalFilter, () => {
  resetTablePage();
});

watch(
  () => pagination.value.pageSize,
  (newSize) => {
    if (table.value?.tableApi) {
      table.value.tableApi.setPageSize(newSize);
    }
  }
);

// Watch modal close to ensure cleanup happens regardless of how it's closed
// (ESC key, click outside modal, or clicking X button)
watch(showFormModal, (isOpen, wasOpen) => {
  // If modal just closed, ensure cleanup happens
  if (wasOpen && !isOpen) {
    purchaseOrderResourcesStore.clear();
    isViewMode.value = false;
  }
});

onMounted(() => {
  receiptNoteForm.value = createEmptyForm();
  
  if (!filterCorporation.value && selectedCorporationId.value) {
    filterCorporation.value = selectedCorporationId.value
  }

  if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
    locationsStore.fetchLocations().catch(() => {});
  }
});

watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations();
  }
});

// Watch for changes in selectedCorporationId to update filter if not manually set
watch(selectedCorporationId, (newId) => {
  // Only update filter if it's not manually set by user
  if (!filterCorporation.value && newId) {
    filterCorporation.value = newId
  }
});
</script>
