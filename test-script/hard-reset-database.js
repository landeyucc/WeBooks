const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function hardResetDatabase() {
  console.log('💥 数据库完全重置开始...\n');
  
  try {
    // 读取用户输入确认
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('💥 警告：这将进行数据库完全重置！\n这会删除所有数据并重新创建数据库结构。\n这个操作不可撤销！\n\n确认要继续吗？(输入 "reset" 确认，其他任意键取消): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'reset') {
      console.log('❌ 操作已取消');
      return;
    }
    
    console.log('\n🚀 开始完全重置数据库...\n');
    
    // 第一步：删除所有数据
    console.log('📝 步骤 1/3: 清空所有数据...');
    await deleteAllData();
    
    // 第二步：删除并重新创建数据库结构
    console.log('\n🏗️  步骤 2/3: 重新创建数据库结构...');
    await resetDatabaseSchema();
    
    // 第三步：验证重置结果
    console.log('\n✅ 步骤 3/3: 验证重置结果...');
    await verifyReset();
    
    console.log('\n🎉 数据库完全重置成功！\n');
    
    console.log('📋 重置完成后的步骤:');
    console.log('   1. 运行 "node test-script/create-admin.js" 创建管理员用户');
    console.log('   2. 或运行 "node test-script/check-and-fix-user.js" 创建完整的示例数据');
    console.log('   3. 启动开发服务器: "npm run dev"');
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error.message);
    console.error('\n🔍 错误详情:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已断开');
  }
}

async function deleteAllData() {
  try {
    console.log('   🗑️  清空书签...');
    const bookmarksCount = await prisma.bookmark.deleteMany();
    console.log(`      已删除 ${bookmarksCount.count} 条记录`);
    
    console.log('   🗑️  清空文件夹...');
    const foldersCount = await prisma.folder.deleteMany();
    console.log(`      已删除 ${foldersCount.count} 条记录`);
    
    console.log('   🗑️  清空空间...');
    const spacesCount = await prisma.space.deleteMany();
    console.log(`      已删除 ${spacesCount.count} 条记录`);
    
    console.log('   🗑️  清空系统配置...');
    const configsCount = await prisma.systemConfig.deleteMany();
    console.log(`      已删除 ${configsCount.count} 条记录`);
    
    console.log('   🗑️  清空用户...');
    const usersCount = await prisma.user.deleteMany();
    console.log(`      已删除 ${usersCount.count} 条记录`);
    
    console.log('   ✅ 所有数据清空完成');
  } catch (error) {
    throw new Error(`清空数据时出错: ${error.message}`);
  }
}

async function resetDatabaseSchema() {
  try {
    console.log('   🏗️  删除数据库表结构...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('   ✅ 数据库结构重建完成');
  } catch {
    console.log('   ⚠️  尝试使用 db push...');
    try {
      execSync('npx prisma db push', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('   ✅ 数据库结构更新完成');
    } catch (pushError) {
      throw new Error(`重置数据库结构失败: ${pushError.message}`);
    }
  }
}

async function verifyReset() {
  try {
    // 检查是否能够正常连接和查询
    const users = await prisma.user.findMany();
    const spaces = await prisma.space.findMany();
    const bookmarks = await prisma.bookmark.findMany();
    const folders = await prisma.folder.findMany();
    
    console.log('   📊 数据库状态检查:');
    console.log(`      用户: ${users.length} 条`);
    console.log(`      空间: ${spaces.length} 条`);
    console.log(`      书签: ${bookmarks.length} 条`);
    console.log(`      文件夹: ${folders.length} 条`);
    
    if (users.length === 0 && spaces.length === 0 && bookmarks.length === 0 && folders.length === 0) {
      console.log('   ✅ 数据库重置验证通过');
    } else {
      console.log('   ⚠️  注意: 数据库中仍存在一些数据');
    }
  } catch (error) {
    throw new Error(`验证重置结果时出错: ${error.message}`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  hardResetDatabase();
}

module.exports = { hardResetDatabase };