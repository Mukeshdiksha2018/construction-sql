/**
 * Audit logs / OAuth flows sometimes store placeholder user labels (e.g. "Nimble")
 * instead of a real person name. Print views should not show those as the prepared-by
 * or approved-by person when customization expects a real name.
 */
export function sanitizePrintAuditPersonLabel(value: string | null | undefined): string {
  if (value == null || typeof value !== 'string') return ''
  const t = value.trim()
  if (!t) return ''
  const lower = t.toLowerCase()
  if (lower === 'nimble' || lower === 'nimble integration') return ''
  return t
}
