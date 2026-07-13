<template>
  <div class="po-breakout-report h-[88vh] print:h-auto">
    <!-- Header section - hidden in print -->
    <div class="mb-2 print:hidden">
      <div class="flex items-center justify-end gap-4 flex-wrap">
        <!-- Corporation, Project, Date Range, Advanced, Show, Print -->
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
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Material Purchase Order Breakout Report</h1>
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
        <p class="text-gray-500 text-lg">Please select a corporation to view the purchase order breakout report</p>
      </div>
      <div v-else-if="!selectedProjectId" class="text-center py-12">
        <UIcon name="i-heroicons-folder" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">Please select a project to view the purchase order breakout report</p>
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
                  <USkeleton class="h-3 w-20" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-20" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-16" />
                </th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24" />
                </th>
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
                  <USkeleton class="h-3 w-32 ml-auto" />
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
                  <USkeleton class="h-3 w-20 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-28 ml-auto" />
                </th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">
                  <USkeleton class="h-3 w-24 ml-auto" />
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
                  <td class="py-2 px-2" colspan="15">
                    <USkeleton class="h-4 w-96" />
                  </td>
                </tr>
                
                <!-- Item Rows Skeleton -->
                <template v-for="j in 3" :key="j">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <td class="py-1 px-2 text-default text-xs">
                      <USkeleton class="h-3 w-16" />
                    </td>
                    <td class="py-1 px-2 text-default text-xs">
                      <USkeleton class="h-3 w-16" />
                    </td>
                    <td class="py-1 px-2 text-default text-xs">
                      <USkeleton class="h-3 w-16" />
                    </td>
                    <td class="py-1 px-2 text-default text-xs">
                      <USkeleton class="h-3 w-20" />
                    </td>
                    <td class="py-1 px-2 text-default text-xs">
                      <USkeleton class="h-3 w-16" />
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
                  </tr>
                </template>
                
                <!-- PO Total Row Skeleton -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default" colspan="9">
                    <USkeleton class="h-3 w-16" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <USkeleton class="h-3 w-20 ml-auto" />
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
                  <td class="py-2" colspan="15"></td>
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
          Material Purchase Order Breakout
        </h1>

        <!-- Report Table -->
        <div class="overflow-x-auto print:overflow-visible">
          <table class="w-full border-collapse text-xs print:text-xs">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Category</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Type</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Spec Number</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Item Name</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default">Location</th>
                <th class="text-left py-2 px-2 font-semibold text-xs text-default w-[25ch] max-w-[25ch]">Item Description</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Item Quantity</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Item Unit Cost</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Goods Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Freight Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Packing Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Customs & Duties</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Other Amount</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">HST</th>
                <th class="text-right py-2 px-2 font-semibold text-xs text-default">Expected Costs</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="po in filteredReportData" :key="po.uuid">
                <!-- PO/CO Header -->
                <tr class="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-400 dark:border-gray-600">
                  <td class="py-2 px-2 font-bold text-xs text-default" colspan="15">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-semibold">{{ po._record_type === 'CO' ? 'CO Number' : 'PO Number' }}:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.po_number }}</span>
                        <span class="ml-4 font-semibold">Vendor:</span> <span class="font-semibold text-primary-600 dark:text-primary-400">{{ po.vendor_name || 'N/A' }}</span>
                        <span v-if="po._record_type === 'CO'" class="ml-4 font-semibold">Type:</span>
                        <span v-if="po._record_type === 'CO'" class="font-semibold text-amber-600 dark:text-amber-400">Change Order</span>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- PO Items -->
                <template v-if="po.items && po.items.length > 0">
                  <tr
                    v-for="item in po.items"
                    :key="item.uuid || item.id"
                    class="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td class="py-1 px-2 text-default text-xs">{{ item._category_label || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item._item_type_label || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item._spec_number }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item.item_name || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs">{{ item._location_name || '-' }}</td>
                    <td class="py-1 px-2 text-default text-xs w-[25ch] max-w-[25ch] min-w-0 break-words whitespace-pre-line align-top">{{ getDescriptionDisplayText(item.description) }}</td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      {{ formatNumber(item.po_quantity || item.co_quantity || item.quantity) }} {{ item.uom || '' }}
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell
                        :row="po"
                        :amount="item.po_unit_price || item.co_unit_price || item.unit_price"
                      />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell
                        :row="po"
                        :amount="item.po_total || item.co_total || item.total || (item.po_quantity || item.co_quantity || item.quantity || 0) * (item.po_unit_price || item.co_unit_price || item.unit_price || 0)"
                      />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemFreightAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemPackingAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemCustomsAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemOtherAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemHSTAmount(item, po)" />
                    </td>
                    <td class="py-1 px-2 text-right text-default text-xs font-semibold">
                      <ReportOrderPoAmountCell :row="po" :amount="getItemExpectedCost(item, po)" />
                    </td>
                  </tr>
                </template>
                <tr v-else class="border-b border-gray-200 dark:border-gray-700">
                  <td class="py-2 px-2 text-muted text-xs italic" colspan="15">No items found for this {{ po._record_type === 'CO' ? 'change order' : 'purchase order' }}</td>
                </tr>
                
                <!-- PO Total Row -->
                <tr class="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-400 dark:border-gray-600 font-semibold">
                  <td class="py-2 px-2 text-xs text-default" colspan="8">
                    Total
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="po.item_total || 0" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="po.freight_charges_amount || 0" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="po.packing_charges_amount || 0" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="po.custom_duties_amount || 0" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell :row="po" :amount="po.other_charges_amount || 0" />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default">
                    <ReportOrderPoAmountCell
                      :row="po"
                      :amount="(po.sales_tax_1_amount || 0) + (po.sales_tax_2_amount || 0)"
                    />
                  </td>
                  <td class="py-2 px-2 text-right text-xs text-default font-bold">
                    <ReportOrderPoAmountCell :row="po" :amount="getTotalExpectedCosts(po)" />
                  </td>
                </tr>
                
                <!-- Spacer row between POs -->
                <tr>
                  <td class="py-2" colspan="15"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="!loading && (!filteredReportData || filteredReportData.length === 0)" class="text-center py-12">
        <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p class="text-gray-500 text-lg">No purchase orders or change orders found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { isWithinCalendarDateRange } from '~/utils/calendarDateRange'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import DatePickerField from '~/components/shared/DatePickerField.vue'
