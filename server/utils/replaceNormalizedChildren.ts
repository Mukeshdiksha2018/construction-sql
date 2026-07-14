/**
 * Replace-set writers for normalized child tables (deleteMany + createMany).
 * Keep row counts tiny (4 charges, 2 taxes) so dual-write stays cheap.
 */
import {
  attachmentRowsFromJson,
  auditEventRowsFromJson,
  chargeRowsFromBreakdown,
  taxRowsFromBreakdown,
} from './normalizedChildren'
import { buildFinancialBreakdown as buildFb } from './financialBreakdown'

// re-export build used by callers that pass flat form fields
export { buildFb as buildFinancialBreakdownFromPayload }

type PrismaLike = any

function asBreakdown(input: any) {
  if (input?.financial_breakdown && typeof input.financial_breakdown === 'object') {
    return input.financial_breakdown
  }
  return buildFb(input ?? {})
}

export async function replacePoFinancialChildren(
  prisma: PrismaLike,
  purchaseOrderUuid: string,
  corporationUuid: string,
  input: any,
) {
  const breakdown = asBreakdown(input)
  const charges = chargeRowsFromBreakdown(breakdown, corporationUuid, purchaseOrderUuid).map((r) => ({
    ...r,
    purchase_order_uuid: purchaseOrderUuid,
  }))
  const taxes = taxRowsFromBreakdown(breakdown, corporationUuid).map((r) => ({
    ...r,
    purchase_order_uuid: purchaseOrderUuid,
  }))
  await prisma.poFinancialCharge.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  await prisma.poFinancialTax.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  if (charges.length) await prisma.poFinancialCharge.createMany({ data: charges })
  if (taxes.length) await prisma.poFinancialTax.createMany({ data: taxes })
  return breakdown
}

export async function replacePoRemovedItems(
  prisma: PrismaLike,
  purchaseOrderUuid: string,
  corporationUuid: string,
  removedItems: unknown,
) {
  await prisma.poRemovedItem.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  if (!Array.isArray(removedItems) || !removedItems.length) return
  await prisma.poRemovedItem.createMany({
    data: removedItems.map((raw: any) => {
      const item = raw && typeof raw === 'object' ? raw : {}
      const removedAt = item.removed_at ? new Date(item.removed_at) : new Date()
      return {
        corporation_uuid: corporationUuid,
        purchase_order_uuid: purchaseOrderUuid,
        item_uuid: item.item_uuid ? String(item.item_uuid) : null,
        cost_code_uuid: item.cost_code_uuid ? String(item.cost_code_uuid) : null,
        location_uuid: item.location_uuid ? String(item.location_uuid) : null,
        source_item_uuid: item.uuid || item.id ? String(item.uuid || item.id).slice(0, 36) : null,
        item_snapshot: JSON.stringify(item),
        removed_at: isNaN(removedAt.getTime()) ? new Date() : removedAt,
      }
    }),
  })
}

export async function replacePoAttachments(
  prisma: PrismaLike,
  purchaseOrderUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.poAttachment.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    purchase_order_uuid: purchaseOrderUuid,
  }))
  if (rows.length) await prisma.poAttachment.createMany({ data: rows })
}

export async function replacePoAuditEvents(
  prisma: PrismaLike,
  purchaseOrderUuid: string,
  corporationUuid: string,
  auditLog: unknown,
) {
  await prisma.poAuditEvent.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  const rows = auditEventRowsFromJson(auditLog, corporationUuid).map((r) => ({
    ...r,
    purchase_order_uuid: purchaseOrderUuid,
  }))
  if (rows.length) await prisma.poAuditEvent.createMany({ data: rows })
}

export async function replaceCoFinancialChildren(
  prisma: PrismaLike,
  changeOrderUuid: string,
  corporationUuid: string,
  input: any,
) {
  const breakdown = asBreakdown(input)
  const charges = chargeRowsFromBreakdown(breakdown, corporationUuid, changeOrderUuid).map((r) => ({
    corporation_uuid: r.corporation_uuid,
    change_order_uuid: changeOrderUuid,
    charge_key: r.charge_key,
    percentage: r.percentage,
    amount: r.amount,
    taxable: r.taxable,
  }))
  const taxes = taxRowsFromBreakdown(breakdown, corporationUuid).map((r) => ({
    ...r,
    change_order_uuid: changeOrderUuid,
  }))
  await prisma.coFinancialCharge.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  await prisma.coFinancialTax.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  if (charges.length) await prisma.coFinancialCharge.createMany({ data: charges })
  if (taxes.length) await prisma.coFinancialTax.createMany({ data: taxes })
  return breakdown
}

