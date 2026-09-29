'use client'

import { useState, useEffect } from 'react'
import ScanSession from '@/components/scan/ScanSession'
import { useNotification } from '@/context/NotificationContext'

export default function ScanPage() {
  const { showNotification } = useNotification()
  const [sessionOpen, setSessionOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const prayerTimes = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

  const handleOpenSession = () => {
    if (!selectedTime) {
      showNotification('warning', 'Pilih waktu sholat terlebih dahulu')
      return
    }
    setSessionOpen(true)
  }

  const handleCloseSession = () => {
    setSessionOpen(false)
    setSelectedTime('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Scan Absensi</h1>
        <p className="text-gray-600">
          Buka sesi absensi untuk mengumpulkan scan QR santri
        </p>
      </div>

      {!sessionOpen ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Session Setup Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pilih Waktu Sholat
              </label>
              <div className="grid grid-cols-5 gap-3">
                {prayerTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tanggal
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleOpenSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              🔓 Buka Sesi Absen
            </button>
          </div>

          {/* Info Cards */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">📱 Cara Memulai</h3>
              <p className="text-sm text-blue-700">
                Pilih waktu sholat dan tanggal, kemudian klik "Buka Sesi Absen"
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-green-900 mb-2">📸 Scan QR</h3>
              <p className="text-sm text-green-700">
                Arahkan kamera ke QR code santri untuk scan
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-purple-900 mb-2">✓ Konfirmasi</h3>
              <p className="text-sm text-purple-700">
                Validasi visual dengan foto santri dari database
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ScanSession
          prayerTime={selectedTime}
          date={selectedDate}
          onClose={handleCloseSession}
        />
      )}
    </div>
  )
}
