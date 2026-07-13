import { getPrisma } from '../../utils/prisma'
import { fetchNimbleVendorNamesForUuids } from '../../utils/reports/nimbleVendorsForReport'

/**
 * Lightweight PO/CO option list for the vendor-invoice picker.
 * Queries MSSQL directly (scoped to corp + project + vendor + statuses)
 * so older POs/COs remain selectable beyond store pagination caps.
 */

const ALLOWED_STATUSES = [
  'Approved',
  'Completed',
  'Partially_Received',
  'partially_received',
]

const MAX_ROWS = 1000

const toNumericOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const extractTotalFromBreakdown = (breakdown: unknown, keys: string[]): number => {
  let parsed: unknown = breakdown
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    }
    catch {
      return 0
    }
  }
  if (!parsed || typeof parsed !== 'object') return 0

  const obj = parsed as Record<string, unknown>
  const totals = (obj.totals ?? obj.total_breakdown ?? obj.totals_breakdown ?? {}) as Record<string, unknown>
  for (const key of keys) {
    const value = toNumericOrNull(totals[key])
    if (value !== null) return value
  }
  return 0
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const corporationUuid = String(query.corporation_uuid || '').trim()
  const projectUuid = String(query.project_uuid || '').trim()
  const vendorUuid = String(query.vendor_uuid || '').trim()
  const type = String(query.type || 'both').trim().toLowerCase()

  if (!corporationUuid || !projectUuid || !vendorUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid, project_uuid and vendor_uuid are required',
    })
  }

  const wantPOs = type === 'po' || type === 'both'
  const wantCOs = type === 'co' || type === 'both'
  const prisma = getPrisma()

  try {
    const [poRows, coRows] = await Promise.all([
      wantPOs
        ? prisma.purchaseOrderForm.findMany({
            where: {
              corporation_uuid: corporationUuid,
              project_uuid: projectUuid,
              vendor_uuid: vendorUuid,
              is_active: true,
              status: { in: ALLOWED_STATUSES },
            },
            select: {
              uuid: true,
              po_number: true,
              status: true,
              po_type: true,
              entry_date: true,
              created_at: true,
              vendor_uuid: true,
              financial_breakdown: true,
              currency_conversion_enabled: true,
              currency_from: true,
              currency_to: true,
              conversion_rate: true,
            },
            orderBy: { created_at: 'desc' },
            take: MAX_ROWS,
          })
        : Promise.resolve([]),
      wantCOs
        ? prisma.changeOrder.findMany({
            where: {
              corporation_uuid: corporationUuid,
              project_uuid: projectUuid,
              vendor_uuid: vendorUuid,
              is_active: true,
              status: { in: ALLOWED_STATUSES },
            },
            select: {
              uuid: true,
              co_number: true,
              status: true,
              co_type: true,
              created_date: true,
              created_at: true,
              vendor_uuid: true,
              financial_breakdown: true,
              currency_conversion_enabled: true,
              currency_from: true,
              currency_to: true,
              conversion_rate: true,
            },
            orderBy: { created_at: 'desc' },
            take: MAX_ROWS,
          })
        : Promise.resolve([]),
    ])

    const vendorNames = await fetchNimbleVendorNamesForUuids(event, corporationUuid, [vendorUuid])
    const vendorName = vendorNames.get(vendorUuid) || null

    const purchaseOrders = poRows.map(row => ({
      uuid: row.uuid,
      po_number: row.po_number,
      status: row.status,
      po_type: row.po_type,
      entry_date: row.entry_date?.toISOString?.() ?? row.entry_date,
      created_at: row.created_at?.toISOString?.() ?? row.created_at,
      vendor_uuid: row.vendor_uuid,
      vendor_name: vendorName,
      total_po_amount: extractTotalFromBreakdown(row.financial_breakdown, [
        'total_po_amount',
        'totalAmount',
        'total_po',
        'total',
      ]),
      currency_conversion_enabled: row.currency_conversion_enabled === true,
      currency_from: row.currency_from ?? null,
      currency_to: row.currency_to ?? null,
      conversion_rate: row.conversion_rate != null ? Number(row.conversion_rate) : null,
    }))

    const changeOrders = coRows.map(row => ({
      uuid: row.uuid,
      co_number: row.co_number,
      status: row.status,
      co_type: row.co_type,
      created_date: row.created_date?.toISOString?.() ?? row.created_date,
      created_at: row.created_at?.toISOString?.() ?? row.created_at,
      vendor_uuid: row.vendor_uuid,
      vendor_name: vendorName,
      total_co_amount: extractTotalFromBreakdown(row.financial_breakdown, [
        'total_co_amount',
        'totalCoAmount',
        'total_co',
        'total',
      ]),
      currency_conversion_enabled: row.currency_conversion_enabled === true,
      currency_from: row.currency_from ?? null,
      currency_to: row.currency_to ?? null,
      conversion_rate: row.conversion_rate != null ? Number(row.conversion_rate) : null,
    }))

    return { data: { purchaseOrders, changeOrders } }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    if (err?.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to load PO/CO options',
    })
  }
})
