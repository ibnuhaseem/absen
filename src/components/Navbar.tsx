'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOnlineStatus } from '@/context/OnlineStatusContext'
import { useSync } from '@/context/SyncContext'

export default function Navbar() {
  const pathname = usePathname()
  const { isOnline } = useOnlineStatus()
  const { pendingCount, syncing, triggerSync, initialized } = useSync()

  const navItems = [
    { href: '/scan', label: 'Scan', icon: '📱' },
    { href: '/laporan', label: 'Laporan', icon: '📊' },
    { href: '/setting', label: 'Pengaturan', icon: '⚙️' },
  ]

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <span className="text-xl">📿</span>
            <span className="hidden sm:inline text-base">Absensi Sholat</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  {/* Pending badge on Scan page */}
                  {item.href === '/scan' && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {/* Sync button */}
            {initialized && isOnline && (
              <button
                onClick={() => triggerSync()}
                disabled={syncing}
                title="Sinkronisasi sekarang"
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  syncing
                    ? 'bg-blue-50 text-blue-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {syncing ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin inline-block w-3 h-3 border border-blue-400 border-t-transparent rounded-full" />
                    Sync
                  </span>
                ) : (
                  '⟳ Sync'
                )}
              </button>
            )}

            {/* Online badge */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
