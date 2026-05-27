import { deleteApprovalCheck } from '../../utils/approval-checks'

/** DELETE /api/approval-checks/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Approval Check UUID is required' })
    }

    await deleteApprovalCheck(uuid)
    return { success: true, message: 'Approval Check deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete approval check',
    })
  }
})
