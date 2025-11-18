import { NextRequest, NextResponse } from 'next/server'
import { fetchWebsiteMetadata } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log('Scraping URL:', url)

    const metadata = await fetchWebsiteMetadata(url)

    return NextResponse.json({
      success: true,
      metadata
    })
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch website information',
        metadata: { iconUrl: null, description: null, title: null }
      },
      { status: 500 }
    )
  }
}