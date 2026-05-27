import { createPOInstruction, parsePOInstructionBody } from '../../utils/po-instructions'
import { useAuth } from '../../utils/use-auth'

/** POST /api/po-instructions */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parsePOInstructionBody(body)
    const data = await createPOInstruction(input, session.userID)

    return { success: true, data, message: 'PO instruction created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create PO instruction',
    })
  }
})
