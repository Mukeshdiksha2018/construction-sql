import nodemailer from "nodemailer";
import { readMultipartFormData } from "h3";
import { getPrisma } from '~/server/utils/prisma'
import {
  appendSkippedAttachmentsNotice,
  filterCoAttachmentsExcludingUuids,
  loadChangeOrderEmailStorageAttachments,
} from "~/server/utils/changeOrderEmailAttachments";

function parseEmailList(raw: string): string[] {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const MAX_BODY_HTML_CHARS = 256_000;

function htmlToPlainText(html: string): string {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.smtpFrom) {
    throw createError({
      statusCode: 503,
      statusMessage: "Email is not configured on the server",
    });
  }

  const parts = await readMultipartFormData(event);
  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing form data",
    });
  }

  let toRaw = "";
  let ccRaw = "";
  let coUuid = "";
  let bodyHtml = "";
  let excludeAttachmentUuidsRaw = "";
  let pdfBuffer: Buffer | null = null;

  for (const part of parts) {
    const name = part.name || "";
    if (name === "to") {
      toRaw = part.data.toString("utf8").trim();
    } else if (name === "cc") {
      ccRaw = part.data.toString("utf8").trim();
    } else if (name === "coUuid") {
      coUuid = part.data.toString("utf8").trim();
    } else if (name === "bodyHtml") {
      bodyHtml = part.data.toString("utf8");
    } else if (name === "excludeAttachmentUuids") {
      excludeAttachmentUuidsRaw = part.data.toString("utf8").trim();
    } else if (name === "pdf" && part.data?.length) {
      pdfBuffer = Buffer.from(part.data);
    }
  }

  const excludeAttachmentUuids = excludeAttachmentUuidsRaw
    ? excludeAttachmentUuidsRaw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  if (bodyHtml.length > MAX_BODY_HTML_CHARS) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email body is too large",
    });
  }

  if (!coUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Change order UUID is required",
    });
  }

  const coRow = await getPrisma().changeOrder.findFirst({
    where: { uuid: coUuid, is_active: true },
    select: { uuid: true, co_number: true, attachments: true },
  })

  if (!coRow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Change order not found',
    })
  }

  if (!toRaw) {
    throw createError({
      statusCode: 400,
      statusMessage: "Recipient email is required",
    });
  }

  const to = parseEmailList(toRaw);
  if (to.length === 0 || !to.every(isValidEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid recipient email address",
    });
  }

  const cc = parseEmailList(ccRaw).filter(isValidEmail);

  if (!pdfBuffer || pdfBuffer.length < 64) {
    throw createError({
      statusCode: 400,
      statusMessage: "PDF attachment is missing or invalid",
    });
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort) || 587,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  const coNumber = (coRow as { co_number?: string }).co_number;
  const subject = coNumber ? `Change Order ${coNumber}` : "Change Order";

  const safeFileBase = coNumber
    ? String(coNumber).replace(/[^\w.-]+/g, "_")
    : coUuid;

  let attachmentsForEmail: unknown = []
  try {
    attachmentsForEmail = coRow.attachments ? JSON.parse(coRow.attachments) : []
  } catch {
    attachmentsForEmail = []
  }
  attachmentsForEmail = filterCoAttachmentsExcludingUuids(
    attachmentsForEmail,
    excludeAttachmentUuids,
  )

  let storageAttachmentResult;
  try {
    storageAttachmentResult = await loadChangeOrderEmailStorageAttachments(
      attachmentsForEmail,
      pdfBuffer.length
    );
  } catch (e: unknown) {
    const statusCode =
      e && typeof e === "object" && "statusCode" in e
        ? Number((e as { statusCode?: number }).statusCode) || 413
        : 502;
    const message = e instanceof Error ? e.message : "Could not prepare attachments";
    throw createError({ statusCode, statusMessage: message });
  }

  const trimmedHtml = bodyHtml.trim();
  const defaultText = `Please find the change order attached.\n\nReference: ${coUuid}`;
  const defaultHtml = `<p>Please find the change order attached.</p><p>Reference: ${coUuid}</p>`;

  let htmlBody = trimmedHtml ? trimmedHtml : defaultHtml;
  htmlBody = appendSkippedAttachmentsNotice(
    htmlBody,
    storageAttachmentResult.skipped
  );
  const textBody = htmlToPlainText(htmlBody) || defaultText;

  const mailAttachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [
    {
      filename: `change-order-${safeFileBase}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
    ...storageAttachmentResult.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  ];

  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: to.join(", "),
      cc: cc.length ? cc.join(", ") : undefined,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: mailAttachments,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("[change-orders/send-email]", e);
    throw createError({
      statusCode: 502,
      statusMessage: message,
    });
  }

  return {
    ok: true,
    attachmentCount: mailAttachments.length,
    includedStorageFiles: storageAttachmentResult.includedNames,
    skippedStorageFiles: storageAttachmentResult.skipped,
  };
});
