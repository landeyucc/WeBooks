'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'

interface Bookmark {
  id: string
  title: string
  url: string
  description: string | null
  iconUrl: string | null
  space: {
    id: string
    name: string
  }
  folder: {
    id: string
    name: string
  } | null
}

interface BookmarkGridProps {
  spaceId: string | null
  folderId: string | null
  searchQuery: string
}

export default function BookmarkGrid({ spaceId, folderId, searchQuery }: BookmarkGridProps) {
  const { t, isAuthenticated, token } = useApp()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
  // 移动端检测
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBookmarks()
    }
  }, [spaceId, folderId, searchQuery, isAuthenticated, token])

  // 检测屏幕尺寸变化
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // 初始检查
    checkScreenSize()

    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 计算智能定位（防止超出屏幕边界）
  const calculateTooltipPosition = (mouseX: number, mouseY: number) => {
    const tooltipWidth = 320 // 提示框宽度 (w-80 = 320px)
    const tooltipHeight = 200 // 提示框估计高度
    const margin = 8 // 边缘安全距离
    const gap = 8 // 与光标之间的距离
    
    // 默认显示在下方
    let left = mouseX
    let top = mouseY + gap
    
    // 垂直边界检查：如果下方空间不够，则显示在上方
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = mouseY - tooltipHeight - gap
    }
    
    // 水平边界检查
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = mouseX - tooltipWidth
    }
    
    // 确保不超出左边缘
    if (left < margin) {
      left = margin
    }
    
    // 确保不超出上边缘（只在上方显示时生效）
    if (top < margin && top < mouseY) {
      top = mouseY + gap // 如果上方放不下，则放回下方
    }
    
    return { left, top }
  }

  // 处理鼠标悬浮开始
  const handleMouseEnter = (e: React.MouseEvent, bookmarkId: string) => {
    // 移动端禁用详细信息描述框
    if (isMobile) return
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    
    // 获取真实鼠标光标位置
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    setMousePosition({ x: mouseX, y: mouseY })
    
    const timeout = setTimeout(() => {
      setHoveredBookmarkId(bookmarkId)
    }, 500) // 1秒后显示
    setHoverTimeout(timeout)
  }

  // 处理鼠标移动 - 实时更新光标位置
  const handleMouseMove = (e: React.MouseEvent) => {
    // 移动端禁用详细信息描述框
    if (isMobile) return
    
    // 实时更新鼠标光标位置
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    setMousePosition({ x: mouseX, y: mouseY })
  }

  // 处理鼠标离开
  const handleMouseLeave = () => {
    // 移动端禁用详细信息描述框
    if (isMobile) return
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setHoveredBookmarkId(null)
    setMousePosition(null)
  }

  const fetchBookmarks = async () => {
    if (!isAuthenticated || !token) {
      console.log('BookmarkGrid: 用户未认证，跳过获取书签')
      return
    }
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (spaceId) params.append('spaceId', spaceId)
      if (folderId) params.append('folderId', folderId)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/bookmarks?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setBookmarks(data.bookmarks || [])
    } catch (error) {
      console.error(t('fetchBookmarksFailed'), error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-500">{t('loading')}</div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p>{t('noBookmarks')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="relative"
            onMouseEnter={(e) => handleMouseEnter(e, bookmark.id)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 block hover:scale-105 transition-transform duration-200"
            >
              <div className="flex items-start gap-3">
                {/* 图标 */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {bookmark.iconUrl ? (
                    <img
                      src={bookmark.iconUrl}
                      alt={bookmark.title}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling!.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <svg
                    className={`w-6 h-6 text-gray-400 ${bookmark.iconUrl ? 'hidden' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                    {bookmark.title}
                  </h3>
                  {bookmark.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {bookmark.description}
                    </p>
                  )}
                  {/* 显示链接域名 */}
                  <div className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center">
                    <i className="fas fa-link mr-1"></i>
                    {new URL(bookmark.url).hostname}
                  </div>
                </div>
              </div>
            </a>

            {/* 自定义悬浮提示框 - 跟随鼠标位置定位 */}
            {hoveredBookmarkId === bookmark.id && mousePosition && (
              <div 
                className="fixed z-[9999] w-80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600"
                style={{
                  left: calculateTooltipPosition(mousePosition.x, mousePosition.y).left,
                  top: calculateTooltipPosition(mousePosition.x, mousePosition.y).top,
                }}
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">{bookmark.title}</h4>
                  {bookmark.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">{bookmark.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <i className="fas fa-link text-blue-500 dark:text-blue-400"></i>
                    <span className="text-blue-500 dark:text-blue-400 break-all">{bookmark.url}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('tooltipInfoDisplay')}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
