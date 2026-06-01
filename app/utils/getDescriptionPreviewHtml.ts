/** Escape plain text for safe insertion inside HTML (when content is not already HTML). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Returns HTML suitable for `v-html` preview: renders stored rich-text HTML, or wraps plain text in <p>.
 */
export function getDescriptionPreviewHtml(value: unknown): string {
  const raw = String(value || '').trim()
  if (!raw) return '<p>-</p>'
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw)
  if (looksLikeHtml) return raw
  return `<p>${escapeHtml(raw)}</p>`
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code)
      return Number.isFinite(n) ? String.fromCharCode(n) : ''
    })
}

/** Plain text for tables, tooltips, and reports (strips tags, decodes common entities). */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return ''
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  const noTags = withLineBreaks.replace(/<[^>]+>/g, ' ')
  const decoded = decodeHtmlEntities(noTags)
  return decoded.replace(/\s+/g, ' ').trim()
}
