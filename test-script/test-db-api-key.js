const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testApiKey() {
  try {
    console.log('测试数据库连接...')
    
    // 测试数据库连接
    const users = await prisma.user.findMany()
    console.log(`✅ 数据库连接成功，用户数量: ${users.length}`)
    
    // 检查是否有 SystemConfig
    const systemConfigs = await prisma.systemConfig.findMany()
    console.log(`SystemConfig 数量: ${systemConfigs.length}`)
    
    if (systemConfigs.length > 0) {
      console.log('\n已有的 API Key:')
      systemConfigs.forEach((config, index) => {
        const maskedKey = config.apiKey ? config.apiKey.substring(0, 12) + '...' : '无'
        console.log(`${index + 1}. UserID: ${config.userId}`)
        console.log(`   API Key: ${maskedKey}`)
        console.log(`   创建时间: ${config.createdAt}`)
      })
    } else {
      console.log('\n❌ 数据库中没有 SystemConfig，请先生成 API Key')
    }
    
    // 验证一个特定的 API Key（如果有的话）
    const apiKeyFromEnv = process.env.API_KEY
    if (apiKeyFromEnv) {
      console.log(`\n验证传入的 API Key: ${apiKeyFromEnv.substring(0, 12)}...`)
      const config = await prisma.systemConfig.findFirst({
        where: { apiKey: apiKeyFromEnv }
      })
      
      if (config) {
        console.log('✅ API Key 有效')
        console.log(`   对应用户ID: ${config.userId}`)
      } else {
        console.log('❌ API Key 无效或不存在')
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testApiKey()
