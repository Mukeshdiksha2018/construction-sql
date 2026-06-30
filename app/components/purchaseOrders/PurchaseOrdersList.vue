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
            Summary ({{ allPOStats.count }})
          </div>
          <div class="text-base font-bold text-gray-900 dark:text-white mt-1">
            {{ formatCurrency(allPOStats.totalValue) }}
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

      <!-- Pending Section (Approved + Partially_Received) -->
      <div
        @click="togglePendingStatusFilter()"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'Pending'
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

      <!-- To be Raised Section -->
      <div
        @click="toggleStatusFilter('ToBeRaised')"
        :class="[
          'flex-1 px-4 py-2 cursor-pointer transition-colors flex items-center justify-center',
          selectedStatusFilter === 'ToBeRaised'
            ? 'bg-gray-100 dark:bg-gray-700'
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        <div class="flex flex-col items-center text-center">
          <div class="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            <span>Create Purchase Order</span>
          </div>
        </div>
      </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Filter Button -->
        <UDrawer v-model:open="isFilterDrawerOpen" direction="top" inset title="Filter Purchase Orders" description="Apply filters to narrow down the purchase orders list.">
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
                  use-options-api
                />
              </div>

              <!-- Vendor -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                <VendorSelect
                  v-model="filterVendor"
                  :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
                  placeholder="Select Vendor"
                  size="sm"
                  class="w-full"
                  :disabled="!filterCorporation && !selectedCorporationId"
                  :include-all-option="true"
                  all-option-label="All"
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
                  clearable
                  class="w-full"
                  :ui="{ content: 'max-h-60 min-w-full w-max' }"
                />
              </div>

              <!-- Location -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Location</label>
                <LocationSelect
                  v-model="filterLocation"
                  :locations="projectScopedFilterLocations"
                  placeholder="All Locations"
                  size="sm"
                  class-name="w-full"
                  :disabled="!filterProject"
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

              <!-- Item Type -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Item Type</label>
                <ItemTypeSelect
                  v-model="filterItemType"
                  :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
                  :project-uuid="filterProject || undefined"
                  :category="filterCategory || undefined"
                  placeholder="All Types"
                  size="sm"
                  class-name="w-full"
                  :disabled="!filterCorporation"
                  variant="outline"
                  :include-all-option="true"
                  all-option-label="All"
                />
              </div>

              <!-- Date From (VendorInvoiceForm / VendorInvoicesList pattern) -->
              <div v-if="selectedStatusFilter !== 'ToBeRaised'" class="flex flex-col gap-1.5">
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
              <div v-if="selectedStatusFilter !== 'ToBeRaised'" class="flex flex-col gap-1.5">
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

        <!-- Add New Button - Hide when on "To be raised" screen -->
        <UButton
          v-if="selectedStatusFilter !== 'ToBeRaised'"
          icon="i-heroicons-plus"
          color="primary"
          size="xs"
          @click="openCreateModal"
        >
          Add new PO
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="isReady && !loading" class="mb-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex gap-4 items-end overflow-x-auto pb-1">
        <!-- Filters Grid -->
        <div 
          class="flex items-end gap-4 flex-nowrap min-w-max"
        >
          <!-- Project Filter -->
          <div class="flex flex-col gap-1.5 w-52 shrink-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Project</label>
            <ProjectSelect
              v-model="filterProject"
              :corporation-uuid="filterCorporation || undefined"
              placeholder="All Projects"
              size="sm"
              class="w-full"
              :disabled="!filterCorporation"
              :include-all-option="selectedStatusFilter !== 'ToBeRaised'"
              all-option-label="All Projects"
              use-options-api
            />
          </div>
          
          <!-- Vendor Filter (shown on all screens including "To be raised") -->
          <div class="flex flex-col gap-1.5 w-52 shrink-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Vendor</label>
            <VendorSelect
              v-model="filterVendor"
              :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
              placeholder="Select Vendor"
              size="sm"
              class="w-full"
              :disabled="!filterCorporation && !selectedCorporationId"
              :include-all-option="true"
              all-option-label="All"
            />
          </div>

          <!-- Location Filter -->
          <div class="flex flex-col gap-1.5 w-48 shrink-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Location</label>
            <LocationSelect
              v-model="filterLocation"
              :locations="projectScopedFilterLocations"
              placeholder="All Locations"
              size="sm"
              class-name="w-full"
              :disabled="!filterProject"
              :include-all-option="true"
              all-option-label="All"
            />
          </div>

          <!-- Category Filter - Only on Create Purchase Order (To Be Raised) -->
          <div
            v-if="selectedStatusFilter === 'ToBeRaised'"
            class="flex flex-col gap-1.5 w-52 shrink-0"
          >
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Category</label>
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

          <!-- Item Type Filter - Only on Create Purchase Order (To Be Raised) -->
          <div
            v-if="selectedStatusFilter === 'ToBeRaised'"
            class="flex flex-col gap-1.5 w-52 shrink-0"
          >
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Item Type</label>
            <ItemTypeSelect
              v-model="filterItemType"
              :corporation-uuid="filterCorporation || selectedCorporationId || undefined"
              :project-uuid="filterProject || undefined"
              :category="filterCategory || undefined"
              placeholder="All Types"
              size="sm"
              class-name="w-full"
              :disabled="!filterCorporation || !filterProject"
              variant="outline"
              :include-all-option="true"
              all-option-label="All"
            />
          </div>
          
          <!-- Status Filter - Hidden on "To be raised" screen -->
          <div v-if="selectedStatusFilter !== 'ToBeRaised'" class="flex flex-col gap-1.5 w-44 shrink-0">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</label>
            <USelect
              v-model="filterStatus"
              :items="statusOptions"
              placeholder="All Statuses"
              size="sm"
              variant="outline"
              clearable
              class="w-full"
              :ui="{ content: 'max-h-60 min-w-full w-max' }"
            />
          </div>

          <!-- PO entry date range -->
          <div v-if="selectedStatusFilter !== 'ToBeRaised'" class="flex flex-col gap-1.5 w-40 shrink-0">
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
          <div v-if="selectedStatusFilter !== 'ToBeRaised'" class="flex flex-col gap-1.5 w-40 shrink-0">
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
        
        <!-- Show and Clear Buttons - Side by side on "To be raised" screen, stacked otherwise -->
        <div 
          class="flex-shrink-0 flex gap-2 flex-row"
        >
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

    <!-- Error Banner - shown above table without hiding it -->
    <UBanner
      v-if="error && isReady"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      :title="error"
      close
      @close="handleErrorBannerClose"
      class="mb-4"
    />

    <!-- Loading skeleton - show when loading (hides table to prevent showing old data when switching corporations) -->
    <div v-if="loading && !loadingRowUuid">
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
        </div>
        <p class="text-gray-500 text-lg">Loading purchase orders...</p>
      </div>
    </div>

    <!-- To be Raised Table - Legacy fallback (only shows when main items table is not applicable) -->
    <!-- This is kept for backward compatibility but the main itemsTableData is the primary source -->
    <!-- Only show when ToBeRaised status filter is active AND main table is not showing -->
    <div v-if="selectedStatusFilter === 'ToBeRaised' && isReady && hasPermission('po_view') && !shouldShowItemsTable && !loadingItemsTable" class="mb-6">
      <!-- Loading state - show first and take precedence -->
      <div v-if="loadingToBeRaisedItems" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
        </div>
        <p class="text-gray-500 text-lg">Loading items...</p>
        <p class="text-gray-400 text-sm">Fetching items to be raised</p>
      </div>
      <!-- Message when filters are missing - only show when not loading -->
      <div v-else-if="!appliedFilters.corporation || !appliedFilters.project">
        <UCard variant="soft" class="mb-4">
          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <p class="text-sm text-amber-800 dark:text-amber-200">
                Please select <strong>Corporation</strong> and <strong>Project</strong> from the filters above and click "Show Results" to view items to be raised. Optionally pick a <strong>Vendor</strong> to narrow the list.
              </p>
            </div>
          </div>
        </UCard>
      </div>
      <!-- Table with data or empty state - only show when not loading and filters are set -->
      <div v-else-if="!loadingToBeRaisedItems">
        <!-- Table with data -->
        <UTable
          v-if="toBeRaisedItems.length > 0"
          :data="toBeRaisedItems"
          :columns="toBeRaisedColumns"
          :loading="false"
        />
        <!-- Empty state - only show when not loading and no data -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto" />
          </div>
          <p class="text-gray-500 text-lg">No left over quantity</p>
          <p class="text-gray-400 text-sm">No items found for the selected project and vendor</p>
        </div>
      </div>
    </div>

    <!-- Items Table - Show when ToBeRaised is selected and filters are applied -->
    <!-- Primary table: estimate lines with budget / PO / pending qty (includes fulfilled lines) -->
    <div v-if="shouldShowItemsTable" class="mb-6">
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-x-auto">
        <!-- Loading State -->
        <div v-if="loadingItemsTable" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto animate-spin" />
          </div>
          <p class="text-gray-500 text-lg">Loading items...</p>
          <p class="text-gray-400 text-sm">Fetching project items summary</p>
        </div>
        <!-- Message when filters are missing - only show when not loading -->
        <div v-else-if="!appliedFilters.corporation || !appliedFilters.project" class="text-center py-12">
          <UCard variant="soft" class="mb-4">
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <p class="text-sm text-amber-800 dark:text-amber-200">
                  Please select <strong>Corporation</strong> and <strong>Project</strong> from the filters above and click "Show" to view items to be raised.
                </p>
              </div>
            </div>
          </UCard>
        </div>
        <!-- Table with Data -->
        <UTable
          v-else-if="itemsTableData.length > 0"
          ref="itemsTable"
          sticky
          :data="itemsTableData"
          :columns="itemsTableColumns"
          :loading="false"
          v-model:selected="selectedItemsTableRows"
          :selectable="true"
          class="create-po-items-table w-full"
          :ui="{
            td: 'p-2 text-xs text-muted whitespace-normal break-words',
            th: 'px-2 py-2 text-xs font-semibold',
            tr: 'h-auto',
          }"
        />
        <!-- Empty state - only show when not loading, filters are set, and no data -->
        <div v-else-if="!loadingItemsTable && appliedFilters.corporation && appliedFilters.project" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto" />
          </div>
          <p class="text-gray-500 text-lg">No left over quantity</p>
          <p class="text-gray-400 text-sm">No estimate lines match the selected filters for this project</p>
        </div>
      </div>
    </div>

    <!-- Purchase Orders Table - Show when NOT on ToBeRaised screen -->
    <!-- On Summary screen: always show table with filters applied directly -->
    <!-- On other status screens: show table with status filter applied -->
    <!-- Only show when not loading (to prevent showing old data while loading new) -->
    <div v-else-if="selectedStatusFilter !== 'ToBeRaised' && purchaseOrders.length && hasPermission('po_view') && isReady && !loading">
      <UTable
        ref="table"
        sticky
        v-model:pagination="pagination"
        v-model:column-pinning="columnPinning"
        v-model:expanded="expanded"
        v-model:sorting="sorting"
        :pagination-options="paginationOptions"
        :data="filteredPurchaseOrders"
        :columns="columns"
        v-model:selected="selectedPurchaseOrders"
        :selectable="true"
        :watch-options="{ deep: false }"
      >
        <template #expanded="{ row }">
          <!-- Don't show breakdown for labor purchase orders -->
          <div v-if="String(row.original.po_type || '').toUpperCase() !== 'LABOR'">
            <POBreakdown :po-uuid="row.original.uuid" :po-data="row.original" />
          </div>
        </template>
      </UTable>
      
      <!-- Server-side Pagination -->
      <div v-if="shouldShowServerPagination" class="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
          :total="paginationTotal"
          @update:page="handleServerPageChange"
        />
        <div class="text-sm text-gray-600">
          {{ serverPageInfo }}
        </div>
      </div>
    </div>

    <div v-else-if="!hasPermission('po_view') && isReady && !loading && !loadingRowUuid" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-lock-closed" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg">Access Denied</p>
      <p class="text-gray-400 text-sm">You don't have permission to view purchase orders</p>
    </div>

    <div v-else-if="selectedStatusFilter !== 'ToBeRaised' && isReady && !loading && !loadingRowUuid && (selectedStatusFilter === null || !appliedFilters.corporation || !appliedFilters.project || itemsTableData.length === 0)" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-shopping-cart" class="w-12 h-12 mx-auto" />
      </div>
      <!-- On Summary screen: show message based on filter inputs -->
      <!-- On other screens: show message based on applied filters -->
      <p v-if="(selectedStatusFilter === null && (!filterCorporation || !filterProject)) || (selectedStatusFilter !== null && (!appliedFilters.corporation || !appliedFilters.project))" class="text-gray-500 text-lg">Please select Corporation and Project from the filters above to view purchase orders</p>
      <template v-else>
        <p class="text-gray-500 text-lg">No purchase orders found</p>
        <p class="text-gray-400 text-sm mb-6">No purchase orders match the selected filters</p>
      </template>
      <UButton 
        v-if="hasPermission('po_create') && ((selectedStatusFilter === null && (!filterCorporation || !filterProject)) || (selectedStatusFilter !== null && (!appliedFilters.corporation || !appliedFilters.project)))"
        icon="i-heroicons-plus" 
        @click="openCreateModal"
      >
        Add Purchase Order
      </UButton>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal" :title="'Delete Purchase Order'">
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Delete Purchase Order</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
            </div>
          </div>
          
          <div v-if="poToDelete" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>PO Number:</strong> {{ poToDelete.po_number || 'N/A' }}<br>
              <strong>Entry Date:</strong> {{ formatDate(poToDelete.entry_date) }}<br>
              <strong>Type:</strong> {{ poToDelete.po_type || 'N/A' }}<br>
              <strong>Total Amount:</strong> {{ formatCurrency(poToDelete.total_po_amount || 0) }}<br>
              <strong>Status:</strong> {{ poToDelete.status || 'Draft' }}
            </p>
          </div>
          
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this purchase order? This will permanently remove the purchase order and all associated data.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="soft" @click="cancelDelete">
            Cancel
          </UButton>
          <UButton color="error" @click="confirmDelete">
            Delete Purchase Order
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Create/Edit/View Purchase Order Modal -->
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

          <!-- Print options (hover) + Print in Center -->
          <div class="flex-1 flex justify-center min-w-0 gap-2 flex-wrap">
            <UPopover
              v-if="poForm.uuid"
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
                :disabled="savingPoPrintOptions"
                aria-label="Print options"
              />
              <template #content>
                <div class="p-3 max-w-xs flex flex-col gap-3">
                  <UCheckbox
                    color="neutral"
                    :model-value="effectivePoPrintApprovedByVendor"
                    :disabled="savingPoPrintOptions || isViewMode || !hasPermission('po_edit')"
                    label="Include Approved by vendor on print"
                    @update:model-value="onPoPrintApprovedByVendorChange"
                  />
                  <UCheckbox
                    color="neutral"
                    :model-value="effectivePoPrintUseEntityName"
                    :disabled="savingPoPrintOptions || isViewMode || !hasPermission('po_edit')"
                    label="Use entity name on print"
                    @update:model-value="onPoPrintUseEntityNameChange"
                  />
                </div>
              </template>
            </UPopover>
            <UButton
              v-if="poForm.uuid"
              color="info"
              variant="solid"
              icon="i-heroicons-printer"
              size="sm"
              @click="handlePrintPurchaseOrder"
            >
              Print
            </UButton>
            <UButton
              v-if="poForm.uuid && hasPermission('po_view')"
              color="neutral"
              variant="solid"
              icon="i-lucide-send"
              size="sm"
              @click="openSendPurchaseOrderEmailModal"
            >
              Send
            </UButton>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 min-w-0">
            <!-- View Audit Log Button -->
            <UButton
              v-if="poForm.uuid && hasPermission('po_view')"
              icon="i-heroicons-shield-check-solid"
              color="info"
              variant="outline"
              size="sm"
              @click="showAuditLogModal = true"
            >
              View Audit Log
            </UButton>
            <div class="flex items-center gap-2 flex-wrap">
              <UButton
                v-if="isViewMode && hasPermission('po_edit') && poForm.value?.status !== 'Approved'"
                type="button"
                color="primary"
                icon="tdesign:edit-filled"
                size="sm"
                @click="switchToEditMode"
              >
                Edit Purchase Order
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
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
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
                  @click="handleApproveAndClose"
                >
                  Approve & Close
                </UButton>
                <!-- Reject button (shown when PO status is Ready) -->
                <UButton
                  v-if="showReviseForReadyStatus"
                  data-testid="btn-reject-draft"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-arrow-uturn-left"
                  size="sm"
                  :disabled="savingPO || !isFormValid"
                  :loading="savingPO"
                  @click="handleRejectToDraft"
                >
                  Revise
                </UButton>
              </template>
              
              <!-- Reject button for Approved status (for users with approve permission) -->
              <template v-else-if="!isViewMode && showReviseForApprovedStatus">
                <UButton
                  data-testid="btn-reject-pending"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-no-symbol"
                  size="sm"
                  :disabled="isEstimateImportBlocked || savingPO || !isFormValid"
                  :loading="savingPO"
                  @click="handleRejectToPending"
                >
                  Reject
                </UButton>
                <UButton
                  data-testid="btn-save-draft"
                  :color="saveDraftButtonColor"
                  :variant="saveDraftButtonVariant"
                  :icon="saveDraftButtonIcon"
                  size="sm"
                  :disabled="isEstimateImportBlocked || isSaveDraftButtonDisabled || !isFormValid"
                  :loading="savingPO"
                  @click="handleSaveAsDraft"
                >
                  {{ saveDraftButtonLabel }}
                </UButton>
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
        <PurchaseOrderForm
          v-model:form="poForm"
          :editing-purchase-order="!!poForm.uuid"
          :loading="loadingEditPO"
          :readonly="isViewMode || isReadOnlyStatus"
          @estimate-import-blocked-change="isEstimateImportBlocked = $event"
          @validation-change="isFormValid = $event"
          @nimble-vendor-saved="closeFormModal"
        />
      </template>
    </UModal>

    <SendPreviewDocumentEmailModal
      v-model:open="showSendPoEmailModal"
      document-kind="purchase_order"
      :document-uuid="sendEmailPoUuid"
      :default-to-email="sendPoDefaultToEmail"
      :document-number="poForm?.po_number"
      :storage-attachments="sendPoStorageAttachments"
    />

    <!-- Audit Log Modal -->
    <UModal 
      v-model:open="showAuditLogModal" 
      title="Purchase Order Audit Log"
      :description="`View the complete audit trail for ${poForm.po_number || 'this purchase order'}`"
      size="2xl"
      :ui="{ body: 'p-6' }"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Audit Timeline -->
          <PurchaseOrderAuditTimeline 
            :audit-log="poForm.audit_log || []"
            :purchase-order-uuid="poForm.uuid || ''"
            @logs-loaded="onAuditLogsLoaded"
            @error="onAuditLogError"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">
            <span v-if="auditLogsCount > 0">{{ auditLogsCount }} audit entries</span>
            <span v-else>No audit entries</span>
          </div>
          <div class="flex gap-2">
            <UButton 
              color="neutral" 
              variant="solid" 
              @click="showAuditLogModal = false"
            >
              Close
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Exceeded Quantity Confirmation Modal -->
    <UModal v-model:open="showExceededQuantityModal" title="Items Exceeding Estimate">
      <template #header>
        <div class="flex items-center justify-between w-full gap-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Items Exceeding Estimate
          </h3>
          <UTooltip text="Close Modal" color="neutral">
            <UButton
              color="neutral"
              variant="solid"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="closeExceededQuantityModal"
            />
          </UTooltip>
        </div>
      </template>
      <template #body>
        <div class="p-6">
          <div class="flex items-center mb-4">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-warning-500 mr-3" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Some items have values that exceed the estimated values.
            </p>
          </div>

          <div v-if="exceededItems.length" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div class="space-y-2">
              <div
                v-for="(item, index) in exceededItems"
                :key="index"
                class="text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0"
              >
                <div class="font-medium">
                  <template v-if="item.item_type === 'labor' || item.item_type === 'lwm'">
                    {{ item.cost_code_label || item.cost_code_name || `Cost Code ${index + 1}` }}
                    <span v-if="item.location_label" class="text-xs text-muted font-normal">
                      ({{ item.location_label }})
                    </span>
                  </template>
                  <template v-else>
                    {{ item.name || item.description || `Item ${index + 1}` }}
                    <span class="text-xs text-muted font-normal">
                      ({{ item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim() || 'Unknown Cost Code' }})
                    </span>
                  </template>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1" v-if="item.item_type === 'labor' || item.item_type === 'lwm'">
                  Budgeted Amount: {{ formatCurrency(item.material_budgeted_amount || item.labor_budgeted_amount || item.estimate_amount || 0) }} |
                  PO Amount: {{ formatCurrency(item.po_amount || 0) }} |
                  Exceeded: <span class="font-semibold text-warning-600">{{ formatCurrency(item.exceeded_amount || 0) }}</span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1" v-else>
                  Estimate Qty: {{ item.estimate_quantity }} |
                  Already Used: {{ item.used_quantity || 0 }} |
                  PO Qty: {{ item.po_quantity }} |
                  Total: {{ item.total_quantity }} |
                  Exceeded: <span class="font-semibold text-warning-600">{{ item.exceeded_quantity }}</span>
                </div>
              </div>
            </div>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Would you like to:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
            <li><strong>Continue saving</strong> - Save the purchase order as is with exceeded values</li>
            <li><strong>Raise a change order</strong> - Create a change order for the exceeded values</li>
          </ul>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="warning" variant="solid" @click="handleContinueSavingPO">
            Save PO with exceeded values
          </UButton>
          <UButton color="primary" variant="solid" @click="handleRaiseChangeOrder">
            Create CO for exceeded values
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Change Order Form Modal (for exceeded quantities) -->
    
    <!-- Floating Action Button - Show when rows are selected -->
    <!-- Positioned outside all conditional divs to ensure it's always visible regardless of scrolling -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="selectedItemsTableRowsCount > 0"
        class="fixed bottom-6 right-6 z-[9999]"
        style="position: fixed !important; bottom: 1.5rem !important; right: 1.5rem !important;"
      >
        <UButton
          color="primary"
          size="lg"
          icon="i-heroicons-plus-circle"
          @click="handleRaisePurchaseOrderForPendingQty"
        >
          Create purchase order for pending QTY
        </UButton>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, nextTick, useTemplateRef, resolveComponent } from "vue";
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { useRouter } from 'vue-router'
import PurchaseOrderForm from '~/components/purchaseOrders/PurchaseOrderForm.vue'
import SendPreviewDocumentEmailModal from '~/components/shared/SendPreviewDocumentEmailModal.vue'
import PurchaseOrderAuditTimeline from '~/components/purchaseOrders/PurchaseOrderAuditTimeline.vue'
import { useCorporationStore } from '~/stores/corporations'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useTableStandard } from '~/composables/useTableStandard'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { usePermissions } from '~/composables/usePermissions'
import type { TableColumn } from '@nuxt/ui'
import type { Column } from '@tanstack/vue-table'
import { usePurchaseOrderResourcesStore } from '~/stores/purchaseOrderResources'
import { useChangeOrdersStore } from '~/stores/changeOrders'
import {
  normalizePoCurrencyConversionFields,
  PO_CURRENCY_CONVERSION_DEFAULTS,
} from '~/utils/poCurrencyConversion'
import { usePurchaseOrderPrint } from '~/composables/usePurchaseOrderPrint'
import { useProjectsStore } from '~/stores/projects'
import { useVendorStore } from '~/stores/vendors'
import { useShipViaStore } from '~/stores/freight'
import { useFreightStore } from '~/stores/freightGlobal'
import { useProjectAddressesStore } from '~/stores/projectAddresses'
import ProjectSelect from '~/components/shared/ProjectSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import StorageLocationSelect from '~/components/shared/StorageLocationSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import { getCategoryLabel } from '~/constants/itemCategories'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import { useLocationsStore } from '~/stores/locations'
import POBreakdown from '~/components/purchaseOrders/POBreakdown.vue'
import { usePurchaseOrderListResourcesStore } from '~/stores/purchaseOrderListResources'
import { useProjectItemsSummary } from '~/composables/useProjectItemsSummary'
import {
  lineItemsShareSingleEstimateVendor,
  transformCreatePoLineItems,
} from '~/utils/transformCreatePoLineItems'
import { normalizeUsedQuantitiesByItem } from '~/utils/normalizeUsedQuantitiesByItem'
import { useAppSettingsStore } from '~/stores/corporationSettings'
import { useAuthStore } from '~/stores/auth'

