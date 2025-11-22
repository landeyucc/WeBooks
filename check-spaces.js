const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpaces() {
  try {
    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        isEncrypted: true,
        passwordHash: true,
        description: true,
        createdAt: true
      }
    });
    
    console.log('=== 现有空间数据 ===');
    if (spaces.length === 0) {
      console.log('没有找到任何空间');
    } else {
      spaces.forEach((space, index) => {
        console.log((index + 1) + '. ID: ' + space.id);
        console.log('   名称: ' + space.name);
        console.log('   是否加密: ' + space.isEncrypted);
        console.log('   密码哈希存在: ' + (space.passwordHash ? '是' : '否'));
        console.log('   密码哈希长度: ' + (space.passwordHash ? space.passwordHash.length : 0));
        console.log('   描述: ' + (space.description || '无'));
        console.log('   创建时间: ' + space.createdAt);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpaces();