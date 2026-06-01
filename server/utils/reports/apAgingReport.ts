/**
 * AP aging from bill_entry_lines — MSSQL tables not ported yet.
 * Returns an empty report shape so the UI loads without errors.
 */
export function getApAgingReportStub() {
  return {
    summary: {
      total_amount: 0,
      current: 0,
      days31_60: 0,
      days61_90: 0,
      over90: 0,
    },
    vendors: [] as unknown[],
    generated_at: new Date().toISOString(),
  }
}
