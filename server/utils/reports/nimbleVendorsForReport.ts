import type { H3Event } from 'h3'
import { requireAuthSession } from '../auth-session'
import { toNimbleCorpId } from '../nimbleVendorMaster'

export async function fetchNimbleVendorNamesForUuids(
  event: H3Event,
  corporationUuid: string,
  vendorUuids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (!vendorUuids.length) return map

  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const api3BaseUrl = String((config as Record<string, unknown>).nimbleApi3Url || '')
    .trim()
    .replace(/\/$/, '')
  if (!api3BaseUrl) return map

  try {
    const data = await $fetch<{ vendorContractMasterList?: Array<{ vendorID?: string; vendorName?: string }> }>(
      `${api3BaseUrl}/v1/VendorContractMaster/List`,
      {
        query: { CorpID: toNimbleCorpId(corporationUuid) },
        headers: { Authorization: `Bearer ${session.token}` },
      },
    )
    const wanted = new Set(vendorUuids.map((id) => String(id).trim().toLowerCase()))
    for (const v of data?.vendorContractMasterList ?? []) {
      const id = String(v.vendorID ?? '').trim()
      if (!id) continue
      if (wanted.has(id.toLowerCase())) {
        map.set(id, String(v.vendorName ?? 'N/A'))
      }
    }
  } catch {
    // ignore
  }

  for (const id of vendorUuids) {
    if (!map.has(id)) map.set(id, id)
  }

  return map
}
