import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OnlineStatusProvider } from '@/context/OnlineStatusContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { SyncProvider } from '@/context/SyncContext'
import Navbar from '@/components/Navbar'
import NotificationCenter from '@/components/NotificationCenter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistem Absensi Sholat',
  description: 'Aplikasi absensi sholat 5 waktu santri berbasis QR Code',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <OnlineStatusProvider>
          <NotificationProvider>
            <SyncProvider>
              <Navbar />
              <main className="max-w-6xl mx-auto px-4 py-8">
                {children}
              </main>
              <NotificationCenter />
            </SyncProvider>
          </NotificationProvider>
        </OnlineStatusProvider>
      </body>
    </html>
  )
}
