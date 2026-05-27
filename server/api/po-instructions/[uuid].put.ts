import { parsePOInstructionUpdateBody, updatePOInstruction } from '../../utils/po-instructions'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/po-instructions/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PO Instruction UUID is required',
      })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parsePOInstructionUpdateBody(body)
    const data = await updatePOInstruction(uuid, input, session.userID)

    return { success: true, data, message: 'PO instruction updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update PO instruction',
    })
  }
})
