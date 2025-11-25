const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function generateApiKey() {
  const prisma = new PrismaClient();
  
  try {
    const systemConfig = await prisma.systemConfig.findFirst();
    if (systemConfig && systemConfig.apiKey) {
      console.log('找到API Key:', systemConfig.apiKey);
    } else {
      console.log('未找到API Key，正在为默认用户生成...');
      // 为默认用户生成API Key
      const randomString = crypto.randomBytes(16).toString('hex');
      const apiKey = 'webooks_' + randomString;
      
      await prisma.systemConfig.upsert({
        where: { userId: 'e123bdfa-c287-4068-9ea2-d1ebef8a11ed' },
        update: { apiKey },
        create: {
          userId: 'e123bdfa-c287-4068-9ea2-d1ebef8a11ed',
          apiKey: apiKey
        }
      });
      console.log('生成的API Key:', apiKey);
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generateApiKey();