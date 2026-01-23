const testApiDirect = async () => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000'
  const apiKey = process.env.API_KEY

  if (!apiKey) {
    console.log('请设置 API_KEY 环境变量')
    console.log('示例: set API_KEY=your_api_key && node test-script/test-api-direct.js')
    return
  }

  console.log(`测试 API: ${apiUrl}/api/extension/bookmarks`)
  console.log(`API Key: ${apiKey.substring(0, 10)}...`)

  try {
    const response = await fetch(`${apiUrl}/api/extension/bookmarks`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    })

    console.log(`HTTP 状态码: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)

    const text = await response.text()
    console.log(`响应长度: ${text.length} 字符`)
    console.log(`响应前200字符:`)
    console.log(text.substring(0, 200))

    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.log('\n❌ 错误: 服务器返回了 HTML 页面而非 JSON')
    } else {
      try {
        const json = JSON.parse(text)
        console.log('\n✅ 成功解析 JSON 响应')
        console.log(JSON.stringify(json, null, 2))
      } catch (e) {
        console.log('\n❌ 无法解析 JSON:', e.message)
      }
    }
  } catch (error) {
    console.log(`\n❌ 请求失败: ${error.message}`)
  }
}

testApiDirect()
