const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function exportSystemConfig() {
  try {
    const prisma = new PrismaClient()
    const userId = '7a574630-0702-48ca-bdc8-f3d3b26654d9'

    console.log('🔍 导出系统配置...\n')

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, createdAt: true }
    })

    // 获取系统配置
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { userId },
      include: {
        defaultSpace: {
          select: { id: true, name: true, description: true, iconUrl: true, systemCardUrl: true }
        }
      }
    })

    // 获取所有空间
    const spaces = await prisma.space.findMany({
      where: { userId },
      select: {
        id: true, name: true, description: true, iconUrl: true, systemCardUrl: true,
        isEncrypted: true, createdAt: true, updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 获取所有文件夹
    const foldersRaw = await prisma.folder.findMany({
      where: { userId },
      include: { space: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' }
    })
    const folders = foldersRaw.map(f => ({
      id: f.id, name: f.name, description: f.description, iconUrl: f.iconUrl,
      spaceId: f.spaceId, spaceName: f.space?.name || '',
      parentFolderId: f.parentFolderId, userId: f.userId,
      createdAt: f.createdAt, bookmarkCount: f.bookmarkCount
    }))

    // 获取所有书签
    const bookmarksRaw = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        space: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    const bookmarks = bookmarksRaw.map(b => ({
      id: b.id, title: b.title, url: b.url, description: b.description,
      iconUrl: b.iconUrl, spaceId: b.spaceId, spaceName: b.space?.name || '',
      folderId: b.folderId, folderName: b.folder?.name || null,
      userId: b.userId, createdAt: b.createdAt
    }))

    // 构建导出数据
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      user: {
        id: user?.id, username: user?.username, email: user?.email, createdAt: user?.createdAt
      },
      systemConfig: {
        id: systemConfig?.id, defaultSpaceId: systemConfig?.defaultSpaceId,
        defaultSpace: systemConfig?.defaultSpace,
        siteTitle: systemConfig?.siteTitle, faviconUrl: systemConfig?.faviconUrl,
        seoDescription: systemConfig?.seoDescription, keywords: systemConfig?.keywords,
        apiKey: systemConfig?.apiKey, createdAt: systemConfig?.createdAt,
        updatedAt: systemConfig?.updatedAt
      },
      spaces: spaces,
      folders: folders,
      bookmarks: bookmarks,
      summary: {
        totalSpaces: spaces.length,
        totalFolders: folders.length,
        totalBookmarks: bookmarks.length,
        encryptedSpaces: spaces.filter(s => s.isEncrypted).length
      }
    }

    // 生成JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2)

    // 保存到文件
    const filename = `test_export_${Date.now()}.json`
    const filePath = path.join(__dirname, filename)
    fs.writeFileSync(filePath, jsonString, 'utf-8')

    console.log(`✅ 导出文件已保存: ${filename}`)
    console.log(`📄 文件大小: ${jsonString.length} 字符`)

    // 检查书签中的description和iconUrl
    const bookmarksWithDesc = bookmarks.filter(b => b.description && b.description.trim() !== '')
    const bookmarksWithIcon = bookmarks.filter(b => b.iconUrl && b.iconUrl.trim() !== '')

    console.log(`\n📊 统计:`)
    console.log(`- 总书签数: ${bookmarks.length}`)
    console.log(`- 有description的书签: ${bookmarksWithDesc.length}`)
    console.log(`- 有iconUrl的书签: ${bookmarksWithIcon.length}`)

    // 输出前3条书签
    console.log(`\n📋 前3条书签:`)
    for (let i = 0; i < Math.min(3, bookmarks.length); i++) {
      const b = bookmarks[i]
      console.log(`\n[${i+1}] ${b.title}`)
      console.log(`    description: "${b.description}"`)
      console.log(`    iconUrl: "${b.iconUrl}"`)
    }

    // 读取文件内容检查
    console.log(`\n🔍 检查生成的文件:`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const hasDesc = fileContent.includes('"description":')
    const hasIconUrl = fileContent.includes('"iconUrl":')
    console.log(`文件包含description字段: ${hasDesc}`)
    console.log(`文件包含iconUrl字段: ${hasIconUrl}`)

    await prisma.$disconnect()

  } catch (error) {
    console.error('❌ 导出失败:', error)
  }
}

exportSystemConfig()
