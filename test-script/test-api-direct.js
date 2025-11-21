// 使用原生 fetch
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api'

async function testFoldersAPI() {
  console.log('=== 测试folders API修复效果 ===\n')
  console.log(`🌐 API基础地址: ${API_BASE}`)
  
  try {
    // 测试GET /api/folders
    console.log('1. 测试GET /api/folders:')
    
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`状态码: ${response.status}`)
    console.log(`响应头:`, Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API调用成功')
      console.log(`返回文件夹数量: ${data.folders?.length || 0}`)
      
      if (data.folders && data.folders.length > 0) {
        console.log('文件夹列表:')
        data.folders.forEach((folder, index) => {
          console.log(`  ${index + 1}. ${folder.name} (ID: ${folder.id})`)
          console.log(`     - bookmarkCount: ${folder.bookmarkCount}`)
          console.log(`     - createdAt: ${folder.createdAt}`)
        })
      } else {
        console.log('❌ API返回空文件夹列表')
      }
    } else {
      const errorText = await response.text()
      console.log('❌ API调用失败')
      console.log('错误响应:', errorText)
    }
    
    console.log('\n=== 测试完成 ===')
    console.log('🔧 修复说明:')
    console.log('  1. 更新folders API使用智能认证逻辑')
    console.log('  2. 修复Edge浏览器兼容性问题')  
    console.log('  3. 统一所有API的认证处理方式')
    console.log('  4. 添加详细日志便于调试')
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message)
    console.log('💡 可能原因:')
    console.log('  - 开发服务器未启动')
    console.log('  - 端口3000被占用')
    console.log('  - 网络连接问题')
  }
}

// 运行测试
testFoldersAPI()