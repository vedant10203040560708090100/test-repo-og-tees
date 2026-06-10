import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OG Tees | Custom Screen Printing',
  description: 'Design and order custom screen-printed apparel. T-shirts, hoodies, polos and more with your design.',
  keywords: 'custom t-shirts, screen printing, custom hoodies, design online, OG Tees',
  openGraph: {
    title: 'OG Tees | Custom Screen Printing',
    description: 'Design and order custom screen-printed apparel.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col antialiased font-sans">{children}</body>
    </html>
  )
}
