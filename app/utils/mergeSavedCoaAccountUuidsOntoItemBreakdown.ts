export type ItemBreakdownRow = { accountUuid: string; total: number };

/**
 * Overlays saved Configure COA account UUIDs onto the current computed breakdown by row index.
 * - `savedRows` (item_breakdown_by_account): optional per-row accountUuid + total from form.
 * - `coaAssignments` (vendor_invoice_coa_assignments): segment `item_breakdown:N` → gl_account_uuid.
 * Totals always come from `computedRows`.
 */
export function mergeSavedCoaAccountUuidsOntoItemBreakdown<
  T extends ItemBreakdownRow,
>(
  computedRows: T[],
  savedRows: Array<{ accountUuid?: string; total?: number }> | null | undefined,
  coaAssignments?: Array<{
    segment?: string;
    gl_account_uuid?: string | null;
  }> | null
): T[] {
  if (!Array.isArray(computedRows) || computedRows.length === 0) {
    return computedRows;
  }

  const glByIndex = new Map<number, string>();
  if (Array.isArray(coaAssignments)) {
    for (const r of coaAssignments) {
      const seg = String(r?.segment ?? "").trim();
      const m = /^item_breakdown:(\d+)$/.exec(seg);
      if (!m || !r?.gl_account_uuid) continue;
      const idx = parseInt(m[1], 10);
      if (!Number.isFinite(idx) || idx < 0) continue;
      glByIndex.set(idx, String(r.gl_account_uuid).trim());
    }
  }

  return computedRows.map((row, i) => {
    const fromSaved =
      savedRows?.[i]?.accountUuid != null
        ? String(savedRows[i]!.accountUuid).trim()
        : "";
    const fromTable = glByIndex.get(i) ?? "";
    const uuid = fromSaved || fromTable;
    if (uuid) {
      return { ...row, accountUuid: uuid };
    }
    return row;
  });
}
