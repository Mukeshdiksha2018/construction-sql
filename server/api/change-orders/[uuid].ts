import { supabaseServer } from "~/utils/supabaseServer";
import { decorateChangeOrderRecord } from "./utils";

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const uuid = getRouterParam(event, "uuid");

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Change order UUID is required",
    });
  }

  try {
    if (method === "GET") {
      const { data, error } = await supabaseServer
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
        .eq("uuid", uuid)
        .maybeSingle();

      if (error)
        throw createError({ statusCode: 500, statusMessage: error.message });
      if (!data)
        throw createError({ statusCode: 404, statusMessage: "Change order not found" });
      
      const decorated = decorateChangeOrderRecord(data as any);
      
      // Add metadata fields for easy access in the list view
      // Always set these fields, even if null, for consistency
      if ((data as any).project) {
        (decorated as any).project_name = (data as any).project.project_name || null;
        (decorated as any).project_id = (data as any).project.project_id || null;
      } else {
        (decorated as any).project_name = null;
        (decorated as any).project_id = null;
      }
      if ((data as any).vendor) {
        (decorated as any).vendor_name = (data as any).vendor.vendor_name || null;
      } else {
        (decorated as any).vendor_name = null;
      }
      if ((data as any).purchase_order) {
        (decorated as any).po_number = (data as any).purchase_order.po_number || null;
      } else {
        (decorated as any).po_number = null;
      }

      const coCorpUuid = (decorated as { corporation_uuid?: string }).corporation_uuid;
      if (coCorpUuid) {
        try {
          const { data: corpRow, error: corpErr } = await supabaseServer
            .from("properties")
            .select("corporation_name, legal_name")
            .eq("uuid", coCorpUuid)
            .maybeSingle();
          if (!corpErr && corpRow) {
            (decorated as any).corporation_name = corpRow.corporation_name ?? null;
            (decorated as any).corporation_legal_name = corpRow.legal_name ?? null;
          } else {
            (decorated as any).corporation_name = null;
            (decorated as any).corporation_legal_name = null;
          }
        } catch {
          (decorated as any).corporation_name = null;
          (decorated as any).corporation_legal_name = null;
        }
      } else {
        (decorated as any).corporation_name = null;
        (decorated as any).corporation_legal_name = null;
      }
      
      // Fetch location-wise material CO items (for Material COs from location-wise estimates)
      const normalizedCoType = ((decorated as any).co_type || "").toUpperCase();
      if (normalizedCoType !== "LABOR") {
        try {
          const { data: lwmItems, error: lwmError } = await supabaseServer
            .from("co_location_wise_material")
            .select("*")
            .eq("change_order_uuid", uuid)
            .eq("is_active", true)
            .order("order_index", { ascending: true });

          if (lwmError) {
            console.error("Error fetching co location wise material:", lwmError);
          } else {
            (decorated as any).co_location_wise_material_items = Array.isArray(lwmItems)
              ? lwmItems.map((item: any) => ({
                  id: item.id || item.uuid,
                  uuid: item.uuid,
                  cost_code_uuid: item.cost_code_uuid,
                  cost_code_number: item.cost_code_number,
                  cost_code_name: item.cost_code_name,
                  cost_code_label:
                    item.cost_code_label ||
                    (item.cost_code_number && item.cost_code_name
                      ? `${item.cost_code_number} ${item.cost_code_name}`.trim()
                      : item.cost_code_number || item.cost_code_name || null),
                  division_name: item.division_name,
                  location_uuid: item.location_uuid || null,
                  location_label: item.location_label || null,
                  material_budgeted_amount: item.material_budgeted_amount,
                  po_amount: item.po_amount,
                  co_amount: item.co_amount,
                  description: item.description || '',
                  order_index: item.order_index,
                  metadata: item.metadata || {},
                }))
              : [];
          }
        } catch (lwmFetchError: any) {
          console.error("Error fetching co location wise material items:", lwmFetchError);
          (decorated as any).co_location_wise_material_items = [];
        }
      }

      return { data: decorated };
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error: any) {
    console.error("change-orders/[uuid] error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error: " + error.message,
    });
  }
});


