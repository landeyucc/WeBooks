import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, getPublicUserId } from '@/lib/auth-helper'

// 导出书签
export async function GET(request: NextRequest) {
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
    
    console.log('GET bookmarks export - User ID:', userId)

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const folderId = searchParams.get('folderId')
    const format = searchParams.get('format') || 'html'

    const where: any = { userId }
    
    if (spaceId) {
      where.spaceId = spaceId
    }
    
    if (folderId) {
      where.folderId = folderId
    }

    // 获取书签数据
    const bookmarks = await prisma.bookmark.findMany({
      where,
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
      return NextResponse.json(
        { error: '没有找到可导出的书签' },
        { status: 404 }
      )
    }

    // 生成HTML书签文件
    const html = generateBookmarkHtml(bookmarks)

    // 返回文件下载
    const filename = `Webooks_bookmarks_export_${new Date().toISOString().split('T')[0]}.html`
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': html.length.toString()
      }
    })
  } catch (error) {
    console.error('导出书签错误:', error)
    return NextResponse.json(
      { error: '导出书签失败' },
      { status: 500 }
    )
  }
}

// 生成HTML书签文件内容
function generateBookmarkHtml(bookmarks: any[]): string {
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
  const folders = new Map<string, any[]>()
  const rootBookmarks: any[] = []
  
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
function generateBookmarkEntry(bookmark: any, timestamp: number): string {
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