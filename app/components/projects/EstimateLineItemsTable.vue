<template>
  <div class="w-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading cost codes...</p>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!loading && visibleDivisions.length === 0" class="flex flex-col items-center justify-center py-12">
      <UIcon name="i-heroicons-list-bullet" class="w-12 h-12 text-gray-400 mb-4" />
      <p class="text-gray-500 text-lg font-medium">No cost codes found</p>
      <p class="text-gray-400 text-sm text-center">
        Cost codes will appear here once they are configured in your corporation settings.
      </p>
    </div>

    <!-- Table Content -->
    <div v-else>
      <!-- Table Header -->
      <div class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div class="flex gap-4 px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 tracking-wider">
          <div class="flex-1">Cost Codes</div>
          <div class="w-32">Estimation</div>
          <div v-if="showLabor" class="w-48">Labor</div>
          <div v-if="showMaterial" class="w-48">Material</div>
          <div v-if="showTotal" class="w-48 text-right">Total</div>
          <div class="w-20 text-center">{{ isReadOnly ? '' : 'Actions' }}</div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="bg-white dark:bg-gray-800">
      <!-- Main divisions (included in primary totals) -->
      <div
        v-for="division in mainVisibleDivisions"
        :key="division.uuid"
        class="border-b border-gray-100 dark:border-gray-700"
      >
        <!-- Division Row -->
        <div class="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700">
          <div class="flex-1">
            <span class="font-bold text-gray-900 dark:text-gray-100">
              <template v-if="division.division_number">{{ division.division_number }} </template>{{ division.division_name }}
            </span>
          </div>
          <div class="w-32"></div>
          <div v-if="showLabor" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getDivisionLaborTotal(division)) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getDivisionMaterialTotal(division)) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getDivisionTotal(division)) }}
          </div>
          <div class="w-20"></div>
        </div>

         <!-- Cost Codes under Division -->
         <div v-for="costCode in division.costCodes" :key="costCode.uuid">
           <!-- Cost Code with Sub-accounts - Show as Accordion -->
           <div v-if="costCode.subCostCodes && costCode.subCostCodes.length > 0">
             <CustomAccordion 
               :items="getCostCodeAccordionItems(costCode)" 
               class="w-full"
               type="single"
               :collapsible="true"
             >
               <template #trigger="{ item, isOpen }">
                 <div class="flex gap-4 w-full items-center px-4 py-2 group cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 border-l-4 border-transparent hover:border-primary-400 dark:hover:border-primary-500" 
                      :title="`Click to ${isOpen ? 'collapse' : 'expand'} sub-accounts`">
                   <div class="flex-1 flex items-center gap-2">
                     <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-200">
                       {{ costCode.cost_code_number }} {{ costCode.cost_code_name }}
                     </span>
                     <UIcon 
                       name="i-heroicons-chevron-right" 
                       class="w-5 h-5 text-primary-600 dark:text-primary-400 transition-transform duration-200 flex-shrink-0"
                       :class="{ 'rotate-90': isOpen }"
                     />
                   </div>
                   <div class="w-32">
                     <!-- Empty space for alignment - no estimate button for calculated totals -->
                   </div>
                   <div v-if="showLabor" class="w-48">
                     <UInput
                       :model-value="formatCurrency(getCostCodeLaborTotal(costCode))"
                       type="text"
                       size="xs"
                       class="w-48"
                       :ui="{ base: 'text-right font-mono' }"
                       disabled
                     />
                   </div>
                   <div v-if="showMaterial" class="w-48">
                     <UInput
                       :model-value="formatCurrency(getCostCodeMaterialTotal(costCode))"
                       type="text"
                       size="xs"
                       class="w-48"
                       :ui="{ base: 'text-right font-mono' }"
                       disabled
                     />
                   </div>
                   <div v-if="showTotal" class="w-48">
                     <UInput
                       :model-value="formatCurrency(getCostCodeTotal(costCode))"
                       type="text"
                       size="xs"
                       class="w-48"
                       :ui="{ base: 'text-right font-mono' }"
                       disabled
                     />
                   </div>
                   <div class="w-20"></div>
                 </div>
               </template>
               <template #content="{ item }">
                 <div class="px-4 pb-3 bg-gradient-to-r from-primary-50/50 to-primary-100/50 dark:from-primary-900/10 dark:to-primary-800/10">
                   <!-- Sub Cost Codes -->
                   <div v-for="subCostCode in item.subCostCodes" :key="subCostCode.uuid" 
                        class="border-b border-gray-50 dark:border-gray-600 last:border-b-0 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors duration-200 rounded-md px-2 py-1">
                     <!-- Sub Cost Code Row -->
                     <div class="flex gap-4 py-2">
                       <div class="flex-1 pl-8">
                         <span class="text-xs text-gray-600 dark:text-gray-400">
                           {{ subCostCode.cost_code_number }} {{ subCostCode.cost_code_name }}
                         </span>
                       </div>
                       <!-- Show inputs only if no third level cost codes -->
                       <template v-if="!subCostCode.subSubCostCodes || subCostCode.subSubCostCodes.length === 0">
                        <div class="w-32">
                          <UButton
                            data-testid="estimate-button"
                            :label="isApplied(subCostCode.uuid) ? 'Applied' : 'Estimate'"
                            size="xs"
                            :color="isApplied(subCostCode.uuid) ? 'success' : 'neutral'"
                            :variant="isApplied(subCostCode.uuid) ? 'soft' : 'solid'"
                            @click="openEstimateModal(subCostCode)"
                          />
                        </div>
                         <div v-if="showLabor" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subCostCode.labor_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div v-if="showMaterial" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subCostCode.material_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div v-if="showTotal" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subCostCode.total_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div class="w-20 flex items-center justify-center gap-1">
               <UButton
                 v-if="!isReadOnly"
                 data-testid="delete-cost-code"
                 icon="mingcute:delete-fill"
                 size="xs"
                 color="error"
                 variant="ghost"
                 @click="deleteSubCostCode(subCostCode)"
               />
                         </div>
                       </template>
                       <!-- No columns shown when third level cost codes exist -->
                       <template v-else>
                         <div class="w-32"></div>
                         <div v-if="showLabor" class="w-48"></div>
                         <div v-if="showMaterial" class="w-48"></div>
                         <div v-if="showTotal" class="w-48 text-right font-mono text-sm">
                           {{ formatCurrency(getSubCostCodeTotal(subCostCode)) }}
                         </div>
                         <div class="w-20"></div>
                       </template>
                     </div>

                     <!-- Sub-Sub Cost Codes (Third Level) - Always Visible -->
                     <div v-if="subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0" 
                          class="mt-2 p-3 rounded-md border-2 transition-all duration-200 bg-gradient-to-br from-primary-50 to-primary-200 border-primary-300 shadow-sm dark:from-primary-900/20 dark:to-primary-800/20 dark:border-primary-400">
                       <div v-for="subSubCostCode in subCostCode.subSubCostCodes" :key="subSubCostCode.uuid" 
                            class="flex gap-4 py-1">
                         <div class="flex-1">
                           <span class="text-xs text-gray-700 dark:text-gray-300">
                             {{ subSubCostCode.cost_code_number }} {{ subSubCostCode.cost_code_name }}
                           </span>
                         </div>
                         <div class="w-32">
                           <UButton
                             data-testid="estimate-button"
                             :label="isApplied(subSubCostCode.uuid) ? 'Applied' : 'Estimate'"
                             size="xs"
                             :color="isApplied(subSubCostCode.uuid) ? 'success' : 'neutral'"
                             :variant="isApplied(subSubCostCode.uuid) ? 'soft' : 'solid'"
                             @click="openEstimateModal(subSubCostCode)"
                           />
                         </div>
                         <div v-if="showLabor" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subSubCostCode.labor_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div v-if="showMaterial" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subSubCostCode.material_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div v-if="showTotal" class="w-48">
                            <UInput
                              :model-value="formatCurrency(parseFloat(subSubCostCode.total_amount) || 0)"
                              type="text"
                              size="xs"
                              class="w-48"
                              :ui="{ base: 'text-right font-mono' }"
                              disabled
                            />
                         </div>
                         <div class="w-20 flex items-center justify-center gap-1">
                           <UButton
                             v-if="!isReadOnly"
                             data-testid="delete-cost-code"
                             icon="mingcute:delete-fill"
                             size="xs"
                             color="error"
                             variant="ghost"
                             @click="deleteSubSubCostCode(subSubCostCode)"
                           />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </template>
             </CustomAccordion>
           </div>
           
           <!-- Cost Code without Sub-accounts - Show as Table Row -->
          <div v-else class="flex gap-4 px-4 py-2 border-b border-gray-50 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
             <div class="flex-1">
               <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">
                 {{ costCode.cost_code_number }} {{ costCode.cost_code_name }}
               </span>
             </div>
            <div class="w-32">
              <UButton
                data-testid="estimate-button"
                :label="isApplied(costCode.uuid) ? 'Applied' : 'Estimate'"
                size="xs"
                :color="isApplied(costCode.uuid) ? 'success' : 'neutral'"
                :variant="isApplied(costCode.uuid) ? 'soft' : 'solid'"
                @click="openEstimateModal(costCode)"
              />
            </div>
            <div v-if="showLabor" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.labor_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
             </div>
            <div v-if="showMaterial" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.material_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
             </div>
            <div v-if="showTotal" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.total_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
             </div>
            <div class="w-20 flex items-center justify-center gap-1">
              <UButton
                v-if="!isReadOnly"
                data-testid="delete-cost-code"
                icon="mingcute:delete-fill"
                size="xs"
                color="error"
                variant="ghost"
                @click="deleteCostCode(costCode)"
              />
            </div>
           </div>
        </div>
      </div>

      <!-- Totals Footer for main divisions (exclude_in_estimates_and_reports !== true) -->
      <div
        v-if="(showTotal || showLabor || showMaterial) && visibleDivisions.length"
        class="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 mt-2 rounded-t-lg"
      >
        <div class="flex gap-4 px-4 py-2">
          <div class="flex-1 text-right text-[11px] md:text-xs font-semibold text-gray-700 dark:text-gray-100 tracking-wide uppercase">
            Total
            <span class="ml-1 text-[10px] md:text-[11px] font-normal normal-case text-gray-500 dark:text-gray-400">
              (excluding Other Costs)
            </span>
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandLaborTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandMaterialTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
        <div class="flex gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex-1 text-right text-[11px] md:text-xs font-medium text-gray-700 dark:text-gray-100 tracking-wide uppercase">
            Contingency
            <span class="ml-1 text-[10px] md:text-[11px] font-normal normal-case text-gray-500 dark:text-gray-400">
              (excluding Other Costs)
            </span>
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandLaborContingencyTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandMaterialContingencyTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandContingencyTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
        <div class="flex gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div class="flex-1 text-right text-[11px] md:text-xs font-semibold text-gray-900 dark:text-gray-50 tracking-wide uppercase">
            Grand Total
            <span class="ml-1 text-[10px] md:text-[11px] font-normal normal-case text-gray-500 dark:text-gray-300">
              (excluding Other Costs)
            </span>
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandLaborTotal() + getGrandLaborContingencyTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandMaterialTotal() + getGrandMaterialContingencyTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getGrandTotal() + getGrandContingencyTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
      </div>

      <!-- Other Costs divisions (exclude_in_estimates_and_reports === true) -->
      <div
        v-for="division in otherVisibleDivisions"
        :key="`${division.uuid}-other`"
        class="border-b border-gray-100 dark:border-gray-700"
      >
        <!-- Division Row (no totals shown for Other Costs header) -->
        <div class="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700">
          <div class="flex-1">
            <span class="font-bold text-gray-900 dark:text-gray-100">
              <template v-if="division.division_number">{{ division.division_number }} </template>{{ division.division_name }}
            </span>
          </div>
          <div class="w-32"></div>
          <!-- Intentionally leave totals blank for Other Costs heading -->
          <div v-if="showLabor" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100"></div>
          <div v-if="showMaterial" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100"></div>
          <div v-if="showTotal" class="w-48 text-right font-bold text-gray-900 dark:text-gray-100"></div>
          <div class="w-20"></div>
        </div>

        <!-- Cost Codes under Division -->
        <div v-for="costCode in division.costCodes" :key="costCode.uuid">
          <!-- (reuse the same cost code / sub cost code markup as above) -->
          <!-- Cost Code with Sub-accounts - Show as Accordion -->
          <div v-if="costCode.subCostCodes && costCode.subCostCodes.length > 0">
            <CustomAccordion 
              :items="getCostCodeAccordionItems(costCode)" 
              class="w-full"
              type="single"
              :collapsible="true"
            >
              <template #trigger="{ item, isOpen }">
                <div class="flex gap-4 w-full items-center px-4 py-2 group cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 border-l-4 border-transparent hover:border-primary-400 dark:hover:border-primary-500" 
                     :title="`Click to ${isOpen ? 'collapse' : 'expand'} sub-accounts`">
                  <div class="flex-1 flex items-center gap-2">
                    <span class="text-xs text-gray-700 dark:text-gray-300 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-200">
                      {{ costCode.cost_code_number }} {{ costCode.cost_code_name }}
                    </span>
                    <UIcon 
                      name="i-heroicons-chevron-right" 
                      class="w-5 h-5 text-primary-600 dark:text-primary-400 transition-transform duration-200 flex-shrink-0"
                      :class="{ 'rotate-90': isOpen }"
                    />
                  </div>
                  <div class="w-32"></div>
                  <div v-if="showLabor" class="w-48">
                    <UInput
                      :model-value="formatCurrency(getCostCodeLaborTotal(costCode))"
                      type="text"
                      size="xs"
                      class="w-48"
                      :ui="{ base: 'text-right font-mono' }"
                      disabled
                    />
                  </div>
                  <div v-if="showMaterial" class="w-48">
                    <UInput
                      :model-value="formatCurrency(getCostCodeMaterialTotal(costCode))"
                      type="text"
                      size="xs"
                      class="w-48"
                      :ui="{ base: 'text-right font-mono' }"
                      disabled
                    />
                  </div>
                  <div v-if="showTotal" class="w-48">
                    <UInput
                      :model-value="formatCurrency(getCostCodeTotal(costCode))"
                      type="text"
                      size="xs"
                      class="w-48"
                      :ui="{ base: 'text-right font-mono' }"
                      disabled
                    />
                  </div>
                  <div class="w-20"></div>
                </div>
              </template>
              <template #content="{ item }">
                <div class="px-4 pb-3 bg-gradient-to-r from-primary-50/50 to-primary-100/50 dark:from-primary-900/10 dark:to-primary-800/10">
                  <!-- Sub Cost Codes -->
                  <div
                    v-for="subCostCode in item.subCostCodes"
                    :key="subCostCode.uuid"
                    class="border-b border-gray-50 dark:border-gray-600 last:border-b-0 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors duration-200 rounded-md px-2 py-1"
                  >
                    <!-- Sub Cost Code Row -->
                    <div class="flex gap-4 py-2">
                      <div class="flex-1 pl-8">
                        <span class="text-xs text-gray-600 dark:text-gray-400">
                          {{ subCostCode.cost_code_number }} {{ subCostCode.cost_code_name }}
                        </span>
                      </div>
                      <!-- Show inputs only if no third level cost codes -->
                      <template v-if="!subCostCode.subSubCostCodes || subCostCode.subSubCostCodes.length === 0">
                        <div class="w-32">
                          <UButton
                            data-testid="estimate-button"
                            :label="isApplied(subCostCode.uuid) ? 'Applied' : 'Estimate'"
                            size="xs"
                            :color="isApplied(subCostCode.uuid) ? 'success' : 'neutral'"
                            :variant="isApplied(subCostCode.uuid) ? 'soft' : 'solid'"
                            @click="openEstimateModal(subCostCode)"
                          />
                        </div>
                        <div v-if="showLabor" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subCostCode.labor_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div v-if="showMaterial" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subCostCode.material_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div v-if="showTotal" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subCostCode.total_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div class="w-20 flex items-center justify-center gap-1">
                          <UButton
                            v-if="!isReadOnly"
                            data-testid="delete-cost-code"
                            icon="mingcute:delete-fill"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click="deleteSubCostCode(subCostCode)"
                          />
                        </div>
                      </template>
                      <!-- No columns shown when third level cost codes exist -->
                      <template v-else>
                        <div class="w-32"></div>
                        <div v-if="showLabor" class="w-48"></div>
                        <div v-if="showMaterial" class="w-48"></div>
                        <div v-if="showTotal" class="w-48 text-right font-mono text-sm">
                          {{ formatCurrency(getSubCostCodeTotal(subCostCode)) }}
                        </div>
                        <div class="w-20"></div>
                      </template>
                    </div>

                    <!-- Sub-Sub Cost Codes (Third Level) - Always Visible -->
                    <div
                      v-if="subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0"
                      class="mt-2 p-3 rounded-md border-2 transition-all duration-200 bg-gradient-to-br from-primary-50 to-primary-200 border-primary-300 shadow-sm dark:from-primary-900/20 dark:to-primary-800/20 dark:border-primary-400"
                    >
                      <div
                        v-for="subSubCostCode in subCostCode.subSubCostCodes"
                        :key="subSubCostCode.uuid"
                        class="flex gap-4 py-1"
                      >
                        <div class="flex-1">
                          <span class="text-xs text-gray-700 dark:text-gray-300">
                            {{ subSubCostCode.cost_code_number }} {{ subSubCostCode.cost_code_name }}
                          </span>
                        </div>
                        <div class="w-32">
                          <UButton
                            data-testid="estimate-button"
                            :label="isApplied(subSubCostCode.uuid) ? 'Applied' : 'Estimate'"
                            size="xs"
                            :color="isApplied(subSubCostCode.uuid) ? 'success' : 'neutral'"
                            :variant="isApplied(subSubCostCode.uuid) ? 'soft' : 'solid'"
                            @click="openEstimateModal(subSubCostCode)"
                          />
                        </div>
                        <div v-if="showLabor" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subSubCostCode.labor_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div v-if="showMaterial" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subSubCostCode.material_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div v-if="showTotal" class="w-48">
                          <UInput
                            :model-value="formatCurrency(parseFloat(subSubCostCode.total_amount) || 0)"
                            type="text"
                            size="xs"
                            class="w-48"
                            :ui="{ base: 'text-right font-mono' }"
                            disabled
                          />
                        </div>
                        <div class="w-20 flex items-center justify-center gap-1">
                          <UButton
                            v-if="!isReadOnly"
                            data-testid="delete-cost-code"
                            icon="mingcute:delete-fill"
                            size="xs"
                            color="error"
                            variant="ghost"
                            @click="deleteSubSubCostCode(subSubCostCode)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </CustomAccordion>
          </div>

          <!-- Cost Code without Sub-accounts - Show as Table Row -->
          <div v-else class="flex gap-4 px-4 py-2 border-b border-gray-50 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div class="flex-1">
              <span class="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {{ costCode.cost_code_number }} {{ costCode.cost_code_name }}
              </span>
            </div>
            <div class="w-32">
              <UButton
                data-testid="estimate-button"
                :label="isApplied(costCode.uuid) ? 'Applied' : 'Estimate'"
                size="xs"
                :color="isApplied(costCode.uuid) ? 'success' : 'neutral'"
                :variant="isApplied(costCode.uuid) ? 'soft' : 'solid'"
                @click="openEstimateModal(costCode)"
              />
            </div>
            <div v-if="showLabor" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.labor_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
            </div>
            <div v-if="showMaterial" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.material_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
            </div>
            <div v-if="showTotal" class="w-48">
              <UInput
                :model-value="formatCurrency(parseFloat(costCode.total_amount) || 0)"
                type="text"
                size="xs"
                class="w-48"
                :ui="{ base: 'text-right font-mono' }"
                disabled
              />
            </div>
            <div class="w-20 flex items-center justify-center gap-1">
              <UButton
                v-if="!isReadOnly"
                data-testid="delete-cost-code"
                icon="mingcute:delete-fill"
                size="xs"
                color="error"
                variant="ghost"
                @click="deleteCostCode(costCode)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

      <!-- Separate Totals for "Other Costs" divisions (exclude_in_estimates_and_reports = true) -->
      <div
        v-if="(showTotal || showLabor || showMaterial) && otherDivisionsForTotals.length"
        class="bg-gray-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 mt-3 rounded-lg"
      >
        <div class="flex gap-4 px-4 py-2">
          <div class="flex-1 text-right text-[11px] md:text-xs font-semibold text-gray-800 dark:text-gray-50 tracking-wide uppercase">
            Total Other Costs
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandLaborTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandMaterialTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
        <div class="flex gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex-1 text-right text-[11px] md:text-xs font-medium text-gray-800 dark:text-gray-50 tracking-wide uppercase">
            Other Costs Contingency
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandLaborContingencyTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandMaterialContingencyTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandContingencyTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
        <div class="flex gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div class="flex-1 text-right text-[11px] md:text-xs font-semibold text-gray-900 dark:text-gray-50 tracking-wide uppercase">
            Other Costs Grand Total
          </div>
          <div v-if="showLabor" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandLaborTotal() + getOtherGrandLaborContingencyTotal()) }}
          </div>
          <div v-if="showMaterial" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandMaterialTotal() + getOtherGrandMaterialContingencyTotal()) }}
          </div>
          <div v-if="showTotal" class="w-48 text-right text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getOtherGrandTotal() + getOtherGrandContingencyTotal()) }}
          </div>
          <div class="w-20"></div>
        </div>
      </div>

      <!-- Final Grand Total (includes all divisions and Other Costs) -->
      <div
        v-if="visibleDivisions.length || otherDivisionsForTotals.length"
        class="border-t border-gray-300 dark:border-gray-600 mt-4 bg-gray-50 dark:bg-gray-700"
      >
        <div class="flex gap-4 px-4 py-3">
          <div class="flex-1 text-right text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">
            Total Estimate (Including Contingency)
          </div>
          <div class="text-right text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ formatCurrency(getFinalGrandTotalWithContingency()) }}
          </div>
          <div class="w-20"></div>
        </div>
      </div>
    </div>

    <!-- Estimate Modal: Nimble add-vendor iframe is teleported to body; while it is open, disable
         modal mode so Reka/Nuxt UI does not trap focus / block pointer events to outside (the iframe). -->
    <UModal
      v-model:open="isEstimateModalOpen"
      :fullscreen="isItemWiseMaterial || isLocationWiseLabor || showLocationWiseMaterialTable"
      :modal="!nimbleVendorOverlayOpen"
      :dismissible="!nimbleVendorOverlayOpen"
    >
      <template #header>
        <div v-if="selectedCostCode" class="flex flex-col gap-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estimate: {{ selectedCostCode.cost_code_number }} {{ selectedCostCode.cost_code_name }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Configure labor, material, total, and contingency estimates for this cost code
          </p>
        </div>
        <h3 v-else class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Estimate
        </h3>
      </template>
      <template #body>
        <div v-if="selectedCostCode">
          <UTabs :items="estimateTabs" :model-value="activeTab" @update:model-value="(value) => activeTab = String(value)" class="w-full">
            <template #labor>
              <div class="py-6 space-y-6">
                <!-- Estimate Type Radio Group -->
                <div>
                  <URadioGroup 
                    v-model="laborEstimateType" 
                    :items="laborEstimateTypeOptions"
                    legend="Estimate Type"
                    orientation="horizontal"
                    size="md"
                    :disabled="isReadOnly"
                  />
                </div>

                <!-- Manual Estimation: Simple Total Amount input (only when NOT using location-wise table) -->
                <div v-if="laborEstimateType === 'manual' && !showLocationWiseLaborTable" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Amount
                    </label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                      <UInput
                        v-model="laborManualAmount"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        :disabled="isReadOnly"
                        @update:model-value="updateLaborTotal"
                      />
                    </div>
                  </div>
                </div>

                <!-- Location-wise labor table (only when enable_location_wise is true and per-sqft / per-room / hourly-wage is selected) -->
                <div v-if="showLocationWiseLaborTable" class="space-y-3">
                    <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Location-wise Labor
                    </h5>
                    <p class="text-xs text-muted">
                      <template v-if="laborEstimateType === 'manual'">Enter the Amount for each location. Total = sum of amounts.</template>
                      <template v-else-if="laborEstimateType === 'per-sqft'">Enter Area (Sq ft) and Rate (Amt/Sq Ft) per location. Amount = Area × Rate.</template>
                      <template v-else-if="laborEstimateType === 'per-room'">Enter No. of Rooms and Rate (Amt/Room) per location. Amount = Rooms × Rate.</template>
                      <template v-else-if="laborEstimateType === 'hourly-wage'">Enter No. of Hours and Rate (Hourly Wage) per location. Amount = Hours × Rate.</template>
                    </p>
                    <div class="border border-default rounded-md overflow-hidden bg-elevated">
                      <table class="min-w-full text-xs">
                        <thead class="bg-muted/40">
                          <tr>
                            <th class="px-3 py-2 text-left font-medium text-default">Location</th>
                            <th v-if="laborEstimateType === 'per-sqft'" class="px-3 py-2 text-left font-medium text-default">Area (Sq ft)</th>
                            <th v-if="laborEstimateType === 'per-room'" class="px-3 py-2 text-left font-medium text-default">No. of Rooms</th>
                            <th v-if="laborEstimateType === 'hourly-wage'" class="px-3 py-2 text-left font-medium text-default">No. of Hours</th>
                            <th v-if="laborEstimateType !== 'manual'" class="px-3 py-2 text-left font-medium text-default">Rate ({{ currencySymbol }})</th>
                            <th class="px-3 py-2 text-left font-medium text-default">Amount ({{ currencySymbol }})</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, index) in laborLocationWiseRows"
                            :key="row.breakdown_uuid || row.location_uuid || index"
                            class="border-t border-default"
                          >
                            <td class="px-3 py-2 align-top">
                              <LocationSelect
                                :model-value="row.location_uuid"
                                size="xs"
                                class="w-full"
                                :disabled="true"
                              />
                            </td>
                            <td v-if="laborEstimateType === 'per-sqft'" class="px-3 py-2 align-top">
                              <UInput
                                :model-value="row.area_sq_ft != null ? String(row.area_sq_ft) : ''"
                                type="number"
                                size="xs"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                class="w-full"
                                :disabled="isReadOnly"
                                @update:model-value="(v) => updateLaborLocationWiseField(index, 'area_sq_ft', v)"
                              />
                            </td>
                            <td v-if="laborEstimateType === 'per-room'" class="px-3 py-2 align-top">
                              <UInputNumber
                                :model-value="
                                  row.no_of_rooms === '' || row.no_of_rooms === null || row.no_of_rooms === undefined
                                    ? undefined
                                    : Number(row.no_of_rooms)
                                "
                                size="xs"
                                :min="0"
                                :step="1"
                                placeholder="0"
                                class="w-full"
                                :disabled="isReadOnly"
                                @update:model-value="(v) => updateLaborLocationWiseField(index, 'no_of_rooms', v)"
                              />
                            </td>
                            <td v-if="laborEstimateType === 'hourly-wage'" class="px-3 py-2 align-top">
                              <UInput
                                :model-value="row.num_hours != null ? String(row.num_hours) : ''"
                                type="number"
                                size="xs"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                class="w-full"
                                :disabled="isReadOnly"
                                @update:model-value="(v) => updateLaborLocationWiseField(index, 'num_hours', v)"
                              />
                            </td>
                            <td v-if="laborEstimateType !== 'manual'" class="px-3 py-2 align-top">
                              <div class="flex items-center gap-1">
                                <span class="text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                                <UInput
                                  v-if="laborEstimateType === 'per-sqft'"
                                  :model-value="row.amount_per_sqft != null ? String(row.amount_per_sqft) : ''"
                                  type="number"
                                  size="xs"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  class="w-full"
                                  :disabled="isReadOnly"
                                  @update:model-value="(v) => updateLaborLocationWiseField(index, 'amount_per_sqft', v)"
                                />
                                <UInput
                                  v-else-if="laborEstimateType === 'per-room'"
                                  :model-value="row.amount_per_room != null ? String(row.amount_per_room) : ''"
                                  type="number"
                                  size="xs"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  class="w-full"
                                  :disabled="isReadOnly"
                                  @update:model-value="(v) => updateLaborLocationWiseField(index, 'amount_per_room', v)"
                                />
                                <UInput
                                  v-else-if="laborEstimateType === 'hourly-wage'"
                                  :model-value="row.hourly_wage != null ? String(row.hourly_wage) : ''"
                                  type="number"
                                  size="xs"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  class="w-full"
                                  :disabled="isReadOnly"
                                  @update:model-value="(v) => updateLaborLocationWiseField(index, 'hourly_wage', v)"
                                />
                              </div>
                            </td>
                            <td class="px-3 py-2 align-top" :class="{ 'font-mono': laborEstimateType !== 'manual' }">
                              <div v-if="laborEstimateType === 'manual'" class="flex items-center gap-1">
                                <span class="text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                                <UInput
                                  :model-value="row.manual_amount != null ? String(row.manual_amount) : ''"
                                  type="number"
                                  size="xs"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  class="w-full"
                                  :disabled="isReadOnly"
                                  @update:model-value="(v) => updateLaborLocationWiseField(index, 'manual_amount', v)"
                                />
                              </div>
                              <template v-else>
                                {{ formatCurrency(getLocationWiseRowAmount(row)) }}
                              </template>
                            </td>
                          </tr>
                          <tr v-if="!laborLocationWiseRows.length">
                            <td :colspan="laborEstimateType === 'manual' ? 2 : 4" class="px-3 py-3 text-xs text-muted text-center">
                              No locations defined for this project. Add locations in Project Details (Location-wise Area & Rooms).
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                </div>

                <!-- Per Room Estimation (only when not using location-wise table) -->
                <div v-if="laborEstimateType === 'per-room' && !showLocationWiseLaborTable" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Rooms
                    </label>
                    <UInputNumber
                      :model-value="currentProject?.no_of_rooms || 0"
                      :step="1"
                      disabled
                      placeholder="Number of rooms"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      This value is set in the project settings
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount Per Room
                    </label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                      <UInput
                        v-model="laborAmountPerRoom"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        :disabled="isReadOnly"
                        @update:model-value="updateLaborTotal"
                      />
                    </div>
                  </div>
                </div>

                <!-- Per Sqft Estimation (only when not using location-wise table) -->
                <div v-if="laborEstimateType === 'per-sqft' && !showLocationWiseLaborTable" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Area (sq ft)
                    </label>
                    <UInput
                      :model-value="currentProject?.area_sq_ft || 0"
                      disabled
                      placeholder="Area in sq ft"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      This value is set in the project settings
                    </p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount Per Sq Ft
                    </label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                      <UInput
                        v-model="laborAmountPerSqft"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        :disabled="isReadOnly"
                        @update:model-value="updateLaborTotal"
                      />
                    </div>
                  </div>
                </div>

                <!-- Hourly Wage Estimation (only when not using location-wise table) -->
                <div v-if="laborEstimateType === 'hourly-wage' && !showLocationWiseLaborTable" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      No. of Hours
                    </label>
                    <UInput
                      v-model="laborNumberOfHours"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      :disabled="isReadOnly"
                      @update:model-value="updateLaborTotal"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wage Amount
                    </label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                      <UInput
                        v-model="laborHourlyWage"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        :disabled="isReadOnly"
                        @update:model-value="updateLaborTotal"
                      />
                    </div>
                  </div>
                </div>

                <!-- Total Amount (Common) -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Total Labor Amount
                    </label>
                    <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {{ formatCurrency(laborTotalAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
            
            <template #material>
              <div class="py-6 space-y-6">
                <!-- Estimate Type: item-wise only (manual mode removed); hide radio when single option -->
                <div v-if="materialEstimateTypeOptions.length > 1">
                  <URadioGroup 
                    v-model="materialEstimateType" 
                    :items="materialEstimateTypeOptions"
                    legend="Estimate Type"
                    orientation="horizontal"
                    size="md"
                    :disabled="isReadOnly"
                  />
                </div>

                <!-- Manual Estimation: simple total when NOT using location-wise table -->
                <div v-if="materialEstimateType === 'manual' && !showLocationWiseMaterialTable" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Amount
                    </label>
                    <div class="flex items-center gap-1">
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                      <UInput
                        v-model="materialManualAmount"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        :disabled="isReadOnly"
                        @update:model-value="updateMaterialTotal"
                      />
                    </div>
                  </div>
                </div>

                <!-- Location-wise material table (when enable_location_wise and manual) -->
                <div v-if="showLocationWiseMaterialTable" class="space-y-3">
                  <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Location-wise Material
                  </h5>
                  <p class="text-xs text-muted">
                    Enter the Amount for each location. Total = sum of amounts.
                  </p>
                  <div class="overflow-x-auto border border-default rounded-lg">
                    <table class="min-w-full divide-y divide-default">
                      <thead class="bg-muted/50">
                        <tr>
                          <th class="px-3 py-2 text-left text-xs font-medium text-default uppercase">Location</th>
                          <th class="px-3 py-2 text-left text-xs font-medium text-default uppercase">Amount ({{ currencySymbol }})</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, index) in materialLocationWiseRows"
                          :key="row.breakdown_uuid || row.location_uuid || index"
                          class="border-t border-default"
                        >
                          <td class="px-3 py-2 text-sm text-default">
                            {{ getLocationName(row.location_uuid) }}
                          </td>
                          <td class="px-3 py-2 align-top">
                            <div class="flex items-center gap-1">
                              <span class="text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                              <UInput
                                :model-value="row.amount != null ? String(row.amount) : ''"
                                type="number"
                                step="0.01"
                                min="0"
                                size="xs"
                                placeholder="0.00"
                                class="w-full"
                                :disabled="isReadOnly"
                                @update:model-value="(v) => updateMaterialLocationWiseField(index, 'amount', v)"
                              />
                            </div>
                          </td>
                        </tr>
                        <tr v-if="!materialLocationWiseRows.length">
                          <td colspan="2" class="px-3 py-3 text-xs text-muted text-center">
                            No locations defined for this project. Add locations in Project Details (Location-wise Area &amp; Rooms).
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Item Wise Estimation -->
                <div v-if="materialEstimateType === 'item-wise'" class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Items List</h4>
                    <UButton
                      icon="i-heroicons-plus"
                      size="sm"
                      color="primary"
                      :disabled="isReadOnly"
                      @click="addMaterialItem"
                    >
                      Add Item
                    </UButton>
                  </div>

                  <div
                    v-if="isRefreshingMaterialItems"
                    class="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                  >
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Refreshing newly added items...</span>
                  </div>

                  <!-- Material Items Table -->
                  <div
                    class="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg"
                    :class="{ 'opacity-70 pointer-events-none': isRefreshingMaterialItems }"
                  >
                    <table class="w-full table-fixed border-collapse divide-y divide-gray-200 dark:divide-gray-700">
                      <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th
                            class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            <div class="flex items-center gap-1">
                              <span>Item Category</span>
                            </div>
                          </th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <div class="flex items-center gap-1">
                              <span>Spec Type & Item Type</span>
                              <UButton
                                v-if="!isReadOnly"
                                icon="i-heroicons-plus-solid"
                                :size="'2xs' as any"
                                color="info"
                                variant="solid"
                                class="p-0.5 rounded-full"
                                @click.stop="openQuickItemTypeModal()"
                              />
                            </div>
                          </th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <div class="flex items-center gap-1">
                              <span>Item Name</span>
                              <UButton
                                v-if="!isReadOnly"
                                icon="i-heroicons-plus-solid"
                                :size="'2xs' as any"
                                color="info"
                                variant="solid"
                                class="p-0.5 rounded-full"
                                @click.stop="showPreferredItemsModal = true"
                              />
                            </div>
                          </th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specification</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <div class="flex items-center gap-1">
                              <span>Preferred Vendor</span>
                              <UButton
                                v-if="!isReadOnly"
                                icon="i-heroicons-plus-solid"
                                :size="'2xs' as any"
                                color="info"
                                variant="solid"
                                class="p-0.5 rounded-full"
                                @click.stop="openMaterialVendorAddModal"
                              />
                            </div>
                          </th>
                          <th
                            v-if="isLocationWiseProject"
                            class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            <div class="flex items-center gap-1">
                              <span>Location</span>
                            </div>
                          </th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">UOM</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                          <th class="px-3 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-for="(item, index) in materialItems" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <!-- Item Category -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <ItemCategorySelect
                              v-model="item.category"
                              class="w-full min-w-0"
                              placeholder="Select category"
                              size="xs"
                              className="w-full min-w-0"
                              :disabled="isReadOnly"
                              @update:model-value="onMaterialItemCategoryChange(index)"
                            />
                          </td>
                          <!-- Item Type (options scoped to selected category) -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <ItemTypeSelect
                              :key="`item-type-${index}-${item.category}`"
                              v-model="item.item_type"
                              :corporation-uuid="props.editingEstimate ? corpStore.selectedCorporation?.id : (estimateCreationStore.selectedCorporationUuid ?? undefined)"
                              :project-uuid="props.projectUuid"
                              :category="item.category"
                              placeholder="Select type"
                              size="xs"
                              className="w-full min-w-0"
                              :ui="{ content: 'min-w-fit' }"
                              :disabled="isReadOnly || !item.category"
                              @update:model-value="onMaterialItemTypeChange(index)"
                            />
                          </td>
                          <!-- Item Name -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <ItemSelect
                              v-model="item.item_uuid"
                              :corporation-uuid="props.editingEstimate ? corpStore.selectedCorporation?.id : (estimateCreationStore.selectedCorporationUuid ?? undefined)"
                              :project-uuid="props.projectUuid"
                              :cost-code-uuid="selectedCostCode?.uuid"
                              :item-type-uuid="item.item_type"
                              :use-estimate-creation-store="!props.editingEstimate"
                              :items="getMaterialItemOptionsForItem(item)"
                              :exclude-item-uuids="getExcludedItemUuids(item.item_uuid)"
                              size="xs"
                              className="w-full min-w-0"
                              placeholder="Select item"
                              :disabled="isReadOnly || item.is_preferred === true"
                              @change="(payload) => handleItemUuidChange(index, payload?.value, payload?.option)"
                            />
                          </td>
                          <!-- Specification -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <SequenceSelect
                              v-model="item.item_uuid"
                              :corporation-uuid="props.editingEstimate ? corpStore.selectedCorporation?.id : (estimateCreationStore.selectedCorporationUuid ?? undefined)"
                              :project-uuid="props.projectUuid"
                              :cost-code-uuid="selectedCostCode?.uuid"
                              :item-type-uuid="item.item_type"
                              :use-estimate-creation-store="!props.editingEstimate"
                              :items="getMaterialItemOptionsForSequence(item)"
                              :exclude-item-uuids="getExcludedItemUuids(item.item_uuid)"
                              size="xs"
                              className="w-full min-w-0"
                              :disabled="isReadOnly || item.is_preferred === true"
                              @change="(payload) => handleItemUuidChange(index, payload?.value, payload?.option)"
                            />
                          </td>
                          <!-- Preferred Vendor -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <VendorSelect
                              v-model="item.preferred_vendor_uuid"
                              :corporation-uuid="props.editingEstimate ? corpStore.selectedCorporation?.id : (estimateCreationStore.selectedCorporationUuid ?? undefined)"
                              placeholder="Select vendor"
                              size="xs"
                              className="w-full min-w-0"
                              :disabled="isReadOnly"
                              @nimble-vendor-overlay-change="nimbleVendorOverlayOpen = $event"
                              @nimble-vendor-saved="onMaterialVendorNimbleSaved"
                            />
                          </td>
                          <!-- Location -->
                          <td v-if="isLocationWiseProject" class="min-w-0 px-3 py-2 align-middle">
                            <LocationSelect
                              v-model="item.location_uuid"
                              :locations="materialItemWiseLocations"
                              placeholder="Select location"
                              size="xs"
                              className="w-full min-w-0"
                              :disabled="isReadOnly"
                            />
                          </td>
                          <!-- Description -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <UPopover
                              :open="activeDescriptionIndex === index"
                              :content="{ side: 'top', align: 'start' }"
                              :ui="{ content: 'w-[620px] p-3 bg-white dark:bg-gray-900 border border-default' }"
                              @update:open="(open) => {
                                if (open) openDescriptionEditor(index)
                                else closeDescriptionEditor()
                              }"
                            >
                              <div
                                class="block w-full min-w-0 min-h-[52px] max-h-20 overflow-y-auto rounded-md border border-default px-2 py-1 text-xs text-muted cursor-text bg-default"
                                @click="openDescriptionEditor(index)"
                              >
                                <div
                                  class="prose prose-xs dark:prose-invert max-w-none line-clamp-2 [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0"
                                  v-html="getDescriptionPreviewHtml(item.description)"
                                />
                              </div>
                              <template #content>
                                <div class="space-y-3">
                                  <div class="text-xs font-medium text-muted">Edit Description</div>
                                  <div class="border border-default rounded-md bg-white dark:bg-gray-900">
                                    <div class="border-b border-default p-2 flex flex-wrap gap-1">
                                      <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBold().run()" />
                                      <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleItalic().run()" />
                                      <UButton icon="i-lucide-list" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleBulletList().run()" />
                                      <UButton icon="i-lucide-list-ordered" size="xs" variant="ghost" color="neutral" @click="descriptionEditor?.chain().focus().toggleOrderedList().run()" />
                                    </div>
                                    <div class="p-3 min-h-[170px] max-h-[280px] overflow-y-auto">
                                      <EditorContent :editor="descriptionEditor" />
                                    </div>
                                  </div>
                                  <div class="flex justify-end">
                                    <UButton size="xs" color="primary" label="Done" @click="closeDescriptionEditor" />
                                  </div>
                                </div>
                              </template>
                            </UPopover>
                          </td>
                          <!-- Unit Price -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <div class="flex min-w-0 items-center gap-1">
                              <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">{{ currencySymbol }}</span>
                              <UInput
                                v-model="item.unit_price"
                                type="number"
                                step="1"
                                placeholder="0.00"
                                size="xs"
                                class="min-w-0 flex-1"
                                :disabled="isReadOnly"
                                @update:model-value="updateMaterialItemTotal(index)"
                              />
                            </div>
                          </td>
                          <!-- UOM -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                          <UOMSelect
                              v-model="item.unit_uuid"
                              :corporation-uuid="corpStore.selectedCorporation?.id"
                              placeholder="UOM"
                              size="xs"
                              className="w-full min-w-0"
                              :disabled="isReadOnly"
                              @change="(opt) => handleMaterialItemUnitChange(index, opt)"
                            />
                          </td>
                          <!-- Quantity -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <UInput
                              v-model="item.quantity"
                              type="number"
                              step="1"
                              placeholder="0"
                              size="xs"
                              class="w-full min-w-0"
                              :disabled="isReadOnly"
                              @update:model-value="updateMaterialItemTotal(index)"
                            />
                          </td>
                          <!-- Total -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <div class="text-sm font-mono text-gray-900 dark:text-gray-100">
                              {{ formatCurrency(item.total) }}
                            </div>
                          </td>
                          <!-- Action -->
                          <td class="min-w-0 px-3 py-2 align-middle">
                            <div class="flex space-x-1">
                              <UButton
                                icon="i-heroicons-plus"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                                :disabled="isReadOnly"
                                @click="duplicateMaterialItem(index)"
                              />
                              <UButton
                                icon="i-heroicons-x-mark"
                                size="xs"
                                color="error"
                                variant="ghost"
                                :disabled="isReadOnly"
                                @click="removeMaterialItem(index)"
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Total Material Amount (always visible for manual, item-wise, and location-wise) -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Total Material Amount
                    </label>
                    <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {{ formatCurrency(materialTotalAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template #total>
              <div class="py-6 space-y-6">
                <!-- Total Amount Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Amount
                  </label>
                  <UInput
                    v-model="totalManualAmount"
                    type="number"
                    step="1"
                    placeholder="0.00"
                    :disabled="isReadOnly"
                    @update:model-value="updateTotalAmount"
                  />
                </div>

                <!-- Current Total Display -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div class="flex justify-between items-center">
                    <label class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Total Amount
                    </label>
                    <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {{ formatCurrency(totalAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template #contingency>
              <div class="py-6 space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contingency Mode</label>
                  <URadioGroup 
                    :model-value="selectedCostCode?.contingency_enabled ? 'enabled' : 'disabled'"
                    :items="[
                      { label: 'Disable (use project contingency)', value: 'disabled' },
                      { label: 'Enable (custom for this cost code)', value: 'enabled' }
                    ]"
                    legend=""
                    orientation="horizontal"
                    size="md"
                    :disabled="isReadOnly"
                    @update:model-value="(val: string) => {
                      if (!selectedCostCode || isReadOnly) return
                      selectedCostCode.contingency_enabled = (val === 'enabled')
                      if (!selectedCostCode.contingency_enabled) {
                        selectedCostCode.contingency_percentage = null
                      } else {
                        // When enabling, seed with project contingency if no custom value exists
                        if (selectedCostCode.contingency_percentage === null || selectedCostCode.contingency_percentage === undefined || selectedCostCode.contingency_percentage === '') {
                          selectedCostCode.contingency_percentage = getProjectContingencyPercent()
                        }
                      }
                      triggerHierarchyRefresh()
                    }"
                  />
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ selectedCostCode?.contingency_enabled ? 'Custom Contingency (%)' : 'Project Contingency (%)' }}
                  </label>
                  <UInput
                    :model-value="selectedCostCode?.contingency_enabled 
                      ? (selectedCostCode?.contingency_percentage === null || selectedCostCode?.contingency_percentage === undefined
                          ? ''
                          : String(selectedCostCode.contingency_percentage))
                      : String(currentProject?.contingency_percentage ?? '0')"
                    type="number"
                    step="1"
                    :placeholder="selectedCostCode?.contingency_enabled ? String(currentProject?.contingency_percentage ?? '0') : 'e.g. 5'"
                    class="w-40"
                    :disabled="isReadOnly || !selectedCostCode?.contingency_enabled"
                    @update:model-value="(v: string | number) => {
                      if (!selectedCostCode || !selectedCostCode.contingency_enabled || isReadOnly) return
                      const str = String(v).trim()
                      // Allow empty string - user can clear the field
                      if (str === '' || str === null || str === undefined) {
                        selectedCostCode.contingency_percentage = null
                      } else {
                        const n = parseFloat(str)
                        selectedCostCode.contingency_percentage = Number.isFinite(n) ? Math.max(0, n) : null
                      }
                      triggerHierarchyRefresh()
                    }"
                  />
                  <p class="text-xs text-muted">
                    {{ selectedCostCode?.contingency_enabled 
                      ? 'Applied on the total estimate for this cost code.' 
                      : 'Using project-level contingency setting.' }}
                  </p>
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
                  <template v-if="!showOnlyTotal">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-muted">Labor Total</span>
                      <span class="text-sm font-mono">{{ formatCurrency(contingencyLaborTotal) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-muted">Material Total</span>
                      <span class="text-sm font-mono">{{ formatCurrency(contingencyMaterialTotal) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Base Total (Labor + Material)</span>
                      <span class="text-sm font-mono font-medium">{{ formatCurrency(selectedCostCodeBaseTotal) }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex justify-between items-center">
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Base Total</span>
                      <span class="text-sm font-mono font-medium">{{ formatCurrency(selectedCostCodeBaseTotal) }}</span>
                    </div>
                  </template>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-muted">Contingency (%)</span>
                    <span class="text-sm font-mono">{{ String(selectedCostCodeContingencyPercent) }}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-semibold">Total with Contingency</span>
                    <span class="text-sm font-mono font-semibold">{{ formatCurrency(selectedCostCodeTotalWithContingency) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </UTabs>
        </div>
        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-wrench-screwdriver" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 class="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Coming Soon</h4>
          <p class="text-gray-600 dark:text-gray-400">
            The estimation functionality is currently under development and will be available soon.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 items-center">
          <UButton
            color="neutral"
            variant="solid"
            @click="closeEstimateModal"
          >
            Close
          </UButton>
          <UButton
            v-if="!isReadOnly && (
              (laborTotalAmount > 0 || materialTotalAmount > 0) ||
              (currentProject?.only_total && totalAmount > 0) ||
              (showLocationWiseLaborTable && laborLocationWiseRows.length > 0) ||
              (showLocationWiseMaterialTable && materialLocationWiseRows.length > 0)
            )"
            color="primary"
            variant="solid"
            @click="applyEstimate"
          >
            Apply
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Removed Items Modal -->
    <UModal v-model:open="isRemovedItemsModalOpen">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-primary" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Removed Cost Codes</h3>
        </div>
      </template>
      <template #body>
        <div class="max-h-[60vh] overflow-auto">
          <div v-if="removedItemsList.length === 0" class="text-center py-8 text-gray-500">
            No removed items to restore
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="item in removedItemsList"
              :key="item.uuid"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100">
                  {{ item.cost_code_number }} {{ item.cost_code_name }}
                </div>
                <div v-if="item.division_name" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Division: {{ item.division_name }}
                </div>
                <div v-if="item.parent_cost_code_name" class="text-sm text-gray-500 dark:text-gray-400">
                  Parent: {{ item.parent_cost_code_name }}
                </div>
              </div>
              <UButton
                icon="i-heroicons-plus"
                size="xs"
                color="primary"
                @click="restoreCostCode(item)"
              >
                Restore
              </UButton>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="isRemovedItemsModalOpen = false">Close</UButton>
        </div>
      </template>
    </UModal>

    <!-- Hidden VendorSelect: same add-vendor flow as PurchaseOrderForm (Nimble iframe when nimbleIntegrations + env, else VendorForm inside VendorSelect) -->
    <div class="sr-only" aria-hidden="true">
      <VendorSelect
        ref="materialVendorQuickAddRef"
        v-model="materialVendorQuickAddModel"
        :corporation-uuid="currentCorporationUuid"
        placeholder="Add vendor..."
        size="xs"
        :disabled="!currentCorporationUuid"
        @nimble-vendor-overlay-change="nimbleVendorOverlayOpen = $event"
        @nimble-vendor-saved="onMaterialVendorNimbleSaved"
      />
    </div>

    <!-- Quick-add Location Modal -->
    <UModal v-model:open="showLocationQuickModal" title="Add Location" :ui="{ body: 'p-4 sm:p-6' }">
      <template #body>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Location Name <span class="text-red-500">*</span></label>
            <UInput v-model="locationQuickForm.location_name" placeholder="e.g., Main Warehouse" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Location Code</label>
            <UInput v-model="locationQuickForm.location_code" placeholder="e.g., WH-01" size="sm" class="w-full" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-1">Description</label>
            <UTextarea v-model="locationQuickForm.description" placeholder="Optional description" size="sm" class="w-full" :rows="3" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Active</label>
            <UToggle v-model="locationQuickForm.active" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showLocationQuickModal = false">Cancel</UButton>
          <UButton color="primary" :loading="isSavingLocationQuick" :disabled="!isLocationQuickValid || isSavingLocationQuick" @click="saveQuickLocation">Save Location</UButton>
        </div>
      </template>
    </UModal>

    <!-- Quick-add Item Type Modal -->
    <UModal v-model:open="showItemTypeQuickModal" title="Add Item Type" :ui="{ body: 'p-4 sm:p-6' }">
      <template #body>
        <ItemTypeFormFields :form="itemTypeQuickForm as any" />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="solid" @click="showItemTypeQuickModal = false">Cancel</UButton>
          <UButton color="primary" variant="solid" :loading="isSavingItemTypeQuick" :disabled="!isItemTypeQuickValid || isSavingItemTypeQuick" @click="saveQuickItemType">Save Item Type</UButton>
        </div>
      </template>
    </UModal>

    <!-- Preferred Items Modal -->
    <PreferredItemsAddEditModal
      v-model="showPreferredItemsModal"
      mode="embedded"
      :corporation-uuid="currentCorporationUuid"
      :project-uuid="props.projectUuid"
      :cost-code-configuration-uuid="selectedCostCode?.uuid || ''"
      :lock-embedded-cost-code-selection="true"
      @save="handlePreferredItemsModalSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCorporationStore } from '~/stores/corporations'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useEstimateCreationStore } from '~/stores/estimateCreation'
import { useProjectsStore } from '~/stores/projects'
import { useUOMStore } from '~/stores/uom'
import { useItemTypesStore } from '~/stores/itemTypes'
import { useVendorStore } from '~/stores/vendors'
import { useLocationsStore } from '~/stores/locations'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import CustomAccordion from '~/components/shared/CustomAccordion.vue'
import ItemTypeSelect from '~/components/shared/ItemTypeSelect.vue'
import ItemTypeFormFields from '~/components/shared/ItemTypeFormFields.vue'
import SequenceSelect from '~/components/shared/SequenceSelect.vue'
import ItemSelect from '~/components/shared/ItemSelect.vue'
import VendorSelect from '~/components/shared/VendorSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'
import UOMSelect from '~/components/shared/UOMSelect.vue'
import LocationSelect from '~/components/shared/LocationSelect.vue'
import PreferredItemsAddEditModal from '~/components/shared/PreferredItemsAddEditModal.vue'
import {
  getLocationWiseRowAmount as getLocationWiseRowAmountUtil,
  getLocationWiseRowAmountForMode,
  getLocationWiseTotalAmount,
  getLocationWiseTotalAmountForMode,
  applyLocationWiseFieldUpdate,
} from '~/utils/locationWiseLaborCalculations'

// Props
interface Props {
  modelValue?: any[]
  projectUuid?: string
  deletedUuids?: string[]
  readonly?: boolean
  editingEstimate?: boolean // Whether we're editing an existing estimate
  estimateUuid?: string // UUID of the estimate being edited
}

const props = defineProps<Props>()

const isReadOnly = computed(() => props.readonly === true)

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'update:deletedUuids': [value: string[]]
}>()

// Stores
const corpStore = useCorporationStore()
const locationsStore = useLocationsStore()
const divisionsStore = useCostCodeDivisionsStore()
const configurationsStore = useCostCodeConfigurationsStore()
const estimateCreationStore = useEstimateCreationStore()
const projectsStore = useProjectsStore()
const uomStore = useUOMStore()
const itemTypesStore = useItemTypesStore()
const vendorStore = useVendorStore()
const { formatCurrency, currencySymbol } = useCurrencyFormat()

// Resolve location uuid to display name (for location-wise labor/material tables)
const getLocationName = (locationUuid: string) => {
  if (!locationUuid) return '—'
  const loc = locationsStore.getByUuid(locationUuid)
  return loc?.location_name ?? locationUuid
}

// State
const divisions = ref<any[]>([])
const configurations = ref<any[]>([])
const hierarchicalDataRef = ref<any[]>([]) // Store a mutable copy of hierarchical data
const originalHierarchicalData = ref<any[]>([]) // Store the original unfiltered hierarchical data
const loading = ref(false)

// Helper function to recursively filter out deleted cost codes
const filterDeletedCostCodes = (node: any): any | null => {
  // If this node is deleted, return null
  if (deletedUuidsLocal.value.has(node.uuid)) {
    return null
  }
  
  // Create a copy of the node
  const filtered = { ...node }
  
  // Filter sub-cost codes if they exist - always set as array (even if empty)
  if (Array.isArray(node.subCostCodes)) {
    filtered.subCostCodes = node.subCostCodes
      .map((sub: any) => filterDeletedCostCodes(sub))
      .filter((sub: any) => sub !== null)
  } else {
    // Ensure subCostCodes is always an array
    filtered.subCostCodes = []
  }
  
  // Filter sub-sub-cost codes if they exist - always set as array (even if empty)
  if (Array.isArray(node.subSubCostCodes)) {
    filtered.subSubCostCodes = node.subSubCostCodes
      .map((subSub: any) => filterDeletedCostCodes(subSub))
      .filter((subSub: any) => subSub !== null)
  } else {
    // Ensure subSubCostCodes is always an array
    filtered.subSubCostCodes = []
  }
  
  return filtered
}

// Computed property to filter out divisions with no cost codes and deleted cost codes
const visibleDivisions = computed(() => {
  return hierarchicalDataRef.value
    .map((division: any) => {
      // Filter out deleted cost codes from each division
      if (!division.costCodes || !Array.isArray(division.costCodes)) {
        return null
      }
      
      const filteredCostCodes = division.costCodes
        .map((costCode: any) => filterDeletedCostCodes(costCode))
        .filter((costCode: any) => costCode !== null)
      
      // Return division only if it has cost codes after filtering
      if (filteredCostCodes.length === 0) {
        return null
      }
      
      return {
        ...division,
        costCodes: filteredCostCodes
      }
    })
    .filter((division: any) => division !== null)
})

// Split visible divisions into main (included in primary totals) and "Other Costs"
const mainVisibleDivisions = computed(() =>
  visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  ),
)

const otherVisibleDivisions = computed(() =>
  visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports === true
  ),
)
const isEstimateModalOpen = ref(false)
/** True while Nimble add-vendor iframe overlay is open (VendorSelect teleports to body). */
const nimbleVendorOverlayOpen = ref(false)
const selectedCostCode = ref<any>(null)
const hasPopulatedSavedData = ref(false)
const activeTab = ref('labor')

// Labor estimation state
const laborEstimateType = ref('manual')
const laborManualAmount = ref<string>('')
const laborAmountPerRoom = ref<string>('')
const laborAmountPerSqft = ref<string>('')
const laborNumberOfHours = ref<string>('')
const laborHourlyWage = ref<string>('')
// Location-wise labor rows (when enable_location_wise is true)
// User enters only ONE base per row: area+amount_per_sqft, rooms+amount_per_room, or hours+hourly_wage
// Row Amount = product of base × rate; Total Labor Amount = sum of row Amounts
const laborLocationWiseRows = ref<Array<{
  breakdown_uuid?: string
  location_uuid: string
  area_sq_ft?: string | number | null
  no_of_rooms?: string | number | null
  num_hours?: string | number | null
  amount_per_sqft: number | string
  amount_per_room: number | string
  hourly_wage: number | string
  /** Used only for manual mode (location-wise labor). */
  manual_amount?: number | string
}>>([])

// Material estimation state
const materialEstimateType = ref('item-wise')
const materialManualAmount = ref<string>('')
const materialItems = ref<any[]>([])
const materialItemWiseLocations = ref<any[]>([])
const activeDescriptionIndex = ref<number | null>(null)
const descriptionEditor = useEditor({
  content: '',
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none min-h-[140px] focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    if (activeDescriptionIndex.value === null) return
    const row = materialItems.value[activeDescriptionIndex.value]
    if (!row) return
    row.description = editor.getHTML()
  },
})

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getDescriptionPreviewHtml = (value: unknown) => {
  const raw = String(value || '').trim()
  if (!raw) return '<p>-</p>'
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw)
  if (looksLikeHtml) return raw
  return `<p>${escapeHtml(raw)}</p>`
}

const openDescriptionEditor = (index: number) => {
  activeDescriptionIndex.value = index
  const html = String(materialItems.value[index]?.description || '')
  descriptionEditor.value?.commands.setContent(html || '')
}

const closeDescriptionEditor = () => {
  activeDescriptionIndex.value = null
}
// Location-wise material rows (when enable_location_wise and material manual: amount per location)
const materialLocationWiseRows = ref<Array<{ breakdown_uuid?: string; location_uuid: string; amount?: number | string }>>([])
const isItemWiseMaterial = computed(() => activeTab.value === 'material' && materialEstimateType.value === 'item-wise')
const isLocationWiseProject = computed(() => currentProject.value?.enable_location_wise === true)
const showLocationWiseMaterialTable = computed(
  () =>
    isLocationWiseProject.value &&
    activeTab.value === 'material' &&
    materialEstimateType.value === 'manual'
)
// When true, material total should be computed from location-wise rows (used for totals even when Contingency tab is active)
const useLocationWiseMaterialForTotal = computed(
  () => isLocationWiseProject.value && materialEstimateType.value === 'manual'
)
const showLocationWiseLaborTable = computed(
  () =>
    isLocationWiseProject.value &&
    activeTab.value === 'labor' &&
    (laborEstimateType.value === 'manual' ||
      laborEstimateType.value === 'per-room' ||
      laborEstimateType.value === 'per-sqft' ||
      laborEstimateType.value === 'hourly-wage')
)
// When true, labor total should be computed from location-wise rows (used for totals even when Contingency tab is active)
const useLocationWiseLaborForTotal = computed(
  () =>
    isLocationWiseProject.value &&
    (laborEstimateType.value === 'manual' ||
      laborEstimateType.value === 'per-room' ||
      laborEstimateType.value === 'per-sqft' ||
      laborEstimateType.value === 'hourly-wage')
)
const isLocationWiseLabor = computed(() => showLocationWiseLaborTable.value)

// Map laborEstimateType to location-wise mode for row amount calculation
const locationWiseLaborMode = computed((): 'area' | 'room' | 'hourly' | 'manual' | null => {
  if (laborEstimateType.value === 'manual') return 'manual'
  if (laborEstimateType.value === 'per-sqft') return 'area'
  if (laborEstimateType.value === 'per-room') return 'room'
  if (laborEstimateType.value === 'hourly-wage') return 'hourly'
  return null
})

const getLocationWiseRowAmount = (row: any) =>
  locationWiseLaborMode.value
    ? getLocationWiseRowAmountForMode(row, locationWiseLaborMode.value)
    : getLocationWiseRowAmountUtil(row)

// Total estimation state (for only_total projects)
const totalManualAmount = ref<string>('')

const laborTotalAmount = computed(() => {
  // Use location-wise rows for total when project is location-wise and type matches (even when Contingency tab is active)
  if (useLocationWiseLaborForTotal.value && locationWiseLaborMode.value) {
    return getLocationWiseTotalAmountForMode(
      laborLocationWiseRows.value,
      locationWiseLaborMode.value
    )
  }
  if (laborEstimateType.value === 'manual') {
    return parseFloat(String(laborManualAmount.value)) || 0
  } else if (laborEstimateType.value === 'per-room') {
    const numRooms = currentProject.value?.no_of_rooms || 0
    const amountPerRoom = parseFloat(String(laborAmountPerRoom.value)) || 0
    return numRooms * amountPerRoom
  } else if (laborEstimateType.value === 'per-sqft') {
    const area = currentProject.value?.area_sq_ft || 0
    const amountPerSqft = parseFloat(String(laborAmountPerSqft.value)) || 0
    return area * amountPerSqft
  } else if (laborEstimateType.value === 'hourly-wage') {
    const hours = parseFloat(String(laborNumberOfHours.value)) || 0
    const wage = parseFloat(String(laborHourlyWage.value)) || 0
    return hours * wage
  }
  return 0
})

// Track applied cost codes
const appliedCostCodes = ref<Set<string>>(new Set())
const deletedUuidsLocal = ref<Set<string>>(new Set(props.deletedUuids || []))

// Removed items modal state
const isRemovedItemsModalOpen = ref(false)

// Quick-add modal state (for header "+" actions in material items table)
const showLocationQuickModal = ref(false)
const showItemTypeQuickModal = ref(false)
const showPreferredItemsModal = ref(false)
const isRefreshingMaterialItems = ref(false)

const currentCorporationUuid = computed(() => {
  if (props.editingEstimate) {
    return corpStore.selectedCorporation?.id || ''
  }
  return estimateCreationStore.selectedCorporationUuid || corpStore.selectedCorporation?.id || ''
})

/** Dummy model for hidden VendorSelect used only to open add-vendor (Nimble or legacy). */
const materialVendorQuickAddModel = ref<string | undefined>(undefined)
const materialVendorQuickAddRef = ref<InstanceType<typeof VendorSelect> | null>(null)

const openMaterialVendorAddModal = () => {
  ;(materialVendorQuickAddRef.value as any)?.openAddModal()
}

/** Keep row dropdowns in sync after Nimble save (VendorSelect also refreshes on close). */
const onMaterialVendorNimbleSaved = async () => {
  const uuid = currentCorporationUuid.value
  if (uuid) {
    await vendorStore.fetchVendors(uuid).catch(() => {})
  }
}

// Location quick-add
const locationQuickForm = ref({ location_name: '', location_code: '', description: '', active: true })
const isSavingLocationQuick = ref(false)
const isLocationQuickValid = computed(() => !!locationQuickForm.value.location_name.trim())

const openQuickLocationModal = () => {
  locationQuickForm.value = { location_name: '', location_code: '', description: '', active: true }
  showLocationQuickModal.value = true
}
const saveQuickLocation = async () => {
  if (!isLocationQuickValid.value || isSavingLocationQuick.value) return
  isSavingLocationQuick.value = true
  const toast = useToast()
  try {
    await locationsStore.createLocation({
      location_name: locationQuickForm.value.location_name.trim(),
      location_code: locationQuickForm.value.location_code || null,
      description: locationQuickForm.value.description || null,
      active: locationQuickForm.value.active,
    } as any)
    toast.add({ title: 'Location added', description: 'New location is now available in the Location dropdown.', color: 'success', icon: 'i-heroicons-check-circle' })
    showLocationQuickModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message || 'Failed to save location', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isSavingLocationQuick.value = false
  }
}

// Item type quick-add
const itemTypeQuickForm = ref({
  corporation_uuid: '',
  category: '',
  spec_type: '',
  item_division_uuid: '',
  item_type: '',
  description: '',
  is_active: true
})
const isSavingItemTypeQuick = ref(false)
const isItemTypeQuickValid = computed(
  () => !!itemTypeQuickForm.value.category && !!itemTypeQuickForm.value.spec_type.trim() && !!itemTypeQuickForm.value.item_type.trim()
)
const openQuickItemTypeModal = async () => {
  const corpUuid = currentCorporationUuid.value
  if (!corpUuid) {
    const toast = useToast()
    toast.add({ title: 'Select corporation', description: 'Please select a corporation before adding item types.', color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
    return
  }
  itemTypeQuickForm.value = {
    corporation_uuid: corpUuid,
    category: '',
    spec_type: '',
    item_division_uuid: '',
    item_type: '',
    description: '',
    is_active: true
  }
  showItemTypeQuickModal.value = true
}
const saveQuickItemType = async () => {
  if (!isItemTypeQuickValid.value || isSavingItemTypeQuick.value) return
  isSavingItemTypeQuick.value = true
  const toast = useToast()
  try {
    await itemTypesStore.createItemType({
      corporation_uuid: itemTypeQuickForm.value.corporation_uuid,
      category: itemTypeQuickForm.value.category,
      spec_type: itemTypeQuickForm.value.spec_type.trim(),
      item_division_uuid: null,
      item_type: itemTypeQuickForm.value.item_type.trim(),
      description: itemTypeQuickForm.value.description?.trim() || null,
      is_active: itemTypeQuickForm.value.is_active,
    })
    toast.add({ title: 'Item type added', description: 'New item type is now available in the Item Type dropdown.', color: 'success', icon: 'i-heroicons-check-circle' })
    showItemTypeQuickModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message || 'Failed to save item type', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isSavingItemTypeQuick.value = false
  }
}

// Get list of removed items with details
const removedItemsList = computed(() => {
  if (deletedUuidsLocal.value.size === 0) return []
  
  const removedItems: any[] = []
  
  // Search through hierarchicalData to find removed items
  hierarchicalData.value.forEach((division: any) => {
    division.costCodes?.forEach((cc: any) => {
      if (deletedUuidsLocal.value.has(cc.uuid)) {
        removedItems.push({
          uuid: cc.uuid,
          cost_code_number: cc.cost_code_number,
          cost_code_name: cc.cost_code_name,
          division_name: division.division_name,
          level: 'costCode',
          node: cc,
          divisionUuid: division.uuid
        })
      }
      
      // Check sub-cost codes
      cc.subCostCodes?.forEach((sc: any) => {
        if (deletedUuidsLocal.value.has(sc.uuid)) {
          removedItems.push({
            uuid: sc.uuid,
            cost_code_number: sc.cost_code_number,
            cost_code_name: sc.cost_code_name,
            division_name: division.division_name,
            parent_cost_code_name: `${cc.cost_code_number} ${cc.cost_code_name}`,
            level: 'subCostCode',
            node: sc,
            divisionUuid: division.uuid,
            costCodeUuid: cc.uuid
          })
        }
        
        // Check sub-sub-cost codes
        sc.subSubCostCodes?.forEach((ssc: any) => {
          if (deletedUuidsLocal.value.has(ssc.uuid)) {
            removedItems.push({
              uuid: ssc.uuid,
              cost_code_number: ssc.cost_code_number,
              cost_code_name: ssc.cost_code_name,
              division_name: division.division_name,
              parent_cost_code_name: `${sc.cost_code_number} ${sc.cost_code_name}`,
              level: 'subSubCostCode',
              node: ssc,
              divisionUuid: division.uuid,
              costCodeUuid: cc.uuid,
              subCostCodeUuid: sc.uuid
            })
          }
        })
      })
    })
  })
  
  return removedItems.sort((a, b) => {
    // Sort by division name, then cost code number
    if (a.division_name !== b.division_name) {
      return a.division_name.localeCompare(b.division_name)
    }
    return a.cost_code_number.localeCompare(b.cost_code_number)
  })
})

// Open removed items modal
const openRemovedItemsModal = () => {
  isRemovedItemsModalOpen.value = true
}

// Restore a removed cost code
const restoreCostCode = (item: any) => {
  if (!item || !item.uuid) return
  
  // Remove from deleted set
  deletedUuidsLocal.value.delete(item.uuid)
  emitDeletedUuids()
  
  // Find the division in hierarchicalDataRef
  const divisionRef = hierarchicalDataRef.value.find((d: any) => d.uuid === item.divisionUuid)
  if (!divisionRef) return
  
  // Restore based on level
  if (item.level === 'costCode') {
    // Check if cost code already exists
    if (!divisionRef.costCodes.find((c: any) => c.uuid === item.uuid)) {
      divisionRef.costCodes.push(structuredClone(item.node))
    }
  } else if (item.level === 'subCostCode') {
    // Find or create parent cost code
    let parentCC = divisionRef.costCodes.find((c: any) => c.uuid === item.costCodeUuid)
    if (!parentCC) {
      // Find parent from source
      const parentSource = hierarchicalData.value
        .find((d: any) => d.uuid === item.divisionUuid)
        ?.costCodes?.find((c: any) => c.uuid === item.costCodeUuid)
      if (parentSource) {
        parentCC = structuredClone(parentSource)
        // Remove sub-cost codes that are still deleted
        if (parentCC.subCostCodes) {
          parentCC.subCostCodes = parentCC.subCostCodes.filter((sc: any) => 
            !deletedUuidsLocal.value.has(sc.uuid)
          )
        }
        divisionRef.costCodes.push(parentCC)
      }
    }
    if (parentCC) {
      if (!parentCC.subCostCodes) parentCC.subCostCodes = []
      if (!parentCC.subCostCodes.find((sc: any) => sc.uuid === item.uuid)) {
        parentCC.subCostCodes.push(structuredClone(item.node))
      }
    }
  } else if (item.level === 'subSubCostCode') {
    // Find or create parent cost code
    let parentCC = divisionRef.costCodes.find((c: any) => c.uuid === item.costCodeUuid)
    if (!parentCC) {
      const parentSource = hierarchicalData.value
        .find((d: any) => d.uuid === item.divisionUuid)
        ?.costCodes?.find((c: any) => c.uuid === item.costCodeUuid)
      if (parentSource) {
        parentCC = structuredClone(parentSource)
        // Clean up deleted items
        if (parentCC.subCostCodes) {
          parentCC.subCostCodes = parentCC.subCostCodes.map((sc: any) => {
            if (sc.subSubCostCodes) {
              sc.subSubCostCodes = sc.subSubCostCodes.filter((ssc: any) => 
                !deletedUuidsLocal.value.has(ssc.uuid)
              )
            }
            return sc
          }).filter((sc: any) => !deletedUuidsLocal.value.has(sc.uuid))
        }
        divisionRef.costCodes.push(parentCC)
      }
    }
    if (parentCC) {
      // Find or create parent sub-cost code
      let parentSC = parentCC.subCostCodes?.find((sc: any) => sc.uuid === item.subCostCodeUuid)
      if (!parentSC) {
        const parentSCSource = hierarchicalData.value
          .find((d: any) => d.uuid === item.divisionUuid)
          ?.costCodes?.find((c: any) => c.uuid === item.costCodeUuid)
          ?.subCostCodes?.find((sc: any) => sc.uuid === item.subCostCodeUuid)
        if (parentSCSource) {
          parentSC = structuredClone(parentSCSource)
          if (parentSC.subSubCostCodes) {
            parentSC.subSubCostCodes = parentSC.subSubCostCodes.filter((ssc: any) => 
              !deletedUuidsLocal.value.has(ssc.uuid)
            )
          }
          if (!parentCC.subCostCodes) parentCC.subCostCodes = []
          parentCC.subCostCodes.push(parentSC)
        }
      }
      if (parentSC) {
        if (!parentSC.subSubCostCodes) parentSC.subSubCostCodes = []
        if (!parentSC.subSubCostCodes.find((ssc: any) => ssc.uuid === item.uuid)) {
          parentSC.subSubCostCodes.push(structuredClone(item.node))
        }
      }
    }
  }
  
  // Trigger reactivity update
  triggerHierarchyRefresh()
  
  // Emit line items update
  emitLineItemsUpdate()
}

const emitDeletedUuids = () => {
  emit('update:deletedUuids', Array.from(deletedUuidsLocal.value))
}

const hadChildrenInOriginalHierarchy = (
  uuid: string,
  childKey: 'subCostCodes' | 'subSubCostCodes'
) => {
  if (!uuid || originalHierarchicalData.value.length === 0) return false

  const walk = (nodes: any[]): boolean => {
    if (!Array.isArray(nodes)) return false
    for (const node of nodes) {
      if (node?.uuid === uuid) {
        return Array.isArray(node?.[childKey]) && node[childKey].length > 0
      }
      if (Array.isArray(node?.subCostCodes) && walk(node.subCostCodes)) return true
      if (Array.isArray(node?.subSubCostCodes) && walk(node.subSubCostCodes)) return true
    }
    return false
  }

  for (const division of originalHierarchicalData.value) {
    if (walk(division?.costCodes || [])) return true
  }
  return false
}

const pruneEmptyParentCostCodes = (): boolean => {
  let changed = false

  for (const division of hierarchicalDataRef.value) {
    if (!Array.isArray(division?.costCodes)) continue

    // Prune sub-cost-code parents that originally had sub-sub-cost-codes.
    for (const costCode of division.costCodes) {
      if (!Array.isArray(costCode?.subCostCodes)) continue
      for (let i = costCode.subCostCodes.length - 1; i >= 0; i--) {
        const subCostCode = costCode.subCostCodes[i]
        const hasNoSubSubs = Array.isArray(subCostCode?.subSubCostCodes) && subCostCode.subSubCostCodes.length === 0
        const wasParent = hadChildrenInOriginalHierarchy(subCostCode?.uuid, 'subSubCostCodes')
        if (hasNoSubSubs && wasParent) {
          if (subCostCode?.uuid) {
            deletedUuidsLocal.value.add(subCostCode.uuid)
            appliedCostCodes.value.delete(subCostCode.uuid)
          }
          costCode.subCostCodes.splice(i, 1)
          changed = true
        }
      }
    }

    // Prune top-level parent cost codes that originally had sub-cost-codes.
    for (let i = division.costCodes.length - 1; i >= 0; i--) {
      const costCode = division.costCodes[i]
      const hasNoSubs = Array.isArray(costCode?.subCostCodes) && costCode.subCostCodes.length === 0
      const wasParent = hadChildrenInOriginalHierarchy(costCode?.uuid, 'subCostCodes')
      if (hasNoSubs && wasParent) {
        if (costCode?.uuid) {
          deletedUuidsLocal.value.add(costCode.uuid)
          appliedCostCodes.value.delete(costCode.uuid)
        }
        division.costCodes.splice(i, 1)
        changed = true
      }
    }
  }

  return changed
}

// Remove a cost code (at any level) from the hierarchical data by UUID
const removeCostCodeByUuid = (uuid: string) => {
  if (!uuid) return
  // mutate in place to ensure reactivity in tests and runtime
  const divisions = hierarchicalDataRef.value
  for (const division of divisions) {
    const removeFromArray = (arr: any[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const node = arr[i]
        if (node?.uuid === uuid) {
          arr.splice(i, 1)
          continue
        }
        if (Array.isArray(node?.subCostCodes)) {
          removeFromArray(node.subCostCodes)
        }
        if (Array.isArray(node?.subSubCostCodes)) {
          for (let j = node.subSubCostCodes.length - 1; j >= 0; j--) {
            if (node.subSubCostCodes[j]?.uuid === uuid) {
              node.subSubCostCodes.splice(j, 1)
            }
          }
        }
      }
    }
    if (Array.isArray(division.costCodes)) {
      removeFromArray(division.costCodes)
    }
  }

  // Auto-delete collapsible parent rows once all their child rows are deleted.
  const didPruneParents = pruneEmptyParentCostCodes()
  if (didPruneParents) {
    emitDeletedUuids()
  }

  // trigger computed updates
  nextTick(() => {
    hierarchicalDataRef.value = [...divisions]
    emitLineItemsUpdate()
  })
}

// Force refresh of hierarchy to reflect inline changes
const triggerHierarchyRefresh = () => {
  nextTick(() => {
    hierarchicalDataRef.value = [...hierarchicalDataRef.value]
  })
}

// Check if cost code has been applied
const isApplied = (costCodeUuid: string) => {
  // First check if it's in our applied set
  if (appliedCostCodes.value.has(costCodeUuid)) {
    return true
  }
  
  // Also check if the cost code has any values (for existing estimates)
  const costCode = findCostCodeByUuid(costCodeUuid)
  if (costCode) {
    const hasLabor = parseFloat(costCode.labor_amount) > 0
    const hasMaterial = parseFloat(costCode.material_amount) > 0
    const hasTotal = parseFloat(costCode.total_amount) > 0
    return hasLabor || hasMaterial || hasTotal
  }
  
  return false
}

// Helper function to find cost code by UUID
const findCostCodeByUuid = (uuid: string) => {
  for (const division of hierarchicalDataRef.value) {
    // Skip divisions with no cost codes (this function searches the full hierarchicalDataRef, not visibleDivisions)
    if (!division.costCodes || !Array.isArray(division.costCodes) || division.costCodes.length === 0) {
      continue
    }
    
    for (const costCode of division.costCodes) {
      if (costCode.uuid === uuid) {
        return costCode
      }
      
      // Check sub-cost codes
      if (costCode.subCostCodes) {
        for (const subCostCode of costCode.subCostCodes) {
          if (subCostCode.uuid === uuid) {
            return subCostCode
          }
          
          // Check sub-sub-cost codes
          if (subCostCode.subSubCostCodes) {
            for (const subSubCostCode of subCostCode.subSubCostCodes) {
              if (subSubCostCode.uuid === uuid) {
                return subSubCostCode
              }
            }
          }
        }
      }
    }
  }
  return null
}

// Labor estimate type options
// - When enable_location_wise is false: Manual + Hourly Wage + Per Room (if rooms) + Per Sqft (if area)
// - When enable_location_wise is true: Manual + Hourly Wage + exactly one of Per Room / Per Sqft based on the project's location basis flags
//   (location_basis_no_of_rooms -> Per Room, location_basis_area -> Per Sqft)
//   These basis-driven options then work together with the Location-wise Labor table.
const laborEstimateTypeOptions = computed(() => {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Manual', value: 'manual' },
    { label: 'Hourly Wage', value: 'hourly-wage' },
  ]

  const project = currentProject.value

  if (project?.enable_location_wise) {
    if (project.location_basis_no_of_rooms) {
      items.push({ label: 'Per Room', value: 'per-room' })
    }
    if (project.location_basis_area) {
      items.push({ label: 'Per Sqft', value: 'per-sqft' })
    }
  } else {
    if ((project?.no_of_rooms || 0) > 0) {
      items.push({ label: 'Per Room', value: 'per-room' })
    }
    if ((project?.area_sq_ft || 0) > 0) {
      items.push({ label: 'Per Sqft', value: 'per-sqft' })
    }
  }

  return items
})

// Material tab: item-wise only (manual / simple total removed from UI).
const materialEstimateTypeOptions = [{ label: 'Item Wise', value: 'item-wise' }]

// Applied material estimate type across the estimate (excluding the currently selected cost code).
// Only item-wise is used in the UI; enforce consistency when other cost codes already have item-wise lines.
const appliedMaterialEstimateType = computed((): 'manual' | 'item-wise' | null => {
  let hasItemWise = false
  const currentUuid = selectedCostCode.value?.uuid
  const walk = (costCodes: any[]) => {
    if (!Array.isArray(costCodes)) return
    for (const cc of costCodes) {
      if (cc.subCostCodes?.length) {
        walk(cc.subCostCodes)
        continue
      }
      const subSub = cc.subSubCostCodes
      if (subSub?.length) {
        for (const s of subSub) {
          if (s.uuid === currentUuid) continue
          const hasItems = Array.isArray(s.material_items) && s.material_items.length > 0
          if (hasItems) hasItemWise = true
        }
        continue
      }
      if (cc.uuid === currentUuid) continue
      const hasItems = Array.isArray(cc.material_items) && cc.material_items.length > 0
      if (hasItems) hasItemWise = true
    }
  }
  for (const div of hierarchicalDataRef.value || []) {
    walk(div.costCodes || [])
  }
  if (hasItemWise) return 'item-wise'
  return null
})

// Material item options

const unitOptions = computed(() => {
  // Use estimateCreationStore for new estimates, global store for editing
  const active = props.editingEstimate
    ? (uomStore.getActiveUOM(corpStore.selectedCorporationId || 'global') || [])
    : (estimateCreationStore.getActiveUOM || []) // getActiveUOM is a computed property (auto-unwrapped)
  return active.map((u) => ({
    label: u.short_name || u.uom_name,
    value: u.uuid,
    shortName: u.short_name || u.uom_name,
    record: u,
  }))
})

const unitLookupByUuid = computed(() => new Map(unitOptions.value.map((opt) => [opt.value, opt])))
const unitLookupByShortName = computed(() => {
  const entries = unitOptions.value.map((opt) => [String(opt.shortName || '').toUpperCase(), opt] as const)
  return new Map(entries)
})


const defaultUnitOption = computed(() => unitOptions.value[0] || { value: '', label: '', shortName: '', record: null })

const resolveUnitOption = (value?: string | null, label?: string | null) => {
  if (value) {
    const opt = unitLookupByUuid.value.get(value)
    if (opt) {
      return opt
    }
  }
  if (label) {
    const opt = unitLookupByShortName.value.get(String(label).toUpperCase())
    if (opt) {
      return opt
    }
  }
  return null
}

const normalizeMaterialItem = (raw: any) => {
  const item = { ...raw }

  // Handle item_type - API returns item_types object, but component expects string UUID
  // Extract UUID from various possible sources and ensure both item_type and item_type_uuid are set
  let itemTypeUuid: string | null = null

  // Priority 1: item_types object from API response
  if (item.item_types && typeof item.item_types === 'object' && item.item_types.uuid) {
    itemTypeUuid = item.item_types.uuid
  }
  // Priority 2: item_type is an object with uuid
  else if (item.item_type && typeof item.item_type === 'object' && item.item_type.uuid) {
    itemTypeUuid = item.item_type.uuid
  }
  // Priority 3: item_type is a string UUID (v-model updates this field, so check it FIRST)
  else if (item.item_type && typeof item.item_type === 'string' && item.item_type.trim() !== '') {
    itemTypeUuid = item.item_type.trim()
  }
  // Priority 4: item_type_uuid is a string (fallback from API)
  else if (item.item_type_uuid && typeof item.item_type_uuid === 'string' && item.item_type_uuid.trim() !== '') {
    itemTypeUuid = item.item_type_uuid.trim()
  }

  // Always sync both fields with the resolved UUID
  item.item_type = itemTypeUuid || ''
  item.item_type_uuid = itemTypeUuid || ''

  // Handle sequence - API returns item_sequence (from cost_code_preferred_items), ensure sequence field is set
  // Priority: item_sequence from API > existing sequence
  if (item.item_sequence && !item.sequence) {
    item.sequence = item.item_sequence
  }
  
  // Also sync sequence to item_sequence if sequence exists but item_sequence doesn't
  if (item.sequence && !item.item_sequence) {
    item.item_sequence = item.sequence
  }

  const rawUnitLabel = item.unit_label || item.unit_short_name || item.unit || ''
  const opt = resolveUnitOption(item.unit_uuid || item.unitUuid, rawUnitLabel)

  if (opt) {
    item.unit_uuid = opt.value || ''
    item.unit_label = opt.label || ''
    item.unit_short_name = opt.shortName || ''
  } else {
    // Preserve row-specific UOM values from saved/preferred data when lookup options are not yet available.
    item.unit_uuid = item.unit_uuid || item.unitUuid || ''
    item.unit_label = item.unit_label || item.unit_short_name || item.unit || ''
    item.unit_short_name = item.unit_short_name || item.unit_label || item.unit || ''
  }

  if ('unit' in item) {
    delete item.unit
  }
  
  // Calculate total from unit_price and quantity
  // This ensures the total column displays correctly when loading existing items
  const unitPrice = parseFloat(String(item.unit_price)) || 0
  const quantity = parseFloat(String(item.quantity)) || 0
  item.total = unitPrice * quantity

  // Ensure category exists (and legacy division from type when present)
  if (item.item_type_uuid && !item.category) {
    const it = itemTypesStore.getItemTypeById(item.item_type_uuid)
    if (it) {
      item.category = it.category ?? ''
      item.item_division_uuid = it.item_division_uuid ?? ''
    }
  }
  if (item.preferred_vendor_uuid === undefined) {
    item.preferred_vendor_uuid = raw.preferred_vendor_uuid ?? ''
  }
  if (raw.location_uuid && !item.location_uuid) {
    item.location_uuid = raw.location_uuid
  }

  return item
}

// Update labor total function
const updateLaborTotal = () => {
  // This is called when values change
  // The total is computed automatically via laborTotalAmount computed property
}

// Update a field in the location-wise labor rows (mutual exclusion for base columns; manual_amount is direct)
const updateLaborLocationWiseField = (
  index: number,
  field: 'area_sq_ft' | 'no_of_rooms' | 'num_hours' | 'amount_per_sqft' | 'amount_per_room' | 'hourly_wage' | 'manual_amount',
  value: any
) => {
  const rows = [...laborLocationWiseRows.value]
  if (!rows[index]) return
  if (field === 'manual_amount') {
    rows[index] = { ...rows[index], manual_amount: value }
  } else {
    rows[index] = applyLocationWiseFieldUpdate(rows[index], field, value) as typeof rows[0]
  }
  laborLocationWiseRows.value = rows
}

// Update a field in the location-wise material rows (manual: only amount per location)
const updateMaterialLocationWiseField = (index: number, field: 'amount', value: any) => {
  const rows = [...materialLocationWiseRows.value]
  if (!rows[index]) return
  rows[index] = { ...rows[index], [field]: value }
  materialLocationWiseRows.value = rows
}

const getPreferredItemIdentifier = (item: any): string => {
  if (!item) return ''
  // Prefer item_uuid because it represents the actual item identity used by ItemSelect/SequenceSelect.
  if (typeof item.item_uuid === 'string' && item.item_uuid.trim()) return item.item_uuid.trim()
  if (typeof item.uuid === 'string' && item.uuid.trim()) return item.uuid.trim()
  if (item.item_uuid !== undefined && item.item_uuid !== null) return String(item.item_uuid).trim()
  if (item.uuid !== undefined && item.uuid !== null) return String(item.uuid).trim()
  return ''
}

const collectMaterialPreferredItems = () => {
  const allPreferredItems: any[] = []

  // Primary source: local configurations maintained by this component.
  configurations.value.forEach((config: any) => {
    if (Array.isArray(config?.preferred_items)) {
      allPreferredItems.push(...config.preferred_items)
    }
  })

  // Fallback source: selected cost code payload can be fresher right after quick-add save.
  if (Array.isArray((selectedCostCode.value as any)?.preferred_items)) {
    allPreferredItems.push(...(selectedCostCode.value as any).preferred_items)
  }

  // Fallback source: global store config-by-id (covers cases where local list is stale).
  const selectedUuid = selectedCostCode.value?.uuid
  if (selectedUuid) {
    const storeConfig = configurationsStore.getConfigurationById(selectedUuid) as any
    if (Array.isArray(storeConfig?.preferred_items)) {
      allPreferredItems.push(...storeConfig.preferred_items)
    }
  }

  return allPreferredItems
}

// Helper functions to provide material items as options to ItemSelect and SequenceSelect
// This shows all active items of the project when in item-wise mode, ensuring all current conditions still work
const getMaterialItemOptionsForItem = (currentItem: any) => {
  const allPreferredItems = collectMaterialPreferredItems()

  if (allPreferredItems.length === 0) {
    return []
  }

  // Filter items by project_uuid, active status, and exclude current item
  return allPreferredItems
    .filter((item: any) => {
      if (item.status === 'Inactive' || item.is_active === false) {
        return false
      }
      const matchesProject = !item.project_uuid || item.project_uuid === props.projectUuid
      return matchesProject
    })
    .map((item: any) => ({
      uuid: getPreferredItemIdentifier(item),
      item_uuid: getPreferredItemIdentifier(item),
      item_sequence: item.item_sequence,
      sequence: item.item_sequence,
      item_name: item.item_name,
      name: item.item_name,
      description: item.description || '',
      unit_price: item.unit_price,
      unit_uuid: item.unit_uuid,
      unit_label: item.unit_label || item.unit_short_name || item.unit || '',
      unit_short_name: item.unit_short_name || item.unit_label || item.unit || '',
      unit: item.unit || item.unit_short_name || item.unit_label || '',
      project_uuid: item.project_uuid,
      item_type_uuid: item.item_type_uuid,
      is_active: item.is_active,
      status: item.status,
    }))
}

const getMaterialItemOptionsForSequence = (currentItem: any) => {
  const allPreferredItems = collectMaterialPreferredItems()

  if (allPreferredItems.length === 0) {
    return []
  }

  return allPreferredItems
    .filter((item: any) => {
      if (item.status === 'Inactive' || item.is_active === false) {
        return false
      }
      const matchesProject = !item.project_uuid || item.project_uuid === props.projectUuid
      return matchesProject
    })
    .map((item: any) => ({
      uuid: getPreferredItemIdentifier(item),
      item_uuid: getPreferredItemIdentifier(item),
      item_sequence: item.item_sequence,
      sequence: item.item_sequence,
      item_name: item.item_name,
      name: item.item_name,
      description: item.description || '',
      unit_price: item.unit_price,
      unit_uuid: item.unit_uuid,
      unit_label: item.unit_label || item.unit_short_name || item.unit || '',
      unit_short_name: item.unit_short_name || item.unit_label || item.unit || '',
      unit: item.unit || item.unit_short_name || item.unit_label || '',
      project_uuid: item.project_uuid,
      item_type_uuid: item.item_type_uuid,
      is_active: item.is_active,
      status: item.status,
    }))
}

const getProjectPreferredItemByIdentifier = (itemIdentifier: string | undefined | null) => {
  const target = String(itemIdentifier || '').trim()
  if (!target) return null

  for (const config of configurations.value) {
    const preferred = Array.isArray((config as any)?.preferred_items) ? (config as any).preferred_items : []
    const found = preferred.find((candidate: any) => {
      if (candidate?.status === 'Inactive' || candidate?.is_active === false) return false
      const matchesProject = !candidate?.project_uuid || candidate.project_uuid === props.projectUuid
      if (!matchesProject) return false
      return getPreferredItemIdentifier(candidate) === target
    })
    if (found) return found
  }

  return null
}

// Get excluded item UUIDs for filtering dropdowns
const getExcludedItemUuids = (currentItemUuid?: string) => {
  return materialItems.value
    .filter(item => item.item_uuid && item.item_uuid !== currentItemUuid)
    .map(item => item.item_uuid)
}

// Cascading reset: category change clears division (legacy), type, and item selection
const onMaterialItemCategoryChange = (index: number) => {
  const item = materialItems.value[index]
  if (!item) return
  item.item_division_uuid = ''
  item.item_type = ''
  item.item_uuid = ''
  item.name = ''
  item.sequence = ''
  item.description = ''
  item.unit_price = 0
  item.unit_uuid = defaultUnitOption.value?.value || ''
  item.quantity = 1
  item.total = 0
  updateMaterialItemTotal(index)
}

// When item type changes, sync category and item_division_uuid from the selected type and clear item selection
const onMaterialItemTypeChange = (index: number) => {
  const item = materialItems.value[index]
  if (!item) return
  // Clear downstream fields
  item.item_uuid = ''
  item.name = ''
  item.sequence = ''
  item.description = ''
  item.unit_price = 0
  item.unit_uuid = defaultUnitOption.value?.value || ''
  item.quantity = 1
  item.total = 0
  updateMaterialItemTotal(index)
  if (!item.item_type) return
  // Sync category and division backward from the selected type
  const it = itemTypesStore.getItemTypeById(item.item_type)
  if (it) {
    item.category = it.category ?? ''
    item.item_division_uuid = it.item_division_uuid ?? ''
  }
}

// Material item management functions
const addMaterialItem = () => {
  const opt = defaultUnitOption.value
  const newItem = {
    item_uuid: '',
    item_type: '',
    item_type_uuid: '',
    preferred_vendor_uuid: '',
    location_uuid: '',
    category: '',
    item_division_uuid: '',
    sequence: '',
    name: '',
    description: '',
    model_number: '',
    unit_price: 0,
    unit_uuid: opt.value || '',
    unit_label: opt.label || '',
    unit_short_name: opt.shortName || '',
    quantity: 1,
    total: 0,
    is_preferred: false,
  }
  materialItems.value.push(newItem)
}

const handleMaterialItemUnitChange = (
  index: number,
  option?: { value: string; label: string; shortName?: string; uom?: any }
) => {
  const target = materialItems.value[index]
  if (!target) return

  const resolved =
    option
      ? {
          value: option.value,
          label: option.label,
          shortName: option.shortName || option.uom?.short_name || option.label,
        }
      : resolveUnitOption(target.unit_uuid, target.unit_label)
  target.unit_uuid = resolved?.value || ''
  target.unit_label = resolved?.label || ''
  target.unit_short_name = resolved?.shortName || ''

  updateMaterialItemTotal(index)
}

// Load preferred items for the selected cost code
// Helper function to enrich saved material items with current item_sequence from preferred items
// Note: API now returns current name/sequence from cost_code_preferred_items, so this is a secondary fallback
const enrichMaterialItemsWithSequence = (savedItems: any[], costCodeUuid: string) => {
  const costCodeConfig = configurations.value.find(config => config.uuid === costCodeUuid)

  if (!costCodeConfig || !costCodeConfig.preferred_items) {
    return savedItems
  }

  // Filter preferred items to only include those for the current project and active items
  const filteredPreferredItems = costCodeConfig.preferred_items.filter((item: any) => {
    if (item.status === 'Inactive' || item.is_active === false) {
      return false
    }
    const matchesProject = !item.project_uuid || item.project_uuid === props.projectUuid
    return matchesProject
  })

  // Create a map of filtered preferred items by uuid for quick lookup
  const preferredItemsMap: Map<string, any> = new Map(
    filteredPreferredItems
      .map((item: any) => [getPreferredItemIdentifier(item), item as any] as const)
      .filter(([id]: readonly [string | undefined, any]) => !!id)
  )

  // Enrich saved items with current sequence values and updated names
  // Note: Only override if API didn't already provide current values
  const enrichedItems = savedItems.map((savedItem: any) => {
      const preferredItem = preferredItemsMap.get(savedItem.item_uuid)

    if (preferredItem) {
      const preferredUnit = resolveUnitOption(
        preferredItem.unit_uuid,
        preferredItem.unit || preferredItem.unit_label || preferredItem.unit_short_name
      )
      return {
        ...savedItem,
        sequence: preferredItem.item_sequence || savedItem.sequence || savedItem.item_sequence || '',
        item_sequence: preferredItem.item_sequence || savedItem.item_sequence || savedItem.sequence || '',
        name: preferredItem.item_name || savedItem.name || '',
        // Keep material rows aligned with the current item list configuration.
        description: preferredItem.description || savedItem.description || '',
        unit_uuid: preferredUnit?.value || preferredItem.unit_uuid || savedItem.unit_uuid || '',
        unit_label:
          preferredUnit?.label ||
          preferredItem.unit ||
          preferredItem.unit_label ||
          preferredItem.unit_short_name ||
          savedItem.unit_label ||
          '',
        unit_short_name:
          preferredUnit?.shortName ||
          preferredItem.unit ||
          preferredItem.unit_short_name ||
          preferredItem.unit_label ||
          savedItem.unit_short_name ||
          '',
      }
    }
    return savedItem
  })

  return enrichedItems
}

const loadPreferredItems = () => {
  if (!selectedCostCode.value) {
    return
  }

  // Find the cost code configuration that matches the selected cost code
  const costCodeConfig = configurations.value.find(config =>
    config.uuid === selectedCostCode.value.uuid
  )

  if (costCodeConfig && costCodeConfig.preferred_items && costCodeConfig.preferred_items.length > 0) {
    const filteredPreferredItems = costCodeConfig.preferred_items.filter((item: any) => {
      if (item.status === 'Inactive' || item.is_active === false) {
        return false
      }
      return !item.project_uuid || item.project_uuid === props.projectUuid
    })

    const hasExistingItems = materialItems.value.length > 0 && materialItems.value.some(item => !item.is_preferred)
    if (hasExistingItems) {
      return
    }

    // Convert filtered preferred items to material items format
    materialItems.value = filteredPreferredItems.map((prefItem: any) => {
      const resolvedUnit = resolveUnitOption(prefItem.unit_uuid, prefItem.unit || prefItem.unit_label || prefItem.unit_short_name)
      const materialItem = normalizeMaterialItem({
        item_uuid: getPreferredItemIdentifier(prefItem),
        item_type: prefItem.item_type_uuid || '',
        sequence: prefItem.item_sequence || '',
        name: prefItem.item_name || '',
        description: prefItem.description || '',
        model_number: prefItem.model_number || '',
        unit_price: parseFloat(prefItem.unit_price) || 0,
        unit_uuid: resolvedUnit?.value || '',
        unit_label: resolvedUnit?.label || '',
        unit_short_name: resolvedUnit?.shortName || '',
        quantity: 1,
        total: parseFloat(prefItem.unit_price) || 0,
        is_preferred: true,
        preferred_vendor_uuid: prefItem.preferred_vendor_uuid ?? '',
        location_uuid: prefItem.location_uuid ?? '',
      })
      return materialItem
    })

  } else {
    if (materialItems.value.length === 0) {
      materialItems.value = []
    }
  }
}

const syncLocalConfigurationPreferredItems = (configurationUuid: string, preferredItems: any[]) => {
  const normalizedPreferredItems = Array.isArray(preferredItems) ? preferredItems : []

  const localConfigIndex = configurations.value.findIndex((config: any) => config?.uuid === configurationUuid)
  if (localConfigIndex >= 0) {
    configurations.value[localConfigIndex] = {
      ...configurations.value[localConfigIndex],
      preferred_items: normalizedPreferredItems,
    }
  }

  if (selectedCostCode.value?.uuid === configurationUuid) {
    selectedCostCode.value = {
      ...selectedCostCode.value,
      preferred_items: normalizedPreferredItems,
    }
  }
}

const syncMaterialItemsFromPreferredItems = (preferredItems: any[]) => {
  const hasManualRows =
    materialItems.value.length > 0 &&
    materialItems.value.some((item: any) => item?.is_preferred !== true)
  const projectFiltered = (Array.isArray(preferredItems) ? preferredItems : []).filter((item: any) => {
    if (item?.status === 'Inactive' || item?.is_active === false) return false
    return !item?.project_uuid || item.project_uuid === props.projectUuid
  })

  const normalizedPreferredRows = projectFiltered.map((prefItem: any) => {
    const resolvedUnit = resolveUnitOption(prefItem.unit_uuid, prefItem.unit || prefItem.unit_label || prefItem.unit_short_name)
    return normalizeMaterialItem({
      item_uuid: getPreferredItemIdentifier(prefItem),
      item_type: prefItem.item_type_uuid || '',
      sequence: prefItem.item_sequence || '',
      name: prefItem.item_name || '',
      description: prefItem.description || '',
      model_number: prefItem.model_number || '',
      unit_price: parseFloat(prefItem.unit_price) || 0,
      unit_uuid: resolvedUnit?.value || '',
      unit_label: resolvedUnit?.label || '',
      unit_short_name: resolvedUnit?.shortName || '',
      quantity: 1,
      total: parseFloat(prefItem.unit_price) || 0,
      is_preferred: true,
      preferred_vendor_uuid: prefItem.preferred_vendor_uuid ?? '',
      location_uuid: prefItem.location_uuid ?? '',
    })
  })

  if (!hasManualRows) {
    materialItems.value = normalizedPreferredRows
    return
  }

  const existingItemIds = new Set(
    materialItems.value
      .map((item: any) => String(item?.item_uuid || '').trim())
      .filter((id: string) => id.length > 0)
  )

  const rowsToAppend = normalizedPreferredRows.filter((prefRow: any) => {
    const preferredId = String(prefRow?.item_uuid || '').trim()
    return preferredId.length > 0 && !existingItemIds.has(preferredId)
  })

  if (rowsToAppend.length > 0) {
    materialItems.value = [...materialItems.value, ...rowsToAppend]
  }
}

const handlePreferredItemsModalSave = async (payload: {
  rows: any[]
  projectUuid: string
  itemTypeUuid: string
  corporationUuid: string
}) => {
  isRefreshingMaterialItems.value = true
  const costCodeUuid = selectedCostCode.value?.uuid || ''
  if (!costCodeUuid) {
    isRefreshingMaterialItems.value = false
    return
  }

  let configuration = configurationsStore.getConfigurationById(costCodeUuid)
  if (!configuration && payload.corporationUuid) {
    try {
      await configurationsStore.fetchConfigurations(payload.corporationUuid, true)
      configuration = configurationsStore.getConfigurationById(costCodeUuid)
    } catch (err) {
      console.error('[EstimateLineItemsTable] Error refreshing configuration before saving preferred items:', err)
    }
  }

  if (!configuration?.uuid) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Unable to find the selected cost code configuration.',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
    return
  }

  const existingPreferredItems = Array.isArray(configuration.preferred_items)
    ? [...configuration.preferred_items]
    : []

  const incomingRows = Array.isArray(payload.rows) ? payload.rows : []
  const incomingIds = new Set<string>(
    incomingRows
      .map((row: any) => row?.uuid)
      .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
  )

  let mergedPreferredItems = existingPreferredItems.filter((item: any) => {
    if (item?.item_type_uuid !== payload.itemTypeUuid) return true
    if (item?.project_uuid !== payload.projectUuid) return true
    if (!item?.uuid) return false
    return incomingIds.has(item.uuid)
  })

  for (const row of incomingRows) {
    const normalizedRow = {
      ...(row?.uuid ? { uuid: row.uuid } : {}),
      item_name: row?.item_name || '',
      item_sequence: row?.item_sequence || undefined,
      model_number: row?.model_number || undefined,
      item_type_uuid: payload.itemTypeUuid,
      project_uuid: payload.projectUuid,
      corporation_uuid: payload.corporationUuid || currentCorporationUuid.value || '',
      unit_price: parseFloat(String(row?.unit_price ?? 0)) || 0,
      unit: row?.unit || '',
      description: row?.description || '',
      status: row?.status || 'Active',
      location_uuid: row?.location_uuid || undefined,
      preferred_vendor_uuid: row?.preferred_vendor_uuid || undefined,
      initial_quantity:
        row?.initial_quantity !== undefined &&
        row?.initial_quantity !== null &&
        row?.initial_quantity !== ''
          ? parseFloat(String(row.initial_quantity))
          : undefined,
      as_of_date: row?.as_of_date || undefined,
      reorder_point:
        row?.reorder_point !== undefined &&
        row?.reorder_point !== null &&
        row?.reorder_point !== ''
          ? parseFloat(String(row.reorder_point))
          : undefined,
      maximum_limit:
        row?.maximum_limit !== undefined &&
        row?.maximum_limit !== null &&
        row?.maximum_limit !== ''
          ? parseFloat(String(row.maximum_limit))
          : undefined,
    }

    if (row?.uuid) {
      const existingIndex = mergedPreferredItems.findIndex((item: any) => item?.uuid === row.uuid)
      if (existingIndex >= 0) {
        mergedPreferredItems[existingIndex] = {
          ...mergedPreferredItems[existingIndex],
          ...normalizedRow,
        }
      } else {
        mergedPreferredItems.push(normalizedRow)
      }
    } else {
      mergedPreferredItems.push(normalizedRow)
    }
  }

  try {
    const updatedConfiguration = await configurationsStore.updateConfiguration(configuration.uuid, {
      ...configuration,
      preferred_items: mergedPreferredItems,
    })
    let latestPreferredItems = Array.isArray((updatedConfiguration as any)?.preferred_items)
      ? (updatedConfiguration as any).preferred_items
      : mergedPreferredItems

    // Newly created rows often get their stable item_uuid only after backend persistence.
    // Refresh from API so Item/Spec dropdowns bind to the real persisted identifiers.
    if (payload.corporationUuid) {
      try {
        await configurationsStore.fetchConfigurations(payload.corporationUuid, true)
        const refreshedConfiguration = configurationsStore.getConfigurationById(configuration.uuid)
        if (Array.isArray(refreshedConfiguration?.preferred_items)) {
          const refreshedPreferredItems = refreshedConfiguration.preferred_items
          // Guard against eventual-consistency/stale refresh responses that briefly return empty items.
          if (refreshedPreferredItems.length > 0 || latestPreferredItems.length === 0) {
            latestPreferredItems = refreshedPreferredItems
          }
        }
      } catch (refreshError) {
        console.error('[EstimateLineItemsTable] Error refreshing preferred items after save:', refreshError)
      }
    }

    syncLocalConfigurationPreferredItems(configuration.uuid, latestPreferredItems)
    syncMaterialItemsFromPreferredItems(latestPreferredItems)
    await loadPreferredItems()
  } catch (err) {
    console.error('[EstimateLineItemsTable] Error saving preferred items from modal:', err)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to save preferred items for the selected cost code.',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isRefreshingMaterialItems.value = false
  }
}

const removeMaterialItem = (index: number) => {
  materialItems.value.splice(index, 1)
}

const duplicateMaterialItem = (index: number) => {
  const item = normalizeMaterialItem(materialItems.value[index] || {})
  materialItems.value.splice(index + 1, 0, { ...item })
}

const updateMaterialItemTotal = (index: number) => {
  const item = materialItems.value[index]
  const unitPrice = parseFloat(String(item.unit_price)) || 0
  const quantity = parseFloat(String(item.quantity)) || 0
  item.total = unitPrice * quantity
}

const handleItemUuidChange = (index: number, itemUuid: string | undefined, option?: any) => {
  const item = materialItems.value[index]
  if (!item) return
  
  // Update item_uuid
  item.item_uuid = itemUuid || ''
  
  // Extract item details from the option
  if (option) {
    // Get item name from option (could be from SequenceSelect or ItemSelect)
    const rawItem = option.raw || option
    if (rawItem) {
      // Update name from item_name or label
      if (rawItem.item_name) {
        item.name = rawItem.item_name
      } else if (rawItem.label) {
        item.name = rawItem.label
      } else if (rawItem.name) {
        item.name = rawItem.name
      }
      
      // Update description if available
      if (rawItem.description) {
        item.description = rawItem.description
      }
      
      // Update unit_price if available
      if (rawItem.unit_price !== null && rawItem.unit_price !== undefined) {
        item.unit_price = parseFloat(String(rawItem.unit_price)) || 0
      }
      
      // Update unit_uuid if available
      if (rawItem.unit_uuid) {
        item.unit_uuid = rawItem.unit_uuid
      } else if (rawItem.unit || rawItem.unit_label || rawItem.unit_short_name) {
        // Try to resolve unit from any unit text present in the selected item payload.
        const unitOpt = resolveUnitOption(null, rawItem.unit || rawItem.unit_label || rawItem.unit_short_name)
        if (unitOpt && unitOpt.value) {
          item.unit_uuid = unitOpt.value
          item.unit_label = unitOpt.label
          item.unit_short_name = unitOpt.shortName
        } else {
          item.unit_label = rawItem.unit_label || rawItem.unit_short_name || rawItem.unit || item.unit_label || ''
          item.unit_short_name = rawItem.unit_short_name || rawItem.unit_label || rawItem.unit || item.unit_short_name || ''
        }
      }

      // Prefer vendor/location from selection payload; if absent, hydrate from project-wide preferred items.
      if (rawItem.preferred_vendor_uuid !== null && rawItem.preferred_vendor_uuid !== undefined) {
        item.preferred_vendor_uuid = rawItem.preferred_vendor_uuid
      }
      if (rawItem.location_uuid !== null && rawItem.location_uuid !== undefined) {
        item.location_uuid = rawItem.location_uuid
      }

      if (!item.preferred_vendor_uuid || !item.location_uuid) {
        const preferred = getProjectPreferredItemByIdentifier(item.item_uuid || rawItem.item_uuid || rawItem.uuid)
        if (preferred) {
          if (!item.description && preferred.description) {
            item.description = preferred.description
          }
          if (!item.unit_uuid && !item.unit_label && !item.unit_short_name) {
            const preferredUnitOpt = resolveUnitOption(
              preferred.unit_uuid,
              preferred.unit || preferred.unit_label || preferred.unit_short_name
            )
            if (preferredUnitOpt) {
              item.unit_uuid = preferredUnitOpt.value || ''
              item.unit_label = preferredUnitOpt.label || ''
              item.unit_short_name = preferredUnitOpt.shortName || ''
            } else {
              item.unit_label = preferred.unit || preferred.unit_label || preferred.unit_short_name || ''
              item.unit_short_name = preferred.unit_short_name || preferred.unit_label || preferred.unit || ''
            }
          }
          if (!item.preferred_vendor_uuid) {
            item.preferred_vendor_uuid = preferred.preferred_vendor_uuid ?? ''
          }
          if (!item.location_uuid) {
            item.location_uuid = preferred.location_uuid ?? ''
          }
        }
      }
    }
  }
  
  // Recalculate total
  updateMaterialItemTotal(index)
}

const updateMaterialTotal = () => {
  // This is called when values change
  // The total is computed automatically via materialTotalAmount computed property
}

const updateTotalAmount = () => {
  // This is called when values change
  // The total is computed automatically via totalAmount computed property
}

watch(
  unitOptions,
  () => {
    materialItems.value = materialItems.value.map(normalizeMaterialItem)
  },
  { deep: false }
)

// Apply labor estimate to cost code
const applyLaborEstimate = () => {
  if (!selectedCostCode.value) return
  const hasLocationWiseLaborRows = isLocationWiseProject.value && laborLocationWiseRows.value.length > 0
  if (laborTotalAmount.value === 0 && !hasLocationWiseLaborRows) return

  // Tab-independent: check if location-wise labor is active based on project setting and labor type
  const isLocationWise = isLocationWiseProject.value &&
    (laborEstimateType.value === 'manual' ||
    laborEstimateType.value === 'per-sqft' ||
    laborEstimateType.value === 'per-room' ||
    laborEstimateType.value === 'hourly-wage')
  
  // Find and update the cost code in hierarchical data
  hierarchicalDataRef.value.forEach((division: any) => {
    division.costCodes.forEach((costCode: any) => {
      // Check if this is the selected cost code
      if (costCode.uuid === selectedCostCode.value.uuid) {
        // Persist how the labor was calculated (per-sqft, per-room, hourly-wage, or manual)
        costCode.estimation_type = laborEstimateType.value
        if (isLocationWise) {
          const lwRows = laborLocationWiseRows.value.map((r) => ({
            breakdown_uuid: r.breakdown_uuid,
            location_uuid: r.location_uuid,
            area_sq_ft: parseFloat(String(r.area_sq_ft)) || 0,
            no_of_rooms: parseFloat(String(r.no_of_rooms)) || 0,
            num_hours: parseFloat(String(r.num_hours)) || 0,
            amount_per_sqft: parseFloat(String(r.amount_per_sqft)) || 0,
            amount_per_room: parseFloat(String(r.amount_per_room)) || 0,
            hourly_wage: parseFloat(String(r.hourly_wage)) || 0,
            manual_amount: parseFloat(String(r.manual_amount)) || 0,
            amount: getLocationWiseRowAmount(r)
          }))
          costCode.location_wise_labor = lwRows
          costCode.labor_amount_per_room = 0
          costCode.labor_rooms_count = 0
          costCode.labor_amount_per_sqft = 0
          costCode.labor_sq_ft_count = 0
          costCode.labor_number_of_hours = 0
          costCode.labor_hourly_wage = 0
        } else if (laborEstimateType.value === 'per-room') {
          const rooms = currentProject.value?.no_of_rooms || 0
          const perRoom = parseFloat(String(laborAmountPerRoom.value)) || 0
          costCode.labor_amount_per_room = perRoom
          costCode.labor_rooms_count = rooms
          costCode.labor_amount_per_sqft = 0
          costCode.labor_sq_ft_count = 0
          costCode.labor_number_of_hours = 0
          costCode.labor_hourly_wage = 0
        } else if (laborEstimateType.value === 'per-sqft') {
          const area = currentProject.value?.area_sq_ft || 0
          const perSqft = parseFloat(String(laborAmountPerSqft.value)) || 0
          costCode.labor_amount_per_sqft = perSqft
          costCode.labor_sq_ft_count = area
          costCode.labor_amount_per_room = 0
          costCode.labor_rooms_count = 0
          costCode.labor_number_of_hours = 0
          costCode.labor_hourly_wage = 0
        } else if (laborEstimateType.value === 'hourly-wage') {
          const hours = parseFloat(String(laborNumberOfHours.value)) || 0
          const wage = parseFloat(String(laborHourlyWage.value)) || 0
          costCode.labor_number_of_hours = hours
          costCode.labor_hourly_wage = wage
          costCode.labor_amount_per_room = 0
          costCode.labor_rooms_count = 0
          costCode.labor_amount_per_sqft = 0
          costCode.labor_sq_ft_count = 0
        } else {
          costCode.labor_amount_per_room = 0
          costCode.labor_rooms_count = 0
          costCode.labor_amount_per_sqft = 0
          costCode.labor_sq_ft_count = 0
          costCode.labor_number_of_hours = 0
          costCode.labor_hourly_wage = 0
        }
        costCode.labor_amount = laborTotalAmount.value
        // Auto-calculate total if not in "only_total" mode
        if (!showOnlyTotal.value) {
          const material = parseFloat(costCode.material_amount) || 0
          costCode.total_amount = laborTotalAmount.value + material
        }
        appliedCostCodes.value.add(costCode.uuid)
      }
      
      // Also check sub-cost codes
      if (costCode.subCostCodes) {
        costCode.subCostCodes.forEach((subCostCode: any) => {
          if (subCostCode.uuid === selectedCostCode.value.uuid) {
            subCostCode.estimation_type = laborEstimateType.value
            if (isLocationWise) {
              subCostCode.labor_amount = laborTotalAmount.value
              subCostCode.location_wise_labor = laborLocationWiseRows.value.map((r) => ({
                breakdown_uuid: r.breakdown_uuid,
                location_uuid: r.location_uuid,
                area_sq_ft: parseFloat(String(r.area_sq_ft)) || 0,
                no_of_rooms: parseFloat(String(r.no_of_rooms)) || 0,
                num_hours: parseFloat(String(r.num_hours)) || 0,
                amount_per_sqft: parseFloat(String(r.amount_per_sqft)) || 0,
                amount_per_room: parseFloat(String(r.amount_per_room)) || 0,
                hourly_wage: parseFloat(String(r.hourly_wage)) || 0,
                manual_amount: parseFloat(String(r.manual_amount)) || 0,
                amount: getLocationWiseRowAmount(r)
              }))
              subCostCode.labor_amount_per_room = 0
              subCostCode.labor_rooms_count = 0
              subCostCode.labor_amount_per_sqft = 0
              subCostCode.labor_sq_ft_count = 0
              subCostCode.labor_number_of_hours = 0
              subCostCode.labor_hourly_wage = 0
            } else if (laborEstimateType.value === 'per-room') {
              const rooms = currentProject.value?.no_of_rooms || 0
              const perRoom = parseFloat(String(laborAmountPerRoom.value)) || 0
              subCostCode.labor_amount_per_room = perRoom
              subCostCode.labor_rooms_count = rooms
              subCostCode.labor_amount_per_sqft = 0
              subCostCode.labor_sq_ft_count = 0
              subCostCode.labor_number_of_hours = 0
              subCostCode.labor_hourly_wage = 0
            } else if (laborEstimateType.value === 'per-sqft') {
              const area = currentProject.value?.area_sq_ft || 0
              const perSqft = parseFloat(String(laborAmountPerSqft.value)) || 0
              subCostCode.labor_amount_per_sqft = perSqft
              subCostCode.labor_sq_ft_count = area
              subCostCode.labor_amount_per_room = 0
              subCostCode.labor_rooms_count = 0
              subCostCode.labor_number_of_hours = 0
              subCostCode.labor_hourly_wage = 0
            } else if (laborEstimateType.value === 'hourly-wage') {
              const hours = parseFloat(String(laborNumberOfHours.value)) || 0
              const wage = parseFloat(String(laborHourlyWage.value)) || 0
              subCostCode.labor_number_of_hours = hours
              subCostCode.labor_hourly_wage = wage
              subCostCode.labor_amount_per_room = 0
              subCostCode.labor_rooms_count = 0
              subCostCode.labor_amount_per_sqft = 0
              subCostCode.labor_sq_ft_count = 0
            } else {
              subCostCode.labor_amount_per_room = 0
              subCostCode.labor_rooms_count = 0
              subCostCode.labor_amount_per_sqft = 0
              subCostCode.labor_sq_ft_count = 0
              subCostCode.labor_number_of_hours = 0
              subCostCode.labor_hourly_wage = 0
            }
            subCostCode.labor_amount = laborTotalAmount.value
            // Auto-calculate total if not in "only_total" mode
            if (!showOnlyTotal.value) {
              const material = parseFloat(subCostCode.material_amount) || 0
              subCostCode.total_amount = laborTotalAmount.value + material
            }
            appliedCostCodes.value.add(subCostCode.uuid)
          }
          
          // Check sub-sub-cost codes
          if (subCostCode.subSubCostCodes) {
            subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
              if (subSubCostCode.uuid === selectedCostCode.value.uuid) {
                subSubCostCode.estimation_type = laborEstimateType.value
                if (isLocationWise) {
                  subSubCostCode.labor_amount = laborTotalAmount.value
                  subSubCostCode.location_wise_labor = laborLocationWiseRows.value.map((r) => ({
                    breakdown_uuid: r.breakdown_uuid,
                    location_uuid: r.location_uuid,
                    area_sq_ft: parseFloat(String(r.area_sq_ft)) || 0,
                    no_of_rooms: parseFloat(String(r.no_of_rooms)) || 0,
                    num_hours: parseFloat(String(r.num_hours)) || 0,
                    amount_per_sqft: parseFloat(String(r.amount_per_sqft)) || 0,
                    amount_per_room: parseFloat(String(r.amount_per_room)) || 0,
                    hourly_wage: parseFloat(String(r.hourly_wage)) || 0,
                    manual_amount: parseFloat(String(r.manual_amount)) || 0,
                    amount: getLocationWiseRowAmount(r)
                  }))
                  subSubCostCode.labor_amount_per_room = 0
                  subSubCostCode.labor_rooms_count = 0
                  subSubCostCode.labor_amount_per_sqft = 0
                  subSubCostCode.labor_sq_ft_count = 0
                  subSubCostCode.labor_number_of_hours = 0
                  subSubCostCode.labor_hourly_wage = 0
                } else if (laborEstimateType.value === 'per-room') {
                  const rooms = currentProject.value?.no_of_rooms || 0
                  const perRoom = parseFloat(String(laborAmountPerRoom.value)) || 0
                  subSubCostCode.labor_amount_per_room = perRoom
                  subSubCostCode.labor_rooms_count = rooms
                  subSubCostCode.labor_amount_per_sqft = 0
                  subSubCostCode.labor_sq_ft_count = 0
                  subSubCostCode.labor_number_of_hours = 0
                  subSubCostCode.labor_hourly_wage = 0
                } else if (laborEstimateType.value === 'per-sqft') {
                  const area = currentProject.value?.area_sq_ft || 0
                  const perSqft = parseFloat(String(laborAmountPerSqft.value)) || 0
                  subSubCostCode.labor_amount_per_sqft = perSqft
                  subSubCostCode.labor_sq_ft_count = area
                  subSubCostCode.labor_amount_per_room = 0
                  subSubCostCode.labor_rooms_count = 0
                  subSubCostCode.labor_number_of_hours = 0
                  subSubCostCode.labor_hourly_wage = 0
                } else if (laborEstimateType.value === 'hourly-wage') {
                  const hours = parseFloat(String(laborNumberOfHours.value)) || 0
                  const wage = parseFloat(String(laborHourlyWage.value)) || 0
                  subSubCostCode.labor_number_of_hours = hours
                  subSubCostCode.labor_hourly_wage = wage
                  subSubCostCode.labor_amount_per_room = 0
                  subSubCostCode.labor_rooms_count = 0
                  subSubCostCode.labor_amount_per_sqft = 0
                  subSubCostCode.labor_sq_ft_count = 0
                } else {
                  subSubCostCode.labor_amount_per_room = 0
                  subSubCostCode.labor_rooms_count = 0
                  subSubCostCode.labor_amount_per_sqft = 0
                  subSubCostCode.labor_sq_ft_count = 0
                  subSubCostCode.labor_number_of_hours = 0
                  subSubCostCode.labor_hourly_wage = 0
                }
                subSubCostCode.labor_amount = laborTotalAmount.value
                // Auto-calculate total if not in "only_total" mode
                if (!showOnlyTotal.value) {
                  const material = parseFloat(subSubCostCode.material_amount) || 0
                  subSubCostCode.total_amount = laborTotalAmount.value + material
                }
                appliedCostCodes.value.add(subSubCostCode.uuid)
              }
            })
          }
        })
      }
    })
  })
  
  // Trigger reactivity update
  nextTick(() => {
    hierarchicalDataRef.value = [...hierarchicalDataRef.value]
  })
  
  // Emit the line items update to trigger recalculation in parent
  emitLineItemsUpdate()
  
  // Don't close modal here, let user click Close explicitly
  // This way they can see the result or make adjustments
}

// Material total amount calculation
const materialTotalAmount = computed(() => {
  // Use location-wise rows for total when project is location-wise and manual (even when Contingency tab is active)
  if (useLocationWiseMaterialForTotal.value) {
    return materialLocationWiseRows.value.reduce((sum, row) => sum + (parseFloat(String(row.amount)) || 0), 0)
  }
  if (materialEstimateType.value === 'manual') {
    return parseFloat(String(materialManualAmount.value)) || 0
  } else if (materialEstimateType.value === 'item-wise') {
    return materialItems.value.reduce((total, item) => {
      return total + (parseFloat(item.total) || 0)
    }, 0)
  }
  return 0
})

// Total amount for only_total projects
const totalAmount = computed(() => {
  return parseFloat(String(totalManualAmount.value)) || 0
})

// Apply material estimate to cost code
const applyMaterialEstimate = async () => {
  // Use tab-independent check: location-wise material is active when project is location-wise and material type is manual
  const isLocationWiseMaterial = isLocationWiseProject.value && materialEstimateType.value === 'manual'
  const hasLocationWiseMaterialRows = isLocationWiseMaterial && materialLocationWiseRows.value.length > 0
  if (!selectedCostCode.value) return
  const hasItemWiseRows = materialEstimateType.value === 'item-wise' && materialItems.value.length > 0
  if (materialTotalAmount.value === 0 && !hasLocationWiseMaterialRows && !hasItemWiseRows) return

  // Enforce single material estimate type across all cost codes
  const applied = appliedMaterialEstimateType.value
  if (applied != null && materialEstimateType.value !== applied) {
    const toast = useToast()
    const otherLabel = applied === 'item-wise' ? 'Item Wise' : 'Manual'
    toast.add({
      title: 'Material estimate type must be consistent',
      description: `Other cost codes in this estimate use "${otherLabel}". Please use "${otherLabel}" for this cost code as well.`,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
      duration: 5000,
    })
    return
  }

  // Validate item-wise material items
  if (materialEstimateType.value === 'item-wise') {
    const incompleteItems = materialItems.value.filter((item, index) => {
      // Check if item_uuid is missing/empty (item selection is required)
      const hasNoItem = !item.item_uuid || item.item_uuid.trim() === ''
      return hasNoItem
    })

    if (incompleteItems.length > 0) {
      const toast = useToast()
      toast.add({
        title: 'Incomplete Items',
        description: 'Please remove the row for which there is no item selected or select an item to save the estimate.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle',
        duration: 5000
      })
      return false // Prevent saving and indicate validation failure
    }
  }

  let normalizedItems: any[] = []
  if (materialEstimateType.value === 'item-wise') {
    normalizedItems = materialItems.value.map((item) => normalizeMaterialItem(item))
    materialItems.value = normalizedItems
    // Note: Material items are NOT saved directly to the API here.
    // They are stored in costCode.material_items and saved when the estimate is saved
    // via PUT /api/estimates/[id], which handles the estimate_line_items UUID mapping correctly.
  }

  // Find and update the cost code in hierarchical data
  hierarchicalDataRef.value.forEach((division: any) => {
    division.costCodes.forEach((costCode: any) => {
      // Check if this is the selected cost code
      if (costCode.uuid === selectedCostCode.value.uuid) {
        costCode.material_amount = materialTotalAmount.value
        const itemsToSave = materialEstimateType.value === 'item-wise' ? normalizedItems.map((item) => ({ ...item })) : []
        costCode.material_items = itemsToSave
        if (isLocationWiseMaterial) {
          costCode.location_wise_material = materialLocationWiseRows.value.map((r) => ({
            breakdown_uuid: r.breakdown_uuid,
            location_uuid: r.location_uuid,
            amount: parseFloat(String(r.amount)) || 0
          }))
        } else {
          costCode.location_wise_material = []
        }

        if (!showOnlyTotal.value) {
          const labor = parseFloat(costCode.labor_amount) || 0
          costCode.total_amount = labor + materialTotalAmount.value
        }
        appliedCostCodes.value.add(costCode.uuid)
      }
      
      // Also check sub-cost codes
      if (costCode.subCostCodes) {
        costCode.subCostCodes.forEach((subCostCode: any) => {
          if (subCostCode.uuid === selectedCostCode.value.uuid) {
            subCostCode.material_amount = materialTotalAmount.value
            subCostCode.material_items = materialEstimateType.value === 'item-wise' ? normalizedItems.map((item) => ({ ...item })) : []
            if (isLocationWiseMaterial) {
              subCostCode.location_wise_material = materialLocationWiseRows.value.map((r) => ({
                breakdown_uuid: r.breakdown_uuid,
                location_uuid: r.location_uuid,
                amount: parseFloat(String(r.amount)) || 0
              }))
            } else {
              subCostCode.location_wise_material = []
            }
            
            if (!showOnlyTotal.value) {
              const labor = parseFloat(subCostCode.labor_amount) || 0
              subCostCode.total_amount = labor + materialTotalAmount.value
            }
            appliedCostCodes.value.add(subCostCode.uuid)
          }
          
          // Check sub-sub-cost codes
          if (subCostCode.subSubCostCodes) {
            subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
              if (subSubCostCode.uuid === selectedCostCode.value.uuid) {
                subSubCostCode.material_amount = materialTotalAmount.value
                subSubCostCode.material_items = materialEstimateType.value === 'item-wise' ? normalizedItems.map((item) => ({ ...item })) : []
                if (isLocationWiseMaterial) {
                  subSubCostCode.location_wise_material = materialLocationWiseRows.value.map((r) => ({
                    breakdown_uuid: r.breakdown_uuid,
                    location_uuid: r.location_uuid,
                    amount: parseFloat(String(r.amount)) || 0
                  }))
                } else {
                  subSubCostCode.location_wise_material = []
                }
                
                if (!showOnlyTotal.value) {
                  const labor = parseFloat(subSubCostCode.labor_amount) || 0
                  subSubCostCode.total_amount = labor + materialTotalAmount.value
                }
                appliedCostCodes.value.add(subSubCostCode.uuid)
              }
            })
          }
        })
      }
    })
  })
  
  // Trigger reactivity update
  nextTick(() => {
    hierarchicalDataRef.value = [...hierarchicalDataRef.value]
  })
  
  // Emit the line items update to trigger recalculation in parent
  emitLineItemsUpdate()
}