// Resolve components for table columns
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const UPopover = resolveComponent('UPopover')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// Router
const router = useRouter()

// Stores
const corporationStore = useCorporationStore()
const purchaseOrdersStore = usePurchaseOrdersStore()
const changeOrdersStore = useChangeOrdersStore()
const projectsStore = useProjectsStore()
const vendorStore = useVendorStore()
const shipViaStore = useShipViaStore()
const freightStore = useFreightStore()
const projectAddressesStore = useProjectAddressesStore()
const { formatDate } = useDateFormat()
const { formatCurrency, formatCurrencyAbbreviated } = useCurrencyFormat()
const { toUTCString, getCurrentLocal } = useUTCDateFormat()

const createDefaultEntryDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  const pad = (n: number) => String(n).padStart(2, "0")
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { dateFrom: ymd(start), dateTo: ymd(end) }
}

const defaultPoEntryDateRange = createDefaultEntryDateRange(60)

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

const listEntryDateFormatter = new DateFormatter("en-US", {
  dateStyle: "medium",
})

type PoApiListFilters = {
  project_uuid?: string
  vendor_uuid?: string
  entry_date_from?: string
  entry_date_to?: string
}
const runtimeConfig = useRuntimeConfig()
const nimbleIntegrationsEnabled = Boolean(runtimeConfig.public.nimbleIntegrations)

// Use permissions composable
const { hasPermission, isReady } = usePermissions()
const purchaseOrderResourcesStore = usePurchaseOrderResourcesStore()
const purchaseOrderListResourcesStore = usePurchaseOrderListResourcesStore()
const { openPurchaseOrderPrint } = usePurchaseOrderPrint()

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

// Set default page size to 50 for Purchase Orders
pagination.value.pageSize = 50

// Data state
const selectedPurchaseOrders = ref<any[]>([])
const selectedStatusFilter = ref<string | null>(null)
// Filter drawer state
const isFilterDrawerOpen = ref(false)

// Filter state (temporary - not applied until Show Results is clicked)
// Initialize as undefined, will be set from TopBar selection in onMounted
const filterCorporation = ref<string | undefined>(undefined)
const filterProject = ref<string | undefined>(undefined)
const filterVendor = ref<string | undefined>(undefined)
const filterLocation = ref<string | undefined>(undefined) // undefined shows "All Locations" when includeAllOption is true
const filterStatus = ref<string | null>(null)
// Additional filters for Create Purchase Order (To Be Raised) area
const filterCategory = ref<string | undefined>(undefined)
const filterDivision = ref<string | undefined>(undefined)
const filterItemType = ref<string | undefined>(undefined)
const projectLocationBreakdownRows = ref<any[]>([])
// Date range filter (default: last 60 days — aligned with VendorInvoicesList)
const filterDateFrom = ref<string | undefined>(defaultPoEntryDateRange.dateFrom)
const filterDateTo = ref<string | undefined>(defaultPoEntryDateRange.dateTo)

// Applied filters (only applied when Show Results is clicked)
const appliedFilters = ref({
  corporation: undefined as string | undefined,
  project: undefined as string | undefined,
  vendor: undefined as string | undefined,
  location: undefined as string | undefined,
  status: undefined as string | undefined,
  category: undefined as string | undefined,
  division: undefined as string | undefined,
  itemType: undefined as string | undefined,
  dateFrom: defaultPoEntryDateRange.dateFrom as string | undefined,
  dateTo: defaultPoEntryDateRange.dateTo as string | undefined,
})

/** Vendor filter: undefined / "All" / __ALL__ means no vendor scoping (show all items). */
function normalizeVendorFilterUuid(v: string | undefined | null): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  if (!s || s === "__ALL__") return undefined
  return s
}

const inlinePopoverFilterDateFromOpen = ref(false)
const inlinePopoverFilterDateToOpen = ref(false)
const drawerPopoverFilterDateFromOpen = ref(false)
const drawerPopoverFilterDateToOpen = ref(false)

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
  return listEntryDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

const filterDateToDisplayText = computed(() => {
  const cd = filterDateToCalendarValue.value
  if (!cd) return "Select date to"
  return listEntryDateFormatter.format(cd.toDate(getLocalTimeZone()))
})

const availableProjectCountForFilter = computed(() => {
  const corporationUuid = filterCorporation.value
  if (!corporationUuid) return 0
  const projects = purchaseOrderListResourcesStore.getProjects(corporationUuid)
  return Array.isArray(projects) ? projects.length : 0
})

/** API query filters for list fetch (entry_date = PO entry date). */
const buildPoApiListFilters = (): PoApiListFilters | undefined => {
  const useFilterInputs = selectedStatusFilter.value === null || selectedStatusFilter.value === undefined
  const isToBeRaisedScreen = selectedStatusFilter.value === 'ToBeRaised'
  const project = useFilterInputs ? filterProject.value : appliedFilters.value.project
  const vendor = useFilterInputs ? normalizeVendorFilterUuid(filterVendor.value) : appliedFilters.value.vendor
  const dateFrom = isToBeRaisedScreen ? undefined : (useFilterInputs ? filterDateFrom.value : appliedFilters.value.dateFrom)
  const dateTo = isToBeRaisedScreen ? undefined : (useFilterInputs ? filterDateTo.value : appliedFilters.value.dateTo)

  const f: PoApiListFilters = {}
  if (project) f.project_uuid = project
  if (vendor) f.vendor_uuid = vendor
  if (dateFrom) f.entry_date_from = dateFrom
  if (dateTo) f.entry_date_to = dateTo
  return Object.keys(f).length > 0 ? f : undefined
}

// Locations store for resolving location UUIDs to human-readable names
const locationsStore = useLocationsStore()
const projectScopedFilterLocations = computed(() => {
  if (!filterProject.value) return []

  const allowedLocationUuids = new Set(
    (projectLocationBreakdownRows.value || [])
      .map((row: any) => String(row?.location_uuid || '').trim())
      .filter(Boolean)
  )
  if (!allowedLocationUuids.size) return []

  const all = (locationsStore.getAll as any) || (locationsStore as any).locations || []
  const list = Array.isArray(all) ? all : []
  return list.filter((loc: any) => {
    const uuid = String(loc?.uuid || '')
    return uuid && allowedLocationUuids.has(uuid) && loc?.active !== false
  })
})
const locationsByUuid = computed(() => {
  const all = (locationsStore.getAll as any) || (locationsStore as any).locations || []
  const map = new Map<string, any>()
  if (Array.isArray(all)) {
    all.forEach((loc: any) => {
      if (loc?.uuid) map.set(loc.uuid, loc)
    })
  }
  return map
})

const isUuidLike = (value: any) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

const getLocationDisplayLabel = (item: any): string => {
  const rawLabel = (item?.location ?? '') as string
  // If it already looks like a nice label (not a UUID), return as-is
  if (rawLabel && !isUuidLike(rawLabel)) return rawLabel

  const uuid = (item?.location_uuid ?? rawLabel) as string | undefined
  if (uuid && locationsByUuid.value.has(uuid)) {
    const loc = locationsByUuid.value.get(uuid)
    if (loc) {
      return loc.location_code
        ? `${loc.location_name} (${loc.location_code})`
        : (loc.location_name || '')
    }
  }

  return rawLabel || ''
}
// Expanded rows state
const expanded = ref<Record<string, boolean>>({})
const poItemsCache = ref<Record<string, { items: any[], loading: boolean, error: string | null }>>({})
const showDeleteModal = ref(false)
const poToDelete = ref<any>(null)
const showFormModal = ref(false)
const isViewMode = ref(false)
/** True when active vendor invoices reference this PO; hides Revise actions. Set in loadPurchaseOrderForModal. */
const poHasLinkedVendorInvoices = ref<boolean | null>(null)
const poForm = ref<any>({
  po_items: [],
  attachments: [],
  removed_po_items: []
})
const appSettingsStore = useAppSettingsStore()
const authStore = useAuthStore()
const savingPoPrintOptions = ref(false)

/** Per-PO override for print; when null/undefined, corporation `po_print_approved_by_vendor` applies. */
const effectivePoPrintApprovedByVendor = computed(() => {
  const v = poForm.value?.print_include_approved_by_vendor
  if (v === true || v === false) return v
  return appSettingsStore.poPrintApprovedByVendor
})

/** Per-PO override for print; when null/undefined, corporation `po_use_entity_name` applies. */
const effectivePoPrintUseEntityName = computed(() => {
  const v = poForm.value?.print_use_entity_name
  if (v === true || v === false) return v
  return appSettingsStore.poUseEntityName
})

function buildUserAuditBody() {
  const user = authStore.user
  const preparedBy = String(poForm.value?.prepared_by || '').trim()
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

async function persistPoPrintOption(
  key: 'print_include_approved_by_vendor' | 'print_use_entity_name',
  value: boolean
): Promise<boolean> {
  const uuid = poForm.value?.uuid
  if (!uuid) return true
  savingPoPrintOptions.value = true
  try {
    await $fetch(`/api/purchase-order-forms/${uuid}`, {
      method: 'PUT',
      body: {
        [key]: value,
        ...buildUserAuditBody(),
      },
    })
    poForm.value[key] = value
    return true
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
    return false
  } finally {
    savingPoPrintOptions.value = false
  }
}

async function onPoPrintApprovedByVendorChange(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return
  const previous = poForm.value?.print_include_approved_by_vendor
  poForm.value = { ...poForm.value, print_include_approved_by_vendor: value }
  if (!poForm.value?.uuid) return
  const ok = await persistPoPrintOption('print_include_approved_by_vendor', value)
  if (!ok) {
    poForm.value = { ...poForm.value, print_include_approved_by_vendor: previous }
  }
}

async function onPoPrintUseEntityNameChange(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return
  const previous = poForm.value?.print_use_entity_name
  poForm.value = { ...poForm.value, print_use_entity_name: value }
  if (!poForm.value?.uuid) return
  const ok = await persistPoPrintOption('print_use_entity_name', value)
  if (!ok) {
    poForm.value = { ...poForm.value, print_use_entity_name: previous }
  }
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

const savingPO = ref(false)
const loadingEditPO = ref(false)
const loadingRowUuid = ref<string | null>(null)
const isEstimateImportBlocked = ref(false)
const isFormValid = ref(true) // Track form validation state
const showExceededQuantityModal = ref(false)
const showSendPoEmailModal = ref(false)
const sendEmailPoUuid = ref<string | null>(null)

watch(showSendPoEmailModal, (open) => {
  if (!open) {
    sendEmailPoUuid.value = null
  }
})

const sendPoDefaultToEmail = computed(() => {
  const vu = (poForm.value as Record<string, unknown>).vendor_uuid
  const corp = String((poForm.value as Record<string, unknown>).corporation_uuid || '')
  const localVendors = corp
    ? (typeof (purchaseOrderListResourcesStore as any).getVendors === 'function'
        ? ((purchaseOrderListResourcesStore as any).getVendors(corp) || [])
        : [])
    : []
  const vendorsMaybe: any = (vendorStore as any).vendors
  const globalVendors: any[] = Array.isArray(vendorsMaybe)
    ? vendorsMaybe
    : Array.isArray(vendorsMaybe?.value)
      ? vendorsMaybe.value
      : []
  const vendorsList = localVendors.length ? localVendors : globalVendors

  const v = vu ? vendorsList.find((x: any) => x.uuid === vu) : null
  const e = v?.vendor_email
  if (typeof e === 'string' && e.trim() !== '') return e.trim()

  // Fallback for legacy snapshots where the email may already exist on the PO form.
  const ve = (poForm.value as Record<string, unknown>).vendor_email
  return typeof ve === 'string' ? ve.trim() : ''
})

/** Bucket PDFs saved on the PO (shown in send modal; server re-loads on send). */
const sendPoStorageAttachments = computed(() => {
  const raw = poForm.value?.attachments
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (att: { file_path?: string; uuid?: string; isUploaded?: boolean }) =>
      att &&
      typeof att.file_path === 'string' &&
      att.file_path.trim() !== '' &&
      (att.uuid || att.isUploaded),
  )
})

const showAuditLogModal = ref(false)
const auditLogsCount = ref(0)
const exceededItems = ref<any[]>([])
const pendingSaveAction = ref<(() => Promise<void>) | null>(null)
const pendingSaveStatus = ref<'Draft' | 'Ready' | 'Approved' | null>(null)
const savingCO = ref(false)

// Column pinning for sticky actions column
const columnPinning = ref({
  left: [],
  right: ['actions']
});

// Sorting state
const sorting = ref([])

// Table ref for accessing table API
const table = useTemplateRef<any>('table');
// Items table ref for accessing items table API
const itemsTable = useTemplateRef<any>('itemsTable');

// Use purchase orders from store
const purchaseOrders = computed(() => purchaseOrdersStore.purchaseOrders)
const loading = computed(() => purchaseOrdersStore.loading)
// Only show error alert for fetch errors, not delete operation errors
// Delete errors are handled via toast notifications
const error = computed(() => {
  const storeError = purchaseOrdersStore.error
  // Don't show error alert for delete-related errors (they're handled via toast)
  if (storeError && (storeError.includes('delete') || storeError.includes('Cannot delete'))) {
    return null
  }
  return storeError
})
const canEdit = computed(() => hasPermission('po_edit') || hasPermission('po_create'))
const canVerify = computed(() => hasPermission('po_verify'))
const canApprove = computed(() => hasPermission('po_approve'))

// Check if PO status should make the form read-only
const isReadOnlyStatus = computed(() => {
  const status = String(poForm.value?.status || '').toLowerCase()
  // Form should be read-only for Approved, Partially_Received, or Completed statuses
  return status === 'approved' || status === 'partially_received' || status === 'completed'
})

const formModalTitle = computed(() => {
  if (isViewMode.value) return 'View Purchase Order'
  return poForm.value?.uuid ? 'Edit Purchase Order' : 'Purchase Order'
})

// Permission-based button visibility
// Show Save buttons (Save & New, Save & Close) when user has no verify and no approve permissions
const showSaveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canEdit.value) return false
  if (canVerify.value || canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show if status is already Approved (only approvers can modify approved POs)
  if (poForm.value.status === 'Approved') {
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
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show if status is already Approved
  if (poForm.value.status === 'Approved') {
    return false
  }
  
  return true
})

// Show Approve buttons (Approve & New, Approve & Close) when user has approve permission
const showApproveButtons = computed(() => {
  if (isViewMode.value) return false
  if (!canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Don't show approve buttons when status is already Approved
  // (use reject button via showRejectButtonForApproved instead)
  if (poForm.value?.status === 'Approved') {
    return false
  }
  
  return true
})

// Show Reject button when user has approve permission and PO status is Ready
const showRejectButton = computed(() => {
  if (isViewMode.value) return false
  if (!canApprove.value) return false
  
  // Don't show if status is Partially_Received or Completed
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return false
  }
  
  // Only show reject button when status is Ready (case-insensitive check)
  const currentStatus = String(poForm.value?.status || '').trim()
  return currentStatus === 'Ready' || currentStatus.toLowerCase() === 'ready'
})

// Show Reject button for Approved status (for users with approve permission)
const showRejectButtonForApproved = computed(() => {
  if (isViewMode.value) return false
  if (!canApprove.value) return false
  if (!poForm.value?.uuid) return false
  
  // Only show when status is Approved
  return poForm.value.status === 'Approved'
})

// Revise (Ready → Draft): hidden while invoice check pending or when invoices lock the PO
const showReviseForReadyStatus = computed(() => {
  if (poHasLinkedVendorInvoices.value === true) return false
  if (poForm.value?.uuid && poHasLinkedVendorInvoices.value === null) return false
  return showRejectButton.value
})

// Revise (Approved → Draft): hidden while invoice check pending or when invoices lock the PO
const showReviseForApprovedStatus = computed(() => {
  if (poHasLinkedVendorInvoices.value === true) return false
  if (poForm.value?.uuid && poHasLinkedVendorInvoices.value === null) return false
  return showRejectButtonForApproved.value
})

// Legacy computed properties for backward compatibility (if needed elsewhere)
const showApprovalButtons = computed(() => false) // Deprecated - use showApproveButtons instead
const showSaveDraftButton = computed(() => showRejectButtonForApproved.value) // For Approved status, show reject button
const showMarkReadyButton = computed(() => false) // Deprecated - use showVerifyButtons instead
const showAnySaveButtons = computed(() => showSaveButtons.value || showVerifyButtons.value || showApproveButtons.value)

const saveDraftButtonLabel = computed(() => {
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'Locked'
  }
  if (poForm.value?.uuid && poForm.value.status === 'Approved') {
    return 'Revise'
  }
  return 'Save'
})

const saveDraftButtonIcon = computed(() => {
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'i-heroicons-lock-closed'
  }
  if (poForm.value?.uuid && poForm.value.status === 'Approved') {
    return 'i-heroicons-arrow-uturn-left'
  }
  return 'i-heroicons-document'
})

const saveDraftButtonColor = computed(() => {
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return 'warning'
  }
  if (poForm.value?.uuid && poForm.value.status === 'Approved') {
    return 'error'
  }
  return 'primary'
})

const saveDraftButtonVariant = computed((): 'solid' => {
  return 'solid'
})

const isSaveDraftButtonDisabled = computed(() => {
  if (savingPO.value) return true
  const status = String(poForm.value?.status || '').toLowerCase()
  if (status === 'partially_received' || status === 'completed') {
    return true
  }
  return false
})

// Computed
const selectedCorporationId = computed(() => corporationStore.selectedCorporationId)

// Server-side pagination support
const serverPaginationInfo = computed(() => {
  if (!selectedCorporationId.value) return null
  return purchaseOrdersStore.paginationInfo[selectedCorporationId.value] ?? null
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  const useFilterInputs = selectedStatusFilter.value === null || selectedStatusFilter.value === undefined
  const activeCorporation = useFilterInputs ? filterCorporation.value : appliedFilters.value.corporation
  const activeProject = useFilterInputs ? filterProject.value : appliedFilters.value.project
  const activeVendor = useFilterInputs ? filterVendor.value : appliedFilters.value.vendor
  const activeLocation = useFilterInputs ? filterLocation.value : appliedFilters.value.location
  const activeStatus = useFilterInputs ? filterStatus.value : appliedFilters.value.status
  
  return !!(selectedStatusFilter.value || activeCorporation || activeProject || activeVendor || activeLocation || activeStatus)
})

// Total records: use filtered length when filters are active, otherwise use server total
const paginationTotal = computed(() => {
  if (hasActiveFilters.value) {
    // When filters are active, paginate based on filtered data
    return filteredPurchaseOrders.value.length
  }
  // When no filters, use server total to show all available records
  return serverPaginationInfo.value?.totalRecords || filteredPurchaseOrders.value.length
})

// Server total (for display purposes - shows total available in DB)
const serverPaginationTotal = computed(() => {
  return serverPaginationInfo.value?.totalRecords || 0
})

const serverPaginationPage = computed(() => {
  if (!table.value?.tableApi) return 1
  return (table.value.tableApi.getState().pagination.pageIndex || 0) + 1
})

const shouldShowServerPagination = computed(() => {
  // Show pagination if we have filtered data or server total indicates more records
  const filteredCount = filteredPurchaseOrders.value.length
  const serverTotal = serverPaginationTotal.value
  return filteredCount > 10 || (serverTotal > 0 && serverTotal > filteredCount)
})

