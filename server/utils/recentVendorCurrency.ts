import { createError } from 'h3'
import {
  pickMoreRecentVendorCurrencyFrom,
  type PoCurrencyCode,
  type RecentVendorCurrencyCandidate,
} from '../../app/utils/poCurrencyConversion'
import { getPrisma } from './prisma'

const VENDOR_CURRENCY_SELECT = {
  currency_from: true,
  created_at: true,
} as const

type VendorCurrencyRow = {
  currency_from: string | null
  created_at: Date
}

function toCandidate(
  row: VendorCurrencyRow | null
): RecentVendorCurrencyCandidate | null {
  if (!row) return null
  return {
    currency_from: row.currency_from,
    created_at: row.created_at.toISOString(),
  }
}

async function fetchLatestPurchaseOrderVendorCurrency(
  corporationUuid: string,
  vendorUuid: string
): Promise<RecentVendorCurrencyCandidate | null> {
  try {
    const row = await getPrisma().purchaseOrderForm.findFirst({
      where: {
        corporation_uuid: corporationUuid,
        vendor_uuid: vendorUuid,
        is_active: true,
      },
      select: VENDOR_CURRENCY_SELECT,
      orderBy: { created_at: 'desc' },
    })
    return toCandidate(row)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch recent purchase order vendor currency: ${message}`,
    })
  }
}

async function fetchLatestChangeOrderVendorCurrency(
  corporationUuid: string,
  vendorUuid: string
): Promise<RecentVendorCurrencyCandidate | null> {
  try {
    const row = await getPrisma().changeOrder.findFirst({
      where: {
        corporation_uuid: corporationUuid,
        vendor_uuid: vendorUuid,
        is_active: true,
      },
      select: VENDOR_CURRENCY_SELECT,
      orderBy: { created_at: 'desc' },
    })
    return toCandidate(row)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch recent change order vendor currency: ${message}`,
    })
  }
}

export async function fetchRecentVendorCurrencyFrom(
  corporationUuid: string,
  vendorUuid: string
): Promise<PoCurrencyCode | null> {
  const corp = String(corporationUuid || '').trim()
  const vendor = String(vendorUuid || '').trim()
  if (!corp || !vendor) return null

  const [purchaseOrder, changeOrder] = await Promise.all([
    fetchLatestPurchaseOrderVendorCurrency(corp, vendor),
    fetchLatestChangeOrderVendorCurrency(corp, vendor),
  ])

  return pickMoreRecentVendorCurrencyFrom(purchaseOrder, changeOrder)
}
