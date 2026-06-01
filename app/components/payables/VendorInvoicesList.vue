<template>
  <div>
    <div v-if="isReady && !loading" class="flex justify-end items-center mb-4">
      <div class="flex-1 max-w-sm mr-2">
        <UInput
          v-model="globalFilter"
          placeholder="Search vendor invoices..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
          class="w-full"
        />
      </div>
      <div class="flex gap-3">
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          size="xs"
          @click="openCreateModal"
        >
          Add New
        </UButton>

        <!-- Filter Button -->
        <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filter Vendor Invoices" description="Apply filters to narrow down the vendor invoices list.">
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
              <!-- Corporation -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Corporation</label>
                <CorporationSelect
                  v-model="filterCorporation"
                  placeholder="All Corporations"
                  size="sm"
                  class="w-full"
                />
              </div>

              <!-- Project -->
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

              <!-- Vendor -->
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

              <!-- Status -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                <USelect
                  v-model="filterStatus"
                  :items="statusOptions"
                  placeholder="All Statuses"
                  size="sm"
                  variant="outline"
                  class="w-full"
                  :ui="{ content: 'max-h-60 min-w-full w-max' }"
                />
              </div>

              <!-- Invoice Type -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Invoice Type</label>
                <USelect
                  v-model="filterInvoiceType"
                  :items="invoiceTypeOptions"
                  placeholder="All Types"
                  size="sm"
                  variant="outline"
                  class="w-full"
                  :ui="{ content: 'max-h-60 min-w-full w-max' }"
                />
              </div>

              <!-- Location -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Location</label>
                <LocationSelect
                  v-model="filterLocation"
                  placeholder="All Locations"
                  size="sm"
                  class-name="w-full"
                />
              </div>

              <!-- Item Category -->
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

              <!-- Item Division -->
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

              <!-- Item Type -->
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

              <!-- Date From (same pattern as VendorInvoiceForm bill date) -->
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

              <!-- Date To -->
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
      </div>
    </div>

    <!-- Filters -->
    <div v-if="isReady && !loading" class="mb-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <!-- Filters Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_2fr_1fr_1fr_minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[2fr_2fr_2fr_1fr_1fr_minmax(0,1fr)_minmax(0,1fr)] gap-4 flex-1 items-end">
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
            />
          </div>
          
          <!-- Status Filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</label>
            <USelect
              v-model="filterStatus"
              :items="statusOptions"
              placeholder="All Statuses"
              size="sm"
              variant="outline"
              class="w-full"
              :ui="{ content: 'max-h-60 min-w-full w-max' }"
            />
          </div>
          
          <!-- Invoice Type Filter -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Invoice Type</label>
            <USelect
              v-model="filterInvoiceType"
              :items="invoiceTypeOptions"
              placeholder="All Types"
              size="sm"
              variant="outline"
              class="w-full"
              :ui="{ content: 'max-h-60 min-w-full w-max' }"
            />
          </div>

          <!-- Bill date range — UPopover + UCalendar (VendorInvoiceForm pattern) -->
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

    <!-- Vendor Invoices Table -->
    <div v-if="loading">
      <div class="relative overflow-auto rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <!-- Loading skeleton -->
        <div class="bg-gray-50 dark:bg-gray-700">
          <div class="grid grid-cols-11 gap-4 px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider border-b border-gray-200 dark:border-gray-600">
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-16" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-24" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-24" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-16" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center gap-2">
              <USkeleton class="h-4 w-4 rounded" />
              <USkeleton class="h-4 w-20" />
            </div>
            <div class="flex items-center justify-center">
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </div>
        
        <!-- Table Body -->
        <div class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="i in 8" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
            <div class="grid grid-cols-11 gap-4 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 border-gray-100 dark:border-gray-700">
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-24" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-24" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-24" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-16" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center">
                <USkeleton class="h-4 w-20" />
              </div>
              <div class="flex items-center justify-end gap-1">
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
                <USkeleton class="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Only show error alert for fetch errors (when no data), not for save errors -->
    <div v-else-if="error && vendorInvoices.length === 0 && !loading">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
        :description="'Please try refreshing the page or contact support if the issue persists.'"
      />
    </div>

    <div v-else-if="isReady && (vendorInvoices.length > 0 || appliedFilters.corporation || appliedFilters.project)">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="filteredVendorInvoices"
        :columns="columns"
        v-model:selected="selectedVendorInvoices"
        v-model:global-filter="globalFilter"
        :selectable="true"
        class="max-h-[70vh] overflow-auto"
      />
      
      <!-- Pagination -->
      <div v-if="shouldShowPagination(filteredVendorInvoices.length).value" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <USelect
            v-model="pagination.pageSize"
            :items="pageSizeOptions"
            icon="i-heroicons-list-bullet"
            size="sm"
            variant="outline"
            class="w-32"
            @change="updatePageSize(table)"
          />
        </div>
        
        <UPagination v-bind="getPaginationProps(table)" />
        
        <div class="text-sm text-gray-600">
          {{ getPageInfo(table, 'vendor invoices').value }}
        </div>
      </div>
    </div>

    <div v-else-if="!isReady" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">Loading...</p>
    </div>

    <div v-else-if="!isReady" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">Loading...</p>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto" />
      </div>
      <p v-if="!appliedFilters.corporation || !appliedFilters.project" class="text-gray-500 text-lg">Please select Corporation and Project from the filters above to view vendor invoices</p>
      <template v-else>
        <p class="text-gray-500 text-lg">No vendor invoices found</p>
        <p class="text-gray-400 text-sm mb-6">No vendor invoices match the selected filters</p>
      </template>
      <UButton 
        v-if="!appliedFilters.corporation || !appliedFilters.project"
        icon="i-heroicons-plus" 
        @click="openCreateModal"
      >
        Add Vendor Invoice
      </UButton>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="'Delete Vendor Invoice'">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900">Delete Vendor Invoice</h3>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          
          <div v-if="invoiceToDelete" class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700">
              <strong>Invoice Number:</strong> {{ invoiceToDelete.number || 'N/A' }}<br>
              <strong>Bill Date:</strong> {{ formatBillDate(invoiceToDelete.bill_date) }}<br>
              <strong>Vendor:</strong> {{ invoiceToDelete.vendor_name || 'N/A' }}<br>
              <strong>Amount:</strong> {{ formatCurrency(invoiceToDelete.amount || 0) }}<br>
            </p>
          </div>
          
          <p class="text-gray-600">
            Are you sure you want to delete this vendor invoice? This will permanently remove the invoice and all associated data.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="soft"
            :disabled="deletingInvoice"
            @click="cancelDelete"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deletingInvoice"
            :disabled="deletingInvoice"
            @click="confirmDelete"
          >
            Delete Vendor Invoice
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Create/Edit/View Vendor Invoice Modal -->
    <UModal v-model:open="showFormModal" :title="formModalTitle" fullscreen scrollable>
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <div class="flex items-center gap-4 flex-shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formModalTitle }}
            </h3>
            <span
              class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border"
              :class="statusChipClass"
            >
              {{ statusLabel }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-1 justify-end">
            <div class="flex items-center gap-2">
              <!-- No buttons shown when status is Paid/partially_paid -->
              <template v-if="['paid', 'partially_paid'].includes(String(invoiceForm.value?.status || '').toLowerCase())">
                <!-- All buttons are hidden when invoice is paid -->
              </template>
              
              <template v-else-if="!hideModalActionButtons">
                <UButton
                  v-if="isViewMode && hasPermission('vendor_invoices_edit') && !['paid', 'partially_paid'].includes(String(invoiceForm.value?.status || '').toLowerCase())"
                  type="button"
                  color="primary"
                  icon="tdesign:edit-filled"
                  size="sm"
                  @click="switchToEditMode"
                >
                  Edit Vendor Invoice
                </UButton>

                <!-- Permission-based action buttons -->
                <!-- Save buttons (for users without verify/approve/payment permissions) -->
                <template v-if="!isViewMode && showSaveButtons">
                  <UButton
                    data-testid="btn-save-new"
                    color="primary"
                    variant="solid"
                    icon="i-heroicons-document-plus"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleSaveAndNew"
                  >
                    Save & New
                  </UButton>
                  <UButton
                    data-testid="btn-save-close"
                    color="primary"
                    variant="outline"
                    icon="i-heroicons-check"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleSaveAndClose"
                  >
                    Save & Close
                  </UButton>
                </template>

                <!-- Verify: Nimble GetUserApprovalDetails approvalType 2 -->
                <template v-else-if="!isViewMode && showVerifyButtons">
                  <UButton
                    data-testid="btn-verify-new"
                    color="primary"
                    variant="solid"
                    icon="i-heroicons-document-check"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleVerifyAndNew"
                  >
                    Verify & New
                  </UButton>
                  <UButton
                    data-testid="btn-verify-close"
                    color="primary"
                    variant="outline"
                    icon="i-heroicons-check-circle"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleVerifyAndClose"
                  >
                    Verify & Close
                  </UButton>
                </template>

                <!-- Approve: Nimble approvalType 3 -->
                <template v-else-if="!isViewMode && showApproveButtons">
                  <UButton
                    data-testid="btn-approve-new"
                    color="primary"
                    variant="solid"
                    icon="i-heroicons-arrow-up-circle"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleApproveAndNew"
                  >
                    Approve & New
                  </UButton>
                  <UButton
                    data-testid="btn-approve-close"
                    color="primary"
                    variant="outline"
                    icon="i-heroicons-check-circle"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleApproveAndClose"
                  >
                    Approve & Close
                  </UButton>
                  <!-- Reject button (shown when invoice status is Pending) -->
                  <UButton
                    v-if="showRejectButton"
                    data-testid="btn-reject-draft"
                    color="error"
                    variant="soft"
                    icon="i-heroicons-arrow-uturn-left"
                    size="sm"
                    :disabled="savingInvoice || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleRejectToDraft"
                  >
                    Reject
                  </UButton>
                </template>
                
                <!-- Reject: Nimble approver (type 3) for Approved/unpaid -->
                <template v-else-if="!isViewMode && showRejectButtonForApproved">
                  <UButton
                    data-testid="btn-save-draft"
                    :color="saveDraftButtonColor"
                    :variant="saveDraftButtonVariant"
                    :icon="saveDraftButtonIcon"
                    size="sm"
                    :disabled="isSaveDraftButtonDisabled || hasInvoiceValidationError"
                    :loading="savingInvoice"
                    @click="handleSaveAsDraft"
                  >
                    {{ saveDraftButtonLabel }}
                  </UButton>
                </template>

              </template>
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
        <VendorInvoiceForm
          ref="invoiceFormRef"
          :key="formKey"
          v-model:form="invoiceForm"
          :editing-invoice="isEditingExistingInvoice"
          :loading="loadingEditInvoice"
          :readonly="isViewMode || isReadOnlyStatus"
          :total-invoice-amount-error="totalInvoiceAmountError"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, onBeforeUnmount, useTemplateRef, resolveComponent, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { useCorporationStore } from '~/stores/corporations'
import { useVendorInvoicesStore } from '~/stores/vendorInvoices'
import { useVendorStore } from '~/stores/vendors'
import { useProjectsStore } from '~/stores/projects'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useChangeOrdersStore } from '~/stores/changeOrders'
import { usePurchaseOrderResourcesStore } from '~/stores/purchaseOrderResources'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { usePermissions } from '~/composables/usePermissions'
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import VendorInvoiceForm from '~/components/payables/VendorInvoiceForm.vue'
import { applyVendorInvoiceCoaAssignmentsToForm } from '~/utils/applyVendorInvoiceCoaAssignmentsToForm'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemDivisionSelect from '~/components/shared/ItemDivisionSelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import { useLocationsStore } from '~/stores/locations'
import { useNimbleSessionStore } from '~/stores/nimbleSession'

