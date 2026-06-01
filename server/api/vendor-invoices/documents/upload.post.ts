import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPrisma } from '../../../utils/prisma'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const prisma = getPrisma()

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

function decodeBase64File(data: string): Buffer {
  const matches = data.match(/^data:(.*?);base64,(.*)$/)
  const base64String = matches ? matches[2] : data
  return Buffer.from(base64String, 'base64')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const invoiceUuid = body?.invoice_uuid ? String(body.invoice_uuid) : ''
  const files = body?.files

  if (!invoiceUuid) {
    throw createError({ statusCode: 400, statusMessage: 'invoice_uuid is required' })
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Files array is required and must not be empty' })
  }

  const invoice = await prisma.vendorInvoice.findFirst({
    where: { uuid: invoiceUuid, is_active: true },
    select: { uuid: true, attachments: true },
  })
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
  }

  const existingAttachments: any[] = parseJson(invoice.attachments, [])
  const uploadedAttachments: any[] = []
  const errors: Array<{ fileName: string; error: string }> = []

  const uploadDir = join(process.cwd(), 'public', 'vendor-invoice-documents', invoiceUuid)
  await mkdir(uploadDir, { recursive: true })

  for (const file of files) {
    try {
      const name = file?.name
      const type = file?.type
      const size = Number(file?.size)
      const fileData: string | undefined = file?.fileData || file?.url || file?.file

      if (!name || !type || Number.isNaN(size) || !fileData) {
        errors.push({ fileName: name || 'Unknown', error: 'Missing required file properties' })
        continue
      }
      if (!ALLOWED_TYPES.includes(type)) {
        errors.push({ fileName: name, error: 'Invalid file type. Only PDF or image files are allowed' })
        continue
      }
      if (size > MAX_FILE_SIZE) {
        errors.push({ fileName: name, error: 'File size too large. Maximum size is 10MB' })
        continue
      }

      const buffer = decodeBase64File(fileData)
      if (!buffer.length) {
        errors.push({ fileName: name, error: 'Unable to decode file contents' })
        continue
      }

      const extension = name.includes('.') ? name.split('.').pop() : 'pdf'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
      const relativePath = `vendor-invoice-documents/${invoiceUuid}/${fileName}`
      await writeFile(join(process.cwd(), 'public', relativePath), buffer)

      uploadedAttachments.push({
        uuid: randomUUID(),
        document_name: name,
        mime_type: type,
        file_size: size,
        file_url: `/${relativePath}`,
        file_path: relativePath,
        uploaded_at: new Date().toISOString(),
      })
    } catch (err: any) {
      errors.push({ fileName: file?.name || 'Unknown', error: err?.message || 'Unknown error' })
    }
  }

  if (uploadedAttachments.length === 0) {
    return { success: false, attachments: existingAttachments, errors }
  }

  const updatedAttachments = [...existingAttachments, ...uploadedAttachments]
  const updated = await prisma.vendorInvoice.update({
    where: { uuid: invoiceUuid },
    data: { attachments: JSON.stringify(updatedAttachments) },
    select: { attachments: true },
  })

  return {
    success: true,
    attachments: parseJson(updated.attachments, []),
    errors,
  }
})
