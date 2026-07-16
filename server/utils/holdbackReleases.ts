import { getPrisma } from './prisma'

const prisma = getPrisma()

function toNum(val: unknown): number | null {
  if (val == null || val === '') return null
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : null
}

function mapHoldbackReleaseRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { ...row }
  if (typeof row.metadata === 'string') {
    try {
      mapped.metadata = JSON.parse(row.metadata)
    } catch {
      mapped.metadata = {}
    }
  } else {
    mapped.metadata = row.metadata ?? {}
  }
  if (mapped.id != null) mapped.id = String(mapped.id)
  for (const key of ['total_amount', 'retainage_amount', 'release_amount']) {
    if (key in mapped) mapped[key] = toNum(mapped[key])
  }
  return mapped
}

export type ListHoldbackReleasesParams = {
  vendor_invoice_uuid?: string
  purchase_order_uuid?: string
  change_order_uuid?: string
  holdback_invoice_uuid?: string
  exclude_current_invoice?: boolean
}

/**
 * Holdback "releases" are rows in holdback_cost_codes with release_amount > 0.
 * Filters match construction-management /api/holdback-releases.
 */
export async function listHoldbackReleases(params: ListHoldbackReleasesParams) {
  const {
    vendor_invoice_uuid,
    purchase_order_uuid,
    change_order_uuid,
    holdback_invoice_uuid,
    exclude_current_invoice = false,
  } = params

  const where: Record<string, unknown> = {
    is_active: true,
    release_amount: { gt: 0 },
  }

  if (vendor_invoice_uuid && !exclude_current_invoice) {
    where.vendor_invoice_uuid = vendor_invoice_uuid
  } else {
    if (purchase_order_uuid) where.purchase_order_uuid = purchase_order_uuid
    if (change_order_uuid) where.change_order_uuid = change_order_uuid
    if (holdback_invoice_uuid) where.holdback_invoice_uuid = holdback_invoice_uuid
    if (exclude_current_invoice && vendor_invoice_uuid) {
      where.vendor_invoice_uuid = { not: vendor_invoice_uuid }
    }
  }

  const rows = await prisma.holdbackCostCode.findMany({
    where,
    orderBy: { created_at: 'asc' },
  })

  const vendorInvoiceUuids = [
    ...new Set(
      rows
        .map((r) => r.vendor_invoice_uuid)
        .filter((uuid): uuid is string => Boolean(uuid)),
    ),
  ]

  let activeInvoiceUuids = new Set<string>()
  if (vendorInvoiceUuids.length > 0) {
    const activeInvoices = await prisma.vendorInvoice.findMany({
      where: {
        uuid: { in: vendorInvoiceUuids },
        is_active: true,
      },
      select: { uuid: true },
    })
    activeInvoiceUuids = new Set(activeInvoices.map((v) => v.uuid))
  }

  return rows
    .filter((row) => activeInvoiceUuids.has(row.vendor_invoice_uuid))
    .map((row) => mapHoldbackReleaseRow(row as unknown as Record<string, unknown>))
}
