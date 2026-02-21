'use client'

export function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        <div className="h-12 bg-gradient-to-r from-blue-50 to-sky-50"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-blue-100 flex items-center px-6 gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CompanyCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-lg"></div>
        <div className="h-32 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="card p-4 space-y-2 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
      ))}
    </div>
  )
}
