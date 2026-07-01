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

          <!-- Export CSV button -->
          <UButton
            v-if="selectedCorporationId && selectedProjectId && filteredReportData && filteredReportData.length > 0"
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            size="sm"
            @click="exportReportToCsv"
          >
            Export Excel
          </UButton>

          <!-- Print button -->
          <UButton
            v-if="selectedCorporationId && selectedProjectId && filteredReportData && filteredReportData.length > 0"
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
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Labor Purchase Order Breakout Report</h1>
        <div v-if="selectedCorporationId && selectedProjectId" class="text-sm text-gray-700">
          <p class="font-semibold">Project: {{ getProjectName() }}</p>
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
        <p class="text-gray-500 text-lg">Please select a corporation to view the labor purchase order breakout report</p>
      </div>
      <div v-else-if="!selectedProjectId" class="text-center py-12">
        <UIcon name="i-heroicons-folder" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a project to view the labor purchase order breakout report</p>
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
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="i in 2" :key="i">
                <!-- PO Header Skeleton -->
                <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-400 dark:border-gray-600">
                  <td class="py-2 px-2" colspan="5">
                    <USkeleton class="h-4 w-96" />
                  </td>
                </tr>
                
                <!-- Item Rows Skeleton -->
                <template v-for="j in 3" :key="j">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
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
                  </tr>
                </template>
                
                <!-- PO Total Row Skeleton -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default" colspan="2">
                    <USkeleton class="h-3 w-16" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                </tr>
                
                <!-- Spacer row between POs -->
                <tr>
                  <td class="py-2" colspan="5"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="error && error !== null && error !== ''" class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 mx-auto text-red-400 mb-4" />
        <p class="text-red-500 text-lg">{{ error }}</p>
      </div>
      <div v-else-if="filteredReportData && filteredReportData.length > 0" class="space-y-6">
        <!-- Report Title -->
        <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 print:text-2xl print:text-gray-900">
          Labor Purchase Order Breakout
        </h1>

        <!-- Report Table -->
        <div class="overflow-x-auto print:overflow-visible">
          <table class="w-full border-collapse text-xs print:text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Cost Code</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Cost Code Description</th>
                <th v-if="isLocationWiseEnabled" class="text-left py-2 px-2 font-semibold text-xs text-default">Location</th>
                <th v-if="isLocationWiseEnabled" class="text-left py-2 px-2 font-semibold text-xs text-default">Description</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Labor Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Taxes</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Expected Costs</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="po in filteredReportData" :key="po.uuid">
                <!-- PO Header -->
                <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-400 dark:border-gray-600">
                  <td class="py-2 px-2 font-bold text-xs text-default" :colspan="reportColspan">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex flex-wrap gap-4">
                        <div>
                          <span class="font-semibold">PO Number:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.po_number }}</span>
                        </div>
                        <div>
                          <span class="font-semibold">Vendor:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.vendor_name || 'N/A' }}</span>
                        </div>
                        <div>
                          <span class="font-semibold">Status:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.status || 'N/A' }}</span>
                        </div>
                        <div>
                          <span class="font-semibold">Total Amount:</span>
                          <span class="font-semibold text-primary-600 dark:text-primary-400 ml-1 inline-flex">
                            <ReportOrderPoAmountCell :row="po" :amount="po.item_total || 0" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- PO Line Items Section -->
                <tr v-if="po.items && po.items.length > 0" class="bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                  <td class="py-1.5 px-2 font-semibold text-xs text-default" :colspan="reportColspan">
                    Purchase Order Items ({{ po.items.length }} items)
                  </td>
                </tr>

                <!-- PO Items (flat list) -->
                <template v-if="po.items && po.items.length > 0">
                  <tr
                    v-for="item in po.items"
                    :key="item.uuid || item.id"
                    class="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td class="py-1 px-2 text-default text-xs font-medium">{{ item.cost_code_number || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.cost_code_name || item.cost_code_label || '-' }}</td>
                    <td v-if="isLocationWiseEnabled" class="py-1 px-2 text-default text-xs">{{ getItemLocationName(item) }}</td>
                    <td v-if="isLocationWiseEnabled" class="py-1 px-2 text-default text-xs">{{ getItemDescription(item) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="item.po_amount || 0" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemHSTAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs font-semibold">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemExpectedCost(item, po)" />
                    </td>
                  </tr>
                </template>

                <!-- PO Items subtotal -->
                <tr v-if="po.items && po.items.length > 0" class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 font-semibold">
                  <td class="py-1 px-2 text-xs text-default" :colspan="reportColspan - 3">
                    PO Items Subtotal
                  </td>
                  <td class="py-1 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="getPoLaborSubtotal(po)" />
                  </td>
                  <td class="py-1 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="getPoItemsTaxSubtotal(po)" />
                  </td>
                  <td class="py-1 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="getPoItemsExpectedSubtotal(po)" />
                  </td>
                </tr>

                <!-- Change Orders Section -->
                <template v-if="po.change_orders && po.change_orders.length > 0">
                  <template v-for="co in po.change_orders" :key="co.uuid">
                    <!-- CO Header -->
                    <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-400 dark:border-gray-600">
                      <td class="py-2 px-2 font-bold text-xs text-default" :colspan="reportColspan">
                        <div class="flex flex-wrap gap-4">
                          <div>
                            <span class="font-semibold">CO Number:</span>
                            <span class="font-semibold text-primary-600 dark:text-primary-400 ml-1">{{ co.co_number || 'N/A' }}</span>
                          </div>
                          <div>
                            <span class="font-semibold">Status:</span>
                            <span class="font-semibold text-primary-600 dark:text-primary-400 ml-1">{{ co.status || 'N/A' }}</span>
                          </div>
                          <div>
                            <span class="font-semibold">Type:</span>
                            <span class="font-semibold text-primary-600 dark:text-primary-400 ml-1">Change Order</span>
                          </div>
                          <span v-if="co.labor_items" class="text-[10px] font-normal text-muted">({{ co.labor_items.length }} items)</span>
                        </div>
                      </td>
                    </tr>

                    <!-- CO Items (flat list) -->
                    <template v-if="co.labor_items && co.labor_items.length > 0">
                      <tr
                        v-for="item in co.labor_items"
                        :key="item.uuid || item.id"
                        class="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td class="py-1 px-2 text-default text-xs font-medium">{{ item.cost_code_number || '-' }}</td>
                        <td class="py-1 px-2 text-default text-xs">{{ item.cost_code_name || item.cost_code_label || '-' }}</td>
                        <td v-if="isLocationWiseEnabled" class="py-1 px-2 text-default text-xs">{{ getItemLocationName(item) }}</td>
                        <td v-if="isLocationWiseEnabled" class="py-1 px-2 text-default text-xs">{{ getItemDescription(item) }}</td>
                        <td class="py-1 px-2 text-right text-default text-xs">
                          <ReportOrderPoAmountCell :row="co" :amount="getCoLaborAmount(item)" />
                        </td>
                        <td class="py-1 px-2 text-right text-default text-xs">
                          <ReportOrderPoAmountCell :row="co" :amount="getCoItemHSTAmount(item, co)" />
                        </td>
                        <td class="py-1 px-2 text-right text-default text-xs font-semibold">
                          <ReportOrderPoAmountCell :row="co" :amount="getCoItemExpectedCost(item, co)" />
                        </td>
                      </tr>
                    </template>

                    <!-- CO Items subtotal -->
                    <tr v-if="co.labor_items && co.labor_items.length > 0" class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 font-semibold">
                      <td class="py-1 px-2 text-xs text-default" :colspan="reportColspan - 3">
                        CO Items Subtotal — {{ co.co_number || 'N/A' }}
                      </td>
                      <td class="py-1 px-2 text-right text-xs text-default">
                        <ReportOrderPoAmountCell :row="co" :amount="getCoLaborSubtotal(co)" />
                      </td>
                      <td class="py-1 px-2 text-right text-xs text-default">
                        <ReportOrderPoAmountCell :row="co" :amount="getCoItemsTaxSubtotal(co)" />
                      </td>
                      <td class="py-1 px-2 text-right text-xs text-default">
                        <ReportOrderPoAmountCell :row="co" :amount="getCoItemsExpectedSubtotal(co)" />
                      </td>
                    </tr>
                  </template>
                </template>

                <!-- No items at all -->
                <tr v-if="(!po.items || po.items.length === 0) && (!po.change_orders || po.change_orders.every((co: any) => !co.labor_items || co.labor_items.length === 0))" class="border-b border-gray-200 dark:border-gray-700">
                  <td class="py-2 px-2 text-muted text-xs italic" :colspan="reportColspan">No items found for this purchase order</td>
                </tr>
                
                <!-- PO Total Row -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default" :colspan="reportColspan - 3">
                    Total
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportVendorCurrencyAggregateCell :aggregate="aggregateGrandLabor(po)" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportVendorCurrencyAggregateCell :aggregate="aggregateGrandTax(po)" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">
                    <ReportVendorCurrencyAggregateCell :aggregate="aggregateGrandExpected(po)" />
                  </td>
                </tr>
                
                <!-- Spacer row between POs -->
                <tr>
                  <td class="py-2" :colspan="reportColspan"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!filteredReportData || filteredReportData.length === 0)" class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">No labor purchase orders found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useLocationsStore } from '~/stores/locations'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { isWithinCalendarDateRange } from '~/utils/calendarDateRange'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import DatePickerField from '~/components/shared/DatePickerField.vue'
