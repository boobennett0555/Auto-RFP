'use client'
import { useState, useRef, useEffect } from 'react'
import { callClaude } from '@/lib/claude'
import { exportPPTX } from '@/lib/export'

export default function EditorView({ cfg, kb, wip, setWip, setPg, supabase, toast, loadPastRFPs }) {
  const [sel, setSel] = useState(wip?.sections?.[0]?.id || null)
  const [busy, setBusy] = useState('')
  const edRef = useRef(null)
  const lastSel = useRef(null)
  const P = cfg?.primary_color || '#0f2744'
  const A = cfg?.accent || '#c49a2a'

  useEffect(() => {
    if (!wip?.sections?.length) return
    if (!sel) setSel(wip.sections[0].id)
  }, [wip])

  useEffect(() => {
    if (!edRef.current || !wip || !sel) return
    if (sel !== lastSel.current) {
      const s = wip.sections.find(s => s.id === sel)
      edRef.current.innerHTML = s?.answer || ''
      lastSel.current = sel
    }
  })

  if (!wip) return (
    <div className="flex items-center justify-center h-full text-slate-300">
      <div className="text-center"><div className="text-4xl mb-3">📄</div><div>No RFP open — go to New RFP or Past RFPs</div></div>
    </div>
  )

  const curSec = wip.sections?.find(s => s.id === sel)
  const answered = wip.sections?.filter(s => s.answer?.replace(/<[^>]+>/g, '').trim().length > 30).length || 0

  const updSection = (sId, patch) => {
    setWip(p => ({ ...p, sections: p.sections.map(s => s.id === sId ? { ...s, ...patch } : s) }))
  }

  const saveSection = async (sId, answer) => {
    await supabase.from('rfp_sections').update({ answer }).eq('id', sId)
  }

  const aiDraft = async (sId) => {
    const sec = wip.sections.find(s => s.id === sId)
    if (!sec) return
    setBusy(`Drafting: ${sec.title}…`)
    try {
      const kbCtx = kb.slice(0, 40).map(e => `TOPIC: ${e.question}\nRESPONSE: ${e.answer}`).join('\n\n---\n\n')
      const ans = await callClaude([{
        role: 'user',
        content: `Write a compelling, professional RFP response section for ${cfg.company} (${cfg.tagline}).

CLIENT: ${wip.hospital || 'the hospital system'}
SECTION: ${sec.title}
REQUIREMENT: ${sec.question}
CATEGORY: ${sec.category}

${kbCtx ? `KNOWLEDGE BASE — OUR PAST RESPONSES:\n${kbCtx}` : 'No prior knowledge yet — write a strong professional boilerplate.'}

Write 2–4 focused paragraphs. First-person plural (we/our). Confident and specific. No headings — paragraphs only.`,
      }])
      const html = `<p>${ans.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
      updSection(sId, { answer: html })
      await saveSection(sId, html)
      if (sel === sId && edRef.current) { edRef.current.innerHTML = html; lastSel.current = sId }
    } catch (e) { toast('AI error — check connection.', true) }
    setBusy('')
  }

  const aiDraftAll = async () => {
    const unanswered = wip.sections.filter(s => !s.answer || s.answer.replace(/<[^>]+>/g, '').trim().length < 30)
    for (const s of unanswered) { await aiDraft(s.id); await new Promise(r => setTimeout(r, 400)) }
    toast(`✓ All ${unanswered.length} sections drafted!`)
  }

  const uploadImage = async (sId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sectionId', sId)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.error) { toast('Image upload failed.', true); return }
    const newImg = { id: data.path, url: data.url, name: data.name }
    const imgs = [...(curSec.images || []), newImg]
    updSection(sId, { images: imgs })
    await supabase.from('rfp_sections').update({ images: imgs }).eq('id', sId)
  }

  const removeImage = async (sId, imgId) => {
    await supabase.storage.from('rfp-images').remove([imgId])
    const imgs = (curSec.images || []).filter(i => i.id !== imgId)
    updSection(sId, { images: imgs })
    await supabase.from('rfp_sections').update({ images: imgs }).eq('id', sId)
  }

  const saveAndLearn = async () => {
    await supabase.from('rfp_responses').update({ status: 'complete' }).eq('id', wip.id)
    setWip(p => ({ ...p, status: 'complete' }))
    // Learn: push answered sections to knowledge base
    const newEntries = wip.sections
      .filter(s => s.answer?.replace(/<[^>]+>/g, '').trim().length > 60)
      .map(s => ({
        question: s.question, answer: s.answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        category: s.category || 'Other', source_rfp: wip.hospital,
      }))
    if (newEntries.length) {
      await supabase.from('knowledge_base').insert(newEntries)
      toast(`Saved! Added ${newEntries.length} entries to shared knowledge base.`)
    } else {
      toast('RFP saved as complete!')
    }
    await loadPastRFPs()
    setPg('past')
  }

  const handleExport = () => exportPPTX(wip, cfg, toast)

  return (
    <div className="flex" style={{ height: 'calc(100vh - 49px)' }}>
      {/* Section sidebar */}
      <div className="w-56 border-r border-slate-100 bg-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-50">
          <div className="font-semibold text-sm text-slate-700 truncate">{wip.hospital || wip.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{answered} of {wip.sections.length} answered</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${wip.sections.length ? answered / wip.sections.length * 100 : 0}%`, background: A }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {wip.sections.map(s => {
            const done = s.answer?.replace(/<[^>]+>/g, '').trim().length > 30
            return (
              <button key={s.id} onClick={() => setSel(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all ${sel === s.id ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                style={sel === s.id ? { background: P } : {}}>
                <div className="font-medium text-sm leading-snug line-clamp-2">{s.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {done && <span className="text-xs font-bold" style={{ color: sel === s.id ? A : '#16a34a' }}>✓</span>}
                  {s.images?.length > 0 && <span className="text-xs" style={{ color: sel === s.id ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>📷</span>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="p-3 border-t border-slate-50 space-y-2">
          <button onClick={aiDraftAll} disabled={!!busy}
            className="w-full text-white text-xs py-2 rounded-xl disabled:opacity-50 font-semibold"
            style={{ background: A }}>
            {busy ? <span className="spin">⟳</span> : '✨'} Auto-Draft All
          </button>
          <button onClick={handleExport}
            className="w-full text-white text-xs py-2 rounded-xl font-semibold"
            style={{ background: P }}>
            📊 Export PPTX
          </button>
          <button onClick={saveAndLearn}
            className="w-full border border-slate-200 text-xs py-2 rounded-xl text-slate-500 hover:bg-slate-50 font-medium">
            💾 Save & Learn
          </button>
        </div>
      </div>

      {/* Editor main */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {busy && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-2xl px-6 py-3 shadow-xl flex items-center gap-3 z-30 slideUp">
            <span className="spin text-lg" style={{ color: P }}>⟳</span>
            <span className="text-sm text-slate-600">{busy}</span>
          </div>
        )}
        {curSec ? (
          <div className="max-w-2xl mx-auto p-6 fadeIn">
            {/* Section header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-1">
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 uppercase tracking-wide"
                  style={{ background: `${P}18`, color: P }}>{curSec.category}</span>
                <h3 className="text-xl font-bold text-slate-800 serif">{curSec.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{curSec.question}</p>
              </div>
              <button onClick={() => aiDraft(sel)} disabled={!!busy}
                className="flex-shrink-0 text-white text-xs px-4 py-2.5 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: P }}>
                {busy ? <span className="spin">⟳</span> : '✨'} AI Draft
              </button>
            </div>

            {/* WYSIWYG Editor */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
              <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs text-slate-400 mr-2 font-medium">Format</span>
                {[['bold','B','font-bold'],['italic','I','italic'],['underline','U','underline']].map(([cmd,lbl,cls]) => (
                  <button key={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd) }}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg hover:bg-slate-200 text-slate-600 font-medium ${cls}`}>{lbl}</button>
                ))}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                {[['insertUnorderedList','• List'],['insertOrderedList','1. List']].map(([cmd,lbl]) => (
                  <button key={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd) }}
                    className="px-2 h-7 flex items-center text-xs rounded-lg hover:bg-slate-200 text-slate-600">{lbl}</button>
                ))}
              </div>
              <div key={sel} ref={edRef} contentEditable suppressContentEditableWarning
                data-placeholder="Start typing, or click AI Draft above…"
                onInput={e => {
                  const html = e.currentTarget.innerHTML
                  updSection(sel, { answer: html })
                  saveSection(sel, html)
                }}
                dangerouslySetInnerHTML={{ __html: curSec.answer || '' }}
                className="prose p-5 min-h-44 text-sm text-slate-700 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Slide Images</h4>
                  <p className="text-xs text-slate-400 mt-0.5">First image appears on the right side of this slide in the exported PPTX</p>
                </div>
                <label className="cursor-pointer text-xs px-3 py-1.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors font-medium">
                  + Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files[0]; if (!f) return
                    uploadImage(sel, f); e.target.value = ''
                  }} />
                </label>
              </div>
              {curSec.images?.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {curSec.images.map(img => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-100">
                      <img src={img.url} alt={img.name} className="w-full h-20 object-cover" />
                      <button onClick={() => removeImage(sel, img.id)}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold">×</button>
                      <div className="px-2 py-1 text-xs text-slate-400 truncate bg-slate-50">{img.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <label className="cursor-pointer block border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-300 text-sm hover:border-blue-300 hover:text-blue-300 transition-colors">
                  📷 Upload a rendering, photo, or project graphic
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files[0]; if (!f) return
                    uploadImage(sel, f); e.target.value = ''
                  }} />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-300 mt-24 text-sm">← Select a section to begin editing</div>
        )}
      </div>
    </div>
  )
}
