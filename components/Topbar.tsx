'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import { Sparkles } from 'lucide-react'

export default function Topbar() {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const placeholder = useMemo(() => {
    if (pathname?.startsWith('/companies/')) return 'Search companies (jump back to list)…'
    return 'Search companies…'
  }, [pathname])

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
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSearch = (q: string) => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    router.push(`/companies?${params.toString()}`)
  }

  return (
    <div className="sticky top-0 z-40 mb-6">
      <div className="card px-6 py-4 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-700">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-xl text-white shadow-lg animate-pulse-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold gradient-text">VentureFlow</span>
          </div>
          <div className="flex-1">
            <SearchBar
              onSearch={handleSearch}
              placeholder={placeholder}
              inputRef={inputRef}
              hotkeyHint="/"
              className="max-w-3xl"
            />
          </div>
          <div className="hidden lg:block text-xs text-gray-500">
            Tip: Press <span className="font-semibold">/</span> to search
          </div>
        </div>
      </div>
    </div>
  )
}

