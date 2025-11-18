'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import BookmarkManager from './BookmarkManager'
import SpaceManager from './SpaceManager'
import FolderManager from './FolderManager'
import CustomSelect from '../ui/CustomSelect'

type TabType = 'spaces' | 'folders' | 'bookmarks' | 'settings' | 'import'

// 选项卡配置
const TABS: { id: TabType; key: string; label: string }[] = [
  { id: 'spaces', key: 'spaces', label: 'spaces' },
  { id: 'folders', key: 'folders', label: 'folders' },
  { id: 'bookmarks', key: 'bookmarks', label: 'bookmarks' },
  { id: 'import', key: 'import', label: 'importExport' },
  { id: 'settings', key: 'settings', label: 'systemSettings' }
]

interface Space {
  id: string
  name: string
  systemCardUrl?: string | null
}

interface ImportResult {
  success: boolean
  message: string
  folderName?: string
  errors?: string[]
}

// 文件夹接口定义
interface Folder {
  id: string
  name: string
  spaceId?: string
  space?: {
    id: string
    name: string
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout, user, t, token, isAuthenticated } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('spaces')
  
  // 从URL参数获取当前选项卡
  const getTabFromUrl = (): TabType => {
    const tabParam = searchParams.get('tab')
    if (tabParam && TABS.some(tab => tab.key === tabParam)) {
      return tabParam as TabType
    }
    return 'spaces' // 默认选项卡
  }

  // 设置选项卡并更新URL
  const setActiveTabWithUrl = (tab: TabType) => {
    setActiveTab(tab)
    // 更新URL参数，不刷新页面
    const newUrl = tab === 'spaces' ? '/admin' : `/admin?tab=${tab}`
    router.push(newUrl, { scroll: false })
  }

