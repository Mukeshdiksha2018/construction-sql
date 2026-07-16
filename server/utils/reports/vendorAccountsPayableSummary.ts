import type { H3Event } from 'h3'
import { getPrisma } from '../prisma'
import { APPROVED_PO_CO_STATUSES, toNum } from './reportHelpers'
import { fetchNimbleVendorNamesForUuids } from './nimbleVendorsForReport'
import { normalizePoCurrencyConversionFields } from '../../../app/utils/poCurrencyConversion'
import {
  aggregateVendorCurrencyAmounts,
  sumVendorCurrencyAggregates,
  type VendorPoAmountAggregate,
} from '../../../app/utils/reportPoCurrencyDisplay'
import {
  isFullyPaidInvoiceStatus,
  isPartiallyPaidInvoiceStatus,
  isReportEligibleVendorInvoiceStatus,
} from '../../../app/utils/invoiceReportPaymentTotals'
import {
  appendInvoiceToTaxBucket,
  buildTaxRoundingNotesForVendor,
  createInvoiceTaxBucketMap,
  resolveTaxFromFinancialBreakdown,
} from '../vendorApSummaryTaxRounding'
import {
  assembleFinancialBreakdownMap,
  type FinancialBreakdownShape,
} from '../normalizedChildren'

const prisma = getPrisma()

function parseInvoiceFinancialAmount(invoice: {
  amount?: unknown
  financial_breakdown?: FinancialBreakdownShape | null
}): number {
  const totals = (invoice.financial_breakdown?.totals || {}) as Record<string, unknown>
  const raw =
    totals.total_invoice_amount ?? totals.totalInvoiceAmount ?? invoice.amount ?? 0
  return parseFloat(String(raw)) || 0
}

function extractContractAmountFromBreakdown(
  financialBreakdown: FinancialBreakdownShape | null | undefined,
  kind: 'po' | 'co',
  fallbackAmount?: unknown,
): number {
  const totals = financialBreakdown?.totals || {}
  const raw =
    kind === 'po'
      ? totals.total_po_amount ?? totals.totalAmount ?? totals.total ?? fallbackAmount
      : totals.total_co_amount ?? totals.totalAmount ?? totals.total ?? fallbackAmount
  return parseFloat(String(raw ?? 0)) || 0
}

function buildContractCurrencySource(
  record: Record<string, unknown>,
  kind: 'po' | 'co',
  financialBreakdown: FinancialBreakdownShape | null | undefined,
) {
  const currency = normalizePoCurrencyConversionFields(record)
  const fallback =
    kind === 'po' ? record.total_po_amount : record.total_co_amount
  return {
    amount: extractContractAmountFromBreakdown(financialBreakdown, kind, fallback),
    currency_conversion_enabled: currency.currency_conversion_enabled,
    currency_from: currency.currency_from,
    currency_to: currency.currency_to,
    conversion_rate: currency.conversion_rate,
  }
}

const emptyVendorCurrencyAggregate = (): VendorPoAmountAggregate => ({
  cadTotal: 0,
  usdFromTotal: 0,
  showDual: false,
})

