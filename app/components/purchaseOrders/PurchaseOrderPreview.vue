<template>
  <div
    class="space-y-3 print:space-y-1.5 min-h-0 h-full max-h-full overflow-y-auto print:overflow-visible print:h-auto print:max-h-none"
  >
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading purchase order...</p>
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

    <div v-else-if="purchaseOrderDetail" class="print:p-4 print:space-y-2">
      <!-- Header Section -->
      <div class="mb-3 print:mb-2">
        <div class="text-center mb-2 print:mb-1">
          <h1 class="text-xl print:text-lg font-bold text-gray-900">{{ purchaseOrderDetail.is_revised ? 'REVISED PURCHASE ORDER' : 'PURCHASE ORDER' }}</h1>
          <div class="flex items-baseline justify-center gap-1.5 mt-0.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">PO # :</div>
            <div class="text-base print:text-sm font-mono">{{ poNumberDisplay }}</div>
          </div>
        </div>

        <div class="flex justify-end mb-3 print:mb-2">
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">Submit Date :</div>
            <div class="text-base print:text-sm">{{ formatDate(purchaseOrderDetail.entry_date) }}</div>
          </div>
        </div>

        <!-- Revision Details (shown when PO is revised) -->
        <div v-if="purchaseOrderDetail.is_revised" class="mb-3 print:mb-2 border border-red-300 bg-red-50 rounded p-2.5 print:p-1.5 space-y-1 print:space-y-0.5">
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Original Submit Date :</div>
            <div class="text-sm print:text-xs text-red-900">{{ formatDate(purchaseOrderDetail.entry_date) }}</div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Revision Submission Date :</div>
            <div class="text-sm print:text-xs text-red-900">{{ formatDate(purchaseOrderDetail.revision_date) }}</div>
          </div>
          <div v-if="purchaseOrderDetail.revision_notes" class="flex items-baseline gap-1.5">
            <div class="text-xs print:text-[10px] font-semibold text-red-800">Revision Notes :</div>
            <div class="text-sm print:text-xs text-red-900">{{ purchaseOrderDetail.revision_notes }}</div>
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
          </div>
          <div v-if="quoteReferenceDisplay" class="flex items-baseline gap-1.5 text-right shrink-0">
            <div class="text-xs print:text-[10px] font-semibold text-gray-700">Quote Reference :</div>
            <div class="text-sm print:text-xs">{{ quoteReferenceDisplay }}</div>
          </div>
        </div>
      </div>

      <!-- Source & Manufacturer (Material PO only) — above Ship to / Vendor -->
      <div v-if="!isLaborPO" class="grid grid-cols-2 gap-3 print:gap-2 mb-3 print:mb-2">
        <div class="border border-gray-300 rounded p-2 print:p-1.5">
          <h3 class="text-xs print:text-[10px] font-bold text-gray-900 mb-1.5 print:mb-1 uppercase">Source Address</h3>
          <div class="space-y-1 print:space-y-0.5 text-xs print:text-[10px]">
            <!-- Same layout as Vendor Address: name, then street/city line(s), then phone/fax/contact/email -->
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

      <!-- Labor PO: Project + Ship To (row 1), Vendor (row 2) -->
      <div v-if="isLaborPO" class="space-y-3 print:space-y-2 mb-3 print:mb-2">
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

      <!-- Material PO: Ship to + Billing -->
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

      <!-- Freight/Terms/Shipping Instructions/Delivery Date/Currency Table (Material PO only) -->
      <div v-if="!isLaborPO" class="mt-3 print:mt-2 mb-3 print:mb-2">
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

      <!-- Labor PO Items Section -->
      <div v-if="isLaborPO && laborItems.length > 0" class="mt-3 print:mt-2">
        <h3 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">Labor PO Items</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Cost Code</th>
              <th
                v-if="showLaborLocationColumn"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Location
              </th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Description</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">PO Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in laborItems" :key="index">
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.cost_code_label || `${item.cost_code_number} ${item.cost_code_name}`.trim() }}</td>
              <td
                v-if="showLaborLocationColumn"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
              >
                {{ resolveLocationName(item) }}
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">
                {{ item.description || '' }}
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(item.po_amount || 0) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td
                :colspan="showLaborLocationColumn ? 3 : 2"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold"
              >
                Total PO Amount:
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(laborTotal) }}</td>
            </tr>
          </tfoot>
        </table>
        
        <!-- PO Total Breakdown for Labor PO -->
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
                <span class="text-gray-900">PO Total:</span>
                <span class="font-mono">{{ formatCurrency(poTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Location-wise Material PO Items Section -->
      <div v-if="!isLaborPO && showLocationWiseMaterialSection" class="mt-3 print:mt-2">
        <h3 class="text-base print:text-sm font-bold text-gray-900 mb-2 print:mb-1.5">Material PO Items (Location-wise)</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Cost Code</th>
              <th
                v-if="showLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold"
              >
                Location
              </th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Description</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">UOM</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold">PO Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="locationWiseMaterialItems.length === 0">
              <td
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
                :colspan="showLocationColumns ? 5 : 4"
              ></td>
            </tr>
            <tr v-for="(item, index) in locationWiseMaterialItems" :key="index">
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.cost_code_label || `${item.cost_code_number || ''} ${item.cost_code_name || ''}`.trim() || '' }}</td>
              <td
                v-if="showLocationColumns"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
              >
                {{ resolveLocationName(item) }}
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.description || '' }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px]">{{ resolveUnitDisplayForPoLwmItem(item) }}</td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(item.po_amount || 0) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50">
              <td
                :colspan="showLocationColumns ? 4 : 3"
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-semibold"
              >
                Total:
              </td>
              <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ formatCurrency(locationWiseMaterialTotal) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- PO Items Section (Item-wise) -->
      <div v-else-if="!isLaborPO" class="mt-3 print:mt-2">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Item Name</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">SPEC</th>
              <th class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px] font-semibold">Description</th>
              <th
                v-if="showLocationColumns"
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
            <tr v-if="poItems.length === 0">
              <td
                class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]"
                :colspan="showLocationColumns ? 8 : 7"
              ></td>
            </tr>
            <template v-for="(item, index) in poItems" :key="index">
              <tr>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ item.name || item.item_name || '' }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px]">{{ resolveItemSequence(item) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] align-top">
                  <div class="whitespace-pre-line">{{ formatPrintDescription(item.description) }}</div>
                </td>
                <td
                  v-if="showLocationColumns"
                  class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-xs print:text-[10px] align-middle"
                >
                  {{ resolveLocationName(item) }}
                </td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono">{{ item.po_unit_price ? formatCurrency(item.po_unit_price) : '' }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-left text-xs print:text-[10px]">{{ resolveUnitDisplayForPoItem(item) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px]">{{ formatQuantity(item.po_quantity) }}</td>
                <td class="border border-gray-300 px-2 print:px-1 py-1 print:py-0.5 text-right text-xs print:text-[10px] font-mono font-semibold">{{ item.po_total ? formatCurrency(item.po_total) : '' }}</td>
              </tr>
              <tr v-if="selectedApprovalChecksForPrint(item).length > 0">
                <td class="border border-gray-300"></td>
                <td class="border border-gray-300"></td>
                <td
                  :colspan="showLocationColumns ? 6 : 5"
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

      <!-- PO Total Breakdown (for Material PO - both item-wise and location-wise) -->
      <div v-if="!isLaborPO" class="mt-2 print:mt-1.5 flex justify-end">
          <div class="w-full max-w-md border border-gray-300 rounded p-2 print:p-1.5">
            <div class="space-y-1 print:space-y-0.5">
              <!-- Item Total -->
              <div class="flex justify-between text-xs print:text-[10px]">
                <span class="font-semibold text-gray-700">Item Total:</span>
                <span class="font-mono">{{ formatCurrency(itemTotal) }}</span>
              </div>
              
              <!-- Charges Breakdown -->
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
              
              <!-- Tax Breakdown -->
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
              
              <!-- Total PO Amount -->
              <div class="flex justify-between text-sm print:text-xs font-bold border-t-2 border-gray-400 pt-1 print:pt-0.5 mt-1 print:mt-0.5">
                <span class="text-gray-900">PO Total:</span>
                <span class="font-mono">{{ formatCurrency(poTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

      <!-- Approvals Section -->
      <div class="mt-4 print:mt-3">
        <!-- Header -->
        <div class="flex justify-between items-center mb-2 print:mb-1.5">
          <h2 class="text-base print:text-sm font-bold text-gray-900">APPROVALS</h2>
          <div class="text-xs print:text-[10px] font-semibold text-gray-900">
            APPROVED FOR PO Total : <span class="font-mono">{{ formatCurrency(poTotal) }}</span>
          </div>
        </div>

        <!-- Approvals Content -->
        <div class="grid grid-cols-2 gap-4 print:gap-3">
          <!-- Left Column: APPROVED BY -->
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

          <!-- Right Column: APPROVED BY VENDOR (PO override or corporation setting) -->
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
import { useShipViaStore } from '~/stores/freight'
// userProfiles store not available - simplified
import { useApprovalChecksStore } from '~/stores/approvalChecks'
import { useAppSettingsStore } from '~/stores/corporationSettings'
import { useLocationsStore } from '~/stores/locations'
import {
  resolveShippingAddressForPrint,
} from '~/composables/useProjectAddressForPrint'
import { sanitizePrintAuditPersonLabel } from '~/utils/printAuditDisplay'
import { resolvePrintUomDisplay } from '~/utils/printUomDisplay'
import { normalizeVendorAddresses, getVendorAddressByType } from '~/utils/vendorAddresses'
import {
  getPoFinancialValue,
  normalizeLocationWiseMaterialItems,
  resolveFreightDisplayLabel,
  resolveFreightUuidFromPo,
  resolveShipViaUuidFromPo,
  trimDisplayStr,
} from '~/utils/purchaseOrderPreviewDisplay'
import { authenticatedFetch } from '~/utils/authenticatedFetch'
import { useUOMStore } from '~/stores/uom'

interface Props {
  purchaseOrder?: any
  purchaseOrderUuid?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'preview-ready': []
  'preview-error': []
}>()

const { formatDate, formatPoEstimatedDeliveryForPrint } = useDateFormat()
const { formatCurrency, currencyCode } = useCurrencyFormat()
const corporationStore = useCorporationStore()
const termsAndConditionsStore = useTermsAndConditionsStore()
const specialInstructionsStore = useSpecialInstructionsStore()
const freightStore = useFreightStore()
const shipViaStore = useShipViaStore()
const approvalChecksStore = useApprovalChecksStore()
const appSettingsStore = useAppSettingsStore()
const locationsStore = useLocationsStore()
const uomStore = useUOMStore()
const runtimeConfig = useRuntimeConfig()

const loading = ref(false)
const error = ref<string | null>(null)
const purchaseOrderDetail = ref<any | null>(null)
const vendorDetail = ref<any | null>(null)
const projectDetail = ref<any | null>(null)
const customerDetail = ref<any | null>(null)
const shippingAddress = ref<any | null>(null)
const billingAddress = ref<any | null>(null)
const masterSpecByItemUuid = ref<Map<string, string>>(new Map())
const masterSpecByTypeAndName = ref<Map<string, string>>(new Map())

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase()
const buildTypeNameKey = (itemTypeUuid: unknown, itemName: unknown) =>
  `${normalizeText(itemTypeUuid)}::${normalizeText(itemName)}`

const load = async () => {
  error.value = null
  if (props.purchaseOrder) {
    purchaseOrderDetail.value = props.purchaseOrder
    await loadRelatedData()
    emit('preview-ready')
    return
  }
  if (props.purchaseOrderUuid) {
    await fetchDetail(props.purchaseOrderUuid)
  }
}

const fetchDetail = async (uuid: string) => {
  loading.value = true
  try {
    const response: any = await authenticatedFetch(`/api/purchase-order-forms/${uuid}`, { method: 'GET' })
    if (response?.data) {
      purchaseOrderDetail.value = response.data
      
      // Fetch PO items separately for Material POs (they're not included in the form response)
      const poType = (response.data.po_type || '').toUpperCase()
      if (poType !== 'LABOR') {
        try {
          const itemsResponse: any = await authenticatedFetch(`/api/purchase-order-items?purchase_order_uuid=${uuid}`, { method: 'GET' })
          if (itemsResponse?.data && Array.isArray(itemsResponse.data)) {
            // Map items to ensure all fields are accessible
            purchaseOrderDetail.value.po_items = itemsResponse.data.map((item: any) => {
              // Always prefer saved PO description from purchase_order_items_list.
              // Preferred item description is only a fallback default.
              const preferredItem = Array.isArray(item.cost_code_preferred_items) 
                ? item.cost_code_preferred_items[0] 
                : item.cost_code_preferred_items;
              const description = item.description || item.item_description || preferredItem?.description || '';
              
              return {
                ...item,
                name: item.item_name || item.name || '',
                item_name: item.item_name || item.name || '',
                description: description,
                approval_checks_uuids:
                  (Array.isArray(item.approval_checks_uuids) ? item.approval_checks_uuids : null) ||
                  (Array.isArray(item.approval_checks) ? item.approval_checks : null) ||
                  (Array.isArray(item.metadata?.approval_checks_uuids) ? item.metadata.approval_checks_uuids : null) ||
                  (Array.isArray(item.metadata?.approval_checks) ? item.metadata.approval_checks : null) ||
                  [],
                approval_checks:
                  (Array.isArray(item.approval_checks) ? item.approval_checks : null) ||
                  (Array.isArray(item.approval_checks_uuids) ? item.approval_checks_uuids : null) ||
                  (Array.isArray(item.metadata?.approval_checks) ? item.metadata.approval_checks : null) ||
                  (Array.isArray(item.metadata?.approval_checks_uuids) ? item.metadata.approval_checks_uuids : null) ||
                  [],
                unit_uuid: item.unit_uuid ?? item.uom_uuid ?? null,
                uom: item.unit_label || item.uom || item.unit || '',
                unit_label: item.unit_label || item.uom || item.unit || '',
                unit: item.unit_label || item.uom || item.unit || '',
                po_quantity: item.po_quantity ?? item.quantity ?? null,
                po_unit_price: item.po_unit_price ?? item.unit_price ?? null,
                po_total: item.po_total ?? item.total ?? null,
              };
            })
          } else {
            purchaseOrderDetail.value.po_items = []
          }
        } catch (itemsError) {
          console.error('Failed to load PO items:', itemsError)
          purchaseOrderDetail.value.po_items = []
        }
      } else {
        // For Labor PO, ensure po_items is empty
        purchaseOrderDetail.value.po_items = []
      }
      
      await loadRelatedData()
    } else {
      throw new Error('Purchase order not found')
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to load purchase order'
    emit('preview-error')
  } finally {
    loading.value = false
  }
  if (!error.value && purchaseOrderDetail.value) {
    emit('preview-ready')
  }
}

const loadRelatedData = async () => {
  if (!purchaseOrderDetail.value) return

  const po = purchaseOrderDetail.value
  customerDetail.value = null
  masterSpecByItemUuid.value = new Map()
  masterSpecByTypeAndName.value = new Map()

  // Fetch vendor details - vendors are fetched by corporation_uuid
  if (po.vendor_uuid && po.corporation_uuid) {
    try {
      const vendorResponse: any = await authenticatedFetch(`/api/purchase-orders/vendors?corporation_uuid=${po.corporation_uuid}`, { method: 'GET' })
      if (vendorResponse?.data && Array.isArray(vendorResponse.data)) {
        const vendor = vendorResponse.data.find((v: any) => v.uuid === po.vendor_uuid)
        if (vendor) {
          vendorDetail.value = vendor
        }
      }
    } catch (e) {
      console.error('Failed to load vendor:', e)
    }
  }

  // Fetch project details
  if (po.project_uuid) {
    try {
      const projectResponse: any = await authenticatedFetch(`/api/projects/${po.project_uuid}`, { method: 'GET' })
      if (projectResponse?.data) {
        projectDetail.value = projectResponse.data
      }
    } catch (e) {
      console.error('Failed to load project:', e)
    }
  }

  if (
    String(po.include_items || '').toUpperCase() === 'IMPORT_ITEMS_FROM_MASTER' &&
    po.corporation_uuid &&
    po.project_uuid
  ) {
    try {
      const prefResponse: any = await authenticatedFetch('/api/cost-code-preferred-items', {
        method: 'GET',
        query: {
          corporation_uuid: po.corporation_uuid,
          project_uuid: po.project_uuid,
        },
      })
      const prefRows = Array.isArray(prefResponse?.data) ? prefResponse.data : []
      const byUuid = new Map<string, string>()
      const byTypeName = new Map<string, string>()
      for (const row of prefRows) {
        const seq = String(row?.item_sequence ?? row?.sequence ?? '').trim()
        if (!seq) continue
        const rowUuid = String(row?.uuid || '').trim()
        if (rowUuid && !byUuid.has(rowUuid)) {
          byUuid.set(rowUuid, seq)
        }
        const typeNameKey = buildTypeNameKey(row?.item_type_uuid, row?.item_name)
        if (typeNameKey !== '::' && !byTypeName.has(typeNameKey)) {
          byTypeName.set(typeNameKey, seq)
        }
      }
      masterSpecByItemUuid.value = byUuid
      masterSpecByTypeAndName.value = byTypeName
    } catch (e) {
      console.error('Failed to load preferred items for master spec print:', e)
    }
  }

  // Resolve customer name using the same customer UUID saved at project level.
  const customerUuid = po.customer_uuid || projectDetail.value?.customer_uuid || null
  if (customerUuid && po.corporation_uuid) {
    try {
      // Match ProjectDetailsForm/CustomerSelect behavior: fetch by corporation first.
      // Project-scoped filtering can hide globally scoped customers for that project.
      const customersResponse: any = await authenticatedFetch(
        `/api/customers?corporation_uuid=${po.corporation_uuid}`,
        { method: 'GET' }
      )
      const customers = Array.isArray(customersResponse?.data) ? customersResponse.data : []
      customerDetail.value = customers.find((c: any) => c?.uuid === customerUuid) || null
    } catch (e) {
      console.error('Failed to load customers:', e)
    }
  }

  // Fetch project addresses - active list first; fall back by UUID for inactive (historical POs)
  if (po.project_uuid) {
    try {
      const addressResponse: any = await authenticatedFetch(`/api/projects/addresses?project_uuid=${po.project_uuid}`, { method: 'GET' })
      const list =
        addressResponse?.data && Array.isArray(addressResponse.data) ? addressResponse.data : []

      shippingAddress.value = await resolveShippingAddressForPrint(
        po.project_uuid,
        po.shipping_address_uuid,
        po.shipping_address_custom,
        list
      )
      if (po.billing_address_uuid) {
        const billingResponse: any = await authenticatedFetch('/api/projects/addresses', {
          method: 'GET',
          query: {
            project_uuid: po.project_uuid,
            address_uuid: po.billing_address_uuid,
          },
        })
        const billingRows = Array.isArray(billingResponse?.data) ? billingResponse.data : []
        billingAddress.value = billingRows[0] || null
      } else {
        // Strictly resolve a billing-type project address from API rows only.
        const billingCandidates = list.filter((addr: any) => addr?.address_type === 'bill')
        billingAddress.value =
          billingCandidates.find((addr: any) => addr?.is_primary) ||
          billingCandidates[0] ||
          null
      }

      // If a stored billing UUID is stale/inactive, still fall back only to billing-type rows.
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

  const poType = (po.po_type || '').toUpperCase()
  if (poType !== 'LABOR' && po.corporation_uuid) {
    try {
      if (uomStore.uom.length === 0) {
        await uomStore.fetchUOM(po.corporation_uuid)
      }
    } catch (e) {
      console.error('Failed to load UOM for print:', e)
    }
  }

  // Same `location` table as Location Management — force API so UUID → location_name works for every user (not IndexedDB cache).
  const locationUuidsOnPo = collectLocationUuidsFromPo(po)
  if (locationUuidsOnPo.length > 0) {
    try {
      await locationsStore.fetchLocations(true)
    } catch (e) {
      console.error('Failed to load locations from API for print:', e)
    }
  }

  // Approval checks on line items must resolve from API-backed UUIDs for print accuracy.
  try {
    await approvalChecksStore.fetchApprovalChecks(true)
  } catch (e) {
    console.error('Failed to load approval checks from API for print:', e)
  }

  // Freight / ship-via labels for the summary table: UUID-only rows need a fresh API load when cache is empty.
  if (poType !== 'LABOR') {
    const freightUuid = resolveFreightUuidFromPo(po)
    if (freightUuid && !freightStore.getFreightByUuid(freightUuid)) {
      try {
        await freightStore.fetchFreight()
      } catch (e) {
        console.error('Failed to refresh freight for print:', e)
      }
    }
    const shipViaUuid = resolveShipViaUuidFromPo(po)
    if (shipViaUuid && !shipViaStore.getShipViaByUuid(shipViaUuid)) {
      try {
        await shipViaStore.fetchShipVia()
      } catch (e) {
        console.error('Failed to refresh ship via for print:', e)
      }
    }
  }

  const siUuid = String(po.special_instruction_uuid || '').trim()
  if (siUuid && po.corporation_uuid) {
    try {
      await specialInstructionsStore.fetchList({
        corporation_uuid: String(po.corporation_uuid),
      })
    } catch (e) {
      console.error('Failed to load special instructions for print preview:', e)
    }
  }

}

/** Normalize location-wise row: UOM may live on the row or in `metadata` (saved from PO form). */
const normalizePoLwmItemForUom = (item: any) => {
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

const resolveUnitDisplayForPoLwmItem = (item: any) =>
  resolvePrintUomDisplay(normalizePoLwmItemForUom(item), (uuid) => uomStore.getUOMByUuid(uuid))

const resolveUnitDisplayForPoItem = (item: any) =>
  resolvePrintUomDisplay(item, (uuid) => uomStore.getUOMByUuid(uuid))

const formatAddress = (address: any): string => {
  if (!address) return ''
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.zip_code,
    address.country
  ].filter(Boolean)
  return parts.join(', ').toUpperCase()
}

const formatQuantity = (qty: any): string => {
  if (qty === null || qty === undefined || qty === '') return ''
  return String(qty)
}

const projectName = computed(() => {
  return purchaseOrderDetail.value?.project_name || projectDetail.value?.project_name || ''
})

const projectId = computed(() => {
  return purchaseOrderDetail.value?.project_id || projectDetail.value?.project_id || ''
})

/** Strip `{projectId}-` when present (stored PO/revision values often include project prefix). */
function stripLeadingProjectId(str: string, projectIdStr: string): string {
  const s = String(str || '').trim()
  const pid = String(projectIdStr || '').trim()
  if (!s) return ''
  if (!pid) return s
  const prefix = `${pid}-`
  return s.startsWith(prefix) ? s.slice(prefix.length).trim() : s
}

/**
 * Revised PO print: full stored `po_number` first, then `-R-{revision}` (revision without project-id prefix).
 * Non-revised: plain `po_number`.
 */
const poNumberDisplay = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return 'N/A'
  const rawPo = String(po.po_number || '').trim()
  if (!rawPo) return 'N/A'
  if (!po.is_revised) return rawPo

  const pid = String(po.project_id || projectDetail.value?.project_id || '').trim()
  const revRaw = String(po.revision_number || '').trim()
  if (!revRaw) return rawPo

  const revPart = stripLeadingProjectId(revRaw, pid)
  if (!revPart) return rawPo

  return `${rawPo}-R-${revPart}`
})

const projectContact = computed(() => {
  const po = purchaseOrderDetail.value || {}
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

  // Prefer explicit customer/contact fields from PO payload first, then project payload fallbacks.
  return (
    customerDisplayName ||
    po.customer_name ||
    po.project_customer_name ||
    po.client_name ||
    po.project_contact_name ||
    project.customer_name ||
    project.project_customer_name ||
    project.client_name ||
    project.project_contact_name ||
    project.customer?.customer_name ||
    project.customer?.name ||
    ''
  )
})

const quoteReferenceDisplay = computed(() => {
  return String(purchaseOrderDetail.value?.quote_reference || '').trim()
})

const vendorName = computed(() => {
  return purchaseOrderDetail.value?.vendor_name || vendorDetail.value?.vendor_name || ''
})

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

const shipToAddress = computed(() => {
  if (purchaseOrderDetail.value?.shipping_address_custom) {
    return purchaseOrderDetail.value.shipping_address_custom.toUpperCase()
  }
  if (shippingAddress.value) {
    return formatAddress(shippingAddress.value).toUpperCase()
  }
  return ''
})

const shipToContact = computed(() => {
  return shippingAddress.value?.contact_person || ''
})

const shipToPhone = computed(() => {
  return shippingAddress.value?.phone || ''
})

const shipToFax = computed(() => {
  return shippingAddress.value?.fax || ''
})

const shipToEmail = computed(() => {
  return shippingAddress.value?.email || ''
})

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

// Prepared by - get user who created or last updated the PO
const preparedByName = computed(() => {
  if (!purchaseOrderDetail.value) return ''

  const explicitPreparedBy = String(purchaseOrderDetail.value.prepared_by || '').trim()
  if (explicitPreparedBy) {
    return sanitizePrintAuditPersonLabel(explicitPreparedBy)
  }
  
  // Try to get from audit log (most recent update or creation)
  if (purchaseOrderDetail.value.audit_log && Array.isArray(purchaseOrderDetail.value.audit_log)) {
    const auditLog = purchaseOrderDetail.value.audit_log
    
    // Find most recent entry (created or updated)
    const allEntries = auditLog
      .filter((log: any) => log.timestamp && (log.action === 'created' || log.action === 'updated'))
      .sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeB - timeA
      })
    
    if (allEntries.length > 0) {
      const mostRecent = allEntries[0]
      // Look up user in userProfiles store by UUID to get full name
      if (mostRecent.user_uuid) {
        const user = [].find((u) => u.id === mostRecent.user_uuid)
        if (user) {
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          if (fullName) {
            return sanitizePrintAuditPersonLabel(fullName)
          }
        }
      }
      // Fallback to user_name from audit log, then email
      return sanitizePrintAuditPersonLabel(
        mostRecent.user_name || mostRecent.user_email || ''
      )
    }
  }
  
  // Fallback to created_by or updated_by if available
  const userId = purchaseOrderDetail.value.updated_by || purchaseOrderDetail.value.created_by
  if (userId) {
    const user = [].find((u) => u.id === userId)
    if (user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      if (fullName) {
        return sanitizePrintAuditPersonLabel(fullName)
      }
    }
  }
  
  return ''
})

const isLaborPO = computed(() => {
  const poType = (purchaseOrderDetail.value?.po_type || '').toUpperCase()
  return poType === 'LABOR'
})

const poItems = computed(() => {
  if (!purchaseOrderDetail.value) return []
  const items = Array.isArray(purchaseOrderDetail.value.po_items) 
    ? purchaseOrderDetail.value.po_items 
    : []
  // Filter out removed items
  const removed = Array.isArray(purchaseOrderDetail.value.removed_po_items)
    ? purchaseOrderDetail.value.removed_po_items
    : []
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
  if (!purchaseOrderDetail.value) return []
  return Array.isArray(purchaseOrderDetail.value.labor_po_items)
    ? purchaseOrderDetail.value.labor_po_items
    : []
})

const showLocationColumns = computed(() => {
  const po = purchaseOrderDetail.value || {}
  const fromProject =
    projectDetail.value?.enable_location_wise ??
    projectDetail.value?.project_enable_location_wise
  const fromPo =
    po.enable_location_wise ??
    po.project_enable_location_wise ??
    po.project?.enable_location_wise
  return Boolean(fromProject ?? fromPo)
})

const showLaborLocationColumn = computed(() => showLocationColumns.value)

const locationWiseMaterialItems = computed(() => {
  return normalizeLocationWiseMaterialItems(purchaseOrderDetail.value)
})

const hasLocationWiseMaterialItems = computed(() => {
  return locationWiseMaterialItems.value.length > 0
})

/**
 * Prefer item-wise print table whenever PO line items exist.
 * Location-wise section is a fallback view only when there are no item-wise lines.
 */
const showLocationWiseMaterialSection = computed(() => {
  return !isLaborPO.value && poItems.value.length === 0 && hasLocationWiseMaterialItems.value
})

const locationWiseMaterialTotal = computed(() => {
  return locationWiseMaterialItems.value.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.po_amount) || 0)
  }, 0)
})

function looksLikeLocationUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s).trim()
  )
}

function collectLocationUuidsFromPo(po: any): string[] {
  const out = new Set<string>()
  const addFrom = (items: any) => {
    if (!Array.isArray(items)) return
    for (const it of items) {
      const u = String(it?.location_uuid || '').trim()
      if (u) out.add(u)
    }
  }
  addFrom(po?.po_items)
  addFrom(normalizeLocationWiseMaterialItems(po))
  addFrom(po?.labor_po_items)
  return [...out]
}

/** Prefer human-readable labels on the line; otherwise resolve location_uuid via `location` table (see loadRelatedData fetch). */
const resolveLocationName = (item: any): string => {
  const pick = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    return String(v).trim()
  }

  const meta = item?.metadata && typeof item.metadata === 'object' ? item.metadata : {}
  const dm =
    item?.display_metadata && typeof item.display_metadata === 'object'
      ? item.display_metadata
      : {}

  const candidates = [
    pick(item?.location_label),
    pick(item?.location),
    pick(dm.location_display),
    pick(meta.location_display),
    pick(meta.location_name),
    pick(meta.location_label),
  ]

  for (const c of candidates) {
    if (c && !looksLikeLocationUuid(c)) return c
  }

  const locationUuid = String(item?.location_uuid || '').trim()
  if (locationUuid) {
    const byGetter =
      typeof locationsStore.getByUuid === 'function'
        ? locationsStore.getByUuid(locationUuid)
        : null
    const storeName = pick(byGetter?.location_name)
    if (storeName) return storeName
    const byList = (locationsStore.locations || []).find((l: any) => l.uuid === locationUuid)
    const listName = pick(byList?.location_name)
    if (listName) return listName
  }

  return ''
}

