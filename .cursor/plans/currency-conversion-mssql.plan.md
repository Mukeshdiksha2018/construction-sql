---
name: Currency Conversion MSSQL
overview: "PO/CO currency conversion on MSSQL: four header columns, Prisma API normalization, shared UI utils, display-only CAD/USD dual amounts."
status: in_progress
todos:
  - id: migration
    content: Prisma migration for currency columns on purchase_order_forms and change_orders
    status: in_progress
  - id: api-store
    content: Normalize currency fields in PO/CO API handlers and stores
    status: pending
  - id: ui
    content: Wire PoCurrencyConversionBar into PO/CO forms, previews, reports
    status: pending
  - id: print
    content: PoPreviewCurrencyPrintBar on PO/CO/vendor-invoice print pages
    status: pending
isProject: true
---

# Currency conversion (MSSQL)

Ported from construction-management. Key paths in **construction-sql**:

| Area | Path |
|------|------|
| Schema | `prisma/schema.prisma` — `PurchaseOrderForm`, `ChangeOrder` |
| Util | `app/utils/poCurrencyConversion.ts` |
| Report util | `app/utils/reportPoCurrencyDisplay.ts` |
| API lookup | `server/api/currency-conversion/recent.get.ts`, `recent-vendor.get.ts` |
| UI bar | `app/components/purchaseOrders/PoCurrencyConversionBar.vue` |
| Dual display | `PoDualCurrencyDisplay.vue`, `CadUsdDualAmountDisplay.vue` |

Design: stored amounts stay in `currency_from`; conversion is display/print-only.
