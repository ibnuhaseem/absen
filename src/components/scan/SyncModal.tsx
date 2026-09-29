'use client'

import { useState } from 'react'
import { useNotification } from '@/context/NotificationContext'
import { syncPendingLogs } from '@/lib/sync-service'
import type { ScannedEntry } from './ScanSession'

interface Props {
  scanned: ScannedEntry[]
  prayerTime: string
  date: string
  result: { hadir: number; telat: number; alpa: number; total: number }
  onDone: () => void
}

export default function SyncModal({ scanned, prayerTime, date, result, onDone }: Props) {
  const { showNotification } = useNotification()
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null)
  const [retries, setRetries] = useState(0)

  const doSync = async () => {
    setSyncing(true)
    try {
      const res = await syncPendingLogs()
      setSyncResult(res)
      setSyncDone(true)
      if (res.failed === 0) {
        showNotification('success', `✓ Sinkronisasi berhasil (${res.synced} records)`)
      } else {
        showNotification('warning', `⚠️ ${res.failed} records gagal disinkronisasi`)
      }
    } catch (err) {
      console.error(err)
      showNotification('error', '✕ Sinkronisasi gagal')
      setSyncResult({ synced: 0, failed: scanned.length })
    } finally {
      setSyncing(false)
    }
  }

  const handleRetry = () => {
    setRetries((r) => r + 1)
    setSyncDone(false)
    setSyncResult(null)
    doSync()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-white">
          <h2 className="text-lg font-bold">Sesi Selesai</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {prayerTime} — {date}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="text-center bg-green-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">{result.hadir}</p>
            <p className="text-xs text-gray-500 mt-1">Hadir</p>
          </div>
          <div className="text-center bg-yellow-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-yellow-600">{result.telat}</p>
            <p className="text-xs text-gray-500 mt-1">Telat</p>
          </div>
          <div className="text-center bg-red-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-red-600">{result.alpa}</p>
            <p className="text-xs text-gray-500 mt-1">Alpa</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 -mt-2 pb-4">
          Total santri terdaftar: <strong>{result.total}</strong>
        </p>

        {/* Sync status */}
        <div className="px-6 pb-6 space-y-3">
          {!syncDone && !syncing && syncResult === null && (
            <button
              onClick={doSync}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              ⬆ Sinkronisasi ke Server
            </button>
          )}

          {syncing && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-gray-600 text-sm">Menyinkronisasi data...</span>
            </div>
          )}

          {syncDone && syncResult && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                syncResult.failed === 0
                  ? 'bg-green-50 text-green-800'
                  : 'bg-yellow-50 text-yellow-800'
              }`}
            >
              {syncResult.failed === 0
                ? `✓ ${syncResult.synced} records berhasil disinkronisasi`
                : `⚠ ${syncResult.synced} berhasil, ${syncResult.failed} gagal`}
            </div>
          )}

          {syncDone && syncResult && syncResult.failed > 0 && retries < 5 && (
            <button
              onClick={handleRetry}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              🔄 Retry ({retries}/5)
            </button>
          )}

          {/* Data is always saved locally, so done is safe */}
          <button
            onClick={onDone}
            disabled={syncing}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Selesai
          </button>

          {!syncDone && (
            <p className="text-center text-xs text-gray-400">
              Data sudah tersimpan offline. Sync bisa dilakukan nanti.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
