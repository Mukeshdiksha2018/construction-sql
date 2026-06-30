export const TAX_ROUNDING_NOTE_MIN_INVOICES = 2
export const TAX_ROUNDING_NOTE_MIN_DELTA = 0.01
export const TAX_ROUNDING_NOTE_MAX_DELTA = 0.05

export type TaxRoundingInvoiceLine = {
  invoiceUuid: string
  invoiceNumber: string | null
  tax: number
  tax1: number
  tax2: number
  itemTotal: number
  chargesTotal: number
}

export type TaxRoundingNote = {
  documentType: 'PO' | 'CO'
  documentNumber: string | null
  documentUuid: string
  contractTax: number
  invoicedTaxSum: number
  taxDelta: number
  contractTax1: number
  contractTax2: number
  invoicedTax1Sum: number
  invoicedTax2Sum: number
  invoices: TaxRoundingInvoiceLine[]
}

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export const parseFinancialBreakdown = (raw: unknown): Record<string, any> => {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {}
}

export const resolveTaxFromFinancialBreakdown = (financialBreakdown: Record<string, any>) => {
  const totals = financialBreakdown?.totals || {}
  const itemTotal = parseFloat(String(totals.item_total ?? totals.itemTotal ?? 0)) || 0
  const chargesTotal = parseFloat(String(totals.charges_total ?? totals.chargesTotal ?? 0)) || 0
  const taxTotalFromTotals =
    parseFloat(String(totals.tax_total ?? totals.taxTotal ?? 0)) || 0

  const salesTaxes = financialBreakdown?.sales_taxes
  if (salesTaxes) {
    const tax1 =
      parseFloat(
        String(salesTaxes.sales_tax_1?.amount ?? salesTaxes.salesTax1?.amount ?? 0)
      ) || 0
    const tax2 =
      parseFloat(
        String(salesTaxes.sales_tax_2?.amount ?? salesTaxes.salesTax2?.amount ?? 0)
      ) || 0
    const taxFromLines = roundMoney(tax1 + tax2)
    return {
      taxAmount: taxFromLines,
      tax1: roundMoney(tax1),
      tax2: roundMoney(tax2),
      itemTotal: roundMoney(itemTotal),
      chargesTotal: roundMoney(chargesTotal),
    }
  }

  return {
    taxAmount: roundMoney(taxTotalFromTotals),
    tax1: 0,
    tax2: 0,
    itemTotal: roundMoney(itemTotal),
    chargesTotal: roundMoney(chargesTotal),
  }
}

/** Penny-level drift from per-invoice rounding when a PO/CO is split across multiple invoices. */
export const isPennyRoundingTaxDelta = (taxDelta: number, invoiceCount: number): boolean => {
  if (invoiceCount < TAX_ROUNDING_NOTE_MIN_INVOICES) return false
  const absDelta = Math.abs(roundMoney(taxDelta))
  return absDelta >= TAX_ROUNDING_NOTE_MIN_DELTA && absDelta <= TAX_ROUNDING_NOTE_MAX_DELTA
}

type InvoiceTaxBucket = {
  vendorUuid: string
  invoiceTaxSum: number
  invoicedTax1Sum: number
  invoicedTax2Sum: number
  invoices: TaxRoundingInvoiceLine[]
}

export const createInvoiceTaxBucketMap = () => new Map<string, InvoiceTaxBucket>()

export const appendInvoiceToTaxBucket = (
  buckets: Map<string, InvoiceTaxBucket>,
  documentUuid: string,
  vendorUuid: string,
  invoice: {
    uuid?: string | null
    number?: string | null
    taxBreakdown: ReturnType<typeof resolveTaxFromFinancialBreakdown>
  }
) => {
  const key = String(documentUuid || '').trim()
  if (!key) return

  const bucket = buckets.get(key) || {
    vendorUuid,
    invoiceTaxSum: 0,
    invoicedTax1Sum: 0,
    invoicedTax2Sum: 0,
    invoices: [],
  }

  bucket.invoiceTaxSum = roundMoney(bucket.invoiceTaxSum + invoice.taxBreakdown.taxAmount)
  bucket.invoicedTax1Sum = roundMoney(bucket.invoicedTax1Sum + invoice.taxBreakdown.tax1)
  bucket.invoicedTax2Sum = roundMoney(bucket.invoicedTax2Sum + invoice.taxBreakdown.tax2)
  bucket.invoices.push({
    invoiceUuid: String(invoice.uuid || '').trim(),
    invoiceNumber: invoice.number ?? null,
    tax: invoice.taxBreakdown.taxAmount,
    tax1: invoice.taxBreakdown.tax1,
    tax2: invoice.taxBreakdown.tax2,
    itemTotal: invoice.taxBreakdown.itemTotal,
    chargesTotal: invoice.taxBreakdown.chargesTotal,
  })
  buckets.set(key, bucket)
}

type ContractTaxRecord = {
  documentNumber: string | null
  vendorUuid: string | null
  tax: ReturnType<typeof resolveTaxFromFinancialBreakdown>
}

export const buildTaxRoundingNotesForVendor = (
  vendorUuid: string,
  poTaxByUuid: Map<string, ContractTaxRecord>,
  coTaxByUuid: Map<string, ContractTaxRecord>,
  invoiceTaxByPoUuid: Map<string, InvoiceTaxBucket>,
  invoiceTaxByCoUuid: Map<string, InvoiceTaxBucket>
): TaxRoundingNote[] => {
  const notes: TaxRoundingNote[] = []

  const maybeAddNote = (
    documentType: 'PO' | 'CO',
    documentUuid: string,
    contract: ContractTaxRecord | undefined,
    bucket: InvoiceTaxBucket | undefined
  ) => {
    if (!contract || !bucket || bucket.vendorUuid !== vendorUuid) return
    const contractTax = contract.tax.taxAmount
    const invoicedTaxSum = bucket.invoiceTaxSum
    const taxDelta = roundMoney(invoicedTaxSum - contractTax)
    if (!isPennyRoundingTaxDelta(taxDelta, bucket.invoices.length)) return

    notes.push({
      documentType,
      documentNumber: contract.documentNumber,
      documentUuid,
      contractTax,
      invoicedTaxSum,
      taxDelta,
      contractTax1: contract.tax.tax1,
      contractTax2: contract.tax.tax2,
      invoicedTax1Sum: bucket.invoicedTax1Sum,
      invoicedTax2Sum: bucket.invoicedTax2Sum,
      invoices: [...bucket.invoices],
    })
  }

  for (const [poUuid, bucket] of invoiceTaxByPoUuid.entries()) {
    maybeAddNote('PO', poUuid, poTaxByUuid.get(poUuid), bucket)
  }
  for (const [coUuid, bucket] of invoiceTaxByCoUuid.entries()) {
    maybeAddNote('CO', coUuid, coTaxByUuid.get(coUuid), bucket)
  }

  return notes.sort((a, b) =>
    String(a.documentNumber || a.documentUuid).localeCompare(
      String(b.documentNumber || b.documentUuid)
    )
  )
}
