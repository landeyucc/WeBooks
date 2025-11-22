import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 导入系统参数（空间、文件夹、书签、系统设置）
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserId(request)
    
    if (authResult.response) {
      return authResult.response
    }

    const userId = authResult.userId
    if (!userId) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      )
    }

    // 获取请求数据
    const requestData = await request.json()
    const { importData, importMode = 'merge' } = requestData

    if (!importData) {
      return NextResponse.json(
        { error: '缺少导入数据' },
        { status: 400 }
      )
    }

    // 验证导入数据格式
    if (!validateImportData(importData)) {
      return NextResponse.json(
        { error: '导入数据格式无效' },
        { status: 400 }
      )
    }

        // 执行导入操作
    const importResult = await performImport(userId, importData, importMode)

      return NextResponse.json({
      success: true,
      message: `导入完成，成功处理 ${importResult.successCount} 项，失败 ${importResult.errorCount} 项`,
      details: importResult
    })

  } catch (error) {
    console.error('系统参数导入错误:', error)
    return NextResponse.json(
      { error: '系统参数导入失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 定义导入数据结构
interface ImportData {
  version: string;
  exportTime?: string;
  exportedAt?: string;
  spaces: SpaceData[];
  folders: FolderData[];
  bookmarks: BookmarkData[];
  systemConfig?: SystemConfig;
  user?: UserData;
  summary?: SummaryData;
}

// 定义用户数据接口
interface UserData {
  id?: string;
  username?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 定义摘要数据接口
interface SummaryData {
  totalSpaces?: number;
  totalFolders?: number;
  totalBookmarks?: number;
  totalUsers?: number;
  exportedAt?: string;
  version?: string;
}

// 数据验证
function validateImportData(data: ImportData): data is ImportData {
  if (!data || (typeof data !== 'object')) {
    throw new Error('无效的导入数据')
  }
  
  // 检查必需字段
  if (!data.version || (!data.exportTime && !data.exportedAt)) {
    throw new Error('缺少必需的版本或导出时间字段')
  }

  // 验证 spaces, folders, bookmarks 等字段存在
  if (!data.spaces || !data.folders || !data.bookmarks) {
    throw new Error('缺少必需的数据字段')
  }

  // 验证数据类型
  if (!Array.isArray(data.spaces) || !Array.isArray(data.folders) || !Array.isArray(data.bookmarks)) {
    throw new Error('数据结构类型错误')
  }

  // 版本兼容性检查
  const supportedVersions = ['1.0']
  if (!supportedVersions.includes(data.version)) {
    throw new Error(`不支持的版本: ${data.version}`)
  }

  // 数据内容基本检查
  const maxItems = 10000 // 限制最大导入项数
  if (data.spaces.length + data.folders.length + data.bookmarks.length > maxItems) {
    throw new Error('导入数据过多')
  }

  return true
}

// 定义导入结果接口
interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
  details: {
    spaces: { created: number; updated: number; skipped: number };
    folders: { created: number; updated: number; skipped: number };
    bookmarks: { created: number; updated: number; skipped: number };
    systemConfig: { updated: number; skipped: number };
  };
}

// 执行导入操作
async function performImport(userId: string, importData: ImportData, importMode: string): Promise<ImportResult> {
  const result: ImportResult = {
    successCount: 0,
    errorCount: 0,
    errors: [],
    details: {
      spaces: { created: 0, updated: 0, skipped: 0 },
      folders: { created: 0, updated: 0, skipped: 0 },
      bookmarks: { created: 0, updated: 0, skipped: 0 },
      systemConfig: { updated: 0, skipped: 0 }
    }
  }

  try {
    // 根据导入模式处理现有数据
    if (importMode === 'replace') {
      await clearExistingData(userId)
    }

    // 先导入空间，再导入系统配置（避免外键约束问题）
    await importSpaces(userId, importData.spaces, result)

    // 导入系统配置
    await importSystemConfig(userId, importData.systemConfig || null, result)

    // 导入文件夹
    await importFolders(userId, importData.folders, result)

    // 导入书签
    await importBookmarks(userId, importData.bookmarks, result)

  } catch (error) {
    console.error('导入过程中发生错误:', error)
    result.errors.push(`导入过程发生错误: ${error instanceof Error ? error.message : '未知错误'}`)
    result.errorCount++
  }

  return result
}

// 清空现有数据（替换模式）
async function clearExistingData(userId: string) {  
  
  // 按依赖关系删除数据
  await prisma.bookmark.deleteMany({ where: { userId } })
  await prisma.folder.deleteMany({ where: { userId } })
  await prisma.space.deleteMany({ where: { userId } })
  await prisma.systemConfig.deleteMany({ where: { userId } })

}

// 定义系统配置接口
interface SystemConfig {
  defaultSpaceId?: string;
  siteTitle?: string;
  faviconUrl?: string;
  seoDescription?: string;
  keywords?: string;
  apiKey?: string;
}

// 导入系统配置
async function importSystemConfig(userId: string, systemConfig: SystemConfig | null, result: ImportResult) {
  if (!systemConfig) {
    result.details.systemConfig.skipped++
    return
  }

  try {
    const existingConfig = await prisma.systemConfig.findFirst({ where: { userId } })
    
    if (existingConfig) {
      // 更新现有配置
      await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          defaultSpaceId: systemConfig.defaultSpaceId || '',
          siteTitle: systemConfig.siteTitle || '',
          faviconUrl: systemConfig.faviconUrl || '',
          seoDescription: systemConfig.seoDescription || '',
          keywords: systemConfig.keywords || '',
          apiKey: systemConfig.apiKey || '',
          updatedAt: new Date()
        }
      })
      result.details.systemConfig.updated++
    } else {
      // 创建新配置
      await prisma.systemConfig.create({
        data: {
          userId,
          defaultSpaceId: systemConfig.defaultSpaceId || '',
          siteTitle: systemConfig.siteTitle || '',
          faviconUrl: systemConfig.faviconUrl || '',
          seoDescription: systemConfig.seoDescription || '',
          keywords: systemConfig.keywords || '',
          apiKey: systemConfig.apiKey || ''
        }
      })
      result.details.systemConfig.updated++
    }
    
    result.successCount++
  } catch (error) {
    console.error('导入系统配置失败:', error)
    result.errors.push(`系统配置导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    result.errorCount++
  }
}

// 定义空间数据接口
interface SpaceData {
  name: string;
  description?: string;
  iconUrl?: string;
  systemCardUrl?: string;
  isEncrypted?: boolean;
}

// 导入空间
async function importSpaces(userId: string, spaces: SpaceData[], result: ImportResult) {
  for (const spaceData of spaces) {
    try {
      const existingSpace = await prisma.space.findFirst({
        where: { 
          userId,
          name: spaceData.name
        }
      })

      if (existingSpace) {
        // 跳过已存在的空间（合并模式）
        result.details.spaces.skipped++
      } else {
        // 创建新空间
        await prisma.space.create({
          data: {
            userId,
            name: spaceData.name,
            description: spaceData.description || '',
            iconUrl: spaceData.iconUrl || '',
            systemCardUrl: spaceData.systemCardUrl || '',
            isEncrypted: spaceData.isEncrypted || false
            // 不导入密码哈希，保持安全
          }
        })
        result.details.spaces.created++
      }
      
      result.successCount++
    } catch (error) {
      console.error('导入空间失败:', spaceData.name, error)
      result.errors.push(`空间 "${spaceData.name}" 导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      result.errorCount++
    }
  }
}

