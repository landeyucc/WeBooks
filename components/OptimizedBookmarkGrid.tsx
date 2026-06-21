'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  folderId: string | null
  folderName: string
  directBookmarks: Bookmark[]
  totalBookmarks: number
  hasChildren: boolean
  children: FolderGroup[]
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
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 从空间数据中获取文件夹和书签 - 使用 useMemo 稳定引用
  const folders = useMemo(() => currentSpaceData?.folders ?? [], [currentSpaceData])
  const bookmarks = useMemo(() => currentSpaceData?.bookmarks ?? [], [currentSpaceData])

  // 预构建索引：避免多次 O(n) filter 操作
  const { childFolderIndex, bookmarkFolderIndex, folderMap } = useMemo(() => {
    const childFolderIndex = new Map<string | null, Folder[]>()
    const bookmarkFolderIndex = new Map<string, Bookmark[]>()
    const folderMap = new Map<string, Folder>()

    // 构建 parentFolderId -> children[] 的索引
    for (const folder of folders) {
      folderMap.set(folder.id, folder)
      const parentId = folder.parentFolderId
      if (!childFolderIndex.has(parentId)) {
        childFolderIndex.set(parentId, [])
      }
      childFolderIndex.get(parentId)!.push(folder)
    }

    // 构建 folderId -> bookmarks[] 的索引
    for (const bookmark of bookmarks) {
      const fid = bookmark.folderId
      if (!bookmarkFolderIndex.has(fid ?? '')) {
        bookmarkFolderIndex.set(fid ?? '', [])
      }
      bookmarkFolderIndex.get(fid ?? '')!.push(bookmark)
    }

    return { childFolderIndex, bookmarkFolderIndex, folderMap }
  }, [folders, bookmarks])

  // 排序书签的辅助函数（用于搜索结果）
  const sortBookmarks = useCallback((bookmarksToSort: Bookmark[]) => {
    return [...bookmarksToSort].sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      
      if (sortOrder === 'asc') {
        return aTitle.localeCompare(bTitle, 'zh-Hans-CN')
      } else {
        return bTitle.localeCompare(aTitle, 'zh-Hans-CN')
      }
    })
  }, [sortOrder])

  // 构建文件夹组 - 树形嵌套结构（使用预构建索引避免多次 O(n) filter）
  const folderGroups = useMemo(() => {
    if (!folders.length && !bookmarks.length) return []

    // 递归构建文件夹组（树形结构）- 使用索引 O(1) 查找
    const buildFolderTree = (
      parentFolderId: string | null,
      basePath: string[] = []
    ): FolderGroup[] => {
      const childFolders = childFolderIndex.get(parentFolderId) ?? []

      const groups: FolderGroup[] = []
      for (const folder of childFolders) {
        const currentPath = [...basePath, folder.name]

        // 使用预构建索引 O(1) 查找
        const directBookmarksList = bookmarkFolderIndex.get(folder.id) ?? []

        // 递归构建子文件夹组
        const children = buildFolderTree(folder.id, currentPath)

        // 计算包含子文件夹的总书签数
        const totalCount =
          directBookmarksList.length +
          children.reduce((sum, child) => sum + child.totalBookmarks, 0)

        groups.push({
          pathKey: currentPath.join('/'),
          path: currentPath,
          folderId: folder.id,
          folderName: folder.name,
          directBookmarks: sortBookmarks(directBookmarksList),
          totalBookmarks: totalCount,
          hasChildren: children.length > 0,
          children: children,
        })
      }

      // 排序同层级文件夹 - 按字母顺序
      groups.sort((a, b) => {
        const aKey = a.folderName.toLowerCase()
        const bKey = b.folderName.toLowerCase()

        if (sortOrder === 'asc') {
          return aKey.localeCompare(bKey, 'zh-Hans-CN')
        } else {
          return bKey.localeCompare(aKey, 'zh-Hans-CN')
        }
      })

      return groups
    }

    let tree: FolderGroup[] = []

    if (folderId) {
      // 如果选择了文件夹，只显示该文件夹及其子文件夹
      const selectedFolder = folderMap.get(folderId)
      if (selectedFolder) {
        // 从根向上构建路径
        const pathSegments: string[] = []
        let current: Folder | undefined = selectedFolder
        while (current) {
          pathSegments.unshift(current.name)
          current = current.parentFolderId
            ? folderMap.get(current.parentFolderId)
            : undefined
        }

        // 构建选中文件夹的直接书签和子组
        const directBookmarksList = bookmarkFolderIndex.get(folderId) ?? []
        const children = buildFolderTree(folderId, pathSegments)
        const totalCount =
          directBookmarksList.length +
          children.reduce((sum, child) => sum + child.totalBookmarks, 0)

        tree = [
          {
            pathKey: pathSegments.join('/'),
            path: pathSegments,
            folderId: folderId,
            folderName: selectedFolder.name,
            directBookmarks: sortBookmarks(directBookmarksList),
            totalBookmarks: totalCount,
            hasChildren: children.length > 0,
            children: children,
          },
        ]
      }
    } else {
      // 如果没有选择文件夹，从顶层文件夹开始构建
      tree = buildFolderTree(null, [])

      // 添加未分类组（使用索引查找）
      const uncategorizedBookmarks = bookmarkFolderIndex.get('') ?? []
      if (uncategorizedBookmarks.length > 0) {
        tree.push({
          pathKey: t('noFolder'),
          path: [],
          folderId: null,
          folderName: t('uncategorizedBookmarks'),
          directBookmarks: sortBookmarks(uncategorizedBookmarks),
          totalBookmarks: uncategorizedBookmarks.length,
          hasChildren: false,
          children: [],
        })
      }
    }

    return tree
  }, [folders, bookmarks, folderId, sortOrder, childFolderIndex, bookmarkFolderIndex, folderMap, sortBookmarks, t])

  // 计算总书签数（使用预构建索引，避免 O(n) filter）
  const totalBookmarks = useMemo(() => {
    // 如果没有选择文件夹，显示所有书签总数
    if (!folderId) {
      return bookmarks.length
    }
    // 使用 childFolderIndex 递归收集子文件夹 ID
    const allChildIds = new Set<string>()
    const collectAllChildIds = (parentId: string) => {
      allChildIds.add(parentId)
      const children = childFolderIndex.get(parentId) ?? []
      for (const child of children) {
        collectAllChildIds(child.id)
      }
    }
    collectAllChildIds(folderId)

    // 使用 bookmarkFolderIndex 累加书签数
    let count = 0
    const idsArray = Array.from(allChildIds)
    for (let i = 0; i < idsArray.length; i++) {
      count += (bookmarkFolderIndex.get(idsArray[i]) ?? []).length
    }
    return count
  }, [folderId, bookmarks.length, childFolderIndex, bookmarkFolderIndex])

  // 搜索过滤（debounced）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks([])
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
        searchTimerRef.current = null
      }
      return
    }

    // 防抖：用户停止输入 200ms 后才执行搜索
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim()
      const allBookmarks: Bookmark[] = []

      // 直接从所有书签中搜索
      bookmarks.forEach(bookmark => {
        const matchTitle = bookmark.title.toLowerCase().includes(query)
        const matchDescription = bookmark.description?.toLowerCase().includes(query)
        const matchUrl = bookmark.url.toLowerCase().includes(query)
        
        if (matchTitle || matchDescription || matchUrl) {
          allBookmarks.push(bookmark)
        }
      })

      setFilteredBookmarks(sortBookmarks(allBookmarks))
    }, 200)

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
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
    const collectAllKeys = (groups: FolderGroup[]): string[] => {
      const keys: string[] = []
      for (const g of groups) {
        keys.push(g.pathKey)
        if (g.children && g.children.length > 0) {
          keys.push(...collectAllKeys(g.children))
        }
      }
      return keys
    }

    setCollapsedGroups(prev => {
      const allKeys = collectAllKeys(folderGroups)
      const allCollapsed = allKeys.every(key => prev.has(key))
      if (allCollapsed) {
        return new Set()
      } else {
        return new Set(allKeys)
      }
    })
  }, [folderGroups])

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

  const buildFolderPath = useCallback((folderId: string | null, foldersList: Folder[]): string => {
    if (!folderId) return ''
    const path: string[] = []
    let current: Folder | undefined = foldersList.find(f => f.id === folderId)
    while (current) {
      path.unshift(current.name)
      current = current.parentFolderId ? foldersList.find(f => f.id === current!.parentFolderId) : undefined
    }
    return path.join(' / ')
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
              <span>{(() => {
                const collectAllKeys = (groups: FolderGroup[]): string[] => {
                  const keys: string[] = []
                  for (const g of groups) {
                    keys.push(g.pathKey)
                    if (g.children && g.children.length > 0) {
                      keys.push(...collectAllKeys(g.children))
                    }
                  }
                  return keys
                }
                const allKeys = collectAllKeys(folderGroups)
                const allCollapsed = allKeys.length > 0 && allKeys.every(key => collapsedGroups.has(key))
                return allCollapsed ? '展开全部' : '折叠全部'
              })()}</span>
              <i className={`fas fa-${(() => {
                const collectAllKeys = (groups: FolderGroup[]): string[] => {
                  const keys: string[] = []
                  for (const g of groups) {
                    keys.push(g.pathKey)
                    if (g.children && g.children.length > 0) {
                      keys.push(...collectAllKeys(g.children))
                    }
                  }
                  return keys
                }
                const allKeys = collectAllKeys(folderGroups)
                const allCollapsed = allKeys.length > 0 && allKeys.every(key => collapsedGroups.has(key))
                return allCollapsed ? 'expand' : 'compress'
              })()}`}></i>
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
              const folderPath = buildFolderPath(bookmark.folderId, folders)
              const bookmarkWithFolder = { ...bookmark, folder: folder || null, folderPath }
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
        (() => {
          const renderFolderGroup = (
            group: FolderGroup,
            level: number
          ): React.ReactNode => {
            const isUncategorized = group.folderId === null
            const isCollapsed = collapsedGroups.has(group.pathKey)
            const isTopLevel = level === 0
            const hasContent =
              group.directBookmarks.length > 0 || group.children.length > 0

            return (
              <div
                key={group.pathKey}
                className="space-y-3"
              >
                <div
                  className="flex items-center gap-2 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors py-2 min-w-0"
                  onClick={() => toggleGroupCollapse(group.pathKey)}
                  style={{ paddingLeft: `calc(0.5rem + ${level * 1.5}rem)` }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <i
                      className={`fas fa-chevron-${
                        isCollapsed ? 'right' : 'down'
                      } text-gray-400 transition-transform w-4 flex-shrink-0`}
                    ></i>
                    {isUncategorized ? (
                      <>
                        <i className="fas fa-folder-open text-red-500 dark:text-red-400 flex-shrink-0"></i>
                        <h2
                          className={`${
                            isTopLevel ? 'text-lg' : 'text-base'
                          } font-semibold flex items-center gap-2`}
                        >
                          <span className="text-red-500 dark:text-red-400 font-bold">
                            {group.folderName}
                          </span>
                        </h2>
                      </>
                    ) : (
                      <>
                        <i
                          className={`fas fa-${
                            isCollapsed ? 'folder' : 'folder-open'
                          } ${
                            isTopLevel
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-blue-400 dark:text-blue-300'
                          } flex-shrink-0`}
                        ></i>
                        <h2
                          className={`${
                            isTopLevel ? 'text-lg' : 'text-sm'
                          } font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-x-auto scrollbar-thin`}
                          title={group.path.join(' / ')}
                        >
                          {isTopLevel
                            ? group.path.join(' / ')
                            : group.folderName}
                        </h2>
                      </>
                    )}
                    <span
                      className={`${
                        isTopLevel ? 'text-sm' : 'text-xs'
                      } text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md flex-shrink-0`}
                    >
                      {group.totalBookmarks}
                    </span>
                  </div>
                </div>

                {!isCollapsed && hasContent && (
                  <div className="space-y-4">
                    {group.directBookmarks.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.directBookmarks.map((bookmark) => {
                          const folder = folders.find(
                            (f) => f.id === bookmark.folderId
                          )
                          const folderPath = buildFolderPath(
                            bookmark.folderId,
                            folders
                          )
                          const bookmarkWithFolder = {
                            ...bookmark,
                            folder: folder || null,
                            folderPath,
                          }
                          return (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmarkWithFolder}
                              hoveredBookmarkId={hoveredBookmarkId}
                              mousePosition={mousePosition}
                              onMouseEnter={handleMouseEnter}
                              onMouseMove={handleMouseMove}
                              onMouseLeave={handleMouseLeave}
                              calculateTooltipPosition={
                                calculateTooltipPosition
                              }
                              t={t}
                            />
                          )
                        })}
                      </div>
                    )}

                    {group.children.length > 0 && (
                      <div className="space-y-3">
                        {group.children.map((child) =>
                          renderFolderGroup(child, level + 1)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          return folderGroups.map((g) => renderFolderGroup(g, 0))
        })()
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
