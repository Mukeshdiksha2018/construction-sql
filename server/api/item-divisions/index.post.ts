export default defineEventHandler(async (_event) => {
  throw createError({ statusCode: 501, statusMessage: 'Item divisions API not yet implemented' })
})