// Local declaration to satisfy TS for auto-imported useToast
declare function useToast(): { add: (opts: any) => void }

// Resolve components for table columns
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// Stores
const corporationStore = useCorporationStore()
const nimbleSessionStore = useNimbleSessionStore()
const {
  token: nimbleSessionToken,
  userID: nimbleSessionUserId,
  exchangedAuthId: nimbleExchangedAuthId,
} = storeToRefs(nimbleSessionStore)
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

/** Under Vitest, refresh immediately so computed flags (e.g. approver type 3) match assertions. */
const NIMBLE_BILL_POLICY_WATCH_DEBOUNCE_MS =
  import.meta.env.VITEST === true || import.meta.env.MODE === "test" ? 0 : 280

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
const vendorInvoicesStore = useVendorInvoicesStore()
const vendorStore = useVendorStore()
const projectsStore = useProjectsStore()
const costCodeConfigurationsStore = useCostCodeConfigurationsStore()
const purchaseOrdersStore = usePurchaseOrdersStore()
const changeOrdersStore = useChangeOrdersStore()
const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore()
const locationsStore = useLocationsStore()
const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()

/** Local-calendar YYYY-MM-DD for the last `days` days inclusive (including today). */
const createDefaultBillDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  const pad = (n: number) => String(n).padStart(2, '0')
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { dateFrom: ymd(start), dateTo: ymd(end) }
}

const defaultBillDateRange = createDefaultBillDateRange(60)

const ymdStringToCalendarDate = (ymd: string | undefined | null): CalendarDate | null => {
  if (!ymd) return null
  const parts = String(ymd).trim().split("-")
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
  return new CalendarDate(year, month, day)
}

