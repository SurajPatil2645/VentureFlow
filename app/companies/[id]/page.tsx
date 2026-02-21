'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { ToastContainer, useToast, showToast } from '@/components/Toast'
import { mockCompanies } from '@/lib/mockData'
import { storage } from '@/lib/storage'
import { Company, Note, EnrichmentData } from '@/types'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Globe,
  Tag,
  Sparkles,
  Plus,
  Save,
  TrendingUp,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Download,
  MoreVertical
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function CompanyProfilePage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string
  
  const [company, setCompany] = useState<Company | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null)
  const [enrichError, setEnrichError] = useState<string | null>(null)
  const [lists, setLists] = useState(storage.getLists())
  const [selectedListId, setSelectedListId] = useState('')
  const [showAddToList, setShowAddToList] = useState(false)
  const [notesHotkeyHint, setNotesHotkeyHint] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    const found = mockCompanies.find(c => c.id === companyId)
    if (found) {
      setCompany(found)
      const savedNotes = storage.getCompanyNotes(companyId)
      setNotes(savedNotes)
      const cached = storage.getCompanyEnrichment(companyId)
      if (cached) setEnrichmentData(cached)
      setIsFollowed(storage.isCompanyFollowed(companyId))
    }
    setLists(storage.getLists())
  }, [companyId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target as any)?.isContentEditable
      if (isTypingContext) return

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        handleEnrich(true)
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setNotesHotkeyHint(true)
        const el = document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Add a note about this company..."]')
        el?.focus()
        window.setTimeout(() => setNotesHotkeyHint(false), 1200)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.website])

  const handleAddNote = () => {
    if (!newNote.trim()) return
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const updatedNotes = [...notes, note]
    setNotes(updatedNotes)
    storage.saveCompanyNotes(companyId, updatedNotes)
    setNewNote('')
  }

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId)
    setNotes(updatedNotes)
    storage.saveCompanyNotes(companyId, updatedNotes)
  }

  const handleEnrich = async (force?: boolean) => {
    if (!company) return
    
    setEnriching(true)
    setEnrichError(null)
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: company.website, companyId, force: !!force }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || 'Enrichment failed')
      }

      const data = await response.json()
      setEnrichmentData(data)
      storage.saveCompanyEnrichment(companyId, data)
      
      // Update company with enrichment data
      const updatedCompany = { ...company, enriched: data }
      setCompany(updatedCompany)
      showToast(`Successfully enriched ${company.name}`, 'success')
    } catch (error) {
      console.error('Enrichment error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to enrich company data.'
      setEnrichError(errorMsg)
      showToast(errorMsg, 'error', 5000)
    } finally {
      setEnriching(false)
    }
  }

  const handleAddToList = () => {
    if (!selectedListId || !company) return
    
    const updatedLists = lists.map(list => {
      if (list.id === selectedListId && !list.companyIds.includes(company.id)) {
        return { ...list, companyIds: [...list.companyIds, company.id], updatedAt: new Date().toISOString() }
      }
      return list
    })
    
    setLists(updatedLists)
    storage.saveLists(updatedLists)
    setShowAddToList(false)
    setSelectedListId('')
    const listName = lists.find(l => l.id === selectedListId)?.name || 'list'
    showToast(`Added ${company.name} to ${listName}`, 'success')
  }

  const handleToggleFollow = () => {
    if (!company) return
    const newState = storage.toggleFollowCompany(company.id)
    setIsFollowed(newState)
    showToast(newState ? `Following ${company.name}` : `Unfollowed ${company.name}`, 'info')
  }

  const handleExportCompany = () => {
    if (!company) return
    
    const data = {
      name: company.name,
      description: company.description,
      industry: company.industry,
      stage: company.stage,
      location: company.location,
      founded: company.founded,
      employees: company.employees,
      website: company.website,
      tags: company.tags,
      notes: notes,
      enriched: enrichmentData,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${company.name.replace(/\s+/g, '_')}_export.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${company.name}`, 'success')
  }

  if (!company) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center py-20">
            <p className="text-gray-600">Company not found</p>
            <Link href="/companies" className="btn-primary mt-4 inline-block">
              Back to Companies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Mock chart data
  const signalData = company.signals?.map((s, i) => ({
    month: `Month ${i + 1}`,
    signals: i + 1,
  })) || []

  const stageData = [
    { stage: 'Seed', companies: 3 },
    { stage: 'Series A', companies: 4 },
    { stage: 'Series B', companies: 2 },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Topbar />
          {/* Header */}
          <div className="mb-6">
            <Link href="/companies" className="inline-flex items-center gap-2 text-blue-600 hover:text-sky-600 mb-4 transition-colors duration-300 animate-slide-in">
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </Link>
            <div className="flex items-start justify-between animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl transform hover:rotate-6 transition-transform duration-300">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-5xl font-heading font-bold gradient-text mb-2">
                    {company.name}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">{company.description}</p>
                </div>
              </div>
              <div className="flex gap-2 relative">
                <button
                  onClick={handleToggleFollow}
                  className={`btn-secondary flex items-center gap-2 ${isFollowed ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : ''}`}
                  title={isFollowed ? 'Unfollow' : 'Follow'}
                >
                  <Star className={`w-4 h-4 ${isFollowed ? 'fill-yellow-500' : ''}`} />
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <MoreVertical className="w-4 h-4" />
                    Actions
                  </button>
                  {showQuickActions && (
                    <div className="absolute top-12 right-0 bg-white border border-blue-200 rounded-lg shadow-xl p-2 z-10 min-w-[200px]">
                      <button
                        onClick={() => {
                          setShowAddToList(true)
                          setShowQuickActions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Add to List
                      </button>
                      <button
                        onClick={() => {
                          handleExportCompany()
                          setShowQuickActions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Export JSON
                      </button>
                    </div>
                  )}
                </div>
                {showAddToList && (
                  <div className="absolute top-12 right-0 bg-white border border-blue-200 rounded-lg shadow-xl p-4 z-20 min-w-[220px]">
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="input-field mb-2"
                    >
                      <option value="">Select a list</option>
                      {lists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleAddToList} className="btn-primary flex-1 text-sm">
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddToList(false)
                          setSelectedListId('')
                        }}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-5 card-hover bg-gradient-to-br from-aliceblue to-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Stage</div>
                  <div className="font-bold text-gray-900 text-lg">{company.stage}</div>
                </div>
              </div>
            </div>
            <div className="card p-5 card-hover bg-gradient-to-br from-sky-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Location</div>
                  <div className="font-bold text-gray-900 text-lg">{company.location}</div>
                </div>
              </div>
            </div>
            <div className="card p-5 card-hover bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Founded</div>
                  <div className="font-bold text-gray-900 text-lg">{company.founded}</div>
                </div>
              </div>
            </div>
            <div className="card p-5 card-hover bg-gradient-to-br from-cyan-50 to-sky-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-xl shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Employees</div>
                  <div className="font-bold text-gray-900 text-lg">{company.employees}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <div className="card p-6 card-hover">
                <h2 className="text-3xl font-heading font-bold gradient-text mb-6">Overview</h2>
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Industry</h3>
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                      {company.industry}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {company.tags.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700 rounded-full text-sm font-semibold shadow-sm transform hover:scale-110 transition-transform duration-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Website</h3>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-sky-600 transition-colors duration-300 font-medium"
                    >
                      <Globe className="w-5 h-5" />
                      {company.website}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Signals Timeline */}
              {company.signals && company.signals.length > 0 && (
                <div className="card p-6 card-hover">
                  <h2 className="text-3xl font-heading font-bold gradient-text mb-6">Signals Timeline</h2>
                  <div className="space-y-4">
                    {company.signals.map((signal, idx) => (
                      <div key={signal.id} className="flex gap-4 pb-4 border-b border-blue-100 last:border-0 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg transform hover:rotate-12 transition-transform duration-300">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full text-xs font-semibold shadow-sm">
                              {signal.type}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">{signal.date}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1 text-lg">{signal.title}</h4>
                          <p className="text-sm text-gray-600">{signal.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrichment Section */}
              <div className="card p-6 card-hover">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-heading font-bold gradient-text">AI Enrichment</h2>
                  <button
                    onClick={() => handleEnrich(true)}
                    disabled={enriching}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {enriching ? 'Enriching...' : enrichmentData ? 'Re-enrich (E)' : 'Enrich (E)'}
                  </button>
                </div>

                {enrichError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    {enrichError}
                  </div>
                )}

                {enriching && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Fetching and analyzing company data...</p>
                  </div>
                )}

                {enrichmentData && !enriching && (
                  <div className="space-y-6">
                    <div className="animate-fade-in">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        Summary
                      </h3>
                      <p className="text-gray-700 bg-gradient-to-r from-aliceblue to-sky-50 p-5 rounded-xl border border-blue-100 shadow-sm">{enrichmentData.summary}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">What They Do</h3>
                      <ul className="space-y-2">
                        {enrichmentData.whatTheyDo.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="animate-fade-in">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {enrichmentData.keywords.map((keyword, i) => (
                          <span key={i} className="px-4 py-2 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700 rounded-full text-sm font-semibold shadow-sm transform hover:scale-110 transition-transform duration-200">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Derived Signals</h3>
                      <div className="space-y-2">
                        {enrichmentData.signals.map((signal, i) => (
                          <div key={i} className="flex items-center gap-2 text-gray-700">
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            {signal}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Sources
                      </h3>
                      <div className="space-y-2">
                        {enrichmentData.sources.map((source, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              {source.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(source.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enriched at: {new Date(enrichmentData.enrichedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold text-gray-900">Notes</h2>
                  <div className={`text-xs ${notesHotkeyHint ? 'text-blue-700' : 'text-gray-500'}`}>
                    Shortcut: <span className="font-semibold">N</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this company..."
                      className="input-field flex-1 min-h-[80px]"
                    />
                    <button onClick={handleAddNote} className="btn-primary self-start">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Chart */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Signal Activity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={signalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="signals" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Industry Comparison */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Stage Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="stage" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="companies" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
