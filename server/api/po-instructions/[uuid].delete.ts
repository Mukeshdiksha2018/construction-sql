import { deletePOInstruction } from '../../utils/po-instructions'

/** DELETE /api/po-instructions/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PO Instruction UUID is required',
      })
    }

    await deletePOInstruction(uuid)
    return { success: true, message: 'PO instruction deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete PO instruction',
    })
  }
})
