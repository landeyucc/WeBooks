#!/usr/bin/env node

/**
 * 获取默认用户ID的脚本
 * 用于在Vercel部署时配置DEFAULT_USER_ID环境变量
 */

const { PrismaClient } = require('@prisma/client');

async function getDefaultUserId() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 正在查询数据库中的用户...\n');

    // 获取第一个用户（通常是管理员）
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 1
    });

    if (users.length === 0) {
      console.log('❌ 错误：数据库中没有找到任何用户');
      console.log('💡 请先创建管理员账户再部署到Vercel');
      return null;
    }

    const defaultUser = users[0];
    
    console.log('✅ 找到默认用户信息：');
    console.log(`📧 用户名: ${defaultUser.username || '未设置'}`);
    console.log(`📮 邮箱: ${defaultUser.email || '未设置'}`);
    console.log(`🆔 用户ID: ${defaultUser.id}`);
    console.log(`📅 创建时间: ${defaultUser.createdAt.toISOString()}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Vercel部署配置：');
    console.log('='.repeat(50));
    console.log(`变量名: DEFAULT_USER_ID`);
    console.log(`变量值: ${defaultUser.id}`);
    console.log('='.repeat(50));
    
    return defaultUser.id;
    
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
    console.log('\n💡 可能的原因：');
    console.log('1. 数据库连接失败');
    console.log('2. DATABASE_URL环境变量未正确配置');
    console.log('3. 数据库中没有任何用户表');
    
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
getDefaultUserId().then(userId => {
  if (userId) {
    console.log('\n🎉 配置成功！请将此用户ID添加到Vercel环境变量中。');
    process.exit(0);
  } else {
    console.log('\n⚠️  配置失败！请检查数据库连接并创建用户。');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 脚本执行错误:', error);
  process.exit(1);
});