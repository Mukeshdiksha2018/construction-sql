import { randomUUID } from 'node:crypto'

/** Bill entry create — stub until bill_entries MSSQL tables are ported. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = randomUUID()
  const now = new Date().toISOString()
  return {
    data: {
      ...body,
      id,
      created_at: now,
      updated_at: now,
      bill_entry_lines: body?.line_items || [],
    },
  }
})
