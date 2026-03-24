import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import PushButton from '@/components/PushButton'
import HeaderTitle from '@/components/HeaderTitle'

export const metadata: Metadata = {
  title: 'Las Empanadas de Susi',
  description: 'Panel de gestión interno',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Empanadas Susi',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#f06007',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({children,}: {
  children: React.ReactNode
}) 
{
  return (
    <html lang="es" style={{ height: '100%' }}>
      <body style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fffbf5' }}>
        <header style={{ flexShrink: 0, background: '#fffbf5', borderBottom: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', padding: '8px 16px' }}>
          <div />
          <HeaderTitle />
          <PushButton />
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }} className="max-w-lg mx-auto w-full px-0">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
