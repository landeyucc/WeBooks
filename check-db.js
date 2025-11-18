const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    console.log('检查数据库状态...');
    
    const users = await prisma.user.findMany();
    console.log(`找到 ${users.length} 个用户`);
    users.forEach(u => console.log('- ID:', u.id, '用户名:', u.username));
    
    if (users.length > 0) {
      const spaces = await prisma.space.findMany({ 
        where: { userId: users[0].id },
        orderBy: { createdAt: 'asc' }
      });
      console.log(`\n用户 "${users[0].username}" 的空间数量: ${spaces.length}`);
      spaces.forEach(s => console.log('- 空间:', s.name));
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();