<template>
  <div class="po-invoice-summary-report h-[88vh] print:h-auto">
    <!-- Header section - hidden in print -->
    <div class="mb-2 print:hidden">
      <div class="flex items-center justify-end gap-4 flex-wrap">
        <!-- Corporation, Project Selection, Date Range, Show and Print buttons -->
        <div class="flex items-end gap-2 flex-wrap">
          <!-- Corporation Select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Corporation <span class="text-red-500">*</span>
            </label>
            <CorporationSelect
              v-model="selectedCorporationId"
              size="sm"
              class="w-44"
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
              class="w-44"
              @update:model-value="handleProjectChange"
            />
          </div>

          <!-- Vendor Filter -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Vendor
            </label>
            <VendorSelect
              v-model="selectedVendorUuid"
              :corporation-uuid="selectedCorporationId || undefined"
              placeholder="All Vendors"
              size="sm"
              class="w-40"
              :disabled="!selectedCorporationId"
              :include-all-option="true"
              all-option-label="All Vendors"
            />
          </div>

          <!-- PO/CO Status Filter -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              PO Status
            </label>
            <USelectMenu
              v-model="selectedPoStatus"
              :items="poStatusOptions"
              placeholder="All Statuses"
              value-key="value"
              size="sm"
              class="w-36"
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
              class="w-36"
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
              class="w-36"
              @update:model-value="(v) => { endDateValue = v }"
            />
          </div>

          <!-- Show button -->
          <UButton
            :disabled="!canGenerateReport"
            icon="i-heroicons-magnifying-glass"
            variant="solid"
            size="sm"
            @click="handleShowReport"
          >
            Show
          </UButton>

          <!-- Export CSV button -->
          <UButton
            v-if="reportData && selectedProjectId && reportData.length > 0"
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            size="sm"
            @click="exportReportToCsv"
          >
            Export Excel
          </UButton>

          <!-- Print button -->
          <UButton
            v-if="reportData && selectedProjectId"
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

    <!-- Print Header - only visible in print -->
    <div class="hidden print:block print:mb-4 print:pb-4 print:border-b print:border-gray-300">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Purchase Order Details with Invoice Summary</h1>
        <div v-if="selectedProjectId && getProjectDetails" class="text-sm text-gray-700">
          <p class="font-semibold">Project: {{ getProjectDetails.projectName }} ({{ getProjectDetails.projectId }})</p>
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
          <p class="text-gray-500 text-lg">Please select a corporation to view the report</p>
        </div>
      <div v-else-if="!selectedProjectId" class="text-center py-12">
        <UIcon name="i-heroicons-folder" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a project to view the purchase order details with invoice summary</p>
      </div>
      <div v-else-if="!startDateValue || !endDateValue" class="text-center py-12">
        <UIcon name="i-heroicons-calendar" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select start date and end date to generate the report</p>
      </div>
      <div v-else-if="loading" class="space-y-3">
        <!-- Loading skeleton -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-32" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-32 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-32 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-32 ml-auto" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200 dark:border-gray-700">
                <td class="py-1 px-2 text-default text-xs">
                  <USkeleton class="h-3 w-20" />
                </td>
                <td class="py-1 px-2 text-default text-xs">
                  <USkeleton class="h-3 w-20" />
                </td>
                <td class="py-1 px-2 text-default text-xs">
                  <USkeleton class="h-3 w-40" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-right text-default text-xs">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </td>
                <td class="py-1 px-2 text-default text-xs">
                  <USkeleton class="h-3 w-16" />
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
      <div v-else-if="reportData && reportData.length > 0" class="space-y-3" :key="`report-${selectedProjectId}`">
          <!-- Project Summary -->
          <div class="flex items-center justify-between gap-4 flex-wrap print:hidden">
            <!-- Left Section: Project Name and Number -->
            <div class="bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 rounded p-2">
              <div class="text-left">
                <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  Project Name: {{ getProjectDetails?.projectName || 'N/A' }}
                </h3>
                <p class="text-xs text-primary-700 dark:text-primary-300">Project Number: {{ getProjectDetails?.projectId || 'N/A' }}</p>
              </div>
            </div>

            <!-- Center Section: Title -->
            <div class="flex-1 flex justify-center">
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Purchase Order Details with Invoice Summary</h1>
            </div>

            <!-- Right Section: Time Period -->
            <div class="bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 rounded p-2 min-w-fit">
              <div class="text-right">
                <p class="text-xs text-primary-600 dark:text-primary-400">Report Period</p>
                <p class="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  {{ startDateDisplayText }} to {{ endDateDisplayText }}
                </p>
              </div>
            </div>
          </div>

          <!-- Report Table - Grouped by Vendor -->
        <div class="overflow-x-auto print:overflow-visible">
          <table class="w-full border-collapse text-xs print:text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Submit Date</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">PO/CO Number</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Vendor / Source</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Goods Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Freight Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Additional Charges</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">HST</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">PO Total</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Total Invoiced</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Holdback</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Total Paid on Invoices</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Balance to be Invoiced*</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">PO Status</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="vendorGroup in reportData" :key="vendorGroup.vendor_uuid || vendorGroup.vendor_name">
                <!-- Vendor Header Row -->
                <tr class="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-400 dark:border-gray-600">
                  <td colspan="13" class="py-2 px-2 font-bold text-sm text-default">
                    {{ vendorGroup.vendor_name || 'N/A' }}
                  </td>
                </tr>
                <!-- PO/CO Rows for this Vendor -->
                <tr
                  v-for="row in vendorGroup.orders"
                  :key="row.uuid"
                  class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td class="py-1 px-2 text-default text-xs">{{ formatDate(row.submit_date) }}</td>
                  <td class="py-1 px-2 text-default text-xs font-medium">{{ row.po_number || row.co_number || '-' }}</td>
                  <td class="py-1 px-2 text-default text-xs">{{ row.vendor_name || '-' }}</td>
                  <td class="py-1 px-2 text-right text-default text-xs">
                    <ReportOrderPoAmountCell :row="row" :amount="row.goods_amount" />
                  </td>
                  <td class="py-1 px-2 text-right text-default text-xs">
                    <ReportOrderPoAmountCell :row="row" :amount="row.freight_amount" />
                  </td>
                  <td class="py-1 px-2 text-right text-default text-xs">
                    <ReportOrderPoAmountCell :row="row" :amount="row.additional_charges" />
                  </td>
                  <td class="py-1 px-2 text-right text-default text-xs">
                    <ReportOrderPoAmountCell :row="row" :amount="row.hst" />
                  </td>
                  <td class="py-1 px-2 text-right text-default text-xs font-semibold">
                    <ReportOrderPoAmountCell :row="row" :amount="row.po_total" />
                  </td>
                  <td class="py-1 px-2 text-right text-default text-xs">{{ formatCurrency(row.total_invoiced) }}</td>
                  <td class="py-1 px-2 text-right text-default text-xs">{{ formatCurrency(row.holdback) }}</td>
                  <td class="py-1 px-2 text-right text-default text-xs">{{ formatCurrency(row.total_paid) }}</td>
                  <td class="py-1 px-2 text-right text-default text-xs font-semibold">{{ formatCurrency(row.balance_to_invoice) }}</td>
                  <td class="py-1 px-2 text-default text-xs">{{ formatStatus(row.status) }}</td>
                </tr>
                <!-- Vendor Summary Row -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 font-semibold">
                  <td colspan="3" class="py-2 px-2 text-default text-xs text-right">Total for {{ vendorGroup.vendor_name || 'N/A' }}:</td>
                  <td class="py-2 px-2 text-right text-default text-xs">
                    <ReportVendorPoAmountCell :orders="vendorGroup.orders" field="goods_amount" />
                  </td>
                  <td class="py-2 px-2 text-right text-default text-xs">
                    <ReportVendorPoAmountCell :orders="vendorGroup.orders" field="freight_amount" />
                  </td>
                  <td class="py-2 px-2 text-right text-default text-xs">
                    <ReportVendorPoAmountCell :orders="vendorGroup.orders" field="additional_charges" />
                  </td>
                  <td class="py-2 px-2 text-right text-default text-xs">
                    <ReportVendorPoAmountCell :orders="vendorGroup.orders" field="hst" />
                  </td>
                  <td class="py-2 px-2 text-right text-default text-xs">
                    <ReportVendorPoAmountCell :orders="vendorGroup.orders" field="po_total" />
                  </td>
                  <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendorGroup.vendor_totals.total_invoiced) }}</td>
                  <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendorGroup.vendor_totals.holdback) }}</td>
                  <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendorGroup.vendor_totals.total_paid) }}</td>
                  <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendorGroup.vendor_totals.balance_to_invoice) }}</td>
                  <td class="py-2 px-2 text-default text-xs">-</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!reportData || reportData.length === 0)" class="text-center py-12">
        <UIcon name="i-heroicons-document-chart-bar" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">No report data available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { useDateFormat } from '~/composables/useDateFormat'
