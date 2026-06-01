import { mssqlQueryParams } from '../../utils/mssql'

interface CustomerOptionRow {
  uuid?: string
  corporation_uuid?: string
  project_uuid?: string | null
  salutation?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  company_name?: string | null
  customer_email?: string | null
  profile_image_url?: string | null
}

/** GET /api/customers/options?corporation_uuid=...&project_uuid=... */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid ?? '').trim()
  const projectUuid = String(query.project_uuid ?? '').trim()

  if (!corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  }

  try {
    const rows = projectUuid
      ? await mssqlQueryParams<CustomerOptionRow>(
          `
            SELECT uuid, corporation_uuid, project_uuid, salutation,
              first_name, middle_name, last_name, company_name,
              customer_email, profile_image_url
            FROM dbo.customers
            WHERE corporation_uuid = @corporationUuid
              AND (project_uuid IS NULL OR project_uuid = @projectUuid)
              AND ISNULL(is_active, 1) = 1
            ORDER BY first_name ASC, last_name ASC
          `,
          { corporationUuid, projectUuid },
        )
      : await mssqlQueryParams<CustomerOptionRow>(
          `
            SELECT uuid, corporation_uuid, project_uuid, salutation,
              first_name, middle_name, last_name, company_name,
              customer_email, profile_image_url
            FROM dbo.customers
            WHERE corporation_uuid = @corporationUuid
              AND ISNULL(is_active, 1) = 1
            ORDER BY first_name ASC, last_name ASC
          `,
          { corporationUuid },
        )

    return {
      success: true,
      data: rows.map(row => ({
        uuid: String(row.uuid ?? '').toLowerCase(),
        corporation_uuid: String(row.corporation_uuid ?? '').toLowerCase(),
        project_uuid: row.project_uuid ? String(row.project_uuid).toLowerCase() : null,
        salutation: row.salutation ?? null,
        first_name: row.first_name ?? null,
        middle_name: row.middle_name ?? null,
        last_name: row.last_name ?? null,
        company_name: row.company_name ?? null,
        customer_email: row.customer_email ?? null,
        profile_image_url: row.profile_image_url ?? null,
      })).filter(row => row.uuid),
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch customer options',
    })
  }
})
