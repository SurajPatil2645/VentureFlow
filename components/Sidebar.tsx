'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Building2, 
  List, 
  Bookmark, 
  Search,
  Sparkles,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Lists', href: '/lists', icon: List },
  { name: 'Saved Searches', href: '/saved', icon: Bookmark },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-600 shadow-2xl z-50 border-r border-white/10">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/20 animate-fade-in">
          <div className="p-2.5 bg-gradient-to-br from-blue-400 via-sky-400 to-cyan-400 rounded-xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white tracking-tight">VentureFlow</h1>
            <p className="text-xs text-white/80 font-medium">VC Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xl scale-105'
                    : 'text-white/90 hover:bg-white/20 hover:text-white hover:scale-105'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/20">
          <p className="text-xs text-white/70 text-center font-medium">
            ✨ Powered by AI
          </p>
        </div>
      </div>
    </div>
  )
}
