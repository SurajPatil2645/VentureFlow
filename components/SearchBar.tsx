'use client'

import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  value?: string
  autoFocus?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  hotkeyHint?: string
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search companies...',
  className = '',
  value,
  autoFocus,
  inputRef,
  hotkeyHint,
}: SearchBarProps) {
  const internalRef = useRef<HTMLInputElement | null>(null)
  const refToUse = inputRef ?? internalRef
  const isControlled = typeof value === 'string'
  const [query, setQuery] = useState(value ?? '')

  useEffect(() => {
    if (isControlled) setQuery(value as string)
  }, [isControlled, value])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          ref={refToUse as any}
          className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 shadow-lg hover:shadow-xl transition-all duration-300"
        />
        {hotkeyHint && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1">
            {hotkeyHint}
          </div>
        )}
      </div>
    </form>
  )
}
