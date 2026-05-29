import { isPoPrintDebugEnabled, poPrintDebug } from './poPrintDebug'

/**
 * Enrich a `purchase_order_items_list` row for print preview.
 * Prefer DB columns (`unit_label`, `unit_uuid`) then metadata fallbacks.
 */
export function enrichPoItemForPrint(item: any): any {
  const preferredItem = Array.isArray(item.cost_code_preferred_items)
    ? item.cost_code_preferred_items[0]
    : item.cost_code_preferred_items
  const description =
    item.description || item.item_description || preferredItem?.description || ''
  const meta =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? item.metadata
      : {}

  const unitLabel = String(
    item.unit_label ??
      item.uom_label ??
      item.uom ??
      item.unit ??
      meta.unit_label ??
      meta.uom_label ??
      meta.uom ??
      meta.unit ??
      '',
  ).trim()

  const unitUuid =
    item.unit_uuid ??
    item.uom_uuid ??
    meta.unit_uuid ??
    meta.uom_uuid ??
    null

  const enriched = {
    ...item,
    name: item.item_name || item.name || '',
    item_name: item.item_name || item.name || '',
    description,
    approval_checks_uuids:
      (Array.isArray(item.approval_checks_uuids) ? item.approval_checks_uuids : null) ||
      (Array.isArray(item.approval_checks) ? item.approval_checks : null) ||
      (Array.isArray(meta.approval_checks_uuids) ? meta.approval_checks_uuids : null) ||
      (Array.isArray(meta.approval_checks) ? meta.approval_checks : null) ||
      [],
    approval_checks:
      (Array.isArray(item.approval_checks) ? item.approval_checks : null) ||
      (Array.isArray(item.approval_checks_uuids) ? item.approval_checks_uuids : null) ||
      (Array.isArray(meta.approval_checks) ? meta.approval_checks : null) ||
      (Array.isArray(meta.approval_checks_uuids) ? meta.approval_checks_uuids : null) ||
      [],
    item_sequence:
      item.item_sequence ??
      item.sequence ??
      meta.item_sequence ??
      meta.sequence ??
      null,
    sequence:
      item.sequence ??
      item.item_sequence ??
      meta.sequence ??
      meta.item_sequence ??
      null,
    unit_uuid: unitUuid,
    uom_uuid: unitUuid,
    unit_label: unitLabel,
    uom_label: unitLabel,
    uom: unitLabel,
    unit: unitLabel,
    po_quantity: item.po_quantity ?? item.quantity ?? null,
    po_unit_price: item.po_unit_price ?? item.unit_price ?? null,
    po_total: item.po_total ?? item.total ?? null,
  }

  if (isPoPrintDebugEnabled() && (!unitLabel || !unitUuid)) {
    poPrintDebug('enrichPoItemForPrint — missing UOM on row', {
      item_name: enriched.item_name,
      unit_uuid_column: item.unit_uuid,
      unit_label_column: item.unit_label,
      uom_label_field: item.uom_label,
      metadata: meta,
      resolved_unit_uuid: unitUuid,
      resolved_unit_label: unitLabel,
    })
  }

  return enriched
}
