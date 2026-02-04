import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUserId, getAuthenticatedUserId } from '@/lib/auth-helper'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-api-key')
    let targetUserId = null

    if (authHeader && authHeader.startsWith('webooks_')) {
      const authResult = await authenticateWithApiKey(request)
      if (authResult.response) {
        return authResult.response
      }
      targetUserId = authResult.userId
    } else {
      targetUserId = await getPublicUserId(request)
    }
    console.log('GET folders - User ID:', targetUserId)

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    const where: Record<string, unknown> = { userId: targetUserId }
    if (spaceId) {
      where.spaceId = spaceId
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        parentFolderId: true,
        spaceId: true,
        createdAt: true,
        _count: {
          select: {
            bookmarks: true,
            childFolders: true
          }
        }
      }
    })

    const foldersMap = new Map<string, { id: string; name: string; parentFolderId: string | null; path: string[] }>()
    const childrenMap = new Map<string, string[]>()
    
    folders.forEach(folder => {
      foldersMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
        path: []
      })
      
      if (folder.parentFolderId) {
        if (!childrenMap.has(folder.parentFolderId)) {
          childrenMap.set(folder.parentFolderId, [])
        }
        childrenMap.get(folder.parentFolderId)!.push(folder.id)
      }
    })

    const getAllChildFolderIds = (parentId: string): string[] => {
      const children: string[] = childrenMap.get(parentId) || []
      const childIds = [...children]
      
      for (const childId of children) {
        childIds.push(...getAllChildFolderIds(childId))
      }
      
      return childIds
    }

    const buildPath = (folderId: string): string[] => {
      const folder = foldersMap.get(folderId)
      if (!folder) return []
      
      if (folder.path.length > 0) {
        return folder.path
      }
      
      if (!folder.parentFolderId) {
        folder.path = [folder.name]
        return folder.path
      }
      
      const parentPath = buildPath(folder.parentFolderId)
      folder.path = [...parentPath, folder.name]
      return folder.path
    }

    folders.forEach(folder => {
      buildPath(folder.id)
    })

    const getTotalBookmarksCount = (folderId: string): number => {
      const folder = folders.find(f => f.id === folderId)
      let total = folder?._count.bookmarks || 0
      
      const childIds = getAllChildFolderIds(folderId)
      for (const childId of childIds) {
        const childFolder = folders.find(f => f.id === childId)
        total += childFolder?._count.bookmarks || 0
      }
      
      return total
    }

    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parentFolderId: folder.parentFolderId,
      spaceId: folder.spaceId,
      bookmarkCount: folder._count.bookmarks,
      totalBookmarks: getTotalBookmarksCount(folder.id),
      path: foldersMap.get(folder.id)?.path || [],
      pathString: (foldersMap.get(folder.id)?.path || []).join('/')
    }))

    return NextResponse.json({ folders: formattedFolders })
  } catch (error) {
    console.error('获取文件夹错误:', error)
    return NextResponse.json(
      { error: '获取文件夹失败' },
      { status: 500 }
    )
  }
}

// 创建文件夹
export async function POST(request: NextRequest) {
  try {
    // 尝试从扩展API Key获取认证
    const authHeader = request.headers.get('x-api-key')
    let userId = null

    if (authHeader && authHeader.startsWith('webooks_')) {
      // 浏览器扩展的API Key认证
      const authResult = await authenticateWithApiKey(request)
      if (authResult.response) {
        return authResult.response
      }
      userId = authResult.userId
    } else {
      // 标准 Bearer token 认证
      const authResult = await getAuthenticatedUserId(request)
      if (authResult.response) {
        return authResult.response
      }
      userId = authResult.userId
    }

    if (!userId) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      )
    }

    console.log('POST folders - User ID:', userId)

    const { name, description, iconUrl, spaceId, parentFolderId } = await request.json()

    const folder = await prisma.folder.create({
      data: {
        name,
        description,
        iconUrl,
        spaceId,
        parentFolderId,
        userId
      }
    })

    // 更新文件夹版本Key
    await updateVersionKey('folders')

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('创建文件夹错误:', error)
    return NextResponse.json(
      { error: '创建文件夹失败' },
      { status: 500 }
    )
  }
}