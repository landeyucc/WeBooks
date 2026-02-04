import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 获取系统配置
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
      // 无认证或认证失败，获取第一个用户
      const user = await prisma.user.findFirst()
      if (!user) {
        return NextResponse.json({
          id: null,
          defaultSpaceId: null,
          defaultSpace: null,
          // 网站设置
          siteTitle: null,
          faviconUrl: null,
          seoDescription: null,
          keywords: null,
          createdAt: null,
          updatedAt: null
        })
      }
      targetUserId = user.id
    }

    // 获取当前用户的配置记录
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

    return NextResponse.json({
      id: config?.id || null,
      defaultSpaceId: config?.defaultSpaceId || null,
      defaultSpace: config?.defaultSpace || null,
      // 网站设置
      siteTitle: config?.siteTitle || null,
      faviconUrl: config?.faviconUrl || null,
      seoDescription: config?.seoDescription || null,
      keywords: config?.keywords || null,
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
    const { 
      defaultSpaceId, 
      siteTitle, 
      faviconUrl, 
      seoDescription, 
      keywords 
    } = await request.json()

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

    // 更新现有配置或创建新配置
    const existingConfig = await prisma.systemConfig.findFirst({
      where: { userId: user.id }
    })
    
    let config
    if (existingConfig) {
      // 如果存在现有配置则更新
      config = await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: { 
          defaultSpaceId,
          siteTitle,
          faviconUrl,
          seoDescription,
          keywords
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
    } else {
      // 如果没有现有配置则创建新配置
      config = await prisma.systemConfig.create({
        data: { 
          userId: user.id,
          defaultSpaceId,
          siteTitle,
          faviconUrl,
          seoDescription,
          keywords
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