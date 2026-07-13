<template>
  <div class="px-2 py-2 bg-gray-50 dark:bg-gray-900/50">
    <div v-if="!receiptNotes || receiptNotes.length === 0" class="text-center py-2">
      <p class="text-[10px] text-gray-500 dark:text-gray-400">No receipt notes found</p>
    </div>
    
    <div v-else class="w-full">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Corporation</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Project</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">GRN Number</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Vendor</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Entry Date</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Received By</th>
            <th class="px-3 py-2 text-right font-bold text-xs text-gray-900 dark:text-gray-100">Amount</th>
            <th class="px-3 py-2 text-left font-bold text-xs text-gray-900 dark:text-gray-100">Status</th>
            <th class="px-3 py-2 text-right font-bold text-xs text-gray-900 dark:text-gray-100">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(note, index) in receiptNotes"
            :key="note.uuid || index"
            class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              {{ getCorporationName(note.corporation_uuid) }}
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              {{ getProjectName(note.project_uuid) }}
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              <div class="font-medium">{{ note.grn_number || 'N/A' }}</div>
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              {{ getVendorName(note) }}
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              {{ formatDate(note.entry_date || new Date().toISOString()) }}
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              <span class="text-xs">{{ getReceivedByDisplay(note) || 'N/A' }}</span>
            </td>
            <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300 font-mono text-xs">
              {{ formatCurrency(note.total_received_amount || 0) }}
            </td>
            <td class="px-3 py-2 text-left text-gray-700 dark:text-gray-300">
              <UBadge
                :color="getStatusColor(note.status || 'Shipment')"
                variant="soft"
                size="sm"
              >
                {{ note.status || 'Shipment' }}
              </UBadge>
            </td>
            <td class="px-3 py-2 text-right">
              <div class="flex justify-end gap-1">
                <UButton
                  v-if="hasPermission('po_view')"
                  icon="i-heroicons-eye-solid"
                  size="xs"
                  variant="soft"
                  color="neutral"
                  @click="() => $emit('view', note)"
                />
                <UButton
                  v-if="hasPermission('po_edit')"
                  icon="tdesign:edit-filled"
                  size="xs"
                  variant="soft"
                  color="secondary"
                  @click="() => $emit('edit', note)"
                />
                <UButton
                  v-if="hasPermission('po_delete')"
                  icon="mingcute:delete-fill"
                  size="xs"
                  variant="soft"
                  color="error"
                  @click="() => $emit('delete', note)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { usePermissions } from '~/composables/usePermissions'
// userProfiles store not available - simplified
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useVendorStore } from '~/stores/vendors'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useChangeOrdersStore } from '~/stores/changeOrders'

interface Props {
  receiptNotes: any[]
  orderType: 'purchase_order' | 'change_order'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view', note: any): void
  (e: 'edit', note: any): void
  (e: 'delete', note: any): void
}>()

const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()
const { hasPermission } = usePermissions()
const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const vendorStore = useVendorStore()
const purchaseOrdersStore = usePurchaseOrdersStore()
const changeOrdersStore = useChangeOrdersStore()

const userLookup = computed(() => {
  const map = new Map<string, { name: string; imageUrl?: string }>()
  const list = [] ?? []
  list.forEach((user: any) => {
    if (user?.id) {
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Unknown User'
      map.set(user.id, {
        name: fullName,
        imageUrl: user.imageUrl || undefined,
      })
    }
  })
  return map
})

const getReceivedByDisplay = (note: { received_by?: string | null }) => {
  return String(note?.received_by || '').trim()
}

const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    Shipment: 'warning',
    Received: 'success',
  }
  return statusMap[status] || 'neutral'
}

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

const projectLookup = computed(() => {
  const map = new Map<string, string>()
  const list = projectsStore.projects ?? []
  list.forEach((project: any) => {
    if (project?.uuid) {
      map.set(project.uuid, project.project_name || project.project_id || "")
    }
  })
  return map
})

const vendorLookup = computed(() => {
  const map = new Map<string, string>()
  const list = vendorStore.vendors ?? []
  list.forEach((vendor: any) => {
    if (vendor?.uuid) {
      map.set(vendor.uuid, vendor.vendor_name || vendor.uuid)
    }
  })
  return map
})

const purchaseOrderLookup = computed(() => {
  const map = new Map<
    string,
    { poNumber: string; total: number; projectUuid?: string | null; vendorUuid?: string | null }
  >()
  const list = purchaseOrdersStore.purchaseOrders ?? []
  list.forEach((po: any) => {
    if (po?.uuid) {
      map.set(po.uuid, {
        poNumber: po.po_number || "Unnamed PO",
        total: Number(po.total_po_amount) || 0,
        projectUuid: po.project_uuid,
        vendorUuid: po.vendor_uuid || null,
      })
    }
  })
  return map
})

const changeOrderLookup = computed(() => {
  const map = new Map<
    string,
    { coNumber: string; total: number; projectUuid?: string | null; vendorUuid?: string | null }
  >()
  const list = changeOrdersStore.changeOrders ?? []
  list.forEach((co: any) => {
    if (co?.uuid) {
      map.set(co.uuid, {
        coNumber: co.co_number || "Unnamed CO",
        total: Number(co.total_co_amount) || 0,
        projectUuid: co.project_uuid,
        vendorUuid: co.vendor_uuid || null,
      })
    }
  })
  return map
})

const getCorporationName = (uuid: string | null | undefined): string => {
  if (!uuid) return 'N/A'
  return corporationNameByUuid.value[uuid] || uuid
}

const getProjectName = (uuid: string | null | undefined): string => {
  if (!uuid) return 'N/A'
  return projectLookup.value.get(uuid) || 'N/A'
}

const getVendorName = (note: any): string => {
  const receiptType = note.receipt_type || props.orderType || 'purchase_order'
  let vendorUuid: string | null = null
  
  if (receiptType === 'change_order') {
    const orderUuid = note.change_order_uuid || note.purchase_order_uuid
    const co = changeOrderLookup.value.get(orderUuid || "")
    vendorUuid = co?.vendorUuid || null
  } else {
    const orderUuid = note.purchase_order_uuid
    const po = purchaseOrderLookup.value.get(orderUuid || "")
    vendorUuid = po?.vendorUuid || null
  }
  
  if (!vendorUuid) return 'N/A'
  return vendorLookup.value.get(vendorUuid) || 'N/A'
}
</script>