export async function replaceCoRemovedItems(
  prisma: PrismaLike,
  changeOrderUuid: string,
  corporationUuid: string,
  removedItems: unknown,
) {
  await prisma.coRemovedItem.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  if (!Array.isArray(removedItems) || !removedItems.length) return
  await prisma.coRemovedItem.createMany({
    data: removedItems.map((raw: any) => {
      const item = raw && typeof raw === 'object' ? raw : {}
      const removedAt = item.removed_at ? new Date(item.removed_at) : new Date()
      return {
        corporation_uuid: corporationUuid,
        change_order_uuid: changeOrderUuid,
        item_uuid: item.item_uuid ? String(item.item_uuid) : null,
        cost_code_uuid: item.cost_code_uuid ? String(item.cost_code_uuid) : null,
        location_uuid: item.location_uuid ? String(item.location_uuid) : null,
        source_item_uuid: item.uuid || item.id ? String(item.uuid || item.id).slice(0, 36) : null,
        item_snapshot: JSON.stringify(item),
        removed_at: isNaN(removedAt.getTime()) ? new Date() : removedAt,
      }
    }),
  })
}

export async function replaceCoAttachments(
  prisma: PrismaLike,
  changeOrderUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.coAttachment.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    change_order_uuid: changeOrderUuid,
  }))
  if (rows.length) await prisma.coAttachment.createMany({ data: rows })
}

export async function replaceCoAuditEvents(
  prisma: PrismaLike,
  changeOrderUuid: string,
  corporationUuid: string,
  auditLog: unknown,
) {
  await prisma.coAuditEvent.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  const rows = auditEventRowsFromJson(auditLog, corporationUuid).map((r) => ({
    ...r,
    change_order_uuid: changeOrderUuid,
  }))
  if (rows.length) await prisma.coAuditEvent.createMany({ data: rows })
}

export async function replaceViFinancialChildren(
  prisma: PrismaLike,
  vendorInvoiceUuid: string,
  corporationUuid: string,
  input: any,
) {
  const breakdown = asBreakdown(input)
  const charges = chargeRowsFromBreakdown(breakdown, corporationUuid, vendorInvoiceUuid).map((r) => ({
    corporation_uuid: r.corporation_uuid,
    vendor_invoice_uuid: vendorInvoiceUuid,
    charge_key: r.charge_key,
    percentage: r.percentage,
    amount: r.amount,
    taxable: r.taxable,
  }))
  const taxes = taxRowsFromBreakdown(breakdown, corporationUuid).map((r) => ({
    ...r,
    vendor_invoice_uuid: vendorInvoiceUuid,
  }))
  await prisma.viFinancialCharge.deleteMany({ where: { vendor_invoice_uuid: vendorInvoiceUuid } })
  await prisma.viFinancialTax.deleteMany({ where: { vendor_invoice_uuid: vendorInvoiceUuid } })
  if (charges.length) await prisma.viFinancialCharge.createMany({ data: charges })
  if (taxes.length) await prisma.viFinancialTax.createMany({ data: taxes })
  return breakdown
}

export async function replaceViAttachments(
  prisma: PrismaLike,
  vendorInvoiceUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.viAttachment.deleteMany({ where: { vendor_invoice_uuid: vendorInvoiceUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    vendor_invoice_uuid: vendorInvoiceUuid,
  }))
  if (rows.length) await prisma.viAttachment.createMany({ data: rows })
}

