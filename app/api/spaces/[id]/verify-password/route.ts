import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      )
    }

    const spaceId = params.id

    // 获取当前用户ID
    const { userId, response: authResponse } = await getAuthenticatedUserId(request)
    
    // 检查是否需要认证
    if (!userId) {
      return authResponse || NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查是否为管理员（第一个用户是管理员）
    const user = await prisma.user.findFirst({
      where: { id: userId }
    })
    
    const firstUser = await prisma.user.findFirst()
    const isAdmin = user && firstUser && user.id === firstUser.id

    // 查找空间
    const space = await prisma.space.findUnique({
      where: { 
        id: spaceId,
        userId: userId // 确保空间属于当前用户
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: '空间不存在或无访问权限' },
        { status: 404 }
      )
    }

    // 如果是管理员，直接验证成功
    if (isAdmin) {
      console.log('管理员免验证访问空间:', space.name)
      return NextResponse.json({
        valid: true,
        message: '管理员身份验证成功'
      })
    }

    // 检查空间是否加密
    if (!space.isEncrypted) {
      return NextResponse.json(
        { error: '该空间未设置密码' },
        { status: 400 }
      )
    }

    // 验证密码
    if (space.passwordHash) {
      const isValid = await bcrypt.compare(password, space.passwordHash)
      
      if (!isValid) {
        return NextResponse.json(
          { error: '密码错误' },
          { status: 401 }
        )
      }

      console.log('用户密码验证成功:', userId, '空间:', space.name)
      
      return NextResponse.json({
        valid: true,
        message: '密码验证成功'
      })
    } else {
      return NextResponse.json(
        { error: '空间未设置密码' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('验证密码错误:', error)
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    )
  }
}