import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — avoids "supabaseUrl is required" crash at build time
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  _client = createClient(url, key)
  return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  },
})

// Types
export interface Santri {
  nim: string
  nama: string
  kelas: string
  foto_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LogAbsensi {
  id?: string
  tanggal: string
  waktu_sholat: 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya'
  nim: string
  nama: string
  kelas: string
  status: 'HADIR' | 'TELAT' | 'ALPA'
  waktu_scan: string
  sync_at?: string
}

// ==================== SANTRI ====================

export async function getSantri(): Promise<Santri[]> {
  const { data, error } = await supabase
    .from('santri')
    .select('*')
    .eq('is_active', true)
    .order('nama', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getAllSantri(): Promise<Santri[]> {
  const { data, error } = await supabase
    .from('santri')
    .select('*')
    .order('nama', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getSantriByNim(nim: string): Promise<Santri | null> {
  const { data, error } = await supabase
    .from('santri')
    .select('*')
    .eq('nim', nim)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getSantriByKelas(kelas: string): Promise<Santri[]> {
  const { data, error } = await supabase
    .from('santri')
    .select('*')
    .eq('kelas', kelas)
    .eq('is_active', true)
    .order('nama', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createSantri(
  santri: Omit<Santri, 'created_at' | 'updated_at'>
): Promise<Santri> {
  const { data, error } = await supabase
    .from('santri')
    .insert(santri)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSantri(
  nim: string,
  updates: Partial<Omit<Santri, 'nim' | 'created_at' | 'updated_at'>>
): Promise<Santri> {
  const { data, error } = await supabase
    .from('santri')
    .update(updates)
    .eq('nim', nim)
    .select()
    .single()

  if (error) throw error
  return data
}

// Soft delete – keeps history intact
export async function deleteSantri(nim: string): Promise<void> {
  const { error } = await supabase
    .from('santri')
    .update({ is_active: false, foto_url: null })
    .eq('nim', nim)

  if (error) throw error
}

export async function upsertSantri(
  santriList: Omit<Santri, 'created_at' | 'updated_at'>[]
): Promise<Santri[]> {
  const { data, error } = await supabase
    .from('santri')
    .upsert(santriList, { onConflict: 'nim' })
    .select()

  if (error) throw error
  return data || []
}

export async function getDeltaSync(lastSyncTime: string): Promise<Santri[]> {
  const { data, error } = await supabase
    .from('santri')
    .select('*')
    .gt('updated_at', lastSyncTime)
    .order('updated_at', { ascending: true })

  if (error) throw error
  return data || []
}

// ==================== LOG ABSENSI ====================

export async function getLogAbsensi(options: {
  startDate?: string
  endDate?: string
  kelas?: string
  waktu_sholat?: string
  nim?: string
  limit?: number
}): Promise<LogAbsensi[]> {
  let query = supabase
    .from('log_absensi')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('waktu_sholat', { ascending: true })

  if (options.startDate) query = query.gte('tanggal', options.startDate)
  if (options.endDate) query = query.lte('tanggal', options.endDate)
  if (options.kelas && options.kelas !== 'semua') query = query.eq('kelas', options.kelas)
  if (options.waktu_sholat) query = query.eq('waktu_sholat', options.waktu_sholat)
  if (options.nim) query = query.eq('nim', options.nim)
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getAttendanceStats(options: {
  startDate?: string
  endDate?: string
  kelas?: string
}): Promise<{ hadir: number; telat: number; alpa: number; total: number }> {
  let query = supabase.from('log_absensi').select('status')

  if (options.startDate) query = query.gte('tanggal', options.startDate)
  if (options.endDate) query = query.lte('tanggal', options.endDate)
  if (options.kelas && options.kelas !== 'semua') query = query.eq('kelas', options.kelas)

  const { data, error } = await query
  if (error) throw error

  const stats = { hadir: 0, telat: 0, alpa: 0, total: 0 }
  for (const item of data || []) {
    stats.total++
    if (item.status === 'HADIR') stats.hadir++
    else if (item.status === 'TELAT') stats.telat++
    else if (item.status === 'ALPA') stats.alpa++
  }
  return stats
}

export async function batchInsertAbsensi(
  logs: Omit<LogAbsensi, 'id' | 'sync_at'>[]
): Promise<LogAbsensi[]> {
  const { data, error } = await supabase
    .from('log_absensi')
    .insert(logs)
    .select()

  if (error) throw error
  return data || []
}

// ==================== STORAGE ====================

export async function uploadStudentPhoto(nim: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${nim}-${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('foto-santri')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('foto-santri')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function deleteStudentPhoto(fotoUrl: string): Promise<void> {
  // Extract just the filename from the full public URL
  const parts = fotoUrl.split('/foto-santri/')
  if (parts.length < 2) return

  const filePath = parts[1]
  const { error } = await supabase.storage.from('foto-santri').remove([filePath])
  if (error) console.error('Failed to delete photo:', error)
}

// ==================== BACKUP ====================

export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const [{ data: santriData }, { data: logData }] = await Promise.all([
    supabase.from('santri').select('*'),
    supabase.from('log_absensi').select('*').order('tanggal', { ascending: false }),
  ])

  const backupData = JSON.stringify({
    version: '1.0',
    created_at: new Date().toISOString(),
    tables: {
      santri: santriData || [],
      log_absensi: logData || [],
    },
  })

  const fileName = `${timestamp}.json`
  const { error } = await supabase.storage
    .from('foto-santri')
    .upload(`backups/${fileName}`, backupData, {
      contentType: 'application/json',
      upsert: false,
    })

  if (error) throw error
  return fileName
}

export async function listBackups(): Promise<
  { name: string; created_at: string; size: number }[]
> {
  const { data, error } = await supabase.storage
    .from('foto-santri')
    .list('backups', { limit: 30, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return []

  return (data || []).map((f) => ({
    name: f.name,
    created_at: f.created_at || '',
    size: f.metadata?.size || 0,
  }))
}

export async function restoreBackup(fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('foto-santri')
    .download(`backups/${fileName}`)

  if (error) throw error

  const json = JSON.parse(await data.text())
  if (json.tables?.santri?.length) {
    await supabase.from('santri').upsert(json.tables.santri)
  }
}

// ==================== HEALTH ====================

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('santri').select('nim').limit(1)
    return !error
  } catch {
    return false
  }
}
