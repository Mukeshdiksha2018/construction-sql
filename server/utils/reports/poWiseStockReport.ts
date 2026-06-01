import type { H3Event } from 'h3'
import { stripHtmlToPlainText } from '../../../app/utils/getDescriptionPreviewHtml'
import { getPrisma } from '../prisma'
import { APPROVED_PO_CO_STATUSES, toNum } from './reportHelpers'
import { fetchNimbleVendorNamesForUuids } from './nimbleVendorsForReport'

const prisma = getPrisma()

function toInvoiceDateValue(value: unknown): string {
  if (!value) return 'NA'
  const raw = String(value).trim()
  if (!raw) return 'NA'
  if (raw.includes('T')) return raw
  const datePrefixMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefixMatch?.[1]) return datePrefixMatch[1]
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return 'NA'
  return parsed.toISOString()
}

export async function getPoWiseStockReport(
  event: H3Event,
  corporationUuid: string,
  projectUuid: string,
) {
  const purchaseOrders = await prisma.purchaseOrderForm.findMany({
    where: {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      is_active: true,
      status: { in: APPROVED_PO_CO_STATUSES },
    },
    select: {
      uuid: true,
      po_number: true,
      entry_date: true,
      vendor_uuid: true,
      po_type: true,
    },
    orderBy: { entry_date: 'desc' },
  })

  const materialPOs = purchaseOrders.filter((po) => {
    const poType = String(po.po_type ?? '').toUpperCase()
    return poType !== 'LABOR'
  })

  if (!materialPOs.length) {
    return { data: [], totals: { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 } }
  }

  const poUuids = materialPOs.map((po) => po.uuid)
  const poMap = new Map(materialPOs.map((po) => [po.uuid, po]))

  const poItems = await prisma.purchaseOrderItem.findMany({
    where: { purchase_order_uuid: { in: poUuids }, is_active: true },
    orderBy: { order_index: 'asc' },
  })

  if (!poItems.length) {
    return { data: [], totals: { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 } }
  }

  const poItemUuids = poItems.map((i) => i.uuid)
  const itemsByPO = new Map<string, typeof poItems>()
  for (const poItem of poItems) {
    const list = itemsByPO.get(poItem.purchase_order_uuid) ?? []
    list.push(poItem)
    itemsByPO.set(poItem.purchase_order_uuid, list)
  }

  const [receiptNoteItems, poInvoiceItems, returnNoteItems, costCodes, preferredItems] =
    await Promise.all([
      prisma.receiptNoteItem.findMany({
        where: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
          item_type: 'purchase_order',
          po_item_uuid: { in: poItemUuids },
          is_active: true,
          receiptNote: { is_active: true },
        },
        include: {
          receiptNote: {
            select: {
              uuid: true,
              status: true,
              entry_date: true,
              reference_number: true,
              updated_at: true,
              is_active: true,
              location_uuid: true,
            },
          },
        },
      }),
      prisma.purchaseOrderInvoiceItem.findMany({
        where: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
          po_item_uuid: { in: poItemUuids },
          is_active: true,
          vendorInvoice: { is_active: true },
        },
        include: {
          vendorInvoice: {
            select: { uuid: true, number: true, bill_date: true, status: true, is_active: true },
          },
        },
      }),
      prisma.returnNoteItem.findMany({
        where: {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
          item_type: 'purchase_order',
          purchase_order_uuid: { in: poUuids },
          is_active: true,
          returnNote: { is_active: true },
        },
        include: {
          returnNote: {
            select: {
              uuid: true,
              status: true,
              entry_date: true,
              updated_at: true,
              is_active: true,
              location_uuid: true,
            },
          },
        },
      }),
      prisma.costCodeConfiguration.findMany({
        where: { corporation_uuid: corporationUuid, is_active: true },
        select: { uuid: true, cost_code_number: true, cost_code_name: true },
      }),
      prisma.costCodePreferredItem.findMany({
        where: { corporation_uuid: corporationUuid, is_active: true },
        select: { uuid: true, item_sequence: true, uom_uuid: true, cost_code_configuration_uuid: true },
      }),
    ])

  const vendorUuids = [...new Set(materialPOs.map((po) => po.vendor_uuid).filter(Boolean))] as string[]
  const vendorMap = await fetchNimbleVendorNamesForUuids(event, corporationUuid, vendorUuids)

  const costCodeMap = new Map<string, string>()
  for (const cc of costCodes) {
    const label = `${cc.cost_code_number || ''} ${cc.cost_code_name || ''}`.trim()
    costCodeMap.set(cc.uuid, label)
  }

  const preferredItemsMap = new Map(preferredItems.map((item) => [item.uuid, item]))

  const receiptItemsByPoItem = new Map<string, typeof receiptNoteItems>()
  for (const rni of receiptNoteItems) {
    const key = rni.po_item_uuid || ''
    if (!key) continue
    const list = receiptItemsByPoItem.get(key) ?? []
    list.push(rni)
    receiptItemsByPoItem.set(key, list)
  }

  const invoiceItemsByPoItem = new Map<string, typeof poInvoiceItems>()
  for (const poii of poInvoiceItems) {
    const key = poii.po_item_uuid || ''
    if (!key) continue
    const list = invoiceItemsByPoItem.get(key) ?? []
    list.push(poii)
    invoiceItemsByPoItem.set(key, list)
  }

  const resolveReturnToPoLineUuid = (rtni: (typeof returnNoteItems)[0]): string | null => {
    const ref = rtni.po_item_uuid || rtni.item_uuid
    if (!ref) return null
    const refLower = String(ref).trim().toLowerCase()

    const tryLines = (lines: typeof poItems) => {
      const direct = lines.find((l) => l.uuid === ref)
      if (direct) return direct.uuid
      const byPref = lines.filter(
        (l) => l.item_uuid && String(l.item_uuid).trim().toLowerCase() === refLower,
      )
      if (byPref.length >= 1) return byPref[0]!.uuid
      return null
    }

    const poUuid = rtni.purchase_order_uuid
    if (poUuid && itemsByPO.has(poUuid)) {
      const resolved = tryLines(itemsByPO.get(poUuid)!)
      if (resolved) return resolved
    }

    const directAll = poItems.find((l) => l.uuid === ref)
    if (directAll) return directAll.uuid
    const prefAll = poItems.filter(
      (l) => l.item_uuid && String(l.item_uuid).trim().toLowerCase() === refLower,
    )
    if (prefAll.length >= 1) return prefAll[0]!.uuid
    return null
  }

  const returnItemsByPoItem = new Map<string, number>()
  for (const rtni of returnNoteItems) {
    const poLineUuid = resolveReturnToPoLineUuid(rtni)
    if (!poLineUuid) continue
    const returnQuantity = toNum(rtni.return_quantity)
    returnItemsByPoItem.set(poLineUuid, (returnItemsByPoItem.get(poLineUuid) || 0) + returnQuantity)
  }

  const reportData: any[] = []

  for (const po of materialPOs) {
    const poItemsForPO = itemsByPO.get(po.uuid) || []
    const vendorName = po.vendor_uuid ? (vendorMap.get(po.vendor_uuid) || 'N/A') : 'N/A'
    const items: any[] = []
    let poOrderedQuantity = 0
    let poReceivedQuantity = 0
    let poReturnedQuantity = 0
    let poTotalValue = 0

    for (const poItem of poItemsForPO) {
      const receiptItems = receiptItemsByPoItem.get(poItem.uuid) || []
      const invoiceItems = invoiceItemsByPoItem.get(poItem.uuid) || []
      const returnedQuantity = returnItemsByPoItem.get(poItem.uuid) || 0

      const preferredItem = poItem.item_uuid ? preferredItemsMap.get(poItem.item_uuid) : null
      const itemCode =
        preferredItem?.item_sequence
        || poItem.model_number
        || `ITM${String(poItemsForPO.indexOf(poItem) + 1).padStart(3, '0')}`
      const itemName = poItem.item_name || poItem.model_number || 'N/A'
      const description = stripHtmlToPlainText(String(poItem.description || ''))
      const costCode = poItem.cost_code_uuid ? (costCodeMap.get(poItem.cost_code_uuid) || '') : ''
      const orderedQuantity = toNum(poItem.quantity)
      const unitCost = toNum(poItem.unit_price || poItem.po_unit_price)
      const uom = preferredItem?.uom_uuid || poItem.unit_label || ''

      let totalReceivedQuantity = 0
      let status = 'Pending'
      const receiptStatuses = new Set<string>()

      for (const receiptItem of receiptItems) {
        const receiptNote = receiptItem.receiptNote
        totalReceivedQuantity += toNum(receiptItem.received_quantity)
        const itemStatus = receiptNote?.status === 'Received' ? 'Received' : 'In Shipment'
        receiptStatuses.add(itemStatus)
      }

      if (receiptStatuses.has('Received')) status = 'Received'
      else if (receiptStatuses.has('In Shipment') || receiptStatuses.has('Shipment')) {
        status = 'In Shipment'
      }

      const invoiceNumbers: string[] = []
      const invoiceDates: string[] = []
      for (const invoiceItem of invoiceItems) {
        const vendorInvoice = invoiceItem.vendorInvoice
        const itemInvoiceNumber = vendorInvoice?.number || 'NA'
        if (itemInvoiceNumber !== 'NA') invoiceNumbers.push(itemInvoiceNumber)
        const itemInvoiceDate = toInvoiceDateValue(vendorInvoice?.bill_date)
        if (itemInvoiceDate !== 'NA') invoiceDates.push(itemInvoiceDate)
      }

      const uniqueInvoiceNumbers = [...new Set(invoiceNumbers)]
      const uniqueInvoiceDates = [...new Set(invoiceDates)]
      const totalValue = totalReceivedQuantity * unitCost

      poOrderedQuantity += orderedQuantity
      poReceivedQuantity += totalReceivedQuantity
      poReturnedQuantity += returnedQuantity
      poTotalValue += totalValue

      let locationUuid = poItem.location_uuid || ''
      for (const ri of receiptItems) {
        if (ri.receiptNote?.location_uuid) {
          locationUuid = ri.receiptNote.location_uuid
          break
        }
      }

      items.push({
        itemCode,
        itemName,
        description,
        vendorSource: vendorName,
        costCode,
        category: poItem.category || '',
        divisionUuid: poItem.item_division_uuid || '',
        divisionName: poItem.division_name || '',
        itemTypeUuid: poItem.item_type_uuid || '',
        itemTypeName: poItem.item_type_label || '',
        locationUuid,
        poNumber: po.po_number || '',
        poDate: po.entry_date?.toISOString?.() ?? po.entry_date ?? '',
        orderedQuantity,
        receivedQuantity: totalReceivedQuantity,
        returnedQuantity,
        invoiceNumbers: uniqueInvoiceNumbers,
        invoiceDates: uniqueInvoiceDates,
        status,
        unitCost,
        uom,
        totalValue,
      })
    }

    reportData.push({
      uuid: po.uuid,
      po_number: po.po_number || '',
      po_date: po.entry_date?.toISOString?.() ?? po.entry_date ?? '',
      vendor_uuid: po.vendor_uuid,
      vendor_name: vendorName,
      items,
      totals: {
        orderedQuantity: poOrderedQuantity,
        receivedQuantity: poReceivedQuantity,
        returnedQuantity: poReturnedQuantity,
        totalValue: poTotalValue,
      },
    })
  }

  const grandTotals = reportData.reduce(
    (acc, po) => {
      acc.orderedQuantity += po.totals.orderedQuantity
      acc.receivedQuantity += po.totals.receivedQuantity
      acc.returnedQuantity += po.totals.returnedQuantity
      acc.totalValue += po.totals.totalValue
      return acc
    },
    { orderedQuantity: 0, receivedQuantity: 0, returnedQuantity: 0, totalValue: 0 },
  )

  return { data: reportData, totals: grandTotals }
}
