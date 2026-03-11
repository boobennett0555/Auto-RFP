'use client'
import { useState, useEffect } from 'react'

export default function SettingsView({ cfg, setCfg, supabase, toast, loadSettings }) {
  const [local, setLocal] = useState(cfg)
  useEffect(() => setLocal(cfg), [cfg])

  const save = async () => {
    const { error } = await supabase.from('company_settings').upsert({ id: 1, ...local })
    if (error) { toast('Failed to save settings.', true); return }
    setCfg(local)
    await loadSettings()
    toast('Settings saved for the whole team!')
  }

  return (
    <div className="p-8 max-w-lg mx-auto fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-1 serif">Settings & Branding</h2>
      <p className="text-slate-400 text-sm mb-6">These settings are shared with your whole team and used in all exported presentations</p>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
        {[
          ['company', 'Company Name'],
          ['tagline', 'Tagline / Specialty'],
          ['email', 'Contact Email'],
          ['phone', 'Phone'],
          ['website', 'Website'],
        ].map(([k, lb]) => (
          <div key={k}>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">{lb}</label>
            <input value={local[k] || ''} onChange={e => setLocal(p => ({ ...p, [k]: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          {[['primary_color', 'Primary Color'], ['accent', 'Accent Color']].map(([k, lb]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">{lb}</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={local[k] || '#000000'} onChange={e => setLocal(p => ({ ...p, [k]: e.target.value }))}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200" />
                <input value={local[k] || ''} onChange={e => setLocal(p => ({ ...p, [k]: e.target.value }))}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-xl overflow-hidden border border-slate-100 mt-2">
          <div style={{ background: local.primary_color }} className="p-4">
            <div className="text-white font-bold text-base serif">{local.company || 'Company Name'}</div>
            <div className="text-xs mt-1 font-medium" style={{ color: local.accent }}>{local.tagline || 'Tagline'}</div>
          </div>
          <div style={{ background: local.accent }} className="px-4 py-2">
            <div className="text-white text-xs opacity-90">Accent bar</div>
          </div>
          <div className="p-3 bg-gray-50 text-xs text-gray-400 text-center">← PPTX header preview</div>
        </div>

        <button onClick={save} style={{ background: local.primary_color }}
          className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-2 w-full">
          Save Settings for Team
        </button>
      </div>
    </div>
  )
}
