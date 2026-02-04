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
    const apiKey = request.headers.get('x-api-key')
    console.log('authenticateWithApiKey - 收到请求，API Key存在:', !!apiKey)
    console.log('authenticateWithApiKey - API Key前缀:', apiKey ? apiKey.substring(0, 10) + '...' : '无')
    
    if (!apiKey) {
      return {
        userId: null,
        response: NextResponse.json(
          { success: false, error: '未授权', details: '需要提供API Key (x-api-key header)' },
          { status: 401 }
        )
      }
    }

    if (!isValidApiKeyFormat(apiKey)) {
      console.log('authenticateWithApiKey - API Key格式无效')
      return {
        userId: null,
        response: NextResponse.json(
          { success: false, error: '无效的API Key格式', details: 'API Key必须以 webooks_ 开头，共40个字符' },
          { status: 401 }
        )
      }
    }

    console.log('authenticateWithApiKey - 开始查询数据库...')
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { extensionApiKey: apiKey }
    })
    console.log('authenticateWithApiKey - 数据库查询完成，结果:', systemConfig ? `找到记录 userId=${systemConfig.userId}` : '未找到')

    if (!systemConfig) {
      return {
        userId: null,
        response: NextResponse.json(
          { success: false, error: 'API Key无效或已过期', details: '请检查API Key是否正确或重新生成' },
          { status: 401 }
        )
      }
    }

    console.log('authenticateWithApiKey - 认证成功，返回userId:', systemConfig.userId)
    return { userId: systemConfig.userId }
  } catch (error) {
    console.error('API Key认证错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : '未知')
    return {
      userId: null,
      response: NextResponse.json(
        { success: false, error: '认证失败', details: error instanceof Error ? error.message : '数据库连接失败' },
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
    update: { extensionApiKey: apiKey },
    create: {
      userId,
      extensionApiKey: apiKey
    }
  })

  return apiKey
}

/**
 * 验证API Key是否存在且有效
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!isValidApiKeyFormat(apiKey)) {
      return false
    }

    const systemConfig = await prisma.systemConfig.findFirst({
      where: { extensionApiKey: apiKey }
    })

    return !!systemConfig
  } catch (error) {
    console.error('验证API Key时发生错误:', error)
    return false
  }
}