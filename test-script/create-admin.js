const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // 创建管理员用户
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        email: 'admin@example.com'
      }
    });
    
    console.log('管理员用户创建成功:', adminUser);
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();