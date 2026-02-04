/**
 * API认证诊断脚本
 * 用于诊断生产环境中API Key生成失败的问题
 */

const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 配置
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || 'e123bdfa-c287-4068-9ea2-d1ebef8a11ed'

async function runDiagnosis() {
  console.log('='.repeat(60))
  console.log('API认证诊断工具')
  console.log('='.repeat(60))

  // 1. 检查环境变量
  console.log('\n1. 环境变量检查:')
  console.log('   JWT_SECRET长度:', JWT_SECRET.length)
  console.log('   JWT_SECRET前10字符:', JWT_SECRET.substring(0, 10))
  console.log('   DEFAULT_USER_ID:', DEFAULT_USER_ID)

  // 2. 检查数据库连接
  console.log('\n2. 数据库连接检查:')
  try {
    const userCount = await prisma.user.count()
    console.log('   数据库连接: 成功')
    console.log('   用户数量:', userCount)
  } catch (error) {
    console.error('   数据库连接: 失败')
    console.error('   错误:', error.message)
    process.exit(1)
  }

  // 3. 获取默认用户
  console.log('\n3. 默认用户检查:')
  let defaultUser = null
  try {
    defaultUser = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID }
    })
    if (defaultUser) {
      console.log('   用户ID:', defaultUser.id)
      console.log('   用户名:', defaultUser.username)
      console.log('   邮箱:', defaultUser.email)
    } else {
      // 尝试查找第一个用户
      const firstUser = await prisma.user.findFirst()
      if (firstUser) {
        console.log('   未找到DEFAULT_USER_ID对应的用户')
        console.log('   使用第一个用户:', firstUser.id)
        defaultUser = firstUser
      } else {
        console.error('   数据库中没有任何用户!')
      }
    }
  } catch (error) {
    console.error('   查询用户失败:', error.message)
  }

  // 4. 测试Token生成和验证
  console.log('\n4. Token测试:')
  if (defaultUser) {
    try {
      const token = jwt.sign({ userId: defaultUser.id }, JWT_SECRET, { expiresIn: '7d' })
      console.log('   Token生成: 成功')
      console.log('   Token长度:', token.length)
      console.log('   Token前30字符:', token.substring(0, 30) + '...')

      const decoded = jwt.verify(token, JWT_SECRET)
      console.log('   Token验证: 成功')
      console.log('   解码后的userId:', decoded.userId)
    } catch (error) {
      console.error('   Token测试失败:', error.message)
    }
  }

  // 5. 检查SystemConfig
  console.log('\n5. SystemConfig检查:')
  if (defaultUser) {
    try {
      const systemConfig = await prisma.systemConfig.findUnique({
        where: { userId: defaultUser.id }
      })
      if (systemConfig) {
        console.log('   SystemConfig存在: 是')
        console.log('   ID:', systemConfig.id)
        console.log('   userId:', systemConfig.userId)
        console.log('   extensionApiKey:', systemConfig.extensionApiKey ? 
          systemConfig.extensionApiKey.substring(0, 15) + '...' : '无')
      } else {
        console.log('   SystemConfig存在: 否')
        console.log('   (这是正常的，如果从未生成过API Key)')
      }
    } catch (error) {
      console.error('   查询SystemConfig失败:', error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('诊断完成')
  console.log('='.repeat(60))
  console.log('\n建议检查项:')
  console.log('1. 确保JWT_SECRET与前端登录时使用的一致')
  console.log('2. 确保DEFAULT_USER_ID对应的用户存在于数据库')
  console.log('3. 查看服务器日志中的认证详细信息')
  console.log('4. 检查浏览器控制台中的网络请求')
}

runDiagnosis()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