const calendarDateToYmd = (v: CalendarDate | null | undefined): string | undefined => {
  if (!v) return undefined
  return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`
}

const listFilterDateFormatter = new DateFormatter("en-US", {
  dateStyle: "medium",
})

const toComparableDate = (value: string | null | undefined): string | null => {
  if (!value) return null
  const raw = String(value).trim()
  const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefixMatch?.[1]) return datePrefixMatch[1]

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
}

const toPlainYmd = (value: string | null | undefined): string | null => {
  if (!value) return null
  const raw = String(value).trim()
  const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return datePrefixMatch?.[1] || null
}

const formatBillDate = (value: string | null | undefined): string => {
  const ymd = toPlainYmd(value)
  if (!ymd) return ''
  return formatDate(ymd)
}

const formatDueDate = (value: string | null | undefined): string => {
  const ymd = toPlainYmd(value)
  if (!ymd) return 'N/A'
  return formatDate(ymd)
}

type VendorInvoiceListApiFilters = {
  project_uuid?: string
  vendor_uuid?: string
  status?: string
  invoice_type?: string
  bill_date_from?: string
  bill_date_to?: string
}

// Use permissions composable
const { isReady, hasPermission } = usePermissions()
const canEdit = computed(() => hasPermission('vendor_invoices_edit') || hasPermission('vendor_invoices_create'))
const canPay = computed(() => hasPermission('vendor_invoices_payment'))

// Check if invoice status should make the form read-only
const isReadOnlyStatus = computed(() => {
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  // Pending/Approved/Unpaid should stay editable; only settled states are locked.
  return status === 'paid' || status === 'partially_paid'
})

const isInvoiceEditLocked = (invoice: any): boolean => {
  const status = String(invoice?.status || '').trim().toLowerCase()
  return status === 'paid' || status === 'partially_paid'
}

// Invoice type mapping
const invoiceTypeMap: Record<string, string> = {
  'ENTER_DIRECT_INVOICE': 'Direct Invoice',
  'AGAINST_PO': 'PO Invoice',
  'AGAINST_CO': 'CO Invoice',
  'AGAINST_ADVANCE_PAYMENT': 'Advance Payment',
  'AGAINST_HOLDBACK_AMOUNT': 'Hold Back Amount',
};

const getInvoiceTypeLabel = (invoiceType: string | null | undefined): string => {
  if (!invoiceType) return 'N/A';
  return invoiceTypeMap[invoiceType] || invoiceType;
};

// Status options for filter
const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Draft', value: 'Draft' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Partially Paid', value: 'partially_paid' }
]

// Invoice type options for filter
const invoiceTypeOptions = [
  { label: 'All Types', value: null },
  { label: 'Direct Invoice', value: 'ENTER_DIRECT_INVOICE' },
  { label: 'PO Invoice', value: 'AGAINST_PO' },
  { label: 'CO Invoice', value: 'AGAINST_CO' },
  { label: 'Advance Payment', value: 'AGAINST_ADVANCE_PAYMENT' },
  { label: 'Hold Back Amount', value: 'AGAINST_HOLDBACK_AMOUNT' }
]

// Table functionality
const {
  pagination,
  paginationOptions,
  pageSizeOptions,
  updatePageSize,
  getPaginationProps,
  getPageInfo,
  shouldShowPagination
} = useTableStandard()

// Data state
const selectedVendorInvoices = ref<any[]>([])
const globalFilter = ref('')

// Sorting state
const sorting = ref([])
const showDeleteModal = ref(false)
const invoiceToDelete = ref<any>(null)
const showFormModal = ref(false)
const isViewMode = ref(false)
const isEditingExistingInvoice = ref(false)
const formKey = ref(0) // Key to force VendorInvoiceForm remount
const invoiceForm = ref<any>({
  attachments: []
})
const invoiceFormRef = ref<InstanceType<typeof VendorInvoiceForm> | null>(null)
const savingInvoice = ref(false)
const loadingEditInvoice = ref(false)

/** Nimble `GetUserApprovalDetails?screenType=21` — verifier = approvalType 2, approver = 3 for current `userID` + corporation. */
const nimbleBillVerifierType2 = ref(false)
const nimbleBillApproverType3 = ref(false)
const nimbleBillApprovalCheckLoading = ref(false)

function nimbleAuthIdFromRoute(): string {
  const p = route.params.authId
  const q = route.query.authId
  const pv = Array.isArray(p) ? p[0] : p
  const qv = Array.isArray(q) ? q[0] : q
  return String(pv ?? qv ?? "").trim()
}

function nimbleCorporationHexForUuid(corpUuid: string): string {
  const uuid = String(corpUuid || "").trim()
  if (!uuid) return ""
  const list = corporationStore.corporations || []
  const row = list.find((c: any) => String(c?.uuid || "") === uuid)
  let hex = String(row?.nimble_corporation_id ?? "").trim()
  if (hex) return hex
  const sel = corporationStore.selectedCorporation as { uuid?: string; nimble_corporation_id?: string } | undefined
  if (sel && String(sel.uuid || "") === uuid) {
    hex = String(sel.nimble_corporation_id ?? "").trim()
    if (hex) return hex
  }
  return ""
}

/** Re-run policy when Nimble corp hex becomes available (corporation list / nimble_corporation_id hydration). */
const invoiceCorpNimbleHex = computed(() =>
  nimbleCorporationHexForUuid(String(invoiceForm.value?.corporation_uuid || "").trim())
)

const NIMBLE_BILL_POLICY_LOG = "[VendorInvoicesList] Nimble bill policy (screen 21)"

/** Coalesce overlapping `user-approval-details` POSTs (watch fires many times per modal tick). */
let nimbleUserApprovalInFlight: Promise<void> | null = null
let nimbleUserApprovalInFlightKey = ""
/** Successful response for this key while the invoice modal is open — skip duplicate POSTs. */
let nimbleUserApprovalDetailsCachedKey = ""

/** Serialize concurrent ExchangeOAuth calls (Nimble tokens are often single-use; parallel POSTs can 401 and clear session). */
let nimbleBillPolicyExchangeInFlight: Promise<boolean> | null = null

let nimbleBillPolicyRefreshDebounce: ReturnType<typeof setTimeout> | null = null

/** Exchange route `authId` for Nimble Bearer token (same as `useNimbleFromRoute` + `/api/nimble/exchange-oauth`). */
async function ensureNimbleSessionWithRouteAuthId(): Promise<boolean> {
  const tok = String(nimbleSessionToken.value || "").trim()
  if (tok) {
    return true
  }

  const authId = nimbleAuthIdFromRoute()
  if (!authId) {
    return false
  }

  if (nimbleBillPolicyExchangeInFlight) {
    return nimbleBillPolicyExchangeInFlight
  }

  nimbleBillPolicyExchangeInFlight = (async (): Promise<boolean> => {
    try {
      const res = await $fetch<unknown>("/api/nimble/exchange-oauth", {
        method: "POST",
        body: { token: authId },
      })
      if (nimbleSessionStore.setSession(res, authId)) {
        return true
      }
      console.warn(`${NIMBLE_BILL_POLICY_LOG} exchange: bad response (normalize failed or not 200)`)
    } catch (e) {
      console.warn(`${NIMBLE_BILL_POLICY_LOG} exchange: request failed`, e)
    }
    return false
  })()

  try {
    return await nimbleBillPolicyExchangeInFlight
  } finally {
    nimbleBillPolicyExchangeInFlight = null
  }
}

/** Match policy row to current user: by `userID` when known, else Nimble `isCurrentUser` on the row. */
function nimbleRowMatchesUser(r: any, corpNorm: string, userNorm: string): boolean {
  const cid = String(r?.corporationID ?? r?.corporationId ?? r?.CorporationID ?? "").trim().toLowerCase()
  if (cid !== corpNorm) return false
  if (userNorm) {
    const uid = String(r?.userID ?? r?.userId ?? r?.UserID ?? "").trim().toLowerCase()
    return uid === userNorm
  }
  return Boolean(r?.isCurrentUser === true || r?.IsCurrentUser === true)
}

async function refreshNimbleBillApprovalPolicy() {
  if (!showFormModal.value) {
    nimbleBillVerifierType2.value = false
    nimbleBillApproverType3.value = false
    return
  }

  const nimbleOn =
    runtimeConfig.public?.nimbleIntegrations === true ||
    String(runtimeConfig.public?.nimbleIntegrations || "").toLowerCase() === "true"
  if (!nimbleOn) {
    nimbleBillVerifierType2.value = false
    nimbleBillApproverType3.value = false
    return
  }

  await ensureNimbleSessionWithRouteAuthId()

  const corpUuid = String(invoiceForm.value?.corporation_uuid || "").trim()
  if (!corpUuid) {
    nimbleBillVerifierType2.value = false
    nimbleBillApproverType3.value = false
    return
  }

  const token = String(nimbleSessionToken.value || "").trim()
  const sessionUserId = String(nimbleSessionUserId.value || "").trim()
  if (!token) {
    nimbleBillVerifierType2.value = false
    nimbleBillApproverType3.value = false
    return
  }

  const nimbleCorpHex = nimbleCorporationHexForUuid(corpUuid)
  if (!nimbleCorpHex) {
    nimbleBillVerifierType2.value = false
    nimbleBillApproverType3.value = false
    return
  }

  const approvalRequestKey = `${corpUuid}:${nimbleCorpHex}:${token.slice(0, 24)}`
  if (nimbleUserApprovalInFlight && nimbleUserApprovalInFlightKey === approvalRequestKey) {
    try {
      await nimbleUserApprovalInFlight
      return
    } catch {
      /* prior attempt failed; run a fresh fetch below */
    }
  }

  if (nimbleUserApprovalDetailsCachedKey === approvalRequestKey) {
    return
  }

  // Do not clear verifier/approver before this point: overlapping debounced watches used to zero flags,
  // await an in-flight request, and return — leaving Save/Verify/Approve buttons flickering.

  const approvalRun = (async () => {
    nimbleBillApprovalCheckLoading.value = true
    try {
      const rows = await $fetch<unknown>("/api/nimble/user-approval-details", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: [nimbleCorpHex],
      })
      const list = Array.isArray(rows) ? rows : []
      if (!Array.isArray(rows)) {
        console.warn(`${NIMBLE_BILL_POLICY_LOG} refresh: response is not an array`, rows)
      }
      const userNorm = sessionUserId.toLowerCase()
      const corpNorm = nimbleCorpHex.toLowerCase()
      nimbleBillApproverType3.value = list.some(
        (r: any) => nimbleRowMatchesUser(r, corpNorm, userNorm) && Number(r?.approvalType ?? r?.approval_type) === 3
      )
      nimbleBillVerifierType2.value = list.some(
        (r: any) => nimbleRowMatchesUser(r, corpNorm, userNorm) && Number(r?.approvalType ?? r?.approval_type) === 2
      )
      nimbleUserApprovalDetailsCachedKey = approvalRequestKey
    } catch (e) {
      console.warn(`${NIMBLE_BILL_POLICY_LOG} refresh: user-approval-details failed`, e)
      nimbleBillVerifierType2.value = false
      nimbleBillApproverType3.value = false
    } finally {
      nimbleBillApprovalCheckLoading.value = false
    }
  })()

  nimbleUserApprovalInFlight = approvalRun
  nimbleUserApprovalInFlightKey = approvalRequestKey
  try {
    await approvalRun
  } finally {
    if (nimbleUserApprovalInFlight === approvalRun) {
      nimbleUserApprovalInFlight = null
      nimbleUserApprovalInFlightKey = ""
    }
  }
}

watch(
  () =>
    [
      showFormModal.value,
      invoiceForm.value?.corporation_uuid,
      invoiceCorpNimbleHex.value,
      nimbleSessionToken.value,
      nimbleSessionUserId.value,
      nimbleAuthIdFromRoute(),
    ] as const,
  () => {
    if (NIMBLE_BILL_POLICY_WATCH_DEBOUNCE_MS <= 0) {
      void refreshNimbleBillApprovalPolicy()
      return
    }
    if (nimbleBillPolicyRefreshDebounce) {
      clearTimeout(nimbleBillPolicyRefreshDebounce)
    }
    nimbleBillPolicyRefreshDebounce = setTimeout(() => {
      nimbleBillPolicyRefreshDebounce = null
      void refreshNimbleBillApprovalPolicy()
    }, NIMBLE_BILL_POLICY_WATCH_DEBOUNCE_MS)
  }
)

const totalInvoiceAmountError = ref<string | null>(null)
const singleInvoicePollTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const singleInvoicePollUuid = ref<string | null>(null)
const deletingInvoice = ref(false)

// Filter drawer state
const isFilterDrawerOpen = ref(false)

// Filter state (temporary - not applied until Show Results is clicked)
// Initialize as null, will be set from TopBar selection in onMounted
const filterCorporation = ref<string | undefined>(undefined)
const filterProject = ref<string | undefined>(undefined)
const filterVendor = ref<string | undefined>(undefined)
const filterLocation = ref<string | undefined>(undefined)
const filterStatus = ref<string | null>(null)
const filterInvoiceType = ref<string | null>(null)
const filterCategory = ref<string | undefined>(undefined)
const filterDivision = ref<string | undefined>(undefined)
const filterItemType = ref<string | undefined>(undefined)
const filterDateFrom = ref<string | undefined>(defaultBillDateRange.dateFrom)
const filterDateTo = ref<string | undefined>(defaultBillDateRange.dateTo)

const inlinePopoverFilterDateFromOpen = ref(false)
const inlinePopoverFilterDateToOpen = ref(false)
const drawerPopoverFilterDateFromOpen = ref(false)
const drawerPopoverFilterDateToOpen = ref(false)

/** UCalendar v-model (same idea as VendorInvoiceForm billDateValue / dueDateValue). */
const filterDateFromCalendarValue = computed({
  get: () => ymdStringToCalendarDate(filterDateFrom.value),
  set: (value: CalendarDate | null | undefined) => {
    filterDateFrom.value = calendarDateToYmd(value ?? null)
  },
})

const filterDateToCalendarValue = computed({
  get: () => ymdStringToCalendarDate(filterDateTo.value),
  set: (value: CalendarDate | null | undefined) => {
    filterDateTo.value = calendarDateToYmd(value ?? null)
  },
})

const filterDateFromCalendarBound = computed(() => ymdStringToCalendarDate(filterDateFrom.value) ?? undefined)
const filterDateToCalendarBound = computed(() => ymdStringToCalendarDate(filterDateTo.value) ?? undefined)

const filterDateFromDisplayText = computed(() => {
  const cd = filterDateFromCalendarValue.value
  if (!cd) return "Select date from"
  return listFilterDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

const filterDateToDisplayText = computed(() => {
  const cd = filterDateToCalendarValue.value
  if (!cd) return "Select date to"
  return listFilterDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

// Applied filters (only applied when Show Results is clicked)
const appliedFilters = ref({
  corporation: undefined as string | undefined,
  project: undefined as string | undefined,
  vendor: undefined as string | undefined,
  location: undefined as string | undefined,
  status: null as string | null,
  invoiceType: null as string | null,
  category: undefined as string | undefined,
  division: undefined as string | undefined,
  itemType: undefined as string | undefined,
  dateFrom: defaultBillDateRange.dateFrom as string | undefined,
  dateTo: defaultBillDateRange.dateTo as string | undefined,
})

const buildApiListFilters = (): VendorInvoiceListApiFilters | undefined => {
  const f: VendorInvoiceListApiFilters = {}
  if (appliedFilters.value.project) f.project_uuid = appliedFilters.value.project
  if (appliedFilters.value.vendor) f.vendor_uuid = appliedFilters.value.vendor
  if (appliedFilters.value.status) f.status = appliedFilters.value.status
  if (appliedFilters.value.invoiceType) f.invoice_type = appliedFilters.value.invoiceType
  if (appliedFilters.value.dateFrom) f.bill_date_from = appliedFilters.value.dateFrom
  if (appliedFilters.value.dateTo) f.bill_date_to = appliedFilters.value.dateTo
  return Object.keys(f).length > 0 ? f : undefined
}

const stopSingleInvoicePolling = () => {
  if (singleInvoicePollTimer.value) {
    clearTimeout(singleInvoicePollTimer.value)
    singleInvoicePollTimer.value = null
  }
  singleInvoicePollUuid.value = null
}

const patchVendorInvoiceInList = (latestInvoice: any) => {
  if (!latestInvoice?.uuid) return
  if (typeof (vendorInvoicesStore as any).upsertVendorInvoice === "function") {
    ;(vendorInvoicesStore as any).upsertVendorInvoice(latestInvoice)
    return
  }
  const currentList = Array.isArray((vendorInvoicesStore as any).vendorInvoices)
    ? ([...(vendorInvoicesStore as any).vendorInvoices] as any[])
    : []
  const rowIndex = currentList.findIndex((row: any) => row.uuid === latestInvoice.uuid)
  if (rowIndex >= 0) {
    currentList[rowIndex] = {
      ...currentList[rowIndex],
      ...latestInvoice,
    }
  } else {
    currentList.unshift(latestInvoice)
  }
  ;(vendorInvoicesStore as any).vendorInvoices = currentList
}

const startSingleInvoicePolling = (invoiceUuid: string, baselineStatus: string) => {
  const normalizedBaseline = String(baselineStatus || "").trim().toLowerCase()
  if (!invoiceUuid || !normalizedBaseline) return

  stopSingleInvoicePolling()
  singleInvoicePollUuid.value = invoiceUuid

  const startedAt = Date.now()
  const timeoutMs = 180000
  const intervalMs = 3000

  const poll = async () => {
    if (singleInvoicePollUuid.value !== invoiceUuid) return
    if (Date.now() - startedAt >= timeoutMs) {
      stopSingleInvoicePolling()
      return
    }

    try {
      const latest: any = await $fetch(`/api/vendor-invoices/${invoiceUuid}`, { method: "GET" })
      const latestStatus = String(latest?.data?.status || "").trim().toLowerCase()

      if (latestStatus && latestStatus !== normalizedBaseline) {
        const latestInvoice = latest?.data
        patchVendorInvoiceInList(latestInvoice)
        if (invoiceForm.value?.uuid === invoiceUuid) {
          invoiceForm.value = {
            ...invoiceForm.value,
            status: (latestInvoice as any)?.status ?? invoiceForm.value.status,
          }
        }
        stopSingleInvoicePolling()
        return
      }
    } catch (error) {
      console.warn("[VendorInvoicesList] single invoice polling failed:", error)
    }

    singleInvoicePollTimer.value = setTimeout(poll, intervalMs)
  }

  singleInvoicePollTimer.value = setTimeout(poll, intervalMs)
}

// Computed
const selectedCorporationId = computed(() => corporationStore.selectedCorporationId)

// Get validation errors from VendorInvoiceForm
const hasInvoiceValidationError = computed(() => {
  return invoiceFormRef.value?.hasValidationError ?? false
})

const hideModalActionButtons = computed(() => {
  if (!showFormModal.value) return false
  if (loadingEditInvoice.value) return true
  const formRef = invoiceFormRef.value as any
  if (!formRef) return true
  return Boolean(formRef.isHydratingForModalActions)
})

// Modal actions: Verify/Approve from Nimble GetUserApprovalDetails (screen 21), not app RBAC.
// Show Save buttons when user can edit but is not Nimble verifier (2) or approver (3) for this bill.
const showSaveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (nimbleBillVerifierType2.value || nimbleBillApproverType3.value || canPay.value) return false
  
  // Don't show if status is Paid
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  if (status === 'paid' || status === 'partially_paid' || status === 'unpaid') {
    return false
  }
  
  // Don't show if status is already Approved (only approvers can modify approved invoices)
  if (invoiceForm.value?.status === 'Approved') {
    return false
  }
  
  return true
})

// Verify when Nimble policy has approvalType 2 for this user/corporation (not type 3).
const showVerifyButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (!nimbleBillVerifierType2.value) return false
  if (nimbleBillApproverType3.value) return false
  
  // Don't show if status is Paid
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  if (status === 'paid' || status === 'partially_paid' || status === 'unpaid') {
    return false
  }
  
  // Don't show if status is already Approved
  if (invoiceForm.value?.status === 'Approved') {
    return false
  }
  
  return true
})

// Approve when Nimble policy has approvalType 3 for this user/corporation.
const showApproveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (!nimbleBillApproverType3.value) return false
  
  // Keep buttons visible while saving (to show loading state)
  // If we're saving and the status is Approved, it means we just clicked approve
  // so keep the buttons visible to show the loading state
  if (savingInvoice.value && invoiceForm.value?.status === 'Approved') {
    // Only keep visible if the status before save was not Approved
    // (meaning we're approving, not editing an already-approved invoice)
    const previousStatus = statusBeforeSave.value
    if (previousStatus && String(previousStatus).toLowerCase() !== 'approved') {
      return true // Keep visible during save to show loading state
    }
  }
  
  // Don't show if status is Paid
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  if (status === 'paid' || status === 'partially_paid' || status === 'unpaid') {
    return false
  }
  
  // Don't show approve buttons when status is already Approved (unless saving)
  // (use reject button via showRejectButtonForApproved instead)
  if (invoiceForm.value?.status === 'Approved' && !savingInvoice.value) {
    return false
  }
  
  return true
})

// Pending invoices should go through Verify/Approve flows, not Reject.
const showRejectButton = computed(() => {
  return false
})

// Show Reject button only for Approved/unpaid statuses.
const showRejectButtonForApproved = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (!nimbleBillApproverType3.value) return false
  if (!invoiceForm.value?.uuid) return false
  
  // Only show when status is Approved or unpaid
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  return status === 'approved' || status === 'unpaid'
})

// Legacy computed properties for backward compatibility (if needed elsewhere)
const showApprovalButtons = computed(() => showApproveButtons.value && showRejectButton.value) // For Pending status
const showSaveDraftButton = computed(() => showRejectButtonForApproved.value) // For Approved status, show reject button
const showMarkPendingButton = computed(() => false) // Deprecated - use showVerifyButtons instead
const showAnySaveButtons = computed(() => showSaveButtons.value || showVerifyButtons.value || showApproveButtons.value)

const saveDraftButtonLabel = computed(() => {
  const invoiceStatus = String(invoiceForm.value?.status || '').toLowerCase()
  if (invoiceStatus === 'paid') {
    return 'Locked'
  }
  if (invoiceForm.value?.uuid && (invoiceStatus === 'approved' || invoiceStatus === 'unpaid')) {
    return 'Reject'
  }
  return 'Save'
})

const saveDraftButtonIcon = computed(() => {
  const invoiceStatus = String(invoiceForm.value?.status || '').toLowerCase()
  if (invoiceStatus === 'paid') {
    return 'i-heroicons-lock-closed'
  }
  if (invoiceForm.value?.uuid && (invoiceStatus === 'approved' || invoiceStatus === 'unpaid')) {
    return 'i-heroicons-arrow-uturn-left'
  }
  return 'i-heroicons-check'
})

const saveDraftButtonColor = computed(() => {
  const invoiceStatus = String(invoiceForm.value?.status || '').toLowerCase()
  if (invoiceStatus === 'paid') {
    return 'neutral'
  }
  if (invoiceForm.value?.uuid && (invoiceStatus === 'approved' || invoiceStatus === 'unpaid')) {
    return 'error'
  }
  return 'primary'
})

const saveDraftButtonVariant = computed(() => {
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  if (status === 'paid') {
    return 'soft'
  }
  if (invoiceForm.value?.uuid && (status === 'approved' || status === 'unpaid')) {
    return 'soft'
  }
  return 'solid'
})

const isSaveDraftButtonDisabled = computed(() => {
  const status = String(invoiceForm.value?.status || '').toLowerCase()
  return status === 'paid' || hasInvoiceValidationError.value
})

// Column pinning for sticky actions column
const columnPinning = ref({
  left: [],
  right: ['actions']
});

// Table ref for accessing table API
const table = useTemplateRef<any>('table');

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

// Use store data
const vendorInvoices = computed(() => vendorInvoicesStore.vendorInvoices)
const loading = computed(() => vendorInvoicesStore.loading)
const error = computed(() => vendorInvoicesStore.error)

const formModalTitle = computed(() => {
  if (isViewMode.value) return 'View Vendor Invoice'
  return invoiceForm.value?.uuid ? 'Edit Vendor Invoice' : 'New Vendor Invoice'
})

// Status display helpers for form modal
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    Draft: 'Draft',
    Pending: 'Pending',
    Approved: 'Approved',
    Paid: 'Paid',
  };
  const status = invoiceForm.value?.status || 'Draft';
  return map[status] || status;
});

const statusChipClass = computed(() => {
  const map: Record<string, string> = {
    Draft:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
    Pending:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
    Approved:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    Paid:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  };
  const status = invoiceForm.value?.status || 'Draft';
  return map[status] || map.Draft;
});

const filteredVendorInvoices = computed(() => {
  let filtered = [...vendorInvoices.value]
  
  // Note: Corporation, Project, Vendor, Status, and Invoice Type filters are now applied server-side
  // Only apply global search filter and client-side-only filters here

  if (globalFilter.value.trim()) {
    const searchTerm = globalFilter.value.toLowerCase().trim()
    filtered = filtered.filter(invoice => {
      const searchableFields = [
        invoice.number || '',
        invoice.vendor_name || '',
        invoice.project_name || '',
        invoice.invoice_type || '',
        invoice.po_number || '',
      ]
      return searchableFields.some(field => 
        field.toLowerCase().includes(searchTerm)
      )
    })
  }

  // Client-side date range filter
  const activeDateFrom = appliedFilters.value.dateFrom
  const activeDateTo = appliedFilters.value.dateTo

  if (activeDateFrom) {
    filtered = filtered.filter(invoice => {
      const invoiceDate = toComparableDate(invoice.bill_date || invoice.created_at)
      return !!invoiceDate && invoiceDate >= activeDateFrom
    })
  }

  if (activeDateTo) {
    filtered = filtered.filter(invoice => {
      const invoiceDate = toComparableDate(invoice.bill_date || invoice.created_at)
      return !!invoiceDate && invoiceDate <= activeDateTo
    })
  }

  // Client-side location filter
  const activeLocation = appliedFilters.value.location
  if (activeLocation) {
    filtered = filtered.filter(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        return invoice.items.some((item: any) => item.location_uuid === activeLocation)
      }
      return false
    })
  }

  // Client-side item category/division/type filters
  const activeCategory = appliedFilters.value.category
  const activeDivision = appliedFilters.value.division
  const activeItemType = appliedFilters.value.itemType

  if (activeCategory) {
    filtered = filtered.filter(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        return invoice.items.some((item: any) => item.category === activeCategory)
      }
      return false
    })
  }

  if (activeDivision) {
    filtered = filtered.filter(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        return invoice.items.some((item: any) => item.item_division_uuid === activeDivision)
      }
      return false
    })
  }

  if (activeItemType) {
    filtered = filtered.filter(invoice => {
      if (invoice.items && Array.isArray(invoice.items)) {
        return invoice.items.some((item: any) => item.item_type_uuid === activeItemType)
      }
      return false
    })
  }

  return filtered
})

// Table columns configuration
const columns: TableColumn<any>[] = [
  {
    accessorKey: 'bill_date',
    header: 'Bill Date',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', formatBillDate(row.original.bill_date))
  },
  {
    accessorKey: 'number',
    header: ({ column }) => getHeader(column, 'Invoice Number'),
    enableSorting: true,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', { class: 'font-medium text-default' }, row.original.number || 'N/A')
  },
  {
    accessorKey: 'project_name',
    header: 'Project Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.project_name || 'N/A')
  },
  {
    accessorKey: 'vendor_name',
    header: 'Vendor Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.vendor_name || 'N/A')
  },
  {
    accessorKey: 'invoice_type',
    header: 'Invoice Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', getInvoiceTypeLabel(row.original.invoice_type))
  },
  {
    accessorKey: 'due_date',
    header: 'Due Date',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', formatDueDate(row.original.due_date))
  },
  {
    accessorKey: 'po_number',
    header: 'Order Number',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      // Show PO number for PO invoices, CO number for CO invoices
      const orderNumber = row.original.po_number || row.original.co_number || 'N/A';
      return h('div', orderNumber);
    }
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      // Use total_invoice_amount from financial_breakdown.totals as the single source of truth
      // Fall back to amount field only if total_invoice_amount is not available
      const fbTotal = row.original?.financial_breakdown?.totals?.total_invoice_amount;
      const rawAmount = row.original?.amount ?? null;
      const rawTotalInvoiceAmount = row.original?.total_invoice_amount ?? null;
      const amount = row.original.total_invoice_amount !== null && row.original.total_invoice_amount !== undefined
        ? row.original.total_invoice_amount
        : (row.original.amount ?? 0);
      const selectedNumber = Number(amount || 0);
      const rawAmountNum = Number(rawAmount || 0);
      const rawTotalNum = Number(rawTotalInvoiceAmount || 0);
      const fbTotalNum = Number(fbTotal || 0);
      const hasFactor10Mismatch =
        (rawAmountNum > 0 && (Math.abs(rawTotalNum * 10 - rawAmountNum) < 0.001 || Math.abs(rawAmountNum * 10 - rawTotalNum) < 0.001)) ||
        (fbTotalNum > 0 && (Math.abs(selectedNumber * 10 - fbTotalNum) < 0.001 || Math.abs(fbTotalNum * 10 - selectedNumber) < 0.001));
      if (hasFactor10Mismatch) {
        console.log('[VendorInvoicesList] Suspicious amount scaling in list row:', {
          uuid: row.original?.uuid || null,
          invoice_type: row.original?.invoice_type || null,
          amount: rawAmount,
          total_invoice_amount: rawTotalInvoiceAmount,
          fb_total_invoice_amount: fbTotal,
          displayed_amount_value: amount,
        });
      }
      const formattedAmount = formatCurrency(amount);
      return h('div', { class: 'text-right font-mono text-sm' }, formattedAmount);
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const originalStatus = String(row.original.status || 'Draft').trim();
      let rawStatus = originalStatus;
      // Show Draft status as Pending in the table
      if (rawStatus === 'Draft') {
        rawStatus = 'Pending';
      }
      const statusMap: Record<string, { label: string; class: string }> = {
        Draft: {
          label: 'Draft',
          class: 'bg-warning/10 text-warning border border-warning/20'
        },
        Pending: {
          label: 'Pending',
          class: 'bg-amber-100 text-amber-700 border border-amber-200'
        },
        Approved: {
          label: 'Approved',
          class: 'bg-success/10 text-success border border-success/20'
        },
        Paid: {
          label: 'Paid',
          class: 'bg-success text-white border border-success'
        },
        unpaid: {
          label: 'Unpaid',
          class: 'bg-red-100 text-red-700 border border-red-200'
        },
        partially_paid: {
          label: 'Partially Paid',
          class: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }
      };

      const normalizedStatusKey = rawStatus.toLowerCase() === 'paid'
        ? 'Paid'
        : rawStatus.toLowerCase() === 'approved'
          ? 'Approved'
          : rawStatus.toLowerCase() === 'pending'
            ? 'Pending'
            : rawStatus.toLowerCase() === 'draft'
              ? 'Draft'
              : rawStatus.toLowerCase();

      const { label, class: colorClass } = statusMap[normalizedStatusKey] ?? {
        label: originalStatus,
        class: 'bg-elevated text-default border border-default'
      };
      
      return h('span', { 
        class: `inline-flex items-center px-2 py-1 gap-1 rounded-md text-xs font-medium ${colorClass}` 
      }, label)
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }: { row: { original: any } }) => {
      const buttons = [];
      const editLocked = isInvoiceEditLocked(row.original)
      
      // View button
      buttons.push(
        h(UTooltip, { text: 'View Vendor Invoice Details' }, () => [
          h(UButton, {
            icon: 'i-heroicons-eye-solid',
            size: 'xs',
            variant: 'soft',
            color: 'neutral',
            class: 'hover:scale-105 transition-transform',
            onClick: () => previewInvoice(row.original)
          }, () => '')
        ])
      );
      
      // Edit button
      buttons.push(
        h(UTooltip, { text: 'Edit Vendor Invoice' }, () => [
          h(UButton, {
            icon: 'tdesign:edit-filled',
            size: 'xs',
            variant: 'soft',
            color: editLocked ? 'neutral' : 'secondary',
            class: 'hover:scale-105 transition-transform',
            disabled: editLocked,
            onClick: () => editInvoice(row.original)
          }, () => '')
        ])
      );
      
      // Delete button
      buttons.push(
        h(UTooltip, { text: 'Delete Vendor Invoice' }, () => [
          h(UButton, {
            icon: 'mingcute:delete-fill',
            size: 'xs',
            variant: 'soft',
            color: 'error',
            class: 'hover:scale-105 transition-transform',
            onClick: () => deleteInvoice(row.original)
          }, () => '')
        ])
      );
      
      return h('div', { class: 'flex justify-end space-x-2 items-center' }, buttons);
    }
  }
];

// Methods
const openCreateModal = () => {
  // Increment form key to force VendorInvoiceForm remount with fresh state
  formKey.value++
  
  invoiceForm.value = {
    corporation_uuid: corporationStore.selectedCorporation?.uuid || corporationStore.selectedCorporationId,
    bill_date: createDefaultBillDateRange(1).dateTo,
    due_date: null,
    number: null,
    invoice_type: '',
    vendor_uuid: null,
    credit_days: null,
    credit_days_id: null,
    purchase_order_uuid: null,
    po_co_uuid: null,
    change_order_uuid: null,
    po_number: '',
    co_number: '',
    holdback: null,
    project_uuid: null,
    amount: 0,
    line_items: [],
    attachments: [],
    advance_payment_cost_codes: [],
    removed_advance_payment_cost_codes: []
  }
  showFormModal.value = true
  isViewMode.value = false
  isEditingExistingInvoice.value = false
}

const loadInvoiceForModal = async (invoice: any, viewMode: boolean = false) => {
  if (!invoice?.uuid) {
    console.warn('[VIL] loadInvoiceForModal called without UUID', invoice)
    return
  }

  // Increment form key to force VendorInvoiceForm remount with fresh state
  formKey.value++
  
  // Reset form first
  invoiceForm.value = { attachments: [] }
  isViewMode.value = viewMode
  isEditingExistingInvoice.value = true
  showFormModal.value = true
  loadingEditInvoice.value = true
  
  try {
    const detailed = await vendorInvoicesStore.fetchVendorInvoice(invoice.uuid) as any
    if (!detailed) {
      return
    }

    // Prime edit-mode identity fields early so VendorInvoiceForm watchers treat this
    // as an existing invoice and do not clear dependent holdback/POCO values.
    const derivedPoCoUuid =
      detailed.po_co_uuid ||
      (detailed.purchase_order_uuid
        ? `PO:${detailed.purchase_order_uuid}`
        : (detailed.change_order_uuid ? `CO:${detailed.change_order_uuid}` : null))
    invoiceForm.value = {
      ...invoiceForm.value,
      uuid: detailed.uuid,
      status: detailed.status,
      invoice_type: detailed.invoice_type,
      holdback_invoice_uuid: detailed.holdback_invoice_uuid || null,
      purchase_order_uuid: detailed.purchase_order_uuid || null,
      change_order_uuid: detailed.change_order_uuid || null,
      po_co_uuid: derivedPoCoUuid,
      po_number: detailed.po_number || '',
      co_number: detailed.co_number || '',
    }
    await nextTick()

    // Set po_co_uuid based on purchase_order_uuid or change_order_uuid for POCOSelect component
    // This is needed when loading existing invoices with "Against Advance Payment" or "Against Holdback Amount" type
    if (detailed.invoice_type === 'AGAINST_ADVANCE_PAYMENT' || detailed.invoice_type === 'AGAINST_HOLDBACK_AMOUNT') {
      if (detailed.purchase_order_uuid) {
        detailed.po_co_uuid = `PO:${detailed.purchase_order_uuid}`
      } else if (detailed.change_order_uuid) {
        detailed.po_co_uuid = `CO:${detailed.change_order_uuid}`
      }
    }

    // Load fields in sequence to ensure dependencies are resolved correctly:
    // 1. Corporation (must be first - other fields depend on it)
    if (detailed.corporation_uuid) {
      invoiceForm.value = { ...invoiceForm.value, corporation_uuid: detailed.corporation_uuid }
      await nextTick()
      
      // Fetch data for the corporation (projects, vendors, etc.)
      await Promise.allSettled([
        vendorStore.fetchVendors(detailed.corporation_uuid),
        projectsStore.fetchProjectsMetadata(detailed.corporation_uuid),
        costCodeConfigurationsStore.fetchConfigurations(detailed.corporation_uuid, false, false),
        purchaseOrdersStore.fetchPurchaseOrders(detailed.corporation_uuid, false),
        changeOrdersStore.fetchChangeOrders(detailed.corporation_uuid, false),
      ])
      
      // Wait a bit for watchers to settle
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 2. Project (depends on corporation)
    if (detailed.project_uuid) {
      invoiceForm.value = { ...invoiceForm.value, project_uuid: detailed.project_uuid }
      await nextTick()
      
      // Ensure project resources are loaded
      if (detailed.corporation_uuid) {
        await purchaseOrderResourcesStore.ensureProjectResources({
          corporationUuid: detailed.corporation_uuid,
          projectUuid: detailed.project_uuid,
        })
      }
      
      // Wait for project watchers to fire
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 3. Invoice type (depends on project)
    if (detailed.invoice_type) {
      invoiceForm.value = { ...invoiceForm.value, invoice_type: detailed.invoice_type }
      await nextTick()
      // Wait for invoice type watchers to fire
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 4. Vendor (depends on corporation)
    if (detailed.vendor_uuid) {
      invoiceForm.value = { ...invoiceForm.value, vendor_uuid: detailed.vendor_uuid }
      await nextTick()
      // Wait for vendor watchers to fire
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // 5. Purchase order / Change order / PO/CO (depends on project, vendor, corporation)
    // Set purchase_order_uuid or change_order_uuid first
    if (detailed.purchase_order_uuid) {
      invoiceForm.value = { 
        ...invoiceForm.value, 
        purchase_order_uuid: detailed.purchase_order_uuid,
        po_number: detailed.po_number || ''
      }
      await nextTick()
    } else {
      // Explicitly set to null if not present
      invoiceForm.value = { ...invoiceForm.value, purchase_order_uuid: null }
    }
    if (detailed.change_order_uuid) {
      invoiceForm.value = { 
        ...invoiceForm.value, 
        change_order_uuid: detailed.change_order_uuid,
        co_number: detailed.co_number || ''
      }
      await nextTick()
    } else {
      // Explicitly set to null if not present
      invoiceForm.value = { ...invoiceForm.value, change_order_uuid: null }
    }
    // Set po_co_uuid for advance payment and holdback invoices
    // For holdback invoices, also fetch PO/CO details to get po_number/co_number
    if (detailed.po_co_uuid) {
      invoiceForm.value = { ...invoiceForm.value, po_co_uuid: detailed.po_co_uuid }
      await nextTick()
    } else if (detailed.invoice_type === 'AGAINST_ADVANCE_PAYMENT' || detailed.invoice_type === 'AGAINST_HOLDBACK_AMOUNT') {
      // For advance payment and holdback invoices, set po_co_uuid based on purchase_order_uuid or change_order_uuid
      if (detailed.purchase_order_uuid) {
        // Set po_number from detailed (which comes from API JOIN) or fetch if missing
        let poNumber = invoiceForm.value.po_number || detailed.po_number || ''
        if (!poNumber && detailed.invoice_type === 'AGAINST_HOLDBACK_AMOUNT') {
          try {
            const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${detailed.purchase_order_uuid}`)
            if (poResponse?.data?.po_number) {
              poNumber = poResponse.data.po_number
            }
          } catch (error) {
            console.warn('[VendorInvoicesList] Failed to fetch PO number for holdback invoice:', error)
          }
        }
        invoiceForm.value = { 
          ...invoiceForm.value, 
          po_co_uuid: `PO:${detailed.purchase_order_uuid}`,
          po_number: poNumber
        }
      } else if (detailed.change_order_uuid) {
        // Set co_number from detailed (which comes from API JOIN) or fetch if missing
        let coNumber = invoiceForm.value.co_number || detailed.co_number || ''
        if (!coNumber && detailed.invoice_type === 'AGAINST_HOLDBACK_AMOUNT') {
          try {
            const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${detailed.change_order_uuid}`)
            if (coResponse?.data?.co_number) {
              coNumber = coResponse.data.co_number
            }
          } catch (error) {
            console.warn('[VendorInvoicesList] Failed to fetch CO number for holdback invoice:', error)
          }
        }
        invoiceForm.value = { 
          ...invoiceForm.value, 
          po_co_uuid: `CO:${detailed.change_order_uuid}`,
          co_number: coNumber
        }
      }
      await nextTick()
    } else if (
      detailed.invoice_type === 'AGAINST_PO' ||
      detailed.invoice_type === 'AGAINST_CO'
    ) {
      // Saved Against PO/CO invoices often have purchase_order_uuid / change_order_uuid but not po_co_uuid.
      // Without `CO:${uuid}` / `PO:${uuid}`, POCOSelect does not show the selection or CO/PO numbers.
      if (detailed.purchase_order_uuid) {
        let poNumber = invoiceForm.value.po_number || detailed.po_number || ''
        if (!poNumber) {
          try {
            const poResponse = await $fetch<{ data: any }>(`/api/purchase-order-forms/${detailed.purchase_order_uuid}`)
            if (poResponse?.data?.po_number) {
              poNumber = poResponse.data.po_number
            }
          } catch (error) {
            console.warn('[VendorInvoicesList] Failed to fetch PO number for Against PO invoice:', error)
          }
        }
        invoiceForm.value = {
          ...invoiceForm.value,
          po_co_uuid: `PO:${detailed.purchase_order_uuid}`,
          po_number: poNumber,
        }
      } else if (detailed.change_order_uuid) {
        let coNumber = invoiceForm.value.co_number || detailed.co_number || ''
        if (!coNumber) {
          try {
            const coResponse = await $fetch<{ data: any }>(`/api/change-orders/${detailed.change_order_uuid}`)
            if (coResponse?.data?.co_number) {
              coNumber = coResponse.data.co_number
            }
          } catch (error) {
            console.warn('[VendorInvoicesList] Failed to fetch CO number for Against CO invoice:', error)
          }
        }
        invoiceForm.value = {
          ...invoiceForm.value,
          po_co_uuid: `CO:${detailed.change_order_uuid}`,
          co_number: coNumber,
        }
      } else {
        invoiceForm.value = { ...invoiceForm.value, po_co_uuid: null }
      }
      await nextTick()
    } else {
      // Other invoice types: no PO/CO selection
      invoiceForm.value = { ...invoiceForm.value, po_co_uuid: null }
    }

    // 6. Now set all remaining fields at once (dates, amounts, etc.)
    // Ensure po_number and co_number are explicitly set for holdback invoices
    // IMPORTANT: Preserve po_co_uuid that was set earlier for holdback invoices
    const remainingFields = {
      bill_date: detailed.bill_date,
      due_date: detailed.due_date,
      number: detailed.number,
      credit_days: detailed.credit_days,
      holdback: detailed.holdback,
      amount: detailed.amount,
      line_items: detailed.line_items || [],
      attachments: detailed.attachments || [],
      advance_payment_cost_codes: detailed.advance_payment_cost_codes || [],
      removed_advance_payment_cost_codes: detailed.removed_advance_payment_cost_codes || [],
      holdback_invoice_uuid: detailed.holdback_invoice_uuid || null,
      holdback_cost_codes: detailed.holdback_cost_codes || [],
      holdback_coa_breakdown: detailed.holdback_coa_breakdown || [],
      po_invoice_items: detailed.po_invoice_items || [],
      co_invoice_items: detailed.co_invoice_items || [],
      po_lwm_invoice_items: detailed.po_lwm_invoice_items || [],
      co_lwm_invoice_items: detailed.co_lwm_invoice_items || [],
      financial_breakdown: detailed.financial_breakdown,
      uuid: detailed.uuid,
      status: detailed.status,
      // Explicitly include po_number and co_number from detailed (they come from API JOINs)
      // This ensures they're set for holdback invoices even if not in invoiceForm.value yet
      po_number: invoiceForm.value.po_number || detailed.po_number || '',
      co_number: invoiceForm.value.co_number || detailed.co_number || '',
      // IMPORTANT: Preserve po_co_uuid that was set earlier for holdback/advance payment invoices
      po_co_uuid: invoiceForm.value.po_co_uuid || detailed.po_co_uuid || null,
      // Include any other fields that might be needed
      ...Object.keys(detailed).reduce((acc: any, key: string) => {
        // Only include fields that haven't been set yet
        if (!['corporation_uuid', 'project_uuid', 'invoice_type', 'vendor_uuid', 
              'purchase_order_uuid', 'change_order_uuid', 'po_co_uuid', 'po_number', 'co_number',
              'holdback_invoice_uuid', 'holdback_cost_codes', 'holdback_coa_breakdown'].includes(key)) {
          acc[key] = detailed[key]
        }
        return acc
      }, {})
    }
    
    invoiceForm.value = { ...invoiceForm.value, ...remainingFields }
    applyVendorInvoiceCoaAssignmentsToForm(invoiceForm.value)
    await nextTick()
    
    // Wait a bit more for all watchers to settle
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.error("[VIL] Failed to fetch invoice details:", error);
  } finally {
    loadingEditInvoice.value = false;
  }
}

const editInvoice = async (invoice: any) => {
  if (isInvoiceEditLocked(invoice)) {
    const toast = useToast()
    toast.add({
      title: 'Edit restricted',
      description: 'Paid or partially paid invoices cannot be edited.',
      color: 'warning',
    })
    return
  }
  await loadInvoiceForModal(invoice, false)
}

const switchToEditMode = () => {
  isViewMode.value = false
}

const closeFormModal = () => {
  showFormModal.value = false
  isViewMode.value = false
  isEditingExistingInvoice.value = false
  nimbleUserApprovalDetailsCachedKey = ""
  nimbleBillVerifierType2.value = false
  nimbleBillApproverType3.value = false
  nimbleBillApprovalCheckLoading.value = false
  invoiceForm.value = {
    attachments: []
  }
  loadingEditInvoice.value = false
  totalInvoiceAmountError.value = null
  // Clear the current vendor invoice from the store when modal closes
  vendorInvoicesStore.clearCurrentVendorInvoice()
}

// Track the status before saving to keep buttons visible during save
const statusBeforeSave = ref<string | null>(null)

/** Set only for reject-to-draft saves so the API skips Nimble BillEntrySave */
const skipNimbleBillEntryForThisSave = ref(false)

// Status-based save handlers
// All status changes (Draft, Pending, Approved) go through the same validation flow
const submitWithStatus = async (
  status: 'Draft' | 'Pending' | 'Approved' | 'Paid',
  openNewForm = false,
  options?: { skipNimbleBillEntrySync?: boolean }
) => {
  // Only Approve actions should sync Nimble BillEntrySave.
  // Save/Update/Reject flows are local DB updates after books-lock validation.
  const shouldSyncNimbleForSubmit = status === 'Approved'
  const skipNimbleSyncForSubmit = !shouldSyncNimbleForSubmit

  if (savingInvoice.value) return

  // Validate credit days and due date before submission
  const creditDaysError = invoiceFormRef.value?.hasCreditDaysValidationError ?? false
  const dueDateError = invoiceFormRef.value?.hasDueDateValidationError ?? false
  const formValidationError = invoiceFormRef.value?.hasValidationError ?? false
  const formValidationMessage = invoiceFormRef.value?.overInvoicedValidationError || 'Please resolve invoice validation errors before saving'

  if (creditDaysError || dueDateError) {
    const toast = useToast()
    if (creditDaysError) {
      toast.add({
        title: 'Validation Error',
        description: 'Please select credit days for the invoice',
        color: 'error'
      })
    }
    if (dueDateError) {
      toast.add({
        title: 'Validation Error',
        description: 'Please select due date for the invoice',
        color: 'error'
      })
    }
    return
  }

  // Enforce form-level validations at submit time as a safety net.
  // This catches cases where button disabled state might not be in sync.
  if (formValidationError) {
    const toast = useToast()
    toast.add({
      title: 'Validation Error',
      description: formValidationMessage,
      color: 'error'
    })
    return
  }

  const invoiceTypeForCoaCheck = String(invoiceForm.value?.invoice_type || '').toUpperCase()

  const toNumberForCoa = (value: any): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    const parsed = parseFloat(String(value ?? '0'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  const hasPositiveCoaAmount = (value: any) => toNumberForCoa(value) > 0

  // Against Holdback Amount: charges are hidden in Configure COA; sales taxes still need a COA when amount > 0.
  // Enforce on every save (Draft / Pending / Approved), not only when syncing Nimble.
  if (invoiceTypeForCoaCheck === 'AGAINST_HOLDBACK_AMOUNT') {
    const fb = invoiceForm.value?.financial_breakdown
    const salesTaxes = fb?.sales_taxes && typeof fb.sales_taxes === 'object' ? fb.sales_taxes : {}
    const holdbackTaxCoaRows = [
      {
        key: 'sales_tax_1_account_uuid' as const,
        amount: salesTaxes?.sales_tax_1?.amount ?? invoiceForm.value?.sales_tax_1_amount,
        label: 'Sales Tax 1',
      },
      {
        key: 'sales_tax_2_account_uuid' as const,
        amount: salesTaxes?.sales_tax_2?.amount ?? invoiceForm.value?.sales_tax_2_amount,
        label: 'Sales Tax 2',
      },
    ]
    const missingHoldbackTaxCoa = holdbackTaxCoaRows
      .filter((row) => hasPositiveCoaAmount(row.amount) && !String(invoiceForm.value?.[row.key] || '').trim())
      .map((row) => row.label)
    if (missingHoldbackTaxCoa.length > 0) {
      const toast = useToast()
      toast.add({
        title: 'Validation Error',
        description: `Select a chart of account for ${missingHoldbackTaxCoa.join(' and ')} in Configure COA. Tax amounts are greater than zero.`,
        color: 'error',
      })
      return
    }
  }

  // Enforce COA selection when charges/taxes carry amounts.
  // Skip for reject-to-draft flow (skipNimbleBillEntrySync=true).
  // Skip for holdback invoices: validated above (tax only); stale PO/CO charge amounts on the form
  // must not force Configure COA for charge lines that are not shown.
  if (!skipNimbleSyncForSubmit && invoiceTypeForCoaCheck !== 'AGAINST_HOLDBACK_AMOUNT') {
    const fb = invoiceForm.value?.financial_breakdown
    const charges = fb?.charges && typeof fb.charges === 'object' ? fb.charges : {}
    const salesTaxes = fb?.sales_taxes && typeof fb.sales_taxes === 'object' ? fb.sales_taxes : {}

    const requiredCoaFields = [
      {
        key: 'freight_charges_account_uuid',
        amount: charges?.freight?.amount ?? invoiceForm.value?.freight_charges_amount,
        label: 'Freight Charges',
      },
      {
        key: 'packing_charges_account_uuid',
        amount: charges?.packing?.amount ?? invoiceForm.value?.packing_charges_amount,
        label: 'Packing Charges',
      },
      {
        key: 'custom_duties_charges_account_uuid',
        amount: charges?.custom_duties?.amount ?? invoiceForm.value?.custom_duties_charges_amount,
        label: 'Custom Duties Charges',
      },
      {
        key: 'other_charges_account_uuid',
        amount: charges?.other?.amount ?? invoiceForm.value?.other_charges_amount,
        label: 'Other Charges',
      },
      {
        key: 'sales_tax_1_account_uuid',
        amount: salesTaxes?.sales_tax_1?.amount ?? invoiceForm.value?.sales_tax_1_amount,
        label: 'Sales Tax 1',
      },
      {
        key: 'sales_tax_2_account_uuid',
        amount: salesTaxes?.sales_tax_2?.amount ?? invoiceForm.value?.sales_tax_2_amount,
        label: 'Sales Tax 2',
      },
    ]

    const missing = requiredCoaFields
      .filter((row) => hasPositiveCoaAmount(row.amount) && !String(invoiceForm.value?.[row.key] || '').trim())
      .map((row) => row.label)

    if (missing.length > 0) {
      const toast = useToast()
      toast.add({
        title: 'Validation Error',
        description: `Please select COA for: ${missing.join(', ')}`,
        color: 'error',
      })
      return
    }
  }

  // Store the status before changing it (to keep buttons visible during save)
  statusBeforeSave.value = invoiceForm.value?.status || null
  invoiceForm.value.status = status

  // Vendor invoice actions should not trigger Nimble BillEntrySave from this flow.
  // API still performs books-lock checks and blocks when locked.
  skipNimbleBillEntryForThisSave.value = skipNimbleSyncForSubmit
  try {
    const saved = await saveInvoice()
    if (saved) {
      if (openNewForm) {
        openCreateModal()
      } else {
        closeFormModal()
      }
    }
  } finally {
    skipNimbleBillEntryForThisSave.value = false
  }
  // Note: statusBeforeSave is cleared in saveInvoice's finally block
}

// Save handlers (for users without verify/approve/payment permissions)
const handleSaveAndNew = () => submitWithStatus('Draft', true)
const handleSaveAndClose = () => submitWithStatus('Draft', false)

// Verify handlers (for users with verify permission but not approve)
const handleVerifyAndNew = () => submitWithStatus('Pending', true)
const handleVerifyAndClose = () => submitWithStatus('Pending', false)

// Approve handlers (for users with approve permission)
const handleApproveAndNew = () => submitWithStatus('Approved', true)
const handleApproveAndClose = () => submitWithStatus('Approved', false)

// Legacy handlers for backward compatibility
const handleSaveAsDraft = () => {
  // For approved invoices, unapprove and save as draft (Reject — skip Nimble)
  const invoiceStatus = String(invoiceForm.value?.status || '').toLowerCase()
  if (invoiceForm.value?.uuid && invoiceStatus === 'approved') {
    return submitWithStatus('Draft', false, { skipNimbleBillEntrySync: true })
  }
  // For new invoices or draft invoices, save as draft
  return submitWithStatus('Draft', false)
}
const handleMarkPending = () => submitWithStatus('Pending', false)
const handleApprove = async () => {
  await submitWithStatus('Approved', false)
}
const handleRejectToDraft = () =>
  submitWithStatus('Draft', false, { skipNimbleBillEntrySync: true })
const handlePay = async () => {
  await submitWithStatus('Paid', false)
}

const saveInvoice = async (): Promise<boolean> => {
  const effectiveCorpId =
    invoiceForm.value.corporation_uuid ||
    corporationStore.selectedCorporation?.uuid ||
    corporationStore.selectedCorporationId
  if (!effectiveCorpId) {
    const toast = useToast();
    toast.add({ title: 'Error', description: 'Select a corporation first', color: 'error' })
    return false
  }
  
  // Validate Against PO invoice type - amount must be entered (allow zero values)
  const invoiceType = String(invoiceForm.value.invoice_type || '').toUpperCase()
  const isAgainstPO = invoiceType === 'AGAINST_PO'
  const amount = invoiceForm.value.amount ?? 0
  const amountValue = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0
  
  // Allow zero values (e.g., when Invoice Items Total equals Advance Payments deduction)
  // Only prevent null, undefined, or NaN values
  if (isAgainstPO && (amountValue === null || amountValue === undefined || isNaN(amountValue))) {
    totalInvoiceAmountError.value = 'Please enter the amount to be paid for the invoice'
    const toast = useToast();
    toast.add({ 
      title: 'Validation Error', 
      description: 'Please enter the amount to be paid for the invoice in Total Invoice Amount', 
      color: 'error' 
    })
    savingInvoice.value = false
    return false
  }
  
  // Clear error if validation passes
  totalInvoiceAmountError.value = null
  
  savingInvoice.value = true
  try {
    // Prepare form data for submission
    const formData = { ...invoiceForm.value };
    const toNumber = (value: any): number => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      const parsed = parseFloat(String(value ?? '0'))
      return Number.isFinite(parsed) ? parsed : 0
    }

    formData.corporation_uuid = effectiveCorpId
    
    // COA breakdown for Nimble BillEntrySave (Configure COA modal); added at save time from form component
    try {
      formData.coa_breakdown = invoiceFormRef.value?.getCoaBreakdownForSave?.() ?? []
    } catch (coaErr) {
      console.error('[VIL] getCoaBreakdownForSave failed', coaErr)
      const toast = useToast()
      toast.add({
        title: 'COA breakdown error',
        description: coaErr instanceof Error ? coaErr.message : String(coaErr),
        color: 'error',
      })
      return false
    }

    if (invoiceType === 'AGAINST_PO' || invoiceType === 'AGAINST_CO') {
      try {
        formData.holdback_coa_breakdown =
          (await invoiceFormRef.value?.buildHoldbackCoaBreakdownForSave?.()) ?? [];
      } catch (e) {
        console.warn('[VIL] buildHoldbackCoaBreakdownForSave failed', e);
        formData.holdback_coa_breakdown = [];
      }
    }

    if (skipNimbleBillEntryForThisSave.value) {
      (formData as Record<string, unknown>).skip_nimble_bill_entry_sync = true
    }

    // Ensure status is set (default to Draft if not set)
    if (!formData.status) {
      formData.status = 'Draft'
    }

    // For labor invoices, avoid overwriting FinancialBreakdown's final total.
    // Use financial_breakdown.totals.total_invoice_amount when present so
    // advance-payment and holdback deductions are preserved.
    const normalizedType = String(formData.invoice_type || '').toUpperCase()
    if (
      (normalizedType === 'AGAINST_PO' || normalizedType === 'AGAINST_CO' || normalizedType === 'AGAINST_ADVANCE_PAYMENT') &&
      Array.isArray(formData.labor_invoice_items) &&
      formData.labor_invoice_items.length > 0
    ) {
      const laborItemTotal = formData.labor_invoice_items.reduce((sum: number, item: any) => {
        return sum + toNumber(item?.invoice_amount)
      }, 0)

      if (!formData.financial_breakdown || typeof formData.financial_breakdown !== 'object') {
        formData.financial_breakdown = {}
      }
      if (!formData.financial_breakdown.totals || typeof formData.financial_breakdown.totals !== 'object') {
        formData.financial_breakdown.totals = {}
      }

      const totals = formData.financial_breakdown.totals || {}
      const chargesTotal = toNumber(totals.charges_total)
      const taxTotal = toNumber(totals.tax_total)
      const holdbackAmount = toNumber(totals.holdback_amount)
      const totalBeforeDeductions = laborItemTotal + chargesTotal + taxTotal
      const explicitAdvanceDeduction = toNumber(formData.advance_payment_deduction)
      const totalInvoiceAmountFromBreakdown = toNumber(
        totals.total_invoice_amount ?? totals.amount
      )
      const inferredAdvanceDeduction =
        explicitAdvanceDeduction > 0
          ? explicitAdvanceDeduction
          : totalInvoiceAmountFromBreakdown > 0
            ? Math.max(0, totalBeforeDeductions - totalInvoiceAmountFromBreakdown)
            : 0
      const computedTotal = Math.max(
        0,
        totalBeforeDeductions - inferredAdvanceDeduction - holdbackAmount
      )

      formData.financial_breakdown.totals.item_total = laborItemTotal
      const explicitFinalTotalRaw =
        totals.total_invoice_amount !== null &&
        totals.total_invoice_amount !== undefined &&
        totals.total_invoice_amount !== ''
          ? totals.total_invoice_amount
          : totals.amount
      const hasExplicitFinalTotal =
        explicitFinalTotalRaw !== null &&
        explicitFinalTotalRaw !== undefined &&
        explicitFinalTotalRaw !== ''
      const explicitFinalTotal = toNumber(explicitFinalTotalRaw)
      // If explicit total is 0 while computed total is positive, treat 0 as uninitialized
      // and keep computed total for first-save scenarios.
      if (hasExplicitFinalTotal && !(explicitFinalTotal === 0 && computedTotal > 0)) {
        formData.amount = explicitFinalTotal
      } else {
        formData.financial_breakdown.totals.total_invoice_amount = computedTotal
        formData.amount = computedTotal
      }
    }
    
    // Ensure amount matches financial_breakdown.totals.total_invoice_amount
    // This ensures consistency between what's displayed in FinancialBreakdown and what's saved
    if (formData.financial_breakdown && typeof formData.financial_breakdown === 'object') {
      const fb = formData.financial_breakdown;
      if (
        fb.totals &&
        (
          (fb.totals.total_invoice_amount !== null && fb.totals.total_invoice_amount !== undefined) ||
          (fb.totals.amount !== null && fb.totals.amount !== undefined)
        )
      ) {
        // Use total_invoice_amount as the single source of truth
        const totalValueRaw =
          fb.totals.total_invoice_amount !== null && fb.totals.total_invoice_amount !== undefined
            ? fb.totals.total_invoice_amount
            : fb.totals.amount;
        const amountValue = typeof totalValueRaw === 'number'
          ? totalValueRaw
          : (parseFloat(String(totalValueRaw)) || 0);
        formData.amount = amountValue;
        console.log('[VIL] Updated formData.amount from financial_breakdown.totals.total_invoice_amount:', amountValue);
      }
    }
    
    // If this is an AGAINST_PO invoice, ensure po_invoice_items is populated
    if (normalizedType === 'AGAINST_PO') {
      // Ensure po_invoice_items is set - it should be synced by the watcher
      // but we'll ensure it's present even if watcher hasn't fired
      if (!formData.po_invoice_items || !Array.isArray(formData.po_invoice_items)) {
        console.warn('[VIL] po_invoice_items not found in form data, setting empty array');
        formData.po_invoice_items = [];
      } else {
        console.log('[VIL] po_invoice_items found:', formData.po_invoice_items.length, 'items');
      }

      if (!formData.po_lwm_invoice_items || !Array.isArray(formData.po_lwm_invoice_items)) {
        formData.po_lwm_invoice_items = [];
      }

      if (formData.financial_breakdown && typeof formData.financial_breakdown === 'object') {
        const fb = formData.financial_breakdown;
        const itemTotal = parseFloat(fb.totals?.item_total || '0') || 0;
        const chargesTotal = parseFloat(fb.totals?.charges_total || '0') || 0;
        const taxTotal = parseFloat(fb.totals?.tax_total || '0') || 0;
        const totalBeforeDeduction = itemTotal + chargesTotal + taxTotal;
        const finalAmount = parseFloat(formData.amount || '0') || 0;
        const deductionAmount = Math.max(0, totalBeforeDeduction - finalAmount);
        
        if (deductionAmount > 0) {
          formData.advance_payment_deduction = deductionAmount;
          console.log('[VIL] Advance payment deduction:', deductionAmount, 'calculated from totals:', { itemTotal, chargesTotal, taxTotal, totalBeforeDeduction, finalAmount });
        }
      }

      // Log adjusted advance payment amounts for debugging
      console.log('[VIL] AGAINST_PO adjusted_advance_payment_amounts:', formData.adjusted_advance_payment_amounts);
      console.log('[VIL] AGAINST_PO adjusted_advance_payment_uuid:', formData.adjusted_advance_payment_uuid);
      console.log('[VIL] Full formData being sent:', JSON.stringify({
        adjusted_advance_payment_amounts: formData.adjusted_advance_payment_amounts,
        adjusted_advance_payment_uuid: formData.adjusted_advance_payment_uuid,
      }, null, 2));
    }

    // coa_breakdown is left as returned by getCoaBreakdownForSave(): it already applies cost/tax advances
    // and holdback consistently with Configure COA / Total amount breakdown. A previous step here deducted
    // adjusted_advance_payment_amounts again by GL, which double-counted advances vs the UI.

    // If this is an AGAINST_CO invoice, ensure co_invoice_items is populated
    if (normalizedType === 'AGAINST_CO') {
      if (!formData.co_invoice_items || !Array.isArray(formData.co_invoice_items)) {
        console.warn('[VIL] co_invoice_items not found in form data, setting empty array');
        formData.co_invoice_items = [];
      } else {
        console.log('[VIL] co_invoice_items found:', formData.co_invoice_items.length, 'items');
      }

      if (!formData.co_lwm_invoice_items || !Array.isArray(formData.co_lwm_invoice_items)) {
        formData.co_lwm_invoice_items = [];
      }
      
      // Log adjusted advance payment amounts for debugging
      console.log('[VIL] AGAINST_CO adjusted_advance_payment_amounts:', formData.adjusted_advance_payment_amounts);
      console.log('[VIL] AGAINST_CO adjusted_advance_payment_uuid:', formData.adjusted_advance_payment_uuid);

      // Ensure labor_invoice_items is set for labor COs
      if (!formData.labor_invoice_items || !Array.isArray(formData.labor_invoice_items)) {
        formData.labor_invoice_items = [];
      } else {
        console.log('[VIL] labor_invoice_items found:', formData.labor_invoice_items.length, 'items');
      }
    }

    // If this is an AGAINST_PO invoice, ensure labor_invoice_items is populated for labor POs
    if (normalizedType === 'AGAINST_PO') {
      // Ensure labor_invoice_items is set for labor POs
      if (!formData.labor_invoice_items || !Array.isArray(formData.labor_invoice_items)) {
        formData.labor_invoice_items = [];
      } else {
        console.log('[VIL] labor_invoice_items found:', formData.labor_invoice_items.length, 'items');
      }
    }

    // If this is an AGAINST_ADVANCE_PAYMENT invoice, ensure advance_payment_cost_codes and removed_advance_payment_cost_codes are populated
    if (normalizedType === 'AGAINST_ADVANCE_PAYMENT') {
      // Ensure advance_payment_cost_codes is set
      if (!formData.advance_payment_cost_codes || !Array.isArray(formData.advance_payment_cost_codes)) {
        console.warn('[VIL] advance_payment_cost_codes not found in form data, setting empty array');
        formData.advance_payment_cost_codes = [];
      } else {
        console.log('[VIL] advance_payment_cost_codes found:', formData.advance_payment_cost_codes.length, 'items');
      }
      
      // Ensure removed_advance_payment_cost_codes is set (even if empty)
      if (!formData.removed_advance_payment_cost_codes || !Array.isArray(formData.removed_advance_payment_cost_codes)) {
        formData.removed_advance_payment_cost_codes = [];
      }
    }
    
    // If this is an AGAINST_HOLDBACK_AMOUNT invoice, ensure amount is set from financial_breakdown.totals.total_invoice_amount
    if (normalizedType === 'AGAINST_HOLDBACK_AMOUNT') {
      console.log('[VIL] AGAINST_HOLDBACK_AMOUNT: Starting amount calculation');
      console.log('[VIL] Current formData.amount:', formData.amount);
      console.log('[VIL] formData.financial_breakdown:', formData.financial_breakdown);
      
      if (formData.financial_breakdown && typeof formData.financial_breakdown === 'object') {
        console.log('[VIL] financial_breakdown is an object');
        console.log('[VIL] financial_breakdown.totals:', formData.financial_breakdown.totals);
        
        if (formData.financial_breakdown.totals) {
          const totals = formData.financial_breakdown.totals;
          console.log('[VIL] totals.total_invoice_amount:', totals.total_invoice_amount);
          console.log('[VIL] totals.item_total:', totals.item_total);
          console.log('[VIL] totals.charges_total:', totals.charges_total);
          console.log('[VIL] totals.tax_total:', totals.tax_total);
          
          // Calculate total from components if total_invoice_amount is not available
          const itemTotal = parseFloat(totals.item_total || '0') || 0;
          const chargesTotal = parseFloat(totals.charges_total || '0') || 0;
          const taxTotal = parseFloat(totals.tax_total || '0') || 0;
          const calculatedTotal = itemTotal + chargesTotal + taxTotal;
          console.log('[VIL] Calculated total from components:', calculatedTotal, '(item_total:', itemTotal, '+ charges_total:', chargesTotal, '+ tax_total:', taxTotal, ')');
          
          // Use total_invoice_amount as the single source of truth
          const totalInvoiceAmount = totals.total_invoice_amount ||
                                   (calculatedTotal > 0 ? calculatedTotal : null);
          
          console.log('[VIL] Selected totalInvoiceAmount:', totalInvoiceAmount);
          
          if (totalInvoiceAmount !== null && totalInvoiceAmount !== undefined && totalInvoiceAmount !== '') {
            const amountValue = typeof totalInvoiceAmount === 'number' 
              ? totalInvoiceAmount 
              : (parseFloat(String(totalInvoiceAmount)) || 0);
            
            console.log('[VIL] Parsed amountValue:', amountValue);
            console.log('[VIL] Previous formData.amount:', formData.amount);
            
            // Update the amount field to match the total_invoice_amount from financial breakdown
            formData.amount = amountValue;
            
            console.log('[VIL] Updated formData.amount:', formData.amount);
            console.log('[VIL] Final formData.financial_breakdown.totals:', formData.financial_breakdown.totals);
          } else {
            console.warn('[VIL] AGAINST_HOLDBACK_AMOUNT: totalInvoiceAmount is null/undefined/empty, cannot update amount');
            console.warn('[VIL] totals.total_invoice_amount:', totals.total_invoice_amount);
            console.warn('[VIL] calculatedTotal:', calculatedTotal);
          }
        } else {
          console.warn('[VIL] AGAINST_HOLDBACK_AMOUNT: financial_breakdown.totals is missing');
        }
      } else {
        console.warn('[VIL] AGAINST_HOLDBACK_AMOUNT: financial_breakdown is missing or not an object');
        console.warn('[VIL] formData.financial_breakdown type:', typeof formData.financial_breakdown);
        console.warn('[VIL] formData.financial_breakdown value:', formData.financial_breakdown);
      }
    }
    
    
    const saveOutcome = invoiceForm.value.uuid
      ? await vendorInvoicesStore.updateVendorInvoice({
          uuid: invoiceForm.value.uuid,
          ...formData,
        })
      : await vendorInvoicesStore.createVendorInvoice(formData)

    const savedInvoice = saveOutcome.invoice

    if (savedInvoice) {
      // Clear the store immediately after successful save operation
      // This ensures the store is cleared for all save operations: save as draft, approve, reject, pay
      vendorInvoicesStore.clearCurrentVendorInvoice()

      const toast = useToast()

      const num = savedInvoice?.number ? String(savedInvoice.number).trim() : ''
      const adjusted = !!saveOutcome.nimbleInvoiceNumberAdjusted && num
      toast.add({
        title: invoiceForm.value.uuid ? 'Updated' : 'Created',
        description: adjusted
          ? `Vendor invoice ${invoiceForm.value.uuid ? 'updated' : 'created'} successfully. Invoice number was set to ${num} for Nimble (previous number was already in use).`
          : `Vendor invoice ${invoiceForm.value.uuid ? 'updated' : 'created'} successfully`,
        color: 'success',
      })
      if (saveOutcome.nimbleBillEntryFailed) {
        const nimbleError = String(saveOutcome.nimbleBillEntryError || '').trim()
        toast.add({
          title: 'Nimble Sync Failed',
          description: nimbleError || 'Failed to create a bill entry in Nimble. Invoice was saved as Pending.',
          color: 'warning',
        })
      }

      const savedStatus = String((savedInvoice as any)?.status || "").trim()
      if (savedInvoice?.uuid && savedStatus) {
        startSingleInvoicePolling(savedInvoice.uuid, savedStatus)
      }

      return true
    } else {
      throw new Error(vendorInvoicesStore.error || 'Failed to save vendor invoice')
    }
  } catch (e) {
    console.error('Error saving vendor invoice:', e)
    const toast = useToast();
    const msg =
      (e instanceof Error ? e.message : String(e)) ||
      vendorInvoicesStore.error ||
      'Failed to save vendor invoice'
    toast.add({ 
      title: 'Error', 
      description: msg, 
      color: 'error' 
    })
    // Reset status if save failed (restore previous status)
    if (statusBeforeSave.value) {
      invoiceForm.value.status = statusBeforeSave.value
    }
    return false
  } finally {
    savingInvoice.value = false
    // Clear status tracking after save completes (success or error)
    statusBeforeSave.value = null
  }
}

const deleteInvoice = (invoice: any) => {
  invoiceToDelete.value = invoice
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!invoiceToDelete.value?.uuid) return

  deletingInvoice.value = true
  try {
    const success = await vendorInvoicesStore.deleteVendorInvoice(invoiceToDelete.value.uuid)
    
    if (success) {
      // Refetch the vendor invoices list to ensure the table is in sync
      const corpUuid = corporationStore.selectedCorporation?.uuid || corporationStore.selectedCorporationId
      if (corpUuid) {
        await vendorInvoicesStore.fetchVendorInvoices(corpUuid, true, buildApiListFilters())
      }
      
      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Vendor invoice deleted successfully",
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      
      showDeleteModal.value = false
      invoiceToDelete.value = null
    } else {
      throw new Error(vendorInvoicesStore.error || 'Failed to delete vendor invoice')
    }
  } catch (error) {
    console.error('Error deleting vendor invoice:', error)
    const toast = useToast();
    toast.add({
      title: "Error",
      description: vendorInvoicesStore.error || "Failed to delete vendor invoice",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    deletingInvoice.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  invoiceToDelete.value = null
}

const previewInvoice = async (invoice: any) => {
  await loadInvoiceForModal(invoice, true)
}

// Show Results button handler
const handleShowResults = async () => {
  appliedFilters.value = {
    corporation: filterCorporation.value,
    project: filterProject.value,
    vendor: filterVendor.value,
    location: filterLocation.value,
    status: filterStatus.value,
    invoiceType: filterInvoiceType.value,
    category: filterCategory.value,
    division: filterDivision.value,
    itemType: filterItemType.value,
    dateFrom: filterDateFrom.value,
    dateTo: filterDateTo.value,
  }
  
  const apiFilters = buildApiListFilters()

  const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value
  if (corporationUuid) {
    await vendorInvoicesStore.fetchVendorInvoices(corporationUuid, true, apiFilters)
  }
  
  // Fetch projects for the selected corporation if not already loaded
  if (appliedFilters.value.corporation) {
    await projectsStore.fetchProjectsMetadata(appliedFilters.value.corporation)
  }
}

// Apply drawer filters handler
const handleApplyDrawerFilters = () => {
  isFilterDrawerOpen.value = false
  handleShowResults()
}

// Clear drawer filters handler
const handleClearDrawerFilters = () => {
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterStatus.value = null
  filterInvoiceType.value = null
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined
}

// Clear Filters button handler
const handleClearFilters = () => {
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterStatus.value = null
  filterInvoiceType.value = null
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined

  appliedFilters.value = {
    corporation: preservedCorporationUuid,
    project: undefined,
    vendor: undefined,
    location: undefined,
    status: null,
    invoiceType: null,
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  }

  const corporationUuid = preservedCorporationUuid || selectedCorporationId.value
  if (corporationUuid) {
    vendorInvoicesStore.fetchVendorInvoices(corporationUuid)
  }
}

// Watchers to sync pagination with TanStack Table
watch(() => pagination.value.pageSize, (newSize) => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageSize(newSize);
  }
});

watch(globalFilter, () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0);
  }
});

// Watch for corporation filter changes to fetch projects
watch(() => filterCorporation.value, async (newCorpUuid, oldCorpUuid) => {
  // Clear project filter when corporation changes
  if (newCorpUuid !== oldCorpUuid && oldCorpUuid) {
    filterProject.value = undefined
  }
  
  // Fetch projects for the new corporation
  if (newCorpUuid) {
    await projectsStore.fetchProjectsMetadata(newCorpUuid)
  }
}, { immediate: false })

// Watch for corporation changes to fetch invoices (only when no filters are applied)
watch(
  () => corporationStore.selectedCorporation?.uuid,
  (uuid) => {
    // Only auto-fetch if no filters are applied
    if (uuid && process.client && !appliedFilters.value.corporation && !appliedFilters.value.project && !appliedFilters.value.vendor) {
      vendorInvoicesStore.fetchVendorInvoices(uuid, false, buildApiListFilters());
    }
  },
  { immediate: true }
);

// Watch for amount changes to clear error
watch(
  () => invoiceForm.value.amount,
  () => {
    if (totalInvoiceAmountError.value) {
      totalInvoiceAmountError.value = null
    }
  }
)

// Watch for modal closing via v-model (clicking outside or ESC key)
// This ensures the store is cleared even if the modal is closed without calling closeFormModal()
watch(showFormModal, (isOpen) => {
  if (!isOpen) {
    // Modal was closed - clear the store
    vendorInvoicesStore.clearCurrentVendorInvoice()
    isEditingExistingInvoice.value = false
    // Also reset local form state if not already reset
    if (invoiceForm.value?.uuid) {
      invoiceForm.value = {
        attachments: []
      }
      isViewMode.value = false
      loadingEditInvoice.value = false
      totalInvoiceAmountError.value = null
    }
  }
});

// Fetch locations when filter drawer opens
watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations()
  }
})

// Reset pagination when filters change
watch([filterCorporation, filterProject, filterVendor, filterLocation, filterStatus, filterInvoiceType, filterCategory, filterDivision, filterItemType, filterDateFrom, filterDateTo, appliedFilters], () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}, { deep: true })

// Initialize when component mounts
onMounted(async () => {
  if (process.client) {
    await corporationStore.ensureReady();
    
    // Initialize filterCorporation with selected corporation if not already set
    if (!filterCorporation.value && selectedCorporationId.value) {
      filterCorporation.value = selectedCorporationId.value
    }
    
    if (corporationStore.selectedCorporation?.uuid) {
      await vendorInvoicesStore.fetchVendorInvoices(
        corporationStore.selectedCorporation.uuid,
        true,
        buildApiListFilters(),
      );
    }

    if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
      locationsStore.fetchLocations().catch(() => {})
    }
  }
});

onBeforeUnmount(() => {
  if (nimbleBillPolicyRefreshDebounce) {
    clearTimeout(nimbleBillPolicyRefreshDebounce)
    nimbleBillPolicyRefreshDebounce = null
  }
  stopSingleInvoicePolling()
})

// Watch for changes in selectedCorporationId to update filter if not manually set
watch(selectedCorporationId, (newId) => {
  // Only update filter if it's not manually set by user
  if (!filterCorporation.value && newId) {
    filterCorporation.value = newId
  }
});

</script>

