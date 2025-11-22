import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

// 获取文件夹
export async function GET(request: NextRequest) {
  try {
    // 检查认证状态
    const authResult = await getAuthenticatedUserId(request)
    
    if (authResult.response) {
      return authResult.response
    }

    const targetUserId = authResult.userId
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

    // 转换数据格式以匹配前端期望
    const formattedFolders = folders.map(folder => ({
      ...folder,
      bookmarkCount: folder._count.bookmarks
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
    const authResult = await getAuthenticatedUserId(request)
    
    // 如果有response错误，直接返回
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