const resolveItemSequence = (item: any): string => {
  // Try multiple possible keys since PO items may store sequence under different fields.
  const raw =
    item?.item_sequence ??
    item?.sequence ??
    item?.metadata?.sequence ??
    item?.metadata?.item_sequence ??
    item?.display_metadata?.sequence ??
    item?.display_metadata?.item_sequence ??
    ''

  if (raw === null || raw === undefined) return ''
  const str = String(raw).trim()
  if (str) return str

  const includeMode = String(purchaseOrderDetail.value?.include_items || '').toUpperCase()
  if (includeMode === 'IMPORT_ITEMS_FROM_MASTER') {
    const byUuid = masterSpecByItemUuid.value.get(String(item?.item_uuid || '').trim())
    if (byUuid) return byUuid
    const byTypeName = masterSpecByTypeAndName.value.get(
      buildTypeNameKey(item?.item_type_uuid, item?.item_name || item?.name)
    )
    if (byTypeName) return byTypeName
  }

  return ''
}

const itemTotal = computed(() => {
  if (isLaborPO.value) {
    return laborItems.value.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.po_amount) || 0)
    }, 0)
  }
  return poItems.value.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.po_total) || 0)
  }, 0)
})

const laborTotal = computed(() => {
  return laborItems.value.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.po_amount) || 0)
  }, 0)
})

