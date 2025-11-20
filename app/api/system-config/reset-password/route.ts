import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// 重置管理员密码
export async function POST(request: NextRequest) {
  try {
    const { newPassword } = await request.json()

    // 验证新密码
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6个字符' },
        { status: 400 }
      )
    }

    // 查找现有用户
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 使用bcrypt生成新的密码哈希
    const passwordHash = await hashPassword(newPassword)

    // 更新密码
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    console.log('管理员密码重置成功，用户ID:', updatedUser.id)

    return NextResponse.json({
      success: true,
      message: '密码重置成功',
      userId: updatedUser.id,
      username: updatedUser.username
    })
  } catch (error) {
    console.error('重置密码错误:', error)
    return NextResponse.json(
      { error: '重置密码失败' },
      { status: 500 }
    )
  }
}