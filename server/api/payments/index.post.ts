import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const now = new Date().toISOString()
  return {
    data: {
      ...body,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    },
  }
})
