'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import RobustImage from './RobustImage'
import LoadingSpinner from './LoadingSpinner'

interface Bookmark {
  id: string
  title: string
  url: string
  description: string | null
  iconUrl: string | null
  spaceId: string
  folderId: string | null
  space: {
    id: string
    name: string
  }
  folder: {
    id: string
    name: string
    parentFolderId: string | null
  } | null
}

interface BookmarkGridProps {
  spaceId: string | null
  folderId: string | null
  searchQuery: string
}

// 验证图片URL格式是否正确
const isValidImageUrl = (url: string): boolean => {
  try {
    // 清理URL，移除开头、末尾的多余空格、括号等字符
    const cleanUrl = url.trim().replace(/^[\s(]+|[\s)]+$/g, '')
    
    // 检查是否为base64 data URI格式
    if (cleanUrl.startsWith('data:')) {
      // 检查是否为图片data URI
      const dataUriMatch = cleanUrl.match(/^data:image\/(jpg|jpeg|png|gif|webp|svg|ico);base64,/i)
      return !!dataUriMatch
    }
    
    // 检查URL是否以 http:// 或 https:// 开头
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return false
    }

    // 尝试解析URL，失败则返回false
    new URL(cleanUrl)
    
    // 检查是否为图片URL（有图片扩展名或包含图片相关参数）
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i
    return imageExtensions.test(cleanUrl)
  } catch {
    return false
  }
}

interface Folder {
  id: string
  name: string
  spaceId: string
  parentFolderId: string | null
}

