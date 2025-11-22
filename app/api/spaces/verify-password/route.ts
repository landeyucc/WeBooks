import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { spaceName, password } = await request.json()

    if (!spaceName || !password) {
      return NextResponse.json(
        { error: '空间名称和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找加密空间
    const space = await prisma.space.findFirst({
      where: {
        name: spaceName,
        isEncrypted: true
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: '加密空间不存在' },
        { status: 404 }
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
    } else {
      return NextResponse.json(
        { error: '空间未设置密码' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      spaceId: space.id
    })
  } catch (error) {
    console.error('验证密码错误:', error)
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    )
  }
}