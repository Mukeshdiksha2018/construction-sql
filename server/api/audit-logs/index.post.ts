import { randomUUID } from 'node:crypto'

/** Audit log create — stub until audit_logs MSSQL table is ported. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const now = new Date().toISOString()
  return {
    success: true,
    data: {
      id: randomUUID(),
      ...body,
      created_at: now,
      updated_at: now,
    },
  }
})
