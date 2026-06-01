/** Audit logs list — stub until audit_logs MSSQL table is ported. */
export default defineEventHandler(async (event) => {
  const { entity_type, entity_id, corporation_uuid } = getQuery(event)
  if (!entity_type || !entity_id || !corporation_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'entity_type, entity_id, and corporation_uuid are required',
    })
  }
  return { success: true, data: [] }
})
