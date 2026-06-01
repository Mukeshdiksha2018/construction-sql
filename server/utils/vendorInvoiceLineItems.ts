const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mergeDirectLineItemUiIntoMetadata(
  item: any,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base }
  const has = (key: string) => Object.prototype.hasOwnProperty.call(item, key)

  const applyUuidMeta = (key: string) => {
    if (!has(key)) return
    const v = item[key]
    if (v == null || String(v).trim() === '') {
      delete out[key]
      return
    }
    out[key] = String(v).trim()
  }

  const applyStrMeta = (key: string) => {
    if (!has(key)) return
    const v = item[key]
    if (v == null || String(v).trim() === '') {
      delete out[key]
      return
    }
    out[key] = String(v).trim()
  }

  applyUuidMeta('location_uuid')
  applyStrMeta('category')
  applyStrMeta('item_category_label')
  applyUuidMeta('item_type_uuid')
  applyStrMeta('item_type_label')
  applyUuidMeta('item_division_uuid')

  const hasLocationText = has('location') || has('location_label')
  if (hasLocationText) {
    const locLabel =
      [item?.location, item?.location_label]
        .map((x) => (x != null ? String(x).trim() : ''))
        .find(Boolean) || ''
    if (locLabel) {
      out.location = locLabel
      out.location_label = locLabel
    } else {
      delete out.location
      delete out.location_label
    }
  }

  return out
}

export const sanitizeDirectVendorInvoiceLineItem = (item: any = {}, index: number) => {
  const metadata = item?.metadata || {}
  const baseMeta =
    typeof metadata === 'object' && metadata !== null
      ? { ...(metadata as Record<string, unknown>) }
      : {}

  const mergedMetadata = mergeDirectLineItemUiIntoMetadata(item, baseMeta)

  return {
    order_index: Number(item?.order_index ?? index),
    cost_code_uuid:
      item?.cost_code_uuid && item.cost_code_uuid !== '' ? item.cost_code_uuid : null,
    cost_code_label: item?.cost_code_label ?? metadata?.cost_code_label ?? null,
    cost_code_number: item?.cost_code_number ?? metadata?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? metadata?.cost_code_name ?? null,
    division_name: item?.division_name ?? metadata?.division_name ?? null,
    sequence_uuid: item?.sequence_uuid ?? null,
    item_uuid: item?.item_uuid ?? null,
    item_name: item?.item_name ?? metadata?.item_name ?? item?.description ?? '',
    description: item?.description ?? '',
    unit_price: toNumberOrNull(item?.unit_price),
    quantity: toNumberOrNull(item?.quantity),
    total: toNumberOrNull(item?.total),
    unit_uuid: item?.unit_uuid ?? item?.uom_uuid ?? metadata?.unit_uuid ?? null,
    unit_label:
      item?.unit_label ?? item?.uom ?? item?.uom_label ?? metadata?.unit_label ?? metadata?.unit ?? null,
    uom: item?.uom ?? item?.unit_label ?? metadata?.uom ?? null,
    metadata: mergedMetadata,
    is_active: true,
  }
}

export function hydrateDirectVendorInvoiceLineItemFromDb(row: any) {
  if (!row || typeof row !== 'object') return row
  const m =
    row.metadata && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, unknown>)
      : {}
  const locFromMeta =
    [m.location, m.location_label]
      .map((x) => (x != null ? String(x).trim() : ''))
      .find(Boolean) || ''
  const loc =
    [row.location, row.location_label, locFromMeta]
      .map((x) => (x != null ? String(x).trim() : ''))
      .find(Boolean) || ''

  return {
    ...row,
    location_uuid: row.location_uuid ?? m.location_uuid ?? null,
    location: loc,
    location_label: row.location_label ?? m.location_label ?? locFromMeta ?? '',
    category: row.category ?? m.category ?? '',
    item_category_label: row.item_category_label ?? m.item_category_label ?? '',
    item_type_uuid: row.item_type_uuid ?? m.item_type_uuid ?? null,
    item_type_label: row.item_type_label ?? m.item_type_label ?? '',
    item_division_uuid: row.item_division_uuid ?? m.item_division_uuid ?? null,
  }
}

export const sanitizePurchaseOrderInvoiceItem = (item: any = {}, index: number) => {
  const metadata = item?.metadata || {}

  return {
    order_index: Number(item?.order_index ?? index),
    po_item_uuid: item?.po_item_uuid && item.po_item_uuid !== '' ? item.po_item_uuid : null,
    cost_code_uuid:
      item?.cost_code_uuid && item.cost_code_uuid !== '' ? item.cost_code_uuid : null,
    cost_code_label: item?.cost_code_label ?? metadata?.cost_code_label ?? null,
    cost_code_number: item?.cost_code_number ?? metadata?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? metadata?.cost_code_name ?? null,
    division_name: item?.division_name ?? metadata?.division_name ?? null,
    item_type_uuid:
      item?.item_type_uuid && item.item_type_uuid !== '' ? item.item_type_uuid : null,
    item_type_label: item?.item_type_label ?? metadata?.item_type_label ?? null,
    item_uuid: item?.item_uuid && item.item_uuid !== '' ? item.item_uuid : null,
    item_name: item?.item_name ?? metadata?.item_name ?? item?.description ?? '',
    description: item?.description ?? '',
    model_number: item?.model_number ?? metadata?.model_number ?? '',
    location_uuid:
      item?.location_uuid && item.location_uuid !== '' ? item.location_uuid : null,
    location_label: item?.location ?? item?.location_label ?? metadata?.location_label ?? null,
    unit_uuid: item?.unit_uuid ?? item?.uom_uuid ?? metadata?.unit_uuid ?? null,
    unit_label:
      item?.unit_label ?? item?.uom_label ?? metadata?.unit_label ?? metadata?.unit ?? null,
    invoice_quantity: toNumberOrNull(item?.invoice_quantity),
    invoice_unit_price: toNumberOrNull(item?.invoice_unit_price),
    invoice_total: toNumberOrNull(item?.invoice_total),
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    is_active: true,
  }
}

