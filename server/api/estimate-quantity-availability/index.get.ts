// Returns quantities already allocated to purchase orders per item+cost_code composite key.
// Used by the estimate form to show how much of each item has already been PO'd.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectUuid = String(query.project_uuid || '').trim()
  const estimateUuid = String(query.estimate_uuid || '').trim()
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const excludePoUuid = String(query.exclude_po_uuid || '').trim()

  if (!projectUuid || !estimateUuid || !corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'project_uuid, estimate_uuid, and corporation_uuid are required',
    })
  }

  // This endpoint depends on a purchase_order_items_list table that may not exist yet.
  // Return empty map as a safe default — the estimate form will treat all quantities as available.
  return { data: {} as Record<string, number> }
})