// Apply contingency estimate to cost code
const applyTotalEstimate = () => {
  if (!selectedCostCode.value || totalAmount.value === 0) return

  // Find and update the cost code in hierarchical data
  hierarchicalDataRef.value.forEach((division: any) => {
    division.costCodes.forEach((costCode: any) => {
      if (costCode.uuid === selectedCostCode.value.uuid) {
        // Update the total amount
        costCode.total_amount = String(totalAmount.value)
        costCode.estimation_type = 'manual'
        appliedCostCodes.value.add(costCode.uuid)
      }

      // Also apply to sub-cost codes
      costCode.subCostCodes?.forEach((subCostCode: any) => {
        if (subCostCode.uuid === selectedCostCode.value.uuid) {
          subCostCode.total_amount = String(totalAmount.value)
          subCostCode.estimation_type = 'manual'
          appliedCostCodes.value.add(subCostCode.uuid)
        }

        // Also apply to sub-sub-cost codes
        subCostCode.subSubCostCodes?.forEach((subSubCostCode: any) => {
          if (subSubCostCode.uuid === selectedCostCode.value.uuid) {
            subSubCostCode.total_amount = String(totalAmount.value)
            subSubCostCode.estimation_type = 'manual'
            appliedCostCodes.value.add(subSubCostCode.uuid)
          }
        })
      })
    })
  })

  // Emit the updated line items
  emitLineItemsUpdate()
}

