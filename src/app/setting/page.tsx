'use client'

import { useState } from 'react'
import { useNotification } from '@/context/NotificationContext'
import StudentManagement from '@/components/setting/StudentManagement'
import CSVImport from '@/components/setting/CSVImport'
import QRGenerator from '@/components/setting/QRGenerator'
import BackupRestore from '@/components/setting/BackupRestore'
import TermsAndConditions from '@/components/setting/TermsAndConditions'

export default function SettingPage() {
  const { showNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<string>('students')

  const tabs = [
    { id: 'students', label: 'Manajemen Santri', icon: '👥' },
    { id: 'csv', label: 'Import CSV', icon: '📤' },
    { id: 'qr', label: 'Cetak QR Code', icon: '🖨️' },
    { id: 'backup', label: 'Backup & Export', icon: '💾' },
    { id: 'terms', label: 'T&C & Privacy', icon: '📋' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Pengaturan</h1>
        <p className="text-gray-600">
          Kelola data santri, import CSV, cetak QR code, dan backup data
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg mb-8 overflow-x-auto">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'students' && <StudentManagement />}
          {activeTab === 'csv' && <CSVImport />}
          {activeTab === 'qr' && <QRGenerator />}
          {activeTab === 'backup' && <BackupRestore />}
          {activeTab === 'terms' && <TermsAndConditions />}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Pengaturan Lainnya</h3>

        <div className="space-y-6">
          {/* Online Status */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-semibold text-gray-900">Notifikasi Sinkronisasi</p>
              <p className="text-sm text-gray-600">Tampilkan notifikasi saat data berhasil disinkronisasi</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-6 h-6"
            />
          </div>

          {/* Alert Configuration */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-semibold text-gray-900">Alert ALPA</p>
              <p className="text-sm text-gray-600">Aktifkan alert ketika santri ditandai ALPA</p>
            </div>
            <input
              type="checkbox"
              className="w-6 h-6"
            />
          </div>

          {/* Prayer Time Reminders */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-semibold text-gray-900">Reminder Waktu Sholat</p>
              <p className="text-sm text-gray-600">Aktifkan pengingat sebelum waktu sholat dimulai</p>
            </div>
            <input
              type="checkbox"
              className="w-6 h-6"
            />
          </div>

          {/* Cache Management */}
          <div>
            <p className="font-semibold text-gray-900 mb-3">Kelola Cache</p>
            <button
              onClick={() => showNotification('info', 'Cache akan dihapus dan halaman di-reload')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🗑️ Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