  // 组件加载时从URL初始化选项卡
  useEffect(() => {
    const initialTab = getTabFromUrl()
    setActiveTab(initialTab)
  }, [searchParams])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')
  const [defaultSpaceId, setDefaultSpaceId] = useState<string>('') // 新增默认空间ID状态
  const [systemCardUrl, setSystemCardUrl] = useState<string>('')
  // 网站设置状态
  const [siteTitle, setSiteTitle] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string>('')
  const [seoDescription, setSeoDescription] = useState<string>('')
  const [keywords, setKeywords] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false) // 跟踪数据是否已加载
  
  // API Key管理状态
  const [currentApiKey, setCurrentApiKey] = useState<string>('')
  const [maskedApiKey, setMaskedApiKey] = useState<string>('')
  const [hasApiKey, setHasApiKey] = useState<boolean>(false)
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  
  // 书签导入导出相关状态
  const [exportScope, setExportScope] = useState<'all' | 'space' | 'folder'>('all')
  const [exportSpaceId, setExportSpaceId] = useState<string>('')
  const [exportFolderId, setExportFolderId] = useState<string>('')
  const [exportFolderSpaceId, setExportFolderSpaceId] = useState<string>('') // 用于文件夹导出的空间选择
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [folders, setFolders] = useState<any[]>([]) // 用于导出时选择文件夹
  const [folderSpacesFolders, setFolderSpacesFolders] = useState<{[key: string]: any[]}>({}) // 按空间存储文件夹数据

  // 获取空间数据
  const fetchSpaces = async () => {
    try {
      console.log(t('adminFetchingSpacesData'))
      const response = await fetch('/api/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        console.log(data)
        
        // 处理API返回的格式 {spaces: [...]} 或直接数组格式
        let spacesData = []
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            // 如果直接返回数组
            spacesData = data
          } else if (data.spaces && Array.isArray(data.spaces)) {
            // 如果返回的是 {spaces: [...]}
            spacesData = data.spaces
          } else if (Array.isArray(data.data)) {
            // 如果返回的是 {data: [...]}
            spacesData = data.data
          }
        }
        
        setSpaces(spacesData)
        setDataLoaded(true)
        
        // 如果没有选中的空间，默认选择第一个
        if (spacesData.length > 0) {
          if (!selectedSpaceId) {
            setSelectedSpaceId(spacesData[0].id)
          }
        }
      } else {
        console.error(t('adminSpacesDataFetchFailed'), response.status)
        setSpaces([])
        setDataLoaded(true)
      }
    } catch (error) {
      console.error(t('adminFetchingSpacesDataFailed'), error)
      setSpaces([])
      setDataLoaded(true)
    }
  }

  // 获取API Key信息
  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/extension/api-key', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHasApiKey(data.hasApiKey)
          if (data.hasApiKey && data.apiKey) {
            setCurrentApiKey(data.apiKey)
            setMaskedApiKey(data.maskedKey || '')
          } else {
            setCurrentApiKey('')
            setMaskedApiKey('')
          }
        }
      } else {
        console.error('获取API Key失败:', response.status)
        setHasApiKey(false)
        setCurrentApiKey('')
        setMaskedApiKey('')
      }
    } catch (error) {
      console.error('获取API Key错误:', error)
      setHasApiKey(false)
      setCurrentApiKey('')
      setMaskedApiKey('')
    }
  }

  // 生成新的API Key
  const handleGenerateApiKey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/extension/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setHasApiKey(true)
        setCurrentApiKey(result.apiKey)
        setMaskedApiKey(result.maskedKey || '')
        alert(t('apiKeyGeneratedSuccess'))
      } else {
        alert(result.error || t('generateApiKeyFailed'))
      }
    } catch (error) {
      console.error('生成API Key错误:', error)
      alert(t('generateApiKeyFailedNetwork'))
    } finally {
      setIsLoading(false)
    }
  }

  // 复制API Key到剪贴板
  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(currentApiKey)
      alert(t('copyApiKeyClipboard'))
    } catch (error) {
      console.error('复制失败:', error)
      alert('复制失败，请手动复制')
    }
  }

  // 组件首次加载时获取空间数据和系统配置
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log(t('adminLoadingSystemConfig'))
      Promise.all([fetchSpaces(), fetchSystemConfig(), fetchApiKey()])
        .then(() => {
          console.log(t('adminSystemConfigLoaded'))
        })
        .catch((error) => {
          console.error(t('adminConfigLoadFailed'), error)
        })
    }
  }, [isAuthenticated, token])

  // 当选择的空间改变时，更新systemCardUrl
  useEffect(() => {
    if (selectedSpaceId && spaces.length > 0) {
      const selectedSpace = spaces.find(s => s.id === selectedSpaceId)
      setSystemCardUrl(selectedSpace?.systemCardUrl || '')
      console.log(t('adminUpdateSystemCardUrl'), selectedSpace?.systemCardUrl || '')
    }
  }, [selectedSpaceId, spaces])

  // 处理标签页切换并更新URL
  const handleTabChange = (tab: TabType) => {
    setActiveTabWithUrl(tab)
    // 如果切换到系统设置且数据未加载，则加载数据
    if (tab === 'settings' && !dataLoaded) {
      console.log(t('adminSwitchSettingsReload'))
      fetchSpaces()
    }
    // 如果切换到导入导出页面，加载文件夹数据
    if (tab === 'import' && folders.length === 0) {
      fetchFolders()
    }
  }

  // 保存系统卡图URL和配置
  const handleSaveSystemCard = async () => {
    if (!selectedSpaceId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/spaces/${selectedSpaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemCardUrl: systemCardUrl || null
        }),
      })

      if (response.ok) {
        // 如果当前选择的空间是默认空间，更新系统配置
        if (selectedSpaceId === defaultSpaceId) {
          await saveDefaultSpaceId(selectedSpaceId)
        }
        alert(t('configSaveSuccess'))
        // 重新获取空间数据
        fetchSpaces()
      } else {
        alert(t('saveFailed'))
      }
    } catch (error) {
      console.error(t('adminSaveConfigFailed'), error)
      alert(t('saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 保存默认空间设置
  const saveDefaultSpaceId = async (spaceId: string) => {
    try {
      const response = await fetch('/api/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          defaultSpaceId: spaceId
        }),
      })

      if (!response.ok) {
        console.error(t('adminSaveDefaultSpaceFailed'), response.statusText)
      }
    } catch (error) {
      console.error(t('adminSaveDefaultSpaceFailed'), error)
    }
  }

  // 获取系统配置
  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('/api/system-config', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDefaultSpaceId(data.defaultSpaceId || '')
        // 设置网站设置字段
        setSiteTitle(data.siteTitle || '')
        setFaviconUrl(data.faviconUrl || '')
        setSeoDescription(data.seoDescription || '')
        setKeywords(data.keywords || '')
      }
    } catch (error) {
      console.error(t('adminFetchSystemConfigFailed'), error)
    }
  }

  // 保存网站设置
  const saveSiteSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteTitle,
          faviconUrl,
          seoDescription,
          keywords
        }),
      })

      if (response.ok) {
        alert(t('configSaveSuccess'))
      } else {
        alert(t('saveFailed'))
      }
    } catch (error) {
      console.error(t('adminSaveSiteSettingsFailed'), error)
      alert(t('saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // 获取所有文件夹数据（用于导出时按空间分组显示）
  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const foldersData = Array.isArray(data) ? data : data.folders || []
        
        // 按空间分组文件夹数据
        const groupedFolders: {[key: string]: any[]} = {}
        foldersData.forEach((folder: any) => {
          const spaceId = folder.spaceId || folder.space?.id || 'unknown'
          if (!groupedFolders[spaceId]) {
            groupedFolders[spaceId] = []
          }
          groupedFolders[spaceId].push(folder)
        })
        
        setFolderSpacesFolders(groupedFolders)
        // 设置默认的全局文件夹列表（用于向下兼容）
        setFolders(foldersData)
      }
    } catch (error) {
      console.error('获取文件夹失败:', error)
      setFolderSpacesFolders({})
      setFolders([])
    }
  }

  // 获取特定空间的文件夹数据
  const fetchFoldersBySpace = async (spaceId: string) => {
    try {
      const response = await fetch(`/api/folders?spaceId=${spaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const foldersData = Array.isArray(data) ? data : data.folders || []
        
        // 更新特定空间的文件夹数据
        setFolderSpacesFolders(prev => ({
          ...prev,
          [spaceId]: foldersData
        }))
        
        return foldersData
      }
    } catch (error) {
      console.error('获取空间文件夹失败:', error)
      return []
    }
  }

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (file && file.type === 'text/html' && file.name.toLowerCase().endsWith('.html')) {
      setSelectedFile(file)
      setImportResult(null)
    } else {
      setImportResult({
        success: false,
        message: '请选择有效的HTML书签文件',
        errors: []
      })
    }
  }

  // 触发文件选择对话框
  const triggerFileSelect = () => {
    const input = document.getElementById('bookmark-file-input') as HTMLInputElement
    input?.click()
  }

  // 处理文件输入变化
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // 处理实际导入（点击导入按钮时）
  const handleImportBookmarks = async () => {
    if (!selectedFile) {
      alert('请先选择一个书签文件')
      return
    }

    setIsLoading(true)
    setImportResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportResult({
          success: true,
          message: `成功导入 ${result.successCount} 个书签`,
          folderName: result.folderName
        })
        // 清空文件选择
        setSelectedFile(null)
        const input = document.getElementById('bookmark-file-input') as HTMLInputElement
        if (input) input.value = ''
      } else {
        setImportResult({
          success: false,
          message: result.message || '导入失败',
          errors: result.errors || []
        })
      }
    } catch (error) {
      console.error('导入书签时出错:', error)
      setImportResult({
        success: false,
        message: '导入失败：网络错误',
        errors: [error instanceof Error ? error.message : '未知错误']
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 拖放事件处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      handleFileSelect(file)
    }
  }

  // 处理书签导出
  const handleExport = async () => {
    let params = new URLSearchParams()
    
    if (exportScope === 'space' && exportSpaceId) {
      params.append('spaceId', exportSpaceId)
    } else if (exportScope === 'folder' && exportFolderId) {
      params.append('folderId', exportFolderId)
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookmarks/export?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        // 获取响应头中的文件名，如果没有则使用默认格式
        const contentDisposition = response.headers.get('content-disposition')
        const defaultFileName = `Webooks_bookmarks_${new Date().toISOString().split('T')[0]}.html`
        const fileName = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : defaultFileName

        // 创建下载链接
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const errorData = await response.json()
        alert(errorData.message || '导出失败')
      }
    } catch (error) {
      console.error('导出书签时出错:', error)
      alert('导出失败：网络错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('adminPanel')}
              </h1>
              
              <nav className="flex gap-2">
                <button
                  id="admin-tab-spaces"
                  onClick={() => handleTabChange('spaces')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'spaces'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('spaces')}
              </button>
              <button
                id="admin-tab-folders"
                onClick={() => handleTabChange('folders')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'folders'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('folders')}
              </button>
              <button
                id="admin-tab-bookmarks"
                onClick={() => handleTabChange('bookmarks')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'bookmarks'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('bookmarks')}
                </button>
                <button
                  id="admin-tab-import"
                  onClick={() => handleTabChange('import')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'import'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('importExport')}
                </button>
                <button
                  id="admin-tab-settings"
                  onClick={() => handleTabChange('settings')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('systemSettings')}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.username}
              </span>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {t('returnHome')}
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'spaces' && <SpaceManager />}
        {activeTab === 'folders' && <FolderManager />}
        {activeTab === 'bookmarks' && <BookmarkManager />}
        {activeTab === 'import' && (
          <div className="neu-card p-6">
            <h2 className="text-xl font-bold mb-4">{t('importExportTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('importExportDesc')}
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 导入书签 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('importBookmarks')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('importBookmarksDesc')}
                </p>
                
                <div className="space-y-4">
                  {/* 隐藏的文件输入 */}
                  <input
                    id="bookmark-file-input"
                    type="file"
                    accept=".html"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  
                  {/* 拖放区域 */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {t('dragDropHtmlFile')}
                        </p>
                        <button
                          type="button"
                          onClick={triggerFileSelect}
                          className="btn-primary"
                        >
                          {t('selectFile')}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 显示选中的文件 */}
                  {selectedFile && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null)
                            const input = document.getElementById('bookmark-file-input') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 导入按钮 */}
                  {selectedFile && (
                    <button
                      onClick={handleImportBookmarks}
                      disabled={isLoading}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? t('importing') : t('startImport')}
                    </button>
                  )}
                  
                  {/* 导入结果 */}
                  {importResult && (
                    <div className={`p-4 rounded-lg ${
                      importResult.success ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          {importResult.success ? (
                            <svg fill="currentColor" viewBox="0 0 20 20" className="text-green-600 dark:text-green-400">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg fill="currentColor" viewBox="0 0 20 20" className="text-red-600 dark:text-red-400">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{importResult.message}</p>
                          {importResult.folderName && (
                            <p className="text-sm mt-1">{t('folderLabel')} {importResult.folderName}</p>
                          )}
                          {importResult.errors && importResult.errors.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm font-medium">{t('viewErrorDetails')}</summary>
                              <div className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                                {importResult.errors.map((error, index) => (
                                  <p key={index} className="font-mono bg-white/50 dark:bg-black/20 p-2 rounded">
                                    {error}
                                  </p>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('netscapeBookmarkFormat')}
                  </p>
                </div>
              </div>

              {/* 导出书签 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('exportBookmarks')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('exportBookmarkDesc')}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('exportScopeTitle')}
                    </label>
                    <CustomSelect<'all' | 'space' | 'folder'>
                      value={exportScope}
                      onChange={setExportScope}
                      options={[
                        { value: 'all', label: t('allBookmarks') },
                        { value: 'space', label: t('selectSpace') },
                        { value: 'folder', label: t('selectFolder') }
                      ]}
                      placeholder={t('exportScopeTitle')}
                    />
                  </div>

                  {/* 空间选择器（当选择指定空间时显示） */}
                  {exportScope === 'space' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('selectSpace')}
                      </label>
                      <CustomSelect
                        value={exportSpaceId}
                        onChange={setExportSpaceId}
                        options={spaces ? spaces.map((space) => ({ value: space.id, label: space.name })) : []}
                        placeholder={t('selectSpace')}
                      />
                    </div>
                  )}

                  {/* 文件夹选择器（当选择指定文件夹时显示） */}
                  {exportScope === 'folder' && (
                    <div className="space-y-4">
                      {/* 空间选择器（文件夹导出需要先选择空间） */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('selectFolderSpace')}
                        </label>
                        <CustomSelect
                          value={exportFolderSpaceId}
                          onChange={(value) => {
                            setExportFolderSpaceId(value)
                            setExportFolderId('') // 重置文件夹选择
                            // 如果没有该空间的文件夹数据，则获取
                            if (value && (!folderSpacesFolders[value] || folderSpacesFolders[value].length === 0)) {
                              fetchFoldersBySpace(value)
                            }
                          }}
                          options={spaces ? spaces.map((space) => ({ value: space.id, label: space.name })) : []}
                          placeholder={t('selectFolderSpace')}
                        />
                      </div>
                      
                      {/* 文件夹选择器 */}
                      {exportFolderSpaceId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('selectFolder')}
                          </label>
                          <CustomSelect
                            value={exportFolderId}
                            onChange={setExportFolderId}
                            options={folderSpacesFolders[exportFolderSpaceId] ? 
                              folderSpacesFolders[exportFolderSpaceId].map((folder) => ({ 
                                value: folder.id, 
                                label: folder.name 
                              })) : []}
                            placeholder={t('selectFolder')}
                          />
                          {folderSpacesFolders[exportFolderSpaceId] && folderSpacesFolders[exportFolderSpaceId].length === 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('noFolderInSpace')}
                              </p>
                              <button
                                onClick={() => fetchFoldersBySpace(exportFolderSpaceId)}
                                className="text-sm btn-secondary"
                              >
                                {t('reloadFolder')}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleExport}
                    disabled={
                      (exportScope === 'space' && !exportSpaceId) || 
                      (exportScope === 'folder' && (!exportFolderSpaceId || !exportFolderId))
                    }
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('exportBookmarks')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="neu-card p-6">
            <h2 className="text-xl font-bold mb-6">{t('systemSettings')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 默认空间设置 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('defaultSpaceConfig')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('defaultSpaceDesc')}
                </p>
                
                <div className="space-y-4">
                  {/* 默认空间选择器 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('defaultHomeSpace')}
                    </label>
                    <CustomSelect
                      value={defaultSpaceId}
                      onChange={setDefaultSpaceId}
                      options={spaces ? spaces.map((space) => ({ value: space.id, label: space.name })) : []}
                      placeholder={t('selectDefaultSpace')}
                    />
                  </div>

                  {/* 保存默认空间设置按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        if (defaultSpaceId) {
                          await saveDefaultSpaceId(defaultSpaceId)
                          alert(t('defaultSpaceSaveSuccess'))
                        } else {
                          alert(t('selectDefaultSpaceRequired'))
                        }
                      }}
                      className="btn-primary"
                    >
                      {t('saveDefaultSpace')}
                    </button>
                  </div>
                </div>
              </div>

              {/* 系统卡图设置 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('systemCardSettings')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('systemCardDesc')}
                </p>
                
                <div className="space-y-4">
                  {/* 空间选择器 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('selectSpace')}
                    </label>
                    <CustomSelect
                      value={selectedSpaceId}
                      onChange={setSelectedSpaceId}
                      options={spaces ? spaces.map((space) => ({ value: space.id, label: space.name })) : []}
                      placeholder={t('selectSpace')}
                    />
                    {spaces && spaces.length === 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('noSpaceData')}
                        </p>
                        <button
                          onClick={fetchSpaces}
                          className="text-sm btn-secondary"
                        >
                          {t('reload')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 卡图预览 */}
                  {selectedSpaceId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('systemCardPreview')}
                      </label>
                      <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ width: '520px', height: '120px', maxWidth: '100%' }}>
                        {systemCardUrl ? (
                          <img
                            src={systemCardUrl}
                            alt="系统卡图预览"
                            className="w-full h-full object-cover"
                            style={{ width: '520px', height: '120px', maxWidth: '100%' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                const fallbackDiv = document.createElement('div')
                                fallbackDiv.className = 'w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center'
                                fallbackDiv.innerHTML = '<span class="text-white font-bold text-xl">webooks</span>'
                                parent.appendChild(fallbackDiv)
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center" style={{ width: '520px', height: '120px', maxWidth: '100%' }}>
                            <span className="text-white font-bold text-xl">webooks</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* URL输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('systemCardUrl')}
                    </label>
                    <input
                      type="url"
                      value={systemCardUrl}
                      onChange={(e) => setSystemCardUrl(e.target.value)}
                      placeholder={t('systemCardUrlPlaceholder')}
                      className="neu-input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('defaultWeebooksTitle')}
                    </p>
                  </div>

                  {/* 保存按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSaveSystemCard}
                      disabled={!selectedSpaceId || isLoading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? t('saving') : t('saveSystemCard')}
                    </button>
                    <button
                      onClick={() => setSystemCardUrl('')}
                      disabled={isLoading}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('clear')}
                    </button>
                  </div>
                </div>
              </div>

              {/* 网站设置 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('siteSettings')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('siteSettingsDesc')}
                </p>
                
                <div className="space-y-4">
                  {/* 网站标题输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('siteTitle')}
                    </label>
                    <input
                      type="text"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      placeholder={t('siteTitlePlaceholder')}
                      className="neu-input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('browserTitleDesc')}
                    </p>
                  </div>

                  {/* 图标输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('siteIcon')}
                    </label>
                    <input
                      type="url"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder={t('faviconPlaceholder')}
                      className="neu-input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('browserIconDesc')}
                    </p>
                  </div>

                  {/* SEO描述输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('seoDescription')}
                    </label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder={t('seoDescPlaceholder')}
                      rows={3}
                      className="neu-input resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('seoDescLabel')}
                    </p>
                  </div>

                  {/* 关键字输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('seoKeywords')}
                    </label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder={t('keywordsPlaceholder')}
                      className="neu-input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('keywordsDesc')}
                    </p>
                  </div>

                  {/* 保存按钮 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={saveSiteSettings}
                      disabled={isLoading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? t('saving') : t('saveSiteSettings')}
                    </button>
                    <button
                      onClick={() => {
                        setSiteTitle('')
                        setFaviconUrl('')
                        setSeoDescription('')
                        setKeywords('')
                      }}
                      disabled={isLoading}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('clear')}
                    </button>
                  </div>
                </div>
              </div>

              {/* API Key管理 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('apiKeyManager')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('apiKeyDescription')}
                </p>
                
                <div className="space-y-4">
                  {hasApiKey ? (
                    <>
                      {/* API Key显示 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('yourApiKey')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={showApiKey ? currentApiKey : maskedApiKey}
                            readOnly
                            className="neu-input flex-1 bg-gray-50 dark:bg-gray-800"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="btn-secondary px-3 py-2 text-sm"
                            title={showApiKey ? t('hideApiKey') : t('showApiKey')}
                          >
                            {showApiKey ? t('hide') : t('show')}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('apiKeyWarning')}
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleCopyApiKey}
                          disabled={!currentApiKey}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('copyApiKey')}
                        </button>
                        <button
                          onClick={handleGenerateApiKey}
                          disabled={isLoading}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? t('generating') : t('regenerate')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 无API Key状态 */}
                      <div className="text-center py-6">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {t('noApiKeySet')}
                        </p>
                        <button
                          onClick={handleGenerateApiKey}
                          disabled={isLoading}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? t('generating') : t('generateApiKey')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
