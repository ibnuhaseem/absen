'use client'

import { useState } from 'react'
import { useNotification } from '@/context/NotificationContext'
import StudentManagement from '@/components/setting/StudentManagement'
import CSVImport from '@/components/setting/CSVImport'
import QRGenerator from '@/components/setting/QRGenerator'
import BackupRestore from '@/components/setting/BackupRestore'

export default function SettingPage() {
  const { showNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<string>('students')

  const tabs = [
    { id: 'students', label: 'Master Santri', icon: '👥' },
    { id: 'csv', label: 'Import CSV', icon: '📤' },
    { id: 'qr', label: 'Cetak QR', icon: '🖨️' },
    { id: 'backup', label: 'Backup', icon: '💾' },
  ]

  return (
    <div className="space-y-4 pb-4">
      {/* Cloud Sync Status Header Card */}
      <div className="mx-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center flex-shrink-0 text-lg">
              ☁️
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-green-900 text-sm">Google Apps Script API</h3>
              <p className="flex items-center gap-1.5 text-xs text-green-700 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold uppercase tracking-wide">TERHUBUNG REALTIME</span>
              </p>
              <p className="text-xs text-green-600 mt-1.5">
                <span className="opacity-70">Spreadsheet: </span>
                <code className="font-mono bg-green-200/50 px-1.5 py-0.5 rounded text-green-800 font-semibold">
                  1BxiMVs...9xL4K-e_GAS
                </code>
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex-shrink-0 whitespace-nowrap">
            🟢 Online
          </span>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="mx-4 grid grid-cols-3 gap-3">
        <button
          onClick={() => showNotification('success', 'Data disinkronkan ke Spreadsheet')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-2 rounded-xl transition-colors shadow-sm active:scale-95 text-center"
        >
          <span className="text-xl block mb-1">☁️</span>
          <span className="text-xs font-semibold">Paksa Sync</span>
        </button>
        <button
          onClick={() => showNotification('info', 'Mode offline terdeteksi')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-2 rounded-xl transition-colors shadow-sm active:scale-95 text-center"
        >
          <span className="text-xl block mb-1">🔄</span>
          <span className="text-xs font-semibold">Sinkronisasi</span>
        </button>
        <button
          onClick={() => showNotification('warning', 'File cache akan dihapus')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-2 rounded-xl transition-colors shadow-sm active:scale-95 text-center"
        >
          <span className="text-xl block mb-1">🗑️</span>
          <span className="text-xs font-semibold">Clear Cache</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mx-4 bg-gray-100 rounded-2xl p-1.5 flex gap-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'csv' && <CSVImport />}
        {activeTab === 'qr' && <QRGenerator />}
        {activeTab === 'backup' && <BackupRestore />}
      </div>

      {/* Settings Section Header */}
      <div className="mx-4 mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 px-2 mb-3">
          ⚙️ Pengaturan Umum
        </h3>
      </div>

      {/* Settings Cards */}
      <div className="mx-4 space-y-2.5">
        {/* Notification Setting */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Notifikasi Sinkronisasi</p>
            <p className="text-xs text-gray-600 mt-0.5">Tampilkan notif saat data disinkronkan</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
        </div>

        {/* Alert ALPA Setting */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Alert Santri ALPA</p>
            <p className="text-xs text-gray-600 mt-0.5">Notifikasi saat ada santri ditandai ALPA</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={false}
            className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
        </div>

        {/* Prayer Reminder Setting */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Reminder Waktu Sholat</p>
            <p className="text-xs text-gray-600 mt-0.5">Pengingat sebelum waktu sholat dimulai</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={false}
            className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
        </div>

        {/* Auto Sync Setting */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Auto Sync Offline</p>
            <p className="text-xs text-gray-600 mt-0.5">Sinkronisasi otomatis saat kembali online</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
        </div>

        {/* Debug Mode Setting */}
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Mode Debug</p>
            <p className="text-xs text-gray-600 mt-0.5">Tampilkan log aplikasi di console</p>
          </div>
          <input
            type="checkbox"
            defaultChecked={false}
            className="w-5 h-5 accent-blue-600 flex-shrink-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mx-4 mt-6 pt-4 border-t border-red-200">
        <h3 className="text-xs font-bold uppercase tracking-widest text-red-600 px-2 mb-3">
          ⚠️ Zona Berbahaya
        </h3>
      </div>

      {/* Danger Actions */}
      <div className="mx-4 space-y-2 pb-4">
        <button
          onClick={() => {
            if (confirm('Hapus semua data lokal? Tindakan ini tidak dapat dibatalkan.')) {
              showNotification('warning', 'Data lokal dihapus. Refresh halaman...')
              setTimeout(() => window.location.reload(), 1500)
            }
          }}
          className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 font-bold py-3 px-4 rounded-xl transition-colors active:scale-95"
        >
          <span>🗑️ Hapus Semua Data Lokal</span>
        </button>

        <button
          onClick={() => {
            if (confirm('Reset aplikasi ke pengaturan awal? Semua data akan dihapus.')) {
              showNotification('error', 'Reset aplikasi...')
              setTimeout(() => {
                localStorage.clear()
                window.location.href = '/'
              }, 1500)
            }
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors active:scale-95"
        >
          <span>🔴 Reset Aplikasi (Hati-hati!)</span>
        </button>
      </div>
    </div>
  )
}
