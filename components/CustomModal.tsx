'use client'

import { useState, useEffect, ReactNode, useContext } from 'react'
import { createPortal } from 'react-dom'
import { AppContext } from '@/contexts/AppContext'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  confirmText?: string
  title?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message?: string
  title?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  danger?: boolean
  children?: ReactNode
}

const ModalBase = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true 
}: BaseModalProps) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let element = document.getElementById('modal-portal')
      if (!element) {
        element = document.createElement('div')
        element.id = 'modal-portal'
        document.body.appendChild(element)
      }
      setPortalElement(element)
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen || !portalElement) return null

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-sm'
      case 'md': return 'max-w-md'
      case 'lg': return 'max-w-lg'
      case 'xl': return 'max-w-2xl'
      default: return 'max-w-md'
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div 
        className={`
          relative neu-card 
          transform transition-all duration-300 ease-out
          w-full mx-4 ${getSizeClasses()}
          max-h-[90vh] overflow-hidden
          border border-gray-200/30 dark:border-gray-700/30
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 neu-inset">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full neu-button flex items-center justify-center
                         text-gray-500 dark:text-gray-400 
                         hover:text-gray-700 dark:hover:text-gray-200 
                         transition-all duration-200 hover:scale-110"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>,
    portalElement
  )
}

export const AlertModal = ({ 
  isOpen, 
  onClose, 
  message, 
  confirmText,
  title,
  type = 'info' 
}: AlertModalProps) => {
  const context = useContext(AppContext)
  const t = context?.t || ((key: string) => key)
  
  const getTypeConfig = () => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'success': return '✅'
        case 'warning': return '⚠️'
        case 'error': return '❌'
        case 'info':
        default: return 'ℹ️'
      }
    }
    
    switch (type) {
      case 'success':
        return {
          icon: getTypeIcon('success'),
          bgColor: 'neu-inset',
          textColor: 'text-green-700 dark:text-green-300',
          buttonColor: 'neu-button bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
          glow: 'shadow-green-200/30 dark:shadow-green-800/20'
        }
      case 'warning':
        return {
          icon: getTypeIcon('warning'),
          bgColor: 'neu-inset',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          buttonColor: 'neu-button bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700',
          glow: 'shadow-yellow-200/30 dark:shadow-yellow-800/20'
        }
      case 'error':
        return {
          icon: getTypeIcon('error'),
          bgColor: 'neu-inset',
          textColor: 'text-red-700 dark:text-red-300',
          buttonColor: 'neu-button bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
          glow: 'shadow-red-200/30 dark:shadow-red-800/20'
        }
      case 'info':
      default:
        return {
          icon: getTypeIcon('info'),
          bgColor: 'neu-inset',
          textColor: 'text-blue-700 dark:text-blue-300',
          buttonColor: 'neu-button bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
          glow: 'shadow-blue-200/30 dark:shadow-blue-800/20'
        }
    }
  }

  const config = getTypeConfig()

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={title || t('alertTitle')} size="sm">
      <div className={`${config.bgColor} ${config.textColor} p-4 flex items-start gap-3`}>
        <span className="text-2xl filter drop-shadow-sm">{config.icon}</span>
        <p className="flex-1 text-sm leading-relaxed">{message}</p>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${config.buttonColor}`}
        >
          {confirmText || t('alertConfirm')}
        </button>
      </div>
    </ModalBase>
  )
}

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  message, 
  title,
  confirmText,
  cancelText,
  type = 'info',
  danger = false,
  children
}: ConfirmModalProps) => {
  const context = useContext(AppContext)
  const t = context?.t || ((key: string) => key)
  
  const getTypeConfig = () => {
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'success': return '✅'
        case 'warning': return '⚠️'
        case 'error': return '❌'
        case 'info':
        default: return 'ℹ️'
      }
    }
    
    if (danger) {
      return {
        icon: '❓',
        bgColor: 'neu-inset',
        textColor: 'text-red-700 dark:text-red-300',
        confirmButtonColor: 'neu-button bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
        cancelButtonColor: 'neu-button',
        glow: 'shadow-red-200/30 dark:shadow-red-800/20'
      }
    }

    switch (type) {
      case 'success':
        return {
          icon: getTypeIcon('success'),
          bgColor: 'neu-inset',
          textColor: 'text-green-700 dark:text-green-300',
          confirmButtonColor: 'neu-button bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
          cancelButtonColor: 'neu-button',
          glow: 'shadow-green-200/30 dark:shadow-green-800/20'
        }
      case 'warning':
        return {
          icon: getTypeIcon('warning'),
          bgColor: 'neu-inset',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          confirmButtonColor: 'neu-button bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700',
          cancelButtonColor: 'neu-button',
          glow: 'shadow-yellow-200/30 dark:shadow-yellow-800/20'
        }
      case 'error':
        return {
          icon: getTypeIcon('error'),
          bgColor: 'neu-inset',
          textColor: 'text-red-700 dark:text-red-300',
          confirmButtonColor: 'neu-button bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
          cancelButtonColor: 'neu-button',
          glow: 'shadow-red-200/30 dark:shadow-red-800/20'
        }
      case 'info':
      default:
        return {
          icon: getTypeIcon('info'),
          bgColor: 'neu-inset',
          textColor: 'text-blue-700 dark:text-blue-300',
          confirmButtonColor: 'neu-button bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
          cancelButtonColor: 'neu-button',
          glow: 'shadow-blue-200/30 dark:shadow-blue-800/20'
        }
    }
  }

  const config = getTypeConfig()

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={title || t('confirmTitle')} size="md">
      {/* 如果有children，使用自定义内容；否则使用简单的message */}
      {children ? (
        <>
          {children}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${config.cancelButtonColor}`}
            >
              {cancelText || t('confirmCancel')}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${config.confirmButtonColor}`}
            >
              {confirmText || t('alertConfirm')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={`${config.bgColor} ${config.textColor} p-4 flex items-start gap-3`}>
            <span className="text-2xl filter drop-shadow-sm">{config.icon}</span>
            <p className="flex-1 text-sm leading-relaxed">{message}</p>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${config.cancelButtonColor}`}
            >
              {cancelText || t('confirmCancel')}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${config.confirmButtonColor}`}
            >
              {confirmText || t('alertConfirm')}
            </button>
          </div>
        </>
      )}
    </ModalBase>
  )
}

