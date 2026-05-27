import { checkAddressUsage } from '../../../../utils/projectAddresses'

/** GET /api/projects/addresses/:uuid/usage */
export default defineEventHandler(async (event) => {
  const uuid = String(getRouterParam(event, 'uuid') ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Address UUID is required' })

  try {
    const data = await checkAddressUsage(uuid)
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to check address usage',
    })
  }
})