import { extractCalendarYmdFromStoredDate } from '~/utils/calendarDateRange'
import {
  isPoEntryDateWithinLocalYmdRange,
  poEntryDateFilterToApiBounds,
} from '~/utils/purchaseOrderEntryDateFilter'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import DatePickerField from '~/components/shared/DatePickerField.vue'
import ReportOrderPoAmountCell from '~/components/Reports/ReportOrderPoAmountCell.vue'
import ReportVendorPoAmountCell from '~/components/Reports/ReportVendorPoAmountCell.vue'
import {
  formatReportPoAmountForExport,
  formatReportVendorPoAmountForExport,
} from '~/utils/reportPoCurrencyDisplay'
import {
  resolveCorporationDisplayName,
  resolveProjectDisplayLabel,
} from '~/utils/csvExport'
import {
  buildReportExcelFilename,
  downloadReportExcelFile,
} from '~/utils/reportExcelExport.client'

const { fromUTCString, toUTCString } = useUTCDateFormat()

// Set page title
useHead({
  title: 'Purchase Order Details with Invoice Summary - Property Management'
})

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

// Stores
const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = Boolean(runtimeConfig.public.nimbleIntegrations)
const { corporationId: nimbleCorporationIdFromUrl } = useNimbleContext()

// State
const selectedCorporationId = ref<string | undefined>(undefined)
const selectedProjectId = ref<string | undefined>(undefined)
const selectedVendorUuid = ref<string | undefined>(undefined)
const selectedPoStatus = ref<string | undefined>(undefined)
const selectedTransactionRange = ref<string>('YEAR_TO_DATE')
const reportData = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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

