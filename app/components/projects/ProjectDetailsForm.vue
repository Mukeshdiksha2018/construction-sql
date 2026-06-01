<template>
  <div class="h-[80vh] flex flex-col">
    <!-- Main Content Area -->
    <div class="flex-1 flex min-h-0">
      <!-- Left Panel -->
      <div ref="leftPanel" class="flex-1 flex flex-col min-h-0 overflow-y-auto pr-3" style="min-width: 800px;">
        <UBanner
          v-if="!loading && isProjectDetailsLocked && !locationOnlyEdit"
          class="mb-3 shrink-0"
          color="warning"
          icon="i-heroicons-lock-closed"
          title="Project details cannot be edited as there are estimates or purchase orders or invoices dependent on this project"
          :description="projectDetailsLockBannerMessage"
        />
        <div class="mb-3 flex flex-col gap-4 flex-1 min-h-0">
          <!-- Row 1: Project Details Card -->
          <div class="flex flex-col">
            <div class="mb-3">
              <UCard variant="soft">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <!-- Skeleton Loaders -->
                  <template v-if="loading">
                    <div class="col-span-1" v-for="i in 12" :key="i">
                      <USkeleton class="h-3 w-24 mb-1" />
                      <USkeleton class="h-9 w-full" />
                    </div>
                  </template>

                  <!-- Actual Form Fields -->
                  <template v-else>
                    <!-- Corporation -->
                    <div class="col-span-1">
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                        Corporation <span class="text-red-500">*</span>
                      </label>
                      <div :class="{ 'cursor-not-allowed': isCorporationDisabled }" @click="handleCorporationClick">
                        <SharedCorporationSelect
                          :model-value="form.corporation_uuid"
                          placeholder="Select corporation"
                          size="sm"
                          class="w-full"
                          :disabled="isCorporationDisabled || effectiveReadonly"
                          @update:model-value="(value: string | undefined) => handleFormUpdate('corporation_uuid', value)"
                          @change="handleCorporationChange"
                        />
                      </div>
                    </div>

                    <!-- Project Name -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                        Project Name <span class="text-red-500">*</span>
                      </label>
                      <UInput
                        v-model="form.project_name"
                        placeholder="Project Name"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        @update:model-value="(value: string) => handleFormUpdate('project_name', value)"
                      />
                    </div>

                    <!-- Project ID -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                        Project ID <span class="text-red-500">*</span>
                      </label>
                      <UInput
                        v-model="form.project_id"
                        placeholder="Project ID"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        icon="i-heroicons-hashtag"
                        @update:model-value="(value: string) => handleFormUpdate('project_id', value)"
                      />
                    </div>

                    <!-- Customer -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-2">
                        <span>Customer</span>
                        <UBadge
                          v-if="!effectiveReadonly && (form.corporation_uuid || corpStore.selectedCorporationId)"
                          color="primary"
                          variant="solid"
                          size="xs"
                          class="cursor-pointer hover:opacity-80 transition-opacity"
                          @click="openCustomerModal"
                        >
                          <UIcon name="i-heroicons-plus" class="w-3 h-3" /> Add
                        </UBadge>
                      </label>
                      <SharedCustomerSelect
                        :model-value="form.customer_uuid"
                        :corporation-uuid="form.corporation_uuid"
                        :project-uuid="form.uuid || form.id || null"
                        :local-customers="localCustomersForSelect"
                        placeholder="Select customer"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        @update:model-value="(value: string | undefined) => handleFormUpdate('customer_uuid', value)"
                      />
                    </div>

                    <!-- Project Type -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-2">
                        <span>Project Type</span>
                        <UBadge
                          v-if="!effectiveReadonly"
                          color="primary"
                          variant="solid"
                          size="xs"
                          class="cursor-pointer hover:opacity-80 transition-opacity"
                          @click="openProjectTypeModal"
                        >
                          <UIcon name="i-heroicons-plus" class="w-3 h-3" /> Add
                        </UBadge>
                      </label>
                      <SharedProjectTypeSelect
                        :model-value="form.project_type_uuid"
                        :project-types="projectTypeOptions"
                        :project-types-loading="projectTypeOptionsLoading"
                        placeholder="Select project type"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        @update:model-value="handleProjectTypeValueUpdate"
                        @change="handleProjectTypeChange"
                      />
                    </div>

                    <!-- Service Type -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-2">
                        <span>Service Type</span>
                        <UBadge
                          v-if="!effectiveReadonly"
                          color="primary"
                          variant="solid"
                          size="xs"
                          class="cursor-pointer hover:opacity-80 transition-opacity"
                          @click="openServiceTypeModal"
                        >
                          <UIcon name="i-heroicons-plus" class="w-3 h-3" /> Add
                        </UBadge>
                      </label>
                      <SharedServiceTypeSelect
                        :model-value="form.service_type_uuid"
                        placeholder="Select service type"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        @update:model-value="handleServiceTypeValueUpdate"
                        @change="handleServiceTypeChange"
                      />
                    </div>

                    <!-- Status -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1">Status</label>
                      <USelectMenu
                        v-model="form.project_status"
                        :items="projectStatusOptions"
                        placeholder="Select status"
                        size="sm"
                        class="w-full"
                        value-key="value"
                        label-key="label"
                        :disabled="effectiveReadonly"
                        @update:model-value="(value: string) => handleFormUpdate('project_status', value)"
                      />
                    </div>

                    <!-- Project Start Date -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                        Project Start Date <span class="text-red-500">*</span>
                      </label>
                      <SharedDatePickerField
                        :model-value="form.project_start_date"
                        :max-value="form.project_estimated_completion_date"
                        :disabled="effectiveReadonly"
                        size="sm"
                        placeholder="MM/DD/YYYY"
                        range-error-title="Invalid project dates"
                        range-error-description="Project Start Date cannot be after Estimated Project Completion Date."
                        @update:model-value="(value: string) => handleFormUpdate('project_start_date', value)"
                      />
                    </div>

                    <!-- Estimated Project Completion Date -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                        Estimated Project Completion Date <span class="text-red-500">*</span>
                      </label>
                      <SharedDatePickerField
                        :model-value="form.project_estimated_completion_date"
                        :min-value="form.project_start_date"
                        :disabled="effectiveReadonly"
                        size="sm"
                        placeholder="MM/DD/YYYY"
                        range-error-title="Invalid project dates"
                        range-error-description="Estimated Project Completion Date cannot be before Project Start Date."
                        @update:model-value="(value: string) => handleFormUpdate('project_estimated_completion_date', value)"
                      />
                    </div>

                    <!-- Contingency % -->
                    <div>
                      <label class="block text-xs font-medium text-default mb-1">Contingency (%)</label>
                      <UInput
                        v-model="form.contingency_percentage"
                        type="number"
                        step="1"
                        placeholder="%"
                        size="sm"
                        class="w-full"
                        :disabled="effectiveReadonly"
                        @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) e.preventDefault() }"
                        @update:model-value="(value: string) => handleFormUpdate('contingency_percentage', value)"
                      />
                    </div>

                    <!-- Enable Location wise -->
                    <div class="md:col-span-2 xl:col-span-2">
                      <div class="flex items-center gap-2 rounded-md bg-primary-50/30 dark:bg-primary-900/10 px-2 py-2">
                        <UCheckbox
                          v-model="form.enable_location_wise"
                          label="Enable location wise"
                          class="text-xs"
                          :disabled="effectiveReadonly"
                          @update:model-value="(value: boolean) => handleFormUpdate('enable_location_wise', value)"
                        />
                      </div>
                      <div
                        v-if="form.enable_location_wise"
                        class="mt-2 flex items-center flex-wrap gap-3 rounded-md bg-primary-50/40 dark:bg-primary-900/10 px-3 py-2"
                      >
                        <span class="text-[11px] font-medium text-default">Location-wise based on:</span>
                        <UCheckbox
                          v-model="form.location_basis_area"
                          label="Area (Sq ft)"
                          class="text-xs"
                          :disabled="effectiveReadonly"
                          @update:model-value="(value: boolean) => handleFormUpdate('location_basis_area', value)"
                        />
                        <UCheckbox
                          v-model="form.location_basis_no_of_rooms"
                          label="No. of Rooms"
                          class="text-xs"
                          :disabled="effectiveReadonly"
                          @update:model-value="(value: boolean) => handleFormUpdate('location_basis_no_of_rooms', value)"
                        />
                      </div>
                    </div>

                    <!-- Area + Rooms -->
                    <div v-if="!form.enable_location_wise" class="md:col-span-2 xl:col-span-2">
                      <div class="rounded-md bg-primary-50/40 dark:bg-primary-900/10 px-2 py-2">
                        <div class="flex flex-col md:flex-row md:items-end md:gap-3">
                          <div class="flex-1">
                            <label class="block text-xs font-medium text-default mb-1">Area (Sq ft)</label>
                            <UInput
                              v-model="form.area_sq_ft"
                              type="number"
                              placeholder="Area"
                              size="sm"
                              class="w-full"
                              :disabled="effectiveReadonly"
                              @focus="showAreaRoomsHelper = true"
                              @blur="showAreaRoomsHelper = false"
                              @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) e.preventDefault() }"
                              @update:model-value="(value: string) => handleFormUpdate('area_sq_ft', value)"
                            />
                          </div>
                          <div class="flex items-center justify-center text-[10px] text-muted font-medium px-1 py-1">(or)</div>
                          <div class="flex-1">
                            <label class="block text-xs font-medium text-default mb-1">No. of Rooms</label>
                            <UInput
                              v-model="form.no_of_rooms"
                              type="number"
                              min="0"
                              placeholder="Rooms"
                              size="sm"
                              class="w-full"
                              :disabled="effectiveReadonly"
                              @focus="showAreaRoomsHelper = true"
                              @blur="showAreaRoomsHelper = false"
                              @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) e.preventDefault() }"
                              @update:model-value="(value: string) => handleFormUpdate('no_of_rooms', value)"
                            />
                          </div>
                        </div>
                        <div v-if="showAreaRoomsHelper" class="mt-1">
                          <p class="inline-flex items-center gap-1 text-[10px] font-medium text-primary-700 dark:text-primary-200">
                            <UIcon name="i-heroicons-information-circle" class="w-3 h-3" />
                            <span>Enter either Area (Sq ft) or Number of Rooms; you don't need to fill both.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Row 2: Project Options & Address -->
          <div class="flex flex-col flex-1">
            <div class="mb-3 space-y-4 h-full">
              <!-- Location-wise Area & Rooms -->
              <UCard
                v-if="form.enable_location_wise && (form.location_basis_area || form.location_basis_no_of_rooms)"
                variant="soft"
              >
                <template v-if="loading">
                  <USkeleton class="h-6 w-48 mb-3" /><USkeleton class="h-24 w-full" />
                </template>
                <template v-else>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                      <UIcon name="i-heroicons-map-pin-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      <span>Location-wise Area &amp; Rooms</span>
                    </h4>
                    <UButton v-if="!locationSectionReadonly" size="xs" color="info" variant="solid" icon="i-heroicons-plus" @click="addLocationRow">
                      Add Location
                    </UButton>
                  </div>
                  <div class="border border-default rounded-md overflow-hidden bg-elevated">
                    <table class="min-w-full text-xs">
                      <thead class="bg-muted/40">
                        <tr>
                          <th class="px-3 py-2 text-left font-medium text-default">
                            <span class="flex items-center gap-2">
                              <span>Location</span>
                              <UBadge v-if="!locationSectionReadonly" color="primary" variant="solid" size="xs" class="cursor-pointer hover:opacity-80 transition-opacity" @click="openLocationModal()">
                                <UIcon name="i-heroicons-plus" class="w-3 h-3" /> Add
                              </UBadge>
                            </span>
                          </th>
                          <th v-if="form.location_basis_area" class="px-3 py-2 text-left font-medium text-default">Area (Sq ft)</th>
                          <th v-if="form.location_basis_no_of_rooms" class="px-3 py-2 text-left font-medium text-default">No. of Rooms</th>
                          <th class="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, index) in locationRows" :key="(row as any).tempId || (row as any).uuid || index" class="border-t border-default">
                          <td class="px-3 py-2 align-top">
                            <SharedLocationSelect
                              :model-value="(row as any).location_uuid"
                              size="xs"
                              class="w-full"
                              :disabled="locationSectionReadonly"
                              :disabled-values="getDisabledLocationUuidsForRow(Number(index))"
                              :refresh-from-api="true"
                              @update:modelValue="(value: string) => updateLocationRowField(Number(index), 'location_uuid', value)"
                            />
                          </td>
                          <td v-if="form.location_basis_area" class="px-3 py-2 align-top">
                            <UInput :model-value="(row as any).area_sq_ft" type="number" min="0" size="xs" class="w-full" :disabled="locationSectionReadonly" @update:model-value="(value: string) => updateLocationRowField(Number(index), 'area_sq_ft', value)" />
                          </td>
                          <td v-if="form.location_basis_no_of_rooms" class="px-3 py-2 align-top">
                            <UInput :model-value="(row as any).no_of_rooms" type="number" min="0" size="xs" class="w-full" :disabled="locationSectionReadonly" @update:model-value="(value: string) => updateLocationRowField(Number(index), 'no_of_rooms', value)" />
                          </td>
                          <td class="px-2 py-2 align-top text-right">
                            <UButton v-if="!locationSectionReadonly" size="xs" color="error" variant="ghost" icon="mingcute:delete-fill" class="p-1 h-6 w-6" @click="requestRemoveLocationRow(Number(index))" />
                          </td>
                        </tr>
                        <tr v-if="!locationRows.length">
                          <td colspan="3" class="px-3 py-3 text-xs text-muted text-center">No locations added yet. Use "Add Location" to define location-wise areas or rooms.</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="px-3 py-2 text-[10px] text-muted flex items-center gap-1 border-t border-default">
                      <UIcon name="i-heroicons-information-circle" class="w-3 h-3" />
                      <span>For each location, enter either Area (Sq ft) or No. of Rooms, not both.</span>
                    </p>
                  </div>
                </template>
              </UCard>

              <!-- Project Estimate Layout -->
              <UCard variant="soft">
                <template v-if="loading">
                  <USkeleton class="h-6 w-32 mb-4" />
                  <div class="flex items-center justify-between"><USkeleton class="h-10 w-32" /><USkeleton class="h-10 w-48" /></div>
                </template>
                <template v-else>
                  <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <UIcon name="i-heroicons-cog-6-tooth-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    Project Estimate Layout
                  </h4>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center p-3 rounded-lg transition-all duration-200" :class="form.only_total ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'">
                      <UCheckbox v-model="form.only_total" label="Only Total" class="text-sm" :disabled="effectiveReadonly" @update:model-value="(value: boolean) => handleOnlyTotalChange(value)" />
                    </div>
                    <div class="flex items-center gap-6 p-3 rounded-lg transition-all duration-200" :class="(form.enable_labor || form.enable_material) ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'">
                      <span class="text-sm font-medium text-default">Enable Columns:</span>
                      <UCheckbox v-model="form.enable_labor" label="Labor" class="text-sm" :disabled="effectiveReadonly" @update:model-value="(value: boolean) => handleLaborChange(value)" />
                      <UCheckbox v-model="form.enable_material" label="Material" class="text-sm" :disabled="effectiveReadonly" @update:model-value="(value: boolean) => handleMaterialChange(value)" />
                    </div>
                  </div>
                </template>
              </UCard>

              <!-- Address Management -->
              <UCard variant="soft">
                <template v-if="loading">
                  <div class="flex items-center justify-between mb-3"><USkeleton class="h-6 w-48" /><USkeleton class="h-8 w-40" /></div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <div v-for="i in 4" :key="i" class="p-3 rounded-md border-2 border-default"><USkeleton class="h-4 w-32 mb-2" /><USkeleton class="h-3 w-24 mb-1" /><USkeleton class="h-3 w-20 mb-2" /><USkeleton class="h-3 w-16 mb-2" /><USkeleton class="h-6 w-full mt-2" /></div>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                      <UIcon name="i-heroicons-map-pin-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      Project Contacts / Addresses
                    </h4>
                    <UButton icon="i-heroicons-plus" size="xs" color="primary" :disabled="!canManageAddresses || addressesSectionReadonly" @click="openAddressModal">
                      Add Contact / Address
                    </UButton>
                  </div>

                  <div v-if="projectAddresses && projectAddresses.length > 0" class="space-y-6">
                    <!-- Shipment Addresses -->
                    <div v-if="shipmentAddresses.length > 0">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-heroicons-truck" class="w-4 h-4 text-info" />
                        <h5 class="text-sm font-semibold text-default">Shipment Addresses</h5>
                        <UBadge color="info" variant="soft" size="xs">{{ shipmentAddresses.length }}</UBadge>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <div v-for="address in shipmentAddresses" :key="(address as any).uuid || (address as any).tempId" class="relative p-3 rounded-md border-2 transition-all duration-200" :class="[(address as any).is_primary ? 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-300 shadow-sm dark:from-brand-900/20 dark:to-brand-900/20 dark:border-brand-400' : 'bg-elevated border-default hover:border-accented hover:shadow-sm', { 'cursor-pointer': !addressesSectionReadonly, 'cursor-default': addressesSectionReadonly }]" @click="addressesSectionReadonly ? null : setPrimaryAddress(address)">
                          <div class="absolute top-2 right-2">
                            <input type="radio" :id="`primary-${(address as any).uuid || (address as any).tempId}`" name="primary-address-shipment" :checked="(address as any).is_primary" :disabled="addressesSectionReadonly" @change="addressesSectionReadonly ? null : setPrimaryAddress(address)" class="w-3 h-3 text-brand-600 bg-elevated border-default focus:ring-brand-500 focus:ring-1" />
                          </div>
                          <div class="pr-6">
                            <div class="flex items-start justify-between mb-1">
                              <div class="flex-1 min-w-0">
                                <div class="text-xs font-medium text-default truncate">{{ (address as any).address_line_1 }}</div>
                                <div v-if="(address as any).address_line_2" class="text-xs text-muted truncate">{{ (address as any).address_line_2 }}</div>
                              </div>
                            </div>
                            <div class="text-xs text-muted mb-1 truncate">{{ [(address as any).city, (address as any).state, (address as any).zip_code].filter(Boolean).join(', ') }}</div>
                            <div v-if="(address as any).country" class="text-xs text-muted mb-2 truncate">{{ getCountryName((address as any).country) }}</div>
                            <div class="space-y-0.5">
                              <div v-if="(address as any).contact_person" class="text-xs text-muted truncate"><UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />{{ (address as any).contact_person }}</div>
                              <div v-if="(address as any).phone" class="text-xs text-muted truncate"><UIcon name="i-heroicons-phone" class="w-3 h-3 inline mr-1" />{{ (address as any).phone }}</div>
                              <div v-if="(address as any).email" class="text-xs text-muted truncate"><UIcon name="i-heroicons-envelope" class="w-3 h-3 inline mr-1" />{{ (address as any).email }}</div>
                            </div>
                          </div>
                          <div class="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-default">
                            <UButton icon="tdesign:edit-filled" size="xs" color="secondary" variant="soft" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="addressesSectionReadonly ? null : editAddress(address)" />
                            <UButton icon="mingcute:delete-fill" size="xs" variant="soft" color="error" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="addressesSectionReadonly ? null : requestDeleteAddress(address)" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Billing Addresses -->
                    <div v-if="billingAddresses.length > 0">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-warning" />
                        <h5 class="text-sm font-semibold text-default">Billing Addresses</h5>
                        <UBadge color="warning" variant="soft" size="xs">{{ billingAddresses.length }}</UBadge>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <div v-for="address in billingAddresses" :key="(address as any).uuid || (address as any).tempId" class="relative p-3 rounded-md border-2 transition-all duration-200" :class="[(address as any).is_primary ? 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-300 shadow-sm dark:from-brand-900/20 dark:to-brand-900/20 dark:border-brand-400' : 'bg-elevated border-default hover:border-accented hover:shadow-sm', { 'cursor-pointer': !addressesSectionReadonly, 'cursor-default': addressesSectionReadonly }]" @click="addressesSectionReadonly ? null : setPrimaryAddress(address)">
                          <div class="absolute top-2 right-2">
                            <input type="radio" :id="`primary-bill-${(address as any).uuid || (address as any).tempId}`" name="primary-address-bill" :checked="(address as any).is_primary" :disabled="addressesSectionReadonly" @change="addressesSectionReadonly ? null : setPrimaryAddress(address)" class="w-3 h-3 text-brand-600 bg-elevated border-default focus:ring-brand-500 focus:ring-1" />
                          </div>
                          <div class="pr-6">
                            <div class="text-xs font-medium text-default truncate">{{ (address as any).address_line_1 }}</div>
                            <div v-if="(address as any).address_line_2" class="text-xs text-muted truncate">{{ (address as any).address_line_2 }}</div>
                            <div class="text-xs text-muted mb-1 truncate">{{ [(address as any).city, (address as any).state, (address as any).zip_code].filter(Boolean).join(', ') }}</div>
                            <div v-if="(address as any).country" class="text-xs text-muted mb-2 truncate">{{ getCountryName((address as any).country) }}</div>
                            <div class="space-y-0.5">
                              <div v-if="(address as any).contact_person" class="text-xs text-muted truncate"><UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />{{ (address as any).contact_person }}</div>
                              <div v-if="(address as any).phone" class="text-xs text-muted truncate"><UIcon name="i-heroicons-phone" class="w-3 h-3 inline mr-1" />{{ (address as any).phone }}</div>
                              <div v-if="(address as any).email" class="text-xs text-muted truncate"><UIcon name="i-heroicons-envelope" class="w-3 h-3 inline mr-1" />{{ (address as any).email }}</div>
                            </div>
                          </div>
                          <div class="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-default">
                            <UButton icon="tdesign:edit-filled" size="xs" color="secondary" variant="soft" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="editAddress(address)" />
                            <UButton icon="mingcute:delete-fill" size="xs" variant="soft" color="error" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="requestDeleteAddress(address)" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Final Destination Addresses -->
                    <div v-if="finalDestinationAddresses.length > 0">
                      <div class="flex items-center gap-2 mb-3">
                        <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-success" />
                        <h5 class="text-sm font-semibold text-default">Final Destination Addresses</h5>
                        <UBadge color="success" variant="soft" size="xs">{{ finalDestinationAddresses.length }}</UBadge>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <div v-for="address in finalDestinationAddresses" :key="(address as any).uuid || (address as any).tempId" class="relative p-3 rounded-md border-2 transition-all duration-200" :class="[(address as any).is_primary ? 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-300 shadow-sm dark:from-brand-900/20 dark:to-brand-900/20 dark:border-brand-400' : 'bg-elevated border-default hover:border-accented hover:shadow-sm', { 'cursor-pointer': !addressesSectionReadonly, 'cursor-default': addressesSectionReadonly }]" @click="addressesSectionReadonly ? null : setPrimaryAddress(address)">
                          <div class="absolute top-2 right-2">
                            <input type="radio" :id="`primary-fd-${(address as any).uuid || (address as any).tempId}`" name="primary-address-final-destination" :checked="(address as any).is_primary" :disabled="addressesSectionReadonly" @change="addressesSectionReadonly ? null : setPrimaryAddress(address)" class="w-3 h-3 text-brand-600 bg-elevated border-default focus:ring-brand-500 focus:ring-1" />
                          </div>
                          <div class="pr-6">
                            <div class="text-xs font-medium text-default truncate">{{ (address as any).address_line_1 }}</div>
                            <div v-if="(address as any).address_line_2" class="text-xs text-muted truncate">{{ (address as any).address_line_2 }}</div>
                            <div class="text-xs text-muted mb-1 truncate">{{ [(address as any).city, (address as any).state, (address as any).zip_code].filter(Boolean).join(', ') }}</div>
                            <div v-if="(address as any).country" class="text-xs text-muted mb-2 truncate">{{ getCountryName((address as any).country) }}</div>
                            <div class="space-y-0.5">
                              <div v-if="(address as any).contact_person" class="text-xs text-muted truncate"><UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />{{ (address as any).contact_person }}</div>
                              <div v-if="(address as any).phone" class="text-xs text-muted truncate"><UIcon name="i-heroicons-phone" class="w-3 h-3 inline mr-1" />{{ (address as any).phone }}</div>
                              <div v-if="(address as any).email" class="text-xs text-muted truncate"><UIcon name="i-heroicons-envelope" class="w-3 h-3 inline mr-1" />{{ (address as any).email }}</div>
                            </div>
                          </div>
                          <div class="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-default">
                            <UButton icon="tdesign:edit-filled" size="xs" color="secondary" variant="soft" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="editAddress(address)" />
                            <UButton icon="mingcute:delete-fill" size="xs" variant="soft" color="error" class="p-1 h-6 w-6" :disabled="addressesSectionReadonly" @click.stop="requestDeleteAddress(address)" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="flex flex-col items-center justify-center text-muted p-8">
                    <UIcon name="i-heroicons-map-pin" class="w-12 h-12 mb-3 text-muted" />
                    <p class="text-sm font-medium mb-1">No addresses added</p>
                    <p class="text-xs text-muted text-center">{{ canManageAddresses ? 'Click "Add Address" to create one' : 'Fill Basic Information (Project Name) first' }}</p>
                  </div>
                </template>
              </UCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Estimated Amount & File Upload -->
      <div ref="rightPanel" class="w-80 flex flex-col min-h-0 overflow-y-auto border-l border-default pl-4 pr-1" style="min-width: 250px;">
        <!-- Estimated Amount -->
        <div class="mb-3">
          <UCard variant="soft">
            <template v-if="loading">
              <div class="flex flex-col gap-2"><USkeleton class="h-6 w-40" /><USkeleton class="h-8 w-32" /><USkeleton class="h-4 w-56" /></div>
            </template>
            <template v-else>
              <div class="flex flex-col gap-1">
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <UIcon name="i-heroicons-banknotes-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Estimated Amount</span>
                </h4>
                <p class="text-2xl font-semibold text-default mt-1">
                  {{ estimateStatusMetadata.amount || (estimateStatusMetadata.hasEstimate ? '$0.00' : '—') }}
                </p>
                <p v-if="estimateStatusMetadata.label || estimateStatusMetadata.helper" class="text-xs mt-1" :class="estimateStatusMetadata.class">
                  <span>{{ estimateStatusMetadata.label }}</span>
                  <span v-if="estimateStatusMetadata.helper" class="ml-1">· {{ estimateStatusMetadata.helper }}</span>
                </p>
              </div>
            </template>
          </UCard>
        </div>

        <!-- Upload Section -->
        <div class="mb-3">
          <UCard variant="soft">
            <template v-if="loading">
              <div class="flex justify-between items-center mb-3"><USkeleton class="h-6 w-32" /><USkeleton class="h-6 w-24" /></div>
              <div class="space-y-2"><USkeleton class="h-10 w-full" /><USkeleton class="h-4 w-full" /></div>
            </template>
            <template v-else>
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <UIcon name="i-heroicons-cloud-arrow-up-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  File Upload
                </h4>
                <span class="text-xs text-muted bg-elevated px-2 py-1 rounded border border-default">
                  {{ form.attachments.length }} files
                  <span v-if="form.attachments.filter((att: any) => att.uuid || att.isUploaded).length > 0" class="text-green-600">
                    ({{ form.attachments.filter((att: any) => att.uuid || att.isUploaded).length }} uploaded)
                  </span>
                </span>
              </div>
              <UFileUpload v-slot="{ open }" v-model="uploadedFiles" accept=".pdf,.doc,.docx" multiple :key="fileInputKey">
                <div class="space-y-2">
                  <UButton :label="uploadedFiles.length > 0 ? 'Add more files' : 'Choose files'" color="primary" variant="solid" size="sm" icon="i-heroicons-document-plus" :disabled="attachmentsSectionReadonly" @click="attachmentsSectionReadonly ? null : open()" />
                  <p v-if="fileUploadErrorMessage" class="text-xs text-red-600 flex items-center gap-1 p-2 bg-red-50 rounded border border-red-200">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3 flex-shrink-0" />
                    <span class="truncate">{{ fileUploadErrorMessage }}</span>
                  </p>
                  <p class="text-xs text-muted text-center">PDF, DOC, DOCX (Max 10MB each)</p>
                </div>
              </UFileUpload>
            </template>
          </UCard>
        </div>

        <!-- File List -->
        <div class="mb-3">
          <UCard variant="soft">
            <template v-if="loading">
              <div class="flex justify-between items-center mb-3"><USkeleton class="h-6 w-32" /></div>
              <div class="space-y-2">
                <div v-for="i in 3" :key="i" class="flex items-center gap-2 p-2 bg-elevated rounded-md border border-default"><USkeleton class="h-3 w-3 rounded-full" /><USkeleton class="h-4 w-32 flex-1" /><USkeleton class="h-6 w-6" /><USkeleton class="h-6 w-6" /></div>
              </div>
            </template>
            <template v-else>
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <UIcon name="i-heroicons-document-text-solid" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Uploaded Files
                </h4>
              </div>
              <div v-if="!props.form.attachments || props.form.attachments.length === 0" class="flex flex-col items-center justify-center text-muted p-6">
                <UIcon name="i-heroicons-document" class="w-16 h-16 mb-4 text-muted" />
                <p class="text-sm font-medium text-muted mb-2">No files uploaded</p>
                <p class="text-xs text-muted text-center">Upload files above to see them here</p>
              </div>
              <div v-else class="space-y-2">
                <div v-for="(attachment, index) in props.form.attachments" :key="(attachment as any).uuid || (attachment as any).tempId || index" class="flex items-center gap-2 p-2 bg-elevated rounded-md border border-default text-xs hover:bg-accented transition-colors">
                  <UIcon name="i-heroicons-check-circle" class="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span class="truncate flex-1 text-default">{{ (attachment as any).document_name || (attachment as any).name || `File ${Number(index) + 1}` }}</span>
                  <div class="flex items-center gap-1">
                    <UButton icon="i-heroicons-eye-solid" color="neutral" variant="soft" size="xs" class="p-1 h-auto text-xs" @click.stop="previewFile(attachment)" />
                    <UButton icon="mingcute:delete-fill" color="error" variant="soft" size="xs" class="p-1 h-auto text-xs" :disabled="attachmentsSectionReadonly" @click="attachmentsSectionReadonly ? null : removeFile(Number(index))" />
                  </div>
                </div>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Address Modal -->
    <UModal v-model:open="showAddressModal" :ui="{ body: 'sm:p-4 flex-1 overflow-y-auto p-3' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">{{ editingAddress ? 'Edit Address' : 'Add Address' }}</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeAddressModal" />
        </div>
      </template>
      <template #body>
        <form class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-default mb-1">Address Type <span class="text-red-500">*</span></label>
              <USelect :items="addressTypeOptions" placeholder="Select address type" size="sm" class="w-full" value-attribute="value" option-attribute="label" :model-value="addressForm.address_type || undefined" @update:model-value="(value: string | undefined) => { addressForm.address_type = value || null }" />
            </div>
          </div>
          <div v-if="availableAddressTypesToCopy.length > 0" class="pt-2 border-t border-gray-200 dark:border-gray-700">
            <label class="block text-sm font-medium text-default mb-2">Copy from existing address</label>
            <div class="flex flex-wrap gap-3">
              <UCheckbox v-for="addressType in availableAddressTypesToCopy" :key="addressType.value" :model-value="copiedFromAddressType === addressType.value" :label="`Same as ${addressType.label.toLowerCase()}`" class="mb-0" @update:model-value="(checked: boolean | string) => handleCopyFromAddressType(addressType.value, !!checked)" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-default mb-1">Contact Person</label>
              <UInput v-model="addressForm.contact_person" placeholder="Contact person name" size="sm" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">Phone</label>
              <UInput v-model="addressForm.phone" placeholder="Phone number" size="sm" class="w-full" @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) e.preventDefault() }" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Email</label>
            <UInput v-model="addressForm.email" type="email" placeholder="Email address" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Country</label>
            <USelect v-model="addressForm.country" :items="countryOptions" placeholder="Select Country" size="sm" class="w-full" value-attribute="value" option-attribute="label" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Address Line 1 <span class="text-red-500">*</span></label>
            <UInput v-model="addressForm.address_line_1" placeholder="Street address, P.O. box, company name, c/o" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Address Line 2</label>
            <UInput v-model="addressForm.address_line_2" placeholder="Apartment, suite, unit, building, floor, etc." size="sm" class="w-full" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-default mb-1">City</label>
              <UInput v-model="addressForm.city" placeholder="City" size="sm" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-default mb-1">State/Province</label>
              <UInput v-model="addressForm.state" placeholder="State/Province" size="sm" class="w-full" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">ZIP/Postal Code</label>
            <UInput v-model="addressForm.zip_code" placeholder="ZIP/Postal Code" size="sm" class="w-full" @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9a-zA-Z\s-]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) e.preventDefault() }" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="closeAddressModal" :disabled="isSavingAddress">Cancel</UButton>
          <UButton variant="solid" color="primary" @click="saveAddress" :loading="isSavingAddress" :disabled="isSavingAddress">{{ editingAddress ? 'Update' : 'Create' }}</UButton>
        </div>
      </template>
    </UModal>

    <!-- File Preview Modal -->
    <UModal v-model:open="showFilePreviewModal" :ui="{ body: 'p-0 overflow-hidden', wrapper: 'w-[95vw] max-w-[95vw] h-[100vh] max-h-[100vh]' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">File Preview</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeFilePreview" />
        </div>
      </template>
      <template #body>
        <div class="h-[calc(100vh-8rem)] overflow-hidden">
          <SharedFilePreview :attachment="selectedFileForPreview" />
        </div>
      </template>
    </UModal>

    <!-- Audit Log Modal -->
    <AuditLogsAuditLogModal
      v-model:open="showAuditLogModal"
      :entity-id="form.id || ''"
      entity-type="project"
      :corporation-uuid="corpStore.selectedCorporationId || ''"
      :bill-info="projectInfo"
      :auto-refresh="true"
      @logs-loaded="onAuditLogsLoaded"
      @error="onAuditLogError"
      @export="onExportAuditLogs"
    />

    <!-- Customer Form Modal -->
    <CustomersCustomerForm
      v-model="showCustomerModal"
      :customer="null"
      :initial-corporation-uuid="form.corporation_uuid || corpStore.selectedCorporationId || null"
      :initial-project-uuid="form.uuid || form.id || null"
      lock-corporation
      @customer-saved="handleCustomerSaved"
    />

    <!-- Add Project Type Modal -->
    <UModal v-model:open="showProjectTypeModal" title="Add Project Type" description="Create a new project type for your organization." :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-1">Name <span class="text-red-500">*</span></label>
            <UInput v-model="projectTypeFormState.name" placeholder="e.g., Residential Construction" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Description</label>
            <UTextarea v-model="projectTypeFormState.description" placeholder="Describe the project type..." variant="subtle" size="sm" class="w-full" :rows="2" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="showProjectTypeModal = false">Cancel</UButton>
          <UButton color="primary" :loading="savingProjectType" @click="saveNewProjectType">Save</UButton>
        </div>
      </template>
    </UModal>

    <!-- Add Service Type Modal -->
    <UModal v-model:open="showServiceTypeModal" title="Add Service Type" description="Create a new service type for your organization." :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-1">Name <span class="text-red-500">*</span></label>
            <UInput v-model="serviceTypeFormState.name" placeholder="e.g., General Construction, Electrical" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Description</label>
            <UTextarea v-model="serviceTypeFormState.description" placeholder="Describe the service type..." variant="subtle" size="sm" class="w-full" :rows="2" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="showServiceTypeModal = false">Cancel</UButton>
          <UButton color="primary" :loading="savingServiceType" @click="saveNewServiceType">Save</UButton>
        </div>
      </template>
    </UModal>

    <!-- Add Location Modal -->
    <UModal v-model:open="showLocationModal" title="Add Location" description="Create a new location for your organization." :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-1">Location Name <span class="text-red-500">*</span></label>
            <UInput v-model="locationFormState.location_name" placeholder="e.g., Main Warehouse" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Location Code</label>
            <UInput v-model="locationFormState.location_code" placeholder="e.g., WH-01" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Description</label>
            <UTextarea v-model="locationFormState.description" placeholder="Optional description" variant="subtle" size="sm" class="w-full" :rows="2" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="showLocationModal = false">Cancel</UButton>
          <UButton color="primary" :loading="savingLocation" @click="saveNewLocation">Save</UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove location row confirmation -->
    <UModal v-model:open="showRemoveLocationRowModal" title="Remove location row" description="Confirm before removing this row from the project." :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="space-y-4">
          <UAlert color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle" title="Remove this location row?" description="This removes the row from Location-wise Area & Rooms for this project. It does not delete the location from your organization." />
          <div v-if="locationRowToRemoveSummary" class="p-3 rounded-lg bg-elevated/50 border border-default text-sm space-y-1">
            <p><span class="font-medium text-default">Location:</span> {{ locationRowToRemoveSummary.locationLabel }}</p>
            <p v-if="locationRowToRemoveSummary.details"><span class="font-medium text-default">Values:</span> {{ locationRowToRemoveSummary.details }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="cancelRemoveLocationRow">Cancel</UButton>
          <UButton color="error" @click="confirmRemoveLocationRow">Remove row</UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete address confirmation -->
    <UModal v-model:open="showDeleteAddressModal" title="Delete address" description="Confirm before removing this address from the project." :ui="{ content: 'max-w-md', body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="space-y-4">
          <UAlert color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle" title="Delete this address?" description="This permanently removes the address from this project. This action cannot be undone." />
          <div v-if="addressToDeleteSummary" class="p-3 rounded-lg bg-elevated/50 border border-default text-sm space-y-1">
            <p v-if="addressToDeleteSummary.typeLabel"><span class="font-medium text-default">Type:</span> {{ addressToDeleteSummary.typeLabel }}</p>
            <p><span class="font-medium text-default">Address:</span> {{ addressToDeleteSummary.line }}</p>
            <p v-if="addressToDeleteSummary.contact"><span class="font-medium text-default">Contact:</span> {{ addressToDeleteSummary.contact }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="cancelDeleteAddress">Cancel</UButton>
          <UButton color="error" :loading="deletingAddress" @click="confirmDeleteAddress">Delete address</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectTypesStore } from '~/stores/projectTypes'
import { useServiceTypesStore } from '~/stores/serviceTypes'
import { useProjectAddressesStore } from '~/stores/projectAddresses'
import { useProjectsStore } from '~/stores/projects'
import { useLocationsStore } from '~/stores/locations'
import { useAuditLog } from '~/composables/useAuditLog'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { findLocationDuplicate } from '~/utils/locationUtils'
import { useFormDateField } from '~/composables/useFormDateField'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiFetch = $fetch as (url: string, opts?: any) => Promise<any>

interface Props {
  form: any
  editingProject: boolean
  readonly?: boolean
  locationOnlyEdit?: boolean
  fileUploadError?: string | null
  latestEstimate?: any
  loading?: boolean
  hasProjectEstimates?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  locationOnlyEdit: false,
  fileUploadError: null,
  latestEstimate: null,
  loading: false,
  hasProjectEstimates: false,
})

