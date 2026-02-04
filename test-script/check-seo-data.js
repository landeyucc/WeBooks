const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSeoData() {
  console.log('🔍 检查数据库中的SEO数据...\n');
  
  try {
    const systemConfigs = await prisma.systemConfig.findMany({
      select: {
        id: true,
        userId: true,
        siteTitle: true,
        faviconUrl: true,
        seoDescription: true,
        keywords: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`✅ 系统配置表: ${systemConfigs.length} 条记录\n`);
    
    if (systemConfigs.length > 0) {
      systemConfigs.forEach((config, index) => {
        console.log(`配置 ${index + 1}:`);
        console.log(`  ID: ${config.id}`);
        console.log(`  UserID: ${config.userId}`);
        console.log(`  siteTitle: "${config.siteTitle || '(null/空)'}"`);
        console.log(`  faviconUrl: "${config.faviconUrl || '(null/空)'}"`);
        console.log(`  seoDescription: "${config.seoDescription || '(null/空)'}"`);
        console.log(`  keywords: "${config.keywords || '(null/空)'}"`);
        console.log(`  createdAt: ${config.createdAt}`);
        console.log(`  updatedAt: ${config.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  没有找到任何系统配置记录！');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeoData();
