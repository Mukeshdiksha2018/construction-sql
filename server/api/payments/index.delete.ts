export default defineEventHandler(async (event) => {
  const { id } = getQuery(event)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }
  return { data: { id: String(id) } }
})
