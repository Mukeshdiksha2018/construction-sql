<template>
  <div class="h-[88vh] print:h-auto">
    <!-- Header section - hidden in print -->
    <div class="mb-2 print:hidden">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <!-- Left side: Back button -->
        <div class="flex items-center gap-3">
          <UButton
            color="neutral"
            variant="solid"
            icon="i-heroicons-arrow-left"
            @click="goBack"
          />
        </div>

        <!-- Right side: Corporation, Project, Vendor Selection, Date Range, Show and Print buttons -->
        <div class="flex items-end gap-3 flex-wrap">
          <!-- Corporation Select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Corporation <span class="text-red-500">*</span>
            </label>
            <CorporationSelect
              v-model="selectedCorporationId"
              size="sm"
              class="w-64"
              @change="handleCorporationChangeFromSelect"
            />
          </div>

          <!-- Project Select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Project <span class="text-red-500">*</span>
            </label>
            <ProjectSelect
              :model-value="selectedProjectId"
              :corporation-uuid="selectedCorporationId || undefined"
              placeholder="Select project"
              size="sm"
              class="w-64"
              @update:model-value="handleProjectChange"
            />
          </div>

          <!-- Vendor Select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Vendor
            </label>
            <VendorSelect
              v-model="selectedVendorId"
              :corporation-uuid="selectedCorporationId || undefined"
              placeholder="All vendors"
              size="sm"
              class="w-64"
              @update:model-value="handleVendorChange"
            />
          </div>

          <!-- View Transactions (quick range) -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              View Transactions
            </label>
            <USelectMenu
              v-model="selectedTransactionRange"
              :items="transactionRangeOptions"
              placeholder="Select range"
              value-key="value"
              size="sm"
              class="w-56"
            />
          </div>

          <!-- Start Date -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Start Date <span class="text-red-500">*</span>
            </label>
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                icon="i-heroicons-calendar"
                size="sm"
                variant="outline"
                class="w-48"
              >
                {{ startDateDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="startDateValue"
                  :min-value="undefined"
                  :max-value="endDateValue || undefined"
                  class="p-2"
                />
              </template>
            </UPopover>
          </div>

          <!-- End Date -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              End Date <span class="text-red-500">*</span>
            </label>
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                icon="i-heroicons-calendar"
                size="sm"
                variant="outline"
                class="w-48"
              >
                {{ endDateDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="endDateValue"
                  :min-value="startDateValue || undefined"
                  :max-value="undefined"
                  class="p-2"
                />
              </template>
            </UPopover>
          </div>

          <!-- Stacked Advanced + Show buttons -->
          <div class="flex-shrink-0 flex flex-col gap-2">
            <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filters" description="Configure report filters.">
              <UButton
                icon="i-heroicons-funnel-solid"
                color="neutral"
                variant="solid"
                size="sm"
                class="w-full"
              >
                Advanced
              </UButton>

              <template #body>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Corporation -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Corporation <span class="text-red-500">*</span></label>
                    <CorporationSelect
                      v-model="selectedCorporationId"
                      size="sm"
                      class="w-full"
                      @change="handleCorporationChangeFromSelect"
                    />
                  </div>

                  <!-- Project -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Project <span class="text-red-500">*</span></label>
                    <ProjectSelect
                      :model-value="selectedProjectId"
                      :corporation-uuid="selectedCorporationId || undefined"
                      placeholder="Select project"
                      size="sm"
                      class="w-full"
                      :disabled="!selectedCorporationId"
                      @update:model-value="handleProjectChange"
                    />
                  </div>

                  <!-- Start Date -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Start Date <span class="text-red-500">*</span></label>
                    <UPopover :popper="{ placement: 'bottom-start' }">
                      <UButton icon="i-heroicons-calendar" size="sm" variant="outline" class="w-full justify-start">
                        {{ startDateDisplayText }}
                      </UButton>
                      <template #content>
                        <UCalendar v-model="startDateValue" :min-value="undefined" :max-value="endDateValue || undefined" class="p-2" />
                      </template>
                    </UPopover>
                  </div>

                  <!-- End Date -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">End Date <span class="text-red-500">*</span></label>
                    <UPopover :popper="{ placement: 'bottom-start' }">
                      <UButton icon="i-heroicons-calendar" size="sm" variant="outline" class="w-full justify-start">
                        {{ endDateDisplayText }}
                      </UButton>
                      <template #content>
                        <UCalendar v-model="endDateValue" :min-value="startDateValue || undefined" :max-value="undefined" class="p-2" />
                      </template>
                    </UPopover>
                  </div>

                  <!-- Vendor -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                    <VendorSelect
                      v-model="selectedVendorId"
                      :corporation-uuid="selectedCorporationId || undefined"
                      placeholder="All Vendors"
                      size="sm"
                      class="w-full"
                      :disabled="!selectedCorporationId"
                    />
                  </div>

                  <!-- Location -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <LocationSelect
                      v-model="drawerLocation"
                      placeholder="All Locations"
                      size="sm"
                      class-name="w-full"
                    />
                  </div>

                  <!-- Item Category -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Category</label>
                    <ItemCategorySelect
                      v-model="drawerCategory"
                      placeholder="All Categories"
                      size="sm"
                      class-name="w-full"
                      :disabled="!selectedCorporationId"
                    />
                  </div>

                  <!-- Item Division -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Division</label>
                    <ItemDivisionSelect
                      v-model="drawerDivision"
                      :corporation-uuid="selectedCorporationId || undefined"
                      :category="drawerCategory || ''"
                      placeholder="All Divisions"
                      size="sm"
                      class-name="w-full"
                      :disabled="!selectedCorporationId"
                      :show-add-button="false"
                    />
                  </div>

                  <!-- Item Type -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Type</label>
                    <ItemTypeSelect
                      v-model="drawerItemType"
                      :corporation-uuid="selectedCorporationId || undefined"
                      :project-uuid="selectedProjectId || undefined"
                      :category="drawerCategory || undefined"
                      :item-division-uuid="drawerDivision || undefined"
                      placeholder="All Types"
                      size="sm"
                      class-name="w-full"
                      :disabled="!selectedCorporationId"
                      variant="outline"
                    />
                  </div>
                </div>
              </template>

              <template #footer>
                <div class="flex items-center justify-end gap-2">
                  <UButton color="neutral" variant="outline" size="sm" @click="handleClearDrawerFilters">
                    Clear All
                  </UButton>
                  <UButton color="primary" size="sm" @click="handleApplyDrawerFilters">
                    Apply Filters
                  </UButton>
                </div>
              </template>
            </UDrawer>

            <UButton
              :disabled="!canGenerateReport"
              color="primary"
              variant="solid"
              size="sm"
              class="w-full"
              @click="handleShowReport"
            >
              Show
            </UButton>

            <UButton
              v-if="selectedCorporationId && selectedProjectId && filteredReportData && filteredReportData.data && filteredReportData.data.length > 0"
              icon="i-heroicons-arrow-down-tray"
              variant="soft"
              size="sm"
              class="w-full"
              @click="exportReportToCsv"
            >
              Export CSV
            </UButton>

            <UButton
              v-if="selectedCorporationId && selectedProjectId && filteredReportData && filteredReportData.data && filteredReportData.data.length > 0"
              icon="i-heroicons-printer"
              variant="soft"
              size="sm"
              class="w-full"
              @click="printReport"
            >
              Print
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Header - only visible in print -->
    <div class="hidden print:block print:mb-4 print:pb-4 print:border-b print:border-gray-300">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">PO Wise Stock Report</h1>
        <div v-if="selectedCorporationId && selectedProjectId" class="text-sm text-gray-700">
          <p class="font-semibold">Project: {{ getProjectName() }}</p>
          <p v-if="selectedVendorId" class="text-xs text-gray-600 mt-1">
            Vendor: {{ getVendorName() }}
          </p>
          <p v-if="startDateValue && endDateValue" class="text-xs text-gray-600 mt-1">
            Date Range: {{ startDateDisplayText }} to {{ endDateDisplayText }}
          </p>
          <p class="text-xs text-gray-600 mt-1">Generated on: {{ new Date().toLocaleDateString() }}</p>
        </div>
      </div>
    </div>

    <!-- Report Content Area -->
    <div class="p-4 print:p-2">
      <div v-if="!selectedCorporationId" class="text-center py-12">
        <UIcon name="i-heroicons-building-office" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a corporation to view the PO-wise stock report</p>
      </div>
      <div v-else-if="!selectedProjectId" class="text-center py-12">
        <UIcon name="i-heroicons-folder" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a project to view the PO-wise stock report</p>
      </div>
      <div v-else-if="selectedCorporationId && selectedProjectId && (!startDateValue || !endDateValue)" class="text-center py-12">
        <UIcon name="i-heroicons-calendar" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select start date and end date to generate the report</p>
      </div>
      <div v-else-if="loading" class="space-y-3">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th v-for="i in 20" :key="i" class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200 dark:border-gray-700">
                <td v-for="j in 20" :key="j" class="py-1 px-2 text-default text-xs">
                  <USkeleton class="h-3 w-20" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="error && error !== null && error !== ''" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto text-red-400 mb-4" />
        <p class="text-red-500 text-lg">{{ error }}</p>
      </div>
      <div v-else-if="filteredReportData && filteredReportData.data && filteredReportData.data.length > 0" class="space-y-6">
        <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 print:text-2xl print:text-gray-900">
          PO Wise Stock Report
        </h1>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs print:text-sm">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Category</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Division</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Type</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Spec</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Name</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Description</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Vendor</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Cost Code</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Location</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">PO Number</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">PO Date</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Ordered Quantity</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Received Quantity</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Returned Quantity</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Invoice Number</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Invoice Date</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Status</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Unit Cost</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">UOM</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="po in filteredReportData.data" :key="po.uuid">
                <!-- PO Header -->
                <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-400 dark:border-gray-600">
                  <td class="py-2 px-2 font-bold text-xs text-default" colspan="20">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-semibold">PO Number:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.po_number }}</span>
                      </div>
                      <div class="flex-1 text-center">
                        <span class="font-semibold">Vendor:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.vendor_name || 'N/A' }}</span>
                      </div>
                      <div>
                        <span class="font-semibold">PO Date:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ formatPoDate(po.po_date) }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- PO Items -->
                <template v-if="po.items && po.items.length > 0">
                  <tr
                    v-for="(item, index) in po.items"
                    :key="index"
                    class="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td class="py-1 px-2 text-default text-xs">{{ resolveCategory(item) }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ resolveDivisionName(item) }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ resolveItemTypeName(item) }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.itemCode }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.itemName }}</td>
                    <td class="py-1 px-2 text-default text-xs whitespace-pre-line">{{ getDescriptionPlainText(item.description) }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.vendorSource || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.costCode || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ resolveLocationName(item) }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.poNumber || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ formatPoDate(item.poDate) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ formatNumber(item.orderedQuantity) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ formatNumber(item.receivedQuantity) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ formatNumber(item.returnedQuantity) }}</td>
                    <td class="py-1 px-2 text-default text-xs">
                      {{ item.invoiceNumbers && item.invoiceNumbers.length > 0 ? item.invoiceNumbers.join(', ') : '-' }}
                    </td>
                    <td class="py-1 px-2 text-default text-xs">
                      {{ item.invoiceDates && item.invoiceDates.length > 0 ? item.invoiceDates.map(d => formatInvoiceDate(d)).join(', ') : '-' }}
                    </td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.status || '-' }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ formatCurrency(item.unitCost) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ item.uom || '-' }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">{{ formatCurrency(item.totalValue) }}</td>
                  </tr>
                </template>
                <tr v-else class="border-b border-gray-200 dark:border-gray-700">
                  <td class="py-2 px-2 text-muted text-xs italic" colspan="20">No items found for this purchase order</td>
                </tr>
                
                <!-- PO Total Row -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default font-bold" colspan="11">
                    Total
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(po.totals.orderedQuantity) }}</td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(po.totals.receivedQuantity) }}</td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(po.totals.returnedQuantity) }}</td>
                  <td class="py-2 px-2 text-xs text-default" colspan="3"></td>
                  <td class="py-2 px-2 text-right text-xs text-default"></td>
                  <td class="py-2 px-2 text-right text-xs text-default"></td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatCurrency(po.totals.totalValue) }}</td>
                </tr>
                
                <!-- Spacer row between POs -->
                <tr>
                  <td class="py-2" colspan="20"></td>
                </tr>
              </template>
              
              <!-- Grand Total Row -->
              <tr class="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-500 dark:border-gray-500 font-bold">
                <td class="py-2 px-2 text-xs text-default font-bold" colspan="11">
                  Grand Total
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(filteredTotals.orderedQuantity) }}</td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(filteredTotals.receivedQuantity) }}</td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(filteredTotals.returnedQuantity) }}</td>
                <td class="py-2 px-2 text-xs text-default" colspan="3"></td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatCurrency(filteredTotals.totalValue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!filteredReportData || !filteredReportData.data || filteredReportData.data.length === 0)" class="text-center py-12">
        <UIcon name="i-heroicons-archive-box" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">No purchase order items found for this project</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
