/**
 * Webooks Chrome Extension Popup Script
 * 处理弹出窗口的用户交互和API调用
 */

class WebooksExtension {
  constructor() {
    this.apiUrl = ''
    this.apiKey = ''
    this.config = {}
    this.currentTab = null
    this.autoData = {
      title: '',
      url: '',
      description: '',
      favicon: '',
      icon: ''
    }
    
    this.init()
  }

  async init() {
    await this.loadCurrentTab()
    await this.loadConfig()
    this.setupEventListeners()
    this.populateConfig()
    this.loadSpacesAndFolders()
    this.updateBookmarkForm()
  }

  /**
   * 加载当前标签页信息
   */
  async loadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTab = tab

      if (tab && tab.url) {
        document.getElementById('currentPagePreview').style.display = 'block'
        
        // 获取页面信息
        const pageInfo = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractPageInfo'
        })

        if (pageInfo) {
          // 保存自动抓取的数据
          this.autoData = {
            title: pageInfo.title || '',
            url: pageInfo.url || tab.url,
            description: pageInfo.description || '',
            favicon: pageInfo.favicon || '',
            icon: pageInfo.icon || ''
          }
          
          // 更新当前页面预览
          document.getElementById('currentTitle').textContent = pageInfo.title || '无标题'
          document.getElementById('currentUrl').textContent = pageInfo.url || tab.url
          
          if (pageInfo.favicon) {
            document.getElementById('currentFavicon').src = pageInfo.favicon
          }
          
          // 更新表单数据
          this.updateBookmarkForm()
        }
      }
    } catch (error) {
      console.error('获取当前标签页信息失败:', error)
      // 即使获取失败也要设置URL
      this.autoData.url = this.currentTab?.url || ''
      this.updateBookmarkForm()
    }
  }

  /**
   * 加载存储的配置
   */
  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['webooksConfig'])
      this.config = result.webooksConfig || {
        apiUrl: 'http://localhost:3000',
        autoScrape: true
      }

      // 如果有完整的API配置，尝试从系统配置加载默认空间
      if (this.config.apiUrl && this.config.apiKey) {
        const defaultSpaceId = await this.loadSystemDefaultSpace()
        if (defaultSpaceId) {
          this.config.defaultSpaceId = defaultSpaceId
          // 保存更新的配置
          await chrome.storage.sync.set({ webooksConfig: this.config })
        }
      }

    } catch (error) {
      console.error('加载配置失败:', error)
      this.config = {
        apiUrl: 'http://localhost:3000',
        autoScrape: true
      }
    }
  }

  /**
   * 从系统配置加载默认空间
   */
  async loadSystemDefaultSpace() {
    try {
      if (!this.config.apiUrl || !this.config.apiKey) {
        console.log('配置不完整，跳过系统默认空间加载')
        return null
      }

      const response = await fetch(`${this.config.apiUrl}/api/system-config`, {
        headers: {
          'x-api-key': this.config.apiKey
        }
      })

      if (response.ok) {
        const systemConfig = await response.json()
        if (systemConfig.defaultSpaceId) {
          console.log(`系统默认空间设置为: ${systemConfig.defaultSpaceId}`)
          return systemConfig.defaultSpaceId
        } else {
          console.log('服务器未配置默认空间')
          return null
        }
      } else {
        console.error('获取系统配置失败:', response.status, response.statusText)
        return null
      }
    } catch (error) {
      console.error('获取系统默认空间失败:', error)
      return null
    }
  }

  /**
   * 填充配置表单
   */
  populateConfig() {
    document.getElementById('apiUrl').value = this.config.apiUrl || 'http://localhost:3000'
    document.getElementById('apiKey').value = this.config.apiKey || ''
    // 自动抓取功能现在默认开启，不需要读取checkbox状态
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 保存配置
    document.getElementById('saveKey').addEventListener('click', () => {
      this.saveConfig()
    })

    // 测试连接
    document.getElementById('testConnection').addEventListener('click', () => {
      this.testConnection()
    })

    // 保存书签
    document.getElementById('saveBookmark').addEventListener('click', () => {
      this.saveBookmark()
    })

    // 空间选择变化
    document.getElementById('defaultSpace').addEventListener('change', () => {
      this.loadFolders()
    })

    // 书签表单字段变化
    const bookmarkInputs = ['bookmarkTitle', 'bookmarkUrl', 'bookmarkDescription', 'bookmarkIcon']
    bookmarkInputs.forEach(inputId => {
      const element = document.getElementById(inputId)
      if (element) {
        element.addEventListener('input', () => {
          this.updateSaveButtonState()
        })
      }
    })

    // 从当前页面重新获取
    document.getElementById('refreshFromPage').addEventListener('click', () => {
      this.refreshFromCurrentPage()
    })

    // 更新自动抓取的数据 - 现在默认开启
    const configInputs = ['apiUrl', 'apiKey', 'defaultSpace', 'defaultFolder']
    configInputs.forEach(inputId => {
      const element = document.getElementById(inputId)
      if (element) {
        element.addEventListener('change', () => {
          this.enableSaveButton()
        })
      }
    })
  }

  /**
   * 更新书签表单数据（默认使用自动抓取的数据，但允许编辑）
   */
  updateBookmarkForm() {
    // 默认填入自动抓取的数据，但允许用户编辑
    document.getElementById('bookmarkTitle').value = this.autoData.title
    document.getElementById('bookmarkUrl').value = this.autoData.url
    document.getElementById('bookmarkDescription').value = this.autoData.description
    document.getElementById('bookmarkIcon').value = this.autoData.favicon || this.autoData.icon
    
    this.updateSaveButtonState()
  }

  /**
   * 从当前页面重新获取数据
   */
  async refreshFromCurrentPage() {
    try {
      this.showStatus('正在重新获取页面数据...', 'info')
      
      if (!this.currentTab || !this.currentTab.url) {
        throw new Error('无法获取当前页面信息')
      }

      // 获取当前页面信息
      const pageInfo = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extractPageInfo'
      })

      if (pageInfo) {
        // 更新自动抓取的数据
        this.autoData = {
          title: pageInfo.title || '',
          url: pageInfo.url || this.currentTab.url,
          description: pageInfo.description || '',
          favicon: pageInfo.favicon || '',
          icon: pageInfo.icon || ''
        }
        
        // 更新当前页面预览
        document.getElementById('currentTitle').textContent = pageInfo.title || '无标题'
        document.getElementById('currentUrl').textContent = pageInfo.url || this.currentTab.url
        
        if (pageInfo.favicon) {
          document.getElementById('currentFavicon').src = pageInfo.favicon
        }
        
        // 重新填充表单
        this.updateBookmarkForm()
        this.showStatus('已从当前页面重新获取数据', 'success')
      } else {
        throw new Error('未能获取页面信息')
      }

    } catch (error) {
      console.error('重新获取页面数据失败:', error)
      this.showStatus('重新获取失败: ' + error.message, 'error')
    }
  }

  /**
   * 更新保存按钮状态
   */
  updateSaveButtonState() {
    const title = document.getElementById('bookmarkTitle').value.trim()
    const url = document.getElementById('bookmarkUrl').value.trim()
    const spaceId = document.getElementById('defaultSpace').value
    const hasConfig = this.config.apiUrl && this.config.apiKey
    
    const canSave = title && url && spaceId && hasConfig
    document.getElementById('saveBookmark').disabled = !canSave
  }

  /**
   * 保存配置
   */
  async saveConfig() {
    try {
      this.showLoading(true)

      const newConfig = {
        apiUrl: document.getElementById('apiUrl').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        defaultSpaceId: document.getElementById('defaultSpace').value,
        defaultFolderId: document.getElementById('defaultFolder').value || null,
        // 更新自动抓取的数据 - 现在默认开启，无需读取checkbox
      // autoScrape: document.getElementById('autoScrape').checked
      }

      // 验证配置
      if (!newConfig.apiUrl) {
        throw new Error('请输入服务器地址')
      }
      
      if (!newConfig.apiKey) {
        throw new Error('请输入API Key')
      }

      this.config = newConfig
      await chrome.storage.sync.set({ webooksConfig: this.config })
      
      this.showStatus('配置保存成功！', 'success')
      this.disableSaveButton()
      this.updateSaveButtonState()

      // 保存配置后，重新加载空间列表以获取系统默认空间
      await this.loadSpacesAndFolders()

    } catch (error) {
      console.error('保存配置失败:', error)
      this.showStatus('保存配置失败: ' + error.message, 'error')
    } finally {
      this.showLoading(false)
    }
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      this.showLoading(true)

      const apiUrl = document.getElementById('apiUrl').value.trim()
      const apiKey = document.getElementById('apiKey').value.trim()

      if (!apiUrl || !apiKey) {
        throw new Error('请先配置服务器地址和API Key')
      }

      const response = await fetch(`${apiUrl}/api/extension/bookmarks`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          this.showStatus('连接测试成功！服务器可达。', 'success')
          // 连接成功后自动加载空间列表和系统默认空间
          await this.loadSpacesAndFolders()
        } else {
          throw new Error(result.error || 'API Key无效')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '连接失败')
      }

    } catch (error) {
      console.error('测试连接失败:', error)
      this.showStatus('连接测试失败: ' + error.message, 'error')
    } finally {
      this.showLoading(false)
    }
  }

  /**
   * 加载空间列表
   */
  /**
   * 加载空间和文件夹列表
   */
  async loadSpacesAndFolders() {
    try {
      const apiUrl = document.getElementById('apiUrl').value.trim()
      const apiKey = document.getElementById('apiKey').value.trim()

      if (!apiUrl || !apiKey) {
        return
      }

      // 获取空间列表
      const spacesResponse = await fetch(`${apiUrl}/api/spaces`, {
        headers: {
          'x-api-key': apiKey
        }
      })

      if (spacesResponse.ok) {
        const spacesResult = await spacesResponse.json()
        const spacesSelect = document.getElementById('defaultSpace')
        
        spacesSelect.innerHTML = '<option value="">请选择默认空间</option>'
        
        if (spacesResult.spaces && spacesResult.spaces.length > 0) {
          spacesResult.spaces.forEach(space => {
            const option = document.createElement('option')
            option.value = space.id
            option.textContent = space.name
            spacesSelect.appendChild(option)
          })
        }

        // 尝试自动选择系统默认空间
        let defaultSpaceId = this.config.defaultSpaceId
        
        if (!defaultSpaceId && apiUrl === this.config.apiUrl && apiKey === this.config.apiKey) {
          // 如果有保存的配置但没有默认空间ID，尝试从系统配置获取
          defaultSpaceId = await this.loadSystemDefaultSpace()
          if (defaultSpaceId) {
            this.config.defaultSpaceId = defaultSpaceId
          }
        }

        if (defaultSpaceId && spacesSelect.querySelector(`option[value="${defaultSpaceId}"]`)) {
          spacesSelect.value = defaultSpaceId
          await this.loadFolders()
          
          // 只有在真正选择了默认空间时才显示状态
          if (this.config.defaultSpaceId === defaultSpaceId) {
            this.showStatus('已自动选择系统默认空间', 'info')
          }
        } else if (defaultSpaceId) {
          console.log(`默认空间 ${defaultSpaceId} 不在可用空间列表中`)
        }
      }

    } catch (error) {
      console.error('加载空间列表失败:', error)
    }
  }

  /**
   * 加载文件夹列表
   */
  async loadFolders() {
    try {
      const spaceId = document.getElementById('defaultSpace').value
      if (!spaceId) {
        document.getElementById('defaultFolder').innerHTML = '<option value="">请选择默认文件夹</option>'
        return
      }

      const apiUrl = document.getElementById('apiUrl').value.trim()
      const apiKey = document.getElementById('apiKey').value.trim()

      const response = await fetch(`${apiUrl}/api/folders?spaceId=${spaceId}`, {
        headers: {
          'x-api-key': apiKey
        }
      })

      if (response.ok) {
        const result = await response.json()
        const foldersSelect = document.getElementById('defaultFolder')
        
        foldersSelect.innerHTML = '<option value="">请选择默认文件夹</option>'
        
        if (result.folders && result.folders.length > 0) {
          result.folders.forEach(folder => {
            const option = document.createElement('option')
            option.value = folder.id
            option.textContent = folder.name
            foldersSelect.appendChild(option)
          })
        }

        // 设置默认值
        if (this.config.defaultFolderId) {
          foldersSelect.value = this.config.defaultFolderId
        }
      }

    } catch (error) {
      console.error('加载文件夹列表失败:', error)
    }
  }

  /**
   * 保存书签
   */
  async saveBookmark() {
    try {
      if (!this.currentTab || !this.currentTab.url) {
        throw new Error('无法获取当前页面信息')
      }

      this.showLoading(true)

      // 获取表单数据 - 自动抓取功能默认开启
      const requestData = {
        title: document.getElementById('bookmarkTitle').value.trim(),
        url: document.getElementById('bookmarkUrl').value.trim(),
        description: document.getElementById('bookmarkDescription').value.trim(),
        iconUrl: document.getElementById('bookmarkIcon').value.trim(),
        spaceId: document.getElementById('defaultSpace').value,
        folderId: document.getElementById('defaultFolder').value || null,
        autoScrape: true  // 自动抓取功能现在默认开启
      }

      // 验证必填字段
      if (!requestData.title) {
        throw new Error('请输入书签标题')
      }
      
      if (!requestData.url) {
        throw new Error('请输入书签URL')
      }
      
      if (!requestData.spaceId) {
        throw new Error('请选择目标空间')
      }

      const apiUrl = this.config.apiUrl
      const apiKey = this.config.apiKey

      if (!apiUrl || !apiKey) {
        throw new Error('请先配置服务器地址和API Key')
      }

      const response = await fetch(`${apiUrl}/api/extension/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        this.showStatus('书签保存成功！🎉', 'success')
        // 清空表单（可选）
        // this.resetBookmarkForm()
      } else {
        throw new Error(result.error || '保存失败')
      }

    } catch (error) {
      console.error('保存书签失败:', error)
      this.showStatus('保存失败: ' + error.message, 'error')
    } finally {
      this.showLoading(false)
    }
  }

  /**
   * 显示状态消息
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage')
    statusElement.textContent = message
    statusElement.className = `status-message show ${type}`
    
    setTimeout(() => {
      statusElement.classList.remove('show')
    }, 3000)
  }

  /**
   * 显示/隐藏加载状态
   */
  showLoading(show) {
    const loadingElement = document.getElementById('loading')
    loadingElement.style.display = show ? 'flex' : 'none'
  }

  /**
   * 启用保存按钮
   */
  enableSaveButton() {
    document.getElementById('saveKey').disabled = false
    document.getElementById('saveBookmark').disabled = false
  }

  /**
   * 禁用保存按钮
   */
  disableSaveButton() {
    document.getElementById('saveKey').disabled = true
  }
}

// 初始化扩展
document.addEventListener('DOMContentLoaded', () => {
  window.webooksExtension = new WebooksExtension()
})