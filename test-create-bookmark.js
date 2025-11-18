// 测试创建书签功能 - 验证认证修复是否有效
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCreateBookmark() {
  try {
    console.log('🔍 开始测试创建书签功能...\n')

    // 检查用户
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ 数据库中没有用户，无法测试')
      return
    }

    console.log('✅ 找到用户:', user.id, user.email)

    // 检查空间
    const space = await prisma.space.findFirst({
      where: { userId: user.id }
    })

    if (!space) {
      console.log('❌ 用户没有空间，无法测试')
      return
    }

    console.log('✅ 找到空间:', space.id, space.name)

    // 清理可能存在的测试书签
    await prisma.bookmark.deleteMany({
      where: {
        url: 'https://example.com/test',
        userId: user.id
      }
    })

    console.log('✅ 清理旧的测试数据完成')

    // 创建测试书签
    const bookmark = await prisma.bookmark.create({
      data: {
        title: '测试书签',
        url: 'https://example.com/test',
        description: '这是一个测试书签',
        userId: user.id,
        spaceId: space.id
      },
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('✅ 创建书签成功:')
    console.log('   ID:', bookmark.id)
    console.log('   标题:', bookmark.title)
    console.log('   URL:', bookmark.url)
    console.log('   所属空间:', bookmark.space.name)

    // 清理测试数据
    await prisma.bookmark.delete({
      where: { id: bookmark.id }
    })

    console.log('\n✅ 清理测试数据完成')
    console.log('\n🎉 数据库层面的创建书签测试通过！')
    console.log('现在可以测试API层面的创建书签功能')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    
    // 检查是否是外键约束错误（Prisma P2003）
    if (error.code === 'P2003') {
      console.log('\n💡 这可能是外键约束错误，表明userId或spaceId不存在')
      console.log('检查数据一致性...')
      
      // 列出所有用户和空间用于调试
      const users = await prisma.user.findMany()
      const spaces = await prisma.space.findMany({
        include: { user: true }
      })
      
      console.log('\n👥 用户列表:')
      users.forEach(u => console.log(`  ${u.id} - ${u.email}`))
      
      console.log('\n🏠 空间列表:')
      spaces.forEach(s => console.log(`  ${s.id} - ${s.name} (属于 ${s.user.id})`))
    }
  } finally {
    await prisma.$disconnect()
  }
}

testCreateBookmark()