import dayjs from 'dayjs'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useLocationsStore } from '~/stores/locations'
import { useItemDivisionsStore } from '~/stores/itemDivisions'
import { useItemTypesStore } from '~/stores/itemTypes'
import { usePOWiseStockReport } from '~/composables/usePOWiseStockReport'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useDateFormat } from '~/composables/useDateFormat'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemDivisionSelect from '~/components/shared/ItemDivisionSelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import type { POWiseStockReportData, POWiseStockReportItem } from '~/composables/usePOWiseStockReport'
import { stripHtmlToPlainText } from '~/utils/getDescriptionPreviewHtml'
import { downloadCsvFile } from '~/utils/csvExport'

const getDescriptionPlainText = (value: unknown) => {
  const text = stripHtmlToPlainText(String(value || ''))
  return text || '-'
}

const router = useRouter()

const goBack = () => {
  router.back()
}

useHead({
  title: 'PO Wise Stock Report - Property Management'
})

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

// Stores
const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const locationsStore = useLocationsStore()
const itemDivisionsStore = useItemDivisionsStore()
const itemTypesStore = useItemTypesStore()
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = Boolean(runtimeConfig.public.nimbleIntegrations)
const { corporationId: nimbleCorporationIdFromUrl } = useNimbleContext()

// State
const selectedCorporationId = ref<string | undefined>(undefined)
const selectedProjectId = ref<string | undefined>(undefined)
const selectedVendorId = ref<string | undefined>(undefined)
const selectedTransactionRange = ref<string>('YEAR_TO_DATE')

