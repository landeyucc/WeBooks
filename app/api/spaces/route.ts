import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, getPublicUserId } from '@/lib/auth-helper'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import bcrypt from 'bcryptjs'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取所有空间
export async function GET(request: NextRequest) {
  try {
    // 检查是否有扩展API Key认证
    const authHeader = request.headers.get('x-api-key')
    let targetUserId = null

    if (authHeader && authHeader.startsWith('webooks_')) {
      // 浏览器扩展的API Key认证
      const authResult = await authenticateWithApiKey(request)
      if (authResult.response) {
        return authResult.response
      }
      targetUserId = authResult.userId
    }

    if (!targetUserId) {
      // 无认证或认证失败，使用公共用户ID
      targetUserId = await getPublicUserId(request)
    }

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

    const requestBody = await request.json()
    
    const { name, description, iconUrl, systemCardUrl, isEncrypted, password } = requestBody
    
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

    // 处理加密相关逻辑
    let passwordHash = null
    if (isEncrypted) {
      if (!password || password.trim() === '') {
        return NextResponse.json(
          { error: '加密空间必须设置密码' },
          { status: 400 }
        )
      }
      passwordHash = await bcrypt.hash(password.trim(), 12)
    }

    const space = await prisma.space.create({
      data: {
        name: name.trim(),
        description: description || null,
        iconUrl: iconUrl || null,
        systemCardUrl: systemCardUrl || null,
        isEncrypted: isEncrypted || false,
        passwordHash: passwordHash,
        userId
      }
    })

    // 更新空间版本Key
    await updateVersionKey('spaces')

    return NextResponse.json({ space })
  } catch (error) {
    console.error('创建空间错误:', error)
    return NextResponse.json(
      { error: '创建空间失败', details: String(error) },
      { status: 500 }
    )
  }
}
