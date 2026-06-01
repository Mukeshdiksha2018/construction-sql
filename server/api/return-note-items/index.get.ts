import { getReturnNoteItems, listReturnNoteItems } from '../../utils/stockReturnNotes'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {
    return_note_uuid,
    corporation_uuid,
    project_uuid,
    item_type,
    purchase_order_uuid,
    change_order_uuid,
  } = query

  if (!return_note_uuid && !corporation_uuid && !purchase_order_uuid && !change_order_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'return_note_uuid, corporation_uuid, purchase_order_uuid, or change_order_uuid is required',
    })
  }

  try {
    if (return_note_uuid) {
      const items = await getReturnNoteItems(String(return_note_uuid))
      return { data: items }
    }

    const items = await listReturnNoteItems({
      corporationUuid: corporation_uuid ? String(corporation_uuid) : undefined,
      projectUuid: project_uuid ? String(project_uuid) : undefined,
      itemType: item_type ? String(item_type) : undefined,
      purchaseOrderUuid: purchase_order_uuid ? String(purchase_order_uuid) : undefined,
      changeOrderUuid: change_order_uuid ? String(change_order_uuid) : undefined,
    })

    return { data: items }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
