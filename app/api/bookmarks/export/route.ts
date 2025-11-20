import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 导出书签 - 完全静态化处理，避免动态服务器使用
export async function GET(request: NextRequest) {
  try {
    // 静态获取用户ID - 不使用request参数
    let userId: string | null = null
    
    // 1. 环境变量优先（完全静态）
    if (process.env.DEFAULT_USER_ID) {
      userId = process.env.DEFAULT_USER_ID
      console.log('导出书签：使用环境变量指定的用户ID', userId)
    } else {
      // 2. 静态查询第一个用户（运行时，但不影响静态渲染）
      const firstUser = await prisma.user.findFirst()
      if (!firstUser) {
        // 返回友好的错误页面而不是JSON
        return new NextResponse(
          `<html><body><h1>系统未初始化</h1><p>请先创建管理员账户</p></body></html>`,
          { 
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        )
      }
      userId = firstUser.id
      console.log('导出书签：使用第一个用户ID', userId)
    }
    
    console.log('GET bookmarks export - User ID:', userId)

    // 静态获取所有书签（不根据查询参数过滤）
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: [
        { folderId: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        folder: {
          select: {
            name: true
          }
        }
      }
    })

    if (bookmarks.length === 0) {
      // 返回友好的错误页面
      return new NextResponse(
        `<html><body><h1>没有书签可导出</h1><p>您的书签列表为空，请先添加一些书签。</p></body></html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // 生成HTML书签文件
    const html = generateBookmarkHtml(bookmarks)

    // 返回文件下载
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Webooks_bookmarks_export_${timestamp}.html`
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store', // 避免缓存
      }
    })
  } catch (error) {
    console.error('导出书签错误:', error)
    return new NextResponse(
      `<html><body><h1>导出失败</h1><p>导出书签时发生错误，请稍后重试。</p></body></html>`,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
  }
}

// 生成HTML书签文件内容
function generateBookmarkHtml(bookmarks: {
  title: string | null
  url: string
  iconUrl: string | null
  createdAt: Date | null
  folderId: string | null
  folder: { name: string } | null
}[]): string {
  const now = Math.floor(Date.now() / 1000)
  
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Webooks Bookmarks Export</TITLE>
<H1>Webooks Bookmarks Export</H1>
<DL><p>
`

  // 按文件夹分组
  const folders = new Map<string, {
    title: string | null
    url: string
    iconUrl: string | null
    createdAt: Date | null
    folderId: string | null
    folder: { name: string } | null
  }[]>()
  const rootBookmarks: {
    title: string | null
    url: string
    iconUrl: string | null
    createdAt: Date | null
    folderId: string | null
    folder: { name: string } | null
  }[] = []
  
  bookmarks.forEach(bookmark => {
    if (bookmark.folderId && bookmark.folder) {
      const folderName = bookmark.folder.name
      if (!folders.has(folderName)) {
        folders.set(folderName, [])
      }
      folders.get(folderName)!.push(bookmark)
    } else {
      rootBookmarks.push(bookmark)
    }
  })

  // 生成根目录书签
  if (rootBookmarks.length > 0) {
    html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">根目录</H3>\n`
    html += `    <DL><p>\n`
    
    rootBookmarks.forEach(bookmark => {
      html += generateBookmarkEntry(bookmark, now)
    })
    
    html += `    </DL><p>\n`
  }

  // 生成文件夹书签
  folders.forEach((folderBookmarks, folderName) => {
    html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(folderName)}</H3>\n`
    html += `    <DL><p>\n`
    
    folderBookmarks.forEach(bookmark => {
      html += generateBookmarkEntry(bookmark, now)
    })
    
    html += `    </DL><p>\n`
  })

  html += `</DL><p>\n`

  return html
}

// 生成单个书签条目
function generateBookmarkEntry(bookmark: {
  title: string | null
  url: string
  iconUrl: string | null
  createdAt: Date | null
}, timestamp: number): string {
  const title = escapeHtml(bookmark.title || '未命名书签')
  const url = escapeHtml(bookmark.url)
  const addDate = bookmark.createdAt ? Math.floor(new Date(bookmark.createdAt).getTime() / 1000) : timestamp
  
  let entry = `        <DT><A HREF="${url}" ADD_DATE="${addDate}"`
  
  // 添加图标（如果有）
  if (bookmark.iconUrl && bookmark.iconUrl.startsWith('data:')) {
    entry += ` ICON="${bookmark.iconUrl}"`
  }
  
  entry += `>${title}</A>\n`
  
  return entry
}

// HTML转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}