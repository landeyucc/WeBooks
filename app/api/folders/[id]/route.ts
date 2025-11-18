import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

// 更新文件夹
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    const { name, description, iconUrl, parentFolderId } = await request.json()

    const folder = await prisma.folder.update({
      where: {
        id: params.id,
        userId
      },
      data: {
        name,
        description,
        iconUrl,
        parentFolderId
      }
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('更新文件夹错误:', error)
    return NextResponse.json(
      { error: '更新文件夹失败' },
      { status: 500 }
    )
  }
}

// 删除文件夹
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }

    await prisma.folder.delete({
      where: {
        id: params.id,
        userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除文件夹错误:', error)
    return NextResponse.json(
      { error: '删除文件夹失败' },
      { status: 500 }
    )
  }
}
