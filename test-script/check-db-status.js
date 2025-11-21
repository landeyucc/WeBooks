const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 检查数据库状态...\n');
  
  try {
    // 检查数据库连接
    console.log('🔗 数据库连接状态:');
    
    // 检查用户表
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✅ 用户表: ${users.length} 条记录`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.username} (${user.email || '无邮箱'}) - ${user.id}`);
      });
    }
    
    // 检查空间表
    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✅ 空间表: ${spaces.length} 条记录`);
    
    if (spaces.length > 0) {
      spaces.forEach((space, index) => {
        console.log(`      ${index + 1}. ${space.name} (${space.description || '无描述'}) - ${space.id}`);
      });
    }
    
    // 检查文件夹表
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        spaceId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✅ 文件夹表: ${folders.length} 条记录`);
    
    if (folders.length > 0) {
      folders.forEach((folder, index) => {
        console.log(`      ${index + 1}. ${folder.name} (${folder.description || '无描述'}) - ${folder.id}`);
      });
    }
    
    // 检查书签表
    const bookmarks = await prisma.bookmark.findMany({
      select: {
        id: true,
        title: true,
        url: true,
        userId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✅ 书签表: ${bookmarks.length} 条记录`);
    
    if (bookmarks.length > 0) {
      bookmarks.forEach((bookmark, index) => {
        console.log(`      ${index + 1}. ${bookmark.title} (${bookmark.url}) - ${bookmark.id}`);
      });
    }
    
    // 检查系统配置表
    const systemConfigs = await prisma.systemConfig.findMany({
      select: {
        id: true,
        userId: true,
        siteTitle: true,
        faviconUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`   ✅ 系统配置表: ${systemConfigs.length} 条记录`);
    
    if (systemConfigs.length > 0) {
      systemConfigs.forEach((config, index) => {
        console.log(`      ${index + 1}. ${config.siteTitle || '无标题'} (${config.userId}) - ${config.id}`);
      });
    }
    
    // 总结
    console.log('\n📊 数据库状态总结:');
    const totalRecords = users.length + spaces.length + folders.length + bookmarks.length + systemConfigs.length;
    console.log(`   总记录数: ${totalRecords} 条`);
    
    if (totalRecords === 0) {
      console.log('   📭 数据库为空，建议运行以下命令创建测试数据:');
      console.log('      - node test-script/create-admin.js (创建管理员)');
      console.log('      - node test-script/check-and-fix-user.js (创建完整示例数据)');
    } else if (users.length > 0) {
      console.log('   📊 数据状态良好，可以正常使用应用');
    }
    
  } catch (error) {
    console.error('❌ 检查数据库状态失败:', error.message);
    console.error('\n🔍 错误详情:', error);
    
    // 如果是连接错误，提供帮助信息
    if (error.code === 'P1001') {
      console.log('\n💡 可能的原因:');
      console.log('   - 数据库未启动');
      console.log('   - DATABASE_URL 环境变量未设置');
      console.log('   - 数据库连接配置错误');
      console.log('\n🔧 解决方案:');
      console.log('   1. 检查 .env 文件中的 DATABASE_URL');
      console.log('   2. 确保数据库服务正在运行');
      console.log('   3. 运行 "npm run prisma:push" 初始化数据库结构');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabaseStatus();
}

module.exports = { checkDatabaseStatus };