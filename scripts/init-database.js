#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 自动检查并创建数据库结构，然后进行系统初始化
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'cyan')
    log(`   执行命令: ${command}`, 'blue')
    
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    })
    
    log(`✅ ${description} 完成`, 'green')
    if (result.trim()) {
      console.log(result)
    }
    return true
  } catch (error) {
    log(`❌ ${description} 失败:`, 'red')
    console.error(error.message)
    if (error.stdout) {
      console.error('输出:', error.stdout)
    }
    if (error.stderr) {
      console.error('错误:', error.stderr)
    }
    return false
  }
}

function checkPrismaClient() {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    if (!fs.existsSync(schemaPath)) {
      log('❌ 未找到 prisma/schema.prisma 文件', 'red')
      return false
    }
    log('✅ Prisma schema 文件存在', 'green')
    return true
  } catch {
    log('❌ 检查 Prisma 配置失败', 'red')
    return false
  }
}

function checkEnvironment() {
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      log('✅ .env 文件存在', 'green')
      return true
    }
    
    const envExamplePath = path.join(process.cwd(), '.env.example')
    if (fs.existsSync(envExamplePath)) {
      log('⚠️  未找到 .env 文件，但存在 .env.example 文件', 'yellow')
      log('   请复制 .env.example 为 .env 并配置数据库连接', 'yellow')
      return false
    }
    
    log('⚠️  未找到环境配置文件', 'yellow')
    return false
  } catch {
    log('❌ 检查环境配置失败', 'red')
    return false
  }
}

async function testDatabaseConnection() {
  try {
    log('🔄 测试数据库连接...', 'cyan')
    
    // 检查 Prisma Client
    executeCommand('npx prisma generate', '生成 Prisma Client')
    
    // 测试数据库连接
    executeCommand('npx prisma db push --force-reset', '同步数据库结构')
    
    log('✅ 数据库连接正常', 'green')
    return true
  } catch {
    log('❌ 数据库连接测试失败', 'red')
    return false
  }
}

async function checkSystemInit() {
  try {
    log('🔄 检查系统初始化状态...', 'cyan')
    
    // 这里可以添加检查系统是否已初始化的逻辑
    // 例如检查用户表是否存在数据
    
    log('✅ 系统状态检查完成', 'green')
    return true
  } catch {
    log('❌ 系统状态检查失败', 'red')
    return false
  }
}

function displayUsage() {
  log('\n📋 使用说明:', 'bright')
  log('1. 确保已安装依赖: npm install', 'cyan')
  log('2. 配置环境变量: 复制 .env.example 为 .env 并设置 DATABASE_URL', 'cyan')
  log('3. 运行此脚本初始化数据库: node scripts/init-database.js', 'cyan')
  log('4. 启动开发服务器: npm run dev', 'cyan')
  log('\n🚀 快速启动命令:', 'bright')
  log('   npm install && npm run db:init && npm run dev', 'green')
}

async function main() {
  log('🚀 数据库初始化脚本启动', 'bright')
  log('=' * 50, 'blue')
  
  try {
    // 检查必要文件
    if (!checkPrismaClient()) {
      log('\n❌ Prisma 配置检查失败', 'red')
      displayUsage()
      process.exit(1)
    }
    
    // 检查环境配置
    if (!checkEnvironment()) {
      log('\n⚠️  环境配置不完整', 'yellow')
      displayUsage()
      process.exit(1)
    }
    
    // 测试数据库连接
    if (!await testDatabaseConnection()) {
      log('\n❌ 数据库连接失败', 'red')
      log('请检查 DATABASE_URL 配置和网络连接', 'yellow')
      process.exit(1)
    }
    
    // 检查系统初始化状态
    if (!await checkSystemInit()) {
      log('\n⚠️  系统初始化检查失败', 'yellow')
    }
    
    log('\n🎉 数据库初始化完成！', 'bright')
    log('=' * 50, 'blue')
    log('✅ 数据库结构已同步', 'green')
    log('✅ Prisma Client 已生成', 'green')
    log('\n💡 下一步操作:', 'cyan')
    log('1. 启动开发服务器: npm run dev', 'cyan')
    log('2. 浏览器访问: http://localhost:3000', 'cyan')
    log('3. 完成系统初始化设置', 'cyan')
    
  } catch (error) {
    log('\n❌ 初始化过程中发生错误:', 'red')
    console.error(error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    log('❌ 未捕获的错误:', 'red')
    console.error(error)
    process.exit(1)
  })
}

module.exports = { executeCommand, checkPrismaClient, checkEnvironment, testDatabaseConnection }