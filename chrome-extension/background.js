/**
 * Webooks Chrome Extension Background Service Worker
 * 处理快捷键命令和扩展生命周期
 */

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Webooks扩展已安装', details)
  
  // 检查并初始化默认配置
  chrome.storage.sync.get(['webooksConfig'], (result) => {
    if (!result.webooksConfig) {
      chrome.storage.sync.set({
        webooksConfig: {
          apiUrl: 'http://localhost:3000',
          autoScrape: true
        }
      })
    }
  })
})

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-bookmark') {
    console.log('快捷键触发：保存书签')
    
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab || !tab.url) {
        throw new Error('无法获取当前页面信息')
      }

      // 注入内容脚本获取页面信息
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractPageInfo'
      })

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message)
      }

      const pageInfo = response

      // 弹出确认对话框
      const confirmed = await showSaveDialog(tab.url, pageInfo)
      
      if (confirmed) {
        // 保存书签
        await saveBookmark(tab.url, pageInfo)
      }

    } catch (error) {
      console.error('保存书签失败:', error)
      showNotification('保存失败: ' + error.message, 'error')
    }
  }
})

// 从content script接收页面信息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pageInfo') {
    // 这里可以处理来自content script的消息
    console.log('收到页面信息:', request.data)
    sendResponse({ success: true })
  }
})

/**
 * 显示保存确认对话框
 */
async function showSaveDialog(url, pageInfo) {
  return new Promise((resolve) => {
    // 使用alert作为简单的确认对话框
    const message = `是否保存书签？\n\n标题: ${pageInfo.title}\n网址: ${url}\n描述: ${pageInfo.description || '无'}`
    
    setTimeout(() => {
      const confirmed = confirm(message)
      resolve(confirmed)
    }, 100)
  })
}

/**
 * 保存书签到服务器
 */
async function saveBookmark(url, pageInfo) {
  try {
    // 获取配置
    const result = await chrome.storage.sync.get(['webooksConfig'])
    const config = result.webooksConfig || {}
    
    if (!config.apiKey) {
      throw new Error('请先在扩展设置中配置API Key')
    }

    const requestData = {
      title: pageInfo.title,
      url: url,
      description: pageInfo.description,
      iconUrl: pageInfo.favicon || pageInfo.icon,
      spaceId: config.defaultSpaceId || '',
      folderId: config.defaultFolderId || null,
      autoScrape: config.autoScrape !== false
    }

    // 发送到服务器
    const response = await fetch(`${config.apiUrl || 'http://localhost:3000'}/api/extension/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(requestData)
    })

    const apiResult = await response.json()

    if (apiResult.success) {
      showNotification('书签保存成功！', 'success')
    } else {
      throw new Error(apiResult.error || '保存失败')
    }

  } catch (error) {
    console.error('保存书签错误:', error)
    showNotification('保存失败: ' + error.message, 'error')
  }
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
  // 简单的通知方式
  chrome.action.setBadgeText({ text: type === 'success' ? '✓' : '!' })
  chrome.action.setBadgeBackgroundColor({ 
    color: type === 'success' ? '#4CAF50' : '#f44336' 
  })
  
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' })
  }, 2000)
}