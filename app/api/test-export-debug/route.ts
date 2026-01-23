import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 支持通过URL参数传递token（用于测试）
    const { searchParams } = new URL(request.url)
    const providedUserId = searchParams.get('userId')
    const tokenUserId = getUserIdFromRequest(request)
    const userId = providedUserId || tokenUserId
    
    console.log('诊断API - 用户ID:', userId)
    
    if (!userId) {
      return NextResponse.json({
        error: '没有有效的token',
        message: '请先登录或提供userId参数',
        hint: '在前端登录后访问，或者使用 ?userId=xxx 参数'
      }, { status: 401 })
    }

    // 查找第一个用户（单用户系统）
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      return NextResponse.json({
        error: '系统中没有用户',
        message: '请先初始化系统'
      }, { status: 401 })
    }

    // 如果提供的userId不存在，使用第一个用户
    let actualUserId = userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })

    if (!user) {
      console.log('Token中的用户不存在，使用第一个用户:', firstUser.id)
      actualUserId = firstUser.id
    }

    // 统计该用户的书签
    const totalBookmarks = await prisma.bookmark.count({ where: { userId: actualUserId } })
    const withDescription = await prisma.bookmark.count({
      where: { userId: actualUserId, description: { not: null } }
    })
    const withIconUrl = await prisma.bookmark.count({
      where: { userId: actualUserId, iconUrl: { not: null } }
    })

    // 返回前3条书签作为样本
    const sampleBookmarks = await prisma.bookmark.findMany({
      where: { userId: actualUserId },
      take: 3,
      select: {
        title: true,
        description: true,
        iconUrl: true,
        space: { select: { name: true } },
        folder: { select: { name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      userId: actualUserId,
      stats: {
        totalBookmarks,
        withDescription,
        withIconUrl
      },
      sampleBookmarks
    })

  } catch (error) {
    console.error('诊断失败:', error)
    return NextResponse.json({
      error: '诊断失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
