'use client'

import { useNotification, type Notification } from '@/context/NotificationContext'

const iconMap: Record<Notification['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const colorMap: Record<Notification['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-600',
}

export default function NotificationCenter() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`${colorMap[n.type]} text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-3`}
        >
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">{iconMap[n.type]}</span>
          <p className="text-sm flex-1">{n.message}</p>
          <button
            onClick={() => removeNotification(n.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 text-sm leading-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
