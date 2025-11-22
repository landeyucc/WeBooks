// 测试登录用户的加密空间访问
const testLoginEncryptedSpace = async () => {
  console.log('🔍 开始测试登录用户访问加密空间...')
  
  // 测试数据
  const testData = {
    username: 'admin',
    password: 'admin123'
  }
  
  try {
    // 1. 登录获取token
    console.log('\n1️⃣ 登录获取token...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const loginResult = await loginResponse.json()
    console.log('登录响应状态:', loginResponse.status)
    console.log('登录响应:', loginResult)
    
    if (!loginResponse.ok) {
      throw new Error('登录失败: ' + (loginResult.error || '未知错误'))
    }
    
    const token = loginResult.token
    console.log('✅ 登录成功，获取到token')
    
    // 2. 获取空间列表
    console.log('\n2️⃣ 获取空间列表...')
    const spacesResponse = await fetch('http://localhost:3000/api/spaces', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const spacesResult = await spacesResponse.json()
    console.log('空间响应状态:', spacesResponse.status)
    
    // 确保spacesData始终是一个数组
    let spacesData = []
    if (Array.isArray(spacesResult)) {
      spacesData = spacesResult
    } else if (spacesResult && Array.isArray(spacesResult.spaces)) {
      spacesData = spacesResult.spaces
    } else if (spacesResult && spacesResult.data && Array.isArray(spacesResult.data)) {
      spacesData = spacesResult.data
    }
    
    console.log(`找到 ${spacesData.length} 个空间`)
    
    // 查找加密空间
    const encryptedSpaces = spacesData.filter(space => space.isEncrypted)
    console.log(`找到 ${encryptedSpaces.length} 个加密空间`)
    
    if (encryptedSpaces.length === 0) {
      console.log('❌ 没有找到加密空间，无法测试')
      return
    }
    
    // 3. 尝试访问加密空间
    console.log('\n3️⃣ 测试加密空间访问...')
    const testSpace = encryptedSpaces[0]
    console.log(`测试空间: ${testSpace.name} (加密: ${testSpace.isEncrypted})`)
    
    // 4. 测试书签和文件夹获取（模拟正常访问）
    console.log('\n4️⃣ 测试书签获取...')
    const bookmarksResponse = await fetch(`http://localhost:3000/api/bookmarks?spaceId=${testSpace.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('书签响应状态:', bookmarksResponse.status)
    const bookmarksResult = await bookmarksResponse.json()
    console.log(`书签数量: ${Array.isArray(bookmarksResult) ? bookmarksResult.length : '响应格式异常'}`)
    
    console.log('\n5️⃣ 测试文件夹获取...')
    const foldersResponse = await fetch(`http://localhost:3000/api/folders?spaceId=${testSpace.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('文件夹响应状态:', foldersResponse.status)
    const foldersResult = await foldersResponse.json()
    console.log(`文件夹数量: ${Array.isArray(foldersResult) ? foldersResult.length : '响应格式异常'}`)
    
    // 5. 验证结果
    console.log('\n📊 测试结果总结:')
    console.log(`✅ 登录状态: 已登录`)
    console.log(`✅ 空间访问: 直接访问加密空间`)
    console.log(`✅ 书签加载: ${bookmarksResponse.status === 200 ? '成功' : '失败'}`)
    console.log(`✅ 文件夹加载: ${foldersResponse.status === 200 ? '成功' : '失败'}`)
    
    if (bookmarksResponse.status === 200 && foldersResponse.status === 200) {
      console.log('\n🎉 测试通过！已登录用户可以直接访问加密空间，无需密码验证')
    } else {
      console.log('\n❌ 测试失败，可能需要密码验证')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testLoginEncryptedSpace()