'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import HomeView from '@/components/HomeView'
import NewRFPView from '@/components/NewRFPView'
import EditorView from '@/components/EditorView'
import KnowledgeBaseView from '@/components/KnowledgeBaseView'
import PastRFPsView from '@/components/PastRFPsView'
import SettingsView from '@/components/SettingsView'

const DEF_CFG = {
  company: 'Your Company Name',
  tagline: 'Healthcare Real Estate Specialists',
  primary_color: '#0f2744',
  accent: '#c49a2a',
  email: '', phone: '', website: '',
}

export default function Dashboard() {
  const [pg, setPg] = useState('home')
  const [user, setUser] = useState(null)
  const [cfg, setCfg] = useState(DEF_CFG)
  const [kb, setKb] = useState([])
  const [past, setPast] = useState([])
  const [wip, setWip] = useState(null)
  const [notif, setNotif] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { bootstrap() }, [])

  const bootstrap = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUser(user)
    await Promise.all([loadSettings(), loadKB(), loadPastRFPs()])
  }

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

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const openRFP = (rfp) => {
    setWip(rfp)
    setPg('editor')
  }

  const sharedProps = { cfg, setCfg, kb, setKb, past, setPast, wip, setWip, toast, supabase, user, openRFP, loadKB, loadPastRFPs, loadSettings }

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

      {/* Toast */}
      {notif && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl z-50 slideUp flex items-center gap-2 ${notif.err ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {notif.err ? '⚠️' : '✓'} {notif.msg}
        </div>
      )}
    </div>
  )
}