const serverPageInfo = computed(() => {
  if (!table.value?.tableApi) {
    return `Showing 0 of 0 purchase orders`
  }
  
  const tableState = table.value.tableApi.getState()
  const pageIndex = tableState.pagination.pageIndex || 0
  const pageSize = tableState.pagination.pageSize || 10
  
  // Get the actual displayed rows from the table (after pagination)
  const rowModel = table.value.tableApi.getRowModel()
  const displayedRows = rowModel.rows || []
  const displayedCount = displayedRows.length
  
  // Calculate start/end based on what's actually displayed
  const start = displayedCount > 0 ? pageIndex * pageSize + 1 : 0
  const end = pageIndex * pageSize + displayedCount
  
  const filteredCount = filteredPurchaseOrders.value.length
  const serverTotal = serverPaginationTotal.value
  
  // Show filtered count, but also show server total if different (indicates more records available)
  if (hasActiveFilters.value) {
    if (serverTotal > filteredCount) {
      return `Showing ${start} to ${end} of ${filteredCount} filtered (${serverTotal} total) purchase orders`
    }
    return `Showing ${start} to ${end} of ${filteredCount} purchase orders`
  } else {
    // No filters: show server total
    return `Showing ${start} to ${end} of ${serverTotal || filteredCount} purchase orders`
  }
})

// Handle server-side pagination page changes
const handleServerPageChange = async (newPage: number) => {
  if (!table.value?.tableApi || !selectedCorporationId.value) return
  
  const pageIndex = newPage - 1
  table.value.tableApi.setPageIndex(pageIndex)
  
  // If filters are active, we're doing client-side pagination on filtered data
  // No need to load more from API
  if (hasActiveFilters.value) {
    return
  }
  
  // No filters: load more data from API if needed
  const tablePageSize = pagination.value.pageSize || 10
  const apiPageSize = 100 // API page size
  
  // Check if we need to load this page
  const paginationInfo = serverPaginationInfo.value
  if (paginationInfo && paginationInfo.hasMore) {
    // Check if we've already loaded enough data for this page
    let loadedCount = purchaseOrders.value.filter((po: any) => 
      String(po.corporation_uuid) === String(selectedCorporationId.value)
    ).length
    
    const neededCount = pageIndex * tablePageSize + tablePageSize
    if (neededCount > loadedCount) {
      // Load more pages until we have enough data
      let currentApiPage = Math.floor(loadedCount / apiPageSize) + 1
      while (neededCount > loadedCount && paginationInfo.hasMore && currentApiPage <= paginationInfo.totalPages) {
        await purchaseOrdersStore.fetchPurchaseOrders(
          selectedCorporationId.value,
          { force: false, filters: { ...buildPoApiListFilters(), page: currentApiPage, page_size: apiPageSize } },
        )
        const newLoadedCount = purchaseOrders.value.filter((po: any) => 
          String(po.corporation_uuid) === String(selectedCorporationId.value)
        ).length
        if (newLoadedCount === loadedCount) break // No new data loaded
        loadedCount = newLoadedCount
        currentApiPage++
      }
    }
  }
}

// Ship via lookup
// Latest estimate for the current project
const latestEstimate = computed(() => {
  const corpUuid = poForm.value?.corporation_uuid || appliedFilters.value.corporation
  const projectUuid = poForm.value?.project_uuid || appliedFilters.value.project
  
  if (!corpUuid || !projectUuid) return null
  
  const estimates = purchaseOrderResourcesStore.getEstimatesByProject(corpUuid, projectUuid) || []
  
  // Get the latest approved estimate
  const latest = estimates
    .filter((est: any) => est.status === 'Approved' && est.is_active !== false)
    .sort((a: any, b: any) => {
      const dateA = a.estimate_date ? new Date(a.estimate_date).getTime() : 0
      const dateB = b.estimate_date ? new Date(b.estimate_date).getTime() : 0
      return dateB - dateA
    })[0]
  
  return latest || null
})

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

const freightNameByUuid = computed<Record<string, string>>(() => {
  const list = freightStore.getAllFreight || []
  const map: Record<string, string> = {}
  list.forEach((f: any) => {
    if (f?.uuid) map[f.uuid] = f.freight_name || f.uuid
  })
  return map
})

const vendorNameByUuid = computed<Record<string, string>>(() => {
  const corpUuid = selectedCorporationId.value || ''
  const list: any[] = corpUuid ? vendorStore.getVendorsForCorporation(corpUuid) : []
  const map: Record<string, string> = {}
  list.forEach((v: any) => {
    if (v?.uuid) map[v.uuid.toLowerCase()] = v.vendor_name || v.uuid
  })
  return map
})

// Address popover state - track which PO's popover is open
const shippingAddressPopoverOpen = ref<Record<string, boolean>>({})

// Status stats computed properties
const allPOStats = computed(() => {
  return {
    count: purchaseOrders.value.length,
    totalValue: purchaseOrders.value.reduce((sum, po) => sum + (Number(po.total_po_amount) || 0), 0)
  }
})

const draftStats = computed(() => {
  // Pending stat shows only Approved and Partially_Received statuses
  // Excludes: Completed, Ready (to be approved), Draft (pending)
  const pendingPOs = purchaseOrders.value.filter(p => {
    const status = String(p.status || '').toLowerCase()
    return status === 'approved' || status === 'partially_received'
  })
  return {
    count: pendingPOs.length,
    totalValue: pendingPOs.reduce((sum, p) => sum + (Number(p.total_po_amount) || 0), 0)
  }
})

const readyStats = computed(() => {
  const readyPOs = purchaseOrders.value.filter(p => p.status === 'Ready')
  return {
    count: readyPOs.length,
    totalValue: readyPOs.reduce((sum, p) => sum + (Number(p.total_po_amount) || 0), 0)
  }
})

const toBeRaisedStats = computed(() => {
  // To be raised = Draft status POs that need to be raised to Ready
  const toBeRaisedPOs = purchaseOrders.value.filter(p => (p.status || 'Draft') === 'Draft')
  return {
    count: toBeRaisedPOs.length,
    totalValue: toBeRaisedPOs.reduce((sum, p) => sum + (Number(p.total_po_amount) || 0), 0)
  }
})

const approvedStats = computed(() => {
  const approvedPOs = purchaseOrders.value.filter(p => p.status === 'Approved')
  return {
    count: approvedPOs.length,
    totalValue: approvedPOs.reduce((sum, p) => sum + (Number(p.total_po_amount) || 0), 0)
  }
})

const rejectedStats = computed(() => {
  const rejectedPOs = purchaseOrders.value.filter(p => p.status === 'Rejected')
  return {
    count: rejectedPOs.length,
    totalValue: rejectedPOs.reduce((sum, p) => sum + (Number(p.total_po_amount) || 0), 0)
  }
})

// Get unique values for filter dropdowns
const uniqueProjects = computed(() => {
  const projects = new Map<string, { uuid: string; name: string }>()
  purchaseOrders.value.forEach(po => {
    if (po.project_uuid && po.project_name) {
      projects.set(po.project_uuid, { uuid: po.project_uuid, name: po.project_name })
    }
  })
  return Array.from(projects.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const uniqueVendors = computed(() => {
  const vendors = new Map<string, { uuid: string; name: string }>()
  purchaseOrders.value.forEach(po => {
    if (po.vendor_uuid && po.vendor_name) {
      vendors.set(po.vendor_uuid, { uuid: po.vendor_uuid, name: po.vendor_name })
    }
  })
  return Array.from(vendors.values()).sort((a, b) => a.name.localeCompare(b.name))
})


const statusOptions = [
  { label: 'All Statuses', value: null },
  { label: 'Pending', value: 'Draft' },
  { label: 'To be approved', value: 'Ready' },
  { label: 'Purchase order approved', value: 'Approved' },
  { label: 'Purchase order rejected', value: 'Rejected' },
  { label: 'Partially Received', value: 'Partially_Received' },
  { label: 'Completed', value: 'Completed' }
]

const filteredPurchaseOrders = computed(() => {
  let filtered = [...purchaseOrders.value]
  
  // Apply status filter from stats cards if selected
  if (selectedStatusFilter.value) {
    if (selectedStatusFilter.value === 'ToBeRaised') {
      // To be raised = Draft status POs
      filtered = filtered.filter(p => (p.status || 'Draft') === 'Draft')
    } else if (selectedStatusFilter.value === 'Pending') {
      // Pending = Approved and Partially_Received statuses only
      filtered = filtered.filter(p => {
        const status = String(p.status || '').toLowerCase()
        return status === 'approved' || status === 'partially_received'
      })
    } else {
      filtered = filtered.filter(p => p.status === selectedStatusFilter.value)
    }
  }
  
  // Determine which filter values to use:
  // - On Summary screen (selectedStatusFilter === null): use filter inputs directly for immediate filtering
  // - On other screens: use appliedFilters (set when "Show Results" is clicked)
  const useFilterInputs = selectedStatusFilter.value === null || selectedStatusFilter.value === undefined
  
  const activeCorporation = useFilterInputs ? filterCorporation.value : appliedFilters.value.corporation
  const activeProject = useFilterInputs ? filterProject.value : appliedFilters.value.project
  const activeVendor = useFilterInputs ? filterVendor.value : appliedFilters.value.vendor
  const activeLocation = useFilterInputs ? filterLocation.value : appliedFilters.value.location
  const activeStatus = useFilterInputs ? filterStatus.value : appliedFilters.value.status
  
  // Apply filter panel filters
  if (activeCorporation) {
    filtered = filtered.filter(p => p.corporation_uuid === activeCorporation)
  }
  
  if (activeProject) {
    filtered = filtered.filter(p => p.project_uuid === activeProject)
  }
  
  if (activeVendor) {
    filtered = filtered.filter(p => p.vendor_uuid === activeVendor)
  }
  
  if (activeLocation) {
    filtered = filtered.filter(p => {
      // Check if any PO item has this location
      if (p.po_items && Array.isArray(p.po_items)) {
        return p.po_items.some((item: any) => item.location === activeLocation)
      }
      // Or check shipping address
      return (p as any).shipping_address_custom === activeLocation
    })
  }
  
  if (activeStatus) {
    filtered = filtered.filter(p => p.status === activeStatus)
  }

  const activeDateFrom = useFilterInputs ? filterDateFrom.value : appliedFilters.value.dateFrom
  const activeDateTo = useFilterInputs ? filterDateTo.value : appliedFilters.value.dateTo
  const shouldApplyDateRange = selectedStatusFilter.value !== 'ToBeRaised'

  if (shouldApplyDateRange && activeDateFrom) {
    filtered = filtered.filter(p => {
      const poDate = (p as any).po_date || (p as any).entry_date || (p as any).created_at
      return poDate && poDate >= activeDateFrom
    })
  }

  if (shouldApplyDateRange && activeDateTo) {
    filtered = filtered.filter(p => {
      const poDate = (p as any).po_date || (p as any).entry_date || (p as any).created_at
      return poDate && poDate <= activeDateTo
    })
  }

  const activeCategory = useFilterInputs ? filterCategory.value : appliedFilters.value.category
  const activeDivision = useFilterInputs ? filterDivision.value : appliedFilters.value.division
  const activeItemType = useFilterInputs ? filterItemType.value : appliedFilters.value.itemType

  if (activeCategory) {
    filtered = filtered.filter(p => {
      if (p.po_items && Array.isArray(p.po_items)) {
        return p.po_items.some((item: any) => item.category === activeCategory)
      }
      return false
    })
  }

  if (activeDivision) {
    filtered = filtered.filter(p => {
      if (p.po_items && Array.isArray(p.po_items)) {
        return p.po_items.some((item: any) => item.item_division_uuid === activeDivision)
      }
      return false
    })
  }

  if (activeItemType) {
    filtered = filtered.filter(p => {
      if (p.po_items && Array.isArray(p.po_items)) {
        return p.po_items.some((item: any) => item.item_type_uuid === activeItemType)
      }
      return false
    })
  }

  return filtered
})

// Items table data (for the main Show button functionality)
const selectedItemsTableRows = ref<Record<string, boolean>>({})

// Computed property to get the count of selected rows
const selectedItemsTableRowsCount = computed(() => {
  if (!itemsTable.value?.tableApi) {
    return Object.keys(selectedItemsTableRows.value).filter(key => selectedItemsTableRows.value[key]).length
  }
  // Use table API if available
  return itemsTable.value.tableApi.getFilteredSelectedRowModel().rows.length
})

// To be Raised items state
const toBeRaisedItems = ref<any[]>([])
const loadingToBeRaisedItems = ref(false)

// Project Items Summary composable
const projectItemsSummary = useProjectItemsSummary()

const itemsTableData = computed(() => {
  // Explicitly access the data to ensure reactivity tracking
  const dataValue = projectItemsSummary.data.value
  const items = dataValue?.items || []

  const activeVendor = appliedFilters.value.vendor
  const activeLocation = appliedFilters.value.location
  const activeCategory = appliedFilters.value.category
  const activeDivision = appliedFilters.value.division
  const activeItemType = appliedFilters.value.itemType

  // Strict checks only. No fallback fields.
  // Include every estimate line (even when pending_qty is 0 / budget fully ordered).
  const filteredItems = items.filter((item: any) => {
    if (activeVendor) {
      if (String(item?.preferred_vendor_uuid || '') !== String(activeVendor)) return false
    }
    if (activeLocation) {
      if (String(item?.location_uuid || '') !== String(activeLocation)) return false
    }
    if (activeCategory) {
      if (String(item?.category || '') !== String(activeCategory)) return false
    }
    if (activeDivision) {
      if (String(item?.item_division_uuid || '') !== String(activeDivision)) return false
    }
    if (activeItemType) {
      if (String(item?.item_type_uuid || '') !== String(activeItemType)) return false
    }
    return true
  })

  return filteredItems
})

/** Rows selected in Create PO items table must share the same estimate preferred vendor (preferred_vendor_uuid). */
const lastValidItemsTableSelection = ref<Record<string, boolean>>({})

const CREATE_PO_SINGLE_VENDOR_TOAST = {
  title: 'One vendor only',
  description:
    'You must select estimate lines that belong to a single preferred vendor. Deselect rows or choose items for one vendor before creating a purchase order.',
  color: 'warning' as const,
}

/** Selected rows for Create PO — matches table API when present so sorting/filtering cannot desync selection. */
function getSelectedCreatePoLineItems(): any[] {
  if (itemsTable.value?.tableApi) {
    const selectedRows = itemsTable.value.tableApi.getFilteredSelectedRowModel().rows
    return selectedRows.map((row: any) => row.original)
  }
  const selectedIndices = Object.keys(selectedItemsTableRows.value)
    .filter((key) => selectedItemsTableRows.value[key])
    .map((key) => parseInt(key, 10))
  return itemsTableData.value.filter((_item: any, index: number) => selectedIndices.includes(index))
}

const itemsTableDataRowFingerprint = computed(() =>
  itemsTableData.value.map((r: any) => `${r.item_uuid ?? ''}:${r.cost_code_uuid ?? ''}`).join('|')
)

watch(itemsTableDataRowFingerprint, () => {
  selectedItemsTableRows.value = {}
  lastValidItemsTableSelection.value = {}
})

watch(
  selectedItemsTableRows,
  () => {
    const applyVendorGuard = () => {
      const itemsToCheck = getSelectedCreatePoLineItems()
      if (lineItemsShareSingleEstimateVendor(itemsToCheck)) {
        lastValidItemsTableSelection.value = { ...selectedItemsTableRows.value }
        return
      }
      try {
        const toast = useToast()
        toast.add(CREATE_PO_SINGLE_VENDOR_TOAST)
      } catch {
        // Toast unavailable (e.g. edge test env)
      }
      selectedItemsTableRows.value = { ...lastValidItemsTableSelection.value }
    }
    // TanStack selection can lag one tick behind v-model; tests/stubs often have no tableApi (sync path).
    if (itemsTable.value?.tableApi) {
      nextTick(applyVendorGuard)
    } else {
      applyVendorGuard()
    }
  },
  { deep: true }
)

// Distinct options for category/division/item type filters on Create Purchase Order view,
// derived from the current itemsTableData (project estimate lines)
const categoryFilterOptions = computed(() => {
  const items = itemsTableData.value || []
  const set = new Set<string>()
  items.forEach((it: any) => {
    if (it.category) set.add(String(it.category))
  })
  return Array.from(set).sort()
})

const divisionFilterOptions = computed(() => {
  const items = itemsTableData.value || []
  const set = new Set<string>()
  items.forEach((it: any) => {
    if (it.division_name) set.add(String(it.division_name))
  })
  return Array.from(set).sort()
})

const itemTypeFilterOptions = computed(() => {
  const items = itemsTableData.value || []
  const set = new Set<string>()
  items.forEach((it: any) => {
    if (it.item_type_label) set.add(String(it.item_type_label))
  })
  return Array.from(set).sort()
})

const loadingItemsTable = computed(() => projectItemsSummary.loading.value)

// Computed to check if items table should be shown
// Show items table when ToBeRaised is selected and filters are applied
// Vendor is optional - items will be shown even without vendor filter
const shouldShowItemsTable = computed(() => {
  return selectedStatusFilter.value === 'ToBeRaised' && 
         hasPermission('po_view') && 
         isReady.value && 
         appliedFilters.value.corporation && 
         appliedFilters.value.project
})

// Show Results button handler
const handleShowResults = async () => {
  if (selectedStatusFilter.value === 'ToBeRaised') {
    const missingFields: string[] = [];
    const corpForCreate =
      filterCorporation.value || appliedFilters.value.corporation || selectedCorporationId.value;
    if (!corpForCreate) missingFields.push('Corporation');
    if (!filterProject.value) missingFields.push('Project');
    if (missingFields.length > 0) {
      const toast = useToast();
      toast.add({
        title: 'Required filters missing',
        description: `Please select ${missingFields.join(' and ')} before proceeding.`,
        color: 'error',
      });
      return;
    }
  }

  appliedFilters.value = {
    corporation: filterCorporation.value,
    project: filterProject.value,
    vendor: normalizeVendorFilterUuid(filterVendor.value),
    location: filterLocation.value,
    status: filterStatus.value ?? undefined,
    category: filterCategory.value,
    division: filterDivision.value,
    itemType: filterItemType.value,
    dateFrom: selectedStatusFilter.value === 'ToBeRaised' ? undefined : filterDateFrom.value,
    dateTo: selectedStatusFilter.value === 'ToBeRaised' ? undefined : filterDateTo.value,
  }

  // Fetch purchase orders (project/vendor/entry_date from API; location/status client-side)
  const apiFilters = buildPoApiListFilters()

  const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value;
  if (corporationUuid) {
    await purchaseOrdersStore.fetchPurchaseOrders(corporationUuid, { force: true, filters: { ...apiFilters, page: 1, page_size: 100 } });
  }
  
  // Fetch projects for the selected corporation if not already loaded
  if (appliedFilters.value.corporation) {
    await purchaseOrderListResourcesStore.ensureProjects({
      corporationUuid: appliedFilters.value.corporation,
      force: false
    })
  }
  
  // Fetch items table data when filters are applied
  // For ToBeRaised screen: fetch when corporation and project are set (vendor is optional)
  // For other screens: also fetch to keep data in sync
  if (appliedFilters.value.corporation && appliedFilters.value.project) {
    await fetchItemsTableData()
  }
  
  // Legacy: If ToBeRaised is selected and vendor is also set, fetch legacy items (optional)
  // This is kept for backward compatibility but itemsTableData is the primary source
  if (selectedStatusFilter.value === 'ToBeRaised' && appliedFilters.value.corporation && appliedFilters.value.project && appliedFilters.value.vendor) {
    fetchToBeRaisedItems()
  }
}

// Utility function to wrap text at word boundaries within max length
const wrapTextAtWordBoundary = (text: string, maxLength: number = 25): string => {
  if (!text || text.length <= maxLength) {
    return text
  }

  // Find the last space within the first maxLength characters
  const truncated = text.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > 0) {
    // Break at the last space found
    const firstLine = text.substring(0, lastSpaceIndex)
    const remaining = text.substring(lastSpaceIndex + 1)
    return firstLine + '\n' + remaining
  } else {
    // No space found, break at maxLength
    return text.substring(0, maxLength) + '\n' + text.substring(maxLength)
  }
}

// Clear Filters button handler
const handleClearFilters = () => {
  const wasOnToBeRaisedScreen = selectedStatusFilter.value === 'ToBeRaised'

  // Always preserve corporation so the user does not lose org context (matches summary tile clear).
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterStatus.value = null
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined

  // Clear applied filters (results) except corporation
  appliedFilters.value = {
    corporation: preservedCorporationUuid,
    project: undefined,
    vendor: undefined,
    location: undefined,
    status: undefined,
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  }

  // Fetch all purchase orders for the preserved corporation when filters are cleared
  const corporationUuid = preservedCorporationUuid
  if (corporationUuid) {
    purchaseOrdersStore.fetchPurchaseOrders(corporationUuid, { force: true })
  }

  // Clear status filter (return to summary view) only when not on "ToBeRaised"
  if (!wasOnToBeRaisedScreen) {
    selectedStatusFilter.value = null
  }

  // Clear items table data (data is readonly, will be overwritten on next fetch)
  // projectItemsSummary.data.value = { items: [] } // Cannot assign to readonly property

  // Clear to be raised items
  toBeRaisedItems.value = []
}

// Ensure locations are loaded when the filter drawer opens
watch(isFilterDrawerOpen, (open) => {
  if (open && (!locationsStore.getAll || locationsStore.getAll.length === 0)) {
    locationsStore.fetchLocations()
  }
})

// Drawer filter handlers
const handleApplyDrawerFilters = () => {
  isFilterDrawerOpen.value = false
  handleShowResults()
}

const handleClearDrawerFilters = () => {
  // Always keep corporation in the drawer so org context is not cleared by "Clear All".
  const preservedCorporationUuid: string | undefined =
    filterCorporation.value ||
    appliedFilters.value.corporation ||
    (selectedCorporationId.value ?? undefined)

  filterCorporation.value = preservedCorporationUuid

  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterStatus.value = null
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined
}

// Fetch items to be raised based on corporation, project and vendor
const fetchToBeRaisedItems = async () => {
  if (!appliedFilters.value.corporation || !appliedFilters.value.project || !appliedFilters.value.vendor) {
    toBeRaisedItems.value = []
    return
  }
  
  loadingToBeRaisedItems.value = true
  try {
    // TODO: Replace with actual API endpoint for fetching items to be raised
    // This is a placeholder - you'll need to implement the actual API call
    // based on your business logic for what "items to be raised" means
    const corporationUuid = appliedFilters.value.corporation || selectedCorporationId.value
    const response: any = await $fetch('/api/items-to-be-raised', {
      method: 'GET',
      query: {
        corporation_uuid: corporationUuid,
        project_uuid: appliedFilters.value.project,
        vendor_uuid: appliedFilters.value.vendor
      }
    })
    
    const allItems = Array.isArray(response?.data) ? response.data : []
    toBeRaisedItems.value = allItems
  } catch (error: any) {
    console.error('Error fetching items to be raised:', error)
    toBeRaisedItems.value = []
    // Optionally show error toast
    try {
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to load items to be raised',
        color: 'error'
      })
    } catch (e) {
      // Toast not available
    }
  } finally {
    loadingToBeRaisedItems.value = false
  }
}