// Advanced filter drawer
const isFilterDrawerOpen = ref(false)
const drawerLocation = ref<string | undefined>(undefined)
const drawerCategory = ref<string | undefined>(undefined)
const drawerDivision = ref<string | undefined>(undefined)
const drawerItemType = ref<string | undefined>(undefined)

const appliedAdvancedFilters = ref({
  location: undefined as string | undefined,
  category: undefined as string | undefined,
  division: undefined as string | undefined,
  itemType: undefined as string | undefined,
})

// Date range state
const currentYear = new Date().getFullYear()
const startDateValue = ref<CalendarDate | null>(
  new CalendarDate(currentYear, 1, 1)
)
const endDateValue = ref<CalendarDate | null>(today(getLocalTimeZone()))
const transactionRangeOptions = [
  { label: 'Year to date', value: 'YEAR_TO_DATE' },
  { label: 'Month to date', value: 'MONTH_TO_DATE' },
  { label: 'Week to date', value: 'WEEK_TO_DATE' },
  { label: 'Last year', value: 'LAST_YEAR' },
]

const { fromUTCString } = useUTCDateFormat()

const toCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const applyTransactionRange = (range: string) => {
  const now = new Date()
  const today = toCalendarDate(now)

  if (range === 'YEAR_TO_DATE') {
    startDateValue.value = new CalendarDate(now.getFullYear(), 1, 1)
    endDateValue.value = today
    return
  }
  if (range === 'MONTH_TO_DATE') {
    startDateValue.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)
    endDateValue.value = today
    return
  }
  if (range === 'WEEK_TO_DATE') {
    const start = new Date(now)
    const dayOfWeek = start.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    start.setDate(start.getDate() - daysFromMonday)
    startDateValue.value = toCalendarDate(start)
    endDateValue.value = today
    return
  }
  if (range === 'LAST_YEAR') {
    const lastYear = now.getFullYear() - 1
    startDateValue.value = new CalendarDate(lastYear, 1, 1)
    endDateValue.value = new CalendarDate(lastYear, 12, 31)
  }
}