const applyContingencyEstimate = () => {
  if (!selectedCostCode.value) return
  
  // Find and update the cost code in hierarchical data
  hierarchicalDataRef.value.forEach((division: any) => {
    division.costCodes.forEach((costCode: any) => {
      // Check if this is the selected cost code
      if (costCode.uuid === selectedCostCode.value.uuid) {
        costCode.contingency_enabled = selectedCostCode.value.contingency_enabled === true
        costCode.contingency_percentage = normalizeContingencyValue(selectedCostCode.value.contingency_percentage)
      }
      
      // Also check sub-cost codes
      if (costCode.subCostCodes) {
        costCode.subCostCodes.forEach((subCostCode: any) => {
          if (subCostCode.uuid === selectedCostCode.value.uuid) {
            subCostCode.contingency_enabled = selectedCostCode.value.contingency_enabled === true
            subCostCode.contingency_percentage = normalizeContingencyValue(selectedCostCode.value.contingency_percentage)
          }
          
          // Check sub-sub-cost codes
          if (subCostCode.subSubCostCodes) {
            subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
              if (subSubCostCode.uuid === selectedCostCode.value.uuid) {
                subSubCostCode.contingency_enabled = selectedCostCode.value.contingency_enabled === true
                subSubCostCode.contingency_percentage = normalizeContingencyValue(selectedCostCode.value.contingency_percentage)
              }
            })
          }
        })
      }
    })
  })
  
  // Trigger reactivity update
  nextTick(() => {
    hierarchicalDataRef.value = [...hierarchicalDataRef.value]
  })
  
  // Emit the line items update to trigger recalculation in parent
  emitLineItemsUpdate()
}

