import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthenticatedUserId } from '@/lib/auth-helper'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const spaceId = params.id
    
    // 尝试获取当前登录用户ID
    const authResult = await getAuthenticatedUserId(request)
    const isAuthenticated = authResult.userId !== null
    
    // 查找空间
    const space = await prisma.space.findUnique({
      where: { 
        id: spaceId
      }
    })
    
    // 检查空间是否存在
    if (!space) {
      return NextResponse.json(
        { error: '空间不存在或无访问权限' },
        { status: 404 }
      )
    }
    
    // 如果用户已登录且空间属于当前用户，直接返回验证成功
    if (isAuthenticated && authResult.userId && space.userId === authResult.userId) {
      console.log('登录用户访问自己的空间，跳过密码验证:', space.name)
      return NextResponse.json({
        valid: true,
        message: '用户已登录，直接访问',
        skipPassword: true
      })
    }
    
    // 未登录用户或访问其他用户的空间，需要密码验证
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      )
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

      console.log('未登录用户密码验证成功，空间:', space.name)
      
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