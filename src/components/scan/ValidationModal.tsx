'use client'

import Image from 'next/image'
import type { ScannedEntry } from './ScanSession'

interface Props {
  student: ScannedEntry
  onConfirm: (confirmed: boolean) => void
}

export default function ValidationModal({ student, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={() => onConfirm(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">Validasi Anti-Joki</p>
          <p className="text-lg font-bold mt-1">{student.waktu_scan}</p>
        </div>

        {/* Photo */}
        <div className="flex justify-center bg-gray-100 py-6">
          {student.foto_url ? (
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={student.foto_url}
                alt={student.nama}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-6xl text-gray-400">👤</span>
            </div>
          )}
        </div>

        {/* Student info */}
        <div className="px-6 py-4 text-center space-y-1">
          <p className="text-xl font-bold text-gray-900">{student.nama}</p>
          <p className="text-gray-500 text-sm">{student.nim}</p>
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            Kelas {student.kelas}
          </span>
        </div>

        {/* Question */}
        <p className="text-center text-gray-600 text-sm px-6 pb-2">
          Apakah wajah santri ini sesuai dengan yang hadir?
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <button
            onClick={() => onConfirm(false)}
            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl transition-colors"
          >
            ✕ Bukan
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            ✓ Benar
          </button>
        </div>
      </div>
    </div>
  )
}
