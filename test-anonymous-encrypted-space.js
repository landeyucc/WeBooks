const API_BASE = 'http://localhost:3000';

// 测试未登录用户访问加密空间的情况
async function testAnonymousAccess() {
  console.log('开始测试未登录用户访问加密空间...');
  
  try {
    // 1. 获取空间列表
    const spacesResponse = await fetch(`${API_BASE}/api/spaces`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const spacesResult = await spacesResponse.json();
    console.log('空间列表获取结果:', {
      status: spacesResponse.status,
      success: spacesResult.success,
      spaceCount: spacesResult.spaces?.length || 0
    });
    
    // 查找加密空间
    const encryptedSpaces = spacesResult.spaces?.filter(space => space.isEncrypted) || [];
    console.log(`找到 ${encryptedSpaces.length} 个加密空间:`);
    
    if (encryptedSpaces.length === 0) {
      console.log('没有找到加密空间，测试结束');
      return;
    }
    
    const encryptedSpace = encryptedSpaces[0];
    console.log(`测试空间: ${encryptedSpace.name} (ID: ${encryptedSpace.id})`);
    
    // 2. 尝试访问加密空间的书签（应该返回401）
    console.log('\n测试访问加密空间的书签...');
    const bookmarksResponse = await fetch(`${API_BASE}/api/bookmarks?spaceId=${encryptedSpace.id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`书签访问状态: ${bookmarksResponse.status}`);
    if (bookmarksResponse.status === 401) {
      const errorData = await bookmarksResponse.json();
      console.log('书签访问被拒绝:', errorData.error);
    } else {
      console.log('书签访问返回非401状态，可能有问题');
    }
    
    // 3. 尝试访问加密空间的文件夹（应该返回401）
    console.log('\n测试访问加密空间的文件夹...');
    const foldersResponse = await fetch(`${API_BASE}/api/folders?spaceId=${encryptedSpace.id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`文件夹访问状态: ${foldersResponse.status}`);
    if (foldersResponse.status === 401) {
      const errorData = await foldersResponse.json();
      console.log('文件夹访问被拒绝:', errorData.error);
    } else {
      console.log('文件夹访问返回非401状态，可能有问题');
    }
    
    // 4. 测试密码验证API（应该返回401，因为未登录）
    console.log('\n测试密码验证API...');
    const passwordResponse = await fetch(`${API_BASE}/api/spaces/${encryptedSpace.id}/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: 'test' })
    });
    
    console.log(`密码验证状态: ${passwordResponse.status}`);
    const passwordResult = await passwordResponse.json();
    console.log('密码验证结果:', passwordResult);
    
    // 5. 总结测试结果
    console.log('\n=== 测试总结 ===');
    const bookmarksBlocked = bookmarksResponse.status === 401;
    const foldersBlocked = foldersResponse.status === 401;
    const passwordApiBlocked = passwordResponse.status === 401;
    
    if (bookmarksBlocked && foldersBlocked && passwordApiBlocked) {
      console.log('✅ 测试通过：未登录用户无法访问加密空间内容');
      console.log('✅ 密码验证API正确拒绝未登录用户');
    } else {
      console.log('❌ 测试失败：未登录用户仍能访问某些内容');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testAnonymousAccess()