import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUserId, getAuthenticatedUserId } from '@/lib/auth-helper'
import { authenticateWithApiKey } from '@/lib/extension-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取文件夹
export async function GET(request: NextRequest) {
  try {
    // 尝试从扩展API Key获取认证
    const authHeader = request.headers.get('x-api-key')
    let targetUserId = null

    if (authHeader && authHeader.startsWith('webooks_')) {
      // 浏览器扩展的API Key认证
      const authResult = await authenticateWithApiKey(request)
      if (authResult.response) {
        return authResult.response
      }
      targetUserId = authResult.userId
    } else {
      // 标准 Bearer token 认证或公共访问
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
      include: {
        _count: {
          select: {
            bookmarks: true,
            childFolders: true
          }
        }
      }
    })

    // 构建文件夹映射和父子关系
    const foldersMap = new Map()
    const childrenMap = new Map() // parentId -> children folders
    
    folders.forEach(folder => {
      foldersMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
        path: [] // 存储完整路径
      })
      
      // 建立父子关系
      if (folder.parentFolderId) {
        if (!childrenMap.has(folder.parentFolderId)) {
          childrenMap.set(folder.parentFolderId, [])
        }
        childrenMap.get(folder.parentFolderId)!.push(folder)
      }
    })

    // 递归获取所有子文件夹ID
    const getAllChildFolderIds = (parentId: string): string[] => {
      const children: { id: string }[] = childrenMap.get(parentId) || []
      const childIds = children.map(child => child.id)
      
      for (const child of children) {
        childIds.push(...getAllChildFolderIds(child.id))
      }
      
      return childIds
    }

    // 递归构建路径
    const buildPath = (folderId: string): string[] => {
      const folder = foldersMap.get(folderId)
      if (!folder || folder.path.length > 0) {
        return folder ? folder.path : []
      }
      
      if (!folder.parentFolderId) {
        folder.path = [folder.name]
        return folder.path
      }
      
      const parentPath = buildPath(folder.parentFolderId)
      folder.path = [...parentPath, folder.name]
      return folder.path
    }

    // 为所有文件夹构建路径
    folders.forEach(folder => {
      if (!foldersMap.get(folder.id).path.length) {
        buildPath(folder.id)
      }
    })

    // 计算每个文件夹及其所有子文件夹的书签总数
    const calculateTotalBookmarks = async (folderId: string): Promise<number> => {
      // 获取直接书签数
      const folder = folders.find(f => f.id === folderId)
      let total = folder?._count.bookmarks || 0
      
      // 获取所有子文件夹的ID并计算其书签数
      const childIds = getAllChildFolderIds(folderId)
      for (const childId of childIds) {
        const childFolder = folders.find(f => f.id === childId)
        total += childFolder?._count.bookmarks || 0
      }
      
      return total
    }

    // 转换数据格式以匹配前端期望，并计算合并的书签数量
    const formattedFolders = []
    for (const folder of folders) {
      const totalBookmarks = await calculateTotalBookmarks(folder.id)
      formattedFolders.push({
        ...folder,
        bookmarkCount: folder._count.bookmarks,
        totalBookmarks: totalBookmarks, // 新增：包含子文件夹的总书签数
        path: foldersMap.get(folder.id).path,
        pathString: foldersMap.get(folder.id).path.join('/')
      })
    }

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

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('创建文件夹错误:', error)
    return NextResponse.json(
      { error: '创建文件夹失败' },
      { status: 500 }
    )
  }
}