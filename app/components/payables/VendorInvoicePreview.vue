<template>
  <div class="space-y-4 print:space-y-2">
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
        <p class="text-gray-600">Loading vendor invoice...</p>
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

    <div v-else-if="invoiceDetail" class="print:p-2">
      <div class="text-center mb-3 print:mb-2">
        <h1 class="text-xl print:text-lg font-bold text-gray-900">VENDOR INVOICE</h1>
      </div>

      <div class="grid grid-cols-2 gap-3 print:gap-2 mb-3 print:mb-2 text-sm print:text-xs">
        <div class="space-y-1">
          <div><span class="font-semibold">Invoice #:</span> {{ invoiceDetail.number || 'N/A' }}</div>
          <div><span class="font-semibold">Invoice Type:</span> {{ invoiceTypeLabel }}</div>
          <div><span class="font-semibold">Status:</span> {{ invoiceDetail.status || 'Draft' }}</div>
          <div><span class="font-semibold">Bill Date:</span> {{ formatDate(invoiceDetail.bill_date) }}</div>
          <div><span class="font-semibold">Due Date:</span> {{ invoiceDetail.due_date ? formatDate(invoiceDetail.due_date) : 'N/A' }}</div>
        </div>
        <div class="space-y-1">
          <div><span class="font-semibold">Project:</span> {{ invoiceDetail.project_name || 'N/A' }}</div>
          <div><span class="font-semibold">Vendor:</span> {{ invoiceDetail.vendor_name || 'N/A' }}</div>
          <div><span class="font-semibold">PO #:</span> {{ invoiceDetail.po_number || 'N/A' }}</div>
          <div><span class="font-semibold">CO #:</span> {{ invoiceDetail.co_number || 'N/A' }}</div>
        </div>
      </div>

      <div v-if="displayRows.length > 0" class="mb-3 print:mb-2">
        <h3 class="text-sm font-semibold mb-1">Invoice Items</h3>
        <table class="w-full border-collapse border border-gray-300 text-xs print:text-[10px]">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 py-1 text-left">Description</th>
              <th class="border border-gray-300 px-2 py-1 text-left">Cost Code</th>
              <th class="border border-gray-300 px-2 py-1 text-right">Qty</th>
              <th class="border border-gray-300 px-2 py-1 text-right">Unit Price</th>
              <th class="border border-gray-300 px-2 py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in displayRows" :key="idx">
              <td class="border border-gray-300 px-2 py-1">{{ row.description }}</td>
              <td class="border border-gray-300 px-2 py-1">{{ row.costCode }}</td>
              <td class="border border-gray-300 px-2 py-1 text-right">{{ row.quantity }}</td>
              <td class="border border-gray-300 px-2 py-1 text-right">{{ row.unitPrice }}</td>
              <td class="border border-gray-300 px-2 py-1 text-right font-mono">{{ row.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end">
        <div class="w-full max-w-sm border border-gray-300 rounded p-2 text-sm print:text-xs">
          <div class="flex justify-between">
            <span class="font-semibold">Invoice Total:</span>
            <span class="font-mono font-semibold">{{ invoiceTotal }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'

interface Props {
  vendorInvoiceUuid?: string
  vendorInvoice?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'preview-ready': []; 'preview-error': [] }>()
const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()

const loading = ref(false)
const error = ref<string | null>(null)
const invoiceDetail = ref<any | null>(null)

const invoiceTypeMap: Record<string, string> = {
  ENTER_DIRECT_INVOICE: 'Direct Invoice',
  AGAINST_PO: 'PO Invoice',
  AGAINST_CO: 'CO Invoice',
  AGAINST_ADVANCE_PAYMENT: 'Advance Payment',
  AGAINST_HOLDBACK_AMOUNT: 'Hold Back Amount',
}

const invoiceTypeLabel = computed(() => {
  const raw = String(invoiceDetail.value?.invoice_type || '')
  return invoiceTypeMap[raw] || raw || 'N/A'
})

const rawRows = computed<any[]>(() => {
  const invoice = invoiceDetail.value
  if (!invoice) return []
  return [
    ...(Array.isArray(invoice.line_items) ? invoice.line_items : []),
    ...(Array.isArray(invoice.po_invoice_items) ? invoice.po_invoice_items : []),
    ...(Array.isArray(invoice.co_invoice_items) ? invoice.co_invoice_items : []),
    ...(Array.isArray(invoice.labor_invoice_items) ? invoice.labor_invoice_items : []),
    ...(Array.isArray(invoice.po_lwm_invoice_items) ? invoice.po_lwm_invoice_items : []),
    ...(Array.isArray(invoice.co_lwm_invoice_items) ? invoice.co_lwm_invoice_items : []),
  ]
})

const displayRows = computed(() => {
  return rawRows.value
    .map((item: any) => {
      const amount = item.invoice_total ?? item.invoice_amount ?? item.amount ?? 0
      const qty = item.invoice_quantity ?? item.quantity ?? ''
      const unitPrice = item.invoice_unit_price ?? item.unit_price ?? ''
      const costCode = item.cost_code_label || `${item.cost_code_number || ''} ${item.cost_code_name || ''}`.trim() || 'N/A'
      return {
        description: item.description || item.item_name || item.name || 'N/A',
        costCode,
        quantity: qty === '' ? 'N/A' : String(qty),
        unitPrice: unitPrice === '' ? 'N/A' : formatCurrency(unitPrice),
        amount: formatCurrency(amount),
      }
    })
    .filter((row) => row.description !== 'N/A' || row.amount !== formatCurrency(0))
})

const invoiceTotal = computed(() => {
  const totalsAmount = invoiceDetail.value?.financial_breakdown?.totals?.total_invoice_amount
  const fallbackAmount = invoiceDetail.value?.amount ?? 0
  return formatCurrency(totalsAmount ?? fallbackAmount)
})

const fetchDetail = async (uuid: string) => {
  loading.value = true
  error.value = null
  try {
    const response: any = await $fetch(`/api/vendor-invoices/${uuid}`, { method: 'GET' })
    if (!response?.data) throw new Error('Vendor invoice not found')
    invoiceDetail.value = response.data
    emit('preview-ready')
  } catch (e: any) {
    error.value = e?.message || 'Failed to load vendor invoice'
    emit('preview-error')
  } finally {
    loading.value = false
  }
}

const load = async () => {
  if (props.vendorInvoice) {
    invoiceDetail.value = props.vendorInvoice
    emit('preview-ready')
    return
  }
  if (props.vendorInvoiceUuid) {
    await fetchDetail(props.vendorInvoiceUuid)
  }
}

watch(() => [props.vendorInvoice, props.vendorInvoiceUuid], () => {
  load()
}, { immediate: true })
</script>
