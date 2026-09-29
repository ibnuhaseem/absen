'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface OnlineStatusContextType {
  isOnline: boolean
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined)

export function OnlineStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Handle online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  )
}

export function useOnlineStatus() {
  const context = useContext(OnlineStatusContext)
  if (!context) {
    throw new Error('useOnlineStatus must be used within OnlineStatusProvider')
  }
  return context
}