const emit = defineEmits<{
  'update:form': [value: any]
  'file-upload': [files: File[]]
  'validation-change': [isValid: boolean]
  'save-temp-addresses': [projectUuid: string, tempAddresses: any[]]
}>()

const corpStore = useCorporationStore()
const projectTypesStore = useProjectTypesStore()
const serviceTypesStore = useServiceTypesStore()
const projectAddressesStore = useProjectAddressesStore()
const projectsStore = useProjectsStore()
const locationsStore = useLocationsStore()

const localCustomersForSelect = computed(() =>
  Array.isArray(projectsStore.localCustomers) ? [...projectsStore.localCustomers] : []
)

const { formatCurrency } = useCurrencyFormat()

const { showAuditLogModal, generateAuditLogInfo, onAuditLogsLoaded, onAuditLogError, onExportAuditLogs } = useAuditLog({
  entityType: 'project',
  corporationUuid: computed(() => corpStore.selectedCorporationId || ''),
})

const uploadedFiles = ref<File[]>([])
const fileUploadError = ref<string | null>(null)
const fileInputKey = ref(0)
const projectDetailsLockLoading = ref(false)
const isProjectDetailsLocked = ref(false)
const projectDetailsLockReasons = ref<string[]>([])

const effectiveReadonly = computed(() => props.readonly || (isProjectDetailsLocked.value && !props.locationOnlyEdit))
const locationSectionReadonly = computed(() => effectiveReadonly.value && !props.locationOnlyEdit)
const dependencyLockExemptReadonly = computed(() => props.readonly && !isProjectDetailsLocked.value)
const addressesSectionReadonly = dependencyLockExemptReadonly
const attachmentsSectionReadonly = dependencyLockExemptReadonly

