import { getPrisma } from './prisma'

export type PoCoOrderType = 'MATERIAL' | 'LABOR'

/** Vendor UUIDs that have at least one active Approved/Completed/Partially_Received PO or CO. */
export async function fetchVendorUuidsWithPoOrCo(params: {
  corporationUuid: string
  projectUuid?: string | null
  orderType?: PoCoOrderType | null
}): Promise<string[]> {
  const corporationUuid = String(params.corporationUuid || '').trim()
  if (!corporationUuid) return []

  const projectUuid = params.projectUuid ? String(params.projectUuid).trim() : null
  const orderType = params.orderType
    ? String(params.orderType).trim().toUpperCase()
    : null

  const prisma = getPrisma()
  const allowedStatuses = ['Approved', 'Completed', 'Partially_Received', 'partially_received']

  const baseWhere = {
    corporation_uuid: corporationUuid,
    is_active: true,
    status: { in: allowedStatuses },
    vendor_uuid: { not: null as string | null },
    ...(projectUuid ? { project_uuid: projectUuid } : {}),
  }

  const [poVendors, coVendors] = await Promise.all([
    prisma.purchaseOrderForm.findMany({
      where: {
        ...baseWhere,
        ...(orderType === 'MATERIAL' || orderType === 'LABOR'
          ? { po_type: orderType }
          : {}),
      },
      select: { vendor_uuid: true },
      distinct: ['vendor_uuid'],
    }),
    prisma.changeOrder.findMany({
      where: {
        ...baseWhere,
        ...(orderType === 'MATERIAL' || orderType === 'LABOR'
          ? { co_type: orderType }
          : {}),
      },
      select: { vendor_uuid: true },
      distinct: ['vendor_uuid'],
    }),
  ])

  const ids = new Set<string>()
  for (const row of poVendors) {
    const id = String(row.vendor_uuid || '').trim()
    if (id) ids.add(id)
  }
  for (const row of coVendors) {
    const id = String(row.vendor_uuid || '').trim()
    if (id) ids.add(id)
  }
  return [...ids]
}
