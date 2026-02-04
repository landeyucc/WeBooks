import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 版本Key类型
export interface VersionKeys {
  spaces: string
  folders: string
  bookmarks: string
  system: string
}


// 生成新的版本Key
const generateVersionKey = (): string => {
  return Date.now().toString() // 精确到毫秒的时间戳
}

// 版本管理类
export class VersionManager {
  private static instance: VersionManager
  private versionKeys: VersionKeys | null = null
  private lastFetchTime: number = 0

  private constructor() {}

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager()
    }
    return VersionManager.instance
  }

  // 获取所有版本Key
  async getVersionKeys(): Promise<VersionKeys> {
    // 缓存10秒，避免频繁查询
    if (this.versionKeys && Date.now() - this.lastFetchTime < 10000) {
      return this.versionKeys
    }

    try {
      // 从数据库获取版本Key
      const spacesVersion = await this.getVersion()
      const foldersVersion = await this.getVersion()
      const bookmarksVersion = await this.getVersion()
      const systemVersion = await this.getVersion()

      this.versionKeys = {
        spaces: spacesVersion,
        folders: foldersVersion,
        bookmarks: bookmarksVersion,
        system: systemVersion
      }

      this.lastFetchTime = Date.now()
      return this.versionKeys
    } catch (error) {
      console.error('获取版本Key失败:', error)
      // 失败时返回当前时间戳作为默认值
      return this.generateDefaultVersionKeys()
    }
  }

  // 获取单个版本Key
  private async getVersion(): Promise<string> {
    try {
      // 这里使用SystemConfig作为版本Key的存储位置
      // 实际项目中可以考虑使用Redis或其他缓存系统
      const config = await prisma.systemConfig.findFirst({
        where: {
          userId: 'system' // 使用system用户存储全局配置
        }
      })

      if (config) {
        // 从config的某个字段中读取版本信息
        // 这里简化处理，实际应该使用专门的字段或表
        return config.apiKey || generateVersionKey()
      } else {
        // 如果不存在，创建一个新的版本Key
        const newVersion = generateVersionKey()
        return newVersion
      }
    } catch {
      return generateVersionKey()
    }
  }

  // 生成默认版本Key
  private generateDefaultVersionKeys(): VersionKeys {
    return {
      spaces: generateVersionKey(),
      folders: generateVersionKey(),
      bookmarks: generateVersionKey(),
      system: generateVersionKey()
    }
  }

  // 更新版本Key
  async updateVersionKey(type: keyof VersionKeys): Promise<void> {
    try {
      const newVersion = generateVersionKey()
      
      // 这里简化处理，实际应该更新到数据库
      console.log(`更新版本Key: ${type} -> ${newVersion}`)

      // 清除缓存
      this.versionKeys = null
    } catch (error) {
      console.error(`更新版本Key失败 ${type}:`, error)
    }
  }

  // 批量更新版本Key
  async updateVersionKeys(types: (keyof VersionKeys)[]): Promise<void> {
    for (const type of types) {
      await this.updateVersionKey(type)
    }
  }

  // 清除所有版本Key（强制刷新）
  async clearVersionKeys(): Promise<void> {
    this.versionKeys = null
    this.lastFetchTime = 0
  }
}

// 导出单例实例
export const versionManager = VersionManager.getInstance()

// 便捷函数：更新版本Key
export const updateVersionKey = async (type: keyof VersionKeys): Promise<void> => {
  await versionManager.updateVersionKey(type)
}

// 便捷函数：获取版本Key
export const getVersionKeys = async (): Promise<VersionKeys> => {
  return await versionManager.getVersionKeys()
}