const startDateDisplayText = computed(() => {
  if (!startDateValue.value) return 'Select start date'
  return startDateValue.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
})

const endDateDisplayText = computed(() => {
  if (!endDateValue.value) return 'Select end date'
  return endDateValue.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
})

const canGenerateReport = computed(() => {
  return !!(
    selectedCorporationId.value &&
    selectedProjectId.value &&
    startDateValue.value &&
    endDateValue.value &&
    startDateValue.value.compare(endDateValue.value) <= 0
  )
})

// PO Wise Stock Report
const poWiseStockReport = usePOWiseStockReport()
const { formatCurrency } = useCurrencyFormat()
const { formatDate: formatDateUtil } = useDateFormat()
const reportData = ref<POWiseStockReportData | null>(null)

const loading = computed(() => poWiseStockReport.loading.value)
const error = computed(() => poWiseStockReport.error.value)

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const formatPoDate = (date: string | null | undefined): string => {
  if (!date || date === 'NA') return '-'
  try {
    // PO entry dates are UTC timestamps and should use UTC-safe conversion.
    return formatDateUtil(String(date).trim())
  } catch {
    return '-'
  }
}

const formatInvoiceDate = (date: string | null | undefined): string => {
  if (!date || date === 'NA') return '-'
  try {
    const raw = String(date).trim()
    if (raw.includes('T')) {
      // Vendor invoice bill_date is stored in UTC; convert like form display.
      const localYmd = fromUTCString(raw)
      const localFormatted = formatPoDate(localYmd)
      if (localFormatted !== '-') return localFormatted
    }

    const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
    if (datePrefixMatch?.[1]) {
      return formatPoDate(datePrefixMatch[1])
    }
    return formatPoDate(raw)
  } catch {
    return '-'
  }
}