// Helper to get value from financial_breakdown or direct field
const getFinancialValue = (path: string, fallbackPath?: string): number =>
  getPoFinancialValue(purchaseOrderDetail.value, path, fallbackPath)

// Individual charge amounts
const freightChargesAmount = computed(() => {
  return getFinancialValue('charges.freight.amount', 'freight_charges_amount')
})

const packingChargesAmount = computed(() => {
  return getFinancialValue('charges.packing.amount', 'packing_charges_amount')
})

const customDutiesAmount = computed(() => {
  return getFinancialValue('charges.custom_duties.amount', 'custom_duties_amount')
})

const otherChargesAmount = computed(() => {
  return getFinancialValue('charges.other.amount', 'other_charges_amount')
})

// Individual tax amounts
const salesTax1Amount = computed(() => {
  return getFinancialValue('sales_taxes.sales_tax_1.amount', 'sales_tax_1_amount')
})

const salesTax2Amount = computed(() => {
  return getFinancialValue('sales_taxes.sales_tax_2.amount', 'sales_tax_2_amount')
})

const chargesTotal = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return 0
  
  // Try financial_breakdown first
  const breakdown = po.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.charges_total) {
    return parseFloat(breakdown.totals.charges_total) || 0
  }
  
  // Fallback to direct field or calculate from individual charges
  const directTotal = parseFloat(po.charges_total) || 0
  if (directTotal > 0) return directTotal
  
  // Calculate from individual charges if available
  return freightChargesAmount.value + packingChargesAmount.value + customDutiesAmount.value + otherChargesAmount.value
})

const taxTotal = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return 0
  
  // Try financial_breakdown first
  const breakdown = po.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.tax_total) {
    return parseFloat(breakdown.totals.tax_total) || 0
  }
  
  // Fallback to direct field or calculate from individual taxes
  const directTotal = parseFloat(po.tax_total) || 0
  if (directTotal > 0) return directTotal
  
  // Calculate from individual taxes if available
  return salesTax1Amount.value + salesTax2Amount.value
})

// Calculate PO Total from components if not available
const calculatedPOTotal = computed(() => {
  return itemTotal.value + chargesTotal.value + taxTotal.value
})

// Use stored total_po_amount if available, otherwise calculate it
const poTotal = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return 0
  
  // Try financial_breakdown first
  const breakdown = po.financial_breakdown
  if (breakdown && typeof breakdown === 'object' && breakdown.totals?.total_po_amount) {
    const storedTotal = parseFloat(breakdown.totals.total_po_amount) || 0
    if (storedTotal > 0) return storedTotal
  }
  
  // Try direct field
  const directTotal = parseFloat(po.total_po_amount) || 0
  if (directTotal > 0) return directTotal
  
  // Calculate from components as fallback
  return calculatedPOTotal.value
})

// Freight/Terms/Shipping Instructions/Delivery Date/Currency display
const freightDisplay = computed(() =>
  resolveFreightDisplayLabel(
    purchaseOrderDetail.value,
    (uuid) => freightStore.getFreightByUuid(uuid),
    (uuid) => shipViaStore.getShipViaByUuid(uuid),
  )
)