// To be Raised table columns
const sanitizeDescriptionToText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const DESCRIPTION_PREVIEW_LIMIT = 80;

const renderDescriptionCell = (rawDescription: unknown) => {
  const descriptionText = sanitizeDescriptionToText(rawDescription);
  if (!descriptionText) {
    return h("div", "N/A");
  }

  if (descriptionText.length <= DESCRIPTION_PREVIEW_LIMIT) {
    return h(
      "div",
      {
        class: "whitespace-pre-wrap break-words",
      },
      descriptionText
    );
  }

  const truncated = `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LIMIT)}...`;
  const UPopover = resolveComponent("UPopover");

  return h(
    UPopover as any,
    {},
    {
      default: () =>
        h("div", { class: "flex items-center gap-2 min-w-0" }, [
          h(
            "span",
            {
              class: "truncate",
              title: descriptionText,
            },
            truncated
          ),
          h(
            "a",
            {
              href: "#",
              class: "text-primary-600 dark:text-primary-400 hover:underline text-xs whitespace-nowrap",
              onClick: (event: Event) => event.preventDefault(),
            },
            "Read more"
          ),
        ]),
      content: () =>
        h("div", { class: "p-3 max-w-md whitespace-pre-wrap break-words text-sm" }, descriptionText),
    }
  );
};

const toBeRaisedColumns: TableColumn<any>[] = [
  {
    accessorKey: 'cost_code_label',
    header: 'Cost Code',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.cost_code_label || 'N/A')
  },
  {
    accessorKey: 'item_name',
    header: 'Item Name',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.item_name || row.original.description || 'N/A')
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => renderDescriptionCell(row.original.description)
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      const qty = row.original.quantity || 0
      return h('div', { class: 'text-right' }, String(qty))
    }
  },
  {
    accessorKey: 'unit_price',
    header: 'Unit Price',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      const price = row.original.unit_price || 0
      return h('div', { class: 'text-right font-mono text-sm' }, formatCurrency(price))
    }
  },
  {
    accessorKey: 'total',
    header: 'Total',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      const total = row.original.total || 0
      return h('div', { class: 'text-right font-mono text-sm font-semibold' }, formatCurrency(total))
    }
  }
]

// Fetch items table data (estimate items with PO quantities)
const fetchItemsTableData = async () => {
  if (!appliedFilters.value.corporation || !appliedFilters.value.project) {
    return
  }
  
  try {
    await projectItemsSummary.fetchProjectItemsSummary(
      appliedFilters.value.corporation,
      appliedFilters.value.project,
      appliedFilters.value.vendor || undefined,
      appliedFilters.value.location || undefined
    )
  } catch (error: any) {
    console.error('Error fetching items table data:', error)
    try {
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: error.data?.statusMessage || error.message || 'Failed to load items data',
        color: 'error'
      })
    } catch (e) {
      // Toast not available
    }
  }
}

const fetchProjectLocationBreakdownsForFilter = async (projectUuid?: string) => {
  if (!projectUuid) {
    projectLocationBreakdownRows.value = []
    return
  }
  try {
    const response = await $fetch<{ data?: any[] }>(
      `/api/projects/location-breakdowns?project_uuid=${encodeURIComponent(projectUuid)}`
    )
    projectLocationBreakdownRows.value = Array.isArray(response?.data) ? response.data : []
  } catch {
    projectLocationBreakdownRows.value = []
  }
}

// Handle raising purchase order for selected items with pending quantity
const handleRaisePurchaseOrderForPendingQty = async () => {
  if (selectedItemsTableRowsCount.value === 0) {
    return
  }

  const selectedItems = getSelectedCreatePoLineItems()

  if (selectedItems.length === 0) {
    return
  }

  if (!lineItemsShareSingleEstimateVendor(selectedItems)) {
    try {
      const toast = useToast()
      toast.add(CREATE_PO_SINGLE_VENDOR_TOAST)
    } catch {
      // Toast unavailable
    }
    return
  }

  // Filter vendor on form, else estimate preferred vendor on first line (not PO vendor_name from API)
  const vendorUuid =
    appliedFilters.value.vendor ||
    selectedItems[0]?.preferred_vendor_uuid ||
    selectedItems[0]?.vendor_uuid ||
    null
  
  // Validate required filters
  if (!appliedFilters.value.corporation || !appliedFilters.value.project) {
    try {
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Please select corporation and project before creating a purchase order',
        color: 'error'
      })
    } catch (e) {
      // Toast not available
    }
    return
  }
  
  // Transform selected items to PO items format
  const poItems = transformCreatePoLineItems(selectedItems)
  
  // Clear previous PO resources before opening new form
  purchaseOrderResourcesStore.clear()
  
  // Fetch vendors, estimates, and estimate items BEFORE opening the modal
  // This ensures the vendor name loads immediately and estimate items are available
  try {
    await Promise.allSettled([
      typeof (purchaseOrderListResourcesStore as any).ensureVendors === 'function'
        ? (purchaseOrderListResourcesStore as any).ensureVendors({
            corporationUuid: appliedFilters.value.corporation,
          })
        : Promise.resolve([]),
      // Also fetch project addresses if needed
      projectAddressesStore.fetchAddresses(appliedFilters.value.project),
      // Fetch estimates for the project (required for IMPORT_ITEMS_FROM_ESTIMATE mode)
      purchaseOrderResourcesStore.ensureEstimates({
        corporationUuid: appliedFilters.value.corporation,
        force: true,
      }),
    ])
    
    // After estimates are loaded, fetch estimate items if we have an estimate UUID
    // This ensures the form doesn't try to fetch them again when it opens
    const estimates = purchaseOrderResourcesStore.getEstimatesByProject(
      appliedFilters.value.corporation,
      appliedFilters.value.project
    ) || []
    
    // Get the latest approved estimate
    const latestEstimate = estimates
      .filter((est: any) => est.status === 'Approved' && est.is_active !== false)
      .sort((a: any, b: any) => {
        const dateA = a.estimate_date ? new Date(a.estimate_date).getTime() : 0
        const dateB = b.estimate_date ? new Date(b.estimate_date).getTime() : 0
        return dateB - dateA
      })[0]
    
    if (latestEstimate?.uuid) {
      // Pre-fetch estimate items so they're available when the form opens
      await purchaseOrderResourcesStore.ensureEstimateItems({
        corporationUuid: appliedFilters.value.corporation,
        projectUuid: appliedFilters.value.project,
        estimateUuid: latestEstimate.uuid,
        force: true,
      })
    }
  } catch (error) {
    console.error('Error fetching vendors, addresses, or estimates:', error)
    // Continue anyway - the form will handle loading in onMounted
  }

  let projectIdForForm = ''
  if (appliedFilters.value.corporation && appliedFilters.value.project) {
    const listProjects = purchaseOrderListResourcesStore.getProjects(appliedFilters.value.corporation) || []
    const project =
      listProjects.find((p: any) => p.uuid === appliedFilters.value.project) ||
      (projectsStore.projects || []).find((p: any) => p.uuid === appliedFilters.value.project)
    if (project?.project_id) {
      projectIdForForm = String(project.project_id)
    }
  }
  
  // Initialize form with pre-filled data
  poForm.value = {
    corporation_uuid: appliedFilters.value.corporation,
    project_uuid: appliedFilters.value.project,
    project_id: projectIdForForm,
    vendor_uuid: vendorUuid,
    entry_date: toUTCString(getCurrentLocal()),
    po_type: 'MATERIAL',
    po_type_uuid: 'MATERIAL',
    credit_days: '',
    credit_days_id: null,
    ship_via: '',
    freight: '',
    shipping_instructions: '',
    estimated_delivery_date: '',
    include_items: 'IMPORT_ITEMS_FROM_ESTIMATE', // Set to IMPORT_ITEMS_FROM_ESTIMATE since items are from estimates
    terms_and_conditions: 'Not Required',
    is_revised: false,
    revision_number: '',
    revision_notes: '',
    revision_date: null,
    status: 'Draft',
    item_total: 0,
    freight_charges_percentage: 0,
    freight_charges_amount: 0,
    freight_charges_taxable: false,
    packing_charges_percentage: 0,
    packing_charges_amount: 0,
    packing_charges_taxable: false,
    custom_duties_percentage: 0,
    custom_duties_amount: 0,
    custom_duties_taxable: false,
    other_charges_percentage: 0,
    other_charges_amount: 0,
    other_charges_taxable: false,
    charges_total: 0,
    sales_tax_1_percentage: 0,
    sales_tax_1_amount: 0,
    sales_tax_2_percentage: 0,
    sales_tax_2_amount: 0,
    tax_total: 0,
    total_po_amount: 0,
    po_items: poItems, // Pre-populate with selected items
    attachments: [],
    removed_po_items: []
  }
  
  // Reset validation state
  isFormValid.value = false
  isViewMode.value = false
  
  // Open the form modal
  showFormModal.value = true
  
  // Clear selected rows after opening the form
  selectedItemsTableRows.value = {}
}

// Items Table columns (for the main Show button functionality)
const itemsTableColumns: TableColumn<any>[] = [
  {
    id: 'select',
    header: ({ table }: { table: any }) => {
      const UCheckbox = resolveComponent('UCheckbox')
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return h(UCheckbox, {
        modelValue: isAllSelected ? true : isSomeSelected ? 'indeterminate' : false,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
          table.toggleAllPageRowsSelected(!!value)
        },
        'aria-label': 'Select all'
      })
    },
    enableSorting: false,
    enableHiding: false,
    meta: { class: { th: 'w-12', td: 'w-12' } },
    cell: ({ row }: { row: any }) => {
      const UCheckbox = resolveComponent('UCheckbox')
      return h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
          row.toggleSelected(!!value)
        },
        'aria-label': 'Select row'
      })
    }
  },
  {
    accessorKey: 'cost_code_label',
    header: 'Cost Code',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.cost_code_label || 'N/A')
  },
  {
    accessorKey: 'estimate_preferred_vendor_name',
    header: 'Preferred vendor',
    enableSorting: false,
    size: 140,
    meta: {
      class: {
        th: 'text-left whitespace-nowrap',
        td: 'text-left break-words',
      },
    },
    cell: ({ row }: { row: { original: any } }) =>
      h(
        'div',
        { class: 'break-words', style: { minWidth: '100px', maxWidth: '160px' } },
        row.original.estimate_preferred_vendor_name || 'N/A'
      ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    enableSorting: false,
    meta: { class: { th: 'text-left whitespace-nowrap', td: 'text-left whitespace-nowrap' } },
    cell: ({ row }: { row: { original: any } }) => {
      const raw = row.original.category
      return h('div', raw ? getCategoryLabel(String(raw)) : 'N/A')
    },
  },
  {
    accessorKey: 'spec_type',
    header: 'Spec Type',
    enableSorting: false,
    meta: { class: { th: 'text-left whitespace-nowrap', td: 'text-left whitespace-nowrap' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.spec_type || 'N/A')
  },
  {
    accessorKey: 'item_type_label',
    header: 'Type',
    enableSorting: false,
    size: 100,
    meta: { 
      class: { 
        th: 'text-left', 
        td: 'text-left break-words' 
      } 
    },
    cell: ({ row }: { row: { original: any } }) => h('div', { 
      class: 'break-words',
      style: { minWidth: '80px', maxWidth: '100px' }
    }, row.original.item_type_label || 'N/A')
  },
  {
    accessorKey: 'sequence',
    header: 'SPEC',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      // Ensure sequence is displayed as string to preserve leading zeros
      const sequence = row.original.sequence;
      if (sequence === null || sequence === undefined || sequence === '') {
        return h('div', 'N/A');
      }
      // Convert to string to preserve leading zeros (e.g., "001", "002", "003")
      return h('div', String(sequence));
    }
  },
  {
    accessorKey: 'item_name',
    header: 'Item',
    enableSorting: false,
    size: 150,
    meta: { 
      class: { 
        th: 'text-left', 
        td: 'text-left break-words' 
      } 
    },
    cell: ({ row }: { row: { original: any } }) => h('div', { 
      class: 'break-words',
      style: { minWidth: '120px', maxWidth: '150px' }
    }, row.original.item_name || row.original.description || 'N/A')
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => renderDescriptionCell(row.original.description)
  },
  {
    accessorKey: 'location',
    header: 'Location',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) =>
      h('div', getLocationDisplayLabel(row.original) || 'N/A')
  },
  {
    id: 'budget_qty',
    accessorKey: 'budget_qty',
    header: 'Budget Qty',
    enableSorting: false,
    size: 88,
    meta: {
      class: {
        th: 'create-po-qty-col text-right whitespace-nowrap border-l border-gray-200 dark:border-gray-700',
        td: 'create-po-qty-col text-right whitespace-nowrap border-l border-gray-200 dark:border-gray-700',
      },
    },
    cell: ({ row }: { row: { original: any } }) => {
      const qty = row.original.budget_qty || 0
      return h('div', { class: 'text-right tabular-nums' }, String(qty))
    }
  },
  {
    id: 'po_qty',
    accessorKey: 'po_qty',
    header: 'PO Qty',
    enableSorting: false,
    size: 72,
    meta: {
      class: {
        th: 'create-po-qty-col text-right whitespace-nowrap',
        td: 'create-po-qty-col text-right whitespace-nowrap',
      },
    },
    cell: ({ row }: { row: { original: any } }) => {
      const qty = row.original.po_qty || 0
      return h('div', { class: 'text-right tabular-nums' }, String(qty))
    }
  },
  {
    id: 'pending_qty',
    accessorKey: 'pending_qty',
    header: 'Pending Qty',
    enableSorting: false,
    size: 88,
    meta: {
      class: {
        th: 'create-po-qty-col text-right whitespace-nowrap',
        td: 'create-po-qty-col text-right whitespace-nowrap',
      },
    },
    cell: ({ row }: { row: { original: any } }) => {
      const qty = row.original.pending_qty || 0
      return h('div', { class: 'text-right tabular-nums font-medium' }, String(qty))
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    size: 96,
    meta: {
      class: {
        th: 'text-left whitespace-nowrap pl-3',
        td: 'text-left whitespace-nowrap pl-3',
      },
    },
    cell: ({ row }: { row: { original: any } }) => {
      const status = row.original.status || 'Pending'
      const isPartial = status === 'Partial'
      return h(UBadge, {
        color: isPartial ? 'warning' : 'orange',
        variant: 'solid',
        size: 'sm'
      }, () => status)
    }
  }
]

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

// Table columns configuration
const columns: TableColumn<any>[] = [
  {
    id: 'expand',
    header: '',
    enableSorting: false,
    cell: ({ row }: { row: { original: any; id?: string } }) => {
      // Don't show expand button for labor purchase orders
      const poType = String(row.original.po_type || '').toUpperCase()
      const isLaborPO = poType === 'LABOR'
      
      if (isLaborPO) {
        // Return empty div for labor POs
        return h('div', { class: 'w-6' }) // Maintain spacing
      }
      
      const rowId = (row.id || row.original.uuid) as string
      const isExpanded = expanded.value[rowId] || false
      return h(UButton, {
        color: 'primary',
        variant: isExpanded ? 'solid' : 'soft',
        icon: isExpanded ? 'i-heroicons-chevron-down-solid' : 'i-heroicons-chevron-right-solid',
        size: 'xs',
        square: true,
        class: 'transition-transform',
        onClick: () => {
          expanded.value[rowId] = !expanded.value[rowId]
          // Always fetch fresh PO items from API when expanding to ensure latest data
          // This is important when items are created/updated from other components
          if (expanded.value[rowId] && row.original.uuid) {
            fetchPOItemsForRow(row.original.uuid, true) // Force refresh to get latest data
          }
        }
      })
    }
  },
  {
    accessorKey: 'po_number',
    header: ({ column }) => getHeader(column, 'PO Number'),
    enableSorting: true,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', { class: 'font-medium text-default' }, row.original.po_number || 'N/A')
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
    cell: ({ row }: { row: { original: any } }) => {
      const uuid = (row.original.vendor_uuid || '').toLowerCase()
      const name = (uuid && vendorNameByUuid.value[uuid]) || row.original.vendor_name || 'N/A'
      return h('div', name)
    }
  },
  {
    accessorKey: 'entry_date',
    header: 'Entry Date',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', formatDate(row.original.entry_date))
  },
  {
    accessorKey: 'ship_via',
    header: 'Shipped Via',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const uuid = row.original.ship_via
      const label = uuid ? (shipViaNameByUuid.value[uuid] || uuid) : 'N/A'
      return h('div', label)
    }
  },
  {
    accessorKey: 'shipping_address_uuid',
    header: 'Shipped To',
    enableSorting: false,
    meta: { class: { th: 'text-center', td: 'text-center' } },
    cell: ({ row }: { row: { original: any } }) => {
      const poUuid = row.original.uuid
      const shippingAddressUuid = row.original.shipping_address_uuid
      const isOpen = shippingAddressPopoverOpen.value[poUuid] || false
      
      if (!shippingAddressUuid) {
        return h('div', { class: 'flex justify-center' }, 'N/A')
      }
      
      return h('div', { class: 'flex justify-center' }, [
        h(UPopover, {
          open: isOpen,
          'onUpdate:open': (value: boolean) => {
            shippingAddressPopoverOpen.value[poUuid] = value
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
    accessorKey: 'po_type',
    header: 'PO Type',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => h('div', row.original.po_type || 'N/A')
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: false,
    meta: { class: { th: 'text-left', td: 'text-left' } },
    cell: ({ row }: { row: { original: any } }) => {
      const rawStatus = row.original.status || 'Draft';
      // Normalize status for case-insensitive matching (handle both Partially_Received and Partially_received)
      const normalizedStatus = String(rawStatus).toLowerCase();
      
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
          label: 'Purchase order rejected',
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
      };
      
      const config = statusMap[normalizedStatus] ?? {
        label: rawStatus,
        color: 'neutral'
      };
      
      return h(UBadge, {
        color: config.color,
        variant: 'soft',
        size: 'sm'
      }, () => config.label)
    }
  },
  {
    accessorKey: 'total_po_amount',
    header: 'Total Amount',
    enableSorting: false,
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }: { row: { original: any } }) => {
      const amount = row.original.total_po_amount || 0;
      const formattedAmount = formatCurrency(amount);
      return h('div', { class: 'text-right font-mono text-sm' }, formattedAmount);
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-32', td: 'text-right sticky right-0 w-32' } },
    cell: ({ row }: { row: { original: any } }) => {
      const isRowLoading = loadingRowUuid.value === row.original.uuid
      const buttons = [];
      
      if (isRowLoading) {
        buttons.push(
          h(UIcon, {
            name: 'i-heroicons-arrow-path',
            class: 'w-4 h-4 animate-spin text-primary'
          })
        )
      } else {
        // View button - show if user has view permission
        if (hasPermission('po_view')) {
          buttons.push(
            h(UTooltip, { text: 'View Purchase Order Details' }, () => [
              h(UButton, {
                icon: 'i-heroicons-eye-solid',
                size: 'xs',
                variant: 'soft',
                color: 'neutral',
                class: 'hover:scale-105 transition-transform',
                onClick: () => previewPurchaseOrder(row.original)
              }, () => '')
            ])
          );
        }
        
        // Edit button - show if user has edit permission
        if (hasPermission('po_edit')) {
          buttons.push(
            h(UTooltip, { text: 'Edit Purchase Order' }, () => [
              h(UButton, {
                icon: 'tdesign:edit-filled',
                size: 'xs',
                variant: 'soft',
                color: 'secondary',
                class: 'hover:scale-105 transition-transform',
                onClick: () => editPurchaseOrder(row.original)
              }, () => '')
            ])
          );
        }
        
        // Delete button - show if user has delete permission
        if (hasPermission('po_delete')) {
          buttons.push(
            h(UTooltip, { text: 'Delete Purchase Order' }, () => [
              h(UButton, {
                icon: 'mingcute:delete-fill',
                size: 'xs',
                variant: 'soft',
                color: 'error',
                class: 'hover:scale-105 transition-transform',
                onClick: () => deletePurchaseOrder(row.original)
              }, () => '')
            ])
          );
        }
      }
      
      return h('div', { class: 'flex justify-end space-x-2 items-center' }, buttons);
    }
  }
];

// Methods
const toggleStatusFilter = async (status: string) => {
  if (selectedStatusFilter.value === status) {
    selectedStatusFilter.value = null
  } else {
    selectedStatusFilter.value = status
    // If switching to ToBeRaised, fetch items when corporation and project are selected (vendor is optional)
    if (status === 'ToBeRaised' && appliedFilters.value.corporation && appliedFilters.value.project) {
      await fetchItemsTableData()
      // Also fetch legacy items if vendor is set (optional)
      if (appliedFilters.value.vendor) {
        fetchToBeRaisedItems()
      }
    }
  }
}

const togglePendingStatusFilter = () => {
  if (selectedStatusFilter.value === 'Pending') {
    selectedStatusFilter.value = null
  } else {
    selectedStatusFilter.value = 'Pending'
  }
}

const clearStatusFilter = () => {
  selectedStatusFilter.value = null
  // Clear filters except corporation when clicking on summary
  // Preserve corporation filter when switching between status tiles
  const preservedCorporation = filterCorporation.value
  
  // Clear filter inputs (except corporation)
  filterProject.value = undefined
  filterVendor.value = undefined
  filterLocation.value = undefined
  filterStatus.value = null
  filterCategory.value = undefined
  filterDivision.value = undefined
  filterItemType.value = undefined
  filterDateFrom.value = undefined
  filterDateTo.value = undefined
  
  // Clear applied filters (except corporation)
  appliedFilters.value = {
    corporation: preservedCorporation, // Preserve corporation
    project: undefined,
    vendor: undefined,
    location: undefined,
    status: undefined,
    category: undefined,
    division: undefined,
    itemType: undefined,
    dateFrom: undefined,
    dateTo: undefined
  }
  
  // Fetch all purchase orders for the preserved corporation when filters are cleared
  const corporationUuid = preservedCorporation || selectedCorporationId.value
  if (corporationUuid) {
    purchaseOrdersStore.fetchPurchaseOrders(corporationUuid, { force: true })
  }
  
  // Clear to be raised items
  toBeRaisedItems.value = []
}

// Status display helpers for form modal
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    draft: 'Pending',
    ready: 'To be approved',
    approved: 'Purchase order approved',
    rejected: 'Purchase order rejected',
    partially_received: 'Partially Received',
    completed: 'Completed',
  };
  const status = String(poForm.value?.status || 'Draft').toLowerCase();
  return map[status] || poForm.value?.status || 'Draft';
});

