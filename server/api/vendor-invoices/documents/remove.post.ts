import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { getPrisma } from '../../../utils/prisma'

const prisma = getPrisma()

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const invoiceUuid = body?.invoice_uuid ? String(body.invoice_uuid) : ''
  const attachmentUuid = body?.attachment_uuid ? String(body.attachment_uuid) : ''

  if (!invoiceUuid) {
    throw createError({ statusCode: 400, statusMessage: 'invoice_uuid is required' })
  }
  if (!attachmentUuid) {
    throw createError({ statusCode: 400, statusMessage: 'attachment_uuid is required' })
  }

  const invoice = await prisma.vendorInvoice.findFirst({
    where: { uuid: invoiceUuid, is_active: true },
    select: { uuid: true, attachments: true },
  })
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
  }

  const existingAttachments: any[] = parseJson(invoice.attachments, [])
  const targetIndex = existingAttachments.findIndex((a) => a?.uuid === attachmentUuid)
  if (targetIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  const [targetAttachment] = existingAttachments.splice(targetIndex, 1)
  if (targetAttachment?.file_path) {
    try {
      await unlink(join(process.cwd(), 'public', String(targetAttachment.file_path)))
    } catch {
      // ignore missing files on disk
    }
  }

  const updated = await prisma.vendorInvoice.update({
    where: { uuid: invoiceUuid },
    data: { attachments: JSON.stringify(existingAttachments) },
    select: { attachments: true },
  })

  return { attachments: parseJson(updated.attachments, []) }
})
