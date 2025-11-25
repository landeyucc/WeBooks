'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import AdminDashboard from '@/components/admin/AdminDashboard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useApp()

  // 检查认证状态，如果未登录则重定向到登录页
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" message="加载中..." />
      </div>
    )
  }

  // 未认证时显示重定向提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">正在跳转至登录页面...</p>
        </div>
      </div>
    )
  }

  // 如果已认证，显示管理面板
  return <AdminDashboard />
}
