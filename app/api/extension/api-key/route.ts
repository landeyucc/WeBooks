import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-helper'
import { generateUserApiKey, validateApiKey } from '@/lib/extension-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 浏览器扩展插件API - API Key管理
 * 支持生成、查看和验证API Key
 */

export async function POST(request: NextRequest) {
  try {
    // 使用现有的用户认证机制
    const authResult = await getAuthenticatedUserId(request)
    
    if (authResult.response) {
      return authResult.response
    }

    const userId = authResult.userId
    if (!userId) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      )
    }

    // 生成新的API Key
    const apiKey = await generateUserApiKey(userId)

    // 获取用户的SystemConfig以验证（generateUserApiKey已确保存在）
    // 尝试 Prisma 标准查询，失败则回退到 raw SQL
    let systemConfig: Record<string, unknown> | null = null
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { userId },
        select: { id: true, userId: true, extensionApiKey: true, apiKey: true, createdAt: true, updatedAt: true }
      })
      if (config) systemConfig = config as unknown as Record<string, unknown>
    } catch (prismaError) {
      console.warn('[extension/api-key POST] Prisma 查询失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
      try {
        const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
          `SELECT id, user_id, created_at, updated_at FROM system_configs WHERE user_id = $1 LIMIT 1`,
          userId
        )
        if (rows && rows.length > 0) {
          const r = rows[0]
          systemConfig = {
            id: r.id,
            userId: r.user_id,
            extensionApiKey: apiKey,
            apiKey: apiKey,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }
        }
      } catch {
        // 仍然失败，返回最小信息
      }
    }

    return NextResponse.json({
      success: true,
      message: 'API Key生成成功',
      apiKey: apiKey,
      maskedKey: apiKey.substring(0, 10) + '...',
      systemConfig: systemConfig ? {
        id: systemConfig.id,
        userId: systemConfig.userId,
        createdAt: systemConfig.createdAt,
        updatedAt: systemConfig.updatedAt
      } : null
    })

  } catch (error) {
    console.error('Extension API - 生成API Key错误:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '生成API Key失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 查看当前的API Key
 */
export async function GET(request: NextRequest) {
  try {
    // 使用现有的用户认证机制
    const authResult = await getAuthenticatedUserId(request)
    
    if (authResult.response) {
      return authResult.response
    }

    const userId = authResult.userId
    if (!userId) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      )
    }

    // 获取用户的SystemConfig（尝试 Prisma 标准查询，失败则回退到 raw SQL）
    let systemConfig: Record<string, unknown> | null = null
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          extensionApiKey: true,
          apiKey: true,
          createdAt: true,
          updatedAt: true
        }
      })
      if (config) systemConfig = config as unknown as Record<string, unknown>
    } catch (prismaError) {
      console.warn('[extension/api-key GET] Prisma 查询失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
      try {
        const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
          `SELECT id, user_id, extension_api_key, api_key, created_at, updated_at FROM system_configs WHERE user_id = $1 LIMIT 1`,
          userId
        )
        if (rows && rows.length > 0) {
          const r = rows[0]
          systemConfig = {
            id: r.id,
            userId: r.user_id,
            extensionApiKey: r.extension_api_key,
            apiKey: r.api_key,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }
        }
      } catch (rawError) {
        console.warn('[extension/api-key GET] raw SQL 查询也失败，但尝试更保守的查询:', rawError instanceof Error ? rawError.message : rawError)
        // 尝试只查询 id 和 extension_api_key
        try {
          const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
            `SELECT id, user_id FROM system_configs WHERE user_id = $1 LIMIT 1`,
            userId
          )
          if (rows && rows.length > 0) {
            const r = rows[0]
            systemConfig = {
              id: r.id,
              userId: r.user_id,
              extensionApiKey: null,
              apiKey: null,
              createdAt: null,
              updatedAt: null
            }
          }
        } catch {
          // 彻底失败，当作没有配置处理
        }
      }
    }

    if (!systemConfig) {
      return NextResponse.json({
        success: true,
        message: '用户尚未配置API Key',
        hasApiKey: false
      })
    }

    // 同时检查 extensionApiKey 和 apiKey（向后兼容）
    const hasApiKey = !!(systemConfig?.extensionApiKey || systemConfig?.apiKey)
    const activeApiKey = (systemConfig?.extensionApiKey as string) || (systemConfig?.apiKey as string)

    return NextResponse.json({
      success: true,
      message: hasApiKey ? 'API Key已存在' : '用户尚未配置API Key',
      hasApiKey,
      apiKey: activeApiKey || null,
      maskedKey: activeApiKey ? activeApiKey.substring(0, 10) + '...' : null,
      systemConfig: {
        id: systemConfig.id,
        userId: systemConfig.userId,
        createdAt: systemConfig.createdAt,
        updatedAt: systemConfig.updatedAt
      }
    })

  } catch (error) {
    console.error('Extension API - 查看API Key错误:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '查看API Key失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 验证指定的API Key
 */
export async function PUT(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少API Key参数' },
        { status: 400 }
      )
    }

    const isValid = await validateApiKey(apiKey)

    return NextResponse.json({
      success: true,
      message: isValid ? 'API Key有效' : 'API Key无效',
      isValid
    })

  } catch (error) {
    console.error('Extension API - 验证API Key错误:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '验证API Key失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}