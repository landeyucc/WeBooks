'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '@/lib/i18n'
import type { Space, Folder, Bookmark } from '@prisma/client'

interface User {
  id: string
  username: string
  email: string | null
}

interface FolderNode extends Folder {
  children: FolderNode[]
  bookmarks: Bookmark[]
}

interface SpaceData {
  space: Space
  folders: Folder[]
  bookmarks: Bookmark[]
  folderTree: FolderNode[]
}

interface AppContextType {
  // Auth
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  
  // Theme
  theme: 'light' | 'dark'
  themeType: 'neumorphism' | 'skyblue'
  toggleTheme: () => void
  setThemeType: (type: 'neumorphism' | 'skyblue') => void
  
  // Language
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  
  // Loading
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // Sidebar collapse state
  collapsedFolders: Set<string>
  toggleFolderCollapse: (folderId: string) => void
  setCollapsedFolders: (folders: Set<string>) => void
  
  // Space data management
  currentSpaceData: SpaceData | null
  loadSpaceData: (spaceId: string) => Promise<void>
  clearSpaceData: () => void
  isLoadingSpaceData: boolean
}

// 默认值定义
const defaultContextValue: AppContextType = {
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  theme: 'light',
  themeType: 'neumorphism',
  toggleTheme: () => {},
  setThemeType: () => {},
  language: 'zh',
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => {
    if (params) {
      let result = key
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`
        const value = params[paramKey]
        result = result.replace(new RegExp(placeholder, 'g'), value.toString())
      })
      return result
    }
    return key
  },
  loading: true,
  setLoading: () => {},
  collapsedFolders: new Set<string>(),
  toggleFolderCollapse: () => {},
  setCollapsedFolders: () => {},
  currentSpaceData: null,
  loadSpaceData: async () => {},
  clearSpaceData: () => {},
  isLoadingSpaceData: false
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [themeType, setThemeTypeState] = useState<'neumorphism' | 'skyblue'>('neumorphism')
  const [language, setLanguageState] = useState<Language>('zh')
  const [loading, setLoading] = useState(true)
  const [collapsedFolders, setCollapsedFoldersState] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)
  
  // Space data management
  const [currentSpaceData, setCurrentSpaceData] = useState<SpaceData | null>(null)
  const [isLoadingSpaceData, setIsLoadingSpaceData] = useState(false)

  // 确保只在客户端运行localStorage相关操作
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 初始化
  useEffect(() => {
    if (!isClient) return
    
    const initializeApp = async () => {
      try {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        if (savedToken && savedUser) {
          try {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
          } catch {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }

        // 加载主题
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        if (savedTheme) {
          setTheme(savedTheme)
          document.documentElement.classList.toggle('dark', savedTheme === 'dark')
        }

        // 加载主题类型
        const savedThemeType = localStorage.getItem('themeType') as 'neumorphism' | 'skyblue' | null
        if (savedThemeType) {
          setThemeTypeState(savedThemeType)
          document.documentElement.classList.remove('theme-neumorphism', 'theme-skyblue')
          document.documentElement.classList.add(`theme-${savedThemeType}`)
        } else {
          document.documentElement.classList.add('theme-neumorphism')
        }

        // 加载语言
        const savedLanguage = localStorage.getItem('language') as Language | null
        if (savedLanguage) {
          setLanguageState(savedLanguage)
        }

        // 加载折叠状态
        const savedCollapsedFolders = localStorage.getItem('collapsedFolders')
        if (savedCollapsedFolders) {
          try {
            const folders = JSON.parse(savedCollapsedFolders)
            setCollapsedFoldersState(new Set(folders))
          } catch {
            localStorage.removeItem('collapsedFolders')
          }
        }
        
      } catch {
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [isClient])

  // 保存折叠状态到localStorage
  useEffect(() => {
    localStorage.setItem('collapsedFolders', JSON.stringify(Array.from(collapsedFolders)))
  }, [collapsedFolders])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const setThemeType = (type: 'neumorphism' | 'skyblue') => {
    setThemeTypeState(type)
    localStorage.setItem('themeType', type)
    document.documentElement.classList.remove('theme-neumorphism', 'theme-skyblue')
    document.documentElement.classList.add(`theme-${type}`)
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFoldersState(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const setCollapsedFolders = (folders: Set<string>) => {
    setCollapsedFoldersState(folders)
  }

  // 空间数据加载函数
  const loadSpaceData = async (spaceId: string) => {
    if (!spaceId) return
    
    setIsLoadingSpaceData(true)
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`/api/spaces/${spaceId}/data`, { headers })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const spaceData = await response.json()
      
      setCurrentSpaceData(spaceData)
    } catch {
      setCurrentSpaceData(null)
    } finally {
      setIsLoadingSpaceData(false)
    }
  }

  // 清除空间数据
  const clearSpaceData = () => {
    setCurrentSpaceData(null)
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key
    
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`
        const value = params[paramKey]
        translation = translation.replace(new RegExp(placeholder, 'g'), value.toString())
      })
    }
    
    return translation
  }

  const value: AppContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    theme,
    themeType,
    toggleTheme,
    setThemeType,
    language,
    setLanguage,
    t,
    loading,
    setLoading,
    collapsedFolders,
    toggleFolderCollapse,
    setCollapsedFolders,
    currentSpaceData,
    loadSpaceData,
    clearSpaceData,
    isLoadingSpaceData
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useApp must be used within an AppProvider. Returning default values.')
    }
    return defaultContextValue
  }
  return context
}
