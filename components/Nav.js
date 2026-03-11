'use client'

export default function Nav({ pg, setPg, cfg, wip, signOut }) {
  const P = cfg?.primary_color || '#0f2744'
  const A = cfg?.accent || '#c49a2a'
  const answered = wip?.sections?.filter(s => s.answer?.replace(/<[^>]+>/g, '').trim().length > 30).length || 0
  const total = wip?.sections?.length || 0

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'new', label: 'New RFP' },
    ...(wip ? [{ id: 'editor', label: 'Editor' }] : []),
    { id: 'kb', label: 'Knowledge Base' },
    { id: 'past', label: 'Past RFPs' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <nav className="flex items-center gap-1 px-5 py-2 bg-white border-b border-slate-100 shadow-sm flex-shrink-0 z-10">
      <div className="flex items-center gap-2 mr-6">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold serif" style={{ background: P }}>R</div>
        <span className="font-semibold text-gray-800 text-sm serif tracking-tight">RFP Studio</span>
      </div>

      {navItems.map(n => (
        <button key={n.id} onClick={() => setPg(n.id)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${pg === n.id ? 'text-white font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          style={pg === n.id ? { background: P } : {}}>
          {n.label}
        </button>
      ))}

      {wip && pg === 'editor' && (
        <div className="ml-3 flex items-center gap-2">
          <div className="text-xs text-slate-400">|</div>
          <div className="text-xs text-slate-600 font-medium max-w-36 truncate">{wip.hospital || wip.title}</div>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${total ? answered / total * 100 : 0}%`, background: A }} />
          </div>
          <div className="text-xs text-slate-400">{answered}/{total}</div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-300 font-medium hidden md:block">{cfg?.company}</span>
        <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
          Sign out
        </button>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: A }}>
          {cfg?.company?.charAt(0) || '?'}
        </div>
      </div>
    </nav>
  )
}
