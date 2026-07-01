<template>
  <div class="po-wise-stock-report h-[88vh] print:h-auto">
    <!-- Header section - hidden in print -->
    <div class="mb-2 print:hidden">
      <div class="flex items-center justify-end gap-4 flex-wrap">
        <!-- Corporation, Project, Vendor Selection, Date Range, Show and Print buttons -->
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
            <DatePickerField
              :model-value="startDateValue"
              :max-value="endDateValue"
              size="sm"
              placeholder="MM/DD/YYYY"
              class="w-48"
              @update:model-value="(v) => { startDateValue = v }"
            />
          </div>

          <!-- End Date -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              End Date <span class="text-red-500">*</span>
            </label>
            <DatePickerField
              :model-value="endDateValue"
              :min-value="startDateValue"
              size="sm"
              placeholder="MM/DD/YYYY"
              class="w-48"
              @update:model-value="(v) => { endDateValue = v }"
            />
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
                    <DatePickerField
                      :model-value="startDateValue"
                      :max-value="endDateValue"
                      size="sm"
                      placeholder="MM/DD/YYYY"
                      class="w-full"
                      @update:model-value="(v) => { startDateValue = v }"
                    />
                  </div>

                  <!-- End Date -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">End Date <span class="text-red-500">*</span></label>
                    <DatePickerField
                      :model-value="endDateValue"
                      :min-value="startDateValue"
                      size="sm"
                      placeholder="MM/DD/YYYY"
                      class="w-full"
                      @update:model-value="(v) => { endDateValue = v }"
                    />
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

                  <!-- Item Type -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Type</label>
                    <ItemTypeSelect
                      v-model="drawerItemType"
                      :corporation-uuid="selectedCorporationId || undefined"
                      :project-uuid="selectedProjectId || undefined"
                      :category="drawerCategory || undefined"
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
              Export Excel
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
                <th v-for="i in 19" :key="i" class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200 dark:border-gray-700">
                <td v-for="j in 19" :key="j" class="py-1 px-2 text-default text-xs">
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

        <div class="overflow-x-auto print:overflow-visible">
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
                  <td class="py-2 px-2 font-bold text-xs text-default" colspan="19">
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
                  <td class="py-2 px-2 text-muted text-xs italic" colspan="19">No items found for this purchase order</td>
                </tr>
                
                <!-- PO Total Row -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default font-bold" colspan="11">
                    Total
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(po.totals.orderedQuantity) }}</td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(po.totals.receivedQuantity) }}</td>
                  <td class="py-2 px-2 text-xs text-default" colspan="3"></td>
                  <td class="py-2 px-2 text-right text-xs text-default"></td>
                  <td class="py-2 px-2 text-right text-xs text-default"></td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatCurrency(po.totals.totalValue) }}</td>
                </tr>
                
                <!-- Spacer row between POs -->
                <tr>
                  <td class="py-2" colspan="19"></td>
                </tr>
              </template>
              
              <!-- Grand Total Row -->
              <tr class="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-500 dark:border-gray-500 font-bold">
                <td class="py-2 px-2 text-xs text-default font-bold" colspan="11">
                  Grand Total
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(filteredTotals.orderedQuantity) }}</td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">{{ formatNumber(filteredTotals.receivedQuantity) }}</td>
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
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useLocationsStore } from '~/stores/locations'
import { useItemDivisionsStore } from '~/stores/itemDivisions'
import { useItemTypesStore } from '~/stores/itemTypes'
import { usePOWiseStockReport } from '~/composables/usePOWiseStockReport'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useDateFormat } from '~/composables/useDateFormat'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { isWithinCalendarDateRange } from '~/utils/calendarDateRange'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import DatePickerField from '~/components/shared/DatePickerField.vue'
import type { POWiseStockReportData, POWiseStockReportItem } from '~/composables/usePOWiseStockReport'
import { stripHtmlToPlainText } from '~/utils/getDescriptionPreviewHtml'
import {
  formatReportDateRangeDisplay,
  resolveCorporationDisplayName,
} from '~/utils/csvExport'
import {
  buildReportExcelFilename,
  downloadReportExcelFile,
} from '~/utils/reportExcelExport.client'

const getDescriptionPlainText = (value: unknown) => {
  const text = stripHtmlToPlainText(String(value || ''))
  return text || '-'
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
const drawerItemType = ref<string | undefined>(undefined)

const appliedAdvancedFilters = ref({
  location: undefined as string | undefined,
  category: undefined as string | undefined,
  itemType: undefined as string | undefined,
})

const { fromUTCString, toUTCString } = useUTCDateFormat()

const toUtcDateString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return toUTCString(`${y}-${m}-${d}`) ?? `${y}-${m}-${d}T00:00:00.000Z`
}

// Date range state
const currentYear = new Date().getFullYear()
const startDateValue = ref<string | null>(`${currentYear}-01-01T00:00:00.000Z`)
const endDateValue = ref<string | null>(toUtcDateString(new Date()))
const transactionRangeOptions = [
  { label: 'Year to date', value: 'YEAR_TO_DATE' },
  { label: 'Month to date', value: 'MONTH_TO_DATE' },
  { label: 'Week to date', value: 'WEEK_TO_DATE' },
  { label: 'Last year', value: 'LAST_YEAR' },
]

