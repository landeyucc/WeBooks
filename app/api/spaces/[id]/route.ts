import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'
import bcrypt from 'bcryptjs'

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

    const { name, description, iconUrl, systemCardUrl, isEncrypted, password } = await request.json()

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

    // 处理加密相关逻辑
    const updateData: {
      name: string
      description: string
      iconUrl: string
      systemCardUrl: string
      isEncrypted?: boolean
      passwordHash?: string | null
    } = {
      name,
      description,
      iconUrl,
      systemCardUrl
    }

    if (isEncrypted !== undefined) {
      updateData.isEncrypted = isEncrypted
      
      if (isEncrypted) {
        // 如果设置加密且提供了新密码
        if (password && password.trim() !== '') {
          updateData.passwordHash = await bcrypt.hash(password.trim(), 12)
        } else if (!existingSpace.passwordHash) {
          // 如果原本没有密码且没有提供新密码，返回错误
          return NextResponse.json(
            { error: '加密空间必须设置密码' },
            { status: 400 }
          )
        }
        // 如果有现有密码且没有提供新密码，保持原密码
      } else {
        // 如果取消加密，清除密码
        updateData.passwordHash = null
      }
    } else if (password && password.trim() !== '') {
      // 如果只更新了密码
      updateData.passwordHash = await bcrypt.hash(password.trim(), 12)
    }

    const space = await prisma.space.update({
      where: {
        id: params.id
      },
      data: updateData
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除空间错误:', error)
    return NextResponse.json(
      { error: '删除空间失败' },
      { status: 500 }
    )
  }
}
