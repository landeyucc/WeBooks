'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BookmarkGrid from '@/components/BookmarkGrid'
import InitModal from '@/components/InitModal'

export default function HomePage() {
  const { token, loading, isAuthenticated, user, t } = useApp()
  const [needsInit, setNeedsInit] = useState(false)
  const [checkingInit, setCheckingInit] = useState(true)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'bookmarks' | 'engine'>('bookmarks')
  // 控制侧边栏显示状态 - 移动端默认关闭，桌面端默认开启
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 控制搜索栏显示状态 - 移动端默认关闭
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 响应式处理
  const [isMobile, setIsMobile] = useState(false)
  
  // 跟踪默认空间初始化状态
  const defaultSpaceInit = useRef(false)

  // 检测屏幕尺寸变化
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // 在桌面端，默认打开侧边栏
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true)
      }
    }

    // 初始检查
    checkScreenSize()

    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    checkInitStatus()
  }, [])

  // 设置默认空间逻辑 - 优先使用系统配置的默认空间
  useEffect(() => {
    let isMounted = true // 添加组件挂载状态检查
    
    const setDefaultSpace = async () => {
      // 重置挂载状态，允许重新执行
      const mounted = { current: true }
      
      try {
        console.log('开始设置默认空间，认证状态:', { 
          isAuthenticated, 
          token: !!token, 
          user: !!user 
        })
        
        // 确保用户完全认证（token和user都存在）
        if (!isAuthenticated || !token || !user) {
          console.log('用户未完全认证，等待认证完成:', { 
            isAuthenticated, 
            hasToken: !!token, 
            hasUser: !!user 
          })
          return
        }
        
        // 确保还没有设置默认空间
        if (selectedSpaceId) {
          console.log('默认空间已设置，跳过设置:', selectedSpaceId)
          return
        }
        
        console.log('开始获取默认空间设置...')
        
        // 优先从系统配置获取默认空间
        const configResponse = await fetch('/api/system-config', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (configResponse.ok) {
          const config = await configResponse.json()
          console.log('获取到的系统配置:', config)
          if (config.defaultSpaceId && mounted.current) {
            console.log('使用系统默认空间:', config.defaultSpaceId)
            setSelectedSpaceId(config.defaultSpaceId)
            return
          } else {
            console.log('未找到系统默认空间，将选择第一个可用空间')
          }
        } else {
          console.log('获取系统配置失败，状态码:', configResponse.status)
        }

        // 如果没有默认空间或系统配置获取失败，获取第一个可用空间作为备用
        if (!selectedSpaceId && mounted.current) {
          console.log('开始获取第一个可用空间...')
          const spacesResponse = await fetch('/api/spaces', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

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
            
            console.log('获取到的空间数据:', spaces)
            if (spaces.length > 0 && mounted.current) {
              console.log('使用第一个可用空间作为默认空间:', spaces[0].id)
              setSelectedSpaceId(spaces[0].id)
            }
          } else {
            console.log('获取空间数据失败，状态码:', spacesResponse.status)
          }
        }
      } catch (error) {
        if (mounted.current) {
          console.error(t('setDefaultSpaceFailed'), error)
        }
      }
    }

    // 只有在用户完全认证完成且未初始化的情况下才设置默认空间
    console.log('HomePage useEffect:', { 
      checkingInit, 
      loading, 
      needsInit, 
      isAuthenticated, 
      hasToken: !!token, 
      hasUser: !!user,
      selectedSpaceId,
      defaultSpaceInit: defaultSpaceInit.current // 添加初始化状态检查
    })
    
    // 等待所有初始状态都完成后再设置默认空间，且只执行一次
    if (!checkingInit && !loading && !needsInit && isAuthenticated && token && user && !selectedSpaceId && !defaultSpaceInit.current) {
      console.log('开始执行默认空间设置...')
      defaultSpaceInit.current = true // 标记已开始初始化
      // 添加一个小延迟，确保AppContext完全恢复状态
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          setDefaultSpace()
        }
      }, 200)
      return () => {
        isMounted = false
        clearTimeout(timeoutId)
      }
    }
  }, [checkingInit, loading, needsInit, isAuthenticated, token, user])

  const checkInitStatus = async () => {
    try {
      const response = await fetch('/api/auth/init')
      const data = await response.json()
      setNeedsInit(data.needsInit)
    } catch (error) {
      console.error(t('checkInitFailed'), error)
    } finally {
      setCheckingInit(false)
    }
  }

  if (checkingInit || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('loading')}</div>
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
          isOpen={isMobile ? true : isSidebarOpen}
          selectedSpaceId={selectedSpaceId}
          selectedFolderId={selectedFolderId}
          onSelectSpace={setSelectedSpaceId}
          onSelectFolder={setSelectedFolderId}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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
