const axios = require('axios')

async function testExportAPI() {
  try {
    console.log('🔍 直接测试系统导出API...\n')

    // 使用第一个用户的ID
    const userId = '7a574630-0702-48ca-bdc8-f3d3b26654d9'

    // 1. 先调用诊断API（使用userId参数）
    console.log('1. 调用诊断API...')
    const debugUrl = `http://localhost:3000/api/test-export-debug?userId=${userId}`
    const debugResponse = await axios.get(debugUrl)
    console.log('诊断结果:', JSON.stringify(debugResponse.data, null, 2))

    // 2. 模拟前端调用导出API
    console.log('\n2. 模拟前端调用导出API...')
    
    // 注意：由于没有真实的token，我们无法直接测试导出API
    // 但我们可以直接查询数据库来验证数据
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      take: 5,
      select: {
        title: true,
        url: true,
        description: true,
        iconUrl: true,
        space: { select: { name: true } },
        folder: { select: { name: true } }
      }
    })

    console.log('\n3. 数据库中的书签数据（用于比较导出结果）:')
    console.log(JSON.stringify(bookmarks, null, 2))

    // 4. 模拟导出数据结构
    console.log('\n4. 模拟导出的bookmarks数组:')
    const exportedBookmarks = bookmarks.map(b => ({
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
    console.log(JSON.stringify(exportedBookmarks, null, 2))

    console.log('\n✅ 测试完成！如果数据库有数据但导出的JSON没有，说明问题在前端处理')

    await prisma.$disconnect()

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('响应:', error.response.data)
    }
  }
}

testExportAPI()
