import { createProjectType, parseProjectTypeBody } from '../../utils/project-types'
import { useAuth } from '../../utils/use-auth'

/** POST /api/project-types */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseProjectTypeBody(body)
    const data = await createProjectType(input, session.userID)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create project type',
    })
  }
})
