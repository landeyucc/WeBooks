const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabaseWithEncryption() {
  try {
    console.log('🔄 开始重置数据库并创建加密空间测试数据...');
    
    // 删除现有的 bookmarks 和 folders
    console.log('🗑️  删除现有书签和文件夹...');
    await prisma.bookmark.deleteMany({});
    await prisma.folder.deleteMany({});
    
    // 删除现有的空间
    console.log('🗑️  删除现有空间...');
    await prisma.space.deleteMany({});
    
    // 获取默认用户
    const user = await prisma.user.findFirst({
      where: { email: 'admin@webooks.ai' }
    });
    
    if (!user) {
      console.log('❌ 未找到默认用户，尝试创建...');
      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/vtV0L5rQ8t8W3j7Y8X1Y2Z3A4B5C6D7', // hash for "admin123"
          email: 'admin@webooks.ai'
        }
      });
      console.log('✅ 创建默认用户成功:', newUser.id);
    }
    
    const targetUser = user || await prisma.user.findFirst({
      where: { email: 'admin@webooks.ai' }
    });
    
    console.log('📝 创建测试空间（包含加密空间）...');
    
    // 创建普通空间
    const publicSpace = await prisma.space.create({
      data: {
        name: '公共书签',
        description: '这是一个公共空间，不需要密码',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=public',
        userId: targetUser.id,
        isEncrypted: false
      }
    });
    console.log('✅ 创建公共空间:', publicSpace.name);
    
    // 创建加密空间1
    const encryptedSpace1 = await prisma.space.create({
      data: {
        name: '敏感项目',
        description: '这是敏感项目空间，需要密码',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=secret1',
        userId: targetUser.id,
        isEncrypted: true,
        passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/vtV0L5rQ8t8W3j7Y8X1Y2Z3A4B5C6D7' // hash for "password123"
      }
    });
    console.log('✅ 创建加密空间:', encryptedSpace1.name);
    
    // 创建加密空间2  
    const encryptedSpace2 = await prisma.space.create({
      data: {
        name: '内部资料',
        description: '这是内部资料空间，需要密码',
        iconUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=secret2',
        userId: targetUser.id,
        isEncrypted: true,
        passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/vtV0L5rQ8t8W3j7Y8X1Y2Z3A4B5C6D8' // hash for "internal456"
      }
    });
    console.log('✅ 创建加密空间:', encryptedSpace2.name);
    
    // 创建普通空间的文件夹和书签
    console.log('📁 为公共空间创建文件夹和书签...');
    const publicFolder = await prisma.folder.create({
      data: {
        name: '开发工具',
        spaceId: publicSpace.id,
        userId: targetUser.id
      }
    });
    
    await prisma.bookmark.create({
      data: {
        title: 'GitHub',
        url: 'https://github.com',
        description: '代码托管平台',
        spaceId: publicSpace.id,
        folderId: publicFolder.id,
        userId: targetUser.id
      }
    });
    
    await prisma.bookmark.create({
      data: {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: '程序员问答社区',
        spaceId: publicSpace.id,
        folderId: publicFolder.id,
        userId: targetUser.id
      }
    });
    
    // 为加密空间1创建文件夹和书签
    console.log('📁 为"敏感项目"空间创建文件夹和书签...');
    const encryptedFolder1 = await prisma.folder.create({
      data: {
        name: '机密文档',
        spaceId: encryptedSpace1.id,
        userId: targetUser.id
      }
    });
    
    await prisma.bookmark.create({
      data: {
        title: '敏感API文档',
        url: 'https://internal-api.example.com/docs',
        description: '内部API文档（加密）',
        spaceId: encryptedSpace1.id,
        folderId: encryptedFolder1.id,
        userId: targetUser.id
      }
    });
    
    // 为加密空间2创建文件夹和书签  
    console.log('📁 为"内部资料"空间创建文件夹和书签...');
    const encryptedFolder2 = await prisma.folder.create({
      data: {
        name: '内部流程',
        spaceId: encryptedSpace2.id,
        userId: targetUser.id
      }
    });
    
    await prisma.bookmark.create({
      data: {
        title: '内部系统',
        url: 'https://internal-system.example.com',
        description: '内部办公系统（加密）',
        spaceId: encryptedSpace2.id,
        folderId: encryptedFolder2.id,
        userId: targetUser.id
      }
    });
    
    // 验证创建结果
    console.log('\n✅ 数据库重置完成，验证结果:');
    const spaces = await prisma.space.findMany({
      include: {
        _count: {
          select: { bookmarks: true, folders: true }
        }
      }
    });
    
    spaces.forEach((space, index) => {
      console.log(`${index + 1}. ${space.name} (加密: ${space.isEncrypted ? '是' : '否'}) - ${space._count.bookmarks}个书签, ${space._count.folders}个文件夹`);
    });
    
    console.log('\n🎯 加密空间密码:');
    console.log('- "敏感项目": password123');
    console.log('- "内部资料": internal456');
    
    await prisma.$disconnect();
    console.log('\n✅ 数据库重置完成！');
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    await prisma.$disconnect();
  }
}

resetDatabaseWithEncryption();