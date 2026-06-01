<template>
  <div
    class="space-y-3 print:space-y-1.5 min-h-0 h-full max-h-full overflow-y-auto print:overflow-visible print:h-auto print:max-h-none"
  >
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading change order...</p>
      </div>
    </div>

    <div v-else-if="error" class="py-4">
      <UAlert
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="error"
        :description="'Please try again.'"
      />
    </div>

    <div v-else-if="changeOrderDetail" class="print:p-4 print:space-y-2">
      <!-- Header Section -->
      <div class="mb-3 print:mb-2">
        <div class="text-center mb-2 print:mb-1">
          <h1 class="text-xl print:text-lg font-bold text-gray-900">{{ changeOrderDetail.is_revised ? 'REVISED CHANGE ORDER' : 'CHANGE ORDER' }}</h1>
          <div class="flex items-baseline justify-center gap-1.5 mt-0.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">CO # :</div>
            <div class="text-base print:text-sm font-mono">{{ coNumberDisplay }}</div>
          </div>
        </div>

        <div class="flex justify-end mb-3 print:mb-2">
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">Submit Date :</div>
            <div class="text-base print:text-sm">{{ formatDate((changeOrderDetail as any).entry_date ?? changeOrderDetail.created_date) }}</div>
          </div>
        </div>

        <!-- Revision Details (shown when CO is revised) -->
        <div v-if="changeOrderDetail.is_revised" class="mb-3 print:mb-2 border border-red-300 bg-red-50 rounded p-2.5 print:p-1.5 space-y-1 print:space-y-0.5">
          <div v-if="revisionNumberDisplay" class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Revision # :</div>
            <div class="text-sm print:text-xs text-red-900">{{ revisionNumberDisplay }}</div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Original Submit Date :</div>
            <div class="text-sm print:text-xs text-red-900">{{ formatDate((changeOrderDetail as any).entry_date ?? changeOrderDetail.created_date) }}</div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Revision Submission Date :</div>
            <div class="text-sm print:text-xs text-red-900">{{ formatDate(changeOrderDetail.revision_date) }}</div>
          </div>
          <div v-if="changeOrderDetail.revision_notes" class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Revision Notes :</div>
            <div class="text-sm print:text-xs text-red-900">{{ changeOrderDetail.revision_notes }}</div>
          </div>
        </div>

        <div class="flex items-start justify-between gap-4 mb-3 print:mb-2">
          <div class="space-y-1 print:space-y-0.5">
            <div class="flex items-baseline gap-1.5">
              <div class="text-xs print:text-[10px] font-semibold text-gray-700">Project Name :</div>
              <div class="text-sm print:text-xs">{{ projectName || '' }}</div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <div class="text-xs print:text-[10px] font-semibold text-gray-700">Project # :</div>
              <div class="text-sm print:text-xs">{{ projectId || '' }}</div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <div class="text-xs print:text-[10px] font-semibold text-gray-700">Project Contact :</div>
              <div class="text-sm print:text-xs">{{ projectContact || '' }}</div>
            </div>
            <div class="flex items-baseline gap-1.5">
              <div class="text-xs print:text-[10px] font-semibold text-gray-700">Original PO # :</div>
              <div class="text-sm print:text-xs">{{ originalPONumber || '' }}</div>
            </div>
          </div>
          <div v-if="quoteReferenceDisplay" class="flex items-baseline gap-1.5 text-right shrink-0">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">Quote Reference :</div>
            <div class="text-sm print:text-xs">{{ quoteReferenceDisplay }}</div>
          </div>
        </div>
      </div>

      <!-- Source & Manufacturer (Material CO only) — same layout as PurchaseOrderPreview -->
      <div v-if="!isLaborCO" class="grid grid-cols-2 gap-3 print:gap-2 mb-3 print:mb-2">
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">Source Address</h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <div class="font-semibold text-gray-900">{{ vendorName || '' }}</div>
            <div class="text-gray-700 whitespace-pre-line">{{ sourceAddressDisplay }}</div>
            <div v-if="sourcePhone" class="text-gray-700">
              <span class="font-semibold">Phone:</span> {{ sourcePhone }}
            </div>
            <div v-if="sourceFax" class="text-gray-700">
              <span class="font-semibold">Fax:</span> {{ sourceFax }}
            </div>
            <div v-if="sourceContactName" class="text-gray-700">
              <span class="font-semibold">Contact:</span> {{ sourceContactName }}
            </div>
            <div v-if="sourceEmail" class="text-gray-700">
              <span class="font-semibold">E-mail:</span> {{ sourceEmail }}
            </div>
          </div>
        </div>
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">Manufacturer Address</h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <div class="font-semibold text-gray-900">{{ vendorName || '' }}</div>
            <div class="text-gray-700 whitespace-pre-line">{{ manufacturingAddressDisplay }}</div>
            <div v-if="manufacturingPhone" class="text-gray-700">
              <span class="font-semibold">Phone:</span> {{ manufacturingPhone }}
            </div>
            <div v-if="manufacturingFax" class="text-gray-700">
              <span class="font-semibold">Fax:</span> {{ manufacturingFax }}
            </div>
            <div v-if="manufacturingContactName" class="text-gray-700">
              <span class="font-semibold">Contact:</span> {{ manufacturingContactName }}
            </div>
            <div v-if="manufacturingEmail" class="text-gray-700">
              <span class="font-semibold">E-mail:</span> {{ manufacturingEmail }}
            </div>
          </div>
        </div>
      </div>

      <!-- Labor CO: Project + Ship To (row 1), Vendor (row 2) -->
      <div v-if="isLaborCO" class="space-y-3 print:space-y-2 mb-3 print:mb-2">
        <div class="grid grid-cols-2 gap-3 print:gap-2">
          <div class="border border-gray-300 rounded p-2 print:p-1.5">
            <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">
              Project Address
            </h3>
            <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
              <div class="text-gray-700 whitespace-pre-line">{{ shipToAddress }}</div>
              <div v-if="shipToContact" class="text-gray-700">
                <span class="font-semibold">Contact:</span> {{ shipToContact }}
              </div>
              <div v-if="shipToPhone" class="text-gray-700">
                <span class="font-semibold">Phone:</span> {{ shipToPhone }}
              </div>
              <div v-if="shipToFax" class="text-gray-700">
                <span class="font-semibold">Fax:</span> {{ shipToFax }}
              </div>
              <div v-if="shipToEmail" class="text-gray-700">
                <span class="font-semibold">E-mail:</span> {{ shipToEmail }}
              </div>
            </div>
          </div>
          <div class="border border-gray-300 rounded p-2 print:p-1.5">
            <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">
              Ship To Address
            </h3>
            <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
              <div class="text-gray-700 whitespace-pre-line">{{ shipToAddress }}</div>
              <div v-if="shipToContact" class="text-gray-700">
                <span class="font-semibold">Contact:</span> {{ shipToContact }}
              </div>
              <div v-if="shipToPhone" class="text-gray-700">
                <span class="font-semibold">Phone:</span> {{ shipToPhone }}
              </div>
              <div v-if="shipToFax" class="text-gray-700">
                <span class="font-semibold">Fax:</span> {{ shipToFax }}
              </div>
              <div v-if="shipToEmail" class="text-gray-700">
                <span class="font-semibold">E-mail:</span> {{ shipToEmail }}
              </div>
            </div>
          </div>
        </div>
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">
            Vendor Address
          </h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <div class="font-semibold text-gray-900">{{ vendorName || '' }}</div>
            <div class="text-gray-700 whitespace-pre-line">{{ vendorAddressDisplay }}</div>
            <div v-if="vendorPhone" class="text-gray-700">
              <span class="font-semibold">Phone:</span> {{ vendorPhone }}
            </div>
            <div v-if="vendorFax" class="text-gray-700">
              <span class="font-semibold">Fax:</span> {{ vendorFax }}
            </div>
            <div v-if="vendorContactName" class="text-gray-700">
              <span class="font-semibold">Contact:</span> {{ vendorContactName }}
            </div>
            <div v-if="vendorEmail" class="text-gray-700">
              <span class="font-semibold">E-mail:</span> {{ vendorEmail }}
            </div>
          </div>
        </div>
      </div>

      <!-- Material CO: Ship to + Billing -->
      <div v-else class="grid grid-cols-2 gap-3 print:gap-2 mb-3 print:mb-2">
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">
            Ship to (Project Address)
          </h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <div class="text-gray-700 whitespace-pre-line">{{ shipToAddress }}</div>
            <div v-if="shipToContact" class="text-gray-700">
              <span class="font-semibold">Contact:</span> {{ shipToContact }}
            </div>
            <div v-if="shipToPhone" class="text-gray-700">
              <span class="font-semibold">Phone:</span> {{ shipToPhone }}
            </div>
            <div v-if="shipToFax" class="text-gray-700">
              <span class="font-semibold">Fax:</span> {{ shipToFax }}
            </div>
            <div v-if="shipToEmail" class="text-gray-700">
              <span class="font-semibold">E-mail:</span> {{ shipToEmail }}
            </div>
          </div>
        </div>
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">
            Billing Address
          </h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <div class="font-semibold text-gray-900">{{ projectName || '' }}</div>
            <div class="text-gray-700 whitespace-pre-line">{{ billingAddressDisplay }}</div>
            <div v-if="billingPhone" class="text-gray-700">
              <span class="font-semibold">Phone:</span> {{ billingPhone }}
            </div>
            <div v-if="billingFax" class="text-gray-700">
              <span class="font-semibold">Fax:</span> {{ billingFax }}
            </div>
            <div v-if="billingContact" class="text-gray-700">
              <span class="font-semibold">Contact:</span> {{ billingContact }}
            </div>
            <div v-if="billingEmail" class="text-gray-700">
              <span class="font-semibold">E-mail:</span> {{ billingEmail }}
            </div>
          </div>
        </div>
      </div>

      <!-- Prepared By Section -->
      <div class="mb-3 print:mb-2">
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">Prepared by</h3>
          <div class="text-xs print:text-[10px] text-gray-700">
            {{ preparedByName || '' }}
          </div>
        </div>
      </div>

      <!-- Freight/Terms/Shipping Instructions/Delivery Date/Currency Table (Material CO only) -->
      <div v-if="!isLaborCO" class="mt-3 print:mt-2 mb-3 print:mb-2">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Freight</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Terms</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Shipping Instructions</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Delivery Date</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Currency</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ freightDisplay || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ termsDisplay || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ shippingInstructionsDisplay || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ deliveryDateDisplay || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ currencyDisplay }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Labor CO Items Section -->
      <div v-if="isLaborCO && laborItems.length > 0" class="mt-3 print:mt-2">
        <h3 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">Labor CO Items</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Cost Code</th>
              <th
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Location
              </th>
              <th
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Description
              </th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">PO Amount</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">CO Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in laborItems" :key="index">
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.cost_code_label || `${item.cost_code_number} ${item.cost_code_name}`.trim() }}</td>
              <td
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
              >
                {{ resolveLaborLocationName(item) }}
              </td>
              <td
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
              >
                {{ resolveLaborDescription(item) }}
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono">{{ formatCurrency(item.po_amount || 0) }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(item.co_amount || 0) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td :colspan="showLaborLocationColumns ? 4 : 2" class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">Total CO Amount:</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(laborTotal) }}</td>
            </tr>
          </tfoot>
        </table>
        
        <!-- CO Total Breakdown for Labor CO -->
        <div class="mt-2 print:mt-1.5 flex justify-end">
          <div class="w-full max-w-md border border-gray-300 rounded p-2 print:p-1.5">
            <div class="space-y-1 print:space-y-0.5">
              <div class="flex justify-between text-xs print:text-[10px]">
                <span class="font-semibold text-gray-700">Labor Total:</span>
                <span class="font-mono">{{ formatCurrency(laborTotal) }}</span>
              </div>
              
              <template v-if="chargesTotal > 0">
                <div v-if="freightChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Freight:</span>
                  <span class="font-mono">{{ formatCurrency(freightChargesAmount) }}</span>
                </div>
                <div v-if="packingChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Packing:</span>
                  <span class="font-mono">{{ formatCurrency(packingChargesAmount) }}</span>
                </div>
                <div v-if="customDutiesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Custom Duties:</span>
                  <span class="font-mono">{{ formatCurrency(customDutiesAmount) }}</span>
                </div>
                <div v-if="otherChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Other:</span>
                  <span class="font-mono">{{ formatCurrency(otherChargesAmount) }}</span>
                </div>
                <div class="flex justify-between text-xs print:text-[10px] border-t border-gray-200 pt-0.5 print:pt-0.5 mt-0.5 print:mt-0.5">
                  <span class="font-semibold text-gray-700">Charges Total:</span>
                  <span class="font-mono font-semibold">{{ formatCurrency(chargesTotal) }}</span>
                </div>
              </template>
              
              <template v-if="taxTotal > 0">
                <div v-if="salesTax1Amount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Sales Tax 1:</span>
                  <span class="font-mono">{{ formatCurrency(salesTax1Amount) }}</span>
                </div>
                <div v-if="salesTax2Amount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Sales Tax 2:</span>
                  <span class="font-mono">{{ formatCurrency(salesTax2Amount) }}</span>
                </div>
                <div class="flex justify-between text-xs print:text-[10px] border-t border-gray-200 pt-0.5 print:pt-0.5 mt-0.5 print:mt-0.5">
                  <span class="font-semibold text-gray-700">Tax Total:</span>
                  <span class="font-mono font-semibold">{{ formatCurrency(taxTotal) }}</span>
                </div>
              </template>
              
              <div class="flex justify-between text-sm print:text-xs font-bold border-t-2 border-gray-400 pt-1 print:pt-0.5 mt-1 print:mt-0.5">
                <span class="text-gray-900">CO Total:</span>
                <span class="font-mono">{{ formatCurrency(coTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Location-wise Material CO Items Section -->
      <div v-if="!isLaborCO && showLocationWiseMaterialSection" class="mt-3 print:mt-2">
        <h3 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">Material CO Items (Location-wise)</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Cost Code</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">SPEC</th>
              <th
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Location
              </th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Description</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">UOM</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Approval Checks</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">CO Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in locationWiseMaterialItems" :key="index">
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.cost_code_label || `${item.cost_code_number || ''} ${item.cost_code_name || ''}`.trim() || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] text-gray-900 print:text-black">{{ resolveItemSequence(item) }}</td>
              <td
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
              >
                {{ resolveLocationName(item) }}
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.description || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px]">{{ resolveUnitDisplayForCoLwmItem(item) }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ resolveItemApprovalChecks(item) }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(item.co_amount || 0) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td
                :colspan="showLaborLocationColumns ? 6 : 5"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold"
              >
                Total:
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(locationWiseMaterialTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- CO Items Section (Item-wise Material) -->
      <div v-else-if="!isLaborCO" class="mt-3 print:mt-2">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Item Name</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">SPEC</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Description</th>
              <th
                v-if="showLaborLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Location
              </th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">Unit Price</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">UOM</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">Quantity</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="coItems.length === 0">
              <td
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
                :colspan="showLaborLocationColumns ? 8 : 7"
              ></td>
            </tr>
            <template v-for="(item, index) in coItems" :key="index">
              <tr>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.name || item.item_name || '' }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] text-gray-900 print:text-black">{{ resolveItemSequence(item) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] align-top">
                  <div class="whitespace-pre-line">{{ formatPrintDescription(item.description) }}</div>
                </td>
                <td
                  v-if="showLaborLocationColumns"
                  class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] align-middle"
                >
                  {{ resolveLocationName(item) }}
                </td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono">{{ item.co_unit_price ? formatCurrency(item.co_unit_price) : '' }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px]">{{ resolveUnitDisplayForCoItem(item) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px]">{{ formatQuantity(item.co_quantity) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ item.co_total ? formatCurrency(item.co_total) : '' }}</td>
              </tr>
              <tr v-if="selectedApprovalChecksForPrint(item).length > 0">
                <td class="border border-gray-300"></td>
                <td class="border border-gray-300"></td>
                <td
                  :colspan="showLaborLocationColumns ? 6 : 5"
                  class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
                >
                  <div class="font-medium border-t border-gray-400 pt-1">
                    Required Item(s) for Approval Prior to Fabrication on Item # {{ resolveItemSequence(item) }}:
                  </div>
                  <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span
                      v-for="check in selectedApprovalChecksForPrint(item)"
                      :key="`${index}-approval-${check.uuid}`"
                      class="inline-flex items-center gap-1"
                    >
                      <span
                        class="inline-flex items-center justify-center w-3 h-3 text-[11px] leading-none border-2 border-black font-black text-black"
                      >
                        ✓
                      </span>
                      <span>{{ check.approval_check }}</span>
                    </span>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- CO Total Breakdown (for Material CO - both item-wise and location-wise) -->
      <div v-if="!isLaborCO" class="mt-2 print:mt-1.5 flex justify-end">
          <div class="w-full max-w-md border border-gray-300 rounded p-2 print:p-1.5">
            <div class="space-y-1 print:space-y-0.5">
              <div class="flex justify-between text-xs print:text-[10px]">
                <span class="font-semibold text-gray-700">CO Item Total:</span>
                <span class="font-mono">{{ formatCurrency(coItemTotal) }}</span>
              </div>
              
              <template v-if="chargesTotal > 0">
                <div v-if="freightChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Freight:</span>
                  <span class="font-mono">{{ formatCurrency(freightChargesAmount) }}</span>
                </div>
                <div v-if="packingChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Packing:</span>
                  <span class="font-mono">{{ formatCurrency(packingChargesAmount) }}</span>
                </div>
                <div v-if="customDutiesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Custom Duties:</span>
                  <span class="font-mono">{{ formatCurrency(customDutiesAmount) }}</span>
                </div>
                <div v-if="otherChargesAmount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Other:</span>
                  <span class="font-mono">{{ formatCurrency(otherChargesAmount) }}</span>
                </div>
                <div class="flex justify-between text-xs print:text-[10px] border-t border-gray-200 pt-0.5 print:pt-0.5 mt-0.5 print:mt-0.5">
                  <span class="font-semibold text-gray-700">Charges Total:</span>
                  <span class="font-mono font-semibold">{{ formatCurrency(chargesTotal) }}</span>
                </div>
              </template>
              
              <template v-if="taxTotal > 0">
                <div v-if="salesTax1Amount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Sales Tax 1:</span>
                  <span class="font-mono">{{ formatCurrency(salesTax1Amount) }}</span>
                </div>
                <div v-if="salesTax2Amount > 0" class="flex justify-between text-xs print:text-[10px] pl-3 print:pl-2">
                  <span class="text-gray-600">Sales Tax 2:</span>
                  <span class="font-mono">{{ formatCurrency(salesTax2Amount) }}</span>
                </div>
                <div class="flex justify-between text-xs print:text-[10px] border-t border-gray-200 pt-0.5 print:pt-0.5 mt-0.5 print:mt-0.5">
                  <span class="font-semibold text-gray-700">Tax Total:</span>
                  <span class="font-mono font-semibold">{{ formatCurrency(taxTotal) }}</span>
                </div>
              </template>
              
              <div class="flex justify-between text-sm print:text-xs font-bold border-t-2 border-gray-400 pt-1 print:pt-0.5 mt-1 print:mt-0.5">
                <span class="text-gray-900">CO Total:</span>
                <span class="font-mono">{{ formatCurrency(coTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

      <!-- Approvals Section -->
      <div class="mt-4 print:mt-3">
        <div class="flex justify-between items-center mb-2 print:mb-1.5">
          <h2 class="text-base print:text-sm font-bold text-gray-900">APPROVALS</h2>
          <div class="text-xs print:text-[10px] font-semibold text-gray-900">
            APPROVED FOR CO Total : <span class="font-mono">{{ formatCurrency(coTotal) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 print:gap-3">
          <div class="space-y-2 print:space-y-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-900">APPROVED BY :</div>
            <div class="space-y-2 print:space-y-1.5">
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Agent / Entity</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]">
                  <span class="text-xs print:text-[10px] text-gray-900">{{ approvedByDisplay || '' }}</span>
                </div>
              </div>
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Date</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]">
                  <span class="text-xs print:text-[10px] text-gray-900">{{ approvedByDate || '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="showApprovedByVendorOnPrint" class="space-y-2 print:space-y-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-900">APPROVED BY VENDOR :</div>
            <div class="space-y-2 print:space-y-1.5">
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Date</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]"></div>
              </div>
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Company Name</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]"></div>
              </div>
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Signature</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]"></div>
              </div>
              <div>
                <div class="text-xs print:text-[10px] text-gray-700 mb-0.5 print:mb-0.5">Shipping Date :</div>
                <div class="border-b-2 border-gray-400 pb-0.5 print:pb-0.5 min-h-[20px] print:min-h-[16px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Special Instructions (above Terms and Conditions when both apply) -->
      <div v-if="selectedSpecialInstruction" class="mt-4 print:mt-3">
        <div class="border-t-2 border-gray-400 pt-3 print:pt-2">
          <h2 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">SPECIAL INSTRUCTIONS</h2>
          <div
            class="prose prose-sm max-w-none text-xs print:text-[10px] text-gray-700"
            v-html="selectedSpecialInstruction.content"
          />
        </div>
      </div>

      <!-- Terms and Conditions Section -->
      <div v-if="selectedTermsAndCondition" class="mt-4 print:mt-3">
        <div class="border-t-2 border-gray-400 pt-3 print:pt-2">
          <h2 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">TERMS AND CONDITIONS</h2>
          <div 
            class="prose prose-sm max-w-none text-xs print:text-[10px] text-gray-700"
            v-html="selectedTermsAndCondition.content"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useCorporationStore } from '~/stores/corporations'
import { useTermsAndConditionsStore } from '~/stores/termsAndConditions'
import { useSpecialInstructionsStore } from '~/stores/specialInstructions'
import { useFreightStore } from '~/stores/freightGlobal'
import { useUserProfilesStore } from '~/stores/userProfiles'
import { useApprovalChecksStore } from '~/stores/approvalChecks'
import { useAppSettingsStore } from '~/stores/corporationSettings'
import { useLocationsStore } from '~/stores/locations'
import {
  resolveShippingAddressForPrint,
} from '~/composables/useProjectAddressForPrint'
import { sanitizePrintAuditPersonLabel } from '~/utils/printAuditDisplay'
import { resolvePrintUomDisplay } from '~/utils/printUomDisplay'
import { normalizeVendorAddresses, getVendorAddressByType } from '~/utils/vendorAddresses'
import { useUOMStore } from '~/stores/uom'

interface Props {
  changeOrder?: any
  changeOrderUuid?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'preview-ready': []
  'preview-error': []
}>()

const { formatDate, formatCoEstimatedDeliveryForPrint } = useDateFormat()
const { formatCurrency, currencyCode } = useCurrencyFormat()
const corporationStore = useCorporationStore()
const termsAndConditionsStore = useTermsAndConditionsStore()
const specialInstructionsStore = useSpecialInstructionsStore()
const freightStore = useFreightStore()
const userProfilesStore = useUserProfilesStore()
const approvalChecksStore = useApprovalChecksStore()
const appSettingsStore = useAppSettingsStore()
const locationsStore = useLocationsStore()
const uomStore = useUOMStore()

const loading = ref(false)
const error = ref<string | null>(null)
const changeOrderDetail = ref<any | null>(null)
const vendorDetail = ref<any | null>(null)
const projectDetail = ref<any | null>(null)
const customerDetail = ref<any | null>(null)
const shippingAddress = ref<any | null>(null)
const billingAddress = ref<any | null>(null)

/** Original PO approval UUIDs keyed for location-wise CO print fallback (CO rows often omit checks). */
const poLwmPairApprovalLookup = ref<Map<string, string[]>>(new Map())
const poLwmCostOnlyApprovalLookup = ref<Map<string, string[]>>(new Map())
const coMasterSpecByItemUuid = ref<Map<string, string>>(new Map())
const coMasterSpecByTypeAndName = ref<Map<string, string>>(new Map())

const buildCoSpecTypeNameKey = (itemTypeUuid: unknown, itemName: unknown) =>
  `${String(itemTypeUuid || '').trim().toLowerCase()}::${String(itemName || '').trim().toLowerCase()}`

const normalizeLwmApprovalKey = (costCodeUuid: string, locationUuid: string) =>
  `${String(costCodeUuid || '').toLowerCase()}::${String(locationUuid || '').toLowerCase()}`

/** Parse metadata on CO line items (string JSON from DB or object). */
const parseCoItemMetadataObject = (item: any): Record<string, any> => {
  const m = item?.metadata
  if (m && typeof m === 'object' && !Array.isArray(m)) return m as Record<string, any>
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

/**
 * JSONB approval UUID arrays sometimes arrive as a JSON string, or only under metadata.
 * Align with form (`approval_checks`) and DB column (`approval_checks_uuids`).
 */
const normalizeCoItemApprovalUuidArray = (item: any, meta: Record<string, any>): string[] => {
  const coerce = (v: any): string[] => {
    if (v == null) return []
    if (Array.isArray(v)) {
      return v
        .map((x: any) => {
          if (typeof x === 'string') return x
          if (x && typeof x === 'object') return String(x.uuid || x.id || '')
          return ''
        })
        .map((x) => String(x).trim())
        .filter(Boolean)
    }
    if (typeof v === 'string') {
      const t = v.trim()
      if (!t) return []
      try {
        const p = JSON.parse(t)
        if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean)
      } catch {
        return []
      }
    }
    return []
  }
  const fromTop = coerce(item?.approval_checks_uuids ?? item?.approval_checks)
  if (fromTop.length) return fromTop
  return coerce(meta?.approval_checks_uuids ?? meta?.approval_checks)
}

const collectApprovalUuidsFromItem = (item: any): string[] => {
  const meta = parseCoItemMetadataObject(item)
  return normalizeCoItemApprovalUuidArray(item, meta)
}

const loadOriginalPoApprovalLookupsForPrint = async (originalPoUuid: string) => {
  poLwmPairApprovalLookup.value = new Map()
  poLwmCostOnlyApprovalLookup.value = new Map()
  if (!originalPoUuid) return
  try {
    const [poFormRes, poItemsRes] = await Promise.all([
      $fetch(`/api/purchase-order-forms/${originalPoUuid}`, { method: 'GET' }) as Promise<any>,
      $fetch(`/api/purchase-order-items?purchase_order_uuid=${originalPoUuid}`, { method: 'GET' }) as Promise<any>,
    ])
    const poLwm = Array.isArray(poFormRes?.data?.po_location_wise_material_items)
      ? poFormRes.data.po_location_wise_material_items
      : []
    const poItems = Array.isArray(poItemsRes?.data) ? poItemsRes.data : []

    const pairMap = new Map<string, string[]>()
    const costSets = new Map<string, Set<string>>()

    const addRow = (row: any) => {
      const uuids = collectApprovalUuidsFromItem(row)
      if (!uuids.length) return
      const cc = String(row.cost_code_uuid || '').toLowerCase()
      if (!cc) return
      const loc = String(row.location_uuid || '').toLowerCase()
      const key = normalizeLwmApprovalKey(cc, loc)
      if (!pairMap.has(key)) pairMap.set(key, [...uuids])
      const set = costSets.get(cc) || new Set<string>()
      uuids.forEach((u: string) => set.add(u))
      costSets.set(cc, set)
    }

    poLwm.forEach(addRow)
    poItems.forEach(addRow)

    poLwmPairApprovalLookup.value = pairMap
    const costOnly = new Map<string, string[]>()
    costSets.forEach((set, cc) => {
      costOnly.set(cc, [...set])
    })
    poLwmCostOnlyApprovalLookup.value = costOnly
  } catch (e) {
    console.error('Failed to load original PO for CO approval checks:', e)
  }
}

/** Collect location UUIDs from CO line rows (including metadata) for refreshing master data from `/api/location`. */
function collectLocationUuidsFromChangeOrder(co: any): string[] {
  const out = new Set<string>()
  const addItem = (item: any) => {
    if (!item || typeof item !== 'object') return
    const u = String(item.location_uuid || '').trim()
    if (u) out.add(u)
    const m = item.metadata
    if (m && typeof m === 'object' && !Array.isArray(m)) {
      const u2 = String((m as any).location_uuid || '').trim()
      if (u2) out.add(u2)
    } else if (typeof m === 'string') {
      try {
        const p = JSON.parse(m)
        if (p && typeof p === 'object' && p.location_uuid) {
          const u3 = String(p.location_uuid).trim()
          if (u3) out.add(u3)
        }
      } catch {
        /* ignore */
      }
    }
  }
  const walk = (arr: any) => {
    if (!Array.isArray(arr)) return
    arr.forEach(addItem)
  }
  walk(co?.co_items)
  walk(co?.co_location_wise_material_items)
  walk(co?.labor_co_items)
  return [...out]
}

const load = async () => {
  error.value = null
  if (props.changeOrder) {
    changeOrderDetail.value = props.changeOrder
    await loadRelatedData()
    emit('preview-ready')
    return
  }
  if (props.changeOrderUuid) {
    await fetchDetail(props.changeOrderUuid)
  }
}

const fetchDetail = async (uuid: string) => {
  loading.value = true
  try {
    const response: any = await $fetch(`/api/change-orders/${uuid}`, { method: 'GET' })
    if (response?.data) {
      changeOrderDetail.value = response.data
      
      const coType = (response.data.co_type || '').toUpperCase()
      if (coType !== 'LABOR') {
        try {
          const itemsResponse: any = await $fetch(`/api/change-order-items?change_order_uuid=${uuid}`, { method: 'GET' })
          if (itemsResponse?.data && Array.isArray(itemsResponse.data)) {
            changeOrderDetail.value.co_items = itemsResponse.data.map((item: any) => {
              const preferredItem = Array.isArray(item.cost_code_preferred_items) 
                ? item.cost_code_preferred_items[0] 
                : item.cost_code_preferred_items;
              const meta =
                item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
                  ? item.metadata
                  : typeof item.metadata === 'string'
                    ? (() => {
                        try {
                          const p = JSON.parse(item.metadata);
                          return p && typeof p === 'object' ? p : {};
                        } catch {
                          return {};
                        }
                      })()
                    : {};
              // Saved CO line description must win over catalog preferred item (same as form display)
              const description =
                item.description ??
                meta?.description ??
                item.item_description ??
                preferredItem?.description ??
                '';

              const approvalUuidList = normalizeCoItemApprovalUuidArray(item, meta)

              return {
                ...item,
                metadata: meta,
                name: item.item_name || item.name || '',
                item_name: item.item_name || item.name || '',
                description: description,
                // Ensure print sees the same UUIDs as the form (JSONB / metadata shapes vary by client)
                approval_checks_uuids: approvalUuidList,
                approval_checks: approvalUuidList,
                unit_uuid: item.unit_uuid ?? item.uom_uuid ?? null,
                unit_label: item.unit_label || item.uom || item.unit || '',
                unit: item.unit_label || item.uom || item.unit || '',
                uom: item.unit_label || item.uom || item.unit || '',
                co_quantity: item.co_quantity ?? item.quantity ?? null,
                co_unit_price: item.co_unit_price ?? item.unit_price ?? null,
                co_total: item.co_total ?? item.total ?? null,
                item_sequence:
                  item.item_sequence ?? meta.item_sequence ?? meta.sequence ?? null,
                sequence: item.sequence ?? meta.sequence ?? meta.item_sequence ?? null,
              };
            })
          } else {
            changeOrderDetail.value.co_items = []
          }
        } catch (itemsError) {
          console.error('Failed to load CO items:', itemsError)
          changeOrderDetail.value.co_items = []
        }
      } else {
        try {
          const laborItemsResponse: any = await $fetch(`/api/labor-change-order-items?change_order_uuid=${uuid}`, { method: 'GET' })
          if (laborItemsResponse?.data && Array.isArray(laborItemsResponse.data)) {
            changeOrderDetail.value.labor_co_items = laborItemsResponse.data
          } else {
            changeOrderDetail.value.labor_co_items = []
          }
        } catch (laborError) {
          console.error('Failed to load labor CO items:', laborError)
          changeOrderDetail.value.labor_co_items = []
        }
      }
      
      await loadRelatedData()
      emit('preview-ready')
    } else {
      throw new Error('Change order not found')
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to load change order'
    emit('preview-error')
  } finally {
    loading.value = false
  }
}

const loadRelatedData = async () => {
  if (!changeOrderDetail.value) return

  const co = changeOrderDetail.value
  customerDetail.value = null
  coMasterSpecByItemUuid.value = new Map()
  coMasterSpecByTypeAndName.value = new Map()

  if (co.vendor_uuid && co.corporation_uuid) {
    try {
      const vendorResponse: any = await $fetch(`/api/purchase-orders/vendors?corporation_uuid=${co.corporation_uuid}`, { method: 'GET' })
      if (vendorResponse?.data && Array.isArray(vendorResponse.data)) {
        const vendor = vendorResponse.data.find((v: any) => v.uuid === co.vendor_uuid)
        if (vendor) {
          vendorDetail.value = vendor
        }
      }
    } catch (e) {
      console.error('Failed to load vendor:', e)
    }
  }

  if (co.project_uuid) {
    try {
      const projectResponse: any = await $fetch(`/api/projects/${co.project_uuid}`, { method: 'GET' })
      if (projectResponse?.data) {
        projectDetail.value = projectResponse.data
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
  }

  if (co.corporation_uuid && co.project_uuid && String(co.co_type || '').toUpperCase() !== 'LABOR') {
    try {
      const prefResponse: any = await $fetch('/api/cost-code-preferred-items', {
        method: 'GET',
        query: {
          corporation_uuid: co.corporation_uuid,
          project_uuid: co.project_uuid,
        },
      })
      const prefRows = Array.isArray(prefResponse?.data) ? prefResponse.data : []
      const byUuid = new Map<string, string>()
      const byTypeName = new Map<string, string>()
      for (const row of prefRows) {
        const seq = String(row?.item_sequence ?? row?.sequence ?? '').trim()
        if (!seq) continue
        const rowUuid = String(row?.uuid || row?.item_uuid || '').trim()
        if (rowUuid && !byUuid.has(rowUuid)) {
          byUuid.set(rowUuid, seq)
        }
        const key = buildCoSpecTypeNameKey(row?.item_type_uuid, row?.item_name || row?.name)
        if (key !== '::' && !byTypeName.has(key)) {
          byTypeName.set(key, seq)
        }
      }
      coMasterSpecByItemUuid.value = byUuid
      coMasterSpecByTypeAndName.value = byTypeName
    } catch (e) {
      console.error('Failed to load preferred items for CO spec print:', e)
    }
  }

  const customerUuid = co.customer_uuid || projectDetail.value?.customer_uuid || null
  if (customerUuid && co.corporation_uuid) {
    try {
      const customersResponse: any = await $fetch(
        `/api/customers?corporation_uuid=${co.corporation_uuid}`,
        { method: 'GET' }
      )
      const customers = Array.isArray(customersResponse?.data) ? customersResponse.data : []
      customerDetail.value = customers.find((c: any) => c?.uuid === customerUuid) || null
    } catch (e) {
      console.error('Failed to load customers:', e)
    }
  }

  if (co.project_uuid) {
    try {
      const addressResponse: any = await $fetch(`/api/projects/addresses?project_uuid=${co.project_uuid}`, { method: 'GET' })
      const list =
        addressResponse?.data && Array.isArray(addressResponse.data) ? addressResponse.data : []

      shippingAddress.value = await resolveShippingAddressForPrint(
        co.project_uuid,
        co.shipping_address_uuid,
        (co as any).shipping_address_custom,
        list
      )

      if (co.billing_address_uuid) {
        const billingResponse: any = await $fetch('/api/projects/addresses', {
          method: 'GET',
          query: {
            project_uuid: co.project_uuid,
            address_uuid: co.billing_address_uuid,
          },
        })
        const billingRows = Array.isArray(billingResponse?.data) ? billingResponse.data : []
        billingAddress.value = billingRows[0] || null
      } else {
        const billingCandidates = list.filter((addr: any) => addr?.address_type === 'bill')
        billingAddress.value =
          billingCandidates.find((addr: any) => addr?.is_primary) ||
          billingCandidates[0] ||
          null
      }

      if (!billingAddress.value) {
        const billingCandidates = list.filter((addr: any) => addr?.address_type === 'bill')
        billingAddress.value =
          billingCandidates.find((addr: any) => addr?.is_primary) ||
          billingCandidates[0] ||
          null
      }
    } catch (e) {
      console.error('Failed to load addresses:', e)
      billingAddress.value = null
    }
  }

  const coType = String(co.co_type || '').toUpperCase()
  const lwm = Array.isArray(co.co_location_wise_material_items) ? co.co_location_wise_material_items : []
  if (coType !== 'LABOR' && lwm.length > 0 && co.original_purchase_order_uuid) {
    await loadOriginalPoApprovalLookupsForPrint(String(co.original_purchase_order_uuid))
  } else {
    poLwmPairApprovalLookup.value = new Map()
    poLwmCostOnlyApprovalLookup.value = new Map()
  }

  if (co.corporation_uuid) {
    try {
      if (approvalChecksStore.approvalChecks.length === 0) {
        await approvalChecksStore.fetchApprovalChecks()
      }
    } catch (e) {
      console.error('Failed to load approval checks:', e)
    }
  }

  if (coType !== 'LABOR' && co.corporation_uuid) {
    try {
      if (uomStore.uom.length === 0) {
        await uomStore.fetchUOM(co.corporation_uuid)
      }
    } catch (e) {
      console.error('Failed to load UOM for print:', e)
    }
  }

  const locationUuidsOnCo = collectLocationUuidsFromChangeOrder(co)
  if (locationUuidsOnCo.length > 0) {
    try {
      await locationsStore.fetchLocations(true)
    } catch (e) {
      console.error('Failed to load locations from API for CO print:', e)
    }
  }

  const siUuid = String(co.special_instruction_uuid || '').trim()
  if (siUuid && co.corporation_uuid) {
    try {
      await specialInstructionsStore.fetchList({
        corporation_uuid: String(co.corporation_uuid),
      })
    } catch (e) {
      console.error('Failed to load special instructions for CO print preview:', e)
    }
  }
}

/** Normalize location-wise row: UOM may live on the row or in `metadata` (saved from CO form). */
const normalizeCoLwmItemForUom = (item: any) => {
  if (!item || typeof item !== 'object') return item
  const meta =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? item.metadata
      : {}
  return {
    ...item,
    unit_uuid: item.unit_uuid ?? item.uom_uuid ?? meta.unit_uuid ?? meta.uom_uuid,
    uom: item.uom ?? meta.uom ?? meta.unit,
    unit_label: item.unit_label ?? item.uom_label ?? meta.unit_label,
    unit: item.unit ?? item.unit_label ?? item.uom ?? meta.unit,
  }
}

const resolveUnitDisplayForCoLwmItem = (item: any) =>
  resolvePrintUomDisplay(normalizeCoLwmItemForUom(item), (uuid) => uomStore.getUOMByUuid(uuid))

const resolveUnitDisplayForCoItem = (item: any) =>
  resolvePrintUomDisplay(item, (uuid) => uomStore.getUOMByUuid(uuid))

const formatAddress = (address: any): string => {
  if (!address) return ''
  const parts = [address.address_line_1, address.address_line_2, address.city, address.state, address.zip_code, address.country].filter(Boolean)
  return parts.join(', ').toUpperCase()
}

const formatQuantity = (qty: any): string => {
  if (qty === null || qty === undefined || qty === '') return ''
  return String(qty)
}

const projectName = computed(() => changeOrderDetail.value?.project_name || projectDetail.value?.project_name || '')
const projectId = computed(() => changeOrderDetail.value?.project_id || projectDetail.value?.project_id || '')

/** Strip `{projectId}-` when present (stored CO/revision values often include project prefix). */
function stripLeadingProjectId(str: string, projectIdStr: string): string {
  const s = String(str || '').trim()
  const pid = String(projectIdStr || '').trim()
  if (!s) return ''
  if (!pid) return s
  const prefix = `${pid}-`
  return s.startsWith(prefix) ? s.slice(prefix.length).trim() : s
}

/**
 * CO # for print: project prefix when suffix-only; revised: full stored number first, then `-R-{revision}`.
 * Matches PurchaseOrderPreview `poNumberDisplay` behavior.
 */
const coNumberDisplay = computed(() => {
  const co = changeOrderDetail.value
  if (!co) return 'N/A'
  const raw = String(co.co_number ?? '').trim()
  if (!raw) return 'N/A'
  const pid = String(projectId.value || co.project_id || '').trim()
  const fullCo =
    pid && !raw.toLowerCase().startsWith(`${pid.toLowerCase()}-`) ? `${pid}-${raw}` : raw

  if (!co.is_revised) return fullCo

  const pidForRev = String(co.project_id || projectDetail.value?.project_id || '').trim()
  const revRaw = String(co.revision_number || '').trim()
  if (!revRaw) return fullCo

  const revPart = stripLeadingProjectId(revRaw, pidForRev)
  if (!revPart) return fullCo

  return `${fullCo}-R-${revPart}`
})

const revisionNumberDisplay = computed(() => {
  const co = changeOrderDetail.value
  if (!co?.is_revised) return ''
  const revRaw = String(co.revision_number || '').trim()
  if (!revRaw) return ''
  const pid = String(co.project_id || projectDetail.value?.project_id || '').trim()
  return stripLeadingProjectId(revRaw, pid)
})

const projectContact = computed(() => {
  const co = changeOrderDetail.value || {}
  const project = projectDetail.value || {}
  const customer = customerDetail.value || {}
  const customerDisplayName =
    customer.customer_name ||
    [customer.salutation, customer.first_name, customer.middle_name, customer.last_name]
      .filter((part: any) => typeof part === 'string' && part.trim() !== '')
      .join(' ')
      .trim() ||
    customer.company_name ||
    customer.name ||
    ''

  return (
    customerDisplayName ||
    co.customer_name ||
    co.project_customer_name ||
    co.client_name ||
    co.project_contact_name ||
    project.customer_name ||
    project.project_customer_name ||
    project.client_name ||
    project.project_contact_name ||
    project.customer?.customer_name ||
    project.customer?.name ||
    ''
  )
})

const quoteReferenceDisplay = computed(() => String(changeOrderDetail.value?.quote_reference || '').trim())

const originalPONumber = computed(() => changeOrderDetail.value?.po_number || '')
const vendorName = computed(() => changeOrderDetail.value?.vendor_name || vendorDetail.value?.vendor_name || '')

const shipToAddress = computed(() => {
  const custom = (changeOrderDetail.value as any)?.shipping_address_custom
  if (custom && String(custom).trim()) {
    return String(custom).toUpperCase()
  }
  return shippingAddress.value ? formatAddress(shippingAddress.value).toUpperCase() : ''
})
const shipToContact = computed(() => shippingAddress.value?.contact_person || '')
const shipToPhone = computed(() => shippingAddress.value?.phone || '')
const shipToFax = computed(() => shippingAddress.value?.fax || '')
const shipToEmail = computed(() => shippingAddress.value?.email || '')

const billingAddressDisplay = computed(() => {
  if (billingAddress.value) {
    return formatAddress(billingAddress.value).toUpperCase()
  }
  return ''
})
const billingContact = computed(() => billingAddress.value?.contact_person || '')
const billingPhone = computed(() => billingAddress.value?.phone || '')
const billingFax = computed(() => billingAddress.value?.fax || '')
const billingEmail = computed(() => billingAddress.value?.email || '')

const vendorAddressDisplay = computed(() => {
  if (!vendorDetail.value) return ''
  const parts = [
    vendorDetail.value.vendor_address,
    vendorDetail.value.vendor_city,
    vendorDetail.value.vendor_state,
    vendorDetail.value.vendor_zip,
    vendorDetail.value.vendor_country
  ].filter(Boolean)
  return parts.join(', ').toUpperCase()
})
const vendorPhone = computed(() => vendorDetail.value?.vendor_phone || '')
const vendorFax = computed(() => vendorDetail.value?.vendor_fax || '')
const vendorContactName = computed(() => vendorDetail.value?.vendor_contact_name || '')
const vendorEmail = computed(() => vendorDetail.value?.vendor_email || '')

const vendorAddresses = computed(() => normalizeVendorAddresses(vendorDetail.value?.vendor_addresses))
const sourceVendorAddress = computed(() => getVendorAddressByType(vendorAddresses.value, 'source'))
const manufacturingVendorAddress = computed(() =>
  getVendorAddressByType(vendorAddresses.value, 'manufacturing')
)

const formatVendorAddressRecord = (address: any): string => {
  if (!address || typeof address !== 'object') return ''
  return [address.address, address.city, address.stateName, address.zipCode, address.countryName]
    .filter(Boolean)
    .join(', ')
    .toUpperCase()
}

const sourceAddressDisplay = computed(() => {
  const typed = formatVendorAddressRecord(sourceVendorAddress.value)
  return typed || vendorAddressDisplay.value
})
const sourcePhone = computed(() => sourceVendorAddress.value?.mobileNum || vendorPhone.value)
const sourceFax = computed(() => sourceVendorAddress.value?.faxNum || vendorFax.value)
const sourceContactName = computed(
  () => sourceVendorAddress.value?.addressName || vendorContactName.value
)
const sourceEmail = computed(() => sourceVendorAddress.value?.emailID || vendorEmail.value)

const manufacturingAddressDisplay = computed(() => {
  const typed = formatVendorAddressRecord(manufacturingVendorAddress.value)
  return typed || vendorAddressDisplay.value
})
const manufacturingPhone = computed(
  () => manufacturingVendorAddress.value?.mobileNum || vendorPhone.value
)
const manufacturingFax = computed(() => manufacturingVendorAddress.value?.faxNum || vendorFax.value)
const manufacturingContactName = computed(
  () => manufacturingVendorAddress.value?.addressName || vendorContactName.value
)
const manufacturingEmail = computed(() => manufacturingVendorAddress.value?.emailID || vendorEmail.value)

const preparedByName = computed(() => {
  if (!changeOrderDetail.value) return ''
  const explicitPreparedBy = String(changeOrderDetail.value.prepared_by || '').trim()
  if (explicitPreparedBy) {
    return sanitizePrintAuditPersonLabel(explicitPreparedBy)
  }
  if (changeOrderDetail.value.audit_log && Array.isArray(changeOrderDetail.value.audit_log)) {
    const allEntries = changeOrderDetail.value.audit_log
      .filter((log: any) => log.timestamp && (log.action === 'created' || log.action === 'updated'))
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (allEntries.length > 0) {
      const mostRecent = allEntries[0]
      if (mostRecent.user_uuid) {
        const user = userProfilesStore.users.find((u) => u.id === mostRecent.user_uuid)
        if (user) {
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          if (fullName) return sanitizePrintAuditPersonLabel(fullName)
        }
      }
      return sanitizePrintAuditPersonLabel(
        mostRecent.user_name || mostRecent.user_email || ''
      )
    }
  }
  const userId = changeOrderDetail.value.updated_by || changeOrderDetail.value.created_by
  if (userId) {
    const user = userProfilesStore.users.find((u) => u.id === userId)
    if (user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      if (fullName) return sanitizePrintAuditPersonLabel(fullName)
    }
  }
  return ''
})

const isLaborCO = computed(() => (changeOrderDetail.value?.co_type || '').toUpperCase() === 'LABOR')

const coItems = computed(() => {
  if (!changeOrderDetail.value) return []
  const items = Array.isArray(changeOrderDetail.value.co_items) ? changeOrderDetail.value.co_items : []
  const removed = Array.isArray(changeOrderDetail.value.removed_co_items) ? changeOrderDetail.value.removed_co_items : []
  if (!removed.length) return items

  const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase()
  const buildRowKey = (item: any) => {
    const itemUuid = normalize(item?.item_uuid)
    const costCodeUuid = normalize(item?.cost_code_uuid)
    const locationUuid = normalize(item?.location_uuid)
    if (itemUuid && costCodeUuid) {
      return `${itemUuid}::${costCodeUuid}::${locationUuid}`
    }
    return ''
  }

  const removedRowKeys = new Set<string>()
  const removedIdKeys = new Set<string>()

  removed.forEach((item: any) => {
    const rowKey = buildRowKey(item)
    if (rowKey) removedRowKeys.add(rowKey)
    const idKey = normalize(item?.uuid || item?.id)
    if (idKey) removedIdKeys.add(idKey)
  })

  return items.filter((item: any) => {
    const rowKey = buildRowKey(item)
    if (rowKey && removedRowKeys.has(rowKey)) return false
    const idKey = normalize(item?.uuid || item?.id)
    if (idKey && removedIdKeys.has(idKey)) return false
    return true
  })
})

const laborItems = computed(() => {
  if (!changeOrderDetail.value) return []
  return Array.isArray(changeOrderDetail.value.labor_co_items) ? changeOrderDetail.value.labor_co_items : []
})

const showLaborLocationColumns = computed(() => {
  const co = changeOrderDetail.value || {}
  const fromProject =
    projectDetail.value?.enable_location_wise ??
    projectDetail.value?.project_enable_location_wise
  const fromCo =
    co.enable_location_wise ??
    co.project_enable_location_wise ??
    co.project?.enable_location_wise
  return Boolean(fromProject ?? fromCo)
})

const locationWiseMaterialItems = computed(() => {
  if (!changeOrderDetail.value) return []
  return Array.isArray(changeOrderDetail.value.co_location_wise_material_items) ? changeOrderDetail.value.co_location_wise_material_items : []
})

const hasLocationWiseMaterialItems = computed(() => locationWiseMaterialItems.value.length > 0)

const showLocationWiseMaterialSection = computed(() => {
  return !isLaborCO.value && coItems.value.length === 0 && hasLocationWiseMaterialItems.value
})

const locationWiseMaterialTotal = computed(() => {
  return locationWiseMaterialItems.value.reduce((sum: number, item: any) => sum + (parseFloat(item.co_amount) || 0), 0)
})

const looksLikeLocationUuid = (value: unknown) => {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

const pickTrim = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

const resolveLocationName = (item: any): string => {
  const meta = parseMetadataObject(item)
  const dm =
    item?.display_metadata && typeof item.display_metadata === 'object' && !Array.isArray(item.display_metadata)
      ? item.display_metadata
      : {}

  const candidates = [
    pickTrim(item?.location_label),
    pickTrim(item?.location),
    pickTrim(dm.location_display),
    pickTrim(meta.location_display),
    pickTrim(meta.location_name),
    pickTrim(meta.location_label),
  ]

  for (const c of candidates) {
    if (c && !looksLikeLocationUuid(c)) return c
  }

  const uuid = String(item?.location_uuid || meta?.location_uuid || '').trim()
  if (uuid) {
    const byGetter =
      typeof locationsStore.getByUuid === 'function' ? locationsStore.getByUuid(uuid) : null
    const n = pickTrim(byGetter?.location_name)
    if (n) return n
    const loc = (locationsStore.locations || []).find((l: any) => l.uuid === uuid)
    return pickTrim(loc?.location_name)
  }
  return ''
}

const resolveLaborLocationName = (item: any): string => {
  const meta = parseMetadataObject(item)
  const dm =
    item?.display_metadata && typeof item.display_metadata === 'object' && !Array.isArray(item.display_metadata)
      ? item.display_metadata
      : {}

  const candidates = [
    pickTrim(item?.location_label),
    pickTrim(item?.location),
    pickTrim(dm.location_display),
    pickTrim(meta.location_label),
    pickTrim(meta.location_name),
    pickTrim(meta.location_display),
  ]

  for (const c of candidates) {
    if (c && !looksLikeLocationUuid(c)) return c
  }

  const uuid = String(item?.location_uuid || meta?.location_uuid || '').trim()
  if (!uuid) return ''
  const byGetter =
    typeof locationsStore.getByUuid === 'function' ? locationsStore.getByUuid(uuid) : null
  const n = pickTrim(byGetter?.location_name)
  if (n) return n
  const loc = (locationsStore.locations || []).find((l: any) => l.uuid === uuid)
  return pickTrim(loc?.location_name)
}

const resolveLaborDescription = (item: any): string => {
  const meta = parseMetadataObject(item)
  return String(item?.description ?? meta?.description ?? '').trim()
}

const parseMetadataObject = (item: any): Record<string, any> => {
  const m = item?.metadata
  if (m && typeof m === 'object' && !Array.isArray(m)) return m as Record<string, any>
  if (typeof m === 'string') {
    try {
      const p = JSON.parse(m)
      return p && typeof p === 'object' && !Array.isArray(p) ? p : {}
    } catch {
      return {}
    }
  }
  return {}
}

const resolveItemSequence = (item: any): string => {
  const meta = parseMetadataObject(item)
  const dm =
    item?.display_metadata && typeof item.display_metadata === 'object' && !Array.isArray(item.display_metadata)
      ? (item.display_metadata as Record<string, any>)
      : {}
  const nestedDm =
    meta.display_metadata && typeof meta.display_metadata === 'object' && !Array.isArray(meta.display_metadata)
      ? (meta.display_metadata as Record<string, any>)
      : {}
  const raw =
    item?.item_sequence ??
    item?.sequence ??
    item?.spec ??
    meta?.item_sequence ??
    meta?.sequence ??
    meta?.spec ??
    nestedDm?.item_sequence ??
    nestedDm?.sequence ??
    dm?.item_sequence ??
    dm?.sequence ??
    dm?.spec ??
    ''

  if (raw === null || raw === undefined) return ''
  const value = String(raw).trim()
  if (value) return value

  const byUuid = coMasterSpecByItemUuid.value.get(String(item?.item_uuid || '').trim())
  if (byUuid) return byUuid
  const byTypeName = coMasterSpecByTypeAndName.value.get(
    buildCoSpecTypeNameKey(item?.item_type_uuid, item?.item_name || item?.name)
  )
  if (byTypeName) return byTypeName

  return ''
}

const lwmFallbackApprovalUuids = (item: any): string[] => {
  const cc = String(item?.cost_code_uuid || '').toLowerCase()
  if (!cc) return []
  const loc = String(item?.location_uuid || '').toLowerCase()
  const key = normalizeLwmApprovalKey(cc, loc)
  const fromPair = poLwmPairApprovalLookup.value.get(key)
  if (fromPair && fromPair.length) return fromPair
  return poLwmCostOnlyApprovalLookup.value.get(cc) || []
}

const resolveItemApprovalChecks = (item: any): string => {
  let uuids = collectApprovalUuidsFromItem(item)
  if (uuids.length === 0 && hasLocationWiseMaterialItems.value) {
    uuids = lwmFallbackApprovalUuids(item)
  }
  if (!Array.isArray(uuids) || uuids.length === 0) return ''
  if (approvalChecksStore.approvalChecks.length === 0) {
    void approvalChecksStore.fetchApprovalChecks()
  }
  return uuids
    .map((uuid: string) => {
      const ac = approvalChecksStore.getApprovalCheckByUuid(uuid)
      return ac?.approval_check || null
    })
    .filter((name: string | null): name is string => name !== null)
    .join(', ')
}

const approvalChecksForPrint = computed(() => {
  const checks = approvalChecksStore.approvalChecks || []
  return checks
    .filter((c: any) => c?.active !== false && c?.uuid)
    .map((c: any) => ({ uuid: c.uuid, approval_check: c.approval_check || '' }))
})

/** Active corporation approval checks that are selected on this CO line (print: omit unchecked). Parity with PurchaseOrderPreview. */
const selectedApprovalChecksForPrint = (item: any) => {
  return approvalChecksForPrint.value.filter((c: { uuid: string }) =>
    isApprovalCheckSelected(item, c.uuid),
  )
}

const getItemApprovalCheckUuids = (item: any): string[] => {
  let uuids = collectApprovalUuidsFromItem(item)
  if (uuids.length === 0 && hasLocationWiseMaterialItems.value) {
    uuids = lwmFallbackApprovalUuids(item)
  }
  return uuids.map((v: any) => String(v)).filter(Boolean)
}

const isApprovalCheckSelected = (item: any, checkUuid: string): boolean => {
  return getItemApprovalCheckUuids(item).includes(String(checkUuid))
}

const formatPrintDescription = (value: any): string => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const normalized = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
  return normalized.replace(/\n{3,}/g, '\n\n').trim()
}

const coItemTotal = computed(() => {
  if (isLaborCO.value) {
    return laborItems.value.reduce((sum: number, item: any) => sum + (parseFloat(item.co_amount) || 0), 0)
  }
  if (hasLocationWiseMaterialItems.value) {
    return locationWiseMaterialTotal.value
  }
  return coItems.value.reduce((sum: number, item: any) => sum + (parseFloat(item.co_total) || 0), 0)
})

const laborTotal = computed(() => laborItems.value.reduce((sum: number, item: any) => sum + (parseFloat(item.co_amount) || 0), 0))

const getFinancialValue = (path: string, fallbackPath?: string): number => {
  const co = changeOrderDetail.value
  if (!co) return 0
  const breakdown = co.financial_breakdown
  if (breakdown && typeof breakdown === 'object') {
    const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], breakdown)
    if (value !== null && value !== undefined) return parseFloat(value) || 0
  }
  const directValue = fallbackPath ? co[fallbackPath] : co[path]
  return parseFloat(directValue) || 0
}

const freightChargesAmount = computed(() => getFinancialValue('charges.freight.amount', 'freight_charges_amount'))
const packingChargesAmount = computed(() => getFinancialValue('charges.packing.amount', 'packing_charges_amount'))
const customDutiesAmount = computed(() => getFinancialValue('charges.custom_duties.amount', 'custom_duties_charges_amount'))
const otherChargesAmount = computed(() => getFinancialValue('charges.other.amount', 'other_charges_amount'))
const salesTax1Amount = computed(() => getFinancialValue('sales_taxes.sales_tax_1.amount', 'sales_tax_1_amount'))
const salesTax2Amount = computed(() => getFinancialValue('sales_taxes.sales_tax_2.amount', 'sales_tax_2_amount'))

const chargesTotal = computed(() => {
  const co = changeOrderDetail.value
  if (!co) return 0
  const breakdown = co.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.charges_total) return parseFloat(breakdown.totals.charges_total) || 0
  const directTotal = parseFloat(co.charges_total) || 0
  if (directTotal > 0) return directTotal
  return freightChargesAmount.value + packingChargesAmount.value + customDutiesAmount.value + otherChargesAmount.value
})

const taxTotal = computed(() => {
  const co = changeOrderDetail.value
  if (!co) return 0
  const breakdown = co.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.tax_total) return parseFloat(breakdown.totals.tax_total) || 0
  const directTotal = parseFloat(co.tax_total) || 0
  if (directTotal > 0) return directTotal
  return salesTax1Amount.value + salesTax2Amount.value
})

const calculatedCOTotal = computed(() => coItemTotal.value + chargesTotal.value + taxTotal.value)

const coTotal = computed(() => {
  const co = changeOrderDetail.value
  if (!co) return 0
  const breakdown = co.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.total_co_amount) {
    const storedTotal = parseFloat(breakdown.totals.total_co_amount) || 0
    if (storedTotal > 0) return storedTotal
  }
  const directTotal = parseFloat(co.total_co_amount) || 0
  if (directTotal > 0) return directTotal
  return calculatedCOTotal.value
})