// General apply function that routes to appropriate handler
const applyEstimate = async () => {
  if (isReadOnly.value) {
    return
  }

  let hasValidationErrors = false

  // Apply both, regardless of current tab, if they have values
  // For location-wise: apply when we have rows to save (even if total is 0)
  const shouldApplyLabor = laborTotalAmount.value > 0 || (laborEstimateType.value === 'location-wise' && laborLocationWiseRows.value.length > 0) || (isLocationWiseProject.value && laborLocationWiseRows.value.length > 0)
  if (shouldApplyLabor) {
    applyLaborEstimate()
  }
  const hasAnyLocationWiseMaterial = isLocationWiseProject.value && materialEstimateType.value === 'manual' && materialLocationWiseRows.value.some(r => parseFloat(String(r.amount)) > 0)
  const hasAnyItemWiseMaterial = materialEstimateType.value === 'item-wise' && materialItems.value.length > 0
  if (materialTotalAmount.value > 0 || hasAnyLocationWiseMaterial || hasAnyItemWiseMaterial) {
    const materialResult = await applyMaterialEstimate()
    if (materialResult === false) {
      hasValidationErrors = true
    }
  }
  if (currentProject.value?.only_total && totalAmount.value > 0) {
    applyTotalEstimate()
  }
  // Always apply contingency state if cost code is selected (even if no labor/material)
  if (selectedCostCode.value) {
    applyContingencyEstimate()
  }

  // Only close modal if there were no validation errors
  if (!hasValidationErrors) {
    setTimeout(() => {
      closeEstimateModal()
    }, 400)
  }
}

