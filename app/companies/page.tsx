import { Suspense } from 'react'
import CompaniesClient from '@/app/companies/CompaniesClient'

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-600">Loading companies…</div>}>
      <CompaniesClient />
    </Suspense>
  )
}