const freightDisplay = computed(() => {
  const co = changeOrderDetail.value
  if (!co) return ''
  if (co.freight && String(co.freight).trim() !== '') return co.freight
  if (co.freight_uuid) {
    const freightRecord = freightStore.getFreightByUuid(String(co.freight_uuid))
    if (freightRecord?.ship_via) return freightRecord.ship_via
  }
  return ''
})

const termsDisplay = computed(() => {
  const co = changeOrderDetail.value
  if (!co || !co.credit_days) return ''
  const creditDays = String(co.credit_days).toUpperCase()
  const termsMap: Record<string, string> = { 'NET_15': 'Net 15', 'NET_25': 'Net 25', 'NET_30': 'Net 30', 'NET_45': 'Net 45', 'NET_60': 'Net 60' }
  return termsMap[creditDays] || creditDays.replace(/_/g, ' ')
})

const shippingInstructionsDisplay = computed(() => changeOrderDetail.value?.shipping_instructions || '')
const deliveryDateDisplay = computed(() =>
  changeOrderDetail.value?.estimated_delivery_date
    ? formatCoEstimatedDeliveryForPrint(changeOrderDetail.value.estimated_delivery_date)
    : ''
)
const currencyDisplay = computed(() => currencyCode.value || 'USD')

const selectedTermsAndCondition = computed(() => {
  if (!changeOrderDetail.value?.terms_and_conditions_uuid) return null
  if (termsAndConditionsStore.termsAndConditions.length === 0) termsAndConditionsStore.fetchTermsAndConditions()
  return termsAndConditionsStore.getTermsAndConditionById(changeOrderDetail.value.terms_and_conditions_uuid) || null
})

