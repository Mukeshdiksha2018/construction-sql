import { createError } from 'h3'
import {
  pickMoreRecentCurrencyConversion,
  type PoCurrencyConversionFields,
  type RecentCurrencyConversionCandidate,
} from '../../app/utils/poCurrencyConversion'
import { getPrisma } from './prisma'

const RECENT_CURRENCY_SELECT = {
  currency_from: true,
  currency_to: true,
  conversion_rate: true,
  created_at: true,
} as const

type RecentCurrencyRow = {
  currency_from: string | null
  currency_to: string | null
  conversion_rate: unknown
  created_at: Date
}

function toCandidate(
  row: RecentCurrencyRow | null
): RecentCurrencyConversionCandidate | null {
  if (!row) return null
  return {
    currency_from: row.currency_from,
    currency_to: row.currency_to,
    conversion_rate:
      row.conversion_rate != null ? Number(row.conversion_rate) : undefined,
    created_at: row.created_at.toISOString(),
  }
}

async function fetchLatestConvertedPurchaseOrder(
  corporationUuid: string
): Promise<RecentCurrencyConversionCandidate | null> {
  try {
    const row = await getPrisma().purchaseOrderForm.findFirst({
      where: {
        corporation_uuid: corporationUuid,
        currency_conversion_enabled: true,
        is_active: true,
      },
      select: RECENT_CURRENCY_SELECT,
      orderBy: { created_at: 'desc' },
    })
    return toCandidate(row)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch recent purchase order currency: ${message}`,
    })
  }
}

async function fetchLatestConvertedChangeOrder(
  corporationUuid: string
): Promise<RecentCurrencyConversionCandidate | null> {
  try {
    const row = await getPrisma().changeOrder.findFirst({
      where: {
        corporation_uuid: corporationUuid,
        currency_conversion_enabled: true,
        is_active: true,
      },
      select: RECENT_CURRENCY_SELECT,
      orderBy: { created_at: 'desc' },
    })
    return toCandidate(row)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch recent change order currency: ${message}`,
    })
  }
}

export async function fetchRecentCorporationCurrencyConversion(
  corporationUuid: string
): Promise<PoCurrencyConversionFields | null> {
  const corp = String(corporationUuid || '').trim()
  if (!corp) return null

  const [purchaseOrder, changeOrder] = await Promise.all([
    fetchLatestConvertedPurchaseOrder(corp),
    fetchLatestConvertedChangeOrder(corp),
  ])

  return pickMoreRecentCurrencyConversion(purchaseOrder, changeOrder)
}
