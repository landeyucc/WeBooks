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
    // 仅查询 userId 字段 - 避免接触可能缺失的列（如 default_theme）
    let systemConfig = null
    try {
      systemConfig = await prisma.systemConfig.findFirst({
        where: { 
          OR: [
            { extensionApiKey: apiKey },
            { apiKey: apiKey }
          ]
        },
        select: { userId: true }
      })
    } catch (prismaError) {
      // Prisma 标准查询可能因数据库缺少列而失败，回退到 raw SQL
      console.warn('[authenticateWithApiKey] 标准查询失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ user_id: string }>>(
          `SELECT user_id FROM system_configs WHERE extension_api_key = $1 OR api_key = $1 LIMIT 1`,
          apiKey
        )
        if (result && result.length > 0) {
          systemConfig = { userId: result[0].user_id }
        }
      } catch (rawError) {
        console.error('[authenticateWithApiKey] raw SQL fallback 也失败:', rawError instanceof Error ? rawError.message : rawError)
      }
    }
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
 * 为用户生成或更新API key
 * 使用两步操作而非 upsert，避免在 create 时触发 @default 字段（如 default_theme）
 * 以兼容数据库 schema 可能滞后的场景（如云端部署未及时迁移）
 */
export async function generateUserApiKey(userId: string): Promise<string> {
  const apiKey = generateApiKey()

  try {
    // 第一步：查询现有记录
    const existing = await prisma.systemConfig.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (existing) {
      // 第二步a：存在记录 → 仅更新 apiKey 相关字段（避免接触 @default 字段）
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { extensionApiKey: apiKey, apiKey: apiKey }
      })
    } else {
      // 第二步b：不存在记录 → 用原始 SQL 插入最小数据
      // 使用 $queryRaw 避免 Prisma 注入 @default 字段值（如 default_theme='light'）
      // 因为数据库可能还没有这些列
      const newId = crypto.randomUUID()
      const now = new Date()
      await prisma.$executeRaw`
        INSERT INTO system_configs (id, user_id, extension_api_key, api_key, created_at, updated_at)
        VALUES (${newId}, ${userId}, ${apiKey}, ${apiKey}, ${now.toISOString()}, ${now.toISOString()})
      `
    }

    return apiKey
  } catch (error) {
    // Prisma 标准操作失败 → 尝试用原始 SQL 作为最终 fallback
    console.warn('[generateUserApiKey] 标准操作失败，尝试原始 SQL fallback:', error instanceof Error ? error.message : error)

    const now = new Date()
    try {
      // 先检查是否有记录（用最安全的方式）
      const existingRaw = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM system_configs WHERE user_id = $1 LIMIT 1`,
        userId
      )

      if (existingRaw && existingRaw.length > 0) {
        // 存在记录 → 更新
        await prisma.$executeRawUnsafe(
          `UPDATE system_configs SET extension_api_key = $1, api_key = $2, updated_at = $3 WHERE user_id = $4`,
          apiKey, apiKey, now.toISOString(), userId
        )
      } else {
        // 不存在记录 → 插入
        const newId = crypto.randomUUID()
        await prisma.$executeRawUnsafe(
          `INSERT INTO system_configs (id, user_id, extension_api_key, api_key, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          newId, userId, apiKey, apiKey, now.toISOString(), now.toISOString()
        )
      }

      return apiKey
    } catch (rawError) {
      console.error('[generateUserApiKey] 原始 SQL fallback 也失败:', rawError instanceof Error ? rawError.message : rawError)
      // 重新抛出原始错误（更有意义的信息）
      throw error
    }
  }
}

/**
 * 验证API key是否存在且有效
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!isValidApiKeyFormat(apiKey)) {
      return false
    }

    // 用最小字段查询，避免接触可能缺失的列
    const systemConfig = await prisma.systemConfig.findFirst({
      where: { 
        OR: [
          { extensionApiKey: apiKey },
          { apiKey: apiKey }
        ]
      },
      select: { id: true }
    })

    return !!systemConfig
  } catch (prismaError) {
    console.warn('[validateApiKey] 标准查询失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM system_configs WHERE extension_api_key = $1 OR api_key = $1 LIMIT 1`,
        apiKey
      )
      return !!(result && result.length > 0)
    } catch (rawError) {
      console.error('[validateApiKey] raw SQL fallback 也失败:', rawError instanceof Error ? rawError.message : rawError)
      return false
    }
  }
}