const projectDetailsLockBannerMessage = computed(() => {
  const reasons = projectDetailsLockReasons.value
  const suffix = ' Core project details cannot be edited, but you can still update Project Contacts / Addresses and file attachments.'
  if (!reasons.length) return `This project has linked estimates, purchase orders, or vendor invoices.${suffix}`
  const list = reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`
  return `This project has ${list}.${suffix}`
})

const fetchProjectDetailsLockStatus = async () => {
  const corporationUuid = props.form.corporation_uuid || corpStore.selectedCorporationId
  const projectUuid = props.form.id

  if (!props.editingProject || !projectUuid || !corporationUuid) {
    isProjectDetailsLocked.value = false
    projectDetailsLockReasons.value = []
    return
  }

  projectDetailsLockLoading.value = true
  try {
    const response: any = await $fetch('/api/projects/dependency-status', {
      query: { corporation_uuid: corporationUuid, project_uuid: projectUuid },
    })
    const data = response?.data ?? {}
    isProjectDetailsLocked.value = Boolean(data.details_edit_locked)
    projectDetailsLockReasons.value = Array.isArray(data.lock_reasons) ? data.lock_reasons : []
  } catch {
    isProjectDetailsLocked.value = false
    projectDetailsLockReasons.value = []
  } finally {
    projectDetailsLockLoading.value = false
  }
}

watch(
  () => [props.form.id, props.form.corporation_uuid, props.editingProject] as const,
  () => { fetchProjectDetailsLockStatus() },
  { immediate: true }
)

const showFilePreviewModal = ref(false)
const selectedFileForPreview = ref<any>(null)
const showAddressModal = ref(false)
const editingAddress = ref(false)
const editingAddressUuid = ref<string | null>(null)
const editingAddressIndex = ref<number | null>(null)
const isSavingAddress = ref(false)
const showCustomerModal = ref(false)
const showProjectTypeModal = ref(false)
const showServiceTypeModal = ref(false)
const savingProjectType = ref(false)
const savingServiceType = ref(false)
const projectTypeFormState = ref({ name: '', description: '' })
const serviceTypeFormState = ref({ name: '', description: '' })
const showLocationModal = ref(false)
const savingLocation = ref(false)
const locationFormState = ref({ location_name: '', location_code: '', description: '' })
const locationModalTargetRowIndex = ref<number | null>(null)
const showRemoveLocationRowModal = ref(false)
const locationRowIndexToRemove = ref<number | null>(null)
const showDeleteAddressModal = ref(false)
const addressToDelete = ref<any>(null)
const deletingAddress = ref(false)
const projectTypeOptions = ref<Array<{ uuid: string; name: string; description?: string | null; color?: string | null }>>([])
const projectTypeOptionsLoading = ref(false)
const addressForm = ref({
  address_type: null as string | null,
  contact_person: '',
  email: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  copied_from_billing_address_uuid: null as string | null,
})
const copiedFromAddressType = ref<string | null>(null)

const COPYABLE_ADDRESS_FIELD_KEYS = ['contact_person', 'email', 'phone', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code', 'country'] as const
type AddressFieldsSnapshot = Pick<typeof addressForm.value, (typeof COPYABLE_ADDRESS_FIELD_KEYS)[number]>
const addressFieldsBeforeCopy = ref<AddressFieldsSnapshot | null>(null)

const snapshotAddressFieldsBeforeCopy = () => {
  addressFieldsBeforeCopy.value = {
    contact_person: addressForm.value.contact_person,
    email: addressForm.value.email,
    phone: addressForm.value.phone,
    address_line_1: addressForm.value.address_line_1,
    address_line_2: addressForm.value.address_line_2,
    city: addressForm.value.city,
    state: addressForm.value.state,
    zip_code: addressForm.value.zip_code,
    country: addressForm.value.country,
  }
}

const restoreAddressFieldsBeforeCopy = () => {
  const snapshot = addressFieldsBeforeCopy.value
  if (!snapshot) return
  for (const key of COPYABLE_ADDRESS_FIELD_KEYS) {
    addressForm.value[key] = snapshot[key] ?? ''
  }
}

const clearCopyFromSelection = () => {
  if (addressFieldsBeforeCopy.value) {
    restoreAddressFieldsBeforeCopy()
    addressFieldsBeforeCopy.value = null
  }
  addressForm.value.copied_from_billing_address_uuid = null
  copiedFromAddressType.value = null
}

const availableAddressTypesToCopy = computed(() => {
  if (!addressForm.value.address_type) return []
  let existingAddresses: any[] = []
  if (props.form.id) {
    existingAddresses = projectAddressesStore.getAddresses(props.form.id) || []
  } else {
    existingAddresses = props.form.tempAddresses || []
  }
  const existingTypes = new Set(
    existingAddresses
      .filter((addr: any) => {
        if (editingAddress.value) {
          if (editingAddressUuid.value && addr.uuid === editingAddressUuid.value) return false
          if (editingAddressIndex.value !== null && addr.tempId && existingAddresses[editingAddressIndex.value]?.tempId === addr.tempId) return false
        }
        return addr.address_type && addr.address_type !== addressForm.value.address_type
      })
      .map((addr: any) => addr.address_type)
  )
  return addressTypeOptions.filter(option => existingTypes.has(option.value) && option.value !== addressForm.value.address_type)
})

const handleCopyFromAddressType = async (sourceAddressType: string, checked: boolean) => {
  if (checked) {
    if (!copiedFromAddressType.value) snapshotAddressFieldsBeforeCopy()
    try {
      let sourceAddress: any = null
      if (props.form.id) {
        const addresses = projectAddressesStore.getAddresses(props.form.id)
        if (!addresses || addresses.length === 0) await projectAddressesStore.fetchAddresses(props.form.id)
        const allSource = projectAddressesStore.getAddresses(props.form.id).filter((addr: any) => {
          if (editingAddress.value && editingAddressUuid.value && addr.uuid === editingAddressUuid.value) return false
          return addr.address_type === sourceAddressType
        })
        sourceAddress = allSource.find((addr: any) => addr.is_primary) || allSource[0]
      } else {
        const tempAddresses = props.form.tempAddresses || []
        const allSource = tempAddresses.filter((addr: any) => {
          if (editingAddress.value && editingAddressIndex.value !== null) {
            const editingAddr = tempAddresses[editingAddressIndex.value]
            if (editingAddr && addr.tempId === editingAddr.tempId) return false
          }
          return addr.address_type === sourceAddressType
        })
        sourceAddress = allSource.find((addr: any) => addr.is_primary) || allSource[0]
      }
      if (sourceAddress) {
        addressForm.value.contact_person = sourceAddress.contact_person || ''
        addressForm.value.email = sourceAddress.email || ''
        addressForm.value.phone = sourceAddress.phone || ''
        addressForm.value.address_line_1 = sourceAddress.address_line_1 || ''
        addressForm.value.address_line_2 = sourceAddress.address_line_2 || ''
        addressForm.value.city = sourceAddress.city || ''
        addressForm.value.state = sourceAddress.state || ''
        addressForm.value.zip_code = sourceAddress.zip_code || ''
        addressForm.value.country = sourceAddress.country || ''
        addressForm.value.copied_from_billing_address_uuid = sourceAddress.uuid || sourceAddress.tempId || null
        copiedFromAddressType.value = sourceAddressType
      } else {
        clearCopyFromSelection()
        const toast = useToast()
        const label = addressTypeOptions.find(opt => opt.value === sourceAddressType)?.label || sourceAddressType
        toast.add({ title: `No ${label} Found`, description: `No ${label.toLowerCase()} found for this project.`, color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
      }
    } catch {
      clearCopyFromSelection()
    }
  } else {
    clearCopyFromSelection()
  }
}

watch(() => addressForm.value.address_type, (newType, oldType) => {
  if (newType !== oldType) {
    if (copiedFromAddressType.value && addressFieldsBeforeCopy.value) {
      restoreAddressFieldsBeforeCopy()
      addressFieldsBeforeCopy.value = null
    }
    copiedFromAddressType.value = null
    addressForm.value.copied_from_billing_address_uuid = null
  }
})

const fileUploadErrorMessage = computed(() => props.fileUploadError || fileUploadError.value)
const leftPanel = ref<HTMLElement | null>(null)
const rightPanel = ref<HTMLElement | null>(null)
const showAreaRoomsHelper = ref(false)

const locationRows = computed(() => {
  return props.form && Array.isArray(props.form.location_breakdown) ? props.form.location_breakdown : []
})

const addLocationRow = () => {
  if (locationSectionReadonly.value) return
  const rows = [...locationRows.value]
  rows.push({ tempId: `loc-${Date.now()}-${rows.length}`, location_uuid: '', area_sq_ft: '', no_of_rooms: '' })
  handleFormUpdate('location_breakdown', rows)
}

const getDisabledLocationUuidsForRow = (currentIndex: number): string[] => {
  return locationRows.value
    .filter((row: any, i: number) => i !== currentIndex && row.location_uuid)
    .map((row: any) => String(row.location_uuid))
}

const normalizeNonNegativeInteger = (value: any) => {
  if (value === null || value === undefined || value === '') return value
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return ''
  return Math.max(0, Math.trunc(parsed))
}

const normalizeNonNegativeNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return value
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return ''
  return Math.max(0, parsed)
}

const updateLocationRowField = (index: number, field: 'location_uuid' | 'area_sq_ft' | 'no_of_rooms', value: any) => {
  if (field === 'location_uuid' && value && getDisabledLocationUuidsForRow(index).includes(String(value))) return
  const normalizedValue = field === 'no_of_rooms' ? normalizeNonNegativeInteger(value) : field === 'area_sq_ft' ? normalizeNonNegativeNumber(value) : value
  const rows = [...locationRows.value]
  if (!rows[index]) return
  const updatedRow: any = { ...rows[index], [field]: normalizedValue }
  if (field === 'area_sq_ft' && normalizedValue && Number(normalizedValue) > 0) updatedRow.no_of_rooms = null
  else if (field === 'no_of_rooms' && normalizedValue && Number(normalizedValue) > 0) updatedRow.area_sq_ft = null
  rows[index] = updatedRow
  handleFormUpdate('location_breakdown', rows)
}

const locationRowToRemoveSummary = computed(() => {
  const index = locationRowIndexToRemove.value
  if (index == null || index < 0) return null
  const row = locationRows.value[index] as any
  if (!row) return null
  const loc = row.location_uuid ? (locationsStore.getAll || []).find((l: any) => l.uuid === row.location_uuid) : null
  const locationLabel = loc ? (loc.location_code ? `${loc.location_name} (${loc.location_code})` : loc.location_name) : row.location_uuid ? 'Unknown location' : 'No location selected'
  const details: string[] = []
  if (row.area_sq_ft != null && String(row.area_sq_ft).trim() !== '') details.push(`Area: ${row.area_sq_ft} sq ft`)
  if (row.no_of_rooms != null && String(row.no_of_rooms).trim() !== '') details.push(`Rooms: ${row.no_of_rooms}`)
  return { locationLabel, details: details.length ? details.join(' · ') : null }
})

const requestRemoveLocationRow = (index: number) => {
  if (locationSectionReadonly.value) return
  if (index < 0 || index >= locationRows.value.length) return
  locationRowIndexToRemove.value = index
  showRemoveLocationRowModal.value = true
}

const cancelRemoveLocationRow = () => {
  showRemoveLocationRowModal.value = false
  locationRowIndexToRemove.value = null
}

const removeLocationRow = (index: number) => {
  if (locationSectionReadonly.value) return
  const rows = [...locationRows.value]
  if (index < 0 || index >= rows.length) return
  rows.splice(index, 1)
  handleFormUpdate('location_breakdown', rows)
}

const confirmRemoveLocationRow = () => {
  const index = locationRowIndexToRemove.value
  if (index != null) removeLocationRow(index)
  cancelRemoveLocationRow()
}

const handleCorporationChange = (corporation: any) => {
  if (corporation?.value) handleFormUpdate('corporation_uuid', corporation.value)
}

const handleCorporationClick = (event: MouseEvent) => {
  if (isCorporationDisabled.value) {
    event.preventDefault()
    event.stopPropagation()
    const toast = useToast()
    toast.add({ title: 'Cannot Change Corporation', description: 'Corporation cannot be changed when estimates exist for this project.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  }
}

const { parseUtcToCalendarDate, isStartAfterCompletion } = useFormDateField()

const projectInfo = computed(() => {
  const safeForm = {
    ...props.form,
    estimated_amount: props.form.estimated_amount ? String(props.form.estimated_amount) : '0',
    area_sq_ft: props.form.area_sq_ft ? String(props.form.area_sq_ft) : '0',
    no_of_rooms: props.form.no_of_rooms ? String(props.form.no_of_rooms) : '0',
    contingency_percentage: props.form.contingency_percentage ? String(props.form.contingency_percentage) : '0',
  }
  return generateAuditLogInfo(safeForm)
})

const projectAddresses = computed(() => {
  const saved = props.form.id ? (projectAddressesStore.getAddresses(props.form.id) || []) : []
  const savedAddresses = Array.isArray(saved) ? [...saved] : []
  const tempAddresses = Array.isArray(props.form.tempAddresses) ? [...props.form.tempAddresses] : []
  return [...savedAddresses, ...tempAddresses]
})

const shipmentAddresses = computed(() => projectAddresses.value.filter((addr: any) => addr.address_type === 'shipment'))
const billingAddresses = computed(() => projectAddresses.value.filter((addr: any) => addr.address_type === 'bill'))
const finalDestinationAddresses = computed(() => projectAddresses.value.filter((addr: any) => addr.address_type === 'final-destination'))

const estimateStatusMetadata = computed(() => {
  const statusCopy: Record<string, any> = {
    Draft: { label: 'Drafting...', helper: 'Latest estimate is still a draft.', class: 'text-amber-600' },
    Ready: { label: 'Ready for approval', helper: 'Latest estimate is ready for approval.', class: 'text-blue-600' },
    Approved: { label: 'Approved', helper: 'Latest estimate has been approved.', class: 'text-green-600' },
  }
  if (props.latestEstimate) {
    const status = props.latestEstimate.status || 'Draft'
    const copy = statusCopy[status] || { label: status, helper: `Latest estimate status: ${status}.`, class: 'text-gray-600' }
    const finalAmount = props.latestEstimate.final_amount ?? props.form.estimated_amount ?? 0
    return { ...copy, amount: formatCurrency(finalAmount), hasEstimate: true }
  }
  const numericAmount = Number(props.form.estimated_amount || 0)
  if (numericAmount > 0) {
    return { label: 'Manual amount', helper: 'This value was entered manually.', class: 'text-gray-600', amount: formatCurrency(numericAmount), hasEstimate: false }
  }
  const helperMessage = props.editingProject ? 'No estimate has been created for this project yet.' : 'After you create the project, add an estimate to populate this total automatically.'
  return { label: 'No estimate yet', helper: helperMessage, class: 'text-gray-500', amount: '', hasEstimate: false }
})

const canManageAddresses = computed(() => {
  const f = props.form
  return !!(f.project_name && f.project_id)
})

const isCorporationDisabled = computed(() => props.editingProject && (props.hasProjectEstimates || isProjectDetailsLocked.value))

const setPrimaryAddress = async (selectedAddress: any) => {
  if (addressesSectionReadonly.value) return
  try {
    if (props.form.id) {
      if (selectedAddress.uuid && selectedAddress.address_type) {
        await projectAddressesStore.updateAddress({ uuid: selectedAddress.uuid, is_primary: true })
        await projectAddressesStore.fetchAddresses(props.form.id)
      }
    } else {
      const tempAddresses = [...(props.form.tempAddresses || [])]
      if (selectedAddress.address_type) {
        tempAddresses.forEach((addr: any) => { if (addr.address_type === selectedAddress.address_type) addr.is_primary = false })
      } else {
        tempAddresses.forEach((addr: any) => { addr.is_primary = false })
      }
      const idx = tempAddresses.findIndex((addr: any) => addr.tempId === selectedAddress.tempId || addr.uuid === selectedAddress.uuid)
      if (idx !== -1) {
        tempAddresses[idx].is_primary = true
        emit('update:form', { ...props.form, tempAddresses })
      }
    }
    const toast = useToast()
    toast.add({ title: 'Success', description: 'Primary address updated successfully', color: 'success', icon: 'i-heroicons-check-circle' })
  } catch (error) {
    console.error('Error setting primary address:', error)
    const toast = useToast()
    toast.add({ title: 'Error', description: 'Failed to update primary address', color: 'error', icon: 'i-heroicons-x-circle' })
  }
}

const getCountryName = (countryCode: string) => {
  const country = countries.find(c => c.code === countryCode)
  return country ? country.name : countryCode
}

const hasAreaOrRooms = computed(() => {
  const hasArea = props.form.area_sq_ft && props.form.area_sq_ft > 0
  const hasRooms = props.form.no_of_rooms && props.form.no_of_rooms > 0
  return hasArea || hasRooms
})

const validateRequiredFields = () => {
  const errors: string[] = []
  const f = props.form
  if (!f.corporation_uuid) errors.push('Corporation')
  if (!f.project_name || !f.project_name.trim()) errors.push('Project Name')
  if (!f.project_start_date) errors.push('Project Start Date')
  if (!f.project_estimated_completion_date) errors.push('Estimated Project Completion Date')
  if (f.project_start_date && f.project_estimated_completion_date) {
    const startDate = parseUtcToCalendarDate(f.project_start_date)
    const completionDate = parseUtcToCalendarDate(f.project_estimated_completion_date)
    if (isStartAfterCompletion(startDate, completionDate)) {
      errors.push('Project Start Date must be on or before Estimated Project Completion Date')
    }
  }
  if (!f.enable_location_wise) {
    if (!hasAreaOrRooms.value) errors.push('Area (Sq ft) or Number of Rooms (at least one is required)')
  } else {
    const rows = Array.isArray(f.location_breakdown) ? f.location_breakdown : []
    const invalidRow = rows.some((row: any) => {
      const areaVal = row?.area_sq_ft != null && row?.area_sq_ft !== '' ? Number(row.area_sq_ft) : 0
      const roomsVal = row?.no_of_rooms != null && row?.no_of_rooms !== '' ? Number(row.no_of_rooms) : 0
      return areaVal <= 0 && roomsVal <= 0
    })
    if (rows.length > 0 && invalidRow) {
      errors.push('For each location row, enter either Area (Sq ft) or Number of Rooms')
    }
  }
  return errors
}

const projectStatusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Bidding', value: 'Bidding' },
  { label: 'Started', value: 'Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'On Hold', value: 'On Hold' },
]

const countries = [
  { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }, { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' }, { code: 'CN', name: 'China' }, { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' }, { code: 'ZA', name: 'South Africa' },
  { code: 'SG', name: 'Singapore' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' }, { code: 'KE', name: 'Kenya' }, { code: 'GH', name: 'Ghana' },
  { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'CH', name: 'Switzerland' },
]

const countryOptions = computed(() => countries.map(c => ({ label: c.name, value: c.code })))

const addressTypeOptions = [
  { label: 'Shipment Address', value: 'shipment' },
  { label: 'Bill Address', value: 'bill' },
  { label: 'Final Destination', value: 'final-destination' },
]

const ADDRESS_TYPE_LABELS: Record<string, string> = { shipment: 'Shipment', bill: 'Billing', 'final-destination': 'Final destination' }

const handleFormUpdate = (field: string, value: any) => {
  if (effectiveReadonly.value) return
  const normalizedValue = field === 'no_of_rooms' ? normalizeNonNegativeInteger(value) : value
  const updatedForm = { ...props.form, [field]: normalizedValue }
  if (field === 'area_sq_ft' && normalizedValue && normalizedValue > 0) updatedForm.no_of_rooms = null
  else if (field === 'no_of_rooms' && normalizedValue && normalizedValue > 0) updatedForm.area_sq_ft = null
  if (field === 'location_basis_area' && value) updatedForm.location_basis_no_of_rooms = false
  else if (field === 'location_basis_no_of_rooms' && value) updatedForm.location_basis_area = false
  emit('update:form', updatedForm)
}

const handleProjectTypeValueUpdate = (value: any) => {
  let uuidValue = ''
  if (typeof value === 'string' && value.trim().length > 0) uuidValue = value.trim()
  else if (value && typeof value === 'object' && value.value) uuidValue = typeof value.value === 'string' ? value.value : ''
  handleFormUpdate('project_type_uuid', uuidValue)
}

const handleProjectTypeChange = (projectType: any) => {
  let uuidValue = ''
  if (typeof projectType === 'string' && projectType.trim().length > 0) uuidValue = projectType.trim()
  else if (projectType && typeof projectType === 'object' && projectType.value) uuidValue = typeof projectType.value === 'string' ? projectType.value.trim() : ''
  else if (!projectType) uuidValue = ''
  else return
  handleFormUpdate('project_type_uuid', uuidValue)
}

const handleServiceTypeValueUpdate = (value: any) => {
  let uuidValue = ''
  if (typeof value === 'string' && value.trim().length > 0) uuidValue = value.trim()
  else if (value && typeof value === 'object' && value.value) uuidValue = typeof value.value === 'string' ? value.value : ''
  handleFormUpdate('service_type_uuid', uuidValue)
}

const handleServiceTypeChange = (serviceType: any) => {
  let uuidValue = ''
  if (typeof serviceType === 'string' && serviceType.trim().length > 0) uuidValue = serviceType.trim()
  else if (serviceType && typeof serviceType === 'object' && serviceType.value) uuidValue = typeof serviceType.value === 'string' ? serviceType.value.trim() : ''
  else if (!serviceType) uuidValue = ''
  else return
  handleFormUpdate('service_type_uuid', uuidValue)
}

const handleOnlyTotalChange = (value: boolean | string) => {
  const boolValue = typeof value === 'boolean' ? value : value === 'true'
  const updatedForm = { ...props.form, only_total: boolValue }
  if (boolValue) { updatedForm.enable_labor = false; updatedForm.enable_material = false }
  emit('update:form', updatedForm)
}

const handleLaborChange = (value: boolean | string) => {
  const boolValue = typeof value === 'boolean' ? value : value === 'true'
  const updatedForm = { ...props.form, enable_labor: boolValue }
  if (boolValue) updatedForm.only_total = false
  emit('update:form', updatedForm)
}

const handleMaterialChange = (value: boolean | string) => {
  const boolValue = typeof value === 'boolean' ? value : value === 'true'
  const updatedForm = { ...props.form, enable_material: boolValue }
  if (boolValue) updatedForm.only_total = false
  emit('update:form', updatedForm)
}

const previewFile = (attachment: any) => {
  selectedFileForPreview.value = {
    id: attachment.uuid || attachment.tempId,
    file_name: attachment.document_name || attachment.name,
    name: attachment.document_name || attachment.name,
    file_type: attachment.mime_type || attachment.type,
    type: attachment.mime_type || attachment.type,
    file_size: attachment.file_size || attachment.size,
    size: attachment.file_size || attachment.size,
    file_url: attachment.file_url || attachment.url || attachment.fileData,
    url: attachment.file_url || attachment.url || attachment.fileData,
  }
  showFilePreviewModal.value = true
}

const closeFilePreview = () => {
  showFilePreviewModal.value = false
  selectedFileForPreview.value = null
}

const removeFile = async (index: number) => {
  const attachment = props.form.attachments[index]
  if (attachment.uuid && props.editingProject) {
    try {
      await apiFetch('/api/projects/remove-file', { method: 'POST', body: { documentUuid: attachment.uuid } })
    } catch (error) {
      console.error('Error deleting file from storage:', error)
    }
  }
  if (attachment.name || attachment.document_name) {
    const fileName = attachment.name || attachment.document_name
    const fileSize = attachment.size || attachment.file_size
    const fileIndex = uploadedFiles.value.findIndex(f => f.name === fileName && f.size === fileSize)
    if (fileIndex !== -1) uploadedFiles.value.splice(fileIndex, 1)
  } else if (index < uploadedFiles.value.length) {
    uploadedFiles.value.splice(index, 1)
  }
  const updatedAttachments = [...props.form.attachments]
  updatedAttachments.splice(index, 1)
  emit('update:form', { ...props.form, attachments: updatedAttachments })
  fileInputKey.value += 1
}

const handleFileUpload = async () => {
  fileUploadError.value = null
  if (uploadedFiles.value.length === 0) {
    emit('update:form', { ...props.form, attachments: [] })
    return
  }
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  const maxSize = 10 * 1024 * 1024
  for (const file of uploadedFiles.value) {
    if (!allowedTypes.includes(file.type)) { fileUploadError.value = 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'; return }
    if (file.size > maxSize) { fileUploadError.value = 'File size too large. Maximum size is 10MB per file.'; return }
  }
  try {
    const attachments = await Promise.all(
      uploadedFiles.value.map(async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const fileData = e.target?.result
            if (typeof fileData !== 'string') { reject(new Error('Failed to read file')); return }
            resolve({ name: file.name, type: file.type, size: file.size, url: fileData, fileData, file, isUploaded: false, tempId: Date.now() + Math.random().toString(36).substring(2) })
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })
      })
    )
    const existingAttachments = props.form.attachments.filter((att: any) => att.isUploaded)
    const allAttachments = [...existingAttachments, ...attachments]
    emit('update:form', { ...props.form, attachments: allAttachments })
    fileUploadError.value = null
  } catch (error) {
    console.error('Error processing files:', error)
    fileUploadError.value = 'Failed to process files. Please try again.'
  }
}

watch(() => uploadedFiles.value, () => {
  handleFileUpload()
  emit('file-upload', uploadedFiles.value)
}, { deep: true })

watch(() => props.fileUploadError, (newError) => {
  if (newError) fileUploadError.value = null
})

watch(() => hasAreaOrRooms.value, (isValid) => {
  emit('validation-change', isValid)
}, { immediate: true })

const validateForm = () => {
  const errors = validateRequiredFields()
  if (errors.length > 0) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: `Please fill in the following required fields: ${errors.join(', ')}`, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return false
  }
  return true
}

defineExpose({ validateForm, isProjectDetailsLocked, projectDetailsLockBannerMessage, addressesSectionReadonly, attachmentsSectionReadonly, removeFile, handleFormUpdate })

const fetchProjectTypeOptions = async (force = false) => {
  if (projectTypeOptionsLoading.value) return
  if (!force && projectTypeOptions.value.length > 0) return
  projectTypeOptionsLoading.value = true
  try {
    const response = await $fetch<{ success?: boolean; data?: Array<{ uuid: string; name: string }> }>('/api/project-types/options')
    projectTypeOptions.value = Array.isArray(response?.data) ? response.data : []
  } catch {
    projectTypeOptions.value = []
  } finally {
    projectTypeOptionsLoading.value = false
  }
}

const openCustomerModal = () => {
  if (effectiveReadonly.value) return
  const corporationUuid = props.form.corporation_uuid || corpStore.selectedCorporationId
  if (!corporationUuid) {
    const toast = useToast()
    toast.add({ title: 'Error', description: 'Please select a corporation first before adding customers.', icon: 'i-heroicons-exclamation-triangle', color: 'error' })
    return
  }
  showCustomerModal.value = true
}

const handleCustomerSaved = async (savedCustomer?: { uuid?: string } | null) => {
  const corporationUuid = props.form.corporation_uuid || corpStore.selectedCorporationId
  const projectUuid = props.form.uuid || props.form.id || null
  if (!corporationUuid) return

  const customerUuid = savedCustomer?.uuid
    ? String(savedCustomer.uuid).trim().toLowerCase()
    : ''

  if (customerUuid && savedCustomer) {
    const alreadyListed = projectsStore.localCustomers.some(
      c => String(c?.uuid ?? '').trim().toLowerCase() === customerUuid,
    )
    if (!alreadyListed) {
      projectsStore.localCustomers = [...projectsStore.localCustomers, savedCustomer]
    }
  }

  await projectsStore.fetchLocalCustomers(corporationUuid, projectUuid, true)

  if (!customerUuid || effectiveReadonly.value) return
  await nextTick()
  handleFormUpdate('customer_uuid', customerUuid)
}

const openProjectTypeModal = () => {
  if (effectiveReadonly.value) return
  projectTypeFormState.value = { name: '', description: '' }
  showProjectTypeModal.value = true
}

const openServiceTypeModal = () => {
  if (effectiveReadonly.value) return
  serviceTypeFormState.value = { name: '', description: '' }
  showServiceTypeModal.value = true
}

const saveNewProjectType = async () => {
  const name = (projectTypeFormState.value.name || '').trim()
  if (!name) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Project type name is required.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  savingProjectType.value = true
  try {
    const result = await projectTypesStore.createProjectType({ name, description: (projectTypeFormState.value.description || '').trim() || undefined, color: '#3B82F6', isActive: true })
    showProjectTypeModal.value = false
    if (result?.uuid) handleFormUpdate('project_type_uuid', result.uuid)
    const toast = useToast()
    toast.add({ title: 'Project type created', description: `"${name}" has been created successfully.`, color: 'success', icon: 'i-heroicons-check-circle' })
    await fetchProjectTypeOptions(true)
  } catch (err: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: err?.message || 'Failed to create project type.', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    savingProjectType.value = false
  }
}

const saveNewServiceType = async () => {
  const name = (serviceTypeFormState.value.name || '').trim()
  if (!name) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Service type name is required.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  savingServiceType.value = true
  try {
    const result = await serviceTypesStore.createServiceType({ name, description: (serviceTypeFormState.value.description || '').trim() || undefined, color: '#3D5C7C', isActive: true })
    showServiceTypeModal.value = false
    if (result?.uuid) handleFormUpdate('service_type_uuid', result.uuid)
    const toast = useToast()
    toast.add({ title: 'Service type created', description: `"${name}" has been created successfully.`, color: 'success', icon: 'i-heroicons-check-circle' })
  } catch (err: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: err?.message || 'Failed to create service type.', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    savingServiceType.value = false
  }
}

const openLocationModal = (rowIndex: number | null = null) => {
  if (locationSectionReadonly.value) return
  locationModalTargetRowIndex.value = rowIndex
  locationFormState.value = { location_name: '', location_code: '', description: '' }
  showLocationModal.value = true
}

const applyCreatedLocationToRow = (locationUuid: string) => {
  const rows = [...locationRows.value]
  let targetIndex = locationModalTargetRowIndex.value
  if (targetIndex == null || targetIndex < 0 || targetIndex >= rows.length) {
    targetIndex = rows.findIndex((row: any) => !row.location_uuid)
  }
  if (targetIndex < 0 || !rows[targetIndex]) return
  rows[targetIndex] = { ...rows[targetIndex], location_uuid: locationUuid }
  handleFormUpdate('location_breakdown', rows)
  locationModalTargetRowIndex.value = null
}

const saveNewLocation = async () => {
  const location_name = (locationFormState.value.location_name || '').trim()
  const location_code = (locationFormState.value.location_code || '').trim()
  if (!location_name) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Location name is required.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  await locationsStore.fetchLocations(true)
  const duplicate = findLocationDuplicate(locationsStore.getAll, { location_name, location_code: location_code || undefined })
  if (duplicate) {
    const toast = useToast()
    const message = duplicate.field === 'location_code' ? `Location code "${duplicate.existing.location_code}" is already used by "${duplicate.existing.location_name}".` : `Location "${duplicate.existing.location_name}" already exists. Location names must be unique.`
    toast.add({ title: 'Duplicate location', description: message, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  savingLocation.value = true
  try {
    const created = await locationsStore.createLocation({ location_name, location_code: location_code || undefined, description: (locationFormState.value.description || '').trim() || undefined, active: true })
    await locationsStore.fetchLocations(true)
    if (created?.uuid) applyCreatedLocationToRow(created.uuid)
    showLocationModal.value = false
    const toast = useToast()
    toast.add({ title: 'Location created', description: `"${location_name}" has been created successfully.`, color: 'success', icon: 'i-heroicons-check-circle' })
  } catch (err: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: err?.message || 'Failed to create location.', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    savingLocation.value = false
  }
}

const openAddressModal = () => {
  if (addressesSectionReadonly.value) return
  editingAddress.value = false
  editingAddressUuid.value = null
  editingAddressIndex.value = null
  resetAddressForm()
  showAddressModal.value = true
}

const editAddress = (address: any) => {
  if (addressesSectionReadonly.value) return
  editingAddress.value = true
  if (address.uuid) {
    editingAddressUuid.value = address.uuid
    editingAddressIndex.value = null
  } else {
    editingAddressUuid.value = null
    editingAddressIndex.value = (props.form.tempAddresses || []).findIndex((a: any) => a.tempId === address.tempId)
  }
  addressForm.value = {
    address_type: address.address_type || null,
    contact_person: address.contact_person || '',
    email: address.email || '',
    phone: address.phone || '',
    address_line_1: address.address_line_1 || '',
    address_line_2: address.address_line_2 || '',
    city: address.city || '',
    state: address.state || '',
    zip_code: address.zip_code || '',
    country: address.country || '',
    copied_from_billing_address_uuid: address.copied_from_billing_address_uuid || null,
  }
  if (address.copied_from_billing_address_uuid) copiedFromAddressType.value = 'bill'
  else copiedFromAddressType.value = null
  showAddressModal.value = true
}

const closeAddressModal = () => {
  showAddressModal.value = false
  editingAddress.value = false
  editingAddressUuid.value = null
  editingAddressIndex.value = null
  resetAddressForm()
}

const resetAddressForm = () => {
  addressForm.value = { address_type: null, contact_person: '', email: '', phone: '', address_line_1: '', address_line_2: '', city: '', state: '', zip_code: '', country: '', copied_from_billing_address_uuid: null }
  copiedFromAddressType.value = null
  addressFieldsBeforeCopy.value = null
}

const ensureAddressSelection = (addresses: any[], newAddress: any): any => {
  if (!newAddress.address_type) return newAddress
  const addressesOfSameType = addresses.filter((addr: any) => addr.address_type === newAddress.address_type && (addr.uuid !== newAddress.uuid && addr.tempId !== newAddress.tempId))
  if (addressesOfSameType.length === 0) return { ...newAddress, is_primary: true }
  return newAddress
}

const ensureAtLeastOnePerType = (addresses: any[]) => {
  const updatedAddresses = [...addresses]
  const addressTypes = ['shipment', 'bill', 'final-destination']
  for (const addressType of addressTypes) {
    const addressesOfType = updatedAddresses.filter((addr: any) => addr.address_type === addressType)
    if (addressesOfType.length >= 1) {
      const hasSelected = addressesOfType.some((addr: any) => addr.is_primary)
      if (!hasSelected) {
        const firstOfType = addressesOfType[0]
        const firstIndex = updatedAddresses.findIndex((addr: any) => {
          if (firstOfType.uuid) return addr.uuid === firstOfType.uuid
          if (firstOfType.tempId) return addr.tempId === firstOfType.tempId
          return false
        })
        if (firstIndex !== -1) updatedAddresses[firstIndex].is_primary = true
      }
    }
  }
  return updatedAddresses
}

const saveAddress = async () => {
  if (!addressForm.value.address_type) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Address Type is required', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }
  if (!addressForm.value.address_line_1.trim()) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Address Line 1 is required', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }
  isSavingAddress.value = true
  try {
    if (props.form.id) {
      const allAddresses = projectAddresses.value
      let addressToSave: any = { ...addressForm.value }
      addressToSave = ensureAddressSelection(allAddresses, addressToSave)
      if (editingAddress.value && editingAddressUuid.value) {
        await projectAddressesStore.updateAddress({ uuid: editingAddressUuid.value, ...addressToSave, is_primary: !!addressToSave.is_primary })
      } else {
        await projectAddressesStore.createAddress({ project_uuid: props.form.id, ...addressToSave, is_primary: !!addressToSave.is_primary })
      }
      await projectAddressesStore.fetchAddresses(props.form.id)
      const savedAddresses = projectAddressesStore.getAddresses(props.form.id) || []
      const addressesToUpdate = ensureAtLeastOnePerType(savedAddresses)
      for (const addr of addressesToUpdate) {
        if (addr.is_primary && addr.uuid) {
          const currentSaved = savedAddresses.find((a: any) => a.uuid === addr.uuid)
          if (!currentSaved || !currentSaved.is_primary) {
            await projectAddressesStore.updateAddress({ uuid: addr.uuid, is_primary: true })
          }
        }
      }
      await projectAddressesStore.fetchAddresses(props.form.id)
    } else {
      const allAddresses = projectAddresses.value
      let tempAddress: any = { ...addressForm.value, tempId: Date.now() + Math.random().toString(36).substring(2), isTemp: true }
      tempAddress = ensureAddressSelection(allAddresses, tempAddress)
      if (editingAddress.value && editingAddressIndex.value !== null) {
        const tempAddresses = [...(props.form.tempAddresses || [])]
        tempAddresses[editingAddressIndex.value] = tempAddress
        const updatedAddresses = ensureAtLeastOnePerType(tempAddresses)
        emit('update:form', { ...props.form, tempAddresses: updatedAddresses })
      } else {
        const tempAddresses = [...(props.form.tempAddresses || []), tempAddress]
        const updatedAddresses = ensureAtLeastOnePerType(tempAddresses)
        emit('update:form', { ...props.form, tempAddresses: updatedAddresses })
      }
    }
    closeAddressModal()
    const toast = useToast()
    toast.add({ title: 'Success', description: editingAddress.value ? 'Address updated successfully' : 'Address added successfully', color: 'success', icon: 'i-heroicons-check-circle' })
  } catch (error) {
    console.error('Error saving address:', error)
    const toast = useToast()
    toast.add({ title: 'Error', description: 'Failed to save address', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isSavingAddress.value = false
  }
}

const addressToDeleteSummary = computed(() => {
  const address = addressToDelete.value
  if (!address) return null
  const parts = [address?.address_line_1, address?.address_line_2, [address?.city, address?.state].filter(Boolean).join(', '), address?.zip_code].filter(p => p != null && String(p).trim() !== '')
  return {
    typeLabel: address.address_type ? ADDRESS_TYPE_LABELS[address.address_type] || address.address_type : null,
    line: parts.join(', ') || 'Address',
    contact: address.contact_person || null,
  }
})

const requestDeleteAddress = async (address: any) => {
  if (addressesSectionReadonly.value) return
  if (address.uuid) {
    try {
      const usage = await projectAddressesStore.checkAddressUsage(address.uuid)
      if (usage.inUse) {
        const toast = useToast()
        const poCount = usage.purchaseOrderCount
        const coCount = usage.changeOrderCount
        const parts: string[] = []
        if (poCount > 0) parts.push(`${poCount} purchase order${poCount === 1 ? '' : 's'}`)
        if (coCount > 0) parts.push(`${coCount} change order${coCount === 1 ? '' : 's'}`)
        toast.add({ title: 'Address in use', description: `This address is used on ${parts.join(' and ')} and cannot be deleted.`, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
        return
      }
    } catch {
      const toast = useToast()
      toast.add({ title: 'Unable to verify usage', description: 'Could not verify whether this address is in use. Please try again.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
      return
    }
  }
  addressToDelete.value = address
  showDeleteAddressModal.value = true
}

const cancelDeleteAddress = () => {
  showDeleteAddressModal.value = false
  addressToDelete.value = null
}

const deleteAddress = async (address: any) => {
  if (address.uuid) {
    const projectUuid = address.project_uuid || props.form.id
    if (!projectUuid) throw new Error('Project is required to delete a saved address.')
    await projectAddressesStore.deleteAddress(address.uuid, projectUuid)
    if (props.form.id) {
      await projectAddressesStore.fetchAddresses(props.form.id)
      const saved = projectAddressesStore.getAddresses(props.form.id) || []
      const addressesToUpdate = ensureAtLeastOnePerType(saved)
      for (const addr of addressesToUpdate) {
        if (addr.is_primary && addr.uuid) {
          const currentSaved = saved.find((a: any) => a.uuid === addr.uuid)
          if (!currentSaved || !currentSaved.is_primary) {
            await projectAddressesStore.updateAddress({ uuid: addr.uuid, is_primary: true })
          }
        }
      }
      await projectAddressesStore.fetchAddresses(props.form.id)
    }
  } else {
    const tempAddresses = (props.form.tempAddresses || []).filter((a: any) => a.tempId !== address.tempId)
    const updatedAddresses = ensureAtLeastOnePerType(tempAddresses)
    emit('update:form', { ...props.form, tempAddresses: updatedAddresses })
  }
}

const confirmDeleteAddress = async () => {
  const address = addressToDelete.value
  if (!address) return
  deletingAddress.value = true
  try {
    await deleteAddress(address)
    cancelDeleteAddress()
    const toast = useToast()
    toast.add({ title: 'Success', description: 'Address deleted successfully', color: 'success', icon: 'i-heroicons-check-circle' })
  } catch (error: any) {
    console.error('Error deleting address:', error)
    const toast = useToast()
    const message = String(error?.message || '')
    const inUse = message.toLowerCase().includes('in use') || message.toLowerCase().includes('purchase order') || message.toLowerCase().includes('change order')
    toast.add({ title: inUse ? 'Address in use' : 'Error', description: inUse ? 'This address is used on one or more purchase orders or change orders and cannot be deleted.' : (message || 'Failed to delete address'), color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingAddress.value = false
  }
}

watch(() => props.form.id, (newId, oldId) => {
  if (newId && !oldId) {
    // project just created - addresses are saved by parent
  } else if (newId) {
    projectAddressesStore.fetchAddresses(newId)
  }
}, { immediate: true })

watch(() => props.form.corporation_uuid, async (newCorpUuid) => {
  if (newCorpUuid) {
    await projectsStore.fetchProjectsMetadata(newCorpUuid)
    const projectUuid = props.form.uuid || props.form.id || null
    await projectsStore.fetchLocalCustomers(newCorpUuid, projectUuid, false)
  } else {
    projectsStore.clearLocalCustomers()
  }
})

watch(
  () => [props.form.corporation_uuid, corpStore.selectedCorporationId],
  ([formCorpUuid, selectedCorpId]) => {
    const currentFormCorp = String(formCorpUuid || '').trim()
    const selectedCorp = String(selectedCorpId || '').trim()
    if (currentFormCorp || !selectedCorp) return
    handleFormUpdate('corporation_uuid', selectedCorp)
  },
  { immediate: true }
)

watch(() => props.form.contingency_percentage, (newValue) => {
  if (newValue !== null && newValue !== undefined && newValue !== '' && Number(newValue) > 100) {
    const toast = useToast()
    toast.add({ title: 'Invalid Contingency Percentage', description: 'Contingency percentage cannot exceed 100%.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    handleFormUpdate('contingency_percentage', null)
  }
})

onMounted(async () => {
  await fetchProjectTypeOptions()
  await locationsStore.fetchLocations(true)
  const corpUuid = props.form.corporation_uuid || corpStore.selectedCorporationId
  if (corpUuid) {
    await projectsStore.fetchProjectsMetadata(corpUuid)
    const projectUuid = props.form.uuid || props.form.id || null
    await projectsStore.fetchLocalCustomers(corpUuid, projectUuid, false)
  }
})
</script>
