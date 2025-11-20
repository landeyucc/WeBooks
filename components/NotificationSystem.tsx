'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface NotificationProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: (id: string) => void
}

interface NotificationSystemProps {
  notifications: NotificationProps[]
}

const NotificationItem = ({ id, message, type, duration = 3000, onClose }: NotificationProps) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onClose(id)
      }, 300) // 等待动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  const getTypeStyles = () => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'success': return '✅'
        case 'error': return '❌'
        case 'warning': return '⚠️'
        case 'info':
        default: return 'ℹ️'
      }
    }
    
    switch (type) {
      case 'success':
        return {
          bg: 'neu-card',
          text: 'text-green-700 dark:text-green-300',
          icon: getTypeIcon('success'),
          glow: 'shadow-green-200/50 dark:shadow-green-800/20'
        }
      case 'error':
        return {
          bg: 'neu-card',
          text: 'text-red-700 dark:text-red-300',
          icon: getTypeIcon('error'),
          glow: 'shadow-red-200/50 dark:shadow-red-800/20'
        }
      case 'warning':
        return {
          bg: 'neu-card',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: getTypeIcon('warning'),
          glow: 'shadow-yellow-200/50 dark:shadow-yellow-800/20'
        }
      case 'info':
      default:
        return {
          bg: 'neu-card',
          text: 'text-blue-700 dark:text-blue-300',
          icon: getTypeIcon('info'),
          glow: 'shadow-blue-200/50 dark:shadow-blue-800/20'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full 
        mx-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'}
        ${styles.bg} ${styles.text} ${styles.glow}
        rounded-2xl p-4
        flex items-center gap-3
        hover:scale-105
        border border-gray-200/20 dark:border-gray-700/20
      `}
    >
      <span className="text-lg filter drop-shadow-sm">{styles.icon}</span>
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onClose(id), 300)
        }}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          ${styles.text} opacity-70 hover:opacity-100
          transition-all duration-200 hover:scale-110
          hover:bg-black/5 dark:hover:bg-white/5
        `}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const NotificationSystem = ({ notifications }: NotificationSystemProps) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // 确保在客户端渲染
    if (typeof window !== 'undefined') {
      let element = document.getElementById('notification-portal')
      if (!element) {
        element = document.createElement('div')
        element.id = 'notification-portal'
        document.body.appendChild(element)
      }
      setPortalElement(element)
    }
  }, [])

  if (!portalElement) return null

  return createPortal(
    <>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          {...notification}
        />
      ))}
    </>,
    portalElement
  )
}

// Hook for using the notification system
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: NotificationProps = {
      id,
      message,
      type,
      duration,
      onClose: removeNotification
    }
    
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    // 便利方法
    showSuccess: (message: string, duration?: number) => addNotification(message, 'success', duration),
    showError: (message: string, duration?: number) => addNotification(message, 'error', duration),
    showWarning: (message: string, duration?: number) => addNotification(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => addNotification(message, 'info', duration)
  }
}

export default NotificationSystem