const termsDisplay = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return ''

  const creditStr = trimDisplayStr(po.credit_days)
  if (creditStr === '') return ''

  const creditDays = creditStr.toUpperCase()
  const termsMap: Record<string, string> = {
    NET_15: 'Net 15',
    NET_25: 'Net 25',
    NET_30: 'Net 30',
    NET_45: 'Net 45',
    NET_60: 'Net 60',
  }
  return termsMap[creditDays] || creditDays.replace(/_/g, ' ')
})

const shippingInstructionsDisplay = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po) return ''
  return po.shipping_instructions || ''
})

const deliveryDateDisplay = computed(() => {
  const po = purchaseOrderDetail.value
  if (!po || !po.estimated_delivery_date) return ''
  return formatPoEstimatedDeliveryForPrint(po.estimated_delivery_date)
})

const currencyDisplay = computed(() => {
  return currencyCode.value || 'USD'
})

// Resolve approval check names for a single item
const resolveItemApprovalChecks = (item: any): string => {
  const approvalChecks = item.approval_checks || item.approval_checks_uuids || []
  if (!Array.isArray(approvalChecks) || approvalChecks.length === 0) return ''

  if (approvalChecksStore.approvalChecks.length === 0) {
    approvalChecksStore.fetchApprovalChecks()
  }

  const names = approvalChecks
    .map((uuid: string) => {
      const check = approvalChecksStore.getApprovalCheckByUuid(uuid)
      return check?.approval_check || null
    })
    .filter((name): name is string => name !== null)

  return names.join(', ')
}