const applyTransactionRange = (range: string) => {
  const now = new Date()
  if (range === 'YEAR_TO_DATE') {
    startDateValue.value = `${now.getFullYear()}-01-01T00:00:00.000Z`
    endDateValue.value = toUtcDateString(now)
    return
  }
  if (range === 'MONTH_TO_DATE') {
    startDateValue.value = toUtcDateString(new Date(now.getFullYear(), now.getMonth(), 1))
    endDateValue.value = toUtcDateString(now)
    return
  }
  if (range === 'WEEK_TO_DATE') {
    const start = new Date(now)
    const dayOfWeek = start.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    start.setDate(start.getDate() - daysFromMonday)
    startDateValue.value = toUtcDateString(start)
    endDateValue.value = toUtcDateString(now)
    return
  }
  if (range === 'LAST_YEAR') {
    const lastYear = now.getFullYear() - 1
    startDateValue.value = `${lastYear}-01-01T00:00:00.000Z`
    endDateValue.value = `${lastYear}-12-31T00:00:00.000Z`
  }
}

const startDateDisplayText = computed(() => {
  if (!startDateValue.value) return ''
  return new Date(startDateValue.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

const endDateDisplayText = computed(() => {
  if (!endDateValue.value) return ''
  return new Date(endDateValue.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

const canGenerateReport = computed(() => {
  return !!(
    selectedCorporationId.value &&
    selectedProjectId.value &&
    startDateValue.value &&
    endDateValue.value &&
    startDateValue.value <= endDateValue.value
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

  const { location, category, itemType } = appliedAdvancedFilters.value
  const hasFilter = location || category || itemType

  if (!hasFilter) return reportData.value

  const filteredPOs = reportData.value.data.map(po => {
    const filteredItems = po.items.filter((item: POWiseStockReportItem) => {
      if (location && item.locationUuid !== location) return false
      if (category) {
        const resolved = resolveCategory(item)
        if (resolved === '-' || resolved.toLowerCase() !== category.toLowerCase()) return false
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
    itemType: drawerItemType.value,
  }
  isFilterDrawerOpen.value = false
  handleShowReport()
}

const handleClearDrawerFilters = () => {
  // Clear every filter except the corporation selection.
  selectedProjectId.value = undefined
  selectedVendorId.value = undefined
  selectedTransactionRange.value = 'YEAR_TO_DATE'
  applyTransactionRange('YEAR_TO_DATE')
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerItemType.value = undefined
  appliedAdvancedFilters.value = {
    location: undefined,
    category: undefined,
    itemType: undefined,
  }
}

const resetAdvancedFilters = () => {
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerItemType.value = undefined
  appliedAdvancedFilters.value = {
    location: undefined,
    category: undefined,
    itemType: undefined,
  }
}

watch(isFilterDrawerOpen, (open) => {
  if (open) {
    if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
      locationsStore.fetchLocations()
    }
    if (selectedCorporationId.value) {
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
    const isWithinSelectedDateRange = (value?: string | null) =>
      isWithinCalendarDateRange(
        value,
        startDateValue.value,
        endDateValue.value,
        fromUTCString
      )

    await Promise.all([
      itemTypesStore.fetchItemTypes(selectedCorporationId.value),
      itemDivisionsStore.fetchItemDivisions(selectedCorporationId.value),
      locationsStore.fetchLocations(),
    ])

    const data = await poWiseStockReport.generatePOWiseStockReport(selectedCorporationId.value, selectedProjectId.value)
    
    if (data && data.data && Array.isArray(data.data)) {
      let filteredPOs = data.data.filter((po: any) => {
        if (!po.po_date) return false
        if (!isWithinSelectedDateRange(po.po_date)) return false
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
  'Invoice Number',
  'Invoice Date',
  'Status',
  'Unit Cost',
  'UOM',
  'Total Value',
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
        item.invoiceNumbers?.length ? item.invoiceNumbers.join('; ') : '',
        item.invoiceDates?.length
          ? item.invoiceDates.map((d) => formatInvoiceDate(d)).join('; ')
          : '',
        item.status || '',
        item.unitCost ?? 0,
        item.uom || '',
        item.totalValue ?? 0,
      ])
    }

    if (po.items?.length) {
      rows.push([
        '', '', '', '', '', '', po.vendor_name || '', '', '',
        po.po_number || '',
        formatPoDate(po.po_date),
        po.totals.orderedQuantity,
        po.totals.receivedQuantity,
        '', '', '', '', '',
        po.totals.totalValue,
      ])
    }
  }

  const totals = filteredTotals.value
  rows.push([
    '', '', '', '', '', '', '', '', '', '', '',
    totals.orderedQuantity,
    totals.receivedQuantity,
    '', '', '', '', '',
    totals.totalValue,
  ])

  const project = projectsStore.projects.find(
    (p) => p.uuid === selectedProjectId.value
  )
  void downloadReportExcelFile(
    buildReportExcelFilename('po-wise-stock-report', project?.project_id),
    {
      title: 'PO Wise Stock Report',
      corporationName: resolveCorporationDisplayName(
        corporationStore.corporations as any[],
        selectedCorporationId.value
      ),
      projectLabel: getProjectName() !== 'N/A' ? getProjectName() : undefined,
      dateRange: formatReportDateRangeDisplay(
        startDateValue.value,
        endDateValue.value
      ),
    },
    rows
  )
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

<style>
/* Print optimizations - Hide layout and UI elements, show only report */
@media print {
  /* Reset page margins and background */
  @page {
    margin: 1cm;
    size: A4 landscape;
  }

  html,
  body,
  #__nuxt {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  /* App shell scroll regions clip content to one viewport — unblock for multi-page print */
  .po-wise-stock-report,
  .po-wise-stock-report * {
    max-height: none !important;
  }

  .po-wise-stock-report {
    height: auto !important;
    overflow: visible !important;
  }

  .flex.h-full,
  .flex.h-screen,
  main,
  aside,
  nav,
  [class*="overflow-hidden"],
  [class*="overflow-y-auto"],
  [class*="overflow-x-auto"],
  .min-h-0 {
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    flex: none !important;
  }

  /* Hide loading overlay and fixed UI chrome */
  .fixed,
  [class*="backdrop-blur"] {
    display: none !important;
  }

  /* Hide layout components (SideMenu, TopBar, MobileBottomNav) */
  nav,
  aside,
  header:not(.print-header),
  [class*="SideMenu"],
  [class*="TopBar"],
  [class*="MobileBottomNav"],
  [class*="side-menu"],
  [class*="top-bar"],
  [class*="mobile-bottom-nav"],
  /* Target layout structure */
  .flex.h-screen > aside,
  .flex.h-screen > div:first-child,
  .flex.h-screen > div:last-child {
    display: none !important;
  }

  /* Hide main layout wrapper elements but keep content */
  main {
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
    border-radius: 0 !important;
  }

  /* Hide the outer layout flex container's background */
  .flex.h-screen {
    background: #ffffff !important;
  }

  /* Hide non-essential UI elements in the report page */
  button,
  [class*="print:hidden"],
  .mb-2.print\\:hidden {
    display: none !important;
  }

  /* Show print-only elements */
  [class*="print:block"],
  .hidden.print\\:block {
    display: block !important;
  }

  /* Hide empty state messages */
  .text-center:has(UIcon),
  [class*="text-center"]:has(svg) {
    display: none !important;
  }

  /* Ensure all text is black for printing */
  * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Keep borders and backgrounds for tables */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    font-size: 9px !important;
    page-break-inside: auto;
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  tbody {
    display: table-row-group;
  }

  th, td {
    border: 1px solid #000000 !important;
    padding: 3px 4px !important;
    background: #ffffff !important;
    color: #000000 !important;
  }

  /* Table header styling */
  thead th {
    background: #f0f0f0 !important;
    font-weight: bold !important;
    border: 1px solid #000000 !important;
    color: #000000 !important;
  }

  /* Prevent page breaks inside table rows */
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Optimize spacing for print */
  [class*="print:p-2"] {
    padding: 0.5rem !important;
  }

  [class*="print:mb-4"] {
    margin-bottom: 1rem !important;
  }

  [class*="print:pb-4"] {
    padding-bottom: 1rem !important;
  }

  [class*="print:border-b"] {
    border-bottom: 1px solid #000000 !important;
  }

  /* Ensure text is readable and black */
  .text-xs,
  .text-sm,
  .text-lg,
  .text-xl,
  .text-2xl,
  p,
  span,
  div,
  h1,
  h2,
  h3 {
    color: #000000 !important;
  }

  /* Hide scrollbars and overflow */
  [class*="overflow"] {
    overflow: visible !important;
  }

  /* Ensure full width */
  [class*="w-full"] {
    width: 100% !important;
  }

  /* Print header styling */
  [class*="print:text-2xl"] {
    font-size: 18px !important;
    color: #000000 !important;
  }

  [class*="print:text-sm"] {
    font-size: 11px !important;
    color: #000000 !important;
  }

  [class*="print:text-xs"] {
    font-size: 9px !important;
    color: #000000 !important;
  }

  /* Ensure all dark mode styles are overridden */
  [class*="dark:"] {
    color: #000000 !important;
    background: transparent !important;
  }

  /* Hide icons and SVG elements */
  svg,
  [class*="icon"],
  UIcon,
  [class*="UIcon"] {
    display: none !important;
  }

  /* Hide skeleton loaders */
  [class*="Skeleton"],
  [class*="skeleton"] {
    display: none !important;
  }

  /* Ensure proper spacing */
  .space-y-3 > * + *,
  .space-y-6 > * + * {
    margin-top: 0.75rem !important;
  }

  /* Hide loading states */
  [class*="loading"],
  [v-if*="loading"] {
    display: none !important;
  }
}
</style>
