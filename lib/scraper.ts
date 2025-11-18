import axios from 'axios'
import * as cheerio from 'cheerio'

export interface WebsiteMetadata {
  iconUrl: string | null
  description: string | null
  title: string | null
}

export async function fetchWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  try {
    // 标准化URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(normalizedUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    // 获取网页内容
    const response = await axios.get(normalizedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      validateStatus: function (status) {
        return status < 500; // 只在服务器错误时拒绝状态
      }
    })

    const html = response.data
    const $ = cheerio.load(html)

    // 查找标题
    let title: string | null = null
    const titleSelectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title'
    ]
    
    for (const selector of titleSelectors) {
      const elements = $(selector)
      
      if (elements.length > 0) {
        let content: string | undefined
        if (selector === 'title') {
          content = elements.first().text()?.trim()
        } else {
          content = elements.first().attr('content')?.trim()
        }
        
        if (content && content.trim()) {
          title = content.trim()
          break
        }
      }
    }

    // 查找图标
    let iconUrl: string | null = null

    // 尝试多种图标选择器
    const iconSelectors = [
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'meta[property="og:image"]'
    ]

    for (const selector of iconSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        let href: string | undefined
        if (selector.includes('meta')) {
          href = element.attr('content')
        } else {
          href = element.attr('href')
        }
        
        if (href && href.trim()) {
          // 处理相对路径
          iconUrl = href.startsWith('http') ? href : 
                   href.startsWith('//') ? `https:${href}` :
                   href.startsWith('/') ? `${baseUrl}${href}` :
                   `${baseUrl}/${href}`
          break
        }
      }
    }

    // 如果没找到图标，使用默认的 favicon.ico
    if (!iconUrl) {
      iconUrl = `${baseUrl}/favicon.ico`
    }

    // 查找描述
    let description: string | null = null
    const descSelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]'
    ]
    
    for (const selector of descSelectors) {
      const elements = $(selector)
      
      if (elements.length > 0) {
        const content = elements.first().attr('content')
        
        if (content && content.trim()) {
          description = content.trim()
          break
        }
      }
    }

    return { iconUrl, description, title }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    // 返回默认图标和空描述
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
