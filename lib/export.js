'use client'

export function exportPPTX(wip, cfg, toast) {
  // PptxGenJS is loaded via CDN script tag in layout
  if (typeof window === 'undefined') return

  // Dynamically load if not already present
  if (!window.PptxGenJS) {
    const sc = document.createElement('script')
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundled.js'
    sc.onload = () => doExport(wip, cfg, toast)
    document.head.appendChild(sc)
    return
  }
  doExport(wip, cfg, toast)
}

function doExport(wip, cfg, toast) {
  if (!window.PptxGenJS) { toast('PPTX library still loading — try again in a moment.', true); return }

  const pptx = new window.PptxGenJS()
  const pc = (cfg.primary_color || '#0f2744').replace('#', '')
  const ac = (cfg.accent || '#c49a2a').replace('#', '')

  pptx.layout = 'LAYOUT_WIDE'

  // ── Cover slide ──
  const cv = pptx.addSlide()
  cv.background = { color: pc }
  cv.addShape(pptx.ShapeType.rect, { x: 0, y: 5.8, w: 0.5, h: 1.7, fill: { color: ac } })
  cv.addText(cfg.company || 'Your Company', {
    x: 0.8, y: 1.6, w: 11.5, h: 1.5, fontSize: 44, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
  })
  cv.addText(`RFP Response: ${wip.title || wip.hospital}`, {
    x: 0.8, y: 3.3, w: 11.5, h: 0.7, fontSize: 22, color: 'CCCCCC', fontFace: 'Calibri',
  })
  cv.addText(wip.hospital || '', {
    x: 0.8, y: 4.1, w: 11.5, h: 0.6, fontSize: 18, color: ac, bold: true, fontFace: 'Calibri',
  })
  cv.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), {
    x: 0.8, y: 4.9, w: 11.5, h: 0.4, fontSize: 13, color: 'AAAAAA',
  })
  cv.addShape(pptx.ShapeType.rect, { x: 0, y: 6.9, w: 13.33, h: 0.6, fill: { color: ac } })
  cv.addText(cfg.tagline || '', {
    x: 0.5, y: 6.92, w: 12, h: 0.56, fontSize: 13, color: 'FFFFFF', italic: true,
  })

  // ── Content slides ──
  wip.sections.forEach(sec => {
    const sl = pptx.addSlide()
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.15, fill: { color: pc } })
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 1.15, w: 13.33, h: 0.07, fill: { color: ac } })
    sl.addText(sec.title, { x: 0.5, y: 0.18, w: 12.3, h: 0.85, fontSize: 26, bold: true, color: 'FFFFFF', fontFace: 'Calibri' })

    const hasImg = sec.images?.length > 0
    const tw = hasImg ? 7.6 : 12.4
    const clean = (sec.answer || '')
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()

    sl.addText(clean || '(No response drafted yet)', {
      x: 0.5, y: 1.45, w: tw, h: 5.6, fontSize: 13, color: '1a1a2e',
      valign: 'top', wrap: true, fontFace: 'Calibri', paraSpaceAfter: 6,
    })

    if (hasImg && sec.images[0]?.url) {
      try {
        sl.addImage({ path: sec.images[0].url, x: 8.5, y: 1.45, w: 4.4, h: 4.5 })
      } catch (e) { console.warn('Could not embed image:', e) }
    }

    // Footer
    sl.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: 13.33, h: 0.4, fill: { color: 'F5F5F5' } })
    sl.addText(cfg.company || '', { x: 0.4, y: 7.15, w: 7, h: 0.3, fontSize: 8.5, color: '999999' })
    sl.addText(wip.hospital || '', { x: 7, y: 7.15, w: 6, h: 0.3, fontSize: 8.5, color: '999999', align: 'right' })
  })

  // ── Closing slide ──
  const cl = pptx.addSlide()
  cl.background = { color: pc }
  cl.addShape(pptx.ShapeType.rect, { x: 4, y: 5.4, w: 5.33, h: 0.08, fill: { color: ac } })
  cl.addText('Thank You', { x: 1, y: 2.3, w: 11, h: 1.5, fontSize: 54, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Calibri' })
  cl.addText('We look forward to the opportunity to partner with you.', {
    x: 1.5, y: 4.0, w: 10, h: 0.7, fontSize: 17, color: 'CCCCCC', align: 'center', italic: true,
  })
  if (cfg.email) cl.addText(cfg.email, { x: 1, y: 5.7, w: 11, h: 0.5, fontSize: 15, color: ac, align: 'center' })
  if (cfg.phone) cl.addText(cfg.phone, { x: 1, y: 6.2, w: 11, h: 0.4, fontSize: 13, color: 'AAAAAA', align: 'center' })
  if (cfg.website) cl.addText(cfg.website, { x: 1, y: 6.65, w: 11, h: 0.4, fontSize: 13, color: 'AAAAAA', align: 'center' })

  const filename = `${(wip.hospital || 'RFP').replace(/\s+/g, '_')}_Response_${new Date().toISOString().slice(0, 10)}.pptx`
  pptx.writeFile({ fileName: filename })
  toast('PowerPoint exported and downloading!')
}
