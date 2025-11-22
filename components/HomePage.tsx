'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BookmarkGrid from '@/components/BookmarkGrid'
import InitModal from '@/components/InitModal'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomePage() {
  const { token, loading, isAuthenticated, user, t } = useApp()
  const [needsInit, setNeedsInit] = useState(false)
  const [checkingInit, setCheckingInit] = useState(true)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'bookmarks' | 'engine'>('bookmarks')
  // 控制侧边栏显示状态 - 移动端默认关闭，桌面端默认开启
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // 桌面端默认展开

  // 控制搜索栏显示状态 - 移动端默认关闭
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 响应式处理
  const [isMobile, setIsMobile] = useState(false)
  
  // 跟踪默认空间初始化状态
  const defaultSpaceInit = useRef(false)

  // 检测屏幕尺寸变化
  const checkScreenSize = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    
    // 在桌面端，确保侧边栏状态正确
    if (!mobile) {
      setIsSidebarOpen(true)
    }
  }, [])

  useEffect(() => {
    // 初始检查
    checkScreenSize()

    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [checkScreenSize])

  const checkInitStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/init')
      const data = await response.json()
      setNeedsInit(data.needsInit)
    } catch (error) {
      console.error(t('checkInitFailed'), error)
    } finally {
      setCheckingInit(false)
    }
  }, [t])

  useEffect(() => {
    checkInitStatus()
  }, [checkInitStatus])

  // 设置默认空间逻辑 - 优先使用系统配置的默认空间
  const setDefaultSpace = useCallback(async () => {
    const isMounted = true // 添加组件挂载状态检查
    
    try {
      // 优化：减少频繁的console.log，只在关键节点输出
      console.log('设置默认空间...')
      
      // 确保还没有设置默认空间
      if (selectedSpaceId) {
        console.log('默认空间已设置')
        return
      }
      
      console.log('开始获取默认空间设置...')
      
      // 对于已登录用户，优先从系统配置获取默认空间
      if (isAuthenticated && token && user) {
        const configResponse = await fetch('/api/system-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (configResponse.ok) {
          const config = await configResponse.json()
          if (config.defaultSpaceId && isMounted) {
            console.log('使用系统默认空间:', config.defaultSpaceId)
            setSelectedSpaceId(config.defaultSpaceId)
            return
          } else {
            console.log('未找到系统默认空间，将选择第一个可用空间')
          }
        } else {
          console.log('获取系统配置失败，状态码:', configResponse.status)
        }
      }

      // 获取第一个可用空间作为默认空间（支持未登录状态）
      if (!selectedSpaceId && isMounted) {
        console.log('开始获取第一个可用空间...')
        
        // 根据认证状态决定是否使用Authorization头
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const spacesResponse = await fetch('/api/spaces', { headers })

        if (spacesResponse.ok) {
          const spacesData = await spacesResponse.json()
          // 处理API返回的格式 {spaces: [...]} 或直接数组格式
          let spaces = []
          if (Array.isArray(spacesData)) {
            spaces = spacesData
          } else if (spacesData.spaces && Array.isArray(spacesData.spaces)) {
            spaces = spacesData.spaces
          } else if (spacesData.data && Array.isArray(spacesData.data)) {
            spaces = spacesData.data
          }
          
          console.log('获取空间数据:', spaces.length)
          if (spaces.length > 0 && isMounted) {
            console.log('使用第一个可用空间作为默认空间:', spaces[0].id)
            setSelectedSpaceId(spaces[0].id)
          }
        } else {
          console.log('获取空间数据失败，状态码:', spacesResponse.status)
        }
      }
    } catch (error) {
      if (isMounted) {
        console.error('设置默认空间失败:', error)
      }
    }
  }, [isAuthenticated, token, user, selectedSpaceId]) // 移除t依赖

  useEffect(() => {
    // 优化：移除频繁的console.log，只在必要的时候输出
    // 等待所有初始状态都完成后再设置默认空间，且只执行一次
    // 支持未登录状态：在初始化完成且没有选中的空间时设置默认空间
    if (!checkingInit && !loading && !needsInit && !selectedSpaceId && !defaultSpaceInit.current) {
      defaultSpaceInit.current = true // 标记已开始初始化
      // 减少延迟时间，减少频繁的状态检查
      const timeoutId = setTimeout(() => {
        setDefaultSpace()
      }, 100) // 从200ms减少到100ms
      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [checkingInit, loading, needsInit, selectedSpaceId, setDefaultSpace]) // 添加setDefaultSpace依赖以修复ESLint警告

  if (checkingInit || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  if (needsInit) {
    return <InitModal onComplete={() => setNeedsInit(false)} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* 侧边栏 - 响应式布局 */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `relative ${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`
        }
      `}>
        <Sidebar
          selectedSpaceId={selectedSpaceId}
          selectedFolderId={selectedFolderId}
          onSelectSpace={setSelectedSpaceId}
          onSelectFolder={setSelectedFolderId}
        />
      </div>

      {/* 移动端遮罩层 */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={(e) => {
            e.stopPropagation()
            setIsSidebarOpen(false)
          }}
        />
      )}

      {/* 主内容区 */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          isMobile ? '' : isSidebarOpen ? 'ml-0' : 'ml-0'
        }`}
        onClick={(e) => {
          // 在移动端点击主内容区域时关闭侧边栏
          if (isMobile && isSidebarOpen) {
            e.stopPropagation()
            setIsSidebarOpen(false)
          }
        }}
      >
        {/* 顶部导航栏 */}
        <div onClick={(e) => e.stopPropagation()}>
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            onSearchToggle={() => setIsSearchOpen(!isSearchOpen)}
            isSearchOpen={isSearchOpen}
          />
        </div>

        {/* 书签网格 */}
        <main className="flex-1 overflow-y-auto">
          <BookmarkGrid
            spaceId={selectedSpaceId}
            folderId={selectedFolderId}
            searchQuery={searchMode === 'bookmarks' ? searchQuery : ''}
          />
        </main>
      </div>
    </div>
  )
}
