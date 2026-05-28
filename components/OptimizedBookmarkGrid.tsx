'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import LoadingSpinner from './LoadingSpinner'
import BookmarkCard from './BookmarkCard'

interface Bookmark {
  id: string
  title: string
  url: string
  description: string | null
  iconUrl: string | null
  spaceId: string
  folderId: string | null
}

interface Folder {
  id: string
  name: string
  spaceId: string
  parentFolderId: string | null
}

interface FolderGroup {
  pathKey: string
  path: string[]
  folderIds: string[]
  bookmarks: Bookmark[]
}

interface OptimizedBookmarkGridProps {
  spaceId?: string | null
  folderId: string | null
  searchQuery?: string
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export default function OptimizedBookmarkGrid({ 
  folderId, 
  searchQuery = '', 
  sortOrder, 
  onSortOrderChange 
}: OptimizedBookmarkGridProps) {
  const { t, currentSpaceData, isLoadingSpaceData } = useApp()
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sortBy] = useState<'title' | 'createdAt'>('title')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 从空间数据中获取文件夹和书签
  const { folders = [], bookmarks = [] } = currentSpaceData || {}

  // 排序书签的辅助函数（用于搜索结果）
  const sortBookmarks = useCallback((bookmarksToSort: Bookmark[]) => {
    return [...bookmarksToSort].sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      
      const isChineseA = /[\u4e00-\u9fa5]/.test(aTitle)
      const isChineseB = /[\u4e00-\u9fa5]/.test(bTitle)
      
      if (isChineseA && !isChineseB) return 1
      if (!isChineseA && isChineseB) return -1
      
      if (sortOrder === 'asc') {
        return aTitle.localeCompare(bTitle, 'zh-CN')
      } else {
        return bTitle.localeCompare(aTitle, 'zh-CN')
      }
    })
  }, [sortOrder])

  // 构建文件夹组
  const folderGroups = useMemo(() => {
    if (!folders.length && !bookmarks.length) return []

    const groups: FolderGroup[] = []
    const allChildIds = new Set<string>()
    
    // 排序书签的辅助函数（内部实现，避免循环依赖）
    const sortBookmarksInternal = (bookmarksToSort: Bookmark[]) => {
      return [...bookmarksToSort].sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        
        const isChineseA = /[\u4e00-\u9fa5]/.test(aTitle)
        const isChineseB = /[\u4e00-\u9fa5]/.test(bTitle)
        
        if (isChineseA && !isChineseB) return 1
        if (!isChineseA && isChineseB) return -1
        
        if (sortOrder === 'asc') {
          return aTitle.localeCompare(bTitle, 'zh-CN')
        } else {
          return bTitle.localeCompare(aTitle, 'zh-CN')
        }
      })
    }
    
    // 递归收集所有子文件夹ID
    const collectAllChildIds = (parentId: string) => {
      const children = folders.filter(f => f.parentFolderId === parentId)
      for (const child of children) {
        allChildIds.add(child.id)
        collectAllChildIds(child.id)
      }
    }
    
    if (folderId) {
      allChildIds.add(folderId)
      collectAllChildIds(folderId)
    }

    // 筛选出需要处理的文件夹
    let targetFolders: Folder[] = []
    
    if (folderId) {
      // 如果选择了文件夹，只显示该文件夹及其子文件夹
      targetFolders = folders.filter(f => allChildIds.has(f.id))
    } else {
      // 如果没有选择文件夹，显示所有顶层文件夹
      targetFolders = folders.filter(f => !f.parentFolderId)
    }

    // 递归构建文件夹路径和组
    const buildGroup = (folder: Folder, basePath: string[] = []): FolderGroup => {
      const currentPath = [...basePath, folder.name]
      const folderIds = [folder.id]
      
      // 收集所有子文件夹ID
      const collectChildren = (parentId: string) => {
        const children = folders.filter(f => f.parentFolderId === parentId)
        for (const child of children) {
          folderIds.push(child.id)
          collectChildren(child.id)
        }
      }
      collectChildren(folder.id)

      // 收集该文件夹及其子文件夹下的所有书签
      const groupBookmarks = bookmarks.filter(b => 
        folderIds.includes(b.folderId || '')
      )

      return {
        pathKey: currentPath.join('/'),
        path: currentPath,
        folderIds,
        bookmarks: sortBookmarksInternal(groupBookmarks)
      }
    }

    // 构建顶层文件夹组
    for (const folder of targetFolders) {
      groups.push(buildGroup(folder))
      
      // 递归构建子文件夹组
      const buildSubGroups = (parentId: string, basePath: string[]) => {
        const children = folders.filter(f => f.parentFolderId === parentId)
        for (const child of children) {
          groups.push(buildGroup(child, basePath))
          buildSubGroups(child.id, [...basePath, child.name])
        }
      }
      buildSubGroups(folder.id, [folder.name])
    }

    // 只有在没有选择文件夹时，才添加未分类组（无论是否有其他文件夹）
    if (!folderId) {
      const uncategorizedBookmarks = bookmarks.filter(b => !b.folderId)
      if (uncategorizedBookmarks.length > 0) {
        groups.push({
          pathKey: t('noFolder'),
          path: [],
          folderIds: [],
          bookmarks: sortBookmarksInternal(uncategorizedBookmarks)
        })
      }
    }

    // 排序组
    const sortedGroups = groups.sort((a, b) => {
      if (a.pathKey === t('noFolder')) return 1
      if (b.pathKey === t('noFolder')) return -1
      const depthA = a.path.length
      const depthB = b.path.length
      if (depthA !== depthB) return depthA - depthB
      
      const aKey = a.pathKey
      const bKey = b.pathKey
      
      const isChineseA = /[\u4e00-\u9fa5]/.test(aKey)
      const isChineseB = /[\u4e00-\u9fa5]/.test(bKey)
      
      if (isChineseA && !isChineseB) return 1
      if (!isChineseA && isChineseB) return -1
      
      if (sortOrder === 'asc') {
        return aKey.localeCompare(bKey, 'zh-CN')
      } else {
        return bKey.localeCompare(aKey, 'zh-CN')
      }
    })

    return sortedGroups
  }, [folders, bookmarks, folderId, sortOrder, t])

  // 计算总书签数
  const totalBookmarks = useMemo(() => {
    // 如果没有选择文件夹，显示所有书签总数
    if (!folderId) {
      return bookmarks.length
    }
    // 如果选择了文件夹，直接计算该文件夹及其子文件夹的书签数（避免重复计算）
    const allChildIds = new Set<string>()
    const collectAllChildIds = (parentId: string) => {
      allChildIds.add(parentId)
      const children = folders.filter(f => f.parentFolderId === parentId)
      for (const child of children) {
        collectAllChildIds(child.id)
      }
    }
    collectAllChildIds(folderId)
    
    return bookmarks.filter(b => b.folderId && allChildIds.has(b.folderId)).length
  }, [folderId, bookmarks, folders])

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks([])
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const allBookmarks: Bookmark[] = []

    // 直接从所有书签中搜索，不受文件夹筛选影响
    bookmarks.forEach(bookmark => {
      const matchTitle = bookmark.title.toLowerCase().includes(query)
      const matchDescription = bookmark.description?.toLowerCase().includes(query)
      const matchUrl = bookmark.url.toLowerCase().includes(query)
      
      if (matchTitle || matchDescription || matchUrl) {
        allBookmarks.push(bookmark)
      }
    })

    setFilteredBookmarks(sortBookmarks(allBookmarks))
  }, [searchQuery, bookmarks, sortBookmarks])

  // 响应式和滚动监听
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 返回顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  // 一键折叠/展开所有
  const toggleAllGroups = useCallback(() => {
    const allCollapsed = folderGroups.every(group => collapsedGroups.has(group.pathKey))
    if (allCollapsed) {
      setCollapsedGroups(new Set())
    } else {
      setCollapsedGroups(new Set(folderGroups.map(group => group.pathKey)))
    }
  }, [folderGroups, collapsedGroups])

  // 工具函数
  const calculateTooltipPosition = useCallback((mouseX: number, mouseY: number) => {
    if (typeof window === 'undefined') return { left: 0, top: 0 }

    const tooltipWidth = 320
    const tooltipHeight = 200
    const margin = 8
    const gap = 8
    
    let left = mouseX
    let top = mouseY + gap
    
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = mouseY - tooltipHeight - gap
    }
    
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = mouseX - tooltipWidth
    }
    
    if (left < margin) {
      left = margin
    }
    
    if (top < margin && top < mouseY) {
      top = mouseY + gap  
    }
    
    return { left, top }
  }, [])

  const handleMouseEnter = useCallback((e: React.MouseEvent, bookmarkId: string) => {
    if (isMobile) return
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    setMousePosition({ x: mouseX, y: mouseY })
    
    const timeout = setTimeout(() => {
      setHoveredBookmarkId(bookmarkId)
    }, 300) 
    setHoverTimeout(timeout)
  }, [isMobile, hoverTimeout])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [isMobile])

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setHoveredBookmarkId(null)
    setMousePosition(null)
  }, [isMobile, hoverTimeout])

  const toggleSort = useCallback(() => {
    if (sortOrder === 'asc') {
      onSortOrderChange('desc')
    } else {
      onSortOrderChange('asc')
    }
  }, [sortOrder, onSortOrderChange])

  const toggleGroupCollapse = useCallback((pathKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pathKey)) {
        newSet.delete(pathKey)
      } else {
        newSet.add(pathKey)
      }
      return newSet
    })
  }, [])

  // 加载状态
  if (isLoadingSpaceData) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message={t('loadingSpaceData')} />
      </div>
    )
  }

  // 没有空间数据
  if (!currentSpaceData) {
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
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <p>{t('selectSpaceFirst')}</p>
        </div>
      </div>
    )
  }

  // 没有书签
  if (totalBookmarks === 0) {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {searchQuery.trim() ? (
            <span>{t('searchResultsFor', { query: searchQuery, count: filteredBookmarks.length })}</span>
          ) : (
            <span>{t('showingAllBookmarks', { count: totalBookmarks })}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!searchQuery.trim() && (
            <button
              onClick={toggleAllGroups}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <span>{folderGroups.every(group => collapsedGroups.has(group.pathKey)) ? '展开全部' : '折叠全部'}</span>
              <i className={`fas fa-${folderGroups.every(group => collapsedGroups.has(group.pathKey)) ? 'expand' : 'compress'}`}></i>
            </button>
          )}
          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span>{t('sortBy')}: {sortBy === 'title' ? t('bookmarkTitle') : t('createdAt')}</span>
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'alpha-up' : 'alpha-down'}`}></i>
          </button>
        </div>
      </div>
      
      {searchQuery.trim() ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => {
              const folder = folders.find(f => f.id === bookmark.folderId)
              const bookmarkWithFolder = { ...bookmark, folder: folder || null }
              return (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmarkWithFolder}
                  hoveredBookmarkId={hoveredBookmarkId}
                  mousePosition={mousePosition}
                  onMouseEnter={handleMouseEnter}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  calculateTooltipPosition={calculateTooltipPosition}
                  t={t}
                />
              )
            })
          ) : (
            <div className="col-span-full flex items-center justify-center h-64">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p>{t('noSearchResults', { query: searchQuery })}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        folderGroups.map((group) => {
          const isUncategorized = group.pathKey === t('noFolder')
          const isCollapsed = collapsedGroups.has(group.pathKey)

          return (
            <div key={group.pathKey} className="space-y-4">
              <div 
                className="flex items-center gap-3 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors py-2"
                onClick={() => toggleGroupCollapse(group.pathKey)}
              >
                <div className="flex items-center gap-2">
                  <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'} text-gray-400 transition-transform w-4`}></i>
                  {isUncategorized ? (
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
                      <i className={`fas fa-${isCollapsed ? 'folder' : 'folder-open'} text-blue-500 dark:text-blue-400`}></i>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {group.path.join(' / ')}
                      </h2>
                    </>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {group.bookmarks.length}
                  </span>
                </div>
              </div>
              
              {!isCollapsed && group.bookmarks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.bookmarks.map((bookmark) => {
                    const folder = folders.find(f => f.id === bookmark.folderId)
                    const bookmarkWithFolder = { ...bookmark, folder: folder || null }
                    return (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmarkWithFolder}
                        hoveredBookmarkId={hoveredBookmarkId}
                        mousePosition={mousePosition}
                        onMouseEnter={handleMouseEnter}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        calculateTooltipPosition={calculateTooltipPosition}
                        t={t}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
      
      {/* 返回顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="返回顶部"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}
    </div>
  )
}
