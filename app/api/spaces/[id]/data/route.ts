import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, getPublicUserId } from '@/lib/auth-helper'
import type { Folder, Bookmark } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface FolderNode extends Folder {
  children: FolderNode[]
  bookmarks: Bookmark[]
}

// 获取指定空间的所有数据（空间详情、文件夹、书签）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spaceId = params.id
    
    // 获取用户ID
    let targetUserId: string | null = null
    try {
      const authResult = await getAuthenticatedUserId(request)
      if (!authResult.response) {
        targetUserId = authResult.userId
      }
    } catch {
      // 如果认证失败，尝试获取公共用户ID
    }
    
    if (!targetUserId) {
      targetUserId = await getPublicUserId(request)
    }

    console.log('GET space data - Space ID:', spaceId, '- User ID:', targetUserId)

    // 一次性获取空间的所有相关数据
    const [space, folders, bookmarks] = await Promise.all([
      // 获取空间详情
      prisma.space.findUnique({
        where: { 
          id: spaceId,
          userId: targetUserId 
        }
      }),
      
      // 获取该空间下的所有文件夹
      prisma.folder.findMany({
        where: { 
          spaceId: spaceId,
          userId: targetUserId 
        },
        orderBy: { createdAt: 'asc' }
      }),
      
      // 获取该空间下的所有书签
      prisma.bookmark.findMany({
        where: { 
          spaceId: spaceId,
          userId: targetUserId 
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    if (!space) {
      return NextResponse.json(
        { error: '空间不存在' },
        { status: 404 }
      )
    }

    // 构建完整的空间数据结构
    const spaceData = {
      space,
      folders,
      bookmarks,
      // 构建文件夹树形结构（可选，客户端可以使用）
      folderTree: buildFolderTree(folders)
    }

    return NextResponse.json(spaceData)
  } catch (error) {
    console.error('获取空间数据错误:', error)
    return NextResponse.json(
      { error: '获取空间数据失败', details: String(error) },
      { status: 500 }
    )
  }
}

// 构建文件夹树形结构的辅助函数
function buildFolderTree(folders: Folder[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>()
  const rootFolders: FolderNode[] = []

  // 首先创建所有文件夹的映射
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      bookmarks: []
    })
  })

  // 然后构建父子关系
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder.id)
    if (!folderNode) return
    
    if (folder.parentFolderId) {
      const parentFolder = folderMap.get(folder.parentFolderId)
      if (parentFolder) {
        parentFolder.children.push(folderNode)
      } else {
        rootFolders.push(folderNode)
      }
    } else {
      rootFolders.push(folderNode)
    }
  })

  return rootFolders
}
