import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { attachmentsJsonFromRows } from '../../../utils/normalizedChildren'
import { getPrisma } from '../../../utils/prisma'
import { replaceViAttachments } from '../../../utils/replaceNormalizedChildren'

const prisma = getPrisma()

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
    select: { uuid: true, corporation_uuid: true },
  })
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
  }

  const existingRows = await prisma.viAttachment.findMany({
    where: { vendor_invoice_uuid: invoiceUuid },
    orderBy: { sort_order: 'asc' },
  })
  const existingAttachments = attachmentsJsonFromRows(existingRows)
  const targetIndex = existingAttachments.findIndex(
    (a) => a?.uuid === attachmentUuid,
  )
  if (targetIndex === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  const [targetAttachment] = existingAttachments.splice(targetIndex, 1)
  if (targetAttachment?.file_path) {
    try {
      await unlink(join(process.cwd(), 'public', String(targetAttachment.file_path)))
    }
    catch {
      // ignore missing files on disk
    }
  }

  await replaceViAttachments(prisma, invoiceUuid, invoice.corporation_uuid, existingAttachments)

  return { attachments: existingAttachments }
})
