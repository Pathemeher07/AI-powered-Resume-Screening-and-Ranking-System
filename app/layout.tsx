import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RecruitAI | Candidate Screening',
  description: 'Evidence-based resume screening and candidate ranking',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
