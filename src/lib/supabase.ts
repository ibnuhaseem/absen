import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  id: string
  tanggal: string
  waktu_sholat: 'Subuh' | 'Dzuhur' | 'Ashar' | 'Maghrib' | 'Isya'
  nim: string
  nama: string
  kelas: string
  status: 'HADIR' | 'TELAT' | 'ALPA'
  waktu_scan: string
  sync_at: string
}
