import { supabaseServer } from "~/utils/supabaseServer";

/** Same bucket as change-orders/documents/upload */
export const CO_EMAIL_STORAGE_BUCKET = "change_order_storage";

/** Max CO bucket PDFs per email (preview PDF is separate). */
export const CO_EMAIL_MAX_EXTRA_FILES = 8;

/** Per-file limit (matches upload API). */
export const CO_EMAIL_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Total payload cap for SMTP deliverability (preview + bucket files). */
export const CO_EMAIL_MAX_TOTAL_BYTES = 18 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["application/pdf"]);

export type StoredCoAttachmentMeta = {
  uuid?: string;
  document_name?: string;
  mime_type?: string;
  file_size?: number;
  file_path?: string;
};

export type CoEmailStorageAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type LoadCoEmailStorageAttachmentsResult = {
  attachments: CoEmailStorageAttachment[];
  includedNames: string[];
  skipped: Array<{ name: string; reason: string }>;
};

export function sanitizeCoEmailAttachmentFilename(
  name: string,
  fallbackIndex: number
): string {
  const raw = String(name || `document-${fallbackIndex + 1}.pdf`).trim();
  const cleaned = raw.replace(/[^\w.\- ()]+/g, "_").slice(0, 120);
  if (!cleaned) return `document-${fallbackIndex + 1}.pdf`;
  return cleaned.toLowerCase().endsWith(".pdf")
    ? cleaned
    : `${cleaned.replace(/\.+$/, "")}.pdf`;
}

export function filterCoAttachmentsExcludingUuids(
  attachments: unknown,
  excludeUuids: string[]
): unknown {
  if (!excludeUuids.length) return attachments;
  const exclude = new Set(excludeUuids.map((id) => String(id).trim()).filter(Boolean));
  if (!Array.isArray(attachments)) return attachments;
  return attachments.filter((item) => {
    if (!item || typeof item !== "object") return true;
    const uuid = (item as StoredCoAttachmentMeta).uuid;
    return !uuid || !exclude.has(String(uuid));
  });
}

export function normalizeStoredCoAttachments(
  attachments: unknown
): StoredCoAttachmentMeta[] {
  if (!Array.isArray(attachments)) return [];
  return attachments.filter((item): item is StoredCoAttachmentMeta => {
    if (!item || typeof item !== "object") return false;
    const path = (item as StoredCoAttachmentMeta).file_path;
    return typeof path === "string" && path.trim().length > 0;
  });
}

export function validateCoEmailAttachmentPlan(
  stored: StoredCoAttachmentMeta[],
  previewPdfByteLength: number
): { ok: true } | { ok: false; statusMessage: string } {
  if (stored.length > CO_EMAIL_MAX_EXTRA_FILES) {
    return {
      ok: false,
      statusMessage: `Too many attachments (${stored.length}). Remove extras so at most ${CO_EMAIL_MAX_EXTRA_FILES} files are included (plus the change order PDF).`,
    };
  }

  let totalBytes = Math.max(0, previewPdfByteLength);
  for (const item of stored) {
    const size = Number(item.file_size);
    if (Number.isFinite(size) && size > 0) {
      if (size > CO_EMAIL_MAX_FILE_BYTES) {
        return {
          ok: false,
          statusMessage: `Attachment "${item.document_name || "file"}" exceeds the ${CO_EMAIL_MAX_FILE_BYTES / (1024 * 1024)}MB per-file limit.`,
        };
      }
      totalBytes += size;
    }
    const mime = String(item.mime_type || "application/pdf").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return {
        ok: false,
        statusMessage: `Attachment "${item.document_name || "file"}" is not a PDF and cannot be emailed.`,
      };
    }
  }

  if (totalBytes > CO_EMAIL_MAX_TOTAL_BYTES) {
    const mb = (CO_EMAIL_MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      statusMessage: `Attachments are too large to send in one email (limit ~${mb}MB total including the change order PDF). Remove or split files.`,
    };
  }

  return { ok: true };
}

export async function loadChangeOrderEmailStorageAttachments(
  attachments: unknown,
  previewPdfByteLength: number
): Promise<LoadCoEmailStorageAttachmentsResult> {
  const stored = normalizeStoredCoAttachments(attachments);
  const plan = validateCoEmailAttachmentPlan(stored, previewPdfByteLength);
  if (!plan.ok) {
    const err = new Error(plan.statusMessage) as Error & { statusCode?: number };
    err.statusCode = 413;
    throw err;
  }

  const result: LoadCoEmailStorageAttachmentsResult = {
    attachments: [],
    includedNames: [],
    skipped: [],
  };

  if (stored.length === 0) {
    return result;
  }

  for (let i = 0; i < stored.length; i++) {
    const meta = stored[i];
    const displayName = meta.document_name || `document-${i + 1}.pdf`;
    const filePath = String(meta.file_path).trim();

    const { data, error } = await supabaseServer.storage
      .from(CO_EMAIL_STORAGE_BUCKET)
      .download(filePath);

    if (error || !data) {
      result.skipped.push({
        name: displayName,
        reason: error?.message || "Could not download from storage",
      });
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    if (!buffer.length) {
      result.skipped.push({ name: displayName, reason: "File is empty" });
      continue;
    }

    if (buffer.length > CO_EMAIL_MAX_FILE_BYTES) {
      result.skipped.push({
        name: displayName,
        reason: `Exceeds ${CO_EMAIL_MAX_FILE_BYTES / (1024 * 1024)}MB limit`,
      });
      continue;
    }

    const filename = sanitizeCoEmailAttachmentFilename(displayName, i);
    result.attachments.push({
      filename,
      content: buffer,
      contentType: "application/pdf",
    });
    result.includedNames.push(filename);
  }

  if (stored.length > 0 && result.attachments.length === 0) {
    const err = new Error(
      "Could not attach any change order documents from storage. Try again or re-upload the files."
    ) as Error & { statusCode?: number };
    err.statusCode = 502;
    throw err;
  }

  return result;
}

export { appendSkippedAttachmentsNotice } from "~/server/utils/purchaseOrderEmailAttachments";
