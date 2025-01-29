import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workout Timer',
  description: 'Build exercise sequences with timers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
