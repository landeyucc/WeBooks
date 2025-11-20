import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

// 更新空间
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
    
    console.log('PUT space - User ID:', userId)

    const { name, description, iconUrl, systemCardUrl } = await request.json()

    // 查找并验证书签所有权
    const existingSpace = await prisma.space.findUnique({
      where: { id: params.id }
    })

    // 验证书签所有权
    if (!existingSpace || existingSpace.userId !== userId) {
      return NextResponse.json(
        { error: '空间不存在或无权限' },
        { status: 404 }
      )
    }

    const space = await prisma.space.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        iconUrl,
        systemCardUrl
      }
    })

    return NextResponse.json({ space })
  } catch (error) {
    console.error('更新空间错误:', error)
    return NextResponse.json(
      { error: '更新空间失败' },
      { status: 500 }
    )
  }
}

// 删除空间
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
    
    console.log('DELETE space - User ID:', userId)
    console.log('Deleting space ID:', params.id)

    // 首先检查空间是否存在且属于当前用户
    const space = await prisma.space.findUnique({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            bookmarks: true,
            folders: true
          }
        }
      }
    })

    // 验证空间所有权
    if (!space || space.userId !== userId) {
      return NextResponse.json(
        { error: '空间不存在或无权限' },
        { status: 404 }
      )
    }

    console.log('Found space:', space.name, 'Bookmarks:', space._count.bookmarks, 'Folders:', space._count.folders)

    // 使用事务删除空间及其关联数据
    await prisma.$transaction(async (tx) => {
      // 先删除关联的收藏夹
      if (space._count.folders > 0) {
        await tx.bookmark.deleteMany({
          where: {
            folder: {
              spaceId: params.id
            }
          }
        })
        
        await tx.folder.deleteMany({
          where: {
            spaceId: params.id
          }
        })
      }

      // 删除剩余的收藏夹（不在文件夹中的）
      await tx.bookmark.deleteMany({
        where: {
          spaceId: params.id
        }
      })

      // 删除空间
      await tx.space.delete({
        where: {
          id: params.id
        }
      })
    })

    console.log('Space deleted successfully:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除空间错误:', error)
    return NextResponse.json(
      { error: '删除空间失败' },
      { status: 500 }
    )
  }
}
