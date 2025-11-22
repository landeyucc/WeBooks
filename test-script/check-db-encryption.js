const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库结构和加密字段...');
    
    // 检查Space表结构
    const spaces = await prisma.space.findMany({
      take: 1,
      include: {
        _count: {
          select: { bookmarks: true, folders: true }
        }
      }
    });
    
    if (spaces.length > 0) {
      console.log('Space表结构:', Object.keys(spaces[0]));
      console.log('是否包含加密字段:', {
        hasIsEncrypted: 'isEncrypted' in spaces[0],
        hasPasswordHash: 'passwordHash' in spaces[0],
        hasPassword: 'password' in spaces[0]
      });
      
      // 检查是否有加密空间
      const encryptedSpaces = await prisma.space.findMany({
        where: { isEncrypted: true }
      });
      console.log('加密空间数量:', encryptedSpaces.length);
      
      if (encryptedSpaces.length > 0) {
        console.log('加密空间示例:', encryptedSpaces[0].name);
      }
      
      // 显示前几个空间的详细信息
      console.log('\n📋 所有空间概览:');
      const allSpaces = await prisma.space.findMany({
        select: { id: true, name: true, isEncrypted: true, createdAt: true }
      });
      
      allSpaces.forEach((space, index) => {
        console.log(`${index + 1}. ${space.name} (ID: ${space.id}) - 加密: ${space.isEncrypted ? '是' : '否'}`);
      });
    } else {
      console.log('没有找到空间数据');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('数据库检查失败:', error);
    await prisma.$disconnect();
  }
}

checkDatabase();