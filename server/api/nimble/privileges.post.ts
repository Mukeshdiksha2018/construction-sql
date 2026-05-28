import { requireAuthSession } from '../../utils/auth-session'

/**
 * POST /api/nimble/privileges
 * Fetches Nimble privilege details for a list of menu IDs.
 * Endpoint: {NIMBLE_API_BASE_URL}/v1/Previlages
 *
 * Body: { menuIds: string[] }
 * Response: { details: Array<{ menuId, create, view, update, delete }> }
 */
export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const baseUrl = String(config.nimbleApiBaseUrl || '').trim()

  if (!baseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'NIMBLE_API_BASE_URL is not configured' })
  }

  const body = await readBody(event)
  const menuIds: string[] = Array.isArray(body?.menuIds) ? body.menuIds : []

  if (!menuIds.length) {
    return { details: [] }
  }

  // Nimble expects comma-separated IDs without the 0x prefix
  const menuIdsStr = menuIds
    .map((id) => String(id).replace(/^0x/i, '').toLowerCase())
    .join(',')

  try {
    const data = await $fetch<{
      Details: Array<{
        MenuID: string
        Create: boolean
        View: boolean
        Update: boolean
        Delete: boolean
      }>
    }>(`${baseUrl}/v1/Previlages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: { MenuIds: menuIdsStr, UserID: null, RoleID: null },
    })

    const details = (data.Details || []).map((d) => ({
      menuId: String(d.MenuID || '').toLowerCase(),
      create: Boolean(d.Create),
      view: Boolean(d.View),
      update: Boolean(d.Update),
      delete: Boolean(d.Delete),
    }))

    return { details }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch privileges from Nimble',
      data: { details: String(err) },
    })
  }
})
