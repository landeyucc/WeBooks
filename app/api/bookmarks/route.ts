import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

// 获取书签
export async function GET(request: NextRequest) {
  try {
    // 检查认证状态
    const authResult = await getAuthenticatedUserId(request)
    
    if (authResult.response) {
      return authResult.response
    }

    const targetUserId = authResult.userId

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId: targetUserId }
    
    if (spaceId) {
      where.spaceId = spaceId
    }
    
    if (folderId) {
      where.folderId = folderId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } }
      ]
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ bookmarks })
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

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('创建书签错误:', error)
    return NextResponse.json(
      { error: '创建书签失败' },
      { status: 500 }
    )
  }
}