import {
  formatReportDateRangeDisplay,
  resolveCorporationDisplayName,
  resolveProjectDisplayLabel,
} from '~/utils/csvExport'
import {
  buildReportExcelFilename,
  downloadReportExcelFile,
} from '~/utils/reportExcelExport.client'
import ReportOrderPoAmountCell from '~/components/Reports/ReportOrderPoAmountCell.vue'
import ReportVendorCurrencyAggregateCell from '~/components/Reports/ReportVendorCurrencyAggregateCell.vue'
import {
  aggregateBreakoutCurrencyAmounts,
  formatReportBreakoutAggregateForExport,
  formatReportPoAmountForExport,
  type BreakoutCurrencyAmountEntry,
} from '~/utils/reportPoCurrencyDisplay'

const { fromUTCString, toUTCString } = useUTCDateFormat()

// Set page title
useHead({
  title: 'Labor Purchase Order Breakout - Property Management'
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
const reportData = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Location-wise state
const isLocationWiseEnabled = ref(false)

// Advanced filter drawer state
const isFilterDrawerOpen = ref(false)
const drawerVendor = ref<string | undefined>(undefined)
const drawerLocation = ref<string | undefined>(undefined)
const appliedAdvancedFilters = ref<{
  vendor: string | undefined
  location: string | undefined
}>({
  vendor: undefined,
  location: undefined,
})

const toUtcDateString = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return toUTCString(`${y}-${m}-${d}`) ?? `${y}-${m}-${d}T00:00:00.000Z`
}

// Date range state - default to Jan 1 of current year to today
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

// Date display text
const startDateDisplayText = computed(() => {
  if (!startDateValue.value) return ''
  return new Date(startDateValue.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

const endDateDisplayText = computed(() => {
  if (!endDateValue.value) return ''
  return new Date(endDateValue.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
})

// Can generate report
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
// Currency export helper
const exportPoAmount = (record: any, amount: number) =>
  formatReportPoAmountForExport(amount, record)

const getPoGrandLaborEntries = (po: any): BreakoutCurrencyAmountEntry[] => [
  { row: po, amount: getPoLaborSubtotal(po) },
  ...(po.change_orders || []).map((co: any) => ({
    row: co,
    amount: getCoLaborSubtotal(co),
  })),
]

const getPoGrandTaxEntries = (po: any): BreakoutCurrencyAmountEntry[] => [
  { row: po, amount: getPoItemsTaxSubtotal(po) },
  ...(po.change_orders || []).map((co: any) => ({
    row: co,
    amount: getCoItemsTaxSubtotal(co),
  })),
]

const getPoGrandExpectedEntries = (po: any): BreakoutCurrencyAmountEntry[] => [
  { row: po, amount: getPoItemsExpectedSubtotal(po) },
  ...(po.change_orders || []).map((co: any) => ({
    row: co,
    amount: getCoItemsExpectedSubtotal(co),
  })),
]

const aggregateGrandLabor = (po: any) =>
  aggregateBreakoutCurrencyAmounts(getPoGrandLaborEntries(po))

const aggregateGrandTax = (po: any) =>
  aggregateBreakoutCurrencyAmounts(getPoGrandTaxEntries(po))

const aggregateGrandExpected = (po: any) =>
  aggregateBreakoutCurrencyAmounts(getPoGrandExpectedEntries(po))

// Get project name for print header
const getProjectName = (): string => {
  if (!selectedProjectId.value) return 'N/A'
  const project = projectsStore.projects.find(p => p.uuid === selectedProjectId.value)
  if (project) {
    return `${project.project_name} (${project.project_id || 'N/A'})`
  }
  return 'N/A'
}

// Calculate item-level amounts (distributed proportionally)
const getItemLaborAmount = (item: any): number => {
  return item.po_amount || 0
}

const getCoLaborAmount = (item: any): number => {
  return item.co_amount || item.po_amount || 0
}

const getPoLaborSubtotal = (po: any): number => {
  return (po.items || []).reduce(
    (sum: number, item: any) => sum + getItemLaborAmount(item),
    0
  )
}

const getCoLaborSubtotal = (co: any): number => {
  return (co.labor_items || []).reduce(
    (sum: number, item: any) => sum + getCoLaborAmount(item),
    0
  )
}

const getGrandLaborSubtotal = (po: any): number => {
  const coLabor = (po.change_orders || []).reduce(
    (sum: number, co: any) => sum + getCoLaborSubtotal(co),
    0
  )
  return getPoLaborSubtotal(po) + coLabor
}

const getItemFreightAmount = (item: any, po: any): number => {
  if (!po.freight_charges_amount || po.freight_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemLaborAmount(item)
  return (itemAmount / po.item_total) * po.freight_charges_amount
}

const getItemPackingAmount = (item: any, po: any): number => {
  if (!po.packing_charges_amount || po.packing_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemLaborAmount(item)
  return (itemAmount / po.item_total) * po.packing_charges_amount
}

const getItemCustomsAmount = (item: any, po: any): number => {
  if (!po.custom_duties_amount || po.custom_duties_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemLaborAmount(item)
  return (itemAmount / po.item_total) * po.custom_duties_amount
}

const getItemOtherAmount = (item: any, po: any): number => {
  if (!po.other_charges_amount || po.other_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemLaborAmount(item)
  return (itemAmount / po.item_total) * po.other_charges_amount
}

const getItemHSTAmount = (item: any, po: any): number => {
  const totalTaxes = (po.sales_tax_1_amount || 0) + (po.sales_tax_2_amount || 0)
  if (!totalTaxes || totalTaxes === 0) return 0
  const poSubtotal = getPoLaborSubtotal(po)
  if (!poSubtotal || poSubtotal === 0) return 0
  const itemAmount = getItemLaborAmount(item)
  return (itemAmount / poSubtotal) * totalTaxes
}

const getCoItemHSTAmount = (item: any, co: any): number => {
  const totalTaxes = (co.sales_tax_1_amount || 0) + (co.sales_tax_2_amount || 0)
  if (!totalTaxes || totalTaxes === 0) return 0
  const coSubtotal = getCoLaborSubtotal(co)
  if (!coSubtotal || coSubtotal === 0) return 0
  const itemAmount = getCoLaborAmount(item)
  return (itemAmount / coSubtotal) * totalTaxes
}

const getItemExpectedCost = (item: any, po: any): number => {
  return getItemLaborAmount(item) + getItemHSTAmount(item, po)
}

const getCoItemExpectedCost = (item: any, co: any): number => {
  return getCoLaborAmount(item) + getCoItemHSTAmount(item, co)
}

const getPoItemsTaxSubtotal = (po: any): number => {
  return (po.items || []).reduce(
    (sum: number, item: any) => sum + getItemHSTAmount(item, po),
    0
  )
}

const getCoItemsTaxSubtotal = (co: any): number => {
  return (co.labor_items || []).reduce(
    (sum: number, item: any) => sum + getCoItemHSTAmount(item, co),
    0
  )
}

const getPoItemsExpectedSubtotal = (po: any): number => {
  return (po.items || []).reduce(
    (sum: number, item: any) => sum + getItemExpectedCost(item, po),
    0
  )
}

const getCoItemsExpectedSubtotal = (co: any): number => {
  return (co.labor_items || []).reduce(
    (sum: number, item: any) => sum + getCoItemExpectedCost(item, co),
    0
  )
}

const getGrandTaxSubtotal = (po: any): number => {
  const coTax = (po.change_orders || []).reduce(
    (sum: number, co: any) => sum + getCoItemsTaxSubtotal(co),
    0
  )
  return getPoItemsTaxSubtotal(po) + coTax
}

const getTotalExpectedCosts = (po: any): number => {
  const coExpected = (po.change_orders || []).reduce(
    (sum: number, co: any) => sum + getCoItemsExpectedSubtotal(co),
    0
  )
  return getPoItemsExpectedSubtotal(po) + coExpected
}

// Dynamic colspan: 5 base columns (Cost Code, Cost Code Description, Labor Amount, Taxes, Expected Costs)
// + 2 when location-wise (Location, Description)
const reportColspan = computed(() => isLocationWiseEnabled.value ? 7 : 5)

// Location-wise helpers
const getItemDescription = (item: any): string => {
  return item?.description || item?.metadata?.description || '-'
}

const getItemLocationName = (item: any): string => {
  const locationUuid = item?.metadata?.location_uuid || item?.location_uuid
  if (locationUuid) {
    const loc = locationsStore.getByUuid(locationUuid)
    if (loc?.location_name) return loc.location_name
  }
  return item?.metadata?.location_label || item?.location_label || '-'
}

// Handlers
const handleCorporationChangeFromSelect = async (corporation: any) => {
  // Clear project selection and report data when corporation changes
  selectedProjectId.value = undefined
  reportData.value = []
  
  // Fetch projects for the selected corporation
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
  reportData.value = []
}

const handleShowReport = async () => {
  if (canGenerateReport.value) {
    await loadReport()
  }
}

// Load report data
const loadReport = async () => {
  if (!selectedCorporationId.value || !selectedProjectId.value || !startDateValue.value || !endDateValue.value) {
    reportData.value = []
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const isWithinSelectedDateRange = (value?: string | null) =>
      isWithinCalendarDateRange(
        value,
        startDateValue.value,
        endDateValue.value,
        fromUTCString
      )
    
    // Fetch purchase orders
    const params: any = {
      corporation_uuid: selectedCorporationId.value
    }
    
    const response: any = await $fetch('/api/purchase-order-forms', {
      method: 'GET',
      params
    })
    
    const purchaseOrders = response?.data || []
    
    // Filter by status (Approved, Partially_Received, or Completed), project (required), date range, and include only labor POs
    const filteredPOs = purchaseOrders
      .filter((po: any) => {
        const status = String(po.status || '').toLowerCase()
        return status === 'approved' || status === 'partially_received' || status === 'completed'
      })
      .filter((po: any) => po.project_uuid === selectedProjectId.value)
      .filter((po: any) => {
        // Include only labor type purchase orders
        const poType = String(po.po_type || '').toUpperCase()
        return poType === 'LABOR'
      })
      .filter((po: any) => {
        return isWithinSelectedDateRange(po.entry_date)
      })
    
    // Fetch vendors once for all purchase orders
    let vendors: any[] = []
    try {
      const vendorResponse: any = await $fetch('/api/purchase-orders/vendors', {
        method: 'GET',
        params: {
          corporation_uuid: selectedCorporationId.value,
          include_inactive: 'true',
        }
      })
      vendors = vendorResponse?.data || []
    } catch (vendorError) {
      console.error('Error fetching vendors:', vendorError)
    }
    
    // Create vendor map for quick lookup
    const vendorMap = new Map(vendors.map((v: any) => [v.uuid, v.vendor_name]))
    
    // Check if the selected project has location-wise enabled
    let selectedProject: any = projectsStore.projects.find((p: any) => p.uuid === selectedProjectId.value)
    // If metadata doesn't have enable_location_wise, fetch the full project
    if (selectedProject && selectedProject.enable_location_wise === undefined) {
      try {
        const fullProject = await projectsStore.fetchProject(selectedProjectId.value!)
        if (fullProject) selectedProject = fullProject
      } catch (_e) {
        // fallback to metadata
      }
    }
    isLocationWiseEnabled.value = selectedProject?.enable_location_wise === true
    
    // Fetch locations for resolving location UUIDs to names
    if (isLocationWiseEnabled.value) {
      await locationsStore.fetchLocations(true)
    }
    
    // Fetch items for each purchase order (labor POs only)
    const reportDataWithItems = await Promise.all(
      filteredPOs.map(async (po: any) => {
        try {
          // Fetch labor items for purchase order
          let items: any[] = []
          try {
            const itemsResponse: any = await $fetch('/api/labor-purchase-order-items', {
              method: 'GET',
              params: {
                purchase_order_uuid: po.uuid
              }
            })
            items = itemsResponse?.data || []
          } catch (itemError) {
            console.error('Error fetching labor items for PO:', po.uuid, itemError)
          }
          
          // Fetch change orders related to this purchase order
          let changeOrders: any[] = []
          try {
            const coResponse: any = await $fetch('/api/change-orders', {
              method: 'GET',
              params: {
                corporation_uuid: selectedCorporationId.value,
                project_uuid: selectedProjectId.value
              }
            })
            // Filter change orders that are related to this PO
            const allChangeOrders = coResponse?.data || []
            changeOrders = allChangeOrders.filter((co: any) => 
              co.original_purchase_order_uuid === po.uuid
            )

            // Fetch labor items for each change order
            for (const co of changeOrders) {
              try {
                const coItemsResponse: any = await $fetch('/api/labor-change-order-items', {
                  method: 'GET',
                  params: { change_order_uuid: co.uuid }
                })
                co.labor_items = coItemsResponse?.data || []
              } catch (coItemError) {
                console.error('Error fetching labor CO items:', co.uuid, coItemError)
                co.labor_items = []
              }
            }
          } catch (coError) {
            console.error('Error fetching change orders for PO:', po.uuid, coError)
          }
          
          // Get vendor name from map
          const vendorName = po.vendor_uuid ? (vendorMap.get(po.vendor_uuid) || 'N/A') : 'N/A'
          
          // Calculate item_total from items if not present
          let itemTotal = po.item_total
          if (!itemTotal && items.length > 0) {
            itemTotal = items.reduce((sum: number, item: any) => {
              const itemAmount = item.po_amount || 0
              return sum + (itemAmount || 0)
            }, 0)
          }
          
          // Calculate CO totals
          const coTotal = changeOrders.reduce((sum: number, co: any) => {
            const coItems = co.labor_items || []
            return sum + coItems.reduce((s: number, item: any) => s + (item.co_amount || item.po_amount || 0), 0)
          }, 0)

          return {
            ...po,
            items,
            change_orders: changeOrders,
            vendor_name: vendorName,
            item_total: (itemTotal || 0) + coTotal
          }
        } catch (error) {
          console.error('Error processing PO:', po.uuid, error)
          return {
            ...po,
            items: [],
            vendor_name: 'N/A'
          }
        }
      })
    )
    
    reportData.value = reportDataWithItems
    await nextTick()
  } catch (err: any) {
    console.error('Error loading report:', err)
    error.value = err.message || 'Failed to load labor purchase order breakout report'
    reportData.value = []
  } finally {
    loading.value = false
  }
}

const printReport = () => {
  window.print()
}

const exportReportToCsv = () => {
  const data = filteredReportData.value
  if (!data?.length) return

  const headers = [
    'PO Number',
    'CO Number',
    'Vendor',
    'Status',
    'Cost Code',
    'Cost Code Description',
  ]
  if (isLocationWiseEnabled.value) {
    headers.push('Location', 'Description')
  }
  headers.push('Labor Amount', 'Taxes', 'Expected Costs')

  const rows: unknown[][] = [headers]

  for (const po of data) {
    rows.push([
      po.po_number || '',
      '',
      po.vendor_name || '',
      po.status || '',
      'PO Header',
      '',
      ...(isLocationWiseEnabled.value ? ['', ''] : []),
      '',
      '',
      '',
    ])

    for (const item of po.items || []) {
      rows.push([
        po.po_number || '',
        '',
        po.vendor_name || '',
        po.status || '',
        item.cost_code_number || '',
        item.cost_code_name || item.cost_code_label || '',
        ...(isLocationWiseEnabled.value
          ? [getItemLocationName(item), getItemDescription(item)]
          : []),
        exportPoAmount(po, item.po_amount || 0),
        exportPoAmount(po, getItemHSTAmount(item, po)),
        exportPoAmount(po, getItemExpectedCost(item, po)),
      ])
    }

    if (po.items?.length) {
      rows.push([
        po.po_number || '',
        '',
        po.vendor_name || '',
        po.status || '',
        'PO Items Subtotal',
        '',
        ...(isLocationWiseEnabled.value ? ['', ''] : []),
        exportPoAmount(po, getPoLaborSubtotal(po)),
        exportPoAmount(po, getPoItemsTaxSubtotal(po)),
        exportPoAmount(po, getPoItemsExpectedSubtotal(po)),
      ])
    }

    for (const co of po.change_orders || []) {
      rows.push([
        po.po_number || '',
        co.co_number || '',
        po.vendor_name || '',
        co.status || '',
        '', '',
        ...(isLocationWiseEnabled.value ? ['', ''] : []),
        '', '', '',
      ])

      for (const item of co.labor_items || []) {
        rows.push([
          po.po_number || '',
          co.co_number || '',
          po.vendor_name || '',
          co.status || '',
          item.cost_code_number || '',
          item.cost_code_name || item.cost_code_label || '',
          ...(isLocationWiseEnabled.value
            ? [getItemLocationName(item), getItemDescription(item)]
            : []),
          exportPoAmount(co, getCoLaborAmount(item)),
          exportPoAmount(co, getCoItemHSTAmount(item, co)),
          exportPoAmount(co, getCoItemExpectedCost(item, co)),
        ])
      }

      if (co.labor_items?.length) {
        rows.push([
          po.po_number || '',
          co.co_number || '',
          po.vendor_name || '',
          co.status || '',
          `CO Items Subtotal — ${co.co_number || 'N/A'}`,
          '',
          ...(isLocationWiseEnabled.value ? ['', ''] : []),
          exportPoAmount(co, getCoLaborSubtotal(co)),
          exportPoAmount(co, getCoItemsTaxSubtotal(co)),
          exportPoAmount(co, getCoItemsExpectedSubtotal(co)),
        ])
      }
    }

    rows.push([
      po.po_number || '',
      '',
      po.vendor_name || '',
      po.status || '',
      'Total',
      '',
      ...(isLocationWiseEnabled.value ? ['', ''] : []),
      formatReportBreakoutAggregateForExport(getPoGrandLaborEntries(po)),
      formatReportBreakoutAggregateForExport(getPoGrandTaxEntries(po)),
      formatReportBreakoutAggregateForExport(getPoGrandExpectedEntries(po)),
    ])
  }

  const project = projectsStore.projects.find((p) => p.uuid === selectedProjectId.value)
  void downloadReportExcelFile(
    buildReportExcelFilename('labor-purchase-order-breakout', project?.project_id),
    {
      title: 'Labor Purchase Order Breakout',
      corporationName: resolveCorporationDisplayName(
        corporationStore.corporations as any[],
        selectedCorporationId.value
      ),
      projectLabel: resolveProjectDisplayLabel(
        projectsStore.projects as any[],
        selectedProjectId.value
      ),
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

// Advanced filter handlers
const handleApplyDrawerFilters = () => {
  appliedAdvancedFilters.value = {
    vendor: drawerVendor.value,
    location: drawerLocation.value,
  }
  isFilterDrawerOpen.value = false
  handleShowReport()
}

const handleClearDrawerFilters = () => {
  drawerVendor.value = undefined
  drawerLocation.value = undefined
}

watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations()
  }
})

const itemMatchesLocation = (item: any, loc: string): boolean => {
  return item.location_uuid === loc || item.metadata?.location_uuid === loc
}

// Filtered report data based on advanced filters
const filteredReportData = computed(() => {
  let data = [...reportData.value]

  const { vendor, location } = appliedAdvancedFilters.value

  if (vendor) {
    data = data.filter((po: any) => po.vendor_uuid === vendor)
  }

  if (location) {
    data = data
      .map((po: any) => {
        const filteredItems = (po.items || []).filter((item: any) => itemMatchesLocation(item, location))
        const filteredCOs = (po.change_orders || []).map((co: any) => ({
          ...co,
          labor_items: (co.labor_items || []).filter((item: any) => itemMatchesLocation(item, location)),
        })).filter((co: any) => co.labor_items.length > 0)

        if (filteredItems.length === 0 && filteredCOs.length === 0) return null

        const poItemTotal = filteredItems.reduce((sum: number, it: any) => sum + (it.po_amount || 0), 0)
        const coTotal = filteredCOs.reduce((sum: number, co: any) =>
          sum + (co.labor_items || []).reduce((s: number, it: any) => s + (it.co_amount || it.po_amount || 0), 0), 0)

        return {
          ...po,
          items: filteredItems,
          change_orders: filteredCOs,
          item_total: poItemTotal + coTotal,
        }
      })
      .filter(Boolean)
  }

  return data
})

const resetAdvancedFilters = () => {
  drawerVendor.value = undefined
  drawerLocation.value = undefined
  appliedAdvancedFilters.value = {
    vendor: undefined,
    location: undefined,
  }
}

// Watch for corporation changes - clear report data
watch(selectedCorporationId, () => {
  selectedProjectId.value = undefined
  reportData.value = []
  resetAdvancedFilters()
})

// Watch for project changes - clear report data
watch(selectedProjectId, () => {
  reportData.value = []
  resetAdvancedFilters()
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

  /* PO header rows */
  tbody tr[class*="bg-gray-50"] th,
  tbody tr[class*="bg-gray-50"] td {
    background: #e5e5e5 !important;
    font-weight: bold !important;
    color: #000000 !important;
  }

  /* PO total rows */
  tbody tr[class*="bg-gray-100"] th,
  tbody tr[class*="bg-gray-100"] td {
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

  /* Allow page breaks between POs */
  tbody tr[class*="bg-gray-50"] {
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

