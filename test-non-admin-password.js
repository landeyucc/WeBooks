const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testNonAdminPassword() {
  try {
    // 1. 创建一个普通用户
    console.log('=== 创建普通用户 ===');
    const regularPassword = 'user123456';
    const hashedPassword = await bcrypt.hash(regularPassword, 10);
    
    // 先检查是否已存在该用户，如果存在则删除
    const existingUser = await prisma.user.findUnique({
      where: { username: 'regularuser2' }
    });
    
    if (existingUser) {
      console.log('删除已存在的用户...');
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
    }
    
    const regularUser = await prisma.user.create({
      data: {
        username: 'regularuser2',
        passwordHash: hashedPassword,
        email: 'user2@example.com'
      }
    });
    
    console.log('已创建普通用户:', regularUser.username);
    console.log('用户ID:', regularUser.id);
    
    // 2. 为该用户创建一个加密空间
    console.log('\n=== 为普通用户创建加密空间 ===');
    const spacePassword = 'space123';
    const spacePasswordHash = await bcrypt.hash(spacePassword, 10);
    
    const userSpace = await prisma.space.create({
      data: {
        name: '普通用户加密空间',
        description: '这是普通用户的加密空间',
        userId: regularUser.id,
        isEncrypted: true,
        passwordHash: spacePasswordHash
      }
    });
    
    console.log('已创建空间:', userSpace.name);
    console.log('空间ID:', userSpace.id);
    
    // 3. 以普通用户身份登录
    console.log('\n=== 普通用户登录 ===');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'regularuser2', 
        password: regularPassword
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('登录状态:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.log('登录失败:', loginData);
      return;
    }
    
    const authToken = loginData.token;
    console.log('获得认证令牌: 成功');
    
    // 4. 获取普通用户的空间
    console.log('\n=== 获取普通用户空间 ===');
    const spacesResponse = await fetch('http://localhost:3000/api/spaces', {
      headers: { 
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      }
    });
    
    const spacesData = await spacesResponse.json();
    console.log('获取空间状态:', spacesResponse.status);
    console.log('空间数据结构:', typeof spacesData, Array.isArray(spacesData) ? 'Array' : 'Object with spaces:', !!spacesData.spaces);
    
    let spacesArray = [];
    if (spacesResponse.ok) {
      spacesArray = Array.isArray(spacesData) ? spacesData : (spacesData.spaces || []);
      console.log('空间数量:', spacesArray.length);
      spacesArray.forEach((space, index) => {
        console.log((index + 1) + '. ' + space.name + ' (加密: ' + space.isEncrypted + ')');
      });
    }
    
    // 5. 测试密码验证功能（普通用户）
    console.log('\n=== 普通用户密码验证测试 ===');
    
    if (spacesArray && spacesArray.length > 0) {
      const userSpaceData = spacesArray[0];
      
      // 测试正确密码
      console.log('测试正确密码...');
      const verifyCorrect = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: spacePassword })
      });
      
      const resultCorrect = await verifyCorrect.json();
      console.log('正确密码验证结果:', verifyCorrect.status, resultCorrect);
      
      // 测试错误密码
      console.log('\n测试错误密码...');
      const verifyWrong = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: 'wrongpassword' })
      });
      
      const resultWrong = await verifyWrong.json();
      console.log('错误密码验证结果:', verifyWrong.status, resultWrong);
      
      // 测试空密码
      console.log('\n测试空密码...');
      const verifyEmpty = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id + '/verify-password', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: '' })
      });
      
      const resultEmpty = await verifyEmpty.json();
      console.log('空密码验证结果:', verifyEmpty.status, resultEmpty);
    }
    
    // 6. 测试修改空间密码
    console.log('\n=== 测试修改空间密码 ===');
    
    if (spacesArray && spacesArray.length > 0) {
      const userSpaceData = spacesArray[0];
      const newPassword = 'newpassword456';
      
      // 修改空间信息（包括密码）
      const updateResponse = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id, {
        method: 'PUT',
        headers: { 
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: '普通用户加密空间（已修改）',
          description: '密码已更新',
          isEncrypted: true,
          password: newPassword
        })
      });
      
      const updateResult = await updateResponse.json();
      console.log('修改空间状态:', updateResponse.status);
      
      if (updateResponse.ok) {
        console.log('空间修改成功');
        
        // 测试新密码
        console.log('\n测试新密码...');
        const verifyNew = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id + '/verify-password', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: newPassword })
        });
        
        const resultNew = await verifyNew.json();
        console.log('新密码验证结果:', verifyNew.status, resultNew);
        
        // 旧密码应该失效
        console.log('\n测试旧密码是否失效...');
        const verifyOld失效 = await fetch('http://localhost:3000/api/spaces/' + userSpaceData.id + '/verify-password', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: spacePassword })
        });
        
        const resultOld失效 = await verifyOld失效.json();
        console.log('旧密码验证结果（应该失败）:', verifyOld失效.status, resultOld失效);
      } else {
        console.log('空间修改失败:', updateResult);
      }
    }
    
  } catch (error) {
    console.error('测试过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNonAdminPassword();