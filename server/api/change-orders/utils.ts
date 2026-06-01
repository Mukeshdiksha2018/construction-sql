import {
  buildFinancialBreakdown,
  hasFinancialPayload,
  sanitizeAttachments,
} from "~/server/api/purchase-order-forms/utils";

const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const sanitizeChangeOrderItem = (item: any = {}, index: number) => {
  const rawMeta =
    item?.metadata ||
    item?.display_metadata ||
    item?.displayMetadata;

  let mergedMeta: Record<string, any> = {};
  if (typeof rawMeta === "string") {
    try {
      const parsed = JSON.parse(rawMeta);
      if (parsed && typeof parsed === "object") mergedMeta = { ...parsed };
    } catch {
      mergedMeta = {};
    }
  } else if (rawMeta && typeof rawMeta === "object") {
    mergedMeta = { ...rawMeta };
  }

  const seqFromItem =
    item?.item_sequence ??
    item?.sequence ??
    item?.spec ??
    mergedMeta?.item_sequence ??
    mergedMeta?.sequence ??
    mergedMeta?.spec;
  if (seqFromItem !== undefined && seqFromItem !== null && String(seqFromItem).trim() !== "") {
    const s = String(seqFromItem).trim();
    if (!mergedMeta.sequence) mergedMeta.sequence = s;
    if (!mergedMeta.item_sequence) mergedMeta.item_sequence = s;
  }

  const metadata = mergedMeta;

  return {
    order_index: Number(item?.order_index ?? index),
    source: item?.source ?? null,

    cost_code_uuid: item?.cost_code_uuid ?? metadata?.cost_code_uuid ?? null,
    cost_code_label:
      item?.cost_code_label ??
      metadata?.cost_code_label ??
      metadata?.cost_code ??
      null,
    cost_code_number:
      item?.cost_code_number ?? metadata?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? metadata?.cost_code_name ?? null,
    division_name: item?.division_name ?? metadata?.division_name ?? null,

    // Denormalized item category name (e.g. 'procurement', 'construction')
    category: item?.category ?? metadata?.category ?? null,

    // Item division reference
    item_division_uuid:
      item?.item_division_uuid ?? metadata?.item_division_uuid ?? null,

    item_type_uuid: item?.item_type_uuid ?? null,
    item_type_label: item?.item_type_label ?? metadata?.item_type_label ?? null,

    item_uuid: item?.item_uuid ?? null,
    item_name:
      item?.name ??
      item?.item_name ??
      metadata?.item_name ??
      item?.description ??
      "",
    description: item?.description ?? "",
    model_number: item?.model_number ?? metadata?.model_number ?? "",

    // Project location (from global locations table)
    location_uuid: item?.location_uuid ?? metadata?.location_uuid ?? null,
    location_label:
      item?.location ??
      metadata?.location_display ??
      metadata?.location_name ??
      null,

    // Storage location (from storage_locations table)
    storage_location_uuid:
      item?.storage_location_uuid ?? metadata?.storage_location_uuid ?? null,
    storage_location_label:
      item?.storage_location_label ??
      item?.storage_location ??
      metadata?.storage_location_label ??
      metadata?.storage_location_name ??
      null,

    unit_uuid: item?.unit_uuid ?? item?.uom_uuid ?? metadata?.unit_uuid ?? null,
    unit_label:
      item?.unit_label ??
      item?.uom_label ??
      metadata?.unit_label ??
      metadata?.unit ??
      null,

    quantity: toNumberOrNull(item?.co_quantity),
    unit_price: toNumberOrNull(item?.co_unit_price),
    co_quantity: toNumberOrNull(item?.co_quantity),
    co_unit_price: toNumberOrNull(item?.co_unit_price),
    co_total: toNumberOrNull(item?.co_total),
    total: toNumberOrNull(item?.total),

    // Map approval_checks (from frontend) to approval_checks_uuids (for DB)
    approval_checks_uuids:
      Array.isArray(item?.approval_checks) && item.approval_checks.length > 0
        ? item.approval_checks
        : (Array.isArray(item?.approval_checks_uuids) && item.approval_checks_uuids.length > 0
          ? item.approval_checks_uuids
          : []),

    configuration_name:
      item?.configuration_name ?? metadata?.configuration_name ?? null,

    metadata,
    is_active: true,
  };
};

const safeNumber = (value: any): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeBoolean = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return Boolean(value);
};