const approvalChecksForPrint = computed(() => {
  const checks = approvalChecksStore.approvalChecks || []
  return checks
    .filter((c: any) => c?.active !== false)
    .map((c: any) => ({ uuid: c.uuid, approval_check: c.approval_check || '' }))
})

const getItemApprovalCheckUuids = (item: any): string[] => {
  const raw = item?.approval_checks ?? item?.approval_checks_uuids ?? []

  let checks: any[] = []
  if (Array.isArray(raw)) {
    checks = raw
  } else if (typeof raw === 'string') {
    const text = raw.trim()
    if (text.startsWith('[') && text.endsWith(']')) {
      try {
        const parsed = JSON.parse(text)
        checks = Array.isArray(parsed) ? parsed : []
      } catch {
        checks = []
      }
    }
  }

  return checks
    .map((v: any) => {
      if (typeof v === 'string') return v
      if (v && typeof v === 'object') return String(v.uuid || v.id || '')
      return ''
    })
    .map((v: string) => v.trim())
    .filter(Boolean)
}

const isApprovalCheckSelected = (item: any, checkUuid: string): boolean => {
  return getItemApprovalCheckUuids(item).includes(String(checkUuid))
}

/** Active corporation approval checks that are selected on this line item (print: omit unchecked). */
const selectedApprovalChecksForPrint = (item: any) => {
  return approvalChecksForPrint.value.filter((c: { uuid: string }) =>
    isApprovalCheckSelected(item, c.uuid)
  )
}

