// 缓存管理模块

// 版本Key接口
export interface VersionKeys {
  spaces: string
  folders: string
  bookmarks: string
  system: string
}

// 缓存数据类型
export type CacheDataType = 'spaces' | 'folders' | 'bookmarks' | 'system'

// 缓存项接口
export interface CacheItem<T> {
  data: T
  version: string
  timestamp: number
}

// 性能统计接口
interface PerformanceStats {
  cacheHits: number
  cacheMisses: number
  totalLoadTime: number
  averageLoadTime: number
  lastLoadTime: number
  lastCacheTime: number
  lastAPITime: number
}

// 性能统计数据
const performanceStats: PerformanceStats = {
  cacheHits: 0,
  cacheMisses: 0,
  totalLoadTime: 0,
  averageLoadTime: 0,
  lastLoadTime: 0,
  lastCacheTime: 0,
  lastAPITime: 0
}

// 缓存键名常量
const CACHE_KEYS = {
  VERSION: 'webooks:version',
  SPACES: 'webooks:spaces',
  FOLDERS: 'webooks:folders',
  BOOKMARKS: 'webooks:bookmarks',
  SYSTEM: 'webooks:system'
}

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 12 * 60 * 60 * 1000 // 12小时

// 最大缓存大小（字节）
const MAX_CACHE_SIZE = 10 * 1024 * 1024 // 10MB

// 缓存项数量限制
const MAX_CACHE_ITEMS = 50

// 缓存管理类
export class CacheManager {
  private static instance: CacheManager

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // 获取版本Key
  async getLatestVersionKeys(): Promise<VersionKeys | null> {
    try {
      const response = await fetch('/api/version', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取版本Key失败')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('获取版本Key失败:', error)
      return null
    }
  }

  // 获取本地版本Key
  getLocalVersionKeys(): VersionKeys | null {
    try {
      const versionStr = localStorage.getItem(CACHE_KEYS.VERSION)
      if (!versionStr) return null
      return JSON.parse(versionStr)
    } catch (error) {
      console.error('获取本地版本Key失败:', error)
      return null
    }
  }

  // 保存版本Key
  saveVersionKeys(versionKeys: VersionKeys): void {
    try {
      localStorage.setItem(CACHE_KEYS.VERSION, JSON.stringify(versionKeys))
    } catch (error) {
      console.error('保存版本Key失败:', error)
    }
  }

  // 检查版本是否一致
  isVersionMatch(localVersion: VersionKeys | null, remoteVersion: VersionKeys | null): boolean {
    if (!localVersion || !remoteVersion) return false

    return (
      localVersion.spaces === remoteVersion.spaces &&
      localVersion.folders === remoteVersion.folders &&
      localVersion.bookmarks === remoteVersion.bookmarks &&
      localVersion.system === remoteVersion.system
    )
  }

  // 检查特定类型的版本是否一致
  isTypeVersionMatch(localVersion: VersionKeys | null, remoteVersion: VersionKeys | null, type: CacheDataType): boolean {
    if (!localVersion || !remoteVersion) return false
    return localVersion[type] === remoteVersion[type]
  }

  // 加载缓存数据
  loadCache<T>(type: CacheDataType): T | null {
    const startTime = performance.now()
    
    try {
      const cacheStr = localStorage.getItem(this.getCacheKey(type))
      if (!cacheStr) {
        performanceStats.cacheMisses++
        performanceStats.lastLoadTime = performance.now() - startTime
        return null
      }

      const cacheItem: CacheItem<T> = JSON.parse(cacheStr)

      // 检查缓存是否过期
      if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
        console.log('缓存已过期，清除缓存:', type)
        this.clearCache(type)
        performanceStats.cacheMisses++
        performanceStats.lastLoadTime = performance.now() - startTime
        return null
      }

      // 性能统计
      const loadTime = performance.now() - startTime
      performanceStats.cacheHits++
      performanceStats.totalLoadTime += loadTime
      performanceStats.averageLoadTime = performanceStats.totalLoadTime / (performanceStats.cacheHits + performanceStats.cacheMisses)
      performanceStats.lastLoadTime = loadTime
      performanceStats.lastCacheTime = loadTime

      console.log(`从缓存加载${type}数据成功，耗时: ${loadTime.toFixed(2)}ms`)
      return cacheItem.data
    } catch (error) {
      console.error('加载缓存失败，降级到API请求:', error)
      // 缓存加载失败时降级到API请求
      performanceStats.cacheMisses++
      performanceStats.lastLoadTime = performance.now() - startTime
      // 清除可能损坏的缓存
      this.clearCache(type)
      return null
    }
  }

