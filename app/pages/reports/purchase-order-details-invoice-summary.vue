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
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                icon="i-heroicons-calendar"
                size="sm"
                variant="outline"
                class="w-36"
              >
                {{ startDateDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="startDateValue"
                  :min-value="minDate"
                  :max-value="endDateValue || maxDate"
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
                class="w-36"
              >
                {{ endDateDisplayText }}
              </UButton>
              <template #content>
                <UCalendar
                  v-model="endDateValue"
                  :min-value="startDateValue || minDate"
                  :max-value="maxDate"
                  class="p-2"
                />
              </template>
            </UPopover>
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
import { useRouter } from 'vue-router'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import ReportOrderPoAmountCell from '~/components/Reports/ReportOrderPoAmountCell.vue'
import ReportVendorPoAmountCell from '~/components/Reports/ReportVendorPoAmountCell.vue'
import { normalizePoCurrencyConversionFields } from '~/utils/poCurrencyConversion'
import { formatReportPoAmountForExport } from '~/utils/reportPoCurrencyDisplay'
import dayjs from 'dayjs'

const router = useRouter()

// Navigation
const goBack = () => {
  router.back()
}

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

// Date range state
const currentYear = new Date().getFullYear()
const todayDate = today(getLocalTimeZone())
const startDateValue = ref<CalendarDate | null>(new CalendarDate(currentYear, 1, 1))
const endDateValue = ref<CalendarDate | null>(todayDate)

const transactionRangeOptions = [
  { label: 'Year to date', value: 'YEAR_TO_DATE' },
  { label: 'Month to date', value: 'MONTH_TO_DATE' },
  { label: 'Week to date', value: 'WEEK_TO_DATE' },
  { label: 'Last year', value: 'LAST_YEAR' },
]

const poStatusOptions = [
  { label: 'All Statuses', value: '__ALL__' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'On Hold', value: 'ON_HOLD' },
]

const normalizeVendorFilter = (value?: string | null) => {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '__ALL__') return undefined
  return raw
}

const normalizeStatusForFilter = (status?: string | null) => {
  const raw = String(status ?? '').trim().toUpperCase()
  if (!raw) return ''
  return raw === 'DRAFT' ? 'PENDING' : raw
}

const normalizeStatusFilter = (value?: string | null) => {
  const raw = String(value ?? '').trim().toUpperCase()
  if (!raw || raw === '__ALL__') return undefined
  return raw
}

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
    const dayOfWeek = start.getDay() // 0=Sun, 1=Mon ... 6=Sat
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

// Date formatting
const df = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium'
})

const startDateDisplayText = computed(() => {
  if (!startDateValue.value) return 'Select start date'
  return df.format(startDateValue.value.toDate(getLocalTimeZone()))
})

const endDateDisplayText = computed(() => {
  if (!endDateValue.value) return 'Select end date'
  return df.format(endDateValue.value.toDate(getLocalTimeZone()))
})

const minDate = new CalendarDate(1900, 1, 1)
const maxDate = todayDate

// Check if report can be generated
const canGenerateReport = computed(() => {
  return !!(
    selectedCorporationId.value &&
    selectedProjectId.value &&
    startDateValue.value &&
    endDateValue.value &&
    startDateValue.value.compare(endDateValue.value) <= 0
  )
})

// Currency formatting
const { formatCurrency } = useCurrencyFormat()

// Date formatting
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  } catch {
    return '-'
  }
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

