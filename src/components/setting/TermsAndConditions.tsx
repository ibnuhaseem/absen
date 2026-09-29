'use client'

import { useState } from 'react'

export default function TermsAndConditions() {
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  return (
    <div className="space-y-6">
      {/* Terms Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b">
          <button className="flex-1 px-6 py-4 font-semibold border-b-2 border-blue-600 text-blue-600">
            📋 Terms & Conditions
          </button>
          <button className="flex-1 px-6 py-4 font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-900">
            🔒 Privacy Policy
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          <section>
            <h3 className="font-bold text-lg text-gray-900 mb-3">Syarat & Ketentuan Penggunaan</h3>
            <p className="text-gray-700 text-sm mb-4">
              Dengan menggunakan aplikasi Sistem Absensi Sholat ini, Anda setuju dengan semua syarat dan ketentuan yang berlaku.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">1. Penyimpanan Foto Santri</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              <li>Foto disimpan secara aman di Supabase Storage (encrypted at rest)</li>
              <li>Foto hanya diakses oleh admin & aplikasi untuk validasi presensi</li>
              <li>Foto tidak akan dishare ke pihak ketiga tanpa persetujuan eksplisit</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">2. Penggunaan Data Kehadiran</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              <li>Attendance logs digunakan untuk pelaporan kehadiran & evaluasi</li>
              <li>Data tidak akan dijual atau digunakan untuk marketing/tracking tanpa consent</li>
              <li>Data hanya diakses oleh administrator yang berwenang</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">3. Retensi Data</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              <li>Logs kehadiran disimpan selama 1 tahun akademik</li>
              <li>Data santri disimpan secara permanen (untuk audit trail)</li>
              <li>Foto akan dihapus ketika santri dikeluarkan atau request penghapusan</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">4. Keamanan</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              <li>Semua komunikasi ke server menggunakan HTTPS (TLS 1.3+)</li>
              <li>Row Level Security (RLS) untuk perlindungan akses data</li>
              <li>Environment variables sensitif tidak pernah di-log atau di-expose</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">5. Hak Pengguna</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              <li>Santri atau wali dapat request penghapusan data (right to erasure)</li>
              <li>Soft delete digunakan untuk menjaga audit trail</li>
              <li>Pengguna dapat export data mereka kapan saja</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">6. Perubahan Terms</h4>
            <p className="text-gray-700 text-sm">
              Kami berhak mengubah terms & conditions ini kapan saja. Perubahan akan diberi tahu kepada user melalui update aplikasi.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">7. Consent untuk Santri Anak</h4>
            <p className="text-gray-700 text-sm">
              Karena santri mungkin di bawah 18 tahun, consent harus dari wali santri atau sekolah. 
              Sistem tidak akan request consent langsung dari santri.
            </p>
          </section>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-5 h-5 mt-1"
          />
          <span className="text-gray-700 text-sm">
            Saya setuju dengan Syarat & Ketentuan, Privacy Policy, dan penggunaan data sebagaimana yang dijelaskan di atas.
          </span>
        </label>
      </div>

      {/* Customization Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-gray-900 mb-4">Kustomisasi Terms & Conditions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Admin dapat menyesuaikan Terms & Conditions sesuai kebijakan sekolah lokal
        </p>
        <textarea
          defaultValue="Kebijakan sekolah tambahan akan ditampilkan di sini..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={6}
        />
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          💾 Simpan Perubahan
        </button>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-gray-900 mb-4">Audit Log</h3>
        <p className="text-sm text-gray-600 mb-4">
          Riwayat akses foto dan data santri (fitur akan tersedia di update berikutnya)
        </p>
        <div className="bg-gray-50 rounded p-4 text-center text-gray-500 text-sm">
          Audit log masih dalam tahap pengembangan
        </div>
      </div>
    </div>
  )
}
