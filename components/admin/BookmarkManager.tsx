'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useNotifications } from '../NotificationSystem'
import NotificationSystem from '../NotificationSystem'
import CustomSelect from '../ui/CustomSelect'
import Image from 'next/image'
import LoadingSpinner from '../LoadingSpinner'

interface Bookmark {
  id: string
  title: string
  url: string
  description: string | null
  iconUrl: string | null
  spaceId: string
  folderId: string | null
  space: { id: string; name: string }
  folder: { id: string; name: string } | null
}

interface Space {
  id: string
  name: string
}

interface Folder {
  id: string
  name: string
  spaceId: string
  parentFolderId: string | null
}

export default function BookmarkManager() {
  const { token, t, isAuthenticated } = useApp()
  const { showError, showSuccess, showWarning, notifications } = useNotifications()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all') // 空间选择状态
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    iconUrl: '',
    spaceId: '',
    folderId: ''
  })

  // 批量操作相关状态
  const [batchMode, setBatchMode] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [moveTargetSpace, setMoveTargetSpace] = useState('')
  const [moveTargetFolder, setMoveTargetFolder] = useState('')
  const [showMoveModal, setShowMoveModal] = useState(false)



  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // 批量操作相关函数
  const toggleBatchMode = () => {
    setBatchMode(!batchMode)
    setSelectedBookmarks(new Set())
    setMoveTargetSpace('')
    setMoveTargetFolder('')
    setShowMoveModal(false)
  }

  const toggleBookmarkSelection = (bookmarkId: string) => {
    const newSelected = new Set(selectedBookmarks)
    if (newSelected.has(bookmarkId)) {
      newSelected.delete(bookmarkId)
    } else {
      newSelected.add(bookmarkId)
    }
    setSelectedBookmarks(newSelected)
  }

  const selectAllInGroup = (groupKey: string) => {
    const { groups } = groupedBookmarks()
    const groupBookmarks = groups[groupKey] || []
    const newSelected = new Set(selectedBookmarks)
    
    groupBookmarks.forEach(bookmark => {
      newSelected.add(bookmark.id)
    })
    setSelectedBookmarks(newSelected)
  }

  const clearSelection = () => {
    setSelectedBookmarks(new Set())
  }

  const batchDelete = async () => {
    if (!isAuthenticated || selectedBookmarks.size === 0) return
    
    try {
      for (const id of Array.from(selectedBookmarks)) {
        await fetch(`/api/bookmarks/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
      
      console.log('批量删除操作成功，准备刷新页面...')
      showSuccess(`已删除 ${selectedBookmarks.size} 个书签`)
      // 强制刷新页面重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('批量删除失败:', error)
      showError('批量删除失败')
    }
  }

  const batchMove = () => {
    if (selectedBookmarks.size === 0) return
    setShowMoveModal(true)
  }

  const confirmBatchMove = async () => {
    if (!isAuthenticated || selectedBookmarks.size === 0 || !moveTargetSpace) return
    
    try {
      for (const id of Array.from(selectedBookmarks)) {
        await fetch(`/api/bookmarks/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            spaceId: moveTargetSpace,
            folderId: moveTargetFolder || null
          }),
        })
      }
      
      console.log('批量移动操作成功，准备刷新页面...')
      setSelectedBookmarks(new Set())
      setShowMoveModal(false)
      setMoveTargetSpace('')
      setMoveTargetFolder('')
      showSuccess(`已移动 ${selectedBookmarks.size} 个书签`)
      // 强制刷新页面重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('批量移动失败:', error)
      showError('批量移动失败')
    }
  }

  const handleMoveTargetSpaceChange = (spaceId: string) => {
    setMoveTargetSpace(spaceId)
    setMoveTargetFolder('') // 重置文件夹选择
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookmarksRes, spacesRes] = await Promise.all([
        fetch('/api/bookmarks', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/spaces', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const bookmarksData = await bookmarksRes.json()
      const spacesData = await spacesRes.json()

      setBookmarks(bookmarksData.bookmarks || [])
      setSpaces(spacesData.spaces || [])
      
      // 获取所有文件夹数据
      const allFoldersRes = await fetch('/api/folders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const allFoldersData = await allFoldersRes.json()
      setFolders(allFoldersData.folders || [])
    } catch (error) {
      console.error(t('operationFailedNetwork'), error)
    } finally {
      setLoading(false)
    }
  }, [token, t])

  const fetchFolders = useCallback(async (spaceId: string) => {
    try {
      const response = await fetch(`/api/folders?spaceId=${spaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error(t('fetchFoldersFailed'), error)
    }
  }, [token, t])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, token, fetchData])

  useEffect(() => {
    if (formData.spaceId) {
      fetchFolders(formData.spaceId)
    }
  }, [formData.spaceId, fetchFolders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBookmark
        ? `/api/bookmarks/${editingBookmark.id}`
        : '/api/bookmarks'
      
      const method = editingBookmark ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          url: formData.url,
          description: formData.description,
          iconUrl: formData.iconUrl,
          spaceId: formData.spaceId,
          folderId: formData.folderId || null
        })
      })

      if (response.ok) {
        console.log('书签操作成功，准备刷新页面...')
        showSuccess(String(t('success')))
        // 强制刷新页面重新加载数据
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const data = await response.json()
        showError(data.error || t('operationFailed'))
      }
    } catch {
      showError(t('operationFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    // 直接执行删除操作
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        console.log('删除操作成功，准备刷新页面...')
        showSuccess(String(t('success')))
        // 强制刷新页面重新加载数据
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        showError(t('deleteFailed'))
      }
    } catch {
      showError(t('deleteFailed'))
    }
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || '',
      iconUrl: bookmark.iconUrl || '',
      spaceId: bookmark.spaceId,
      folderId: bookmark.folderId || ''
    })
    setFetchStatus('idle')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBookmark(null)
    setFormData({
      title: '',
      url: '',
      description: '',
      iconUrl: '',
      spaceId: spaces[0]?.id || '',
      folderId: ''
    })
  }

  const handleCreate = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      iconUrl: '',
      spaceId: spaces[0]?.id || '',
      folderId: ''
    })
    setFetchStatus('idle')
    setShowModal(true)
  }

  const handleFetchInfo = async () => {
    if (!formData.url) {
      showWarning(t('bookmarkUrl') + ' ' + t('required'))
      return
    }

    setFetchStatus('loading')
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: formData.url })
      })

      const data = await response.json()
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          // 只有在字段为空时才自动填充
          iconUrl: prev.iconUrl || data.metadata.iconUrl || '',
          description: prev.description || data.metadata.description || '',
          title: prev.title || data.metadata.title || ''
        }))
        setFetchStatus('success')
        // 3秒后重置状态
        setTimeout(() => setFetchStatus('idle'), 3000)
      } else {
        setFetchStatus('error')
        showError(t('fetchFailed'))
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setFetchStatus('error')
      showError(t('operationFailedNetwork'))
    }
  }

  // 获取当前显示的书签数量
  const getFilteredBookmarksCount = () => {
    if (selectedSpaceId === 'all') {
      return bookmarks.length
    }
    return bookmarks.filter(bookmark => bookmark.spaceId === selectedSpaceId).length
  }

  // 过滤文件夹
  const getFilteredFolders = () => {
    if (selectedSpaceId === 'all') {
      return folders
    }
    return folders.filter(folder => folder.spaceId === selectedSpaceId)
  }

  // 按文件夹路径分组书签
  const groupedBookmarks = () => {
    const filteredBookmarks = getFilteredBookmarks()
    const filteredFolders = getFilteredFolders()
    
    const groups: { [key: string]: Bookmark[] } = {}
    const folderPaths: { [key: string]: string[] } = {}

    // 无文件夹的书签
    groups[t('noFolder')] = []
    folderPaths[t('noFolder')] = []

    // 有文件夹的书签
    filteredBookmarks.forEach(bookmark => {
      if (bookmark.folderId) {
        const path = getFolderPath(bookmark.folderId, filteredFolders)
        const pathKey = path.join('/')
        
        if (!groups[pathKey]) {
          groups[pathKey] = []
          folderPaths[pathKey] = path
        }
        groups[pathKey].push(bookmark)
      } else {
        groups[t('noFolder')].push(bookmark)
      }
    })

    return { groups, folderPaths }
  }

  // 获取过滤后的书签
  const getFilteredBookmarks = () => {
    if (selectedSpaceId === 'all') {
      return bookmarks
    }
    return bookmarks.filter(bookmark => bookmark.spaceId === selectedSpaceId)
  }

  // 获取文件夹的完整路径（使用完整文件夹列表以支持跨空间层级）
  const getFolderPath = useCallback((folderId: string, foldersList?: Folder[]): string[] => {
    // 优先使用传入的foldersList，否则使用当前folders状态
    const allFolders = foldersList || folders || []
    const visited = new Set<string>()
    
    const buildPath = (currentFolderId: string): string[] => {
      if (visited.has(currentFolderId)) return [] // 防止循环引用
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
  }, [folders])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  const { groups, folderPaths } = groupedBookmarks()

  // 按文件夹层级深度排序组
  const sortedGroups = Object.keys(groups).sort((a, b) => {
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

  return (
    <div>
      {/* 通知系统 */}
      <NotificationSystem notifications={notifications} />
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('bookmarks')} ({getFilteredBookmarksCount()})
        </h2>
        <div className="flex items-center gap-3">
          <CustomSelect
            value={selectedSpaceId}
            onChange={(value) => setSelectedSpaceId(value)}
            options={[
              { value: 'all', label: t('allSpaces') },
              ...spaces.map((space) => ({
                value: space.id,
                label: space.name
              }))
            ]}
            placeholder={t('selectSpace')}
            disabled={loading}
          />
          <button onClick={handleCreate} className="btn-primary">
            {t('createBookmark')}
          </button>
          <button 
            onClick={toggleBatchMode}
            className={`neu-button px-4 py-2 text-sm font-medium transition-colors ${
              batchMode 
                ? 'neu-button text-red-600 dark:text-red-400' 
                : 'neu-button text-blue-600 dark:text-blue-400'
            }`}
          >
            {batchMode ? t('exitBatchMode') : t('batchOperation')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedGroups.map((groupKey) => {
          const groupBookmarks = groups[groupKey]
          const folderPath = folderPaths[groupKey]
          
          if (groupBookmarks.length === 0) return null

          return (
            <div key={groupKey} className="neu-card">
              <div className="px-6 py-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {groupKey === t('noFolder') ? (
                      <>
                        <i className="fas fa-folder-open text-red-500 dark:text-red-400 mr-2"></i>
                        <span className="text-red-500 dark:text-red-400 font-bold">
                          {t('uncategorizedBookmarks')}
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-folder text-blue-500 dark:text-blue-400 mr-2"></i>
                        {folderPath.join(' / ')}
                      </>
                    )}
                    <span className="ml-2 text-sm text-gray-500">
                      ({groupBookmarks.length})
                    </span>
                  </h3>
                  
                  {batchMode && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => selectAllInGroup(groupKey)}
                        className="neu-button px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {t('selectAll')}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                        {groupBookmarks.filter(b => selectedBookmarks.has(b.id)).length}/{groupBookmarks.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className={`neu-inset p-4 relative transition-all duration-200 ${
                        batchMode 
                          ? selectedBookmarks.has(bookmark.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 shadow-lg'
                            : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          : ''
                      }`}
                      onClick={() => batchMode && toggleBookmarkSelection(bookmark.id)}
                    >
                      {batchMode && (
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedBookmarks.has(bookmark.id)}
                            onChange={() => toggleBookmarkSelection(bookmark.id)}
                            className={`w-4 h-4 rounded focus:ring-2 transition-all duration-200 ${
                              selectedBookmarks.has(bookmark.id)
                                ? 'text-blue-600 bg-blue-100 border-blue-300 focus:ring-blue-500 dark:bg-blue-800 dark:border-blue-600 dark:focus:ring-blue-400'
                                : 'text-gray-400 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-gray-400'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        {bookmark.iconUrl && (
                          <Image
                            src={bookmark.iconUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 flex-shrink-0 mt-1 rounded"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {bookmark.title}
                          </h4>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 block truncate mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {bookmark.url}
                          </a>
                          {bookmark.description && (
                            <p className="text-xs mt-2 line-clamp-2">
                              {bookmark.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            {!batchMode && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(bookmark)
                                  }}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  {t('edit')}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(bookmark.id)
                                  }}
                                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                  {t('delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 批量操作工具栏 */}
      {batchMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="neu-card px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectedCountBookmarks', { count: selectedBookmarks.size })}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={clearSelection}
                  className="neu-button px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('clearSelection')}
                </button>
                
                <button
                  onClick={batchMove}
                  disabled={selectedBookmarks.size === 0}
                  className="neu-button px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('batchMove')}
                </button>
                
                <button
                  onClick={batchDelete}
                  disabled={selectedBookmarks.size === 0}
                  className="neu-button px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('batchDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量移动模态框 */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="neu-card max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {t('batchMoveBookmarks')} ({selectedBookmarks.size})
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('targetSpace')} *</label>
                <CustomSelect
                  value={moveTargetSpace}
                  onChange={handleMoveTargetSpaceChange}
                  options={spaces.map((space) => ({
                    value: space.id,
                    label: space.name
                  }))}
                  placeholder={t('selectTargetSpace')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('targetFolder')}</label>
                <CustomSelect
                  value={moveTargetFolder}
                  onChange={setMoveTargetFolder}
                  options={[
                    { value: '', label: t('noFolder') },
                    ...folders
                      .filter(folder => folder.spaceId === moveTargetSpace)
                      .map((folder) => ({
                        value: folder.id,
                        label: getFolderPath(folder.id).join(' / ') || folder.name
                      }))
                  ]}
                  placeholder={t('selectTargetFolder')}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button 
                type="button" 
                onClick={() => setShowMoveModal(false)} 
                className="neu-button px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t('cancel')}
              </button>
              <button 
                type="button" 
                onClick={confirmBatchMove}
                disabled={!moveTargetSpace}
                className="neu-button px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('confirmMove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="neu-card max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingBookmark ? t('edit') : t('create')} {t('bookmarks')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('bookmarkTitle')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="neu-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('bookmarkUrl')} *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    className="neu-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleFetchInfo}
                    disabled={fetchStatus === 'loading' || !formData.url}
                    className={`neu-button px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
                      fetchStatus === 'loading' 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : fetchStatus === 'success'
                        ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                        : fetchStatus === 'error'
                        ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                        : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                    }`}
                    title={t('fetchInfoDesc')}
                  >
                    {fetchStatus === 'loading' ? t('fetchingInfo') : 
                     fetchStatus === 'success' ? t('fetchSuccess') :
                     fetchStatus === 'error' ? t('tryAgain') : t('fetchInfo')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('bookmarkDesc')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="neu-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('iconUrl')}</label>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="neu-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('spaces')} *</label>
                <CustomSelect
                  value={formData.spaceId}
                  onChange={(value) => setFormData({ ...formData, spaceId: value, folderId: '' })}
                  options={spaces.map((space) => ({
                    value: space.id,
                    label: space.name
                  }))}
                  placeholder={t('selectSpace')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('folders')}</label>
                <CustomSelect
                  value={formData.folderId}
                  onChange={(value) => setFormData({ ...formData, folderId: value })}
                  options={[
                    { value: '', label: t('noFolder') },
                    ...folders.map((folder) => ({
                      value: folder.id,
                      label: getFolderPath(folder.id).join(' / ') || folder.name
                    }))
                  ]}
                  placeholder={t('selectFolderPlaceholder')}
                />
              </div>



              <div className="flex gap-2 justify-end">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
