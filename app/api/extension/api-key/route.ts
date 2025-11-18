import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-helper'
import { generateUserApiKey, validateApiKey } from '@/lib/extension-auth'
import { prisma } from '@/lib/prisma'

/**
 * 扩展API - API Key管理
 * 支持生成、查看和验证API Key
 */

/**
 * 生成新的API Key
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

    console.log(`Extension API - 用户 ${userId} 请求生成API Key`)

    // 生成新的API Key
    const apiKey = await generateUserApiKey(userId)

    // 获取用户的SystemConfig以验证
    const systemConfig = await prisma.systemConfig.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!systemConfig) {
      return NextResponse.json(
        { error: '系统配置不存在' },
        { status: 500 }
      )
    }

    console.log(`Extension API - 为用户 ${userId} 生成新API Key`)

    return NextResponse.json({
      success: true,
      message: 'API Key生成成功',
      apiKey: apiKey,
      maskedKey: apiKey.substring(0, 10) + '...',
      systemConfig: {
        id: systemConfig.id,
        userId: systemConfig.userId,
        createdAt: systemConfig.createdAt,
        updatedAt: systemConfig.updatedAt
      }
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

    // 获取用户的SystemConfig
    const systemConfig = await prisma.systemConfig.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!systemConfig) {
      return NextResponse.json({
        success: true,
        message: '用户尚未配置API Key',
        hasApiKey: false
      })
    }

    const hasApiKey = !!systemConfig.apiKey

    return NextResponse.json({
      success: true,
      message: hasApiKey ? 'API Key已存在' : '用户尚未配置API Key',
      hasApiKey,
      apiKey: hasApiKey ? systemConfig.apiKey : null,
      maskedKey: hasApiKey ? systemConfig.apiKey!.substring(0, 10) + '...' : null,
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