import { ref, readonly } from 'vue'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useEstimatesStore } from '~/stores/estimates'
import { usePurchaseOrdersStore } from '~/stores/purchaseOrders'
import { useChangeOrdersStore } from '~/stores/changeOrders'
import { useBillEntriesStore } from '~/stores/billEntries'
import { useProjectsStore } from '~/stores/projects'
import dayjs from 'dayjs'
import {
  isFullyPaidInvoiceStatus,
  isPartiallyPaidInvoiceStatus,
  resolveBudgetReportPaidAmount,
  type NimblePaidByInvoiceUuid,
} from '~/utils/invoiceReportPaymentTotals'
import { amountInPoToCurrency } from '~/utils/poCurrencyConversion'

export interface BudgetReportRow {
  costCodeUuid: string
  costCodeNumber: string
  costCodeName: string
  divisionUuid: string
  divisionName: string
  divisionNumber: string
  level: 'division' | 'costCode' | 'subCostCode'
  parentCostCodeUuid?: string
  budgetedAmount: number
  purchaseOrderAmount: number
  changeOrderAmount: number
  totalAmount: number
  paidAmount: number
  budgetRemaining: number
  costPerRoom: number
  isTotal?: boolean
}

export interface BudgetReportData {
  project: {
    uuid: string;
    projectName: string;
    projectId: string;
    numberOfRooms: number;
    areaSqFt?: number;
    measurementType: 'rooms' | 'sqft';
    measurementValue: number;
    measurementLabel: string;
  };
  divisions: Array<{
    uuid: string;
    divisionNumber: string;
    divisionName: string;
    order: number;
    excludeInEstimatesAndReports?: boolean;
      costCodes: Array<{
      uuid: string;
      costCodeNumber: string;
      costCodeName: string;
      order: number;
      budgetedAmount: number;
      purchaseOrderAmount: number;
      changeOrderAmount: number;
      totalAmount: number;
      paidAmount: number;
      budgetRemaining: number;
      costPerRoom: number;
      subCostCodes?: Array<{
        uuid: string;
        costCodeNumber: string;
        costCodeName: string;
        order: number;
        budgetedAmount: number;
        purchaseOrderAmount: number;
        changeOrderAmount: number;
        totalAmount: number;
        paidAmount: number;
        budgetRemaining: number;
        costPerRoom: number;
        subCostCodes?: Array<{
          uuid: string;
          costCodeNumber: string;
          costCodeName: string;
          order: number;
          budgetedAmount: number;
          purchaseOrderAmount: number;
          changeOrderAmount: number;
          totalAmount: number;
          paidAmount: number;
          budgetRemaining: number;
          costPerRoom: number;
        }>;
      }>;
    }>;
    totalBudgeted: number;
    totalPurchaseOrder: number;
    totalChangeOrder: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  }>;
  summary: {
    totalBudgeted: number;
    totalPurchaseOrder: number;
    totalChangeOrder: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    costPerRoom: number;
  };
}

/** Sum rooms / sq ft from project location breakdown rows (same source as estimate form header). */
async function getLocationBreakdownTotals(projectUuid: string): Promise<{
  locationWiseRoomsTotal: number
  locationWiseAreaTotal: number
}> {
  try {
    const breakdownRes = await $fetch<{ data: any[] }>(
      '/api/projects/location-breakdowns',
      { query: { project_uuid: projectUuid } }
    )
    const rows = Array.isArray(breakdownRes?.data) ? breakdownRes.data : []
    const locationWiseRoomsTotal = rows.reduce((sum, r) => {
      const n = parseFloat(String(r?.no_of_rooms ?? 0))
      return sum + (Number.isFinite(n) ? n : 0)
    }, 0)
    const locationWiseAreaTotal = rows.reduce((sum, r) => {
      const n = parseFloat(String(r?.area_sq_ft ?? 0))
      return sum + (Number.isFinite(n) ? n : 0)
    }, 0)
    return { locationWiseRoomsTotal, locationWiseAreaTotal }
  } catch {
    return { locationWiseRoomsTotal: 0, locationWiseAreaTotal: 0 }
  }
}

function groupItemsByKey<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const id = String(item[key] ?? '')
    if (!id) continue
    const bucket = map.get(id) || []
    bucket.push(item)
    map.set(id, bucket)
  }
  return map
}

