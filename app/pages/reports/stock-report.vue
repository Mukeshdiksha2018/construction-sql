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

        <!-- Right side: Corporation, Project Selection, Date Range, Show and Print buttons -->
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
                  v-model="startDateModel"
                  :min-value="undefined"
                  :max-value="startDateMaxModel"
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
                  v-model="endDateModel"
                  :min-value="endDateMinModel"
                  :max-value="undefined"
                  class="p-2"
                />
              </template>
            </UPopover>
          </div>

          <!-- Advanced filter drawer -->
          <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filters" description="Configure report filters.">
            <UButton
              icon="i-heroicons-funnel-solid"
              color="neutral"
              variant="solid"
              size="sm"
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
                    <UButton
                      icon="i-heroicons-calendar"
                      size="sm"
                      variant="outline"
                      class="w-full justify-start"
                    >
                      {{ startDateDisplayText }}
                    </UButton>
                    <template #content>
                      <UCalendar
                        v-model="startDateModel"
                        :min-value="undefined"
                        :max-value="startDateMaxModel"
                        class="p-2"
                      />
                    </template>
                  </UPopover>
                </div>

                <!-- End Date -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300">End Date <span class="text-red-500">*</span></label>
                  <UPopover :popper="{ placement: 'bottom-start' }">
                    <UButton
                      icon="i-heroicons-calendar"
                      size="sm"
                      variant="outline"
                      class="w-full justify-start"
                    >
                      {{ endDateDisplayText }}
                    </UButton>
                    <template #content>
                      <UCalendar
                        v-model="endDateModel"
                        :min-value="endDateMinModel"
                        :max-value="undefined"
                        class="p-2"
                      />
                    </template>
                  </UPopover>
                </div>

                <!-- Vendor -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                  <VendorSelect
                    v-model="drawerVendor"
                    :corporation-uuid="selectedCorporationId || undefined"
                    placeholder="All Vendors"
                    size="sm"
                    class="w-full"
                    :disabled="!selectedCorporationId"
                    :include-all-option="true"
                    all-option-label="All Vendors"
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

          <!-- Show button -->
          <UButton
            :disabled="!canGenerateReport"
            color="primary"
            variant="solid"
            size="sm"
            @click="handleShowReport"
          >
            Show
          </UButton>

          <!-- Print button -->
          <UButton
            v-if="selectedCorporationId && selectedProjectId && filteredReportData && filteredReportData.items && filteredReportData.items.length > 0"
            icon="i-heroicons-printer"
            variant="soft"
            size="sm"
            @click="printReport"
          >
            Print
          </UButton>
        </div>
      </div>
    </div>

    <!-- Report Content Area -->
    <div class="p-4">
      <div v-if="!selectedCorporationId" class="text-center py-12">
        <UIcon name="i-heroicons-building-office" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a corporation to view the stock report</p>
      </div>
      <div v-else-if="!selectedProjectId" class="text-center py-12">
        <UIcon name="i-heroicons-folder" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a project to view the stock report</p>
      </div>
      <div v-else-if="selectedCorporationId && selectedProjectId && (!startDateValue || !endDateValue)" class="text-center py-12">
        <UIcon name="i-heroicons-calendar" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select start date and end date to generate the report</p>
      </div>
      <div v-else-if="loading" class="space-y-3">
        <!-- Loading skeleton -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th v-for="i in 17" :key="i" class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200 dark:border-gray-700">
                <td v-for="j in 17" :key="j" class="py-1 px-2 text-default text-xs">
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
      <div v-else-if="filteredReportData && filteredReportData.items && filteredReportData.items.length > 0" class="space-y-6">
        <!-- Report Title -->
        <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 print:text-2xl print:text-gray-900">
          Stock Report
        </h1>

        <!-- Report Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs print:text-sm">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Category</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Type</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Spec</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Name</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Description</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Vendor / Source</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Cost Code</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Location</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Current Stock</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Unit Cost</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">UOM</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Total Value</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Reorder Level</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">In Shipment</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Returned QTY</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Last Purchase Date</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Last Stock Update Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredReportData.items"
                :key="item.itemCode"
                class="border-b border-gray-200 dark:border-gray-700"
              >
                <td class="py-1 px-2 text-default text-xs">{{ item._category_label || '-' }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ item._item_type_label || '-' }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ item.itemCode }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ item.itemName }}</td>
                <td class="py-1 px-2 text-default text-xs whitespace-pre-line">{{ getDescriptionPlainText(item.description) }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ item.vendorSource || '-' }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ item.costCode || '-' }}</td>
                <td class="py-1 px-2 text-default text-xs">{{ resolveLocationName(item) }}</td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatNumber(item.currentStock) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatCurrency(item.unitCost) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">{{ item.uom || '-' }}</td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatCurrency(item.totalValue) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatNumber(item.reorderLevel) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatNumber(item.inShipment) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatNumber(item.returnedQty) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatDate(item.lastPurchaseDate) }}
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  {{ formatDate(item.lastStockUpdateDate) }}
                </td>
              </tr>
              
              <!-- Total Row -->
              <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                <td class="py-2 px-2 text-xs text-default font-bold" colspan="8">
                  Total
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">
                  {{ formatNumber(filteredTotals.currentStock) }}
                </td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">
                  {{ formatCurrency(filteredTotals.totalValue) }}
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">
                  {{ formatNumber(filteredTotals.reorderLevel) }}
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">
                  {{ formatNumber(filteredTotals.inShipment) }}
                </td>
                <td class="py-2 px-2 text-right text-xs text-default font-bold">
                  {{ formatNumber(filteredTotals.returnedQty) }}
                </td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
                <td class="py-2 px-2 text-right text-xs text-default"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!filteredReportData || !filteredReportData.items || filteredReportData.items.length === 0)" class="text-center py-12">
        <UIcon name="i-heroicons-cube" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">No stock items found for this project</p>
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
import { useStockReport } from '~/composables/useStockReport'
import {
  buildItemDivisionConfigMap,
  buildItemTypeConfigMap,
  buildPreferredItemTypeMetaLookup,
  mergeItemTypeFromPreferredCatalog,
  resolveItemHierarchyFields,
  stockReportItemToHierarchyInput,
} from '~/utils/itemHierarchyResolution'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useDateFormat } from '~/composables/useDateFormat'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import type { StockReportData, StockReportItem } from '~/composables/useStockReport'

