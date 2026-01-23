import axios from 'axios'

export interface WebsiteMetadata {
  iconUrl: string | null
  description: string | null
  title: string | null
}

export async function fetchWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(normalizedUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      validateStatus: (status) => status < 500
    })

    const html = response.data as string
    const title = extractTitle(html)
    const description = extractDescription(html)
    const iconUrl = extractIconUrl(html, baseUrl)

    return { iconUrl, description, title }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return {
        iconUrl: `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
        description: null,
        title: null
      }
    } catch {
      return { iconUrl: null, description: null, title: null }
    }
  }
}

function extractTitle(html: string): string | null {
  const patterns = [
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function extractDescription(html: string): string | null {
  const patterns = [
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function extractIconUrl(html: string, baseUrl: string): string | null {
  const patterns = [
    /<link\s+rel=["'](?:shortcut\s+)?icon["']\s+href=["']([^"']+)["']/i,
    /<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i,
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const href = match[1].trim()
      if (href.startsWith('http')) {
        return href
      } else if (href.startsWith('//')) {
        return `https:${href}`
      } else if (href.startsWith('/')) {
        return `${baseUrl}${href}`
      } else {
        return `${baseUrl}/${href}`
      }
    }
  }

  return `${baseUrl}/favicon.ico`
}
