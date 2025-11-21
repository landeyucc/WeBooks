const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

async function checkAndFixUser() {
  try {
    console.log('正在检查数据库中的用户...');
    
    // 获取所有用户
    const users = await prisma.user.findMany();
    console.log(`找到 ${users.length} 个用户`);
    
    if (users.length === 0) {
      console.log('没有用户，正在创建管理员用户...');
      
      // 创建管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: hashedPassword,
          email: 'admin@example.com'
        }
      });
      
      console.log('✅ 管理员用户创建成功:');
      console.log('  用户ID:', user.id);
      console.log('  用户名: admin');
      console.log('  密码: admin123');
      
      // 创建一些示例数据
      await createSampleData(user.id);
      
    } else {
      console.log('找到用户:');
      users.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}`);
      });
      
      const user = users[0];
      console.log('\n正在为现有用户创建示例数据...');
      await createSampleData(user.id);
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleData(userId) {
  try {
    // 创建空间
    const space1 = await prisma.space.create({
      data: {
        name: '工作空间',
        description: '我的工作相关书签',
        iconUrl: 'https://via.placeholder.com/32x32/4F46E5/FFFFFF?text=W',
        systemCardUrl: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6b21d?w=400&h=600&fit=crop&crop=center',
        userId: userId
      }
    });

    console.log('✅ 创建工作空间成功');
    
    // 创建或更新默认系统配置
    await prisma.systemConfig.upsert({
      where: { userId: userId },
      update: {
        defaultSpaceId: space1.id,
        siteTitle: '我的书签管理',
        faviconUrl: '/favicon.ico'
      },
      create: {
        userId: userId,
        defaultSpaceId: space1.id,
        siteTitle: '我的书签管理',
        faviconUrl: '/favicon.ico'
      }
    });
    
    console.log('✅ 创建系统配置成功');
    
    // 测试token生成
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ 生成的登录token:', token);
    
  } catch (error) {
    console.error('创建示例数据失败:', error);
  }
}

checkAndFixUser();