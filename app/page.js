'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #0f2744 100%)' }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-2xl" style={{ background: '#c49a2a' }}>
            <span className="text-white text-2xl font-bold serif">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white serif mb-2">RFP Studio</h1>
          <p className="text-slate-400 text-sm">Healthcare Real Estate · AI-Powered Responses</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <h2 className="font-semibold text-slate-800 text-lg mb-1 serif">Sign in to your team</h2>
              <p className="text-slate-400 text-sm mb-6">Enter your work email — we'll send a magic link. No password needed.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Work Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com" required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50" />
                </div>
                {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading || !email}
                  className="w-full text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: '#0f2744' }}>
                  {loading ? <>⟳ Sending…</> : 'Send Magic Link →'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="font-semibold text-slate-800 text-lg mb-2 serif">Check your email</h2>
              <p className="text-slate-400 text-sm mb-4">We sent a sign-in link to <strong className="text-slate-700">{email}</strong>. Click it to access RFP Studio.</p>
              <button onClick={() => setSent(false)} className="text-sm text-blue-500 hover:underline">Use a different email</button>
            </div>
          )}
        </div>
        <p className="text-center text-slate-600 text-xs mt-6 opacity-60">© {new Date().getFullYear()} RFP Studio · Internal team tool</p>
      </div>
    </div>
  )
}
