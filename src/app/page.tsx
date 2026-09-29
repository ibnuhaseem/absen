import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sistem Absensi Sholat
          </h1>
          <p className="text-xl text-gray-600">
            Aplikasi absensi sholat 5 waktu santri berbasis QR Code
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Scan Feature */}
          <Link href="/scan">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Scan</h2>
              <p className="text-gray-600">
                Buka sesi absensi dan scan QR code santri dengan camera realtime. Validasi visual anti-joki dengan foto santri dari database.
              </p>
              <div className="mt-6">
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  Mulai Scanning →
                </span>
              </div>
            </div>
          </Link>

          {/* Report Feature */}
          <Link href="/laporan">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Laporan</h2>
              <p className="text-gray-600">
                Lihat rekap kehadiran santri dengan filter periode dan kelas. Modal detail log untuk setiap santri.
              </p>
              <div className="mt-6">
                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  Lihat Laporan →
                </span>
              </div>
            </div>
          </Link>

          {/* Settings Feature */}
          <Link href="/setting">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Pengaturan</h2>
              <p className="text-gray-600">
                Kelola data santri, upload foto, import CSV, dan cetak QR code massal. Backup & recovery data.
              </p>
              <div className="mt-6">
                <span className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                  Buka Pengaturan →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-lg p-12 mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Fitur Utama</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">QR Code Scanner</h4>
                <p className="text-gray-600 text-sm">Scanner QR code dengan kamera realtime & audio feedback</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">Offline-First</h4>
                <p className="text-gray-600 text-sm">Buffer lokal dengan IndexedDB, sync otomatis saat online</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">Validasi Anti-Joki</h4>
                <p className="text-gray-600 text-sm">Modal visual dengan foto santri dari Supabase Storage</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">Laporan Real-time</h4>
                <p className="text-gray-600 text-sm">Filter periode & kelas dengan statistik kehadiran</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">Manajemen Santri</h4>
                <p className="text-gray-600 text-sm">CRUD santri, upload foto, import CSV massal</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-4">✓</div>
              <div>
                <h4 className="font-bold text-gray-900">QR Code Printing</h4>
                <p className="text-gray-600 text-sm">Cetak kartu santri massal (Foto, NIM, Nama, QR Code)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-indigo-900 text-white rounded-lg shadow-lg p-12">
          <h3 className="text-3xl font-bold mb-8">Tech Stack</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Frontend</h4>
              <ul className="text-sm space-y-2">
                <li>• Next.js (App Router)</li>
                <li>• Tailwind CSS</li>
                <li>• html5-qrcode</li>
                <li>• IndexedDB (Offline)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Backend & Database</h4>
              <ul className="text-sm space-y-2">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Row Level Security (RLS)</li>
                <li>• Supabase Storage</li>
                <li>• Vercel Deployment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
