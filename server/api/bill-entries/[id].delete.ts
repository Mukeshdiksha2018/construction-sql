/** Bill entry delete — stub until bill_entries MSSQL tables are ported. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }
  return { data: { id } }
})
