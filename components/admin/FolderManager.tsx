'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../../contexts/AppContext'
import { useNotifications } from '../NotificationSystem'
import NotificationSystem from '../NotificationSystem'

import CustomSelect from '../ui/CustomSelect'
import LoadingSpinner from '../LoadingSpinner'

interface Folder {
  id: string
  name: string
  description: string | null
  spaceId: string
  parentFolderId: string | null
  bookmarkCount: number
}

interface Space {
  id: string
  name: string
}

export default function FolderManager() {
  const { token, t, isAuthenticated } = useApp()
  const { showError, notifications, showSuccess } = useNotifications()
  const [folders, setFolders] = useState<Folder[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
    spaceId: '',
    parentFolderId: ''
  })

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')

  // 预构建索引 Map: folderId -> Folder (O(1) 查找)
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>()
    for (const folder of folders) {
      map.set(folder.id, folder)
    }
    return map
  }, [folders])

  // 预构建文件夹路径 Map: folderId -> string[]
  const folderPathsMap = useMemo(() => {
    const paths = new Map<string, string[]>()
    const visited = new Set<string>()

    const buildPath = (folderId: string): string[] => {
      if (visited.has(folderId)) return []
      visited.add(folderId)

      const folder = folderMap.get(folderId)
      if (!folder) return []

      if (!folder.parentFolderId) {
        return [folder.name]
      }

      const parentPath = buildPath(folder.parentFolderId)
      return [...parentPath, folder.name]
    }

    for (const folder of folders) {
      if (!paths.has(folder.id)) {
        paths.set(folder.id, buildPath(folder.id))
      }
    }

    return paths
  }, [folders, folderMap])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [foldersRes, spacesRes] = await Promise.all([
        fetch('/api/folders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/spaces', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const foldersData = await foldersRes.json()
      const spacesData = await spacesRes.json()

      setFolders(foldersData.folders || [])
      setSpaces(spacesData.spaces || [])
    } catch (error) {
      console.error(t('operationFailedNetwork'), error)
    } finally {
      setLoading(false)
    }
  }, [token, t])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData()
    }
  }, [isAuthenticated, token, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingFolder
        ? `/api/folders/${editingFolder.id}`
        : '/api/folders'
      
      const method = editingFolder ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          parentFolderId: formData.parentFolderId || null
        })
      })

      if (response.ok) {
        console.log('文件夹操作成功，准备刷新页面...')
        showSuccess(String(t('success')))
        // 强制刷新页面重新加载数据
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        showError(t('operationFailed'))
      }
    } catch {
      showError(t('operationFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    // 直接执行删除操作
    try {
      const response = await fetch(`/api/folders/${id}`, {
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
        showError(t('folderDeleteFailed'))
      }
    } catch {
      showError(t('folderDeleteFailed'))
    }
  }

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      description: folder.description || '',
      iconUrl: '',
      spaceId: folder.spaceId,
      parentFolderId: folder.parentFolderId || ''
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFolder(null)
    setFormData({
      name: '',
      description: '',
      iconUrl: '',
      spaceId: spaces[0]?.id || '',
      parentFolderId: ''
    })
  }

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      iconUrl: '',
      spaceId: spaces[0]?.id || '',
      parentFolderId: ''
    })
    setShowModal(true)
  }



  // 获取文件夹的完整路径 (O(1)，从预构建 Map 查找)
  const getFolderPath = useCallback((folderId: string): string[] => {
    return folderPathsMap.get(folderId) || []
  }, [folderPathsMap])

  // 获取父文件夹路径字符串 (O(1))
  const getParentFolderName = useCallback((parentId: string | null) => {
    if (!parentId) return '-'
    const path = folderPathsMap.get(parentId)
    return path && path.length > 0 ? path.join(' / ') : '-'
  }, [folderPathsMap])

  // 过滤后的文件夹 (useMemo 缓存)
  const filteredFolders = useMemo(() => {
    if (selectedSpaceId === 'all') return folders
    return folders.filter(folder => folder.spaceId === selectedSpaceId)
  }, [folders, selectedSpaceId])

  // 排序后的文件夹 (useMemo 缓存，使用预构建的路径 Map 避免 O(n) 查找)
  const sortedFolders = useMemo(() => {
    return [...filteredFolders].sort((a, b) => {
      const aParentName = getParentFolderName(a.parentFolderId)
      const bParentName = getParentFolderName(b.parentFolderId)
      
      const parentResult = aParentName.localeCompare(bParentName)
      if (parentResult !== 0) return parentResult
      
      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
  }, [filteredFolders, getParentFolderName])

  // 当前显示的文件夹数量
  const filteredFoldersCount = filteredFolders.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message={t('loading')} />
      </div>
    )
  }

  return (
    <div>
      {/* 通知系统 */}
      <NotificationSystem notifications={notifications} />
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('folders')} ({filteredFoldersCount})
        </h2>
        <div className="flex items-center gap-3">
          {/* 空间切换按钮 */}
          <CustomSelect
            value={selectedSpaceId}
            onChange={(value) => setSelectedSpaceId(value)}
            options={[
              { value: 'all', label: '所有空间' },
              ...spaces.map((space) => ({
                value: space.id,
                label: space.name
              }))
            ]}
            placeholder="选择空间"
            disabled={loading}
            className="min-w-[220px]"
          />
          <button onClick={handleCreate} className="btn-primary">
            {t('createFolder')}
          </button>
        </div>
      </div>

      <div className="neu-base p-2">
          <div className="overflow-hidden rounded-2xl">
            <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    {t('folderTableName')}
                    <span className="text-xs">↓</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    {t('folderTableParent')}
                    <span className="text-xs">↓</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    {t('folderTableBookmarks')}
                    <span className="text-xs">↓</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {t('folderTableActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {sortedFolders.map((folder) => {
                return (
                  <tr key={folder.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center min-w-0">
                        <i className="fas fa-folder text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0"></i>
                        <span className="whitespace-nowrap overflow-x-auto scrollbar-thin">
                          {getFolderPath(folder.id).join(' / ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="min-w-0 max-w-xs">
                        <span className="whitespace-nowrap overflow-x-auto scrollbar-thin block">
                          {getParentFolderName(folder.parentFolderId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {folder.bookmarkCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(folder)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(folder.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="neu-card max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingFolder ? t('edit') : t('create')} {t('folders')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('folderName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="neu-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('folderDesc')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="neu-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('spaces')} *</label>
                <CustomSelect
                  value={formData.spaceId}
                  onChange={(value) => setFormData({ ...formData, spaceId: value })}
                  options={spaces.map((space) => ({
                    value: space.id,
                    label: space.name
                  }))}
                  placeholder={t('selectSpace') || '选择空间'}
                  disabled={!!editingFolder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('folderFormParent')}</label>
                <CustomSelect
                  value={formData.parentFolderId}
                  onChange={(value) => setFormData({ ...formData, parentFolderId: value })}
                  options={[
                    { value: '', label: t('folderFormParentNone') },
                    ...folders
                      .filter(f => f.spaceId === formData.spaceId && f.id !== editingFolder?.id)
                      .map((folder) => ({
                        value: folder.id,
                        label: getFolderPath(folder.id).join(' / ') || folder.name
                      }))
                  ]}
                  placeholder={t('folderFormParentSelect')}
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
