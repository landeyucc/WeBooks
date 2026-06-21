'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useApp } from '@/contexts/AppContext'
import CustomSelect from './ui/CustomSelect'
import PasswordModal from './PasswordModal'
import FoldableSection from './ui/FoldableSection'
import { ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { cacheManager, loadCache, saveCache } from '@/lib/cache-manager'


interface Space {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  systemCardUrl: string | null
  isEncrypted?: boolean
  _count?: {
    bookmarks: number
    folders: number
  }
}

interface Folder {
  id: string
  name: string
  spaceId: string
  parentFolderId: string | null
  bookmarkCount: number
  totalBookmarks?: number // 新增：包含子文件夹的总书签数
  _count?: {
    bookmarks: number
    childFolders: number
  }
}

interface SidebarProps {
  selectedSpaceId: string | null
  selectedFolderId: string | null
  onSelectSpace: (spaceId: string | null) => void
  onSelectFolder: (folderId: string | null) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export default function Sidebar({
  selectedSpaceId,
  selectedFolderId,
  onSelectSpace,
  onSelectFolder,
  sortOrder,
  onSortOrderChange
}: SidebarProps) {
  const { t, theme, toggleTheme, language, setLanguage, isAuthenticated, token, collapsedFolders, toggleFolderCollapse, setCollapsedFolders, currentSpaceData } = useApp()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

  // 直接从 currentSpaceData 计算未分类书签数量
  const uncategorizedBookmarkCount = useMemo(() => {
    if (!currentSpaceData?.bookmarks) return 0
    
    const folderIds = new Set(currentSpaceData.folders?.map(f => f.id) || [])
    
    const uncategorized = currentSpaceData.bookmarks.filter(b => {
      // 处理 null、undefined、空字符串，以及 folderId 指向不存在文件夹的情况
      return !b.folderId || b.folderId === '' || !folderIds.has(b.folderId)
    })
    
    return uncategorized.length
  }, [currentSpaceData?.bookmarks, currentSpaceData?.folders])

  // 跟踪是否已经为当前空间设置了默认折叠状态
  const [isInitialCollapsedSet, setIsInitialCollapsedSet] = useState(false)

  // 密码验证相关状态
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null)
  const [pendingSpaceName, setPendingSpaceName] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 存储已验证的加密空间ID，避免重复验证
  const verifiedEncryptedSpaces = useRef<Set<string>>(new Set())

  // 处理空间切换（包含密码验证逻辑）
  const handleSpaceChange = useCallback(async (newSpaceId: string) => {
    const space = spaces.find(s => s.id === newSpaceId)
    if (!space) return

    // 如果不是加密空间，直接切换
    if (!space.isEncrypted) {
      onSelectSpace(newSpaceId)
      onSelectFolder(null)
      return
    }

    // 如果用户已登录（token存在），直接切换到加密空间，无需密码验证
    if (token) {
      onSelectSpace(newSpaceId)
      onSelectFolder(null)
      return
    }

    // 如果是加密空间且未登录用户，检查是否已经验证过
    if (verifiedEncryptedSpaces.current.has(newSpaceId)) {
      onSelectSpace(newSpaceId)
      onSelectFolder(null)
      return
    }

    // 如果未验证，弹出密码输入框（仅未登录用户）
    setPendingSpaceId(newSpaceId)
    setPendingSpaceName(space.name)
    setPasswordError('')
    setIsPasswordModalOpen(true)
  }, [spaces, token, onSelectSpace, onSelectFolder])

  // 验证密码
  const verifyPassword = useCallback(async (password: string) => {
    if (!pendingSpaceId) return

    try {
      const response = await fetch(`/api/spaces/${pendingSpaceId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()

      // 处理API返回的skipPassword标志（登录用户访问自己的空间时会返回）
      if (response.ok && (result.valid || result.skipPassword)) {
        // 密码正确或无需密码验证，添加到已验证列表
        verifiedEncryptedSpaces.current.add(pendingSpaceId)
        setIsPasswordModalOpen(false)
        onSelectSpace(pendingSpaceId)
        onSelectFolder(null)
        setPendingSpaceId(null)
        setPendingSpaceName('')
        setPasswordError('')
      } else {
        // 密码错误
        setPasswordError(result.error || t('passwordIncorrect') || '密码错误，请重试')
      }
    } catch (error) {
      console.error('密码验证失败:', error)
      setPasswordError(t('passwordVerificationFailed') || '密码验证失败，请重试')
    }
  }, [pendingSpaceId, token, t, onSelectSpace, onSelectFolder])

  // 取消密码输入
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cancelPasswordInput = useCallback(() => {
    setIsPasswordModalOpen(false)
    setPendingSpaceId(null)
    setPendingSpaceName('')
    setPasswordError('')
  }, [])

  const fetchSpaces = useCallback(async () => {
    try {
      // 获取远程版本Key
      const remoteVersion = await cacheManager.getLatestVersionKeys()
      const localVersion = cacheManager.getLocalVersionKeys()
      
      // 检查是否从缓存加载
      const versionMatch = cacheManager.isTypeVersionMatch(localVersion, remoteVersion, 'spaces')
      
      if (versionMatch) {
        console.log('从缓存加载空间数据...')
        const cachedSpaces = loadCache<Space[]>('spaces')
        if (cachedSpaces) {
          console.log('缓存加载成功，空间数量:', cachedSpaces.length)
          setSpaces(cachedSpaces)
          return
        }
      }

      // 从API获取
      console.log('从API获取空间数据...')
      // 根据认证状态决定是否使用Authorization头
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/spaces', { headers })
      const data = await response.json()
      let spacesData = []
      
      // 检查不同的可能响应格式
      if (Array.isArray(data)) {
        spacesData = data
      } else if (data && Array.isArray(data.spaces)) {
        spacesData = data.spaces
      } else if (data && data.data && Array.isArray(data.data)) {
        spacesData = data.data
      }
      
      setSpaces(spacesData)
      
      // 保存到缓存
      if (remoteVersion) {
        console.log('保存空间数据到缓存...')
        saveCache('spaces', spacesData, remoteVersion.spaces)
      }
      
    } catch (error) {
      console.error(t('fetchSpacesFailed'), error)
      // 如果出错时则确保设置一个空数组
      setSpaces([])
    }
  }, [token, t])

  const fetchFolders = useCallback(async (spaceId: string) => {
    try {
      // 获取远程版本Key
      const remoteVersion = await cacheManager.getLatestVersionKeys()
      const localVersion = cacheManager.getLocalVersionKeys()
      
      // 检查是否从缓存加载
      const versionMatch = cacheManager.isTypeVersionMatch(localVersion, remoteVersion, 'folders')
      
      if (versionMatch) {
        console.log('从缓存加载文件夹数据...')
        const cachedFolders = loadCache<Folder[]>('folders')
        if (cachedFolders) {
          console.log('缓存加载成功，文件夹数量:', cachedFolders.length)
          setFolders(cachedFolders)
          return
        }
      }

      // 从API获取
      console.log('从API获取文件夹数据...')
      // 根据认证状态决定是否使用Authorization头
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/folders?spaceId=${spaceId}`, { headers })
      const data = await response.json()
      
      let foldersData = []
      
      // 检查不同的可能响应格式
      if (Array.isArray(data)) {
        foldersData = data
      } else if (data && Array.isArray(data.folders)) {
        foldersData = data.folders
      } else if (data && data.data && Array.isArray(data.data)) {
        foldersData = data.data
      }
      
      setFolders(foldersData)
      
      // 保存到缓存
      if (remoteVersion) {
        console.log('保存文件夹数据到缓存...')
        saveCache('folders', foldersData, remoteVersion.folders)
      }
      
    } catch (error) {
      console.error(t('fetchFoldersFailedSide'), error)
      // 如果出错时则确保设置一个空数组
      setFolders([])
    }
  }, [token, t])

  useEffect(() => {
    // 支持未登录状态：总是尝试获取空间列表
    fetchSpaces()
  }, [fetchSpaces])

  useEffect(() => {
    if (selectedSpaceId) {
      fetchFolders(selectedSpaceId)
    } else {
      setFolders([])
    }
  }, [selectedSpaceId, fetchFolders])

  useEffect(() => {
    if (selectedSpaceId) {
      // 空间切换时，重置标记
      setIsInitialCollapsedSet(false)
    }
  }, [selectedSpaceId])

  // 只在首次加载每个空间的文件夹时设置默认折叠状态
  useEffect(() => {
    if (folders.length > 0 && !isInitialCollapsedSet) {
      // 默认将所有文件夹设为折叠状态
      const newCollapsedIds = new Set<string>()
      folders.forEach(folder => {
        newCollapsedIds.add(folder.id)
      })
      
      // 设置新的折叠状态
      setCollapsedFolders(newCollapsedIds)
      setIsInitialCollapsedSet(true)
    }
  }, [folders, isInitialCollapsedSet, setCollapsedFolders])

  // 预构建索引：用于快速查找子文件夹，避免多次 O(n) filter
  const childFolderIndex = useMemo(() => {
    const index = new Map<string | null, Folder[]>()
    for (const folder of folders) {
      const parentId = folder.parentFolderId
      if (!index.has(parentId)) {
        index.set(parentId, [])
      }
      index.get(parentId)!.push(folder)
    }
    return index
  }, [folders])

  // 计算文件夹的总书签数（包括所有子文件夹）- 使用索引优化
  const computeTotalBookmarks = useCallback((folder: Folder): number => {
    let total = folder.bookmarkCount || folder._count?.bookmarks || 0
    const children = childFolderIndex.get(folder.id) ?? []
    for (const child of children) {
      total += computeTotalBookmarks(child)
    }
    return total
  }, [childFolderIndex])

  // 构建文件夹树 - 使用 useMemo 缓存，避免每次渲染重新计算
  const folderTree = useMemo(() => {
    const tree: (Folder & { children: Folder[]; computedTotal?: number })[] = []
    const map = new Map<string, Folder & { children: Folder[]; computedTotal?: number }>()

    folders.forEach(folder => {
      map.set(folder.id, { ...folder, children: [], computedTotal: computeTotalBookmarks(folder) })
    })

    folders.forEach(folder => {
      const node = map.get(folder.id)!
      if (folder.parentFolderId) {
        const parent = map.get(folder.parentFolderId)
        if (parent) {
          parent.children.push(node)
        } else {
          tree.push(node)
        }
      } else {
        tree.push(node)
      }
    })

    const sortFolders = (items: (Folder & { children?: Folder[] })[]) => {
      items.sort((a, b) => {
        const aKey = a.name.toLowerCase()
        const bKey = b.name.toLowerCase()
        
        if (sortOrder === 'asc') {
          return aKey.localeCompare(bKey, 'zh-Hans-CN')
        } else {
          return bKey.localeCompare(aKey, 'zh-Hans-CN')
        }
      })
      
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortFolders(item.children)
        }
      })
    }

    sortFolders(tree)

    return tree
  }, [folders, sortOrder, computeTotalBookmarks])

  const renderFolder = (folder: Folder & { children?: Folder[]; computedTotal?: number }, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isCollapsed = collapsedFolders.has(folder.id)
    const canCollapse = hasChildren
    const isSelected = selectedFolderId === folder.id
    const totalBookmarks = folder.computedTotal || folder.totalBookmarks || folder._count?.bookmarks || 0
    const childCount = folder.children?.length || folder._count?.childFolders || 0

    const handleFolderClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const isToggleButton = target.closest('.folder-toggle')
      
      // 如果点击的是折叠按钮，只执行折叠操作，不触发选择
      if (isToggleButton) {
        e.stopPropagation()
        toggleFolderCollapse(folder.id)
        return
      }
      
      // 如果点击的是文件夹块
      e.stopPropagation()
      
      // 如果当前文件夹已经是选中状态，不做任何操作（包括展开/收缩）
      if (isSelected) {
        return
      }
      
      // 切换选择文件夹
      onSelectFolder(folder.id)
      
      // 如果可以折叠且当前是折叠状态，自动展开
      if (canCollapse && isCollapsed) {
        toggleFolderCollapse(folder.id)
      }
    }

    const isChildLevel = level > 0

    return (
      <div key={folder.id} className="folder-item">
        <div
          className={`folder-button neu-button w-full text-left py-2 mb-1 group ${
            isSelected 
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : isChildLevel
                ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${0.75 + level * 1}rem` }}
          onClick={handleFolderClick}
        >
          <div className="flex items-center justify-between">
            {/* 左侧内容 */}
            <div className="flex items-center flex-1 min-w-0 mr-2">
              {/* 折叠/展开按钮 - 独立处理，不触发选择 */}
              {canCollapse && (
                <div
                  className="folder-toggle w-4 h-4 mr-1.5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolderCollapse(folder.id)
                  }}
                >
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                  />
                </div>
              )}
              
              {/* 如果没有子文件夹，添加占位空间 */}
              {!canCollapse && <div className="w-5 mr-1 flex-shrink-0" />}
              
              {/* 文件夹图标 */}
              <div className="folder-icon mr-2 flex-shrink-0">
                {hasChildren ? (
                  isCollapsed ? (
                    <Folder className={`${isChildLevel ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-blue-500`} />
                  ) : (
                    <FolderOpen className={`${isChildLevel ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-blue-500`} />
                  )
                ) : (
                  <Folder className={`${isChildLevel ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-400`} />
                )}
              </div>
              
              {/* 文件夹名称 - 根据层级调整字体大小 */}
              <span className={`folder-name truncate ${isChildLevel ? 'text-xs' : 'text-sm'} font-medium`}>
                {folder.name}
              </span>
            </div>
            
            {/* 右侧徽章 - 向右调整位置 */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* 文件夹数量徽章 - 蓝色背景 */}
              {hasChildren && (
                <span className={`folder-count-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ${isChildLevel ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} rounded-full`}>
                  {childCount}
                </span>
              )}
              
              {/* 书签数量徽章 - 绿色背景 */}
              <span className={`bookmark-count-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 ${isChildLevel ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5'} rounded-full`}>
                {totalBookmarks}
              </span>
            </div>
          </div>
        </div>
        
        {/* 子文件夹列表 - 带动画 */}
        {hasChildren && (
          <div className={`folder-children transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100 overflow-hidden'
          }`}>
            <div className="folder-children-inner">
              {folder.children?.map(child => renderFolder(child, level + 1)) || []}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="neu-base flex flex-col h-full transition-opacity duration-300 ease-in-out" style={{ width: 'calc(100% - 10px)', marginRight: '10px' }}>
      {/* 系统卡图展示 - 移动到最顶部 */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="relative overflow-hidden rounded-lg flex items-center justify-center" style={{ width: '520px', height: '120px', maxWidth: '100%' }}>
          {(() => {
            const currentSpace = spaces.find(s => s.id === selectedSpaceId)
            if (currentSpace?.systemCardUrl) {
                return (
                  <Image
                    src={currentSpace.systemCardUrl}
                    alt={t('systemCardImage')}
                    className="w-auto h-full max-w-full object-contain"
                    unoptimized
                    width={520}
                    height={120}
                  />
                )
            } else {
              return (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{t('webooks')}</span>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* 空间切换器 */}
      <div className="px-6 pb-4 flex-shrink-0">
        <CustomSelect
          value={selectedSpaceId || ''}
          onChange={handleSpaceChange}
          options={spaces.map(space => ({
            value: space.id,
            label: space.name
          }))}
          placeholder={t('selectSpace') || '选择空间'}
          className="w-full"
        />
      </div>

      {/* 文件夹列表容器 */}
      <div className="flex-1 overflow-hidden mx-3 mb-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-md">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500 scrollbar-track-transparent">
          <div className="p-3 space-y-1">
            {/* 所有书签按钮 */}
            <button
              onClick={() => {
                // 如果已经选中全部书签，不做任何操作
                if (selectedFolderId === null) {
                  return
                }
                onSelectFolder(null)
              }}
              className={`neu-button w-full text-left py-2 mb-2 text-sm group ${
                selectedFolderId === null ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              style={{ paddingLeft: '1rem' }}
            >
              <div className="flex items-center">
                <Folder className="w-4 h-4 mr-2 text-gray-400" />
                <span className="flex-1">{t('allBookmarks')}</span>
              </div>
            </button>
            
            {/* 未分类书签虚拟文件夹 - 始终显示 */}
            {uncategorizedBookmarkCount > 0 && (
              <button
                onClick={() => {
                  // 未分类书签是虚拟文件夹，点击不做任何选择操作
                  // 只是视觉上的展示
                }}
                className="neu-button w-full text-left py-2 mb-1 text-sm group cursor-default"
                style={{ paddingLeft: '1.5rem' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    {/* 占位空间 */}
                    <div className="w-4 mr-2 flex-shrink-0" />
                    
                    {/* 文件夹图标 - 红色 */}
                    <div className="folder-icon mr-2 flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-red-500" />
                    </div>
                    
                    {/* 文件夹名称 - 红色文字 */}
                    <span className="folder-name truncate text-red-500 dark:text-red-400 font-semibold">
                      {t('uncategorizedBookmarks')}
                    </span>
                  </div>
                  
                  {/* 右侧徽章 - 红色背景 */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className="bookmark-count-badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full">
                      {uncategorizedBookmarkCount}
                    </span>
                  </div>
                </div>
              </button>
            )}
            
            {/* 如果没有未分类书签，也显示一个提示 - 始终显示 */}
            {uncategorizedBookmarkCount === 0 && currentSpaceData && (
              <div className="text-xs text-gray-400 py-2" style={{ paddingLeft: '1.5rem' }}>
                暂无未分类书签
              </div>
            )}
            
            {folderTree.map(folder => renderFolder(folder))}
          </div>
        </div>
      </div>

      {/* 底部 - 其他 */}
      <div className="p-6 flex-shrink-0">
        <FoldableSection
          title={t('other')}
          icon={<i className="fas fa-sliders-h mr-2"></i>}
          defaultExpanded={false}
        >
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="neu-button w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <span>{t('order')}</span>
            <span className="ml-auto">
              <i className={`fas fa-sort-alpha-${sortOrder === 'asc' ? 'up' : 'down'} mr-2`}></i>
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="neu-button w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
          >
            {theme === 'light' ? <i className="fas fa-moon mr-2"></i> : <i className="fas fa-sun mr-2"></i>} {t('theme')}: {theme === 'light' ? t('light') : t('dark')}
          </button>
          <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            className="neu-button w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <i className="fas fa-language mr-2"></i> {t('language')}: {language === 'zh' ? '中文' : 'English'}
          </button>
          {isAuthenticated && (
            <a
              href="/admin"
              className="btn-primary block w-full px-4 py-3 text-sm text-center"
            >
              {t('admin')}
            </a>
          )}
        </FoldableSection>
      </div>

      {/* 密码输入模态框 */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        spaceName={pendingSpaceName}
        onSuccess={verifyPassword}
        onCancel={cancelPasswordInput}
        error={passwordError}
      />
    </aside>
  )
}