// Load report data
const loadReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = []
    return
  }
  
  const startDate = `${startDateValue.value.year}-${String(startDateValue.value.month).padStart(2, '0')}-${String(startDateValue.value.day).padStart(2, '0')}`
  const endDate = `${endDateValue.value.year}-${String(endDateValue.value.month).padStart(2, '0')}-${String(endDateValue.value.day).padStart(2, '0')}`

  const isWithinSelectedDateRange = (value?: string | null): boolean => {
    const recordDate = dayjs(value)
    if (!recordDate.isValid()) return false
    return recordDate.format('YYYY-MM-DD') >= startDate && recordDate.format('YYYY-MM-DD') <= endDate
  }
  
  loading.value = true
  error.value = null
  
  try {
    // Fetch purchase orders
    const poParams: any = {
      corporation_uuid: selectedCorporationId.value
    }
    
    const poResponse: any = await $fetch('/api/purchase-order-forms', {
      method: 'GET',
      params: poParams
    })
    
    const purchaseOrders = poResponse?.data || []
    
    // Filter by project, exclude labor POs, and date range (using entry_date in UTC)
    let filteredPOs = purchaseOrders.filter((po: any) => {
      return po.project_uuid === selectedProjectId.value
    })
    
    // Exclude labor type purchase orders
    filteredPOs = filteredPOs.filter((po: any) => {
      const poType = String(po.po_type || '').toUpperCase()
      return poType !== 'LABOR'
    })
    
    // Filter by selected date range (calendar-date comparison)
    filteredPOs = filteredPOs.filter((po: any) => {
      return isWithinSelectedDateRange(po.entry_date)
    })

    const vendorFilter = normalizeVendorFilter(selectedVendorUuid.value)
    if (vendorFilter) {
      filteredPOs = filteredPOs.filter((po: any) => String(po.vendor_uuid || '') === vendorFilter)
    }

    const statusFilter = normalizeStatusFilter(selectedPoStatus.value)
    if (statusFilter) {
      filteredPOs = filteredPOs.filter((po: any) => normalizeStatusForFilter(po.status) === statusFilter)
    }
    
    // Fetch change orders
    const coParams: any = {
      corporation_uuid: selectedCorporationId.value
    }
    
    let changeOrders: any[] = []
    try {
      const coResponse: any = await $fetch('/api/change-orders', {
        method: 'GET',
        params: coParams
      })
      changeOrders = coResponse?.data || []
    } catch (coError) {
      console.error('Error fetching change orders:', coError)
    }
    
    // Filter change orders by project and date range (using created_date in UTC)
    let filteredCOs = changeOrders.filter((co: any) => {
      return co.project_uuid === selectedProjectId.value
    })
    
    // Filter by selected date range (calendar-date comparison)
    filteredCOs = filteredCOs.filter((co: any) => {
      return isWithinSelectedDateRange(co.created_date)
    })

    // Exclude labor type change orders (report should only show non-labor sources)
    filteredCOs = filteredCOs.filter((co: any) => {
      const coType = String(co.co_type || '').toUpperCase()
      return coType !== 'LABOR'
    })

    if (vendorFilter) {
      filteredCOs = filteredCOs.filter((co: any) => String(co.vendor_uuid || '') === vendorFilter)
    }

    if (statusFilter) {
      filteredCOs = filteredCOs.filter((co: any) => normalizeStatusForFilter(co.status) === statusFilter)
    }
    
    // Fetch vendors once for all purchase orders and change orders
    let vendors: any[] = []
    try {
      const vendorResponse: any = await $fetch('/api/purchase-orders/vendors', {
        method: 'GET',
        params: {
          corporation_uuid: selectedCorporationId.value
        }
      })
      vendors = vendorResponse?.data || []
    } catch (vendorError) {
      console.error('Error fetching vendors:', vendorError)
    }
    
    // Create vendor map for quick lookup
    const vendorMap = new Map(vendors.map((v: any) => [v.uuid, v.vendor_name]))
    
    // Process purchase orders
    const poReportData = await Promise.all(
      filteredPOs.map(async (po: any) => {
        try {
          // Get vendor name
          const vendorName = po.vendor_uuid ? (vendorMap.get(po.vendor_uuid) || 'N/A') : 'N/A'
          
          // Fetch invoices for this PO
          let invoices: any[] = []
          try {
            const invoiceResponse: any = await $fetch('/api/vendor-invoices', {
              method: 'GET',
              params: {
                corporation_uuid: selectedCorporationId.value,
                purchase_order_uuid: po.uuid
              }
            })
            // Filter invoices to ensure they are specifically linked to this PO
            // The API should already filter by purchase_order_uuid, but we double-check here
            invoices = (invoiceResponse?.data || []).filter((inv: any) => {
              // Only include invoices that are explicitly linked to this PO
              return inv.purchase_order_uuid === po.uuid
            })
          } catch (invoiceError) {
            console.error('Error fetching invoices for PO:', po.uuid, invoiceError)
          }
          
          // Calculate invoice summary
          const totalInvoiced = invoices.reduce((sum, inv) => {
            // Use total_invoice_amount (saved value) or amount as fallback
            let invAmount = inv.total_invoice_amount ?? inv.amount ?? 0
            
            // If total_invoice_amount is not available, try to get from financial_breakdown
            if (!invAmount || invAmount === 0) {
              let fb = inv.financial_breakdown
              if (typeof fb === 'string') {
                try {
                  fb = JSON.parse(fb)
                } catch (e) {
                  // Failed to parse
                }
              }
              if (fb && typeof fb === 'object' && fb.totals) {
                invAmount = fb.totals.total_invoice_amount ?? fb.totals.amount ?? 0
              }
            }
            
            return sum + (typeof invAmount === 'number' ? invAmount : parseFloat(String(invAmount)) || 0)
          }, 0)
          
          const holdback = invoices.reduce((sum, inv) => {
            // Priority: Get holdback_amount from financial_breakdown (saved value)
            let holdbackAmount = 0
            
            let fb = inv.financial_breakdown
            if (typeof fb === 'string') {
              try {
                fb = JSON.parse(fb)
              } catch (e) {
                // Failed to parse
              }
            }
            if (fb && typeof fb === 'object' && fb.totals) {
              holdbackAmount = fb.totals.holdback_amount ?? 0
            }
            
            // Fallback to direct holdback_amount field
            if (!holdbackAmount || holdbackAmount === 0) {
              holdbackAmount = inv.holdback_amount ?? 0
            }
            
            return sum + (typeof holdbackAmount === 'number' ? holdbackAmount : parseFloat(String(holdbackAmount)) || 0)
          }, 0)
          
          const totalPaid = invoices.reduce((sum, inv) => {
            // Only count invoices with "Paid" status
            const status = String(inv.status || '').toLowerCase()
            if (status === 'paid') {
              // Use total_invoice_amount (saved value) or amount as fallback
              let paidAmount = inv.total_invoice_amount ?? inv.amount ?? 0
              
              // If total_invoice_amount is not available, try to get from financial_breakdown
              if (!paidAmount || paidAmount === 0) {
                let fb = inv.financial_breakdown
                if (typeof fb === 'string') {
                  try {
                    fb = JSON.parse(fb)
                  } catch (e) {
                    // Failed to parse
                  }
                }
                if (fb && typeof fb === 'object' && fb.totals) {
                  paidAmount = fb.totals.total_invoice_amount ?? fb.totals.amount ?? 0
                }
              }
              
              return sum + (typeof paidAmount === 'number' ? paidAmount : parseFloat(String(paidAmount)) || 0)
            }
            return sum
          }, 0)
          
          // Calculate item_total from items if not available (labor POs are excluded)
          let itemTotal = po.item_total
          if (!itemTotal || itemTotal === 0) {
            // Fetch items to calculate item_total
            try {
              const itemsResponse: any = await $fetch('/api/purchase-order-items', {
                method: 'GET',
                params: {
                  purchase_order_uuid: po.uuid
                }
              })
              const items = itemsResponse?.data || []
              
              // Calculate item_total from items
              if (items.length > 0) {
                itemTotal = items.reduce((sum: number, item: any) => {
                  const itemAmount = item.po_total || item.total || ((item.po_quantity || item.quantity || 0) * (item.po_unit_price || item.unit_price || 0))
                  return sum + (itemAmount || 0)
                }, 0)
              }
            } catch (itemError) {
              console.error('Error fetching items for PO:', po.uuid, itemError)
            }
          }
          
          // Use item_total as goods_amount (this is the total of all items without charges/taxes)
          const goodsAmount = itemTotal || 0
          const freightAmount = po.freight_charges_amount ?? 0
          const additionalCharges = (po.packing_charges_amount ?? 0) + 
                                   (po.custom_duties_charges_amount ?? 0) + 
                                   (po.other_charges_amount ?? 0)
          const hst = (po.sales_tax_1_amount ?? 0) + (po.sales_tax_2_amount || 0)
          const poTotal = goodsAmount + freightAmount + additionalCharges + hst
          
          // Calculate balance to be invoiced
          const balanceToInvoice = poTotal - totalInvoiced
          
          return {
            uuid: po.uuid,
            type: 'PO',
            submit_date: po.submit_date || po.created_at,
            po_number: po.po_number,
            co_number: null,
            vendor_name: vendorName,
            goods_amount: goodsAmount,
            freight_amount: freightAmount,
            additional_charges: additionalCharges,
            hst: hst,
            po_total: poTotal,
            total_invoiced: totalInvoiced,
            holdback: holdback,
            total_paid: totalPaid,
            balance_to_invoice: balanceToInvoice,
            status: po.status,
            ...normalizePoCurrencyConversionFields(po),
          }
        } catch (error) {
          console.error('Error processing PO:', po.uuid, error)
          return {
            uuid: po.uuid,
            type: 'PO',
            submit_date: po.submit_date || po.created_at,
            po_number: po.po_number,
            co_number: null,
            vendor_uuid: po.vendor_uuid || null,
            vendor_name: 'N/A',
            goods_amount: 0,
            freight_amount: 0,
            additional_charges: 0,
            hst: 0,
            po_total: 0,
            total_invoiced: 0,
            holdback: 0,
            total_paid: 0,
            balance_to_invoice: 0,
            status: po.status
          }
        }
      })
    )
    
    // Process change orders
    const coReportData = await Promise.all(
      filteredCOs.map(async (co: any) => {
        try {
          // Get vendor name
          const vendorName = co.vendor_uuid ? (vendorMap.get(co.vendor_uuid) || 'N/A') : 'N/A'
          
          // Fetch invoices for this CO
          let invoices: any[] = []
          try {
            const invoiceResponse: any = await $fetch('/api/vendor-invoices', {
              method: 'GET',
              params: {
                corporation_uuid: selectedCorporationId.value,
                change_order_uuid: co.uuid
              }
            })
            // Filter invoices to ensure they are specifically linked to this CO
            // The API should already filter by change_order_uuid, but we double-check here
            invoices = (invoiceResponse?.data || []).filter((inv: any) => {
              // Only include invoices that are explicitly linked to this CO
              return inv.change_order_uuid === co.uuid
            })
          } catch (invoiceError) {
            console.error('Error fetching invoices for CO:', co.uuid, invoiceError)
          }
          
          // Calculate invoice summary
          const totalInvoiced = invoices.reduce((sum, inv) => {
            // Use total_invoice_amount (saved value) or amount as fallback
            let invAmount = inv.total_invoice_amount ?? inv.amount ?? 0
            
            // If total_invoice_amount is not available, try to get from financial_breakdown
            if (!invAmount || invAmount === 0) {
              let fb = inv.financial_breakdown
              if (typeof fb === 'string') {
                try {
                  fb = JSON.parse(fb)
                } catch (e) {
                  // Failed to parse
                }
              }
              if (fb && typeof fb === 'object' && fb.totals) {
                invAmount = fb.totals.total_invoice_amount ?? fb.totals.amount ?? 0
              }
            }
            
            return sum + (typeof invAmount === 'number' ? invAmount : parseFloat(String(invAmount)) || 0)
          }, 0)
          
          const holdback = invoices.reduce((sum, inv) => {
            // Priority: Get holdback_amount from financial_breakdown (saved value)
            let holdbackAmount = 0
            
            let fb = inv.financial_breakdown
            if (typeof fb === 'string') {
              try {
                fb = JSON.parse(fb)
              } catch (e) {
                // Failed to parse
              }
            }
            if (fb && typeof fb === 'object' && fb.totals) {
              holdbackAmount = fb.totals.holdback_amount ?? 0
            }
            
            // Fallback to direct holdback_amount field
            if (!holdbackAmount || holdbackAmount === 0) {
              holdbackAmount = inv.holdback_amount ?? 0
            }
            
            return sum + (typeof holdbackAmount === 'number' ? holdbackAmount : parseFloat(String(holdbackAmount)) || 0)
          }, 0)
          
          const totalPaid = invoices.reduce((sum, inv) => {
            // Only count invoices with "Paid" status
            const status = String(inv.status || '').toLowerCase()
            if (status === 'paid') {
              // Use total_invoice_amount (saved value) or amount as fallback
              let paidAmount = inv.total_invoice_amount ?? inv.amount ?? 0
              
              // If total_invoice_amount is not available, try to get from financial_breakdown
              if (!paidAmount || paidAmount === 0) {
                let fb = inv.financial_breakdown
                if (typeof fb === 'string') {
                  try {
                    fb = JSON.parse(fb)
                  } catch (e) {
                    // Failed to parse
                  }
                }
                if (fb && typeof fb === 'object' && fb.totals) {
                  paidAmount = fb.totals.total_invoice_amount ?? fb.totals.amount ?? 0
                }
              }
              
              return sum + (typeof paidAmount === 'number' ? paidAmount : parseFloat(String(paidAmount)) || 0)
            }
            return sum
          }, 0)
          
          // Calculate item_total from items if not available
          let itemTotal = co.item_total
          if (!itemTotal || itemTotal === 0) {
            // Fetch items to calculate item_total
            try {
              const coType = (co.co_type || '').toUpperCase()
              const isLaborCO = coType === 'LABOR'
              
              let items: any[] = []
              if (isLaborCO) {
                const laborItemsResponse: any = await $fetch('/api/labor-change-order-items', {
                  method: 'GET',
                  params: {
                    change_order_uuid: co.uuid
                  }
                })
                items = laborItemsResponse?.data || []
              } else {
                const itemsResponse: any = await $fetch('/api/change-order-items', {
                  method: 'GET',
                  params: {
                    change_order_uuid: co.uuid
                  }
                })
                items = itemsResponse?.data || []
              }
              
              // Calculate item_total from items
              if (items.length > 0) {
                itemTotal = items.reduce((sum: number, item: any) => {
                  const itemAmount = item.co_total || item.total || ((item.co_quantity || item.quantity || 0) * (item.co_unit_price || item.unit_price || 0))
                  return sum + (itemAmount || 0)
                }, 0)
              }
            } catch (itemError) {
              console.error('Error fetching items for CO:', co.uuid, itemError)
            }
          }
          
          // Use item_total as goods_amount (this is the total of all items without charges/taxes)
          const goodsAmount = itemTotal || 0
          const freightAmount = co.freight_charges_amount ?? 0
          const additionalCharges = (co.packing_charges_amount ?? 0) + 
                                   (co.custom_duties_charges_amount ?? 0) + 
                                   (co.other_charges_amount ?? 0)
          const hst = (co.sales_tax_1_amount ?? 0) + (co.sales_tax_2_amount || 0)
          const coTotal = goodsAmount + freightAmount + additionalCharges + hst
          
          // Calculate balance to be invoiced
          const balanceToInvoice = coTotal - totalInvoiced
          
          return {
            uuid: co.uuid,
            type: 'CO',
            submit_date: co.created_date || co.created_at,
            po_number: null,
            co_number: co.co_number,
            vendor_uuid: co.vendor_uuid || null,
            vendor_name: vendorName,
            goods_amount: goodsAmount,
            freight_amount: freightAmount,
            additional_charges: additionalCharges,
            hst: hst,
            po_total: coTotal,
            total_invoiced: totalInvoiced,
            holdback: holdback,
            total_paid: totalPaid,
            balance_to_invoice: balanceToInvoice,
            status: co.status,
            ...normalizePoCurrencyConversionFields(co),
          }
        } catch (error) {
          console.error('Error processing CO:', co.uuid, error)
          return {
            uuid: co.uuid,
            type: 'CO',
            submit_date: co.created_date || co.created_at,
            po_number: null,
            co_number: co.co_number,
            vendor_uuid: co.vendor_uuid || null,
            vendor_name: 'N/A',
            goods_amount: 0,
            freight_amount: 0,
            additional_charges: 0,
            hst: 0,
            po_total: 0,
            total_invoiced: 0,
            holdback: 0,
            total_paid: 0,
            balance_to_invoice: 0,
            status: co.status
          }
        }
      })
    )
    
    // Combine PO and CO data
    const allReportData = [...poReportData, ...coReportData]
    
    // Group by vendor
    const vendorGroups = new Map<string, {
      vendor_uuid: string | null
      vendor_name: string
      orders: any[]
      vendor_totals: {
        goods_amount: number
        freight_amount: number
        additional_charges: number
        hst: number
        po_total: number
        total_invoiced: number
        holdback: number
        total_paid: number
        balance_to_invoice: number
      }
    }>()
    
    // Process each order and group by vendor
    allReportData.forEach((order: any) => {
      const vendorKey = order.vendor_name || 'N/A'
      const vendorUuid = order.vendor_uuid || null
      
      if (!vendorGroups.has(vendorKey)) {
        vendorGroups.set(vendorKey, {
          vendor_uuid: vendorUuid,
          vendor_name: order.vendor_name || 'N/A',
          orders: [],
          vendor_totals: {
            goods_amount: 0,
            freight_amount: 0,
            additional_charges: 0,
            hst: 0,
            po_total: 0,
            total_invoiced: 0,
            holdback: 0,
            total_paid: 0,
            balance_to_invoice: 0
          }
        })
      }
      
      const vendorGroup = vendorGroups.get(vendorKey)!
      vendorGroup.orders.push(order)
      
      // Add to vendor totals
      vendorGroup.vendor_totals.goods_amount += order.goods_amount || 0
      vendorGroup.vendor_totals.freight_amount += order.freight_amount || 0
      vendorGroup.vendor_totals.additional_charges += order.additional_charges || 0
      vendorGroup.vendor_totals.hst += order.hst || 0
      vendorGroup.vendor_totals.po_total += order.po_total || 0
      vendorGroup.vendor_totals.total_invoiced += order.total_invoiced || 0
      vendorGroup.vendor_totals.holdback += order.holdback || 0
      vendorGroup.vendor_totals.total_paid += order.total_paid || 0
      vendorGroup.vendor_totals.balance_to_invoice += order.balance_to_invoice || 0
    })
    
    // Convert map to array and sort orders within each vendor group by submit date (newest first)
    const groupedData = Array.from(vendorGroups.values()).map(vendorGroup => {
      // Sort orders within vendor group by submit date (newest first)
      vendorGroup.orders.sort((a, b) => {
        const dateA = new Date(a.submit_date || 0).getTime()
        const dateB = new Date(b.submit_date || 0).getTime()
        return dateB - dateA
      })
      return vendorGroup
    })
    
    // Sort vendor groups alphabetically by vendor name
    groupedData.sort((a, b) => {
      const nameA = (a.vendor_name || '').toLowerCase()
      const nameB = (b.vendor_name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
    
    reportData.value = groupedData
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
    size: A4 portrait;
  }

  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
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

