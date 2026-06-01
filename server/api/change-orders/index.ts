import { supabaseServer } from "~/utils/supabaseServer";
import { normalizeAppUserUuidOrNimbleUserId } from "~/server/utils/appUserOrNimbleUserId";
import {
  decorateChangeOrderRecord,
  buildLaborCOFinancialBreakdown,
  buildFinancialBreakdown,
  hasFinancialPayload,
  sanitizeAttachments,
  sanitizeChangeOrderItem,
} from "./utils";
import { sanitizeLaborChangeOrderItem } from "../labor-change-order-items/utils";
import { sanitizeCoLocationWiseMaterialItem } from "../co-location-wise-material-items/utils";

const extractCoSequenceNumber = (rawValue: unknown): number | null => {
  const coNumber = String(rawValue || "").trim();
  if (!coNumber) return null;

  // Capture first numeric run after "CO" token (supports "CO-12A", "PRJ-001-CO-12X", etc.)
  const coTokenMatch = coNumber.match(/CO[^0-9]*(\d+)/i);
  if (coTokenMatch?.[1]) {
    const parsed = parseInt(coTokenMatch[1], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // Fallback: use the last numeric run anywhere in the value
  const lastNumericMatch = coNumber.match(/(\d+)(?!.*\d)/);
  if (lastNumericMatch?.[1]) {
    const parsed = parseInt(lastNumericMatch[1], 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
};

const allocateNextCONumber = async (
  corporationUuid: string,
  projectId?: string | null
): Promise<string> => {
  const { data, error } = await supabaseServer
    .from("change_orders")
    .select("co_number")
    .eq("corporation_uuid", corporationUuid);

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const list = Array.isArray(data) ? data : [];
  let maxSeq = 0;
  for (const row of list) {
    const seq = extractCoSequenceNumber((row as any)?.co_number);
    if (seq !== null) maxSeq = Math.max(maxSeq, seq);
  }

  const nextSuffix = `CO-${maxSeq + 1}`;
  const normalizedProjectId = String(projectId || "").trim();
  return normalizedProjectId ? `${normalizedProjectId}-${nextSuffix}` : nextSuffix;
};

const persistCoLocationWiseMaterialItems = async (options: {
  changeOrderUuid: string;
  corporationUuid: string | null;
  projectUuid: string | null;
  purchaseOrderUuid: string | null;
  items: any[];
}) => {
  const { changeOrderUuid, corporationUuid, projectUuid, purchaseOrderUuid, items = [] } = options;

  if (!changeOrderUuid) return;

  const { error: deleteError } = await supabaseServer
    .from("co_location_wise_material")
    .delete()
    .eq("change_order_uuid", changeOrderUuid);

  if (deleteError) {
    throw createError({ statusCode: 500, statusMessage: deleteError.message });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const prepared = items.map((item, index) => ({
    ...sanitizeCoLocationWiseMaterialItem(item, index),
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    change_order_uuid: changeOrderUuid,
    purchase_order_uuid: purchaseOrderUuid,
  }));

  const { error: insertError } = await supabaseServer
    .from("co_location_wise_material")
    .insert(prepared);

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message });
  }
};

const buildItemKey = (item: any) =>
  `${String(item?.cost_code_uuid ?? "").trim().toUpperCase()}|${String(item?.item_uuid ?? "").trim().toUpperCase()}|${String(item?.model_number ?? "").trim().toUpperCase()}`;

/** Backfill category, division_name, item_division_uuid from original PO when missing on CO items */
const enrichCoItemsWithCategoryDivision = async (
  items: any[],
  originalPoUuid: string | null
): Promise<any[]> => {
  if (!originalPoUuid || !Array.isArray(items) || items.length === 0) return items;
  const needEnrich = items.some(
    (it: any) =>
      (it?.category == null || it?.category === "") &&
      (it?.division_name == null || it?.division_name === "") &&
      (it?.item_division_uuid == null)
  );
  if (!needEnrich) return items;
  const { data: poItems, error } = await supabaseServer
    .from("purchase_order_items_list")
    .select("cost_code_uuid, item_uuid, model_number, category, division_name, item_division_uuid")
    .eq("purchase_order_uuid", originalPoUuid);
  if (error || !Array.isArray(poItems) || poItems.length === 0) return items;
  const poByKey = new Map<string, any>();
  poItems.forEach((po: any) => poByKey.set(buildItemKey(po), po));
  return items.map((item: any) => {
    const key = buildItemKey(item);
    const po = poByKey.get(key);
    if (!po) return item;
    const out = { ...item };
    if ((out.category == null || out.category === "") && (po.category != null && po.category !== ""))
      out.category = po.category;
    if ((out.division_name == null || out.division_name === "") && (po.division_name != null && po.division_name !== ""))
      out.division_name = po.division_name;
    if (out.item_division_uuid == null && po.item_division_uuid != null)
      out.item_division_uuid = po.item_division_uuid;
    return out;
  });
};

const persistChangeOrderItems = async (options: {
  changeOrderUuid: string;
  corporationUuid: string | null;
  projectUuid: string | null;
  items: any[];
  originalPoUuid?: string | null;
}) => {
  const { changeOrderUuid, corporationUuid, projectUuid, originalPoUuid, items: rawItems = [] } = options;
  if (!changeOrderUuid) return;

  const { error: deleteError } = await supabaseServer
    .from("change_order_items_list")
    .delete()
    .eq("change_order_uuid", changeOrderUuid);

  if (deleteError) {
    throw createError({ statusCode: 500, statusMessage: deleteError.message });
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return;
  }

  const items = await enrichCoItemsWithCategoryDivision(rawItems, originalPoUuid ?? null);

  const prepared = items.map((item, index) => ({
    ...sanitizeChangeOrderItem(item, index),
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    change_order_uuid: changeOrderUuid,
  }));

  const { error: insertError } = await supabaseServer
    .from("change_order_items_list")
    .insert(prepared);

  if (insertError) {
    throw createError({ statusCode: 500, statusMessage: insertError.message });
  }
};

const persistLaborChangeOrderItems = async (options: {
  changeOrderUuid: string;
  corporationUuid: string | null;
  projectUuid: string | null;
  purchaseOrderUuid: string | null;
  items: any[];
}) => {
  const { changeOrderUuid, corporationUuid, projectUuid, purchaseOrderUuid, items = [] } = options;
  
  if (!changeOrderUuid) {
    console.warn("[persistLaborChangeOrderItems] Skipping: changeOrderUuid is missing");
    return;
  }
  
  if (!purchaseOrderUuid) {
    console.warn("[persistLaborChangeOrderItems] Skipping: purchaseOrderUuid is missing");
    return;
  }

  console.log("[persistLaborChangeOrderItems] Saving labor CO items:", {
    changeOrderUuid,
    purchaseOrderUuid,
    itemsCount: items.length,
    items: items
  });

  const { error: deleteError } = await supabaseServer
    .from("labor_change_order_items_list")
    .delete()
    .eq("change_order_uuid", changeOrderUuid);

  if (deleteError) {
    console.error("[persistLaborChangeOrderItems] Delete error:", deleteError);
    throw createError({ statusCode: 500, statusMessage: deleteError.message });
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.log("[persistLaborChangeOrderItems] No items to save");
    return;
  }

  const prepared = items.map((item, index) => ({
    ...sanitizeLaborChangeOrderItem(item, index),
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    purchase_order_uuid: purchaseOrderUuid,
    change_order_uuid: changeOrderUuid,
  }));

  console.log("[persistLaborChangeOrderItems] Prepared items:", prepared);

  const { data, error: insertError } = await supabaseServer
    .from("labor_change_order_items_list")
    .insert(prepared)
    .select();

  if (insertError) {
    console.error("[persistLaborChangeOrderItems] Insert error:", insertError);
    throw createError({ statusCode: 500, statusMessage: insertError.message });
  }

  console.log("[persistLaborChangeOrderItems] Successfully saved items:", data);
};

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const query = getQuery(event);
  const body = method === "POST" || method === "PUT" ? await readBody(event) : null;

  const normalizeUTC = (val: any, endOfDay = false) => {
    if (!val && val !== 0) return null;
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return endOfDay ? `${s}T23:59:59.000Z` : `${s}T00:00:00.000Z`;
    }
    return s;
  };

  const normalizeCoType = (val: any) => {
    if (val === undefined || val === null) return null;
    const str = String(val).trim().toUpperCase();
    if (str === "LABOR" || str === "MATERIAL") return str;
    return null;
  };

  try {
    if (method === "GET") {
      const { corporation_uuid, uuid, project_uuid, vendor_uuid, created_date_from, created_date_to } = query;

      if (uuid) {
        const { data, error } = await supabaseServer
          .from("change_orders")
          .select("*")
          .eq("uuid", uuid as string)
          .maybeSingle();

        if (error) throw createError({ statusCode: 500, statusMessage: error.message });
        if (!data) throw createError({ statusCode: 404, statusMessage: "Change order not found" });
        const decorated = decorateChangeOrderRecord(data as any);
        // Debug: log labor_co_items coming back from decorateChangeOrderRecord (for LABOR COs)
        console.log("[change-orders GET] Loaded change order record", {
          uuid,
          co_type: (decorated as any)?.co_type,
          labor_co_items_count: Array.isArray((decorated as any)?.labor_co_items)
            ? (decorated as any).labor_co_items.length
            : 0,
          labor_co_items: (decorated as any)?.labor_co_items,
        });
        return { data: decorated };
      }

      if (!corporation_uuid) {
        throw createError({ statusCode: 400, statusMessage: "corporation_uuid is required" });
      }

      // Pagination parameters
      const page = parseInt(query.page as string) || 1;
      const pageSize = parseInt(query.page_size as string) || 100;
      const offset = (page - 1) * pageSize;

      // Get total count for pagination metadata
      let countQuery = supabaseServer
        .from("change_orders")
        .select("*", { count: "exact", head: true })
        .eq("corporation_uuid", corporation_uuid as string)
        .eq("is_active", true);

      // Apply optional filters
      if (project_uuid) {
        countQuery = countQuery.eq("project_uuid", project_uuid as string);
      }
      if (vendor_uuid) {
        countQuery = countQuery.eq("vendor_uuid", vendor_uuid as string);
      }

      const createdFromIso =
        created_date_from && String(created_date_from).trim()
          ? normalizeUTC(String(created_date_from).trim(), false)
          : null;
      const createdToIso =
        created_date_to && String(created_date_to).trim()
          ? normalizeUTC(String(created_date_to).trim(), true)
          : null;
      if (createdFromIso) {
        countQuery = countQuery.gte("created_at", createdFromIso);
      }
      if (createdToIso) {
        countQuery = countQuery.lte("created_at", createdToIso);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw createError({ statusCode: 500, statusMessage: countError.message });

      const totalRecords = count || 0;
      const totalPages = Math.ceil(totalRecords / pageSize);

      // Fetch paginated data
      let dataQuery = supabaseServer
        .from("change_orders")
        .select(`
          *,
          project:projects!project_uuid (
            uuid,
            project_name,
            project_id
          ),
          vendor:vendors!vendor_uuid (
            uuid,
            vendor_name
          ),
          purchase_order:purchase_order_forms!original_purchase_order_uuid (
            uuid,
            po_number
          )
        `)
        .eq("corporation_uuid", corporation_uuid as string)
        .eq("is_active", true);

      // Apply optional filters
      if (project_uuid) {
        dataQuery = dataQuery.eq("project_uuid", project_uuid as string);
      }
      if (vendor_uuid) {
        dataQuery = dataQuery.eq("vendor_uuid", vendor_uuid as string);
      }

      if (createdFromIso) {
        dataQuery = dataQuery.gte("created_at", createdFromIso);
      }
      if (createdToIso) {
        dataQuery = dataQuery.lte("created_at", createdToIso);
      }

      const { data, error } = await dataQuery
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw createError({ statusCode: 500, statusMessage: error.message });
      const list = Array.isArray(data) ? data : [];
      const hydrated = list.map((record: any) => {
        const decorated = decorateChangeOrderRecord(record);
        // Add metadata fields for easy access in the list view
        if (record.project) {
          (decorated as any).project_name = record.project.project_name || null;
          (decorated as any).project_id = record.project.project_id || null;
        }
        if (record.vendor) {
          (decorated as any).vendor_name = record.vendor.vendor_name || null;
        }
        if (record.purchase_order) {
          (decorated as any).po_number = record.purchase_order.po_number || null;
        }
        return decorated;
      });
      return { 
        data: hydrated,
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
          hasMore: page < totalPages
        }
      };
    }

    if (method === "POST") {
      if (!body) throw createError({ statusCode: 400, statusMessage: "Request body is required" });
      if (!body.corporation_uuid)
        throw createError({ statusCode: 400, statusMessage: "corporation_uuid is required" });

      // Resolve ship via / freight by name when uuid not provided
      let shipViaUuid = body.ship_via_uuid || null;
      if (!shipViaUuid && body.ship_via) {
        const { data: sv } = await supabaseServer
          .from("ship_via")
          .select("uuid")
          .ilike("ship_via", String(body.ship_via))
          .maybeSingle();
        shipViaUuid = sv?.uuid || null;
      }
      let freightUuid = body.freight_uuid || null;
      if (!freightUuid && body.freight) {
        const { data: fr } = await supabaseServer
          .from("freight")
          .select("uuid")
          .ilike("ship_via", String(body.freight))
          .maybeSingle();
        freightUuid = fr?.uuid || null;
      }

      // Resolve reason by UUID (preferred) or by text (backward compatibility)
      let reasonUuid = body.reason_uuid || null;
      let reasonText = body.reason || null;
      if (!reasonUuid && body.reason) {
        // Try to find UUID by reason text (backward compatibility)
        const { data: reasonRecord } = await supabaseServer
          .from("reasons")
          .select("uuid, reason")
          .ilike("reason", String(body.reason))
          .maybeSingle();
        if (reasonRecord) {
          reasonUuid = reasonRecord.uuid;
          reasonText = reasonRecord.reason;
        } else {
          // Keep the text if no matching reason found (backward compatibility)
          reasonText = body.reason;
        }
      } else if (reasonUuid) {
        // If UUID is provided, fetch the reason text for backward compatibility
        const { data: reasonRecord } = await supabaseServer
          .from("reasons")
          .select("reason")
          .eq("uuid", reasonUuid)
          .maybeSingle();
        if (reasonRecord) {
          reasonText = reasonRecord.reason;
        } else {
          // Stale or client-only UUID would violate change_orders_reason_uuid_fkey
          reasonUuid = null;
          if (reasonText == null || String(reasonText).trim() === "") {
            reasonText = body.reason ?? null;
          }
        }
      }

      const normalizedCoType = normalizeCoType(body.co_type);

      const normalizedRequestedBy = normalizeAppUserUuidOrNimbleUserId(body.requested_by);

      const shouldAutoGenerateCoNumber = body.auto_generate_co_number === true;
      const resolvedCoNumber = shouldAutoGenerateCoNumber
        ? await allocateNextCONumber(
            String(body.corporation_uuid),
            body.project_id
          )
        : body.co_number ?? null;

      const insertData: any = {
        corporation_uuid: body.corporation_uuid,
        project_uuid: body.project_uuid ?? null,
        vendor_uuid: body.vendor_uuid ?? null,
        prepared_by: body.prepared_by ?? null,
        original_purchase_order_uuid: body.original_purchase_order_uuid ?? null,
        co_number: resolvedCoNumber,
        created_date: normalizeUTC(body.created_date),
        credit_days: body.credit_days ?? null,
        credit_days_id: body.credit_days_id ?? null,
        estimated_delivery_date: normalizeUTC(
          body.estimated_delivery_date,
          true
        ),
        requested_by: normalizedRequestedBy.appUserUuid,
        nimble_requested_by_user_id: normalizedRequestedBy.nimbleUserId,
        co_type: normalizedCoType,
        ship_via_uuid: shipViaUuid ?? null,
        freight_uuid: freightUuid ?? null,
        shipping_instructions: body.shipping_instructions ?? null,
        quote_reference: body.quote_reference ?? null,
        reason_uuid: reasonUuid ?? null,
        reason: reasonText ?? null, // Keep for backward compatibility
        shipping_address_uuid: body.shipping_address_uuid ?? null,
        terms_and_conditions_uuid: body.terms_and_conditions_uuid ?? null,
        special_instruction_uuid: body.special_instruction_uuid ?? null,
        status: body.status ?? "Draft",
        is_active: true,
        is_revised: body.is_revised ?? false,
        revision_number: body.revision_number ?? null,
        revision_notes: body.revision_notes ?? null,
        revision_date: body.revision_date ? normalizeUTC(body.revision_date) : null,
      };

      insertData.financial_breakdown = buildFinancialBreakdown(body);
      insertData.attachments = sanitizeAttachments(body.attachments);
      insertData.removed_co_items = Array.isArray(body.removed_co_items) ? body.removed_co_items : [];

      if (body.print_include_approved_by_vendor !== undefined) {
        insertData.print_include_approved_by_vendor =
          body.print_include_approved_by_vendor === null
            ? null
            : Boolean(body.print_include_approved_by_vendor);
      }

      if (body.print_use_entity_name !== undefined) {
        insertData.print_use_entity_name =
          body.print_use_entity_name === null
            ? null
            : Boolean(body.print_use_entity_name);
      }

      for (const key of [
        "project_uuid",
        "vendor_uuid",
        "requested_by",
        "original_purchase_order_uuid",
        "ship_via_uuid",
        "freight_uuid",
        "shipping_address_uuid",
        "terms_and_conditions_uuid",
        "special_instruction_uuid",
      ] as const) {
        if (insertData[key] === "") insertData[key] = null;
      }

      // Get user info for audit log
      const getUserInfo = () => {
        const { user_name, user_email, user_image_url } = body || {};
        const resolvedName =
          (typeof body?.prepared_by === "string" && body.prepared_by.trim()) ||
          (typeof user_name === "string" && user_name.trim()) ||
          "";
        const resolvedEmail =
          (typeof user_email === "string" && user_email.trim()) || "";

        if (!resolvedName && !resolvedEmail) {
          console.warn("No user info provided in request body");
          return null;
        }

        return {
          name: resolvedName || "Unknown User",
          email: resolvedEmail,
          image_url: user_image_url || null,
        };
      };

      const userInfo = getUserInfo();

      // Create audit log entries for creation
      const auditLogEntries = [];
      if (userInfo) {
        // Always log creation
        auditLogEntries.push({
          timestamp: new Date().toISOString(),
          user_name: userInfo.name,
          user_email: userInfo.email,
          user_image_url: userInfo.image_url,
          action: 'created',
          description: `Change order ${insertData.co_number || 'created'} created`
        });

        // If status is 'Ready' or 'Approved', also log the verify/approve action
        const initialStatus = insertData.status || 'Draft';
        if (initialStatus === 'Ready') {
          auditLogEntries.push({
            timestamp: new Date().toISOString(),
            user_name: userInfo.name,
            user_email: userInfo.email,
            user_image_url: userInfo.image_url,
            action: 'marked_ready',
            description: 'Change order marked as ready for approval'
          });
        } else if (initialStatus === 'Approved') {
          auditLogEntries.push({
            timestamp: new Date().toISOString(),
            user_name: userInfo.name,
            user_email: userInfo.email,
            user_image_url: userInfo.image_url,
            action: 'approved',
            description: 'Change order approved'
          });
        }
      }

      insertData.audit_log = auditLogEntries;

      let { data, error } = await supabaseServer
        .from("change_orders")
        .insert([insertData])
        .select()
        .single();

      if (
        error &&
        error.message &&
        error.message.includes("schema cache") &&
        error.message.includes("nimble_requested_by_user_id")
      ) {
        console.warn(
          "[change-orders] nimble_requested_by_user_id column missing, retrying insert without it"
        );
        delete insertData.nimble_requested_by_user_id;
        const retry = await supabaseServer
          .from("change_orders")
          .insert([insertData])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw createError({ statusCode: 500, statusMessage: error.message });

      if (data?.uuid) {
        let coItems = Array.isArray(body.co_items) ? body.co_items : [];

        // If no co_items provided and we have an original purchase order,
        // create change order items from the original purchase order items
        if (coItems.length === 0 && body.original_purchase_order_uuid && normalizedCoType === 'MATERIAL') {
          try {
            const { data: poItems, error: poItemsError } = await supabaseServer
              .from("purchase_order_items_list")
              .select("*")
              .eq("purchase_order_uuid", body.original_purchase_order_uuid);

            if (!poItemsError && Array.isArray(poItems) && poItems.length > 0) {
              // Convert PO items to CO items format
              coItems = poItems.map((poItem: any) => ({
                ...poItem,
                // Use PO quantities and prices as defaults for CO
                co_quantity: poItem.po_quantity,
                co_unit_price: poItem.po_unit_price,
                co_total: poItem.po_total,
                // Ensure cost code data is preserved
                cost_code_uuid: poItem.cost_code_uuid,
                cost_code_label: poItem.cost_code_label,
                cost_code_number: poItem.cost_code_number,
                cost_code_name: poItem.cost_code_name,
                // Preserve category and division so they are stored in change_order_items_list
                category: poItem.category ?? null,
                division_name: poItem.division_name ?? null,
                item_division_uuid: poItem.item_division_uuid ?? null,
              }));
            }
          } catch (error) {
            console.error("[change-orders POST] Failed to fetch PO items for CO creation:", error);
          }
        }

        await persistChangeOrderItems({
          changeOrderUuid: data.uuid,
          corporationUuid: data.corporation_uuid ?? null,
          projectUuid: data.project_uuid ?? null,
          items: coItems,
          originalPoUuid: body.original_purchase_order_uuid ?? null,
        });

        // Save location-wise material CO items (for Material COs from location-wise estimates)
        if (normalizedCoType === 'MATERIAL' || normalizedCoType === null) {
          await persistCoLocationWiseMaterialItems({
            changeOrderUuid: data.uuid,
            corporationUuid: data.corporation_uuid ?? null,
            projectUuid: data.project_uuid ?? null,
            purchaseOrderUuid: body.original_purchase_order_uuid ?? null,
            items: Array.isArray(body.co_location_wise_material_items)
              ? body.co_location_wise_material_items
              : [],
          });
        }
        
        // Save labor CO items if co_type is LABOR
        console.log("[change-orders POST] Checking labor CO items:", {
          normalizedCoType,
          purchaseOrderUuid: body.original_purchase_order_uuid,
          hasLaborCoItems: Array.isArray(body.labor_co_items) && body.labor_co_items.length > 0,
          laborCoItemsCount: Array.isArray(body.labor_co_items) ? body.labor_co_items.length : 0,
        });
        
        if (normalizedCoType === 'LABOR' && body.original_purchase_order_uuid) {
          const laborItems = Array.isArray(body.labor_co_items) ? body.labor_co_items : [];
          
          await persistLaborChangeOrderItems({
            changeOrderUuid: data.uuid,
            corporationUuid: data.corporation_uuid ?? null,
            projectUuid: data.project_uuid ?? null,
            purchaseOrderUuid: body.original_purchase_order_uuid ?? null,
            items: laborItems,
          });
          
          // Calculate total from labor CO items and update financial breakdown
          const laborItemsTotal = laborItems.reduce((sum: number, item: any) => {
            const amount = typeof item?.co_amount === 'number' && Number.isFinite(item.co_amount)
              ? item.co_amount
              : (typeof item?.co_amount === 'string' ? parseFloat(item.co_amount) || 0 : 0);
            return sum + amount;
          }, 0);
          
          const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(
            laborItemsTotal,
            body
          );

          await supabaseServer
            .from("change_orders")
            .update({ financial_breakdown: laborFinancialBreakdown })
            .eq("uuid", data.uuid);
        }

        // Fetch the created record with JOINs to include metadata (project_name, project_id, vendor_name, po_number)
        const { data: recordWithMetadata, error: fetchError } = await supabaseServer
          .from("change_orders")
          .select(`
            *,
            project:projects!project_uuid (
              uuid,
              project_name,
              project_id
            ),
            vendor:vendors!vendor_uuid (
              uuid,
              vendor_name
            ),
            purchase_order:purchase_order_forms!original_purchase_order_uuid (
              uuid,
              po_number
            )
          `)
          .eq("uuid", data.uuid)
          .single();

        if (fetchError) {
          console.error("Error fetching created CO with metadata:", fetchError);
          // Fall back to returning data without metadata
          return { data: decorateChangeOrderRecord(data as any) };
        }

        if (recordWithMetadata) {
          const decorated = decorateChangeOrderRecord(recordWithMetadata);
          // Add metadata fields for easy access in the list view
          if (recordWithMetadata.project) {
            (decorated as any).project_name = recordWithMetadata.project.project_name || null;
            (decorated as any).project_id = recordWithMetadata.project.project_id || null;
          }
          if (recordWithMetadata.vendor) {
            (decorated as any).vendor_name = recordWithMetadata.vendor.vendor_name || null;
          }
          if (recordWithMetadata.purchase_order) {
            (decorated as any).po_number = recordWithMetadata.purchase_order.po_number || null;
          }
          return { data: decorated };
        }
      }

      return { data: decorateChangeOrderRecord(data as any) };
    }

    if (method === "PUT") {
      if (!body) throw createError({ statusCode: 400, statusMessage: "Request body is required" });
      const { uuid, ...updated } = body;
      if (!uuid) throw createError({ statusCode: 400, statusMessage: "uuid is required" });

      // Resolve reason by UUID (preferred) or by text (backward compatibility)
      let reasonUuid = updated.reason_uuid !== undefined ? updated.reason_uuid : null;
      let reasonText = updated.reason !== undefined ? updated.reason : null;
      
      if (updated.reason_uuid !== undefined || updated.reason !== undefined) {
        if (!reasonUuid && updated.reason) {
          // Try to find UUID by reason text (backward compatibility)
          const { data: reasonRecord } = await supabaseServer
            .from("reasons")
            .select("uuid, reason")
            .ilike("reason", String(updated.reason))
            .maybeSingle();
          if (reasonRecord) {
            reasonUuid = reasonRecord.uuid;
            reasonText = reasonRecord.reason;
          } else {
            // Keep the text if no matching reason found (backward compatibility)
            reasonText = updated.reason;
          }
        } else if (reasonUuid) {
          // If UUID is provided, fetch the reason text for backward compatibility
          const { data: reasonRecord } = await supabaseServer
            .from("reasons")
            .select("reason")
            .eq("uuid", reasonUuid)
            .maybeSingle();
          if (reasonRecord) {
            reasonText = reasonRecord.reason;
          } else {
            // Unknown UUID — omit FK; keep free-text reason (same as POST)
            reasonUuid = null;
            if (reasonText == null || String(reasonText).trim() === "") {
              reasonText = updated.reason ?? null;
            }
          }
        }
      }

      const updateData: any = {};
      const fields = [
        "corporation_uuid",
        "project_uuid",
        "vendor_uuid",
        "prepared_by",
        "original_purchase_order_uuid",
        "co_number",
        "created_date",
        "credit_days",
        "credit_days_id",
        "estimated_delivery_date",
        "co_type",
        "ship_via_uuid",
        "freight_uuid",
        "shipping_instructions",
        "quote_reference",
        "reason",
        "reason_uuid",
        "shipping_address_uuid",
        "terms_and_conditions_uuid",
        "special_instruction_uuid",
        "status",
        "is_active",
        "is_revised",
        "revision_number",
        "revision_notes",
        "print_include_approved_by_vendor",
        "print_use_entity_name",
      ];

      for (const f of fields) {
        if (updated[f] !== undefined) {
          if (f === "created_date") updateData[f] = normalizeUTC(updated[f]);
          else if (f === "estimated_delivery_date") updateData[f] = normalizeUTC(updated[f], true);
          else if (
            f === "print_include_approved_by_vendor" ||
            f === "print_use_entity_name"
          )
            updateData[f] =
              updated[f] === null ? null : Boolean(updated[f]);
          else updateData[f] = updated[f];
        }
      }

      if (updated.requested_by !== undefined) {
        const n = normalizeAppUserUuidOrNimbleUserId(updated.requested_by);
        updateData.requested_by = n.appUserUuid;
        updateData.nimble_requested_by_user_id = n.nimbleUserId;
      }

      if (updated.revision_date !== undefined) {
        updateData.revision_date = updated.revision_date ? normalizeUTC(updated.revision_date) : null;
      }

      // Override reason and reason_uuid with resolved values if they were provided
      if (updated.reason_uuid !== undefined || updated.reason !== undefined) {
        updateData.reason_uuid = reasonUuid;
        updateData.reason = reasonText; // Keep for backward compatibility
      }

      if (updated.removed_co_items !== undefined) {
        updateData.removed_co_items = Array.isArray(updated.removed_co_items)
          ? updated.removed_co_items
          : [];
      }

      for (const key of [
        "project_uuid",
        "vendor_uuid",
        "requested_by",
        "original_purchase_order_uuid",
        "ship_via_uuid",
        "freight_uuid",
        "reason_uuid",
        "shipping_address_uuid",
        "terms_and_conditions_uuid",
        "special_instruction_uuid",
      ] as const) {
        if (updateData[key] === "") updateData[key] = null;
      }

      if (
        hasFinancialPayload(updated) ||
        (updated.financial_breakdown &&
          typeof updated.financial_breakdown === "object")
      ) {
        updateData.financial_breakdown = buildFinancialBreakdown(updated);
      }
      if (updated.attachments !== undefined) {
        updateData.attachments = sanitizeAttachments(updated.attachments);
      }

      // Get user info for audit log
      const getUserInfo = () => {
        const { user_name, user_email, user_image_url } = body || {};
        const resolvedName =
          (typeof body?.prepared_by === "string" && body.prepared_by.trim()) ||
          (typeof user_name === "string" && user_name.trim()) ||
          "";
        const resolvedEmail =
          (typeof user_email === "string" && user_email.trim()) || "";

        if (!resolvedName && !resolvedEmail) {
          console.warn("No user info provided in request body");
          return null;
        }

        return {
          name: resolvedName || "Unknown User",
          email: resolvedEmail,
          image_url: user_image_url || null,
        };
      };

      const userInfo = getUserInfo();

      // Get existing audit log and status
      const { data: existingCOWithAudit } = await supabaseServer
        .from("change_orders")
        .select("audit_log, status, co_number")
        .eq("uuid", uuid)
        .single();

      const existingAuditLog = Array.isArray(existingCOWithAudit?.audit_log) 
        ? existingCOWithAudit.audit_log 
        : [];
      // Normalize status values for comparison (handle case and whitespace)
      const normalizeStatus = (status: any): string => {
        if (!status) return 'Draft';
        return String(status).trim();
      };
      const oldStatus = normalizeStatus(existingCOWithAudit?.status);
      // Only use updateData.status if it's explicitly provided (not undefined/null)
      // This ensures we detect status changes correctly
      const newStatus = (updateData.status !== undefined && updateData.status !== null) 
        ? normalizeStatus(updateData.status) 
        : oldStatus;
      const coNumber = existingCOWithAudit?.co_number || '';

      // Create audit log entry based on what changed
      let auditLogEntry = null;
      if (userInfo) {
        // Check if status changed
        if (oldStatus !== newStatus) {
          if (newStatus === 'Ready' && oldStatus !== 'Ready') {
            auditLogEntry = {
              timestamp: new Date().toISOString(),
              user_name: userInfo.name,
              user_email: userInfo.email,
              user_image_url: userInfo.image_url,
              action: 'marked_ready',
              description: 'Change order marked as ready for approval'
            };
          } else if (newStatus === 'Approved' && oldStatus !== 'Approved') {
            auditLogEntry = {
              timestamp: new Date().toISOString(),
              user_name: userInfo.name,
              user_email: userInfo.email,
              user_image_url: userInfo.image_url,
              action: 'approved',
              description: 'Change order approved'
            };
          } else if (newStatus === 'Rejected' && oldStatus !== 'Rejected') {
            auditLogEntry = {
              timestamp: new Date().toISOString(),
              user_name: userInfo.name,
              user_email: userInfo.email,
              user_image_url: userInfo.image_url,
              action: 'rejected',
              description: 'Change order rejected'
            };
          } else if (
            newStatus === 'Draft' &&
            oldStatus === 'Approved' &&
            updateData.is_revised === true
          ) {
            auditLogEntry = {
              timestamp: new Date().toISOString(),
              user_name: userInfo.name,
              user_email: userInfo.email,
              user_image_url: userInfo.image_url,
              action: 'revised',
              description: 'Change order revised'
            };
          }
        } else {
          // Status didn't change, but other fields did - track as update
          // Only track if there are actual field changes (not just status)
          const hasFieldChanges = Object.keys(updateData).some(
            key => key !== 'status' && key !== 'uuid' && key !== 'audit_log'
          );
          if (hasFieldChanges) {
            auditLogEntry = {
              timestamp: new Date().toISOString(),
              user_name: userInfo.name,
              user_email: userInfo.email,
              user_image_url: userInfo.image_url,
              action: 'updated',
              description: 'Change order updated'
            };
          }
        }
      }

      // Merge audit log
      const mergedAuditLog = auditLogEntry 
        ? [...existingAuditLog, auditLogEntry]
        : existingAuditLog;

      // Always update audit_log if we created a new entry
      if (auditLogEntry) {
        updateData.audit_log = mergedAuditLog;
      }

      let { data, error } = await supabaseServer
        .from("change_orders")
        .update(updateData)
        .eq("uuid", uuid)
        .select()
        .single();

      if (
        error &&
        error.message &&
        error.message.includes("schema cache") &&
        error.message.includes("nimble_requested_by_user_id")
      ) {
        console.warn(
          "[change-orders] nimble_requested_by_user_id column missing, retrying update without it"
        );
        delete updateData.nimble_requested_by_user_id;
        const retry = await supabaseServer
          .from("change_orders")
          .update(updateData)
          .eq("uuid", uuid)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw createError({ statusCode: 500, statusMessage: error.message });

      if (data?.uuid) {
        // Only replace CO line items when the client sends item payloads. Partial PUTs
        // (e.g. print_* flags only) must not pass [] and wipe rows.
        const shouldPersistLineItems =
          updated.co_items !== undefined ||
          updated.co_location_wise_material_items !== undefined ||
          updated.labor_co_items !== undefined;

        if (shouldPersistLineItems) {
          const originalPoUuid =
            updated.original_purchase_order_uuid ?? data.original_purchase_order_uuid ?? null;
          await persistChangeOrderItems({
            changeOrderUuid: data.uuid,
            corporationUuid: data.corporation_uuid ?? null,
            projectUuid: data.project_uuid ?? null,
            items: Array.isArray(updated.co_items) ? updated.co_items : [],
            originalPoUuid,
          });

          // Save location-wise material CO items
          const currentCoType = normalizeCoType(updated.co_type ?? data.co_type);
          if (currentCoType === "MATERIAL" || currentCoType === null) {
            if ("co_location_wise_material_items" in updated) {
              await persistCoLocationWiseMaterialItems({
                changeOrderUuid: data.uuid,
                corporationUuid: data.corporation_uuid ?? null,
                projectUuid: data.project_uuid ?? null,
                purchaseOrderUuid: originalPoUuid,
                items: Array.isArray(updated.co_location_wise_material_items)
                  ? updated.co_location_wise_material_items
                  : [],
              });
            }
          }

          // Save labor CO items if co_type is LABOR
          const purchaseOrderUuid =
            updated.original_purchase_order_uuid ?? data.original_purchase_order_uuid ?? null;

          console.log("[change-orders PUT] Checking labor CO items:", {
            currentCoType,
            purchaseOrderUuid,
            hasLaborCoItems:
              Array.isArray(updated.labor_co_items) && updated.labor_co_items.length > 0,
            laborCoItemsCount: Array.isArray(updated.labor_co_items)
              ? updated.labor_co_items.length
              : 0,
            laborCoItemsProvided: "labor_co_items" in updated,
          });

          if (currentCoType === "LABOR" && purchaseOrderUuid) {
            // Only update labor items if they are explicitly provided in the update
            // If not provided, preserve existing items (don't delete them)
            if ("labor_co_items" in updated) {
              const laborItems = Array.isArray(updated.labor_co_items)
                ? updated.labor_co_items
                : [];

              await persistLaborChangeOrderItems({
                changeOrderUuid: data.uuid,
                corporationUuid: data.corporation_uuid ?? null,
                projectUuid: data.project_uuid ?? null,
                purchaseOrderUuid: purchaseOrderUuid,
                items: laborItems,
              });

              // Calculate total from labor CO items and update financial breakdown
              const laborItemsTotal = laborItems.reduce((sum: number, item: any) => {
                const amount =
                  typeof item?.co_amount === "number" && Number.isFinite(item.co_amount)
                    ? item.co_amount
                    : typeof item?.co_amount === "string"
                      ? parseFloat(item.co_amount) || 0
                      : 0;
                return sum + amount;
              }, 0);

              const laborFinancialPayload = {
                ...decorateChangeOrderRecord(data as any),
                ...updated,
              };
              const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(
                laborItemsTotal,
                laborFinancialPayload
              );

              await supabaseServer
                .from("change_orders")
                .update({ financial_breakdown: laborFinancialBreakdown })
                .eq("uuid", data.uuid);
            } else {
              // If labor_co_items not provided, recalculate item total from existing items
              // but preserve taxes from the saved CO / this request payload.
              const { data: existingLaborItems } = await supabaseServer
                .from("labor_change_order_items_list")
                .select("co_amount")
                .eq("change_order_uuid", data.uuid)
                .eq("is_active", true);

              if (Array.isArray(existingLaborItems)) {
                const laborItemsTotal = existingLaborItems.reduce((sum: number, item: any) => {
                  const amount =
                    typeof item?.co_amount === "number" && Number.isFinite(item.co_amount)
                      ? item.co_amount
                      : typeof item?.co_amount === "string"
                        ? parseFloat(item.co_amount) || 0
                        : 0;
                  return sum + amount;
                }, 0);

                const laborFinancialPayload = {
                  ...decorateChangeOrderRecord(data as any),
                  ...updated,
                };
                const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(
                  laborItemsTotal,
                  laborFinancialPayload
                );

                await supabaseServer
                  .from("change_orders")
                  .update({ financial_breakdown: laborFinancialBreakdown })
                  .eq("uuid", data.uuid);
              }
            }
          }
        }

        // Fetch the updated record with JOINs to include metadata (project_name, project_id, vendor_name, po_number)
        const { data: recordWithMetadata, error: fetchError } = await supabaseServer
          .from("change_orders")
          .select(`
            *,
            project:projects!project_uuid (
              uuid,
              project_name,
              project_id
            ),
            vendor:vendors!vendor_uuid (
              uuid,
              vendor_name
            ),
            purchase_order:purchase_order_forms!original_purchase_order_uuid (
              uuid,
              po_number
            )
          `)
          .eq("uuid", data.uuid)
          .single();

        if (fetchError) {
          console.error("Error fetching updated CO with metadata:", fetchError);
          // Fall back to returning data without metadata
          return { data: decorateChangeOrderRecord(data as any) };
        }

        if (recordWithMetadata) {
          const decorated = decorateChangeOrderRecord(recordWithMetadata);
          // Add metadata fields for easy access in the list view
          if (recordWithMetadata.project) {
            (decorated as any).project_name = recordWithMetadata.project.project_name || null;
            (decorated as any).project_id = recordWithMetadata.project.project_id || null;
          }
          if (recordWithMetadata.vendor) {
            (decorated as any).vendor_name = recordWithMetadata.vendor.vendor_name || null;
          }
          if (recordWithMetadata.purchase_order) {
            (decorated as any).po_number = recordWithMetadata.purchase_order.po_number || null;
          }
          return { data: decorated };
        }
      }

      return { data: decorateChangeOrderRecord(data as any) };
    }

    if (method === "DELETE") {
      const { uuid } = query;
      if (!uuid) throw createError({ statusCode: 400, statusMessage: "uuid is required" });

      const coUuid = String(uuid);

      const { count: invoiceCount, error: invoiceCountError } = await supabaseServer
        .from("vendor_invoices")
        .select("*", { count: "exact", head: true })
        .eq("change_order_uuid", coUuid)
        .eq("is_active", true);

      if (invoiceCountError) {
        throw createError({
          statusCode: 500,
          statusMessage: invoiceCountError.message,
        });
      }

      if (invoiceCount && invoiceCount > 0) {
        throw createError({
          statusCode: 409,
          statusMessage:
            "Cannot delete this change order because one or more vendor invoices are linked to it.",
        });
      }

      const { data, error } = await supabaseServer
        .from("change_orders")
        .update({ is_active: false })
        .eq("uuid", coUuid)
        .select()
        .single();

      if (error) throw createError({ statusCode: 500, statusMessage: error.message });
      return { data };
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error: any) {
    console.error("change-orders API error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error: " + error.message,
    });
  }
});


