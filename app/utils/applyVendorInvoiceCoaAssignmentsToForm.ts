/**
 * Merge persisted vendor_invoice_coa_assignments (on form.coa_assignments) into
 * flat form fields used by FinancialBreakdown / Configure COA for charges and sales taxes.
 *
 * Item-line GLs are *not* written to item_breakdown_by_account here (would leave total 0 and
 * break getCoaBreakdownForSave). Those are merged at display time via
 * mergeSavedCoaAccountUuidsOntoItemBreakdown(..., form.coa_assignments).
 */
export function applyVendorInvoiceCoaAssignmentsToForm(
  form: Record<string, any>
): void {
  const rows = form.coa_assignments;
  if (!Array.isArray(rows) || rows.length === 0) return;

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const seg = String((row as any).segment ?? "").trim();
    const glRaw = (row as any).gl_account_uuid;
    const gl = glRaw != null ? String(glRaw).trim() : "";
    if (!seg || !gl) continue;

    if (seg.startsWith("item_breakdown:")) {
      continue;
    }
    if (seg === "charge:freight_charges") {
      form.freight_charges_account_uuid = gl;
    } else if (seg === "charge:packing_charges") {
      form.packing_charges_account_uuid = gl;
    } else if (seg === "charge:custom_duties_charges") {
      form.custom_duties_charges_account_uuid = gl;
    } else if (seg === "charge:other_charges") {
      form.other_charges_account_uuid = gl;
    } else if (seg === "tax:sales_tax_1") {
      form.sales_tax_1_account_uuid = gl;
    } else if (seg === "tax:sales_tax_2") {
      form.sales_tax_2_account_uuid = gl;
    }
  }
}