export const useBudgetReport = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const costCodeDivisionsStore = useCostCodeDivisionsStore()
  const costCodeConfigurationsStore = useCostCodeConfigurationsStore()
  const estimatesStore = useEstimatesStore()
  const purchaseOrdersStore = usePurchaseOrdersStore()
  const changeOrdersStore = useChangeOrdersStore()
  const billEntriesStore = useBillEntriesStore()
  const projectsStore = useProjectsStore()

  const generateBudgetReport = async (
    corporationUuid: string,
    projectUuid: string,
    startDate?: string,
    endDate?: string
  ): Promise<BudgetReportData | null> => {
    if (!corporationUuid || !projectUuid) {
      error.value = 'Corporation and project are required'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const toComparableDate = (value?: string | null): string | null => {
        if (!value) return null
        const parsed = dayjs(value)
        if (!parsed.isValid()) return null
        return parsed.format('YYYY-MM-DD')
      }

      const isWithinSelectedDateRange = (value?: string | null): boolean => {
        if (!startDate || !endDate) return true
        const recordDate = toComparableDate(value)
        const rangeStart = toComparableDate(startDate)
        const rangeEnd = toComparableDate(endDate)
        if (!recordDate || !rangeStart || !rangeEnd) return false
        return recordDate >= rangeStart && recordDate <= rangeEnd
      }

      // Fetch all required data
      await Promise.all([
        costCodeDivisionsStore.fetchDivisions(corporationUuid),
        costCodeConfigurationsStore.fetchConfigurations(corporationUuid),
        estimatesStore.fetchEstimates(corporationUuid),
        purchaseOrdersStore.fetchPurchaseOrders(corporationUuid),
        changeOrdersStore.fetchChangeOrders(corporationUuid),
        billEntriesStore.fetchBillEntries(corporationUuid),
      ]);

      // Get project details - need full project data, not just metadata
      // Try to load from currentProject first (if already loaded)
      let project =
        projectsStore.currentProject?.uuid === projectUuid
          ? projectsStore.currentProject
          : null;

      // If not in currentProject, try to load from IndexedDB
      if (!project) {
        const loaded = await projectsStore.loadCurrentProject(
          projectUuid,
          corporationUuid
        );
        if (loaded) {
          project = projectsStore.currentProject;
        }
      }

      // If still not found, try to fetch from API
      if (!project) {
        project = await projectsStore.fetchProject(projectUuid);
      }

      // If still not found, try to find in metadata (fallback, but won't have no_of_rooms)
      if (!project) {
        project = projectsStore.projects.find(
          (p) => p.uuid === projectUuid
        ) as any;
      }

      if (!project) {
        error.value = "Project not found";
        return null;
      }

      const rawNumberOfRooms =
        parseFloat(String((project as any).no_of_rooms ?? 0)) || 0
      const rawAreaSqFt =
        parseFloat(String((project as any).area_sq_ft ?? 0)) || 0

      let numberOfRooms = rawNumberOfRooms
      let areaSqFt = rawAreaSqFt
      let measurementType: 'rooms' | 'sqft'
      let measurementValue: number
      let measurementLabel: string

      const enableLocationWise = (project as any).enable_location_wise === true

      if (enableLocationWise) {
        const { locationWiseRoomsTotal, locationWiseAreaTotal } =
          await getLocationBreakdownTotals(projectUuid)
        numberOfRooms = locationWiseRoomsTotal
        areaSqFt = locationWiseAreaTotal

        const locationBasisArea = (project as any).location_basis_area === true
        const locationBasisRooms =
          (project as any).location_basis_no_of_rooms === true

        if (locationBasisArea) {
          measurementType = 'sqft'
          measurementValue = locationWiseAreaTotal
          measurementLabel = 'Sq Ft'
        } else if (locationBasisRooms) {
          measurementType = 'rooms'
          measurementValue = locationWiseRoomsTotal
          measurementLabel = 'Rooms'
        } else {
          // Match estimate form fallback: use area when summed area > 0, else rooms
          if (locationWiseAreaTotal > 0) {
            measurementType = 'sqft'
            measurementValue = locationWiseAreaTotal
            measurementLabel = 'Sq Ft'
          } else {
            measurementType = 'rooms'
            measurementValue = locationWiseRoomsTotal
            measurementLabel = 'Rooms'
          }
        }
      } else {
        // Non–location-wise: same rule as before (project-level area vs rooms)
        measurementType = rawAreaSqFt > 0 ? 'sqft' : 'rooms'
        measurementValue =
          measurementType === 'sqft' ? rawAreaSqFt : rawNumberOfRooms
        measurementLabel = measurementType === 'sqft' ? 'Sq Ft' : 'Rooms'
      }

      // Get all cost code configurations for the corporation
      const allCostCodes = costCodeConfigurationsStore
        .getConfigurationsByCorporation(corporationUuid)
        .filter((cc) => cc.is_active);

      // Get all divisions
      const divisions = costCodeDivisionsStore
        .getActiveDivisions(corporationUuid)
        .sort((a, b) => (a.division_order || 0) - (b.division_order || 0));

      // Get estimates for this project - only include approved and active estimates for budget calculation
      let projectEstimates = estimatesStore.getEstimatesByProject(projectUuid);

      // Filter to only approved and active estimates for budgeted amount calculation
      // Must be: status === "Approved" AND is_active === true (boolean) AND project_uuid matches
      projectEstimates = projectEstimates.filter((estimate) => {
        // Check if estimate is approved
        const isApproved = estimate.status === "Approved";

        // Check if estimate is active - handle both boolean true and string "TRUE"/"true"
        const isActive =
          estimate.is_active === true ||
          String(estimate.is_active).toUpperCase() === "TRUE";

        // Check project UUID matches
        const projectMatches = estimate.project_uuid === projectUuid;

        return isApproved && isActive && projectMatches;
      });

      // Fetch line_items for estimates that don't have them loaded (in parallel)
      const { apiFetch } = useApiClient()
      const estimatesNeedingLines = projectEstimates.filter(
        (estimate) => !estimate.line_items || estimate.line_items.length === 0
      )
      const estimatesWithFetchedLines = await Promise.all(
        estimatesNeedingLines.map(async (estimate) => {
          try {
            const estimateResponse: any = await apiFetch(
              `/api/estimates/${estimate.uuid}`,
              { method: 'GET' }
            )
            if (estimateResponse?.data) {
              return {
                ...estimate,
                line_items: estimateResponse.data.line_items || [],
              }
            }
          } catch {
            // keep estimate without line items
          }
          return estimate
        })
      )
      const fetchedByUuid = new Map(
        estimatesWithFetchedLines.map((e) => [e.uuid || '', e])
      )
      projectEstimates = projectEstimates.map(
        (estimate) => fetchedByUuid.get(estimate.uuid || '') || estimate
      )

      // Get purchase orders for this project
      let projectPurchaseOrders = purchaseOrdersStore.purchaseOrders.filter(
        (po) => po.project_uuid === projectUuid && po.is_active !== false
      );

      // Filter by selected date range (calendar-date comparison).
      projectPurchaseOrders = projectPurchaseOrders.filter((po) =>
        isWithinSelectedDateRange(po.entry_date)
      )

      // Get change orders for this project (all active change orders)
      let projectChangeOrders = changeOrdersStore.changeOrders.filter(
        (co) => co.project_uuid === projectUuid && co.is_active !== false
      );

      // Filter by selected date range (calendar-date comparison).
      projectChangeOrders = projectChangeOrders.filter((co) =>
        isWithinSelectedDateRange(co.created_date)
      )

      // Get change orders with status Approved, Partially_Received, or Completed for change order amount calculation
      const approvedChangeOrders = projectChangeOrders.filter((co) => {
        const status = String(co.status || "").toLowerCase();
        return (
          status === "approved" ||
          status === "partially_received" ||
          status === "completed"
        );
      });

      const normalizeOrderType = (value: unknown): string =>
        String(value || 'MATERIAL').toUpperCase()

      const parseMoney = (value: unknown): number => {
        const numeric = parseFloat(String(value ?? ''))
        return Number.isFinite(numeric) ? numeric : 0
      }

      /** Convert PO/CO line totals to corporation-facing to-currency when conversion is enabled. */
      const toBudgetReportOrderAmount = (
        amount: number,
        order: Record<string, unknown>,
      ): number => amountInPoToCurrency(amount, order)

      // Bulk-fetch PO/CO line items and paid invoice lines for the project (few requests vs N+1)
      const bulkItemQuery = { project_uuid: projectUuid }
      const paidDataQuery: Record<string, string> = {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
      }
      if (startDate) paidDataQuery.bill_date_from = startDate
      if (endDate) paidDataQuery.bill_date_to = endDate

      const [
        bulkPoItemsResponse,
        bulkLaborPoItemsResponse,
        bulkCoItemsResponse,
        bulkLaborCoItemsResponse,
        bulkPaidDataResponse,
      ] = await Promise.all([
        apiFetch('/api/purchase-order-items', {
          method: 'GET',
          query: bulkItemQuery,
        }).catch(() => ({ data: [] })),
        apiFetch('/api/labor-purchase-order-items', {
          method: 'GET',
          query: bulkItemQuery,
        }).catch(() => ({ data: [] })),
        apiFetch('/api/change-order-items', {
          method: 'GET',
          query: bulkItemQuery,
        }).catch(() => ({ data: [] })),
        apiFetch('/api/labor-change-order-items', {
          method: 'GET',
          query: bulkItemQuery,
        }).catch(() => ({ data: [] })),
        apiFetch('/api/reports/budget-paid-data', {
          method: 'GET',
          query: paidDataQuery,
        }).catch(() => ({ data: null })),
      ])

      const purchaseOrderItemsMap = groupItemsByKey(
        Array.isArray(bulkPoItemsResponse?.data)
          ? bulkPoItemsResponse.data
          : [],
        'purchase_order_uuid'
      )
      const laborPurchaseOrderItemsMap = groupItemsByKey(
        (Array.isArray(bulkLaborPoItemsResponse?.data)
          ? bulkLaborPoItemsResponse.data
          : []
        ).filter((item: any) => item.is_active !== false),
        'purchase_order_uuid'
      )
      const changeOrderItemsMap = groupItemsByKey(
        Array.isArray(bulkCoItemsResponse?.data)
          ? bulkCoItemsResponse.data
          : [],
        'change_order_uuid'
      )
      const laborChangeOrderItemsMap = groupItemsByKey(
        (Array.isArray(bulkLaborCoItemsResponse?.data)
          ? bulkLaborCoItemsResponse.data
          : []
        ).filter((item: any) => item.is_active !== false),
        'change_order_uuid'
      )

      // Prefer embedded items on PO/CO records when bulk fetch returned nothing for that document
      for (const po of projectPurchaseOrders) {
        const poUuid = po.uuid || ''
        if (!purchaseOrderItemsMap.has(poUuid) && po.po_items?.length) {
          purchaseOrderItemsMap.set(poUuid, [...po.po_items])
        }
      }
      for (const co of projectChangeOrders) {
        const coUuid = co.uuid || ''
        if (!changeOrderItemsMap.has(coUuid) && co.co_items?.length) {
          changeOrderItemsMap.set(coUuid, [...co.co_items])
        }
      }

      // Gap-fill per-document item fetches when bulk returned no rows (e.g. API unavailable)
      await Promise.all(
        projectPurchaseOrders
          .filter((po) => !purchaseOrderItemsMap.has(po.uuid || ''))
          .map(async (po) => {
            try {
              const itemsResponse: any = await apiFetch(
                '/api/purchase-order-items',
                {
                  method: 'GET',
                  query: { purchase_order_uuid: po.uuid },
                }
              )
              if (
                Array.isArray(itemsResponse?.data) &&
                itemsResponse.data.length > 0
              ) {
                purchaseOrderItemsMap.set(po.uuid || '', itemsResponse.data)
              }
            } catch {
              // ignore
            }
          })
      )

      await Promise.all(
        projectPurchaseOrders
          .filter(
            (po) =>
              normalizeOrderType(po.po_type) === 'LABOR' &&
              !laborPurchaseOrderItemsMap.has(po.uuid || '')
          )
          .map(async (po) => {
            try {
              const laborItemsResponse: any = await apiFetch(
                '/api/labor-purchase-order-items',
                {
                  method: 'GET',
                  query: { purchase_order_uuid: po.uuid },
                }
              )
              if (Array.isArray(laborItemsResponse?.data)) {
                const activeItems = laborItemsResponse.data.filter(
                  (item: any) => item.is_active !== false
                )
                if (activeItems.length > 0) {
                  laborPurchaseOrderItemsMap.set(po.uuid || '', activeItems)
                }
              }
            } catch {
              // ignore
            }
          })
      )

      await Promise.all(
        projectChangeOrders
          .filter((co) => !changeOrderItemsMap.has(co.uuid || ''))
          .map(async (co) => {
            try {
              const itemsResponse: any = await apiFetch(
                '/api/change-order-items',
                {
                  method: 'GET',
                  query: { change_order_uuid: co.uuid },
                }
              )
              if (
                Array.isArray(itemsResponse?.data) &&
                itemsResponse.data.length > 0
              ) {
                changeOrderItemsMap.set(co.uuid || '', itemsResponse.data)
              }
            } catch {
              // ignore
            }
          })
      )

      await Promise.all(
        projectChangeOrders
          .filter(
            (co) =>
              normalizeOrderType(co.co_type) === 'LABOR' &&
              !laborChangeOrderItemsMap.has(co.uuid || '')
          )
          .map(async (co) => {
            try {
              const laborItemsResponse: any = await apiFetch(
                '/api/labor-change-order-items',
                {
                  method: 'GET',
                  query: { change_order_uuid: co.uuid },
                }
              )
              if (Array.isArray(laborItemsResponse?.data)) {
                const activeItems = laborItemsResponse.data.filter(
                  (item: any) => item.is_active !== false
                )
                if (activeItems.length > 0) {
                  laborChangeOrderItemsMap.set(co.uuid || '', activeItems)
                }
              }
            } catch {
              // ignore
            }
          })
      )

      const bulkPaidData =
        bulkPaidDataResponse?.data &&
        typeof bulkPaidDataResponse.data === 'object' &&
        !Array.isArray(bulkPaidDataResponse.data) &&
        'invoices' in bulkPaidDataResponse.data
          ? bulkPaidDataResponse.data
          : null
      const poInvoiceItemsByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.po_invoice_items)
          ? bulkPaidData.po_invoice_items
          : [],
        'vendor_invoice_uuid'
      )
      const coInvoiceItemsByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.co_invoice_items)
          ? bulkPaidData.co_invoice_items
          : [],
        'vendor_invoice_uuid'
      )
      const laborInvoiceItemsByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.labor_invoice_items)
          ? bulkPaidData.labor_invoice_items
          : [],
        'vendor_invoice_uuid'
      )
      const directLineItemsByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.direct_line_items)
          ? bulkPaidData.direct_line_items
          : [],
        'vendor_invoice_uuid'
      )
      const advanceCostCodesByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.advance_payment_cost_codes)
          ? bulkPaidData.advance_payment_cost_codes
          : [],
        'vendor_invoice_uuid'
      )
      const holdbackCostCodesByInvoice = groupItemsByKey(
        Array.isArray(bulkPaidData?.holdback_cost_codes)
          ? bulkPaidData.holdback_cost_codes
          : [],
        'vendor_invoice_uuid'
      )

      // Get bill entries for this corporation (filtered by project if possible)
      // Note: Bill entries don't have direct project_uuid, so we'll use all approved bill entries
      const approvedBillEntries = billEntriesStore.billEntries.filter(
        (be) => be.approval_status === "Approved" && !be.void
      );

      // Aggregate amounts by cost code
      const costCodeAmounts = new Map<
        string,
        {
          budgeted: number;
          purchaseOrder: number;
          changeOrder: number;
          paid: number;
        }
      >();

      // Helper function to get project contingency percentage
      const getProjectContingencyPercent = (): number => {
        const raw = (project as any)?.contingency_percentage;
        if (raw === null || raw === undefined || raw === '') {
          return 0;
        }
        const parsed = parseFloat(String(raw));
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      };

      // Aggregate estimate amounts (budgeted) - this is the original budget
      projectEstimates.forEach((estimate) => {
        if (!estimate.line_items || estimate.line_items.length === 0) {
          return;
        }
        estimate.line_items.forEach((item: any) => {
          if (item.cost_code_uuid) {
            const existing = costCodeAmounts.get(item.cost_code_uuid) || {
              budgeted: 0,
              purchaseOrder: 0,
              changeOrder: 0,
              paid: 0,
            };

            // Calculate base budgeted amount (without contingency)
            // Note: total_amount in line items is the base amount (labor + material) without contingency
            const baseAmount = parseFloat(item.total_amount) || 0;
            
            // Calculate contingency amount if enabled
            let contingencyAmount = 0;
            if (item.contingency_enabled === true) {
              // First, check if contingency_amount is already calculated and stored
              const storedContingencyAmount = parseFloat(item.contingency_amount) || 0;
              if (storedContingencyAmount > 0) {
                // Use stored contingency amount if available
                contingencyAmount = storedContingencyAmount;
              } else {
                // Otherwise, calculate from contingency_percentage
                // Use item's contingency_percentage, or fallback to project contingency if null/undefined
                let contingencyPercent = parseFloat(item.contingency_percentage);
                if (isNaN(contingencyPercent) || contingencyPercent === null || contingencyPercent === undefined) {
                  contingencyPercent = getProjectContingencyPercent();
                }
                // Calculate contingency amount: base * (percentage / 100)
                contingencyAmount = baseAmount * (contingencyPercent / 100);
              }
            }
            
            // Budgeted amount = base amount + contingency amount
            const budgetedAmount = baseAmount + contingencyAmount;

            existing.budgeted += budgetedAmount;
            costCodeAmounts.set(item.cost_code_uuid, existing);
          }
        });
      });

      // Note: Purchase orders represent commitments against the budget (from estimates)
      // They should NOT be added to the budgeted amount to avoid double-counting
      // POs contribute to "purchaseOrderAmount" when approved/partially_received/completed, and to "paid" amounts when approved/completed

      // Get purchase orders with status Approved, Partially_Received, or Completed for purchase order amount calculation
      const approvedPurchaseOrders = projectPurchaseOrders.filter((po) => {
        const status = String(po.status || "").toLowerCase();
        return (
          status === "approved" ||
          status === "partially_received" ||
          status === "completed"
        );
      });

      // Aggregate purchase order amounts (only Approved purchase orders)
      approvedPurchaseOrders.forEach((po) => {
        // Determine PO type - default to MATERIAL if not specified
        const poType = (po.po_type || "MATERIAL").toUpperCase();

        // Process material purchase order items (for MATERIAL type POs or when type is not specified)
        if (poType === "MATERIAL") {
          const items = purchaseOrderItemsMap.get(po.uuid || "") || [];

          // First pass: Calculate total item amount and collect cost code item amounts
          let totalItemAmount = 0;
          const costCodeItemAmounts = new Map<string, number>();

          items.forEach((item: any) => {
            if (item.cost_code_uuid) {
              // Use po_total if available, otherwise calculate from po_unit_price * po_quantity
              const itemAmount =
                item.po_total ||
                (item.po_unit_price || 0) * (item.po_quantity || 0);

              totalItemAmount += itemAmount;

              // Accumulate item amounts by cost code
              const currentAmount =
                costCodeItemAmounts.get(item.cost_code_uuid) || 0;
              costCodeItemAmounts.set(
                item.cost_code_uuid,
                currentAmount + itemAmount
              );
            }
          });

          // Get charges and taxes from PO
          const chargesTotal = po.charges_total || 0;
          const taxTotal = po.tax_total || 0;
          const chargesAndTaxes = chargesTotal + taxTotal;

          // Second pass: Distribute item amounts and proportional charges/taxes to each cost code
          costCodeItemAmounts.forEach((itemAmount, costCodeUuid) => {
            const existing = costCodeAmounts.get(costCodeUuid) || {
              budgeted: 0,
              purchaseOrder: 0,
              changeOrder: 0,
              paid: 0,
            };

            // Calculate proportional share of charges and taxes based on item amount
            const proportionalChargesAndTaxes =
              totalItemAmount > 0
                ? (itemAmount / totalItemAmount) * chargesAndTaxes
                : 0;

            // Add item amount + proportional charges and taxes
            existing.purchaseOrder += toBudgetReportOrderAmount(
              itemAmount + proportionalChargesAndTaxes,
              po,
            );
            costCodeAmounts.set(costCodeUuid, existing);
          });
        }

        // Process labor purchase order items (for LABOR type POs)
        if (poType === "LABOR") {
          const laborItems =
            laborPurchaseOrderItemsMap.get(po.uuid || "") || [];

          // First pass: Calculate total item amount and collect cost code item amounts
          let totalItemAmount = 0;
          const costCodeItemAmounts = new Map<string, number>();

          laborItems.forEach((item: any) => {
            if (item.cost_code_uuid) {
              // Labor purchase orders use po_amount directly
              const itemAmount = parseMoney(item.po_amount);
              totalItemAmount += itemAmount;

              // Accumulate item amounts by cost code
              const currentAmount =
                costCodeItemAmounts.get(item.cost_code_uuid) || 0;
              costCodeItemAmounts.set(
                item.cost_code_uuid,
                currentAmount + itemAmount
              );
            }
          });

          // Get charges and taxes from PO
          const chargesTotal = po.charges_total || 0;
          const taxTotal = po.tax_total || 0;
          const chargesAndTaxes = chargesTotal + taxTotal;

          // Second pass: Distribute item amounts and proportional charges/taxes to each cost code
          costCodeItemAmounts.forEach((itemAmount, costCodeUuid) => {
            const existing = costCodeAmounts.get(costCodeUuid) || {
              budgeted: 0,
              purchaseOrder: 0,
              changeOrder: 0,
              paid: 0,
            };

            // Calculate proportional share of charges and taxes based on item amount
            const proportionalChargesAndTaxes =
              totalItemAmount > 0
                ? (itemAmount / totalItemAmount) * chargesAndTaxes
                : 0;

            // Add item amount + proportional charges and taxes
            existing.purchaseOrder += toBudgetReportOrderAmount(
              itemAmount + proportionalChargesAndTaxes,
              po,
            );
            costCodeAmounts.set(costCodeUuid, existing);
          });
        }
      });

      // Aggregate change order amounts (only Approved change orders)
      approvedChangeOrders.forEach((co) => {
        const coType = normalizeOrderType(co.co_type);

        // Process material change order items (for MATERIAL type COs)
        if (coType === "MATERIAL") {
          const items = changeOrderItemsMap.get(co.uuid || "") || [];

          // First pass: Calculate total item amount and collect cost code item amounts
          let totalItemAmount = 0;
          const costCodeItemAmounts = new Map<string, number>();

          items.forEach((item: any) => {
            if (item.cost_code_uuid) {
              // Use co_total if available, otherwise calculate from co_unit_price * co_quantity
              const itemAmount =
                item.co_total ||
                (item.co_unit_price || 0) * (item.co_quantity || 0);

              totalItemAmount += itemAmount;

              // Accumulate item amounts by cost code
              const currentAmount =
                costCodeItemAmounts.get(item.cost_code_uuid) || 0;
              costCodeItemAmounts.set(
                item.cost_code_uuid,
                currentAmount + itemAmount
              );
            }
          });

          // Get charges and taxes from CO
          const chargesTotal = co.charges_total || 0;
          const taxTotal = co.tax_total || 0;
          const chargesAndTaxes = chargesTotal + taxTotal;

          // Second pass: Distribute item amounts and proportional charges/taxes to each cost code
          costCodeItemAmounts.forEach((itemAmount, costCodeUuid) => {
            const existing = costCodeAmounts.get(costCodeUuid) || {
              budgeted: 0,
              purchaseOrder: 0,
              changeOrder: 0,
              paid: 0,
            };

            // Calculate proportional share of charges and taxes based on item amount
            const proportionalChargesAndTaxes =
              totalItemAmount > 0
                ? (itemAmount / totalItemAmount) * chargesAndTaxes
                : 0;

            // Add item amount + proportional charges and taxes
            existing.changeOrder += toBudgetReportOrderAmount(
              itemAmount + proportionalChargesAndTaxes,
              co,
            );
            costCodeAmounts.set(costCodeUuid, existing);
          });
        }

        // Process labor change order items (for LABOR type COs)
        if (coType === "LABOR") {
          const laborItems = laborChangeOrderItemsMap.get(co.uuid || "") || [];

          // First pass: Calculate total item amount and collect cost code item amounts
          let totalItemAmount = 0;
          const costCodeItemAmounts = new Map<string, number>();

          laborItems.forEach((item: any) => {
            if (item.cost_code_uuid) {
              // Labor change orders use co_amount directly
              const itemAmount = parseMoney(item.co_amount);
              totalItemAmount += itemAmount;

              // Accumulate item amounts by cost code
              const currentAmount =
                costCodeItemAmounts.get(item.cost_code_uuid) || 0;
              costCodeItemAmounts.set(
                item.cost_code_uuid,
                currentAmount + itemAmount
              );
            }
          });

          // Get charges and taxes from CO
          const chargesTotal = co.charges_total || 0;
          const taxTotal = co.tax_total || 0;
          const chargesAndTaxes = chargesTotal + taxTotal;

          // Second pass: Distribute item amounts and proportional charges/taxes to each cost code
          costCodeItemAmounts.forEach((itemAmount, costCodeUuid) => {
            const existing = costCodeAmounts.get(costCodeUuid) || {
              budgeted: 0,
              purchaseOrder: 0,
              changeOrder: 0,
              paid: 0,
            };

            // Calculate proportional share of charges and taxes based on item amount
            const proportionalChargesAndTaxes =
              totalItemAmount > 0
                ? (itemAmount / totalItemAmount) * chargesAndTaxes
                : 0;

            // Add item amount + proportional charges and taxes
            existing.changeOrder += toBudgetReportOrderAmount(
              itemAmount + proportionalChargesAndTaxes,
              co,
            );
            costCodeAmounts.set(costCodeUuid, existing);
          });
        }
      });

      let nimblePaidByInvoiceUuid: NimblePaidByInvoiceUuid =
        bulkPaidData?.nimble_paid_by_invoice_uuid &&
        typeof bulkPaidData.nimble_paid_by_invoice_uuid === 'object'
          ? (bulkPaidData.nimble_paid_by_invoice_uuid as Record<string, number>)
          : {}

      const applyPaidVendorInvoice = (fullInvoice: any) => {
        if (!fullInvoice) return

        const invoiceType = fullInvoice.invoice_type || ''

            const invoiceTotalAmount = resolveBudgetReportPaidAmount(
              fullInvoice,
              nimblePaidByInvoiceUuid
            )
            if (invoiceTotalAmount <= 0) return

            let totalItemAmount = 0;
            const costCodeItemAmounts = new Map<string, number>();

            const addPaidLineToCostCodes = (
              costCodeUuid: string,
              itemAmount: number
            ) => {
              if (!costCodeUuid || itemAmount <= 0) return;
              totalItemAmount += itemAmount;
              const currentAmount = costCodeItemAmounts.get(costCodeUuid) || 0;
              costCodeItemAmounts.set(costCodeUuid, currentAmount + itemAmount);
            };

            if (invoiceType === "AGAINST_PO") {
              const poInvoiceItems = Array.isArray(fullInvoice.po_invoice_items)
                ? fullInvoice.po_invoice_items
                : [];

              poInvoiceItems.forEach((item: any) => {
                if (item.cost_code_uuid && item.is_active !== false) {
                  const itemAmount =
                    parseMoney(item.invoice_total) ||
                    parseMoney(item.invoice_unit_price) *
                      parseMoney(item.invoice_quantity);
                  addPaidLineToCostCodes(item.cost_code_uuid, itemAmount);
                }
              });

              // Labor PO invoices store lines in labor_invoice_items, not po_invoice_items
              const laborInvoiceItems = Array.isArray(
                fullInvoice.labor_invoice_items
              )
                ? fullInvoice.labor_invoice_items
                : [];

              laborInvoiceItems.forEach((item: any) => {
                if (item.cost_code_uuid && item.is_active !== false) {
                  addPaidLineToCostCodes(
                    item.cost_code_uuid,
                    parseMoney(item.invoice_amount)
                  );
                }
              });
            } else if (invoiceType === "AGAINST_CO") {
              const coInvoiceItems = Array.isArray(fullInvoice.co_invoice_items)
                ? fullInvoice.co_invoice_items
                : [];

              coInvoiceItems.forEach((item: any) => {
                if (item.cost_code_uuid && item.is_active !== false) {
                  const itemAmount =
                    parseMoney(item.invoice_total) ||
                    parseMoney(item.invoice_unit_price) *
                      parseMoney(item.invoice_quantity);
                  addPaidLineToCostCodes(item.cost_code_uuid, itemAmount);
                }
              });

              const laborInvoiceItems = Array.isArray(
                fullInvoice.labor_invoice_items
              )
                ? fullInvoice.labor_invoice_items
                : [];

              laborInvoiceItems.forEach((item: any) => {
                if (item.cost_code_uuid && item.is_active !== false) {
                  addPaidLineToCostCodes(
                    item.cost_code_uuid,
                    parseMoney(item.invoice_amount)
                  );
                }
              });
            } else if (
              invoiceType === "AGAINST_ADVANCE_PAYMENT" &&
              fullInvoice.advance_payment_cost_codes
            ) {
              // Process advance payment cost codes
              const advanceCostCodes = Array.isArray(
                fullInvoice.advance_payment_cost_codes
              )
                ? fullInvoice.advance_payment_cost_codes
                : [];

              advanceCostCodes.forEach((costCode: any) => {
                if (costCode.cost_code_uuid && costCode.is_active !== false) {
                  const advanceAmount =
                    parseFloat(costCode.advance_amount || "0") || 0;
                  totalItemAmount += advanceAmount;

                  const currentAmount =
                    costCodeItemAmounts.get(costCode.cost_code_uuid) || 0;
                  costCodeItemAmounts.set(
                    costCode.cost_code_uuid,
                    currentAmount + advanceAmount
                  );
                }
              });
            } else if (
              invoiceType === "ENTER_DIRECT_INVOICE" &&
              fullInvoice.line_items
            ) {
              // Process direct invoice line items
              const lineItems = Array.isArray(fullInvoice.line_items)
                ? fullInvoice.line_items
                : [];

              lineItems.forEach((item: any) => {
                if (item.cost_code_uuid && item.is_active !== false) {
                  const itemAmount =
                    parseFloat(item.total || "0") ||
                    (parseFloat(item.unit_price || "0") || 0) *
                      (parseFloat(item.quantity || "0") || 0);
                  addPaidLineToCostCodes(item.cost_code_uuid, itemAmount);
                }
              });
            } else if (
              invoiceType === "AGAINST_HOLDBACK_AMOUNT" &&
              fullInvoice.holdback_cost_codes
            ) {
              const holdbackRows = Array.isArray(fullInvoice.holdback_cost_codes)
                ? fullInvoice.holdback_cost_codes
                : [];

              holdbackRows.forEach((row: any) => {
                if (row.cost_code_uuid && row.is_active !== false) {
                  const releaseAmount = parseMoney(
                    row.release_amount ?? row.releaseAmount
                  );
                  addPaidLineToCostCodes(row.cost_code_uuid, releaseAmount);
                }
              });
            }

            // Distribute the invoice total amount (including all taxes and charges) proportionally by cost code
            // This ensures we capture the exact paid amount including all taxes
            if (totalItemAmount > 0 && invoiceTotalAmount > 0) {
              costCodeItemAmounts.forEach((itemAmount, costCodeUuid) => {
                const existing = costCodeAmounts.get(costCodeUuid) || {
                  budgeted: 0,
                  purchaseOrder: 0,
                  changeOrder: 0,
                  paid: 0,
                };

                // Calculate proportional share of the total invoice amount (which includes taxes and charges)
                const proportionalAmount = (itemAmount / totalItemAmount) * invoiceTotalAmount;

                existing.paid += proportionalAmount;
                costCodeAmounts.set(costCodeUuid, existing);
              });
            }
      }

      // Aggregate paid amounts (bulk lines when available; legacy per-invoice fetch as fallback)
      try {
        if (bulkPaidData) {
          const paidInvoices = Array.isArray(bulkPaidData.invoices)
            ? bulkPaidData.invoices
            : []

          for (const invoice of paidInvoices) {
            if (!invoice.uuid) continue
            const invoiceUuid = invoice.uuid
            applyPaidVendorInvoice({
              ...invoice,
              po_invoice_items:
                poInvoiceItemsByInvoice.get(invoiceUuid) || [],
              co_invoice_items:
                coInvoiceItemsByInvoice.get(invoiceUuid) || [],
              labor_invoice_items:
                laborInvoiceItemsByInvoice.get(invoiceUuid) || [],
              line_items: directLineItemsByInvoice.get(invoiceUuid) || [],
              advance_payment_cost_codes:
                advanceCostCodesByInvoice.get(invoiceUuid) || [],
              holdback_cost_codes:
                holdbackCostCodesByInvoice.get(invoiceUuid) || [],
            })
          }
        } else {
          const vendorInvoiceQuery: Record<string, string> = {
            corporation_uuid: corporationUuid,
            project_uuid: projectUuid,
          }
          if (startDate) vendorInvoiceQuery.bill_date_from = startDate
          if (endDate) vendorInvoiceQuery.bill_date_to = endDate

          const invoicesResponse: any = await apiFetch('/api/vendor-invoices', {
            method: 'GET',
            query: vendorInvoiceQuery,
          })

          let paidInvoicesLegacy = (
            Array.isArray(invoicesResponse?.data) ? invoicesResponse.data : []
          ).filter(
            (invoice: any) =>
              (isFullyPaidInvoiceStatus(invoice.status) ||
                isPartiallyPaidInvoiceStatus(invoice.status)) &&
              invoice.is_active !== false &&
              invoice.project_uuid === projectUuid
          )

          paidInvoicesLegacy = paidInvoicesLegacy.filter((invoice: any) =>
            isWithinSelectedDateRange(invoice.bill_date)
          )

          const legacyInvoiceUuids = paidInvoicesLegacy
            .map((invoice: any) => String(invoice.uuid || '').trim())
            .filter(Boolean)

          if (legacyInvoiceUuids.length > 0) {
            try {
              const nimbleTotalsResponse: any = await apiFetch(
                '/api/vendor-invoices/nimble-payment-totals',
                {
                  method: 'GET',
                  query: { invoice_uuids: legacyInvoiceUuids.join(',') },
                }
              )
              nimblePaidByInvoiceUuid =
                nimbleTotalsResponse?.data &&
                typeof nimbleTotalsResponse.data === 'object'
                  ? nimbleTotalsResponse.data
                  : {}
            } catch {
              nimblePaidByInvoiceUuid = {}
            }
          }

          await Promise.all(
            paidInvoicesLegacy.map(async (invoice: any) => {
              if (!invoice.uuid) return
              try {
                const fullInvoiceResponse: any = await apiFetch(
                  `/api/vendor-invoices/${invoice.uuid}`,
                  { method: 'GET' }
                )
                if (fullInvoiceResponse?.data) {
                  applyPaidVendorInvoice({
                    ...fullInvoiceResponse.data,
                    uuid: fullInvoiceResponse.data.uuid ?? invoice.uuid,
                    status:
                      fullInvoiceResponse.data.status ?? invoice.status,
                    amount:
                      fullInvoiceResponse.data.amount ?? invoice.amount,
                  })
                }
              } catch {
                // ignore individual invoice errors
              }
            })
          )
        }
      } catch {
        // Silently handle error - if vendor invoices can't be fetched, paid amounts will be 0
      }

      // Build hierarchical structure by division
      // Show all cost codes that have any activity (budgeted, purchase orders, change orders, or paid amounts)
      const reportDivisions = divisions
        .map((division) => {
          // Helper function to recursively build cost code hierarchy
          const buildCostCodeHierarchy = (parentUuid: string | null): any[] => {
            const filteredCodes = allCostCodes.filter((cc) => {
              if (parentUuid === null) {
                return (
                  cc.division_uuid === division.uuid &&
                  !cc.parent_cost_code_uuid
                );
              }
              return cc.parent_cost_code_uuid === parentUuid;
            });

            return filteredCodes
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((costCode) => {
                // Get direct amounts for this cost code (not including children)
                const directAmounts = costCodeAmounts.get(
                  costCode.uuid || ""
                ) || {
                  budgeted: 0,
                  purchaseOrder: 0,
                  changeOrder: 0,
                  paid: 0,
                };

                // Get sub-cost codes recursively
                const subCostCodes = buildCostCodeHierarchy(
                  costCode.uuid || null
                );

                // Calculate totals including children (children already have their totals calculated)
                const subBudgeted = subCostCodes.reduce(
                  (sum, sc) => sum + sc.budgetedAmount,
                  0
                );
                const subPurchaseOrder = subCostCodes.reduce(
                  (sum, sc) => sum + sc.purchaseOrderAmount,
                  0
                );
                const subChangeOrder = subCostCodes.reduce(
                  (sum, sc) => sum + sc.changeOrderAmount,
                  0
                );
                const subPaid = subCostCodes.reduce(
                  (sum, sc) => sum + sc.paidAmount,
                  0
                );

                // Total = direct amount + children totals
                const totalBudgeted = directAmounts.budgeted + subBudgeted;
                const totalPurchaseOrder =
                  directAmounts.purchaseOrder + subPurchaseOrder;
                const totalChangeOrder =
                  directAmounts.changeOrder + subChangeOrder;
                // Total Amount = Purchase Order Amount + Change Order Amount (excluding Budgeted Amount)
                const totalAmount = totalPurchaseOrder + totalChangeOrder;
                const totalPaid = directAmounts.paid + subPaid;
                // Budget Remaining = Budgeted Amount - Total Amount
                const budgetRemaining = totalBudgeted - totalAmount;
                const costPerRoom =
                  measurementValue > 0 ? totalAmount / measurementValue : 0;

                return {
                  uuid: costCode.uuid || "",
                  costCodeNumber: costCode.cost_code_number || "",
                  costCodeName: costCode.cost_code_name || "",
                  order: costCode.order || 0,
                  budgetedAmount: totalBudgeted,
                  purchaseOrderAmount: totalPurchaseOrder,
                  changeOrderAmount: totalChangeOrder,
                  totalAmount,
                  paidAmount: totalPaid,
                  budgetRemaining,
                  costPerRoom,
                  subCostCodes:
                    subCostCodes.length > 0 ? subCostCodes : undefined,
                };
              })
              .filter((costCode) => {
                // Include cost codes that have any activity:
                // - budgeted amounts (from estimates)
                // - purchase order amounts
                // - change order amounts
                // - paid amounts
                // Include parent cost codes if they have children with any activity
                return (
                  costCode.budgetedAmount > 0 ||
                  costCode.purchaseOrderAmount > 0 ||
                  costCode.changeOrderAmount > 0 ||
                  costCode.paidAmount > 0
                );
              });
          };

          const costCodesWithData = buildCostCodeHierarchy(null);

          // Include divisions that have cost codes with any activity
          if (costCodesWithData.length === 0) {
            return null as any; // Filter out divisions with no cost codes that have any activity
          }

          // Calculate division totals (cost codes already include their children in totals)
          const divisionTotalBudgeted = costCodesWithData.reduce(
            (sum, cc) => sum + cc.budgetedAmount,
            0
          );
          const divisionTotalPurchaseOrder = costCodesWithData.reduce(
            (sum, cc) => sum + cc.purchaseOrderAmount,
            0
          );
          const divisionTotalChangeOrder = costCodesWithData.reduce(
            (sum, cc) => sum + cc.changeOrderAmount,
            0
          );
          // Total Amount = Purchase Order Amount + Change Order Amount (excluding Budgeted Amount)
          const divisionTotalAmount =
            divisionTotalPurchaseOrder + divisionTotalChangeOrder;
          const divisionTotalPaid = costCodesWithData.reduce(
            (sum, cc) => sum + cc.paidAmount,
            0
          );
          // Budget Remaining = Budgeted Amount - Total Amount
          const divisionTotalRemaining =
            divisionTotalBudgeted - divisionTotalAmount;

          return {
            uuid: division.uuid || "",
            divisionNumber: division.division_number || "",
            divisionName: division.division_name || "",
            order: division.division_order || 0,
            excludeInEstimatesAndReports:
              division.exclude_in_estimates_and_reports === true,
            costCodes: costCodesWithData,
            totalBudgeted: divisionTotalBudgeted,
            totalPurchaseOrder: divisionTotalPurchaseOrder,
            totalChangeOrder: divisionTotalChangeOrder,
            totalAmount: divisionTotalAmount,
            totalPaid: divisionTotalPaid,
            totalRemaining: divisionTotalRemaining,
          };
        })
        .filter((division) => division !== null); // Remove null divisions

      // Calculate overall summary
      const summary = {
        totalBudgeted: reportDivisions.reduce(
          (sum, d) => sum + d.totalBudgeted,
          0
        ),
        totalPurchaseOrder: reportDivisions.reduce(
          (sum, d) => sum + d.totalPurchaseOrder,
          0
        ),
        totalChangeOrder: reportDivisions.reduce(
          (sum, d) => sum + d.totalChangeOrder,
          0
        ),
        totalAmount: reportDivisions.reduce((sum, d) => sum + d.totalAmount, 0),
        totalPaid: reportDivisions.reduce((sum, d) => sum + d.totalPaid, 0),
        totalRemaining: reportDivisions.reduce(
          (sum, d) => sum + d.totalRemaining,
          0
        ),
        costPerRoom:
          measurementValue > 0
            ? reportDivisions.reduce((sum, d) => sum + d.totalAmount, 0) /
              measurementValue
            : 0,
      };

      const result = {
        project: {
          uuid: project.uuid,
          projectName: project.project_name || "",
          projectId: project.project_id || "",
          numberOfRooms,
          areaSqFt,
          measurementType,
          measurementValue,
          measurementLabel,
        },
        divisions: reportDivisions,
        summary,
      };

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to generate budget report";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    generateBudgetReport
  }
}

