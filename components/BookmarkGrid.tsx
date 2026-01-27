'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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

interface Folder {
  id: string
  name: string
  spaceId: string
  parentFolderId: string | null
}

const PAGE_SIZE = 24

const isValidImageUrl = (url: string): boolean => {
  try {
    const cleanUrl = url.trim().replace(/^[\s(]+|[\s)]+$/g, '')
    if (cleanUrl.startsWith('data:')) {
      const dataUriMatch = cleanUrl.match(/^data:image\/(jpg|jpeg|png|gif|webp|svg|ico);base64,/i)
      return !!dataUriMatch
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return false
    }
    new URL(cleanUrl)
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i
    return imageExtensions.test(cleanUrl)
  } catch {
    return false
  }
}

export default function BookmarkGrid({ spaceId, folderId, searchQuery }: BookmarkGridProps) {
  const { t, token } = useApp()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const lastRequestRef = useRef<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  const groupBookmarksByFolder = useCallback((): { 
    groups: Record<string, Bookmark[]>, 
    folderPaths: Record<string, string[]> 
  } => {
    const groups: Record<string, Bookmark[]> = {}
    const folderPaths: Record<string, string[]> = {}

    groups[t('noFolder')] = []
    folderPaths[t('noFolder')] = []

    bookmarks.forEach(bookmark => {
      if (bookmark.folderId) {
        const path = getFolderPath(bookmark.folderId, folders)
        
        if (path.length === 0) {
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

  const fetchBookmarks = useCallback(async (page: number, isLoadMore = false) => {
    const requestKey = `${spaceId || ''}-${folderId || ''}-${searchQuery || ''}-${page}`
    
    if (!isLoadMore && lastRequestRef.current === requestKey && !isLoadMore) {
      return
    }

    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (!isLoadMore) {
        const foldersParams = new URLSearchParams()
        if (spaceId) foldersParams.append('spaceId', spaceId)
        const foldersResponse = await fetch(`/api/folders?${foldersParams.toString()}`, { headers })
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders || [])
      }

      const params = new URLSearchParams()
      if (spaceId) params.append('spaceId', spaceId)
      if (folderId) params.append('folderId', folderId)
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', String(page))
      params.append('limit', String(PAGE_SIZE))

      const response = await fetch(`/api/bookmarks?${params.toString()}`, { headers })
      const data = await response.json()
      
      const newBookmarks = data.bookmarks || []
      const pagination = data.pagination || {}

      if (isLoadMore) {
        setBookmarks(prev => [...prev, ...newBookmarks])
      } else {
        setBookmarks(newBookmarks)
      }

      setCurrentPage(pagination.page || 1)
      setTotalPages(pagination.totalPages || 1)
      setTotalCount(pagination.total || 0)
      lastRequestRef.current = requestKey
    } catch (error) {
      console.error(t('fetchBookmarksFailed'), error)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }, [spaceId, folderId, searchQuery, token, t])

  useEffect(() => {
    lastRequestRef.current = ''
    setCurrentPage(1)
    fetchBookmarks(1)
  }, [fetchBookmarks])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && currentPage < totalPages && !isLoadingMore) {
        fetchBookmarks(currentPage + 1, true)
      }
    }, { threshold: 0.1 })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [currentPage, totalPages, isLoadingMore, fetchBookmarks])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const calculateTooltipPosition = useCallback((mouseX: number, mouseY: number) => {
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

  const { groups, folderPaths } = useMemo(() => groupBookmarksByFolder(), [groupBookmarksByFolder])
  
  const sortedGroups = useMemo(() => {
    return Object.keys(groups)
      .filter(groupKey => groups[groupKey].length > 0)
      .sort((a, b) => {
        if (a === t('noFolder')) return 1 
        if (b === t('noFolder')) return -1
        const depthA = folderPaths[a].length
        const depthB = folderPaths[b].length
        if (depthA !== depthB) return depthA - depthB
        return a.localeCompare(b)
      })
  }, [groups, folderPaths, t])

  if (loading && bookmarks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  if (bookmarks.length === 0 && !loading) {
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

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                          {bookmark.title}
                        </h3>
                        {bookmark.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {bookmark.description}
                          </p>
                        )}
                        <div className="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center">
                          <i className="fas fa-link mr-1"></i>
                          {new URL(bookmark.url).hostname}
                        </div>
                      </div>
                    </div>
                  </a>

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

      <div ref={loadMoreRef} className="text-center py-4">
        {isLoadingMore && (
          <LoadingSpinner size="md" message={t('loadingMore')} />
        )}
        {!isLoadingMore && currentPage < totalPages && (
          <p className="text-gray-500 text-sm">
            {t('scrollToLoadMore')}
          </p>
        )}
        {!isLoadingMore && currentPage >= totalPages && totalCount > 0 && (
          <p className="text-gray-400 text-sm">
            {t('showingAllBookmarks', { count: totalCount })}
          </p>
        )}
      </div>
    </div>
  )
}