// 定义文件夹数据接口
interface FolderData {
  name: string;
  spaceName: string;
  description?: string;
}

// 导入文件夹
async function importFolders(userId: string, folders: FolderData[], result: ImportResult) {
  for (const folderData of folders) {
    try {
      // 查找空间ID
      const space = await prisma.space.findFirst({
        where: { 
          userId,
          name: folderData.spaceName
        }
      })

      if (!space) {
        result.details.folders.skipped++
        result.errors.push(`文件夹 "${folderData.name}" 的空间 "${folderData.spaceName}" 不存在，跳过`)
        continue
      }

      const existingFolder = await prisma.folder.findFirst({
        where: { 
          userId,
          spaceId: space.id,
          name: folderData.name
        }
      })

      if (existingFolder) {
        // 跳过已存在的文件夹
        result.details.folders.skipped++
      } else {
        // 创建新文件夹
        await prisma.folder.create({
          data: {
            userId,
            spaceId: space.id,
            name: folderData.name,
            description: folderData.description || ''
          }
        })
        result.details.folders.created++
      }
      
      result.successCount++
    } catch (error) {
      console.error('导入文件夹失败:', folderData.name, error)
      result.errors.push(`文件夹 "${folderData.name}" 导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      result.errorCount++
    }
  }
}

// 定义书签数据接口
interface BookmarkData {
  title: string;
  url: string;
  spaceName: string;
  folderName?: string;
  description?: string;
}

// 导入书签
async function importBookmarks(userId: string, bookmarks: BookmarkData[], result: ImportResult) {
  for (const bookmarkData of bookmarks) {
    try {
      // 查找空间ID
      const space = await prisma.space.findFirst({
        where: { 
          userId,
          name: bookmarkData.spaceName
        }
      })

      if (!space) {
        result.details.bookmarks.skipped++
        result.errors.push(`书签 "${bookmarkData.title}" 的空间 "${bookmarkData.spaceName}" 不存在，跳过`)
        continue
      }

      // 查找文件夹ID（可选）
      let folder = null
      if (bookmarkData.folderName) {
        folder = await prisma.folder.findFirst({
          where: { 
            userId,
            spaceId: space.id,
            name: bookmarkData.folderName
          }
        })
      }

      const existingBookmark = await prisma.bookmark.findFirst({
        where: { 
          userId,
          url: bookmarkData.url
        }
      })

      if (existingBookmark) {
        // 跳过已存在的书签（避免重复）
        result.details.bookmarks.skipped++
      } else {
        // 创建新书签
        await prisma.bookmark.create({
          data: {
            userId,
            title: bookmarkData.title,
            url: bookmarkData.url,
            description: bookmarkData.description || '',
            spaceId: space.id,
            folderId: folder ? folder.id : null
          }
        })
        result.details.bookmarks.created++
      }
      
      result.successCount++
    } catch (error) {
      console.error('导入书签失败:', bookmarkData.title, error)
      result.errors.push(`书签 "${bookmarkData.title}" 导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
      result.errorCount++
    }
  }
}