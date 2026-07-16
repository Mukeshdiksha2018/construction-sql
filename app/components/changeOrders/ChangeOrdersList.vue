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
            Summary ({{ allCOStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(allCOStats.totalValue) }}
          </div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
      
      <!-- Draft Section -->
      <div
        @click="toggleStatusFilter('Draft')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Draft'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Pending ({{ draftStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(draftStats.totalValue) }}
          </div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
      
      <!-- For Approval Section -->
      <div
        @click="toggleStatusFilter('Ready')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Ready'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            To be approved ({{ readyStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(readyStats.totalValue) }}
          </div>
        </div>
      </div>
      
      <!-- Divider -->
      <div class="w-px bg-gray-200 dark:bg-gray-700"></div>
      
      <!-- Approved Section -->
      <div
        @click="toggleStatusFilter('Approved')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Approved'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Approved ({{ approvedStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(approvedStats.totalValue) }}
          </div>
        </div>
      </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Filter Button -->
        <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filter Change Orders" description="Apply filters to narrow down the change orders list.">
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
                  all-option-label="All"
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
                  :include-all-option="true"
                  all-option-label="All"
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
                  :include-all-option="true"
                  all-option-label="All"
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
                  :include-all-option="true"
                  all-option-label="All"
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
                  :include-all-option="true"
                  all-option-label="All"
                />
              </div>

              <!-- Date From (created / PurchaseOrdersList-style calendar) -->
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

        <!-- Add New Button -->
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          size="xs"
          @click="openCreateModal"
        >
          Add new CO
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
              all-option-label="All"
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

          <!-- Created date from -->
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

          <!-- Created date to -->
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

    <div v-if="loading && !loadingRowUuid && !changeOrders.length">
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
        </div>
        <p class="text-gray-500 text-lg">Loading change orders...</p>
      </div>
    </div>

    <div v-else-if="changeOrders.length && hasPermission('co_view') && isReady">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="filteredChangeOrders"
        :columns="columns"
        v-model:selected="selectedRows"
        v-model:global-filter="globalFilter"
        :selectable="true"
        class="max-h-[70vh] overflow-auto"
      />
    </div>

    <div v-else-if="!hasPermission('co_view')" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">Access Denied</p>
      <p class="text-gray-400 text-sm">You don't have permission to view change orders</p>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">No change orders found</p>
      <p class="text-gray-400 text-sm mb-6">Create your first change order to get started</p>
      <UButton 
        v-if="hasPermission('co_create')"
        icon="i-heroicons-plus" 
        @click="openCreateModal"
      >
        Add Change Order
      </UButton>
    </div>

    <div v-if="changeOrders.length && hasPermission('co_view') && shouldShowServerPagination" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
      <UPagination 
        :default-page="serverPaginationPage"
        :items-per-page="pagination.pageSize"
        :total="serverPaginationTotal"
        @update:page="handleServerPageChange"
      />
      <div class="text-sm text-gray-600">
        {{ serverPageInfo }}
      </div>
    </div>

    <!-- Create/Edit Change Order Modal -->
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

          <!-- Print / Send in center -->
          <div class="flex-1 flex justify-center min-w-0 gap-2 flex-wrap">
            <UPopover
              v-if="coForm.uuid"
              mode="hover"
              :open-delay="200"
              :close-delay="200"
              :content="{ align: 'center', side: 'bottom', sideOffset: 6 }"
            >
              <UButton
                color="neutral"
                variant="solid"
                icon="i-heroicons-cog-6-tooth"
                size="sm"
                :disabled="savingCoPrintOptions"
                aria-label="Print options"
              />
              <template #content>
                <div class="p-3 max-w-xs flex flex-col gap-3">
                  <UCheckbox
                    color="neutral"
                    :model-value="effectiveCoPrintApprovedByVendor"
                    :disabled="savingCoPrintOptions || isViewMode || !hasPermission('co_edit')"
                    label="Include Approved by vendor on print"
                    @update:model-value="onCoPrintApprovedByVendorChange"
                  />
                  <UCheckbox
                    color="neutral"
                    :model-value="effectiveCoPrintUseEntityName"
                    :disabled="savingCoPrintOptions || isViewMode || !hasPermission('co_edit')"
                    label="Use entity name on print"
                    @update:model-value="onCoPrintUseEntityNameChange"
                  />
                </div>
              </template>
            </UPopover>
            <UButton
              v-if="coForm.uuid"
              color="info"
              variant="solid"
              icon="i-heroicons-printer"
              size="sm"
              @click="handlePrintChangeOrder"
            >
              Print
            </UButton>
            <UButton
              v-if="coForm.uuid && hasPermission('co_view')"
              color="neutral"
              variant="solid"
              icon="i-lucide-send"
              size="sm"
              @click="openSendChangeOrderEmailModal"
            >
              Send
            </UButton>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <!-- View Audit Log Button -->
            <UButton
              v-if="coForm.uuid && hasPermission('co_view')"
              icon="i-heroicons-shield-check-solid"
              color="info"
              variant="outline"
              size="sm"
              @click="showAuditLogModal = true"
            >
              View Audit Log
            </UButton>
            <div class="flex items-center gap-2">
              <UButton
                v-if="isViewMode && hasPermission('co_edit') && coForm.status !== 'Approved'"
                type="button"
                color="primary"
                icon="tdesign:edit-filled"
                size="sm"
                @click="switchToEditMode"
              >
                Edit Change Order
              </UButton>

              <!-- Permission-based action buttons -->
              <!-- Save buttons (for users without verify/approve permissions) -->
              <template v-if="!isViewMode && showSaveButtons">
                <UButton
                  data-testid="btn-save-new"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-document-plus"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleSaveAndNew"
                >
                  Save & New
                </UButton>
                <UButton
                  data-testid="btn-save-close"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-check"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleSaveAndClose"
                >
                  Save & Close
                </UButton>
              </template>

              <!-- Verify buttons (for users with verify permission but not approve) -->
              <template v-else-if="!isViewMode && showVerifyButtons">
                <UButton
                  data-testid="btn-verify-new"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-document-check"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleVerifyAndNew"
                >
                  Verify & New
                </UButton>
                <UButton
                  data-testid="btn-verify-close"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-check-circle"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleVerifyAndClose"
                >
                  Verify & Close
                </UButton>
              </template>

              <!-- Approve buttons (for users with approve permission) -->
              <template v-else-if="!isViewMode && showApproveButtons">
                <UButton
                  data-testid="btn-approve-new"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-arrow-up-circle"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleApproveAndNew"
                >
                  Approve & New
                </UButton>
                <UButton
                  data-testid="btn-approve-close"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-check-circle"
                  size="sm"
                  :disabled="saving || !isCoFormValid"
                  :loading="saving"
                  @click="handleApproveAndClose"
                >
                  Approve & Close
                </UButton>
              </template>

              <UButton
                v-if="showApproverUpdateButton"
                data-testid="btn-update"
                color="primary"
                variant="solid"
                icon="i-heroicons-arrow-path"
                size="sm"
                :disabled="saving || !isCoFormValid"
                :loading="saving"
                @click="handleApproverUpdate"
              >
                Update
              </UButton>

              <UButton
                v-if="showApprovedReviseActions"
                type="button"
                data-testid="btn-save-draft"
                :color="saveDraftButtonColor"
                :variant="saveDraftButtonVariant"
                :icon="saveDraftButtonIcon"
                size="sm"
                :disabled="isReviseButtonDisabled"
                :loading="saving"
                @click="handleSaveAsDraft"
              >
                {{ saveDraftButtonLabel }}
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
        <ChangeOrderForm
          v-model:form="coForm"
          :loading="loadingDetail"
          :readonly="isViewMode || isReadOnlyStatus"
          :allow-revise="isApprovalLevelUser && !!coForm.uuid"
          @nimble-vendor-saved="closeFormModal"
        />
      </template>
    </UModal>

    <SendPreviewDocumentEmailModal
      v-model:open="showSendCoEmailModal"
      document-kind="change_order"
      :document-uuid="sendEmailCoUuid"
      :default-to-email="sendCoDefaultToEmail"
      :document-number="coForm?.co_number"
      :storage-attachments="sendCoStorageAttachments"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="'Delete Change Order'">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Delete Change Order</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
            </div>
          </div>

          <div v-if="coToDelete" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>CO Number:</strong> {{ coToDelete.co_number || 'N/A' }}<br>
              <strong>Created Date:</strong> {{ formatDate(coToDelete.created_date) }}<br>
              <strong>Type:</strong> {{ coToDelete.co_type || 'N/A' }}<br>
              <strong>Total Amount:</strong> {{ formatCurrency(coToDelete.total_co_amount || 0) }}<br>
              <strong>Status:</strong> {{ coToDelete.status || 'Draft' }}
            </p>
          </div>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this change order? This will permanently remove the change order and all associated data.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton color="error" @click="confirmDelete">
            Delete Change Order
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Audit Log Modal -->
    <UModal 
      v-model:open="showAuditLogModal" 
      title="Change Order Audit Log"
      :description="`View the complete audit trail for ${coForm.co_number || 'this change order'}`"
      size="2xl"
      :ui="{ body: 'p-6' }"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Audit Timeline -->
          <ChangeOrderAuditTimeline 
            :audit-log="coForm.audit_log || []"
            :change-order-uuid="coForm.uuid || ''"
            @logs-loaded="onAuditLogsLoaded"
            @error="onAuditLogError"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-sm text-gray-500">
            <span v-if="auditLogsCount > 0">{{ auditLogsCount }} audit entries</span>
            <span v-else>No audit entries</span>
          </div>
          <div class="flex gap-2">
            <UButton 
              color="neutral" 
              variant="soft" 
              @click="showAuditLogModal = false"
            >
              Close
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, resolveComponent, useTemplateRef, watch, onMounted, defineAsyncComponent } from 'vue'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { usePermissions } from '~/composables/usePermissions'
const ChangeOrderForm = defineAsyncComponent(() => import('./ChangeOrderForm.vue'))
import ChangeOrderAuditTimeline from '~/components/changeOrders/ChangeOrderAuditTimeline.vue'
import SendPreviewDocumentEmailModal from '~/components/shared/SendPreviewDocumentEmailModal.vue'
import { useCorporationStore } from '~/stores/corporations'
import { useVendorStore } from '~/stores/vendors'
import { useChangeOrderResourcesStore } from '~/stores/changeOrderResources'
import { useLaborChangeOrderItemsStore } from '~/stores/laborChangeOrderItems'
import { useChangeOrderPrint } from '~/composables/useChangeOrderPrint'
import { useShipViaStore } from '~/stores/freight'
import { useFreightStore } from '~/stores/freightGlobal'
import { useProjectAddressesStore } from '~/stores/projectAddresses'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import ItemDivisionSelect from '~/components/shared/ItemDivisionSelect.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import { useLocationsStore } from '~/stores/locations'
import { useAppSettingsStore } from '~/stores/corporationSettings'
import { useAuthStore } from '~/stores/auth'

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const UPopover = resolveComponent('UPopover')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { formatDate } = useDateFormat()
const { formatCurrency, formatCurrencyAbbreviated } = useCurrencyFormat()
const { hasPermission, isReady } = usePermissions()

