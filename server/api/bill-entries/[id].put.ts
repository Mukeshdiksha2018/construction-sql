/** Bill entry update — stub until bill_entries MSSQL tables are ported. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }
  return {
    data: {
      ...body,
      id,
      updated_at: new Date().toISOString(),
      bill_entry_lines: body?.line_items || body?.bill_entry_lines || [],
    },
  }
})
