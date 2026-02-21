'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import Topbar from '@/components/Topbar'
import { ToastContainer, useToast, showToast } from '@/components/Toast'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { mockCompanies } from '@/lib/mockData'
import { storage } from '@/lib/storage'
import { Company, SavedSearch } from '@/types'
import {
  ArrowUpDown,
  MapPin,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react'

type SortField = 'name' | 'industry' | 'stage' | 'location' | 'founded'
type SortDirection = 'asc' | 'desc'

export default function CompaniesClient() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lists, setLists] = useState(storage.getLists())
  const [bulkListId, setBulkListId] = useState('')

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const { toasts, removeToast } = useToast()

  // Initialize from URL params (for saved searches)
  useEffect(() => {
    const q = searchParams.get('q')
    const industry = searchParams.get('industry')
    const stage = searchParams.get('stage')

    setSearchQuery(q ?? '')
    setSelectedIndustry(industry ?? '')
    setSelectedStage(stage ?? '')
    setCurrentPage(1)
  }, [searchParams])

  useEffect(() => {
    setLists(storage.getLists())
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target as any)?.isContentEditable
      if (isTypingContext) return

      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        setShowSaveModal(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const industries = Array.from(new Set(mockCompanies.map((c) => c.industry)))
  const stages = Array.from(new Set(mockCompanies.map((c) => c.stage)))

  const filteredAndSorted = useMemo(() => {
    const filtered = mockCompanies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        company.tags.some((tag) => tag.toLowerCase().includes(debouncedQuery.toLowerCase()))

      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry
      const matchesStage = !selectedStage || company.stage === selectedStage

      return matchesSearch && matchesIndustry && matchesStage
    })

    filtered.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'name') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [debouncedQuery, selectedIndustry, selectedStage, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedCompanies = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [currentPage, totalPages])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleSelectAllOnPage = () => {
    const pageIds = paginatedCompanies.map((c) => c.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    const next = new Set(selectedIds)
    if (allSelected) {
      pageIds.forEach((id) => next.delete(id))
    } else {
      pageIds.forEach((id) => next.add(id))
    }
    setSelectedIds(next)
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const bulkAddToList = () => {
    if (!bulkListId || selectedIds.size === 0) return
    const updated = lists.map((l) => {
      if (l.id !== bulkListId) return l
      const set = new Set(l.companyIds)
      selectedIds.forEach((id) => set.add(id))
      return { ...l, companyIds: Array.from(set), updatedAt: new Date().toISOString() }
    })
    setLists(updated)
    storage.saveLists(updated)
    const listName = lists.find(l => l.id === bulkListId)?.name || 'list'
    showToast(`Added ${selectedIds.size} companies to ${listName}`, 'success')
    setBulkListId('')
    setSelectedIds(new Set())
  }

  const openSaveModal = () => {
    const industry = selectedIndustry || 'Any'
    const stage = selectedStage || 'Any'
    const q = searchQuery || 'All companies'
    setSaveName(`${q} • ${industry} • ${stage}`.slice(0, 60))
    setShowSaveModal(true)
  }

  const saveCurrentSearch = () => {
    const name = saveName.trim()
    if (!name) return
    const searches = storage.getSavedSearches()
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: searchQuery,
      filters: {
        industry: selectedIndustry ? [selectedIndustry] : undefined,
        stage: selectedStage ? [selectedStage] : undefined,
      },
      createdAt: new Date().toISOString(),
    }
    storage.saveSavedSearches([newSearch, ...searches])
    showToast(`Search "${name}" saved`, 'success')
    setShowSaveModal(false)
    setSaveName('')
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {children}
      <ArrowUpDown className="w-4 h-4" />
    </button>
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Topbar />

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-5xl font-heading font-bold gradient-text mb-2 animate-fade-in">Companies</h1>
              <p className="text-gray-600 text-lg">Discover and explore venture-backed companies</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={openSaveModal} className="btn-secondary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save search <span className="text-xs text-gray-500">(S)</span>
              </button>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <SearchBar
                  onSearch={(q) => {
                    setSearchQuery(q)
                    setCurrentPage(1)
                  }}
                  value={searchQuery}
                  inputRef={searchInputRef}
                  hotkeyHint="/"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedIndustry}
                  onChange={(e) => {
                    setSelectedIndustry(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input-field"
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="input-field"
                >
                  <option value="">All Stages</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>{filteredAndSorted.length} companies found</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm text-gray-600">
                  Selected: <span className="font-semibold text-gray-900">{selectedIds.size}</span>
                </div>
                <select
                  value={bulkListId}
                  onChange={(e) => setBulkListId(e.target.value)}
                  className="px-3 py-2 border-2 border-blue-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Bulk add to list…</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={bulkAddToList}
                  disabled={!bulkListId || selectedIds.size === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Add selected
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={selectedIds.size === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {filteredAndSorted.length === 0 && debouncedQuery ? (
            <div className="card p-12 text-center">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filters to find more companies.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedIndustry('')
                  setSelectedStage('')
                }}
                className="btn-secondary"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-aliceblue via-sky-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left w-[56px]">
                        <button
                          onClick={toggleSelectAllOnPage}
                          className="text-gray-600 hover:text-blue-700 transition-colors"
                          aria-label="Select all companies on this page"
                        >
                          {paginatedCompanies.every((c) => selectedIds.has(c.id)) &&
                          paginatedCompanies.length > 0 ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="name">Company</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="industry">Industry</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="stage">Stage</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="location">Location</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <SortButton field="founded">Founded</SortButton>
                    </th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {paginatedCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gradient-to-r hover:from-aliceblue/50 hover:via-sky-50/50 hover:to-blue-50/50 transition-all duration-300 animate-fade-in">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRow(company.id)}
                          className="text-gray-600 hover:text-blue-700 transition-colors"
                          aria-label={`Select ${company.name}`}
                        >
                          {selectedIds.has(company.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/companies/${company.id}`} className="flex items-center gap-3 group">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:gradient-text transition-all duration-300">
                              {company.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">{company.description}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm">
                          {company.industry}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700 rounded-full text-sm font-semibold shadow-sm">
                          {company.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {company.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {company.founded}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/companies/${company.id}`} className="btn-primary text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-blue-100 flex items-center justify-between bg-gradient-to-r from-aliceblue/50 to-sky-50/50">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of{' '}
                  {filteredAndSorted.length} companies
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Save this search</h2>
            <p className="text-sm text-gray-600 mb-4">
              Saved searches appear on <span className="font-semibold">/saved</span>. Tip: press{' '}
              <span className="font-semibold">S</span> to open this.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., AI • Series A • SF"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveCurrentSearch()
                  }}
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
                <div>
                  <span className="font-semibold">Query:</span> {searchQuery || '(empty)'}
                </div>
                <div>
                  <span className="font-semibold">Industry:</span> {selectedIndustry || 'All'}
                </div>
                <div>
                  <span className="font-semibold">Stage:</span> {selectedStage || 'All'}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveCurrentSearch} className="btn-primary flex-1">
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false)
                    setSaveName('')
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