const { pagination, paginationOptions, pageSizeOptions, updatePageSize, getPaginationProps, getPageInfo, shouldShowPagination } = useTableStandard()

const selectedRows = ref<any[]>([])
const globalFilter = ref('')
const selectedStatusFilter = ref<string | null>(null)
const isFilterDrawerOpen = ref(false)
const locationsStore = useLocationsStore()

const createDefaultCoListDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  const pad = (n: number) => String(n).padStart(2, "0")
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { dateFrom: ymd(start), dateTo: ymd(end) }
}

const defaultCoListDateRange = createDefaultCoListDateRange(60)

// Sorting state
const sorting = ref([])

// Filter state (temporary - not applied until Show Results is clicked)
// Initialize as undefined, will be set from TopBar selection in onMounted
const filterCorporation = ref<string | undefined>(undefined)
const filterProject = ref<string | undefined>(undefined)
const filterVendor = ref<string | undefined>(undefined)
const filterLocation = ref<string | undefined>(undefined)
const filterCategory = ref<string | undefined>(undefined)
const filterDivision = ref<string | undefined>(undefined)
const filterItemType = ref<string | undefined>(undefined)
const filterDateFrom = ref<string | undefined>(defaultCoListDateRange.dateFrom)
const filterDateTo = ref<string | undefined>(defaultCoListDateRange.dateTo)

const inlinePopoverFilterDateFromOpen = ref(false)
const inlinePopoverFilterDateToOpen = ref(false)
const drawerPopoverFilterDateFromOpen = ref(false)
const drawerPopoverFilterDateToOpen = ref(false)

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

const listCoDateFormatter = new DateFormatter("en-US", {
  dateStyle: "medium",
})

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

const filterDateToCalendarBound = computed(() => ymdStringToCalendarDate(filterDateTo.value) ?? undefined)
const filterDateFromCalendarBound = computed(() => ymdStringToCalendarDate(filterDateFrom.value) ?? undefined)

