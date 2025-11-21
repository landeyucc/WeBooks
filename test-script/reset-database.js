const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  开始重置数据库...\n');
  
  try {
    // 读取用户输入确认
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('⚠️  警告：这将删除数据库中的所有数据！这个操作不可撤销。\n确认要继续吗？(输入 "yes" 确认，其他任意键取消): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消');
      return;
    }
    
    console.log('\n✅ 开始清空数据库...\n');
    
    // 按外键约束顺序删除数据
    console.log('🗑️  删除书签数据...');
    const bookmarksCount = await prisma.bookmark.deleteMany();
    console.log(`   已删除 ${bookmarksCount.count} 条书签记录`);
    
    console.log('🗑️  删除文件夹数据...');
    const foldersCount = await prisma.folder.deleteMany();
    console.log(`   已删除 ${foldersCount.count} 条文件夹记录`);
    
    console.log('🗑️  删除空间数据...');
    const spacesCount = await prisma.space.deleteMany();
    console.log(`   已删除 ${spacesCount.count} 条空间记录`);
    
    console.log('🗑️  删除系统配置数据...');
    const configsCount = await prisma.systemConfig.deleteMany();
    console.log(`   已删除 ${configsCount.count} 条系统配置记录`);
    
    console.log('🗑️  删除用户数据...');
    const usersCount = await prisma.user.deleteMany();
    console.log(`   已删除 ${usersCount.count} 条用户记录`);
    
    console.log('\n✅ 数据库重置完成！\n');
    
    // 显示重置统计
    console.log('📊 重置统计:');
    console.log(`   - 书签: ${bookmarksCount.count} 条`);
    console.log(`   - 文件夹: ${foldersCount.count} 条`);
    console.log(`   - 空间: ${spacesCount.count} 条`);
    console.log(`   - 系统配置: ${configsCount.count} 条`);
    console.log(`   - 用户: ${usersCount.count} 条`);
    console.log(`   - 总计: ${bookmarksCount.count + foldersCount.count + spacesCount.count + configsCount.count + usersCount.count} 条记录`);
    
    console.log('\n💡 提示:');
    console.log('   - 数据库已清空，可以开始重新导入测试数据');
    console.log('   - 运行 "node test-script/check-and-fix-user.js" 创建管理员用户');
    console.log('   - 或运行 "node test-script/create-admin.js" 直接创建管理员');
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error.message);
    console.error('\n🔍 错误详情:', error);
    
    // 如果是连接错误，提供一些帮助信息
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
  resetDatabase();
}

module.exports = { resetDatabase };