export const sanitizeChangeOrderInvoiceItem = (item: any = {}, index: number) => {
  const metadata = item?.metadata || {}

  return {
    order_index: Number(item?.order_index ?? index),
    co_item_uuid: item?.co_item_uuid && item.co_item_uuid !== '' ? item.co_item_uuid : null,
    cost_code_uuid:
      item?.cost_code_uuid && item.cost_code_uuid !== '' ? item.cost_code_uuid : null,
    cost_code_label: item?.cost_code_label ?? metadata?.cost_code_label ?? null,
    cost_code_number: item?.cost_code_number ?? metadata?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? metadata?.cost_code_name ?? null,
    division_name: item?.division_name ?? metadata?.division_name ?? null,
    item_type_uuid:
      item?.item_type_uuid && item.item_type_uuid !== '' ? item.item_type_uuid : null,
    item_type_label: item?.item_type_label ?? metadata?.item_type_label ?? null,
    item_uuid: item?.item_uuid && item.item_uuid !== '' ? item.item_uuid : null,
    item_name: item?.item_name ?? metadata?.item_name ?? item?.description ?? '',
    description: item?.description ?? '',
    model_number: item?.model_number ?? metadata?.model_number ?? '',
    location_uuid:
      item?.location_uuid && item.location_uuid !== '' ? item.location_uuid : null,
    location_label: item?.location ?? item?.location_label ?? metadata?.location_label ?? null,
    unit_uuid: item?.unit_uuid ?? item?.uom_uuid ?? metadata?.unit_uuid ?? null,
    unit_label:
      item?.unit_label ?? item?.uom_label ?? metadata?.unit_label ?? metadata?.unit ?? null,
    invoice_quantity: toNumberOrNull(item?.invoice_quantity),
    invoice_unit_price: toNumberOrNull(item?.invoice_unit_price),
    invoice_total: toNumberOrNull(item?.invoice_total),
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    is_active: true,
  }
}

export const sanitizePoLwmInvoiceItem = (item: any = {}, index: number) => {
  const metadata = item?.metadata || {}

  return {
    order_index: Number(item?.order_index ?? index),
    po_lwm_uuid: item?.po_lwm_uuid && item.po_lwm_uuid !== '' ? item.po_lwm_uuid : null,
    cost_code_uuid:
      item?.cost_code_uuid && item.cost_code_uuid !== '' ? item.cost_code_uuid : null,
    cost_code_number: item?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? null,
    cost_code_label:
      item?.cost_code_label ??
      (item?.cost_code_number && item?.cost_code_name
        ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
        : item?.cost_code_number || item?.cost_code_name || null),
    division_name: item?.division_name ?? null,
    location_uuid:
      item?.location_uuid && item.location_uuid !== '' ? item.location_uuid : null,
    location_label: item?.location_label ?? null,
    material_budgeted_amount: toNumberOrNull(item?.material_budgeted_amount),
    po_amount: toNumberOrNull(item?.po_amount) ?? 0,
    invoice_amount: toNumberOrNull(item?.invoice_amount) ?? 0,
    description: item?.description ?? '',
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    is_active: true,
  }
}

export const sanitizeCoLwmInvoiceItem = (item: any = {}, index: number) => {
  const metadata = item?.metadata || {}

  return {
    order_index: Number(item?.order_index ?? index),
    co_lwm_uuid: item?.co_lwm_uuid && item.co_lwm_uuid !== '' ? item.co_lwm_uuid : null,
    cost_code_uuid:
      item?.cost_code_uuid && item.cost_code_uuid !== '' ? item.cost_code_uuid : null,
    cost_code_number: item?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? null,
    cost_code_label:
      item?.cost_code_label ??
      (item?.cost_code_number && item?.cost_code_name
        ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
        : item?.cost_code_number || item?.cost_code_name || null),
    division_name: item?.division_name ?? null,
    location_uuid:
      item?.location_uuid && item.location_uuid !== '' ? item.location_uuid : null,
    location_label: item?.location_label ?? null,
    material_budgeted_amount: toNumberOrNull(item?.material_budgeted_amount),
    co_amount: toNumberOrNull(item?.co_amount) ?? 0,
    invoice_amount: toNumberOrNull(item?.invoice_amount) ?? 0,
    description: item?.description ?? '',
    metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    is_active: true,
  }
}
