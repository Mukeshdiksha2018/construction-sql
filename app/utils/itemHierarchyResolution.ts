import { getCategoryLabel } from '~/constants/itemCategories'

export function pickFirstSequence(...values: (string | number | null | undefined)[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue
    const t = String(v).trim()
    if (t) return t
  }
  return ''
}

export type ItemDivisionConfigRow = { division_name?: string | null; category?: string | null }
export type ItemTypeConfigRow = {
  category?: string | null
  item_division_uuid?: string | null
  item_type?: string | null
  short_name?: string | null
}

export function buildItemDivisionConfigMap(rows: any[]): Map<string, ItemDivisionConfigRow> {
  const map = new Map<string, ItemDivisionConfigRow>()
  for (const d of rows || []) {
    if (d?.uuid) map.set(String(d.uuid), { division_name: d.division_name ?? '', category: d.category ?? '' })
  }
  return map
}

export function buildItemTypeConfigMap(rows: any[]): Map<string, ItemTypeConfigRow> {
  const map = new Map<string, ItemTypeConfigRow>()
  for (const t of rows || []) {
    if (t?.uuid) map.set(String(t.uuid), { category: t.category ?? '', item_division_uuid: t.item_division_uuid ?? null, item_type: t.item_type ?? '', short_name: t.short_name ?? '' })
  }
  return map
}

export function buildPreferredItemTypeMetaLookup(preferredItems: any[]) {
  const byPreferredUuid = new Map<string, { item_type_uuid?: string | null; item_type_label?: string | null }>()
  const byMasterItemUuid = new Map<string, { item_type_uuid?: string | null; item_type_label?: string | null }>()
  for (const p of preferredItems || []) {
    if (!p?.uuid) continue
    const meta = { item_type_uuid: p.item_type_uuid ?? null, item_type_label: p.item_type_label ?? null }
    byPreferredUuid.set(String(p.uuid), meta)
    const masterId = p.item_uuid
    if (masterId && String(masterId) !== String(p.uuid) && !byMasterItemUuid.has(String(masterId))) {
      byMasterItemUuid.set(String(masterId), meta)
    }
  }
  return { byPreferredUuid, byMasterItemUuid }
}

export function mergeItemTypeFromPreferredCatalog(item: any, meta: ReturnType<typeof buildPreferredItemTypeMetaLookup>) {
  const pref = item.item_uuid
    ? meta.byPreferredUuid.get(String(item.item_uuid)) || meta.byMasterItemUuid.get(String(item.item_uuid))
    : undefined
  if (!pref) return { ...item }
  return {
    ...item,
    item_type_uuid: item.item_type_uuid || pref.item_type_uuid,
    item_type_label: pickFirstSequence(item.item_type_label, pref.item_type_label) || item.item_type_label,
  }
}

export type ItemHierarchyResolved = {
  _category_value: string
  _category_label: string
  _division_name: string
  _item_type_label: string
  _resolved_item_division_uuid: string | undefined
}

export function resolveItemHierarchyFields(
  item: any,
  divisionByUuid: Map<string, ItemDivisionConfigRow>,
  itemTypeByUuid: Map<string, ItemTypeConfigRow>
): ItemHierarchyResolved {
  const lineCategory = String(item.category ?? item.item_category ?? '').trim()
  const lineDivisionLabel = pickFirstSequence(item.division_name, item.division_label)

  const typeUuid = item.item_type_uuid ? String(item.item_type_uuid) : ''
  if (typeUuid && itemTypeByUuid.has(typeUuid)) {
    const t = itemTypeByUuid.get(typeUuid)!
    const typeDivUuid = t.item_division_uuid ? String(t.item_division_uuid) : ''
    let categoryValue = String(t.category ?? '').trim()
    let divisionName = '-'
    let resolvedDivUuid: string | undefined

    if (typeDivUuid && divisionByUuid.has(typeDivUuid)) {
      const divRow = divisionByUuid.get(typeDivUuid)!
      divisionName = String(divRow.division_name ?? '').trim() || '-'
      resolvedDivUuid = typeDivUuid
      if (!categoryValue) categoryValue = String(divRow.category ?? '').trim()
    } else if (item.item_division_uuid && divisionByUuid.has(String(item.item_division_uuid))) {
      const alt = String(item.item_division_uuid)
      const divRow = divisionByUuid.get(alt)!
      divisionName = String(divRow.division_name ?? '').trim() || '-'
      resolvedDivUuid = alt
      if (!categoryValue) categoryValue = String(divRow.category ?? '').trim()
    } else {
      divisionName = lineDivisionLabel || '-'
      resolvedDivUuid = typeDivUuid || (item.item_division_uuid ? String(item.item_division_uuid) : undefined)
    }

    if (!categoryValue) categoryValue = lineCategory
    const typeLabel = pickFirstSequence(t.item_type, t.short_name, item.item_type_label, item.item_type) || '-'

    return { _category_value: categoryValue, _category_label: getCategoryLabel(categoryValue), _division_name: divisionName, _item_type_label: typeLabel, _resolved_item_division_uuid: resolvedDivUuid }
  }

  const divUuid = item.item_division_uuid ? String(item.item_division_uuid) : ''
  if (divUuid && divisionByUuid.has(divUuid)) {
    const r = divisionByUuid.get(divUuid)!
    let categoryValue = String(r.category ?? '').trim()
    if (!categoryValue) categoryValue = lineCategory
    return { _category_value: categoryValue, _category_label: getCategoryLabel(categoryValue), _division_name: String(r.division_name ?? '').trim() || '-', _item_type_label: pickFirstSequence(item.item_type_label, item.item_type) || '-', _resolved_item_division_uuid: divUuid }
  }

  return { _category_value: lineCategory, _category_label: getCategoryLabel(lineCategory), _division_name: lineDivisionLabel || '-', _item_type_label: pickFirstSequence(item.item_type_label, item.item_type) || '-', _resolved_item_division_uuid: divUuid || undefined }
}

export function stockReportItemToHierarchyInput(item: {
  category?: string
  divisionUuid?: string
  divisionName?: string
  itemTypeUuid?: string
  itemTypeName?: string
  projectItemUuid?: string
}): Record<string, any> {
  return {
    category: item.category, item_category: item.category,
    item_division_uuid: item.divisionUuid || undefined, division_name: item.divisionName, division_label: item.divisionName,
    item_type_uuid: item.itemTypeUuid || undefined, item_type_label: item.itemTypeName, item_type: item.itemTypeName,
    item_uuid: item.projectItemUuid,
  }
}
