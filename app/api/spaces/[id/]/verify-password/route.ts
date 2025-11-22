import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUserId } from '@/lib/auth-helper'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const spaceId = params.id

    if (!spaceId) {
      return NextResponse.json(
        { error: '空间ID不能为空' },
        { status: 400 }
      )
    }

    const { password } = await request.json()

    if (!password || password.trim() === '') {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      )
    }

    // 获取当前用户ID（支持未登录状态）
    const userId = await getPublicUserId(request)

    // 查找指定的空间
    const space = await prisma.space.findFirst({
      where: {
        id: spaceId,
        userId: userId
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: '空间不存在或无访问权限' },
        { status: 404 }
      )
    }

    // 检查是否是加密空间
    if (!space.isEncrypted) {
      return NextResponse.json(
        { valid: true, message: '非加密空间，无需密码' }
      )
    }

    // 检查是否有密码哈希
    if (!space.passwordHash) {
      return NextResponse.json(
        { error: '加密空间未设置密码' },
        { status: 500 }
      )
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password.trim(), space.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      valid: true,
      message: '密码验证成功'
    })

  } catch (error) {
    console.error('密码验证错误:', error)
    return NextResponse.json(
      { error: '密码验证失败', details: String(error) },
      { status: 500 }
    )
  }
}