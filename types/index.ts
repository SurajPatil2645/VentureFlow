export interface Company {
  id: string
  name: string
  description: string
  industry: string
  stage: string
  location: string
  founded: number
  employees: string
  website: string
  logo?: string
  tags: string[]
  signals?: Signal[]
  notes?: Note[]
  enriched?: EnrichmentData
}

export interface Signal {
  id: string
  type: 'funding' | 'hiring' | 'product' | 'partnership' | 'news'
  title: string
  description: string
  date: string
  source?: string
}

export interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface EnrichmentData {
  summary: string
  whatTheyDo: string[]
  keywords: string[]
  signals: string[]
  sources: {
    url: string
    timestamp: string
  }[]
  enrichedAt: string
}

export interface List {
  id: string
  name: string
  description?: string
  companyIds: string[]
  createdAt: string
  updatedAt: string
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  createdAt: string
}

export interface SearchFilters {
  industry?: string[]
  stage?: string[]
  location?: string[]
  tags?: string[]
}