// Resolution helpers
const resolveCategory = (item: POWiseStockReportItem): string => {
  if (item.category) return item.category
  if (item.itemTypeUuid) {
    const it = itemTypesStore.getItemTypeById(item.itemTypeUuid)
    if (it?.category) return it.category
  }
  return '-'
}

const resolveDivisionName = (item: POWiseStockReportItem): string => {
  if (item.divisionName) return item.divisionName
  const divUuid = item.divisionUuid || (item.itemTypeUuid ? itemTypesStore.getItemTypeById(item.itemTypeUuid)?.item_division_uuid : undefined)
  if (divUuid) {
    const div = itemDivisionsStore.itemDivisions?.find((d: any) => d.uuid === divUuid)
    if (div?.item_division_name) return div.item_division_name
  }
  return '-'
}

const resolveItemTypeName = (item: POWiseStockReportItem): string => {
  if (item.itemTypeName) return item.itemTypeName
  if (item.itemTypeUuid) {
    const it = itemTypesStore.getItemTypeById(item.itemTypeUuid)
    if (it?.item_type) return it.item_type
  }
  return '-'
}

const resolveLocationName = (item: POWiseStockReportItem): string => {
  if (item.locationUuid) {
    const loc = locationsStore.getByUuid?.(item.locationUuid)
    if (loc?.location_name) return loc.location_name
  }
  return '-'
}

