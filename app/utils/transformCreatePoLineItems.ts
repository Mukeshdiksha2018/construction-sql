/** Map project-items-summary rows into PO form line items (pending qty → po_quantity). */
export function transformCreatePoLineItems(selectedItems: any[]): any[] {
  return selectedItems.map((item: any, index: number) => {
    const pendingQty = parseFloat(item.pending_qty || 0) || 0
    const unitPrice = parseFloat(item.unit_price || 0) || 0
    const poTotal =
      pendingQty > 0 && unitPrice > 0
        ? Math.round((pendingQty * unitPrice + Number.EPSILON) * 100) / 100
        : null

    const modelNumber = item.model_number || ''

    return {
      id: `pending-${index}-${item.item_uuid || item.cost_code_uuid || index}`,
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      cost_code_label: item.cost_code_label || '',
      division_name: item.division_name || '',
      item_type_uuid: item.item_type_uuid || null,
      item_type_label: item.item_type_label || '',
      spec_type: item.spec_type || '',
      sequence: item.sequence || '',
      item_sequence: item.sequence || '',
      sequence_uuid: item.sequence_uuid || null,
      item_uuid: item.item_uuid || null,
      name: item.item_name || '',
      description: item.description || '',
      location: item.location || '',
      location_uuid: item.location_uuid || null,
      preferred_vendor_uuid: item.preferred_vendor_uuid || null,
      unit_price: unitPrice,
      quantity: parseFloat(item.budget_qty || 0) || 0,
      total: unitPrice * parseFloat(item.budget_qty || 0) || 0,
      po_unit_price: unitPrice > 0 ? unitPrice : null,
      po_quantity: pendingQty > 0 ? pendingQty : null,
      po_total: poTotal,
      uom_uuid: item.unit_uuid || null,
      uom_label: item.unit_label || '',
      unit_label: item.unit_label || '',
      uom: item.unit_label || '',
      unit_uuid: item.unit_uuid || null,
      approval_checks: null,
      model_number: modelNumber,
      display_metadata: {
        cost_code_label: item.cost_code_label || '',
        cost_code_number: item.cost_code_number || '',
        cost_code_name: item.cost_code_name || '',
        division_name: item.division_name || '',
        spec_type: item.spec_type || '',
        item_type_label: item.item_type_label || '',
        sequence: item.sequence || '',
        location_display: item.location || '',
        unit_uuid: item.unit_uuid || null,
        unit_label: item.unit_label || '',
      },
    }
  })
}

export function lineItemsShareSingleEstimateVendor(items: any[]): boolean {
  if (items.length <= 1) return true
  const vendorKeys = new Set(items.map((it) => String(it?.preferred_vendor_uuid ?? '')))
  return vendorKeys.size <= 1
}
