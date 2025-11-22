'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import CustomSelect from './ui/CustomSelect'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchMode: 'bookmarks' | 'engine'
  onSearchModeChange: (mode: 'bookmarks' | 'engine') => void
  onMenuClick: () => void
  onSearchToggle?: () => void
  isSearchOpen?: boolean
}

export default function Header({ searchQuery, onSearchChange, searchMode, onSearchModeChange, onMenuClick, onSearchToggle, isSearchOpen }: HeaderProps) {
  const { t } = useApp()
  const [searchEngine, setSearchEngine] = useState<'google' | 'bing' | 'baidu' | 'yandex'>('bing')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    if (searchMode === 'engine') {
      // 外部搜索引擎搜索
      let url: string
      switch (searchEngine) {
        case 'google':
          url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
          break
        case 'bing':
          url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`
          break
        case 'baidu':
          url = `https://www.baidu.com/s?wd=${encodeURIComponent(searchQuery)}`
          break
        case 'yandex':
          url = `https://yandex.com/search/?text=${encodeURIComponent(searchQuery)}`
          break
        default:
          url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
      }
      window.open(url, '_blank')
    }
    // 如果是书签搜索模式，不需要额外处理，searchQuery的变化会自动触发BookmarkGrid的搜索
  }

  return (
    <header className="neu-base m-4 p-6">
      <div className="flex items-center gap-4">
        {/* 菜单按钮 */}
        <button
          onClick={onMenuClick}
          className="neu-button p-3 md:hidden"
          aria-label={t('toggleMenuAria')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 桌面端菜单 */}
        <button
          onClick={onMenuClick}
          className="neu-button p-3 hidden md:block"
          aria-label={t('toggleMenuAria')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 桌面端搜索栏 */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                searchMode === 'bookmarks' 
                  ? t('searchBookmarksPlaceholder')
                  : t('searchEnginePlaceholder')
              }
              className="neu-input w-full px-4 py-3 pl-12 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 搜索模式选择器 */}
          <CustomSelect
            value={searchMode}
            onChange={(value) => onSearchModeChange(value as 'bookmarks' | 'engine')}
            options={[
              { value: 'bookmarks', label: t('searchBookmarks') || '搜索书签' },
              { value: 'engine', label: t('searchEngine') || '搜索引擎' }
            ]}
            placeholder={t('searchBookmarks') || '搜索书签'}
            className="min-w-[120px]"
          />

          {/* 搜索引擎选择器 */}
          {searchMode === 'engine' && (
            <CustomSelect
              value={searchEngine}
              onChange={(value) => setSearchEngine(value as 'google' | 'bing' | 'baidu' | 'yandex')}
              options={[
                { value: 'google', label: t('google') || 'Google' },
                { value: 'bing', label: t('bing') || 'Bing' },
                { value: 'baidu', label: t('baidu') || 'Baidu' },
                { value: 'yandex', label: t('yandex') || 'Yandex' }
              ]}
              placeholder={t('google') || 'Google'}
              className="min-w-[100px]"
            />
          )}

          <button
            type="submit"
            className="btn-primary"
          >
            {t('search')}
          </button>
        </form>

        {/* 移动端搜索按钮 */}
        <button
          onClick={onSearchToggle}
          className="neu-button p-3 md:hidden"
          aria-label={t('toggleSearchAria')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* 移动端可折叠搜索栏 */}
      {isSearchOpen && (
        <div className="md:hidden mt-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  searchMode === 'bookmarks' 
                    ? t('searchBookmarksPlaceholder')
                    : t('searchEnginePlaceholder')
                }
                className="neu-input w-full px-4 py-3 pl-12 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 移动端搜索控件 */}
            <div className="flex gap-3">
              <CustomSelect
                value={searchMode}
                onChange={(value) => onSearchModeChange(value as 'bookmarks' | 'engine')}
                options={[
                  { value: 'bookmarks', label: t('searchBookmarks') || '搜索书签' },
                  { value: 'engine', label: t('searchEngine') || '搜索引擎' }
                ]}
                placeholder={t('searchBookmarks') || '搜索书签'}
                className="flex-1"
              />

              {/* 搜索引擎选择器 */}
              {searchMode === 'engine' && (
                <CustomSelect
                  value={searchEngine}
                  onChange={(value) => setSearchEngine(value as 'google' | 'bing' | 'baidu' | 'yandex')}
                  options={[
                    { value: 'google', label: t('google') || 'Google' },
                    { value: 'bing', label: t('bing') || 'Bing' },
                    { value: 'baidu', label: t('baidu') || 'Baidu' },
                    { value: 'yandex', label: t('yandex') || 'Yandex' }
                  ]}
                  placeholder={t('google') || 'Google'}
                  className="flex-1"
                />
              )}

              <button
                type="submit"
                className="btn-primary px-6"
              >
                {t('search')}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
