import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#020617',
}

export const metadata: Metadata = {
  title: {
    default: 'Next.js Modern Application',
    template: '%s | Code Scaffold'
  },
  description: 'High-performance, mobile-first serverless web application optimized for modern search and generative discovery.',
  metadataBase: new URL('https://example.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Next.js Modern Application',
    description: 'High-performance, mobile-first serverless web application.',
    url: 'https://example.com',
    siteName: 'Code Scaffold App',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next.js Modern Application',
    description: 'High-performance, mobile-first serverless web application.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Code Scaffold App',
    url: 'https://example.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://example.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="antialiased min-h-screen bg-slate-950 text-slate-50">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
