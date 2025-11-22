const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPasswordFlow() {
  try {
    // 1. 获取管理员用户信息
    console.log('=== 获取管理员用户 ===');
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('未找到管理员用户');
      return;
    }
    
    console.log('管理员用户ID: ' + adminUser.id);
    
    // 2. 登录获取认证令牌
    console.log('\n=== 登录获取令牌 ===');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'admin', 
        password: 'admin123' 
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('登录状态: ' + loginResponse.status);
    
    if (!loginResponse.ok) {
      console.log('登录失败:', loginData);
      return;
    }
    
    const authToken = loginData.token;
    console.log('获得认证令牌: ' + (authToken ? '成功' : '失败'));
    
    // 3. 获取空间列表
    console.log('\n=== 获取空间列表 ===');
    const spacesResponse = await fetch('http://localhost:3000/api/spaces', {
      headers: { 
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      }
    });
    
    const spacesData = await spacesResponse.json();
    console.log('获取空间状态: ' + spacesResponse.status);
    
    if (spacesResponse.ok) {
      console.log('空间响应数据:', JSON.stringify(spacesData, null, 2));
      // 获取空间数组（处理不同的响应格式）
      const spacesArray = Array.isArray(spacesData) ? spacesData : (spacesData.spaces || []);
      
      console.log('空间数量: ' + spacesArray.length);
      spacesArray.forEach((space, index) => {
        console.log((index + 1) + '. ' + space.name + ' (加密: ' + space.isEncrypted + ')');
      });
    } else {
      console.log('获取空间失败:', spacesData);
      return;
    }
    
    // 4. 测试密码验证功能
    console.log('\n=== 测试密码验证 ===');
    
    // 获取空间数组（处理不同的响应格式）
    const spacesArray = Array.isArray(spacesData) ? spacesData : (spacesData.spaces || []);
    
    // 获取公司机密空间的ID
    const companySpace = spacesArray.find(s => s.name === '公司机密');
    const sensitiveSpace = spacesArray.find(s => s.name === '敏感项目');
    
    if (companySpace) {
      console.log('测试公司机密空间密码验证...');
      
      // 正确密码
      const verifyResponse1 = await fetch('http://localhost:3000/api/spaces/' + companySpace.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'company123' })
      });
      
      const result1 = await verifyResponse1.json();
      console.log('公司机密空间（正确密码）验证结果: ' + verifyResponse1.status, result1);
      
      // 错误密码
      const verifyResponse2 = await fetch('http://localhost:3000/api/spaces/' + companySpace.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'wrongpassword' })
      });
      
      const result2 = await verifyResponse2.json();
      console.log('公司机密空间（错误密码）验证结果: ' + verifyResponse2.status, result2);
    }
    
    if (sensitiveSpace) {
      console.log('\n测试敏感项目空间密码验证...');
      
      // 正确密码（新密码）
      const verifyResponse3 = await fetch('http://localhost:3000/api/spaces/' + sensitiveSpace.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'newpassword456' })
      });
      
      const result3 = await verifyResponse3.json();
      console.log('敏感项目空间（新密码）验证结果: ' + verifyResponse3.status, result3);
      
      // 错误密码（旧密码）
      const verifyResponse4 = await fetch('http://localhost:3000/api/spaces/' + sensitiveSpace.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'oldpassword' })
      });
      
      const result4 = await verifyResponse4.json();
      console.log('敏感项目空间（旧密码）验证结果: ' + verifyResponse4.status, result4);
    }
    
    // 5. 测试管理员免验证功能
    console.log('\n=== 测试管理员免验证 ===');
    
    if (sensitiveSpace) {
      const adminVerifyResponse = await fetch('http://localhost:3000/api/spaces/' + sensitiveSpace.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'anypassword' })
      });
      
      const adminResult = await adminVerifyResponse.json();
      console.log('管理员验证结果（应该成功）: ' + adminVerifyResponse.status, adminResult);
    }
    
  } catch (error) {
    console.error('测试过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordFlow();