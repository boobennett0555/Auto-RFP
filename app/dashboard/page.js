'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import Nav from '../../components/Nav'
import HomeView from '../../components/HomeView'
import NewRFPView from '../../components/NewRFPView'
import EditorView from '../../components/EditorView'
import KnowledgeBaseView from '../../components/KnowledgeBaseView'
import PastRFPsView from '../../components/PastRFPsView'
import SettingsView from '../../components/SettingsView'

export const dynamic = 'force-dynamic'

const DEF_CFG = {
  company: 'Your Company Name',
  tagline: 'Healthcare Real Estate Specialists',
  primary_color: '#0f2744',
  accent: '#c49a2a',
  email: '', phone: '', website: '',
}

function DashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pg = searchParams.get('page') || 'home'

  const [ready, setReady] = useState(false)
  const [cfg, setCfg] = useState(DEF_CFG)
  const [kb, setKb] = useState([])
  const [past, setPast] = useState([])
  const [wip, setWip] = useState(null)
  const [notif, setNotif] = useState(null)
  const supabase = createClient()

  const setPg = useCallback((page) => {
    router.push(`/dashboard?page=${page}`)
  }, [router])

  useEffect(() => {
    setReady(true)
    loadSettings()
    loadKB()
    loadPastRFPs()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('company_settings').select('*').single()
    if (data) setCfg({ ...DEF_CFG, ...data })
  }

  const loadKB = async () => {
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false })
    if (data) setKb(data)
  }

  const loadPastRFPs = async () => {
    const { data } = await supabase.from('rfp_responses').select(`*, rfp_sections(*)`).order('created_at', { ascending: false })
    if (data) setPast(data.map(r => ({ ...r, sections: r.rfp_sections || [] })))
  }

  const toast = (msg, err) => {
    setNotif({ msg, err })
    setTimeout(() => setNotif(null), 3500)
  }

  const signOut = () => router.push('/')

  const openRFP = (rfp) => {
    setWip(rfp)
    router.push('/dashboard?page=editor')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f2744' }}>
        <div className="text-white text-sm opacity-60">Loading...</div>
      </div>
    )
  }

  const sharedProps = { cfg, setCfg, kb, setKb, past, setPast, wip, setWip, toast, supabase, user: { email: 'team' }, openRFP, loadKB, loadPastRFPs, loadSettings }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Nav pg={pg} setPg={setPg} cfg={cfg} wip={wip} signOut={signOut} />
      <div className="flex-1 overflow-auto">
        {pg === 'home'     && <HomeView     {...sharedProps} setPg={setPg} />}
        {pg === 'new'      && <NewRFPView   {...sharedProps} setPg={setPg} />}
        {pg === 'editor'   && <EditorView   {...sharedProps} setPg={setPg} />}
        {pg === 'kb'       && <KnowledgeBaseView {...sharedProps} />}
        {pg === 'past'     && <PastRFPsView {...sharedProps} />}
        {pg === 'settings' && <SettingsView {...sharedProps} />}
      </div>
      {notif && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl z-50 flex items-center gap-2 ${notif.err ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {notif.err ? '⚠️' : '✓'} {notif.msg}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f2744' }}>
        <div className="text-white text-sm opacity-60">Loading...</div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  )
}