// Project settings for column visibility
const currentProject = computed(() => {
  if (!props.projectUuid) return null
  // Try to get from currentProject first (if it's the current project)
  if (projectsStore.currentProject?.uuid === props.projectUuid) {
    return projectsStore.currentProject
  }
  // Otherwise, search in appropriate store based on editingEstimate
  const projects = props.editingEstimate 
    ? projectsStore.projects 
    : estimateCreationStore.projects
  const project = projects.find(p => p.uuid === props.projectUuid)
  return project
})

const showOnlyTotal = computed(() => currentProject.value?.only_total === true)
const showLabor = computed(() => currentProject.value?.enable_labor === true)
const showMaterial = computed(() => currentProject.value?.enable_material === true)
const showTotal = computed(() => true) // Always show totals column

// Estimation type options
const estimationTypeOptions = [
  { label: 'Manual', value: 'manual' },
  { label: 'Formula', value: 'formula' },
  { label: 'Percentage', value: 'percentage' }
]

// Tabs for estimate modal - dynamically filtered based on project settings
const estimateTabs = computed(() => {
  const tabs = []

  // Add Total tab only if only_total is true
  if (currentProject.value?.only_total) {
    tabs.push({
      label: 'Total',
      value: 'total',
      icon: 'i-heroicons-calculator',
      slot: 'total' as const
    })
  }

  // Add Labor tab only if enable_labor is true
  if (currentProject.value?.enable_labor) {
    tabs.push({
      label: 'Labor',
      value: 'labor',
      icon: 'i-heroicons-wrench-screwdriver',
      slot: 'labor' as const
    })
  }

  // Add Material tab only if enable_material is true
  if (currentProject.value?.enable_material) {
    tabs.push({
      label: 'Material',
      value: 'material',
      icon: 'i-heroicons-cube',
      slot: 'material' as const
    })
  }

  // Always add Contingency tab
  tabs.push({
    label: 'Contingency',
    value: 'contingency',
    icon: 'i-heroicons-shield-check',
    slot: 'contingency' as const
  })

  return tabs
})