const filterDateFromDisplayText = computed(() => {
  const cd = filterDateFromCalendarValue.value
  if (!cd) return "Select date from"
  return listCoDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

const filterDateToDisplayText = computed(() => {
  const cd = filterDateToCalendarValue.value
  if (!cd) return "Select date to"
  return listCoDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

// Applied filters (set when "Show Results" is clicked; dates default to last 60 days like PO list)
const appliedFilters = ref({
  corporation: undefined as string | undefined,
  project: undefined as string | undefined,
  vendor: undefined as string | undefined,
  location: undefined as string | undefined,
  category: undefined as string | undefined,
  division: undefined as string | undefined,
  itemType: undefined as string | undefined,
  dateFrom: defaultCoListDateRange.dateFrom as string | undefined,
  dateTo: defaultCoListDateRange.dateTo as string | undefined,
})

type CoApiListFilters = {
  project_uuid?: string
  vendor_uuid?: string
  created_date_from?: string
  created_date_to?: string
}

function normalizeVendorFilterUuid(v: string | undefined | null): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  if (!s || s === "__ALL__") return undefined
  return s
}

/** API list filters (created_at in DB); summary uses live filters, status tiles use applied after Show. */
const buildCoApiListFilters = (): CoApiListFilters | undefined => {
  const useFilterInputs =
    selectedStatusFilter.value === null || selectedStatusFilter.value === undefined
  const project = useFilterInputs ? filterProject.value : appliedFilters.value.project
  const vendor = useFilterInputs
    ? normalizeVendorFilterUuid(filterVendor.value)
    : normalizeVendorFilterUuid(appliedFilters.value.vendor)
  const dateFrom = useFilterInputs ? filterDateFrom.value : appliedFilters.value.dateFrom
  const dateTo = useFilterInputs ? filterDateTo.value : appliedFilters.value.dateTo

  const f: CoApiListFilters = {}
  if (project) f.project_uuid = project
  if (vendor) f.vendor_uuid = vendor
  if (dateFrom) f.created_date_from = dateFrom
  if (dateTo) f.created_date_to = dateTo
  return Object.keys(f).length > 0 ? f : undefined
}

const showFormModal = ref(false)
const showSendCoEmailModal = ref(false)
const sendEmailCoUuid = ref<string | null>(null)
const vendorStore = useVendorStore()
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = Boolean(runtimeConfig.public.nimbleIntegrations)

watch(showSendCoEmailModal, (open) => {
  if (!open) sendEmailCoUuid.value = null
})

const sendCoDefaultToEmail = computed(() => {
  const vu = coForm.value?.vendor_uuid
  if (!vu) return ''
  const vendorsMaybe: any = (vendorStore as any).vendors
  const vendorsList: any[] = Array.isArray(vendorsMaybe)
    ? vendorsMaybe
    : Array.isArray(vendorsMaybe?.value)
      ? vendorsMaybe.value
      : []

  const v = vendorsList.find((x: any) => x.uuid === vu)
  const e = v?.vendor_email
  return typeof e === 'string' ? e.trim() : ''
})

/** Bucket PDFs saved on the CO (shown in send modal; server re-loads on send). */
const sendCoStorageAttachments = computed(() => {
  const raw = coForm.value?.attachments
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (att: { file_path?: string; uuid?: string; isUploaded?: boolean }) =>
      att &&
      typeof att.file_path === 'string' &&
      att.file_path.trim() !== '' &&
      (att.uuid || att.isUploaded),
  )
})

const saving = ref(false)
const loadingDetail = ref(false)
const loadingRowUuid = ref<string | null>(null)
const coForm = ref<any>({})
const appSettingsStore = useAppSettingsStore()
const authStore = useAuthStore()
const savingCoPrintOptions = ref(false)

/** Per-CO override for print; when null/undefined, corporation `po_print_approved_by_vendor` applies. */
const effectiveCoPrintApprovedByVendor = computed(() => {
  const v = coForm.value?.print_include_approved_by_vendor
  if (v === true || v === false) return v
  return appSettingsStore.poPrintApprovedByVendor
})

/** Per-CO override for print; when null/undefined, corporation `po_use_entity_name` applies. */
const effectiveCoPrintUseEntityName = computed(() => {
  const v = coForm.value?.print_use_entity_name
  if (v === true || v === false) return v
  return appSettingsStore.poUseEntityName
})

function buildUserAuditBody() {
  const user = authStore.user
  const preparedBy = String(coForm.value?.prepared_by || '').trim()
  return user
    ? {
        user_id: user.id || '',
        user_name:
          preparedBy ||
          user.user_metadata?.full_name ||
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email?.split('@')[0] ||
          'Unknown User',
        user_email: user.email || '',
        user_image_url:
          user.user_metadata?.avatar_url || user.user_metadata?.image_url || null,
      }
    : { user_id: '', user_name: '', user_email: '', user_image_url: null }
}

async function persistCoPrintOption(
  key: 'print_include_approved_by_vendor' | 'print_use_entity_name',
  value: boolean
) {
  if (!coForm.value?.uuid) return
  savingCoPrintOptions.value = true
  try {
    await $fetch('/api/change-orders', {
      method: 'PUT',
      body: {
        uuid: coForm.value.uuid,
        [key]: value,
        ...buildUserAuditBody(),
      },
    })
    coForm.value[key] = value
  } catch (e: unknown) {
    const toast = useToast()
    const msg =
      e && typeof e === 'object' && 'data' in e && (e as any).data?.statusMessage
        ? String((e as any).data.statusMessage)
        : e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Failed to update'
    toast.add({
      title: 'Could not save print option',
      description: msg,
      color: 'error',
    })
  } finally {
    savingCoPrintOptions.value = false
  }
}

async function onCoPrintApprovedByVendorChange(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return
  await persistCoPrintOption('print_include_approved_by_vendor', value)
}

async function onCoPrintUseEntityNameChange(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return
  await persistCoPrintOption('print_use_entity_name', value)
}

watch(showFormModal, async (open) => {
  if (open) {
    try {
      await appSettingsStore.fetchSettings()
    } catch {
      /* non-fatal */
    }
  }
})
const showDeleteModal = ref(false)
const coToDelete = ref<any>(null)
const showAuditLogModal = ref(false)
const auditLogsCount = ref(0)
const isViewMode = ref(false)
/** True when active vendor invoices reference this CO; hides Revise actions. Set in loadChangeOrderForModal. */
const coHasLinkedVendorInvoices = ref<boolean | null>(null)

const formModalTitle = computed(() => {
  if (isViewMode.value) return 'View Change Order'
  return coForm.value?.uuid ? 'Edit Change Order' : 'Change Order'
})

// Status display helpers for form modal
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    Draft: 'Drafting…',
    Ready: 'Ready for approval',
    Approved: 'Approved',
    Rejected: 'Change order rejected',
  };
  const status = coForm.value?.status || 'Draft';
  return map[status] || status;
});

const statusChipClass = computed(() => {
  const map: Record<string, string> = {
    Draft:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
    Ready:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    Approved:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    Rejected:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  };
  const status = coForm.value?.status || 'Draft';
  return map[status] || map.Draft;
});

// Permissions
const canEdit = computed(() => hasPermission('co_edit') || hasPermission('co_create'))
const canVerify = computed(() => hasPermission('co_verify'))
const canApprove = computed(() => hasPermission('co_approve'))

const isChangeOrderReviseEligibleStatus = (status?: string | null): boolean => {
  const normalized = String(status || '').trim()
  return (
    normalized === 'Draft'
    || normalized === 'Ready'
    || normalized === 'Approved'
    || normalized === 'Rejected'
  )
}

/** True for approval-level users (co_approve). */
const isApprovalLevelUser = computed(() => canApprove.value)

// Check if CO status should make the form read-only
const isReadOnlyStatus = computed(() => {
  if (coHasLinkedVendorInvoices.value === true) return true
  if (isApprovalLevelUser.value && coForm.value?.uuid) {
    const status = String(coForm.value?.status || '').trim()
    if (
      isChangeOrderReviseEligibleStatus(status)
      && status !== 'Draft'
      && status !== 'Partially_Received'
      && status !== 'Completed'
    ) {
      return false
    }
  }
  const status = String(coForm.value?.status || '').toLowerCase()
  return status === 'approved' || status === 'partially_received' || status === 'completed'
})

// Permission-based button visibility
// Show Save buttons (Save & New, Save & Close) when user has no verify and no approve permissions
const showSaveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (canVerify.value || canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show if status is already Approved (only approvers can modify approved COs)
  if (coForm.value.status === 'Approved') {
    return false
  }
  
  return true
})

// Show Verify buttons (Verify & New, Verify & Close) when user has verify permission but not approve
const showVerifyButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canVerify.value) return false
  if (canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show if status is already Approved
  if (coForm.value.status === 'Approved') {
    return false
  }
  
  return true
})

// Show Approve buttons (Approve & New, Approve & Close) when user has approve permission
const showApproveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show approve buttons when status is already Approved (approvers use Update + revision checkbox)
  if (coForm.value?.status === 'Approved') {
    return false
  }
  
  return true
})

// Revise button is replaced by the checkbox in ChangeOrderForm for approval-level users.
const showApprovedReviseActions = computed(() => false)

const isReviseButtonDisabled = computed(() => {
  if (saving.value) return true
  if (coHasLinkedVendorInvoices.value === true) return true
  if (coForm.value?.uuid && coHasLinkedVendorInvoices.value === null) return true
  return false
})

/** Update existing Ready/Approved/Rejected CO without changing workflow status. */
const showApproverUpdateButton = computed(() => {
  if (isViewMode.value) return false
  if (!isApprovalLevelUser.value) return false
  if (!coForm.value?.uuid) return false
  if (coHasLinkedVendorInvoices.value === true) return false
  if (coForm.value?.uuid && coHasLinkedVendorInvoices.value === null) return false
  const status = String(coForm.value?.status || '').trim()
  if (status === 'Partially_Received' || status === 'Completed') return false
  return isChangeOrderReviseEligibleStatus(status) && status !== 'Draft'
})

// Legacy computed properties for backward compatibility (if needed elsewhere)
const showApprovalButtons = computed(() => false) // Deprecated - use showApproveButtons instead
const showSaveDraftButton = computed(() => showApprovedReviseActions.value)
const showMarkReadyButton = computed(() => false) // Deprecated - use showVerifyButtons instead
const showAnySaveButtons = computed(() => showSaveButtons.value || showVerifyButtons.value || showApproveButtons.value)

const saveDraftButtonLabel = computed(() => {
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'Locked'
  }
  if (
    coForm.value?.uuid
    && isChangeOrderReviseEligibleStatus(coForm.value?.status)
  ) {
    return 'Revise'
  }
  return 'Save'
})

const saveDraftButtonIcon = computed(() => {
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'i-heroicons-lock-closed'
  }
  if (
    coForm.value?.uuid
    && isChangeOrderReviseEligibleStatus(coForm.value?.status)
  ) {
    return 'i-heroicons-arrow-uturn-left'
  }
  return 'i-heroicons-document'
})

const saveDraftButtonColor = computed(() => {
  const status = String(coForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'warning'
  }
  if (
    coForm.value?.uuid
    && isChangeOrderReviseEligibleStatus(coForm.value?.status)
  ) {
    return 'error'
  }
  return 'primary'
})