const poStatusOptions = [
  { label: 'All Statuses', value: '__ALL__' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
  { label: 'Completed', value: 'COMPLETED' },
]

const normalizeVendorFilter = (value?: string | null) => {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '__ALL__') return undefined
  return raw
}

const normalizeStatusFilter = (value?: string | null) => {
  const raw = String(value ?? '').trim().toUpperCase()
  if (!raw || raw === '__ALL__') return undefined
  return raw
}

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

// Check if report can be generated
const canGenerateReport = computed(() => {
  return !!(
    selectedCorporationId.value &&
    selectedProjectId.value &&
    startDateValue.value &&
    endDateValue.value &&
    startDateValue.value <= endDateValue.value
  )
})

// Currency formatting
const { formatCurrency } = useCurrencyFormat()
const { formatDate: formatReportDate } = useDateFormat()

const formatDate = (date: string | null | undefined): string => {
  const formatted = formatReportDate(date)
  return formatted || '-'
}

// Status formatting
const formatStatus = (status: string | null | undefined): string => {
  if (!status) return '-'
  // Convert draft status to pending
  if (status.toLowerCase() === 'draft') {
    return 'Pending'
  }
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Get project details for print header
const getProjectDetails = computed(() => {
  if (!selectedProjectId.value) return null
  const project = projectsStore.projects.find(p => p.uuid === selectedProjectId.value)
  return project ? { 
    projectName: project.project_name, 
    projectId: project.project_id || 'N/A' 
  } : null
})

// Handlers
const handleCorporationChangeFromSelect = async (corporation: any) => {
  // Clear project selection when corporation changes
  selectedProjectId.value = undefined
  selectedVendorUuid.value = undefined
  
  // Fetch projects for the selected corporation
  // ProjectSelect component will also fetch if needed, but we fetch here to ensure data is available
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
  // Clear report data when project changes - user needs to click Show button
  if (!projectId) {
    reportData.value = []
  }
}

const handleShowReport = async () => {
  if (!canGenerateReport.value) {
    return
  }
  await loadReport()
}

// Load report data (single batched API — avoids N+1 PO/CO invoice and item fetches)
const loadReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = []
    return
  }

  const startDate =
    extractCalendarYmdFromStoredDate(startDateValue.value, fromUTCString) ?? ''
  const endDate =
    extractCalendarYmdFromStoredDate(endDateValue.value, fromUTCString) ?? ''

  loading.value = true
  error.value = null

  try {
    const params: Record<string, string> = {
      corporation_uuid: selectedCorporationId.value,
      project_uuid: selectedProjectId.value,
      start_date: startDate,
      end_date: endDate,
    }

    const vendorFilter = normalizeVendorFilter(selectedVendorUuid.value)
    if (vendorFilter) {
      params.vendor_uuid = vendorFilter
    }

    const statusFilter = normalizeStatusFilter(selectedPoStatus.value)
    if (statusFilter) {
      params.po_status = statusFilter
    }

    const entryDateBounds = poEntryDateFilterToApiBounds(startDate, endDate)
    if (entryDateBounds) {
      params.entry_date_from = entryDateBounds.entry_date_from
      params.entry_date_to = entryDateBounds.entry_date_to
    }

    const response = await $fetch<{ data?: any[] }>(
      '/api/reports/purchase-order-details-invoice-summary',
      { method: 'GET', params }
    )

    const isWithinSelectedDateRange = (value?: string | null) =>
      isPoEntryDateWithinLocalYmdRange(value, startDate, endDate)

    reportData.value = (Array.isArray(response?.data) ? response.data : [])
      .map((vendorGroup) => {
        const orders = (vendorGroup.orders || []).filter((order: { submit_date?: string | null }) =>
          isWithinSelectedDateRange(order.submit_date)
        )
        if (!orders.length) return null

        const vendor_totals = orders.reduce(
          (totals: Record<string, number>, order: Record<string, number>) => ({
            goods_amount: totals.goods_amount + (order.goods_amount || 0),
            freight_amount: totals.freight_amount + (order.freight_amount || 0),
            additional_charges: totals.additional_charges + (order.additional_charges || 0),
            hst: totals.hst + (order.hst || 0),
            po_total: totals.po_total + (order.po_total || 0),
            total_invoiced: totals.total_invoiced + (order.total_invoiced || 0),
            holdback: totals.holdback + (order.holdback || 0),
            total_paid: totals.total_paid + (order.total_paid || 0),
            balance_to_invoice: totals.balance_to_invoice + (order.balance_to_invoice || 0),
          }),
          {
            goods_amount: 0,
            freight_amount: 0,
            additional_charges: 0,
            hst: 0,
            po_total: 0,
            total_invoiced: 0,
            holdback: 0,
            total_paid: 0,
            balance_to_invoice: 0,
          }
        )

        return {
          ...vendorGroup,
          orders,
          vendor_totals,
        }
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)
  } catch (err: any) {
    console.error('Error loading report:', err)
    error.value = err.message || 'Failed to load purchase order details with invoice summary'
    reportData.value = []
  } finally {
    loading.value = false
  }
}

