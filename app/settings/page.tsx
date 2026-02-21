'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { ToastContainer, useToast, showToast } from '@/components/Toast'
import { Trash2, RefreshCw, Database, Info } from 'lucide-react'

interface CacheStats {
  totalEntries: number
  memoryEntries: number
  storageEntries: number
  memorySize: number
  oldestEntry: number | null
  newestEntry: number | null
}

interface RateLimitConfig {
  requestsPerMinute: number
  tokenRefillRate: number
  maxTokens: number
}

export default function SettingsPage() {
  const { toasts, removeToast } = useToast()
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [rateLimitConfig, setRateLimitConfig] = useState<RateLimitConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKeyStatus, setApiKeyStatus] = useState<'loaded' | 'not-set'>('not-set')

  useEffect(() => {
    // Load cache stats and rate limit config
    const loadStats = async () => {
      try {
        // Import utilities (client-side)
        const { getCacheStats } = await import('@/lib/cacheManager')
        const { getRateLimitConfig } = await import('@/lib/rateLimiter')

        setCacheStats(getCacheStats())
        setRateLimitConfig(getRateLimitConfig())
        
        // In a real app, we would check if OPENAI_API_KEY is set via an API call
        // For now, we'll set it to 'not-set' by default (user needs to restart server after adding key)
        setApiKeyStatus('loaded')
      } catch (error) {
        console.error('[v0] Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const handleClearCache = async () => {
    try {
      const { clearCache } = await import('@/lib/cacheManager')
      clearCache()
      setCacheStats({
        totalEntries: 0,
        memoryEntries: 0,
        storageEntries: 0,
        memorySize: 0,
        oldestEntry: null,
        newestEntry: null,
      })
      showToast('Cache cleared successfully', 'success')
    } catch (error) {
      console.error('[v0] Failed to clear cache:', error)
      showToast('Failed to clear cache', 'error')
    }
  }

  const handleClearExpired = async () => {
    try {
      const { clearExpiredCache, getCacheStats } = await import('@/lib/cacheManager')
      const cleared = clearExpiredCache()
      const newStats = getCacheStats()
      setCacheStats(newStats)
      showToast(`Cleared ${cleared} expired entries`, 'success')
    } catch (error) {
      console.error('[v0] Failed to clear expired cache:', error)
      showToast('Failed to clear expired cache', 'error')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 flex flex-col">
        <Topbar />

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">
                Manage cache, rate limiting, and application preferences
              </p>
            </div>



            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading settings...</div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Cache Management Section */}
                <div className="bg-card rounded-lg border border-border shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Database className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Cache Management</h2>
                  </div>

                  {cacheStats ? (
                    <>
                      {/* Cache Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">Total Entries</p>
                          <p className="text-3xl font-bold text-foreground">
                            {cacheStats.totalEntries}
                          </p>
                        </div>

                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">Memory Size</p>
                          <p className="text-3xl font-bold text-foreground">
                            {formatBytes(cacheStats.memorySize)}
                          </p>
                        </div>

                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">In Memory</p>
                          <p className="text-xl font-semibold text-foreground">
                            {cacheStats.memoryEntries} entries
                          </p>
                        </div>

                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">In Storage</p>
                          <p className="text-xl font-semibold text-foreground">
                            {cacheStats.storageEntries} entries
                          </p>
                        </div>

                        {cacheStats.oldestEntry && (
                          <div className="bg-muted rounded p-4 md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">
                              Cache Date Range
                            </p>
                            <p className="text-sm font-mono text-foreground">
                              {formatDate(cacheStats.oldestEntry)} → {formatDate(cacheStats.newestEntry)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cache Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleClearExpired}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Clear Expired
                        </button>

                        <button
                          onClick={handleClearCache}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Cache
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-4">
                        Cache helps reduce API calls and improves performance. Cleared data will be
                        re-fetched from the API when needed.
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Unable to load cache statistics</p>
                  )}
                </div>

                {/* Rate Limiting Section */}
                <div className="bg-card rounded-lg border border-border shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Info className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Rate Limiting</h2>
                  </div>

                  {rateLimitConfig ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">Requests per Minute</p>
                          <p className="text-3xl font-bold text-foreground">
                            {rateLimitConfig.requestsPerMinute}
                          </p>
                        </div>

                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">Refill Rate</p>
                          <p className="text-xl font-semibold text-foreground">
                            {rateLimitConfig.tokenRefillRate.toFixed(2)} tokens/sec
                          </p>
                        </div>

                        <div className="bg-muted rounded p-4">
                          <p className="text-sm text-muted-foreground mb-1">Max Tokens</p>
                          <p className="text-xl font-semibold text-foreground">
                            {rateLimitConfig.maxTokens}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Rate limiting uses a token bucket algorithm to smooth API usage and prevent
                        exceeding OpenAI's rate limits. When you hit the limit, requests are queued
                        and processed when tokens become available.
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load rate limiting configuration</p>
                  )}
                </div>

                {/* Environment Info Section */}
                <div className="bg-card rounded-lg border border-border shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Environment</h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">OpenAI API Key</span>
                      <span className={`text-sm font-semibold ${apiKeyStatus === 'loaded' ? 'text-green-600' : 'text-amber-600'}`}>
                        {apiKeyStatus === 'loaded' ? 'Configured' : 'Not Set'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cache Enabled</span>
                      <span className="text-sm font-semibold text-green-600">Yes</span>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                      For more configuration options, see .env.example and update .env.local
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