const selectedSpecialInstruction = computed(() => {
  const uuid = changeOrderDetail.value?.special_instruction_uuid
  if (!uuid) return null
  const list = specialInstructionsStore.items
  if (!Array.isArray(list) || list.length === 0) return null
  return list.find((x) => String(x.uuid) === String(uuid)) ?? null
})

const mostRecentApproval = computed(() => {
  if (!changeOrderDetail.value?.audit_log) return null
  const auditLog = Array.isArray(changeOrderDetail.value.audit_log) ? changeOrderDetail.value.audit_log : []
  const approvalEntries = auditLog.filter((log: any) => log.action === 'approved' && log.timestamp)
  if (approvalEntries.length === 0) return null
  return approvalEntries.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
})

const approvedByName = computed(() => {
  const approval = mostRecentApproval.value
  if (!approval) return ''
  if (approval.user_uuid) {
    const user = userProfilesStore.users.find((u) => u.id === approval.user_uuid)
    if (user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      if (fullName) return sanitizePrintAuditPersonLabel(fullName)
    }
  }
  return sanitizePrintAuditPersonLabel(
    approval.user_name || approval.user_email || ''
  )
})

/** CO-level override of corporation `po_print_approved_by_vendor` when boolean; null/undefined uses corporation setting. */
const showApprovedByVendorOnPrint = computed(() => {
  const co = changeOrderDetail.value
  const v = co?.print_include_approved_by_vendor
  if (v === true || v === false) return v
  return appSettingsStore.poPrintApprovedByVendor
})

