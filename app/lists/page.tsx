'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { ToastContainer, useToast, showToast } from '@/components/Toast'
import { mockCompanies } from '@/lib/mockData'
import { storage } from '@/lib/storage'
import { List, Company } from '@/types'
import {
  Plus,
  Trash2,
  Download,
  Building2,
  FileDown,
  FileJson,
  X
} from 'lucide-react'

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [selectedList, setSelectedList] = useState<List | null>(null)
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    setLists(storage.getLists())
  }, [])

  const handleCreateList = () => {
    if (!newListName.trim()) return

    const newList: List = {
      id: Date.now().toString(),
      name: newListName,
      description: newListDescription,
      companyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedLists = [...lists, newList]
    setLists(updatedLists)
    storage.saveLists(updatedLists)
    setNewListName('')
    setNewListDescription('')
    setShowCreateModal(false)
    showToast(`List "${newListName}" created`, 'success')
  }

  const handleDeleteList = (listId: string) => {
    if (confirm('Are you sure you want to delete this list?')) {
      const updatedLists = lists.filter(l => l.id !== listId)
      setLists(updatedLists)
      storage.saveLists(updatedLists)
      if (selectedList?.id === listId) {
        setSelectedList(null)
      }
    }
  }

  const handleRemoveCompany = (listId: string, companyId: string) => {
    const updatedLists = lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          companyIds: list.companyIds.filter(id => id !== companyId),
          updatedAt: new Date().toISOString(),
        }
      }
      return list
    })
    setLists(updatedLists)
    storage.saveLists(updatedLists)
    if (selectedList) {
      setSelectedList(updatedLists.find(l => l.id === selectedList.id) || null)
    }
  }

  const handleExportCSV = (list: List) => {
    const companies = mockCompanies.filter(c => list.companyIds.includes(c.id))
    const headers = ['Name', 'Industry', 'Stage', 'Location', 'Website', 'Description']
    const rows = companies.map(c => [
      c.name,
      c.industry,
      c.stage,
      c.location,
      c.website,
      c.description,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${list.name} as CSV`, 'success')
  }

  const handleExportJSON = (list: List) => {
    const companies = mockCompanies.filter(c => list.companyIds.includes(c.id))
    const data = {
      listName: list.name,
      listDescription: list.description,
      createdAt: list.createdAt,
      companies: companies,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${list.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${list.name} as JSON`, 'success')
  }

  const getCompaniesInList = (list: List): Company[] => {
    return mockCompanies.filter(c => list.companyIds.includes(c.id))
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold gradient-text mb-2 animate-fade-in">
                Lists
              </h1>
              <p className="text-gray-600 text-lg">Organize companies into custom lists</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create List
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lists Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-4 space-y-2">
                {lists.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No lists yet. Create one to get started!</p>
                ) : (
                  lists.map((list) => (
                    <div
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      className={`p-5 rounded-xl cursor-pointer transition-all duration-300 transform ${
                        selectedList?.id === list.id
                          ? 'bg-gradient-to-r from-aliceblue to-sky-50 border-2 border-blue-400 shadow-lg scale-105'
                          : 'bg-gray-50 hover:bg-gradient-to-r hover:from-aliceblue hover:to-sky-50 border-2 border-transparent hover:scale-105 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{list.name}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteList(list.id)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {list.description && (
                        <p className="text-sm text-gray-600 mb-2">{list.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{list.companyIds.length} companies</span>
                        <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* List Detail */}
            <div className="lg:col-span-2">
              {selectedList ? (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-heading font-bold gradient-text mb-1">
                        {selectedList.name}
                      </h2>
                      {selectedList.description && (
                        <p className="text-gray-600">{selectedList.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportCSV(selectedList)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportJSON(selectedList)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <FileJson className="w-4 h-4" />
                        JSON
                      </button>
                    </div>
                  </div>

                  {getCompaniesInList(selectedList).length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">This list is empty</p>
                      <Link href="/companies" className="btn-primary inline-block">
                        Browse Companies
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getCompaniesInList(selectedList).map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-aliceblue/50 to-sky-50/50 rounded-xl hover:from-blue-50 hover:to-sky-100 transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md animate-fade-in"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                              {company.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <Link
                                href={`/companies/${company.id}`}
                                className="font-semibold text-gray-900 hover:gradient-text transition-all duration-300"
                              >
                                {company.name}
                              </Link>
                              <p className="text-sm text-gray-600">{company.industry} • {company.stage}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCompany(selectedList.id, company.id)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a list</h3>
                  <p className="text-gray-600">Choose a list from the sidebar to view its companies</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Create New List</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Series A Companies"
                  className="input-field"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="input-field min-h-[80px]"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateList}
                  className="btn-primary flex-1"
                >
                  Create List
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewListName('')
                    setNewListDescription('')
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
