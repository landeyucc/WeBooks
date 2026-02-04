import { NextResponse } from 'next/server'
import { getVersionKeys } from '@/lib/version-manager'

export async function GET() {
  try {
    const versionKeys = await getVersionKeys()
    
    return NextResponse.json(
      {
        success: true,
        data: versionKeys
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    console.error('获取版本Key失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取版本信息失败'
      },
      {
        status: 500
      }
    )
  }
}

export async function POST() {
  try {
    // 强制刷新版本Key
    const versionKeys = await getVersionKeys()
    
    return NextResponse.json(
      {
        success: true,
        data: versionKeys,
        message: '版本信息已刷新'
      },
      {
        status: 200
      }
    )
  } catch (error) {
    console.error('刷新版本Key失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '刷新版本信息失败'
      },
      {
        status: 500
      }
    )
  }
}
