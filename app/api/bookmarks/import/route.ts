import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helper'
import { JSDOM } from 'jsdom'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ParsedBookmark {
  title: string
  url: string
  iconUrl?: string
  addDate?: number
}

interface ParsedFolder {
  name: string
  addDate?: number
  lastModified?: number
  personalToolbarFolder?: boolean
}

// 解析HTML书签文件
function parseBookmarkHtml(html: string): { bookmarks: ParsedBookmark[], folders: ParsedFolder[] } {
  const dom = new JSDOM(html)
  const document = dom.window.document
  
  const bookmarks: ParsedBookmark[] = []
  const folders: ParsedFolder[] = []
  
  // 查找所有DT元素
  const dtElements = document.querySelectorAll('DT')
  
  dtElements.forEach((dt: Element) => {
    const h3 = dt.querySelector('H3')
    const a = dt.querySelector('A')
    
    if (h3) {
      // 这是一个文件夹
      const folder: ParsedFolder = {
        name: h3.textContent || '未命名文件夹',
        addDate: h3.getAttribute('ADD_DATE') ? parseInt(h3.getAttribute('ADD_DATE')!) : undefined,
        lastModified: h3.getAttribute('LAST_MODIFIED') ? parseInt(h3.getAttribute('LAST_MODIFIED')!) : undefined,
        personalToolbarFolder: h3.getAttribute('PERSONAL_TOOLBAR_FOLDER') === 'true'
      }
      folders.push(folder)
    } else if (a) {
      // 这是一个书签
      const bookmark: ParsedBookmark = {
        title: a.textContent || '未命名书签',
        url: a.getAttribute('HREF') || '',
        iconUrl: a.getAttribute('ICON') || undefined,
        addDate: a.getAttribute('ADD_DATE') ? parseInt(a.getAttribute('ADD_DATE')!) : undefined
      }
      if (bookmark.url) {
        bookmarks.push(bookmark)
      }
    }
  })
  
  return { bookmarks, folders }
}

// 获取网站图标
async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/favicon?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      return data.favicon || null
    }
  } catch (error) {
    console.error('获取图标失败:', error)
  }
  return null
}

// 导入书签
export async function POST(request: NextRequest) {
  try {
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
    
    console.log('POST bookmarks import - User ID:', userId)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '请选择要导入的HTML文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.html')) {
      return NextResponse.json(
        { error: '请选择HTML格式的书签文件' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const html = await file.text()
    
    // 解析HTML书签文件
    const { bookmarks } = parseBookmarkHtml(html)
    
    if (bookmarks.length === 0) {
      return NextResponse.json(
        { error: '文件中未找到有效的书签数据' },
        { status: 400 }
      )
    }

    // 创建以当前时间戳命名的文件夹
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
    const folderName = `input_${timestamp}`
    
    // 获取默认空间
    const systemConfig = await prisma.systemConfig.findFirst()
    if (!systemConfig || !systemConfig.defaultSpaceId) {
      return NextResponse.json(
        { error: '系统未配置默认空间' },
        { status: 400 }
      )
    }

    // 创建文件夹
    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        description: `从书签文件导入的文件夹 - ${file.name}`,
        userId,
        spaceId: systemConfig.defaultSpaceId
      }
    })

    console.log(`创建文件夹: ${folderName} (ID: ${folder.id})`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // 批量创建书签
    for (const bookmark of bookmarks) {
      try {
        let iconUrl = bookmark.iconUrl
        
        // 如果没有图标，尝试获取
        if (!iconUrl) {
          const fetchedIcon = await fetchFavicon(bookmark.url)
          iconUrl = fetchedIcon || undefined
        }

        await prisma.bookmark.create({
          data: {
            title: bookmark.title,
            url: bookmark.url,
            description: `从书签文件导入 - ${file.name}`,
            iconUrl: iconUrl || undefined,
            userId,
            spaceId: systemConfig.defaultSpaceId,
            folderId: folder.id
          }
        })

        successCount++
        console.log(`导入书签: ${bookmark.title} (${bookmark.url})`)
      } catch (error) {
        errorCount++
        const errorMsg = `导入书签失败: ${bookmark.title} (${bookmark.url}) - ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    // 更新文件夹的书签计数
    await prisma.folder.update({
      where: { id: folder.id },
      data: {
        bookmarkCount: successCount
      }
    })

    const result: {
      success: boolean
      folderId: string
      folderName: string
      total: number
      successCount: number
      errorCount: number
      message: string | undefined
      errors?: string[]
    } = {
      success: true,
      folderId: folder.id,
      folderName,
      total: bookmarks.length,
      successCount,
      errorCount,
      message: `成功导入 ${successCount} 个书签，失败 ${errorCount} 个`
    }

    if (errors.length > 0) {
      result['errors'] = errors
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('导入书签错误:', error)
    return NextResponse.json(
      { error: '导入书签失败' },
      { status: 500 }
    )
  }
}