const saveDraftButtonVariant = computed((): 'solid' => {
  return 'solid'
})

const isSaveDraftButtonDisabled = computed(() => isReviseButtonDisabled.value)

// Required fields for Save, Verify, and Approve (incl. Approve & New / Approve & Close).
// requested_by and credit_days are optional — omit from this check.
const isCoFormValid = computed(() => {
  const form = coForm.value
  if (!form) return false
  if (!form.corporation_uuid || String(form.corporation_uuid).trim() === '') return false
  if (!form.project_uuid || String(form.project_uuid).trim() === '') return false
  if (!form.vendor_uuid || String(form.vendor_uuid).trim() === '') return false
  if (!form.created_date || String(form.created_date).trim() === '') return false
  if (!form.co_number || String(form.co_number).trim() === '') return false
  if (Boolean(form.is_revised) && String(form.revision_number || '').trim() === '') return false
  return true
})

// Use change orders store
import { useChangeOrdersStore } from '~/stores/changeOrders'
import {
  normalizePoCurrencyConversionFields,
  PO_CURRENCY_CONVERSION_DEFAULTS,
} from '~/utils/poCurrencyConversion'
const changeOrdersStore = useChangeOrdersStore()
const changeOrders = computed(() => changeOrdersStore.changeOrders)
const loading = computed(() => changeOrdersStore.loading)
// Store errors are shown via toast (watcher below), not full-page alert, so content is never replaced
const corporationStore = useCorporationStore()
const changeOrderResourcesStore = useChangeOrderResourcesStore()
const laborChangeOrderItemsStore = useLaborChangeOrderItemsStore()
const { openChangeOrderPrint } = useChangeOrderPrint()
const shipViaStore = useShipViaStore()
const freightStore = useFreightStore()
const projectAddressesStore = useProjectAddressesStore()
const table = useTemplateRef<any>('table')

const refreshFreightAndShipViaForNimble = async () => {
  if (!nimbleIntegrationsEnabled) return
  await Promise.allSettled([
    shipViaStore.fetchShipVia(true),
    freightStore.fetchFreight(true),
  ])
}

// Server-side pagination support
const serverPaginationInfo = computed(() => {
  if (!selectedCorporationId.value) return null
  return changeOrdersStore.getPaginationInfo(selectedCorporationId.value)
})

const serverPaginationTotal = computed(() => {
  return serverPaginationInfo.value?.totalRecords || filteredChangeOrders.value.length
})

const serverPaginationPage = computed(() => {
  if (!table.value?.tableApi) return 1
  return (table.value.tableApi.getState().pagination.pageIndex || 0) + 1
})

const shouldShowServerPagination = computed(() => {
  return serverPaginationTotal.value > 10
})

const serverPageInfo = computed(() => {
  const pageIndex = table.value?.tableApi?.getState().pagination.pageIndex || 0
  const pageSize = pagination.value.pageSize || 10
  const total = serverPaginationTotal.value
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  return `Showing ${start} to ${end} of ${total} change orders`
})

// Handle server-side pagination page changes
const handleServerPageChange = async (newPage: number) => {
  if (!table.value?.tableApi || !selectedCorporationId.value) return
  
  const pageIndex = newPage - 1
  table.value.tableApi.setPageIndex(pageIndex)
  
  // Calculate which API page we need based on the table's page size
  const tablePageSize = pagination.value.pageSize || 10
  const apiPageSize = 100 // API page size
  
  // Check if we need to load this page
  const paginationInfo = serverPaginationInfo.value
  if (paginationInfo && paginationInfo.hasMore) {
    // Check if we've already loaded enough data for this page
    let loadedCount = changeOrders.value.filter((c: any) => 
      String(c.corporation_uuid) === String(selectedCorporationId.value)
    ).length
    
    const neededCount = pageIndex * tablePageSize + tablePageSize
    if (neededCount > loadedCount) {
      // Load more pages until we have enough data
      let currentApiPage = Math.floor(loadedCount / apiPageSize) + 1
      while (neededCount > loadedCount && paginationInfo.hasMore && currentApiPage <= paginationInfo.totalPages) {
        await changeOrdersStore.fetchChangeOrders(
          selectedCorporationId.value,
          false,
          currentApiPage,
          apiPageSize,
          buildCoApiListFilters()
        )
        const newLoadedCount = changeOrders.value.filter((c: any) => 
          String(c.corporation_uuid) === String(selectedCorporationId.value)
        ).length
        if (newLoadedCount === loadedCount) break // No new data loaded
        loadedCount = newLoadedCount
        currentApiPage++
      }
    }
  }
}

// Watch for corporation changes and fetch change orders
watch(
  () => corporationStore.selectedCorporationId,
  async (newCorpId) => {
    if (newCorpId) {
      await changeOrdersStore.fetchChangeOrders(newCorpId, false, 1, 100, buildCoApiListFilters())
    }
  },
  { immediate: true }
)

const generateChangeOrderNumber = () => {
  // Do not override an existing number (e.g., during edit)
  const current = String(coForm.value?.co_number || '').trim()
  if (current) return
  let maxSeq = 0
  const re = /^CO-(\d+)$/i
  ;(changeOrders.value || []).forEach((co: any) => {
    const match = String(co?.co_number || '').match(re)
    if (match) {
      const seq = parseInt(match[1]!)
      if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq)
    }
  })
  // Generate in simple format: CO-1, CO-2, CO-3, etc. (no padding)
  const next = maxSeq + 1
  coForm.value.co_number = `CO-${next}`
}

// Computed
const selectedCorporationId = computed(() => corporationStore.selectedCorporationId)

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

// Ship via lookup
const shipViaNameByUuid = computed<Record<string, string>>(() => {
  const list = shipViaStore.getAllShipVia || []
  const map: Record<string, string> = {}
  list.forEach((sv: any) => { 
    if (sv?.uuid) {
      map[sv.uuid] = sv.ship_via || sv.uuid
    }
  })
  return map
})

// Address popover state - track which CO's popover is open
const shippingAddressPopoverOpen = ref<Record<string, boolean>>({})

// Status stats computed properties - filter by TopBar's corporation
const allCOStats = computed(() => {
  const filtered = changeOrders.value.filter((c: any) => 
    String(c.corporation_uuid) === String(selectedCorporationId.value)
  )
  return {
    count: filtered.length,
    totalValue: filtered.reduce((sum, c) => sum + (Number(c.total_co_amount) || 0), 0)
  }
})

const draftStats = computed(() => {
  const draftCOs = changeOrders.value.filter((c: any) => 
    (c.status || 'Draft') === 'Draft' && 
    String(c.corporation_uuid) === String(selectedCorporationId.value)
  )
  return {
    count: draftCOs.length,
    totalValue: draftCOs.reduce((sum, c) => sum + (Number(c.total_co_amount) || 0), 0)
  }
})

const readyStats = computed(() => {
  const readyCOs = changeOrders.value.filter((c: any) => 
    c.status === 'Ready' && 
    String(c.corporation_uuid) === String(selectedCorporationId.value)
  )
  return {
    count: readyCOs.length,
    totalValue: readyCOs.reduce((sum, c) => sum + (Number(c.total_co_amount) || 0), 0)
  }
})

const approvedStats = computed(() => {
  const approvedCOs = changeOrders.value.filter((c: any) => 
    c.status === 'Approved' && 
    String(c.corporation_uuid) === String(selectedCorporationId.value)
  )
  return {
    count: approvedCOs.length,
    totalValue: approvedCOs.reduce((sum, c) => sum + (Number(c.total_co_amount) || 0), 0)
  }
})

const rejectedStats = computed(() => {
  const rejectedCOs = changeOrders.value.filter((c: any) => 
    c.status === 'Rejected' && 
    String(c.corporation_uuid) === String(selectedCorporationId.value)
  )
  return {
    count: rejectedCOs.length,
    totalValue: rejectedCOs.reduce((sum, c) => sum + (Number(c.total_co_amount) || 0), 0)
  }
})

/** YYYY-MM-DD for client-side date filter (aligns with API created_date_from / created_date_to). */
function rowCoCreatedYmd(c: any): string | null {
  const raw = c?.created_date ?? c?.created_at ?? c?.co_date ?? c?.entry_date
  if (raw == null || raw === "") return null
  const s = String(raw)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]!
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const da = String(d.getDate()).padStart(2, "0")
    return `${y}-${mo}-${da}`
  } catch {
    return null
  }
}

