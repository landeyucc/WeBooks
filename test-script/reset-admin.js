const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function resetAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('正在重置管理员密码...');
    
    // 删除现有的admin用户
    await prisma.user.deleteMany({
      where: { username: 'admin' }
    });
    
    // 创建新的管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        email: 'admin@example.com'
      }
    });
    
    console.log('✓ 管理员用户重置成功');
    console.log('用户名:', adminUser.username);
    console.log('密码哈希值:', adminUser.passwordHash);
    
    // 验证密码
    const isMatch = await bcrypt.compare('admin123', adminUser.passwordHash);
    console.log('密码验证结果:', isMatch ? '✓ 成功' : '✗ 失败');
    
    console.log('\n重置完成！您现在可以使用以下凭据登录:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    
  } catch (error) {
    console.error('重置过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();