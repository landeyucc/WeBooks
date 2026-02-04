'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useApp } from '@/contexts/AppContext'
import LoadingSpinner from './LoadingSpinner'
import BookmarkCard from './BookmarkCard'

// 缓存过期时间（毫秒）
const BOOKMARK_CACHE_EXPIRY = 12 * 60 * 60 * 1000 // 12小时

// 直接使用 localStorage 处理动态缓存键
const loadBookmarkCache = (cacheKey: string): { data: unknown; timestamp: number } | null => {
  try {
    const cacheStr = localStorage.getItem(cacheKey)
    if (!cacheStr) return null

    const cacheItem = JSON.parse(cacheStr)
    
    // 检查缓存是否过期
    if (Date.now() - cacheItem.timestamp > BOOKMARK_CACHE_EXPIRY) {
      console.log('书签缓存已过期，清除:', cacheKey)
      localStorage.removeItem(cacheKey)
      return null
    }

    console.log('从缓存加载书签数据:', cacheKey)
    return { data: cacheItem.data, timestamp: cacheItem.timestamp }
  } catch (error) {
    console.error('加载书签缓存失败:', error)
    localStorage.removeItem(cacheKey)
    return null
  }
}

// 保存缓存数据
const saveBookmarkCache = (cacheKey: string, data: unknown, version: string): void => {
  try {
    const cacheItem = {
      data,
      version,
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
    console.log('保存书签缓存:', cacheKey)
  } catch (error) {
    console.error('保存书签缓存失败:', error)
  }
}

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
  searchQuery?: string
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
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
  isLoading: boolean
  hasMore: boolean
  page: number
}

const PAGE_SIZE = 24

