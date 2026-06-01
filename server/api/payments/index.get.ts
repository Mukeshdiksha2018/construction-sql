export default defineEventHandler(async (event) => {
  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  return { data: [] }
})