const filteredChangeOrders = computed<any[]>(() => {
  let filtered = Array.isArray(changeOrders.value) ? [...changeOrders.value] : []

  if (selectedStatusFilter.value) {
    filtered = filtered.filter((c: any) => c.status === selectedStatusFilter.value)
  }

  const text = globalFilter.value.trim().toLowerCase()
  if (text) {
    filtered = filtered.filter((row: any) =>
      [row.co_number, row.status, row.project_name, row.vendor_name]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(text))
    )
  }

  const activeLocation = appliedFilters.value.location
  if (activeLocation) {
    filtered = filtered.filter((c: any) => {
      if (c.co_items && Array.isArray(c.co_items)) {
        return c.co_items.some((item: any) => item.location === activeLocation || item.location_uuid === activeLocation)
      }
      return false
    })
  }

  const activeDateFrom = appliedFilters.value.dateFrom
  const activeDateTo = appliedFilters.value.dateTo
  if (activeDateFrom) {
    filtered = filtered.filter((c: any) => {
      const ymd = rowCoCreatedYmd(c)
      return ymd != null && ymd >= activeDateFrom
    })
  }
  if (activeDateTo) {
    filtered = filtered.filter((c: any) => {
      const ymd = rowCoCreatedYmd(c)
      return ymd != null && ymd <= activeDateTo
    })
  }

  const activeCategory = appliedFilters.value.category
  if (activeCategory) {
    filtered = filtered.filter((c: any) => {
      if (c.co_items && Array.isArray(c.co_items)) {
        return c.co_items.some((item: any) => item.category === activeCategory)
      }
      return false
    })
  }

  const activeDivision = appliedFilters.value.division
  if (activeDivision) {
    filtered = filtered.filter((c: any) => {
      if (c.co_items && Array.isArray(c.co_items)) {
        return c.co_items.some((item: any) => item.item_division_uuid === activeDivision)
      }
      return false
    })
  }

  const activeItemType = appliedFilters.value.itemType
  if (activeItemType) {
    filtered = filtered.filter((c: any) => {
      if (c.co_items && Array.isArray(c.co_items)) {
        return c.co_items.some((item: any) => item.item_type_uuid === activeItemType)
      }
      return false
    })
  }

  return filtered
})

const columnPinning = ref({ left: [], right: ['actions'] })

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

// Status filter methods
const toggleStatusFilter = (status: string) => {
  if (selectedStatusFilter.value === status) {
    selectedStatusFilter.value = null
  } else {
    selectedStatusFilter.value = status
  }

  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}

const clearStatusFilter = () => {
  selectedStatusFilter.value = null

  const preservedCorporation = filterCorporation.value

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined

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
  }

  const corporationUuid = preservedCorporation || selectedCorporationId.value
  if (corporationUuid) {
    changeOrdersStore.fetchChangeOrders(corporationUuid, true, 1, 100)
  }

  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}

// Filter handlers
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
  }

  const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value
  if (corporationUuid) {
    await changeOrdersStore.fetchChangeOrders(
      corporationUuid,
      true,
      1,
      100,
      buildCoApiListFilters()
    )
  }

  // Clear table page when filters change
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}

const handleClearFilters = () => {
  // Always preserve corporation (filter + applied), same as Purchase Orders list.
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
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
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  }

  const corporationUuid = preservedCorporationUuid || selectedCorporationId.value
  if (corporationUuid) {
    changeOrdersStore.fetchChangeOrders(corporationUuid, true, 1, 100)
  }

  // Clear table page when filters are cleared
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}

// Drawer filter handlers
const handleApplyDrawerFilters = () => {
  isFilterDrawerOpen.value = false
  handleShowResults()
}

const handleClearDrawerFilters = () => {
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined
}

// Shipping address methods (must be defined before columns that reference them)
const loadShippingAddress = async (addressUuid: string, projectUuid?: string) => {
  if (!addressUuid) return
  
  // If we have project UUID, fetch all project addresses (they're cached by project)
  if (projectUuid) {
    const existingAddresses = projectAddressesStore.getAddresses(projectUuid)
    if (existingAddresses.length > 0) {
      // Check if the specific address is already loaded
      const address = existingAddresses.find(addr => addr.uuid === addressUuid)
      if (address) {
        return // Already loaded
      }
    }
    
    // Fetch all project addresses (will be cached in store)
    try {
      await projectAddressesStore.fetchAddresses(projectUuid)
    } catch (error) {
      console.error('Error fetching project addresses:', error)
    }
  }
}

const formatShippingAddress = (address: any) => {
  const parts = []
  if (address.address_line_1) parts.push(address.address_line_1)
  if (address.address_line_2) parts.push(address.address_line_2)
  const cityStateZip = [address.city, address.state, address.zip_code].filter(Boolean).join(', ')
  if (cityStateZip) parts.push(cityStateZip)
  if (address.country) parts.push(address.country)
  return parts.join('\n') || 'No address'
}

const renderShippingAddressPopover = (addressUuid: string, projectUuid?: string) => {
  let address: any = null
  
  // Try to find the address from project addresses if we have project UUID
  if (projectUuid) {
    const addresses = projectAddressesStore.getAddresses(projectUuid)
    address = addresses.find(addr => addr.uuid === addressUuid)
  }
  
  if (!address) {
    return h('div', { class: 'p-4 w-80' }, [
      h('div', { class: 'text-sm text-gray-500 dark:text-gray-400' }, 'Address not found')
    ])
  }
  
  return h('div', { class: 'p-4 w-80' }, [
    h('div', { class: 'text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3' }, 'Shipping Address'),
    h('div', { 
      class: 'mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0 last:mb-0'
    }, [
      // Header with icon and label
      h('div', { class: 'flex items-center gap-2 mb-2' }, [
        h(UIcon, { 
          name: 'i-heroicons-truck', 
          class: 'w-4 h-4 text-info' 
        }),
        h('div', { class: 'text-xs font-semibold text-info' }, 'Shipping Address')
      ]),
      // Address content
      h('div', { class: 'text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line mb-2' }, formatShippingAddress(address)),
      // Contact information
      ...(address.contact_person || address.phone || address.email ? [
        h('div', { class: 'space-y-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700' }, [
          ...(address.contact_person ? [
            h('div', { class: 'text-xs text-gray-500 dark:text-gray-500' }, `Contact: ${address.contact_person}`)
          ] : []),
          ...(address.phone ? [
            h('div', { class: 'text-xs text-gray-500 dark:text-gray-500' }, `Phone: ${address.phone}`)
          ] : []),
          ...(address.email ? [
            h('div', { class: 'text-xs text-gray-500 dark:text-gray-500' }, `Email: ${address.email}`)
          ] : [])
        ])
      ] : [])
    ])
  ])
}

