const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const spaces = await prisma.space.findMany({ 
      include: { _count: { select: { folders: true } } } 
    });
    console.log('空间列表:');
    spaces.forEach(s => {
      console.log('ID:', s.id);
      console.log('名称:', s.name);
      console.log('文件夹数:', s._count.folders);
      console.log('---');
    });
    
    const folders = await prisma.folder.findMany({ 
      include: { space: { select: { name: true } } } 
    });
    console.log('\n文件夹列表:');
    folders.forEach(f => {
      console.log('ID:', f.id);
      console.log('名称:', f.name);
      console.log('空间:', f.space.name);
      console.log('---');
    });
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();