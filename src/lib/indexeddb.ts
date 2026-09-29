// IndexedDB utilities for offline-first support

const DB_NAME = 'AbsensiSholatDB'
const DB_VERSION = 1

export interface DBConfig {
  db: IDBDatabase | null
}

let dbInstance: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Santri store
      if (!db.objectStoreNames.contains('santri')) {
        db.createObjectStore('santri', { keyPath: 'nim' })
      }

      // Log absensi store
      if (!db.objectStoreNames.contains('log_absensi')) {
        db.createObjectStore('log_absensi', { keyPath: 'id' })
      }

      // Pending sync store
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true })
      }

      // Sync state store
      if (!db.objectStoreNames.contains('sync_state')) {
        db.createObjectStore('sync_state', { keyPath: 'key' })
      }
    }
  })
}

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }
  return initDB()
}

export async function saveSantri(santri: any[]): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['santri'], 'readwrite')
    const store = transaction.objectStore('santri')
    
    santri.forEach((s) => store.put(s))

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
  })
}

export async function getSantri(): Promise<any[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['santri'], 'readonly')
    const store = transaction.objectStore('santri')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addLogAbsensi(log: any): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['log_absensi'], 'readwrite')
    const store = transaction.objectStore('log_absensi')
    const request = store.add(log)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

export async function getLogAbsensi(): Promise<any[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['log_absensi'], 'readonly')
    const store = transaction.objectStore('log_absensi')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addPendingSync(data: any): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readwrite')
    const store = transaction.objectStore('pending_sync')
    const request = store.add(data)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

export async function getPendingSync(): Promise<any[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readonly')
    const store = transaction.objectStore('pending_sync')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function removePendingSync(id: number): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readwrite')
    const store = transaction.objectStore('pending_sync')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

export async function getSyncState(key: string): Promise<any> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync_state'], 'readonly')
    const store = transaction.objectStore('sync_state')
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function setSyncState(key: string, value: any): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['sync_state'], 'readwrite')
    const store = transaction.objectStore('sync_state')
    const request = store.put({ key, ...value })

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}
