import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUserId, getAuthenticatedUserId } from '@/lib/auth-helper'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100

async function getAllChildFolderIds(parentFolderId: string, userId: string): Promise<string[]> {
  const childFolderIds: string[] = []
  const visited = new Set<string>()
  
  const findChildren = async (currentFolderId: string) => {
    if (visited.has(currentFolderId)) return
    visited.add(currentFolderId)
    
    const children = await prisma.folder.findMany({
      where: { parentFolderId: currentFolderId, userId },
      select: { id: true }
    })
    
    for (const child of children) {
      childFolderIds.push(child.id)
      await findChildren(child.id)
    }
  }
  
  await findChildren(parentFolderId)
  return childFolderIds
}

export async function GET(request: NextRequest) {
  try {
    const targetUserId = await getPublicUserId(request)
    console.log('GET bookmarks - User ID:', targetUserId)

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const folderId = searchParams.get('folderId')
    const folderPathParam = searchParams.get('folderPath')
    const folderIdsParam = searchParams.get('folderIds')
    const noFolder = searchParams.get('noFolder') === 'true'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const allParam = searchParams.get('all')
    const limit = allParam === 'true' 
      ? 99999 
      : Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10), MAX_PAGE_SIZE)
    const sortBy = searchParams.get('sortBy') || 'title'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let folderIds: string[] | null = null
    
    if (folderIdsParam) {
      folderIds = folderIdsParam.split(',').filter(Boolean)
    } else if (folderId) {
      folderIds = [folderId]
      const childIds = await getAllChildFolderIds(folderId, targetUserId)
      folderIds = [...folderIds, ...childIds]
    } else if (folderPathParam) {
      const pathParts = folderPathParam.split('/')
      let parentFolderId: string | null = null
      
      for (const part of pathParts) {
        const folder: { id: string } | null = await prisma.folder.findFirst({
          where: {
            userId: targetUserId,
            spaceId: spaceId || undefined,
            name: part,
            parentFolderId: parentFolderId
          },
          select: { id: true }
        })
        if (!folder) {
          return NextResponse.json({ bookmarks: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasMore: false } })
        }
        parentFolderId = folder.id
      }
      
      if (parentFolderId) {
        folderIds = [parentFolderId]
        const childIds = await getAllChildFolderIds(parentFolderId, targetUserId)
        folderIds = [...folderIds, ...childIds]
      }
    }

    const where: Record<string, unknown> = { userId: targetUserId }
    
    if (spaceId) {
      where.spaceId = spaceId
    }
    
    if (folderIds && folderIds.length > 0) {
      where.folderId = { in: folderIds }
    } else if (noFolder) {
      where.folderId = null
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } }
      ]
    }

    const orderBy: Record<string, string> = {}
    if (sortBy === 'title') {
      orderBy['title'] = sortOrder
    } else {
      orderBy['createdAt'] = sortOrder
    }

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          folder: {
            select: {
              id: true,
              name: true
            }
          },
          space: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.bookmark.count({ where })
    ])

    return NextResponse.json({
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error('获取书签错误:', error)
    return NextResponse.json(
      { error: '获取书签失败' },
      { status: 500 }
    )
  }
}

// 创建书签
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
    
    console.log('POST bookmarks - User ID:', userId)

    const { title, url, description, iconUrl, spaceId, folderId } = await request.json()

    // 用户现在需要使用独立的抓取API手动获取元数据
    const bookmark = await prisma.bookmark.create({
      data: {
        title,
        url,
        description,
        iconUrl,
        spaceId,
        folderId,
        userId
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 更新文件夹的书签计数
    if (folderId) {
      await prisma.folder.update({
        where: { id: folderId },
        data: {
          bookmarkCount: {
            increment: 1
          }
        }
      })
    }

    // 更新书签版本Key
    await updateVersionKey('bookmarks')

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('创建书签错误:', error)
    return NextResponse.json(
      { error: '创建书签失败' },
      { status: 500 }
    )
  }
}
