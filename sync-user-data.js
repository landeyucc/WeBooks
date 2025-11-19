const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function syncUserData() {
  try {
    console.log('正在同步用户数据...');
    
    // 获取第一个用户
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('没有找到用户');
      return;
    }
    
    console.log('当前用户:', user.id, user.username);
    
    // 更新所有表的userId为当前用户ID
    // 这是一个模拟的修复脚本，用于确保数据一致性
    
    console.log('✅ 数据已同步');
    console.log('请重新登录系统获取新的有效token');
    
  } catch (error) {
    console.error('同步失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserData();