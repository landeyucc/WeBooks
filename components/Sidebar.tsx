'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useApp } from '@/contexts/AppContext'
import CustomSelect from './ui/CustomSelect'
import PasswordModal from './PasswordModal'
import { ChevronDown, Folder, FolderOpen } from 'lucide-react'


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
}

export default function Sidebar({
  selectedSpaceId,
  selectedFolderId,
  onSelectSpace,
  onSelectFolder
}: SidebarProps) {
  const { t, theme, toggleTheme, language, setLanguage, isAuthenticated, token, collapsedFolders, toggleFolderCollapse, setCollapsedFolders } = useApp()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [folders, setFolders] = useState<Folder[]>([])

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
      
      
    } catch (error) {
      console.error(t('fetchSpacesFailed'), error)
      // 如果出错时则确保设置一个空数组
      setSpaces([])
    }
  }, [token, t])

  const fetchFolders = useCallback(async (spaceId: string) => {
    try {
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
      // 为所有有父目录的文件夹设置折叠状态
      const newCollapsedIds = new Set<string>()
      folders.forEach(folder => {
        if (folder.parentFolderId) {
          newCollapsedIds.add(folder.id)
        }
      })
      
      // 设置新的折叠状态
      setCollapsedFolders(newCollapsedIds)
      setIsInitialCollapsedSet(true)
    }
  }, [folders, isInitialCollapsedSet, setCollapsedFolders])

  // 构建文件夹树
  const buildFolderTree = (folders: Folder[]) => {
    const tree: Folder[] = []
    const map = new Map<string, Folder & { children: Folder[] }>()

    folders.forEach(folder => {
      map.set(folder.id, { ...folder, children: [] })
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



    return tree
  }

  const renderFolder = (folder: Folder & { children?: Folder[] }, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isCollapsed = collapsedFolders.has(folder.id)
    const canCollapse = hasChildren

    const handleFolderClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const isToggleButton = target.closest('.folder-toggle')
      
      // 如果点击的是折叠按钮，执行折叠操作
      if (isToggleButton) {
        e.stopPropagation()
        toggleFolderCollapse(folder.id)
        return
      }
      
      // 如果点击的是整个文件夹块
      e.stopPropagation()
      if (canCollapse && isCollapsed) {
        // 如果可以折叠且当前是折叠状态，则展开
        toggleFolderCollapse(folder.id)
      } else if (canCollapse && !isCollapsed) {
        // 如果可以折叠且当前是展开状态，选择文件夹
        onSelectFolder(folder.id)
      } else {
        // 如果不能折叠，直接选择文件夹
        onSelectFolder(folder.id)
      }
    }

    return (
      <div key={folder.id} className="folder-item">
        <div
          className={`folder-button neu-button w-full text-left py-2 mb-1 text-sm group ${
            selectedFolderId === folder.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          style={{ 
            paddingLeft: `${(level + 1) * 0.25 + 1}rem`,
            marginLeft: level > 0 ? `${level * 0.25}rem` : '0',
            width: level > 0 ? `calc(100% - ${level * 0.25}rem - 0.25rem)` : '100%'
          }}
          onClick={handleFolderClick}
        >
          <div className="flex items-center justify-between">
            {/* 左侧内容 */}
            <div className="flex items-center flex-1 min-w-0 mr-2">
              {/* 折叠/展开按钮 */}
              {canCollapse && (
                <button
                  className="folder-toggle w-4 h-4 mr-2 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolderCollapse(folder.id)
                  }}
                >
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                  />
                </button>
              )}
              
              {/* 如果没有子文件夹，添加占位空间 */}
              {!canCollapse && <div className="w-4 mr-2 flex-shrink-0" />}
              
              {/* 文件夹图标 */}
              <div className="folder-icon mr-2 flex-shrink-0">
                {hasChildren ? (
                  isCollapsed ? (
                    <Folder className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                  )
                ) : (
                  <Folder className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {/* 文件夹名称 */}
              <span className="folder-name truncate">{folder.name}</span>
            </div>
            
            {/* 右侧徽章 - 向右调整位置 */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* 文件夹数量徽章 - 蓝色背景 */}
              {hasChildren && (
                <span className="folder-count-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-1.5 py-0.5 rounded-full">
                  {folder.children?.length || 0}
                </span>
              )}
              
              {/* 书签数量徽章 - 绿色背景 */}
              <span className="bookmark-count-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-1.5 py-0.5 rounded-full">
                {folder.totalBookmarks || folder._count?.bookmarks || 0}
              </span>
            </div>
          </div>
        </div>
        
        {/* 子文件夹列表 - 带动画 */}
        {hasChildren && (
          <div className={`folder-children transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-96 opacity-100 overflow-hidden'
          }`}>
            <div className="folder-children-inner">
              {folder.children?.map(child => renderFolder(child, level + 1)) || []}
            </div>
          </div>
        )}
      </div>
    )
  }

  const folderTree = buildFolderTree(folders)

  return (
    <aside className="neu-base flex flex-col h-full transition-opacity duration-300 ease-in-out" style={{ width: 'calc(100% - 10px)', marginRight: '10px' }}>
      {/* 系统卡图展示 - 移动到最顶部 */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="relative overflow-hidden rounded-lg" style={{ width: '520px', height: '120px', maxWidth: '100%' }}>
          {(() => {
            const currentSpace = spaces.find(s => s.id === selectedSpaceId)
            if (currentSpace?.systemCardUrl) {
                return (
                  <Image
                    src={currentSpace.systemCardUrl}
                    alt={t('systemCardImage')}
                    className="w-full h-full object-cover"
                    style={{ width: '520px', height: '120px', maxWidth: '100%' }}
                    unoptimized
                    width={520}
                    height={120}
                  />
                )
            } else {
              return (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center" style={{ width: '520px', height: '120px', maxWidth: '100%' }}>
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

      {/* 文件夹列表 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <div className="py-3 space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
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
          {folderTree.map(folder => renderFolder(folder))}
        </div>
      </div>

      {/* 底部 - 设置 */}
      <div className="p-6 space-y-3 flex-shrink-0">
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
          <i className="fas fa-language mr-2"></i> {language === 'zh' ? t('switchToChinese') : t('switchToEnglish')}
        </button>
        {isAuthenticated && (
          <a
            href="/admin"
            className="btn-primary block w-full px-4 py-3 text-sm text-center"
          >
            {t('admin')}
          </a>
        )}
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
