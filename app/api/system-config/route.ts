import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取系统配置
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-api-key')
    let targetUserId = null

    if (authHeader && authHeader.startsWith('webooks_')) {
      const authResult = await authenticateWithApiKey(request)
      if (authResult.response) {
        return authResult.response
      }
      targetUserId = authResult.userId
    }

    if (!targetUserId) {
      const user = await prisma.user.findFirst()
      if (!user) {
        console.log('[system-config] 未找到用户，返回空配置')
        return NextResponse.json({
          id: null,
          defaultSpaceId: null,
          defaultSpace: null,
          siteTitle: null,
          faviconUrl: null,
          seoDescription: null,
          keywords: null,
          createdAt: null,
          updatedAt: null
        })
      }
      targetUserId = user.id
      console.log('[system-config] 使用第一个用户:', user.id)
    }

    const config = await prisma.systemConfig.findFirst({
      where: { userId: targetUserId },
      include: {
        defaultSpace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('[system-config] 获取到配置:', {
      id: config?.id,
      siteTitle: config?.siteTitle,
      seoDescription: config?.seoDescription,
      keywords: config?.keywords,
      defaultTheme: config?.defaultTheme,
      defaultThemeType: config?.defaultThemeType
    })

    return NextResponse.json({
      id: config?.id || null,
      defaultSpaceId: config?.defaultSpaceId || null,
      defaultSpace: config?.defaultSpace || null,
      siteTitle: config?.siteTitle || null,
      faviconUrl: config?.faviconUrl || null,
      seoDescription: config?.seoDescription || null,
      keywords: config?.keywords || null,
      defaultTheme: config?.defaultTheme || null,
      defaultThemeType: config?.defaultThemeType || null,
      createdAt: config?.createdAt || null,
      updatedAt: config?.updatedAt || null
    })
  } catch (error) {
    console.error('获取系统配置错误:', error)
    return NextResponse.json(
      { error: '获取系统配置失败' },
      { status: 500 }
    )
  }
}

// 更新系统配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      defaultSpaceId,
      siteTitle,
      faviconUrl,
      seoDescription,
      keywords,
      defaultTheme,
      defaultThemeType
    } = body

    // 先确保存在一个用户
    let user = await prisma.user.findFirst()
    if (!user) {
      // 如果没有用户，创建一个默认用户
      user = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: 'default_hash'
        }
      })
    }

    // 检查defaultSpaceId是否存在且属于当前用户
    if (defaultSpaceId) {
      const space = await prisma.space.findUnique({
        where: {
          id: defaultSpaceId,
          userId: user.id
        }
      })

      if (!space) {
        return NextResponse.json(
          { error: '指定的空间不存在或不属于当前用户' },
          { status: 400 }
        )
      }
    }

    // 仅构建已提供（非 undefined）的字段，避免 PUT 部分更新时把其他字段置 null
    const updateData: Record<string, unknown> = {}
    if (defaultSpaceId !== undefined) updateData.defaultSpaceId = defaultSpaceId
    if (siteTitle !== undefined) updateData.siteTitle = siteTitle
    if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (keywords !== undefined) updateData.keywords = keywords
    if (defaultTheme !== undefined) updateData.defaultTheme = defaultTheme
    if (defaultThemeType !== undefined) updateData.defaultThemeType = defaultThemeType

    // 更新现有配置或创建新配置
    const existingConfig = await prisma.systemConfig.findFirst({
      where: { userId: user.id }
    })

    let config
    if (existingConfig) {
      // 如果存在现有配置则更新（仅更新提供的字段）
      config = await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: updateData,
        include: {
          defaultSpace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    } else {
      // 如果没有现有配置则创建新配置
      config = await prisma.systemConfig.create({
        data: {
          userId: user.id,
          ...updateData
        },
        include: {
          defaultSpace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }

    // 更新系统版本Key
    await updateVersionKey('system')

    return NextResponse.json({
      id: config.id,
      defaultSpaceId: config.defaultSpaceId,
      defaultSpace: config.defaultSpace,
      // 网站设置
      siteTitle: config.siteTitle,
      faviconUrl: config.faviconUrl,
      seoDescription: config.seoDescription,
      keywords: config.keywords,
      // 全局主题设置
      defaultTheme: config.defaultTheme,
      defaultThemeType: config.defaultThemeType,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })
  } catch (error: unknown) {
    console.error('更新系统配置错误:', error)
    
    // 如果是外键约束错误，返回更详细的错误信息
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: '外键约束违反，请检查空间ID是否正确' },
        { status: 400 }
      )
    }
    
    // 获取错误消息
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
      ? String(error.message) 
      : '未知错误'
    
    return NextResponse.json(
      { error: '更新系统配置失败', details: errorMessage },
      { status: 500 }
    )
  }
}