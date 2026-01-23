const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 测试导出逻辑...\n')

    const userId = '7a574630-0702-48ca-bdc8-f3d3b26654d9' // 你的用户ID

    // 获取所有书签（模拟导出API）
    const bookmarksRaw = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        space: {
          select: { id: true, name: true }
        },
        folder: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 3
    })

    console.log('原始数据库数据:')
    for (const b of bookmarksRaw) {
      console.log(`  ${b.title}:`)
      console.log(`    description: "${b.description}"`)
      console.log(`    iconUrl: "${b.iconUrl}"`)
    }

    // 模拟导出映射
    const bookmarks = bookmarksRaw.map(b => ({
      id: b.id,
      title: b.title,
      url: b.url,
      description: b.description,
      iconUrl: b.iconUrl,
      spaceId: b.spaceId,
      spaceName: b.space?.name || '',
      folderId: b.folderId,
      folderName: b.folder?.name || null,
      userId: b.userId,
      createdAt: b.createdAt
    }))

    console.log('\n映射后的数据:')
    for (const b of bookmarks) {
      console.log(`  ${b.title}:`)
      console.log(`    description: "${b.description}"`)
      console.log(`    iconUrl: "${b.iconUrl}"`)
    }

    // 输出JSON
    console.log('\n导出的JSON:')
    console.log(JSON.stringify(bookmarks, null, 2))

  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
