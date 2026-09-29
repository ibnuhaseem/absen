'use client'

import { useState, useRef } from 'react'
import { useNotification } from '@/context/NotificationContext'
import { processCSVFile, downloadTemplate, type ImportResult } from '@/lib/csv-service'

export default function CSVImport() {
  const { showNotification } = useNotification()
  const [drag, setDrag] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showNotification('error', 'Format file harus CSV')
      return
    }
    setResult(null)
    setProcessing(true)
    try {
      const res = await processCSVFile(file)
      setResult(res)
      if (res.success) {
        showNotification('success', `✓ ${res.imported} santri berhasil diimpor`)
      } else {
        showNotification('error', `Impor gagal: ${res.errors[0] || 'unknown error'}`)
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal memproses file CSV')
    } finally {
      setProcessing(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-6">
      {/* Template download */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-900">Template CSV</p>
          <p className="text-xs text-blue-700 mt-0.5">Unduh template lalu isi data santri sesuai format</p>
        </div>
        <button
          onClick={() => { downloadTemplate(); showNotification('success', 'Template diunduh') }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          📥 Unduh Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          drag ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {processing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-gray-600">Memproses file CSV...</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-3">📤</div>
            <p className="font-semibold text-gray-700">Seret file CSV ke sini</p>
            <p className="text-sm text-gray-400 mt-1">atau klik untuk memilih file</p>
          </>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div className="text-green-800">
              <p className="font-semibold">✓ Import berhasil</p>
              <p className="text-sm mt-1">{result.imported} santri ditambahkan / diperbarui</p>
              {result.skipped > 0 && <p className="text-sm">⚠ {result.skipped} baris dilewati</p>}
            </div>
          ) : (
            <div className="text-red-800">
              <p className="font-semibold">✕ Import gagal</p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                {result.errors.slice(0, 5).map((e: string, i: number) => <li key={i}>{e}</li>)}
                {result.errors.length > 5 && <li>...dan {result.errors.length - 5} error lainnya</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Format reference */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Format CSV yang Diharapkan</h3>
        <pre className="bg-white border rounded-lg p-3 text-xs font-mono overflow-x-auto text-gray-700">
{`nim,nama,kelas,foto_url
202607001,Ahmad Fauzan,7,
202607002,Muhammad Rizky,7,
202608001,Fathur Rahman,8,
202609001,Zaid Abdullah,9,`}
        </pre>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>• <strong>nim</strong> — wajib, harus unik</div>
          <div>• <strong>nama</strong> — wajib</div>
          <div>• <strong>kelas</strong> — wajib: 7, 8, atau 9</div>
          <div>• <strong>foto_url</strong> — opsional</div>
        </div>
      </div>
    </div>
  )
}
