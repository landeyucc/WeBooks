import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { getAuthenticatedUserId, getPublicUserId } from '@/lib/auth-helper'

// 更新书签
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    console.log('PUT bookmark - User ID:', userId)

    const { title, url, description, iconUrl, folderId } = await request.json()

    // 查找并验证书签所有权
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id: params.id }
    })

    // 验证书签所有权
    if (!existingBookmark || existingBookmark.userId !== userId) {
      return NextResponse.json(
        { error: '书签不存在或无权限' },
        { status: 404 }
      )
    }

    const bookmark = await prisma.bookmark.update({
      where: {
        id: params.id
      },
      data: {
        title,
        url,
        description,
        iconUrl,
        folderId
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

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('更新书签错误:', error)
    return NextResponse.json(
      { error: '更新书签失败' },
      { status: 500 }
    )
  }
}

// 删除书签
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    console.log('DELETE bookmark - User ID:', userId)

    // 查找并验证书签所有权
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: params.id }
    })

    // 验证书签所有权
    if (!bookmark || bookmark.userId !== userId) {
      return NextResponse.json(
        { error: '书签不存在或无权限' },
        { status: 404 }
      )
    }

    await prisma.bookmark.delete({
      where: {
        id: params.id
      }
    })

    // 更新文件夹的书签计数
    if (bookmark?.folderId) {
      await prisma.folder.update({
        where: { id: bookmark.folderId },
        data: {
          bookmarkCount: {
            decrement: 1
          }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除书签错误:', error)
    return NextResponse.json(
      { error: '删除书签失败' },
      { status: 500 }
    )
  }
}
