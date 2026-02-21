import { Search, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <Search className="w-16 h-16 text-muted-foreground" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

        <h2 className="text-xl font-semibold text-muted-foreground mb-4">
          Page not found
        </h2>

        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/companies"
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Companies
        </Link>
      </div>
    </div>
  )
}
