'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import InitModal from '@/components/InitModal'
import { Solar } from 'lunar-javascript'

// 搜索引擎配置
const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={q}' },
]

type LayoutType = 'centered' | 'left-aligned' | 'minimal'

interface PinnedBookmark {
  id: string
  title: string
  url: string
  description?: string | null
  iconUrl?: string | null
  pinnedOrder: number
  spaceId: string
}

interface StartPageConfig {
  startPageBgUrl: string | null
  startPageBgType: 'image' | 'video' | null
  startPageBgOpacity: number | null
  startPageLayout: LayoutType | null
  startPageShowClock: boolean | null
  startPageShowLunar: boolean | null
}

const BG_CACHE_KEY = 'startpage-bg'
const BG_CACHE_TTL = 10 * 60 * 1000 // 10 分钟
const PINNED_CACHE_KEY = 'startpage-pinned'

// ========== 时钟 + 农历组件 ==========
function ClockDisplay({ showLunar }: { showLunar: boolean }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const time = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const weekday = now.toLocaleDateString('zh-CN', { weekday: 'long' })
  const gregorian = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  let lunarText = ''
  let ganZhiText = ''
  try {
    const lunar = Solar.fromDate(now).getLunar()
    lunarText = `${lunar.getYearInGanZhiExact()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
    const jieQi = lunar.getJieQi()
    const zodiac = lunar.getYearShengXiaoExact()
    ganZhiText = jieQi ? `节气：${jieQi} · 生肖${zodiac}` : `生肖${zodiac}`
  } catch {
    // 忽略
  }

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-mono font-semibold tracking-wider text-gray-800 dark:text-gray-100 tabular-nums">
        {time}
      </div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {gregorian} · {weekday}
      </div>
      {showLunar && lunarText && (
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
          {lunarText} · {ganZhiText}
        </div>
      )}
    </div>
  )
}

export default function StartPage() {
  const { isAuthenticated, token, user, loading, t } = useApp()

  // Init 检查
  const [needsInit, setNeedsInit] = useState(false)
  const [checkingInit, setCheckingInit] = useState(true)

  // 搜索相关
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('search_engine') || 'google'
    }
    return 'google'
  })
  const [focused, setFocused] = useState(false)
  const [engineOpen, setEngineOpen] = useState(false)

  // 书签相关
  const [pinnedBookmarks, setPinnedBookmarks] = useState<PinnedBookmark[]>([])
  const [isLoadingPinned, setIsLoadingPinned] = useState(true)

  // 背景配置
  const [config, setConfig] = useState<StartPageConfig>({
    startPageBgUrl: null,
    startPageBgType: null,
    startPageBgOpacity: null,
    startPageLayout: null,
    startPageShowClock: null,
    startPageShowLunar: null,
  })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  // Init 状态检查
  const checkInitStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/init')
      const data = await response.json()
      setNeedsInit(data.needsInit)
    } catch {
      // 忽略
    } finally {
      setCheckingInit(false)
    }
  }, [])

  useEffect(() => {
    checkInitStatus()
  }, [checkInitStatus])

  // ========== 开始页配置加载（带缓存） ==========
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true)
    try {
      const cached = localStorage.getItem(BG_CACHE_KEY)
      const cachedAt = parseInt(localStorage.getItem(`${BG_CACHE_KEY}-at`) || '0', 10)
      if (cached && Date.now() - cachedAt < BG_CACHE_TTL) {
        const parsed = JSON.parse(cached) as Partial<StartPageConfig>
        setConfig({
          startPageBgUrl: parsed.startPageBgUrl ?? null,
          startPageBgType: parsed.startPageBgType ?? null,
          startPageBgOpacity: parsed.startPageBgOpacity ?? null,
          startPageLayout: parsed.startPageLayout ?? null,
          startPageShowClock: parsed.startPageShowClock ?? null,
          startPageShowLunar: parsed.startPageShowLunar ?? null,
        })
        setIsLoadingConfig(false)
        return
      }

      const res = await fetch('/api/system-config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const cfg: StartPageConfig = {
          startPageBgUrl: data.startPageBgUrl || null,
          startPageBgType: data.startPageBgType || null,
          startPageBgOpacity: data.startPageBgOpacity ?? null,
          startPageLayout: (data.startPageLayout as LayoutType | null) || null,
          startPageShowClock:
            data.startPageShowClock === true || data.startPageShowClock === 1 || data.startPageShowClock === '1',
          startPageShowLunar:
            data.startPageShowLunar === true || data.startPageShowLunar === 1 || data.startPageShowLunar === '1',
        }
        setConfig(cfg)
        localStorage.setItem(BG_CACHE_KEY, JSON.stringify(cfg))
        localStorage.setItem(`${BG_CACHE_KEY}-at`, String(Date.now()))
      }
    } catch {
      // 忽略
    } finally {
      setIsLoadingConfig(false)
    }
  }, [token])

  // ========== 置顶书签加载（带缓存）—— 公开可读，未登录也能看到 ==========
  const fetchPinned = useCallback(async () => {
    setIsLoadingPinned(true)
    try {
      const cachedRaw = sessionStorage.getItem(PINNED_CACHE_KEY)
      const cachedAt = parseInt(sessionStorage.getItem(`${PINNED_CACHE_KEY}-at`) || '0', 10)
      if (cachedRaw && Date.now() - cachedAt < 15000) {
        setPinnedBookmarks(JSON.parse(cachedRaw))
        setIsLoadingPinned(false)
      }

      const res = await fetch('/api/bookmarks?pinned=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const list: PinnedBookmark[] = Array.isArray(data)
          ? data
          : Array.isArray(data.bookmarks)
          ? data.bookmarks
          : []
        list.sort((a, b) => a.pinnedOrder - b.pinnedOrder)
        setPinnedBookmarks(list)
        sessionStorage.setItem(PINNED_CACHE_KEY, JSON.stringify(list))
        sessionStorage.setItem(`${PINNED_CACHE_KEY}-at`, String(Date.now()))
      }
    } catch {
      // 忽略
    } finally {
      setIsLoadingPinned(false)
    }
  }, [token])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    fetchPinned()
  }, [fetchPinned])

  // Ctrl+K / Cmd+K 聚焦搜索框，Esc 关闭下拉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && engineOpen) {
        setEngineOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [engineOpen])

  // 搜索
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) return
      const target = SEARCH_ENGINES.find((s) => s.id === engine) || SEARCH_ENGINES[0]
      window.open(target.url.replace('{q}', encodeURIComponent(q)), '_blank')
    },
    [query, engine]
  )

  const handleEngineChange = (id: string) => {
    setEngine(id)
    localStorage.setItem('search_engine', id)
  }

  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleUnpin = async (id: string) => {
    try {
      await fetch(`/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pinned: false }),
      })
      sessionStorage.removeItem(PINNED_CACHE_KEY)
      sessionStorage.removeItem(`${PINNED_CACHE_KEY}-at`)
      setPinnedBookmarks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      // 忽略
    }
  }

  // ========== 背景渲染 ==========
  const renderBackground = () => {
    if (!config.startPageBgUrl) return null

    const opacity = Math.min(Math.max(config.startPageBgOpacity ?? 0.5, 0), 1)
    const isVideo =
      config.startPageBgType === 'video' ||
      /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(config.startPageBgUrl)

    return (
      <>
        {isVideo ? (
          <video
            src={config.startPageBgUrl}
            autoPlay
            muted
            loop
            playsInline
            className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />
        ) : (
          <div
            className="fixed inset-0 w-full h-full bg-center bg-cover z-0 pointer-events-none"
            style={{ backgroundImage: `url(${config.startPageBgUrl})` }}
          />
        )}
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px]"
          style={{ opacity }}
        />
      </>
    )
  }

  const layout = (config.startPageLayout ?? 'centered') as LayoutType
  const showClock = !!config.startPageShowClock
  const showLunar = !!config.startPageShowLunar

  if (checkingInit || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  if (needsInit) {
    return <InitModal onComplete={() => { setNeedsInit(false); setCheckingInit(true); checkInitStatus() }} />
  }

  // ========== 公共 header：仅左上 logo（绝对定位，避免干扰居中布局） ==========
  const renderHeader = () => (
    <header className="relative z-10 px-6 py-4">
      <a
        href="/bookmarks"
        className="flex items-center gap-2 group"
        title="前往书签管理"
      >
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
          W
        </span>
        <span className="text-lg font-bold bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          WeBooks
        </span>
      </a>
    </header>
  )

  // ========== 时钟（独立模块，默认居中在搜索框上方） ==========
  const renderClock = () => (
    showClock ? (
      <div className="mb-8 text-center">
        <ClockDisplay showLunar={showLunar} />
      </div>
    ) : null
  )

  // ========== 搜索框（带自定义搜索引擎下拉） ==========
  const renderSearchBox = () => {
    const currentEngine = SEARCH_ENGINES.find((e) => e.id === engine) || SEARCH_ENGINES[0]
    return (
      <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto relative">
        <div
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm transition-all ${
            focused || engineOpen
              ? 'border-blue-500 shadow-lg shadow-blue-500/20'
              : 'border-gray-200 dark:border-gray-700 shadow-md'
          }`}
        >
          {/* 自定义搜索引擎下拉 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setEngineOpen((v) => !v)}
              className="flex items-center gap-1 text-sm px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span>{currentEngine.name}</span>
              <svg
                className={`w-3 h-3 text-gray-400 transition-transform ${engineOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {engineOpen && (
              <>
                {/* 点击外部关闭的遮罩（同级兄弟节点，用 pointer-events-none + 下面 panel 捕获） */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setEngineOpen(false)}
                  aria-hidden
                />
                <div className="absolute top-full left-0 mt-1 min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-30">
                  {SEARCH_ENGINES.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => { handleEngineChange(e.id); setEngineOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        engine === e.id
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {engine === e.id && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className={engine === e.id ? '' : 'w-3.5'} />
                      {e.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="搜索网络… (Ctrl + K)"
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            搜索
          </button>
        </div>
      </form>
    )
  }

  // ========== 置顶书签区 ==========
  const renderPinnedSection = () => (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">置顶书签</h2>
        <a href="/bookmarks" className="text-sm text-blue-500 hover:text-blue-600 transition-colors">
          全部书签 →
        </a>
      </div>
      {isLoadingPinned ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="sm" />
        </div>
      ) : pinnedBookmarks.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {pinnedBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all p-3"
            >
              <button
                onClick={() => handleBookmarkClick(bm.url)}
                className="w-full flex flex-col items-center gap-2 text-center"
                title={bm.url}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center overflow-hidden">
                  {bm.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- favicon 尺寸小且多为 SVG/data-uri
                    <img
                      src={bm.iconUrl}
                      alt=""
                      className="w-6 h-6"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement
                        t.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {bm.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 line-clamp-2 w-full">
                  {bm.title}
                </span>
              </button>
              {isAuthenticated && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnpin(bm.id) }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-gray-100 hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-900/50 transition-all"
                  title="取消置顶"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        isAuthenticated ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              还没有置顶书签，去 <a href="/bookmarks" className="text-blue-500 hover:text-blue-600">书签管理</a> 固定几个常用网站吧
            </p>
          </div>
        ) : null
      )}
    </div>
  )

  // ========== 底部（未登录不显示任何引导） ==========
  const renderFooter = () => {
    if (!isAuthenticated) return null
    return (
      <footer className="relative z-10 pb-6 text-center text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center justify-center gap-4">
          <a href="/bookmarks" className="hover:text-blue-500 transition-colors">全部书签</a>
          <span>·</span>
          <a href="/admin" className="hover:text-blue-500 transition-colors">管理后台</a>
          <span>·</span>
          <span>{user?.username}</span>
        </div>
      </footer>
    )
  }

  // ========== 三种布局渲染 ==========
  const renderCentered = () => (
    <>
      {renderHeader()}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        {renderClock()}
        {renderSearchBox()}
        <div className="mt-12 w-full max-w-5xl mx-auto">
          {renderPinnedSection()}
        </div>
      </main>
      {renderFooter()}
    </>
  )

  const renderLeftAligned = () => (
    <>
      {renderHeader()}
      <main className="flex-1 px-6 md:px-12 py-8 relative z-10 flex flex-col gap-8">
        <div className="max-w-2xl">
          {renderClock()}
          {renderSearchBox()}
        </div>
        {renderPinnedSection()}
      </main>
      {renderFooter()}
    </>
  )

  const renderMinimal = () => (
    <>
      {renderHeader()}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        {renderClock()}
        {renderSearchBox()}
        {pinnedBookmarks.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3 max-w-3xl">
            {pinnedBookmarks.map((bm) => (
              <button
                key={bm.id}
                onClick={() => handleBookmarkClick(bm.url)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow transition-all"
                title={bm.url}
              >
                <div className="w-5 h-5 flex items-center justify-center overflow-hidden">
                  {bm.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- favicon 尺寸小
                    <img src={bm.iconUrl} alt="" className="w-4 h-4" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span className="text-xs font-bold text-blue-600">{bm.title.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{bm.title}</span>
              </button>
            ))}
          </div>
        )}
      </main>
      {renderFooter()}
    </>
  )

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {!isLoadingConfig && renderBackground()}
      {layout === 'left-aligned' && renderLeftAligned()}
      {layout === 'minimal' && renderMinimal()}
      {(layout === 'centered' || !layout) && renderCentered()}
    </div>
  )
}
