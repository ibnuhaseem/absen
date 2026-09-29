import {
  getDB,
  saveSantri,
  getSantri as getLocalSantri,
  addLogAbsensi,
  getLogAbsensi as getLocalLogs,
  addPendingSync,
  getPendingSync,
  removePendingSync,
  getSyncState,
  setSyncState,
} from './indexeddb'
import {
  getSantri,
  getDeltaSync,
  batchInsertAbsensi,
  checkSupabaseHealth,
  type Santri,
  type LogAbsensi,
} from './supabase-service'

const LAST_SYNC_KEY = 'last_sync_timestamp'
const PENDING_COUNT_KEY = 'pending_sync_count'

// ==================== INITIALIZATION ====================

export async function initializeSync(): Promise<void> {
  await getDB()
}

// ==================== SANTRI SYNC ====================

export async function coldStartSync(): Promise<{ success: boolean; count: number }> {
  const serverSantri = await getSantri()
  await saveSantri(serverSantri)
  await setSyncState(LAST_SYNC_KEY, { lastSync: new Date().toISOString() })
  return { success: true, count: serverSantri.length }
}

export async function deltaSync(): Promise<{
  added: number
  updated: number
  deleted: number
}> {
  const syncState = await getSyncState(LAST_SYNC_KEY)
  const lastSyncTime = syncState?.lastSync || '1970-01-01T00:00:00Z'

  const updatedSantri = await getDeltaSync(lastSyncTime)

  if (updatedSantri.length === 0) return { added: 0, updated: 0, deleted: 0 }

  const localSantri = await getLocalSantri()
  const localMap = new Map(localSantri.map((s) => [s.nim, s]))

  let added = 0
  let updated = 0
  for (const student of updatedSantri) {
    if (localMap.has(student.nim)) updated++
    else added++
  }

  await saveSantri(updatedSantri)
  await setSyncState(LAST_SYNC_KEY, { lastSync: new Date().toISOString() })

  return { added, updated, deleted: 0 }
}

export async function getLocalStudents(): Promise<Santri[]> {
  return getLocalSantri()
}

export async function findStudentByNim(nim: string): Promise<Santri | null> {
  const students = await getLocalSantri()
  return students.find((s) => s.nim === nim) || null
}

// ==================== ATTENDANCE SYNC ====================

export async function addAttendanceLog(log: Omit<LogAbsensi, 'sync_at'>): Promise<void> {
  await addLogAbsensi({ ...log, sync_at: new Date().toISOString() })
  await addPendingSync({
    data: log,
    sync_status: 'PENDING',
    retry_count: 0,
    created_at: new Date().toISOString(),
  })
  const pending = await getPendingSync()
  await setSyncState(PENDING_COUNT_KEY, { count: pending.length })
}

export async function getPendingSyncCount(): Promise<number> {
  const pending = await getPendingSync()
  return pending.length
}

export async function getLocalAttendanceLogs(): Promise<LogAbsensi[]> {
  return getLocalLogs()
}

export async function syncPendingLogs(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingSync()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  const isOnline = await checkSupabaseHealth()
  if (!isOnline) return { synced: 0, failed: pending.length }

  // Batch all pending into one request
  const allLogs = pending.map((item) => item.data)
  try {
    await batchInsertAbsensi(allLogs)
    // Remove all synced items
    for (const item of pending) {
      await removePendingSync(item.id!)
    }
    const remaining = await getPendingSync()
    await setSyncState(PENDING_COUNT_KEY, { count: remaining.length })
    return { synced: pending.length, failed: 0 }
  } catch (error) {
    console.error('Batch sync failed, falling back to one-by-one:', error)
    // Fall back to one-by-one
    let synced = 0
    let failed = 0
    for (const item of pending) {
      try {
        await batchInsertAbsensi([item.data])
        await removePendingSync(item.id!)
        synced++
      } catch {
        failed++
      }
    }
    const remaining = await getPendingSync()
    await setSyncState(PENDING_COUNT_KEY, { count: remaining.length })
    return { synced, failed }
  }
}

