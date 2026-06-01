import { supabaseServer } from "~/utils/supabaseServer";
import { accruedHoldbackFromProgressInvoice } from "~/server/utils/vendorInvoiceAccruedHoldback";

/** Net invoice amount excluding sales taxes (aligned with advance payment display logic). */
function netVendorInvoiceAmountWithoutTaxes(invoice: {
  amount?: string | number | null;
  financial_breakdown?: unknown;
}): number {
  const totalAmount = parseFloat(String(invoice.amount ?? "0")) || 0;
  let taxTotal = 0;
  if (invoice.financial_breakdown) {
    try {
      let breakdown: any = invoice.financial_breakdown;
      if (typeof breakdown === "string") {
        try {
          breakdown = JSON.parse(breakdown);
        } catch {
          // ignore parse errors
        }
      }
      const totals = breakdown?.totals || breakdown || {};
      if (breakdown?.sales_taxes) {
        const salesTaxes = breakdown.sales_taxes;
        const tax1 =
          parseFloat(salesTaxes.sales_tax_1?.amount || salesTaxes.salesTax1?.amount || "0") || 0;
        const tax2 =
          parseFloat(salesTaxes.sales_tax_2?.amount || salesTaxes.salesTax2?.amount || "0") || 0;
        taxTotal = tax1 + tax2;
      } else {
        taxTotal = parseFloat(totals.tax_total || totals.taxTotal || "0") || 0;
      }
    } catch {
      taxTotal = 0;
    }
  }
  return totalAmount - taxTotal;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Item-level "remaining to be invoiced" (for modal "Balance to be Invoiced")
 * = sum(remaining_qty_item * unit_price_item).
 *
 * If required item-link fields (unit price + item uuid mapping from invoice rows)
 * are missing, returns null so caller can fall back to the legacy calculation.
 */
function computeBalanceToBeInvoicedByItems(args: {
  coItems: Array<{ uuid?: string; co_quantity?: unknown; co_unit_price?: unknown; unit_price?: unknown }>;
  invoiceItems: Array<{ co_item_uuid?: string; invoice_quantity?: unknown }>;
  advancePaid: number;
}): number | null {
  const { coItems, invoiceItems, advancePaid } = args;

  const hasUnitPrice =
    coItems.some((it) => it?.co_unit_price !== null && it?.co_unit_price !== undefined) ||
    coItems.some((it) => it?.unit_price !== null && it?.unit_price !== undefined);
  const hasItemUuid =
    invoiceItems.some((it) => it?.co_item_uuid !== null && it?.co_item_uuid !== undefined);

  if (!hasUnitPrice || !hasItemUuid) return null;

  const invoicedQtyByItemUuid = new Map<string, number>();
  for (const invIt of invoiceItems) {
    if (!invIt?.co_item_uuid) continue;
    const prev = invoicedQtyByItemUuid.get(invIt.co_item_uuid) ?? 0;
    invoicedQtyByItemUuid.set(
      invIt.co_item_uuid,
      prev + toNumber(invIt.invoice_quantity)
    );
  }

  const remainingItemsAmount = coItems.reduce((sum, coIt) => {
    if (!coIt?.uuid) return sum;
    const coQty = toNumber(coIt.co_quantity);
    const unitPrice = toNumber(coIt.co_unit_price ?? coIt.unit_price);
    const invoicedQty = invoicedQtyByItemUuid.get(coIt.uuid) ?? 0;
    const remainingQty = Math.max(0, coQty - invoicedQty);
    return sum + remainingQty * unitPrice;
  }, 0);

  return Math.max(0, remainingItemsAmount - advancePaid);
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const query = getQuery(event);

  if (method !== "GET") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  const { change_order_uuid, currentInvoiceUuid } = query;

  if (!change_order_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "change_order_uuid is required",
    });
  }

  try {
    // Fetch the change order to get total amount
    // Total is stored in financial_breakdown JSON column
    const { data: coData, error: coError } = await supabaseServer
      .from("change_orders")
      .select("uuid, financial_breakdown")
      .eq("uuid", change_order_uuid as string)
      .maybeSingle();

    if (coError) {
      console.error("Error fetching CO:", coError);
      throw createError({
        statusCode: 500,
        statusMessage: "Database error: " + coError.message,
      });
    }

    if (!coData) {
      throw createError({
        statusCode: 404,
        statusMessage: "Change order not found",
      });
    }

    // Extract total_co_amount from financial_breakdown JSON
    let totalCOValue = 0;
    if (coData.financial_breakdown) {
      try {
        const breakdown =
          typeof coData.financial_breakdown === "string"
            ? JSON.parse(coData.financial_breakdown)
            : coData.financial_breakdown;
        const totals = breakdown?.totals || {};
        totalCOValue =
          parseFloat(totals.total_co_amount || totals.totalAmount || totals.total || "0") || 0;
      } catch (parseError) {
        console.error("Error parsing financial_breakdown:", parseError);
        totalCOValue = 0;
      }
    }

    // Calculate advance payment made (sum of invoice amounts where invoice_type is AGAINST_ADVANCE_PAYMENT)
    const { data: advanceInvoices, error: advanceInvoicesError } = await supabaseServer
      .from("vendor_invoices")
      .select("amount, financial_breakdown")
      .eq("change_order_uuid", change_order_uuid as string)
      .eq("invoice_type", "AGAINST_ADVANCE_PAYMENT")
      .eq("is_active", true);

    if (advanceInvoicesError) {
      console.error("Error fetching advance payment invoices:", advanceInvoicesError);
    }

    const advancePaid =
      advanceInvoices?.reduce((sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice), 0) ||
      0;

    /** Sum of advance invoice `amount` (total payable, including sales tax) — for POCOSelect "Advance Paid" column. */
    const advancePaidIncludingTaxes =
      advanceInvoices?.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0) || 0;

    // Calculate invoiced value (sum of vendor_invoices where change_order_uuid matches, invoice_type is AGAINST_CO)
    // Exclude sales taxes so this matches advance_paid / holdback logic and labor item totals (POCOSelect balance column).
    const { data: invoices, error: invoicesError } = await supabaseServer
      .from("vendor_invoices")
      .select("amount, financial_breakdown, holdback")
      .eq("change_order_uuid", change_order_uuid as string)
      .eq("invoice_type", "AGAINST_CO")
      .eq("is_active", true);

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
    }

    const invoicedValue =
      invoices?.reduce(
        (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
        0
      ) || 0;

    const holdbackAccruedOnProgress =
      invoices?.reduce((sum, invoice) => sum + accruedHoldbackFromProgressInvoice(invoice), 0) || 0;

    const { data: holdbackInvoices, error: holdbackInvoicesError } = await supabaseServer
      .from("vendor_invoices")
      .select("amount, financial_breakdown")
      .eq("change_order_uuid", change_order_uuid as string)
      .eq("invoice_type", "AGAINST_HOLDBACK_AMOUNT")
      .eq("is_active", true);

    if (holdbackInvoicesError) {
      console.error("Error fetching holdback invoices:", holdbackInvoicesError);
    }

    const holdbackReleased =
      holdbackInvoices?.reduce(
        (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
        0
      ) || 0;

    const holdbackBalanceToBeInvoiced = Math.max(0, holdbackAccruedOnProgress - holdbackReleased);

    const grossBalanceRemaining = Math.max(
      0,
      totalCOValue - advancePaid - invoicedValue - holdbackReleased
    );

    const balanceToBeInvoicedLegacy = Math.max(
      0,
      grossBalanceRemaining - holdbackBalanceToBeInvoiced
    );

    // Aggregate quantity summary from original CO items + saved CO invoice items.
    // `change_order_items_list` does not include invoice-specific fields (e.g. invoice_quantity),
    // so we compute:
    // - total CO qty from `change_order_items_list.co_quantity`
    // - qty invoiced from `change_order_invoice_items_list.invoice_quantity` for vendor invoices
    //   of type AGAINST_CO against this change_order_uuid
    // - qty remaining = max(0, total - invoiced)
    const { data: coItemRows, error: coItemsError } = await supabaseServer
      .from("change_order_items_list")
      .select("uuid, co_quantity, co_unit_price, unit_price")
      .eq("change_order_uuid", change_order_uuid as string)
      .eq("is_active", true);

    if (coItemsError) {
      console.error("Error fetching CO item quantities:", coItemsError);
    }

    const totalCOQuantity =
      coItemRows?.reduce((sum, it: any) => sum + toNumber(it?.co_quantity), 0) || 0;

    const { data: vendorInvoiceUuids, error: vendorInvoicesError } = await supabaseServer
      .from("vendor_invoices")
      .select("uuid")
      .eq("change_order_uuid", change_order_uuid as string)
      .eq("invoice_type", "AGAINST_CO")
      .eq("is_active", true);

    if (vendorInvoicesError) {
      console.error("Error fetching vendor invoices for CO quantity aggregation:", vendorInvoicesError);
    }

    const invoiceUuids =
      vendorInvoiceUuids?.map((i: any) => i?.uuid).filter((u: any) => !!u) || [];

    let invoicedQuantity = 0;
    let coInvoiceItemRows: Array<{ co_item_uuid?: string; invoice_quantity?: unknown }> = [];
    if (invoiceUuids.length > 0) {
      const { data: coInvoiceItemRowsRaw, error: coInvoiceItemsError } = await supabaseServer
        .from("change_order_invoice_items_list")
        .select("co_item_uuid, invoice_quantity")
        .in("vendor_invoice_uuid", invoiceUuids)
        .eq("is_active", true);

      if (coInvoiceItemsError) {
        console.error("Error fetching CO invoice item quantities:", coInvoiceItemsError);
      } else {
        invoicedQuantity =
          (coInvoiceItemRowsRaw as any[])?.reduce(
            (sum: number, it: any) => sum + toNumber(it?.invoice_quantity),
            0
          ) || 0;

        coInvoiceItemRows = (coInvoiceItemRowsRaw as any[])?.map((it: any) => ({
          co_item_uuid: it?.co_item_uuid,
          invoice_quantity: it?.invoice_quantity,
        })) || [];
      }
    }

    const qtyRemainingToBeInvoiced = Math.max(0, totalCOQuantity - invoicedQuantity);

    const balanceToBeInvoicedByItems = computeBalanceToBeInvoicedByItems({
      coItems: coItemRows as any[],
      invoiceItems: coInvoiceItemRows,
      advancePaid,
    });

    const balanceToBeInvoiced = balanceToBeInvoicedByItems ?? balanceToBeInvoicedLegacy;

    return {
      data: {
        change_order_uuid: change_order_uuid as string,
        total_co_value: totalCOValue,
        advance_paid: advancePaid,
        advance_paid_including_taxes: advancePaidIncludingTaxes,
        invoiced_value: invoicedValue,
        holdback_released: holdbackReleased,
        holdback_balance_to_be_invoiced: holdbackBalanceToBeInvoiced,
        balance_to_be_invoiced: balanceToBeInvoiced,
        total_co_quantity: totalCOQuantity,
        invoiced_quantity: invoicedQuantity,
        qty_remaining_to_be_invoiced: qtyRemainingToBeInvoiced,
      },
    };
  } catch (error: any) {
    console.error("API Error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error: " + error.message,
    });
  }
});
