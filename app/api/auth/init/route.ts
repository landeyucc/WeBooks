import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email } = await request.json()

    // 检查是否已经有用户
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json(
        { error: '系统已初始化' },
        { status: 400 }
      )
    }

    // 创建管理员用户
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email
      }
    })

    // 创建默认空间
    await prisma.space.create({
      data: {
        name: '默认空间',
        description: '这是您的第一个书签空间',
        userId: user.id
      }
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('初始化错误:', error)
    return NextResponse.json(
      { error: '初始化失败' },
      { status: 500 }
    )
  }
}

// 检查是否需要初始化
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ needsInit: userCount === 0 })
  } catch (error) {
    console.error('检查初始化状态错误:', error)
    return NextResponse.json(
      { error: '检查失败' },
      { status: 500 }
    )
  }
}
