'use client'
import { useState } from 'react'

export default function PastRFPsView({ cfg, past, openRFP, supabase, toast, loadPastRFPs }) {
  const [search, setSearch] = useState('')
  const P = cfg?.primary_color || '#0f2744'

  const filtered = past.filter(r =>
    !search || r.hospital?.toLowerCase().includes(search.toLowerCase()) ||
    r.title?.toLowerCase().includes(search.toLowerCase())
  )

  const deleteRFP = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this RFP response? This cannot be undone.')) return
    await supabase.from('rfp_responses').delete().eq('id', id)
    await loadPastRFPs()
    toast('RFP deleted.')
  }

  return (
    <div className="p-8 max-w-3xl mx-auto fadeIn">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 serif">Past RFP Responses</h2>
          <p className="text-slate-400 text-sm mt-0.5">{past.length} responses — team-shared</p>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by hospital or project…"
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="text-4xl mb-3">📁</div>
          <div className="font-medium text-slate-500">{past.length === 0 ? 'No saved RFPs yet' : 'No matches'}</div>
          <div className="text-sm text-slate-300 mt-1">{past.length === 0 ? 'Complete and save an RFP response to see it here' : 'Try a different search'}</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {filtered.map((r, i) => (
            <div key={r.id} onClick={() => openRFP(r)}
              className={`flex items-center px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 flex-shrink-0"
                style={{ background: P }}>{r.hospital?.charAt(0) || '?'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm">{r.hospital || r.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {r.title && r.hospital ? ` · ${r.title}` : ''} · {r.sections?.length || 0} sections
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {r.status}
                </span>
                <button onClick={(e) => deleteRFP(r.id, e)}
                  className="text-slate-200 hover:text-red-400 text-lg opacity-0 group-hover:opacity-100 transition-all ml-1">×</button>
                <span className="text-sm font-medium" style={{ color: P }}>Open →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
