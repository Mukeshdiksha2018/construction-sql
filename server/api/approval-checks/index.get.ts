import { listApprovalChecks } from '../../utils/approval-checks'

/** GET /api/approval-checks */
export default defineEventHandler(async () => {
  try {
    const data = await listApprovalChecks()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch approval checks',
    })
  }
})
