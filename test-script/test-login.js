const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function testLogin() {
  const prisma = new PrismaClient();
  
  try {
    // 查询管理员用户
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('✗ 未找到管理员用户');
      return;
    }
    
    console.log('数据库中的管理员用户:');
    console.log('用户名:', adminUser.username);
    console.log('密码哈希值:', adminUser.passwordHash);
    
    // 测试多个可能的密码
    const passwords = ['admin123', 'password', '123456', 'admin'];
    
    for (const password of passwords) {
      const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
      console.log(`密码 "${password}" 是否匹配: ${isMatch ? '✓' : '✗'}`);
      
      if (isMatch) {
        console.log(`\n✓ 找到匹配的密码: ${password}`);
      }
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();