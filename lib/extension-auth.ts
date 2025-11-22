import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { randomBytes } from 'crypto'

/**
 * 生成webooks_格式的API Key
 */
export function generateApiKey(): string {
  const randomString = randomBytes(16).toString('hex')
  return `webooks_${randomString}`
}

/**
 * 验证扩展API Key格式
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return /^webooks_[a-f0-9]{32}$/.test(apiKey)
}

/**
 * 通过API Key认证用户
 */
export async function authenticateWithApiKey(request: NextRequest): Promise<{
  userId: string | null
  response?: NextResponse
}> {
  try {
    // 从请求头中获取API Key
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return {
        userId: null,
        response: NextResponse.json(
          { error: '未授权', details: '需要提供API Key' },
          { status: 401 }
        )
      }
    }

    // 验证API Key格式
    if (!isValidApiKeyFormat(apiKey)) {
      return {
        userId: null,
        response: NextResponse.json(
          { error: '无效的API Key格式' },
          { status: 401 }
        )
      }
    }

    // 查找API Key对应的用户
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { apiKey }
    })

    if (!systemConfig) {
      return {
        userId: null,
        response: NextResponse.json(
          { error: 'API Key无效或已过期' },
          { status: 401 }
        )
      }
    }

    return { userId: systemConfig.userId }
  } catch (error) {
    console.error('API Key认证错误:', error)
    return {
      userId: null,
      response: NextResponse.json(
        { error: '认证失败' },
        { status: 500 }
      )
    }
  }
}

/**
 * 为用户生成或更新API Key
 */
export async function generateUserApiKey(userId: string): Promise<string> {
  const apiKey = generateApiKey()
  
  // 更新用户的SystemConfig
  await prisma.systemConfig.upsert({
    where: { userId },
    update: { apiKey },
    create: {
      userId,
      apiKey
    }
  })

  return apiKey
}

/**
 * 验证API Key是否存在且有效
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!isValidApiKeyFormat(apiKey)) {
    return false
  }

  const systemConfig = await prisma.systemConfig.findFirst({
    where: { apiKey }
  })

  return !!systemConfig
}