import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

// 导出整个系统参数（空间、文件夹、书签、系统设置，不包括用户密码）
export async function GET(request: NextRequest) {
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

    console.log('GET 系统参数导出 - User ID:', userId)

    // 获取系统配置（排除用户密码）
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { userId },
      include: {
        defaultSpace: {
          select: {
            id: true,
            name: true,
            description: true,
            iconUrl: true,
            systemCardUrl: true
          }
        }
      }
    })

    // 获取用户信息（排除密码）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    })

    // 获取所有空间
    const spaces = await prisma.space.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        systemCardUrl: true,
        isEncrypted: true,
        passwordHash: false, // 不导出密码哈希
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 获取所有文件夹
    const folders = await prisma.folder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        spaceId: true,
        parentFolderId: true,
        userId: true,
        createdAt: true,
        bookmarkCount: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 获取所有书签
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        iconUrl: true,
        spaceId: true,
        folderId: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 构建导出的数据结构
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      user: {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        createdAt: user?.createdAt
      },
      systemConfig: {
        id: systemConfig?.id,
        defaultSpaceId: systemConfig?.defaultSpaceId,
        defaultSpace: systemConfig?.defaultSpace,
        siteTitle: systemConfig?.siteTitle,
        faviconUrl: systemConfig?.faviconUrl,
        seoDescription: systemConfig?.seoDescription,
        keywords: systemConfig?.keywords,
        apiKey: systemConfig?.apiKey,
        createdAt: systemConfig?.createdAt,
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

    console.log(`导出完成 - 空间: ${spaces.length}, 文件夹: ${folders.length}, 书签: ${bookmarks.length}`)

    // 返回JSON文件下载
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Webooks_system_export_${timestamp}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('系统参数导出错误:', error)
    return NextResponse.json(
      { error: '系统参数导出失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}