const statusChipClass = computed(() => {
  const map: Record<string, string> = {
    draft:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
    ready:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    approved:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    rejected:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    partially_received:
      'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700',
    completed:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  };
  const status = String(poForm.value?.status || 'Draft').toLowerCase();
  return map[status] || map.draft;
});

const getStatusBadgeColor = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    Draft: 'gray',
    Ready: 'blue',
    Approved: 'green',
    Rejected: 'red',
    Partially_Received: 'cyan',
    Completed: 'green',
  };
  return statusMap[status || 'Draft'] || 'gray';
};

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

const refreshFreightAndShipViaForNimble = async () => {
  if (!nimbleIntegrationsEnabled) return
  await Promise.allSettled([
    shipViaStore.fetchShipVia(true),
    freightStore.fetchFreight(true),
  ])
}

// Purchase orders are fetched by TopBar.vue when corporation changes
// This component just reads from the store reactively

const openCreateModal = async () => {
  if (!hasPermission('po_create')) {
    try {
      const toast = useToast();
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to create purchase orders.",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    } catch (error) {
      // Error showing toast
    }
    return;
  }
  
  // Clear previous PO resources before opening new form
  purchaseOrderResourcesStore.clear()
  await refreshFreightAndShipViaForNimble()

  poHasLinkedVendorInvoices.value = false
  poForm.value = {
    corporation_uuid: corporationStore.selectedCorporationId,
    entry_date: toUTCString(getCurrentLocal()),
    po_type: '',
    po_type_uuid: '',
    credit_days: '',
    credit_days_id: null,
    ship_via: '',
    freight: '',
    shipping_instructions: '',
    estimated_delivery_date: '',
    include_items: '',
    quote_reference: '',
    terms_and_conditions: 'Not Required',
    is_revised: false,
    revision_number: '',
    revision_notes: '',
    revision_date: null,
    status: 'Draft',
    item_total: 0,
    freight_charges_percentage: 0,
    freight_charges_amount: 0,
    freight_charges_taxable: false,
    packing_charges_percentage: 0,
    packing_charges_amount: 0,
    packing_charges_taxable: false,
    custom_duties_percentage: 0,
    custom_duties_amount: 0,
    custom_duties_taxable: false,
    other_charges_percentage: 0,
    other_charges_amount: 0,
    other_charges_taxable: false,
    charges_total: 0,
    sales_tax_1_percentage: 0,
    sales_tax_1_amount: 0,
    sales_tax_2_percentage: 0,
    sales_tax_2_amount: 0,
    tax_total: 0,
    total_po_amount: 0,
    po_items: [],
    attachments: [],
    removed_po_items: [],
    ...PO_CURRENCY_CONVERSION_DEFAULTS,
  }
  // Reset validation state - form will be invalid initially
  isFormValid.value = false
  showFormModal.value = true
}

const loadPurchaseOrderForModal = async (po: any, viewMode: boolean = false) => {
  if (!po?.uuid) {
    return
  }

  // Clear previous PO resources before loading a different PO
  purchaseOrderResourcesStore.clear()
  await refreshFreightAndShipViaForNimble()

  poHasLinkedVendorInvoices.value = null

  // Set initial form data from row
  poForm.value = { ...po }
  isViewMode.value = viewMode
  
  // Open modal immediately
  showFormModal.value = true
  loadingEditPO.value = true
  loadingRowUuid.value = po.uuid
  
  try {
    const detailed = await purchaseOrdersStore.fetchPurchaseOrder(po.uuid)
    if (!detailed) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description: "Failed to load purchase order details.",
        color: "error",
      });
      return;
    }

    // Cast to any to access audit_log which may not be in the type definition
    const detailedAny = detailed as any;
    poForm.value = {
      ...detailed,
      ...normalizePoCurrencyConversionFields(detailed as Record<string, unknown>),
      po_type: detailed.po_type || "",
      po_type_uuid: detailed.po_type_uuid || "",
      credit_days: detailed.credit_days || "",
      credit_days_id: detailed.credit_days_id || null,
      include_items: detailed.include_items || "",
      quote_reference: detailed.quote_reference || "",
      po_items: detailed.po_items || [],
      attachments: detailed.attachments || [],
      removed_po_items: detailed.removed_po_items || [],
      audit_log: Array.isArray(detailedAny.audit_log) ? detailedAny.audit_log : [],
    };

    try {
      const check = await $fetch<{ data: { hasVendorInvoices: boolean } }>(
        "/api/vendor-invoices/check-purchase-order",
        { query: { purchase_order_uuid: po.uuid } }
      );
      poHasLinkedVendorInvoices.value = !!check?.data?.hasVendorInvoices;
    } catch {
      poHasLinkedVendorInvoices.value = false;
    }
  } catch (error) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to load purchase order details.",
      color: "error",
    });
  } finally {
    loadingEditPO.value = false;
    loadingRowUuid.value = null;
  }
}

const editPurchaseOrder = async (po: any) => {
  if (!hasPermission('po_edit')) {
    try {
      const toast = useToast();
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to edit purchase orders.",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    } catch (error) {
      // Error showing toast
    }
    return;
  }
  await loadPurchaseOrderForModal(po, false)
}

