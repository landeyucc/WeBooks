import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWithApiKey } from '@/lib/extension-auth'
import { fetchWebsiteMetadata } from '@/lib/scraper'

/**
 * 扩展API - 添加书签
 * 支持通过扩展快捷键直接添加当前网页的书签
 * 仅支持POST操作（仅添加）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证API Key认证
    const authResult = await authenticateWithApiKey(request)
    
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
        { error: '缺少必需参数：url和spaceId' },
        { status: 400 }
      )
    }

    console.log(`Extension API - 添加书签: ${url}`)

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
  try {
    const authResult = await authenticateWithApiKey(request)
    
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
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API Key有效',
      user
    })

  } catch (error) {
    console.error('Extension API - 验证API Key错误:', error)
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