'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKey } from '@/lib/i18n'

interface User {
  id: string
  username: string
  email: string | null
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
  toggleTheme: () => void
  
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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [language, setLanguageState] = useState<Language>('zh')
  const [loading, setLoading] = useState(true) // 修改为true，初始加载状态
  const [collapsedFolders, setCollapsedFoldersState] = useState<Set<string>>(new Set())

  // 初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 加载token
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        if (savedToken && savedUser) {
          try {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
            console.log('从localStorage恢复认证状态:', { 
              hasToken: !!savedToken, 
              hasUser: !!savedUser 
            })
          } catch (error) {
            console.error('解析用户信息失败:', error)
            // 清除无效数据
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

        // 加载语言
        const savedLanguage = localStorage.getItem('language') as Language | null
        if (savedLanguage) {
          setLanguageState(savedLanguage)
        }

        // 不直接恢复折叠状态，让组件根据当前空间重新计算
        // 初始状态为空集合，所有文件夹都默认展开
        
        console.log('AppContext初始化完成', { 
          hasToken: !!savedToken, 
          hasUser: !!savedUser 
        })
      } catch (error) {
        console.error('AppContext初始化失败:', error)
      } finally {
        // 初始化完成后设置loading为false
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

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

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key
    
    // 如果有参数，进行简单的参数替换
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value))
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
    toggleTheme,
    language,
    setLanguage,
    t,
    loading,
    setLoading,
    collapsedFolders,
    toggleFolderCollapse,
    setCollapsedFolders
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
