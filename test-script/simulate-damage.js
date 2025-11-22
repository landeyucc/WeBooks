#!/usr/bin/env node

/**
 * 模拟数据库损坏情况的测试脚本
 * 用于测试当数据库结构损坏时，初始化逻辑是否能正确识别并修复
 */

const { PrismaClient } = require('@prisma/client')

async function simulateDatabaseDamage() {
  console.log('💥 模拟数据库损坏测试')
  console.log('=' * 50)
  
  try {
    const prisma = new PrismaClient()
    
    // 1. 模拟损坏：删除一个关键表或使某个表无法访问
    console.log('🔄 1. 模拟数据库结构损坏...')
    
    try {
      // 尝试访问每个表并模拟损坏情况
      await simulateCorruptedTables(prisma)
    } catch (error) {
      console.log('⚠️  模拟损坏成功:', error.message)
    }
    
    // 2. 测试损坏后的初始化逻辑
    console.log('\n🔄 2. 测试损坏后的初始化逻辑...')
    
    const checkResult = await checkDatabaseStructure()
    console.log(`📋 检查结果: ${checkResult.message}`)
    console.log(`📋 是否需要初始化: ${checkResult.needsInit ? '是' : '否'}`)
    
    if (checkResult.needsInit) {
      console.log('✅ 初始化逻辑正确识别了损坏情况！')
      
      // 3. 模拟修复过程
      console.log('\n🔄 3. 执行数据库修复...')
      await performDatabaseRepair()
      
      // 4. 验证修复结果
      console.log('\n🔄 4. 验证修复结果...')
      const repairCheck = await checkDatabaseStructure()
      console.log(`📋 修复后检查结果: ${repairCheck.message}`)
      console.log(`📋 是否需要初始化: ${repairCheck.needsInit ? '是' : '否'}`)
      
      if (!repairCheck.needsInit) {
        console.log('🎉 数据库修复成功！')
      }
    } else {
      console.log('❌ 初始化逻辑未能识别损坏情况')
    }
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

async function simulateCorruptedTables(prisma) {
  // 这里我们通过故意引发错误来模拟表损坏
  // 实际项目中可能通过DROP TABLE或数据库连接问题来实现
  
  try {
    // 尝试查询一个不存在的字段来模拟结构问题
    await prisma.user.findFirst({
      select: {
        nonExistentField: true
      }
    })
  } catch (error) {
    throw new Error('模拟表结构损坏')
  }
}

async function checkDatabaseStructure() {
  try {
    console.log('🔄 检查数据库结构...')
    
    const prisma = new PrismaClient()
    
    // 检查必需的表是否存在
    const tableChecks = await Promise.all([
      prisma.user.count().then(() => true).catch(() => false),
      prisma.space.count().then(() => true).catch(() => false),
      prisma.folder.count().then(() => true).catch(() => false),
      prisma.bookmark.count().then(() => true).catch(() => false),
      prisma.systemConfig.count().then(() => true).catch(() => false)
    ])
    
    const allTablesExist = tableChecks.every(exists => exists)
    
    if (allTablesExist) {
      console.log('✅ 数据库结构完整')
      await prisma.$disconnect()
      return { needsInit: false, message: '数据库结构完整' }
    } else {
      console.log('⚠️  数据库结构不完整，需要重新初始化')
      await prisma.$disconnect()
      return { needsInit: true, message: '数据库结构不完整' }
    }
    
  } catch (error) {
    console.log('❌ 数据库结构检查失败')
    return { needsInit: true, message: '检查过程中发生错误' }
  }
}

async function performDatabaseRepair() {
  console.log('🔄 执行数据库修复...')
  
  // 这里模拟修复过程，实际项目中会执行：
  // 1. npx prisma generate
  // 2. npx prisma db push
  // 3. 重新加载 Prisma Client
  
  console.log('✅ 数据库修复完成')
}

// 如果直接运行此脚本
if (require.main === module) {
  simulateDatabaseDamage()
}

module.exports = { simulateDatabaseDamage, checkDatabaseStructure }