const router = useRouter()

// Navigation
const goBack = () => {
  router.back()
}

// Set page title
useHead({
  title: 'Stock Report - Property Management'
})

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

// Stores
const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const locationsStore = useLocationsStore()
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = Boolean(runtimeConfig.public.nimbleIntegrations)
const { corporationId: nimbleCorporationIdFromUrl } = useNimbleContext()

// State
const selectedCorporationId = ref<string | undefined>(undefined)
const selectedProjectId = ref<string | undefined>(undefined)
const selectedTransactionRange = ref<string>('YEAR_TO_DATE')

// Advanced filter drawer
const isFilterDrawerOpen = ref(false)
const drawerVendor = ref<string | undefined>(undefined)
const drawerLocation = ref<string | undefined>(undefined)
const drawerCategory = ref<string | undefined>(undefined)
const drawerItemType = ref<string | undefined>(undefined)

const appliedAdvancedFilters = ref({
  vendor: undefined as string | undefined,
  location: undefined as string | undefined,
  category: undefined as string | undefined,
  itemType: undefined as string | undefined,
})

// Date range state - default to Jan 1 of current year to today
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

const startDateModel = computed({
  get: () => startDateValue.value as any,
  set: (value) => {
    startDateValue.value = (value || null) as CalendarDate | null
  },
})

const endDateModel = computed({
  get: () => endDateValue.value as any,
  set: (value) => {
    endDateValue.value = (value || null) as CalendarDate | null
  },
})

const startDateMaxModel = computed(() => (endDateValue.value || undefined) as any)
const endDateMinModel = computed(() => (startDateValue.value || undefined) as any)