export async function getVendorAccountsPayableSummary(
  event: H3Event,
  options: {
    corporationUuid: string
    projectUuid: string
    startDate: string
    endDate: string
  },
) {
  const { corporationUuid, projectUuid, startDate, endDate } = options

  const project = await prisma.project.findFirst({
    where: { uuid: projectUuid, corporation_uuid: corporationUuid, is_active: true },
    select: { uuid: true, project_name: true, project_id: true },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const [purchaseOrders, changeOrders, invoices] = await Promise.all([
    prisma.purchaseOrderForm.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        status: { in: APPROVED_PO_CO_STATUSES },
        is_active: true,
      },
      select: {
        uuid: true,
        vendor_uuid: true,
        po_number: true,
        item_total: true,
        charges_total: true,
        tax_total: true,
        total_po_amount: true,
        currency_conversion_enabled: true,
        currency_from: true,
        currency_to: true,
        conversion_rate: true,
      },
    }),
    prisma.changeOrder.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        status: { in: APPROVED_PO_CO_STATUSES },
        is_active: true,
      },
      select: {
        uuid: true,
        vendor_uuid: true,
        co_number: true,
        currency_conversion_enabled: true,
        currency_from: true,
        currency_to: true,
        conversion_rate: true,
      },
    }),
    prisma.vendorInvoice.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        is_active: true,
        bill_date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: {
        uuid: true,
        number: true,
        vendor_uuid: true,
        invoice_type: true,
        purchase_order_uuid: true,
        change_order_uuid: true,
        status: true,
        amount: true,
        holdback: true,
      },
    }),
  ])

  const poUuids = purchaseOrders.map((r) => r.uuid)
  const coUuids = changeOrders.map((r) => r.uuid)
  const invoiceUuids = invoices.map((r) => r.uuid)

  const [poChargeRows, poTaxRows, coChargeRows, coTaxRows, viChargeRows, viTaxRows] =
    await Promise.all([
      poUuids.length
        ? prisma.poFinancialCharge.findMany({ where: { purchase_order_uuid: { in: poUuids } } })
        : Promise.resolve([]),
      poUuids.length
        ? prisma.poFinancialTax.findMany({ where: { purchase_order_uuid: { in: poUuids } } })
        : Promise.resolve([]),
      coUuids.length
        ? prisma.coFinancialCharge.findMany({ where: { change_order_uuid: { in: coUuids } } })
        : Promise.resolve([]),
      coUuids.length
        ? prisma.coFinancialTax.findMany({ where: { change_order_uuid: { in: coUuids } } })
        : Promise.resolve([]),
      invoiceUuids.length
        ? prisma.viFinancialCharge.findMany({ where: { vendor_invoice_uuid: { in: invoiceUuids } } })
        : Promise.resolve([]),
      invoiceUuids.length
        ? prisma.viFinancialTax.findMany({ where: { vendor_invoice_uuid: { in: invoiceUuids } } })
        : Promise.resolve([]),
    ])

  const poHeaderTotals = new Map(
    purchaseOrders.map((r) => [
      r.uuid,
      {
        item_total: r.item_total,
        charges_total: r.charges_total,
        tax_total: r.tax_total,
        total_po_amount: r.total_po_amount,
      },
    ]),
  )
  const poFbByUuid = assembleFinancialBreakdownMap(
    poChargeRows,
    poTaxRows,
    'purchase_order_uuid',
    poHeaderTotals,
  )
  const coFbByUuid = assembleFinancialBreakdownMap(
    coChargeRows,
    coTaxRows,
    'change_order_uuid',
  )
  const viHeaderTotals = new Map(
    invoices.map((r) => [r.uuid, { total_invoice_amount: r.amount }]),
  )
  const viFbByUuid = assembleFinancialBreakdownMap(
    viChargeRows,
    viTaxRows,
    'vendor_invoice_uuid',
    viHeaderTotals,
  )

  const eligibleInvoices = invoices.filter((invoice) =>
    isReportEligibleVendorInvoiceStatus(invoice.status),
  )

  const vendorUuids = new Set<string>()
  for (const po of purchaseOrders) if (po.vendor_uuid) vendorUuids.add(po.vendor_uuid)
  for (const co of changeOrders) if (co.vendor_uuid) vendorUuids.add(co.vendor_uuid)
  for (const inv of eligibleInvoices) if (inv.vendor_uuid) vendorUuids.add(inv.vendor_uuid)

  const nimbleVendorNames = await fetchNimbleVendorNamesForUuids(
    event,
    corporationUuid,
    [...vendorUuids],
  )

  const poTaxByUuid = new Map<
    string,
    {
      documentNumber: string | null
      vendorUuid: string | null
      tax: ReturnType<typeof resolveTaxFromFinancialBreakdown>
    }
  >()
  const coTaxByUuid = new Map<
    string,
    {
      documentNumber: string | null
      vendorUuid: string | null
      tax: ReturnType<typeof resolveTaxFromFinancialBreakdown>
    }
  >()
  const invoiceTaxByPoUuid = createInvoiceTaxBucketMap()
  const invoiceTaxByCoUuid = createInvoiceTaxBucketMap()

  const vendorDataMap = new Map<string, any>()

  const createVendorDataRow = (vendorUuid: string, vendorName: string) => ({
    vendorUuid,
    vendorName,
    poAmount: 0,
    changeOrderAmount: 0,
    totalContractValue: 0,
    poAmountDual: emptyVendorCurrencyAggregate(),
    changeOrderAmountDual: emptyVendorCurrencyAggregate(),
    totalContractValueDual: emptyVendorCurrencyAggregate(),
    invoicedForVendor: 0,
    billedByVendor: 0,
    holdback: 0,
    tax: 0,
    balance: 0,
    paidToDate: 0,
    apBalance: 0,
    taxRoundingNotes: [] as ReturnType<typeof buildTaxRoundingNotesForVendor>,
    _poSources: [] as ReturnType<typeof buildContractCurrencySource>[],
    _coSources: [] as ReturnType<typeof buildContractCurrencySource>[],
  })

  const ensureVendorData = (vendorUuid: string) => {
    const key = String(vendorUuid || '').trim()
    if (!key) return null
    let row = vendorDataMap.get(key)
    if (!row) {
      row = createVendorDataRow(key, nimbleVendorNames.get(key) || 'N/A')
      vendorDataMap.set(key, row)
    }
    return row
  }

  for (const vendorUuid of vendorUuids) {
    vendorDataMap.set(
      vendorUuid,
      createVendorDataRow(vendorUuid, nimbleVendorNames.get(vendorUuid) || 'N/A'),
    )
  }

  for (const po of purchaseOrders) {
    const poUuid = String(po.uuid || '').trim()
    if (!poUuid) continue
    const breakdown = poFbByUuid.get(poUuid) ?? null
    poTaxByUuid.set(poUuid, {
      documentNumber: po.po_number ?? null,
      vendorUuid: po.vendor_uuid ?? null,
      tax: resolveTaxFromFinancialBreakdown(breakdown ?? {}),
    })
    if (po.vendor_uuid) {
      const vendorData = ensureVendorData(po.vendor_uuid)
      if (vendorData) {
        vendorData._poSources.push(
          buildContractCurrencySource(po as unknown as Record<string, unknown>, 'po', breakdown),
        )
      }
    }
  }

  for (const co of changeOrders) {
    const coUuid = String(co.uuid || '').trim()
    if (!coUuid) continue
    const breakdown = coFbByUuid.get(coUuid) ?? null
    coTaxByUuid.set(coUuid, {
      documentNumber: co.co_number ?? null,
      vendorUuid: co.vendor_uuid ?? null,
      tax: resolveTaxFromFinancialBreakdown(breakdown ?? {}),
    })
    if (co.vendor_uuid) {
      const vendorData = ensureVendorData(co.vendor_uuid)
      if (vendorData) {
        vendorData._coSources.push(
          buildContractCurrencySource(co as unknown as Record<string, unknown>, 'co', breakdown),
        )
      }
    }
  }

  for (const invoice of eligibleInvoices) {
    if (!invoice.vendor_uuid) continue
    const vendorData = ensureVendorData(invoice.vendor_uuid)
    if (!vendorData) continue

    const financialBreakdown = viFbByUuid.get(invoice.uuid) ?? null
    const invoiceAmount = parseInvoiceFinancialAmount({
      amount: invoice.amount,
      financial_breakdown: financialBreakdown,
    })
    const taxBreakdown = resolveTaxFromFinancialBreakdown(financialBreakdown ?? {})
    const taxAmount = taxBreakdown.taxAmount
    const itemTotal = taxBreakdown.itemTotal
    const chargesTotal = taxBreakdown.chargesTotal

    const poUuid = String(invoice.purchase_order_uuid || '').trim()
    if (poUuid) {
      appendInvoiceToTaxBucket(invoiceTaxByPoUuid, poUuid, invoice.vendor_uuid, {
        uuid: invoice.uuid,
        number: invoice.number,
        taxBreakdown,
      })
    }
    const coUuid = String(invoice.change_order_uuid || '').trim()
    if (coUuid) {
      appendInvoiceToTaxBucket(invoiceTaxByCoUuid, coUuid, invoice.vendor_uuid, {
        uuid: invoice.uuid,
        number: invoice.number,
        taxBreakdown,
      })
    }

    let holdbackAmount = 0
    if (invoice.holdback && toNum(invoice.holdback) > 0) {
      const savedHoldback = (financialBreakdown?.totals as any)?.holdback_amount
      if (savedHoldback != null) {
        holdbackAmount = toNum(savedHoldback)
      } else {
        const totalBeforeHoldback = itemTotal + chargesTotal + taxAmount
        holdbackAmount = totalBeforeHoldback * (toNum(invoice.holdback) / 100)
      }
    }

    vendorData.invoicedForVendor += invoiceAmount
    vendorData.holdback += holdbackAmount
    vendorData.tax += taxAmount
  }

  for (const invoice of eligibleInvoices) {
    if (
      !isFullyPaidInvoiceStatus(invoice.status) &&
      !isPartiallyPaidInvoiceStatus(invoice.status)
    ) {
      continue
    }
    if (!invoice.vendor_uuid) continue
    const vendorData = ensureVendorData(invoice.vendor_uuid)
    if (!vendorData) continue

    let paidAmount = 0
    if (isFullyPaidInvoiceStatus(invoice.status)) {
      paidAmount = parseInvoiceFinancialAmount({
        amount: invoice.amount,
        financial_breakdown: viFbByUuid.get(invoice.uuid) ?? null,
      })
    }
    vendorData.paidToDate += paidAmount
  }

  vendorDataMap.forEach((vendorData) => {
    const poAmountDual = aggregateVendorCurrencyAmounts(vendorData._poSources)
    const changeOrderAmountDual = aggregateVendorCurrencyAmounts(vendorData._coSources)
    const totalContractValueDual = aggregateVendorCurrencyAmounts([
      ...vendorData._poSources,
      ...vendorData._coSources,
    ])

    vendorData.poAmountDual = poAmountDual
    vendorData.changeOrderAmountDual = changeOrderAmountDual
    vendorData.totalContractValueDual = totalContractValueDual
    vendorData.poAmount = poAmountDual.cadTotal
    vendorData.changeOrderAmount = changeOrderAmountDual.cadTotal
    vendorData.totalContractValue = totalContractValueDual.cadTotal

    delete vendorData._poSources
    delete vendorData._coSources

    vendorData.balance = vendorData.totalContractValue - vendorData.invoicedForVendor
    vendorData.apBalance = vendorData.invoicedForVendor - vendorData.paidToDate
    vendorData.totalInvoiceValue = vendorData.invoicedForVendor

    vendorData.taxRoundingNotes = buildTaxRoundingNotesForVendor(
      vendorData.vendorUuid,
      poTaxByUuid,
      coTaxByUuid,
      invoiceTaxByPoUuid,
      invoiceTaxByCoUuid,
    )
  })

  const vendorDataArray = Array.from(vendorDataMap.values())
    .filter(
      (v) =>
        v.poAmount > 0 ||
        v.changeOrderAmount > 0 ||
        v.invoicedForVendor > 0 ||
        v.paidToDate > 0,
    )
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName))

  const totals = vendorDataArray.reduce(
    (acc, vendor) => {
      acc.invoicedForVendor += vendor.invoicedForVendor
      acc.totalInvoiceValue += vendor.totalInvoiceValue
      acc.billedByVendor += vendor.billedByVendor
      acc.holdback += vendor.holdback
      acc.tax += vendor.tax
      acc.balance += vendor.balance
      acc.paidToDate += vendor.paidToDate
      acc.apBalance += vendor.apBalance
      return acc
    },
    {
      poAmount: 0,
      changeOrderAmount: 0,
      totalContractValue: 0,
      poAmountDual: emptyVendorCurrencyAggregate(),
      changeOrderAmountDual: emptyVendorCurrencyAggregate(),
      totalContractValueDual: emptyVendorCurrencyAggregate(),
      invoicedForVendor: 0,
      totalInvoiceValue: 0,
      billedByVendor: 0,
      holdback: 0,
      tax: 0,
      balance: 0,
      paidToDate: 0,
      apBalance: 0,
    },
  )

  totals.poAmountDual = sumVendorCurrencyAggregates(
    vendorDataArray.map((vendor) => vendor.poAmountDual),
  )
  totals.changeOrderAmountDual = sumVendorCurrencyAggregates(
    vendorDataArray.map((vendor) => vendor.changeOrderAmountDual),
  )
  totals.totalContractValueDual = sumVendorCurrencyAggregates(
    vendorDataArray.map((vendor) => vendor.totalContractValueDual),
  )
  totals.poAmount = totals.poAmountDual.cadTotal
  totals.changeOrderAmount = totals.changeOrderAmountDual.cadTotal
  totals.totalContractValue = totals.totalContractValueDual.cadTotal

  return {
    project: {
      projectName: project.project_name,
      projectId: project.project_id,
    },
    vendors: vendorDataArray,
    totals,
  }
}
