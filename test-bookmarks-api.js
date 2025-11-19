// 测试修复后的书签API
const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'
let authToken = null

// 获取认证token（模拟登录）
async function authenticate() {
  try {
    console.log('🔐 正在获取认证token...')
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    })

    const data = await response.json()
    
    if (data.token) {
      authToken = data.token
      console.log('✅ 认证成功，获得token')
      return true
    } else {
      console.log('❌ 认证失败:', data)
      return false
    }
  } catch (error) {
    console.error('❌ 认证错误:', error.message)
    return false
  }
}

// 测试创建书签API
async function testCreateBookmark() {
  try {
    console.log('\n📝 测试创建书签API...')

    if (!authToken) {
      console.log('❌ 缺少认证token')
      return false
    }

    const response = await fetch(`${API_BASE}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'API测试书签',
        url: 'https://api-test.example.com',
        description: '这是一个API测试书签',
        spaceId: 'a33ed957-ace6-48d8-8b6a-514a0c004ed7'
      })
    })

    console.log('📊 响应状态:', response.status)

    const data = await response.json()
    
    if (response.ok && data.bookmark) {
      console.log('✅ 创建书签成功!')
      console.log('   ID:', data.bookmark.id)
      console.log('   标题:', data.bookmark.title)
      console.log('   URL:', data.bookmark.url)
      
      // 清理测试数据
      await fetch(`${API_BASE}/bookmarks/${data.bookmark.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      console.log('✅ 清理测试数据完成')
      return true
    } else {
      console.log('❌ 创建书签失败:', data)
      return false
    }
  } catch (error) {
    console.error('❌ API测试错误:', error.message)
    return false
  }
}

// 测试获取书签API
async function testGetBookmarks() {
  try {
    console.log('\n📖 测试获取书签API...')

    if (!authToken) {
      console.log('❌ 缺少认证token')
      return false
    }

    const response = await fetch(`${API_BASE}/bookmarks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    console.log('📊 响应状态:', response.status)

    const data = await response.json()
    
    if (response.ok && data.bookmarks) {
      console.log('✅ 获取书签成功!')
      console.log('   总数:', data.bookmarks.length)
      return true
    } else {
      console.log('❌ 获取书签失败:', data)
      return false
    }
  } catch (error) {
    console.error('❌ API测试错误:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 开始测试修复后的书签API...\n')

  try {
    // 1. 认证
    const authSuccess = await authenticate()
    if (!authSuccess) {
      console.log('\n❌ 认证失败，终止测试')
      return
    }

    // 2. 测试获取书签
    const getSuccess = await testGetBookmarks()

    // 3. 测试创建书签
    const createSuccess = await testCreateBookmark()

    // 总结
    console.log('\n📋 测试总结:')
    console.log(`   认证: ${authSuccess ? '✅ 通过' : '❌ 失败'}`)
    console.log(`   获取书签: ${getSuccess ? '✅ 通过' : '❌ 失败'}`)
    console.log(`   创建书签: ${createSuccess ? '✅ 通过' : '❌ 失败'}`)

    if (authSuccess && createSuccess) {
      console.log('\n🎉 所有关键测试通过！创建书签功能已修复')
    } else {
      console.log('\n⚠️  部分测试失败，需要进一步排查')
    }

  } catch (error) {
    console.error('❌ 测试执行错误:', error)
  }
}

runTests()