// Hook for managing custom dialogs
export const useCustomDialog = () => {
  const context = useContext(AppContext)
  const t = context?.t || ((key: string) => key)
  const [alerts, setAlerts] = useState<Array<{
    id: string
    isOpen: boolean
    title?: string
    message: string
    confirmText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
    onClose: () => void
  }>>([])

  const [confirms, setConfirms] = useState<Array<{
    id: string
    isOpen: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
    danger?: boolean
    onConfirm: () => void
    onClose: () => void
  }>>([])

  const showAlert = (message: string, options: {
    title?: string
    confirmText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
  } = {}) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    return new Promise<void>((resolve) => {
      const alertItem = {
        id,
        isOpen: true,
        title: options.title,
        message,
        confirmText: options.confirmText || t('alertConfirm'),
        type: options.type || 'info',
        onClose: () => {
          setAlerts(prev => prev.filter(item => item.id !== id))
          resolve()
        }
      }
      
      setAlerts(prev => [...prev, alertItem])
    })
  }

  const showConfirm = (message: string, options: {
    title?: string
    confirmText?: string
    cancelText?: string
    type?: 'info' | 'warning' | 'error' | 'success'
    danger?: boolean
  } = {}) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    return new Promise<boolean>((resolve) => {
      const confirmItem = {
        id,
        isOpen: true,
        title: options.title || t('confirmTitle'),
        message,
        confirmText: options.confirmText || t('alertConfirm'),
        cancelText: options.cancelText || t('confirmCancel'),
        type: options.type || 'info',
        danger: options.danger || false,
        onConfirm: () => {
          setConfirms(prev => prev.filter(item => item.id !== id))
          resolve(true)
        },
        onClose: () => {
          setConfirms(prev => prev.filter(item => item.id !== id))
          resolve(false)
        }
      }
      
      setConfirms(prev => [...prev, confirmItem])
    })
  }

  return {
    alerts,
    confirms,
    showAlert,
    showConfirm
  }
}

export default ModalBase