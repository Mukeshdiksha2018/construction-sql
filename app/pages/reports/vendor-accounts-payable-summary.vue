<template>
  <div class="h-[88vh] print:h-auto">
    <!-- Header section - hidden in print -->
    <div class="mb-2 print:hidden">
      <div class="flex items-center justify-end gap-4 flex-wrap">
        <!-- Corporation, Project Selection, Date Range, Show and Print buttons -->
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

          <!-- Vendor Filter -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-default whitespace-nowrap">
              Vendor
            </label>
            <VendorSelect
              v-model="selectedVendorId"
              :corporation-uuid="selectedCorporationId || undefined"
              placeholder="All Vendors"
              size="sm"
              class="w-64"
              :disabled="!selectedCorporationId"
              :include-all-option="true"
              all-option-label="All Vendors"
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
              Period From <span class="text-red-500">*</span>
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
              Period To <span class="text-red-500">*</span>
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
            v-if="filteredReportData && filteredReportData.vendors && filteredReportData.vendors.length > 0 && selectedProjectId"
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            size="sm"
            @click="exportReportToCsv"
          >
            Export Excel
          </UButton>

          <!-- Print button -->
          <UButton
            v-if="filteredReportData && filteredReportData.vendors && filteredReportData.vendors.length > 0 && selectedProjectId"
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
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Vendor Accounts Payable Summary</h1>
        <div v-if="reportData" class="text-sm text-gray-700">
          <p class="font-semibold">Project: {{ reportData.project.projectName }} ({{ reportData.project.projectId }})</p>
          <p v-if="startDateValue && endDateValue" class="text-xs text-gray-600 mt-1">
            Period From: {{ startDateDisplayText }} To {{ endDateDisplayText }}
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
        <p class="text-gray-500 text-lg">Please select a project to view the vendor accounts payable summary</p>
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
                <th v-for="i in 10" :key="i" class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i" class="border-b border-gray-200 dark:border-gray-700">
                <td v-for="j in 10" :key="j" class="py-2 px-2">
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
      <div v-else-if="filteredReportData && filteredReportData.vendors && filteredReportData.vendors.length > 0" class="space-y-3" :key="`report-${selectedProjectId}`">
        <!-- Project Summary -->
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <!-- Left Section: Project Name and Number -->
          <div class="bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 rounded p-2">
            <div class="text-left">
              <h3 class="text-sm font-semibold text-primary-900 dark:text-primary-100">
                Project Name: {{ filteredReportData.project.projectName }}
              </h3>
              <p class="text-xs text-primary-700 dark:text-primary-300">Project Number: {{ filteredReportData.project.projectId }}</p>
            </div>
          </div>
          
          <!-- Center Section: Title -->
          <div class="flex-1 flex justify-center">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Vendor Accounts Payable Summary</h1>
          </div>
          
          <!-- Right Section: Period -->
          <div class="bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 rounded p-2 min-w-fit">
            <div class="text-right">
              <p class="text-xs text-primary-600 dark:text-primary-400">Period</p>
              <p class="text-sm font-semibold text-primary-900 dark:text-primary-100">
                {{ startDateDisplayText }} To {{ endDateDisplayText }}
              </p>
            </div>
          </div>
        </div>

        <!-- Report Table -->
        <div class="overflow-x-auto print:overflow-visible">
          <table class="w-full border-collapse text-xs print:text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-bold text-sm text-default">Vendor</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">PO Amount</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Change Orders</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Total Contract Value</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Invoiced for Vendor</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Holdback</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Tax</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Balance</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">Paid to Date</th>
                <th class="text-right py-2 px-2 font-bold text-sm text-default">AP Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="vendor in filteredReportData.vendors"
                :key="vendor.vendorUuid"
                class="border-b border-gray-200 dark:border-gray-700"
              >
                <td class="py-2 px-2 text-default text-xs">{{ vendor.vendorName }}</td>
                <td class="py-2 px-2 text-right text-default text-xs">
                  <ReportVendorCurrencyAggregateCell :aggregate="vendor.poAmountDual" />
                </td>
                <td class="py-2 px-2 text-right text-default text-xs">
                  <ReportVendorCurrencyAggregateCell :aggregate="vendor.changeOrderAmountDual" />
                </td>
                <td class="py-2 px-2 text-right text-default text-xs">
                  <ReportVendorCurrencyAggregateCell :aggregate="vendor.totalContractValueDual" />
                </td>
                <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendor.invoicedForVendor) }}</td>
                <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendor.holdback) }}</td>
                <td class="py-2 px-2 text-right text-default text-xs">
                  <div class="inline-flex items-center justify-end gap-0.5">
                    <span>{{ formatCurrency(vendor.tax) }}</span>
                    <UPopover
                      v-if="vendor.taxRoundingNotes?.length"
                      class="print:hidden"
                      :content="{ side: 'left', align: 'end' }"
                      :ui="{ content: 'w-[min(28rem,calc(100vw-2rem))] p-0 bg-white dark:bg-gray-900 border border-default' }"
                    >
                      <UButton
                        icon="i-heroicons-information-circle"
                        color="primary"
                        variant="ghost"
                        size="xs"
                        class="shrink-0"
                        aria-label="Tax rounding explanation"
                      />
                      <template #content>
                        <div class="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-default">
                          <div>
                            <h4 class="text-sm font-semibold text-default">
                              Tax rounding on split invoices
                            </h4>
                            <p class="mt-1 text-muted leading-relaxed">
                              The Tax column shows the sum of invoice taxes in the selected period
                              ({{ formatCurrency(vendor.tax) }}). When a
                              {{ vendor.taxRoundingNotes.length === 1 ? 'PO or CO is' : 'POs or COs are' }}
                              invoiced across multiple bills, each invoice rounds tax to cents
                              independently. The total can differ from the contract tax by up to
                              $0.01 — this is expected and not a data error.
                            </p>
                          </div>

                          <div
                            v-for="note in vendor.taxRoundingNotes"
                            :key="note.documentUuid"
                            class="space-y-3 rounded-md border border-default p-3 bg-elevated/40"
                          >
                            <div>
                              <p class="font-medium text-default">
                                {{ note.documentType === 'PO' ? 'Purchase Order' : 'Change Order' }}
                                {{ note.documentNumber || note.documentUuid }}
                              </p>
                              <p class="mt-1 text-muted leading-relaxed">
                                Contract tax on this
                                {{ note.documentType === 'PO' ? 'PO' : 'CO' }} is
                                <strong class="text-default">{{ formatCurrency(note.contractTax) }}</strong>.
                                Sum of {{ note.invoices.length }} invoice taxes in this period is
                                <strong class="text-default">{{ formatCurrency(note.invoicedTaxSum) }}</strong>
                                (difference:
                                <strong class="text-default">{{ formatSignedCurrency(note.taxDelta) }}</strong>).
                              </p>
                            </div>

                            <table class="w-full border-collapse text-xs">
                              <thead>
                                <tr class="border-b border-default">
                                  <th class="py-1.5 pr-2 text-left font-medium text-muted" />
                                  <th class="py-1.5 px-2 text-right font-medium text-muted">Contract</th>
                                  <th class="py-1.5 pl-2 text-right font-medium text-muted">Invoices</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr class="border-b border-default/60">
                                  <td class="py-1.5 pr-2 text-left">Sales Tax 1</td>
                                  <td class="py-1.5 px-2 text-right">{{ formatCurrency(note.contractTax1) }}</td>
                                  <td class="py-1.5 pl-2 text-right">{{ formatCurrency(note.invoicedTax1Sum) }}</td>
                                </tr>
                                <tr class="border-b border-default/60">
                                  <td class="py-1.5 pr-2 text-left">Sales Tax 2</td>
                                  <td class="py-1.5 px-2 text-right">{{ formatCurrency(note.contractTax2) }}</td>
                                  <td class="py-1.5 pl-2 text-right">{{ formatCurrency(note.invoicedTax2Sum) }}</td>
                                </tr>
                                <tr>
                                  <td class="py-1.5 pr-2 text-left font-medium">Total tax</td>
                                  <td class="py-1.5 px-2 text-right font-medium">{{ formatCurrency(note.contractTax) }}</td>
                                  <td class="py-1.5 pl-2 text-right font-medium">{{ formatCurrency(note.invoicedTaxSum) }}</td>
                                </tr>
                              </tbody>
                            </table>

                            <div>
                              <p class="mb-1.5 font-medium text-default">Per-invoice breakdown</p>
                              <table class="w-full border-collapse text-xs">
                                <thead>
                                  <tr class="border-b border-default">
                                    <th class="py-1.5 pr-2 text-left font-medium text-muted">Invoice</th>
                                    <th class="py-1.5 px-2 text-right font-medium text-muted">Tax 1</th>
                                    <th class="py-1.5 px-2 text-right font-medium text-muted">Tax 2</th>
                                    <th class="py-1.5 pl-2 text-right font-medium text-muted">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr
                                    v-for="inv in note.invoices"
                                    :key="inv.invoiceUuid"
                                    class="border-b border-default/60 last:border-0"
                                  >
                                    <td class="py-1.5 pr-2 text-left">
                                      {{ inv.invoiceNumber || inv.invoiceUuid }}
                                    </td>
                                    <td class="py-1.5 px-2 text-right">{{ formatCurrency(inv.tax1) }}</td>
                                    <td class="py-1.5 px-2 text-right">{{ formatCurrency(inv.tax2) }}</td>
                                    <td class="py-1.5 pl-2 text-right">{{ formatCurrency(inv.tax) }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <p
                              v-if="note.invoicedTax2Sum !== note.contractTax2"
                              class="text-muted leading-relaxed"
                            >
                              The difference comes from Sales Tax 2: the
                              {{ note.documentType === 'PO' ? 'PO' : 'CO' }} calculates tax once on the
                              full amount ({{ formatCurrency(note.contractTax2) }}), while each
                              invoice rounds its own share to cents (sum
                              {{ formatCurrency(note.invoicedTax2Sum) }}).
                            </p>
                          </div>
                        </div>
                      </template>
                    </UPopover>
                  </div>
                </td>
                <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendor.balance) }}</td>
                <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendor.paidToDate) }}</td>
                <td class="py-2 px-2 text-right text-default text-xs">{{ formatCurrency(vendor.apBalance) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-gray-200 dark:bg-gray-900/70 border-t-2 border-gray-300 dark:border-gray-700">
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-left text-gray-900 dark:text-gray-50">
                  Total
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  <ReportVendorCurrencyAggregateCell :aggregate="filteredReportData.totals.poAmountDual" />
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  <ReportVendorCurrencyAggregateCell :aggregate="filteredReportData.totals.changeOrderAmountDual" />
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  <ReportVendorCurrencyAggregateCell :aggregate="filteredReportData.totals.totalContractValueDual" />
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.invoicedForVendor) }}
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.holdback) }}
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.tax) }}
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.balance) }}
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.paidToDate) }}
                </td>
                <td class="py-2.5 px-2 text-sm md:text-base font-bold text-right text-gray-900 dark:text-gray-50">
                  {{ formatCurrency(filteredReportData.totals.apBalance) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!filteredReportData || !filteredReportData.vendors || filteredReportData.vendors.length === 0)" class="text-center py-12">
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
import { extractCalendarYmdFromStoredDate } from '~/utils/calendarDateRange'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import DatePickerField from '~/components/shared/DatePickerField.vue'
import {
  resolveCorporationDisplayName,
} from '~/utils/csvExport'
import {
  buildReportExcelFilename,
  downloadReportExcelFile,
} from '~/utils/reportExcelExport.client'
import ReportVendorCurrencyAggregateCell from '~/components/Reports/ReportVendorCurrencyAggregateCell.vue'
import {
  formatReportVendorCurrencyAggregateForExport,
  sumVendorCurrencyAggregates,
  type VendorPoAmountAggregate,
} from '~/utils/reportPoCurrencyDisplay'

interface TaxRoundingInvoiceLine {
  invoiceUuid: string
  invoiceNumber: string | null
  tax: number
  tax1: number
  tax2: number
  itemTotal: number
  chargesTotal: number
}

interface TaxRoundingNote {
  documentType: 'PO' | 'CO'
  documentNumber: string | null
  documentUuid: string
  contractTax: number
  invoicedTaxSum: number
  taxDelta: number
  contractTax1: number
  contractTax2: number
  invoicedTax1Sum: number
  invoicedTax2Sum: number
  invoices: TaxRoundingInvoiceLine[]
}

interface VendorReportData {
  vendorUuid: string
  vendorName: string
  poAmount: number
  changeOrderAmount: number
  totalContractValue: number
  poAmountDual: VendorPoAmountAggregate
  changeOrderAmountDual: VendorPoAmountAggregate
  totalContractValueDual: VendorPoAmountAggregate
  invoicedForVendor: number
  totalInvoiceValue: number // For backward compatibility
  billedByVendor: number
  holdback: number
  tax: number
  balance: number
  paidToDate: number
  apBalance: number
  taxRoundingNotes?: TaxRoundingNote[]
}

const emptyVendorCurrencyAggregate = (): VendorPoAmountAggregate => ({
  cadTotal: 0,
  usdFromTotal: 0,
  showDual: false,
})

interface ReportData {
  project: {
    projectName: string
    projectId: string
  }
  vendors: VendorReportData[]
  totals: {
    poAmount: number
    changeOrderAmount: number
    totalContractValue: number
    poAmountDual: VendorPoAmountAggregate
    changeOrderAmountDual: VendorPoAmountAggregate
    totalContractValueDual: VendorPoAmountAggregate
    invoicedForVendor: number
    totalInvoiceValue: number // For backward compatibility
    billedByVendor: number
    holdback: number
    tax: number
    balance: number
    paidToDate: number
    apBalance: number
  }
}

const { fromUTCString, toUTCString } = useUTCDateFormat()

// Set page title
useHead({
  title: 'Vendor Accounts Payable Summary - Property Management'
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
const selectedVendorId = ref<string | undefined>(undefined)
const selectedTransactionRange = ref<string>('YEAR_TO_DATE')
const reportData = ref<ReportData | null>(null)
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

const formatSignedCurrency = (value: number) => {
  const abs = Math.abs(value)
  const formatted = formatCurrency(abs)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

// Filtered report data based on vendor selection
const filteredReportData = computed((): ReportData | null => {
  if (!reportData.value) return null

  if (!selectedVendorId.value) return reportData.value

  const filteredVendors = reportData.value.vendors.filter(
    (v) => v.vendorUuid === selectedVendorId.value
  )

  if (filteredVendors.length === 0) {
    return {
      ...reportData.value,
      vendors: [],
      totals: {
        poAmount: 0,
        changeOrderAmount: 0,
        totalContractValue: 0,
        poAmountDual: emptyVendorCurrencyAggregate(),
        changeOrderAmountDual: emptyVendorCurrencyAggregate(),
        totalContractValueDual: emptyVendorCurrencyAggregate(),
        invoicedForVendor: 0,
        totalInvoiceValue: 0,
        billedByVendor: 0,
        holdback: 0,
        tax: 0,
        balance: 0,
        paidToDate: 0,
        apBalance: 0,
      },
    }
  }

  const scalarTotals = filteredVendors.reduce(
    (acc, v) => ({
      invoicedForVendor: acc.invoicedForVendor + v.invoicedForVendor,
      totalInvoiceValue: acc.totalInvoiceValue + (v.totalInvoiceValue || 0),
      billedByVendor: acc.billedByVendor + (v.billedByVendor || 0),
      holdback: acc.holdback + v.holdback,
      tax: acc.tax + v.tax,
      balance: acc.balance + v.balance,
      paidToDate: acc.paidToDate + v.paidToDate,
      apBalance: acc.apBalance + v.apBalance,
    }),
    {
      invoicedForVendor: 0,
      totalInvoiceValue: 0,
      billedByVendor: 0,
      holdback: 0,
      tax: 0,
      balance: 0,
      paidToDate: 0,
      apBalance: 0,
    }
  )

  const poAmountDual = sumVendorCurrencyAggregates(
    filteredVendors.map((vendor) => vendor.poAmountDual)
  )
  const changeOrderAmountDual = sumVendorCurrencyAggregates(
    filteredVendors.map((vendor) => vendor.changeOrderAmountDual)
  )
  const totalContractValueDual = sumVendorCurrencyAggregates(
    filteredVendors.map((vendor) => vendor.totalContractValueDual)
  )

  const totals = {
    ...scalarTotals,
    poAmount: poAmountDual.cadTotal,
    changeOrderAmount: changeOrderAmountDual.cadTotal,
    totalContractValue: totalContractValueDual.cadTotal,
    poAmountDual,
    changeOrderAmountDual,
    totalContractValueDual,
  }

  return {
    ...reportData.value,
    vendors: filteredVendors,
    totals,
  }
})

// Handlers
const handleCorporationChangeFromSelect = async (corporation: any) => {
  selectedProjectId.value = undefined
  selectedVendorId.value = undefined
  
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
    reportData.value = null
  }
}

const handleShowReport = async () => {
  if (!canGenerateReport.value) {
    return
  }
  await loadReport()
}

const loadReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = null
    return
  }
  
  loading.value = true
  error.value = null
  
  const startDate =
    extractCalendarYmdFromStoredDate(startDateValue.value, fromUTCString) ?? ''
  const endDate =
    extractCalendarYmdFromStoredDate(endDateValue.value, fromUTCString) ?? ''
  
  try {
    const response = await $fetch<ReportData>('/api/reports/vendor-accounts-payable-summary', {
      method: 'GET',
      params: {
        corporation_uuid: selectedCorporationId.value,
        project_uuid: selectedProjectId.value,
        start_date: startDate,
        end_date: endDate
      }
    })
    
    reportData.value = response
  } catch (err: any) {
    error.value = err.message || 'Failed to load report'
    reportData.value = null
  } finally {
    loading.value = false
  }
}

const printReport = () => {
  window.print()
}

const exportReportToCsv = () => {
  const data = filteredReportData.value
  if (!data?.vendors?.length) return

  const rows: unknown[][] = [[
    'Vendor',
    'PO Amount',
    'Change Orders',
    'Total Contract Value',
    'Invoiced for Vendor',
    'Holdback',
    'Tax',
    'Balance',
    'Paid to Date',
    'AP Balance',
  ]]

  for (const vendor of data.vendors) {
    rows.push([
      vendor.vendorName || '',
      formatReportVendorCurrencyAggregateForExport(vendor.poAmountDual),
      formatReportVendorCurrencyAggregateForExport(vendor.changeOrderAmountDual),
      formatReportVendorCurrencyAggregateForExport(vendor.totalContractValueDual),
      vendor.invoicedForVendor ?? 0,
      vendor.holdback ?? 0,
      vendor.tax ?? 0,
      vendor.balance ?? 0,
      vendor.paidToDate ?? 0,
      vendor.apBalance ?? 0,
    ])
  }

  const totals = data.totals
  rows.push([
    'Total',
    formatReportVendorCurrencyAggregateForExport(totals.poAmountDual),
    formatReportVendorCurrencyAggregateForExport(totals.changeOrderAmountDual),
    formatReportVendorCurrencyAggregateForExport(totals.totalContractValueDual),
    totals.invoicedForVendor ?? 0,
    totals.holdback ?? 0,
    totals.tax ?? 0,
    totals.balance ?? 0,
    totals.paidToDate ?? 0,
    totals.apBalance ?? 0,
  ])

  const projectId = data.project?.projectId || getProjectDetails.value?.projectId
  void downloadReportExcelFile(
    buildReportExcelFilename('vendor-accounts-payable-summary', projectId),
    {
      title: 'Vendor Accounts Payable Summary',
      corporationName: resolveCorporationDisplayName(
        corporationStore.corporations as any[],
        selectedCorporationId.value
      ),
      projectLabel: data.project
        ? `${data.project.projectName} (${data.project.projectId})`
        : getProjectDetails.value
          ? `${getProjectDetails.value.projectName} (${getProjectDetails.value.projectId})`
          : '',
      dateRange: `${startDateDisplayText.value} To ${endDateDisplayText.value}`,
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
  reportData.value = null
})

// Watch for project changes - clear report data
watch(selectedProjectId, () => {
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
    padding: 4px 6px !important;
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

  /* Footer total row */
  tfoot tr th,
  tfoot tr td {
    background: #d0d0d0 !important;
    font-weight: bold !important;
    color: #000000 !important;
  }

  /* Project summary boxes */
  [class*="bg-primary-50"] {
    background: #e5e5e5 !important;
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