// Filtered report data with item-level filtering
const filteredReportData = computed((): POWiseStockReportData | null => {
  if (!reportData.value) return null

  const { location, category, division, itemType } = appliedAdvancedFilters.value
  const hasFilter = location || category || division || itemType

  if (!hasFilter) return reportData.value

  const filteredPOs = reportData.value.data.map(po => {
    const filteredItems = po.items.filter((item: POWiseStockReportItem) => {
      if (location && item.locationUuid !== location) return false
      if (category) {
        const resolved = resolveCategory(item)
        if (resolved === '-' || resolved.toLowerCase() !== category.toLowerCase()) return false
      }
      if (division) {
        const divUuid = item.divisionUuid || (item.itemTypeUuid ? itemTypesStore.getItemTypeById(item.itemTypeUuid)?.item_division_uuid : undefined)
        if (divUuid !== division) return false
      }
      if (itemType && item.itemTypeUuid !== itemType) return false
      return true
    })

    const poTotals = filteredItems.reduce((acc, item) => {
      acc.orderedQuantity += item.orderedQuantity || 0
      acc.receivedQuantity += item.receivedQuantity || 0
      acc.returnedQuantity += item.returnedQuantity || 0
      acc.totalValue += item.totalValue || 0
      return acc
    }, { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 })

    return { ...po, items: filteredItems, totals: poTotals }
  }).filter(po => po.items.length > 0)

  const grandTotals = filteredPOs.reduce((acc, po) => {
    acc.orderedQuantity += po.totals.orderedQuantity
    acc.receivedQuantity += po.totals.receivedQuantity
    acc.returnedQuantity += po.totals.returnedQuantity
    acc.totalValue += po.totals.totalValue
    return acc
  }, { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 })

  return { data: filteredPOs, totals: grandTotals }
})

const filteredTotals = computed(() => {
  return filteredReportData.value?.totals || {
    orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0
  }
})

// Get project name for print header
const getProjectName = (): string => {
  if (!selectedProjectId.value) return 'N/A'
  const project = projectsStore.projects.find(p => p.uuid === selectedProjectId.value)
  return project ? `${project.project_name} (${project.project_id || 'N/A'})` : 'N/A'
}

const getVendorName = (): string => {
  if (!selectedVendorId.value) return 'N/A'
  if (reportData.value?.data) {
    const po = reportData.value.data.find((p: any) => p.vendor_uuid === selectedVendorId.value)
    if (po?.vendor_name) return po.vendor_name
  }
  return 'N/A'
}

// Handlers
const handleCorporationChangeFromSelect = async (corporation: any) => {
  selectedProjectId.value = undefined
  selectedVendorId.value = undefined
  reportData.value = null
  resetAdvancedFilters()

  const corporationId = corporation?.value ?? corporation?.uuid
  if (corporationId) {
    try {
      await Promise.all([
        projectsStore.fetchProjects(corporationId),
        itemTypesStore.fetchItemTypes(corporationId),
        itemDivisionsStore.fetchItemDivisions(corporationId),
      ])
    } catch (error) {
      // Silently handle error
    }
  }
}

const handleProjectChange = async (projectId: string | undefined) => {
  selectedProjectId.value = projectId
  reportData.value = null
  resetAdvancedFilters()
}

const handleVendorChange = (vendorId: string | undefined) => {
  selectedVendorId.value = vendorId
  reportData.value = null
}

const handleShowReport = async () => {
  if (canGenerateReport.value) {
    await loadPOWiseStockReport()
  }
}

// Advanced filter handlers
const handleApplyDrawerFilters = () => {
  appliedAdvancedFilters.value = {
    location: drawerLocation.value,
    category: drawerCategory.value,
    division: drawerDivision.value,
    itemType: drawerItemType.value,
  }
  isFilterDrawerOpen.value = false
  handleShowReport()
}

const handleClearDrawerFilters = () => {
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerDivision.value = undefined
  drawerItemType.value = undefined
}