export default function BookmarkGrid({ spaceId, folderId, searchQuery }: BookmarkGridProps) {
  const { t, token } = useApp()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // 使用useRef缓存上次请求的参数，避免重复请求
  const lastRequestRef = useRef<string>('')

  // 移动端检测
  const [isMobile, setIsMobile] = useState(false)

  // 获取文件夹完整路径
  const getFolderPath = useCallback((folderId: string, foldersList: Folder[]): string[] => {
    const allFolders = foldersList || []
    const visited = new Set<string>()
    
    const buildPath = (currentFolderId: string): string[] => {
      if (visited.has(currentFolderId)) return [] 
      visited.add(currentFolderId)
      
      const folder = allFolders.find(f => f.id === currentFolderId)
      if (!folder) return []
      
      if (!folder.parentFolderId) {
        return [folder.name]
      }
      
      const parentPath = buildPath(folder.parentFolderId)
      return [...parentPath, folder.name]
    }
    
    return buildPath(folderId)
  }, [])

  // 按文件夹路径分组书签
  const groupBookmarksByFolder = useCallback((): { 
    groups: Record<string, Bookmark[]>, 
    folderPaths: Record<string, string[]> 
  } => {
    const groups: Record<string, Bookmark[]> = {}
    const folderPaths: Record<string, string[]> = {}

    // 无文件夹的书签
    groups[t('noFolder')] = []
    folderPaths[t('noFolder')] = []

    // 有文件夹的书签
    bookmarks.forEach(bookmark => {
      if (bookmark.folderId) {
        const path = getFolderPath(bookmark.folderId, folders)
        
        // 如果路径为空，视为无文件夹
        if (path.length === 0) {
          console.warn(`书签 "${bookmark.title}" 的文件夹路径为空，将其归类为无文件夹`)
          groups[t('noFolder')].push(bookmark)
        } else {
          const pathKey = path.join('/')
          
          if (!groups[pathKey]) {
            groups[pathKey] = []
            folderPaths[pathKey] = path
          }
          groups[pathKey].push(bookmark)
        }
      } else {
        groups[t('noFolder')].push(bookmark)
      }
    })

    return { groups, folderPaths }
  }, [bookmarks, folders, getFolderPath, t])

  const fetchBookmarks = useCallback(async () => {
    // 生成请求参数的关键字用于去重
    const requestKey = `${spaceId || ''}-${folderId || ''}-${searchQuery || ''}`
    
    // 如果请求参数没有变化，跳过请求
    if (lastRequestRef.current === requestKey && bookmarks.length > 0) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (spaceId) params.append('spaceId', spaceId)
      if (folderId) params.append('folderId', folderId)
      if (searchQuery) params.append('search', searchQuery)

      // 根据认证状态决定是否使用Authorization头
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const [bookmarksResponse, foldersResponse] = await Promise.all([
        fetch(`/api/bookmarks?${params.toString()}`, { headers }),
        fetch(`/api/folders?${params.toString()}`, { headers })
      ])

      const bookmarksData = await bookmarksResponse.json()
      const foldersData = await foldersResponse.json()
      
      setBookmarks(bookmarksData.bookmarks || [])
      setFolders(foldersData.folders || [])
      lastRequestRef.current = requestKey 
    } catch (error) {
      console.error(t('fetchBookmarksFailed'), error)
    } finally {
      setLoading(false)
    }
  }, [spaceId, folderId, searchQuery, token, bookmarks.length, t]) // 添加t函数依赖

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

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

  // 计算智能定位
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
    
    // 确保不超出上边缘
    if (top < margin && top < mouseY) {
      top = mouseY + gap  
    }
    
    return { left, top }
  }

  // 处理鼠标悬浮开始 
  const handleMouseEnter = useCallback((e: React.MouseEvent, bookmarkId: string) => {
    // 移动端禁用详细信息描述框
    if (isMobile) return
    
    // 清理之前的定时器
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    
    // 获取真实鼠标光标位置
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    setMousePosition({ x: mouseX, y: mouseY })
    
    // 优化：使用useCallback和setTimeout的引用保持稳定，避免频繁创建新的定时器
    const timeout = setTimeout(() => {
      setHoveredBookmarkId(bookmarkId)
    }, 300) 
    setHoverTimeout(timeout)
  }, [isMobile, hoverTimeout])

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



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  // 按文件夹路径分组书签
  const { groups, folderPaths } = groupBookmarksByFolder()
  
  // 获取所有非空分组，按文件夹层级排序
  const sortedGroups = Object.keys(groups).filter(groupKey => groups[groupKey].length > 0).sort((a, b) => {
    if (a === t('noFolder')) return 1 
    if (b === t('noFolder')) return -1
    
    const depthA = folderPaths[a].length
    const depthB = folderPaths[b].length
    
    // 浅层文件夹优先，然后按路径字典序排序
    if (depthA !== depthB) {
      return depthA - depthB
    }
    return a.localeCompare(b)
  })

  if (sortedGroups.length === 0) {
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
    <div className="p-6 space-y-8">
      {sortedGroups.map((groupKey) => {
        const groupBookmarks = groups[groupKey]
        const folderPath = folderPaths[groupKey]
        
        if (groupBookmarks.length === 0) return null

        return (
          <div key={groupKey} className="space-y-4">
            {/* 分组标题 */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center gap-2">
                {groupKey === t('noFolder') ? (
                  <>
                    <i className="fas fa-folder-open text-red-500 dark:text-red-400"></i>
                    <h2 className="text-lg font-semibold">
                      <span className="text-red-500 dark:text-red-400 font-bold">
                        {t('uncategorizedBookmarks')}
                      </span>
                    </h2>
                  </>
                ) : (
                  <>
                    <i className="fas fa-folder text-blue-500 dark:text-blue-400"></i>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {folderPath.join(' / ')}
                    </h2>
                  </>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {groupBookmarks.length}
                </span>
              </div>
            </div>
            
            {/* 该分组下的书签网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupBookmarks.map((bookmark) => (
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
                        {(() => {
                          if (!bookmark.iconUrl) return null
                          const cleanUrl = bookmark.iconUrl.trim().replace(/^[\s(]+|[\s)]+$/g, '')
                          return isValidImageUrl(cleanUrl) ? (
                            <RobustImage
                              src={cleanUrl}
                              alt={bookmark.title}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.nextElementSibling!.classList.remove('hidden')
                              }}
                            />
                          ) : null
                        })()}
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
      })}
    </div>
  )
}
