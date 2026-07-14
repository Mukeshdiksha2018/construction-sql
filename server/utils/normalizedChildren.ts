/**
 * Dual-write/read helpers for normalized child tables that replace NVARCHAR(MAX) JSON blobs.
 * List/query paths must NOT join these tables — only detail/edit/print loads them.
 */

import { buildFinancialBreakdown } from './financialBreakdown'

export const CHARGE_KEYS = ['freight', 'packing', 'custom_duties', 'other'] as const
export const TAX_KEYS = ['sales_tax_1', 'sales_tax_2'] as const

export type ChargeKey = (typeof CHARGE_KEYS)[number]
export type TaxKey = (typeof TAX_KEYS)[number]

export type FinancialBreakdownShape = {
  charges: Record<string, { percentage: number | null; amount: number | null; taxable: boolean }>
  sales_taxes: Record<string, { percentage: number | null; amount: number | null }>
  totals: Record<string, number | null>
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as any).toNumber === 'function') {
    const n = (val as any).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

function toBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(s)) return true
    if (['false', '0', 'no', 'n'].includes(s)) return false
  }
  return Boolean(val)
}

/** Assemble UI-shaped financial_breakdown from charge/tax child rows (+ optional header totals). */
export function assembleFinancialBreakdownFromRows(
  chargeRows: Array<{ charge_key: string; percentage: unknown; amount: unknown; taxable: unknown }>,
  taxRows: Array<{ tax_key: string; percentage: unknown; amount: unknown }>,
  totals?: {
    item_total?: unknown
    charges_total?: unknown
    tax_total?: unknown
    total_po_amount?: unknown
    total_co_amount?: unknown
    total_invoice_amount?: unknown
    grn_total_with_charges_taxes?: unknown
  } | null,
): FinancialBreakdownShape {
  const charges: FinancialBreakdownShape['charges'] = {
    freight: { percentage: null, amount: null, taxable: false },
    packing: { percentage: null, amount: null, taxable: false },
    custom_duties: { percentage: null, amount: null, taxable: false },
    other: { percentage: null, amount: null, taxable: false },
  }
  for (const row of chargeRows) {
    const key = String(row.charge_key || '')
    if (!(key in charges)) continue
    charges[key] = {
      percentage: toNum(row.percentage),
      amount: toNum(row.amount),
      taxable: toBool(row.taxable),
    }
  }

  const sales_taxes: FinancialBreakdownShape['sales_taxes'] = {
    sales_tax_1: { percentage: null, amount: null },
    sales_tax_2: { percentage: null, amount: null },
  }
  for (const row of taxRows) {
    const key = String(row.tax_key || '')
    if (!(key in sales_taxes)) continue
    sales_taxes[key] = {
      percentage: toNum(row.percentage),
      amount: toNum(row.amount),
    }
  }

  const totalsOut: Record<string, number | null> = {
    item_total: toNum(totals?.item_total),
    charges_total: toNum(totals?.charges_total),
    tax_total: toNum(totals?.tax_total),
    total_po_amount: toNum(totals?.total_po_amount ?? totals?.total_co_amount),
  }
  if (totals?.total_co_amount != null) totalsOut.total_co_amount = toNum(totals.total_co_amount)
  if (totals?.total_invoice_amount != null) totalsOut.total_invoice_amount = toNum(totals.total_invoice_amount)
  if (totals?.grn_total_with_charges_taxes != null) {
    totalsOut.grn_total_with_charges_taxes = toNum(totals.grn_total_with_charges_taxes)
  }

  return { charges, sales_taxes, totals: totalsOut }
}

/** Prefer child rows; fall back to legacy JSON blob / flat payload. */
export function resolveFinancialBreakdown(options: {
  chargeRows?: Array<{ charge_key: string; percentage: unknown; amount: unknown; taxable: unknown }> | null
  taxRows?: Array<{ tax_key: string; percentage: unknown; amount: unknown }> | null
  legacyJson?: unknown
  flatPayload?: Record<string, any> | null
  headerTotals?: Record<string, unknown> | null
}): FinancialBreakdownShape {
  const charges = options.chargeRows ?? []
  const taxes = options.taxRows ?? []
  if (charges.length > 0 || taxes.length > 0) {
    return assembleFinancialBreakdownFromRows(charges, taxes, options.headerTotals)
  }
  if (options.legacyJson && typeof options.legacyJson === 'object') {
    return options.legacyJson as FinancialBreakdownShape
  }
  return buildFinancialBreakdown(options.flatPayload ?? options.headerTotals ?? {}) as FinancialBreakdownShape
}

export function chargeRowsFromBreakdown(
  breakdown: any,
  corporationUuid: string,
  parentUuid: string,
): Array<{
  corporation_uuid: string
  purchase_order_uuid?: string
  change_order_uuid?: string
  vendor_invoice_uuid?: string
  receipt_note_uuid?: string
  return_note_uuid?: string
  charge_key: string
  percentage: number | null
  amount: number | null
  taxable: boolean
}> {
  const charges = breakdown?.charges ?? {}
  return CHARGE_KEYS.map((charge_key) => ({
    corporation_uuid: corporationUuid,
    charge_key,
    percentage: toNum(charges[charge_key]?.percentage),
    amount: toNum(charges[charge_key]?.amount),
    taxable: toBool(charges[charge_key]?.taxable),
  }))
}

