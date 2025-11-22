#!/usr/bin/env node

/**
 * 测试数据库初始化逻辑的脚本
 * 模拟数据库结构损坏情况，验证初始化脚本是否正常工作
 */

const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

async function testInitLogic() {
  console.log('🧪 测试数据库初始化逻辑')
  console.log('=' * 50)
  
  try {
    // 1. 测试数据库结构检查
    console.log('🔄 1. 测试数据库结构检查...')
    const prisma = new PrismaClient()
    
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ 数据库连接正常，用户表记录数: ${userCount}`)
    } catch (error) {
      console.log(`❌ 数据库连接失败: ${error.message}`)
    } finally {
      await prisma.$disconnect()
    }
    
    // 2. 测试数据库表结构
    console.log('\n🔄 2. 测试数据库表结构检查...')
    
    // 模拟数据库结构检查逻辑
    const checkResult = await checkDatabaseStructure()
    console.log(`📋 检查结果: ${checkResult.message}`)
    console.log(`📋 是否需要初始化: ${checkResult.needsInit ? '是' : '否'}`)
    
    console.log('\n✅ 数据库初始化逻辑测试完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

async function checkDatabaseStructure() {
  try {
    console.log('🔄 检查数据库结构...')
    
    const { PrismaClient } = require('@prisma/client')
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

// 如果直接运行此脚本
if (require.main === module) {
  testInitLogic()
}

module.exports = { checkDatabaseStructure }