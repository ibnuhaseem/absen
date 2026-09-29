'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/context/NotificationContext'
import { createBackup, listBackups, restoreBackup } from '@/lib/supabase-service'
import { exportData } from '@/lib/export-service'

type Tab = 'backup' | 'export' | 'restore'

interface BackupFile {
  name: string
  created_at: string
  size: number
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BackupRestore() {
  const { showNotification } = useNotification()
  const [tab, setTab] = useState<Tab>('backup')
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [restoringName, setRestoringName] = useState<string | null>(null)

  // Export form state
  const [exportType, setExportType] = useState<'attendance' | 'students'>('attendance')
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [exportKelas, setExportKelas] = useState('semua')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (tab === 'backup' || tab === 'restore') fetchBackups()
  }, [tab])

  const fetchBackups = async () => {
    setLoadingBackups(true)
    try {
      const data = await listBackups()
      setBackups(data)
    } catch {
      showNotification('error', 'Gagal memuat daftar backup')
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      const fileName = await createBackup()
      showNotification('success', `✓ Backup berhasil dibuat: ${fileName}`)
      await fetchBackups()
    } catch {
      showNotification('error', 'Gagal membuat backup')
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestore = async (name: string) => {
    if (!confirm(`Restore dari backup ${name}?\n\nData santri akan diganti dengan data backup. Data absensi tidak terpengaruh.`)) return
    setRestoringName(name)
    try {
      await restoreBackup(name)
      showNotification('success', '✓ Restore berhasil')
    } catch {
      showNotification('error', 'Gagal melakukan restore')
    } finally {
      setRestoringName(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportData({ startDate, endDate, kelas: exportKelas, format: exportFormat, type: exportType })
      showNotification('success', 'Export berhasil diunduh')
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal export data')
    } finally {
      setExporting(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'backup', label: '💾 Backup' },
    { id: 'export', label: '📤 Export Data' },
    { id: 'restore', label: '📥 Restore' },
  ]

  return (
    <div className="space-y-5">
      {/* Tab nav */}
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Backup ── */}
      {tab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Backup Manual</p>
              <p className="text-xs text-blue-700 mt-0.5">Simpan snapshot santri & log ke Supabase Storage</p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {creatingBackup ? '⏳ Membuat...' : '💾 Backup Sekarang'}
            </button>
          </div>

          <h3 className="font-semibold text-gray-800">Riwayat Backup</h3>

          {loadingBackups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Belum ada backup</p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.name} className="bg-gray-50 border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">📅 {b.name.replace('.json', '')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtSize(b.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Export ── */}
      {tab === 'export' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Jenis Data</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as 'attendance' | 'students')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="attendance">Log Absensi</option>
                <option value="students">Master Santri</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel (XLSX)</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            {exportType === 'attendance' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Dari Tanggal</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Hingga Tanggal</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kelas</label>
                  <select value={exportKelas} onChange={(e) => setExportKelas(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="semua">Semua</option>
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {exporting ? '⏳ Mengexport...' : '📤 Download Export'}
          </button>
        </div>
      )}

      {/* ── Restore ── */}
      {tab === 'restore' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-semibold text-red-800">⚠ Peringatan</p>
            <p className="text-sm text-red-700 mt-1">
              Restore akan mengganti data santri dengan versi dari backup. Data log absensi tidak terpengaruh. Proses ini tidak dapat dibatalkan.
            </p>
          </div>

          {loadingBackups ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Tidak ada backup tersedia</p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.name} className="bg-gray-50 border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">📅 {b.name.replace('.json', '')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtSize(b.size)}</p>
                  </div>
                  <button
                    onClick={() => handleRestore(b.name)}
                    disabled={restoringName === b.name}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {restoringName === b.name ? '⏳...' : '📥 Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
