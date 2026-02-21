import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VentureFlow - VC Intelligence Platform',
  description: 'Discover and enrich VC company data with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