export function taxRowsFromBreakdown(
  breakdown: any,
  corporationUuid: string,
): Array<{
  corporation_uuid: string
  tax_key: string
  percentage: number | null
  amount: number | null
}> {
  const taxes = breakdown?.sales_taxes ?? breakdown?.salesTaxes ?? {}
  return TAX_KEYS.map((tax_key) => ({
    corporation_uuid: corporationUuid,
    tax_key,
    percentage: toNum(taxes[tax_key]?.percentage),
    amount: toNum(taxes[tax_key]?.amount),
  }))
}

export type AttachmentRowInput = {
  corporation_uuid: string
  document_name: string
  mime_type: string | null
  file_size: number | null
  file_url: string | null
  uploaded_at: Date | null
  uploaded_by: string | null
  sort_order: number
  source_uuid: string | null
}

export function attachmentRowsFromJson(
  attachments: unknown,
  corporationUuid: string,
): AttachmentRowInput[] {
  if (!Array.isArray(attachments)) return []
  return attachments.map((raw, index) => {
    const a = raw && typeof raw === 'object' ? (raw as Record<string, any>) : {}
    const uploadedAt = a.uploaded_at ? new Date(a.uploaded_at) : null
    return {
      corporation_uuid: corporationUuid,
      document_name: String(a.document_name ?? a.name ?? a.file_name ?? 'attachment').slice(0, 255),
      mime_type: a.mime_type ? String(a.mime_type).slice(0, 100) : null,
      file_size: toNum(a.file_size) != null ? Math.trunc(toNum(a.file_size)!) : null,
      file_url: a.file_url ? String(a.file_url) : null,
      uploaded_at: uploadedAt && !isNaN(uploadedAt.getTime()) ? uploadedAt : null,
      uploaded_by: a.uploaded_by ? String(a.uploaded_by).slice(0, 128) : null,
      sort_order: typeof a.sort_order === 'number' ? a.sort_order : index,
      source_uuid: a.uuid ? String(a.uuid).slice(0, 36) : null,
    }
  })
}

export function attachmentsJsonFromRows(
  rows: Array<{
    uuid: string
    source_uuid?: string | null
    document_name: string
    mime_type?: string | null
    file_size?: unknown
    file_url?: string | null
    uploaded_at?: Date | null
    uploaded_by?: string | null
    sort_order?: number
  }>,
): any[] {
  return [...rows]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({
      uuid: r.source_uuid || r.uuid,
      document_name: r.document_name,
      mime_type: r.mime_type ?? null,
      file_size: toNum(r.file_size),
      file_url: r.file_url ?? null,
      uploaded_at: r.uploaded_at ? r.uploaded_at.toISOString() : null,
      uploaded_by: r.uploaded_by ?? null,
    }))
}

export type AuditEventInput = {
  corporation_uuid: string
  event_type: string
  payload: string | null
  created_by: string | null
  event_at: Date
}

export function auditEventRowsFromJson(
  auditLog: unknown,
  corporationUuid: string,
): AuditEventInput[] {
  if (!Array.isArray(auditLog)) return []
  return auditLog.map((raw) => {
    const e = raw && typeof raw === 'object' ? (raw as Record<string, any>) : {}
    const eventAt = e.timestamp || e.created_at || e.at || e.date
    const d = eventAt ? new Date(eventAt) : new Date()
    return {
      corporation_uuid: corporationUuid,
      event_type: String(e.event_type ?? e.type ?? e.action ?? e.status ?? 'event').slice(0, 100),
      payload: JSON.stringify(e),
      created_by: e.created_by || e.user_id || e.user || e.by
        ? String(e.created_by || e.user_id || e.user || e.by).slice(0, 128)
        : null,
      event_at: isNaN(d.getTime()) ? new Date() : d,
    }
  })
}

export function auditLogJsonFromRows(
  rows: Array<{ event_type: string; payload: string | null; created_by: string | null; event_at: Date }>,
): any[] {
  return [...rows]
    .sort((a, b) => a.event_at.getTime() - b.event_at.getTime())
    .map((r) => {
      try {
        if (r.payload) return JSON.parse(r.payload)
      }
      catch { /* fall through */ }
      return {
        event_type: r.event_type,
        created_by: r.created_by,
        timestamp: r.event_at.toISOString(),
      }
    })
}

/**
 * Phase F metadata key audit — stable keys already promoted to real columns vs still in metadata.
 * Do not promote ad-hoc keys without a consuming code path.
 */
export const METADATA_KEY_AUDIT = {
  purchase_order_items_list: {
    promotedOrHasColumn: [
      'unit_label', 'uom_label', 'unit_uuid', 'uom_uuid', 'item_sequence', 'sequence',
      'preferred_vendor_uuid', // still often metadata — consider promote later
    ],
    keepInMetadata: ['display_metadata', 'estimate linkages', 'ad-hoc UI flags'],
  },
  labor_purchase_order_items_list: {
    /** Promoted in this migration */
    promotedColumns: ['prior_committed_po_amount'],
    keepInMetadata: ['other labor UI state'],
  },
} as const