// Show corporation name only when "Use Entity Name" is enabled; otherwise show the most recent approver person name.
const approvedByDisplay = computed(() => {
  const co = changeOrderDetail.value
  const override = co?.print_use_entity_name
  const fromCorp = appSettingsStore.poUseEntityName
  const effectiveEntity =
    override === true || override === false ? override : fromCorp
  const useEntity = effectiveEntity
  if (useEntity) {
    const fromRecord = String(
      changeOrderDetail.value?.corporation_name ?? ''
    ).trim()
    if (fromRecord) return fromRecord
    const corpUuid = changeOrderDetail.value?.corporation_uuid
    if (corpUuid) {
      const corp = corporationStore.corporations.find((c: any) => c.uuid === corpUuid)
      if (corp?.corporation_name) return corp.corporation_name
    }
    return corporationStore.selectedCorporation?.corporation_name || ''
  }
  return approvedByName.value
})

const approvedByDate = computed(() => {
  const approval = mostRecentApproval.value
  if (!approval || !approval.timestamp) return ''
  return formatDate(approval.timestamp)
})

watch(() => [props.changeOrder, props.changeOrderUuid], () => {
  load()
}, { immediate: true })

onMounted(async () => {
  if (userProfilesStore.users.length === 0) {
    try { await userProfilesStore.fetchUsers() } catch (e) { /* silent */ }
  }
  if (freightStore.freight.length === 0) {
    try { await freightStore.fetchFreight() } catch (e) { /* silent */ }
  }
  if (!appSettingsStore.settings) {
    try { await appSettingsStore.fetchSettings() } catch (e) { /* silent */ }
  }
  if (corporationStore.corporations.length === 0) {
    try { await corporationStore.fetchCorporations() } catch (e) { /* silent */ }
  }
  if (termsAndConditionsStore.termsAndConditions.length === 0) {
    try { await termsAndConditionsStore.fetchTermsAndConditions() } catch (e) { /* silent */ }
  }
  if (!changeOrderDetail.value) load()
})
</script>

<style scoped>
@media print {
  * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  table {
    page-break-inside: avoid;
  }
  .space-y-4 > * + * {
    margin-top: 0.5rem !important;
  }
  .space-y-2 > * + * {
    margin-top: 0.25rem !important;
  }
  .space-y-1 > * + * {
    margin-top: 0.125rem !important;
  }
  .border {
    border-width: 0.5px !important;
  }
  .border-2 {
    border-width: 1px !important;
  }
}
</style>
