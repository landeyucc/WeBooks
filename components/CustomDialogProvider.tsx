'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { AlertModal, ConfirmModal, useCustomDialog } from './CustomModal'

interface BaseAlertOptions {
  title?: string
  confirmText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

interface BaseConfirmOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  danger?: boolean
}

interface AlertItem {
  id: string
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onClose: () => void
}

interface ConfirmItem {
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
}

interface CustomDialogContextType {
  alerts: AlertItem[]
  confirms: ConfirmItem[]
  showAlert: (message: string, options?: BaseAlertOptions) => Promise<void>
  showConfirm: (message: string, options?: BaseConfirmOptions) => Promise<boolean>
}

const CustomDialogContext = createContext<CustomDialogContextType | null>(null)

export const useCustomDialogContext = () => {
  const context = useContext(CustomDialogContext)
  if (!context) {
    throw new Error('useCustomDialogContext must be used within a CustomDialogProvider')
  }
  return context
}

interface CustomDialogProviderProps {
  children: ReactNode
}

export const CustomDialogProvider = ({ children }: CustomDialogProviderProps) => {
  const { alerts, confirms, showAlert, showConfirm } = useCustomDialog()

  const contextValue: CustomDialogContextType = {
    alerts,
    confirms,
    showAlert,
    showConfirm
  }

  return (
    <CustomDialogContext.Provider value={contextValue}>
      {children}
      
      {/* Alert 弹窗 */}
      {alerts.map(alert => (
        <AlertModal
          key={alert.id}
          isOpen={alert.isOpen}
          onClose={alert.onClose}
          title={alert.title}
          message={alert.message}
          confirmText={alert.confirmText}
          type={alert.type}
        />
      ))}

      {/* Confirm 弹窗 */}
      {confirms.map(confirm => (
        <ConfirmModal
          key={confirm.id}
          isOpen={confirm.isOpen}
          onClose={confirm.onClose}
          onConfirm={confirm.onConfirm}
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
          type={confirm.type}
          danger={confirm.danger}
        />
      ))}
    </CustomDialogContext.Provider>
  )
}

export default CustomDialogProvider