const resetAdvancedFilters = () => {
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerDivision.value = undefined
  drawerItemType.value = undefined
  appliedAdvancedFilters.value = {
    location: undefined,
    category: undefined,
    division: undefined,
    itemType: undefined,
  }
}

watch(isFilterDrawerOpen, (open) => {
  if (open) {
    if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
      locationsStore.fetchLocations()
    }
    if (selectedCorporationId.value) {
      itemDivisionsStore.fetchItemDivisions(selectedCorporationId.value)
      itemTypesStore.fetchItemTypes(selectedCorporationId.value)
    }
  }
})

// Load report data
const loadPOWiseStockReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = null
    return
  }
  
  try {
    const startDateStr = `${startDateValue.value.year}-${String(startDateValue.value.month).padStart(2, '0')}-${String(startDateValue.value.day).padStart(2, '0')}`
    const endDateStr = `${endDateValue.value.year}-${String(endDateValue.value.month).padStart(2, '0')}-${String(endDateValue.value.day).padStart(2, '0')}`

    await Promise.all([
      itemTypesStore.fetchItemTypes(selectedCorporationId.value),
      itemDivisionsStore.fetchItemDivisions(selectedCorporationId.value),
      locationsStore.fetchLocations(),
    ])

    const data = await poWiseStockReport.generatePOWiseStockReport(selectedCorporationId.value, selectedProjectId.value)
    
    if (data && data.data && Array.isArray(data.data)) {
      let filteredPOs = data.data.filter((po: any) => {
        if (po.po_date) {
          const poDate = dayjs(po.po_date)
          if (!poDate.isValid()) return false
          const dateOnly = poDate.format('YYYY-MM-DD')
          if (dateOnly < startDateStr || dateOnly > endDateStr) return false
        } else {
          return false
        }
        if (selectedVendorId.value && po.vendor_uuid !== selectedVendorId.value) return false
        return true
      })
      
      const filteredTotals = filteredPOs.reduce((acc: any, po: any) => {
        acc.orderedQuantity += po.totals?.orderedQuantity || 0
        acc.receivedQuantity += po.totals?.receivedQuantity || 0
        acc.returnedQuantity += po.totals?.returnedQuantity || 0
        acc.totalValue += po.totals?.totalValue || 0
        return acc
      }, { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 })
      
      reportData.value = {
        data: filteredPOs.map(po => ({
          ...po,
          items: po.items.map(item => ({ ...item })),
          totals: { ...po.totals }
        })),
        totals: filteredTotals
      }
    } else {
      reportData.value = null
    }
    
    await nextTick()
  } catch (error) {
    reportData.value = null
  }
}

const printReport = () => {
  window.print()
}

const PO_WISE_STOCK_CSV_HEADERS = [
  'Category',
  'Division',
  'Item Type',
  'Spec',
  'Item Name',
  'Description',
  'Vendor',
  'Cost Code',
  'Location',
  'PO Number',
  'PO Date',
  'Ordered Quantity',
  'Received Quantity',
  'Returned Quantity',
  'Invoice Number',
  'Invoice Date',
  'Status',
  'Unit Cost',
  'UOM',
  'Total Value',
  'Row Type',
] as const