export async function replaceGrnFinancialChildren(
  prisma: PrismaLike,
  receiptNoteUuid: string,
  corporationUuid: string,
  input: any,
) {
  const breakdown = asBreakdown(input)
  const charges = chargeRowsFromBreakdown(breakdown, corporationUuid, receiptNoteUuid).map((r) => ({
    corporation_uuid: r.corporation_uuid,
    receipt_note_uuid: receiptNoteUuid,
    charge_key: r.charge_key,
    percentage: r.percentage,
    amount: r.amount,
    taxable: r.taxable,
  }))
  const taxes = taxRowsFromBreakdown(breakdown, corporationUuid).map((r) => ({
    ...r,
    receipt_note_uuid: receiptNoteUuid,
  }))
  await prisma.grnFinancialCharge.deleteMany({ where: { receipt_note_uuid: receiptNoteUuid } })
  await prisma.grnFinancialTax.deleteMany({ where: { receipt_note_uuid: receiptNoteUuid } })
  if (charges.length) await prisma.grnFinancialCharge.createMany({ data: charges })
  if (taxes.length) await prisma.grnFinancialTax.createMany({ data: taxes })
  return breakdown
}

export async function replaceGrnAttachments(
  prisma: PrismaLike,
  receiptNoteUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.grnAttachment.deleteMany({ where: { receipt_note_uuid: receiptNoteUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    receipt_note_uuid: receiptNoteUuid,
  }))
  if (rows.length) await prisma.grnAttachment.createMany({ data: rows })
}

export async function replaceGrnAuditEvents(
  prisma: PrismaLike,
  receiptNoteUuid: string,
  corporationUuid: string,
  auditLog: unknown,
) {
  await prisma.grnAuditEvent.deleteMany({ where: { receipt_note_uuid: receiptNoteUuid } })
  const rows = auditEventRowsFromJson(auditLog, corporationUuid).map((r) => ({
    ...r,
    receipt_note_uuid: receiptNoteUuid,
  }))
  if (rows.length) await prisma.grnAuditEvent.createMany({ data: rows })
}

export async function replaceReturnFinancialChildren(
  prisma: PrismaLike,
  returnNoteUuid: string,
  corporationUuid: string,
  input: any,
) {
  const breakdown = asBreakdown(input)
  const charges = chargeRowsFromBreakdown(breakdown, corporationUuid, returnNoteUuid).map((r) => ({
    corporation_uuid: r.corporation_uuid,
    return_note_uuid: returnNoteUuid,
    charge_key: r.charge_key,
    percentage: r.percentage,
    amount: r.amount,
    taxable: r.taxable,
  }))
  const taxes = taxRowsFromBreakdown(breakdown, corporationUuid).map((r) => ({
    ...r,
    return_note_uuid: returnNoteUuid,
  }))
  await prisma.returnFinancialCharge.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  await prisma.returnFinancialTax.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  if (charges.length) await prisma.returnFinancialCharge.createMany({ data: charges })
  if (taxes.length) await prisma.returnFinancialTax.createMany({ data: taxes })
  return breakdown
}

export async function replaceReturnAttachments(
  prisma: PrismaLike,
  returnNoteUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.returnAttachment.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    return_note_uuid: returnNoteUuid,
  }))
  if (rows.length) await prisma.returnAttachment.createMany({ data: rows })
}

export async function replaceReturnAuditEvents(
  prisma: PrismaLike,
  returnNoteUuid: string,
  corporationUuid: string,
  auditLog: unknown,
) {
  await prisma.returnAuditEvent.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  const rows = auditEventRowsFromJson(auditLog, corporationUuid).map((r) => ({
    ...r,
    return_note_uuid: returnNoteUuid,
  }))
  if (rows.length) await prisma.returnAuditEvent.createMany({ data: rows })
}

export async function replacePoItemJunctions(
  prisma: PrismaLike,
  itemUuid: string,
  approvalCheckUuids: unknown,
  receiptNoteUuids: unknown,
) {
  await prisma.poItemApprovalCheck.deleteMany({ where: { purchase_order_item_uuid: itemUuid } })
  await prisma.poItemReceiptNote.deleteMany({ where: { purchase_order_item_uuid: itemUuid } })
  const checks = Array.isArray(approvalCheckUuids)
    ? approvalCheckUuids.map((id) => String(id).trim()).filter(Boolean)
    : []
  const receipts = Array.isArray(receiptNoteUuids)
    ? receiptNoteUuids.map((id) => String(id).trim()).filter(Boolean)
    : []
  if (checks.length) {
    await prisma.poItemApprovalCheck.createMany({
      data: checks.map((approval_check_uuid) => ({
        purchase_order_item_uuid: itemUuid,
        approval_check_uuid,
      })),
      skipDuplicates: true,
    })
  }
  if (receipts.length) {
    await prisma.poItemReceiptNote.createMany({
      data: receipts.map((receipt_note_uuid) => ({
        purchase_order_item_uuid: itemUuid,
        receipt_note_uuid,
      })),
      skipDuplicates: true,
    })
  }
}

