'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNotification } from '@/context/NotificationContext'
import ValidationModal from './ValidationModal'
import SyncModal from './SyncModal'
import { getLocalStudents, closeSessionAndSync } from '@/lib/sync-service'
import type { Santri } from '@/lib/supabase-service'

interface ScanSessionProps {
  prayerTime: string
  date: string
  onClose: () => void
}

export interface ScannedEntry {
  nim: string
  nama: string
  kelas: string
  foto_url: string | null
  waktu_scan: string
}

export default function ScanSession({ prayerTime, date, onClose }: ScanSessionProps) {
  const { showNotification } = useNotification()

  const [studentMap, setStudentMap] = useState<Map<string, Santri>>(new Map())
  const [scanned, setScanned] = useState<ScannedEntry[]>([])
  const [pending, setPending] = useState<ScannedEntry | null>(null) // waiting for anti-joki confirm
  const [sessionResult, setSessionResult] = useState<{
    hadir: number; telat: number; alpa: number; total: number
  } | null>(null)
  const [closing, setClosing] = useState(false)

  // Keep a ref so onScanSuccess always reads fresh state without stale closure
  const scannedRef = useRef<ScannedEntry[]>([])
  const studentMapRef = useRef<Map<string, Santri>>(new Map())
  const qrRef = useRef<Html5Qrcode | null>(null)

  // Sync ref whenever state changes
  useEffect(() => { scannedRef.current = scanned }, [scanned])
  useEffect(() => { studentMapRef.current = studentMap }, [studentMap])

  // Load student cache
  useEffect(() => {
    getLocalStudents().then((students: Santri[]) => {
      const map = new Map<string, Santri>(students.map((s) => [s.nim, s]))
      setStudentMap(map)
      studentMapRef.current = map
    })
  }, [])

  // Start scanner
  useEffect(() => {
    const startScanner = async () => {
      try {
        qrRef.current = new Html5Qrcode('qr-reader')
        await qrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          handleScanSuccess,
          () => {} // suppress per-frame errors
        )
      } catch {
        showNotification('error', 'Gagal membuka kamera. Izinkan akses kamera di browser.')
      }
    }
    startScanner()
    return () => {
      qrRef.current?.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const beep = useCallback((freq: number, dur: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.start()
      osc.stop(ctx.currentTime + dur)
    } catch {}
  }, [])

  // Uses ref so it never has a stale closure over `scanned`
  const handleScanSuccess = useCallback((raw: string) => {
    const nim = raw.trim()
    if (!nim || nim.length < 3) {
      beep(300, 0.2)
      showNotification('error', '❌ QR Code tidak valid')
      return
    }

    // Duplicate check via ref
    if (scannedRef.current.some((s) => s.nim === nim)) {
      beep(300, 0.2)
      showNotification('warning', `⚠️ ${nim} sudah ter-scan`)
      return
    }

    const student = studentMapRef.current.get(nim)
    if (!student) {
      beep(300, 0.2)
      showNotification('error', '❌ Santri tidak ditemukan dalam database')
      return
    }
    if (!student.is_active) {
      beep(300, 0.2)
      showNotification('error', '❌ Santri sudah tidak aktif')
      return
    }

    beep(800, 0.1)

    const now = new Date()
    const waktu_scan = now.toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })

    const entry: ScannedEntry = {
      nim: student.nim,
      nama: student.nama,
      kelas: student.kelas,
      foto_url: student.foto_url,
      waktu_scan,
    }

    // Show anti-joki modal before confirming
    setPending(entry)
  }, [beep, showNotification])

  const handleValidationConfirm = (confirmed: boolean) => {
    if (!pending) return
    if (confirmed) {
      setScanned((prev) => {
        const next = [...prev, pending!]
        scannedRef.current = next
        return next
      })
      showNotification('success', `✓ ${pending.nama} ditambahkan`)
    } else {
      beep(300, 0.2)
      showNotification('info', `${pending.nama} dibatalkan`)
    }
    setPending(null)
  }

  const handleCloseSession = async () => {
    if (scanned.length === 0) {
      showNotification('warning', 'Belum ada santri yang di-scan')
      return
    }
    setClosing(true)
    try {
      const result = await closeSessionAndSync(prayerTime, date, scanned)
      setSessionResult(result)
    } catch (err) {
      console.error(err)
      showNotification('error', 'Gagal menyimpan sesi. Data tersimpan offline.')
      // Still show result modal so user can see what happened
      setSessionResult({ hadir: scanned.length, telat: 0, alpa: 0, total: scanned.length })
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner */}
      <div className="bg-black rounded-xl overflow-hidden shadow-lg">
        <div id="qr-reader" className="w-full" style={{ minHeight: 360 }} />
      </div>

      {/* Session info bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">Waktu Sholat</p>
          <p className="text-xl font-bold text-blue-600">{prayerTime}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">Tanggal</p>
          <p className="text-xl font-bold text-green-600">{date}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500">Ter-scan</p>
          <p className="text-xl font-bold text-purple-600">{scanned.length}</p>
        </div>
      </div>

      {/* Scanned list */}
      {scanned.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-800 mb-3">
            Santri Ter-scan ({scanned.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
            {scanned.map((s) => (
              <div
                key={s.nim}
                className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm"
              >
                <p className="font-semibold text-gray-900 truncate">{s.nama}</p>
                <p className="text-gray-500 text-xs">{s.nim}</p>
                <p className="text-gray-400 text-xs">{s.waktu_scan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleCloseSession}
          disabled={scanned.length === 0 || closing}
          className="flex-2 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {closing ? '⏳ Menyimpan...' : `✓ Tutup Sesi (${scanned.length} scan)`}
        </button>
      </div>

      {/* Anti-joki validation modal */}
      {pending && (
        <ValidationModal student={pending} onConfirm={handleValidationConfirm} />
      )}

      {/* Session result & sync modal */}
      {sessionResult && (
        <SyncModal
          scanned={scanned}
          prayerTime={prayerTime}
          date={date}
          result={sessionResult}
          onDone={onClose}
        />
      )}
    </div>
  )
}
