'use client'

import { useState } from 'react'
import { useNotification } from '@/context/NotificationContext'
import QRCode from 'qrcode.react'

interface StudentQR {
  nim: string
  nama: string
  kelas: string
}

export default function QRGenerator() {
  const { showNotification } = useNotification()
  const [selectedStudents, setSelectedStudents] = useState<StudentQR[]>([
    { nim: '202607001', nama: 'Ahmad Fauzan', kelas: '7' },
    { nim: '202607002', nama: 'Muhammad Rizky', kelas: '7' },
    { nim: '202608001', nama: 'Fathur Rahman', kelas: '8' },
  ])
  const [previewMode, setPreviewMode] = useState(false)

  const handleGeneratePDF = () => {
    showNotification('info', 'Fitur cetak PDF sedang dikembangkan')
  }

  const handleDownloadQR = (nim: string) => {
    showNotification('success', `QR code untuk ${nim} diunduh`)
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-4">
        <button
          onClick={() => setPreviewMode(false)}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            !previewMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          👁️ Preview
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            previewMode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          🖨️ Cetak
        </button>
      </div>

      {/* Info */}
      <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-600">
        <p className="text-sm text-green-900">
          Total QR yang akan dicetak: <strong>{selectedStudents.length}</strong>
        </p>
      </div>

      {/* Preview Mode */}
      {!previewMode ? (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Preview QR Code</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {selectedStudents.map((student) => (
              <div key={student.nim} className="border rounded-lg p-4 text-center">
                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <QRCode
                    value={student.nim}
                    size={128}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="font-bold text-gray-900">{student.nama}</p>
                <p className="text-sm text-gray-600">{student.nim}</p>
                <p className="text-xs text-gray-500">Kelas {student.kelas}</p>
                <button
                  onClick={() => handleDownloadQR(student.nim)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                >
                  ⬇️ Download
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Cetak Massal</h3>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>A4 Grid (3x5)</option>
                <option>A4 Grid (2x4)</option>
                <option>Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran QR Code
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Kecil (3cm)</option>
                <option>Sedang (5cm)</option>
                <option>Besar (7cm)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informasi Santri
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Lengkap (Nama + NIM + Kelas)</option>
                <option>Minimal (NIM saja)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGeneratePDF}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🖨️ Cetak ke PDF ({selectedStudents.length} kartu)
          </button>

          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600 text-sm text-blue-900">
            💡 Tip: Format A4 Grid (3x5) dengan ukuran sedang cocok untuk 15 kartu per halaman
          </div>
        </div>
      )}
    </div>
  )
}
