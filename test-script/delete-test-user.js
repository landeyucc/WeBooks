const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEST_USER_ID = 'e123bdfa-c287-4068-9ea2-d1ebef8a11ed';

async function deleteTestUser() {
  console.log('🗑️  开始删除测试用户及其所有关联数据...\n');
  console.log(`目标用户ID: ${TEST_USER_ID}\n`);
  
  try {
    // 先查看该用户的数据
    console.log('📊 查找测试用户...');
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
      include: {
        spaces: { select: { id: true, name: true } },
        folders: { select: { id: true, name: true } },
        bookmarks: { select: { id: true, title: true } },
        systemConfig: { select: { id: true } }
      }
    });
    
    if (!user) {
      console.log('❌ 未找到该用户');
      return;
    }
    
    console.log(`✅ 找到用户: ${user.username}\n`);
    
    if (user.spaces.length > 0) {
      console.log(`   空间 (${user.spaces.length}个):`);
      user.spaces.forEach(s => console.log(`      - ${s.name} (${s.id})`));
    }
    
    if (user.folders.length > 0) {
      console.log(`   文件夹 (${user.folders.length}个)`);
    }
    
    if (user.bookmarks.length > 0) {
      console.log(`   书签 (${user.bookmarks.length}个)`);
    }
    
    if (user.systemConfig) {
      console.log(`   系统配置: ${user.systemConfig.id}`);
    }
    
    console.log('\n⚠️  准备删除所有关联数据...\n');
    
    // 使用事务删除所有关联数据（Prisma会自动处理级联删除）
    // 但我们需要先删除有外键约束的记录
    
    // 1. 删除书签
    const deletedBookmarks = await prisma.bookmark.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    console.log(`   ✅ 删除书签: ${deletedBookmarks.count} 条`);
    
    // 2. 删除文件夹
    const deletedFolders = await prisma.folder.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    console.log(`   ✅ 删除文件夹: ${deletedFolders.count} 条`);
    
    // 3. 删除空间
    const deletedSpaces = await prisma.space.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    console.log(`   ✅ 删除空间: ${deletedSpaces.count} 条`);
    
    // 4. 删除系统配置
    const deletedConfig = await prisma.systemConfig.deleteMany({
      where: { userId: TEST_USER_ID }
    });
    console.log(`   ✅ 删除系统配置: ${deletedConfig.count} 条`);
    
    // 5. 最后删除用户
    const deletedUser = await prisma.user.delete({
      where: { id: TEST_USER_ID }
    });
    console.log(`   ✅ 删除用户: ${deletedUser.username}\n`);
    
    console.log('🎉 测试用户及其所有关联数据已成功删除！\n');
    
  } catch (error) {
    console.error('❌ 删除失败:', error.message);
    console.error('\n🔍 错误详情:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

deleteTestUser();
