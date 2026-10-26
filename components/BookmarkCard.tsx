import React, { useState } from 'react'
import RobustImage from './RobustImage'
import type { TranslationKey } from '@/lib/i18n'
import { useApp } from '@/contexts/AppContext'

interface BookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description: string | null
    iconUrl: string | null
    pinned?: boolean
    folder?: {
      name: string
    } | null
    folderPath?: string | null
  }
  hoveredBookmarkId: string | null
  mousePosition: { x: number, y: number } | null
  onMouseEnter: (e: React.MouseEvent, bookmarkId: string) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseLeave: () => void
  calculateTooltipPosition: (mouseX: number, mouseY: number) => { left: number, top: number }
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  onPinnedChange?: (bookmarkId: string, pinned: boolean) => void
}

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

export default function BookmarkCard({
  bookmark,
  hoveredBookmarkId,
  mousePosition,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  calculateTooltipPosition,
  t,
  onPinnedChange
}: BookmarkCardProps) {
  const { token, isAuthenticated } = useApp()
  const [pinnedState, setPinnedState] = useState<boolean | null>(null)
  const [pinning, setPinning] = useState(false)

  // 显示用的 pinned 值（本地状态优先回退到 props）
  const isPinned = pinnedState !== null ? pinnedState : !!bookmark.pinned

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token || pinning) return

    setPinning(true)
    const next = !isPinned
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: next }),
      })
      if (res.ok) {
        setPinnedState(next)
        onPinnedChange?.(bookmark.id, next)
      }
    } catch {
      // 忽略
    } finally {
      setPinning(false)
    }
  }

  return (
    <div
      className="relative group"
      onMouseEnter={(e) => onMouseEnter(e, bookmark.id)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* 置顶按钮：hover 显示，已置顶则常显 */}
      {isAuthenticated && (
        <button
          onClick={handleTogglePin}
          disabled={pinning}
          title={isPinned ? '取消置顶' : '置顶到开始页'}
          className={`absolute -top-2 -right-2 z-20 p-1.5 rounded-full transition-all ${
            isPinned
              ? 'bg-amber-400 hover:bg-amber-500 text-white shadow-md opacity-100'
              : 'bg-white dark:bg-gray-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-gray-400 hover:text-amber-500 border border-gray-200 dark:border-gray-600 shadow opacity-0 group-hover:opacity-100'
          } ${pinning ? 'animate-pulse' : ''}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21z"
            />
          </svg>
        </button>
      )}

      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card p-4 block hover:scale-105 transition-transform duration-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
            {bookmark.iconUrl && isValidImageUrl(bookmark.iconUrl.trim().replace(/^[\s(]+|[\s)]+$/g, '')) ? (
              <RobustImage
                src={bookmark.iconUrl.trim().replace(/^[\s(]+|[\s)]+$/g, '')}
                alt={bookmark.title}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.classList.add('hidden')
                }}
              />
            ) : null}
            <svg
              className={`w-6 h-6 text-gray-400 absolute inset-0 m-auto ${bookmark.iconUrl && isValidImageUrl(bookmark.iconUrl.trim().replace(/^[\s(]+|[\s)]+$/g, '')) ? 'hidden' : ''}`}
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
            <div className="flex items-center gap-2 text-xs overflow-hidden">
              <i className="fas fa-folder text-blue-500 dark:text-blue-400 flex-shrink-0"></i>
              <span className="text-blue-500 dark:text-blue-400 whitespace-nowrap overflow-x-auto scrollbar-thin">
                {bookmark.folderPath || bookmark.folder?.name || t('uncategorizedBookmarks')}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('tooltipInfoDisplay')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
