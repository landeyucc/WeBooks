import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { fetchWebsiteMetadata } from '@/lib/scraper'
import { updateVersionKey } from '@/lib/version-manager'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 浏览器扩展插件API - 添加书签
 * 支持通过扩展快捷键直接添加当前网页的书签
 * 仅支持POST操作（仅添加）
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Extension API - POST 请求开始`)
  
  try {
    // 验证API Key认证
    const authResult = await authenticateWithApiKey(request)
    
    if (authResult.response) {
      console.log(`[${requestId}] 认证失败，返回错误响应`)
      return authResult.response
    }

    if (!authResult) {
      console.log(`[${requestId}] 认证结果为null`)
      return NextResponse.json(
        { success: false, error: '认证系统错误', details: 'authResult为null' },
        { status: 500 }
      )
    }

    const userId = authResult.userId
    if (!userId) {
      console.log(`[${requestId}] 用户ID为空`)
      return NextResponse.json(
        { success: false, error: '认证失败', details: '无法获取用户ID' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] 认证成功，用户ID: ${userId}`)

    const { 
      title, 
      url, 
      description, 
      iconUrl, 
      spaceId, 
      folderId, 
      autoScrape = true 
    } = await request.json()

    // 验证必需参数
    if (!url || !spaceId) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数', details: '需要url和spaceId' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Extension API - 添加书签: ${url}`)

    let bookmarkTitle = title
    let bookmarkDescription = description
    let bookmarkIconUrl = iconUrl

    // 如果启用自动抓取，获取网页元数据
    if (autoScrape && (!title || !description || !iconUrl)) {
      try {
        console.log(`Extension API - 自动抓取网页元数据: ${url}`)
        const metadata = await fetchWebsiteMetadata(url)
        bookmarkTitle = title || metadata.title
        bookmarkDescription = description || metadata.description
        bookmarkIconUrl = iconUrl || metadata.iconUrl
      } catch (error) {
        console.warn(`Extension API - 抓取元数据失败:`, error)
        // 即使抓取失败，也使用用户提供的参数
        bookmarkTitle = title || new URL(url).hostname
        bookmarkDescription = description || `从 ${url} 添加的书签`
      }
    }

    // 如果仍然缺少必要信息，使用默认值
    if (!bookmarkTitle) {
      bookmarkTitle = new URL(url).hostname
    }
    if (!bookmarkDescription) {
      bookmarkDescription = `从 ${url} 添加的书签`
    }

    // 创建书签
    const bookmark = await prisma.bookmark.create({
      data: {
        title: bookmarkTitle,
        url,
        description: bookmarkDescription,
        iconUrl: bookmarkIconUrl,
        spaceId,
        folderId,
        userId
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 更新文件夹的书签计数
    if (folderId) {
      await prisma.folder.update({
        where: { id: folderId },
        data: {
          bookmarkCount: {
            increment: 1
          }
        }
      })
    }

    // 更新书签版本Key
    await updateVersionKey('bookmarks')

    console.log(`Extension API - 书签添加成功: ${bookmark.id}`)

    return NextResponse.json({
      success: true,
      message: '书签添加成功',
      bookmark
    })

  } catch (error) {
    console.error('Extension API - 添加书签错误:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '添加书签失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 扩展API - 验证API Key是否有效
 */
export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Extension API - GET 请求开始`)
  
  try {
    const authResult = await authenticateWithApiKey(request)
    
    if (authResult.response) {
      console.log(`[${requestId}] 认证失败，返回错误响应`)
      return authResult.response
    }

    if (!authResult) {
      console.log(`[${requestId}] 认证结果为null`)
      return NextResponse.json(
        { success: false, error: '认证系统错误', details: 'authResult为null' },
        { status: 500 }
      )
    }

    const userId = authResult.userId
    if (!userId) {
      console.log(`[${requestId}] 用户ID为空`)
      return NextResponse.json(
        { success: false, error: '认证失败', details: '无法获取用户ID' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] 认证成功，用户ID: ${userId}`)

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true
      }
    })

    if (!user) {
      console.log(`[${requestId}] 用户不存在`)
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    console.log(`[${requestId}] 用户验证成功: ${user.username}`)

    return NextResponse.json({
      success: true,
      message: 'API Key有效',
      user
    })

  } catch (error) {
    console.error(`[${requestId}] Extension API - 验证API Key错误:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: '验证失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}