const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 完整测试导出流程...\n')

    const userId = '7a574630-0702-48ca-bdc8-f3d3b26654d9'

    // 1. 检查用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })
    console.log('用户:', user)

    // 2. 统计所有书签
    const totalBookmarks = await prisma.bookmark.count({ where: { userId } })
    console.log(`\n书签总数: ${totalBookmarks}`)

    // 3. 统计有description的书签
    const withDescription = await prisma.bookmark.count({
      where: { userId, description: { not: null } }
    })
    console.log(`有description的书签: ${withDescription}`)

    // 4. 统计有iconUrl的书签
    const withIconUrl = await prisma.bookmark.count({
      where: { userId, iconUrl: { not: null } }
    })
    console.log(`有iconUrl的书签: ${withIconUrl}`)

    // 5. 检查是否有description为空字符串的情况
    const emptyDescription = await prisma.bookmark.count({
      where: { userId, description: '' }
    })
    console.log(`description为空字符串的书签: ${emptyDescription}`)

    // 6. 检查是否有iconUrl为空字符串的情况
    const emptyIconUrl = await prisma.bookmark.count({
      where: { userId, iconUrl: '' }
    })
    console.log(`iconUrl为空字符串的书签: ${emptyIconUrl}`)

    // 7. 抽样检查实际数据
    console.log('\n抽样检查前5条书签:')
    const samples = await prisma.bookmark.findMany({
      where: { userId },
      take: 5,
      select: {
        title: true,
        description: true,
        iconUrl: true,
        space: { select: { name: true } },
        folder: { select: { name: true } }
      }
    })

    samples.forEach((b, i) => {
      console.log(`\n[${i+1}] ${b.title}`)
      console.log(`    description: "${b.description}"`)
      console.log(`    iconUrl: "${b.iconUrl}"`)
      console.log(`    space: ${b.space?.name}`)
      console.log(`    folder: ${b.folder?.name}`)
    })

    // 8. 模拟导出数据
    console.log('\n\n模拟导出数据（前3条）:')
    const bookmarksRaw = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        space: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } }
      },
      take: 3
    })

    const bookmarks = bookmarksRaw.map(b => ({
      title: b.title,
      url: b.url,
      description: b.description,
      iconUrl: b.iconUrl,
      spaceName: b.space?.name || '',
      folderName: b.folder?.name || null
    }))

    console.log(JSON.stringify(bookmarks, null, 2))

  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