  // 保存缓存数据
  saveCache<T>(type: CacheDataType, data: T, version: string): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        version,
        timestamp: Date.now()
      }
      
      // 检查缓存大小
      this.checkCacheSize()
      
      localStorage.setItem(this.getCacheKey(type), JSON.stringify(cacheItem))
    } catch (error) {
      console.error('保存缓存失败:', error)
    }
  }

  // 检查缓存大小并清理
  private checkCacheSize(): void {
    try {
      let totalSize = 0
      const cacheItems: { key: string; size: number; timestamp: number }[] = []
      
      // 计算当前缓存大小
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('webooks:')) {
          const value = localStorage.getItem(key)
          if (value) {
            const size = new Blob([value]).size
            totalSize += size
            
            // 解析缓存项获取时间戳
            try {
              const cacheItem = JSON.parse(value)
              cacheItems.push({
                key,
                size,
                timestamp: cacheItem.timestamp || 0
              })
            } catch {
              // 如果解析失败，使用当前时间
              cacheItems.push({
                key,
                size,
                timestamp: Date.now()
              })
            }
          }
        }
      }
      
      console.log('当前缓存大小:', totalSize, 'bytes')
      
      // 如果超过大小限制，删除最旧的缓存项
      if (totalSize > MAX_CACHE_SIZE || cacheItems.length > MAX_CACHE_ITEMS) {
        console.log('缓存超过限制，开始清理...')
        
        // 按时间戳排序，删除最旧的
        cacheItems.sort((a, b) => a.timestamp - b.timestamp)
        
        let itemsToDelete = cacheItems.length - MAX_CACHE_ITEMS
        let bytesToDelete = totalSize - MAX_CACHE_SIZE
        
        for (const item of cacheItems) {
          if (itemsToDelete <= 0 && bytesToDelete <= 0) break
          
          localStorage.removeItem(item.key)
          totalSize -= item.size
          itemsToDelete--
          bytesToDelete -= item.size
          
          console.log('删除缓存项:', item.key, '大小:', item.size, 'bytes')
        }
        
        console.log('缓存清理完成，新大小:', totalSize, 'bytes')
      }
    } catch (error) {
      console.error('检查缓存大小失败:', error)
    }
  }

  // 清除缓存
  clearCache(type: CacheDataType): void {
    try {
      localStorage.removeItem(this.getCacheKey(type))
    } catch (error) {
      console.error('清除缓存失败:', error)
    }
  }

  // 清除所有缓存
  clearAllCache(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.VERSION)
      localStorage.removeItem(CACHE_KEYS.SPACES)
      localStorage.removeItem(CACHE_KEYS.FOLDERS)
      localStorage.removeItem(CACHE_KEYS.BOOKMARKS)
      localStorage.removeItem(CACHE_KEYS.SYSTEM)
    } catch (error) {
      console.error('清除所有缓存失败:', error)
    }
  }

  // 检查是否为强制刷新
  isForceRefresh(): boolean {
    // 检查sessionStorage中的强制刷新标志
    const isForce = sessionStorage.getItem('webooks:forceRefresh') === 'true'
    if (isForce) {
      // 清除标志
      sessionStorage.removeItem('webooks:forceRefresh')
    }
    return isForce
  }

  // 设置强制刷新标志
  setForceRefresh(): void {
    sessionStorage.setItem('webooks:forceRefresh', 'true')
  }

  // 处理页面刷新事件
  handlePageRefresh(): void {
    // 监听页面卸载事件，用于检测F5或Ctrl+R刷新
    window.addEventListener('beforeunload', () => {
      // 这里可以添加一些清理逻辑
      console.log('页面即将刷新...')
    })

    // 监听键盘事件，检测Ctrl+R
    window.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        console.log('检测到Ctrl+R刷新，设置强制刷新标志...')
        this.setForceRefresh()
      }
    })
  }

  // 清除特定空间的文件夹缓存
  clearFolderCache(spaceId: string): void {
    try {
      const cacheKey = `folders_${spaceId}`
      localStorage.removeItem(cacheKey)
      console.log('清除空间文件夹缓存:', spaceId)
    } catch (error) {
      console.error('清除文件夹缓存失败:', error)
    }
  }

  // 清除特定文件夹的书签缓存
  clearBookmarkCache(folderKey: string): void {
    try {
      // 清除所有页码的缓存
      for (let i = 1; i <= 10; i++) { // 假设最多10页
        const cacheKey = `bookmarks_${folderKey}_${i}`
        localStorage.removeItem(cacheKey)
      }
      console.log('清除文件夹书签缓存:', folderKey)
    } catch (error) {
      console.error('清除书签缓存失败:', error)
    }
  }

  // 获取性能统计数据
  getPerformanceStats(): PerformanceStats {
    return { ...performanceStats }
  }

  // 重置性能统计数据
  resetPerformanceStats(): void {
    Object.assign(performanceStats, {
      cacheHits: 0,
      cacheMisses: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
      lastLoadTime: 0,
      lastCacheTime: 0,
      lastAPITime: 0
    })
    console.log('性能统计数据已重置')
  }

  // 记录API请求时间
  recordAPITime(time: number): void {
    performanceStats.lastAPITime = time
    console.log(`API请求耗时: ${time.toFixed(2)}ms`)
  }

  // 获取缓存键名
  private getCacheKey(type: CacheDataType): string {
    switch (type) {
      case 'spaces':
        return CACHE_KEYS.SPACES
      case 'folders':
        return CACHE_KEYS.FOLDERS
      case 'bookmarks':
        return CACHE_KEYS.BOOKMARKS
      case 'system':
        return CACHE_KEYS.SYSTEM
      default:
        throw new Error('无效的缓存类型')
    }
  }
}

