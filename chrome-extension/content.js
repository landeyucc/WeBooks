/**
 * Webooks Chrome Extension Content Script
 * 提取当前页面的基本信息
 */

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageInfo') {
    const pageInfo = extractPageInfo()
    sendResponse(pageInfo)
  }
})

/**
 * 提取页面基本信息
 */
function extractPageInfo() {
  try {
    // 获取页面标题
    const title = document.title || 
                  document.querySelector('meta[property="og:title"]')?.content || 
                  document.querySelector('meta[name="title"]')?.content ||
                  '未知标题'

    // 获取页面描述
    const description = 
      document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="twitter:description"]')?.content ||
      ''

    // 获取页面图标
    const favicon = 
      document.querySelector('link[rel="icon"]')?.href ||
      document.querySelector('link[rel="shortcut icon"]')?.href ||
      document.querySelector('link[rel="apple-touch-icon"]')?.href ||
      '/favicon.ico'

    // 获取Open Graph图片
    const ogImage = document.querySelector('meta[property="og:image"]')?.content

    // 规范化URL
    let faviconUrl = favicon
    if (faviconUrl && !faviconUrl.startsWith('http')) {
      try {
        faviconUrl = new URL(faviconUrl, window.location.href).href
      } catch {
        faviconUrl = null
      }
    }

    let ogImageUrl = ogImage
    if (ogImageUrl && !ogImageUrl.startsWith('http')) {
      try {
        ogImageUrl = new URL(ogImageUrl, window.location.href).href
      } catch {
        ogImageUrl = null
      }
    }

    // 选择最佳图标
    const icon = ogImageUrl || faviconUrl

    return {
      title: title.trim(),
      description: description.trim(),
      favicon: faviconUrl,
      icon: icon,
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('提取页面信息失败:', error)
    return {
      title: document.title || '未知标题',
      description: '',
      favicon: null,
      icon: null,
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: Date.now()
    }
  }
}

/**
 * 监听页面变化（用于单页应用）
 */
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    // 页面URL变化，可以重新提取信息
    console.log('页面URL变化:', url)
  }
}).observe(document, { subtree: true, childList: true })

// 页面加载完成后的初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeContentScript()
  })
} else {
  initializeContentScript()
}

function initializeContentScript() {
  console.log('Webooks内容脚本已加载，页面:', window.location.href)
  
  // 可以在这里添加页面特定的逻辑
}