const printReport = () => {
  window.print()
}

const exportReportToCsv = () => {
  if (!reportData.value?.length) return

  const rows: unknown[][] = [[
    'Vendor',
    'Submit Date',
    'PO/CO Number',
    'Vendor / Source',
    'Goods Amount',
    'Freight Amount',
    'Additional Charges',
    'HST',
    'PO Total',
    'Total Invoiced',
    'Holdback',
    'Total Paid on Invoices',
    'Balance to be Invoiced',
    'PO Status',
  ]]

  for (const vendorGroup of reportData.value) {
    for (const order of vendorGroup.orders || []) {
      rows.push([
        vendorGroup.vendor_name || '',
        formatDate(order.submit_date),
        order.po_number || order.co_number || '',
        order.vendor_name || '',
        formatReportPoAmountForExport(order.goods_amount, order),
        formatReportPoAmountForExport(order.freight_amount, order),
        formatReportPoAmountForExport(order.additional_charges, order),
        formatReportPoAmountForExport(order.hst, order),
        formatReportPoAmountForExport(order.po_total, order),
        order.total_invoiced ?? 0,
        order.holdback ?? 0,
        order.total_paid ?? 0,
        order.balance_to_invoice ?? 0,
        formatStatus(order.status),
      ])
    }

    const totals = vendorGroup.vendor_totals
    if (totals) {
      rows.push([
        vendorGroup.vendor_name || '',
        '',
        '',
        `Total for ${vendorGroup.vendor_name || 'N/A'}`,
        formatReportVendorPoAmountForExport(vendorGroup.orders || [], 'goods_amount'),
        formatReportVendorPoAmountForExport(vendorGroup.orders || [], 'freight_amount'),
        formatReportVendorPoAmountForExport(vendorGroup.orders || [], 'additional_charges'),
        formatReportVendorPoAmountForExport(vendorGroup.orders || [], 'hst'),
        formatReportVendorPoAmountForExport(vendorGroup.orders || [], 'po_total'),
        totals.total_invoiced ?? 0,
        totals.holdback ?? 0,
        totals.total_paid ?? 0,
        totals.balance_to_invoice ?? 0,
        '',
      ])
    }
  }

  const project = projectsStore.projects.find((p) => p.uuid === selectedProjectId.value)
  void downloadReportExcelFile(
    buildReportExcelFilename('purchase-order-details-invoice-summary', project?.project_id),
    {
      title: 'Purchase Order Details with Invoice Summary',
      corporationName: resolveCorporationDisplayName(
        corporationStore.corporations as any[],
        selectedCorporationId.value
      ),
      projectLabel: resolveProjectDisplayLabel(
        projectsStore.projects as any[],
        selectedProjectId.value
      ),
      dateRange: `${startDateDisplayText.value} to ${endDateDisplayText.value}`,
    },
    rows
  )
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
  reportData.value = []
})

// Watch for project changes - clear report data
watch(selectedProjectId, () => {
  reportData.value = []
})

watch(selectedVendorUuid, () => {
  reportData.value = []
})

watch(selectedPoStatus, () => {
  reportData.value = []
})

watch(selectedTransactionRange, (range) => {
  applyTransactionRange(range)
  reportData.value = []
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
  .po-invoice-summary-report,
  .po-invoice-summary-report * {
    max-height: none !important;
  }

  .po-invoice-summary-report {
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

  /* Allow page breaks between vendor groups */
  tbody tr[class*="bg-gray-200"] {
    page-break-after: auto;
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
  .space-y-3 > * + * {
    margin-top: 0.75rem !important;
  }

  /* Hide loading states */
  [class*="loading"],
  [v-if*="loading"] {
    display: none !important;
  }
}
</style>

