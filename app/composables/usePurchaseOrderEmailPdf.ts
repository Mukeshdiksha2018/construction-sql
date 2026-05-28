/**
 * Renders a DOM subtree (e.g. PurchaseOrder preview wrapper) into a multi-page PDF blob
 * for email attachment. Runs in the browser only.
 */
export async function buildPurchaseOrderPreviewPdfBlob(element: HTMLElement): Promise<Blob> {
  const { toCanvas } = await import('html-to-image')
  const { jsPDF } = await import('jspdf')

  const MARGIN_MM = 6

  const canvas = await toCanvas(element, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    style: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()
  const innerW = pageWidthMm - 2 * MARGIN_MM
  const innerH = pageHeightMm - 2 * MARGIN_MM
  const imgWidthMm = innerW
  const sliceHeightPxMax = Math.max(1, Math.floor((innerH * canvas.width) / imgWidthMm))

  let srcYPx = 0
  let firstPage = true
  while (srcYPx < canvas.height) {
    const sliceHeightPx = Math.min(canvas.height - srcYPx, sliceHeightPxMax)
    const sliceHeightMm = (sliceHeightPx * imgWidthMm) / canvas.width

    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeightPx
    const ctx = sliceCanvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(canvas, 0, srcYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
    const data = sliceCanvas.toDataURL('image/png', 0.92)

    if (!firstPage) pdf.addPage()
    pdf.addImage(data, 'PNG', MARGIN_MM, MARGIN_MM, imgWidthMm, sliceHeightMm)
    firstPage = false
    srcYPx += sliceHeightPx
  }

  return pdf.output('blob') as Blob
}