export default function BookmarkGrid({ spaceId, folderId, searchQuery = '', sortOrder, onSortOrderChange }: BookmarkGridProps) {
  const { t, token } = useApp()
  const [folderGroups, setFolderGroups] = useState<FolderGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sortBy] = useState<'title' | 'createdAt'>('title')

  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<Set<string>>(new Set())

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAllChildFolderIds = (parentId: string, foldersList: Folder[]): string[] => {
    const ids: string[] = []
    const children = foldersList.filter(f => f.parentFolderId === parentId)
    for (const child of children) {
      ids.push(child.id)
      ids.push(...getAllChildFolderIds(child.id, foldersList))
    }
    return ids
  }

  const fetchFolderBookmarks = useCallback(async (group: FolderGroup, page: number) => {
    if (loadingRef.current.has(group.pathKey) || (!group.hasMore && page > 1)) {
      return
    }

    // 检查缓存
    const cacheKey = `bookmarks_${group.pathKey}_${page}`
    const cachedResult = loadBookmarkCache(cacheKey)
    
    if (cachedResult) {
      const cachedBookmarks = cachedResult.data as Bookmark[]
      console.log('从缓存加载书签数据:', cachedBookmarks.length)
      setFolderGroups(prev => prev.map(g => {
        if (g.pathKey === group.pathKey) {
          return {
            ...g,
            bookmarks: page === 1 ? cachedBookmarks : [...g.bookmarks, ...cachedBookmarks],
            page,
            isLoading: false,
            hasMore: cachedBookmarks.length >= PAGE_SIZE
          }
        }
        return g
      }))
      loadingRef.current.delete(group.pathKey)
      return
    }

    loadingRef.current.add(group.pathKey)

    setFolderGroups(prev => prev.map(g => {
      if (g.pathKey === group.pathKey) {
        return { ...g, isLoading: true }
      }
      return g
    }))

    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const params = new URLSearchParams()
      if (spaceId) params.append('spaceId', spaceId)
      if (group.folderIds.length > 0) {
        params.append('folderIds', group.folderIds.join(','))
      } else {
        params.append('noFolder', 'true')
      }
      params.append('page', String(page))
      params.append('limit', String(PAGE_SIZE))
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/bookmarks?${params.toString()}`, { headers })
      const data = await response.json()
      
      const newBookmarks = data.bookmarks || []
      const pagination = data.pagination || {}

      setFolderGroups(prev => prev.map(g => {
        if (g.pathKey === group.pathKey) {
          return {
            ...g,
            bookmarks: page === 1 ? newBookmarks : [...g.bookmarks, ...newBookmarks],
            isLoading: false,
            hasMore: pagination.hasMore,
            page
          }
        }
        return g
      }))

      // 保存到缓存
      const newCacheKey = `bookmarks_${group.pathKey}_${page}`
      console.log('保存书签数据到缓存:', newBookmarks.length)
      saveBookmarkCache(newCacheKey, newBookmarks, Date.now().toString())
    } catch (error) {
      console.error(t('fetchBookmarksFailed'), error)
      setFolderGroups(prev => prev.map(g => {
        if (g.pathKey === group.pathKey) {
          return { ...g, isLoading: false }
        }
        return g
      }))
    } finally {
      loadingRef.current.delete(group.pathKey)
    }
  }, [spaceId, token, t, sortBy, sortOrder])

  const loadVisibleGroups = useCallback(() => {
    if (typeof window === 'undefined') return

    let loadCount = 0
    folderGroups.forEach((group) => {
      const element = groupRefs.current.get(group.pathKey)
      if (!element) return

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const scrollY = window.scrollY
      
      const elementTop = rect.top + scrollY
      const elementBottom = elementTop + rect.height

      const viewportTop = scrollY - viewportHeight * 0.5
      const viewportBottom = scrollY + viewportHeight * 1.5

      const isVisible = elementBottom > viewportTop && elementTop < viewportBottom
      const isNearViewport = elementBottom > viewportTop - viewportHeight && elementTop < viewportBottom + viewportHeight

      if ((isVisible || isNearViewport) && !loadingRef.current.has(group.pathKey)) {
        if (group.page === 0 || (group.hasMore && group.bookmarks.length < (group.page * PAGE_SIZE))) {
          loadCount++
          fetchFolderBookmarks(group, group.page + 1)
        }
      }
    })
    
    if (loadCount > 0) {
      console.log('BookmarkGrid: loadVisibleGroups 加载了', loadCount, '个组')
    }
  }, [folderGroups, fetchFolderBookmarks])

  const isInitializing = useRef(false)
  const initializationPromise = useRef<Promise<void> | null>(null)
  const lastInitializedRef = useRef<{ spaceId: string | null; folderId: string | null; sortOrder: string } | null>(null)

  useEffect(() => {
    const initData = async () => {
      // 检查是否真的是新的空间、文件夹或排序
      const newKey = { spaceId, folderId, sortOrder }
      const lastKey = lastInitializedRef.current
      
      // 如果空间ID、文件夹ID和排序都没变，跳过初始化
      if (lastKey && lastKey.spaceId === spaceId && lastKey.folderId === folderId && lastKey.sortOrder === sortOrder) {
        console.log('BookmarkGrid: 跳过初始化，数据未变化')
        return
      }
      
      // 记录新的初始化状态
      lastInitializedRef.current = newKey
      console.log('BookmarkGrid: 开始初始化', { spaceId, folderId })

      if (isInitializing.current && initializationPromise.current) {
        return initializationPromise.current
      }

      isInitializing.current = true
      setLoading(true)

      const initPromise = (async () => {
        try {
          const headers: Record<string, string> = {}
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const foldersParams = new URLSearchParams()
          if (spaceId) foldersParams.append('spaceId', spaceId)
          if (folderId) foldersParams.append('parentFolderId', folderId)
          
          const foldersResponse = await fetch(`/api/folders?${foldersParams.toString()}`, { headers })
          if (!foldersResponse.ok) throw new Error('Failed to fetch folders')
          const foldersData = await foldersResponse.json()
          const foldersList: Folder[] = foldersData.folders || []

          const allChildIds = new Set<string>()
          
          const collectAllChildIds = (parentId: string) => {
            const children = foldersList.filter(f => f.parentFolderId === parentId)
            for (const child of children) {
              allChildIds.add(child.id)
              collectAllChildIds(child.id)
            }
          }
          
          if (folderId) {
            allChildIds.add(folderId)
            collectAllChildIds(folderId)
          }

          const topLevelFolders = folderId 
            ? foldersList.filter(f => f.parentFolderId === folderId)
            : foldersList.filter(f => !f.parentFolderId)

          const groups: FolderGroup[] = []

          if (folderId && topLevelFolders.length === 0) {
            const clickedFolder = foldersList.find(f => f.id === folderId)
            if (clickedFolder) {
              groups.push({
                pathKey: clickedFolder.name,
                path: [clickedFolder.name],
                folderIds: [folderId],
                bookmarks: [],
                isLoading: false,
                hasMore: true,
                page: 0
              })
            }
          }

          for (const folder of topLevelFolders) {
            const currentPath = [folder.name]
            const folderIds = [folder.id]
            
            const collectChildren = (parentId: string) => {
              const children = foldersList.filter(f => f.parentFolderId === parentId)
              for (const child of children) {
                folderIds.push(child.id)
                collectChildren(child.id)
              }
            }
            collectChildren(folder.id)

            const buildSubGroups = (parentId: string, basePath: string[]) => {
              const children = foldersList.filter(f => f.parentFolderId === parentId)
              for (const child of children) {
                const childPath = [...basePath, child.name]
                const childFolderIds = [child.id]
                
                const collectChildChildren = (id: string) => {
                  const subs = foldersList.filter(f => f.parentFolderId === id)
                  for (const sub of subs) {
                    childFolderIds.push(sub.id)
                    collectChildChildren(sub.id)
                  }
                }
                collectChildChildren(child.id)

                groups.push({
                  pathKey: childPath.join('/'),
                  path: childPath,
                  folderIds: childFolderIds,
                  bookmarks: [],
                  isLoading: false,
                  hasMore: true,
                  page: 0
                })

                buildSubGroups(child.id, childPath)
              }
            }

            groups.push({
              pathKey: currentPath.join('/'),
              path: currentPath,
              folderIds,
              bookmarks: [],
              isLoading: false,
              hasMore: true,
              page: 0
            })

            buildSubGroups(folder.id, currentPath)
          }

          const uncategorizedGroup: FolderGroup = {
            pathKey: t('noFolder'),
            path: [],
            folderIds: [],
            bookmarks: [],
            isLoading: false,
            hasMore: true,
            page: 0
          }

          if (!folderId && allChildIds.size > 0) {
            groups.push(uncategorizedGroup)
          }

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
              return aKey.localeCompare(bKey, 'en')
            } else {
              return bKey.localeCompare(aKey, 'en')
            }
          })

          setFolderGroups(sortedGroups)
          setDataReady(true)
        } catch (error) {
          console.error(t('fetchBookmarksFailed'), error)
          setFolderGroups([])
          setDataReady(true)
        } finally {
          setLoading(false)
          isInitializing.current = false
        }
      })()

      initializationPromise.current = initPromise
      return initPromise
    }

    initData()
  }, [spaceId, folderId, token, t, sortOrder])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(() => {
      loadVisibleGroups()
    }, { 
      rootMargin: '50% 0px 50% 0px',
      threshold: 0
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadVisibleGroups])

  useEffect(() => {
    folderGroups.forEach(group => {
      const element = groupRefs.current.get(group.pathKey)
      if (element && observerRef.current) {
        observerRef.current.observe(element)
      }
    })

    const currentRefs = new Map(groupRefs.current)

    return () => {
      if (observerRef.current) {
        currentRefs.forEach(element => {
          observerRef.current?.unobserve(element)
        })
      }
    }
  }, [folderGroups])

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (scrollTimer) return
      
      scrollTimer = setTimeout(() => {
        loadVisibleGroups()
        scrollTimer = null
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [loadVisibleGroups])

  useEffect(() => {
    const filterBookmarks = () => {
      if (!searchQuery.trim()) {
        setFilteredBookmarks([])
        return
      }

      const query = searchQuery.toLowerCase().trim()
      const allBookmarks: Bookmark[] = []

      folderGroups.forEach(group => {
        group.bookmarks.forEach(bookmark => {
          const matchTitle = bookmark.title.toLowerCase().includes(query)
          const matchDescription = bookmark.description?.toLowerCase().includes(query)
          const matchUrl = bookmark.url.toLowerCase().includes(query)
          
          if (matchTitle || matchDescription || matchUrl) {
            allBookmarks.push(bookmark)
          }
        })
      })

      setFilteredBookmarks(allBookmarks)
      console.log(`[BookmarkGrid] 搜索 "${searchQuery}" 找到 ${allBookmarks.length} 个书签`)
    }

    filterBookmarks()
  }, [searchQuery, folderGroups])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    const loadInitialGroups = () => {
      if (folderGroups.length === 0) return

      const sortedKeys = folderGroups.map(g => g.pathKey)
      const firstGroups = sortedKeys.slice(0, 2)

      firstGroups.forEach(pathKey => {
        const group = folderGroups.find(g => g.pathKey === pathKey)
        if (group && group.page === 0) {
          fetchFolderBookmarks(group, 1)
        }
      })
    }

    const timer = setTimeout(loadInitialGroups, 100)
    return () => clearTimeout(timer)
  }, [folderGroups, fetchFolderBookmarks])

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

  const loadMoreForGroup = useCallback((group: FolderGroup) => {
    if (!group.isLoading && group.hasMore) {
      fetchFolderBookmarks(group, group.page + 1)
    }
  }, [fetchFolderBookmarks])

  const sortOrderChanged = useRef(false)

  useEffect(() => {
    if (folderGroups.length === 0) return

    if (sortOrderChanged.current) {
      sortOrderChanged.current = false
      folderGroups.forEach(group => {
        if (group.page > 0) {
          fetchFolderBookmarks(group, 1)
        }
      })
    }
  }, [sortOrder, fetchFolderBookmarks, folderGroups])

  useEffect(() => {
    sortOrderChanged.current = true
  }, [sortOrder])

  const totalBookmarks = useMemo(() => {
    return folderGroups.reduce((sum, g) => sum + g.bookmarks.length, 0)
  }, [folderGroups])

  if (loading || !dataReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  const hasAnyBookmarks = folderGroups.some(g => g.bookmarks.length > 0)
  const hasUncategorized = folderGroups.some(g => g.pathKey === t('noFolder'))

  if (!hasAnyBookmarks && (!hasUncategorized || folderGroups.every(g => g.bookmarks.length === 0))) {
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
        <button
          onClick={toggleSort}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <span>{t('sortBy')}: {sortBy === 'title' ? t('bookmarkTitle') : t('createdAt')}</span>
          <i className={`fas fa-sort-${sortOrder === 'asc' ? 'alpha-up' : 'alpha-down'}`}></i>
        </button>
      </div>
      
      {searchQuery.trim() ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                hoveredBookmarkId={hoveredBookmarkId}
                mousePosition={mousePosition}
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                calculateTooltipPosition={calculateTooltipPosition}
                t={t}
              />
            ))
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
          const shouldShow = !isUncategorized || group.pathKey === t('noFolder')

          if (!shouldShow) return null

          return (
            <div 
              key={group.pathKey} 
              ref={(el) => {
                if (el) groupRefs.current.set(group.pathKey, el)
                else groupRefs.current.delete(group.pathKey)
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-2">
                <div className="flex items-center gap-2">
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
                      <i className="fas fa-folder text-blue-500 dark:text-blue-400"></i>
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
              
              {group.bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.bookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      hoveredBookmarkId={hoveredBookmarkId}
                      mousePosition={mousePosition}
                      onMouseEnter={handleMouseEnter}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      calculateTooltipPosition={calculateTooltipPosition}
                      t={t}
                    />
                  ))}
                </div>
              ) : group.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" message={t('loading')} />
                </div>
              ) : null}

              {group.hasMore && group.bookmarks.length > 0 && (
                <div className="text-center py-2">
                  <button
                    onClick={() => loadMoreForGroup(group)}
                    disabled={group.isLoading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {group.isLoading ? t('loadingMore') : t('loadMore')}
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
