'use client'

import React, { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useNotifications } from './NotificationSystem'
import NotificationSystem from './NotificationSystem'
import { Lock, Eye, EyeOff, X, AlertCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface SpacePasswordModalProps {
  isOpen: boolean
  spaceId: string
  spaceName: string
  onSuccess: () => void
  onClose: () => void
}

export default function SpacePasswordModal({ 
  isOpen, 
  spaceId, 
  spaceName, 
  onSuccess, 
  onClose 
}: SpacePasswordModalProps) {
  const { t } = useApp()
  const { showSuccess, showError, notifications } = useNotifications()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spaceId || !password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/spaces/${spaceId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setPassword('')
        onSuccess()
        
        // 显示成功通知
        showSuccess('密码验证成功', 2000)
      } else {
        const errorMsg = data.error || '密码错误，请重试'
        setError(errorMsg)
        
        // 显示失败通知
        showError(errorMsg, 3000)
      }
    } catch {
      const errorMsg = '验证失败，请稍后重试'
      setError(errorMsg)
      
      // 显示错误通知
      showError(errorMsg, 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    setShowPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 遮罩层 */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* 模态框内容 */}
        <div className="relative max-w-md w-full mx-4 p-8 rounded-2xl">
          {/* 拟态设计背景 */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-700/50" 
               style={{
                 boxShadow: `
                   20px 20px 60px #bebebe,
                   -20px -20px 60px #ffffff,
                   inset 2px 2px 10px rgba(255,255,255,0.3),
                   inset -2px -2px 10px rgba(0,0,0,0.1)
                 `
               }}>
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                boxShadow: `
                  4px 4px 12px #bebebe,
                  -4px -4px 12px #ffffff,
                  inset 1px 1px 2px rgba(255,255,255,0.7),
                  inset -1px -1px 2px rgba(0,0,0,0.1)
                `
              }}
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* 标题 */}
            <div className="flex items-center mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mr-4 shadow-lg"
                   style={{
                     boxShadow: `
                       4px 4px 12px rgba(0,0,0,0.15),
                       inset 2px 2px 4px rgba(255,255,255,0.3)
                     `
                   }}>
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t('unlockEncryptedSpace')}
              </h2>
            </div>

            {/* 空间信息 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800/30">
              <p className="text-gray-700 dark:text-gray-300">
                {t('spaceRequiresPassword')} <span className="font-semibold text-blue-700 dark:text-blue-300">&ldquo;{spaceName}&rdquo;</span> {t('requiresPassword')}
              </p>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border"
                   style={{
                     background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
                     border: '1px solid #fca5a5',
                     boxShadow: `
                       4px 4px 12px rgba(220, 38, 38, 0.15),
                       inset 2px 2px 4px rgba(255, 255, 255, 0.7),
                       inset -1px -1px 2px rgba(220, 38, 38, 0.1)
                     `
                   }}>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mr-3">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* 密码输入表单 */}
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('enterPassword')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 pr-14 rounded-xl text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 password-input-neumorphic"
                    style={{
                      background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
                      border: '1px solid #d1d5db',
                      boxShadow: `
                        inset 3px 3px 8px #e5e7eb,
                        inset -3px -3px 8px #ffffff
                      `,
                      color: 'inherit'
                    }}
                    placeholder={t('enterPasswordPlaceholder')}
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
                      boxShadow: `
                        2px 2px 6px #d1d5db,
                        -2px -2px 6px #ffffff,
                        inset 1px 1px 2px rgba(255,255,255,0.7),
                        inset -1px -1px 2px rgba(0,0,0,0.05)
                      `
                    }}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 rounded-xl transition-all duration-200"
                  style={{
                    background: 'linear-gradient(145deg, #f3f4f6, #e5e7eb)',
                    boxShadow: `
                      4px 4px 12px #d1d5db,
                      -4px -4px 12px #ffffff,
                      inset 1px 1px 2px rgba(255,255,255,0.7),
                      inset -1px -1px 2px rgba(0,0,0,0.05)
                    `
                  }}
                  disabled={loading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                    boxShadow: `
                      4px 4px 12px rgba(59, 130, 246, 0.3),
                      inset 2px 2px 4px rgba(255,255,255,0.2),
                      inset -2px -2px 4px rgba(0,0,0,0.1)
                    `
                  }}
                  disabled={!password.trim() || loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : t('unlock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* 通知系统 */}
      <NotificationSystem notifications={notifications} />
    </>
  )
}