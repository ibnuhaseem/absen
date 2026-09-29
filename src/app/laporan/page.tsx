'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNotification } from '@/context/NotificationContext'
import { getLogAbsensi, getAttendanceStats, type LogAbsensi } from '@/lib/supabase-service'
import { exportData } from '@/lib/export-service'

type PeriodType = 'harian' | 'mingguan' | 'bulanan'
type KelasFilter = 'semua' | '7' | '8' | '9'

function getPeriodDates(type: PeriodType, anchor: string): { start: string; end: string } {
  const d = new Date(anchor)
  if (type === 'harian') {
    return { start: anchor, end: anchor }
  }
  if (type === 'mingguan') {
    const day = d.getDay() // 0=Sun
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((day + 6) % 7))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
  }
  // bulanan
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

function statusColor(status: string) {
  if (status === 'HADIR') return 'bg-green-100 text-green-800'
  if (status === 'TELAT') return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function LaporanPage() {
  const { showNotification } = useNotification()

  const [period, setPeriod] = useState<PeriodType>('harian')
  const [anchor, setAnchor] = useState(new Date().toISOString().split('T')[0])
  const [kelas, setKelas] = useState<KelasFilter>('semua')

  const [logs, setLogs] = useState<LogAbsensi[]>([])
  const [stats, setStats] = useState({ hadir: 0, telat: 0, alpa: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<LogAbsensi | null>(null)
  const [exporting, setExporting] = useState(false)

  const { start, end } = getPeriodDates(period, anchor)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [logsData, statsData] = await Promise.all([
        getLogAbsensi({ startDate: start, endDate: end, kelas }),
        getAttendanceStats({ startDate: start, endDate: end, kelas }),
      ])
      setLogs(logsData)
      setStats(statsData)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }, [start, end, kelas, showNotification])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(true)
    try {
      await exportData({ startDate: start, endDate: end, kelas, format, type: 'attendance' })
      showNotification('success', `Export ${format.toUpperCase()} berhasil`)
    } catch (err) {
      console.error(err)
      showNotification('error', `Gagal export ${format.toUpperCase()}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laporan Kehadiran</h1>
        <p className="text-gray-500 mt-1">Rekap absensi sholat santri</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Period type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Periode</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
            </select>
          </div>

          {/* Anchor date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value as KelasFilter)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>

          {/* Export */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Export</label>
            <div className="flex gap-1.5">
              {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  disabled={exporting || loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold py-2 rounded-lg text-xs transition-colors uppercase"
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date range info */}
        <p className="text-xs text-gray-400 mt-3">
          Menampilkan data: <strong>{start}</strong>
          {start !== end && <> s/d <strong>{end}</strong></>}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hadir', value: stats.hadir, color: 'green', icon: '✓' },
          { label: 'Telat', value: stats.telat, color: 'yellow', icon: '⏱' },
          { label: 'Alpa', value: stats.alpa, color: 'red', icon: '✕' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`bg-${color}-50 rounded-xl p-5 shadow`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-4xl font-bold text-${color}-600 mt-1`}>{value}</p>
              </div>
              <span className={`text-2xl text-${color}-400`}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Sholat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">NIM</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Kelas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Jam Scan</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Tidak ada data untuk periode ini
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(log)}
                    >
                      <td className="px-4 py-3 text-gray-700">{log.tanggal}</td>
                      <td className="px-4 py-3 text-gray-700">{log.waktu_sholat}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{log.nim}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{log.nama}</td>
                      <td className="px-4 py-3 text-gray-600">{log.kelas}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{log.waktu_scan || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-5">Detail Log</h2>
            <dl className="space-y-3 text-sm">
              {[
                ['NIM', selected.nim],
                ['Nama', selected.nama],
                ['Kelas', selected.kelas],
                ['Tanggal', selected.tanggal],
                ['Waktu Sholat', selected.waktu_sholat],
                ['Waktu Scan', selected.waktu_scan || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor(selected.status)}`}>
                    {selected.status}
                  </span>
                </dd>
              </div>
            </dl>
            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