import { useLocationsStore } from '~/stores/locations'
import {
  pickFirstSequence,
  buildItemDivisionConfigMap,
  buildItemTypeConfigMap,
  buildPreferredItemTypeMetaLookup,
  mergeItemTypeFromPreferredCatalog,
  resolveItemHierarchyFields,
  type ItemTypeConfigRow,
} from '~/utils/itemHierarchyResolution'
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
import {
  appendBreakoutAmountExportCells,
  appendBreakoutAmountExportEmptyCells,
  buildBreakoutAmountExportHeaders,
  formatReportPoAmountForExport,
} from '~/utils/reportPoCurrencyDisplay'

const { fromUTCString, toUTCString } = useUTCDateFormat()

// Set page title
useHead({
  title: 'Material Purchase Order Breakout - Property Management'
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

// Currency export helper
const exportPoAmount = (record: any, amount: number) =>
  formatReportPoAmountForExport(amount, record)

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

const DESCRIPTION_WRAP_LENGTH = 25

const wrapTextAtLength = (text: string, maxLength = DESCRIPTION_WRAP_LENGTH): string => {
  if (!text || text.length <= maxLength) return text

  const wrappedLines: string[] = []
  for (const segment of text.split('\n')) {
    let remaining = segment
    while (remaining.length > maxLength) {
      let breakAt = remaining.lastIndexOf(' ', maxLength)
      if (breakAt <= 0) breakAt = maxLength
      wrappedLines.push(remaining.slice(0, breakAt).trimEnd())
      remaining = remaining.slice(breakAt).trimStart()
    }
    if (remaining) wrappedLines.push(remaining)
  }

  return wrappedLines.join('\n')
}

const getDescriptionPlainText = (value: unknown) => {
  const text = stripHtml(String(value || ''))
  return text || '-'
}

const getDescriptionDisplayText = (value: unknown) => {
  const text = getDescriptionPlainText(value)
  if (text === '-') return text
  return wrapTextAtLength(text, DESCRIPTION_WRAP_LENGTH)
}

/** Build lookup maps from /api/cost-code-preferred-items — Spec Number column uses sequence only, not model number. */
function buildPreferredItemSpecLookup(preferredItems: any[]) {
  const byPreferredUuid = new Map<string, { item_sequence?: string | null }>()
  const byMasterItemUuid = new Map<string, { item_sequence?: string | null }>()

  for (const p of preferredItems || []) {
    if (!p?.uuid) continue
    const combined = pickFirstSequence(p.item_sequence, p.sequence)
    const entry = {
      item_sequence: combined || null,
    }
    byPreferredUuid.set(p.uuid, entry)
    const masterId = p.item_uuid
    if (masterId && String(masterId) !== String(p.uuid) && !byMasterItemUuid.has(masterId)) {
      byMasterItemUuid.set(masterId, entry)
    }
  }

  return { byPreferredUuid, byMasterItemUuid }
}

/**
 * Spec Number column: sequence only (item_sequence / sequence), never model_number.
 * Prefers values from preferred-items API when item_uuid matches.
 */
function resolveSpecNumberFromLookup(
  item: any,
  lookup: ReturnType<typeof buildPreferredItemSpecLookup>
): string {
  const fromApi = item.item_uuid
    ? lookup.byPreferredUuid.get(item.item_uuid) ||
      lookup.byMasterItemUuid.get(item.item_uuid)
    : undefined

  const seq = pickFirstSequence(
    fromApi?.item_sequence,
    item.item_sequence,
    item.sequence
  )

  return seq || '-'
}

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
const getItemGoodsAmount = (item: any): number => {
  return item.po_total || item.total || ((item.po_quantity || item.quantity || 0) * (item.po_unit_price || item.unit_price || 0))
}

const getItemFreightAmount = (item: any, po: any): number => {
  if (!po.freight_charges_amount || po.freight_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemGoodsAmount(item)
  return (itemAmount / po.item_total) * po.freight_charges_amount
}

const getItemPackingAmount = (item: any, po: any): number => {
  if (!po.packing_charges_amount || po.packing_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemGoodsAmount(item)
  return (itemAmount / po.item_total) * po.packing_charges_amount
}

const getItemCustomsAmount = (item: any, po: any): number => {
  if (!po.custom_duties_amount || po.custom_duties_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemGoodsAmount(item)
  return (itemAmount / po.item_total) * po.custom_duties_amount
}

const getItemOtherAmount = (item: any, po: any): number => {
  if (!po.other_charges_amount || po.other_charges_amount === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemGoodsAmount(item)
  return (itemAmount / po.item_total) * po.other_charges_amount
}

const getItemHSTAmount = (item: any, po: any): number => {
  // Calculate total taxes as sum of all sales taxes
  const totalTaxes = (po.sales_tax_1_amount || 0) + (po.sales_tax_2_amount || 0)
  if (!totalTaxes || totalTaxes === 0) return 0
  if (!po.item_total || po.item_total === 0) return 0
  const itemAmount = getItemGoodsAmount(item)
  return (itemAmount / po.item_total) * totalTaxes
}

const getItemExpectedCost = (item: any, po: any): number => {
  const goodsAmount = getItemGoodsAmount(item)
  const freightAmount = getItemFreightAmount(item, po)
  const packingAmount = getItemPackingAmount(item, po)
  const customsAmount = getItemCustomsAmount(item, po)
  const otherAmount = getItemOtherAmount(item, po)
  const hstAmount = getItemHSTAmount(item, po)
  return goodsAmount + freightAmount + packingAmount + customsAmount + otherAmount + hstAmount
}

const getTotalExpectedCosts = (po: any): number => {
  if (!po.items || po.items.length === 0) return 0
  return po.items.reduce((sum: number, item: any) => {
    return sum + getItemExpectedCost(item, po)
  }, 0)
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
    
    // Filter by status (Approved, Partially_Received, or Completed), project (required), date range, and exclude labor POs
    const filteredPOs = purchaseOrders
      .filter((po: any) => {
        const status = String(po.status || '').toLowerCase()
        return status === 'approved' || status === 'partially_received' || status === 'completed'
      })
      .filter((po: any) => po.project_uuid === selectedProjectId.value)
      .filter((po: any) => {
        // Exclude labor type purchase orders
        const poType = String(po.po_type || '').toUpperCase()
        return poType !== 'LABOR'
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

    // Project preferred items + corporation item_divisions + item_types in parallel (same hierarchy as ItemsList)
    let preferredItemSpecLookup = buildPreferredItemSpecLookup([])
    let preferredItemTypeMeta = buildPreferredItemTypeMetaLookup([])
    let itemDivisionByUuid = new Map<string, ItemDivisionConfigRow>()
    let itemTypeByUuid = new Map<string, ItemTypeConfigRow>()

    const corpUuid = selectedCorporationId.value
    const projectUuid = selectedProjectId.value

    const [prefSettled, divSettled, typeSettled] = await Promise.allSettled([
      $fetch('/api/cost-code-preferred-items', {
        method: 'GET',
        params: {
          corporation_uuid: corpUuid,
          project_uuid: projectUuid,
        },
      }),
      $fetch('/api/item-divisions', {
        method: 'GET',
        params: { corporation_uuid: corpUuid },
      }),
      $fetch('/api/item-types', {
        method: 'GET',
        params: { corporation_uuid: corpUuid },
      }),
    ])

    if (prefSettled.status === 'fulfilled') {
      const preferredRows = (prefSettled.value as any)?.data || []
      preferredItemSpecLookup = buildPreferredItemSpecLookup(preferredRows)
      preferredItemTypeMeta = buildPreferredItemTypeMetaLookup(preferredRows)
    }
    else {
      console.error('Error fetching preferred items for report:', prefSettled.reason)
    }

    if (divSettled.status === 'fulfilled') {
      itemDivisionByUuid = buildItemDivisionConfigMap((divSettled.value as any)?.data || [])
    }
    else {
      console.error('Error fetching item divisions for report:', divSettled.reason)
    }

    if (typeSettled.status === 'fulfilled') {
      itemTypeByUuid = buildItemTypeConfigMap((typeSettled.value as any)?.data || [])
    }
    else {
      console.error('Error fetching item types for report:', typeSettled.reason)
    }
    
    // Fetch locations from store (triggers API call if needed)
    await locationsStore.fetchLocations(true)
    const locationMap = new Map(
      (locationsStore.getAll || []).map((l: any) => [l.uuid, l.location_name])
    )
    
    // Fetch items for each purchase order (labor POs are excluded)
    const reportDataWithItems = await Promise.all(
      filteredPOs.map(async (po: any) => {
        try {
          let items: any[] = []
          try {
            const itemsResponse: any = await $fetch('/api/purchase-order-items', {
              method: 'GET',
              params: {
                purchase_order_uuid: po.uuid
              }
            })
            items = itemsResponse?.data || []
          } catch (itemError) {
            console.error('Error fetching items for PO:', po.uuid, itemError)
          }
          
          items = items.map((item: any) => {
            const merged = mergeItemTypeFromPreferredCatalog(item, preferredItemTypeMeta)
            const hier = resolveItemHierarchyFields(merged, itemDivisionByUuid, itemTypeByUuid)
            return {
              ...item,
              item_type_uuid: merged.item_type_uuid,
              item_type_label: merged.item_type_label,
              ...hier,
              _location_name: (item.location_uuid ? locationMap.get(item.location_uuid) : null) || item.location_label || '-',
              _spec_number: resolveSpecNumberFromLookup(item, preferredItemSpecLookup),
            }
          })
          
          const vendorName = po.vendor_uuid ? (vendorMap.get(po.vendor_uuid) || 'N/A') : 'N/A'
          
          let itemTotal = po.item_total
          if (!itemTotal && items.length > 0) {
            itemTotal = items.reduce((sum: number, item: any) => {
              const itemAmount = item.po_total || item.total || ((item.po_quantity || item.quantity || 0) * (item.po_unit_price || item.unit_price || 0))
              return sum + (itemAmount || 0)
            }, 0)
          }
          
          return {
            ...po,
            items,
            vendor_name: vendorName,
            item_total: itemTotal || 0
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
    
    // Fetch change orders for the same corporation
    let changeOrders: any[] = []
    try {
      const coResponse: any = await $fetch('/api/change-orders', {
        method: 'GET',
        params: { corporation_uuid: selectedCorporationId.value }
      })
      changeOrders = coResponse?.data || []
    } catch (coError) {
      console.error('Error fetching change orders:', coError)
    }
    
    // Filter COs by same criteria as POs
    const filteredCOs = changeOrders
      .filter((co: any) => {
        const status = String(co.status || '').toLowerCase()
        return status === 'approved' || status === 'partially_received' || status === 'completed'
      })
      .filter((co: any) => co.project_uuid === selectedProjectId.value)
      .filter((co: any) => {
        const coType = String(co.co_type || '').toUpperCase()
        return coType !== 'LABOR'
      })
      .filter((co: any) => {
        return isWithinSelectedDateRange(co.entry_date)
      })
    
    // Fetch items for each change order
    const coDataWithItems = await Promise.all(
      filteredCOs.map(async (co: any) => {
        try {
          let items: any[] = []
          try {
            const itemsResponse: any = await $fetch('/api/change-order-items', {
              method: 'GET',
              params: { change_order_uuid: co.uuid }
            })
            items = itemsResponse?.data || []
          } catch (itemError) {
            console.error('Error fetching items for CO:', co.uuid, itemError)
          }
          
          items = items.map((item: any) => {
            const merged = mergeItemTypeFromPreferredCatalog(item, preferredItemTypeMeta)
            const hier = resolveItemHierarchyFields(merged, itemDivisionByUuid, itemTypeByUuid)
            return {
              ...item,
              item_type_uuid: merged.item_type_uuid,
              item_type_label: merged.item_type_label,
              ...hier,
              _location_name: (item.location_uuid ? locationMap.get(item.location_uuid) : null) || item.location_label || '-',
              _spec_number: resolveSpecNumberFromLookup(item, preferredItemSpecLookup),
            }
          })
          
          const vendorName = co.vendor_uuid ? (vendorMap.get(co.vendor_uuid) || 'N/A') : 'N/A'
          
          let itemTotal = co.item_total
          if (!itemTotal && items.length > 0) {
            itemTotal = items.reduce((sum: number, item: any) => {
              const itemAmount = item.co_total || item.total || ((item.co_quantity || item.quantity || 0) * (item.co_unit_price || item.unit_price || 0))
              return sum + (itemAmount || 0)
            }, 0)
          }
          
          return {
            ...co,
            _record_type: 'CO' as const,
            po_number: co.co_number || co.change_order_number || 'N/A',
            items,
            vendor_name: vendorName,
            item_total: itemTotal || 0,
          }
        } catch (error) {
          console.error('Error processing CO:', co.uuid, error)
          return {
            ...co,
            _record_type: 'CO' as const,
            po_number: co.co_number || co.change_order_number || 'N/A',
            items: [],
            vendor_name: 'N/A',
          }
        }
      })
    )
    
    // Tag POs with record type and combine
    const taggedPOs = reportDataWithItems.map((po: any) => ({ ...po, _record_type: 'PO' }))
    reportData.value = [...taggedPOs, ...coDataWithItems]
    await nextTick()
  } catch (err: any) {
    console.error('Error loading report:', err)
    error.value = err.message || 'Failed to load purchase order breakout report'
    reportData.value = []
  } finally {
    loading.value = false
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

watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations()
  }
})

const itemMatchesLocation = (item: any, loc: string): boolean =>
  item.location_uuid === loc || item.metadata?.location_uuid === loc

const normalizeFilterUuid = (value: unknown): string =>
  value != null ? String(value).trim() : ''

const recordMatchesVendor = (record: any, vendorFilter: string): boolean => {
  const target = normalizeFilterUuid(vendorFilter)
  if (!target || target === '__ALL__') return true
  return (
    normalizeFilterUuid(record.vendor_uuid) === target ||
    normalizeFilterUuid(record.vendor?.uuid) === target
  )
}

const itemMatchesCategory = (item: any, categoryFilter: string): boolean => {
  const raw = String(
    item._category_value || item.category || item.item_category || ''
  ).toLowerCase()
  return raw === categoryFilter.toLowerCase()
}

const getLineGoodsAmount = (item: any): number =>
  item.po_total ||
  item.co_total ||
  item.total ||
  (item.po_quantity || item.co_quantity || item.quantity || 0) *
    (item.po_unit_price || item.co_unit_price || item.unit_price || 0)

const filterRecordItems = (record: any, filters: typeof appliedAdvancedFilters.value) => {
  let items = record.items || []

  if (filters.location) {
    items = items.filter((item: any) => itemMatchesLocation(item, filters.location!))
  }
  if (filters.category) {
    items = items.filter((item: any) => itemMatchesCategory(item, filters.category!))
  }
  if (filters.itemType) {
    items = items.filter((item: any) => item.item_type_uuid === filters.itemType)
  }

  if (items.length === 0) return null

  const itemTotal = items.reduce(
    (sum: number, item: any) => sum + (getLineGoodsAmount(item) || 0),
    0
  )

  return {
    ...record,
    items,
    item_total: itemTotal,
  }
}

// Filtered report data based on advanced filters
const filteredReportData = computed(() => {
  const filters = appliedAdvancedFilters.value

  let data = reportData.value.filter(
    (record: any) => !filters.vendor || recordMatchesVendor(record, filters.vendor)
  )

  if (filters.location || filters.category || filters.itemType) {
    data = data
      .map((record: any) => filterRecordItems(record, filters))
      .filter(Boolean)
  }

  return data
})

const printReport = () => {
  window.print()
}

const exportReportToCsv = () => {
  const data = filteredReportData.value
  if (!data?.length) return

  const rows: unknown[][] = [[
    'PO/CO Number',
    'Record Type',
    'Vendor',
    'Category',
    'Item Type',
    'Spec Number',
    'Item Name',
    'Location',
    'Item Description',
    'Item Quantity',
    ...buildBreakoutAmountExportHeaders(),
  ]]

  for (const po of data) {
    for (const item of po.items || []) {
      const quantity = item.po_quantity || item.co_quantity || item.quantity || 0
      const unitPrice = item.po_unit_price || item.co_unit_price || item.unit_price || 0
      const goodsAmount = item.po_total || item.co_total || item.total || quantity * unitPrice
      const itemRow: unknown[] = [
        po.po_number || '',
        po._record_type === 'CO' ? 'Change Order' : 'Purchase Order',
        po.vendor_name || '',
        item._category_label || '',
        item._item_type_label || '',
        item._spec_number || '',
        item.item_name || '',
        item._location_name || '',
        getDescriptionDisplayText(item.description),
        `${formatNumber(quantity)} ${item.uom || ''}`.trim(),
      ]
      appendBreakoutAmountExportCells(itemRow, po, unitPrice)
      appendBreakoutAmountExportCells(itemRow, po, goodsAmount)
      appendBreakoutAmountExportCells(itemRow, po, getItemFreightAmount(item, po))
      appendBreakoutAmountExportCells(itemRow, po, getItemPackingAmount(item, po))
      appendBreakoutAmountExportCells(itemRow, po, getItemCustomsAmount(item, po))
      appendBreakoutAmountExportCells(itemRow, po, getItemOtherAmount(item, po))
      appendBreakoutAmountExportCells(itemRow, po, getItemHSTAmount(item, po))
      appendBreakoutAmountExportCells(itemRow, po, getItemExpectedCost(item, po))
      rows.push(itemRow)
    }

    const totalRow: unknown[] = [
      'Total',
      '',
      '',
      '', '', '', '', '', '', '',
    ]
    appendBreakoutAmountExportEmptyCells(totalRow)
    appendBreakoutAmountExportCells(totalRow, po, po.item_total || 0)
    appendBreakoutAmountExportCells(totalRow, po, po.freight_charges_amount || 0)
    appendBreakoutAmountExportCells(totalRow, po, po.packing_charges_amount || 0)
    appendBreakoutAmountExportCells(totalRow, po, po.custom_duties_amount || 0)
    appendBreakoutAmountExportCells(totalRow, po, po.other_charges_amount || 0)
    appendBreakoutAmountExportCells(
      totalRow,
      po,
      (po.sales_tax_1_amount || 0) + (po.sales_tax_2_amount || 0),
    )
    appendBreakoutAmountExportCells(totalRow, po, getTotalExpectedCosts(po))
    rows.push(totalRow)
    rows.push(Array(rows[0]!.length).fill(''))
  }

  const project = projectsStore.projects.find((p) => p.uuid === selectedProjectId.value)
  void downloadReportExcelFile(
    buildReportExcelFilename('material-purchase-order-breakout', project?.project_id),
    {
      title: 'Material Purchase Order Breakout',
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

defineExpose({
  getDescriptionPlainText,
  getDescriptionDisplayText,
  wrapTextAtLength,
  DESCRIPTION_WRAP_LENGTH,
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
  .po-breakout-report,
  .po-breakout-report * {
    max-height: none !important;
  }

  .po-breakout-report {
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