const columns = computed<TableColumn<any>[]>(() => [
  {
    accessorKey: 'created_date',
    header: 'Created Date',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', formatDate(row.original.created_date))
  },
  {
    accessorKey: 'co_number',
    header: ({ column }) => getHeader(column, 'CO Number'),
    enableSorting: true,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', { class: 'font-medium text-default' }, row.original.co_number || 'N/A')
  },
  {
    accessorKey: 'project_name',
    header: 'Project Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.project_name || 'N/A')
  },
  {
    accessorKey: 'project_id',
    header: 'Project Number',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.project_id || 'N/A')
  },
  {
    accessorKey: 'vendor_name',
    header: 'Vendor Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.vendor_name || 'N/A')
  },
  {
    accessorKey: 'po_number',
    header: 'Original Order',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.po_number || 'N/A')
  },
  {
    accessorKey: 'ship_via_uuid',
    header: 'Shipped Via',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const uuid = row.original.ship_via_uuid
      const label = uuid ? (shipViaNameByUuid.value[uuid] || row.original.ship_via || 'N/A') : (row.original.ship_via || 'N/A')
      return h('div', label)
    }
  },
  {
    accessorKey: 'shipping_address_uuid',
    header: 'Shipped To',
    enableSorting: false,
    meta: { class: { th: 'text-center', td: 'text-center' } },
    cell: ({ row }: { row: { original: any } }) => {
      const coUuid = row.original.uuid
      const shippingAddressUuid = row.original.shipping_address_uuid
      const isOpen = shippingAddressPopoverOpen.value[coUuid] || false
      
      if (!shippingAddressUuid) {
        return h('div', { class: 'flex justify-center' }, 'N/A')
      }
      
      return h('div', { class: 'flex justify-center' }, [
        h(UPopover, {
          open: isOpen,
          'onUpdate:open': (value: boolean) => {
            shippingAddressPopoverOpen.value[coUuid] = value
            if (value && shippingAddressUuid) {
              // Lazy load shipping address when popover opens
              loadShippingAddress(shippingAddressUuid, row.original.project_uuid)
            }
          }
        }, {
          default: () => h(UButton, {
            icon: 'i-heroicons-map-pin',
            size: 'xs',
            variant: 'ghost',
            color: 'neutral',
            class: 'hover:scale-105 transition-transform'
          }),
          content: () => renderShippingAddressPopover(shippingAddressUuid, row.original.project_uuid)
        })
      ])
    }
  },
  {
    accessorKey: 'co_type',
    header: 'CO Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.co_type || 'N/A')
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const rawStatus = row.original.status || 'Draft'
      // Normalize status for case-insensitive matching (handle both Partially_Received and Partially_received)
      const normalizedStatus = String(rawStatus).toLowerCase()
      
      const statusMap: Record<string, { label: string; color: string }> = {
        draft: {
          label: 'Pending',
          color: 'warning'
        },
        ready: {
          label: 'To be approved',
          color: 'primary'
        },
        approved: {
          label: 'Approved',
          color: 'success'
        },
        rejected: {
          label: 'Change order rejected',
          color: 'error'
        },
        partially_received: {
          label: 'Partially Received',
          color: 'info'
        },
        completed: {
          label: 'Completed',
          color: 'success'
        }
      }
      
      const config = statusMap[normalizedStatus] ?? {
        label: rawStatus,
        color: 'neutral'
      }
      
      return h(UBadge, {
        color: config.color,
        variant: 'soft',
        size: 'sm'
      }, () => config.label)
    }
  },
  {
    accessorKey: 'total_co_amount',
    header: 'Total Amount',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      const amount = row.original.total_co_amount || 0
      return h('div', { class: 'text-right font-mono text-sm' }, formatCurrency(amount))
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }: { row: { original: any } }) => {
      const isRowLoading = loadingRowUuid.value === row.original.uuid
      const buttons: any[] = []
      
      if (isRowLoading) {
        buttons.push(
          h(UIcon, {
            name: 'i-heroicons-arrow-path',
            class: 'w-4 h-4 animate-spin text-primary'
          })
        )
      } else {
        // View button - show if user has view permission
        if (hasPermission('co_view')) {
          buttons.push(
            h(UTooltip, { text: 'View Change Order Details' }, () => [
              h(UButton, {
                icon: 'i-heroicons-eye-solid',
                size: 'xs',
                variant: 'soft',
                color: 'neutral',
                class: 'hover:scale-105 transition-transform',
                onClick: () => previewChangeOrder(row.original),
              }, () => '')
            ])
          )
        }
        
        // Edit button - show if user has edit permission
        if (hasPermission('co_edit')) {
          buttons.push(
            h(UTooltip, { text: 'Edit Change Order' }, () => [
              h(UButton, {
                icon: 'tdesign:edit-filled',
                size: 'xs',
                variant: 'soft',
                color: 'secondary',
                class: 'hover:scale-105 transition-transform',
                onClick: () => editChangeOrder(row.original),
              }, () => '')
            ])
          )
        }
        
        // Delete button - show if user has delete permission
        if (hasPermission('co_delete')) {
          buttons.push(
            h(UTooltip, { text: 'Delete Change Order' }, () => [
              h(UButton, {
                icon: 'mingcute:delete-fill',
                size: 'xs',
                variant: 'soft',
                color: 'error',
                class: 'hover:scale-105 transition-transform',
                onClick: () => deleteChangeOrder(row.original),
              }, () => '')
            ])
          )
        }
      }
      return h('div', { class: 'flex justify-end space-x-2 items-center' }, buttons)
    }
  }
])

const openCreateModal = async () => {
  // Clear previous CO resources before opening new form
  changeOrderResourcesStore.clear()
  await refreshFreightAndShipViaForNimble()

  coHasLinkedVendorInvoices.value = false
  isViewMode.value = false
  // Initialize form with corporation_uuid from form selector or fallback to TopBar's selected
  // This ensures the form starts with the correct corporation context
  coForm.value = {
    corporation_uuid: corporationStore.selectedCorporationId || '',
    co_number: '',
    created_date: new Date().toISOString(),
    status: 'Draft',
    co_type: '',
    credit_days: '',
    credit_days_id: null,
    ship_via: '',
    freight: '',
    shipping_instructions: '',
    quote_reference: '',
    estimated_delivery_date: '',
    requested_by: '',
    nimble_requested_by_user_id: null,
    reason: '',
    terms_and_conditions_uuid: null,
    special_instruction_uuid: null,
    item_total: 0,
    total_amount: 0,
    co_items: [],
    attachments: [],
    removed_co_items: [],
    is_revised: false,
    revision_number: '',
    revision_notes: '',
    revision_date: null,
    ...PO_CURRENCY_CONVERSION_DEFAULTS,
  }
  showFormModal.value = true
}

const loadChangeOrderForModal = async (co: any, viewMode: boolean = false) => {
  if (!co?.uuid) {
    console.warn('[COL] loadChangeOrderForModal called without UUID', co)
    return
  }

  // Clear previous CO resources before loading a different CO
  changeOrderResourcesStore.clear()
  await refreshFreightAndShipViaForNimble()

  coHasLinkedVendorInvoices.value = null

  // Set initial form data from row
  coForm.value = { ...co }
  isViewMode.value = viewMode
  
  // Open modal immediately
  showFormModal.value = true
  loadingDetail.value = true
  loadingRowUuid.value = co.uuid
  
  try {
    const detailed = await changeOrdersStore.fetchChangeOrder(co.uuid)
    if (!detailed) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description: "Failed to load change order details.",
        color: "error",
      });
      return;
    }

    coForm.value = {
      ...detailed,
      ...normalizePoCurrencyConversionFields(detailed as Record<string, unknown>),
      quote_reference: detailed.quote_reference || '',
      audit_log: Array.isArray(detailed.audit_log) ? detailed.audit_log : [],
    };

    try {
      const check = await $fetch<{ data: { hasVendorInvoices: boolean } }>(
        "/api/vendor-invoices/check-change-order",
        { query: { change_order_uuid: co.uuid } }
      );
      coHasLinkedVendorInvoices.value = !!check?.data?.hasVendorInvoices;
    } catch {
      coHasLinkedVendorInvoices.value = false;
    }
  } catch (error) {
    console.error("[COL] Failed to fetch change order details:", error);
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to load change order details.",
      color: "error",
    });
  } finally {
    loadingDetail.value = false
    loadingRowUuid.value = null
  }
}

const editChangeOrder = async (co: any) => {
  if (!hasPermission('co_edit')) {
    try {
      const toast = useToast();
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to edit change orders.",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    } catch (error) {
      console.error('Error showing toast:', error);
    }
    return;
  }
  await loadChangeOrderForModal(co, false)
}