// Decorate a change order record with financial fields extracted from financial_breakdown
export const decorateChangeOrderRecord = <T extends Record<string, any>>(
  record: T
): T => {
  if (!record) return record;

  const breakdown =
    (record as any).financial_breakdown ??
    (record as any).financialBreakdown ??
    {};

  const charges =
    (breakdown as any).charges ??
    (breakdown as any).charges_breakdown ??
    {};
  const salesTaxes =
    (breakdown as any).sales_taxes ??
    (breakdown as any).salesTaxes ??
    (breakdown as any).taxes ??
    {};
  const totals =
    (breakdown as any).totals ??
    (breakdown as any).total_breakdown ??
    {};

  const freight = (charges as any).freight ?? {};
  const packing = (charges as any).packing ?? {};
  const custom = (charges as any).custom_duties ?? (charges as any).custom ?? {};
  const other = (charges as any).other ?? {};

  const salesTax1 =
    (salesTaxes as any).sales_tax_1 ?? (salesTaxes as any).salesTax1 ?? {};
  const salesTax2 =
    (salesTaxes as any).sales_tax_2 ?? (salesTaxes as any).salesTax2 ?? {};

  // Charges
  (record as any).freight_charges_percentage = safeNumber(
    (freight as any).percentage
  );
  (record as any).freight_charges_amount = safeNumber(
    (freight as any).amount
  );
  (record as any).freight_charges_taxable = safeBoolean(
    (freight as any).taxable
  );

  (record as any).packing_charges_percentage = safeNumber(
    (packing as any).percentage
  );
  (record as any).packing_charges_amount = safeNumber(
    (packing as any).amount
  );
  (record as any).packing_charges_taxable = safeBoolean(
    (packing as any).taxable
  );

  (record as any).custom_duties_charges_percentage = safeNumber(
    (custom as any).percentage
  );
  (record as any).custom_duties_charges_amount = safeNumber(
    (custom as any).amount
  );
  (record as any).custom_duties_charges_taxable = safeBoolean(
    (custom as any).taxable
  );

  (record as any).other_charges_percentage = safeNumber(
    (other as any).percentage
  );
  (record as any).other_charges_amount = safeNumber(
    (other as any).amount
  );
  (record as any).other_charges_taxable = safeBoolean(
    (other as any).taxable
  );

  // Sales taxes
  (record as any).sales_tax_1_percentage = safeNumber(
    (salesTax1 as any).percentage
  );
  (record as any).sales_tax_1_amount = safeNumber(
    (salesTax1 as any).amount
  );
  (record as any).sales_tax_2_percentage = safeNumber(
    (salesTax2 as any).percentage
  );
  (record as any).sales_tax_2_amount = safeNumber(
    (salesTax2 as any).amount
  );

  // Extract totals from financial breakdown
  const totalsFromBreakdown = totals || {};
  (record as any).item_total = safeNumber(totalsFromBreakdown.item_total);
  (record as any).charges_total = safeNumber(totalsFromBreakdown.charges_total);
  (record as any).tax_total = safeNumber(totalsFromBreakdown.tax_total);
  // For total_co_amount, prefer total_co_amount from totals, fallback to total_po_amount
  (record as any).total_co_amount = safeNumber(
    totalsFromBreakdown.total_co_amount || totalsFromBreakdown.total_po_amount
  );

  if (!Array.isArray((record as any).attachments)) {
    (record as any).attachments = [];
  }

  if (!Array.isArray((record as any).removed_co_items)) {
    (record as any).removed_co_items = [];
  }

  (record as any).financial_breakdown = breakdown;

  return record;
};

const emptyLaborCharges = () => ({
  freight: { percentage: 0, amount: null, taxable: false },
  packing: { percentage: 0, amount: null, taxable: false },
  custom_duties: { percentage: 0, amount: null, taxable: false },
  other: { percentage: 0, amount: null, taxable: false },
});

const emptyLaborSalesTaxes = () => ({
  sales_tax_1: { percentage: 0, amount: null },
  sales_tax_2: { percentage: 0, amount: null },
});

/**
 * Build financial breakdown for labor COs: sync item total from labor lines while
 * preserving sales taxes (and totals) from the client payload when present.
 */
export const buildLaborCOFinancialBreakdown = (
  laborItemsTotal: number,
  payload?: Record<string, any> | null
) => {
  const roundedItemTotal = safeNumber(laborItemsTotal) ?? 0;

  if (
    payload &&
    (hasFinancialPayload(payload) ||
      (payload.financial_breakdown &&
        typeof payload.financial_breakdown === "object"))
  ) {
    const breakdown = buildFinancialBreakdown({
      ...payload,
      item_total: roundedItemTotal,
    });

    const totals = { ...(breakdown.totals ?? {}) };
    const taxTotal =
      safeNumber(payload.tax_total) ?? safeNumber(totals.tax_total) ?? 0;
    const totalCo =
      safeNumber(payload.total_co_amount) ??
      safeNumber(totals.total_co_amount) ??
      safeNumber(totals.total_po_amount) ??
      roundedItemTotal + taxTotal;

    return {
      ...breakdown,
      charges: breakdown.charges ?? emptyLaborCharges(),
      sales_taxes: breakdown.sales_taxes ?? emptyLaborSalesTaxes(),
      totals: {
        ...totals,
        item_total: roundedItemTotal,
        charges_total: 0,
        tax_total: taxTotal,
        total_co_amount: totalCo,
        total_po_amount: totalCo,
      },
    };
  }

  return {
    charges: emptyLaborCharges(),
    sales_taxes: emptyLaborSalesTaxes(),
    totals: {
      item_total: roundedItemTotal,
      charges_total: 0,
      tax_total: 0,
      total_co_amount: roundedItemTotal,
      total_po_amount: roundedItemTotal,
    },
  };
};

export { buildFinancialBreakdown, hasFinancialPayload, sanitizeAttachments };


