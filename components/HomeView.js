'use client'

export default function HomeView({ cfg, kb, past, setPg, openRFP }) {
  const P = cfg?.primary_color || '#0f2744'
  const A = cfg?.accent || '#c49a2a'
  const complete = past.filter(r => r.status === 'complete').length
  const drafts = past.filter(r => r.status === 'draft').length
  const recent = past.slice(0, 5)

  return (
    <div className="p-8 max-w-5xl mx-auto fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1 serif">{cfg?.company}</h1>
        <p className="text-slate-400">{cfg?.tagline}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Knowledge Base Entries', value: kb.length, icon: '📚', note: 'Q&A pairs the AI draws from' },
          { label: 'Completed Responses', value: complete, icon: '✅', note: 'Saved & exported RFPs' },
          { label: 'Drafts In Progress', value: drafts, icon: '✏️', note: 'Unfinished RFPs' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="text-4xl font-bold mb-1 serif" style={{ color: P }}>{s.value}</div>
            <div className="text-slate-600 text-sm font-medium">{s.label}</div>
            <div className="text-slate-300 text-xs mt-1">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <button onClick={() => setPg('new')}
          className="p-6 bg-white rounded-2xl border-2 text-left hover:shadow-lg transition-all group"
          style={{ borderColor: P }}>
          <div className="text-2xl mb-3">📄</div>
          <div className="font-bold text-lg mb-1 serif" style={{ color: P }}>New RFP Response</div>
          <div className="text-slate-400 text-sm">Paste an RFP — AI parses all sections and auto-drafts answers from your shared knowledge base</div>
          <div className="mt-3 text-sm font-medium group-hover:underline" style={{ color: P }}>Get started →</div>
        </button>
        <button onClick={() => setPg('kb')}
          className="p-6 bg-white rounded-2xl border-2 border-slate-200 text-left hover:shadow-lg hover:border-slate-300 transition-all group">
          <div className="text-2xl mb-3">📥</div>
          <div className="font-bold text-lg mb-1 serif text-slate-700">Manage Knowledge Base</div>
          <div className="text-slate-400 text-sm">Add entries manually or import old RFP responses — the AI learns from everything</div>
          <div className="mt-3 text-sm font-medium text-slate-400 group-hover:text-slate-600">Build your library →</div>
        </button>
      </div>

      {/* Recent RFPs */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">Recent RFPs</h2>
            <button onClick={() => setPg('past')} className="text-xs text-blue-500 hover:underline">View all</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {recent.map((r, i) => (
              <div key={r.id} onClick={() => openRFP(r)}
                className={`flex items-center px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${i < recent.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mr-4 text-white text-sm font-bold flex-shrink-0"
                  style={{ background: P }}>{r.hospital?.charAt(0) || '?'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm truncate">{r.hospital || r.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString()} · {r.sections?.length || 0} sections
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length === 0 && kb.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h3 className="font-semibold text-slate-600 text-lg serif mb-2">Welcome to RFP Studio</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">Start by importing your past RFP responses to build up your knowledge base, then create your first AI-powered response.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setPg('kb')} style={{ background: P }} className="text-white text-sm px-5 py-2.5 rounded-xl font-semibold">Import Past Responses</button>
            <button onClick={() => setPg('new')} className="border border-slate-200 text-slate-600 text-sm px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-50">Start New RFP</button>
          </div>
        </div>
      )}
    </div>
  )
}