const previewChangeOrder = async (co: any) => {
  if (!hasPermission('co_view')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to view change order details.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  
  await loadChangeOrderForModal(co, true)
}

const switchToEditMode = () => {
  if (!hasPermission('co_edit')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to edit change orders.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  isViewMode.value = false
}

const closeFormModal = () => {
  changeOrderResourcesStore.clear()
  if (nimbleIntegrationsEnabled) {
    shipViaStore.clearShipVia()
    freightStore.clearFreight()
  }
  showFormModal.value = false
  showAuditLogModal.value = false
  isViewMode.value = false
  coForm.value = {}
  coHasLinkedVendorInvoices.value = null
  loadingDetail.value = false
  loadingRowUuid.value = null
}

// Print handler
const handlePrintChangeOrder = () => {
  if (!coForm.value?.uuid) return
  if (!hasPermission('co_view')) {
    const toast = useToast()
    toast.add({
      title: 'Access Denied',
      description: "You don't have permission to view change orders.",
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
    return
  }
  openChangeOrderPrint(coForm.value.uuid)
}

const openSendChangeOrderEmailModal = () => {
  if (!coForm.value?.uuid) return
  if (!hasPermission('co_view')) {
    const toast = useToast()
    toast.add({
      title: 'Access Denied',
      description: "You don't have permission to view change orders.",
      color: 'error',
      icon: 'i-heroicons-x-circle',
    })
    return
  }
  const corp = coForm.value.corporation_uuid
  if (corp && coForm.value.vendor_uuid) {
    vendorStore.fetchVendors(String(corp)).catch(() => {})
  }
  sendEmailCoUuid.value = coForm.value.uuid
  showSendCoEmailModal.value = true
}

// Status transition methods
// When rejecting, this just changes the status to Draft without any validation
const submitWithStatus = async (
  status: 'Draft' | 'Ready' | 'Approved',
  openNewForm = false,
  skipModalClose = false,
  skipRevisionNumberValidation = false
) => {
  // Store original status to revert if validation fails
  const originalStatus = coForm.value.status
  coForm.value.status = status
  const success = await saveChangeOrder(!openNewForm, { skipRevisionNumberValidation })
  
  if (success) {
    // Only open new form if save was successful
    if (openNewForm) {
      openCreateModal()
    } else {
      // Close modal only for normal flows; keep it open when revising
      if (!skipModalClose) closeFormModal()
    }
  } else {
    // Revert status if validation failed
    coForm.value.status = originalStatus
  }
}

// Save handlers (for users without verify/approve permissions)
const handleSaveAndNew = () => submitWithStatus('Draft', true)
const handleSaveAndClose = () => submitWithStatus('Draft', false)

// Verify handlers (for users with verify permission but not approve)
const handleVerifyAndNew = () => submitWithStatus('Ready', true)
const handleVerifyAndClose = () => submitWithStatus('Ready', false)

// Approve handlers (for users with approve permission)
const handleApproveAndNew = () => submitWithStatus('Approved', true)
const handleApproveAndClose = () => submitWithStatus('Approved', false)

// Legacy handlers for backward compatibility (if needed elsewhere)
// When rejecting Approved status, just change status (no validation needed)
const handleSaveAsDraft = () => {
  if (saving.value) return
  if (isViewMode.value) {
    isViewMode.value = false
  }
  const currentStatus = String(coForm.value?.status || '').trim()
  const isRevising = isChangeOrderReviseEligibleStatus(currentStatus)
  if (isRevising) {
    coForm.value.is_revised = true
    coForm.value.revision_date = new Date().toISOString()
    void saveChangeOrder(true, { skipRevisionNumberValidation: true })
    return
  }
  submitWithStatus('Draft', false)
}

const handleApproverUpdate = () => {
  if (saving.value) return
  void saveChangeOrder(false)
}
const handleMarkReady = () => submitWithStatus('Ready', false)
const handleApprove = async () => {
  await submitWithStatus('Approved', false)
}

const handleApproveAndRaise = async () => {
  // Approve and potentially trigger additional workflow
  await submitWithStatus('Approved', false)
  // TODO: Add additional logic for "raise" action if needed
}

const saveChangeOrder = async (skipModalClose = false, options: { skipRevisionNumberValidation?: boolean } = {}) => {
  // Determine the correct corporation_uuid to use
  // For new COs: use coForm.value.corporation_uuid (from form selector) or fallback to TopBar's selected
  // For editing: use coForm.value.corporation_uuid (from form, which should match the loaded CO's corporation)
  // This ensures we save to the correct corporation, not the one selected in TopBar
  const corporationUuid = coForm.value.corporation_uuid || corporationStore.selectedCorporationId

  // Ensure saving state is reset if validation fails
  saving.value = false

  if (!corporationUuid) {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Corporation field is required. It is missing.', color: 'error' })
    return false
  }

  // Validate required fields (requested_by is optional — not validated here; same rules for all statuses)
  if (!coForm.value.project_uuid || String(coForm.value.project_uuid).trim() === '') {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Project name field is required. It is missing.', color: 'error' })
    return false
  }

  if (!coForm.value.vendor_uuid || String(coForm.value.vendor_uuid).trim() === '') {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Vendor field is required. It is missing.', color: 'error' })
    return false
  }

  if (!coForm.value.created_date || String(coForm.value.created_date).trim() === '') {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Created date field is required. It is missing.', color: 'error' })
    return false
  }

  if (!coForm.value.co_number || String(coForm.value.co_number).trim() === '') {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Change Order # field is required. It is missing. Please select a project to auto-generate.', color: 'error' })
    return false
  }

  // Enforce CO number uniqueness across all CO types (LABOR/MATERIAL).
  // This prevents duplicates like "PROJ-CO-1" split by type.
  const coNumberRaw = String(coForm.value.co_number || '').trim()
  const projectIdRaw = String(coForm.value.project_id || '').trim()
  const normalizedCoNumber =
    coNumberRaw && projectIdRaw && !coNumberRaw.startsWith(`${projectIdRaw}-`)
      ? `${projectIdRaw}-${coNumberRaw}`
      : coNumberRaw

  if (normalizedCoNumber) {
    const currentUuid = String(coForm.value.uuid || '').trim()
    const duplicate = (changeOrdersStore.changeOrders || []).find((co: any) => {
      const coUuid = String(co?.uuid || '').trim()
      const coNumber = String(co?.co_number || '').trim()
      const coCorp = String(co?.corporation_uuid || '').trim()
      return (
        coNumber.toLowerCase() === normalizedCoNumber.toLowerCase() &&
        coCorp === String(corporationUuid || '').trim() &&
        coUuid !== currentUuid &&
        co?.is_active !== false
      )
    })
    if (duplicate) {
      const toast = useToast()
      toast.add({
        title: 'Validation Error',
        description: 'Change Order # must be unique for this corporation, regardless of CO type.',
        color: 'error',
      })
      return false
    }
  }

  if (!options.skipRevisionNumberValidation && Boolean(coForm.value.is_revised) && String(coForm.value.revision_number || '').trim() === '') {
    const toast = useToast();
    toast.add({ title: 'Validation Error', description: 'The Revision Number field is required when revising a change order.', color: 'error' })
    return false
  }

  // All validations passed, set saving state
  saving.value = true
  try {
    const payload = { ...coForm.value }
    
    // Ensure corporation_uuid is set from form (prioritize form's value)
    payload.corporation_uuid = corporationUuid

    // Persist CO number with project prefix (as displayed in form) for new/edit saves.
    const payloadCoNumberRaw = String(payload.co_number || '').trim()
    const payloadProjectIdRaw = String(payload.project_id || '').trim()
    if (
      payloadCoNumberRaw &&
      payloadProjectIdRaw &&
      !payloadCoNumberRaw.startsWith(`${payloadProjectIdRaw}-`)
    ) {
      payload.co_number = `${payloadProjectIdRaw}-${payloadCoNumberRaw}`
    }
    
    // Ensure labor_co_items is always included for LABOR change orders
    if (payload.co_type === 'LABOR') {
      // Collect labor_co_items from both form and store (when editing)
      let laborItems: any[] = []

      // First, get items from form (these have any unsaved changes)
      const formItems = Array.isArray(coForm.value.labor_co_items) ? coForm.value.labor_co_items : []

      // Helper to normalize a labor item, preserving location/description/metadata
      const buildLaborItemPayload = (item: any) => {
        const meta = (item.metadata || {}) as any
        const locationUuid = item.location_uuid ?? meta.location_uuid ?? null
        const locationLabel = item.location_label ?? meta.location_label ?? null
        const description = item.description ?? meta.description ?? null

        return {
          cost_code_uuid: item.cost_code_uuid,
          cost_code_number: item.cost_code_number,
          cost_code_name: item.cost_code_name,
          cost_code_label: item.cost_code_label,
          division_name: item.division_name,
          po_amount: item.po_amount,
          co_amount: item.co_amount,
          order_index: item.order_index,
          uuid: item.uuid,
          location_uuid: locationUuid,
          location_label: locationLabel,
          description,
          metadata: {
            ...meta,
            ...(locationUuid && { location_uuid: locationUuid }),
            ...(locationLabel && { location_label: locationLabel }),
            ...(description && { description }),
          },
        }
      }

      // If editing existing CO, also check store for saved items
      if (payload.uuid) {
        const savedItems = laborChangeOrderItemsStore.getItemsByChangeOrder(String(payload.uuid))

        // Create a map starting with saved items (they have the actual saved values)
        const itemsMap = new Map<string, any>()
        savedItems.forEach((item: any) => {
          const code = String(item?.cost_code_uuid || '')
          const loc = String(item?.location_uuid || item?.metadata?.location_uuid || '')
          const key = code ? `${code}::${loc}` : ''
          if (key) {
            itemsMap.set(key, buildLaborItemPayload(item))
          }
        })

        // Override with form items if they exist (for unsaved changes)
        formItems.forEach((item: any) => {
          const code = String(item?.cost_code_uuid || '')
          const loc = String(item?.location_uuid || item?.metadata?.location_uuid || '')
          const key = code ? `${code}::${loc}` : ''
          if (key) {
            itemsMap.set(key, buildLaborItemPayload(item))
          }
        })

        laborItems = Array.from(itemsMap.values())
      } else {
        // For new CO, just use form items
        laborItems = formItems.map((item: any) => buildLaborItemPayload(item))
      }

      // Always set labor_co_items in payload (even if empty array)
      // This ensures the API knows to update/preserve labor items
      payload.labor_co_items = laborItems
    }
    
    let result = null
    if (payload.uuid) {
      result = await changeOrdersStore.updateChangeOrder(payload)
    } else {
      result = await changeOrdersStore.createChangeOrder(payload)
    }
    
    if (result) {
      // The store handles adding/updating the item in the array if it matches TopBar's corporation
      // and marks the data as stale by deleting from hasDataForCorporation.
      // Fetch change orders for TopBar's corporation (without forceRefresh) so it:
      // 1. Checks if data is stale (it will be, since we marked it as stale)
      // 2. Loads from IndexedDB first if available (for quick display)
      // 3. Then fetches from API to get fresh data
      // This matches the strategy used in PurchaseOrdersList
      if (selectedCorporationId.value) {
        await changeOrdersStore.fetchChangeOrders(
          selectedCorporationId.value,
          true,
          1,
          100,
          buildCoApiListFilters()
        )
      }
      
      // Close modal after successful save (unless skipModalClose is true)
      if (!skipModalClose) {
        closeFormModal()
      }
      return true
    } else {
      const toast = useToast();
      const storeError = changeOrdersStore.error
      const description = getCleanMessage(storeError) || 'Failed to save change order'
      toast.add({ title: 'Error', description, color: 'error' })
      changeOrdersStore.error = null
      return false
    }
  } catch (error: any) {
    console.error('Error saving change order:', error)
    const toast = useToast();
    const errorDescription = getCleanMessage(
      error?.data?.statusMessage || error?.statusMessage || error?.message
    ) || 'Failed to save change order'
    toast.add({ title: 'Error', description: errorDescription, color: 'error' })
    changeOrdersStore.error = null
    return false
  } finally {
    saving.value = false
  }
}

const deleteChangeOrder = async (co: any) => {
  if (!hasPermission('co_delete')) {
    try {
      const toast = useToast();
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to delete change orders.",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    } catch (error) {
      console.error('Error showing toast:', error);
    }
    return;
  }

  if (!co?.uuid) {
    return;
  }

  try {
    const res = await $fetch<{ data: { hasVendorInvoices: boolean } }>(
      "/api/vendor-invoices/check-change-order",
      { query: { change_order_uuid: co.uuid } }
    );
    if (res?.data?.hasVendorInvoices) {
      const toast = useToast();
      toast.add({
        title: "Cannot delete",
        description:
          "This change order has vendor invoices linked to it. Remove or reassign those invoices before deleting.",
        color: "warning",
        icon: "i-heroicons-lock-closed",
      });
      return;
    }
  } catch (e: any) {
    const toast = useToast();
    const desc =
      e?.data?.statusMessage ||
      e?.data?.message ||
      e?.message ||
      "Could not verify vendor invoices for this change order.";
    toast.add({
      title: "Error",
      description: desc,
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  coToDelete.value = co
  showDeleteModal.value = true
}

// Helper function to clean error messages
const getCleanMessage = (msg: string | null | undefined): string => {
  if (!msg) return ''
  let clean = msg
  // Remove [METHOD] "URL": statusCode patterns like [POST] "/api/change-orders": 500
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

// Show store errors as toast so content is never replaced; clear store error after showing
watch(
  () => changeOrdersStore.error,
  (storeError) => {
    if (!storeError) return
    if (storeError.includes('delete') || storeError.includes('Cannot delete')) {
      changeOrdersStore.error = null
      return
    }
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: getCleanMessage(storeError) || 'Something went wrong. Please try again or contact support.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    })
    changeOrdersStore.error = null
  },
)

const confirmDelete = async () => {
  if (!hasPermission('co_delete')) {
    try {
      const toast = useToast();
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to delete change orders.",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    } catch (error) {
      console.error('Error showing toast:', error);
    }
    return;
  }

  if (!coToDelete.value) return

  try {
    const success = await changeOrdersStore.deleteChangeOrder(coToDelete.value.uuid)

    if (success) {
      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Change order deleted successfully",
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      showDeleteModal.value = false
      coToDelete.value = null
    } else {
      // If deleteChangeOrder returns false, check the error from the store
      const storeError = changeOrdersStore.error || 'Failed to delete change order'
      const toast = useToast();
      toast.add({
        title: "Error",
        description: getCleanMessage(storeError) || "Failed to delete change order",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      // Clear the store error after handling it so it doesn't affect the table display
      changeOrdersStore.error = null
    }
  } catch (error: any) {
    console.error('Error deleting change order:', error)
    // Clear the store error after handling it so it doesn't affect the table display
    changeOrdersStore.error = null
    
    const toast = useToast();
    let errorDescription = 'Failed to delete change order'
    
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
      icon: "i-heroicons-x-circle",
    });
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  coToDelete.value = null
}

// Audit log handlers
const onAuditLogsLoaded = (logs: any[]) => {
  auditLogsCount.value = logs.length
}

const onAuditLogError = (error: string) => {
  console.error('Audit log error:', error)
  const toast = useToast()
  toast.add({
    title: 'Error',
    description: error || 'Failed to load audit log',
    color: 'error',
    icon: 'i-heroicons-x-circle'
  })
}

// Load ship via data on mount
onMounted(async () => {
  try {
    await shipViaStore.fetchShipVia(nimbleIntegrationsEnabled)
    if (nimbleIntegrationsEnabled) {
      await freightStore.fetchFreight(true)
    }
  } catch (error) {
    console.error('Error fetching ship via/freight:', error)
  }

  // Initialize filterCorporation with selected corporation if not already set
  if (!filterCorporation.value && selectedCorporationId.value) {
    filterCorporation.value = selectedCorporationId.value
  }

  if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
    locationsStore.fetchLocations().catch(() => {})
  }
})

watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations()
  }
})

// Watch for changes in selectedCorporationId to update filter if not manually set
watch(selectedCorporationId, (newId) => {
  // Only update filter if it's not manually set by user
  if (!filterCorporation.value && newId) {
    filterCorporation.value = newId
  }
})

// Watch modal close to ensure cleanup happens regardless of how it's closed
// (ESC key, click outside modal, or clicking X button)
watch(showFormModal, (isOpen, wasOpen) => {
  // If modal just closed, ensure cleanup happens
  if (wasOpen && !isOpen) {
    changeOrderResourcesStore.clear()
    if (nimbleIntegrationsEnabled) {
      shipViaStore.clearShipVia()
      freightStore.clearFreight()
    }
    isViewMode.value = false
    coForm.value = {}
    loadingDetail.value = false
    loadingRowUuid.value = null
  }
})

/** Exposed for unit tests (e.g. requested_by / credit_days optional + isCoFormValid) */
defineExpose({
  isCoFormValid,
  saveChangeOrder,
  openCreateModal,
  closeFormModal,
})
</script>