// Reset labor estimate type to manual when per-room/per-sqft is no longer available (e.g. enable_location_wise is true)
watch(laborEstimateTypeOptions, (opts) => {
  const values = opts.map((o) => o.value)
  if (!values.includes(laborEstimateType.value)) {
    laborEstimateType.value = 'manual'
  }
}, { immediate: true })

// Computed hierarchical data
const hierarchicalData = computed(() => {
  if (!divisions.value?.length || !configurations.value?.length) return []

  // Split divisions into main vs those excluded from estimates/reports
  const mainDivisions = divisions.value
    .filter(division => division?.is_active !== false && division?.exclude_in_estimates_and_reports !== true)
    .sort((a, b) => (a.division_order || 0) - (b.division_order || 0))

  const excludedDivisionUuids = new Set(
    divisions.value
      .filter(division => division?.is_active !== false && division?.exclude_in_estimates_and_reports === true)
      .map(division => division.uuid)
  )

  const divisionsData = mainDivisions
    .map(division => {
      const divisionConfigurations = configurations.value
        .filter(config => 
          config?.division_uuid === division?.uuid && 
          config?.is_active !== false && 
          !config?.parent_cost_code_uuid
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      const costCodes = divisionConfigurations.map(costCode => {
        const subCostCodes = configurations.value
          .filter(subConfig => 
            subConfig?.parent_cost_code_uuid === costCode?.uuid && 
            subConfig?.is_active !== false
          )
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(subConfig => {
            // Get sub-sub cost codes (third level)
            const subSubCostCodes = configurations.value
              .filter(subSubConfig => 
                subSubConfig?.parent_cost_code_uuid === subConfig?.uuid && 
                subSubConfig?.is_active !== false
              )
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(subSubConfig => ({
                ...subSubConfig,
                labor_amount: 0,
                material_amount: 0,
                total_amount: 0,
                estimation_type: 'manual',
                labor_amount_per_room: 0,
                labor_rooms_count: 0,
                labor_amount_per_sqft: 0,
                labor_sq_ft_count: 0,
                labor_number_of_hours: 0,
                labor_hourly_wage: 0,
                contingency_enabled: false,
                contingency_percentage: null
              }))

            return {
              ...subConfig,
              labor_amount: 0,
              material_amount: 0,
              total_amount: 0,
              estimation_type: 'manual',
              labor_amount_per_room: 0,
              labor_rooms_count: 0,
              labor_amount_per_sqft: 0,
              labor_sq_ft_count: 0,
              labor_number_of_hours: 0,
              labor_hourly_wage: 0,
              contingency_enabled: false,
              contingency_percentage: null,
              subSubCostCodes
            }
          })

        return {
          ...costCode,
          labor_amount: 0,
          material_amount: 0,
          total_amount: 0,
          estimation_type: 'manual',
          labor_amount_per_room: 0,
          labor_rooms_count: 0,
          labor_amount_per_sqft: 0,
          labor_sq_ft_count: 0,
          labor_number_of_hours: 0,
          labor_hourly_wage: 0,
          contingency_enabled: false,
          contingency_percentage: null,
          subCostCodes
        }
      })

      return {
        ...division,
        costCodes
      }
    })

  // Add "Other Costs" section for:
  // - cost codes without any division
  // - AND cost codes whose division has exclude_in_estimates_and_reports = true
  const otherCostCodes = configurations.value
    .filter(config => 
      (
        !config?.division_uuid || 
        (config?.division_uuid && excludedDivisionUuids.has(config.division_uuid))
      ) &&
      config?.is_active !== false && 
      !config?.parent_cost_code_uuid
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(costCode => {
      const subCostCodes = configurations.value
        .filter(subConfig => 
          subConfig?.parent_cost_code_uuid === costCode?.uuid && 
          subConfig?.is_active !== false
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(subConfig => {
          // Get sub-sub cost codes (third level)
          const subSubCostCodes = configurations.value
            .filter(subSubConfig => 
              subSubConfig?.parent_cost_code_uuid === subConfig?.uuid && 
              subSubConfig?.is_active !== false
            )
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(subSubConfig => ({
              ...subSubConfig,
              labor_amount: 0,
              material_amount: 0,
              total_amount: 0,
              estimation_type: 'manual',
              labor_amount_per_room: 0,
              labor_rooms_count: 0,
              labor_amount_per_sqft: 0,
              labor_sq_ft_count: 0,
              labor_number_of_hours: 0,
              labor_hourly_wage: 0,
              contingency_enabled: false,
              contingency_percentage: null
            }))

          return {
            ...subConfig,
            labor_amount: 0,
            material_amount: 0,
            total_amount: 0,
            estimation_type: 'manual',
            labor_amount_per_room: 0,
            labor_rooms_count: 0,
            labor_amount_per_sqft: 0,
            labor_sq_ft_count: 0,
            labor_number_of_hours: 0,
            labor_hourly_wage: 0,
            contingency_enabled: false,
            contingency_percentage: null,
            subSubCostCodes
          }
        })

      return {
        ...costCode,
        labor_amount: 0,
        material_amount: 0,
        total_amount: 0,
        estimation_type: 'manual',
        labor_amount_per_room: 0,
        labor_rooms_count: 0,
        labor_amount_per_sqft: 0,
        labor_sq_ft_count: 0,
        labor_number_of_hours: 0,
        labor_hourly_wage: 0,
        contingency_enabled: false,
        contingency_percentage: null,
        subCostCodes
      }
    })

  // Add "Other Costs" section if there are cost codes without divisions
  if (otherCostCodes.length > 0) {
    divisionsData.push({
      uuid: 'other-costs',
      division_number: '', // Empty string to avoid "OTHER OTHER COSTS" duplication
      division_name: 'OTHER COSTS',
      division_order: 999, // Place at the end
      description: 'Cost codes not assigned to any division',
      is_active: true,
      // Mark this synthetic division as excluded from main totals
      exclude_in_estimates_and_reports: true,
      costCodes: otherCostCodes
    })
  }

  return divisionsData
})

// Methods
const getDivisionTotal = (division: any) => {
  return division.costCodes.reduce((total: number, costCode: any) => {
    // Only use getCostCodeTotal which already includes all sub-level calculations
    return total + getCostCodeTotal(costCode)
  }, 0)
}

const getDivisionLaborTotal = (division: any) => {
  return division.costCodes.reduce((total: number, costCode: any) => {
    return total + getCostCodeLaborTotal(costCode)
  }, 0)
}

const getDivisionMaterialTotal = (division: any) => {
  return division.costCodes.reduce((total: number, costCode: any) => {
    return total + getCostCodeMaterialTotal(costCode)
  }, 0)
}

const getCostCodeTotal = (costCode: any) => {
  // If cost code has sub-accounts, calculate from sub-accounts
  if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
    // Sum base totals from sub-cost codes (without contingency)
    return costCode.subCostCodes.reduce((total: number, subCostCode: any) => {
      return total + getSubCostCodeTotal(subCostCode)
    }, 0)
  }
  
  // If only_total is enabled, use the total_amount field directly (without contingency)
  if (showOnlyTotal.value) {
    return parseFloat(costCode.total_amount) || 0
  }
  
  // Otherwise, always calculate from labor + material (without contingency)
  const labor = parseFloat(costCode.labor_amount) || 0
  const material = parseFloat(costCode.material_amount) || 0
  return labor + material
}

const getCostCodeLaborTotal = (costCode: any) => {
  // If cost code has sub-accounts, calculate from sub-accounts
  if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
    return costCode.subCostCodes.reduce((total: number, subCostCode: any) => {
      return total + getSubCostCodeLaborTotal(subCostCode)
    }, 0)
  }
  // Otherwise return direct labor amount
  return parseFloat(costCode.labor_amount) || 0
}

const getCostCodeMaterialTotal = (costCode: any) => {
  // If cost code has sub-accounts, calculate from sub-accounts
  if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
    return costCode.subCostCodes.reduce((total: number, subCostCode: any) => {
      return total + getSubCostCodeMaterialTotal(subCostCode)
    }, 0)
  }
  // Otherwise return direct material amount
  return parseFloat(costCode.material_amount) || 0
}

const getSubCostCodeTotal = (subCostCode: any) => {
  // If sub-cost code has sub-sub-cost codes, only calculate from them
  if (subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0) {
    // Sum base totals from sub-sub-cost codes (without contingency)
    return subCostCode.subSubCostCodes.reduce((total: number, subSubCostCode: any) => {
      return total + getSubSubCostCodeTotal(subSubCostCode)
    }, 0)
  }
  
  // If only_total is enabled, use the total_amount field directly (without contingency)
  if (showOnlyTotal.value) {
    return parseFloat(subCostCode.total_amount) || 0
  }
  
  // Otherwise, always calculate from labor + material (without contingency)
  const labor = parseFloat(subCostCode.labor_amount) || 0
  const material = parseFloat(subCostCode.material_amount) || 0
  return labor + material
}

const getSubCostCodeLaborTotal = (subCostCode: any) => {
  // If sub-cost code has sub-sub-cost codes, calculate from them
  if (subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0) {
    return subCostCode.subSubCostCodes.reduce((total: number, subSubCostCode: any) => {
      return total + (parseFloat(subSubCostCode.labor_amount) || 0)
    }, 0)
  }
  // Otherwise return direct labor amount
  return parseFloat(subCostCode.labor_amount) || 0
}

const getSubCostCodeMaterialTotal = (subCostCode: any) => {
  // If sub-cost code has sub-sub-cost codes, calculate from them
  if (subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0) {
    return subCostCode.subSubCostCodes.reduce((total: number, subSubCostCode: any) => {
      return total + (parseFloat(subSubCostCode.material_amount) || 0)
    }, 0)
  }
  // Otherwise return direct material amount
  return parseFloat(subCostCode.material_amount) || 0
}

const getSubSubCostCodeTotal = (subSubCostCode: any) => {
  // If only_total is enabled, use the total_amount field directly (without contingency)
  if (showOnlyTotal.value) {
    return parseFloat(subSubCostCode.total_amount) || 0
  }
  
  // Otherwise, always calculate from labor + material (without contingency)
  const labor = parseFloat(subSubCostCode.labor_amount) || 0
  const material = parseFloat(subSubCostCode.material_amount) || 0
  return labor + material
}

// Helpers for contingency calculations
const getProjectContingencyPercent = (): number => {
  const raw = currentProject.value?.contingency_percentage
  if (raw === null || raw === undefined || raw === '') {
    return 0
  }
  const parsed = parseFloat(String(raw))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

const normalizeContingencyValue = (value: any): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}

const getContingencyPercent = (node: any): number => {
  // IMPORTANT: If node has sub-cost codes or sub-sub-cost codes, do NOT apply contingency
  // Contingency should only be applied at leaf nodes (where estimates are entered)
  // This prevents double application when both parent and child have contingency_enabled = true
  if (node?.subCostCodes && node.subCostCodes.length > 0) {
    return 0
  }
  if (node?.subSubCostCodes && node.subSubCostCodes.length > 0) {
    return 0
  }

  if (!node?.contingency_enabled) {
    return 0
  }

  const normalized = normalizeContingencyValue(node.contingency_percentage)
  if (normalized === null) {
    return getProjectContingencyPercent()
  }

  return normalized
}

// Display totals for Contingency tab when modal is open: use form values, fall back to saved cost code values
// so the Contingency tab always shows correct numbers even if form refs aren't updated (e.g. tab not mounted).
const contingencyLaborTotal = computed((): number => {
  if (!isEstimateModalOpen.value || !selectedCostCode.value) return 0
  const formVal = laborTotalAmount.value
  if (formVal > 0) return formVal
  const code: any = selectedCostCode.value
  return parseFloat(code.labor_amount) || 0
})

const contingencyMaterialTotal = computed((): number => {
  if (!isEstimateModalOpen.value || !selectedCostCode.value) return 0
  const formVal = materialTotalAmount.value
  if (formVal > 0) return formVal
  const code: any = selectedCostCode.value
  return parseFloat(code.material_amount) || 0
})

// Base total for the currently selected cost code (used in Contingency tab).
// When modal is open uses contingency display totals (form + fallback to saved) so Contingency tab is never 0.
const selectedCostCodeBaseTotal = computed((): number => {
  if (!selectedCostCode.value) return 0
  const code: any = selectedCostCode.value

  // When modal is open: use display totals (form or saved) so Contingency tab always shows correct sum
  if (isEstimateModalOpen.value) {
    if (showOnlyTotal.value) return totalAmount.value
    return contingencyLaborTotal.value + contingencyMaterialTotal.value
  }

  // Modal closed: use saved values (sum children if parent, else own values)
  if (code.subCostCodes && code.subCostCodes.length > 0) {
    return code.subCostCodes.reduce((t: number, s: any) => t + getBaseSubCostCodeTotal(s), 0)
  }
  if (showOnlyTotal.value) {
    return parseFloat(code.total_amount) || 0
  }
  return (parseFloat(code.labor_amount) || 0) + (parseFloat(code.material_amount) || 0)
})

// Function form for tests and other callers
const getSelectedCostCodeBaseTotal = (): number => selectedCostCodeBaseTotal.value

const getBaseSubCostCodeTotal = (sub: any): number => {
  if (sub.subSubCostCodes && sub.subSubCostCodes.length > 0) {
    return sub.subSubCostCodes.reduce((t: number, s: any) => getBaseSubSubCostCodeTotal(s) + t, 0)
  }
  if (showOnlyTotal.value) {
    return parseFloat(sub.total_amount) || 0
  }
  return (parseFloat(sub.labor_amount) || 0) + (parseFloat(sub.material_amount) || 0)
}

const getBaseSubSubCostCodeTotal = (s: any): number => {
  if (showOnlyTotal.value) {
    return parseFloat(s.total_amount) || 0
  }
  return (parseFloat(s.labor_amount) || 0) + (parseFloat(s.material_amount) || 0)
}

const getSelectedCostCodeContingencyPercent = (): number => {
  if (!selectedCostCode.value) return 0

  // When modal is open and contingency is enabled, use the current value reactively
  if (isEstimateModalOpen.value && selectedCostCode.value.contingency_enabled) {
    const normalized = normalizeContingencyValue(selectedCostCode.value.contingency_percentage)
    return normalized === null ? getProjectContingencyPercent() : normalized
  }
  return getContingencyPercent(selectedCostCode.value)
}

// Computed so Contingency tab updates reactively when base total or contingency % changes
const selectedCostCodeContingencyPercent = computed(() => getSelectedCostCodeContingencyPercent())
const getSelectedCostCodeTotalWithContingency = (): number => {
  const base = getSelectedCostCodeBaseTotal()
  const pct = getSelectedCostCodeContingencyPercent()
  return base * (1 + pct / 100)
}
const selectedCostCodeTotalWithContingency = computed(() => getSelectedCostCodeTotalWithContingency())

const getGrandTotal = () => {
  // Use visibleDivisions to exclude empty divisions
  // If only_total is enabled, sum all total columns
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )

  if (showOnlyTotal.value) {
    return mainDivisionsForTotals.reduce((total, division) => {
      return total + getDivisionTotal(division)
    }, 0)
  }
  
  // If only labor is enabled, sum all labor columns
  if (showLabor.value && !showMaterial.value) {
    return mainDivisionsForTotals.reduce((total, division) => {
      return total + getDivisionLaborTotal(division)
    }, 0)
  }
  
  // If only material is enabled, sum all material columns
  if (showMaterial.value && !showLabor.value) {
    return mainDivisionsForTotals.reduce((total, division) => {
      return total + getDivisionMaterialTotal(division)
    }, 0)
  }
  
  // If both labor and material are enabled, sum the total_amount of each cost code
  if (showLabor.value && showMaterial.value) {
    return mainDivisionsForTotals.reduce((total, division) => {
      return total + getDivisionTotal(division)
    }, 0)
  }
  
  // Fallback to total column calculation
  return mainDivisionsForTotals.reduce((total, division) => {
    return total + getDivisionTotal(division)
  }, 0)
}

const getGrandLaborTotal = () => {
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )
  return mainDivisionsForTotals.reduce((total, division) => {
    return total + getDivisionLaborTotal(division)
  }, 0)
}

const getGrandMaterialTotal = () => {
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )
  return mainDivisionsForTotals.reduce((total, division) => {
    return total + getDivisionMaterialTotal(division)
  }, 0)
}

// Base amounts (without contingency) for any node
const getBaseLabor = (node: any): number => {
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    return node.subCostCodes.reduce((t: number, sub: any) => t + getBaseLabor(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    return node.subSubCostCodes.reduce((t: number, s: any) => t + getBaseLabor(s), 0)
  }
  if (showOnlyTotal.value) return 0
  return parseFloat(node.labor_amount) || 0
}

const getBaseMaterial = (node: any): number => {
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    return node.subCostCodes.reduce((t: number, sub: any) => t + getBaseMaterial(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    return node.subSubCostCodes.reduce((t: number, s: any) => t + getBaseMaterial(s), 0)
  }
  if (showOnlyTotal.value) return 0
  return parseFloat(node.material_amount) || 0
}

const getBaseTotal = (node: any): number => {
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    return node.subCostCodes.reduce((t: number, sub: any) => t + getBaseTotal(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    return node.subSubCostCodes.reduce((t: number, s: any) => t + getBaseTotal(s), 0)
  }
  if (showOnlyTotal.value) {
    return parseFloat(node.total_amount) || 0
  }
  return (parseFloat(node.labor_amount) || 0) + (parseFloat(node.material_amount) || 0)
}

// Contingency split at a node: allocate by base amounts proportion
const getNodeContingencySplit = (node: any): { labor: number, material: number, total: number } => {
  const pct = getContingencyPercent(node)

  if (showOnlyTotal.value) {
    // For total-only projects, apply contingency to total amount
    const baseTotal = getBaseTotal(node)
    const totalCont = baseTotal * (pct / 100)
    return { labor: 0, material: 0, total: totalCont }
  } else {
    // For labor/material projects, split contingency between labor and material
    const baseLabor = getBaseLabor(node)
    const baseMaterial = getBaseMaterial(node)
    const laborCont = baseLabor * (pct / 100)
    const materialCont = baseMaterial * (pct / 100)
    return { labor: laborCont, material: materialCont, total: 0 }
  }
}

// Aggregate contingency across hierarchy
const getCostCodeLaborContingency = (node: any): number => {
  let total = 0
  // children first
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    total += node.subCostCodes.reduce((t: number, sub: any) => t + getCostCodeLaborContingency(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    total += node.subSubCostCodes.reduce((t: number, s: any) => t + getCostCodeLaborContingency(s), 0)
  }
  // own level
  total += getNodeContingencySplit(node).labor
  return total
}

const getCostCodeMaterialContingency = (node: any): number => {
  let total = 0
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    total += node.subCostCodes.reduce((t: number, sub: any) => t + getCostCodeMaterialContingency(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    total += node.subSubCostCodes.reduce((t: number, s: any) => t + getCostCodeMaterialContingency(s), 0)
  }
  total += getNodeContingencySplit(node).material
  return total
}

const getCostCodeTotalContingency = (node: any): number => {
  let total = 0
  // children first
  if (node.subCostCodes && node.subCostCodes.length > 0) {
    total += node.subCostCodes.reduce((t: number, sub: any) => t + getCostCodeTotalContingency(sub), 0)
  }
  if (node.subSubCostCodes && node.subSubCostCodes.length > 0) {
    total += node.subSubCostCodes.reduce((t: number, s: any) => t + getCostCodeTotalContingency(s), 0)
  }
  // own level
  total += getNodeContingencySplit(node).total
  return total
}

const getDivisionLaborContingencyTotal = (division: any): number => {
  return division.costCodes.reduce((t: number, costCode: any) => t + getCostCodeLaborContingency(costCode), 0)
}

const getDivisionMaterialContingencyTotal = (division: any): number => {
  return division.costCodes.reduce((t: number, costCode: any) => t + getCostCodeMaterialContingency(costCode), 0)
}

const getDivisionTotalContingencyTotal = (division: any): number => {
  return division.costCodes.reduce((t: number, costCode: any) => t + getCostCodeTotalContingency(costCode), 0)
}

const getGrandLaborContingencyTotal = () => {
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )
  return mainDivisionsForTotals.reduce(
    (t, division) => t + getDivisionLaborContingencyTotal(division),
    0
  )
}

const getGrandMaterialContingencyTotal = () => {
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )
  return mainDivisionsForTotals.reduce(
    (t, division) => t + getDivisionMaterialContingencyTotal(division),
    0
  )
}

const getGrandTotalContingencyTotal = () => {
  const mainDivisionsForTotals = visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports !== true
  )
  return mainDivisionsForTotals.reduce(
    (t, division) => t + getDivisionTotalContingencyTotal(division),
    0
  )
}

const getCostCodeBaseTotal = (costCode: any) => {
  if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
    return costCode.subCostCodes.reduce((total: number, subCostCode: any) => {
      return total + getBaseSubCostCodeTotal(subCostCode)
    }, 0)
  }
  if (showOnlyTotal.value) {
    return parseFloat(costCode.total_amount) || 0
  }
  const labor = parseFloat(costCode.labor_amount) || 0
  const material = parseFloat(costCode.material_amount) || 0
  return labor + material
}

const getGrandContingencyTotal = () => {
  if (showOnlyTotal.value) {
    // For total-only projects, use total contingency
    return getGrandTotalContingencyTotal()
  } else {
    // For labor/material projects, sum labor and material contingencies
    return getGrandLaborContingencyTotal() + getGrandMaterialContingencyTotal()
  }
}

// "Other Costs" totals (for divisions marked exclude_in_estimates_and_reports)
const otherDivisionsForTotals = computed(() =>
  visibleDivisions.value.filter(
    (division: any) => division?.exclude_in_estimates_and_reports === true
  )
)

const getOtherGrandTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce((total, division) => total + getDivisionTotal(division), 0)
}

const getOtherGrandLaborTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce(
    (total, division) => total + getDivisionLaborTotal(division),
    0
  )
}

const getOtherGrandMaterialTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce(
    (total, division) => total + getDivisionMaterialTotal(division),
    0
  )
}

const getOtherGrandLaborContingencyTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce(
    (t, division) => t + getDivisionLaborContingencyTotal(division),
    0
  )
}

const getOtherGrandMaterialContingencyTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce(
    (t, division) => t + getDivisionMaterialContingencyTotal(division),
    0
  )
}

const getOtherGrandTotalContingencyTotal = () => {
  const divisions = otherDivisionsForTotals.value
  if (!divisions.length) return 0
  return divisions.reduce(
    (t, division) => t + getDivisionTotalContingencyTotal(division),
    0
  )
}

const getOtherGrandContingencyTotal = () => {
  if (showOnlyTotal.value) {
    return getOtherGrandTotalContingencyTotal()
  } else {
    return (
      getOtherGrandLaborContingencyTotal() +
      getOtherGrandMaterialContingencyTotal()
    )
  }
}

// Final Grand Total function (combines main divisions + other costs with contingency)
const getFinalGrandTotalWithContingency = () => {
  return getGrandTotal() + getGrandContingencyTotal() + getOtherGrandTotal() + getOtherGrandContingencyTotal()
}

const getAccordionItems = (costCode: any) => {
  return [{
    label: `Sub Cost Codes (${costCode.subCostCodes.length})`,
    content: '', // This will be replaced by the #body slot
    subCostCodes: costCode.subCostCodes
  }]
}

const getCostCodeAccordionItems = (costCode: any) => {
  return [{
    key: costCode.uuid,
    label: `${costCode.cost_code_number} ${costCode.cost_code_name}`,
    content: '', // This will be replaced by the #body slot
    subCostCodes: costCode.subCostCodes
  }]
}

// Note: Direct input updates are disabled - all changes must go through the estimate modal

// Edit and Delete methods
const editCostCode = (costCode: any): void => {
  // TODO: Implement edit functionality
}

const deleteCostCode = (costCode: any): void => {
  if (isReadOnly.value) return
  if (!costCode) return
  if (costCode?.uuid) {
    deletedUuidsLocal.value.add(costCode.uuid)
    appliedCostCodes.value.delete(costCode.uuid)
    emitDeletedUuids()
    removeCostCodeByUuid(costCode.uuid)
  }
}

const editSubCostCode = (subCostCode: any): void => {
  // TODO: Implement edit functionality
}

const deleteSubCostCode = (subCostCode: any): void => {
  if (isReadOnly.value) return
  if (!subCostCode) return
  if (subCostCode?.uuid) {
    deletedUuidsLocal.value.add(subCostCode.uuid)
    appliedCostCodes.value.delete(subCostCode.uuid)
    emitDeletedUuids()
    removeCostCodeByUuid(subCostCode.uuid)
  }
}

const editSubSubCostCode = (subSubCostCode: any): void => {
  // TODO: Implement edit functionality
}

const deleteSubSubCostCode = (subSubCostCode: any): void => {
  if (isReadOnly.value) return
  if (!subSubCostCode) return
  if (subSubCostCode?.uuid) {
    deletedUuidsLocal.value.add(subSubCostCode.uuid)
    appliedCostCodes.value.delete(subSubCostCode.uuid)
    emitDeletedUuids()
    removeCostCodeByUuid(subSubCostCode.uuid)
  }
}

// Find cost code in hierarchy by uuid (source of truth for populated location_wise data)
const findCostCodeInHierarchy = (uuid: string): any => {
  for (const div of hierarchicalDataRef.value || []) {
    for (const cc of div.costCodes || []) {
      if (cc.uuid === uuid) return cc
      for (const sub of cc.subCostCodes || []) {
        if (sub.uuid === uuid) return sub
        for (const subsub of sub.subSubCostCodes || []) {
          if (subsub.uuid === uuid) return subsub
        }
      }
    }
  }
  return null
}

// Estimate modal function
const openEstimateModal = async (costCode: any): Promise<void> => {
  // Resolve from hierarchy to get latest populated location_wise_labor/location_wise_material
  const resolved = costCode?.uuid ? findCostCodeInHierarchy(costCode.uuid) : null
  const cc = resolved || costCode
  selectedCostCode.value = cc
  
  // When editing, ensure we have the configuration with preferred items loaded
  if (props.editingEstimate && cc.uuid && corpStore.selectedCorporation?.id) {
    // Check if we have the config in store with preferred_items
    const getById = configurationsStore.getConfigurationById
    const existingConfig = typeof getById === 'function'
      ? (getById(cc.uuid) as any)
      : undefined
    
    // If config not in store or doesn't have preferred_items, fetch from API
    if (!existingConfig || !Array.isArray(existingConfig.preferred_items) || existingConfig.preferred_items.length === 0) {
      try {
        const response: any = await $fetch('/api/cost-code-configurations', {
          query: { corporation_uuid: corpStore.selectedCorporation.id },
        })
        
        const data = response?.data || response || []
        const config = Array.isArray(data) 
          ? data.find((c: any) => c.uuid === cc.uuid)
          : null
        
        if (config && config.preferred_items) {
          // Update the store with the fetched configuration
          // This ensures ItemSelect and SequenceSelect can find the preferred items
          await configurationsStore.fetchConfigurations(corpStore.selectedCorporation.id, false) // Force API fetch
        }
      } catch (err: any) {
        console.error('[EstimateLineItemsTable] Error fetching configuration when opening modal:', err)
      }
    }
  }

  // When enable_location_wise, fetch location breakdown and init laborLocationWiseRows and materialLocationWiseRows
  if (currentProject.value?.enable_location_wise && props.projectUuid) {
    try {
      await locationsStore.fetchLocations(true)
      const breakdownRes = await $fetch<{ data: any[] }>('/api/projects/location-breakdowns', {
        query: { project_uuid: props.projectUuid }
      })
      const breakdown = breakdownRes?.data || []
      const allowedLocationUuids = new Set(
        breakdown
          .map((r: any) => String(r?.location_uuid || '').trim())
          .filter(Boolean)
      )
      const activeLocations = (locationsStore.getActive || []).filter((loc: any) =>
        allowedLocationUuids.has(String(loc?.uuid || '').trim())
      )
      materialItemWiseLocations.value = activeLocations.length > 0
        ? activeLocations
        : breakdown
            .filter((r: any) => r?.location_uuid)
            .map((r: any) => ({
              uuid: r.location_uuid,
              location_name: r.location_name || r.location_label || r.location_uuid,
            }))
      const saved = Array.isArray(cc.location_wise_labor) ? cc.location_wise_labor : []
      const savedMap = new Map(saved.map((r: any) => [r.location_uuid, r]))
      laborLocationWiseRows.value = breakdown.map((r: any) => {
        const s: any = savedMap.get(r.location_uuid) || {}
        // Backward compat: old format had hourly_wage + amount, derive num_hours
        const oldAmt = s.amount != null ? parseFloat(s.amount) : 0
        const oldWage = s.hourly_wage != null ? parseFloat(s.hourly_wage) : 0
        const derivedHours = (s.num_hours == null && oldWage > 0 && oldAmt > 0) ? String(oldAmt / oldWage) : ''
        return {
          breakdown_uuid: r.uuid,
          location_uuid: r.location_uuid,
          area_sq_ft: s.area_sq_ft ?? r.area_sq_ft ?? '',
          no_of_rooms: s.no_of_rooms ?? r.no_of_rooms ?? '',
          num_hours: s.num_hours ?? derivedHours ?? '',
          amount_per_sqft: s.amount_per_sqft ?? '',
          amount_per_room: s.amount_per_room ?? '',
          hourly_wage: s.hourly_wage ?? '',
          manual_amount: s.manual_amount ?? s.amount ?? ''
        }
      })
      // Material location-wise: one amount per location (manual only)
      const savedMaterial = Array.isArray(cc.location_wise_material) ? cc.location_wise_material : []
      const savedMaterialMap = new Map(savedMaterial.map((r: any) => [r.location_uuid, r]))
      materialLocationWiseRows.value = breakdown.map((r: any) => {
        const s: any = savedMaterialMap.get(r.location_uuid) || {}
        return {
          breakdown_uuid: s.breakdown_uuid ?? r.uuid,
          location_uuid: r.location_uuid,
          amount: s.amount ?? ''
        }
      })
    } catch (err: any) {
      console.error('[EstimateLineItemsTable] Error fetching location breakdown:', err)
      laborLocationWiseRows.value = []
      materialLocationWiseRows.value = []
      materialItemWiseLocations.value = []
    }
  } else {
    laborLocationWiseRows.value = []
    materialLocationWiseRows.value = []
    materialItemWiseLocations.value = []
  }
  
  // Load existing estimates if they exist
  const hasLocationWiseLabor = Array.isArray(cc.location_wise_labor) && cc.location_wise_labor.length > 0
  if (cc.estimation_type === 'location-wise' && hasLocationWiseLabor) {
    // Legacy: infer type from project basis
    laborEstimateType.value = currentProject.value?.location_basis_area ? 'per-sqft' : (currentProject.value?.location_basis_no_of_rooms ? 'per-room' : 'per-sqft')
    laborManualAmount.value = ''
  } else if (currentProject.value?.enable_location_wise && hasLocationWiseLabor && ['manual', 'per-sqft', 'per-room', 'hourly-wage'].includes(cc.estimation_type || '')) {
    laborEstimateType.value = cc.estimation_type
    laborManualAmount.value = ''
  } else if (currentProject.value?.enable_location_wise) {
    laborEstimateType.value = 'manual'
    laborManualAmount.value = cc.labor_amount ? String(cc.labor_amount) : ''
  } else if (cc.estimation_type === 'per-room' && (cc.labor_amount_per_room || cc.labor_amount_per_room === 0)) {
    laborEstimateType.value = 'per-room'
    laborAmountPerRoom.value = String(cc.labor_amount_per_room || '')
    laborManualAmount.value = ''
    laborNumberOfHours.value = ''
    laborHourlyWage.value = ''
  } else if (cc.estimation_type === 'per-sqft' && (cc.labor_amount_per_sqft || cc.labor_amount_per_sqft === 0)) {
    laborEstimateType.value = 'per-sqft'
    laborAmountPerSqft.value = String(cc.labor_amount_per_sqft || '')
    laborManualAmount.value = ''
    laborNumberOfHours.value = ''
    laborHourlyWage.value = ''
  } else if (cc.estimation_type === 'hourly-wage' && ((cc.labor_number_of_hours ?? 0) > 0 || (cc.labor_hourly_wage ?? 0) > 0)) {
    laborEstimateType.value = 'hourly-wage'
    laborNumberOfHours.value = String(cc.labor_number_of_hours ?? '')
    laborHourlyWage.value = String(cc.labor_hourly_wage ?? '')
    laborManualAmount.value = ''
    laborAmountPerRoom.value = ''
    laborAmountPerSqft.value = ''
  } else if (cc.labor_amount && cc.labor_amount > 0) {
    // Default to manual if not explicitly per-room
    laborManualAmount.value = String(cc.labor_amount)
    laborEstimateType.value = 'manual'
    laborNumberOfHours.value = ''
    laborHourlyWage.value = ''
  } else {
    // Reset to default if no existing values
    laborManualAmount.value = ''
    laborAmountPerRoom.value = ''
    laborAmountPerSqft.value = ''
    laborNumberOfHours.value = ''
    laborHourlyWage.value = ''
    laborEstimateType.value = 'manual'
  }

  // Fallback inference if estimation_type is missing but metadata exists
  if (!cc.estimation_type) {
    const perRoomAmt = parseFloat(cc.labor_amount_per_room)
    const perSqftAmt = parseFloat(cc.labor_amount_per_sqft)
    const hoursAmt = parseFloat(cc.labor_number_of_hours)
    const wageAmt = parseFloat(cc.labor_hourly_wage)
    if (!Number.isNaN(perRoomAmt) && perRoomAmt > 0) {
      laborEstimateType.value = 'per-room'
      laborAmountPerRoom.value = String(cc.labor_amount_per_room || '')
      laborManualAmount.value = ''
    } else if (!Number.isNaN(perSqftAmt) && perSqftAmt > 0) {
      laborEstimateType.value = 'per-sqft'
      laborAmountPerSqft.value = String(cc.labor_amount_per_sqft || '')
      laborManualAmount.value = ''
    } else if ((!Number.isNaN(hoursAmt) && hoursAmt > 0) || (!Number.isNaN(wageAmt) && wageAmt > 0)) {
      laborEstimateType.value = 'hourly-wage'
      laborNumberOfHours.value = String(cc.labor_number_of_hours ?? '')
      laborHourlyWage.value = String(cc.labor_hourly_wage ?? '')
      laborManualAmount.value = ''
    }
  }

  // Ensure item types and vendors are loaded for category / preferred vendor columns
  const corpUuid = props.editingEstimate ? corpStore.selectedCorporation?.id : estimateCreationStore.selectedCorporationUuid
  if (corpUuid) {
    itemTypesStore.fetchItemTypes(corpUuid).catch(() => {})
    vendorStore.fetchVendors(corpUuid).catch(() => {})
  }

  // Load material estimates
  // First, check if we have existing line items in the modelValue for this cost code
  const existingLineItem = props.modelValue?.find((item: any) => item.cost_code_uuid === cc.uuid)
  const hasExistingMaterialItems = existingLineItem?.material_items && existingLineItem.material_items.length > 0
  const hasLocationWiseMaterial = Array.isArray(cc.location_wise_material) && cc.location_wise_material.length > 0

  // Material tab is item-wise only; default to item-wise (match other cost codes when applicable).
  if (!hasExistingMaterialItems && !hasLocationWiseMaterial) {
    const appliedType = appliedMaterialEstimateType.value
    materialEstimateType.value = appliedType ?? 'item-wise'
  } else if (!hasExistingMaterialItems && hasLocationWiseMaterial && currentProject.value?.enable_location_wise) {
    materialEstimateType.value = 'item-wise'
  }

  if (hasExistingMaterialItems) {
    materialEstimateType.value = 'item-wise'
    const normalizedItems = existingLineItem.material_items.map((item: any) => normalizeMaterialItem(item))
    materialItems.value = enrichMaterialItemsWithSequence(normalizedItems, cc.uuid)

    // Enrich preferred_vendor_uuid from config when loading from modelValue
    const configForExisting = configurations.value.find((c: any) => c.uuid === cc.uuid)
    materialItems.value.forEach((item: any) => {
      const pref = configForExisting?.preferred_items?.find((p: any) => getPreferredItemIdentifier(p) === item.item_uuid)
      if (pref?.preferred_vendor_uuid && !item.preferred_vendor_uuid) {
        item.preferred_vendor_uuid = pref.preferred_vendor_uuid
      }
      if (pref?.location_uuid && !item.location_uuid) {
        item.location_uuid = pref.location_uuid
      }
    })

    // Update cc.material_items for consistency
    cc.material_items = normalizedItems.map((item: any) => ({ ...item }))

    // Set manual amount to empty since we're using item-wise
    materialManualAmount.value = ''
  } else if (props.editingEstimate) {
    // Only fetch from API when editing existing estimates and no existing items in modelValue
    // This ensures we get the latest saved data from estimate_material_items table
    try {
      const response = await $fetch('/api/estimate-material-items', {
        query: {
          estimate_line_item_uuid: cc.uuid,
          corporation_uuid: corpStore.selectedCorporation?.id,
          estimate_uuid: props.estimateUuid
        }
      }) as any

      const loadedItems = response?.data || []

      if (loadedItems.length > 0) {
        materialEstimateType.value = 'item-wise'
        // Normalize and enrich the loaded items
        const normalizedItems = loadedItems.map((item: any) => normalizeMaterialItem(item))

        materialItems.value = enrichMaterialItemsWithSequence(normalizedItems, cc.uuid)

        // Enrich preferred_vendor_uuid and category (and legacy division) from config and item types
        const config = configurations.value.find((c: any) => c.uuid === cc.uuid)
        materialItems.value.forEach((item: any) => {
          const pref = config?.preferred_items?.find((p: any) => getPreferredItemIdentifier(p) === item.item_uuid)
          if (pref?.preferred_vendor_uuid && !item.preferred_vendor_uuid) {
            item.preferred_vendor_uuid = pref.preferred_vendor_uuid
          }
          if (pref?.location_uuid && !item.location_uuid) {
            item.location_uuid = pref.location_uuid
          }
          const typeUuid = item.item_type_uuid || item.item_type
          if (typeUuid && !item.category) {
            const it = itemTypesStore.getItemTypeById(typeUuid)
            if (it) {
              item.category = item.category ?? it.category ?? ''
              item.item_division_uuid = item.item_division_uuid ?? it.item_division_uuid ?? ''
            }
          }
        })

        if (materialItems.value.length === 0) {
          loadPreferredItems()
        }

        materialManualAmount.value = ''

        // Also update cc.material_items in hierarchical data for consistency
        cc.material_items = normalizedItems.map((item: any) => ({ ...item }))
      } else {
        // No saved items found, fall back to preferred items
        loadPreferredItems()
      }
    } catch (error) {
      console.error('Error loading material items:', error)
      // Fall back to preferred items on error
      loadPreferredItems()
    }
  } else {
    // For new estimates with no existing items, directly load preferred items
    loadPreferredItems()
  }

  // When in manual (non–location-wise) and cost code has saved material_amount, restore it
  if (materialEstimateType.value === 'manual' && !showLocationWiseMaterialTable.value && (cc.material_amount != null && cc.material_amount !== '')) {
    materialManualAmount.value = String(cc.material_amount)
  }

  // Load total estimates for only_total projects
  if (currentProject.value?.only_total && cc.total_amount && cc.total_amount > 0) {
    totalManualAmount.value = String(cc.total_amount)
  } else {
    // Reset to default if no existing values
    totalManualAmount.value = ''
  }

  // Ensure contingency state is consistent with new default behavior
  if (cc.contingency_enabled) {
    if (cc.contingency_percentage === null || cc.contingency_percentage === undefined || cc.contingency_percentage === '') {
      cc.contingency_percentage = getProjectContingencyPercent()
    }
  } else {
    cc.contingency_percentage = null
  }
  
  // Load preferred items if material tab is selected and item-wise is chosen
  if (activeTab.value === 'material' && materialEstimateType.value === 'item-wise') {
    const hasExisting = Array.isArray(cc.material_items) && cc.material_items.length > 0
    if (!hasExisting && materialItems.value.length === 0) {
      loadPreferredItems()
    }
  }
  
  // Set initial tab based on what's enabled
  if (currentProject.value?.only_total) {
    activeTab.value = 'total'
  } else if (currentProject.value?.enable_labor) {
    activeTab.value = 'labor'
  } else if (currentProject.value?.enable_material) {
    activeTab.value = 'material'
  } else {
    activeTab.value = 'contingency'
  }

  isEstimateModalOpen.value = true
}

// Close modal handler
const closeEstimateModal = (): void => {
  isEstimateModalOpen.value = false
  selectedCostCode.value = null
  
  // Reset labor estimation state
  laborEstimateType.value = 'manual'
  laborManualAmount.value = ''
  laborAmountPerRoom.value = ''
  laborAmountPerSqft.value = ''
  laborNumberOfHours.value = ''
  laborHourlyWage.value = ''
  laborLocationWiseRows.value = []
  
  // Reset material estimation state
  materialEstimateType.value = 'item-wise'
  materialManualAmount.value = ''
  materialItems.value = []
  
  // Reset to first available tab
  if (currentProject.value?.enable_labor) {
    activeTab.value = 'labor'
  } else if (currentProject.value?.enable_material) {
    activeTab.value = 'material'
  } else {
    activeTab.value = 'contingency'
  }
}

const emitLineItemsUpdate = () => {
  const lineItems: any[] = []
  
  // Helper function to emit a single cost code as a line item
  const emitCostCodeAsLineItem = (costCode: any, division: any, isSubCostCode: boolean = false) => {
    // Calculate amounts based on whether it's a sub-cost code or has sub-cost codes
    let calculatedTotal: number
    let laborAmount: number
    let materialAmount: number
    
    if (isSubCostCode) {
      // For sub-cost codes, check if they have sub-sub-cost codes
      if (costCode.subSubCostCodes && costCode.subSubCostCodes.length > 0) {
        // If it has sub-sub-cost codes, calculate from them
        calculatedTotal = getSubCostCodeTotal(costCode)
        laborAmount = getSubCostCodeLaborTotal(costCode)
        materialAmount = getSubCostCodeMaterialTotal(costCode)
      } else {
        // Direct sub-cost code (leaf node) - use its values directly
        laborAmount = parseFloat(costCode.labor_amount) || 0
        materialAmount = parseFloat(costCode.material_amount) || 0
        // Calculate total WITHOUT contingency (contingency is tracked separately)
        if (showOnlyTotal.value) {
          calculatedTotal = parseFloat(costCode.total_amount) || 0
        } else {
          calculatedTotal = laborAmount + materialAmount
        }
      }
    } else {
      // Top-level cost code
      if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
        // Has sub-cost codes - calculate from them (shouldn't happen in emit, but handle it)
        calculatedTotal = getCostCodeTotal(costCode)
        laborAmount = getCostCodeLaborTotal(costCode)
        materialAmount = getCostCodeMaterialTotal(costCode)
      } else {
        // Direct cost code - use its values directly
        laborAmount = parseFloat(costCode.labor_amount) || 0
        materialAmount = parseFloat(costCode.material_amount) || 0
        // Calculate total WITHOUT contingency (contingency is tracked separately)
        calculatedTotal = showOnlyTotal.value 
          ? (parseFloat(costCode.total_amount) || 0)
          : (laborAmount + materialAmount)
      }
    }
    
    // Emit if there's a value, or if location-wise labor has rows (to ensure breakup is saved)
    const hasLocationWiseLabor = Array.isArray(costCode.location_wise_labor) && costCode.location_wise_labor.length > 0
    const hasLocationWiseMaterial = Array.isArray(costCode.location_wise_material) && costCode.location_wise_material.length > 0
    const hasMaterialItems = Array.isArray(costCode.material_items) && costCode.material_items.length > 0
    if (laborAmount > 0 || materialAmount > 0 || calculatedTotal > 0 || hasLocationWiseLabor || hasLocationWiseMaterial || hasMaterialItems) {
      lineItems.push({
        cost_code_uuid: costCode.uuid,
        cost_code_number: costCode.cost_code_number,
        cost_code_name: costCode.cost_code_name,
        division_name: division.division_name,
        description: `${costCode.cost_code_number} ${costCode.cost_code_name}`,
        labor_amount: laborAmount,
        material_amount: materialAmount,
        total_amount: calculatedTotal,
        estimation_type: costCode.estimation_type || 'manual',
        labor_amount_per_room: costCode.labor_amount_per_room || 0,
        labor_rooms_count: costCode.labor_rooms_count || (currentProject.value?.no_of_rooms || 0),
        labor_amount_per_sqft: costCode.labor_amount_per_sqft || 0,
        labor_sq_ft_count: costCode.labor_sq_ft_count || (currentProject.value?.area_sq_ft || 0),
        labor_number_of_hours: costCode.labor_number_of_hours ?? 0,
        labor_hourly_wage: costCode.labor_hourly_wage ?? 0,
        location_wise_labor: costCode.location_wise_labor ?? [],
        location_wise_material: costCode.location_wise_material ?? [],
        material_items: costCode.material_items || [],
        metadata: {
          ...(costCode.metadata || {}),
          contingency_enabled: costCode.contingency_enabled === true,
          contingency_percentage: parseFloat(costCode.contingency_percentage) || 0
        },
        contingency_enabled: costCode.contingency_enabled === true,
        contingency_percentage: parseFloat(costCode.contingency_percentage) || 0,
        is_sub_cost_code: isSubCostCode
      })
    }
  }
  
  // Use visibleDivisions to exclude empty divisions when emitting updates
  visibleDivisions.value.forEach((division: any) => {
    division.costCodes.forEach((costCode: any) => {
      // If cost code has sub-cost codes, emit each sub-cost code (and sub-sub-cost codes) separately
      if (costCode.subCostCodes && costCode.subCostCodes.length > 0) {
        costCode.subCostCodes.forEach((subCostCode: any) => {
          // If sub-cost code has sub-sub-cost codes, emit each sub-sub-cost code separately
          if (subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0) {
            subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
              // For sub-sub-cost codes (leaf nodes), emit with their direct values
              const laborAmount = parseFloat(subSubCostCode.labor_amount) || 0
              const materialAmount = parseFloat(subSubCostCode.material_amount) || 0
              // Calculate total WITHOUT contingency (contingency is tracked separately)
              const calculatedTotal = showOnlyTotal.value
                ? (parseFloat(subSubCostCode.total_amount) || 0)
                : (laborAmount + materialAmount)
              const hasSubSubLocationWise = Array.isArray(subSubCostCode.location_wise_labor) && subSubCostCode.location_wise_labor.length > 0
              const hasSubSubLocationWiseMaterial = Array.isArray(subSubCostCode.location_wise_material) && subSubCostCode.location_wise_material.length > 0
              const hasSubSubMaterialItems = Array.isArray(subSubCostCode.material_items) && subSubCostCode.material_items.length > 0
              if (laborAmount > 0 || materialAmount > 0 || calculatedTotal > 0 || hasSubSubLocationWise || hasSubSubLocationWiseMaterial || hasSubSubMaterialItems) {
                lineItems.push({
                  cost_code_uuid: subSubCostCode.uuid,
                  cost_code_number: subSubCostCode.cost_code_number,
                  cost_code_name: subSubCostCode.cost_code_name,
                  division_name: division.division_name,
                  description: `${subSubCostCode.cost_code_number} ${subSubCostCode.cost_code_name}`,
                  labor_amount: laborAmount,
                  material_amount: materialAmount,
                  total_amount: calculatedTotal,
                  estimation_type: subSubCostCode.estimation_type || 'manual',
                  labor_amount_per_room: subSubCostCode.labor_amount_per_room || 0,
                  labor_rooms_count: subSubCostCode.labor_rooms_count || (currentProject.value?.no_of_rooms || 0),
                  labor_amount_per_sqft: subSubCostCode.labor_amount_per_sqft || 0,
                  labor_sq_ft_count: subSubCostCode.labor_sq_ft_count || (currentProject.value?.area_sq_ft || 0),
                  labor_number_of_hours: subSubCostCode.labor_number_of_hours ?? 0,
                  labor_hourly_wage: subSubCostCode.labor_hourly_wage ?? 0,
                  location_wise_labor: subSubCostCode.location_wise_labor ?? [],
                  location_wise_material: subSubCostCode.location_wise_material ?? [],
                  material_items: subSubCostCode.material_items || [],
                  metadata: {
                    ...(subSubCostCode.metadata || {}),
                    contingency_enabled: subSubCostCode.contingency_enabled === true,
                    contingency_percentage: parseFloat(subSubCostCode.contingency_percentage) || 0
                  },
                  contingency_enabled: subSubCostCode.contingency_enabled === true,
                  contingency_percentage: parseFloat(subSubCostCode.contingency_percentage) || 0,
                  is_sub_cost_code: true
                })
              }
            })
          } else {
            // Sub-cost code without sub-sub-cost codes - emit it directly
            emitCostCodeAsLineItem(subCostCode, division, true)
          }
        })
      } else {
        // Cost code without sub-cost codes - emit it directly
        emitCostCodeAsLineItem(costCode, division, false)
      }
    })
  })

  emit('update:modelValue', lineItems)
}