export async function replaceCoItemJunctions(
  prisma: PrismaLike,
  itemUuid: string,
  approvalCheckUuids: unknown,
  receiptNoteUuids: unknown,
) {
  await prisma.coItemApprovalCheck.deleteMany({ where: { change_order_item_uuid: itemUuid } })
  await prisma.coItemReceiptNote.deleteMany({ where: { change_order_item_uuid: itemUuid } })
  const checks = Array.isArray(approvalCheckUuids)
    ? approvalCheckUuids.map((id) => String(id).trim()).filter(Boolean)
    : []
  const receipts = Array.isArray(receiptNoteUuids)
    ? receiptNoteUuids.map((id) => String(id).trim()).filter(Boolean)
    : []
  if (checks.length) {
    await prisma.coItemApprovalCheck.createMany({
      data: checks.map((approval_check_uuid) => ({
        change_order_item_uuid: itemUuid,
        approval_check_uuid,
      })),
      skipDuplicates: true,
    })
  }
  if (receipts.length) {
    await prisma.coItemReceiptNote.createMany({
      data: receipts.map((receipt_note_uuid) => ({
        change_order_item_uuid: itemUuid,
        receipt_note_uuid,
      })),
      skipDuplicates: true,
    })
  }
}

export async function replaceEstimateAttachments(
  prisma: PrismaLike,
  estimateUuid: string,
  corporationUuid: string,
  attachments: unknown,
) {
  await prisma.estimateAttachment.deleteMany({ where: { estimate_uuid: estimateUuid } })
  const rows = attachmentRowsFromJson(attachments, corporationUuid).map((r) => ({
    ...r,
    estimate_uuid: estimateUuid,
  }))
  if (rows.length) await prisma.estimateAttachment.createMany({ data: rows })
}

export async function replaceEstimateAuditEvents(
  prisma: PrismaLike,
  estimateUuid: string,
  corporationUuid: string,
  auditLog: unknown,
) {
  await prisma.estimateAuditEvent.deleteMany({ where: { estimate_uuid: estimateUuid } })
  const rows = auditEventRowsFromJson(auditLog, corporationUuid).map((r) => ({
    ...r,
    estimate_uuid: estimateUuid,
  }))
  if (rows.length) await prisma.estimateAuditEvent.createMany({ data: rows })
}

export async function replaceEstimateRemovedCostCodes(
  prisma: PrismaLike,
  estimateUuid: string,
  corporationUuid: string,
  costCodeUuids: unknown,
) {
  await prisma.estimateRemovedCostCode.deleteMany({ where: { estimate_uuid: estimateUuid } })
  const ids = Array.isArray(costCodeUuids)
    ? [...new Set(costCodeUuids.map((id) => String(id).trim()).filter(Boolean))]
    : []
  if (!ids.length) return
  await prisma.estimateRemovedCostCode.createMany({
    data: ids.map((cost_code_uuid) => ({
      corporation_uuid: corporationUuid,
      estimate_uuid: estimateUuid,
      cost_code_uuid,
    })),
    skipDuplicates: true,
  })
}

export async function replaceProjectDocumentTags(
  prisma: PrismaLike,
  projectDocumentUuid: string,
  tags: unknown,
) {
  await prisma.projectDocumentTag.deleteMany({ where: { project_document_uuid: projectDocumentUuid } })
  const list = Array.isArray(tags)
    ? [...new Set(tags.map((t) => String(t).trim()).filter(Boolean).map((t) => t.slice(0, 100)))]
    : []
  if (!list.length) return
  await prisma.projectDocumentTag.createMany({
    data: list.map((tag) => ({
      project_document_uuid: projectDocumentUuid,
      tag,
    })),
    skipDuplicates: true,
  })
}
