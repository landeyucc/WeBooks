// 测试修复后的书签API
const axios = require('axios')

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api'
let authToken = null

// 获取认证token（模拟登录）
async function authenticate() {
  try {
    console.log('🔐 正在获取认证token...')
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.token) {
      authToken = response.data.token
      console.log('✅ 认证成功，获得token')
      return true
    } else {
      console.log('❌ 认证失败:', response.data)
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

    // 获取默认空间ID
    const spacesResponse = await axios.get(`${API_BASE}/spaces`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!spacesResponse.data.spaces || spacesResponse.data.spaces.length === 0) {
      console.log('❌ 没有找到可用空间')
      return false
    }
    
    const defaultSpaceId = spacesResponse.data.spaces[0].id

    const response = await axios.post(`${API_BASE}/bookmarks`, {
      title: 'API测试书签',
      url: 'https://api-test.example.com',
      description: '这是一个API测试书签',
      spaceId: defaultSpaceId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })

    console.log('📊 响应状态:', response.status)
    
    if (response.status === 200 && response.data.bookmark) {
      console.log('✅ 创建书签成功!')
      console.log('   ID:', response.data.bookmark.id)
      console.log('   标题:', response.data.bookmark.title)
      console.log('   URL:', response.data.bookmark.url)
      
      // 清理测试数据
      await axios.delete(`${API_BASE}/bookmarks/${response.data.bookmark.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      console.log('✅ 清理测试数据完成')
      return true
    } else {
      console.log('❌ 创建书签失败:', response.data)
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

    const response = await axios.get(`${API_BASE}/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    console.log('📊 响应状态:', response.status)
    
    if (response.status === 200 && response.data.bookmarks) {
      console.log('✅ 获取书签成功!')
      console.log('   总数:', response.data.bookmarks.length)
      return true
    } else {
      console.log('❌ 获取书签失败:', response.data)
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