const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 检查数据库中的书签数据...\n')

    const bookmarks = await prisma.bookmark.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        url: true,
        description: true,
        iconUrl: true,
        space: {
          select: { name: true }
        },
        folder: {
          select: { name: true }
        }
      }
    })

    console.log(`找到 ${bookmarks.length} 条书签记录:\n`)

    for (const b of bookmarks) {
      console.log('─'.repeat(60))
      console.log(`标题: ${b.title}`)
      console.log(`URL: ${b.url}`)
      console.log(`描述: "${b.description}"`)
      console.log(`图标: "${b.iconUrl}"`)
      console.log(`空间: ${b.space?.name}`)
      console.log(`文件夹: ${b.folder?.name}`)
    }

    console.log('\n' + '─'.repeat(60))
    console.log('\n✅ 数据库查询完成')

    // 检查所有书签的统计
    const stats = await prisma.bookmark.groupBy({
      by: ['description', 'iconUrl'],
      _count: true
    })

    console.log('\n📊 数据统计:')
    console.log(`- 有描述的书签: ${stats.filter(s => s.description !== null).length}`)
    console.log(`- 有图标的书签: ${stats.filter(s => s.iconUrl !== null).length}`)

  } catch (error) {
    console.error('❌ 查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
