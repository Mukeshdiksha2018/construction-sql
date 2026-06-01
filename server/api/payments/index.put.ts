export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }
  return {
    data: {
      ...body,
      updated_at: new Date().toISOString(),
    },
  }
})
