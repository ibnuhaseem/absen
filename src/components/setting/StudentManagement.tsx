'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useNotification } from '@/context/NotificationContext'
import {
  getAllSantri,
  createSantri,
  updateSantri,
  deleteSantri,
  uploadStudentPhoto,
  deleteStudentPhoto,
  type Santri,
} from '@/lib/supabase-service'
import { saveSantri } from '@/lib/indexeddb'

interface FormState {
  nim: string
  nama: string
  kelas: string
  foto_url: string
  is_active: boolean
}

const EMPTY_FORM: FormState = { nim: '', nama: '', kelas: '7', foto_url: '', is_active: true }

export default function StudentManagement() {
  const { showNotification } = useNotification()

  const [students, setStudents] = useState<Santri[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editNim, setEditNim] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadStudents() }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const data = await getAllSantri()
      setStudents(data)
      // Keep IndexedDB in sync
      await saveSantri(data.filter((s) => s.is_active))
    } catch {
      showNotification('error', 'Gagal memuat data santri')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditNim(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview(null)
    setShowForm(true)
  }

  const openEdit = (s: Santri) => {
    setEditNim(s.nim)
    setForm({ nim: s.nim, nama: s.nama, kelas: s.kelas, foto_url: s.foto_url || '', is_active: s.is_active })
    setPhotoFile(null)
    setPhotoPreview(s.foto_url)
    setShowForm(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'Ukuran foto maksimal 2 MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.nim.trim() || !form.nama.trim()) {
      showNotification('warning', 'NIM dan Nama wajib diisi')
      return
    }
    setSaving(true)
    try {
      let foto_url = form.foto_url || null

      // Upload new photo if selected
      if (photoFile) {
        foto_url = await uploadStudentPhoto(form.nim, photoFile)
      }

      if (editNim) {
        await updateSantri(editNim, { nama: form.nama, kelas: form.kelas, foto_url, is_active: form.is_active })
        showNotification('success', `${form.nama} diperbarui`)
      } else {
        // Check duplicate NIM
        if (students.some((s) => s.nim === form.nim)) {
          showNotification('error', `NIM ${form.nim} sudah terdaftar`)
          return
        }
        await createSantri({ nim: form.nim, nama: form.nama, kelas: form.kelas, foto_url, is_active: true })
        showNotification('success', `${form.nama} ditambahkan`)
      }

      setShowForm(false)
      await loadStudents()
    } catch (err: any) {
      showNotification('error', err?.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (s: Santri) => {
    try {
      await updateSantri(s.nim, { is_active: !s.is_active })
      showNotification('success', `${s.nama} ${s.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      await loadStudents()
    } catch {
      showNotification('error', 'Gagal mengubah status')
    }
  }

  const handleDelete = async (s: Santri) => {
    if (!confirm(`Hapus ${s.nama}? Data absensi tetap tersimpan.`)) return
    try {
      if (s.foto_url) await deleteStudentPhoto(s.foto_url)
      await deleteSantri(s.nim)
      showNotification('success', `${s.nama} dihapus`)
      await loadStudents()
    } catch {
      showNotification('error', 'Gagal menghapus santri')
    }
  }

  const filtered = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nim.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cari nama atau NIM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          + Tambah Santri
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>Total: <strong>{students.length}</strong></span>
        <span>Aktif: <strong className="text-green-600">{students.filter((s) => s.is_active).length}</strong></span>
        <span>Nonaktif: <strong className="text-red-500">{students.filter((s) => !s.is_active).length}</strong></span>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">{editNim ? 'Edit Santri' : 'Tambah Santri Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">NIM *</label>
              <input
                type="text"
                value={form.nim}
                onChange={(e) => setForm({ ...form, nim: e.target.value })}
                disabled={!!editNim}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kelas *</label>
              <select
                value={form.kelas}
                onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Foto Santri</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {photoFile ? `📎 ${photoFile.name}` : 'Klik untuk pilih foto'}
              </button>
              {photoPreview && (
                <div className="mt-2 relative w-16 h-16 rounded-full overflow-hidden border">
                  <Image src={photoPreview} alt="preview" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? '⏳ Menyimpan...' : editNim ? '✓ Perbarui' : '+ Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Foto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">NIM</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nama</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {search ? 'Tidak ada hasil pencarian' : 'Belum ada data santri'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.nim} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {s.foto_url ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image src={s.foto_url} alt={s.nama} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">👤</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{s.nim}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                    <td className="px-4 py-3 text-gray-600">{s.kelas}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          s.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(s)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
