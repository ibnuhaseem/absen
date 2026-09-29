'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import {
  initializeSync,
  coldStartSync,
  deltaSync,
  syncPendingLogs,
  startAutoSync,
  stopAutoSync,
  setupFocusSync,
  getPendingSyncCount,
  manualSync,
  getSyncStatus,
} from '@/lib/sync-service'
import { useOnlineStatus } from './OnlineStatusContext'
import { useNotification } from './NotificationContext'

interface SyncContextType {
  initialized: boolean
  pendingCount: number
  lastSync: string | null
  syncing: boolean
  triggerSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isOnline } = useOnlineStatus()
  const { showNotification } = useNotification()

  const [initialized, setInitialized] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const didInit = useRef(false)

  // On mount: initialize IndexedDB, cold-start if needed, then start auto-sync
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const boot = async () => {
      try {
        await initializeSync()

        // Check if we have any cached students
        const status = await getSyncStatus()

        if (!status.lastSync && status.isOnline) {
          // First time — full sync
          setSyncing(true)
          try {
            await coldStartSync()
            showNotification('success', '✓ Data santri berhasil dimuat')
          } finally {
            setSyncing(false)
          }
        } else if (status.isOnline) {
          // Delta sync silently
          await deltaSync()
          await syncPendingLogs()
        }

        const fresh = await getSyncStatus()
        setPendingCount(fresh.pendingCount)
        setLastSync(fresh.lastSync)
        setInitialized(true)

        // Start background auto-sync every 5 minutes
        startAutoSync(5 * 60 * 1000)
        setupFocusSync()
      } catch (err) {
        console.error('Sync boot failed:', err)
        // Still mark initialized so UI is usable offline
        setInitialized(true)
      }
    }

    boot()

    return () => { stopAutoSync() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When coming back online, sync pending immediately
  const prevOnline = useRef(isOnline)
  useEffect(() => {
    if (!prevOnline.current && isOnline && initialized) {
      showNotification('info', '🌐 Kembali online — menyinkronisasi data...')
      triggerSync()
    }
    prevOnline.current = isOnline
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, initialized])

  // Poll pending count every 30s
  useEffect(() => {
    if (!initialized) return
    const iv = setInterval(async () => {
      const count = await getPendingSyncCount()
      setPendingCount(count)
    }, 30_000)
    return () => clearInterval(iv)
  }, [initialized])

  const triggerSync = useCallback(async () => {
    if (syncing || !isOnline) return
    setSyncing(true)
    try {
      const result = await manualSync()
      if (result.synced > 0) {
        showNotification('success', `✓ Sinkronisasi berhasil (${result.synced} records)`)
      }
      if (result.failed > 0) {
        showNotification('warning', `⚠ ${result.failed} records gagal disinkronisasi`)
      }
      const status = await getSyncStatus()
      setPendingCount(status.pendingCount)
      setLastSync(status.lastSync)
    } catch (err) {
      console.error('Manual sync failed:', err)
      showNotification('error', '✕ Sinkronisasi gagal')
    } finally {
      setSyncing(false)
    }
  }, [syncing, isOnline, showNotification])

  return (
    <SyncContext.Provider value={{ initialized, pendingCount, lastSync, syncing, triggerSync }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used inside SyncProvider')
  return ctx
}
