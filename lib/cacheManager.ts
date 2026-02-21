/**
 * Cache Manager for Enrichment Results
 * Provides persistent and in-memory caching with TTL support
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  source: 'memory' | 'storage'
}

export interface CacheStats {
  totalEntries: number
  memoryEntries: number
  storageEntries: number
  memorySize: number
  oldestEntry: number | null
  newestEntry: number | null
}

declare global {
  // eslint-disable-next-line no-var
  var __vc_cache: Map<string, CacheEntry<any>> | undefined
}

const CACHE_TTL_MS =
  parseInt(process.env.CACHE_TTL || String(1000 * 60 * 60 * 24 * 7)) // 7 days default
const ENABLE_CACHE = process.env.ENABLE_CACHE !== 'false'
const STORAGE_KEY_PREFIX = 'vc_cache_'
const STORAGE_INDEX_KEY = 'vc_cache_index'

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(
  identifier: string,
  url?: string
): string {
  return `${identifier}::${url || 'default'}`
}

/**
 * Set a value in cache
 */
export function setCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  if (!ENABLE_CACHE) {
    return
  }

  const now = Date.now()
  const expiresAt = now + ttlMs
  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt,
    source: 'memory',
  }

  // Store in memory
  const cache = (globalThis.__vc_cache ??= new Map())
  cache.set(key, entry)
  console.log(`[v0] Cache SET: ${key} (expires in ${ttlMs}ms)`)

  // Also store in localStorage for persistence (if available)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`
      window.localStorage.setItem(storageKey, JSON.stringify(entry))

      // Update index
      const index: string[] = JSON.parse(
        window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]'
      )
      if (!index.includes(key)) {
        index.push(key)
        window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index))
      }
    }
  } catch (error) {
    console.warn('[v0] Failed to persist cache to localStorage:', error)
  }
}

/**
 * Get a value from cache
 */
export function getCache<T>(key: string): T | null {
  if (!ENABLE_CACHE) {
    return null
  }

  const now = Date.now()
  const cache = globalThis.__vc_cache ?? new Map()
  const entry = cache.get(key) as CacheEntry<T> | undefined

  // Check memory cache
  if (entry) {
    if (now < entry.expiresAt) {
      console.log(`[v0] Cache HIT (memory): ${key}`)
      return entry.data
    } else {
      console.log(`[v0] Cache EXPIRED (memory): ${key}`)
      cache.delete(key)
    }
  }

  // Check storage cache (if available)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`
      const stored = window.localStorage.getItem(storageKey)

      if (stored) {
        const storageEntry: CacheEntry<T> = JSON.parse(stored)

        if (now < storageEntry.expiresAt) {
          console.log(`[v0] Cache HIT (storage): ${key}`)
          // Restore to memory cache
          cache.set(key, storageEntry)
          return storageEntry.data
        } else {
          console.log(`[v0] Cache EXPIRED (storage): ${key}`)
          window.localStorage.removeItem(storageKey)
          removeFromIndex(key)
        }
      }
    }
  } catch (error) {
    console.warn('[v0] Failed to read cache from localStorage:', error)
  }

  console.log(`[v0] Cache MISS: ${key}`)
  return null
}

/**
 * Check if a key exists in cache and hasn't expired
 */
export function isCached(key: string): boolean {
  if (!ENABLE_CACHE) {
    return false
  }

  const now = Date.now()
  const cache = globalThis.__vc_cache ?? new Map()
  const entry = cache.get(key)

  if (entry && now < entry.expiresAt) {
    return true
  }

  // Check storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`
      const stored = window.localStorage.getItem(storageKey)

      if (stored) {
        const storageEntry: CacheEntry<any> = JSON.parse(stored)
        return now < storageEntry.expiresAt
      }
    }
  } catch {
    // Ignore
  }

  return false
}

/**
 * Delete a specific cache entry
 */
export function deleteCache(key: string): void {
  const cache = globalThis.__vc_cache ?? new Map()
  cache.delete(key)
  console.log(`[v0] Cache DELETED: ${key}`)

  // Delete from storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`
      window.localStorage.removeItem(storageKey)
      removeFromIndex(key)
    }
  } catch (error) {
    console.warn('[v0] Failed to delete from localStorage:', error)
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  console.log('[v0] Cache CLEARED')

  // Clear memory cache
  globalThis.__vc_cache = new Map()

  // Clear storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const index: string[] = JSON.parse(
        window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]'
      )

      for (const key of index) {
        const storageKey = `${STORAGE_KEY_PREFIX}${key}`
        window.localStorage.removeItem(storageKey)
      }

      window.localStorage.removeItem(STORAGE_INDEX_KEY)
    }
  } catch (error) {
    console.warn('[v0] Failed to clear localStorage:', error)
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  const now = Date.now()
  const cache = globalThis.__vc_cache ?? new Map()
  let removed = 0

  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiresAt) {
      cache.delete(key)
      removed++
      console.log(`[v0] Removed expired cache entry: ${key}`)
    }
  }

  // Also clean storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const index: string[] = JSON.parse(
        window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]'
      )
      const updatedIndex: string[] = []

      for (const key of index) {
        const storageKey = `${STORAGE_KEY_PREFIX}${key}`
        const stored = window.localStorage.getItem(storageKey)

        if (stored) {
          const entry: CacheEntry<any> = JSON.parse(stored)

          if (now >= entry.expiresAt) {
            window.localStorage.removeItem(storageKey)
            removed++
          } else {
            updatedIndex.push(key)
          }
        }
      }

      window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(updatedIndex))
    }
  } catch (error) {
    console.warn('[v0] Failed to clean expired storage entries:', error)
  }

  return removed
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const cache = globalThis.__vc_cache ?? new Map()
  const now = Date.now()
  let memorySize = 0
  let storageEntries = 0
  let oldestEntry: number | null = null
  let newestEntry: number | null = null

  // Count memory entries and size
  for (const [, entry] of cache.entries()) {
    if (now < entry.expiresAt) {
      memorySize += JSON.stringify(entry).length
    }

    if (oldestEntry === null || entry.timestamp < oldestEntry) {
      oldestEntry = entry.timestamp
    }
    if (newestEntry === null || entry.timestamp > newestEntry) {
      newestEntry = entry.timestamp
    }
  }

  // Count storage entries
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const index: string[] = JSON.parse(
        window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]'
      )
      storageEntries = index.length
    }
  } catch {
    // Ignore
  }

  return {
    totalEntries: cache.size + storageEntries,
    memoryEntries: cache.size,
    storageEntries,
    memorySize,
    oldestEntry,
    newestEntry,
  }
}

/**
 * Helper: Remove key from storage index
 */
function removeFromIndex(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const index: string[] = JSON.parse(
        window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]'
      )
      const newIndex = index.filter(k => k !== key)
      window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(newIndex))
    }
  } catch {
    // Ignore
  }
}