// Date display text
const startDateDisplayText = computed(() => {
  if (!startDateValue.value) return 'Select start date'
  return startDateValue.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

const endDateDisplayText = computed(() => {
  if (!endDateValue.value) return 'Select end date'
  return endDateValue.value.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

// Can generate report
const canGenerateReport = computed(() => {
  return !!(
    selectedCorporationId.value &&
    selectedProjectId.value &&
    startDateValue.value &&
    endDateValue.value &&
    startDateValue.value.compare(endDateValue.value) <= 0
  )
})

// Stock Report
const stockReport = useStockReport()
const { formatCurrency } = useCurrencyFormat()
const { formatDate: formatDateUtil } = useDateFormat()
const reportData = ref<StockReportData | null>(null)

// Expose loading and error from composable - unwrap readonly refs
const loading = computed(() => stockReport.loading.value)
const error = computed(() => stockReport.error.value)

// Number formatting
const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const decodeHtmlEntities = (value: string) => {
  if (!value) return ''
  if (typeof window === 'undefined' || !window.document) return value
  const el = window.document.createElement('textarea')
  el.innerHTML = value
  return el.value
}

const stripHtml = (value: string) => {
  if (!value) return ''
  const withLineBreaks = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  const withoutTags = withLineBreaks.replace(/<[^>]*>/g, '')
  const decoded = decodeHtmlEntities(withoutTags)
  return decoded
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const getDescriptionPlainText = (value: unknown) => {
  const text = stripHtml(String(value || ''))
  return text || '-'
}

// Date formatting
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  try {
    return formatDateUtil(new Date(date))
  } catch {
    return '-'
  }
}

// Resolve location UUID to name via locations store
const resolveLocationName = (item: StockReportItem): string => {
  if (item.locationUuid) {
    const loc = locationsStore.getByUuid?.(item.locationUuid)
    if (loc?.location_name) return loc.location_name
  }
  return '-'
}

function enrichStockItemsWithApiHierarchy(
  items: StockReportItem[],
  preferredRows: any[],
  divisionRows: any[],
  typeRows: any[]
): StockReportItem[] {
  const preferredMeta = buildPreferredItemTypeMetaLookup(preferredRows)
  const divisionByUuid = buildItemDivisionConfigMap(divisionRows)
  const itemTypeByUuid = buildItemTypeConfigMap(typeRows)

  return items.map((item) => {
    const row = stockReportItemToHierarchyInput(item)
    const merged = mergeItemTypeFromPreferredCatalog(row, preferredMeta)
    const hier = resolveItemHierarchyFields(merged, divisionByUuid, itemTypeByUuid)
    const typeUuid = merged.item_type_uuid ? String(merged.item_type_uuid) : item.itemTypeUuid
    return {
      ...item,
      itemTypeUuid: typeUuid || item.itemTypeUuid,
      itemTypeName: pickFirstMergedTypeName(merged, item),
      category: hier._category_value || item.category,
      divisionUuid: hier._resolved_item_division_uuid || item.divisionUuid,
      divisionName: hier._division_name || item.divisionName,
      _category_label: hier._category_label,
      _category_value: hier._category_value,
      _division_name: hier._division_name,
      _item_type_label: hier._item_type_label,
      _resolved_item_division_uuid: hier._resolved_item_division_uuid,
    }
  })
}

function pickFirstMergedTypeName(merged: Record<string, any>, item: StockReportItem): string {
  const a = merged.item_type_label ? String(merged.item_type_label).trim() : ''
  const b = merged.item_type ? String(merged.item_type).trim() : ''
  return a || b || item.itemTypeName || ''
}

// Filtered report data based on advanced filters
const filteredReportData = computed((): StockReportData | null => {
  if (!reportData.value) return null

  const { vendor, location, category, itemType } = appliedAdvancedFilters.value
  const hasFilter = vendor || location || category || itemType

  if (!hasFilter) return reportData.value

  const filteredItems = reportData.value.items.filter((item: StockReportItem) => {
    if (vendor && item.vendorUuid !== vendor) return false
    if (location && item.locationUuid !== location) return false
    if (category) {
      const raw = String(item._category_value || item.category || '').toLowerCase()
      if (raw !== category.toLowerCase()) return false
    }
    if (itemType && item.itemTypeUuid !== itemType) return false
    return true
  })

  const filteredTotalsVal = filteredItems.reduce((acc, item) => {
    acc.currentStock += item.currentStock || 0
    acc.totalValue += item.totalValue || 0
    acc.reorderLevel += item.reorderLevel || 0
    acc.inShipment += item.inShipment || 0
    acc.returnedQty += item.returnedQty || 0
    return acc
  }, { currentStock: 0, totalValue: 0, reorderLevel: 0, inShipment: 0, returnedQty: 0 })

  return { items: filteredItems, totals: filteredTotalsVal }
})

const filteredTotals = computed(() => {
  return filteredReportData.value?.totals || {
    currentStock: 0,
    totalValue: 0,
    reorderLevel: 0,
    inShipment: 0,
    returnedQty: 0,
  }
})

// Handlers
const handleCorporationChangeFromSelect = async (corporation: any) => {
  selectedProjectId.value = undefined
  reportData.value = null
  resetAdvancedFilters()
  
  const corporationId = corporation?.value ?? corporation?.uuid
  if (corporationId) {
    try {
      await projectsStore.fetchProjects(corporationId)
    } catch (error) {
      // Silently handle error
    }
  }
}

const handleProjectChange = async (projectId: string | undefined) => {
  selectedProjectId.value = projectId
  reportData.value = null
}

const handleShowReport = async () => {
  if (canGenerateReport.value) {
    await loadStockReport()
  }
}

// Advanced filter handlers
const handleApplyDrawerFilters = () => {
  appliedAdvancedFilters.value = {
    vendor: drawerVendor.value,
    location: drawerLocation.value,
    category: drawerCategory.value,
    itemType: drawerItemType.value,
  }
  isFilterDrawerOpen.value = false
  handleShowReport()
}

const handleClearDrawerFilters = () => {
  drawerVendor.value = undefined
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerItemType.value = undefined
}

const resetAdvancedFilters = () => {
  drawerVendor.value = undefined
  drawerLocation.value = undefined
  drawerCategory.value = undefined
  drawerItemType.value = undefined
  appliedAdvancedFilters.value = {
    vendor: undefined,
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
  }
})

// Load report data
const loadStockReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = null
    return
  }
  
  try {
    const startDateStr = `${startDateValue.value.year}-${String(startDateValue.value.month).padStart(2, '0')}-${String(startDateValue.value.day).padStart(2, '0')}`
    const endDateStr = `${endDateValue.value.year}-${String(endDateValue.value.month).padStart(2, '0')}-${String(endDateValue.value.day).padStart(2, '0')}`
    
    await locationsStore.fetchLocations()

    const data = await stockReport.generateStockReport(selectedCorporationId.value, selectedProjectId.value)

    let preferredRows: any[] = []
    let divisionRows: any[] = []
    let typeRows: any[] = []
    const corp = selectedCorporationId.value
    const proj = selectedProjectId.value
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
    if (prefSettled.status === 'fulfilled') {
      preferredRows = (prefSettled.value as any)?.data || []
    } else {
      console.error('Stock report: preferred items fetch failed', prefSettled.reason)
    }
    if (divSettled.status === 'fulfilled') {
      divisionRows = (divSettled.value as any)?.data || []
    } else {
      console.error('Stock report: item-divisions fetch failed', divSettled.reason)
    }
    if (typeSettled.status === 'fulfilled') {
      typeRows = (typeSettled.value as any)?.data || []
    } else {
      console.error('Stock report: item-types fetch failed', typeSettled.reason)
    }
    
    // Set reportData - use reactive assignment
    if (data && data.items && Array.isArray(data.items)) {
      // Filter items by lastPurchaseDate or lastStockUpdateDate within date range.
      // When a date range is selected, only include items with recorded activity in that window.
      const filteredItems = data.items.filter((item: any) => {
        // Use lastPurchaseDate if available, otherwise use lastStockUpdateDate
        const itemDate = item.lastPurchaseDate || item.lastStockUpdateDate
        
        // If item has no dated movement, it should not appear in date-scoped results.
        if (!itemDate) return false
        
        // If item has a date, filter by selected calendar date range
        const normalizedItemDate = dayjs(itemDate)
        if (!normalizedItemDate.isValid()) return false
        const dateOnly = normalizedItemDate.format('YYYY-MM-DD')
        return dateOnly >= startDateStr && dateOnly <= endDateStr
      })
      
      // Recalculate totals for filtered items
      const filteredTotals = filteredItems.reduce((acc: any, item: any) => {
        acc.currentStock += item.currentStock || 0
        acc.totalValue += item.totalValue || 0
        acc.reorderLevel += item.reorderLevel || 0
        acc.inShipment += item.inShipment || 0
        acc.returnedQty += item.returnedQty || 0
        return acc
      }, {
        currentStock: 0,
        totalValue: 0,
        reorderLevel: 0,
        inShipment: 0,
        returnedQty: 0
      })
      
      const enrichedItems = enrichStockItemsWithApiHierarchy(
        filteredItems.map((item) => ({ ...item })),
        preferredRows,
        divisionRows,
        typeRows
      )

      reportData.value = {
        items: enrichedItems,
        totals: filteredTotals
      }
    } else {
      reportData.value = null
    }
    
    // Force reactivity update
    await nextTick()
  } catch (error) {
    reportData.value = null
  }
}

const printReport = () => {
  window.print()
}

const syncCorporationFromStoreOrNimble = async () => {
  // Keep local filter in sync with globally selected corporation (TopBar/Nimble route sync).
  if (!selectedCorporationId.value && corporationStore.selectedCorporationId) {
    selectedCorporationId.value = corporationStore.selectedCorporationId
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
  await handleCorporationChangeFromSelect({ value: matched.uuid })
}

// Watch for corporation changes - clear report data
watch(selectedCorporationId, () => {
  selectedProjectId.value = undefined
  reportData.value = null
  resetAdvancedFilters()
})

// Watch for project changes - clear report data
watch(selectedProjectId, () => {
  reportData.value = null
  resetAdvancedFilters()
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

// Initialize with selected corporation from store if available
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

