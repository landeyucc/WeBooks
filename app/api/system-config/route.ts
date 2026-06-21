import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 用 raw SQL 查询 system_config - 兼容数据库可能缺少某些列的情况
 * 返回一个安全的、只包含存在列的配置对象
 */
async function safeGetSystemConfig(userId: string): Promise<Record<string, unknown> | null> {
  try {
    // 先尝试用 raw SQL 查询所有可能存在的列
    // 通过查询一条记录的方式检测哪些列存在
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM system_configs WHERE user_id = $1 LIMIT 1`,
      userId
    )

    if (!rows || rows.length === 0) {
      return null
    }

    // 从 raw SQL 结果提取字段（PostgreSQL 返回小写列名，SQLite 返回原始名）
    const row = rows[0]
    const getCol = (names: string[]): unknown => {
      for (const n of names) {
        if (row[n] !== undefined && row[n] !== null) return row[n]
      }
      return null
    }

    return {
      id: getCol(['id', 'Id', 'ID']),
      userId: getCol(['user_id', 'userId', 'UserId']),
      defaultSpaceId: getCol(['default_space_id', 'defaultSpaceId', 'DefaultSpaceId']),
      siteTitle: getCol(['site_title', 'siteTitle', 'SiteTitle']),
      faviconUrl: getCol(['favicon_url', 'faviconUrl', 'FaviconUrl']),
      seoDescription: getCol(['seo_description', 'seoDescription', 'SeoDescription']),
      keywords: getCol(['keywords', 'Keywords']),
      defaultTheme: getCol(['default_theme', 'defaultTheme', 'DefaultTheme']),
      defaultThemeType: getCol(['default_theme_type', 'defaultThemeType', 'DefaultThemeType']),
      extensionApiKey: getCol(['extension_api_key', 'extensionApiKey', 'ExtensionApiKey']),
      apiKey: getCol(['api_key', 'apiKey', 'ApiKey']),
      createdAt: getCol(['created_at', 'createdAt', 'CreatedAt']),
      updatedAt: getCol(['updated_at', 'updatedAt', 'UpdatedAt'])
    }
  } catch (error) {
    console.warn('[safeGetSystemConfig] raw SQL 查询失败:', error instanceof Error ? error.message : error)
    return null
  }
}

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
          defaultTheme: null,
          defaultThemeType: null,
          createdAt: null,
          updatedAt: null
        })
      }
      targetUserId = user.id
      console.log('[system-config] 使用第一个用户:', user.id)
    }

    // 先尝试 Prisma 标准查询
    let config: Record<string, unknown> | null = null
    try {
      const prismaConfig = await prisma.systemConfig.findFirst({
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
      if (prismaConfig) {
        config = prismaConfig as unknown as Record<string, unknown>
      }
    } catch (prismaError) {
      // 数据库可能缺少某些列，回退到 raw SQL
      console.warn('[system-config] Prisma 标准查询失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
      config = await safeGetSystemConfig(targetUserId)

      // 尝试从 raw SQL 结果中获取 defaultSpace
      if (config && config.defaultSpaceId) {
        try {
          const space = await prisma.space.findUnique({
            where: { id: config.defaultSpaceId as string },
            select: { id: true, name: true }
          })
          if (space) {
            config.defaultSpace = space
          }
        } catch {
          // 获取空间信息失败，忽略
        }
      }
    }

    console.log('[system-config] 获取到配置:', {
      id: config?.id,
      siteTitle: config?.siteTitle,
      hasDefaultTheme: !!(config?.defaultTheme || config?.default_theme)
    })

    return NextResponse.json({
      id: config?.id || null,
      defaultSpaceId: config?.defaultSpaceId || config?.default_space_id || null,
      defaultSpace: (config?.defaultSpace as unknown) || null,
      siteTitle: config?.siteTitle || config?.site_title || null,
      faviconUrl: config?.faviconUrl || config?.favicon_url || null,
      seoDescription: config?.seoDescription || config?.seo_description || null,
      keywords: config?.keywords || null,
      defaultTheme: config?.defaultTheme || config?.default_theme || null,
      defaultThemeType: config?.defaultThemeType || config?.default_theme_type || null,
      createdAt: config?.createdAt || config?.created_at || null,
      updatedAt: config?.updatedAt || config?.updated_at || null
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

    // 检查现有记录（用安全方式）
    let existingConfig: Record<string, unknown> | null = null
    try {
      const existing = await prisma.systemConfig.findFirst({
        where: { userId: user.id },
        select: { id: true }
      })
      if (existing) existingConfig = existing as unknown as Record<string, unknown>
    } catch {
      // Prisma 标准查询失败，用 raw SQL 检查
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM system_configs WHERE user_id = $1 LIMIT 1`,
          user.id
        )
        if (rows && rows.length > 0) {
          existingConfig = { id: rows[0].id }
        }
      } catch {
        // 忽略，假设不存在
      }
    }

    let config: Record<string, unknown> | null = null

    if (existingConfig && existingConfig.id) {
      // 存在记录 → 尝试 Prisma update，失败则用 raw SQL
      try {
        const updated = await prisma.systemConfig.update({
          where: { id: existingConfig.id as string },
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
        config = updated as unknown as Record<string, unknown>
      } catch (prismaError) {
        console.warn('[system-config PUT] Prisma update 失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
        // 用 raw SQL 逐字段更新（仅更新存在的列）
        const now = new Date().toISOString()
        const setClauses: string[] = [`updated_at = '${now}'`]
        const values: unknown[] = []

        if (defaultSpaceId !== undefined) { setClauses.push(`default_space_id = $${values.length + 1}`); values.push(defaultSpaceId) }
        if (siteTitle !== undefined) { setClauses.push(`site_title = $${values.length + 1}`); values.push(siteTitle) }
        if (faviconUrl !== undefined) { setClauses.push(`favicon_url = $${values.length + 1}`); values.push(faviconUrl) }
        if (seoDescription !== undefined) { setClauses.push(`seo_description = $${values.length + 1}`); values.push(seoDescription) }
        if (keywords !== undefined) { setClauses.push(`keywords = $${values.length + 1}`); values.push(keywords) }
        if (defaultTheme !== undefined) { setClauses.push(`default_theme = $${values.length + 1}`); values.push(defaultTheme) }
        if (defaultThemeType !== undefined) { setClauses.push(`default_theme_type = $${values.length + 1}`); values.push(defaultThemeType) }

        values.push(existingConfig.id as string)

        try {
          await prisma.$executeRawUnsafe(
            `UPDATE system_configs SET ${setClauses.join(', ')} WHERE id = $${values.length}`,
            ...values
          )
          // 构造一个最小的返回对象
          config = {
            id: existingConfig.id,
            defaultSpaceId: defaultSpaceId !== undefined ? defaultSpaceId : null,
            siteTitle: siteTitle !== undefined ? siteTitle : null,
            defaultTheme: defaultTheme !== undefined ? defaultTheme : null,
            defaultThemeType: defaultThemeType !== undefined ? defaultThemeType : null,
            updatedAt: now
          }
        } catch (rawError) {
          // 有些列可能不存在，尝试更保守的方式——逐字段尝试
          console.warn('[system-config PUT] 批量 raw SQL 更新失败，尝试逐字段更新:', rawError instanceof Error ? rawError.message : rawError)
          const safeUpdateFields: Array<[string, string, unknown]> = [
            ['default_space_id', 'defaultSpaceId', defaultSpaceId],
            ['site_title', 'siteTitle', siteTitle],
            ['favicon_url', 'faviconUrl', faviconUrl],
            ['seo_description', 'seoDescription', seoDescription],
            ['keywords', 'keywords', keywords],
            ['default_theme', 'defaultTheme', defaultTheme],
            ['default_theme_type', 'defaultThemeType', defaultThemeType]
          ]

          for (const [colName, , value] of safeUpdateFields) {
            if (value === undefined) continue
            try {
              await prisma.$executeRawUnsafe(
                `UPDATE system_configs SET ${colName} = $1, updated_at = $2 WHERE id = $3`,
                value, new Date().toISOString(), existingConfig.id as string
              )
            } catch (colError) {
              // 该列可能不存在，忽略
              console.log(`[system-config PUT] 跳过更新列 ${colName}:`, colError instanceof Error ? colError.message : colError)
            }
          }

          config = {
            id: existingConfig.id,
            defaultSpaceId: defaultSpaceId !== undefined ? defaultSpaceId : null,
            updatedAt: new Date().toISOString()
          }
        }
      }
    } else {
      // 不存在记录 → 尝试 Prisma create，失败则用 raw SQL
      try {
        const created = await prisma.systemConfig.create({
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
        config = created as unknown as Record<string, unknown>
      } catch (prismaError) {
        console.warn('[system-config PUT] Prisma create 失败，尝试 raw SQL fallback:', prismaError instanceof Error ? prismaError.message : prismaError)
        // 用 raw SQL 插入最小字段
        const newId = (await import('crypto')).randomUUID()
        const now = new Date().toISOString()

        try {
          // 先尝试最完整的插入
          await prisma.$executeRawUnsafe(
            `INSERT INTO system_configs (id, user_id, default_space_id, site_title, favicon_url, seo_description, keywords, default_theme, default_theme_type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            newId, user.id,
            defaultSpaceId !== undefined ? defaultSpaceId : null,
            siteTitle !== undefined ? siteTitle : null,
            faviconUrl !== undefined ? faviconUrl : null,
            seoDescription !== undefined ? seoDescription : null,
            keywords !== undefined ? keywords : null,
            defaultTheme !== undefined ? defaultTheme : null,
            defaultThemeType !== undefined ? defaultThemeType : null,
            now, now
          )
        } catch {
          // 完整插入失败，尝试最小插入
          console.warn('[system-config PUT] 完整插入失败，尝试最小字段插入')
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO system_configs (id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
              newId, user.id, now, now
            )
            // 然后逐字段更新
            const safeUpdateFields: Array<[string, unknown]> = [
              ['default_space_id', defaultSpaceId],
              ['site_title', siteTitle],
              ['favicon_url', faviconUrl],
              ['seo_description', seoDescription],
              ['keywords', keywords],
              ['default_theme', defaultTheme],
              ['default_theme_type', defaultThemeType]
            ]

            for (const [colName, value] of safeUpdateFields) {
              if (value === undefined) continue
              try {
                await prisma.$executeRawUnsafe(
                  `UPDATE system_configs SET ${colName} = $1 WHERE id = $2`,
                  value, newId
                )
              } catch {
                // 该列可能不存在，忽略
              }
            }
          } catch (minError) {
            console.error('[system-config PUT] 最小字段插入也失败:', minError instanceof Error ? minError.message : minError)
            throw minError // 彻底失败，抛出让外部 catch 处理
          }
        }

        config = {
          id: newId,
          defaultSpaceId: defaultSpaceId !== undefined ? defaultSpaceId : null,
          siteTitle: siteTitle !== undefined ? siteTitle : null,
          defaultTheme: defaultTheme !== undefined ? defaultTheme : null,
          defaultThemeType: defaultThemeType !== undefined ? defaultThemeType : null,
          createdAt: now,
          updatedAt: now
        }
      }
    }

    // 更新系统版本Key
    try {
      await updateVersionKey('system')
    } catch {
      // 版本 key 更新失败不影响主流程
    }

    return NextResponse.json({
      id: config?.id || null,
      defaultSpaceId: (config?.defaultSpaceId as unknown) || null,
      defaultSpace: (config?.defaultSpace as unknown) || null,
      siteTitle: (config?.siteTitle as unknown) || null,
      faviconUrl: (config?.faviconUrl as unknown) || null,
      seoDescription: (config?.seoDescription as unknown) || null,
      keywords: (config?.keywords as unknown) || null,
      defaultTheme: (config?.defaultTheme as unknown) || null,
      defaultThemeType: (config?.defaultThemeType as unknown) || null,
      createdAt: (config?.createdAt as unknown) || null,
      updatedAt: (config?.updatedAt as unknown) || null
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