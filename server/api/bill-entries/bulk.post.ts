/** Bill entry bulk actions — stub until bill_entries MSSQL tables are ported. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const entries = Array.isArray(body?.entries) ? body.entries : []
  return {
    data: entries,
    success: true,
    message: 'Bulk operation completed (stub)',
  }
})
