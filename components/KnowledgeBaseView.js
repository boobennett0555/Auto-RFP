'use client'
import { useState } from 'react'
import { callClaude, uid, CATEGORIES } from '@/lib/claude'

export default function KnowledgeBaseView({ cfg, kb, setKb, supabase, toast }) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [newEntry, setNewEntry] = useState({ question: '', answer: '', category: 'Company Overview' })
  const [rfpTxt, setRfpTxt] = useState('')
  const [resTxt, setResTxt] = useState('')
  const [busy, setBusy] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const P = cfg?.primary_color || '#0f2744'

  const filtered = kb.filter(e => {
    const matchCat = filterCat === 'All' || e.category === filterCat
    const matchSearch = !search || e.question?.toLowerCase().includes(search.toLowerCase()) ||
      e.answer?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addEntry = async () => {
    if (!newEntry.question || !newEntry.answer) return
    const { data, error } = await supabase.from('knowledge_base').insert(newEntry).select().single()
    if (error) { toast('Failed to add entry.', true); return }
    setKb(p => [data, ...p])
    setNewEntry({ question: '', answer: '', category: 'Company Overview' })
    setShowAdd(false)
    toast('Entry added to shared knowledge base!')
  }

  const deleteEntry = async (id) => {
    await supabase.from('knowledge_base').delete().eq('id', id)
    setKb(p => p.filter(e => e.id !== id))
    toast('Entry removed.')
  }

  const importBatch = async () => {
    if (!rfpTxt || !resTxt) return
    setBusy(true)
    try {
      const txt = await callClaude([{
        role: 'user',
        content: `Extract matched question/answer pairs from this RFP and its response. Return ONLY valid JSON:
{"pairs":[{"question":"full question text","answer":"matching answer text","category":"one of: ${CATEGORIES.join('|')}"}]}

RFP:
${rfpTxt.slice(0, 3000)}

RESPONSE:
${resTxt.slice(0, 3000)}`,
      }])
      const { pairs } = JSON.parse(txt.replace(/```json|```/g, '').trim())
      const { data, error } = await supabase.from('knowledge_base').insert(pairs).select()
      if (error) throw error
      setKb(p => [...data, ...p])
      setRfpTxt(''); setResTxt(''); setShowImport(false)
      toast(`Imported ${data.length} entries into shared knowledge base!`)
    } catch (e) { toast('Import failed — try cleaner text.', true) }
    setBusy(false)
  }

  const cats = ['All', ...CATEGORIES]

  return (
    <div className="p-8 max-w-5xl mx-auto fadeIn">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 serif">Knowledge Base</h2>
          <p className="text-slate-400 text-sm mt-0.5">{kb.length} shared entries · AI reads these for every new RFP</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(!showImport)} className="text-sm px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
            📥 Import from Past RFP
          </button>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: P }} className="text-sm px-4 py-2 rounded-xl text-white font-semibold">
            + Add Entry
          </button>
        </div>
      </div>

      {/* Add entry form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 shadow-sm fadeIn">
          <h3 className="font-semibold text-slate-700 mb-4 serif">New Knowledge Base Entry</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Category</label>
              <select value={newEntry.category} onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Question / Prompt Type</label>
              <textarea value={newEntry.question} onChange={e => setNewEntry(p => ({ ...p, question: e.target.value }))}
                placeholder="e.g. Describe your experience with medical office building development"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm h-16 resize-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Your Company's Answer</label>
              <textarea value={newEntry.answer} onChange={e => setNewEntry(p => ({ ...p, answer: e.target.value }))}
                placeholder="Enter the answer you typically give to this type of question..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm h-28 resize-none bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div className="flex gap-3">
              <button onClick={addEntry} disabled={!newEntry.question || !newEntry.answer}
                style={{ background: P }} className="text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-40">
                Save Entry
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import form */}
      {showImport && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 shadow-sm fadeIn">
          <h3 className="font-semibold text-slate-700 mb-1 serif">Import from Past RFP Response</h3>
          <p className="text-slate-400 text-sm mb-4">Paste an old RFP and your written response — AI extracts matched Q&A pairs automatically.</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Original RFP Text</label>
              <textarea value={rfpTxt} onChange={e => setRfpTxt(e.target.value)}
                placeholder="Paste RFP questions or document..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs h-48 resize-none bg-slate-50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Your Past Response</label>
              <textarea value={resTxt} onChange={e => setResTxt(e.target.value)}
                placeholder="Paste your previous written response..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs h-48 resize-none bg-slate-50 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={importBatch} disabled={busy || !rfpTxt || !resTxt}
              style={{ background: P }} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center gap-2">
              {busy ? <><span className="spin">⟳</span> Extracting…</> : '✨ Extract & Import'}
            </button>
            <button onClick={() => setShowImport(false)} className="px-5 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
          className="flex-1 min-w-48 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />
        <div className="flex gap-1 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterCat === c ? 'text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              style={filterCat === c ? { background: P } : {}}>
              {c === 'All' ? `All (${kb.length})` : c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📚</div>
            <div className="font-medium text-slate-500">{kb.length === 0 ? 'No entries yet' : 'No matches'}</div>
            <div className="text-sm text-slate-300 mt-1">{kb.length === 0 ? 'Add entries manually or import from a past RFP response above' : 'Try different search terms'}</div>
          </div>
        ) : filtered.map((e, i) => (
          <div key={e.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${P}12`, color: P }}>{e.category || 'General'}</span>
                {e.source_rfp && <span className="text-xs text-slate-300">from {e.source_rfp}</span>}
              </div>
              <div className="font-medium text-sm text-slate-800 mb-1">{e.question}</div>
              <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{e.answer}</div>
            </div>
            <button onClick={() => deleteEntry(e.id)} className="text-slate-200 hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors mt-0.5">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
