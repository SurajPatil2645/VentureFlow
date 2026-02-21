import { EnrichmentData, List, SavedSearch } from '@/types'

const STORAGE_KEYS = {
  LISTS: 'vc_lists',
  SAVED_SEARCHES: 'vc_saved_searches',
  COMPANY_NOTES: 'vc_company_notes',
  COMPANY_ENRICHMENT: 'vc_company_enrichment',
  FOLLOWED_COMPANIES: 'vc_followed_companies',
}

export const storage = {
  // Lists
  getLists(): List[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.LISTS)
    return data ? JSON.parse(data) : []
  },

  saveLists(lists: List[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists))
  },

  // Saved Searches
  getSavedSearches(): SavedSearch[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES)
    return data ? JSON.parse(data) : []
  },

  saveSavedSearches(searches: SavedSearch[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(searches))
  },

  // Company Notes
  getCompanyNotes(companyId: string) {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(`${STORAGE_KEYS.COMPANY_NOTES}_${companyId}`)
    return data ? JSON.parse(data) : []
  },

  saveCompanyNotes(companyId: string, notes: any[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${STORAGE_KEYS.COMPANY_NOTES}_${companyId}`, JSON.stringify(notes))
  },

  // Company Enrichment
  getCompanyEnrichment(companyId: string): EnrichmentData | null {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem(`${STORAGE_KEYS.COMPANY_ENRICHMENT}_${companyId}`)
    return data ? JSON.parse(data) : null
  },

  saveCompanyEnrichment(companyId: string, enrichment: EnrichmentData): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${STORAGE_KEYS.COMPANY_ENRICHMENT}_${companyId}`, JSON.stringify(enrichment))
  },

  // Followed Companies
  getFollowedCompanies(): string[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.FOLLOWED_COMPANIES)
    return data ? JSON.parse(data) : []
  },

  toggleFollowCompany(companyId: string): boolean {
    if (typeof window === 'undefined') return false
    const followed = this.getFollowedCompanies()
    const index = followed.indexOf(companyId)
    if (index > -1) {
      followed.splice(index, 1)
    } else {
      followed.push(companyId)
    }
    localStorage.setItem(STORAGE_KEYS.FOLLOWED_COMPANIES, JSON.stringify(followed))
    return !followed.includes(companyId)
  },

  isCompanyFollowed(companyId: string): boolean {
    if (typeof window === 'undefined') return false
    return this.getFollowedCompanies().includes(companyId)
  },
}
