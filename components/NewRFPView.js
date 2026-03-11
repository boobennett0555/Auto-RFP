'use client'
import { useState } from 'react'
import { callClaude, uid, CATEGORIES } from '@/lib/claude'

export default function NewRFPView({ cfg, kb, setWip, setPg, supabase, toast }) {
  const [rawRFP, setRawRFP] = useState('')
  const [meta, setMeta] = useState({ hospital: '', title: '', due_date: '' })
  const [busy, setBusy] = useState(false)
  const P = cfg?.primary_color || '#0f2744'

  const parseRFP = async () => {
    if (!rawRFP.trim() || !meta.hospital) return
    setBusy(true)
    try {
      const txt = await callClaude([{
        role: 'user',
        content: `Extract every section or question requiring a response from this RFP. Return ONLY valid JSON, no markdown:
{"sections":[{"title":"Short descriptive title","question":"Full question or requirement text","category":"one of: ${CATEGORIES.join(', ')}"}]}

RFP TEXT:
${rawRFP.slice(0, 6000)}`,
      }])
      const { sections } = JSON.parse(txt.replace(/```json|```/g, '').trim())

      // Save RFP to Supabase
      const { data: rfpRow, error: rfpErr } = await supabase
        .from('rfp_responses')
        .insert({ hospital: meta.hospital, title: meta.title, due_date: meta.due_date || null, status: 'draft', raw_rfp: rawRFP.slice(0, 10000) })
        .select().single()

      if (rfpErr) throw rfpErr

      // Save sections
      const sectionsToInsert = sections.map((s, i) => ({
        rfp_id: rfpRow.id, title: s.title, question: s.question, category: s.category, answer: '', sort_order: i,
      }))
      const { data: sectionRows, error: secErr } = await supabase
        .from('rfp_sections').insert(sectionsToInsert).select()
      if (secErr) throw secErr

      const newRFP = { ...rfpRow, sections: sectionRows }
      setWip(newRFP)
      setPg('editor')
      toast(`RFP parsed — ${sections.length} sections found!`)
    } catch (e) {
      console.error(e)
      toast('Could not parse RFP — try pasting cleaner text.', true)
    }
    setBusy(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-1 serif">New RFP Response</h2>
      <p className="text-slate-400 text-sm mb-6">
        Paste the RFP text — the AI will identify all sections and begin drafting answers using your {kb.length}-entry shared knowledge base.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Hospital / Client *</label>
            <input value={meta.hospital} onChange={e => setMeta(p => ({ ...p, hospital: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Memorial Health System" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Project Title</label>
            <input value={meta.title} onChange={e => setMeta(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="MOB Development RFP 2025" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Due Date</label>
          <input type="date" value={meta.due_date} onChange={e => setMeta(p => ({ ...p, due_date: e.target.value }))}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Paste Full RFP Text *</label>
          <textarea value={rawRFP} onChange={e => setRawRFP(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-3 text-xs font-mono h-64 resize-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Paste the complete RFP text here. The AI will parse all questions and requirements, then auto-draft responses using your shared knowledge base..." />
        </div>
        <div className="flex items-center gap-4 pt-1">
          <button onClick={parseRFP} disabled={busy || !rawRFP.trim() || !meta.hospital}
            style={{ background: P }} className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center gap-2">
            {busy ? <><span className="spin">⟳</span> Analyzing…</> : '🔍 Parse RFP Sections'}
          </button>
          {kb.length > 0 && <div className="text-xs text-slate-400">Will use {kb.length} KB entries for AI drafting</div>}
        </div>
      </div>
    </div>
  )
}