/**
 * Called when "Tutup Sesi Absen" is clicked.
 * Builds full attendance list (HADIR + ALPA), stores locally and tries to sync.
 */
export async function closeSessionAndSync(
  prayerTime: string,
  date: string,
  scannedItems: { nim: string; nama: string; kelas: string; waktu_scan: string }[]
): Promise<{ hadir: number; telat: number; alpa: number; total: number }> {
  const allStudents = await getLocalStudents()
  const scannedMap = new Map(scannedItems.map((s) => [s.nim, s]))

  // Cutoff times per sholat (24h format)
  const cutoff: Record<string, string> = {
    Subuh: '05:30',
    Dzuhur: '12:30',
    Ashar: '15:30',
    Maghrib: '18:30',
    Isya: '19:30',
  }
  const cutoffTime = cutoff[prayerTime] || '23:59'

  const logs: Omit<LogAbsensi, 'sync_at'>[] = []
  let hadir = 0
  let telat = 0
  let alpa = 0

  for (const student of allStudents) {
    const scanned = scannedMap.get(student.nim)
    if (scanned) {
      // Determine HADIR vs TELAT based on scan time vs cutoff
      const scanHHMM = scanned.waktu_scan.substring(0, 5) // "HH:MM"
      const isLate = scanHHMM > cutoffTime
      const status = isLate ? 'TELAT' : 'HADIR'
      if (status === 'HADIR') hadir++
      else telat++

      logs.push({
        tanggal: date,
        waktu_sholat: prayerTime as LogAbsensi['waktu_sholat'],
        nim: student.nim,
        nama: student.nama,
        kelas: student.kelas,
        status,
        waktu_scan: scanned.waktu_scan,
      })
    } else {
      alpa++
      logs.push({
        tanggal: date,
        waktu_sholat: prayerTime as LogAbsensi['waktu_sholat'],
        nim: student.nim,
        nama: student.nama,
        kelas: student.kelas,
        status: 'ALPA',
        waktu_scan: '',
      })
    }
  }

  // Save all locally first (offline-first)
  for (const log of logs) {
    await addAttendanceLog(log)
  }

  // Attempt immediate server sync
  const isOnline = await checkSupabaseHealth()
  if (isOnline) {
    await syncPendingLogs()
  }

  return { hadir, telat, alpa, total: allStudents.length }
}

// ==================== AUTO SYNC ====================

let syncInterval: ReturnType<typeof setInterval> | null = null
let currentRetryCount = 0
const MAX_RETRIES = 5

export function startAutoSync(intervalMs = 5 * 60 * 1000): void {
  if (syncInterval) clearInterval(syncInterval)
  performAutoSync()
  syncInterval = setInterval(performAutoSync, intervalMs)
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

export function setupFocusSync(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', performAutoSync)
  }
}

async function performAutoSync(): Promise<void> {
  try {
    await deltaSync()
    await syncPendingLogs()
    currentRetryCount = 0
  } catch (error) {
    console.error('Auto sync failed:', error)
    currentRetryCount++
    if (currentRetryCount >= MAX_RETRIES) {
      console.error('Max retries reached, stopping auto sync')
      stopAutoSync()
      currentRetryCount = 0
    }
  }
}

// ==================== STATUS ====================

export async function getSyncStatus(): Promise<{
  lastSync: string | null
  pendingCount: number
  isOnline: boolean
}> {
  const [syncState, pendingState, isOnline] = await Promise.all([
    getSyncState(LAST_SYNC_KEY),
    getSyncState(PENDING_COUNT_KEY),
    checkSupabaseHealth(),
  ])
  return {
    lastSync: syncState?.lastSync || null,
    pendingCount: pendingState?.count || 0,
    isOnline,
  }
}

export async function manualSync(): Promise<{ synced: number; failed: number }> {
  await deltaSync()
  return syncPendingLogs()
}
