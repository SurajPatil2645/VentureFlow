'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { storage } from '@/lib/storage'
import { SavedSearch } from '@/types'
import {
  Plus,
  Trash2,
  Search,
  Clock,
  Play
} from 'lucide-react'

export default function SavedSearchesPage() {
  const router = useRouter()
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSearchName, setNewSearchName] = useState('')
  const [newSearchQuery, setNewSearchQuery] = useState('')
  const [newSearchIndustry, setNewSearchIndustry] = useState('')
  const [newSearchStage, setNewSearchStage] = useState('')

  useEffect(() => {
    setSavedSearches(storage.getSavedSearches())
  }, [])

  const handleCreateSearch = () => {
    if (!newSearchName.trim() || !newSearchQuery.trim()) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: newSearchName,
      query: newSearchQuery,
      filters: {
        industry: newSearchIndustry ? [newSearchIndustry] : undefined,
        stage: newSearchStage ? [newSearchStage] : undefined,
      },
      createdAt: new Date().toISOString(),
    }

    const updatedSearches = [...savedSearches, newSearch]
    setSavedSearches(updatedSearches)
    storage.saveSavedSearches(updatedSearches)
    setNewSearchName('')
    setNewSearchQuery('')
    setNewSearchIndustry('')
    setNewSearchStage('')
    setShowCreateModal(false)
  }

  const handleDeleteSearch = (searchId: string) => {
    if (confirm('Are you sure you want to delete this saved search?')) {
      const updatedSearches = savedSearches.filter(s => s.id !== searchId)
      setSavedSearches(updatedSearches)
      storage.saveSavedSearches(updatedSearches)
    }
  }

  const handleRunSearch = (search: SavedSearch) => {
    // Navigate to companies page with search params
    const params = new URLSearchParams()
    params.set('q', search.query)
    if (search.filters?.industry?.[0]) {
      params.set('industry', search.filters.industry[0])
    }
    if (search.filters?.stage?.[0]) {
      params.set('stage', search.filters.stage[0])
    }
    router.push(`/companies?${params.toString()}`)
  }

  const industries = ['Enterprise Software', 'Clean Energy', 'Healthcare', 'EdTech', 'FinTech', 'Infrastructure', 'Retail Tech', 'Food Tech', 'Space Tech']
  const stages = ['Seed', 'Series A', 'Series B']

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold gradient-text mb-2 animate-fade-in">
                Saved Searches
              </h1>
              <p className="text-gray-600 text-lg">Save and re-run your favorite searches</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Save Search
            </button>
          </div>

          {/* Saved Searches Grid */}
          {savedSearches.length === 0 ? (
            <div className="card p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved searches</h3>
              <p className="text-gray-600 mb-6">Save your searches to quickly access them later</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Create Your First Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSearches.map((search, idx) => (
                <div key={search.id} className="card p-6 card-hover animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold gradient-text mb-2">{search.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4" />
                        {new Date(search.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSearch(search.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-xs font-medium text-gray-600">Query:</span>
                      <p className="text-gray-900">{search.query || '(none)'}</p>
                    </div>
                    {search.filters?.industry && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Industry:</span>
                        <p className="text-gray-900">{search.filters.industry.join(', ')}</p>
                      </div>
                    )}
                    {search.filters?.stage && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">Stage:</span>
                        <p className="text-gray-900">{search.filters.stage.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRunSearch(search)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Run Search
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Save Search</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Name *
                </label>
                <input
                  type="text"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  placeholder="e.g., AI Companies in SF"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query *
                </label>
                <input
                  type="text"
                  value={newSearchQuery}
                  onChange={(e) => setNewSearchQuery(e.target.value)}
                  placeholder="Enter search terms..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry (optional)
                </label>
                <select
                  value={newSearchIndustry}
                  onChange={(e) => setNewSearchIndustry(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stage (optional)
                </label>
                <select
                  value={newSearchStage}
                  onChange={(e) => setNewSearchStage(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Stages</option>
                  {stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateSearch}
                  className="btn-primary flex-1"
                >
                  Save Search
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewSearchName('')
                    setNewSearchQuery('')
                    setNewSearchIndustry('')
                    setNewSearchStage('')
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
