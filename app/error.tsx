'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[v0] Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>

          <p className="text-muted-foreground mb-6">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground mb-6 font-mono bg-muted p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>

            <Link
              href="/companies"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Companies
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            If the problem persists, try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  )
}