// Fetch data - use estimateCreationStore for new estimates, global stores for editing
// Fetch project-filtered configurations using dedicated API
const fetchProjectFilteredConfigurations = async (corporationUuid: string, projectUuid?: string) => {
  if (!corporationUuid) {
    configurations.value = []
    return
  }

  // Only fetch on client side to avoid SSR issues
  if (process.server) {
    return
  }

  try {
    const { apiFetch } = useApiClient()
    const { data } = await apiFetch<{ data: any[] }>(
      `/api/cost-code-configurations/project-filtered`,
      {
        query: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid
        }
      }
    )

    configurations.value = data || []
  } catch (error: any) {
    console.error('Error fetching project-filtered cost code configurations:', error)
    configurations.value = []
    // Don't throw - allow the flow to continue with empty configurations
  }
}

const fetchData = async () => {
  if (props.editingEstimate) {
    // When editing, use global stores
    if (!corpStore.selectedCorporation?.id) {
      divisions.value = []
      configurations.value = []
      return
    }

    loading.value = true
    try {
      await Promise.all([
        divisionsStore.fetchDivisions(corpStore.selectedCorporation.id),
        // Fetch configurations with project filtering for better performance using dedicated API
        fetchProjectFilteredConfigurations(corpStore.selectedCorporation.id, props.projectUuid)
      ])

      divisions.value = divisionsStore.getActiveDivisions(corpStore.selectedCorporation.id) || []
      // configurations.value is set by fetchProjectFilteredConfigurations
    } catch (error) {
      console.error('Error fetching cost code data (editing mode):', error)
      divisions.value = []
      configurations.value = []
    } finally {
      loading.value = false
    }
  } else {
    // When creating new, use estimateCreationStore
    if (!estimateCreationStore.selectedCorporationUuid) {
      divisions.value = []
      configurations.value = []
      return
    }

    loading.value = true
    try {
      // For new estimates, only load configurations if we have both corporation and project UUID
      // No fallback to store data - only API-filtered data is used
      if (estimateCreationStore.selectedCorporationUuid && props.projectUuid) {
        await fetchProjectFilteredConfigurations(estimateCreationStore.selectedCorporationUuid, props.projectUuid)
      } else {
        // No configurations available until both corporation and project are selected
        configurations.value = []
      }

      divisions.value = estimateCreationStore.getActiveDivisions || []
    } catch (error) {
      console.error('Error loading cost code configurations:', error)
      divisions.value = []
      configurations.value = []
    } finally {
      loading.value = false
    }
  }
}

// Watch for corporation changes - use appropriate store based on editingEstimate
watch(() => props.editingEstimate 
  ? corpStore.selectedCorporation?.id 
  : estimateCreationStore.selectedCorporationUuid, async (newUuid, oldUuid) => {
  if (newUuid && newUuid !== oldUuid) {
    // Reset population flag on corp change to allow re-populating for another estimate/corp
    hasPopulatedSavedData.value = false
    
    // For new estimates, data is already fetched by estimateCreationStore.setCorporationAndFetchData
    // Just need to load it into local state
    await fetchData()
  }
}, { immediate: true })

// Also watch for changes in estimateCreationStore data arrays to ensure reactivity
watch(() => props.editingEstimate ? null : [
  estimateCreationStore.costCodeDivisions,
  estimateCreationStore.costCodeConfigurations
], () => {
  // When creating new estimate and store data changes, reload local state
  if (!props.editingEstimate && estimateCreationStore.selectedCorporationUuid) {
    fetchData()
  }
}, { deep: true })

// Watch for data changes and emit updates
// Avoid emitting before saved data has been populated to prevent wiping parent model
watch(() => hierarchicalData.value, () => {
  if (hasPopulatedSavedData.value) {
    emitLineItemsUpdate()
  }
}, { deep: true })

// Watch for modelValue changes to populate saved line items when editing
watch(() => props.modelValue, (newLineItems) => {
  // If we've already populated once and now have empty array, don't reset
  if (hasPopulatedSavedData.value && (!newLineItems || newLineItems.length === 0)) {
    return
  }
  
  if (!newLineItems || newLineItems.length === 0) {
    return
  }
  
  // Only populate if hierarchical data exists (cost codes have been loaded)
  if (!hierarchicalData.value || hierarchicalData.value.length === 0) {
    return
  }
  
  // Populate will be handled by the hierarchical data watcher
}, { deep: true })

// Watch for hierarchical data to load and populate saved line items when they're ready
watch(() => [hierarchicalData.value, props.modelValue], ([newHierarchicalData, newModelValue]) => {
  // Update hierarchicalDataRef whenever hierarchical data changes
  if (newHierarchicalData && newHierarchicalData.length > 0) {
    // Store the original data
    originalHierarchicalData.value = JSON.parse(JSON.stringify(newHierarchicalData))

    // Only update if we haven't populated data yet, or if this is a fresh load
    if (!hasPopulatedSavedData.value || hierarchicalDataRef.value.length === 0) {
      const clonedData = JSON.parse(JSON.stringify(newHierarchicalData))
      // Filter out deleted cost codes immediately when loading
      if (deletedUuidsLocal.value.size > 0) {
        clonedData.forEach((division: any) => {
          if (division.costCodes && Array.isArray(division.costCodes)) {
            division.costCodes = division.costCodes
              .map((costCode: any) => filterDeletedCostCodes(costCode))
              .filter((costCode: any) => costCode !== null)
          }
        })
      }
      hierarchicalDataRef.value = clonedData
    }
  }
  
  // Check if we have both hierarchical data and modelValue to populate
  if (newHierarchicalData && newHierarchicalData.length > 0 && newModelValue && newModelValue.length > 0 && !hasPopulatedSavedData.value) {
    // Create a map of line items by cost_code_uuid for quick lookup
    const lineItemsMap = new Map(newModelValue.map((item: any) => [item.cost_code_uuid, item]))
    
    let populatedCount = 0
    // Populate the hierarchical data with saved values
    const updatedHierarchicalData = JSON.parse(JSON.stringify(hierarchicalDataRef.value))
    
    updatedHierarchicalData.forEach((division: any) => {
      division.costCodes.forEach((costCode: any) => {
        const savedItem = lineItemsMap.get(costCode.uuid)
        if (savedItem) {
          costCode.labor_amount = savedItem.labor_amount || 0
          costCode.material_amount = savedItem.material_amount || 0
          costCode.total_amount = savedItem.total_amount || 0
          costCode.estimation_type = savedItem.estimation_type || 'manual'
          costCode.labor_amount_per_room = savedItem.labor_amount_per_room || 0
          costCode.labor_rooms_count = savedItem.labor_rooms_count || 0
          costCode.labor_amount_per_sqft = savedItem.labor_amount_per_sqft || 0
          costCode.labor_sq_ft_count = savedItem.labor_sq_ft_count || 0
          costCode.labor_number_of_hours = savedItem.labor_number_of_hours ?? 0
          costCode.labor_hourly_wage = savedItem.labor_hourly_wage ?? 0
          costCode.location_wise_labor = savedItem.location_wise_labor ?? []
          costCode.location_wise_material = savedItem.location_wise_material ?? []
            // Enrich saved material items with current sequence values from preferred items
            const normalizedItems = (savedItem.material_items || []).map((item: any) => normalizeMaterialItem(item))
            costCode.material_items = enrichMaterialItemsWithSequence(normalizedItems, costCode.uuid)
          costCode.contingency_enabled = savedItem.contingency_enabled === true
          costCode.contingency_percentage = normalizeContingencyValue(savedItem.contingency_percentage)
          populatedCount++
        }
        
        // Also populate sub-cost codes
        if (costCode.subCostCodes) {
          costCode.subCostCodes.forEach((subCostCode: any) => {
            const savedSubItem = lineItemsMap.get(subCostCode.uuid)
            if (savedSubItem) {
              subCostCode.labor_amount = savedSubItem.labor_amount || 0
              subCostCode.material_amount = savedSubItem.material_amount || 0
              subCostCode.total_amount = savedSubItem.total_amount || 0
              subCostCode.estimation_type = savedSubItem.estimation_type || 'manual'
              subCostCode.labor_amount_per_room = savedSubItem.labor_amount_per_room || 0
              subCostCode.labor_rooms_count = savedSubItem.labor_rooms_count || 0
              subCostCode.labor_amount_per_sqft = savedSubItem.labor_amount_per_sqft || 0
              subCostCode.labor_sq_ft_count = savedSubItem.labor_sq_ft_count || 0
              subCostCode.labor_number_of_hours = savedSubItem.labor_number_of_hours ?? 0
              subCostCode.labor_hourly_wage = savedSubItem.labor_hourly_wage ?? 0
              subCostCode.location_wise_labor = savedSubItem.location_wise_labor ?? []
              subCostCode.location_wise_material = savedSubItem.location_wise_material ?? []
              // Enrich saved material items with current sequence values from preferred items
              const normalizedSubItems = (savedSubItem.material_items || []).map((item: any) => normalizeMaterialItem(item))
              subCostCode.material_items = enrichMaterialItemsWithSequence(normalizedSubItems, subCostCode.uuid)
              subCostCode.contingency_enabled = savedSubItem.contingency_enabled === true
              subCostCode.contingency_percentage = normalizeContingencyValue(savedSubItem.contingency_percentage)
              populatedCount++
            }
            
            // Also populate sub-sub-cost codes
            if (subCostCode.subSubCostCodes) {
              subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
                const savedSubSubItem = lineItemsMap.get(subSubCostCode.uuid)
                if (savedSubSubItem) {
                  subSubCostCode.labor_amount = savedSubSubItem.labor_amount || 0
                  subSubCostCode.material_amount = savedSubSubItem.material_amount || 0
                  subSubCostCode.total_amount = savedSubSubItem.total_amount || 0
                  subSubCostCode.estimation_type = savedSubSubItem.estimation_type || 'manual'
                  subSubCostCode.labor_amount_per_room = savedSubSubItem.labor_amount_per_room || 0
                  subSubCostCode.labor_rooms_count = savedSubSubItem.labor_rooms_count || 0
                  subSubCostCode.labor_amount_per_sqft = savedSubSubItem.labor_amount_per_sqft || 0
                  subSubCostCode.labor_sq_ft_count = savedSubSubItem.labor_sq_ft_count || 0
                  subSubCostCode.labor_number_of_hours = savedSubSubItem.labor_number_of_hours ?? 0
                  subSubCostCode.labor_hourly_wage = savedSubSubItem.labor_hourly_wage ?? 0
                  subSubCostCode.location_wise_labor = savedSubSubItem.location_wise_labor ?? []
                  subSubCostCode.location_wise_material = savedSubSubItem.location_wise_material ?? []
                  // Enrich saved material items with current sequence values from preferred items
                  const normalizedSubSubItems = (savedSubSubItem.material_items || []).map((item: any) => normalizeMaterialItem(item))
                  subSubCostCode.material_items = enrichMaterialItemsWithSequence(normalizedSubSubItems, subSubCostCode.uuid)
                  subSubCostCode.contingency_enabled = savedSubSubItem.contingency_enabled === true
                  subSubCostCode.contingency_percentage = normalizeContingencyValue(savedSubSubItem.contingency_percentage)
                  populatedCount++
                }
              })
            }
          })
        }
      })
    })
    
    // Filter out deleted cost codes before setting to hierarchicalDataRef
    if (deletedUuidsLocal.value.size > 0) {
      updatedHierarchicalData.forEach((division: any) => {
        if (division.costCodes && Array.isArray(division.costCodes)) {
          division.costCodes = division.costCodes
            .map((costCode: any) => filterDeletedCostCodes(costCode))
            .filter((costCode: any) => costCode !== null)
        }
      })
    }
    
    // Update the ref with the populated data to trigger reactivity
    hierarchicalDataRef.value = updatedHierarchicalData
    
    // Mark cost codes as applied if they have values (only check non-empty divisions)
    updatedHierarchicalData.filter((division: any) => 
      division.costCodes && Array.isArray(division.costCodes) && division.costCodes.length > 0
    ).forEach((division: any) => {
      division.costCodes.forEach((costCode: any) => {
        const hasLabor = parseFloat(costCode.labor_amount) > 0
        const hasMaterial = parseFloat(costCode.material_amount) > 0
        const hasTotal = parseFloat(costCode.total_amount) > 0
        if (hasLabor || hasMaterial || hasTotal) {
          appliedCostCodes.value.add(costCode.uuid)
        }
        
        // Also check sub-cost codes
        if (costCode.subCostCodes) {
          costCode.subCostCodes.forEach((subCostCode: any) => {
            const hasSubLabor = parseFloat(subCostCode.labor_amount) > 0
            const hasSubMaterial = parseFloat(subCostCode.material_amount) > 0
            const hasSubTotal = parseFloat(subCostCode.total_amount) > 0
            if (hasSubLabor || hasSubMaterial || hasSubTotal) {
              appliedCostCodes.value.add(subCostCode.uuid)
            }
            
            // Check sub-sub-cost codes
            if (subCostCode.subSubCostCodes) {
              subCostCode.subSubCostCodes.forEach((subSubCostCode: any) => {
                const hasSubSubLabor = parseFloat(subSubCostCode.labor_amount) > 0
                const hasSubSubMaterial = parseFloat(subSubCostCode.material_amount) > 0
                const hasSubSubTotal = parseFloat(subSubCostCode.total_amount) > 0
                if (hasSubSubLabor || hasSubSubMaterial || hasSubSubTotal) {
                  appliedCostCodes.value.add(subSubCostCode.uuid)
                }
              })
            }
          })
        }
      })
    })
    
    hasPopulatedSavedData.value = populatedCount > 0
    // Emit once after population so parent form totals update
    emitLineItemsUpdate()
  }
}, { deep: true, immediate: true })

// Watch for project UUID changes to load full project data if needed
watch(() => props.projectUuid, async (newProjectUuid) => {
  if (newProjectUuid && projectsStore.currentProject?.uuid !== newProjectUuid) {
    // Try to load the full project data
    const corpUuid = props.editingEstimate
      ? (corpStore.selectedCorporationId || null)
      : estimateCreationStore.selectedCorporationUuid
    if (corpUuid) {
      await projectsStore.loadCurrentProject(newProjectUuid, corpUuid)
    }

    // When creating new estimate and project is selected, always refetch configurations with project filtering
    if (!props.editingEstimate && newProjectUuid && estimateCreationStore.selectedCorporationUuid) {
      await fetchProjectFilteredConfigurations(estimateCreationStore.selectedCorporationUuid, newProjectUuid)
    }
  }
}, { immediate: true })

// Watch for corporation/project changes to load item types
watch(() => [
  props.editingEstimate ? corpStore.selectedCorporation?.id : estimateCreationStore.selectedCorporationUuid,
  props.projectUuid
] as const, async ([corpUuid, projectUuid]) => {
  if (corpUuid && projectUuid && typeof window !== 'undefined' && !itemTypesStore.loading) {
    // Only fetch if we don't already have cached data and we're not in a test environment
    const hasCachedData = itemTypesStore.hasCachedData(corpUuid)
    const hasStoreData = itemTypesStore.getActiveItemTypes(corpUuid).length > 0
    const isTestEnv = typeof global !== 'undefined' && !!(global as any).vitest

    if (!hasCachedData && !hasStoreData && !isTestEnv) {
      try {
        await itemTypesStore.fetchItemTypes(corpUuid)
      } catch (error) {
        console.error('[EstimateLineItemsTable] Failed to fetch item types', error)
      }
    }
  }
}, { immediate: true })

// Watch for deletedUuids prop changes (e.g., when loading a saved estimate)
watch(() => props.deletedUuids, (newDeletedUuids, oldDeletedUuids) => {
  const oldSet = new Set(oldDeletedUuids || [])
  const newSet = new Set(newDeletedUuids || [])

  // Update local set
  deletedUuidsLocal.value = newSet

  // If hierarchical data exists, we need to update the filtering
  if (originalHierarchicalData.value.length > 0) {
    // Check if items were added or removed from deletedUuids
    const itemsAddedToDeleted = [...newSet].filter(uuid => !oldSet.has(uuid))
    const itemsRemovedFromDeleted = [...oldSet].filter(uuid => !newSet.has(uuid))

    if (itemsAddedToDeleted.length > 0 || itemsRemovedFromDeleted.length > 0) {
      // Snapshot current estimate values so delete/restore does not wipe entered amounts.
      const estimateFields = [
        'labor_amount',
        'material_amount',
        'total_amount',
        'estimation_type',
        'labor_amount_per_room',
        'labor_rooms_count',
        'labor_amount_per_sqft',
        'labor_sq_ft_count',
        'labor_number_of_hours',
        'labor_hourly_wage',
        'location_wise_labor',
        'location_wise_material',
        'material_items',
        'contingency_enabled',
        'contingency_percentage',
        'metadata',
      ] as const

      const valueSnapshot = new Map<string, any>()
      const captureNode = (node: any) => {
        if (!node?.uuid) return
        const snapshot: any = {}
        estimateFields.forEach((field) => {
          snapshot[field] = node[field]
        })
        valueSnapshot.set(node.uuid, snapshot)
      }
      const captureTree = (nodes: any[]) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach((node: any) => {
          captureNode(node)
          if (Array.isArray(node.subCostCodes)) captureTree(node.subCostCodes)
          if (Array.isArray(node.subSubCostCodes)) captureTree(node.subSubCostCodes)
        })
      }
      hierarchicalDataRef.value.forEach((division: any) => {
        if (Array.isArray(division?.costCodes)) {
          captureTree(division.costCodes)
        }
      })

      // Start from full original structure so restored rows reappear, then rehydrate saved values.
      const workingData = JSON.parse(JSON.stringify(originalHierarchicalData.value))
      const applySnapshot = (nodes: any[]) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach((node: any) => {
          const snapshot = node?.uuid ? valueSnapshot.get(node.uuid) : null
          if (snapshot) {
            estimateFields.forEach((field) => {
              node[field] = snapshot[field]
            })
          }
          if (Array.isArray(node.subCostCodes)) applySnapshot(node.subCostCodes)
          if (Array.isArray(node.subSubCostCodes)) applySnapshot(node.subSubCostCodes)
        })
      }
      workingData.forEach((division: any) => {
        if (Array.isArray(division?.costCodes)) {
          applySnapshot(division.costCodes)
        }
      })

      // Apply filtering to the working data
      const filteredData = workingData.map((division: any) => {
        if (!division.costCodes || !Array.isArray(division.costCodes)) {
          return division
        }

        const filteredCostCodes = division.costCodes
          .map((costCode: any) => filterDeletedCostCodes(costCode))
          .filter((costCode: any) => costCode !== null)

        return {
          ...division,
          costCodes: filteredCostCodes
        }
      }).filter((division: any) =>
        division.costCodes && Array.isArray(division.costCodes) && division.costCodes.length > 0
      )

      hierarchicalDataRef.value = filteredData
      emitLineItemsUpdate()
    }
  }
}, { immediate: true })

// Watch for material estimate type changes: enforce single type across all cost codes, and load preferred items for item-wise
watch(() => materialEstimateType.value, (newType) => {
  if (!selectedCostCode.value || !isEstimateModalOpen.value) return
  const applied = appliedMaterialEstimateType.value
  if (applied != null && newType !== applied) {
    const toast = useToast()
    const otherLabel = applied === 'item-wise' ? 'Item Wise' : 'Manual'
    toast.add({
      title: 'Material estimate type must be consistent',
      description: `Other cost codes in this estimate use "${otherLabel}". Please use "${otherLabel}" for all cost codes.`,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
      duration: 5000,
    })
    nextTick(() => {
      materialEstimateType.value = applied
    })
    return
  }
  if (newType === 'item-wise' && selectedCostCode.value) {
    // Load preferred items if:
    // 1. No existing items saved on the cost code configuration, AND
    // 2. No items loaded from estimate_material_items API (after filtering)
    const hasExistingOnCostCode = Array.isArray((selectedCostCode.value as any).material_items) && (selectedCostCode.value as any).material_items.length > 0
    const hasLoadedItems = materialItems.value.length > 0

    if (!hasExistingOnCostCode && !hasLoadedItems) {
      loadPreferredItems()
    }
  }
})

// Watch for changes to materialItems and sync to selectedCostCode.material_items.
// Also update the hierarchy node directly (guards against detached selectedCostCode references)
// and emit so the parent form.line_items stays in sync without requiring an explicit Apply click.
watch(() => materialItems.value, (newItems) => {
  if (!selectedCostCode.value || materialEstimateType.value !== 'item-wise') return
  const normalizedItems = newItems.map((item) => normalizeMaterialItem(item))
  // Always update the live copy
  selectedCostCode.value.material_items = normalizedItems
  // Also update the hierarchy node by UUID so detached copies don't silently lose data
  const targetUuid = selectedCostCode.value.uuid
  for (const division of hierarchicalDataRef.value) {
    for (const cc of division.costCodes) {
      if (cc.uuid === targetUuid) { cc.material_items = normalizedItems; break }
      for (const sub of (cc.subCostCodes || [])) {
        if (sub.uuid === targetUuid) { sub.material_items = normalizedItems; break }
        for (const subsub of (sub.subSubCostCodes || [])) {
          if (subsub.uuid === targetUuid) { subsub.material_items = normalizedItems; break }
        }
      }
    }
  }
  emitLineItemsUpdate()
}, { deep: true })

// Watch for changes to location-wise labor rows and sync to hierarchy so the parent form stays
// in sync without requiring an explicit Apply click.
watch(() => laborLocationWiseRows.value, (newRows) => {
  if (!selectedCostCode.value || !isLocationWiseProject.value) return
  const targetUuid = selectedCostCode.value.uuid
  const mappedRows = newRows.map((r) => ({
    breakdown_uuid: r.breakdown_uuid,
    location_uuid: r.location_uuid,
    area_sq_ft: parseFloat(String(r.area_sq_ft)) || 0,
    no_of_rooms: parseFloat(String(r.no_of_rooms)) || 0,
    num_hours: parseFloat(String(r.num_hours)) || 0,
    amount_per_sqft: parseFloat(String(r.amount_per_sqft)) || 0,
    amount_per_room: parseFloat(String(r.amount_per_room)) || 0,
    hourly_wage: parseFloat(String(r.hourly_wage)) || 0,
    manual_amount: parseFloat(String(r.manual_amount)) || 0,
    amount: getLocationWiseRowAmount(r)
  }))
  // Update live copy
  selectedCostCode.value.location_wise_labor = mappedRows
  // Update hierarchy node by UUID
  for (const division of hierarchicalDataRef.value) {
    for (const cc of division.costCodes) {
      if (cc.uuid === targetUuid) { cc.location_wise_labor = mappedRows; break }
      for (const sub of (cc.subCostCodes || [])) {
        if (sub.uuid === targetUuid) { sub.location_wise_labor = mappedRows; break }
        for (const subsub of (sub.subSubCostCodes || [])) {
          if (subsub.uuid === targetUuid) { subsub.location_wise_labor = mappedRows; break }
        }
      }
    }
  }
  emitLineItemsUpdate()
}, { deep: true })

// Watch for active tab changes: enforce material type when switching to material tab, and load preferred items
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'material') {
    const applied = appliedMaterialEstimateType.value
    if (applied != null && materialEstimateType.value !== applied) {
      materialEstimateType.value = applied
    }
    if (materialEstimateType.value === 'item-wise' && selectedCostCode.value) {
      const hasExisting = Array.isArray((selectedCostCode.value as any).material_items) && (selectedCostCode.value as any).material_items.length > 0
      if (!hasExisting && materialItems.value.length === 0) {
        loadPreferredItems()
      }
    }
  }
})

onMounted(async () => {
  // For editing, use global stores
  if (props.editingEstimate && corpStore.selectedCorporation?.id) {
    await fetchData()
    // ensure UOM list is present
    if (!uomStore.getActiveUOM(corpStore.selectedCorporation.id)?.length) {
      uomStore.fetchUOM(corpStore.selectedCorporation.id).catch(() => {})
    }
    // ensure item types are loaded (skip in test environments)
    const isTestEnv = typeof global !== 'undefined' && (global as any).vitest
    if (!isTestEnv) {
      const corpUuid = corpStore.selectedCorporation.id
      const projectUuid = props.projectUuid
      if (!itemTypesStore.hasCachedData(corpUuid)) {
        itemTypesStore.fetchItemTypes(corpUuid).catch(() => {})
      }
    }
  }
  // For new estimates, use estimateCreationStore
  else if (!props.editingEstimate && estimateCreationStore.selectedCorporationUuid) {
    await fetchData()
    // UOM is already loaded in estimateCreationStore
    // Item types are loaded via the watcher
  }
})

onBeforeUnmount(() => {
  if (descriptionEditor.value && typeof descriptionEditor.value.destroy === 'function') {
    try {
      descriptionEditor.value.destroy()
    } catch {
      // no-op
    }
  }
})
</script>
