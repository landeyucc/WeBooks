const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteSpace() {
  try {
    console.log('=== 测试删除空间功能 ===');
    
    // 获取所有空间
    const spaces = await prisma.space.findMany({
      include: { user: true }
    });
    
    console.log('\n当前数据库中的空间:');
    spaces.forEach((space, index) => {
      console.log(`${index + 1}. ${space.name} (ID: ${space.id}) - 用户: ${space.user.username}`);
    });
    
    if (spaces.length === 0) {
      console.log('\n没有空间可以删除测试');
      return;
    }
    
    // 选择第一个空间进行删除测试
    const spaceToDelete = spaces[0];
    console.log(`\n准备删除空间: ${spaceToDelete.name} (ID: ${spaceToDelete.id})`);
    
    // 先检查空间及其关联数据
    const spaceWithCounts = await prisma.space.findUnique({
      where: { id: spaceToDelete.id },
      include: {
        _count: {
          select: {
            bookmarks: true,
            folders: true
          }
        }
      }
    });
    
    console.log(`空间信息: 书签数量=${spaceWithCounts._count.bookmarks}, 文件夹数量=${spaceWithCounts._count.folders}`);
    
    // 执行删除前的统计
    const bookmarkCount = await prisma.bookmark.count({ where: { spaceId: spaceToDelete.id } });
    const folderCount = await prisma.folder.count({ where: { spaceId: spaceToDelete.id } });
    
    console.log(`\n删除前统计: 书签=${bookmarkCount}, 文件夹=${folderCount}`);
    
    // 模拟删除操作（实际项目中这会通过API完成）
    console.log('\n执行删除操作...');
    
    await prisma.$transaction(async (tx) => {
      // 先删除关联的收藏夹
      if (folderCount > 0) {
        await tx.bookmark.deleteMany({
          where: {
            folder: {
              spaceId: spaceToDelete.id
            }
          }
        });
        
        await tx.folder.deleteMany({
          where: {
            spaceId: spaceToDelete.id
          }
        });
      }

      // 删除剩余的收藏夹（不在文件夹中的）
      await tx.bookmark.deleteMany({
        where: {
          spaceId: spaceToDelete.id
        }
      });

      // 删除空间
      await tx.space.delete({
        where: {
          id: spaceToDelete.id
        }
      });
    });
    
    console.log(`✅ 空间 "${spaceToDelete.name}" 删除成功`);
    
    // 验证删除结果
    const remainingSpaces = await prisma.space.findMany();
    console.log(`\n删除后剩余空间数量: ${remainingSpaces.length}`);
    
    // 重新创建一个测试空间用于演示
    console.log('\n创建新的测试空间...');
    const testSpace = await prisma.space.create({
      data: {
        name: '测试删除空间',
        description: '这是一个用于测试删除功能的临时空间',
        userId: spaceToDelete.userId
      }
    });
    
    console.log(`✅ 创建测试空间成功: ${testSpace.name} (ID: ${testSpace.id})`);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n=== 测试完成 ===');
  }
}

testDeleteSpace();