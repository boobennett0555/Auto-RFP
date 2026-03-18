'use client'
import { useState } from 'react'

const CATEGORIES = [
  'Company Overview', 'Experience & Portfolio', 'Team & Leadership',
  'Project Approach', 'Financial Capability', 'Timeline & Phasing',
  'References & Case Studies', 'Technical Specifications',
  'Community Impact', 'Legal & Compliance', 'Other'
]

export default function KnowledgeBaseView({ kb, setKb, supabase, toast }) {
  const [view, setView] = useState('list') // list | import | add | upload
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [loading, setLoading] = useState(false)

  // Import from paste
  const [rfpText, setRfpText] = useState('')
  const [responseText, setResponseText] = useState('')

  // Manual add
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [newCat, setNewCat] = useState('Company Overview')

  // File upload
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadType, setUploadType] = useState('response') // 'rfp' | 'response' | 'combined'
  const [dragOver, setDragOver] = useState(false)

  const filtered = kb.filter(e => {
    const matchSearch = !search || e.question.toLowerCase().includes(search.toLowerCase()) || e.answer.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || e.category === filterCat
    return matchSearch && matchCat
  })

  const saveEntries = async (entries) => {
    let saved = 0
    for (const entry of entries) {
      const { error } = await supabase.from('knowledge_base').insert(entry)
      if (!error) saved++
    }
    const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false })
    if (data) setKb(data)
    return saved
  }

  const handleImportPaste = async () => {
    if (!rfpText.trim() || !responseText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are extracting knowledge base entries from an RFP response.

ORIGINAL RFP TEXT:
${rfpText}

PAST RESPONSE:
${responseText}

Extract matched question/answer pairs. For each RFP question that was answered, create a knowledge base entry.
Return ONLY a JSON array like this:
[{"question": "...", "answer": "...", "category": "Company Overview"}]

Categories must be one of: ${CATEGORIES.join(', ')}
Return only the JSON array, no other text.`
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const entries = JSON.parse(clean)
      const saved = await saveEntries(entries.map(e => ({ ...e, source_rfp: 'Imported' })))
      toast(`Imported ${saved} entries to Knowledge Base!`)
      setView('list')
      setRfpText('')
      setResponseText('')
    } catch (e) {
      toast('Failed to extract entries. Please try again.', true)
    }
    setLoading(false)
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return
    setLoading(true)
    try {
      // Read file as base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(uploadFile)
      })

      const isPDF = uploadFile.type === 'application/pdf'
      const fileName = uploadFile.name

      let prompt = ''
      if (uploadType === 'combined') {
        prompt = `This document contains both RFP questions and our responses. Extract all question/answer pairs as knowledge base entries. Return ONLY a JSON array: [{"question": "...", "answer": "...", "category": "..."}]. Categories: ${CATEGORIES.join(', ')}`
      } else if (uploadType === 'response') {
        prompt = `This is our past RFP response document. Extract all the key questions/topics addressed and our answers as knowledge base entries. Return ONLY a JSON array: [{"question": "...", "answer": "...", "category": "..."}]. Categories: ${CATEGORIES.join(', ')}`
      } else {
        prompt = `This is an RFP document with questions. Extract all the questions/requirements as knowledge base entries with placeholder answers. Return ONLY a JSON array: [{"question": "...", "answer": "To be answered", "category": "..."}]. Categories: ${CATEGORIES.join(', ')}`
      }

      const requestBody = isPDF ? {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: prompt }
          ]
        }]
      } : {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `I have a file called "${fileName}" but it's not a PDF so I can't read it directly. Please tell me to upload a PDF version instead. Return this JSON: [{"question": "File format not supported", "answer": "Please convert your file to PDF and try again.", "category": "Other"}]`
        }]
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const entries = JSON.parse(clean)

      if (entries[0]?.question === 'File format not supported') {
        toast('Please upload a PDF file. Convert your PPTX/Word doc to PDF first.', true)
        setLoading(false)
        return
      }

      const saved = await saveEntries(entries.map(e => ({ ...e, source_rfp: fileName })))
      toast(`Extracted ${saved} entries from ${fileName}!`)
      setView('list')
      setUploadFile(null)
    } catch (e) {
      toast('Failed to process file. Make sure it is a valid PDF.', true)
    }
    setLoading(false)
  }

  const handleAddManual = async () => {
    if (!newQ.trim() || !newA.trim()) return
    setLoading(true)
    const { error } = await supabase.from('knowledge_base').insert({
      question: newQ, answer: newA, category: newCat, source_rfp: 'Manual'
    })
    if (!error) {
      const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false })
      if (data) setKb(data)
      toast('Entry added!')
      setNewQ(''); setNewA(''); setView('list')
    } else {
      toast('Failed to save entry.', true)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('knowledge_base').delete().eq('id', id)
    setKb(kb.filter(e => e.id !== id))
    toast('Entry deleted.')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
          <p className="text-slate-500 text-sm mt-1">{kb.length} shared entries · AI reads these for every new RFP</p>
        </div>
        {view === 'list' && (
          <div className="flex gap-2">
            <button onClick={() => setView('upload')}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
              📎 Upload PDF
            </button>
            <button onClick={() => setView('import')}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
              📥 Import from Past RFP
            </button>
            <button onClick={() => setView('add')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: '#0f2744' }}>
              + Add Entry
            </button>
          </div>
        )}
      </div>

      {/* Upload PDF View */}
      {view === 'upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-1">Upload Document</h2>
          <p className="text-slate-500 text-sm mb-6">Upload a PDF of a past RFP or response — AI will extract knowledge base entries automatically.</p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Document Type</label>
            <div className="flex gap-3">
              {[
                { val: 'response', label: '📄 Our Past Response', desc: 'A document containing our written answers' },
                { val: 'combined', label: '📋 RFP + Response', desc: 'Both questions and our answers in one doc' },
                { val: 'rfp', label: '❓ RFP Questions Only', desc: 'Just the original RFP questions' },
              ].map(opt => (
                <button key={opt.val} onClick={() => setUploadType(opt.val)}
                  className={`flex-1 p-3 rounded-xl border text-left text-sm transition-all ${uploadType === opt.val ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-medium text-slate-800">{opt.label}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f) }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            onClick={() => document.getElementById('kb-file-input').click()}
          >
            <input id="kb-file-input" type="file" accept=".pdf" className="hidden"
              onChange={e => setUploadFile(e.target.files[0])} />
            {uploadFile ? (
              <div>
                <div className="text-4xl mb-3">📄</div>
                <div className="font-medium text-slate-800">{uploadFile.name}</div>
                <div className="text-slate-500 text-sm mt-1">{(uploadFile.size / 1024).toFixed(0)} KB · Click to change</div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-3">📎</div>
                <div className="font-medium text-slate-700">Drop your PDF here or click to browse</div>
                <div className="text-slate-400 text-sm mt-1">PDF files only · Max 10MB</div>
                <div className="text-slate-400 text-xs mt-2">💡 Have a PPTX or Word doc? Export it as PDF first (File → Save As → PDF)</div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleFileUpload} disabled={!uploadFile || loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
              style={{ background: '#0f2744' }}>
              {loading ? '⟳ Processing...' : '✨ Extract & Import'}
            </button>
            <button onClick={() => { setView('list'); setUploadFile(null) }}
              className="px-6 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import from Paste View */}
      {view === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-1">Import from Past RFP Response</h2>
          <p className="text-slate-500 text-sm mb-6">Paste an old RFP and your written response — AI extracts matched Q&A pairs automatically.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Original RFP Text</label>
              <textarea value={rfpText} onChange={e => setRfpText(e.target.value)}
                placeholder="Paste RFP questions or document..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-64 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Your Past Response</label>
              <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
                placeholder="Paste your previous written response..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-64 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleImportPaste} disabled={!rfpText.trim() || !responseText.trim() || loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
              style={{ background: '#0f2744' }}>
              {loading ? '⟳ Extracting...' : '✨ Extract & Import'}
            </button>
            <button onClick={() => setView('list')}
              className="px-6 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Manual Add View */}
      {view === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-4">New Knowledge Base Entry</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Question / Prompt Type</label>
              <textarea value={newQ} onChange={e => setNewQ(e.target.value)}
                placeholder="e.g. Describe your experience with medical office building development"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Your Company's Answer</label>
              <textarea value={newA} onChange={e => setNewA(e.target.value)}
                placeholder="Enter the answer you typically give to this type of question..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAddManual} disabled={!newQ.trim() || !newA.trim() || loading}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
              style={{ background: '#0f2744' }}>
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
            <button onClick={() => setView('list')}
              className="px-6 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          <div className="flex gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="flex gap-2 flex-wrap mb-6">
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCat === cat ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={filterCat === cat ? { background: '#0f2744' } : {}}>
                {cat} {cat === 'All' ? `(${kb.length})` : ''}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="font-semibold text-slate-700 mb-2">No entries yet</h3>
              <p className="text-slate-400 text-sm mb-6">Upload a PDF or import from a past RFP response to get started</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setView('upload')}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#0f2744' }}>
                  📎 Upload PDF
                </button>
                <button onClick={() => setView('import')}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50">
                  📥 Import from Paste
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{entry.category}</span>
                        {entry.source_rfp && <span className="text-xs text-slate-400">{entry.source_rfp}</span>}
                      </div>
                      <p className="font-medium text-slate-800 text-sm mb-1">{entry.question}</p>
                      <p className="text-slate-500 text-sm line-clamp-2">{entry.answer}</p>
                    </div>
                    <button onClick={() => handleDelete(entry.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors text-lg flex-shrink-0">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