const switchToEditMode = () => {
  if (!hasPermission('po_edit')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to edit purchase orders.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  isViewMode.value = false
}

const closeFormModal = () => {
  purchaseOrderResourcesStore.clear()
  // Do NOT clear shipVia/freight here — the list needs them to resolve display names.
  // They will be force-refreshed next time the form opens via refreshFreightAndShipViaForNimble().
  showFormModal.value = false
  isViewMode.value = false
  poForm.value = {
    po_items: [],
    attachments: [],
    removed_po_items: []
  }
  poHasLinkedVendorInvoices.value = null
  loadingEditPO.value = false
  loadingRowUuid.value = null
  // Reset validation state
  isFormValid.value = true
}

// Print handler
const handlePrintPurchaseOrder = () => {
  if (!poForm.value?.uuid) return
  if (!hasPermission('po_view')) {
    const toast = useToast()
    toast.add({
      title: 'Access Denied',
      description: "You don't have permission to view purchase orders.",
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
    return
  }
  openPurchaseOrderPrint(poForm.value.uuid)
}

const openSendPurchaseOrderEmailModal = () => {
  if (!poForm.value?.uuid) return
  if (!hasPermission('po_view')) {
    const toast = useToast()
    toast.add({
      title: 'Access Denied',
      description: "You don't have permission to view purchase orders.",
      color: 'error',
      icon: 'i-heroicons-x-circle',
    })
    return
  }

  // Ensure vendor emails are available (vendor email is resolved from vendorStore).
  const corp = poForm.value.corporation_uuid
  if (corp && poForm.value.vendor_uuid) {
    const ensureVendors = (purchaseOrderListResourcesStore as any).ensureVendors
    if (typeof ensureVendors === 'function') {
      ensureVendors({
        corporationUuid: String(corp),
      }).catch(() => {})
    }
  }

  sendEmailPoUuid.value = poForm.value.uuid
  showSendPoEmailModal.value = true
}

// Used quantities tracking for quantity availability checks
const usedQuantitiesByItem = ref<Record<string, number>>({})
const loadingQuantityAvailability = ref(false)

// Fetch used quantities from existing purchase orders for the estimate
const fetchUsedQuantities = async () => {
  const includeItems = String(poForm.value?.include_items || '').toUpperCase()
  const poType = String(poForm.value?.po_type || '').toUpperCase()
  const isLaborPO = poType === 'LABOR'
  
  // Only fetch for material POs importing from estimate or labor POs
  const checkMaterialPOs = includeItems === 'IMPORT_ITEMS_FROM_ESTIMATE'
  const checkLaborPOs = isLaborPO
  
  if (!checkMaterialPOs && !checkLaborPOs) {
    usedQuantitiesByItem.value = {}
    return
  }

  const corpUuid = poForm.value?.corporation_uuid || corporationStore.selectedCorporationId
  const projectUuid = poForm.value?.project_uuid
  const estimateUuid = latestEstimate.value?.uuid

  if (!corpUuid || !projectUuid || !estimateUuid) {
    usedQuantitiesByItem.value = {}
    return
  }

  loadingQuantityAvailability.value = true
  try {
    // Always exclude the current PO if it has a UUID (for both new and existing POs)
    // This ensures that when checking quantities, we don't double-count the current PO
    const excludePoUuid = poForm.value?.uuid || null
    
    const response: any = await $fetch("/api/estimate-quantity-availability", {
      method: "GET",
      query: {
        corporation_uuid: corpUuid,
        project_uuid: projectUuid,
        estimate_uuid: estimateUuid,
        exclude_po_uuid: excludePoUuid || undefined, // Exclude current PO when editing (use undefined instead of null)
      },
    })

    // Normalize keys to lowercase to match lookup in POItemsTableWithEstimates
    usedQuantitiesByItem.value = normalizeUsedQuantitiesByItem(response?.data)
  } catch (error: any) {
    console.error("Failed to fetch used quantities:", error)
    usedQuantitiesByItem.value = {}
  } finally {
    loadingQuantityAvailability.value = false
  }
}

// Check for items exceeding estimate quantities
const checkForExceededQuantities = async (): Promise<{ hasExceeded: boolean; items: any[] }> => {
  const includeItems = String(poForm.value?.include_items || '').toUpperCase()
  const poType = String(poForm.value?.po_type || '').toUpperCase()
  const isLaborPO = poType === 'LABOR'
  
  // Check material POs when importing from estimate
  const checkMaterialPOs = includeItems === 'IMPORT_ITEMS_FROM_ESTIMATE'
  // Check labor POs - labor POs always use estimate (no raise_against field needed)
  const checkLaborPOs = isLaborPO
  
  // Check location-wise material items (manual material estimate)
  const hasLwmItems = Array.isArray(poForm.value?.po_location_wise_material_items) &&
    poForm.value.po_location_wise_material_items.length > 0
  
  // Only check if creating against estimate or has LWM items
  if (!checkMaterialPOs && !checkLaborPOs && !hasLwmItems) {
    return { hasExceeded: false, items: [] }
  }
  
  // Get estimate items to use as source of truth for estimate quantities
  // This ensures we're using the actual estimate quantities, not potentially modified values from PO items
  const corpUuid = poForm.value?.corporation_uuid || corporationStore.selectedCorporationId

  // Fetch used quantities first
  await fetchUsedQuantities()

  const projectUuid = poForm.value?.project_uuid
  const estimateUuid = latestEstimate.value?.uuid
  const costCodeConfigMap = new Map<string, { cost_code_number?: string; cost_code_name?: string; cost_code_label?: string }>()

  const buildCostCodeConfigMap = (configs: any[]) => {
    configs.forEach((cfg: any) => {
      const uuid = String(cfg?.uuid || cfg?.cost_code_uuid || '').trim()
      if (!uuid) return
      const number = String(cfg?.cost_code_number || '').trim()
      const name = String(cfg?.cost_code_name || '').trim()
      const label =
        String(cfg?.cost_code_label || '').trim() ||
        [number, name].filter(Boolean).join(' ').trim()
      costCodeConfigMap.set(uuid, {
        cost_code_number: number,
        cost_code_name: name,
        cost_code_label: label,
      })
    })
  }
  
  // Ensure estimate items are loaded
  if (corpUuid && projectUuid && estimateUuid) {
    await purchaseOrderResourcesStore.ensureEstimateItems({
      corporationUuid: corpUuid,
      projectUuid: projectUuid,
      estimateUuid: estimateUuid,
    })
  }

  if (corpUuid && projectUuid) {
    const ensureCostCodeConfigurations = (purchaseOrderResourcesStore as any).ensureCostCodeConfigurations
    if (typeof ensureCostCodeConfigurations === 'function') {
      const maybePromise = ensureCostCodeConfigurations({
        corporationUuid: corpUuid,
        projectUuid: projectUuid,
      })
      if (maybePromise && typeof maybePromise.then === 'function') {
        await maybePromise.catch(() => {})
      }
    }
    const getCostCodeConfigurations = (purchaseOrderResourcesStore as any).getCostCodeConfigurations
    const scopedConfigs =
      typeof getCostCodeConfigurations === 'function'
        ? getCostCodeConfigurations(corpUuid, projectUuid) || []
        : []
    buildCostCodeConfigMap(scopedConfigs)
  }
  
  const estimateItems = purchaseOrderResourcesStore.getEstimateItems(
    corpUuid || '',
    projectUuid || '',
    estimateUuid || ''
  ) || []
  
  // Build a lookup map of estimate items by composite key (item_uuid-cost_code_uuid) for quick access
  const estimateItemsMap = new Map<string, any>()
  estimateItems.forEach((estItem: any) => {
    if (estItem?.item_uuid && estItem?.cost_code_uuid) {
      const compositeKey = `${String(estItem.item_uuid).toLowerCase()}-${String(estItem.cost_code_uuid).toLowerCase()}`
      estimateItemsMap.set(compositeKey, estItem)
    }
  })
  
  const exceeded: any[] = []
  
  // Check material items - account for used quantities from other POs
  if (checkMaterialPOs) {
    const poItems = Array.isArray(poForm.value?.po_items) ? poForm.value.po_items : []
    
    poItems.forEach((item: any) => {
      const itemUuid = item?.item_uuid
      const costCodeUuid = item?.cost_code_uuid
      if (!itemUuid || !costCodeUuid) return

      // Use composite key: item_uuid-cost_code_uuid
      const compositeKey = `${String(itemUuid).toLowerCase()}-${String(costCodeUuid).toLowerCase()}`

      // Get estimate quantity from estimate items map (source of truth)
      // Fallback to item.quantity only if estimate item is not found
      const estimateItem = estimateItemsMap.get(compositeKey)
      const estimateQty = estimateItem
        ? parseFloat(String(estimateItem.quantity || 0))
        : parseFloat(String(item.quantity || 0))

      const poQty = parseFloat(String(item.po_quantity || 0))
      const usedQuantity = usedQuantitiesByItem.value[compositeKey] || 0
      const totalQuantity = usedQuantity + poQty

      if (totalQuantity > estimateQty && estimateQty > 0) {
        const estimateCostCodeNumber = estimateItem?.cost_code_number || ''
        const estimateCostCodeName = estimateItem?.cost_code_name || ''
        const estimateCostCodeLabel = estimateItem?.cost_code_label || ''
        const itemCostCodeNumber = item.cost_code_number || ''
        const itemCostCodeName = item.cost_code_name || ''
        const rawCostCodeLabel = item.cost_code_label || ''
        const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          String(rawCostCodeLabel || '').trim()
        )
        const costCodeNumber = itemCostCodeNumber || estimateCostCodeNumber
        const costCodeName = itemCostCodeName || estimateCostCodeName
        const mappedConfig = costCodeConfigMap.get(String(costCodeUuid || '').trim())
        const costCodeLabel =
          (!looksLikeUuid && rawCostCodeLabel) ||
          [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim() ||
          mappedConfig?.cost_code_label ||
          [mappedConfig?.cost_code_number, mappedConfig?.cost_code_name].filter(Boolean).join(' ').trim() ||
          estimateCostCodeLabel ||
          'Unknown Cost Code'

        exceeded.push({
          ...item,
          cost_code_uuid: costCodeUuid,
          cost_code_number: costCodeNumber || mappedConfig?.cost_code_number || '',
          cost_code_name: costCodeName || mappedConfig?.cost_code_name || '',
          cost_code_label: costCodeLabel,
          estimate_quantity: estimateQty,
          po_quantity: poQty,
          used_quantity: usedQuantity,
          total_quantity: totalQuantity,
          exceeded_quantity: totalQuantity - estimateQty,
          item_type: 'material',
        })
      }
    })
  }
  
  // Check labor items - labor POs always use estimate
  if (checkLaborPOs) {
    const laborItems = Array.isArray(poForm.value?.labor_po_items) ? poForm.value.labor_po_items : []
    
    laborItems.forEach((item: any) => {
      const estimateAmount = parseFloat(String(item.labor_budgeted_amount || 0))
      const poAmount = parseFloat(String(item.po_amount || 0))
      const priorCommitted = parseFloat(String(
        item.prior_committed_po_amount ??
        item.metadata?.prior_committed_po_amount ??
        0
      ))
      const totalCommitted = priorCommitted + poAmount
      const locationLabel =
        item.location_label ||
        item.metadata?.location_label ||
        item.metadata?.location_display ||
        item.location ||
        ''
      
      if (totalCommitted > estimateAmount && estimateAmount > 0) {
        exceeded.push({
          ...item,
          estimate_amount: estimateAmount,
          labor_budgeted_amount: estimateAmount,
          po_amount: poAmount,
          prior_committed_po_amount: priorCommitted,
          total_committed_amount: totalCommitted,
          exceeded_amount: totalCommitted - estimateAmount,
          location_label: locationLabel,
          item_type: 'labor',
        })
      }
    })
  }
  
  // Check location-wise material items (manual material estimate with location breakdown)
  if (hasLwmItems) {
    const lwmItems = poForm.value.po_location_wise_material_items || []
    
    lwmItems.forEach((item: any) => {
      const budgetedAmount = parseFloat(String(item.material_budgeted_amount || 0))
      const poAmount = parseFloat(String(item.po_amount || 0))
      
      if (poAmount > budgetedAmount && budgetedAmount > 0) {
        const costCodeLabel = item.cost_code_label ||
          [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim() ||
          'Unknown Cost Code'
        
        exceeded.push({
          ...item,
          cost_code_label: costCodeLabel,
          estimate_amount: budgetedAmount,
          material_budgeted_amount: budgetedAmount,
          po_amount: poAmount,
          exceeded_amount: poAmount - budgetedAmount,
          item_type: 'lwm',
        })
      }
    })
  }
  
  return {
    hasExceeded: exceeded.length > 0,
    items: exceeded,
  }
}

// Status-based save handlers
// All status changes (Draft, Ready, Approved) go through the same validation flow:
// 1. Check for exceeded quantities (unless skipValidation is true)
// 2. If exceeded, show modal to allow user to raise change order or continue
// 3. If not exceeded, save directly
const submitWithStatus = async (
  status: 'Draft' | 'Ready' | 'Approved',
  openNewForm = false,
  skipValidation = false,
  skipModalClose = false
) => {
  if (savingPO.value) return

  const previousStatus = poForm.value.status
  const saveWithRequestedStatus = async () => {
    poForm.value.status = status
    const result = await savePurchaseOrder(!openNewForm)
    if (!result) {
      poForm.value.status = previousStatus
    }
    return result
  }
  
  // Check for exceeded quantities before saving (for both new and existing POs)
  // This allows users to raise a change order for the difference
  // This validation applies to ALL status changes: Draft, Ready, and Approved
  // Skip validation when rejecting (skipValidation = true)
  if (!skipValidation) {
    const { hasExceeded, items } = await checkForExceededQuantities()
    
    if (hasExceeded) {
      exceededItems.value = items
      pendingSaveStatus.value = status
      pendingSaveAction.value = async () => {
        const saveResult = await saveWithRequestedStatus()
        if (saveResult) {
          if (openNewForm) {
            openCreateModal()
          } else {
            // Close modal only for normal flows; keep it open when "revising"
            if (!skipModalClose) closeFormModal()
          }
        }
      }
      showExceededQuantityModal.value = true
      return
    }
  }
  
  const result = await saveWithRequestedStatus()
  if (result) {
    if (openNewForm) {
      openCreateModal()
    } else {
      // Close modal only for normal flows; keep it open when "revising"
      if (!skipModalClose) closeFormModal()
    }
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
// When rejecting Approved status, skip validation
const handleSaveAsDraft = () => {
  // If rejecting from Approved status, skip validation
  const isRejecting = poForm.value?.status === 'Approved'
  if (isRejecting) {
    // When "Revise" is clicked we set status back to Draft and auto-check revision fields.
    poForm.value.status = 'Draft'
    poForm.value.is_revised = true
    poForm.value.revision_date = toUTCString(getCurrentLocal())
  }
  submitWithStatus('Draft', false, isRejecting, isRejecting)
}
const handleMarkReady = () => submitWithStatus('Ready', false)
const handleApprove = async () => {
  await submitWithStatus('Approved', false)
}
const handleApproveAndRaise = async () => {
  await submitWithStatus('Approved', false)
}
const handleRejectToDraft = () => {
  // When "Revise" is clicked we set status back to Draft and auto-check revision fields.
  poForm.value.is_revised = true
  poForm.value.revision_date = toUTCString(getCurrentLocal())
  submitWithStatus('Draft', false, true, true) // Skip validation and modal close when revising
}

const handleRejectToPending = () => {
  // Pending in this module is represented by Draft status.
  // This follows the same save/update flow as other actions.
  submitWithStatus('Draft', false)
}

/**
 * Same resolution as PurchaseOrderForm.vue `selectedProjectId`: use explicit `project_id`
 * on the form, else look up by `project_uuid` in list resources then global projects store.
 * Ensures PO number / revision prefixes persist on save when only `project_uuid` is set
 * (e.g. "Raise PO for pending QTY" pre-fill).
 */
const resolveProjectIdForPoPrefix = (): string => {
  const explicit = poForm.value?.project_id
  if (explicit != null && String(explicit).trim() !== '') {
    return String(explicit).trim()
  }
  const projectUuid = poForm.value?.project_uuid
  if (!projectUuid) return ''
  const corpUuid = poForm.value.corporation_uuid || corporationStore.selectedCorporationId
  if (!corpUuid) return ''
  const listProjects = purchaseOrderListResourcesStore.getProjects(corpUuid) || []
  const fromList = listProjects.find((p: any) => p.uuid === projectUuid)
  if (fromList?.project_id) return String(fromList.project_id).trim()
  const fromGlobal = (projectsStore.projects || []).find((p: any) => p.uuid === projectUuid)
  return fromGlobal?.project_id ? String(fromGlobal.project_id).trim() : ''
}

const savePurchaseOrder = async (skipModalClose = false): Promise<any | null> => {
  // Determine the correct corporation_uuid to use
  // For new POs: use poForm.value.corporation_uuid (from form selector) or fallback to TopBar's selected
  // For editing: use poForm.value.corporation_uuid (from form, which should match the loaded PO's corporation)
  // This ensures we save to the correct corporation, not the one selected in TopBar
  let corporationUuid: string | undefined
  if (poForm.value.uuid) {
    // When editing, use the form's corporation_uuid (should match the loaded PO's corporation)
    corporationUuid = poForm.value.corporation_uuid || corporationStore.selectedCorporationId
  } else {
    // When creating new, prioritize form's corporation_uuid (from form selector)
    corporationUuid = poForm.value.corporation_uuid || corporationStore.selectedCorporationId
  }

  if (!corporationUuid) {
    const toast = useToast();
    toast.add({ title: 'Error', description: 'Corporation is required to save purchase order', color: 'error' })
    return null
  }

  if (poForm.value.is_revised) {
    const revisionNumber = String(poForm.value.revision_number || '').trim()
    if (!revisionNumber) {
      const toast = useToast();
      toast.add({
        title: 'Validation Error',
        description: 'Revision number is required when "Is Revised" is enabled.',
        color: 'error',
      })
      return null
    }
  }
  
  savingPO.value = true
  try {
    let result = null
    
    const resolvedProjectId = resolveProjectIdForPoPrefix()
    const projectPrefix = resolvedProjectId ? `${resolvedProjectId}-` : ''

    let fullPoNumber = poForm.value.po_number || '';
    if (projectPrefix && fullPoNumber && !fullPoNumber.startsWith(projectPrefix)) {
      fullPoNumber = `${projectPrefix}${fullPoNumber}`;
    }

    let fullRevisionNumber = poForm.value.revision_number || '';
    if (projectPrefix && fullRevisionNumber && !fullRevisionNumber.startsWith(projectPrefix)) {
      fullRevisionNumber = `${projectPrefix}${fullRevisionNumber}`;
    }

    if (poForm.value.uuid) {
      // Ensure corporation_uuid is set correctly in the payload
      const payload = {
        uuid: poForm.value.uuid,
        ...poForm.value,
        po_number: fullPoNumber,
        revision_number: fullRevisionNumber,
        corporation_uuid: corporationUuid, // Explicitly set to ensure correct corporation
        raise_against: poForm.value.raise_against || null, // Explicitly include raise_against
      }
      // Capture items BEFORE the API call — the server response returns po_items:[] and would overwrite them
      const poItemsToSave = Array.isArray(poForm.value.po_items) ? [...poForm.value.po_items] : []
      const laborItemsToSave = Array.isArray(poForm.value.labor_po_items) ? [...poForm.value.labor_po_items] : []
      const lwMaterialToSave = Array.isArray(poForm.value.location_wise_material) ? [...poForm.value.location_wise_material] : []

      result = await purchaseOrdersStore.updatePurchaseOrder(payload)
      // Save items in parallel — must happen BEFORE poForm is overwritten by server response
      if (result && result.uuid) {
        const projUuid = (result.project_uuid || poForm.value.project_uuid) ?? undefined
        await Promise.all([
          purchaseOrdersStore.savePOItems(result.uuid, poItemsToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
          purchaseOrdersStore.saveLaborPOItems(result.uuid, laborItemsToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
          purchaseOrdersStore.saveLocationWiseMaterial(result.uuid, lwMaterialToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
        ])
        // Now merge server response (po_items:[] from server is fine — local items already saved)
        poForm.value = { ...poForm.value, ...result, po_items: poItemsToSave, labor_po_items: laborItemsToSave, location_wise_material: lwMaterialToSave }
        // Clear cache for this PO to ensure fresh data is fetched when row is expanded
        clearPOItemsCache(result.uuid)
      }
      if (result && !skipModalClose) {
        const toast = useToast();
        toast.add({ 
          title: 'Updated', 
          description: `Purchase order ${poForm.value.status === 'Approved' ? 'approved' : 'updated'} successfully`, 
          color: 'success' 
        })
        
        // Refetch "to be raised" items if we're in ToBeRaised filter mode
        // This updates the table after updating a PO from the "to be raised" screen
        if (
          selectedStatusFilter.value === 'ToBeRaised' &&
          appliedFilters.value.corporation &&
          appliedFilters.value.project &&
          appliedFilters.value.vendor
        ) {
          await fetchToBeRaisedItems()
        }
        
        // Close modal immediately after successful save
        closeFormModal()
      }
    } else {
      // Ensure corporation_uuid is set correctly in the payload
      const payload = { 
        ...poForm.value, 
        po_number: fullPoNumber,
        revision_number: fullRevisionNumber,
        corporation_uuid: corporationUuid, // Use form's corporation_uuid, not TopBar's
        raise_against: poForm.value.raise_against || null, // Explicitly include raise_against
      }
      // Capture items BEFORE the API call — the server response returns po_items:[] and would overwrite them
      const poItemsToSave = Array.isArray(poForm.value.po_items) ? [...poForm.value.po_items] : []
      const laborItemsToSave = Array.isArray(poForm.value.labor_po_items) ? [...poForm.value.labor_po_items] : []
      const lwMaterialToSave = Array.isArray(poForm.value.location_wise_material) ? [...poForm.value.location_wise_material] : []

      result = await purchaseOrdersStore.createPurchaseOrder(payload)
      // Save items — must happen BEFORE poForm is overwritten by server response
      if (result && result.uuid) {
        const projUuid = (result.project_uuid || poForm.value.project_uuid) ?? undefined
        await Promise.all([
          purchaseOrdersStore.savePOItems(result.uuid, poItemsToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
          purchaseOrdersStore.saveLaborPOItems(result.uuid, laborItemsToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
          purchaseOrdersStore.saveLocationWiseMaterial(result.uuid, lwMaterialToSave, { corporation_uuid: corporationUuid, project_uuid: projUuid }),
        ])
        // Merge server response and keep local items (server returns po_items:[] by design)
        poForm.value = { ...poForm.value, ...result, uuid: result.uuid, po_items: poItemsToSave, labor_po_items: laborItemsToSave, location_wise_material: lwMaterialToSave }
        // Clear cache for this PO to ensure fresh data is fetched when row is expanded
        clearPOItemsCache(result.uuid)
      }
      if (result && !skipModalClose) {
        const toast = useToast();
        toast.add({ title: 'Created', description: 'Purchase order created', color: 'success' })
        
        // Refetch items table data if filters are applied (items table is visible)
        // This updates the pending quantities after creating a PO from the items table
        if (appliedFilters.value.corporation && appliedFilters.value.project) {
          await fetchItemsTableData()
        }
        
        // Return to summary screen after successful creation from "to be raised" screen
        // Clear status filter and applied filters to show purchase orders table
        // No need to refetch "to be raised" items since we're navigating away
        const wasOnToBeRaisedScreen = selectedStatusFilter.value === 'ToBeRaised'
        if (
          wasOnToBeRaisedScreen &&
          appliedFilters.value.corporation &&
          appliedFilters.value.project &&
          appliedFilters.value.vendor
        ) {
          // Return to summary screen after successful creation
          // Clear status filter and applied filters to show purchase orders table
          selectedStatusFilter.value = null
          appliedFilters.value = {
            corporation: undefined,
            project: undefined,
            vendor: undefined,
            location: undefined,
            status: undefined,
            category: undefined,
            division: undefined,
            itemType: undefined,
            dateFrom: undefined,
            dateTo: undefined,
          }
          // Also clear the filter inputs
          filterCorporation.value = undefined
          filterProject.value = undefined
          filterVendor.value = undefined
          filterLocation.value = undefined
          filterStatus.value = null
        }
        
        closeFormModal()
      } else if (result) {
        // Even if skipModalClose is true, we should still refetch items table data
        // This handles the case when creating a CO (which calls savePurchaseOrder with skipModalClose=true)
        if (appliedFilters.value.corporation && appliedFilters.value.project) {
          await fetchItemsTableData()
        }
        
        // Also refetch "to be raised" items if applicable
        // Note: We don't clear the status filter here because handleRaiseChangeOrder will handle it
        // after the CO is successfully created
        if (
          selectedStatusFilter.value === 'ToBeRaised' &&
          appliedFilters.value.corporation &&
          appliedFilters.value.project &&
          appliedFilters.value.vendor
        ) {
          await fetchToBeRaisedItems()
        }
      }
    }
    
    if (!result) {
      throw new Error('Failed to save purchase order')
    }
    
    return result
  } catch (e) {
    const toast = useToast();
    toast.add({ title: 'Error', description: 'Failed to save purchase order', color: 'error' })
    return null
  } finally {
    savingPO.value = false
  }
}

const deletePurchaseOrder = async (po: any) => {
  if (!hasPermission('po_delete')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to delete purchase orders.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  if (!po?.uuid) {
    return;
  }

  try {
    const res = await $fetch<{ data: { hasVendorInvoices: boolean } }>(
      "/api/vendor-invoices/check-purchase-order",
      { query: { purchase_order_uuid: po.uuid } }
    );
    if (res?.data?.hasVendorInvoices) {
      const toast = useToast();
      toast.add({
        title: "Cannot delete",
        description:
          "This purchase order has vendor invoices linked to it. Remove or reassign those invoices before deleting.",
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
      "Could not verify vendor invoices for this purchase order.";
    toast.add({
      title: "Error",
      description: desc,
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  poToDelete.value = po;
  showDeleteModal.value = true;
};

// Helper function to clean error messages
const getCleanMessage = (msg: string | undefined): string => {
  if (!msg) return ''
  let clean = msg
  // Remove [METHOD] "URL": statusCode patterns like [DELETE] "/api/purchase-orders?uuid=...": 400
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

// Handle error banner close
const handleErrorBannerClose = () => {
  // Clear the error from the store
  purchaseOrdersStore.error = null
}

const confirmDelete = async () => {
  if (!hasPermission('po_delete')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to delete purchase orders.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }

  if (!poToDelete.value) return

  try {
    const success = await purchaseOrdersStore.deletePurchaseOrder(poToDelete.value.uuid)
    
    if (success) {
      const toast = useToast();
      toast.add({
        title: "Success",
        description: "Purchase order deleted successfully",
        color: "success",
        icon: "i-heroicons-check-circle",
      });
      showDeleteModal.value = false
      poToDelete.value = null
    } else {
      // If deletePurchaseOrder returns false, check the error from the store
      const storeError = purchaseOrdersStore.error || 'Failed to delete purchase order'
      const toast = useToast();
      toast.add({
        title: "Error",
        description: getCleanMessage(storeError) || "Failed to delete purchase order",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      // Clear the store error after handling it so it doesn't affect the table display
      purchaseOrdersStore.error = null
    }
  } catch (error: any) {
    // Clear the store error after handling it so it doesn't affect the table display
    purchaseOrdersStore.error = null
    
    const toast = useToast();
    let errorDescription = 'Failed to delete purchase order'
    
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
  poToDelete.value = null
}

// Handle exceeded quantity modal actions
const handleContinueSavingPO = async () => {
  showExceededQuantityModal.value = false
  // Flush pending PO item field updates (e.g. ApprovalChecksSelect) before persisting
  await nextTick()
  if (pendingSaveAction.value) {
    await pendingSaveAction.value()
    pendingSaveAction.value = null
  }
  exceededItems.value = []
}

const handleRaiseChangeOrder = async () => {
  showExceededQuantityModal.value = false
  savingPO.value = true
  const requestedStatus = pendingSaveStatus.value || 'Draft'

  // Store the current form data before it gets cleared during PO save
  // This must happen BEFORE calling pendingSaveAction since that clears the form
  // Use deep clone to avoid reactive proxy issues
  const currentFormData = JSON.parse(JSON.stringify(poForm.value))

  // Adjust PO items quantities/amounts to match estimate quantities/amounts before saving
  const exceededItemsList = exceededItems.value
  const currentPoType = String(currentFormData?.po_type || '').toUpperCase()
  const isCurrentLaborPO = currentPoType === 'LABOR'
  
  if (exceededItemsList.length > 0) {
    // Handle material items
    if (!isCurrentLaborPO && Array.isArray(currentFormData.po_items)) {
      // Create a map of exceeded items by composite key (item_uuid-cost_code_uuid) for quick lookup
      const exceededMap = new Map<string, any>()
      exceededItemsList
        .filter((item: any) => item.item_type !== 'labor')
        .forEach((item: any) => {
          // Use composite key: item_uuid-cost_code_uuid
          const itemUuid = String(item.item_uuid || '').toLowerCase()
          const costCodeUuid = String(item.cost_code_uuid || '').toLowerCase()
          const key = `${itemUuid}-${costCodeUuid}`
          if (key && itemUuid && costCodeUuid) {
            exceededMap.set(key, item)
          }
        })

      // Update PO items to set po_quantity to available quantity (estimate quantity - used quantity)
      // Filter out items that become zero quantity after adjustment
      const updatedPoItems = currentFormData.po_items
        .map((item: any) => {
          // Use composite key: item_uuid-cost_code_uuid
          const itemUuid = String(item.item_uuid || '').toLowerCase()
          const costCodeUuid = String(item.cost_code_uuid || '').toLowerCase()
          const key = `${itemUuid}-${costCodeUuid}`
          const exceededItem = key ? exceededMap.get(key) : null

          if (exceededItem) {
            // Set po_quantity to available quantity (estimate quantity - used quantity)
            const estimateQty = parseFloat(String(exceededItem.estimate_quantity || exceededItem.quantity || 0))
            const usedQty = parseFloat(String(exceededItem.used_quantity || 0))
            const availableQty = Math.max(0, estimateQty - usedQty) // Available quantity
            const poUnitPrice = parseFloat(String(item.po_unit_price || item.unit_price || 0))
            const poTotal = Math.round((availableQty * poUnitPrice + Number.EPSILON) * 100) / 100

            return {
              ...item,
              po_quantity: availableQty,
              po_total: poTotal, // Recalculate total
            }
          }
          return item
        })
        .filter((item: any) => {
          // Remove items that have zero quantity after adjustment
          const poQuantity = parseFloat(String(item.po_quantity || 0))
          return poQuantity > 0
        })
      
      // Calculate new item_total from adjusted material items
      const newItemTotal = updatedPoItems.reduce((sum: number, item: any) => {
        const poTotal = parseFloat(String(item.po_total || 0))
        return sum + poTotal
      }, 0)

      // Round to 2 decimal places
      const roundedItemTotal = Math.round((newItemTotal + Number.EPSILON) * 100) / 100

      // Recalculate charges based on percentages
      // Read from poForm.value (latest) first, then fallback to currentFormData
      // Also check both field name formats: with and without _charges_ suffix
      const getChargePercentage = (key: string) => {
        const withCharges = `${key}_charges_percentage`
        const withoutCharges = `${key}_percentage`
        return parseFloat(String(
          poForm.value[withCharges] ?? 
          poForm.value[withoutCharges] ?? 
          currentFormData[withCharges] ?? 
          currentFormData[withoutCharges] ?? 
          0
        ))
      }
      
      const getChargeTaxable = (key: string) => {
        const withCharges = `${key}_charges_taxable`
        const withoutCharges = `${key}_taxable`
        return Boolean(
          poForm.value[withCharges] ?? 
          poForm.value[withoutCharges] ?? 
          currentFormData[withCharges] ?? 
          currentFormData[withoutCharges] ?? 
          false
        )
      }
      
      const freightPercentage = getChargePercentage('freight')
      const packingPercentage = getChargePercentage('packing')
      const customDutiesPercentage = getChargePercentage('custom_duties')
      const otherChargesPercentage = getChargePercentage('other')
      
      const freightAmount = Math.round((roundedItemTotal * (freightPercentage / 100) + Number.EPSILON) * 100) / 100
      const packingAmount = Math.round((roundedItemTotal * (packingPercentage / 100) + Number.EPSILON) * 100) / 100
      const customDutiesAmount = Math.round((roundedItemTotal * (customDutiesPercentage / 100) + Number.EPSILON) * 100) / 100
      const otherChargesAmount = Math.round((roundedItemTotal * (otherChargesPercentage / 100) + Number.EPSILON) * 100) / 100
      
      const chargesTotal = freightAmount + packingAmount + customDutiesAmount + otherChargesAmount
      
      // Calculate taxable base (item_total + taxable charges)
      // Use helper function to read from latest poForm.value
      const freightTaxable = getChargeTaxable('freight')
      const packingTaxable = getChargeTaxable('packing')
      const customDutiesTaxable = getChargeTaxable('custom_duties')
      const otherChargesTaxable = getChargeTaxable('other')
      
      const taxableBase = roundedItemTotal + 
        (freightTaxable ? freightAmount : 0) +
        (packingTaxable ? packingAmount : 0) +
        (customDutiesTaxable ? customDutiesAmount : 0) +
        (otherChargesTaxable ? otherChargesAmount : 0)
      
      // Calculate taxes
      const salesTax1Percentage = parseFloat(String(poForm.value.sales_tax_1_percentage || 0))
      const salesTax2Percentage = parseFloat(String(poForm.value.sales_tax_2_percentage || 0))
      
      const salesTax1Amount = Math.round((taxableBase * (salesTax1Percentage / 100) + Number.EPSILON) * 100) / 100
      const salesTax2Amount = Math.round((taxableBase * (salesTax2Percentage / 100) + Number.EPSILON) * 100) / 100
      const taxTotal = salesTax1Amount + salesTax2Amount
      
      // Calculate final total
      const totalPoAmount = roundedItemTotal + chargesTotal + taxTotal
      
      // Update financial breakdown
      const currentFinancialBreakdown = poForm.value.financial_breakdown || {}
      const updatedFinancialBreakdown = {
        ...currentFinancialBreakdown,
        charges: {
          freight: {
            percentage: freightPercentage || null,
            amount: freightAmount || null,
            taxable: freightTaxable || false,
          },
          packing: {
            percentage: packingPercentage || null,
            amount: packingAmount || null,
            taxable: packingTaxable || false,
          },
          custom_duties: {
            percentage: customDutiesPercentage || null,
            amount: customDutiesAmount || null,
            taxable: customDutiesTaxable || false,
          },
          other: {
            percentage: otherChargesPercentage || null,
            amount: otherChargesAmount || null,
            taxable: otherChargesTaxable || false,
          },
        },
        sales_taxes: {
          sales_tax_1: {
            percentage: salesTax1Percentage || null,
            amount: salesTax1Amount || null,
          },
          sales_tax_2: {
            percentage: salesTax2Percentage || null,
            amount: salesTax2Amount || null,
          },
        },
        totals: {
          item_total: roundedItemTotal,
          charges_total: chargesTotal,
          tax_total: taxTotal,
          total_po_amount: totalPoAmount,
        },
      }
      
      // Create removed_po_items array for items that became zero quantity
      const originalPoItems = currentFormData.po_items || []
      const removedPoItems = originalPoItems.filter((originalItem: any) => {
        // Use composite key: item_uuid-cost_code_uuid
        const itemUuid = String(originalItem.item_uuid || '').toLowerCase()
        const costCodeUuid = String(originalItem.cost_code_uuid || '').toLowerCase()
        const key = `${itemUuid}-${costCodeUuid}`
        const exceededItem = key ? exceededMap.get(key) : null
        if (exceededItem) {
          const estimateQty = parseFloat(String(exceededItem.estimate_quantity || exceededItem.quantity || 0))
          const usedQty = parseFloat(String(exceededItem.used_quantity || 0))
          const availableQty = Math.max(0, estimateQty - usedQty)
          return availableQty === 0 // Item became zero quantity
        }
        return false
      }).map((item: any) => ({
        ...item,
        id: item.id || `removed-${Date.now()}-${Math.random()}`
      }))

      // Update the form with adjusted quantities and recalculated totals
      poForm.value = {
        ...poForm.value,
        po_items: updatedPoItems,
        removed_po_items: [
          ...(poForm.value.removed_po_items || []),
          ...removedPoItems
        ],
        item_total: roundedItemTotal,
        freight_charges_percentage: freightPercentage,
        freight_charges_amount: freightAmount,
        freight_charges_taxable: freightTaxable,
        packing_charges_percentage: packingPercentage,
        packing_charges_amount: packingAmount,
        packing_charges_taxable: packingTaxable,
        custom_duties_charges_percentage: customDutiesPercentage,
        custom_duties_charges_amount: customDutiesAmount,
        custom_duties_charges_taxable: customDutiesTaxable,
        other_charges_percentage: otherChargesPercentage,
        other_charges_amount: otherChargesAmount,
        other_charges_taxable: otherChargesTaxable,
        charges_total: chargesTotal,
        sales_tax_1_percentage: salesTax1Percentage,
        sales_tax_1_amount: salesTax1Amount,
        sales_tax_2_percentage: salesTax2Percentage,
        sales_tax_2_amount: salesTax2Amount,
        tax_total: taxTotal,
        total_po_amount: totalPoAmount,
        financial_breakdown: updatedFinancialBreakdown,
      }
    }
    
  // Handle labor items
  if (isCurrentLaborPO && Array.isArray(currentFormData.labor_po_items)) {
    const roundLaborMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

    // Match PurchaseOrderForm / labor modal: one row per cost code, or per cost code + location.
    const laborLineKey = (row: any) => {
      const cc = String(row?.cost_code_uuid || '').toLowerCase().trim()
      const loc = String(row?.location_uuid || row?.metadata?.location_uuid || '').toLowerCase().trim()
      return loc ? `${cc}::${loc}` : cc
    }

    const exceededLaborKeySet = new Set<string>()
    exceededItemsList
      .filter((row: any) => row.item_type === 'labor')
      .forEach((row: any) => {
        const k = laborLineKey(row)
        if (k) exceededLaborKeySet.add(k)
      })

    // Cap only rows that were flagged exceeded: PO line = budget − prior committed on other POs.
    const updatedLaborItems = currentFormData.labor_po_items.map((item: any) => {
      const key = laborLineKey(item)
      if (!exceededLaborKeySet.has(key)) {
        return item
      }
      const budget = parseFloat(String(item.labor_budgeted_amount || 0))
      const prior = parseFloat(String(
        item.prior_committed_po_amount ??
        item.metadata?.prior_committed_po_amount ??
        0
      ))
      if (!budget || budget <= 0) {
        return item
      }
      const maxPo = roundLaborMoney(Math.max(0, budget - prior))
      const meta = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
      if (Number.isFinite(prior)) {
        meta.prior_committed_po_amount = prior
      }
      return {
        ...item,
        po_amount: maxPo,
        metadata: meta,
      }
    }).filter((item: any) => {
      const poAmount = parseFloat(String(item.po_amount || 0))
      return poAmount > 0
    })

    // Recalculate item_total from adjusted labor items
    const newItemTotal = updatedLaborItems.reduce((sum: number, item: any) => {
      const poAmount = parseFloat(String(item.po_amount || 0))
      return sum + poAmount
    }, 0)
    const roundedItemTotal = Math.round((newItemTotal + Number.EPSILON) * 100) / 100

    // Reuse the same charge/tax recalculation logic as material branch, but based on labor total
    const getChargePercentageForLabor = (key: string) => {
      const withCharges = `${key}_charges_percentage`
      const withoutCharges = `${key}_percentage`
      return parseFloat(String(
        poForm.value[withCharges] ??
        poForm.value[withoutCharges] ??
        currentFormData[withCharges] ??
        currentFormData[withoutCharges] ??
        0
      ))
    }

    const getChargeTaxableForLabor = (key: string) => {
      const withCharges = `${key}_charges_taxable`
      const withoutCharges = `${key}_taxable`
      return Boolean(
        poForm.value[withCharges] ??
        poForm.value[withoutCharges] ??
        currentFormData[withCharges] ??
        currentFormData[withoutCharges] ??
        false
      )
    }

    const freightPercentage = getChargePercentageForLabor('freight')
    const packingPercentage = getChargePercentageForLabor('packing')
    const customDutiesPercentage = getChargePercentageForLabor('custom_duties')
    const otherChargesPercentage = getChargePercentageForLabor('other')

    const freightAmount = Math.round((roundedItemTotal * (freightPercentage / 100) + Number.EPSILON) * 100) / 100
    const packingAmount = Math.round((roundedItemTotal * (packingPercentage / 100) + Number.EPSILON) * 100) / 100
    const customDutiesAmount = Math.round((roundedItemTotal * (customDutiesPercentage / 100) + Number.EPSILON) * 100) / 100
    const otherChargesAmount = Math.round((roundedItemTotal * (otherChargesPercentage / 100) + Number.EPSILON) * 100) / 100

    const chargesTotal = freightAmount + packingAmount + customDutiesAmount + otherChargesAmount

    const freightTaxable = getChargeTaxableForLabor('freight')
    const packingTaxable = getChargeTaxableForLabor('packing')
    const customDutiesTaxable = getChargeTaxableForLabor('custom_duties')
    const otherChargesTaxable = getChargeTaxableForLabor('other')

    const taxableBase = roundedItemTotal +
      (freightTaxable ? freightAmount : 0) +
      (packingTaxable ? packingAmount : 0) +
      (customDutiesTaxable ? customDutiesAmount : 0) +
      (otherChargesTaxable ? otherChargesAmount : 0)

    const salesTax1Percentage = parseFloat(String(poForm.value.sales_tax_1_percentage || 0))
    const salesTax2Percentage = parseFloat(String(poForm.value.sales_tax_2_percentage || 0))

    const salesTax1Amount = Math.round((taxableBase * (salesTax1Percentage / 100) + Number.EPSILON) * 100) / 100
    const salesTax2Amount = Math.round((taxableBase * (salesTax2Percentage / 100) + Number.EPSILON) * 100) / 100
    const taxTotal = salesTax1Amount + salesTax2Amount

    const totalPoAmount = roundedItemTotal + chargesTotal + taxTotal

    const currentFinancialBreakdown = poForm.value.financial_breakdown || {}
    const updatedFinancialBreakdown = {
      ...currentFinancialBreakdown,
      charges: {
        freight: {
          percentage: freightPercentage || null,
          amount: freightAmount || null,
          taxable: freightTaxable || false,
        },
        packing: {
          percentage: packingPercentage || null,
          amount: packingAmount || null,
          taxable: packingTaxable || false,
        },
        custom_duties: {
          percentage: customDutiesPercentage || null,
          amount: customDutiesAmount || null,
          taxable: customDutiesTaxable || false,
        },
        other: {
          percentage: otherChargesPercentage || null,
          amount: otherChargesAmount || null,
          taxable: otherChargesTaxable || false,
        },
      },
      sales_taxes: {
        sales_tax_1: {
          percentage: salesTax1Percentage || null,
          amount: salesTax1Amount || null,
        },
        sales_tax_2: {
          percentage: salesTax2Percentage || null,
          amount: salesTax2Amount || null,
        },
      },
      totals: {
        item_total: roundedItemTotal,
        charges_total: chargesTotal,
        tax_total: taxTotal,
        total_po_amount: totalPoAmount,
      },
    }

    poForm.value = {
      ...poForm.value,
      labor_po_items: updatedLaborItems,
      item_total: roundedItemTotal,
      freight_charges_percentage: freightPercentage,
      freight_charges_amount: freightAmount,
      freight_charges_taxable: freightTaxable,
      packing_charges_percentage: packingPercentage,
      packing_charges_amount: packingAmount,
      packing_charges_taxable: packingTaxable,
      custom_duties_charges_percentage: customDutiesPercentage,
      custom_duties_charges_amount: customDutiesAmount,
      custom_duties_charges_taxable: customDutiesTaxable,
      other_charges_percentage: otherChargesPercentage,
      other_charges_amount: otherChargesAmount,
      other_charges_taxable: otherChargesTaxable,
      charges_total: chargesTotal,
      sales_tax_1_percentage: salesTax1Percentage,
      sales_tax_1_amount: salesTax1Amount,
      sales_tax_2_percentage: salesTax2Percentage,
      sales_tax_2_amount: salesTax2Amount,
      tax_total: taxTotal,
      total_po_amount: totalPoAmount,
      financial_breakdown: updatedFinancialBreakdown,
      raise_against: poForm.value.raise_against || null,
    }
  }

  // Handle location-wise material items — cap exceeded rows to their budgeted amount
  const exceededLwmItems = exceededItemsList.filter((item: any) => item.item_type === 'lwm')
  if (exceededLwmItems.length > 0 && Array.isArray(currentFormData.po_location_wise_material_items)) {
    const lwmExceededSet = new Set(
      exceededLwmItems.map((item: any) => {
        const cc = String(item.cost_code_uuid || '').toLowerCase()
        const loc = String(item.location_uuid || '').toLowerCase()
        return `${cc}-${loc}`
      })
    )

    const updatedLwmItems = currentFormData.po_location_wise_material_items.map((item: any) => {
      const cc = String(item.cost_code_uuid || '').toLowerCase()
      const loc = String(item.location_uuid || '').toLowerCase()
      const key = `${cc}-${loc}`

      if (lwmExceededSet.has(key)) {
        const budget = parseFloat(String(item.material_budgeted_amount || 0))
        return { ...item, po_amount: budget }
      }
      return item
    }).filter((item: any) => {
      const poAmount = parseFloat(String(item.po_amount || 0))
      return poAmount > 0
    })

    const newLwmTotal = updatedLwmItems.reduce((sum: number, item: any) => {
      return sum + parseFloat(String(item.po_amount || 0))
    }, 0)

    const existingPoItemsTotal = Array.isArray(poForm.value.po_items)
      ? poForm.value.po_items.reduce((sum: number, item: any) => sum + parseFloat(String(item.po_total || 0)), 0)
      : 0

    const roundedItemTotal = Math.round(((newLwmTotal + existingPoItemsTotal) + Number.EPSILON) * 100) / 100

    // Recalculate charges, taxes, and total based on the new item total
    const getLwmChargePercentage = (key: string) => {
      const withCharges = `${key}_charges_percentage`
      const withoutCharges = `${key}_percentage`
      return parseFloat(String(
        poForm.value[withCharges] ??
        poForm.value[withoutCharges] ??
        currentFormData[withCharges] ??
        currentFormData[withoutCharges] ??
        0
      ))
    }

    const getLwmChargeTaxable = (key: string) => {
      const withCharges = `${key}_charges_taxable`
      const withoutCharges = `${key}_taxable`
      return Boolean(
        poForm.value[withCharges] ??
        poForm.value[withoutCharges] ??
        currentFormData[withCharges] ??
        currentFormData[withoutCharges] ??
        false
      )
    }

    const lwmFreightPct = getLwmChargePercentage('freight')
    const lwmPackingPct = getLwmChargePercentage('packing')
    const lwmCustomDutiesPct = getLwmChargePercentage('custom_duties')
    const lwmOtherPct = getLwmChargePercentage('other')

    const lwmFreightAmt = Math.round((roundedItemTotal * (lwmFreightPct / 100) + Number.EPSILON) * 100) / 100
    const lwmPackingAmt = Math.round((roundedItemTotal * (lwmPackingPct / 100) + Number.EPSILON) * 100) / 100
    const lwmCustomDutiesAmt = Math.round((roundedItemTotal * (lwmCustomDutiesPct / 100) + Number.EPSILON) * 100) / 100
    const lwmOtherAmt = Math.round((roundedItemTotal * (lwmOtherPct / 100) + Number.EPSILON) * 100) / 100
    const lwmChargesTotal = lwmFreightAmt + lwmPackingAmt + lwmCustomDutiesAmt + lwmOtherAmt

    const lwmFreightTaxable = getLwmChargeTaxable('freight')
    const lwmPackingTaxable = getLwmChargeTaxable('packing')
    const lwmCustomDutiesTaxable = getLwmChargeTaxable('custom_duties')
    const lwmOtherTaxable = getLwmChargeTaxable('other')

    const lwmTaxableBase = roundedItemTotal +
      (lwmFreightTaxable ? lwmFreightAmt : 0) +
      (lwmPackingTaxable ? lwmPackingAmt : 0) +
      (lwmCustomDutiesTaxable ? lwmCustomDutiesAmt : 0) +
      (lwmOtherTaxable ? lwmOtherAmt : 0)

    const lwmSalesTax1Pct = parseFloat(String(poForm.value.sales_tax_1_percentage || 0))
    const lwmSalesTax2Pct = parseFloat(String(poForm.value.sales_tax_2_percentage || 0))
    const lwmSalesTax1Amt = Math.round((lwmTaxableBase * (lwmSalesTax1Pct / 100) + Number.EPSILON) * 100) / 100
    const lwmSalesTax2Amt = Math.round((lwmTaxableBase * (lwmSalesTax2Pct / 100) + Number.EPSILON) * 100) / 100
    const lwmTaxTotal = lwmSalesTax1Amt + lwmSalesTax2Amt
    const lwmTotalPoAmount = roundedItemTotal + lwmChargesTotal + lwmTaxTotal

    const lwmFinancialBreakdown = {
      ...(poForm.value.financial_breakdown || {}),
      charges: {
        freight: { percentage: lwmFreightPct || null, amount: lwmFreightAmt || null, taxable: lwmFreightTaxable || false },
        packing: { percentage: lwmPackingPct || null, amount: lwmPackingAmt || null, taxable: lwmPackingTaxable || false },
        custom_duties: { percentage: lwmCustomDutiesPct || null, amount: lwmCustomDutiesAmt || null, taxable: lwmCustomDutiesTaxable || false },
        other: { percentage: lwmOtherPct || null, amount: lwmOtherAmt || null, taxable: lwmOtherTaxable || false },
      },
      sales_taxes: {
        sales_tax_1: { percentage: lwmSalesTax1Pct || null, amount: lwmSalesTax1Amt || null },
        sales_tax_2: { percentage: lwmSalesTax2Pct || null, amount: lwmSalesTax2Amt || null },
      },
      totals: {
        item_total: roundedItemTotal,
        charges_total: lwmChargesTotal,
        tax_total: lwmTaxTotal,
        total_po_amount: lwmTotalPoAmount,
      },
    }

    poForm.value = {
      ...poForm.value,
      po_location_wise_material_items: updatedLwmItems,
      item_total: roundedItemTotal,
      freight_charges_percentage: lwmFreightPct,
      freight_charges_amount: lwmFreightAmt,
      freight_charges_taxable: lwmFreightTaxable,
      packing_charges_percentage: lwmPackingPct,
      packing_charges_amount: lwmPackingAmt,
      packing_charges_taxable: lwmPackingTaxable,
      custom_duties_charges_percentage: lwmCustomDutiesPct,
      custom_duties_charges_amount: lwmCustomDutiesAmt,
      custom_duties_charges_taxable: lwmCustomDutiesTaxable,
      other_charges_percentage: lwmOtherPct,
      other_charges_amount: lwmOtherAmt,
      other_charges_taxable: lwmOtherTaxable,
      charges_total: lwmChargesTotal,
      sales_tax_1_percentage: lwmSalesTax1Pct,
      sales_tax_1_amount: lwmSalesTax1Amt,
      sales_tax_2_percentage: lwmSalesTax2Pct,
      sales_tax_2_amount: lwmSalesTax2Amt,
      tax_total: lwmTaxTotal,
      total_po_amount: lwmTotalPoAmount,
      financial_breakdown: lwmFinancialBreakdown,
    }
  }
  }
  
  // First, save the PO to get the UUID (skip modal close since we're creating CO)
  let savedPo: any = null
  
  // Check if PO is already saved (has UUID)
  if (currentFormData.uuid) {
    // PO is already saved, use currentFormData but we'll still fetch to get complete data
    savedPo = { uuid: currentFormData.uuid }
  } else if (pendingSaveAction.value) {
    // PO needs to be saved
    try {
      // Respect the status selected by the user (Approve/Verify/Save) when saving the PO.
      poForm.value.status = requestedStatus
      // Call savePurchaseOrder directly with skipModalClose=true to get the returned PO
      savedPo = await savePurchaseOrder(true)
      
      if (!savedPo || !savedPo.uuid) {
        throw new Error('Failed to save purchase order or get UUID')
      }
    } catch (error) {
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to save purchase order. Cannot create change order.',
        color: 'error',
      })
      return
    }
  } else {
    // No pending save action and no UUID - need to save the PO
    try {
      poForm.value.status = requestedStatus
      savedPo = await savePurchaseOrder(true)
      if (!savedPo || !savedPo.uuid) {
        throw new Error('Failed to save purchase order or get UUID')
      }
    } catch (error) {
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to save purchase order. Cannot create change order.',
        color: 'error',
      })
      return
    }
  }
  
  // Refetch the saved purchase order using its UUID to get all the complete data
  // Start with currentFormData which has all the form fields, then merge with fetched data
  let poData: any = { ...currentFormData } // Start with form data
  
  if (savedPo?.uuid && corporationStore.selectedCorporationId) {
    try {
      const detailed = await purchaseOrdersStore.fetchPurchaseOrder(savedPo.uuid)
      if (detailed) {
        // Cast to any to access all properties
        const detailedAny = detailed as any
        // Merge fetched data (from DB) with currentFormData (from form)
        // Fetched data has the UUID and all DB fields, form data has user-entered values
        poData = {
          ...currentFormData, // Start with form data
          ...detailedAny, // Override with DB data (includes UUID and all fields)
          // Ensure critical fields are set
          uuid: detailedAny.uuid,
          corporation_uuid: detailedAny.corporation_uuid || currentFormData.corporation_uuid,
          project_uuid: detailedAny.project_uuid || currentFormData.project_uuid,
          vendor_uuid: detailedAny.vendor_uuid || currentFormData.vendor_uuid,
          credit_days: detailedAny.credit_days || currentFormData.credit_days,
          ship_via_uuid: detailedAny.ship_via_uuid || currentFormData.ship_via_uuid,
          freight_uuid: detailedAny.freight_uuid || currentFormData.freight_uuid,
          shipping_address_uuid: detailedAny.shipping_address_uuid || currentFormData.shipping_address_uuid,
          terms_and_conditions_uuid: detailedAny.terms_and_conditions_uuid || currentFormData.terms_and_conditions_uuid,
          special_instruction_uuid: detailedAny.special_instruction_uuid || currentFormData.special_instruction_uuid,
          po_type: detailedAny.po_type || currentFormData.po_type || "",
          po_type_uuid: detailedAny.po_type_uuid || currentFormData.po_type_uuid || "",
          include_items: detailedAny.include_items || currentFormData.include_items || "",
          raise_against: detailedAny.raise_against || currentFormData.raise_against || null,
          po_items: detailedAny.po_items || currentFormData.po_items || [],
          labor_po_items: detailedAny.labor_po_items || currentFormData.labor_po_items || [],
          attachments: detailedAny.attachments || currentFormData.attachments || [],
          removed_po_items: detailedAny.removed_po_items || currentFormData.removed_po_items || [],
        }
      } else {
        poData = {
          ...currentFormData,
          ...savedPo,
          uuid: savedPo.uuid, // Ensure UUID is set
        }
      }
    } catch (error) {
      // Merge saved PO with currentFormData as fallback
      poData = {
        ...currentFormData,
        ...savedPo,
        uuid: savedPo?.uuid || currentFormData.uuid,
      }
    }
  } else if (savedPo) {
    // Use saved PO merged with currentFormData if we have it but couldn't fetch detailed
    poData = {
      ...currentFormData,
      ...savedPo,
      uuid: savedPo.uuid,
    }
  } else {
    // Use currentFormData as-is, but it won't have UUID
  }
  
  const exceeded = exceededItems.value
  const changeOrderPoType = String(poData?.po_type || '').toUpperCase()
  const isChangeOrderLaborPO = changeOrderPoType === 'LABOR'

  // Keep project_id context on the generated CO payload.
  const sourceForProject = poData && typeof poData === 'object' ? poData : poForm.value
  const projectUuidForCO =
    sourceForProject?.project_uuid ||
    poForm.value?.project_uuid ||
    null
  const corporationUuidForCO =
    sourceForProject?.corporation_uuid ||
    poForm.value?.corporation_uuid ||
    corporationStore.selectedCorporationId ||
    null
  const scopedProjectsForCO =
    corporationUuidForCO
      ? (purchaseOrderListResourcesStore.getProjects(corporationUuidForCO) || [])
      : []
  const projectIdForCO =
    sourceForProject?.project_id ||
    (projectUuidForCO && scopedProjectsForCO.find((p: any) => p.uuid === projectUuidForCO)?.project_id) ||
    (projectUuidForCO && (projectsStore.projects || []).find((p: any) => p.uuid === projectUuidForCO)?.project_id) ||
    ''

  // Separate material, labor, and location-wise material items
  const materialExceeded = exceeded.filter((item: any) => item.item_type === 'material')
  const laborExceeded = exceeded.filter((item: any) => item.item_type === 'labor')
  const lwmExceeded = exceeded.filter((item: any) => item.item_type === 'lwm')

  /** PO lines store approval UUIDs on the row, on DB JSONB, and/or in display_metadata — all must flow into the CO. */
  const resolveApprovalChecksFromPoLineItem = (line: any): string[] => {
    const parseMeta = (m: any): Record<string, any> => {
      if (m && typeof m === 'object' && !Array.isArray(m)) return m
      if (typeof m === 'string') {
        try {
          const p = JSON.parse(m)
          return p && typeof p === 'object' ? p : {}
        } catch {
          return {}
        }
      }
      return {}
    }
    const dm = parseMeta(line?.display_metadata)
    const meta = parseMeta(line?.metadata)
    const candidates = [
      line?.approval_checks,
      line?.approval_checks_uuids,
      dm.approval_checks,
      dm.approval_checks_uuids,
      meta.approval_checks,
      meta.approval_checks_uuids,
    ]
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c.map((x) => String(x).trim()).filter(Boolean)
    }
    return []
  }
  
  // Prepare change order items from exceeded quantities (for material POs)
  // Include all fields from the original PO item to ensure proper display
  const coItems = materialExceeded.map((item: any) => {
    // Get display metadata from the item
    const display = item?.display_metadata || item?.metadata || {}

    // Get cost code info from the exceeded item (now includes cost code details)
    const costCodeNumber = item.cost_code_number || ''
    const costCodeName = item.cost_code_name || ''
    const costCodeLabel = item.cost_code_label || [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim()

    // Get unit info
    const unitLabel = display.unit_label || item.unit_label || item.uom_label || item.unit || item.uom || ''
    const unitUuid = item.uom_uuid || item.unit_uuid || display.unit_uuid || null

    // Get location info
    const locationLabel = display.location_display || item.location || ''
    const locationUuid = item.location_uuid || display.location_uuid || null

    // Get item type info
    const itemTypeLabel = display.item_type_label || item.item_type_label || ''
    const itemTypeUuid = item.item_type_uuid || display.item_type_uuid || null
    
    // Original estimate values (for display in CO form)
    const estimateQuantity = item.estimate_quantity || item.quantity || 0
    const estimateUnitPrice = item.unit_price || 0
    const estimateTotal = estimateQuantity * estimateUnitPrice
    
    // CO values (exceeded portion)
    // Use the PO unit price, defaulting to 0 if not available
    const coUnitPrice = parseFloat(String(item.po_unit_price ?? item.unit_price ?? 0)) || 0
    // Calculate exceeded quantity as total_quantity - estimate_quantity
    const coQuantity = Math.max(0, (item.total_quantity || 0) - (item.estimate_quantity || 0))
    const coTotal = coQuantity * coUnitPrice
    
    return {
      cost_code_uuid: item.cost_code_uuid || item.costCodeUuid || null,
      cost_code_number: costCodeNumber || null,
      cost_code_name: costCodeName || null,
      cost_code_label: costCodeLabel || null,
      division_name: display.division_name || item.division_name || null,
      item_type_uuid: itemTypeUuid,
      item_type_label: itemTypeLabel || null,
      item_uuid: item.item_uuid || null,
      name: item.name || item.item_name || item.description || '',
      description: item.description || '',
      model_number: item.model_number || '',
      location_uuid: locationUuid,
      location_label: locationLabel || null,
      unit_uuid: unitUuid,
      unit_label: unitLabel || null,
      // Original estimate values (for reference in CO form)
      // These should be the original estimate quantity/price/total
      quantity: estimateQuantity > 0 ? estimateQuantity : null,
      unit_price: estimateUnitPrice > 0 ? estimateUnitPrice : null,
      total: estimateTotal > 0 ? estimateTotal : null,
      // CO values (exceeded portion) - these are what the CO is for
      co_unit_price: coUnitPrice,
      co_quantity: coQuantity,
      co_total: coTotal,
      approval_checks: resolveApprovalChecksFromPoLineItem(item),
    }
  })
  
  // Prepare labor change order items from exceeded amounts (for labor POs)
  const laborCoItems = laborExceeded.map((item: any, index: number) => {
    const meta = (item.display_metadata || item.metadata || {}) as any

    const locationUuid =
      item.location_uuid ||
      meta.location_uuid ||
      null

    const locationLabel =
      item.location_label ||
      meta.location_label ||
      meta.location_display ||
      item.location ||
      '' // empty string is fine for label

    const description =
      item.description ||
      meta.description ||
      ''

    return {
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
      division_name: item.division_name || null,
      po_amount: item.labor_budgeted_amount || item.estimate_amount || 0, // Original PO amount (estimate)
      co_amount: item.exceeded_amount || 0, // Only the exceeded portion
      order_index: index,
      location_uuid: locationUuid,
      location_label: locationLabel,
      description,
      metadata: {
        ...(meta || {}),
        ...(locationUuid && { location_uuid: locationUuid }),
        ...(locationLabel && { location_label: locationLabel }),
        ...(description && { description }),
      },
    }
  })

  // Prepare location-wise material CO items from exceeded amounts
  // po_amount = budgeted amount (what the PO was capped to)
  // co_amount = exceeded portion (difference between user-entered amount and budget)
  const lwmCoItems = lwmExceeded.map((item: any, index: number) => {
    const budgeted = parseFloat(String(item.material_budgeted_amount || item.estimate_amount || 0))
    const exceeded = parseFloat(String(item.exceeded_amount || 0))
    return {
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      cost_code_label: item.cost_code_label || [item.cost_code_number, item.cost_code_name].filter(Boolean).join(' ').trim(),
      location_uuid: item.location_uuid || null,
      location_label: item.location_label || '',
      material_budgeted_amount: budgeted,
      po_amount: budgeted,
      co_amount: exceeded,
      description: item.description || '',
      order_index: index,
    }
  })
  
  // Normalize PO type to CO type (LABOR or MATERIAL)
  const poType = String(poData.po_type || poData.po_type_uuid || 'MATERIAL').toUpperCase()
  const normalizedCoType = poType === 'LABOR' ? 'LABOR' : 'MATERIAL'
  
  // Calculate CO item total from exceeded items
  const calculateCOItemTotal = () => {
    let total = 0
    if (normalizedCoType === 'LABOR') {
      total += laborCoItems.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.co_amount) || 0)
      }, 0)
    } else {
      total += coItems.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.co_total) || 0)
      }, 0)
    }
    // Always include LWM exceeded amounts
    total += lwmCoItems.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.co_amount) || 0)
    }, 0)
    return total
  }
  
  const coItemTotal = calculateCOItemTotal()
  
  // Calculate financial breakdown from PO's financial breakdown
  // Use the same percentages and taxable flags, but recalculate amounts based on CO item total
  const buildFinancialBreakdown = () => {
    const formData = poData && typeof poData === 'object' ? poData : poForm.value
    const poBreakdown = formData?.financial_breakdown || formData?.financialBreakdown || {}
    const charges = poBreakdown.charges || {}
    const salesTaxes = poBreakdown.sales_taxes || {}
    
    // Recalculate charges based on CO item total
    const chargeStates: Record<string, any> = {}
    const chargeKeys = ['freight', 'packing', 'custom_duties', 'other'] as const
    let chargesTotal = 0
    
    chargeKeys.forEach((key) => {
      const entry = charges[key] || {}
      const percentage = parseFloat(entry.percentage) || 0
      const taxable = Boolean(entry.taxable)
      const amount = (coItemTotal * percentage) / 100
      
      chargeStates[key] = {
        percentage,
        amount: Math.round((amount + Number.EPSILON) * 100) / 100,
        taxable,
      }
      
      chargesTotal += chargeStates[key].amount
    })
    
    // Calculate taxable base (CO item total + taxable charges)
    const taxableCharges = Object.values(chargeStates).reduce((sum: number, state: any) => {
      return sum + (state.taxable ? state.amount : 0)
    }, 0)
    const taxableBase = coItemTotal + taxableCharges
    
    // Recalculate sales taxes based on taxable base
    const salesTaxStates: Record<string, any> = {}
    let taxTotal = 0
    
    const salesKeys = ['sales_tax_1', 'sales_tax_2'] as const
    salesKeys.forEach((key) => {
      const entry = salesTaxes[key] || {}
      const percentage = parseFloat(entry.percentage) || 0
      const amount = (taxableBase * percentage) / 100
      
      salesTaxStates[key] = {
        percentage,
        amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      }
      
      taxTotal += salesTaxStates[key].amount
    })
    
    const totalCOAmount = coItemTotal + chargesTotal + taxTotal
    
    return {
      charges: chargeStates,
      sales_taxes: salesTaxStates,
      totals: {
        item_total: Math.round((coItemTotal + Number.EPSILON) * 100) / 100,
        charges_total: Math.round((chargesTotal + Number.EPSILON) * 100) / 100,
        tax_total: Math.round((taxTotal + Number.EPSILON) * 100) / 100,
        total_co_amount: Math.round((totalCOAmount + Number.EPSILON) * 100) / 100,
      },
    }
  }
  
  const financialBreakdown = buildFinancialBreakdown()
  
  // Helper to normalize empty strings to null
  const normalizeToNull = (value: any): any => {
    if (value === '' || value === undefined) return null
    return value
  }
  
  // Ensure we have valid poData - use poForm.value directly if poData is invalid
  const formData = poData && typeof poData === 'object' ? poData : poForm.value
  const poCurrencyConversion = normalizePoCurrencyConversionFields({
    ...(formData as Record<string, unknown>),
    ...(poForm.value as Record<string, unknown>),
  })

  const changeOrderData: any = {
    // Required fields
    corporation_uuid: normalizeToNull(formData?.corporation_uuid || corporationStore.selectedCorporationId),
    co_number: null,
    auto_generate_co_number: true,
    created_date: new Date().toISOString(),
    // Keep CO status aligned with the user action that triggered exceeded-values flow.
    status: requestedStatus,
    co_type: normalizedCoType,
    
    // Project and vendor
    project_uuid: normalizeToNull(formData?.project_uuid),
    project_id: projectIdForCO ? projectIdForCO : normalizeToNull(formData?.project_id),
    vendor_uuid: normalizeToNull(formData?.vendor_uuid),
    original_purchase_order_uuid: normalizeToNull(formData?.uuid),

    // Currency conversion — inherit from the source purchase order
    currency_conversion_enabled: poCurrencyConversion.currency_conversion_enabled,
    currency_from: poCurrencyConversion.currency_from,
    currency_to: poCurrencyConversion.currency_to,
    conversion_rate: poCurrencyConversion.conversion_rate,
    
    // Shipping and delivery
    credit_days: normalizeToNull(formData?.credit_days),
    ship_via: normalizeToNull(formData?.ship_via),
    ship_via_uuid: normalizeToNull(formData?.ship_via_uuid),
    freight: normalizeToNull(formData?.freight),
    freight_uuid: normalizeToNull(formData?.freight_uuid),
    shipping_instructions: normalizeToNull(formData?.shipping_instructions),
    shipping_address_uuid: normalizeToNull(formData?.shipping_address_uuid),
    estimated_delivery_date: normalizeToNull(formData?.estimated_delivery_date),
    
    // Additional fields
    requested_by: normalizeToNull(formData?.requested_by),
    terms_and_conditions_uuid: normalizeToNull(formData?.terms_and_conditions_uuid),
    reason: (isChangeOrderLaborPO || lwmCoItems.length > 0)
      ? `Change order for amounts exceeding estimate in PO ${formData?.po_number || ''}`
      : `Change order for quantities exceeding estimate in PO ${formData?.po_number || ''}`,
    attachments: [],
    
    // Financial breakdown (calculated from CO items)
    financial_breakdown: financialBreakdown,
    
    // Financial totals
    item_total: financialBreakdown.totals.item_total,
    charges_total: financialBreakdown.totals.charges_total,
    tax_total: financialBreakdown.totals.tax_total,
    total_co_amount: financialBreakdown.totals.total_co_amount,
    
    // Copy charge percentages and taxable flags from PO
    freight_charges_percentage: formData?.freight_charges_percentage || null,
    freight_charges_amount: financialBreakdown.charges.freight?.amount || null,
    freight_charges_taxable: formData?.freight_charges_taxable || null,
    packing_charges_percentage: formData?.packing_charges_percentage || null,
    packing_charges_amount: financialBreakdown.charges.packing?.amount || null,
    packing_charges_taxable: formData?.packing_charges_taxable || null,
    custom_duties_charges_percentage: formData?.custom_duties_charges_percentage || null,
    custom_duties_charges_amount: financialBreakdown.charges.custom_duties?.amount || null,
    custom_duties_charges_taxable: formData?.custom_duties_charges_taxable || null,
    other_charges_percentage: formData?.other_charges_percentage || null,
    other_charges_amount: financialBreakdown.charges.other?.amount || null,
    other_charges_taxable: formData?.other_charges_taxable || null,
    sales_tax_1_percentage: formData?.sales_tax_1_percentage || null,
    sales_tax_1_amount: financialBreakdown.sales_taxes.sales_tax_1?.amount || null,
    sales_tax_2_percentage: formData?.sales_tax_2_percentage || null,
    sales_tax_2_amount: financialBreakdown.sales_taxes.sales_tax_2?.amount || null,
  }
  
  // Add items based on PO type
  if (isChangeOrderLaborPO) {
    changeOrderData.labor_co_items = laborCoItems
    changeOrderData.removed_labor_co_items = []
  } else {
    changeOrderData.co_items = coItems
    changeOrderData.removed_co_items = []
  }
  
  // Include location-wise material CO items if any
  if (lwmCoItems.length > 0) {
    changeOrderData.co_location_wise_material_items = lwmCoItems.map((item: any, idx: number) => ({
      cost_code_uuid: item.cost_code_uuid,
      cost_code_number: item.cost_code_number,
      cost_code_name: item.cost_code_name,
      cost_code_label: item.cost_code_label,
      location_uuid: item.location_uuid,
      location_label: item.location_label,
      material_budgeted_amount: item.material_budgeted_amount,
      po_amount: item.po_amount,
      co_amount: item.co_amount,
      description: item.description,
      order_index: idx,
    }))
  }
  
  // Create change order directly without showing modal
  savingCO.value = true
  try {
    const result = await changeOrdersStore.createChangeOrder(changeOrderData)
    
    if (result) {
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: `Change order ${result.co_number} created successfully for exceeded quantities`,
        color: 'success',
      })
      
      // Close exceeded quantity modal
      closeExceededQuantityModal()
      
      // Refresh change orders list
      const corpUuid = changeOrderData.corporation_uuid
      if (corpUuid) {
        await changeOrdersStore.fetchChangeOrders(corpUuid, false)
      }
      
      // Return to summary screen after successful creation from "to be raised" screen
      // Clear status filter and applied filters to show purchase orders table
      // No need to refetch "to be raised" items since we're navigating away
      const wasOnToBeRaisedScreen = selectedStatusFilter.value === 'ToBeRaised'
      if (
        wasOnToBeRaisedScreen &&
        appliedFilters.value.corporation &&
        appliedFilters.value.project &&
        appliedFilters.value.vendor
      ) {
        // Return to summary screen after successful creation
        // Clear status filter and applied filters to show purchase orders table
        selectedStatusFilter.value = null
        appliedFilters.value = {
          corporation: undefined,
          project: undefined,
          vendor: undefined,
          location: undefined,
          status: undefined,
          category: undefined,
          division: undefined,
          itemType: undefined,
          dateFrom: undefined,
          dateTo: undefined,
        }
        // Also clear the filter inputs
        filterCorporation.value = undefined
        filterProject.value = undefined
        filterVendor.value = undefined
        filterLocation.value = undefined
        filterStatus.value = null
      }
      
      // PO was already saved at the beginning of this function, no need to save again
      // Close the form modal now that CO is created
      closeFormModal()
    } else {
      throw new Error('Failed to create change order')
    }
  } catch (error: any) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to create change order',
      color: 'error',
    })
  } finally {
    savingCO.value = false
    savingPO.value = false
    pendingSaveAction.value = null
    pendingSaveStatus.value = null
    exceededItems.value = []
  }
}

const closeExceededQuantityModal = () => {
  showExceededQuantityModal.value = false
  pendingSaveAction.value = null
  pendingSaveStatus.value = null
  exceededItems.value = []
}


const previewPurchaseOrder = async (po: any) => {
  if (!hasPermission('po_view')) {
    const toast = useToast();
    toast.add({
      title: "Access Denied",
      description: "You don't have permission to view purchase order details.",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
    return;
  }
  
  await loadPurchaseOrderForModal(po, true)
}

// Shipping address methods
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

// Fetch PO items for expanded row
// Always fetch from API to ensure we have the latest data, especially after items are created/updated
// Note: POBreakdown component also fetches its own data, but we maintain this cache
// for potential future use and to track loading state
const fetchPOItemsForRow = async (poUuid: string, forceRefresh: boolean = true) => {
  if (!poUuid) {
    return
  }

  // Always fetch fresh from API - don't use cache to prevent stale data
  // This ensures we always have the latest items, especially when items are
  // created/updated from CostCodeConfigurationForm or ItemsList components
  if (forceRefresh || !poItemsCache.value[poUuid] || poItemsCache.value[poUuid].loading) {
    // Initialize or update cache entry
    poItemsCache.value[poUuid] = {
      items: poItemsCache.value[poUuid]?.items || [], // Keep existing items while loading
      loading: true,
      error: null
    }

    try {
      // Always fetch fresh from API to ensure we have the latest data
      // This is especially important when items are created/updated from other components
      const items = await purchaseOrderResourcesStore.fetchPurchaseOrderItems(poUuid)
      poItemsCache.value[poUuid] = {
        items: Array.isArray(items) ? items : [],
        loading: false,
        error: null
      }
    } catch (error: any) {
      poItemsCache.value[poUuid] = {
        items: poItemsCache.value[poUuid]?.items || [], // Keep existing items on error
        loading: false,
        error: error?.message || 'Failed to load PO items'
      }
    }
  }
}

// Clear cache for a specific PO when it's updated
// This ensures fresh data is fetched next time the row is expanded
const clearPOItemsCache = (poUuid: string) => {
  if (poUuid && poItemsCache.value[poUuid]) {
    delete poItemsCache.value[poUuid]
  }
}

// Clear all PO items cache
const clearAllPOItemsCache = () => {
  poItemsCache.value = {}
}

// Watchers
// Note: Filters are only applied when "Show Results" is clicked

// Watch modal close to ensure cleanup happens regardless of how it's closed
// (ESC key, click outside modal, or clicking X button)
watch(showFormModal, (isOpen, wasOpen) => {
  // If modal just closed, ensure cleanup happens
  if (wasOpen && !isOpen) {
    purchaseOrderResourcesStore.clear()
    // Do NOT clear shipVia/freight — the list needs them for display name resolution.
    // They are force-refreshed next time the form opens via refreshFreightAndShipViaForNimble().
    isViewMode.value = false
    poForm.value = {
      po_items: [],
      attachments: [],
      removed_po_items: []
    }
    loadingEditPO.value = false
    loadingRowUuid.value = null
    // Reset validation state
    isFormValid.value = true
  }
  // If modal just opened, reset validation state (will be updated by form)
  if (!wasOpen && isOpen) {
    isFormValid.value = false
  }
});

// Cascade: when category changes, clear division and item type
watch(filterCategory, () => {
  filterDivision.value = undefined
  filterItemType.value = undefined
})

// Cascade: when division changes, clear item type
watch(filterDivision, () => {
  filterItemType.value = undefined
})

// Watch for filter changes to reset pagination to page 1
watch([selectedStatusFilter, filterCorporation, filterProject, filterVendor, filterLocation, filterStatus, filterCategory, filterDivision, filterItemType, appliedFilters], () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
}, { deep: true })

// Watch for page size changes to reset to page 1
watch(() => pagination.value.pageSize, () => {
  if (table.value?.tableApi) {
    table.value.tableApi.setPageIndex(0)
  }
})

// Watch for corporation filter changes to fetch projects
watch(() => filterCorporation.value, async (newCorpUuid, oldCorpUuid) => {
  // Clear project filter when corporation changes
  if (newCorpUuid !== oldCorpUuid && oldCorpUuid) {
    filterProject.value = undefined
    filterLocation.value = undefined
    projectLocationBreakdownRows.value = []
  }
  
  // Fetch projects for the new corporation
  if (newCorpUuid) {
    await purchaseOrderListResourcesStore.ensureProjects({
      corporationUuid: newCorpUuid,
      force: false
    })
  }
}, { immediate: false })

watch(
  () => filterProject.value,
  async (newProjectUuid) => {
    if (!newProjectUuid) {
      projectLocationBreakdownRows.value = []
      filterLocation.value = undefined
      return
    }

    await fetchProjectLocationBreakdownsForFilter(newProjectUuid)

    // Clear invalid selection if current location is not part of this project's setup.
    const allowed = new Set(
      projectScopedFilterLocations.value.map((loc: any) => String(loc?.uuid || ''))
    )
    if (filterLocation.value && !allowed.has(String(filterLocation.value))) {
      filterLocation.value = undefined
    }
  },
  { immediate: true }
)

// Auto-fetch Create Purchase Order items when there is only one project available.
// For multiple projects, user must choose and click Show manually.
watch(
  [selectedStatusFilter, filterCorporation, filterProject, availableProjectCountForFilter],
  async ([status, corporation, project, projectCount]) => {
    if (status !== 'ToBeRaised') return
    if (!corporation || !project) return
    if (projectCount !== 1) return

    const alreadyApplied =
      appliedFilters.value.corporation === corporation &&
      appliedFilters.value.project === project
    if (alreadyApplied) return

    await handleShowResults()
  },
  { immediate: true }
)

// Load ship via data and locations on mount
onMounted(async () => {
  try {
    // Always fetch both so uuid→name lookups work regardless of Nimble flag
    await Promise.allSettled([
      shipViaStore.fetchShipVia(nimbleIntegrationsEnabled),
      freightStore.fetchFreight(),
    ])
  } catch (error) {
    console.error('Error fetching ship via/freight:', error)
  }

  if (!locationsStore.getAll || locationsStore.getAll.length === 0) {
    locationsStore.fetchLocations().catch(() => {})
  }

  // Pre-fetch vendor names so the Vendor Name column can resolve uuid → name
  if (selectedCorporationId.value) {
    vendorStore.fetchVendors(selectedCorporationId.value).catch(() => {})
  }

  // Initialize filterCorporation with selected corporation if not already set
  if (!filterCorporation.value && selectedCorporationId.value) {
    filterCorporation.value = selectedCorporationId.value
  }
  
  // Ensure table pagination is initialized with correct page size (50)
  // Use nextTick to ensure table is fully rendered
  await nextTick()
  if (table.value?.tableApi) {
    table.value.tableApi.setPageSize(50)
  }
})

// Watch for changes in selectedCorporationId to update filter if not manually set
watch(selectedCorporationId, (newId) => {
  // Only update filter if it's not manually set by user
  if (!filterCorporation.value && newId) {
    filterCorporation.value = newId
  }
  // Re-fetch vendors whenever the corporation changes so vendor names resolve correctly
  if (newId) {
    vendorStore.fetchVendors(newId).catch(() => {})
  }
})

// When corporation is set (e.g. by TopBar or by useNimbleFromRoute when Nimble is on), fetch first page
// so the list has data even when TopBar is not mounted (Nimble integration).
watch(
  selectedCorporationId,
  async (newCorpId) => {
    if (newCorpId) {
      await purchaseOrdersStore.fetchPurchaseOrders(newCorpId, { force: false, filters: { ...buildPoApiListFilters(), page: 1, page_size: 100 } })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* Keep budget / PO / pending qty columns visually grouped (no pin gap) */
.create-po-items-table :deep(th.create-po-qty-col),
.create-po-items-table :deep(td.create-po-qty-col) {
  width: 5.5rem;
  min-width: 4.5rem;
  max-width: 6rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.create-po-items-table :deep(th.create-po-qty-col:first-of-type),
.create-po-items-table :deep(td.create-po-qty-col:first-of-type) {
  padding-left: 0.75rem;
}
</style>

