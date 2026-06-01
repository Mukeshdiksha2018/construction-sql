import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useNimbleSessionStore } from '~/stores/nimbleSession'

export interface VendorInvoice {
  id?: number;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  corporation_uuid: string;
  project_uuid?: string;
  vendor_uuid?: string;
  purchase_order_uuid?: string;
  change_order_uuid?: string;
  invoice_type: string;
  number?: string;
  bill_date: string;
  due_date?: string;
  credit_days?: string;
  amount: number;
  holdback?: number | null;
  is_active?: boolean;
  holdback_fully_paid?: boolean;
  attachments?: any[];
  line_items?: any[]; // Line items for direct invoices
  created_by?: string;
  updated_by?: string;
  // Metadata fields for list display (from joined tables)
  project_name?: string | null;
  project_id?: string | null;
  vendor_name?: string | null;
  po_number?: string | null;
  co_number?: string | null;
  /** Nimble journal entry ID from BillEntrySave; sent on subsequent Nimble API calls when present */
  nimble_jeid?: string | null;
  /** Persisted Configure COA GL rows (vendor_invoice_coa_assignments) */
  coa_assignments?: Array<{
    uuid: string;
    segment: string;
    gl_account_uuid: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>;
}

export interface CreateVendorInvoicePayload {
  corporation_uuid: string;
  project_uuid?: string;
  vendor_uuid?: string;
  purchase_order_uuid?: string;
  change_order_uuid?: string;
  invoice_type: string;
  number?: string;
  bill_date: string;
  due_date?: string;
  credit_days?: string;
  amount: number;
  holdback?: number | null;
  attachments?: any[];
  line_items?: any[]; // Line items for direct invoices
  po_invoice_items?: any[]; // Invoice items for purchase order-based invoices
  co_invoice_items?: any[]; // Invoice items for change order-based invoices
  advance_payment_cost_codes?: any[]; // Cost codes for advance payment invoices
  removed_advance_payment_cost_codes?: any[]; // Removed cost codes for advance payment invoices
  /** Chart of account breakdown for Nimble BillEntrySave (Configure COA modal); array of { accountUuid, total } */
  coa_breakdown?: Array<{ accountUuid: string; total: number }>;
}

export interface UpdateVendorInvoicePayload extends Partial<CreateVendorInvoicePayload> {
  uuid: string;
  /** When true, server skips Nimble BillEntrySave (reject-to-draft only) */
  skip_nimble_bill_entry_sync?: boolean;
}

export interface VendorInvoiceResponse {
  data: VendorInvoice;
  error?: string;
  /** Set when NUXT_PUBLIC_NIMBLE_INTEGRATIONS is true and BillEntrySave returns an error */
  nimble_bill_entry_failed?: boolean;
  nimble_bill_entry_error?: string;
  /** Invoice number was advanced (INV-n) after Nimble reported a duplicate bill number */
  nimble_invoice_number_adjusted?: boolean;
}

export type SaveVendorInvoiceOutcome = {
  invoice: VendorInvoice | null;
  nimbleBillEntryFailed?: boolean;
  nimbleBillEntryError?: string;
  nimbleInvoiceNumberAdjusted?: boolean;
};

export interface VendorInvoicesResponse {
  data: VendorInvoice[];
  error?: string;
}

export const useVendorInvoicesStore = defineStore("vendorInvoices", () => {
  const vendorInvoices = ref<VendorInvoice[]>([]);
  const currentVendorInvoice = ref<VendorInvoice | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache management
  const lastFetchedCorporation = ref<string | null>(null);
  const hasDataForCorporation = ref<Set<string>>(new Set());

  const uploadAttachmentsForInvoice = async (
    invoiceUuid: string,
    attachments: any[] = []
  ) => {
    const pending = (attachments || []).filter(
      (att) =>
        !att?.uuid &&
        (typeof att?.fileData === "string" ? att.fileData : att?.url)
    );

    if (!pending.length) {
      return null;
    }

    try {
      const response = await $fetch<{
        attachments: any[];
        errors?: Array<{ fileName: string; error: string }>;
      }>("/api/vendor-invoices/documents/upload", {
        method: "POST",
        body: {
          invoice_uuid: invoiceUuid,
          files: pending.map((att) => ({
            name: att.name || att.document_name || "attachment.pdf",
            type: att.type || att.mime_type || "application/pdf",
            size: att.size || att.file_size || 0,
            fileData: att.fileData || att.url || "",
          })),
        },
      });

      if (response?.attachments) {
        return response.attachments;
      }
    } catch (error) {
      console.error("Error uploading vendor invoice attachments:", error);
    }

    return null;
  };

  const removeAttachment = async (
    invoiceUuid: string,
    attachmentUuid: string
  ): Promise<boolean> => {
    try {
      const response = await $fetch<{
        success: boolean;
        attachments: any[];
      }>("/api/vendor-invoices/documents/remove", {
        method: "POST",
        body: {
          invoice_uuid: invoiceUuid,
          attachment_uuid: attachmentUuid,
        },
      });

      return response?.success || false;
    } catch (error) {
      console.error("Error removing vendor invoice attachment:", error);
      return false;
    }
  };

  const extractApiErrorMessage = (err: any, fallback: string): string => {
    const statusMessage = String(err?.data?.statusMessage || "").trim();
    const apiMessage = String(err?.data?.message || "").trim();
    const bodyError = String(err?.data?.error || "").trim();
    const direct = String(err?.message || "").trim();
    return statusMessage || apiMessage || bodyError || direct || fallback;
  };

  // Check if we need to fetch data
  const shouldFetchData = (corporationUUID: string) => {
    if (lastFetchedCorporation.value !== corporationUUID) {
      return true;
    }
    if (hasDataForCorporation.value.has(corporationUUID)) {
      return false;
    }
    return true;
  };

  /**
   * Fetch all vendor invoices for a specific corporation
   */
  const fetchVendorInvoices = async (
    corporationUUID: string,
    forceRefresh = false,
    filters?: {
      project_uuid?: string;
      vendor_uuid?: string;
      status?: string;
      invoice_type?: string;
      bill_date_from?: string;
      bill_date_to?: string;
    }
  ) => {
    if (process.server) return;

    const shouldFetch = shouldFetchData(corporationUUID);
    if (!forceRefresh && !shouldFetch && !filters) {
      return;
    }

    error.value = null;
    loading.value = true;
    
    try {
      // Build query string with filters
      const queryParams = new URLSearchParams({
        corporation_uuid: corporationUUID,
      });

      if (filters?.project_uuid) {
        queryParams.append("project_uuid", filters.project_uuid);
      }
      if (filters?.vendor_uuid) {
        queryParams.append("vendor_uuid", filters.vendor_uuid);
      }
      if (filters?.status) {
        queryParams.append("status", filters.status);
      }
      if (filters?.invoice_type) {
        queryParams.append("invoice_type", filters.invoice_type);
      }
      if (filters?.bill_date_from) {
        queryParams.append("bill_date_from", filters.bill_date_from);
      }
      if (filters?.bill_date_to) {
        queryParams.append("bill_date_to", filters.bill_date_to);
      }

      const response = await $fetch<VendorInvoicesResponse>(
        `/api/vendor-invoices?${queryParams.toString()}`
      );
      if (response?.error) throw new Error(response.error);

      const invoices = Array.isArray(response?.data) ? response.data : [];
      const debugRows = invoices.slice(0, 25).map((inv: any) => {
        const fbTotal = inv?.financial_breakdown?.totals?.total_invoice_amount;
        const rowTotal = inv?.total_invoice_amount;
        const amount = inv?.amount;
        return {
          uuid: inv?.uuid || null,
          invoice_type: inv?.invoice_type || null,
          amount,
          total_invoice_amount: rowTotal,
          fb_total_invoice_amount: fbTotal,
        };
      });
      console.log("[VendorInvoicesStore] fetchVendorInvoices amount debug:", {
        count: invoices.length,
        corporationUUID,
        filters: filters || null,
        sample: debugRows,
      });
      vendorInvoices.value = invoices;
      lastFetchedCorporation.value = corporationUUID;
      hasDataForCorporation.value.add(corporationUUID);
    } catch (err: any) {
      console.error("Error fetching vendor invoices:", err);
      error.value = err.message || "Failed to fetch vendor invoices";
      vendorInvoices.value = [];
      hasDataForCorporation.value.delete(corporationUUID);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch a single vendor invoice by UUID
   */
  const fetchVendorInvoice = async (
    uuid: string
  ): Promise<VendorInvoice | null> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch<VendorInvoiceResponse>(
        `/api/vendor-invoices/${uuid}`
      );
      if (response?.error) throw new Error(response.error);

      const invoice: VendorInvoice | null = response?.data || null;

      if (invoice) {
        console.log("[VendorInvoicesStore] fetchVendorInvoice detail amount debug:", {
          uuid: invoice.uuid || null,
          invoice_type: invoice.invoice_type || null,
          amount: (invoice as any).amount,
          total_invoice_amount: (invoice as any).total_invoice_amount,
          fb_total_invoice_amount:
            (invoice as any)?.financial_breakdown?.totals?.total_invoice_amount ?? null,
        });
        if (!Array.isArray(invoice.attachments)) {
          invoice.attachments = [];
        }
        currentVendorInvoice.value = invoice;
      }

      return invoice;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch vendor invoice";
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create a new vendor invoice
   */
  const createVendorInvoice = async (
    invoiceData: CreateVendorInvoicePayload
  ): Promise<SaveVendorInvoiceOutcome> => {
    loading.value = true;
    error.value = null;
    try {
      const nimbleSession = useNimbleSessionStore();
      const headers: Record<string, string> = {};
      if (nimbleSession.token) {
        headers.Authorization = `Bearer ${nimbleSession.token}`;
      }
      const response = await $fetch<VendorInvoiceResponse>(
        "/api/vendor-invoices",
        {
          method: "POST",
          body: invoiceData,
          ...(Object.keys(headers).length ? { headers } : {}),
        }
      );
      if (response?.error) throw new Error(response.error);

      const newInvoice = response?.data;
      const nimbleBillEntryFailed = !!response?.nimble_bill_entry_failed;
      const nimbleBillEntryError = response?.nimble_bill_entry_error;
      const nimbleInvoiceNumberAdjusted = !!response?.nimble_invoice_number_adjusted;
      if (newInvoice) {
        let uploadedAttachments: any[] | null = null;
        if (newInvoice.uuid) {
          uploadedAttachments = await uploadAttachmentsForInvoice(
            newInvoice.uuid,
            invoiceData.attachments || []
          );
        }

        if (uploadedAttachments) {
          newInvoice.attachments = uploadedAttachments;
        }

        // Only add to local store if it matches the currently selected corporation
        // This prevents showing vendor invoices from other corporations in the list
        // Similar to how PurchaseOrders store handles this
        const corpStore = useCorporationStore();
        if (newInvoice.corporation_uuid === corpStore.selectedCorporationId) {
          vendorInvoices.value.unshift(newInvoice);
        }

        // Always update currentVendorInvoice (regardless of selected corporation)
        // This ensures the form shows the created data
        currentVendorInvoice.value = newInvoice;
      }
      return {
        invoice: newInvoice || null,
        ...(nimbleBillEntryFailed
          ? { nimbleBillEntryFailed: true, nimbleBillEntryError }
          : {}),
        ...(nimbleInvoiceNumberAdjusted ? { nimbleInvoiceNumberAdjusted: true } : {}),
      };
    } catch (err: any) {
      error.value = err.message || "Failed to create vendor invoice";
      return { invoice: null };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update an existing vendor invoice
   */
  const updateVendorInvoice = async (
    invoiceData: UpdateVendorInvoicePayload
  ): Promise<SaveVendorInvoiceOutcome> => {
    loading.value = true;
    error.value = null;
    try {
      const nimbleSession = useNimbleSessionStore();
      const headers: Record<string, string> = {};
      if (nimbleSession.token) {
        headers.Authorization = `Bearer ${nimbleSession.token}`;
      }
      const response = await $fetch<VendorInvoiceResponse>(
        "/api/vendor-invoices",
        {
          method: "PUT",
          body: invoiceData,
          ...(Object.keys(headers).length ? { headers } : {}),
        }
      );
      if (response?.error) throw new Error(response.error);

      const updatedInvoice = response?.data;
      const nimbleBillEntryFailed = !!response?.nimble_bill_entry_failed;
      const nimbleBillEntryError = response?.nimble_bill_entry_error;
      const nimbleInvoiceNumberAdjusted = !!response?.nimble_invoice_number_adjusted;
      if (updatedInvoice) {
        let uploadedAttachments: any[] | null = null;
        if (updatedInvoice.uuid) {
          uploadedAttachments = await uploadAttachmentsForInvoice(
            updatedInvoice.uuid,
            invoiceData.attachments || []
          );
        }

        if (uploadedAttachments) {
          updatedInvoice.attachments = uploadedAttachments;
        }

        // Only update in local store if it matches the currently selected corporation
        // This prevents showing vendor invoices from other corporations in the list
        // Similar to how PurchaseOrders store handles this
        const corpStore = useCorporationStore();
        if (updatedInvoice.corporation_uuid === corpStore.selectedCorporationId) {
          const index = vendorInvoices.value.findIndex(
            (i) => i.uuid === updatedInvoice.uuid
          );
          if (index !== -1) {
            // Merge updated invoice with existing one to preserve display fields (vendor_name, project_name, etc.)
            // that come from JOINs in the list endpoint but not in the update response
            const existingInvoice = vendorInvoices.value[index];
            vendorInvoices.value[index] = {
              ...existingInvoice,
              ...updatedInvoice,
              // Preserve display fields from existing invoice if not in updated response
              vendor_name: updatedInvoice.vendor_name ?? existingInvoice.vendor_name,
              project_name: updatedInvoice.project_name ?? existingInvoice.project_name,
              project_id: updatedInvoice.project_id ?? existingInvoice.project_id,
              po_number: updatedInvoice.po_number ?? existingInvoice.po_number,
              co_number: updatedInvoice.co_number ?? existingInvoice.co_number,
            };
          } else {
            // If invoice doesn't exist in store but corporation matches, add it
            // This handles the case where invoice was created/updated for the selected corporation
            vendorInvoices.value.push(updatedInvoice);
          }
        }

        // Always update currentVendorInvoice if it matches (regardless of selected corporation)
        // This ensures the form shows the updated data
        if (currentVendorInvoice.value?.uuid === updatedInvoice.uuid) {
          currentVendorInvoice.value = updatedInvoice;
        }
      }
      return {
        invoice: updatedInvoice || null,
        ...(nimbleBillEntryFailed
          ? { nimbleBillEntryFailed: true, nimbleBillEntryError }
          : {}),
        ...(nimbleInvoiceNumberAdjusted ? { nimbleInvoiceNumberAdjusted: true } : {}),
      };
    } catch (err: any) {
      error.value = err.message || "Failed to update vendor invoice";
      return { invoice: null };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete a vendor invoice
   */
  const deleteVendorInvoice = async (uuid: string): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    try {
      const nimbleSession = useNimbleSessionStore();
      const headers: Record<string, string> = {};
      if (nimbleSession.token) {
        headers.Authorization = `Bearer ${nimbleSession.token}`;
      }
      const response = await $fetch<VendorInvoiceResponse>(
        "/api/vendor-invoices",
        {
          method: "DELETE",
          query: { uuid },
          ...(Object.keys(headers).length ? { headers } : {}),
        }
      );
      if (response?.error) throw new Error(response.error);

      // Only remove from local store if it matches the currently selected corporation
      // This prevents affecting vendor invoices from other corporations in the list
      const corpStore = useCorporationStore();
      const index = vendorInvoices.value.findIndex((i) => i.uuid === uuid);
      if (index !== -1) {
        const invoice = vendorInvoices.value[index];
        if (invoice) {
          // Only remove from store if corporation matches
          if (invoice.corporation_uuid === corpStore.selectedCorporationId) {
            vendorInvoices.value.splice(index, 1);
          }
          // Always clear currentVendorInvoice if it matches (regardless of selected corporation)
          if (currentVendorInvoice.value?.uuid === uuid) {
            currentVendorInvoice.value = null;
          }
          if (invoice.corporation_uuid) {
            hasDataForCorporation.value.delete(invoice.corporation_uuid);
          }
        }
      }
      return true;
    } catch (err: any) {
      error.value = extractApiErrorMessage(err, "Failed to delete vendor invoice");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Clear current vendor invoice
   */
  const clearCurrentVendorInvoice = () => {
    currentVendorInvoice.value = null;
  };

  /**
   * Upsert a vendor invoice row in the local list store.
   * Preserves display metadata from existing row when response is sparse.
   */
  const upsertVendorInvoice = (invoice: VendorInvoice) => {
    if (!invoice?.uuid) return;
    const index = vendorInvoices.value.findIndex((i) => i.uuid === invoice.uuid);
    if (index !== -1) {
      const existing = vendorInvoices.value[index];
      vendorInvoices.value[index] = {
        ...existing,
        ...invoice,
        vendor_name: invoice.vendor_name ?? existing.vendor_name,
        project_name: invoice.project_name ?? existing.project_name,
        project_id: invoice.project_id ?? existing.project_id,
        po_number: invoice.po_number ?? existing.po_number,
        co_number: invoice.co_number ?? existing.co_number,
      };
    } else {
      vendorInvoices.value.unshift(invoice);
    }
  };

  /**
   * Clear all data
   */
  const clearData = () => {
    const corpId = lastFetchedCorporation.value;
    vendorInvoices.value = [];
    currentVendorInvoice.value = null;
    error.value = null;
    lastFetchedCorporation.value = null;
    hasDataForCorporation.value.clear();
  };

  return {
    // State
    vendorInvoices: readonly(vendorInvoices),
    currentVendorInvoice,
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchVendorInvoices,
    fetchVendorInvoice,
    createVendorInvoice,
    updateVendorInvoice,
    deleteVendorInvoice,
    uploadAttachmentsForInvoice,
    removeAttachment,
    upsertVendorInvoice,
    clearCurrentVendorInvoice,
    clearData,
  };
});