const formatPrintDescription = (value: any): string => {
  const raw = String(value || '')
  if (!raw.trim()) return ''
  if (!/<[a-z][\s\S]*>/i.test(raw)) return raw
  const withBreaks = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
  const stripped = withBreaks.replace(/<[^>]*>/g, '')
  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Selected terms and conditions for preview
const selectedTermsAndCondition = computed(() => {
  if (!purchaseOrderDetail.value?.terms_and_conditions_uuid) return null
  return termsAndConditionsStore.getTermsAndConditionById(purchaseOrderDetail.value.terms_and_conditions_uuid) || null
})

/** Resolved special instruction for print preview (list loaded in loadRelatedData). */
const selectedSpecialInstruction = computed(() => {
  const uuid = purchaseOrderDetail.value?.special_instruction_uuid
  if (!uuid) return null
  const list = specialInstructionsStore.items
  if (!Array.isArray(list) || list.length === 0) return null
  return list.find((x) => String(x.uuid) === String(uuid)) ?? null
})

// Extract most recent approval information from audit log
const mostRecentApproval = computed(() => {
  if (!purchaseOrderDetail.value?.audit_log) {
    return null
  }
  
  const auditLog = Array.isArray(purchaseOrderDetail.value.audit_log)
    ? purchaseOrderDetail.value.audit_log
    : []
  
  // Find all approval entries
  const approvalEntries = auditLog.filter((log: any) => 
    log.action === 'approved' && log.timestamp
  )
  
  if (approvalEntries.length === 0) {
    return null
  }
  
  // Sort by timestamp (most recent first) and get the first one
  const sorted = approvalEntries.sort((a: any, b: any) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeB - timeA
  })
  
  return sorted[0]
})

// Get approved by name from most recent approval
const approvedByName = computed(() => {
  const approval = mostRecentApproval.value
  if (!approval) return ''
  
  // Look up user in userProfiles store by UUID to get full name
  if (approval.user_uuid) {
    const user = [].find((u) => u.id === approval.user_uuid)
    if (user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      if (fullName) {
        return sanitizePrintAuditPersonLabel(fullName)
      }
    }
  }
  
  // Fallback to user_name from audit log, then email
  return sanitizePrintAuditPersonLabel(
    approval.user_name || approval.user_email || ''
  )
})

// Get approved by date from most recent approval
const approvedByDate = computed(() => {
  const approval = mostRecentApproval.value
  if (!approval || !approval.timestamp) return ''
  
  // Format the date for display
  return formatDate(approval.timestamp)
})

/** PO-level override of corporation `po_print_approved_by_vendor` when boolean; null/undefined uses corporation setting. */
const showApprovedByVendorOnPrint = computed(() => {
  const po = purchaseOrderDetail.value
  const v = po?.print_include_approved_by_vendor
  if (v === true || v === false) return v
  return appSettingsStore.poPrintApprovedByVendor
})

// Show corporation name only when "Use Entity Name" is enabled; otherwise show the most recent approver person name.
const approvedByDisplay = computed(() => {
  const po = purchaseOrderDetail.value
  const override = po?.print_use_entity_name
  const fromCorp = appSettingsStore.poUseEntityName
  const effectiveEntity =
    override === true || override === false ? override : fromCorp
  const useEntity = effectiveEntity
  if (useEntity) {
    const fromRecord = String(
      purchaseOrderDetail.value?.corporation_name ?? ''
    ).trim()
    if (fromRecord) return fromRecord
    const corpUuid = purchaseOrderDetail.value?.corporation_uuid
    if (corpUuid) {
      const corp = corporationStore.corporations.find((c: any) => c.uuid === corpUuid)
      if (corp?.corporation_name) return corp.corporation_name
    }
    return corporationStore.selectedCorporation?.corporation_name || ''
  }
  return approvedByName.value
})

watch(() => [props.purchaseOrder, props.purchaseOrderUuid], () => {
  load()
}, { immediate: true })

onMounted(async () => {
  // Ensure freight / ship-via stores are loaded for resolving UUIDs on the summary row
  if (freightStore.freight.length === 0) {
    try {
      await freightStore.fetchFreight()
    } catch (e) {
      console.error('Failed to load freight data:', e)
    }
  }
  if (shipViaStore.shipVia.length === 0) {
    try {
      await shipViaStore.fetchShipVia()
    } catch (e) {
      console.error('Failed to load ship via data:', e)
    }
  }
  
  // Ensure user profiles are loaded for resolving user names
  if ([].length === 0) {
    try {
      await Promise.resolve()
    } catch (e) {
      console.error('Failed to load user profiles:', e)
    }
  }

  if (!appSettingsStore.settings) {
    try {
      await appSettingsStore.fetchSettings()
    } catch (e) {
      // Silent failure — defaults to hiding the vendor approval section
    }
  }

  if (corporationStore.corporations.length === 0) {
    try {
      await corporationStore.fetchCorporations()
    } catch (e) {
      // Silent failure — fallback to selectedCorporation if available
    }
  }

  if (termsAndConditionsStore.termsAndConditions.length === 0) {
    try {
      await termsAndConditionsStore.fetchTermsAndConditions()
    } catch (e) {
      // Silent failure
    }
  }

  if (approvalChecksStore.approvalChecks.length === 0) {
    try {
      await approvalChecksStore.fetchApprovalChecks(true)
    } catch (e) {
      // Silent failure — print view can still render without check names
    }
  }
  
  if (!purchaseOrderDetail.value) load()
})
</script>

<style scoped>
/* Print optimizations */
@media print {
  /* Remove all unnecessary spacing */
  * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  
  /* Ensure proper page breaks */
  .page-break-after {
    page-break-after: always;
  }
  
  /* Prevent page breaks inside important sections */
  table {
    page-break-inside: avoid;
  }
  
  /* Optimize spacing for print */
  .space-y-4 > * + * {
    margin-top: 0.5rem !important;
  }
  
  .space-y-2 > * + * {
    margin-top: 0.25rem !important;
  }
  
  .space-y-1 > * + * {
    margin-top: 0.125rem !important;
  }
  
  /* Reduce border thickness for print */
  .border {
    border-width: 0.5px !important;
  }
  
  .border-2 {
    border-width: 1px !important;
  }
}
</style>

