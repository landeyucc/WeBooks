import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 导出书签
export async function GET() {
  try {
    // 静态获取用户ID
    let userId: string | null = null
    
    // 1. 环境变量优先
    if (process.env.DEFAULT_USER_ID) {
      userId = process.env.DEFAULT_USER_ID
    } else {
      // 2. 静态查询第一个用户
      const firstUser = await prisma.user.findFirst()
      if (!firstUser) {
        return new NextResponse(
          `<html><body><h1>系统未初始化</h1><p>请先创建管理员账户</p></body></html>`,
          { 
            status: 401,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        )
      }
      userId = firstUser.id
    }

    // 静态获取所有书签
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: [
        { folderId: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            parentFolderId: true
          }
        }
      }
    })

    // 静态获取所有文件夹，用于构建层级关系
    const folders = await prisma.folder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        parentFolderId: true
      }
    })

    if (bookmarks.length === 0) {
      return new NextResponse(
        `<html><body><h1>没有书签可导出</h1><p>您的书签列表为空，请先添加一些书签。</p></body></html>`,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      )
    }

    // 生成HTML书签文件
    const html = generateBookmarkHtml(bookmarks, folders)

    // 返回文件下载
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Webooks_bookmarks_export_${timestamp}.html`
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
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
  folder: { id: string; name: string; parentFolderId: string | null } | null
}[], folders: {
  id: string
  name: string
  parentFolderId: string | null
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

  // 构建文件夹层级映射
  const folderMap = new Map<string, {
    id: string
    name: string
    parentFolderId: string | null
  }>()
  folders.forEach(folder => {
    folderMap.set(folder.id, folder)
  })

  // 计算文件夹的完整路径
  function getFolderPath(folderId: string): string {
    const path = []
    let currentFolderId = folderId
    
    while (currentFolderId) {
      const folder = folderMap.get(currentFolderId)
      if (!folder) break
      
      path.unshift(folder.name)
      currentFolderId = folder.parentFolderId || ''
    }
    
    return path.join('/')
  }

  // 按路径分组书签
  const bookmarksByPath = new Map<string, {
    title: string | null
    url: string
    iconUrl: string | null
    createdAt: Date | null
    folderId: string | null
    folder: { id: string; name: string; parentFolderId: string | null } | null
  }[]>()
  const rootBookmarks: {
    title: string | null
    url: string
    iconUrl: string | null
    createdAt: Date | null
    folderId: string | null
    folder: { id: string; name: string; parentFolderId: string | null } | null
  }[] = []
  
  bookmarks.forEach(bookmark => {
    if (bookmark.folderId && bookmark.folder) {
      const folderPath = getFolderPath(bookmark.folderId)
      if (!bookmarksByPath.has(folderPath)) {
        bookmarksByPath.set(folderPath, [])
      }
      bookmarksByPath.get(folderPath)!.push(bookmark)
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

  // 按路径排序（短的路径先出现）
  const sortedPaths = Array.from(bookmarksByPath.keys()).sort((a, b) => {
    // 先按层级深度排序，再按名称排序
    const depthA = a.split('/').length
    const depthB = b.split('/').length
    if (depthA !== depthB) return depthA - depthB
    return a.localeCompare(b)
  })

  // 生成文件夹书签
  sortedPaths.forEach(folderPath => {
    const folderBookmarks = bookmarksByPath.get(folderPath)!
    const pathSegments = folderPath.split('/')
    
    html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(pathSegments[pathSegments.length - 1])}</H3>\n`
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