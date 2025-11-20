import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, getPublicUserId } from '@/lib/auth-helper'

// 获取所有空间
export async function GET(request: NextRequest) {
  try {
    const targetUserId = await getPublicUserId(request)
    console.log('GET spaces - User ID:', targetUserId)

    const spaces = await prisma.space.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            bookmarks: true,
            folders: true
          }
        }
      }
    })

    return NextResponse.json({ spaces })
  } catch (error) {
    console.error('获取空间错误:', error)
    return NextResponse.json(
      { error: '获取空间失败', details: String(error) },
      { status: 500 }
    )
  }
}

// 创建空间（需要认证）
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserId(request)
    if (authResult.response) {
      return authResult.response
    }
    
    const userId = authResult.userId!
    console.log('POST spaces - User ID:', userId)

    const requestBody = await request.json()
    console.log('POST spaces - Request body:', requestBody)
    
    const { name, description, iconUrl, systemCardUrl } = requestBody
    
    // 验证必填字段
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '空间名称不能为空' },
        { status: 400 }
      )
    }

    // 检查用户是否已经有同名的空间
    const existingSpace = await prisma.space.findFirst({
      where: {
        userId: userId,
        name: name.trim()
      }
    })
    
    if (existingSpace) {
      return NextResponse.json(
        { error: '已存在同名空间' },
        { status: 400 }
      )
    }

    const space = await prisma.space.create({
      data: {
        name: name.trim(),
        description: description || null,
        iconUrl: iconUrl || null,
        systemCardUrl: systemCardUrl || null,
        userId
      }
    })

    console.log('POST spaces - Created space:', space.id)
    return NextResponse.json({ space })
  } catch (error) {
    console.error('创建空间错误:', error)
    return NextResponse.json(
      { error: '创建空间失败', details: String(error) },
      { status: 500 }
    )
  }
}