// 导出单例实例
export const cacheManager = CacheManager.getInstance()

// 便捷函数
export const getLatestVersionKeys = async (): Promise<VersionKeys | null> => {
  return await cacheManager.getLatestVersionKeys()
}

export const loadCache = <T>(type: CacheDataType): T | null => {
  return cacheManager.loadCache<T>(type)
}

export const saveCache = <T>(type: CacheDataType, data: T, version: string): void => {
  cacheManager.saveCache<T>(type, data, version)
}

export const clearCache = (type: CacheDataType): void => {
  cacheManager.clearCache(type)
}

export const clearAllCache = (): void => {
  cacheManager.clearAllCache()
}

export const isForceRefresh = (): boolean => {
  return cacheManager.isForceRefresh()
}

export const setForceRefresh = (): void => {
  cacheManager.setForceRefresh()
}

// 性能监控相关便捷函数
export const getPerformanceStats = (): PerformanceStats => {
  return cacheManager.getPerformanceStats()
}

export const resetPerformanceStats = (): void => {
  cacheManager.resetPerformanceStats()
}

export const recordAPITime = (time: number): void => {
  cacheManager.recordAPITime(time)
}

// 处理页面刷新事件的便捷函数
export const setupPageRefreshHandler = (): void => {
  cacheManager.handlePageRefresh()
}

// 清除特定缓存的便捷函数
export const clearFolderCache = (spaceId: string): void => {
  cacheManager.clearFolderCache(spaceId)
}

export const clearBookmarkCache = (folderKey: string): void => {
  cacheManager.clearBookmarkCache(folderKey)
}
