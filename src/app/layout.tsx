import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workout Timer App - Create Custom Exercise Routines',
  description: 'Free workout timer app to create and save custom HIIT, circuit training, and interval workouts. Perfect for home workouts, gym sessions, and fitness training.',
  keywords: 'workout timer, exercise timer, HIIT timer, interval timer, circuit training timer, fitness app',
  openGraph: {
    title: 'Workout Timer App - Create Custom Exercise Routines',
    description: 'Free workout timer app for custom HIIT and circuit training routines',
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2196F3'
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
