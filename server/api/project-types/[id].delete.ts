import { deleteProjectType } from '../../utils/project-types'

/** DELETE /api/project-types/:id */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Project type ID is required',
      })
    }

    await deleteProjectType(id)
    return { success: true, message: 'Project type deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete project type',
    })
  }
})
