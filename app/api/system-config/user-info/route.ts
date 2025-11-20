import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取用户信息（用户名和用户ID）
export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}