const exportReportToCsv = () => {
  const data = filteredReportData.value
  if (!data?.data?.length) return

  const rows: unknown[][] = [Array.from(PO_WISE_STOCK_CSV_HEADERS)]

  for (const po of data.data) {
    for (const item of po.items || []) {
      rows.push([
        resolveCategory(item),
        resolveDivisionName(item),
        resolveItemTypeName(item),
        item.itemCode || '',
        item.itemName || '',
        getDescriptionPlainText(item.description),
        item.vendorSource || po.vendor_name || '',
        item.costCode || '',
        resolveLocationName(item),
        item.poNumber || po.po_number || '',
        formatPoDate(item.poDate || po.po_date),
        item.orderedQuantity ?? 0,
        item.receivedQuantity ?? 0,
        item.returnedQuantity ?? 0,
        item.invoiceNumbers?.length ? item.invoiceNumbers.join('; ') : '',
        item.invoiceDates?.length
          ? item.invoiceDates.map((d) => formatInvoiceDate(d)).join('; ')
          : '',
        item.status || '',
        item.unitCost ?? 0,
        item.uom || '',
        item.totalValue ?? 0,
        'Detail',
      ])
    }

    if (po.items?.length) {
      rows.push([
        '', '', '', '', '', '', po.vendor_name || '', '', '',
        po.po_number || '',
        formatPoDate(po.po_date),
        po.totals.orderedQuantity,
        po.totals.receivedQuantity,
        po.totals.returnedQuantity,
        '', '', '', '', '',
        po.totals.totalValue,
        'PO Total',
      ])
    }
  }

  const totals = filteredTotals.value
  rows.push([
    '', '', '', '', '', '', '', '', '', '', '',
    totals.orderedQuantity,
    totals.receivedQuantity,
    totals.returnedQuantity,
    '', '', '', '', '',
    totals.totalValue,
    'Grand Total',
  ])

  const project = projectsStore.projects.find(
    (p) => p.uuid === selectedProjectId.value
  )
  const projectSlug = (project?.project_id || 'project').replace(/[^\w-]+/g, '_')
  const dateSlug = new Date().toISOString().split('T')[0]
  downloadCsvFile(`po-wise-stock-report_${projectSlug}_${dateSlug}.csv`, rows)
}

const syncCorporationFromStoreOrNimble = async () => {
  // Keep local filter in sync with globally selected corporation (TopBar/Nimble route sync).
  if (!selectedCorporationId.value && corporationStore.selectedCorporationId) {
    selectedCorporationId.value = corporationStore.selectedCorporationId
    await Promise.all([
      itemDivisionsStore.fetchItemDivisions(corporationStore.selectedCorporationId),
      itemTypesStore.fetchItemTypes(corporationStore.selectedCorporationId),
    ])
    await handleCorporationChangeFromSelect({ value: corporationStore.selectedCorporationId })
    return
  }

  // Nimble fallback: if global selected corporation isn't set yet, map URL corporationId -> local UUID.
  if (!nimbleIntegrationsEnabled || selectedCorporationId.value) return

  const nimbleCorpId = String(nimbleCorporationIdFromUrl.value || '').trim()
  if (!nimbleCorpId) return

  const matched = (corporationStore.corporations || []).find((corp: any) => {
    return String(corp?.nimble_corporation_id || '').trim() === nimbleCorpId
  })
  if (!matched?.uuid) return

  selectedCorporationId.value = matched.uuid
  await Promise.all([
    itemDivisionsStore.fetchItemDivisions(matched.uuid),
    itemTypesStore.fetchItemTypes(matched.uuid),
  ])
  await handleCorporationChangeFromSelect({ value: matched.uuid })
}

watch(selectedCorporationId, () => {
  selectedProjectId.value = undefined
  selectedVendorId.value = undefined
  reportData.value = null
  resetAdvancedFilters()
})

watch(selectedProjectId, () => {
  reportData.value = null
  resetAdvancedFilters()
})

watch(selectedVendorId, () => {
  reportData.value = null
})

watch(selectedTransactionRange, (range) => {
  applyTransactionRange(range)
  reportData.value = null
}, { immediate: true })

watch(
  () => corporationStore.selectedCorporationId,
  async (newId) => {
    if (!selectedCorporationId.value && newId) {
      selectedCorporationId.value = newId
      await Promise.all([
        itemDivisionsStore.fetchItemDivisions(newId),
        itemTypesStore.fetchItemTypes(newId),
      ])
      await handleCorporationChangeFromSelect({ value: newId })
    }
  },
  { immediate: true }
)

watch(
  [() => nimbleCorporationIdFromUrl.value, () => corporationStore.corporations],
  async () => {
    await syncCorporationFromStoreOrNimble()
  },
  { immediate: true, deep: false }
)

onMounted(async () => {
  try {
    locationsStore.fetchLocations()
    await syncCorporationFromStoreOrNimble()
  } catch (error) {
    // Silently handle error
  }
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
